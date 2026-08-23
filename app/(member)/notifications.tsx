import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useNotifications } from '../../lib/hooks/useNotifications';
import { useLanguageStore } from '../../lib/store/languageStore';
import { t } from '../../lib/i18n';
import { LoadingScreen } from '../../components/ui/LoadingScreen';
import { EmptyState } from '../../components/ui/EmptyState';
import { NotificationItem } from '../../components/NotificationItem';
import dayjs from 'dayjs';

const TEAL_DARK = '#0B4A42';
const TEAL = '#0F6B5C';
const CREAM = '#FBF8F2';
const GOLD = '#C9972E';

export default function NotificationsScreen() {
  const router = useRouter();
  const { language } = useLanguageStore();
  const { data: notifications, isLoading, refetch } = useNotifications();
  const [selectedNotif, setSelectedNotif] = useState<any | null>(null);
  const [readNotifIds, setReadNotifIds] = useState<Record<string, boolean>>({});

  if (isLoading) return <LoadingScreen message={language === 'en' ? 'Loading notifications...' : 'അറിയിപ്പുകൾ ലോഡ് ചെയ്യുന്നു...'} />;

  // Determine type from title/body or channel heuristics
  const getType = (notif: any) => {
    const text = `${notif.title || ''} ${notif.body || ''}`.toLowerCase();
    if (text.includes('payment') || text.includes('due') || text.includes('donation') || text.includes('sadaqah') || text.includes('രൂപ') || text.includes('₹')) return 'payment';
    if (text.includes('event') || text.includes('invite') || text.includes('പരിപാടി') || text.includes('സംഗമം')) return 'event';
    if (text.includes('urgent') || text.includes('warning') || text.includes('ശ്രദ്ധിക്കുക')) return 'alert';
    return 'general';
  };

  const handleNotificationPress = (notif: any) => {
    setSelectedNotif(notif);
    setReadNotifIds((prev) => ({ ...prev, [notif._id]: true }));
  };

  const handleActionFromNotification = (notif: any) => {
    setSelectedNotif(null);
    const type = getType(notif);
    const text = `${notif.title || ''} ${notif.body || ''}`.toLowerCase();

    if (type === 'event' || text.includes('event')) {
      router.push('/(member)/events' as any);
    } else if (type === 'payment' || text.includes('sadaqah') || text.includes('donation') || text.includes('due')) {
      router.push('/(member)/sadaqah' as any);
    } else if (text.includes('madrasa') || text.includes('class') || text.includes('usthadh') || text.includes('attendance')) {
      router.push('/(member)/services' as any);
    } else {
      router.push('/(member)/home' as any);
    }
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: CREAM }} edges={['top']}>
      {/* Header */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: 14,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottomWidth: 1,
          borderColor: '#e2e8f0',
          backgroundColor: 'white',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: '#f1f5f9',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
            }}
          >
            <Ionicons name="arrow-back" size={20} color={TEAL_DARK} />
          </TouchableOpacity>
          <View>
            <Text style={{ fontSize: 18, fontWeight: '900', color: TEAL_DARK }}>{t('notifications', language)}</Text>
            <Text style={{ fontSize: 11, color: '#64748b', marginTop: 1 }}>{t('notificationsDesc', language)}</Text>
          </View>
        </View>

        {notifications && notifications.length > 0 && (
          <TouchableOpacity
            onPress={() => {
              const allRead: Record<string, boolean> = {};
              notifications.forEach((n: any) => {
                allRead[n._id] = true;
              });
              setReadNotifIds(allRead);
            }}
            style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, backgroundColor: '#f1f5f9' }}
          >
            <Text style={{ fontSize: 11, fontWeight: '800', color: TEAL }}>{t('markAllRead', language)}</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={TEAL} />}
      >
        {!notifications || notifications.length === 0 ? (
          <EmptyState
            icon="notifications-off-outline"
            title={t('allCaughtUp', language)}
            message={t('noNotifications', language)}
          />
        ) : (
          <View className="pb-8">
            {notifications.map((notif: any) => {
              const isMarkedRead = readNotifIds[notif._id] || notif.status === 'delivered';
              return (
                <NotificationItem
                  key={notif._id}
                  title={notif.title}
                  body={notif.body}
                  date={notif.createdAt}
                  isRead={isMarkedRead}
                  type={getType(notif)}
                  onPress={() => handleNotificationPress(notif)}
                />
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* ========================================================================= */}
      {/* NOTIFICATION DETAILS MODAL */}
      {/* ========================================================================= */}
      <Modal visible={!!selectedNotif} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View
            style={{
              backgroundColor: 'white',
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              padding: 22,
              maxHeight: '85%',
            }}
          >
            {/* Header with Type Badge & Close Button */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <View
                style={{
                  backgroundColor: '#ecfdf5',
                  paddingHorizontal: 12,
                  paddingVertical: 5,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: '#a7f3d0',
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <Ionicons name="notifications" size={14} color={TEAL} style={{ marginRight: 6 }} />
                <Text style={{ color: TEAL_DARK, fontWeight: '800', fontSize: 12, textTransform: 'capitalize' }}>
                  {selectedNotif ? getType(selectedNotif) : 'Notification'}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => setSelectedNotif(null)}
                style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' }}
              >
                <Ionicons name="close" size={18} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ gap: 14, paddingBottom: 10 }}>
              {/* Title */}
              <Text style={{ fontSize: 18, fontWeight: '900', color: '#0f172a', lineHeight: 24 }}>
                {selectedNotif?.title}
              </Text>

              {/* Date */}
              {selectedNotif?.createdAt && (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="time-outline" size={14} color="#64748b" style={{ marginRight: 6 }} />
                  <Text style={{ fontSize: 12, color: '#64748b', fontWeight: '600' }}>
                    {dayjs(selectedNotif.createdAt).format('DD MMMM YYYY, hh:mm A')}
                  </Text>
                </View>
              )}

              {/* Message Body */}
              <View
                style={{
                  backgroundColor: '#f8fafc',
                  borderRadius: 16,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: '#e2e8f0',
                  marginTop: 4,
                }}
              >
                <Text style={{ fontSize: 15, color: '#334155', lineHeight: 22, fontWeight: '500' }}>
                  {selectedNotif?.body}
                </Text>
              </View>

              {/* Action Button */}
              <TouchableOpacity
                onPress={() => handleActionFromNotification(selectedNotif)}
                style={{
                  backgroundColor: TEAL,
                  paddingVertical: 14,
                  borderRadius: 14,
                  alignItems: 'center',
                  marginTop: 8,
                  flexDirection: 'row',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: 'white', fontWeight: '900', fontSize: 14, marginRight: 6 }}>
                  {t('viewRelatedPage', language)}
                </Text>
                <Ionicons name="arrow-forward" size={16} color="white" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setSelectedNotif(null)}
                style={{
                  backgroundColor: '#f1f5f9',
                  paddingVertical: 12,
                  borderRadius: 14,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#64748b', fontWeight: '800', fontSize: 13 }}>{t('dismiss', language)}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
