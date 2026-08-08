import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { apiClient } from '../../lib/api';

export default function ForgotPasswordScreen() {
  const router = useRouter();

  const [step, setStep] = useState<1 | 2>(1);
  const [tenantCode, setTenantCode] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Step 1: Send Forgot Password Request
  const handleRequestOTP = async () => {
    if (!tenantCode.trim() || !identifier.trim()) {
      setError('Please provide Mahallu Code and Email/Phone');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const response = await apiClient.post('/auth/forgot-password', {
        tenantCode: tenantCode.trim(),
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
        tenantCode: tenantCode.trim(),
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
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-slate-50"
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View className="flex-1 justify-center px-6 py-12">
          {/* Header */}
          <View className="items-center mb-8 mt-6">
            <View className="w-20 h-20 bg-emerald-500 rounded-3xl items-center justify-center mb-4 shadow-lg shadow-emerald-500/40">
              <Text className="text-white text-4xl font-bold">🔑</Text>
            </View>
            <Text className="text-slate-900 text-3xl font-extrabold tracking-tight">Forgot Password</Text>
            <Text className="text-slate-500 text-sm mt-2 font-medium text-center">
              {step === 1
                ? 'Enter your Mahallu Code & Email/Phone to receive a reset OTP'
                : 'Enter the 6-digit OTP code and set your new password'}
            </Text>
          </View>

          {/* Card */}
          <View className="bg-white border border-slate-100 p-8 rounded-3xl shadow-xl shadow-slate-200/50">
            {error ? (
              <View className="bg-rose-50 border border-rose-200 p-3 rounded-xl mb-5">
                <Text className="text-rose-600 text-xs font-semibold text-center">{error}</Text>
              </View>
            ) : null}

            {successMsg ? (
              <View className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl mb-5">
                <Text className="text-emerald-700 text-xs font-bold text-center">{successMsg}</Text>
              </View>
            ) : null}

            {step === 1 ? (
              <>
                {/* Mahallu Code */}
                <View className="mb-5">
                  <Text className="text-slate-600 text-xs font-bold mb-2 ml-1 uppercase tracking-wider">
                    Mahallu Code
                  </Text>
                  <TextInput
                    placeholder="e.g. JMM001"
                    placeholderTextColor="#94a3b8"
                    value={tenantCode}
                    onChangeText={setTenantCode}
                    autoCapitalize="characters"
                    className="bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl px-5 py-4 text-sm focus:border-emerald-500 focus:bg-white"
                  />
                </View>

                {/* Identifier */}
                <View className="mb-8">
                  <Text className="text-slate-600 text-xs font-bold mb-2 ml-1 uppercase tracking-wider">
                    Registered Email or Phone
                  </Text>
                  <TextInput
                    placeholder="e.g. parent@mahallu.app or 9876543210"
                    placeholderTextColor="#94a3b8"
                    value={identifier}
                    onChangeText={setIdentifier}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    className="bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl px-5 py-4 text-sm focus:border-emerald-500 focus:bg-white"
                  />
                </View>

                {/* Submit Step 1 */}
                <TouchableOpacity
                  onPress={handleRequestOTP}
                  disabled={loading}
                  className="bg-emerald-500 active:bg-emerald-600 rounded-2xl py-4 items-center shadow-lg shadow-emerald-500/30"
                >
                  {loading ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <Text className="text-white font-bold text-sm">Send Reset OTP</Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <>
                {/* OTP Code */}
                <View className="mb-5">
                  <Text className="text-slate-600 text-xs font-bold mb-2 ml-1 uppercase tracking-wider">
                    6-Digit OTP Code
                  </Text>
                  <TextInput
                    placeholder="123456"
                    placeholderTextColor="#94a3b8"
                    value={otp}
                    onChangeText={setOtp}
                    keyboardType="number-pad"
                    maxLength={6}
                    className="bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl px-5 py-4 text-center font-bold text-lg tracking-widest focus:border-emerald-500 focus:bg-white"
                  />
                </View>

                {/* New Password */}
                <View className="mb-5">
                  <Text className="text-slate-600 text-xs font-bold mb-2 ml-1 uppercase tracking-wider">
                    New Password
                  </Text>
                  <TextInput
                    placeholder="••••••••"
                    placeholderTextColor="#94a3b8"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry
                    autoCapitalize="none"
                    className="bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl px-5 py-4 text-sm focus:border-emerald-500 focus:bg-white"
                  />
                </View>

                {/* Confirm Password */}
                <View className="mb-8">
                  <Text className="text-slate-600 text-xs font-bold mb-2 ml-1 uppercase tracking-wider">
                    Confirm New Password
                  </Text>
                  <TextInput
                    placeholder="••••••••"
                    placeholderTextColor="#94a3b8"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                    autoCapitalize="none"
                    className="bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl px-5 py-4 text-sm focus:border-emerald-500 focus:bg-white"
                  />
                </View>

                {/* Submit Step 2 */}
                <TouchableOpacity
                  onPress={handleResetPassword}
                  disabled={loading}
                  className="bg-emerald-500 active:bg-emerald-600 rounded-2xl py-4 items-center shadow-lg shadow-emerald-500/30"
                >
                  {loading ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <Text className="text-white font-bold text-sm">Reset & Change Password</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setStep(1)}
                  className="mt-4 py-2 items-center"
                >
                  <Text className="text-slate-500 text-xs font-semibold">← Resend OTP / Change Details</Text>
                </TouchableOpacity>
              </>
            )}

            {/* Back to Login Link */}
            <View className="mt-8 flex-row justify-center items-center">
              <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
                <Text className="text-emerald-600 font-bold text-sm">← Back to Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
