import React, { useState } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useEvents } from '../../../lib/hooks/useEvents';
import { LoadingScreen } from '../../../components/ui/LoadingScreen';
import { EmptyState } from '../../../components/ui/EmptyState';
import { EventCard } from '../../../components/EventCard';
import Animated, { FadeInDown, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useLanguageStore } from '../../../lib/store/languageStore';
import { t } from '../../../lib/i18n';
import { colors, gradients, shadows, radius } from '../../../lib/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function EventsListScreen() {
  const router = useRouter();
  const { language } = useLanguageStore();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const { data: events, isLoading, refetch } = useEvents(activeTab);

  return (
    <View style={styles.container}>
      {/* Gradient Header */}
      <LinearGradient
        colors={gradients.headerCompact}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Image
          source={require('../../../assets/images/islamic_pattern.jpg')}
          style={styles.patternOverlay}
          resizeMode="cover"
        />
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
            <TouchableOpacity
              onPress={() => router.canGoBack() ? router.back() : router.replace('/(member)/services')}
              style={styles.backButton}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={22} color={colors.white} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t('eventsTitle', language)}</Text>
            <View style={{ width: 42 }} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Animated Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'upcoming' && styles.tabActive]}
          onPress={() => setActiveTab('upcoming')}
          activeOpacity={0.8}
        >
          <Ionicons
            name={activeTab === 'upcoming' ? 'calendar' : 'calendar-outline'}
            size={16}
            color={activeTab === 'upcoming' ? colors.white : colors.slate[500]}
          />
          <Text style={[styles.tabText, activeTab === 'upcoming' && styles.tabTextActive]}>
            {t('upcoming', language)}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'past' && styles.tabActive]}
          onPress={() => setActiveTab('past')}
          activeOpacity={0.8}
        >
          <Ionicons
            name={activeTab === 'past' ? 'time' : 'time-outline'}
            size={16}
            color={activeTab === 'past' ? colors.white : colors.slate[500]}
          />
          <Text style={[styles.tabText, activeTab === 'past' && styles.tabTextActive]}>
            {t('pastEvents', language)}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.teal.base} />}
      >
        {isLoading ? null : !events || events.length === 0 ? (
          <EmptyState
            icon="calendar-clear-outline"
            title={activeTab === 'upcoming' ? t('noUpcomingEvents', language) : t('noPastEvents', language)}
            message={activeTab === 'upcoming' ? t('noUpcomingDesc', language) : t('noPastDesc', language)}
          />
        ) : (
          <View style={styles.eventsList}>
            {events.map((event: any, idx: number) => (
              <Animated.View key={event._id} entering={FadeInDown.delay(50 + (idx * 60)).springify().damping(16)}>
                <EventCard
                  title={event.title}
                  date={event.date}
                  venue={event.venue}
                  bannerUri={event.banner?.url}
                  isPaid={event.isPaid}
                  onPress={() => router.push(`/(member)/events/${event._id}`)}
                />
              </Animated.View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  header: {
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  patternOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.06,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '800',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
    gap: 10,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    gap: 6,
    borderWidth: 1,
    borderColor: colors.slate[200],
  },
  tabActive: {
    backgroundColor: colors.teal.base,
    borderColor: colors.teal.base,
    ...shadows.glow,
  },
  tabText: {
    fontWeight: '700',
    fontSize: 13,
    color: colors.slate[500],
  },
  tabTextActive: {
    color: colors.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  eventsList: {
    gap: 0,
  },
});
