import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  StatusBar,
  Image,
  TouchableWithoutFeedback,
  Keyboard,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useAuthStore } from '../../store/auth.store';
import { apiClient } from '../../lib/api';
import { colors, gradients, shadows, radius } from '../../lib/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function LoginScreen() {
  const router = useRouter();
  const loginStore = useAuthStore();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [focusedField, setFocusedField] = useState<'identifier' | 'password' | null>(null);

  const identifierInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);

  const handleLogin = async () => {
    if (!identifier || !password) {
      setError('Please enter your email/phone and password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await apiClient.post('/auth/login', {
        identifier: identifier.trim(),
        password,
      });

      const { user, tokens } = response.data.data;
      loginStore.login(user, tokens);

      switch (user.role) {
        case 'ustadh':
        case 'parent':
        case 'sadar_mualim':
          router.replace('/(member)/home');
          break;
        case 'student':
          router.replace('/(student)/home');
          break;
        default:
          router.replace('/(admin)/home');
          break;
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid credentials or connection error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

        {/* ── TOP HERO HEADER (Signature Deep Teal & Mosque Arch) ── */}
        <LinearGradient
          colors={gradients.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          {/* Mosque background watermark */}
          <Image
            source={require('../../assets/images/mosque_bg.png')}
            style={styles.headerBgImage}
            resizeMode="cover"
          />

          {/* Islamic pattern overlay */}
          <Image
            source={require('../../assets/images/islamic_pattern.jpg')}
            style={styles.patternOverlay}
            resizeMode="cover"
          />

          {/* Dark Gradient Overlay */}
          <LinearGradient
            colors={['rgba(6,46,40,0.5)', 'rgba(6,46,40,0.92)']}
            style={StyleSheet.absoluteFill}
          />

          <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
            {/* Top Bar with Back Button */}
            <View style={styles.topNavRow}>
              <TouchableOpacity
                onPress={() => router.back()}
                style={styles.backBtn}
                activeOpacity={0.7}
              >
                <Ionicons name="arrow-back" size={22} color={colors.white} />
              </TouchableOpacity>
              <View style={styles.headerBrandBadge}>
                <Text style={styles.headerBrandText}>م</Text>
              </View>
              <View style={{ width: 42 }} />
            </View>

            {/* Header Titles */}
            <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.headerTitles}>
              <Text style={styles.headerMainTitle}>Welcome Back</Text>
              <Text style={styles.headerSubTitle}>Sign in to your Mahallu ERP account</Text>
            </Animated.View>
          </SafeAreaView>
        </LinearGradient>

        {/* ── FLOATING FORM CARD ── */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.formContainer}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="always"
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <Animated.View entering={FadeInDown.delay(180).springify()} style={styles.formCard}>
              {/* Gold Top Accent Line */}
              <LinearGradient
                colors={[colors.gold.base, colors.gold.light]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.cardGoldAccent}
              />

              <Text style={styles.cardHeading}>Account Login</Text>

              {error ? (
                <Animated.View entering={FadeIn.duration(250)} style={styles.errorBox}>
                  <Ionicons name="alert-circle" size={18} color={colors.error} />
                  <Text style={styles.errorText}>{error}</Text>
                </Animated.View>
              ) : null}

              {/* ── IDENTIFIER INPUT ── */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>EMAIL OR PHONE NUMBER</Text>
                <TouchableOpacity
                  activeOpacity={1}
                  onPress={() => identifierInputRef.current?.focus()}
                  style={[
                    styles.inputBox,
                    focusedField === 'identifier' && styles.inputBoxFocused,
                  ]}
                >
                  <View style={styles.inputIconContainer}>
                    <Ionicons
                      name="person"
                      size={18}
                      color={focusedField === 'identifier' ? colors.teal.base : colors.slate[400]}
                    />
                  </View>
                  <TextInput
                    ref={identifierInputRef}
                    placeholder="e.g. 9876543210 or user@mahallu.app"
                    placeholderTextColor={colors.slate[400]}
                    value={identifier}
                    onChangeText={(text) => {
                      setIdentifier(text);
                      if (error) setError('');
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={styles.actualInput}
                    onFocus={() => setFocusedField('identifier')}
                    onBlur={() => setFocusedField(null)}
                    returnKeyType="next"
                    onSubmitEditing={() => passwordInputRef.current?.focus()}
                  />
                </TouchableOpacity>
              </View>

              {/* ── PASSWORD INPUT ── */}
              <View style={styles.inputGroup}>
                <View style={styles.passwordLabelRow}>
                  <Text style={styles.inputLabel}>PASSWORD</Text>
                  <TouchableOpacity
                    onPress={() => router.push('/(auth)/forgot-password')}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  activeOpacity={1}
                  onPress={() => passwordInputRef.current?.focus()}
                  style={[
                    styles.inputBox,
                    focusedField === 'password' && styles.inputBoxFocused,
                  ]}
                >
                  <View style={styles.inputIconContainer}>
                    <Ionicons
                      name="lock-closed"
                      size={18}
                      color={focusedField === 'password' ? colors.teal.base : colors.slate[400]}
                    />
                  </View>
                  <TextInput
                    ref={passwordInputRef}
                    placeholder="Enter your password"
                    placeholderTextColor={colors.slate[400]}
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      if (error) setError('');
                    }}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={styles.actualInput}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    returnKeyType="done"
                    onSubmitEditing={handleLogin}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeBtn}
                    hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off' : 'eye'}
                      size={20}
                      color={colors.slate[500]}
                    />
                  </TouchableOpacity>
                </TouchableOpacity>
              </View>

              {/* ── SIGN IN BUTTON ── */}
              <TouchableOpacity
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.85}
                style={styles.submitBtnOuter}
              >
                <LinearGradient
                  colors={[colors.teal.darkest, colors.teal.dark, colors.teal.base]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.submitBtnGradient}
                >
                  {loading ? (
                    <ActivityIndicator color={colors.white} size="small" />
                  ) : (
                    <>
                      <Text style={styles.submitBtnText}>Sign In</Text>
                      <Ionicons name="arrow-forward" size={18} color={colors.white} />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Register link */}
              <View style={styles.registerRow}>
                <Text style={styles.registerPrompt}>Don't have an account? </Text>
                <TouchableOpacity
                  onPress={() => router.push('/(auth)/register-role')}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={styles.registerLink}>Register here</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>

            {/* Quick Demo Hint */}
            <View style={styles.demoHintBox}>
              <Ionicons name="information-circle-outline" size={16} color={colors.slate[400]} />
              <Text style={styles.demoHintText}>
                Default admin: <Text style={{ fontWeight: '700' }}>admin@mahallu.app</Text>
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    paddingBottom: 48,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    overflow: 'hidden',
    position: 'relative',
  },
  headerBgImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    opacity: 0.25,
  },
  patternOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.08,
  },
  headerSafeArea: {
    paddingHorizontal: 22,
    paddingTop: 8,
  },
  topNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBrandBadge: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: colors.gold.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBrandText: {
    color: colors.white,
    fontSize: 22,
    fontWeight: 'bold',
  },
  headerTitles: {
    alignItems: 'center',
    paddingBottom: 10,
  },
  headerMainTitle: {
    color: colors.white,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  headerSubTitle: {
    color: colors.gold.light,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
    opacity: 0.9,
  },
  formContainer: {
    flex: 1,
    marginTop: -32,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  formCard: {
    backgroundColor: colors.white,
    borderRadius: 28,
    padding: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(15,107,92,0.08)',
    ...shadows.elevated,
  },
  cardGoldAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  cardHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.slate[900],
    marginBottom: 20,
    letterSpacing: -0.2,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.errorBg,
    borderWidth: 1,
    borderColor: `${colors.error}25`,
    padding: 12,
    borderRadius: radius.md,
    marginBottom: 16,
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  inputGroup: {
    marginBottom: 18,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.slate[600],
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 2,
  },
  passwordLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  forgotPasswordText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.teal.base,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.slate[50],
    borderWidth: 1.5,
    borderColor: colors.slate[200],
    borderRadius: radius.lg,
    paddingHorizontal: 14,
    height: 56,
  },
  inputBoxFocused: {
    borderColor: colors.teal.base,
    backgroundColor: colors.white,
    ...shadows.card,
  },
  inputIconContainer: {
    marginRight: 10,
  },
  actualInput: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    fontWeight: '600',
    color: colors.slate[900],
    paddingVertical: 0,
  },
  eyeBtn: {
    padding: 6,
  },
  submitBtnOuter: {
    borderRadius: radius.full,
    overflow: 'hidden',
    marginTop: 8,
    ...shadows.elevated,
  },
  submitBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 17,
    gap: 8,
    borderRadius: radius.full,
  },
  submitBtnText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
  },
  registerPrompt: {
    color: colors.slate[500],
    fontSize: 14,
    fontWeight: '500',
  },
  registerLink: {
    color: colors.teal.base,
    fontSize: 14,
    fontWeight: '800',
  },
  demoHintBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 18,
  },
  demoHintText: {
    fontSize: 12,
    color: colors.slate[400],
  },
});
