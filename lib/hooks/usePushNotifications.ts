import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { useAuthStore } from '../../store/auth.store';
import { io } from 'socket.io-client';
import { apiClient, baseOrigin } from '../api';
import { initializeNotificationChannels } from '../services/prayerNotificationService';

export function usePushNotifications() {
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    // 1. Initialize native notification channels and permissions
    initializeNotificationChannels();

    if (!isAuthenticated || !user) return;

    // 2. Register Expo Push Token with Backend (for notifications when app is closed)
    Notifications.getExpoPushTokenAsync()
      .then((pushTokenData) => {
        if (pushTokenData?.data) {
          apiClient.patch('/auth/fcm-token', { fcmToken: pushTokenData.data }).catch(() => {});
        }
      })
      .catch((err) => {
        console.warn('[Push] Error getting push token:', err);
      });

    // 3. Connect to real-time Socket.io server
    const socket = io(baseOrigin, {
      transports: ['websocket'],
      autoConnect: true,
    });

    socket.on('connect', () => {
      socket.emit('join-tenant', user.tenantId);
    });

    socket.on('new-notice', async (data: any) => {
      if (Notifications && Notifications.scheduleNotificationAsync) {
        try {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: data.title || 'New Announcement',
              body: data.body || 'You have a new notice.',
              sound: true,
              priority: Notifications.AndroidNotificationPriority?.HIGH || 'high',
            },
            trigger: null,
          });
        } catch (e) {
          // Ignore
        }
      }
    });

    socket.on('new-event', async (data: any) => {
      if (Notifications && Notifications.scheduleNotificationAsync) {
        try {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: data.title || 'New Event Created',
              body: data.body || 'A new event has been scheduled.',
              sound: true,
              priority: Notifications.AndroidNotificationPriority?.HIGH || 'high',
            },
            trigger: null,
          });
        } catch (e) {
          // Ignore
        }
      }
    });

    // 4. Handle user tapping on system notification
    const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      try {
        const data = response?.notification?.request?.content?.data;
        if (data?.url) {
          // If custom URL specified
        }
      } catch (err) {
        console.warn('[Push] Error handling notification tap:', err);
      }
    });

    return () => {
      socket.disconnect();
      responseSubscription.remove();
    };
  }, [user, isAuthenticated]);
}
