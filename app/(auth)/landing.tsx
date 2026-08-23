import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Dimensions, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  withSequence,
} from 'react-native-reanimated';
import { colors, gradients, shadows, radius } from '../../lib/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const SLIDES = [
  {
    tag: 'COMMUNITY HUB',
    title: 'Connected\nMahallu Life',
    subtitle: 'Manage family records, access welfare services, and stay synced with your local mosque.',
  },
  {
    tag: 'EDUCATION',
    title: 'Madrasa &\nStudent Portal',
    subtitle: 'Track daily attendance, exam results, timetable, and homework directly from teachers.',
  },
  {
    tag: 'FINANCE & RELIEF',
    title: 'Transparent\nDues & Sadaqah',
    subtitle: 'Instant online dues settlement, recurring donations, and community relief contributions.',
  },
];

export default function LandingScreen() {
  const router = useRouter();
  const [activeSlide, setActiveSlide] = useState(0);

  // Auto-slide effect
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % SLIDES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const slide = SLIDES[activeSlide];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* ── TOP HERO CARD (Matches Reference Top Screen Architecture) ── */}
      <View style={styles.heroCard}>
        {/* Background image */}
        <Image
          source={require('../../assets/images/mosque_bg.png')}
          style={styles.heroImage}
          resizeMode="cover"
        />

        {/* Gradient overlay */}
        <LinearGradient
          colors={['rgba(6,46,40,0.3)', 'rgba(6,46,40,0.75)', 'rgba(6,46,40,0.95)']}
          style={StyleSheet.absoluteFill}
        />

        {/* Pattern overlay */}
        <Image
          source={require('../../assets/images/islamic_pattern.jpg')}
          style={styles.patternOverlay}
          resizeMode="cover"
        />

        <SafeAreaView edges={['top']} style={styles.heroSafeArea}>
          {/* Top Brand Bar */}
          <View style={styles.topBrandRow}>
            <View style={styles.brandBadge}>
              <Text style={styles.brandBadgeText}>م</Text>
            </View>
            <Text style={styles.brandName}>Mahallu ERP</Text>
            <TouchableOpacity
              onPress={() => router.push('/(auth)/login')}
              activeOpacity={0.7}
              style={styles.skipBtn}
            >
              <Text style={styles.skipText}>Sign In</Text>
            </TouchableOpacity>
          </View>

          {/* Hero Center Overlay Info */}
          <View style={styles.heroCenterContent}>
            <Animated.View key={`slide-${activeSlide}`} entering={FadeIn.duration(400)}>
              <View style={styles.tagPill}>
                <Text style={styles.tagText}>{slide.tag}</Text>
              </View>
              <Text style={styles.heroTitle}>{slide.title}</Text>
            </Animated.View>
          </View>

          {/* Slide Indicator Dots */}
          <View style={styles.dotsRow}>
            {SLIDES.map((_, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => setActiveSlide(i)}
                style={[styles.dot, activeSlide === i ? styles.dotActive : styles.dotInactive]}
              />
            ))}
          </View>
        </SafeAreaView>
      </View>

      {/* ── BOTTOM CONTENT SECTION (Editorial Modern Detailing) ── */}
      <SafeAreaView edges={['bottom']} style={styles.bottomSection}>
        <Animated.View
          key={`sub-${activeSlide}`}
          entering={FadeInDown.duration(350)}
          style={styles.subtitleContainer}
        >
          <Text style={styles.subtitleText}>{slide.subtitle}</Text>
        </Animated.View>

        {/* Feature Pills */}
        <View style={styles.featurePillsRow}>
          <View style={styles.featurePill}>
            <Ionicons name="shield-checkmark" size={14} color={colors.teal.base} />
            <Text style={styles.featurePillText}>Secure Portal</Text>
          </View>
          <View style={styles.featurePill}>
            <Ionicons name="flash" size={14} color={colors.gold.base} />
            <Text style={styles.featurePillText}>Instant Dues</Text>
          </View>
          <View style={styles.featurePill}>
            <Ionicons name="people" size={14} color={colors.blue.base} />
            <Text style={styles.featurePillText}>Family ID</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            onPress={() => router.push('/(auth)/login')}
            activeOpacity={0.85}
            style={styles.primaryBtn}
          >
            <LinearGradient
              colors={[colors.teal.darkest, colors.teal.dark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryBtnGradient}
            >
              <Text style={styles.primaryBtnText}>Get Started</Text>
              <Ionicons name="arrow-forward" size={18} color={colors.white} />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/(auth)/register-role')}
            activeOpacity={0.7}
            style={styles.secondaryBtn}
          >
            <Text style={styles.secondaryBtnText}>
              New to Mahallu? <Text style={styles.secondaryBtnBold}>Register Account</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  heroCard: {
    height: SCREEN_HEIGHT * 0.58,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    overflow: 'hidden',
    backgroundColor: colors.teal.darkest,
    ...shadows.elevated,
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  patternOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.08,
  },
  heroSafeArea: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  topBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  brandBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.gold.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandBadgeText: {
    fontSize: 20,
    color: colors.white,
    fontWeight: 'bold',
  },
  brandName: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
    flex: 1,
    marginLeft: 10,
  },
  skipBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  skipText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  heroCenterContent: {
    justifyContent: 'flex-end',
    marginBottom: 10,
  },
  tagPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(201,151,46,0.25)',
    borderWidth: 1,
    borderColor: 'rgba(201,151,46,0.4)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 12,
  },
  tagText: {
    color: colors.gold.light,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  heroTitle: {
    color: colors.white,
    fontSize: 34,
    fontWeight: '900',
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    width: 24,
    backgroundColor: colors.gold.base,
  },
  dotInactive: {
    width: 6,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  bottomSection: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    justifyContent: 'space-between',
  },
  subtitleContainer: {
    marginBottom: 12,
  },
  subtitleText: {
    fontSize: 14,
    color: colors.slate[500],
    lineHeight: 22,
    fontWeight: '500',
  },
  featurePillsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  featurePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.slate[50],
    borderWidth: 1,
    borderColor: colors.slate[200],
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  featurePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.slate[700],
  },
  actionButtons: {
    gap: 12,
    paddingBottom: 16,
  },
  primaryBtn: {
    borderRadius: radius.full,
    overflow: 'hidden',
    ...shadows.elevated,
  },
  primaryBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 8,
    borderRadius: radius.full,
  },
  primaryBtnText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  secondaryBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  secondaryBtnText: {
    color: colors.slate[500],
    fontSize: 14,
    fontWeight: '500',
  },
  secondaryBtnBold: {
    color: colors.teal.base,
    fontWeight: '800',
  },
});
