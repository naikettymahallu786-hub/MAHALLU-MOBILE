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
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    // 2. Request permissions if not yet granted
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      });
      finalStatus = status;
    }

    // 3. Android High-Priority Channels
    if (Platform.OS === 'android') {
      // Adhan / Voice channel with MAX importance, ALARM audio attributes, and raw sound
      await Notifications.setNotificationChannelAsync('prayer-voice', {
        name: 'Adhan & Prayer Voice',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 500, 250, 500],
        lightColor: '#059669',
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        bypassDnd: true,
        sound: 'adhan.mp3',
        audioAttributes: {
          usage: Notifications.AndroidAudioUsage.ALARM,
          contentType: Notifications.AndroidAudioContentType.SONIFICATION,
        },
      });

      // Silent / gentle notification channel
      await Notifications.setNotificationChannelAsync('prayer-silent', {
        name: 'Silent Prayer Reminders',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250],
        lightColor: '#C9972E',
        sound: null,
      });

      // Notices & announcements channel
      await Notifications.setNotificationChannelAsync('mahallu-notices', {
        name: 'Mahallu Notices & Events',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
      });
    }

    return finalStatus === 'granted';
  } catch (err) {
    console.warn('[Notifications] Channel initialization warning:', err);
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
