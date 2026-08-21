import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Platform, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { colors, gradients, shadows, radius } from '../../lib/theme';

const ROLES = [
  {
    id: 'MEMBER',
    title: 'Family Head / Member',
    description: 'Register your family to access services, pay donations, and stay connected.',
    icon: 'home' as const,
    gradient: [colors.blue.base, '#2563EB'] as const,
    accentBg: colors.blue.bg,
  },
  {
    id: 'TEACHER',
    title: 'Ustad / Teacher',
    description: 'Manage classes, mark attendance, and track student progress with ease.',
    icon: 'book' as const,
    gradient: [colors.teal.base, colors.teal.dark] as const,
    accentBg: colors.teal.lighter,
  },
  {
    id: 'SADAR_MUALIM',
    title: 'Sadar Mualim / Headmaster',
    description: 'Oversee students, classes, and assign students to families.',
    icon: 'briefcase' as const,
    gradient: [colors.gold.base, colors.gold.dark] as const,
    accentBg: colors.gold.lighter,
  },
];

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

function RoleCard({
  role,
  index,
  isSelected,
  onPress,
}: {
  role: (typeof ROLES)[0];
  index: number;
  isSelected: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View entering={FadeInDown.delay(200 + index * 120).springify().damping(16)}>
      <AnimatedTouchable
        onPress={() => {
          scale.value = withSpring(0.96, { damping: 10, stiffness: 300 }, () => {
            scale.value = withSpring(1, { damping: 12, stiffness: 200 });
          });
          onPress();
        }}
        activeOpacity={1}
        style={[
          styles.roleCard,
          isSelected && styles.roleCardSelected,
          animatedStyle,
        ]}
      >
        {/* Gradient icon */}
        <LinearGradient
          colors={role.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.roleIcon}
        >
          <Ionicons name={role.icon} size={26} color={colors.white} />
        </LinearGradient>

        <View style={styles.roleContent}>
          <Text style={styles.roleTitle}>{role.title}</Text>
          <Text style={styles.roleDesc}>{role.description}</Text>
        </View>

        <View style={[styles.radioOuter, isSelected && styles.radioOuterActive]}>
          {isSelected && <View style={styles.radioInner} />}
        </View>

        {/* Decorative accent */}
        <View style={[styles.cardAccent, { backgroundColor: role.accentBg }]} />
      </AnimatedTouchable>
    </Animated.View>
  );
}

export default function RegisterRoleScreen() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const handleContinue = () => {
    if (!selectedRole) return;
    router.push({ pathname: '/(auth)/register-form', params: { role: selectedRole } });
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={gradients.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Image
          source={require('../../assets/images/islamic_pattern.jpg')}
          style={styles.patternOverlay}
          resizeMode="cover"
        />
        <SafeAreaView edges={['top']}>
          <Animated.View entering={FadeIn.delay(100)} style={styles.headerInner}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={22} color={colors.white} />
            </TouchableOpacity>
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(150).springify()} style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Choose Your Role</Text>
            <Text style={styles.headerSubtitle}>Select the account type that best describes you</Text>
          </Animated.View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress indicator */}
        <Animated.View entering={FadeInDown.delay(150).springify()} style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: '33%' }]} />
          </View>
          <Text style={styles.progressText}>Step 1 of 3</Text>
        </Animated.View>

        <View style={styles.rolesContainer}>
          {ROLES.map((role, i) => (
            <RoleCard
              key={role.id}
              role={role}
              index={i}
              isSelected={selectedRole === role.id}
              onPress={() => setSelectedRole(role.id)}
            />
          ))}
        </View>
      </ScrollView>

      {/* Continue button */}
      <Animated.View entering={FadeInDown.delay(600).springify()} style={styles.bottomContainer}>
        <TouchableOpacity
          onPress={handleContinue}
          disabled={!selectedRole}
          activeOpacity={0.85}
          style={[styles.continueOuter, !selectedRole && styles.continueDisabled]}
        >
          <LinearGradient
            colors={selectedRole ? [colors.teal.dark, colors.teal.base] : [colors.slate[300], colors.slate[300]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.continueButton}
          >
            <Text style={styles.continueText}>Continue</Text>
            <Ionicons name="arrow-forward" size={18} color={colors.white} />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  header: {
    paddingBottom: 32,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
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
  headerInner: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  headerTitle: {
    color: colors.white,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    color: `${colors.gold.light}80`,
    fontSize: 14,
    fontWeight: '500',
    marginTop: 6,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 24,
    marginBottom: 24,
  },
  progressTrack: {
    flex: 1,
    height: 4,
    backgroundColor: colors.slate[200],
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.teal.base,
    borderRadius: 2,
  },
  progressText: {
    color: colors.slate[500],
    fontSize: 12,
    fontWeight: '700',
  },
  rolesContainer: {
    gap: 14,
  },
  roleCard: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.slate[100],
    borderRadius: radius.xl,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    overflow: 'hidden',
    ...shadows.card,
  },
  roleCardSelected: {
    borderColor: colors.teal.base,
    backgroundColor: `${colors.teal.base}04`,
  },
  roleIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleContent: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.slate[900],
    marginBottom: 4,
  },
  roleDesc: {
    fontSize: 12,
    color: colors.slate[500],
    lineHeight: 18,
    fontWeight: '500',
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.slate[300],
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterActive: {
    borderColor: colors.teal.base,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.teal.base,
  },
  cardAccent: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 80,
    height: 80,
    borderRadius: 40,
    opacity: 0.5,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    paddingTop: 12,
    backgroundColor: colors.cream,
  },
  continueOuter: {
    borderRadius: radius.md,
    overflow: 'hidden',
    ...shadows.glow,
  },
  continueDisabled: {
    opacity: 0.5,
    ...shadows.card,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 17,
    gap: 8,
    borderRadius: radius.md,
  },
  continueText: {
    color: colors.white,
    fontWeight: '800',
    fontSize: 16,
  },
});
