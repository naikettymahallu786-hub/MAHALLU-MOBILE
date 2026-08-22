import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Share,
  StyleSheet,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { apiClient } from '../../../lib/api';
import { useProfile } from '../../../lib/hooks/useProfile';
import { useLanguageStore } from '../../../lib/store/languageStore';
import { LoadingScreen } from '../../../components/ui/LoadingScreen';
import { ErrorScreen } from '../../../components/ui/ErrorScreen';

const TEAL_DARK = '#0B4A42';
const TEAL = '#0F6B5C';
const CREAM = '#FBF8F2';
const GOLD = '#C9972E';

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: profile } = useProfile();
  const { language } = useLanguageStore();

  const [registering, setRegistering] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['mobile', 'events', 'detail', id],
    queryFn: async () => {
      try {
        const res = await apiClient.get(`/events/${id}`);
        if (res.data?.data) return res.data.data;
      } catch (e) {
        // Fallback to mobile general list
      }
      const resUpcoming = await apiClient.get(`/mobile/events?type=upcoming`);
      const found = resUpcoming.data?.data?.find((e: any) => e._id === id);
      if (found) return found;

      const resPast = await apiClient.get(`/mobile/events?type=past`);
      return resPast.data?.data?.find((e: any) => e._id === id);
    },
  });

  if (isLoading) return <LoadingScreen />;
  if (isError || !data) return <ErrorScreen message="Event not found." onRetry={refetch} />;

  const isRegistered = data.registrations?.some((r: any) => r.memberId === profile?.member?._id);
  const isPast = dayjs(data.date).isBefore(dayjs());
  const isFull = data.capacity && data.registrations?.length >= data.capacity;
  const programSessions = Array.isArray(data.programSchedule) ? data.programSchedule : [];
  const committeeMembers = Array.isArray(data.committeeMembers) ? data.committeeMembers : [];

  const handleShare = async () => {
    try {
      const message = `📢 *${data.title}*\n\n📅 Date: ${dayjs(data.date).format('DD MMM YYYY, hh:mm A')}\n📍 Venue: ${data.venue || 'Mahallu'}\n\n${data.description || ''}\n\nShared via Mahallu App`;
      await Share.share({
        message,
        title: data.title,
      });
    } catch (e) {
      // Ignored
    }
  };

  const handleRegister = async () => {
    if (!profile?.member?._id) {
      Alert.alert('Notice', 'Please login to register for this event.');
      return;
    }

    Alert.alert(
      language === 'en' ? 'Confirm Registration' : 'രജിസ്ട്രേഷൻ സ്ഥിരീകരിക്കുക',
      `${language === 'en' ? 'Register for' : 'ഈ പരിപാടിയിൽ പങ്കെടുക്കാൻ രജിസ്റ്റർ ചെയ്യണോ?'}\n${data.title}?`,
      [
        { text: language === 'en' ? 'Cancel' : 'റദ്ദാക്കുക', style: 'cancel' },
        {
          text: language === 'en' ? 'Confirm' : 'രജിസ്റ്റർ ചെയ്യുക',
          onPress: async () => {
            setRegistering(true);
            try {
              await apiClient.post(`/events/${id}/register`, { memberId: profile.member._id });
              Alert.alert('Success', language === 'en' ? 'You have registered successfully.' : 'രജിസ്ട്രേഷൻ വിജയകരമായി പൂർത്തിയായി.');
              refetch();
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to register');
            } finally {
              setRegistering(false);
            }
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} bounces={false} showsVerticalScrollIndicator={false}>
        {/* Banner Image Container */}
        <View style={styles.bannerContainer}>
          {data.banner?.url ? (
            <>
              <Image
                source={{ uri: data.banner.url }}
                style={styles.bannerBackdrop}
                blurRadius={20}
                resizeMode="cover"
              />
              <Image
                source={{ uri: data.banner.url }}
                style={styles.bannerImage}
                resizeMode="contain"
              />
            </>
          ) : (
            <View style={styles.bannerPlaceholder}>
              <Ionicons name="calendar" size={64} color="#34d399" style={{ opacity: 0.5 }} />
            </View>
          )}

          {/* Top Actions: Back & Share */}
          <View style={[styles.topActions, { top: Math.max(insets.top, 14) }]}>
            <TouchableOpacity
              style={styles.circleBtn}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={22} color="#ffffff" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.circleBtn}
              onPress={handleShare}
            >
              <Ionicons name="share-social-outline" size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Content Body Card */}
        <View style={styles.contentCard}>
          {data.isPaid && (
            <View style={styles.paidBadge}>
              <Text style={styles.paidBadgeText}>
                Paid Event • ₹{data.fee}
              </Text>
            </View>
          )}

          <Text style={styles.eventTitle}>{data.title}</Text>

          {/* Meta Info Pills */}
          <View style={styles.metaSection}>
            <View style={styles.metaRow}>
              <View style={[styles.metaIconWrap, { backgroundColor: '#ECFDF5' }]}>
                <Ionicons name="calendar-outline" size={20} color={TEAL} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.metaMainText}>
                  {dayjs(data.date).format('dddd, DD MMMM YYYY')}
                </Text>
                <Text style={styles.metaSubText}>
                  {dayjs(data.date).format('hh:mm A')}
                  {data.endDate ? ` - ${dayjs(data.endDate).format('DD MMM, hh:mm A')}` : ''}
                </Text>
              </View>
            </View>

            {data.venue ? (
              <View style={styles.metaRow}>
                <View style={[styles.metaIconWrap, { backgroundColor: '#EFF6FF' }]}>
                  <Ionicons name="location-outline" size={20} color="#3b82f6" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.metaMainText}>Venue (വേദി)</Text>
                  <Text style={styles.metaSubText}>{data.venue}</Text>
                </View>
              </View>
            ) : null}
          </View>

          {/* Program Sessions Schedule Section */}
          {programSessions.length > 0 && (
            <View style={styles.sectionWrap}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionHeaderIcon}>
                  <Ionicons name="sparkles" size={16} color="#047857" />
                </View>
                <Text style={styles.sectionTitle}>
                  {language === 'en' ? 'Program Schedule & Sessions' : 'പ്രോഗ്രാം സെഷനുകൾ & പ്രഭാഷകർ'}
                </Text>
              </View>

              <View style={styles.sessionsList}>
                {programSessions.map((session: any, idx: number) => (
                  <View key={idx} style={styles.sessionCard}>
                    {/* Session Header */}
                    <View style={styles.sessionCardTop}>
                      <View style={styles.sessionDayWrap}>
                        <View style={styles.sessionDayNumber}>
                          <Text style={styles.sessionDayNumberText}>
                            {session.dayNumber || idx + 1}
                          </Text>
                        </View>
                        <Text style={styles.sessionDateText}>
                          {session.dateText || `Session ${idx + 1}`}
                        </Text>
                      </View>
                      {session.sessionTime ? (
                        <View style={styles.sessionTimeBadge}>
                          <Text style={styles.sessionTimeBadgeText}>
                            ⏰ {session.sessionTime}
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    {/* Session Title */}
                    <Text style={styles.sessionTitle}>
                      {session.sessionTitle || 'മത പ്രഭാഷണം / സമ്മേളനം'}
                    </Text>

                    {/* Speaker & President Badges Grid */}
                    <View style={styles.speakersGrid}>
                      {session.president ? (
                        <View style={styles.speakerItemPresident}>
                          <Text style={styles.speakerLabelPresident}>അധ്യക്ഷൻ (President):</Text>
                          <Text style={styles.speakerVal}>{session.president}</Text>
                        </View>
                      ) : null}

                      {session.inaugurator ? (
                        <View style={styles.speakerItemInaugurator}>
                          <Text style={styles.speakerLabelInaugurator}>ഉദ്ഘാടനം (Inauguration):</Text>
                          <Text style={styles.speakerVal}>{session.inaugurator}</Text>
                        </View>
                      ) : null}

                      {session.keynoteSpeaker ? (
                        <View style={styles.speakerItemKeynote}>
                          <Text style={styles.speakerLabelKeynote}>🎙️ മുഖ്യ പ്രഭാഷണം (Speaker):</Text>
                          <Text style={styles.speakerValKeynote}>{session.keynoteSpeaker}</Text>
                        </View>
                      ) : null}

                      {session.chiefGuests ? (
                        <View style={styles.speakerItemGuests}>
                          <Text style={styles.speakerLabelGuests}>🤝 വിശിഷ്ട അതിഥികൾ (Guests):</Text>
                          <Text style={styles.speakerVal}>{session.chiefGuests}</Text>
                        </View>
                      ) : null}
                    </View>

                    {/* Vote of Thanks */}
                    {session.voteOfThanks ? (
                      <View style={styles.sessionFooter}>
                        <Text style={styles.voteOfThanksText}>
                          🙏 നന്ദി: {session.voteOfThanks}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Notice & Full Details */}
          {data.description ? (
            <View style={styles.sectionWrap}>
              <Text style={styles.sectionTitleSimple}>
                {language === 'en' ? 'About Event & Notice' : 'പരിപാടി വിവരങ്ങൾ & അറിയിപ്പ്'}
              </Text>
              <View style={styles.noticeBox}>
                <Text style={styles.noticeText}>{data.description}</Text>
              </View>
            </View>
          ) : null}

          {/* Committee Members & Organizing Team */}
          {committeeMembers.length > 0 && (
            <View style={styles.sectionWrap}>
              <Text style={styles.sectionTitleSimple}>
                {language === 'en' ? 'Organizing Committee' : 'സംഘാടക സമിതി ഭാരവാഹികൾ'}
              </Text>
              <View style={styles.committeeList}>
                {committeeMembers.map((cm: any, i: number) => {
                  const memberName = cm.memberId?.name || cm.name || 'Committee Member';
                  const memberRole = cm.role || 'Volunteer';
                  const photoUrl = cm.memberId?.photo?.url || cm.photo;
                  return (
                    <View key={cm._id || i} style={styles.committeeCard}>
                      <View style={styles.committeeAvatar}>
                        {photoUrl ? (
                          <Image source={{ uri: photoUrl }} style={styles.avatarImg} />
                        ) : (
                          <Text style={styles.avatarFallback}>{memberName[0]}</Text>
                        )}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.committeeName}>{memberName}</Text>
                        <Text style={styles.committeeRole}>{memberRole}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Registration Bottom Bar */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        {isPast ? (
          <View style={styles.endedBar}>
            <Text style={styles.endedBarText}>
              {language === 'en' ? 'Event has ended' : 'പരിപാടി സമാപിച്ചു'}
            </Text>
          </View>
        ) : isRegistered ? (
          <View style={styles.registeredBar}>
            <Ionicons name="checkmark-circle" size={20} color={TEAL} />
            <Text style={styles.registeredBarText}>
              {language === 'en' ? 'You are registered' : 'നിങ്ങൾ രജിസ്റ്റർ ചെയ്തിട്ടുണ്ട്'}
            </Text>
          </View>
        ) : isFull ? (
          <View style={styles.fullBar}>
            <Text style={styles.fullBarText}>
              {language === 'en' ? 'Registration Full' : 'രജിസ്ട്രേഷൻ പൂർത്തിയായി'}
            </Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.registerBtn}
            onPress={handleRegister}
            disabled={registering}
          >
            {registering ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.registerBtnText}>
                {language === 'en' ? 'Register Now' : 'ഇപ്പോൾ രജിസ്റ്റർ ചെയ്യുക'}
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CREAM,
  },
  scroll: {
    flex: 1,
  },
  bannerContainer: {
    width: '100%',
    backgroundColor: '#0F172A',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    minHeight: 280,
    maxHeight: 360,
  },
  bannerBackdrop: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    opacity: 0.35,
  },
  bannerImage: {
    width: '100%',
    height: 290,
  },
  bannerPlaceholder: {
    width: '100%',
    height: 260,
    backgroundColor: '#064E3B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topActions: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentCard: {
    padding: 22,
    marginTop: -28,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    minHeight: 500,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 5,
  },
  paidBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  paidBadgeText: {
    color: '#D97706',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  eventTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    lineHeight: 30,
    marginBottom: 16,
  },
  metaSection: {
    gap: 12,
    marginBottom: 24,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  metaMainText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  metaSubText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  sectionWrap: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeaderIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#047857',
  },
  sectionTitleSimple: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
  },
  sessionsList: {
    gap: 12,
  },
  sessionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#A7F3D0',
    shadowColor: '#047857',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  sessionCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
    paddingBottom: 10,
    marginBottom: 10,
  },
  sessionDayWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sessionDayNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#047857',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  sessionDayNumberText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
  sessionDateText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#047857',
  },
  sessionTimeBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  sessionTimeBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#92400E',
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 10,
  },
  speakersGrid: {
    gap: 6,
  },
  speakerItemPresident: {
    backgroundColor: '#FFFBEB',
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  speakerLabelPresident: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B45309',
  },
  speakerItemInaugurator: {
    backgroundColor: '#ECFDF5',
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  speakerLabelInaugurator: {
    fontSize: 10,
    fontWeight: '700',
    color: '#047857',
  },
  speakerItemKeynote: {
    backgroundColor: '#FFF1F2',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECDD3',
  },
  speakerLabelKeynote: {
    fontSize: 10,
    fontWeight: '800',
    color: '#BE123C',
  },
  speakerValKeynote: {
    fontSize: 13,
    fontWeight: '900',
    color: '#881337',
    marginTop: 2,
  },
  speakerItemGuests: {
    backgroundColor: '#EFF6FF',
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  speakerLabelGuests: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  speakerVal: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 1,
  },
  sessionFooter: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderColor: '#F1F5F9',
  },
  voteOfThanksText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  noticeBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  noticeText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 22,
  },
  committeeList: {
    gap: 8,
  },
  committeeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  committeeAvatar: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    fontSize: 14,
    fontWeight: '800',
    color: '#64748B',
  },
  committeeName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  committeeRole: {
    fontSize: 11,
    fontWeight: '700',
    color: '#047857',
    textTransform: 'uppercase',
  },
  bottomBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderColor: '#F1F5F9',
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 10,
  },
  endedBar: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  endedBarText: {
    color: '#64748B',
    fontWeight: '800',
  },
  registeredBar: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  registeredBarText: {
    color: '#047857',
    fontWeight: '800',
    marginLeft: 6,
  },
  fullBar: {
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  fullBarText: {
    color: '#E11D48',
    fontWeight: '800',
  },
  registerBtn: {
    backgroundColor: GOLD,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  registerBtnText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 15,
  },
});
