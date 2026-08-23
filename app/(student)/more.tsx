import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/auth.store';
import { useStudentProfile } from '../../lib/hooks/useStudentData';
import { Avatar } from '../../components/ui/Avatar';
import { Card } from '../../components/ui/Card';
import { apiClient } from '../../lib/api';

export default function StudentMoreScreen() {
  const router = useRouter();
  const { logout } = useAuthStore();
  const { data: profile } = useStudentProfile();

  // Modals
  const [activeModal, setActiveModal] = useState<'password' | 'certificates' | 'theme' | null>(null);

  // Change Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // Selected Theme
  const [selectedTheme, setSelectedTheme] = useState<'light' | 'dark' | 'system'>('light');

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => {
          logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Please fill in all password fields');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    setPasswordLoading(true);
    setPasswordError('');
    setPasswordSuccess('');

    try {
      await apiClient.post('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      setPasswordSuccess('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setActiveModal(null);
        setPasswordSuccess('');
      }, 1500);
    } catch (err: any) {
      setPasswordError(err.response?.data?.message || 'Failed to change password. Please check your current password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const menuSections = [
    {
      title: 'Academics',
      items: [
        {
          icon: 'book-outline',
          label: 'Hifz & Quran Progress',
          action: () => router.push('/(student)/academics'),
        },
        {
          icon: 'document-text-outline',
          label: 'Certificates & Awards',
          action: () => setActiveModal('certificates'),
        },
      ],
    },
    {
      title: 'Settings',
      items: [
        {
          icon: 'lock-closed-outline',
          label: 'Change Password',
          action: () => setActiveModal('password'),
        },
        {
          icon: 'color-palette-outline',
          label: 'Theme',
          action: () => setActiveModal('theme'),
          value: selectedTheme === 'light' ? 'Light' : selectedTheme === 'dark' ? 'Dark' : 'System',
        },
      ],
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      <View className="px-5 pt-2 pb-4 border-b border-slate-200 bg-white">
        <Text className="text-slate-900 text-2xl font-extrabold">Profile</Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="p-5">
          {/* Digital ID Card */}
          <View className="mb-8">
            <Text className="text-slate-800 text-sm font-bold mb-3 uppercase tracking-wider">Digital ID Card</Text>
            <Card className="bg-white border border-slate-200 p-0 overflow-hidden shadow-md shadow-slate-200">
              <View className="bg-emerald-500 px-4 py-2 flex-row justify-between items-center">
                <Text className="text-white text-[10px] font-bold tracking-wider uppercase">Student ID</Text>
                <Text className="text-emerald-100 text-[10px] font-bold">{profile?.madrasaId?.name || 'Madrasa'}</Text>
              </View>

              <View className="p-5 flex-row bg-gradient-to-br from-emerald-50 to-white">
                <Avatar
                  uri={profile?.memberId?.photo?.url}
                  name={profile?.memberId?.name || 'Student'}
                  size={72}
                  bgColor="bg-emerald-100"
                />
                <View className="ml-4 flex-1 justify-center">
                  <Text className="text-slate-800 text-lg font-bold mb-1">{profile?.memberId?.name}</Text>

                  <View className="flex-row items-center mb-1">
                    <Text className="text-slate-500 text-[10px] w-14 font-bold uppercase">Adm No:</Text>
                    <Text className="text-emerald-600 font-extrabold text-xs">{profile?.admissionNo}</Text>
                  </View>
                  <View className="flex-row items-center mb-1">
                    <Text className="text-slate-500 text-[10px] w-14 font-bold uppercase">Class:</Text>
                    <Text className="text-slate-700 font-bold text-xs">{profile?.classId?.name}</Text>
                  </View>
                  <View className="flex-row items-center">
                    <Text className="text-slate-500 text-[10px] w-14 font-bold uppercase">Guardian:</Text>
                    <Text className="text-slate-600 text-[10px] font-bold" numberOfLines={1}>
                      {profile?.guardianId?.name}
                    </Text>
                  </View>
                </View>
              </View>
            </Card>
          </View>

          {/* Menu Sections */}
          {menuSections.map((section, idx) => (
            <View key={idx} className="mb-6">
              <Text className="text-slate-500 text-xs font-bold mb-2 uppercase tracking-wider">{section.title}</Text>
              <View className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm shadow-slate-200">
                {section.items.map((item, i) => (
                  <TouchableOpacity
                    key={i}
                    className={`flex-row items-center p-4 ${i !== section.items.length - 1 ? 'border-b border-slate-100' : ''}`}
                    activeOpacity={0.7}
                    onPress={item.action}
                  >
                    <Ionicons name={item.icon as any} size={22} color="#64748b" />
                    <Text className="text-slate-800 text-base font-medium ml-3 flex-1">{item.label}</Text>
                    {item.value && <Text className="text-slate-400 text-sm mr-2">{item.value}</Text>}
                    <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}

          {/* Logout Button */}
          <TouchableOpacity
            className="bg-white border border-rose-100 py-4 rounded-2xl items-center flex-row justify-center mt-2 mb-8 shadow-sm shadow-slate-200"
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <Ionicons name="log-out-outline" size={20} color="#e11d48" />
            <Text className="text-rose-600 font-bold text-base ml-2">Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 1. CHANGE PASSWORD MODAL */}
      {/* ─────────────────────────────────────────────────────────── */}
      <Modal visible={activeModal === 'password'} animationType="slide" transparent>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6">
            <View className="flex-row justify-between items-center pb-4 border-b border-slate-100">
              <Text className="text-slate-900 text-xl font-bold">Change Password</Text>
              <TouchableOpacity
                onPress={() => {
                  setActiveModal(null);
                  setPasswordError('');
                  setPasswordSuccess('');
                }}
                className="p-1"
              >
                <Ionicons name="close-circle" size={26} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <ScrollView className="mt-4" keyboardShouldPersistTaps="handled">
              {passwordError ? (
                <View className="bg-rose-50 border border-rose-200 p-3 rounded-xl mb-4">
                  <Text className="text-rose-600 text-xs font-semibold text-center">{passwordError}</Text>
                </View>
              ) : null}

              {passwordSuccess ? (
                <View className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl mb-4">
                  <Text className="text-emerald-700 text-xs font-semibold text-center">{passwordSuccess}</Text>
                </View>
              ) : null}

              {/* Current Password */}
              <View className="mb-4">
                <Text className="text-slate-600 text-xs font-bold mb-1.5 uppercase">Current Password</Text>
                <View className="relative justify-center">
                  <TextInput
                    placeholder="Enter current password"
                    placeholderTextColor="#94a3b8"
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    secureTextEntry={!showCurrentPw}
                    autoCapitalize="none"
                    className="bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl px-4 py-3.5 pr-12 text-sm focus:border-emerald-500"
                  />
                  <TouchableOpacity
                    onPress={() => setShowCurrentPw(!showCurrentPw)}
                    className="absolute right-4 p-1"
                  >
                    <Ionicons name={showCurrentPw ? 'eye-off-outline' : 'eye-outline'} size={18} color="#64748b" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* New Password */}
              <View className="mb-4">
                <Text className="text-slate-600 text-xs font-bold mb-1.5 uppercase">New Password</Text>
                <View className="relative justify-center">
                  <TextInput
                    placeholder="Enter new password (min 6 chars)"
                    placeholderTextColor="#94a3b8"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry={!showNewPw}
                    autoCapitalize="none"
                    className="bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl px-4 py-3.5 pr-12 text-sm focus:border-emerald-500"
                  />
                  <TouchableOpacity
                    onPress={() => setShowNewPw(!showNewPw)}
                    className="absolute right-4 p-1"
                  >
                    <Ionicons name={showNewPw ? 'eye-off-outline' : 'eye-outline'} size={18} color="#64748b" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Confirm Password */}
              <View className="mb-6">
                <Text className="text-slate-600 text-xs font-bold mb-1.5 uppercase">Confirm New Password</Text>
                <View className="relative justify-center">
                  <TextInput
                    placeholder="Re-enter new password"
                    placeholderTextColor="#94a3b8"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPw}
                    autoCapitalize="none"
                    className="bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl px-4 py-3.5 pr-12 text-sm focus:border-emerald-500"
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPw(!showConfirmPw)}
                    className="absolute right-4 p-1"
                  >
                    <Ionicons name={showConfirmPw ? 'eye-off-outline' : 'eye-outline'} size={18} color="#64748b" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                onPress={handleChangePassword}
                disabled={passwordLoading}
                className="bg-emerald-500 py-4 rounded-2xl items-center shadow-lg shadow-emerald-500/20 mb-6"
              >
                {passwordLoading ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text className="text-white font-bold text-sm">Update Password</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 2. CERTIFICATES MODAL */}
      {/* ─────────────────────────────────────────────────────────── */}
      <Modal visible={activeModal === 'certificates'} animationType="slide" transparent>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6 max-h-[80%]">
            <View className="flex-row justify-between items-center pb-4 border-b border-slate-100">
              <Text className="text-slate-900 text-xl font-bold">Certificates & Awards</Text>
              <TouchableOpacity onPress={() => setActiveModal(null)} className="p-1">
                <Ionicons name="close-circle" size={26} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <ScrollView className="mt-4" showsVerticalScrollIndicator={false}>
              <View className="items-center py-8">
                <View className="w-16 h-16 rounded-full bg-emerald-50 items-center justify-center mb-3">
                  <Ionicons name="ribbon-outline" size={32} color="#10b981" />
                </View>
                <Text className="text-slate-800 text-base font-bold">Academic Certificates</Text>
                <Text className="text-slate-500 text-xs text-center mt-1 px-4 leading-relaxed">
                  End-of-term academic certificates and Hifz completion awards issued by the Sadar Mualim will appear here.
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => setActiveModal(null)}
                className="bg-emerald-500 py-3.5 rounded-2xl items-center mb-6"
              >
                <Text className="text-white font-bold text-sm">Done</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 3. THEME MODAL */}
      {/* ─────────────────────────────────────────────────────────── */}
      <Modal visible={activeModal === 'theme'} animationType="slide" transparent>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6">
            <View className="flex-row justify-between items-center pb-4 border-b border-slate-100">
              <Text className="text-slate-900 text-xl font-bold">Theme</Text>
              <TouchableOpacity onPress={() => setActiveModal(null)} className="p-1">
                <Ionicons name="close-circle" size={26} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <View className="mt-4 space-y-3">
              {[
                { id: 'light', title: 'Light Mode', subtitle: 'Clean and bright appearance' },
                { id: 'dark', title: 'Dark Mode', subtitle: 'Coming soon in next release' },
                { id: 'system', title: 'System Default', subtitle: 'Matches your device display settings' },
              ].map((item) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => {
                    setSelectedTheme(item.id as any);
                    setActiveModal(null);
                  }}
                  className={`flex-row items-center justify-between p-4 rounded-2xl border ${
                    selectedTheme === item.id ? 'bg-emerald-50/60 border-emerald-500' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <View>
                    <Text className="text-slate-900 font-bold text-base">{item.title}</Text>
                    <Text className="text-slate-500 text-xs">{item.subtitle}</Text>
                  </View>
                  {selectedTheme === item.id && <Ionicons name="checkmark-circle" size={24} color="#10b981" />}
                </TouchableOpacity>
              ))}
            </View>

            <View className="mt-6 mb-4" />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
