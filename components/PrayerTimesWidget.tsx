import React, { useEffect, useState, useRef } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Audio } from 'expo-av';
import { Asset } from 'expo-asset';
import { useLanguageStore } from '../lib/store/languageStore';
import {
  schedulePrayerNotifications,
  scheduleTestPrayerNotification,
  DEFAULT_REMINDERS,
  PrayerRemindersState,
  ReminderMode,
  initializeNotificationChannels,
} from '../lib/services/prayerNotificationService';

const ADHAN_AUDIO_URLS = [
  'https://mahallu-backend-cv55.onrender.com/adhan.mp3',
  'https://raw.githubusercontent.com/abodehq/Athan-MP3/master/Athan.mp3',
];

interface PrayerData {
  hijriDate?: {
    day: string;
    month: string;
    year: string;
    formatted: string;
  };
  timings?: {
    Fajr?: string;
    Sunrise?: string;
    Dhuhr?: string;
    Asr?: string;
    Maghrib?: string;
    Isha?: string;
    [key: string]: string | undefined;
  };
  iqamahTimes?: {
    Fajr?: string;
    Dhuhr?: string;
    Asr?: string;
    Maghrib?: string;
    Isha?: string;
    Jumuah?: string;
  };
}

interface PrayerTimesProps {
  data?: PrayerData;
  isLoading?: boolean;
}

const format12H = (time24?: string) => {
  if (!time24) return '--:--';
  const cleanTime = time24.split(' ')[0];
  const [hStr, mStr] = cleanTime.split(':');
  if (!hStr || !mStr) return '--:--';

  let h = parseInt(hStr, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h.toString().padStart(2, '0')}:${mStr} ${ampm}`;
};

export function PrayerTimesWidget({ data, isLoading = false }: PrayerTimesProps) {
  const { language } = useLanguageStore();
  const [nextPrayer, setNextPrayer] = useState<{
    name: string;
    time: string;
    inMinutes: number;
    type: 'Bang' | 'Namaz';
  } | null>(null);

  const [reminders, setReminders] = useState<PrayerRemindersState>(DEFAULT_REMINDERS);
  const [isPlayingAdhan, setIsPlayingAdhan] = useState(false);
  const audioRef = useRef<any>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  // Initialize notification channels on mount
  useEffect(() => {
    initializeNotificationChannels();
  }, []);

  // Load Saved Reminder Preferences
  useEffect(() => {
    AsyncStorage.getItem('@prayer_reminders_v3').then((saved) => {
      if (saved) {
        try {
          setReminders(JSON.parse(saved));
        } catch (e) {
          /* ignore */
        }
      }
    });

    // Listen for incoming notifications when app is active/foreground
    let sub: any = null;
    let responseSub: any = null;

    try {
      if (Notifications?.addNotificationReceivedListener) {
        sub = Notifications.addNotificationReceivedListener((notification) => {
          const notifData = notification?.request?.content?.data;
          if (notifData?.type === 'prayer-adhan' && notifData?.mode === 'voice') {
            playAdhanAudio();
          }
        });
      }

      if (Notifications?.addNotificationResponseReceivedListener) {
        responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
          const notifData = response?.notification?.request?.content?.data;
          if (notifData?.type === 'prayer-adhan') {
            playAdhanAudio();
          }
        });
      }
    } catch (e) {
      // Graceful fallback in Expo Go
    }

    return () => {
      try {
        if (sub && typeof sub.remove === 'function') sub.remove();
        if (responseSub && typeof responseSub.remove === 'function') responseSub.remove();
      } catch (e) {}
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
      }
    };
  }, []);

  // Schedule native background notifications whenever prayer data or reminders change
  useEffect(() => {
    if (data?.timings) {
      schedulePrayerNotifications(data.timings, data.iqamahTimes, reminders, language).catch(() => {});
    }
  }, [data, reminders, language]);

  // Save Reminder Preferences & Re-schedule native alarms
  const toggleReminder = async (prayerKey: keyof PrayerRemindersState) => {
    const current = reminders[prayerKey];
    let nextMode: ReminderMode = 'voice';
    if (current === 'voice') nextMode = 'silent';
    else if (current === 'silent') nextMode = 'off';
    else nextMode = 'voice';

    const updated = { ...reminders, [prayerKey]: nextMode };
    setReminders(updated);
    await AsyncStorage.setItem('@prayer_reminders_v3', JSON.stringify(updated));

    if (data?.timings) {
      await schedulePrayerNotifications(data.timings, data.iqamahTimes, updated, language);
    }
  };

  // Audio Player for Bang Voice (Adhan)
  const playAdhanAudio = async () => {
    try {
      if (isPlayingAdhan) {
        if (soundRef.current) {
          try {
            await soundRef.current.stopAsync();
            await soundRef.current.unloadAsync();
          } catch (_) {}
          soundRef.current = null;
        }
        if (audioRef.current && Platform.OS === 'web') {
          audioRef.current.pause();
          audioRef.current = null;
        }
        setIsPlayingAdhan(false);
        return;
      }

      setIsPlayingAdhan(true);

      if (Platform.OS === 'web') {
        const audio = new window.Audio(ADHAN_AUDIO_URLS[0]);
        audioRef.current = audio;
        audio.play().catch((e) => {
          console.error('Web audio error:', e);
          setIsPlayingAdhan(false);
          Alert.alert('Audio Error', 'Could not play Adhan audio.');
        });
        audio.onended = () => setIsPlayingAdhan(false);
      } else {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: true,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });

        if (soundRef.current) {
          try {
            await soundRef.current.stopAsync();
            await soundRef.current.unloadAsync();
          } catch (_) {}
          soundRef.current = null;
        }

        let soundObject: Audio.Sound | null = null;

        // Strategy 1: Asset.fromModule with localUri / uri for azan3.mp3
        try {
          const adhanAsset = Asset.fromModule(require('../assets/audio/azan3.mp3'));
          if (!adhanAsset.localUri && !adhanAsset.uri) {
            await adhanAsset.downloadAsync();
          }
          const targetUri = adhanAsset.localUri || adhanAsset.uri;
          if (targetUri) {
            const result = await Audio.Sound.createAsync(
              { uri: targetUri },
              { shouldPlay: true, volume: 1.0 }
            );
            soundObject = result.sound;
          }
        } catch (assetErr) {
          console.warn('[Adhan] Asset load failed, attempting fallback URL streams...', assetErr);
        }

        // Strategy 2: Fallback to Backend URL / Reliable Streams
        if (!soundObject) {
          for (const streamUrl of ADHAN_AUDIO_URLS) {
            try {
              const result = await Audio.Sound.createAsync(
                { uri: streamUrl },
                { shouldPlay: true, volume: 1.0 }
              );
              soundObject = result.sound;
              break;
            } catch (streamErr) {
              console.warn(`[Adhan] Stream ${streamUrl} failed:`, streamErr);
            }
          }
        }

        if (soundObject) {
          soundRef.current = soundObject;
          soundObject.setOnPlaybackStatusUpdate((status) => {
            if (status.isLoaded && status.didJustFinish) {
              setIsPlayingAdhan(false);
              soundObject?.unloadAsync().catch(() => {});
              soundRef.current = null;
            }
          });
        } else {
          throw new Error('All audio sources (local asset and remote streams) were unavailable.');
        }
      }
    } catch (err: any) {
      console.error('Error playing Adhan audio:', err);
      setIsPlayingAdhan(false);
      const errMsg = err?.message || String(err);
      Alert.alert(
        'Adhan Voice Error',
        `Could not play Adhan audio: ${errMsg}\n\nPlease check your volume settings.`
      );
    }
  };

  // Calculate Next Prayer and Check Current Minute Reminders
  useEffect(() => {
    if (!data?.timings) return;

    const calculateNext = () => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMin = now.getMinutes();
      const currentTime = currentHour * 60 + currentMin;
      const isFriday = now.getDay() === 5;

      const prayerOrder = [
        { name: 'Fajr', key: 'Fajr' },
        { name: isFriday ? 'Jumuah' : 'Dhuhr', key: 'Dhuhr' },
        { name: 'Asr', key: 'Asr' },
        { name: 'Maghrib', key: 'Maghrib' },
        { name: 'Isha', key: 'Isha' },
      ];

      let next = null;

      for (const p of prayerOrder) {
        const bangTimeStr = data.timings[p.key === 'Jumuah' ? 'Dhuhr' : (p.key as keyof typeof data.timings)];
        const namazTimeStr = data.iqamahTimes?.[p.name as keyof typeof data.iqamahTimes];

        if (bangTimeStr) {
          const [bh, bm] = bangTimeStr.split(' ')[0].split(':').map(Number);
          const bangMins = bh * 60 + bm;

          // Check if Bang Time matches exact current minute for reminder
          if (bangMins === currentTime) {
            const prayerKey = p.key as keyof PrayerRemindersState;
            const mode = reminders[prayerKey];
            if (mode === 'voice') {
              playAdhanAudio();
            }
          }

          if (bangMins > currentTime) {
            next = { name: p.name, time: bangTimeStr, inMinutes: bangMins - currentTime, type: 'Bang' as const };
            break;
          }
        }

        if (namazTimeStr) {
          const [nh, nm] = namazTimeStr.split(':').map(Number);
          const namazMins = nh * 60 + nm;

          if (namazMins > currentTime) {
            next = { name: p.name, time: namazTimeStr, inMinutes: namazMins - currentTime, type: 'Namaz' as const };
            break;
          }
        }
      }

      if (!next && data.timings.Fajr) {
        const [h, m] = data.timings.Fajr.split(' ')[0].split(':').map(Number);
        const prayerTimeInMins = h * 60 + m;
        next = {
          name: 'Fajr',
          time: data.timings.Fajr,
          inMinutes: 24 * 60 - currentTime + prayerTimeInMins,
          type: 'Bang' as const,
        };
      }

      setNextPrayer(next);
    };

    calculateNext();
    const interval = setInterval(calculateNext, 60000);
    return () => clearInterval(interval);
  }, [data, reminders]);

  if (isLoading) {
    return (
      <View
        style={{
          backgroundColor: '#ffffff',
          borderColor: '#e2e8f0',
          borderWidth: 1.5,
          borderRadius: 24,
          padding: 20,
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 160,
        }}
      >
        <ActivityIndicator color="#10b981" />
      </View>
    );
  }

  if (!data?.timings) return null;

  const isFriday = new Date().getDay() === 5;
  const prayers = ['Fajr', isFriday ? 'Jumuah' : 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
  const isMl = language === 'ml';

  const prayerNamesMl: Record<string, string> = {
    Fajr: 'ഫജ്ർ',
    Sunrise: 'സൂര്യോദയം',
    Dhuhr: 'ദുഹ്ർ',
    Asr: 'അസ്ർ',
    Maghrib: 'മഗ്‌രിബ്',
    Isha: 'ഇശാഅ്',
    Jumuah: 'ജുമുഅ',
  };

  return (
    <View
      style={{
        backgroundColor: '#ffffff',
        borderColor: '#e2e8f0',
        borderWidth: 1.5,
        borderRadius: 24,
        padding: 20,
        shadowColor: '#94a3b8',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 2,
      }}
    >
      {/* Header */}
      <View className="flex-row justify-between items-center mb-5">
        <View className="flex-row items-center">
          <View className="w-10 h-10 rounded-full bg-emerald-50 items-center justify-center mr-3 border border-emerald-100">
            <Ionicons name="moon" size={18} color="#10b981" />
          </View>
          <View>
            <Text className="text-slate-900 font-extrabold text-base">
              {isMl ? 'നമസ്കാര & ബാങ്ക് സമയം' : 'Namaz & Bang Times'}
            </Text>
            <Text className="text-slate-500 text-[11px] mt-0.5">{dayjs().format('dddd, DD MMMM YYYY')}</Text>
          </View>
        </View>

        <View className="flex-row items-center gap-1.5">
          {/* Test 10s Background Alarm Button */}
          <TouchableOpacity
            onPress={async () => {
              await scheduleTestPrayerNotification(language);
              Alert.alert(
                isMl ? 'ടെസ്റ്റ് അലാറം ഷെഡ്യൂൾ ചെയ്തു' : 'Test Alarm Scheduled',
                isMl
                  ? '10 സെക്കൻഡിൽ ബാങ്ക് ശബ്ദത്തോടെ നോട്ടിഫിക്കേഷൻ വരും. ഇപ്പോൾ ആപ്പ് പൂർണ്ണമായി ക്ലോസ് ചെയ്ത് ഫോൺ ലോക്ക് ചെയ്ത് പരിശോധിക്കാം!'
                  : 'Adhan notification with sound will arrive in 10 seconds. You can now close/swipe away the app and lock your phone to test!'
              );
            }}
            className="flex-row items-center px-2.5 py-1.5 rounded-full border bg-amber-50 border-amber-200"
          >
            <Ionicons name="alarm-outline" size={13} color="#d97706" />
            <Text className="text-[10px] font-bold ml-1 text-amber-800">
              {isMl ? '10s ടെസ്റ്റ്' : 'Test 10s'}
            </Text>
          </TouchableOpacity>

          {/* Test Adhan Live Audio Button */}
          <TouchableOpacity
            onPress={playAdhanAudio}
            className={`flex-row items-center px-2.5 py-1.5 rounded-full border ${
              isPlayingAdhan ? 'bg-emerald-600 border-emerald-600' : 'bg-emerald-50 border-emerald-200'
            }`}
          >
            <Ionicons
              name={isPlayingAdhan ? 'stop-circle' : 'volume-high'}
              size={13}
              color={isPlayingAdhan ? '#ffffff' : '#059669'}
            />
            <Text className={`text-[10px] font-bold ml-1 ${isPlayingAdhan ? 'text-white' : 'text-emerald-700'}`}>
              {isPlayingAdhan
                ? (isMl ? 'നിർത്തുക' : 'Stop')
                : (isMl ? 'ബാങ്ക്' : 'Audio')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Next Prayer Banner */}
      {nextPrayer && (
        <View className="bg-gradient-to-r from-emerald-600 to-teal-700 p-3.5 rounded-2xl flex-row items-center justify-between mb-4 shadow-sm">
          <View className="flex-row items-center">
            <Ionicons name="notifications-circle" size={22} color="#34d399" />
            <View className="ml-2.5">
              <Text className="text-emerald-100 text-[10px] uppercase font-bold tracking-wider">
                {isMl
                  ? (nextPrayer.type === 'Bang' ? 'അടുത്ത ബാങ്ക്' : 'അടുത്ത ജമാഅത്ത്')
                  : `Upcoming ${nextPrayer.type}`}
              </Text>
              <Text className="text-white font-extrabold text-sm">
                {isMl ? (prayerNamesMl[nextPrayer.name] || nextPrayer.name) : nextPrayer.name}
              </Text>
            </View>
          </View>

          <View className="bg-white/20 px-3 py-1.5 rounded-xl">
            <Text className="text-white font-extrabold text-xs">
              {isMl
                ? `${Math.floor(nextPrayer.inMinutes / 60) > 0 ? `${Math.floor(nextPrayer.inMinutes / 60)}മ ` : ''}${nextPrayer.inMinutes % 60} മിനുട്ടിൽ`
                : `in ${Math.floor(nextPrayer.inMinutes / 60)}h ${nextPrayer.inMinutes % 60}m`}
            </Text>
          </View>
        </View>
      )}

      {/* Grid Header */}
      <View className="flex-row mb-3 px-1">
        <View className="flex-[1.5]">
          <Text className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">
            {isMl ? 'നമസ്കാരം' : 'Prayer'}
          </Text>
        </View>
        <View className="flex-1 items-center">
          <Text className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">
            {isMl ? 'ബാങ്ക്' : 'Bang'}
          </Text>
        </View>
        <View className="flex-1 items-center">
          <Text className="text-emerald-600 text-[10px] uppercase font-bold tracking-wider">
            {isMl ? 'ജമാഅത്ത്' : 'Namaz'}
          </Text>
        </View>
        <View className="flex-1 items-end">
          <Text className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">
            {isMl ? 'അറിയിപ്പ്' : 'Reminder'}
          </Text>
        </View>
      </View>

      {/* Times Rows */}
      <View className="space-y-2">
        {prayers.map((prayerName) => {
          const apiKey = prayerName === 'Jumuah' ? 'Dhuhr' : prayerName;
          const bangTime24 = data.timings?.[apiKey as keyof typeof data.timings];
          const namazTime24 = data.iqamahTimes?.[prayerName as keyof typeof data.iqamahTimes];
          const isNext = nextPrayer?.name === prayerName;

          const reminderKey = (prayerName === 'Jumuah' ? 'Dhuhr' : prayerName) as keyof PrayerRemindersState;
          const mode = reminders[reminderKey] || 'voice';

          const displayedName = isMl ? (prayerNamesMl[prayerName] || prayerName) : prayerName;

          return (
            <View
              key={prayerName}
              className={`flex-row items-center py-2.5 px-3 rounded-2xl ${
                isNext ? 'bg-emerald-50 border border-emerald-200' : 'bg-slate-50/70'
              }`}
            >
              {/* Prayer Name */}
              <View className="flex-[1.5] flex-row items-center">
                <View className={`w-2 h-2 rounded-full mr-2 ${isNext ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                <Text className={`font-extrabold text-xs ${isNext ? 'text-emerald-900' : 'text-slate-700'}`}>
                  {displayedName}
                </Text>
              </View>

              {/* Bang Time (Adhan) */}
              <View className="flex-1 items-center">
                <Text
                  className={`font-bold text-xs ${
                    isNext && nextPrayer?.type === 'Bang' ? 'text-emerald-700 font-extrabold' : 'text-slate-600'
                  }`}
                >
                  {format12H(bangTime24)}
                </Text>
              </View>

              {/* Namaz Time (Iqamah) */}
              <View className="flex-1 items-center">
                <Text
                  className={`font-bold text-xs ${
                    isNext && nextPrayer?.type === 'Namaz' ? 'text-emerald-700 font-extrabold' : 'text-slate-800'
                  }`}
                >
                  {format12H(namazTime24)}
                </Text>
              </View>

              {/* Reminder Toggle Button (Voice / Silent / Off) */}
              <View className="flex-1 items-end">
                <TouchableOpacity
                  onPress={() => toggleReminder(reminderKey)}
                  className={`flex-row items-center px-2 py-1 rounded-xl border ${
                    mode === 'voice'
                      ? 'bg-emerald-100 border-emerald-300'
                      : mode === 'silent'
                      ? 'bg-amber-100 border-amber-300'
                      : 'bg-slate-200 border-slate-300'
                  }`}
                >
                  <Ionicons
                    name={
                      mode === 'voice'
                        ? 'volume-high-outline'
                        : mode === 'silent'
                        ? 'notifications-outline'
                        : 'volume-mute-outline'
                    }
                    size={13}
                    color={mode === 'voice' ? '#047857' : mode === 'silent' ? '#b45309' : '#64748b'}
                  />
                  <Text
                    className={`text-[9px] font-extrabold ml-1 ${
                      mode === 'voice' ? 'text-emerald-800' : mode === 'silent' ? 'text-amber-800' : 'text-slate-600'
                    }`}
                  >
                    {mode === 'voice' ? 'Voice' : mode === 'silent' ? 'Silent' : 'Off'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </View>

      {/* Sunrise & Sunset Strip */}
      <View className="flex-row items-center justify-between mt-4 pt-3 border-t border-slate-100 px-1">
        {/* Sunrise */}
        <View className="flex-row items-center bg-amber-50/80 px-3 py-2 rounded-2xl border border-amber-100 flex-1 mr-2">
          <View className="w-7 h-7 rounded-xl bg-amber-100 items-center justify-center mr-2">
            <Ionicons name="sunny-outline" size={16} color="#d97706" />
          </View>
          <View>
            <Text className="text-amber-800 text-[10px] uppercase font-extrabold tracking-wider">Sunrise (ഉദയം)</Text>
            <Text className="text-amber-950 font-bold text-xs mt-0.5">{format12H(data.timings?.Sunrise)}</Text>
          </View>
        </View>

        {/* Sunset */}
        <View className="flex-row items-center bg-rose-50/80 px-3 py-2 rounded-2xl border border-rose-100 flex-1 ml-2">
          <View className="w-7 h-7 rounded-xl bg-rose-100 items-center justify-center mr-2">
            <Ionicons name="partly-sunny-outline" size={16} color="#e11d48" />
          </View>
          <View>
            <Text className="text-rose-800 text-[10px] uppercase font-extrabold tracking-wider">Sunset (അസ്തമയം)</Text>
            <Text className="text-rose-950 font-bold text-xs mt-0.5">
              {format12H(data.timings?.Sunset || data.timings?.Maghrib)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
