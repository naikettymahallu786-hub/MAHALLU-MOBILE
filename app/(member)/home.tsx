import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  Image,
  Dimensions,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useProfile } from '../../lib/hooks/useProfile';
import { usePrayerTimes } from '../../lib/hooks/usePrayerTimes';
import { useAnnouncements } from '../../lib/hooks/useEvents';
import { PrayerTimesWidget } from '../../components/PrayerTimesWidget';
import { Avatar } from '../../components/ui/Avatar';
import { LoadingScreen } from '../../components/ui/LoadingScreen';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useLanguageStore } from '../../lib/store/languageStore';
import { t } from '../../lib/i18n';
import { colors, shadows, radius } from '../../lib/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CATEGORIES = [
  { id: 'all', label: 'All Services', icon: 'grid-outline' as const },
  { id: 'dues', label: 'Dues & Finance', icon: 'card-outline' as const },
  { id: 'prayer', label: 'Prayer Times', icon: 'time-outline' as const },
  { id: 'family', label: 'My Family', icon: 'people-outline' as const },
  { id: 'madrasa', label: 'Madrasa Portal', icon: 'school-outline' as const },
  { id: 'events', label: 'Events', icon: 'calendar-outline' as const },
  { id: 'rentals', label: 'Properties', icon: 'business-outline' as const },
];

export default function MemberHomeScreen() {
  const router = useRouter();
  const { language, toggleLanguage } = useLanguageStore();
  const { data: profileData, isLoading: profileLoading, refetch: refetchProfile } = useProfile();
  const { data: prayerTimes, isLoading: prayerLoading } = usePrayerTimes();
  const { data: announcements } = useAnnouncements();
  const [selectedCategory, setSelectedCategory] = useState('all');

  if (profileLoading) return <LoadingScreen message="Loading dashboard..." />;

  const { member, family, tenant, user } = profileData || {};
  const hasDue = (family?.outstandingBalance || 0) > 0;

  const categories = [
    { id: 'all', label: t('allServices', language), icon: 'grid-outline' as const },
    { id: 'dues', label: t('duesAndFinance', language), icon: 'card-outline' as const },
    { id: 'prayer', label: t('prayerTimes', language), icon: 'time-outline' as const },
    { id: 'family', label: t('myFamily', language), icon: 'people-outline' as const },
    { id: 'madrasa', label: t('madrasaPortal', language), icon: 'school-outline' as const },
    { id: 'events', label: t('events', language), icon: 'calendar-outline' as const },
    { id: 'rentals', label: t('properties', language), icon: 'business-outline' as const },
  ];

  const allServices = [
    ...(user?.role === 'ustadh' ? [{
      id: 'ustadh',
      category: 'madrasa',
      icon: 'book' as const,
      title: t('teacherArea', language),
      subtitle: t('madrasaPortal', language),
      color: '#EF4444',
      bg: '#FEF2F2',
      onPress: () => router.push('/(member)/ustadh'),
    }] : []),
    ...(user?.role === 'sadar_mualim' ? [{
      id: 'sadar',
      category: 'madrasa',
      icon: 'briefcase' as const,
      title: t('sadarPanel', language),
      subtitle: t('headmasterHub', language),
      color: '#D97706',
      bg: '#FEF3C7',
      onPress: () => router.push('/(member)/sadar-panel'),
    }] : []),
    {
      id: 'dues',
      category: 'dues',
      icon: 'card' as const,
      title: t('payDues', language),
      subtitle: t('subscriptions', language),
      color: '#10B981',
      bg: '#ECFDF5',
      onPress: () => router.push('/(member)/payments'),
    },
    {
      id: 'sadaqah',
      category: 'dues',
      icon: 'wallet' as const,
      title: t('zakat', language),
      subtitle: t('voluntaryCharity', language),
      color: '#F59E0B',
      bg: '#FFFBEB',
      onPress: () => router.push('/(member)/sadaqah'),
    },
    {
      id: 'family',
      category: 'family',
      icon: 'people' as const,
      title: t('myFamily', language),
      subtitle: `${family?.members?.length || 1} ${t('members', language)}`,
      color: '#3B82F6',
      bg: '#EFF6FF',
      onPress: () => router.push('/(member)/family'),
    },
    ...((user?.role === 'parent' || user?.role === 'member') ? [{
      id: 'madrasa_kids',
      category: 'madrasa',
      icon: 'school' as const,
      title: t('madrasaKids', language),
      subtitle: t('studentsPortal', language),
      color: '#F43F5E',
      bg: '#FFF1F2',
      onPress: () => router.push('/(member)/family-students'),
    }] : []),
    {
      id: 'events',
      category: 'events',
      icon: 'calendar' as const,
      title: t('events', language),
      subtitle: t('upcomingActivities', language),
      color: '#8B5CF6',
      bg: '#F5F3FF',
      onPress: () => router.push('/(member)/events'),
    },
    {
      id: 'mosque',
      category: 'events',
      icon: 'business' as const,
      title: language === 'en' ? 'About Mosque' : 'പള്ളി വിവരങ്ങൾ',
      subtitle: language === 'en' ? 'Imam & Staff' : 'ഇമാം, വിലാസം, ഭാരവാഹികൾ',
      color: '#059669',
      bg: '#ECFDF5',
      onPress: () => router.push('/(member)/mosque'),
    },
    {
      id: 'rentals',
      category: 'rentals',
      icon: 'storefront' as const,
      title: t('propertiesAndRentals', language),
      subtitle: t('hallsAndAssets', language),
      color: '#06B6D4',
      bg: '#ECFEFF',
      onPress: () => router.push('/(member)/properties'),
    },
  ];

  const filteredServices = selectedCategory === 'all'
    ? allServices
    : allServices.filter(s => s.category === selectedCategory);

  const handleRefresh = () => {
    refetchProfile();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* ── TOP NAV BAR ── */}
      <SafeAreaView edges={['top']} style={styles.topBar}>
        <View style={styles.topBarContent}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push('/(member)/more')}
            style={styles.profileHeaderBtn}
          >
            <Avatar
              uri={member?.photo?.url || tenant?.logo}
              name={member?.name || tenant?.name || 'Member'}
              size={42}
              showRing
              ringColor={colors.gold.base}
            />
            <View style={styles.profileHeaderText}>
              <Text style={styles.greetingSubtitle}>{tenant?.name || 'Mahallu Community'}</Text>
              <Text style={styles.greetingTitle} numberOfLines={1}>
                {t('greeting', language)}, {member?.name?.split(' ')[0] || 'Member'}
              </Text>
            </View>
          </TouchableOpacity>

          <View style={styles.topBarActions}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={toggleLanguage}
              style={styles.langPill}
            >
              <Text style={styles.langPillText}>{language === 'en' ? 'EN' : 'ML'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push('/(member)/notifications')}
              style={styles.iconCircleBtn}
            >
              <Ionicons name="notifications-outline" size={20} color={colors.slate[800]} />
              <View style={styles.notifBadge} />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={profileLoading} onRefresh={handleRefresh} tintColor={colors.teal.base} />
        }
      >
        {/* ── DIGITAL MEMBERSHIP & DUES CARD ── */}
        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.membershipCardWrapper}>
          <LinearGradient
            colors={[colors.teal.darkest, colors.teal.dark, colors.teal.base]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.membershipCard}
          >
            <Image
              source={require('../../assets/images/islamic_pattern.jpg')}
              style={styles.cardPatternOverlay}
              resizeMode="cover"
            />

            {/* Top row: Chip and Family ID */}
            <View style={styles.cardTopRow}>
              <View style={styles.chipRow}>
                <Ionicons name="card" size={24} color={colors.gold.base} />
                <Text style={styles.cardBrandText}>{t('mahalluPass', language)}</Text>
              </View>
              <View style={styles.wardBadge}>
                <Ionicons name="location" size={12} color={colors.gold.light} />
                <Text style={styles.wardBadgeText}>
                  {t('ward', language)} {family?.wardNo || 'General'}
                </Text>
              </View>
            </View>

            {/* Middle: Family Code */}
            <View style={styles.cardCodeSection}>
              <Text style={styles.cardCodeLabel}>{t('familyCode', language)}</Text>
              <Text style={styles.cardCodeValue}>{family?.familyCode || 'N/A'}</Text>
            </View>

            {/* Bottom Row: Balance & Pay CTA */}
            <View style={styles.cardBottomRow}>
              <View>
                <Text style={styles.cardBalanceLabel}>{t('outstandingDues', language)}</Text>
                <Text style={[styles.cardBalanceValue, { color: hasDue ? '#FCA5A5' : '#86EFAC' }]}>
                  ₹{family?.outstandingBalance || 0}
                </Text>
              </View>

              {hasDue ? (
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => router.push('/(member)/payments')}
                  style={styles.cardPayBtn}
                >
                  <Text style={styles.cardPayBtnText}>{t('payNow', language)}</Text>
                  <Ionicons name="arrow-forward" size={14} color={colors.teal.darkest} />
                </TouchableOpacity>
              ) : (
                <View style={styles.cardSettledBadge}>
                  <Ionicons name="checkmark-circle" size={14} color="#86EFAC" />
                  <Text style={styles.cardSettledText}>{t('allCleared', language)}</Text>
                </View>
              )}
            </View>
          </LinearGradient>
        </Animated.View>

        {/* ── HORIZONTAL CATEGORY PILLS STRIP ── */}
        <Animated.View entering={FadeInDown.delay(150).springify()}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}
          >
            {categories.map((cat) => {
              const isActive = selectedCategory === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  activeOpacity={0.75}
                  onPress={() => setSelectedCategory(cat.id)}
                  style={[styles.categoryPill, isActive && styles.categoryPillActive]}
                >
                  <Ionicons
                    name={cat.icon}
                    size={16}
                    color={isActive ? colors.white : colors.slate[600]}
                  />
                  <Text style={[styles.categoryPillText, isActive && styles.categoryPillTextActive]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </Animated.View>

        {/* ── PRAYER TIMES WIDGET ── */}
        {(selectedCategory === 'all' || selectedCategory === 'prayer') && (
          <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.sectionBlock}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>{t('dailyPrayerTimes', language)}</Text>
              <Text style={styles.sectionSubtitle}>{t('mosqueSchedule', language)}</Text>
            </View>
            <PrayerTimesWidget data={prayerTimes} isLoading={prayerLoading} />
          </Animated.View>
        )}

        {/* ── QUICK ACTIONS 2-COLUMN GRID ── */}
        {selectedCategory !== 'prayer' && (
          <Animated.View entering={FadeInDown.delay(250).springify()} style={styles.sectionBlock}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>
                {selectedCategory === 'dues'
                  ? t('duesAndFinance', language)
                  : selectedCategory === 'madrasa'
                  ? t('madrasaPortal', language)
                  : selectedCategory === 'family'
                  ? t('myFamily', language)
                  : selectedCategory === 'events'
                  ? t('events', language)
                  : selectedCategory === 'rentals'
                  ? t('properties', language)
                  : t('quickServices', language)}
              </Text>
              <TouchableOpacity onPress={() => router.push('/(member)/services')}>
                <Text style={styles.viewAllText}>{t('viewAll', language)}</Text>
              </TouchableOpacity>
            </View>

            {filteredServices.length === 0 ? (
              <View style={styles.emptyFilterBox}>
                <Text style={styles.emptyFilterText}>{t('notAvailable', language)}</Text>
              </View>
            ) : (
              <View style={styles.servicesGrid}>
                {filteredServices.map((service) => (
                  <ServiceGridCard
                    key={service.id}
                    icon={service.icon}
                    title={service.title}
                    subtitle={service.subtitle}
                    color={service.color}
                    bg={service.bg}
                    onPress={service.onPress}
                  />
                ))}
              </View>
            )}
          </Animated.View>
        )}

        {/* ── ANNOUNCEMENTS / NOTICES CAROUSEL ── */}
        {announcements && announcements.length > 0 && (
          <Animated.View entering={FadeInUp.delay(300).springify()} style={styles.sectionBlock}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>{t('announcements', language)}</Text>
              <Text style={styles.sectionSubtitle}>{t('officialUpdates', language)}</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.announcementsScroll}>
              {announcements.map((item: any) => (
                <View key={item._id} style={styles.announcementCard}>
                  <View style={styles.announcementTopRow}>
                    <View style={styles.announcementIconBox}>
                      <Ionicons name="megaphone" size={14} color={colors.gold.dark} />
                    </View>
                    <Text style={styles.announcementTag}>{t('notice', language)}</Text>
                  </View>
                  <Text style={styles.announcementTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.announcementBody} numberOfLines={2}>{item.body}</Text>
                </View>
              ))}
            </ScrollView>
          </Animated.View>
        )}

        {/* Bottom spacer for tab bar */}
        <View style={{ height: 28 }} />
      </ScrollView>
    </View>
  );
}

function ServiceGridCard({
  icon,
  title,
  subtitle,
  color,
  bg,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  color: string;
  bg: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={styles.gridCard}
    >
      <View style={[styles.gridIconContainer, { backgroundColor: bg }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text style={styles.gridCardTitle} numberOfLines={1}>{title}</Text>
      <Text style={styles.gridCardSubtitle} numberOfLines={1}>{subtitle}</Text>
      <View style={styles.gridArrowBtn}>
        <Ionicons name="arrow-forward" size={12} color={colors.slate[400]} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAF9',
  },
  topBar: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.slate[100],
  },
  topBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  profileHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileHeaderText: {
    marginLeft: 12,
    flex: 1,
  },
  greetingSubtitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.slate[400],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  greetingTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.slate[900],
    letterSpacing: -0.2,
  },
  topBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  langPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: colors.slate[100],
  },
  langPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.slate[700],
  },
  iconCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.slate[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifBadge: {
    position: 'absolute',
    top: 8,
    right: 9,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.error,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
  },
  // Membership Card (Credit Card Format)
  membershipCardWrapper: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  membershipCard: {
    borderRadius: 24,
    padding: 22,
    overflow: 'hidden',
    ...shadows.elevated,
  },
  cardPatternOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.07,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardBrandText: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.gold.light,
    letterSpacing: 1.5,
  },
  wardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  wardBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.white,
  },
  cardCodeSection: {
    marginBottom: 24,
  },
  cardCodeLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 1,
  },
  cardCodeValue: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.white,
    letterSpacing: 2,
    marginTop: 2,
  },
  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
    paddingTop: 14,
  },
  cardBalanceLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 0.8,
  },
  cardBalanceValue: {
    fontSize: 20,
    fontWeight: '900',
    marginTop: 2,
  },
  cardPayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.gold.base,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.full,
  },
  cardPayBtnText: {
    color: colors.teal.darkest,
    fontSize: 12,
    fontWeight: '800',
  },
  cardSettledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  cardSettledText: {
    color: '#86EFAC',
    fontSize: 12,
    fontWeight: '700',
  },
  // Category Pills
  categoryScroll: {
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 20,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.slate[200],
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radius.full,
  },
  categoryPillActive: {
    backgroundColor: colors.teal.darkest,
    borderColor: colors.teal.darkest,
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.slate[700],
  },
  categoryPillTextActive: {
    color: colors.white,
  },
  // Section Headers
  sectionBlock: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: colors.slate[900],
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.slate[400],
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.teal.base,
  },
  // 2-Column Services Grid
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  gridCard: {
    width: (SCREEN_WIDTH - 52) / 2,
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.slate[100],
    ...shadows.card,
  },
  gridIconContainer: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  gridCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.slate[900],
    marginBottom: 2,
  },
  gridCardSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.slate[400],
    marginBottom: 8,
  },
  gridArrowBtn: {
    alignSelf: 'flex-end',
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.slate[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyFilterBox: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.slate[100],
  },
  emptyFilterText: {
    color: colors.slate[400],
    fontSize: 13,
    fontWeight: '600',
  },
  // Announcements
  announcementsScroll: {
    gap: 12,
  },
  announcementCard: {
    width: 260,
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.slate[100],
    ...shadows.card,
  },
  announcementTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  announcementIconBox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: colors.gold.ghost,
    alignItems: 'center',
    justifyContent: 'center',
  },
  announcementTag: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.gold.dark,
    letterSpacing: 0.5,
  },
  announcementTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.slate[900],
    marginBottom: 4,
  },
  announcementBody: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.slate[500],
    lineHeight: 18,
  },
});