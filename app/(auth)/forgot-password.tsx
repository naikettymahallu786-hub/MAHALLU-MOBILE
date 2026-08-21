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
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { apiClient } from '../../lib/api';
import { colors, gradients, shadows, radius } from '../../lib/theme';

export default function ForgotPasswordScreen() {
  const router = useRouter();

  const [step, setStep] = useState<1 | 2>(1);
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const identifierRef = useRef<TextInput>(null);
  const otpRef = useRef<TextInput>(null);
  const newPassRef = useRef<TextInput>(null);
  const confirmPassRef = useRef<TextInput>(null);

  // Step 1: Send Forgot Password Request
  const handleRequestOTP = async () => {
    if (!identifier.trim()) {
      setError('Please provide your registered Email or Phone');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const response = await apiClient.post('/auth/forgot-password', {
        identifier: identifier.trim(),
      });

      const data = response.data;
      if (data.data?.otp) {
        setOtp(data.data.otp);
        setSuccessMsg(`OTP Code generated: ${data.data.otp}`);
      } else {
        setSuccessMsg(data.message || 'OTP has been sent to your email/phone.');
      }

      setStep(2);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to request OTP. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Reset Password
  const handleResetPassword = async () => {
    if (!otp.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      setError('Please fill in all fields');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await apiClient.post('/auth/reset-password', {
        identifier: identifier.trim(),
        otp: otp.trim(),
        newPassword: newPassword.trim(),
      });

      Alert.alert(
        'Success! 🎉',
        response.data.message || 'Password reset successfully! Please sign in with your new password.',
        [
          {
            text: 'Sign In Now',
            onPress: () => router.replace('/(auth)/login'),
          },
        ]
      );
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reset password. Please check your OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

        {/* ── TOP HERO HEADER ── */}
        <LinearGradient
          colors={gradients.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <Image
            source={require('../../assets/images/mosque_bg.png')}
            style={styles.headerBgImage}
            resizeMode="cover"
          />
          <Image
            source={require('../../assets/images/islamic_pattern.jpg')}
            style={styles.patternOverlay}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['rgba(6,46,40,0.5)', 'rgba(6,46,40,0.92)']}
            style={StyleSheet.absoluteFill}
          />

          <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
            <View style={styles.topNavRow}>
              <TouchableOpacity
                onPress={() => (step === 2 ? setStep(1) : router.back())}
                style={styles.backBtn}
                activeOpacity={0.7}
              >
                <Ionicons name="arrow-back" size={22} color={colors.white} />
              </TouchableOpacity>
              <View style={styles.headerBrandBadge}>
                <Ionicons name="key" size={20} color={colors.white} />
              </View>
              <View style={{ width: 42 }} />
            </View>

            <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.headerTitles}>
              <Text style={styles.headerMainTitle}>
                {step === 1 ? 'Forgot Password' : 'Reset Password'}
              </Text>
              <Text style={styles.headerSubTitle}>
                {step === 1
                  ? 'Enter your registered details to receive OTP'
                  : 'Enter verification OTP & your new password'}
              </Text>
            </Animated.View>
          </SafeAreaView>
        </LinearGradient>

        {/* ── FORM CARD ── */}
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
              <LinearGradient
                colors={[colors.gold.base, colors.gold.light]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.cardGoldAccent}
              />

              <Text style={styles.cardHeading}>
                {step === 1 ? 'Step 1: Verification' : 'Step 2: New Password'}
              </Text>

              {error ? (
                <Animated.View entering={FadeIn.duration(250)} style={styles.errorBox}>
                  <Ionicons name="alert-circle" size={18} color={colors.error} />
                  <Text style={styles.errorText}>{error}</Text>
                </Animated.View>
              ) : null}

              {successMsg ? (
                <Animated.View entering={FadeIn.duration(250)} style={styles.successBox}>
                  <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                  <Text style={styles.successText}>{successMsg}</Text>
                </Animated.View>
              ) : null}

              {step === 1 ? (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>REGISTERED EMAIL OR PHONE</Text>
                    <TouchableOpacity
                      activeOpacity={1}
                      onPress={() => identifierRef.current?.focus()}
                      style={[
                        styles.inputBox,
                        focusedField === 'identifier' && styles.inputBoxFocused,
                      ]}
                    >
                      <Ionicons
                        name="mail"
                        size={18}
                        color={focusedField === 'identifier' ? colors.teal.base : colors.slate[400]}
                        style={{ marginRight: 10 }}
                      />
                      <TextInput
                        ref={identifierRef}
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
                        returnKeyType="done"
                        onSubmitEditing={handleRequestOTP}
                      />
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    onPress={handleRequestOTP}
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
                          <Text style={styles.submitBtnText}>Send Reset OTP</Text>
                          <Ionicons name="arrow-forward" size={18} color={colors.white} />
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  {/* OTP Code */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>6-DIGIT VERIFICATION CODE</Text>
                    <TouchableOpacity
                      activeOpacity={1}
                      onPress={() => otpRef.current?.focus()}
                      style={[
                        styles.inputBox,
                        focusedField === 'otp' && styles.inputBoxFocused,
                      ]}
                    >
                      <Ionicons
                        name="shield-checkmark"
                        size={18}
                        color={focusedField === 'otp' ? colors.teal.base : colors.slate[400]}
                        style={{ marginRight: 10 }}
                      />
                      <TextInput
                        ref={otpRef}
                        placeholder="123456"
                        placeholderTextColor={colors.slate[400]}
                        value={otp}
                        onChangeText={(text) => {
                          setOtp(text);
                          if (error) setError('');
                        }}
                        keyboardType="number-pad"
                        maxLength={6}
                        style={[styles.actualInput, { letterSpacing: 4, fontWeight: '800' }]}
                        onFocus={() => setFocusedField('otp')}
                        onBlur={() => setFocusedField(null)}
                        returnKeyType="next"
                        onSubmitEditing={() => newPassRef.current?.focus()}
                      />
                    </TouchableOpacity>
                  </View>

                  {/* New Password */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>NEW PASSWORD</Text>
                    <TouchableOpacity
                      activeOpacity={1}
                      onPress={() => newPassRef.current?.focus()}
                      style={[
                        styles.inputBox,
                        focusedField === 'newPass' && styles.inputBoxFocused,
                      ]}
                    >
                      <Ionicons
                        name="lock-closed"
                        size={18}
                        color={focusedField === 'newPass' ? colors.teal.base : colors.slate[400]}
                        style={{ marginRight: 10 }}
                      />
                      <TextInput
                        ref={newPassRef}
                        placeholder="••••••••"
                        placeholderTextColor={colors.slate[400]}
                        value={newPassword}
                        onChangeText={(text) => {
                          setNewPassword(text);
                          if (error) setError('');
                        }}
                        secureTextEntry={!showNewPassword}
                        autoCapitalize="none"
                        style={styles.actualInput}
                        onFocus={() => setFocusedField('newPass')}
                        onBlur={() => setFocusedField(null)}
                        returnKeyType="next"
                        onSubmitEditing={() => confirmPassRef.current?.focus()}
                      />
                      <TouchableOpacity
                        onPress={() => setShowNewPassword(!showNewPassword)}
                        style={styles.eyeBtn}
                        hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                      >
                        <Ionicons
                          name={showNewPassword ? 'eye-off' : 'eye'}
                          size={20}
                          color={colors.slate[500]}
                        />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  </View>

                  {/* Confirm Password */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>CONFIRM NEW PASSWORD</Text>
                    <TouchableOpacity
                      activeOpacity={1}
                      onPress={() => confirmPassRef.current?.focus()}
                      style={[
                        styles.inputBox,
                        focusedField === 'confirmPass' && styles.inputBoxFocused,
                      ]}
                    >
                      <Ionicons
                        name="lock-closed"
                        size={18}
                        color={focusedField === 'confirmPass' ? colors.teal.base : colors.slate[400]}
                        style={{ marginRight: 10 }}
                      />
                      <TextInput
                        ref={confirmPassRef}
                        placeholder="••••••••"
                        placeholderTextColor={colors.slate[400]}
                        value={confirmPassword}
                        onChangeText={(text) => {
                          setConfirmPassword(text);
                          if (error) setError('');
                        }}
                        secureTextEntry={!showConfirmPassword}
                        autoCapitalize="none"
                        style={styles.actualInput}
                        onFocus={() => setFocusedField('confirmPass')}
                        onBlur={() => setFocusedField(null)}
                        returnKeyType="done"
                        onSubmitEditing={handleResetPassword}
                      />
                      <TouchableOpacity
                        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                        style={styles.eyeBtn}
                        hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                      >
                        <Ionicons
                          name={showConfirmPassword ? 'eye-off' : 'eye'}
                          size={20}
                          color={colors.slate[500]}
                        />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    onPress={handleResetPassword}
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
                          <Text style={styles.submitBtnText}>Reset & Save Password</Text>
                          <Ionicons name="checkmark-circle" size={18} color={colors.white} />
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              )}

              {/* Back to sign in link */}
              <View style={styles.registerRow}>
                <TouchableOpacity
                  onPress={() => router.replace('/(auth)/login')}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={styles.registerLink}>← Back to Sign In</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
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
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.successBg,
    borderWidth: 1,
    borderColor: `${colors.success}25`,
    padding: 12,
    borderRadius: radius.md,
    marginBottom: 16,
  },
  successText: {
    color: colors.success,
    fontSize: 12,
    fontWeight: '700',
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
  registerLink: {
    color: colors.teal.base,
    fontSize: 14,
    fontWeight: '800',
  },
});
