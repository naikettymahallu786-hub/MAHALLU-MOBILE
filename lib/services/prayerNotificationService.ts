import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ReminderMode = 'voice' | 'silent' | 'off';

export interface PrayerRemindersState {
  Fajr: ReminderMode;
  Dhuhr: ReminderMode;
  Asr: ReminderMode;
  Maghrib: ReminderMode;
  Isha: ReminderMode;
}

export const DEFAULT_REMINDERS: PrayerRemindersState = {
  Fajr: 'voice',
  Dhuhr: 'voice',
  Asr: 'voice',
  Maghrib: 'voice',
  Isha: 'voice',
};

const PRAYER_NAMES_ML: Record<string, string> = {
  Fajr: 'ഫജ്ർ',
  Sunrise: 'സൂര്യോദയം',
  Dhuhr: 'ദുഹ്ർ',
  Asr: 'അസ്ർ',
  Maghrib: 'മഗ്‌രിബ്',
  Isha: 'ഇശാഅ്',
  Jumuah: 'ജുമുഅ',
};

/**
 * Configure Global Notification Handler & Android Channels
 */
export async function initializeNotificationChannels() {
  try {
    // 1. Set global notification behavior (foreground & background)
    try {
      if (Notifications?.setNotificationHandler) {
        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
            shouldShowBanner: true,
            shouldShowList: true,
          }),
        });
      }
    } catch (e) {
      // Ignored
    }

    // 2. Request permissions if not yet granted
    let finalStatus = 'undetermined';
    try {
      if (Notifications?.getPermissionsAsync) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        finalStatus = existingStatus;
        if (existingStatus !== 'granted' && Notifications.requestPermissionsAsync) {
          const { status } = await Notifications.requestPermissionsAsync({
            ios: {
              allowAlert: true,
              allowBadge: true,
              allowSound: true,
            },
          });
          finalStatus = status;
        }
      }
    } catch (e) {
      // Ignored in Expo Go
    }

    // 3. Android High-Priority Channels
    if (Platform.OS === 'android') {
      try {
        if (Notifications?.setNotificationChannelAsync) {
          // Adhan / Voice channel with MAX importance, ALARM audio attributes, and raw sound
          await Notifications.setNotificationChannelAsync('prayer-voice', {
            name: 'Adhan & Prayer Voice',
            importance: Notifications.AndroidImportance?.MAX || 5,
            vibrationPattern: [0, 500, 250, 500],
            lightColor: '#059669',
            lockscreenVisibility: Notifications.AndroidNotificationVisibility?.PUBLIC || 1,
            bypassDnd: true,
            sound: 'adhan.mp3',
            audioAttributes: {
              usage: Notifications.AndroidAudioUsage?.ALARM || 4,
              contentType: Notifications.AndroidAudioContentType?.SONIFICATION || 4,
            },
          });

          // Silent / gentle notification channel
          await Notifications.setNotificationChannelAsync('prayer-silent', {
            name: 'Silent Prayer Reminders',
            importance: Notifications.AndroidImportance?.DEFAULT || 3,
            vibrationPattern: [0, 250],
            lightColor: '#C9972E',
            sound: null,
          });

          // Notices & announcements channel
          await Notifications.setNotificationChannelAsync('mahallu-notices', {
            name: 'Mahallu Notices & Events',
            importance: Notifications.AndroidImportance?.HIGH || 4,
            sound: 'default',
          });
        }
      } catch (e) {
        // Ignored
      }
    }

    return finalStatus === 'granted';
  } catch (err) {
    return false;
  }
}

/**
 * Schedule Native Background Notifications for daily prayers
 * Uses DAILY recurring alarms and pre-scheduled calendar alarms
 * so that Android OS Alarm Manager fires the Adhan even when closed / killed.
 */
export async function schedulePrayerNotifications(
  timings: Record<string, string>,
  iqamahTimes?: Record<string, string>,
  remindersState?: PrayerRemindersState,
  language: 'en' | 'ml' = 'en'
) {
  try {
    if (!timings) return;

    await initializeNotificationChannels();

    const reminders = remindersState || DEFAULT_REMINDERS;
    const isMl = language === 'ml';

    // 1. Cancel previously scheduled prayer notifications to prevent duplicates
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const notif of scheduled) {
      if (notif.identifier.startsWith('prayer_')) {
        await Notifications.cancelScheduledNotificationAsync(notif.identifier);
      }
    }

    const now = new Date();

    const prayerOrder = [
      { name: 'Fajr', key: 'Fajr' },
      { name: 'Dhuhr', key: 'Dhuhr' },
      { name: 'Asr', key: 'Asr' },
      { name: 'Maghrib', key: 'Maghrib' },
      { name: 'Isha', key: 'Isha' },
    ];

    for (const p of prayerOrder) {
      const prayerKey = p.key as keyof PrayerRemindersState;
      const mode = reminders[prayerKey] || 'voice';

      if (mode === 'off') continue; // User disabled reminder

      const bangTimeStr = timings[p.key];
      if (!bangTimeStr) continue;

      const cleanTime = bangTimeStr.split(' ')[0];
      const [hourStr, minStr] = cleanTime.split(':');
      const hour = parseInt(hourStr, 10);
      const min = parseInt(minStr, 10);

      if (isNaN(hour) || isNaN(min)) continue;

      const prayerDisplayName = isMl ? (PRAYER_NAMES_ML[p.name] || p.name) : p.name;
      const iqamahTime = iqamahTimes?.[p.name];

      const title = isMl
        ? `🕌 ${prayerDisplayName} ബാങ്ക് സമയം`
        : `🕌 ${p.name} Adhan Time`;

      const body = isMl
        ? `${prayerDisplayName} നമസ്കാര സമയം ആയിരിക്കുന്നു.${iqamahTime ? ` ജമാഅത്ത്: ${iqamahTime}` : ''}`
        : `It is time for ${p.name} prayer.${iqamahTime ? ` Iqamah at ${iqamahTime}` : ''}`;

      // 1. Schedule DAILY recurring native alarm
      await Notifications.scheduleNotificationAsync({
        identifier: `prayer_${p.name}_daily`,
        content: {
          title,
          body,
          sound: mode === 'voice' ? 'adhan.mp3' : undefined,
          priority: Notifications.AndroidNotificationPriority.MAX,
          data: {
            type: 'prayer-adhan',
            prayerName: p.name,
            mode,
          },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: hour,
          minute: min,
          channelId: mode === 'voice' ? 'prayer-voice' : 'prayer-silent',
        },
      });

      // 2. Schedule specific DATE timestamp trigger for today & tomorrow
      for (let dayOffset = 0; dayOffset <= 1; dayOffset++) {
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + dayOffset);
        targetDate.setHours(hour, min, 0, 0);

        if (targetDate.getTime() > now.getTime()) {
          await Notifications.scheduleNotificationAsync({
            identifier: `prayer_${p.name}_date_${dayOffset}`,
            content: {
              title,
              body,
              sound: mode === 'voice' ? 'adhan.mp3' : undefined,
              priority: Notifications.AndroidNotificationPriority.MAX,
              data: {
                type: 'prayer-adhan',
                prayerName: p.name,
                mode,
                channelId: mode === 'voice' ? 'prayer-voice' : 'prayer-silent',
              },
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.DATE,
              date: targetDate,
              channelId: mode === 'voice' ? 'prayer-voice' : 'prayer-silent',
            } as any,
          });
        }
      }
    }
  } catch (err) {
    console.warn('[Prayer Notification Scheduling] Error:', err);
  }
}

/**
 * Schedule a test notification in 10 seconds so the user can test
 * closing the app and locking the screen.
 */
export async function scheduleTestPrayerNotification(language: 'en' | 'ml' = 'en') {
  await initializeNotificationChannels();
  const isMl = language === 'ml';

  await Notifications.scheduleNotificationAsync({
    content: {
      title: isMl ? '🕌 ടെസ്റ്റ് ബാങ്ക് (Test Adhan)' : '🕌 Test Adhan Alarm',
      body: isMl
        ? 'ബാങ്ക് ശബ്ദവും അറിയിപ്പും ഫോൺ ലോക്ക് ചെയ്താലും കൃത്യമായി പ്രവർത്തിക്കുന്നു!'
        : 'Background Adhan notification is working on closed/locked phone!',
      sound: 'adhan.mp3',
      priority: Notifications.AndroidNotificationPriority.MAX,
      data: {
        type: 'prayer-adhan',
        mode: 'voice',
        channelId: 'prayer-voice',
      },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 10,
      channelId: 'prayer-voice',
    },
  });
}

