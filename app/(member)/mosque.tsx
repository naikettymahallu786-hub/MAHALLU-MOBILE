import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
  StyleSheet,
  ActivityIndicator,
  Share,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { apiClient } from '../../lib/api';
import { useLanguageStore } from '../../lib/store/languageStore';
import { LoadingScreen } from '../../components/ui/LoadingScreen';
import { ErrorScreen } from '../../components/ui/ErrorScreen';

const TEAL_DARK = '#0B4A42';
const TEAL = '#0F6B5C';
const CREAM = '#FBF8F2';
const GOLD = '#C9972E';

const FACILITY_ICONS: Record<string, string> = {
  'Ablution Place': 'water-outline',
  'വുളൂഅ് സ്ഥലം': 'water-outline',
  'Separate Ladies Area': 'woman-outline',
  'വനിതാ നിസ്കാര സൗകര്യം': 'woman-outline',
  'Library': 'book-outline',
  'ലൈബ്രറി': 'book-outline',
  'Conference Hall': 'people-outline',
  'സമ്മേളന ഹാൾ': 'people-outline',
  'Nikah Stage': 'ribbon-outline',
  'നികാഹ് വേദി': 'ribbon-outline',
  'Drinking Water': 'cafe-outline',
  'കുടിവെള്ള സൗകര്യം': 'cafe-outline',
  'Parking': 'car-outline',
  'പാർക്കിംഗ്': 'car-outline',
  'Air Conditioned': 'snow-outline',
  'എസി സൗകര്യം': 'snow-outline',
};

export default function MosqueDetailsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { language } = useLanguageStore();

  const { data: mosque, isLoading, isError, refetch } = useQuery({
    queryKey: ['mobile', 'mosque-details'],
    queryFn: async () => {
      const res = await apiClient.get('/mosque');
      return res.data?.data;
    },
  });

  if (isLoading) return <LoadingScreen />;
  if (isError) return <ErrorScreen message="Failed to load mosque details." onRetry={refetch} />;

  const mosqueName = mosque?.name || (language === 'en' ? 'Mahallu Juma Masjid' : 'മഹല്ല് ജുമാ മസ്ജിദ്');
  const yearEstablished = mosque?.yearEstablished || 1990;
  const regNo = mosque?.registrationNo || 'REG-1203/90';
  const phone = mosque?.phone || '+91 98765 43210';
  const email = mosque?.email || 'mosque@mahallu.app';

  const address = mosque?.address || {
    line1: 'Masjid Lane, Town Road',
    city: 'Kozhikode',
    state: 'Kerala',
    pincode: '673001',
  };

  const fullAddressString = [address.line1, address.city, address.state, address.pincode]
    .filter(Boolean)
    .join(', ');

  const imam = mosque?.imamId;
  const muazzin = mosque?.muazzinId;
  const facilities: string[] = mosque?.facilities?.length
    ? mosque.facilities
    : ['Ablution Place', 'Separate Ladies Area', 'Library', 'Conference Hall', 'Nikah Stage'];

  const committee = mosque?.committee || [];

  const handleCall = (num: string) => {
    if (!num) return;
    Linking.openURL(`tel:${num.replace(/\s+/g, '')}`).catch(() => {});
  };

  const handleEmail = (mail: string) => {
    if (!mail) return;
    Linking.openURL(`mailto:${mail}`).catch(() => {});
  };

  const handleDirections = () => {
    const query = encodeURIComponent(`${mosqueName}, ${fullAddressString}`);
    const url = Platform.select({
      ios: `maps:0,0?q=${query}`,
      android: `geo:0,0?q=${query}`,
      default: `https://www.google.com/maps/search/?api=1&query=${query}`,
    });
    if (url) Linking.openURL(url).catch(() => {});
  };

  const handleShare = async () => {
    try {
      await Share.share({
        title: mosqueName,
        message: `🕌 *${mosqueName}*\n📍 ${fullAddressString}\n📞 ${phone}\n✉️ ${email}\n\nShared via Mahallu App`,
      });
    } catch (e) {}
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} bounces={false} showsVerticalScrollIndicator={false}>
        {/* Header Hero Banner */}
        <View style={styles.heroBanner}>
          <Image
            source={require('../../assets/images/islamic_pattern.jpg')}
            style={styles.heroPattern}
            resizeMode="cover"
          />

          <LinearGradient
            colors={['rgba(11, 74, 66, 0.95)', 'rgba(6, 78, 59, 0.98)']}
            style={StyleSheet.absoluteFillObject}
          />

          {/* Top Actions */}
          <SafeAreaView edges={['top']} style={styles.topActions}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
              <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.backBtn} onPress={handleShare} activeOpacity={0.8}>
              <Ionicons name="share-social-outline" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </SafeAreaView>

          {/* Hero Content */}
          <View style={styles.heroContent}>
            <View style={styles.mosqueIconWrap}>
              <Ionicons name="business" size={32} color="#FDE68A" />
            </View>

            <Text style={styles.heroTitle}>{mosqueName}</Text>
            <Text style={styles.heroSubtitle}>
              {language === 'en'
                ? `Established in ${yearEstablished} • Reg No: ${regNo}`
                : `സ്ഥാപിതം: ${yearEstablished} • രജിസ്ട്രേഷൻ: ${regNo}`}
            </Text>

            {/* Quick Action Pills */}
            <View style={styles.quickActionsRow}>
              <TouchableOpacity style={styles.quickActionPill} onPress={() => handleCall(phone)} activeOpacity={0.8}>
                <Ionicons name="call" size={14} color="#065F46" />
                <Text style={styles.quickActionPillText}>{language === 'en' ? 'Call' : 'വിളിക്കുക'}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.quickActionPill} onPress={() => handleEmail(email)} activeOpacity={0.8}>
                <Ionicons name="mail" size={14} color="#065F46" />
                <Text style={styles.quickActionPillText}>{language === 'en' ? 'Email' : 'ഇമെയിൽ'}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.quickActionPill} onPress={handleDirections} activeOpacity={0.8}>
                <Ionicons name="navigate" size={14} color="#065F46" />
                <Text style={styles.quickActionPillText}>{language === 'en' ? 'Directions' : 'വഴി'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Content Body */}
        <View style={styles.bodyCard}>
          {/* Location & Address Card */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <View style={[styles.sectionIconWrap, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="location" size={18} color="#2563EB" />
              </View>
              <Text style={styles.sectionHeaderTitle}>
                {language === 'en' ? 'Location & Address' : 'പള്ളിയുടെ വിലാസം'}
              </Text>
            </View>

            <Text style={styles.addressLine}>{address.line1 || 'Masjid Road'}</Text>
            <Text style={styles.addressSub}>
              {[address.city, address.state].filter(Boolean).join(', ')} - {address.pincode}
            </Text>

            <TouchableOpacity style={styles.directionsBtn} onPress={handleDirections} activeOpacity={0.8}>
              <Ionicons name="map-outline" size={16} color="#2563EB" />
              <Text style={styles.directionsBtnText}>
                {language === 'en' ? 'Open in Maps / Get Directions' : 'ഗൂഗിൾ മാപ്സിൽ കാണുക'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Religious Staff (ഇമാം & മുഅദ്ദിൻ) */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <View style={[styles.sectionIconWrap, { backgroundColor: '#ECFDF5' }]}>
                <Ionicons name="people" size={18} color="#059669" />
              </View>
              <Text style={styles.sectionHeaderTitle}>
                {language === 'en' ? 'Religious Staff' : 'ഇമാം & മുഅദ്ദിൻ'}
              </Text>
            </View>

            <View style={styles.staffGrid}>
              {/* Imam Card */}
              <View style={styles.staffCard}>
                <View style={styles.staffAvatar}>
                  {imam?.photo?.url ? (
                    <Image source={{ uri: imam.photo.url }} style={styles.avatarImg} />
                  ) : (
                    <Ionicons name="person" size={24} color="#059669" />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.staffRole}>{language === 'en' ? 'Chief Imam / Khatheeb' : 'ഖതീബ് & ചീഫ് ഇമാം'}</Text>
                  <Text style={styles.staffName}>{imam?.name || 'Usthad Ahmed Musliyar'}</Text>
                  {imam?.phone ? (
                    <TouchableOpacity
                      style={styles.staffPhoneRow}
                      onPress={() => handleCall(imam.phone)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="call-outline" size={12} color="#059669" />
                      <Text style={styles.staffPhoneText}>{imam.phone}</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>

              {/* Muazzin Card */}
              <View style={styles.staffCard}>
                <View style={styles.staffAvatar}>
                  {muazzin?.photo?.url ? (
                    <Image source={{ uri: muazzin.photo.url }} style={styles.avatarImg} />
                  ) : (
                    <Ionicons name="person" size={24} color="#059669" />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.staffRole}>{language === 'en' ? 'Muazzin / Bilali' : 'മുഅദ്ദിൻ'}</Text>
                  <Text style={styles.staffName}>{muazzin?.name || 'Usthad Faisal Bilali'}</Text>
                  {muazzin?.phone ? (
                    <TouchableOpacity
                      style={styles.staffPhoneRow}
                      onPress={() => handleCall(muazzin.phone)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="call-outline" size={12} color="#059669" />
                      <Text style={styles.staffPhoneText}>{muazzin.phone}</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            </View>
          </View>

          {/* Mosque Facilities & Amenities */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <View style={[styles.sectionIconWrap, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="sparkles" size={18} color="#D97706" />
              </View>
              <Text style={styles.sectionHeaderTitle}>
                {language === 'en' ? 'Facilities & Amenities' : 'പള്ളിയിലെ സൗകര്യങ്ങൾ'}
              </Text>
            </View>

            <View style={styles.facilitiesWrap}>
              {facilities.map((facility, idx) => {
                const iconName = (FACILITY_ICONS[facility] || 'checkmark-circle-outline') as any;
                return (
                  <View key={idx} style={styles.facilityBadge}>
                    <Ionicons name={iconName} size={15} color="#065F46" />
                    <Text style={styles.facilityBadgeText}>{facility}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Mosque Management Committee */}
          {committee.length > 0 && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <View style={[styles.sectionIconWrap, { backgroundColor: '#F5F3FF' }]}>
                  <Ionicons name="shield-checkmark" size={18} color="#7C3AED" />
                </View>
                <Text style={styles.sectionHeaderTitle}>
                  {language === 'en' ? 'Management Committee' : 'മഹല്ല് കമ്മിറ്റി ഭാരവാഹികൾ'}
                </Text>
              </View>

              <View style={styles.committeeList}>
                {committee.map((member: any, idx: number) => {
                  const mName = member.memberId?.name || member.name || 'Committee Leader';
                  const mRole = member.role || 'Executive Member';
                  const mPhone = member.memberId?.phone || member.phone;

                  return (
                    <View key={idx} style={styles.committeeRow}>
                      <View style={styles.committeeAvatar}>
                        <Text style={styles.committeeAvatarText}>{mName[0] || 'M'}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.committeeNameText}>{mName}</Text>
                        <Text style={styles.committeeRoleText}>{mRole}</Text>
                      </View>
                      {mPhone ? (
                        <TouchableOpacity
                          style={styles.callCircleBtn}
                          onPress={() => handleCall(mPhone)}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="call" size={14} color="#059669" />
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Contact Details Footer Box */}
          <View style={styles.contactFooterBox}>
            <Text style={styles.contactFooterTitle}>
              {language === 'en' ? 'General Inquiries & Office' : 'ഓഫീസ് & അന്വേഷണങ്ങൾക്ക്'}
            </Text>
            <View style={styles.contactFooterItem}>
              <Ionicons name="call-outline" size={16} color="#059669" />
              <Text style={styles.contactFooterVal}>{phone}</Text>
            </View>
            <View style={styles.contactFooterItem}>
              <Ionicons name="mail-outline" size={16} color="#059669" />
              <Text style={styles.contactFooterVal}>{email}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
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
  heroBanner: {
    width: '100%',
    backgroundColor: '#064E3B',
    paddingBottom: 40,
    position: 'relative',
    overflow: 'hidden',
  },
  heroPattern: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    opacity: 0.08,
  },
  topActions: {
    paddingHorizontal: 20,
    paddingTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroContent: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  mosqueIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(253, 230, 138, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 23,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 30,
  },
  heroSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D1FAE5',
    marginTop: 4,
    textAlign: 'center',
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  quickActionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  quickActionPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#065F46',
  },
  bodyCard: {
    padding: 20,
    marginTop: -24,
    backgroundColor: CREAM,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    gap: 16,
    paddingBottom: 40,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 10,
  },
  sectionIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeaderTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  addressLine: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 22,
  },
  addressSub: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
    marginBottom: 14,
  },
  directionsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    gap: 6,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  directionsBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2563EB',
  },
  staffGrid: {
    gap: 12,
  },
  staffCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    gap: 12,
  },
  staffAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  staffRole: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  staffName: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 1,
  },
  staffPhoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  staffPhoneText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  facilitiesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  facilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  facilityBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#065F46',
  },
  committeeList: {
    gap: 10,
  },
  committeeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
    gap: 12,
  },
  committeeAvatar: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  committeeAvatarText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F172A',
  },
  committeeNameText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  committeeRoleText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  callCircleBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactFooterBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  contactFooterTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 4,
  },
  contactFooterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contactFooterVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
});
