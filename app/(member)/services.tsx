import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useLanguageStore } from '../../lib/store/languageStore';
import { useAuthStore } from '../../store/auth.store';
import { t } from '../../lib/i18n';
import { colors, shadows, radius } from '../../lib/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ServicesScreen() {
  const router = useRouter();
  const { language } = useLanguageStore();
  const { user } = useAuthStore();
  const [activeFilter, setActiveFilter] = useState<'all' | 'finance' | 'community' | 'facilities'>('all');

  const services = [
    {
      id: 'payments',
      category: 'finance',
      categoryTitle: t('financeAndDues', language),
      title: t('paymentsTitle', language),
      desc: t('paymentsDesc', language),
      route: '/(member)/payments',
      icon: 'card' as const,
      color: '#10B981',
      bg: '#ECFDF5',
      tag: 'FINANCE',
    },
    {
      id: 'sadaqah',
      category: 'finance',
      categoryTitle: t('financeAndDues', language),
      title: t('zakat', language),
      desc: t('zakatDesc', language),
      route: '/(member)/sadaqah',
      icon: 'wallet' as const,
      color: '#3B82F6',
      bg: '#EFF6FF',
      tag: 'CHARITY',
    },
    {
      id: 'events',
      category: 'community',
      categoryTitle: t('community', language),
      title: t('eventsTitle', language),
      desc: t('eventsDesc', language),
      route: '/(member)/events',
      icon: 'calendar' as const,
      color: '#8B5CF6',
      bg: '#F5F3FF',
      tag: 'COMMUNITY',
    },
    {
      id: 'certificates',
      category: 'community',
      categoryTitle: t('community', language),
      title: t('certificates', language),
      desc: t('certificatesDesc', language),
      route: '/(member)/certificates',
      icon: 'document-text' as const,
      color: '#F59E0B',
      bg: '#FFFBEB',
      tag: 'OFFICIAL',
    },
    ...((user?.role === 'sadar_mualim' || user?.role === 'madrasa_principal' || user?.role === 'super_admin') ? [{
      id: 'sadar-panel',
      category: 'community',
      categoryTitle: t('community', language),
      title: t('sadarMualimPanel', language),
      desc: t('sadarPanelDesc', language),
      route: '/(member)/sadar-panel',
      icon: 'school' as const,
      color: '#0F6B5C',
      bg: '#ECFDF5',
      tag: 'MADRASA',
    }] : []),
    {
      id: 'properties',
      category: 'facilities',
      categoryTitle: t('facilities', language),
      title: t('properties', language),
      desc: t('propertiesDesc', language),
      route: '/(member)/properties',
      icon: 'business' as const,
      color: '#06B6D4',
      bg: '#ECFEFF',
      tag: 'FACILITIES',
    },
  ];

  const filteredServices = activeFilter === 'all'
    ? services
    : services.filter(s => s.category === activeFilter);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Clean Top Nav */}
      <SafeAreaView edges={['top']} style={styles.navBar}>
        <View style={styles.navContent}>
          <Text style={styles.navTitle}>{t('servicesTitle', language)}</Text>
          <Text style={styles.navSubtitle}>{t('exploreServicesDesc', language)}</Text>
        </View>
      </SafeAreaView>

      {/* Filter Pills Strip (Matches Reference Category Filter) */}
      <View style={styles.filterStrip}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {[
            { id: 'all', label: t('allServices', language) },
            { id: 'finance', label: t('financeAndDues', language) },
            { id: 'community', label: t('communityTitle', language) },
            { id: 'facilities', label: t('facilitiesTitle', language) },
          ].map((f) => {
            const isActive = activeFilter === f.id;
            return (
              <TouchableOpacity
                key={f.id}
                onPress={() => setActiveFilter(f.id as any)}
                style={[styles.filterPill, isActive && styles.filterPillActive]}
                activeOpacity={0.8}
              >
                <Text style={[styles.filterPillText, isActive && styles.filterPillTextActive]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Services List / Grid */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.servicesGrid}>
          {filteredServices.map((service, i) => (
            <Animated.View
              key={service.id}
              entering={FadeInDown.delay(i * 70).springify()}
            >
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => service.route && router.push(service.route as any)}
                style={styles.serviceCard}
              >
                <View style={styles.cardHeaderRow}>
                  <View style={[styles.iconContainer, { backgroundColor: service.bg }]}>
                    <Ionicons name={service.icon} size={24} color={service.color} />
                  </View>
                  <View style={styles.tagBadge}>
                    <Text style={styles.tagBadgeText}>{service.tag}</Text>
                  </View>
                </View>

                <View style={styles.cardBody}>
                  <Text style={styles.serviceTitle}>{service.title}</Text>
                  <Text style={styles.serviceDesc} numberOfLines={2}>{service.desc}</Text>
                </View>

                <View style={styles.cardFooter}>
                  <Text style={styles.exploreText}>{t('openService', language)}</Text>
                  <View style={styles.arrowCircle}>
                    <Ionicons name="arrow-forward" size={14} color={colors.slate[800]} />
                  </View>
                </View>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAF9',
  },
  navBar: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.slate[100],
  },
  navContent: {
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  navTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.slate[900],
    letterSpacing: -0.5,
  },
  navSubtitle: {
    fontSize: 13,
    color: colors.slate[400],
    fontWeight: '500',
    marginTop: 2,
  },
  filterStrip: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.slate[100],
    paddingVertical: 12,
  },
  filterScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: colors.slate[50],
    borderWidth: 1,
    borderColor: colors.slate[200],
  },
  filterPillActive: {
    backgroundColor: colors.teal.darkest,
    borderColor: colors.teal.darkest,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.slate[600],
  },
  filterPillTextActive: {
    color: colors.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  servicesGrid: {
    gap: 14,
  },
  serviceCard: {
    backgroundColor: colors.white,
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.slate[100],
    ...shadows.card,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagBadge: {
    backgroundColor: colors.slate[50],
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.slate[200],
  },
  tagBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.slate[500],
    letterSpacing: 0.8,
  },
  cardBody: {
    marginBottom: 16,
  },
  serviceTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.slate[900],
    marginBottom: 4,
  },
  serviceDesc: {
    fontSize: 13,
    color: colors.slate[500],
    lineHeight: 18,
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.slate[50],
    paddingTop: 12,
  },
  exploreText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.teal.base,
  },
  arrowCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.slate[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
});
