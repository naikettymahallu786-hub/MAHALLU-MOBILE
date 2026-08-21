import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  Switch,
  ActivityIndicator,
  StyleSheet,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAuthStore } from '../../store/auth.store';
import { useProfile } from '../../lib/hooks/useProfile';
import { Avatar } from '../../components/ui/Avatar';
import { useLanguageStore } from '../../lib/store/languageStore';
import { t } from '../../lib/i18n';
import { apiClient } from '../../lib/api';
import { colors, gradients, shadows, radius } from '../../lib/theme';

export default function MoreScreen() {
  const router = useRouter();
  const { language, setLanguage } = useLanguageStore();
  const { logout, user } = useAuthStore();
  const { data: profileData, refetch: refetchProfile } = useProfile();

  // Modal States
  const [activeModal, setActiveModal] = useState<
    'profile' | 'password' | 'notifications' | 'language' | 'theme' | 'faq' | 'terms' | null
  >(null);

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

  // Notification Preferences State
  const [notifSettings, setNotifSettings] = useState({
    push: true,
    azan: true,
    events: true,
    madrasa: true,
    receipts: true,
  });

  // Selected Theme
  const [selectedTheme, setSelectedTheme] = useState<'light' | 'dark' | 'system'>('light');

  // FAQ Accordion State
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const handleLogout = () => {
    Alert.alert(t('signOut', language), t('signOutConfirm', language), [
      { text: t('cancel', language), style: 'cancel' },
      {
        text: t('signOut', language),
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

  const faqItems = [
    {
      q: 'How do I pay my Mahallu monthly dues online?',
      a: 'Navigate to the Payments tab from the bottom menu, tap "Pay Total Outstanding Balance" or select an individual pending due, and pay securely via UPI, Card, or Net Banking.',
    },
    {
      q: 'How can I view my children\'s Madrasa attendance and results?',
      a: 'Go to the Home tab and tap "Students / Children" or open the Madrasa Portal to view attendance records, exam marks, and teacher remarks.',
    },
    {
      q: 'How do I request a Nikah, Death, or Residence Certificate?',
      a: 'From the Services tab, tap "Certificates" to select the required certificate type, fill in the applicant details, and submit your request for Admin approval.',
    },
    {
      q: 'How do I update family member details?',
      a: 'Go to the Family tab and select any family member to view and edit details, or contact the Mahallu administrative office for major updates.',
    },
    {
      q: 'How do I contact the Mahallu office?',
      a: 'You can visit the Mahallu administrative office during working hours (9:00 AM - 5:00 PM) or call the office helpline.',
    },
  ];

  const menuSections = [
    {
      title: t('account', language),
      items: [
        { icon: 'person-outline', label: t('personalProfile', language), action: () => setActiveModal('profile') },
        { icon: 'lock-closed-outline', label: t('changePassword', language), action: () => setActiveModal('password') },
        { icon: 'notifications-outline', label: t('notificationSettings', language), action: () => setActiveModal('notifications') },
      ],
    },
    {
      title: t('appSettings', language),
      items: [
        {
          icon: 'language-outline',
          label: t('language', language),
          action: () => setActiveModal('language'),
          value: language === 'en' ? 'English' : 'മലയാളം',
        },
        {
          icon: 'color-palette-outline',
          label: t('theme', language),
          action: () => setActiveModal('theme'),
          value: selectedTheme === 'light' ? 'Light' : selectedTheme === 'dark' ? 'Dark' : 'System',
        },
      ],
    },
    {
      title: t('support', language),
      items: [
        { icon: 'help-circle-outline', label: t('helpFaq', language), action: () => setActiveModal('faq') },
        { icon: 'document-text-outline', label: t('termsPrivacy', language), action: () => setActiveModal('terms') },
      ],
    },
  ];

  const member = profileData?.member;
  const family = profileData?.family;
  const userData = profileData?.user || user;

  const menuIconColors: Record<string, [string, string]> = {
    'person-outline': [colors.blue.base, '#2563EB'],
    'lock-closed-outline': [colors.rose.base, '#E11D48'],
    'notifications-outline': [colors.amber.base, '#D97706'],
    'language-outline': [colors.purple.base, '#7C3AED'],
    'color-palette-outline': [colors.cyan.base, '#0891B2'],
    'help-circle-outline': [colors.teal.base, colors.teal.dark],
    'document-text-outline': [colors.emerald.base, '#059669'],
  };

  return (
    <View style={moreStyles.container}>
      {/* Gradient Header */}
      <LinearGradient
        colors={gradients.headerCompact}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={moreStyles.header}
      >
        <Image
          source={require('../../assets/images/islamic_pattern.jpg')}
          style={moreStyles.patternOverlay}
          resizeMode="cover"
        />
        <SafeAreaView edges={['top']}>
          <Animated.View entering={FadeInDown.delay(50).springify()} style={moreStyles.headerContent}>
            <Text style={moreStyles.headerTitle}>{t('profileTitle', language)}</Text>
          </Animated.View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Profile Header Card */}
        <Animated.View entering={FadeInDown.delay(100).springify()} style={moreStyles.profileCardWrapper}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setActiveModal('profile')}
            style={moreStyles.profileCard}
          >
            <LinearGradient
              colors={[colors.gold.base, colors.gold.light]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={moreStyles.profileCardAccent}
            />
            <Avatar
              uri={member?.photo?.url}
              name={member?.name || userData?.name || 'Member'}
              size={64}
              showRing
              ringColor={colors.teal.base}
            />
            <View style={moreStyles.profileInfo}>
              <Text style={moreStyles.profileName}>{member?.name || userData?.name || 'Mahallu Member'}</Text>
              <Text style={moreStyles.profileId}>{member?.memberId || userData?.phone || 'Member ID'}</Text>
              <Text style={moreStyles.profileEmail}>{userData?.email || userData?.phone || 'Active Member'}</Text>
            </View>
            <View style={moreStyles.profileChevron}>
              <Ionicons name="chevron-forward" size={18} color={colors.slate[400]} />
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Menu Sections */}
        <View style={moreStyles.menuContainer}>
          {menuSections.map((section, idx) => (
            <Animated.View key={idx} entering={FadeInDown.delay(150 + idx * 80).springify()} style={moreStyles.menuSection}>
              <View style={moreStyles.sectionLabelRow}>
                <View style={moreStyles.sectionAccent} />
                <Text style={moreStyles.sectionLabel}>{section.title}</Text>
              </View>
              <View style={moreStyles.menuCard}>
                {section.items.map((item, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[
                      moreStyles.menuItem,
                      i !== section.items.length - 1 && moreStyles.menuItemBorder,
                    ]}
                    activeOpacity={0.7}
                    onPress={item.action}
                  >
                    <LinearGradient
                      colors={menuIconColors[item.icon] || [colors.teal.base, colors.teal.dark]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={moreStyles.menuIconContainer}
                    >
                      <Ionicons name={item.icon as any} size={18} color={colors.white} />
                    </LinearGradient>
                    <Text style={moreStyles.menuItemLabel}>{item.label}</Text>
                    {item.value && <Text style={moreStyles.menuItemValue}>{item.value}</Text>}
                    <View style={moreStyles.menuChevron}>
                      <Ionicons name="chevron-forward" size={16} color={colors.slate[400]} />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </Animated.View>
          ))}

          {/* Logout Button */}
          <Animated.View entering={FadeInDown.delay(500).springify()}>
            <TouchableOpacity
              style={moreStyles.logoutButton}
              onPress={handleLogout}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#FEE2E2', '#FFF1F2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={moreStyles.logoutGradient}
              >
                <Ionicons name="log-out-outline" size={20} color={colors.rose.base} />
                <Text style={moreStyles.logoutText}>{t('signOut', language)}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </ScrollView>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 1. PERSONAL PROFILE MODAL */}
      {/* ─────────────────────────────────────────────────────────── */}
      <Modal visible={activeModal === 'profile'} animationType="slide" transparent>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl max-h-[85%] p-6">
            <View className="flex-row justify-between items-center pb-4 border-b border-slate-100">
              <Text className="text-slate-900 text-xl font-bold">{t('personalProfile', language)}</Text>
              <TouchableOpacity onPress={() => setActiveModal(null)} className="p-1">
                <Ionicons name="close-circle" size={26} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <ScrollView className="mt-4" showsVerticalScrollIndicator={false}>
              <View className="items-center mb-6">
                <Avatar
                  uri={member?.photo?.url}
                  name={member?.name || userData?.name || 'Member'}
                  size={80}
                  bgColor="bg-emerald-100"
                />
                <Text className="text-slate-900 text-xl font-extrabold mt-3">{member?.name || userData?.name}</Text>
                <View className="mt-1 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200">
                  <Text className="text-emerald-700 text-xs font-bold">{member?.memberId || 'Active'}</Text>
                </View>
              </View>

              <View className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <View className="flex-row justify-between py-2 border-b border-slate-200/60">
                  <Text className="text-slate-500 text-xs font-bold uppercase">Phone</Text>
                  <Text className="text-slate-800 text-sm font-semibold">{member?.phone || userData?.phone || 'N/A'}</Text>
                </View>
                <View className="flex-row justify-between py-2 border-b border-slate-200/60">
                  <Text className="text-slate-500 text-xs font-bold uppercase">Email</Text>
                  <Text className="text-slate-800 text-sm font-semibold">{userData?.email || member?.email || 'N/A'}</Text>
                </View>
                <View className="flex-row justify-between py-2 border-b border-slate-200/60">
                  <Text className="text-slate-500 text-xs font-bold uppercase">Gender</Text>
                  <Text className="text-slate-800 text-sm font-semibold capitalize">{member?.gender || 'N/A'}</Text>
                </View>
                <View className="flex-row justify-between py-2 border-b border-slate-200/60">
                  <Text className="text-slate-500 text-xs font-bold uppercase">Blood Group</Text>
                  <Text className="text-slate-800 text-sm font-semibold">{member?.bloodGroup || 'N/A'}</Text>
                </View>
                <View className="flex-row justify-between py-2 border-b border-slate-200/60">
                  <Text className="text-slate-500 text-xs font-bold uppercase">Family Code</Text>
                  <Text className="text-emerald-600 text-sm font-bold">{family?.familyCode || 'N/A'}</Text>
                </View>
                <View className="flex-row justify-between py-2 border-b border-slate-200/60">
                  <Text className="text-slate-500 text-xs font-bold uppercase">Ward No</Text>
                  <Text className="text-slate-800 text-sm font-semibold">{family?.wardNo || 'N/A'}</Text>
                </View>
                <View className="flex-row justify-between py-2">
                  <Text className="text-slate-500 text-xs font-bold uppercase">Address</Text>
                  <Text className="text-slate-800 text-sm font-semibold max-w-[60%] text-right">
                    {family?.address?.line1 || 'N/A'}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => setActiveModal(null)}
                className="mt-6 mb-4 bg-emerald-500 py-3.5 rounded-2xl items-center"
              >
                <Text className="text-white font-bold text-sm">Done</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 2. CHANGE PASSWORD MODAL */}
      {/* ─────────────────────────────────────────────────────────── */}
      <Modal visible={activeModal === 'password'} animationType="slide" transparent>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6">
            <View className="flex-row justify-between items-center pb-4 border-b border-slate-100">
              <Text className="text-slate-900 text-xl font-bold">{t('changePassword', language)}</Text>
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
      {/* 3. NOTIFICATION SETTINGS MODAL */}
      {/* ─────────────────────────────────────────────────────────── */}
      <Modal visible={activeModal === 'notifications'} animationType="slide" transparent>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6">
            <View className="flex-row justify-between items-center pb-4 border-b border-slate-100">
              <Text className="text-slate-900 text-xl font-bold">{t('notificationSettings', language)}</Text>
              <TouchableOpacity onPress={() => setActiveModal(null)} className="p-1">
                <Ionicons name="close-circle" size={26} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <View className="mt-4 space-y-4">
              <View className="flex-row items-center justify-between py-3 border-b border-slate-100">
                <View className="flex-1 pr-4">
                  <Text className="text-slate-800 text-base font-semibold">Push Notifications</Text>
                  <Text className="text-slate-400 text-xs mt-0.5">Receive instant alerts on your device</Text>
                </View>
                <Switch
                  value={notifSettings.push}
                  onValueChange={(val) => setNotifSettings((s) => ({ ...s, push: val }))}
                  trackColor={{ false: '#e2e8f0', true: '#10b981' }}
                />
              </View>

              <View className="flex-row items-center justify-between py-3 border-b border-slate-100">
                <View className="flex-1 pr-4">
                  <Text className="text-slate-800 text-base font-semibold">Daily Prayer Time & Azan</Text>
                  <Text className="text-slate-400 text-xs mt-0.5">Alerts before Jama'at timings</Text>
                </View>
                <Switch
                  value={notifSettings.azan}
                  onValueChange={(val) => setNotifSettings((s) => ({ ...s, azan: val }))}
                  trackColor={{ false: '#e2e8f0', true: '#10b981' }}
                />
              </View>

              <View className="flex-row items-center justify-between py-3 border-b border-slate-100">
                <View className="flex-1 pr-4">
                  <Text className="text-slate-800 text-base font-semibold">Mahallu Events & Notices</Text>
                  <Text className="text-slate-400 text-xs mt-0.5">Community programs and general notices</Text>
                </View>
                <Switch
                  value={notifSettings.events}
                  onValueChange={(val) => setNotifSettings((s) => ({ ...s, events: val }))}
                  trackColor={{ false: '#e2e8f0', true: '#10b981' }}
                />
              </View>

              <View className="flex-row items-center justify-between py-3 border-b border-slate-100">
                <View className="flex-1 pr-4">
                  <Text className="text-slate-800 text-base font-semibold">Madrasa Updates</Text>
                  <Text className="text-slate-400 text-xs mt-0.5">Children attendance, homework & exams</Text>
                </View>
                <Switch
                  value={notifSettings.madrasa}
                  onValueChange={(val) => setNotifSettings((s) => ({ ...s, madrasa: val }))}
                  trackColor={{ false: '#e2e8f0', true: '#10b981' }}
                />
              </View>
            </View>

            <TouchableOpacity
              onPress={() => {
                setActiveModal(null);
                Alert.alert('Saved', 'Notification preferences updated.');
              }}
              className="mt-6 mb-4 bg-emerald-500 py-3.5 rounded-2xl items-center"
            >
              <Text className="text-white font-bold text-sm">Save Preferences</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 4. LANGUAGE SELECTOR MODAL */}
      {/* ─────────────────────────────────────────────────────────── */}
      <Modal visible={activeModal === 'language'} animationType="slide" transparent>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6">
            <View className="flex-row justify-between items-center pb-4 border-b border-slate-100">
              <Text className="text-slate-900 text-xl font-bold">{t('language', language)}</Text>
              <TouchableOpacity onPress={() => setActiveModal(null)} className="p-1">
                <Ionicons name="close-circle" size={26} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <View className="mt-4 space-y-3">
              <TouchableOpacity
                onPress={() => {
                  setLanguage('en');
                  setActiveModal(null);
                }}
                className={`flex-row items-center justify-between p-4 rounded-2xl border ${
                  language === 'en' ? 'bg-emerald-50/60 border-emerald-500' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <View>
                  <Text className="text-slate-900 font-bold text-base">English</Text>
                  <Text className="text-slate-500 text-xs">Standard English</Text>
                </View>
                {language === 'en' && <Ionicons name="checkmark-circle" size={24} color="#10b981" />}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setLanguage('ml');
                  setActiveModal(null);
                }}
                className={`flex-row items-center justify-between p-4 rounded-2xl border ${
                  language === 'ml' ? 'bg-emerald-50/60 border-emerald-500' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <View>
                  <Text className="text-slate-900 font-bold text-base">മലയാളം</Text>
                  <Text className="text-slate-500 text-xs">Malayalam</Text>
                </View>
                {language === 'ml' && <Ionicons name="checkmark-circle" size={24} color="#10b981" />}
              </TouchableOpacity>
            </View>

            <View className="mt-6 mb-4" />
          </View>
        </View>
      </Modal>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 5. THEME SELECTOR MODAL */}
      {/* ─────────────────────────────────────────────────────────── */}
      <Modal visible={activeModal === 'theme'} animationType="slide" transparent>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6">
            <View className="flex-row justify-between items-center pb-4 border-b border-slate-100">
              <Text className="text-slate-900 text-xl font-bold">{t('theme', language)}</Text>
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

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 6. HELP & FAQ MODAL */}
      {/* ─────────────────────────────────────────────────────────── */}
      <Modal visible={activeModal === 'faq'} animationType="slide" transparent>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl max-h-[85%] p-6">
            <View className="flex-row justify-between items-center pb-4 border-b border-slate-100">
              <Text className="text-slate-900 text-xl font-bold">{t('helpFaq', language)}</Text>
              <TouchableOpacity onPress={() => setActiveModal(null)} className="p-1">
                <Ionicons name="close-circle" size={26} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <ScrollView className="mt-4" showsVerticalScrollIndicator={false}>
              {faqItems.map((item, idx) => {
                const isExpanded = expandedFaq === idx;
                return (
                  <View key={idx} className="mb-3 bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden">
                    <TouchableOpacity
                      onPress={() => setExpandedFaq(isExpanded ? null : idx)}
                      className="p-4 flex-row items-center justify-between"
                      activeOpacity={0.7}
                    >
                      <Text className="text-slate-800 font-bold text-sm flex-1 pr-2">{item.q}</Text>
                      <Ionicons
                        name={isExpanded ? 'chevron-up' : 'chevron-down'}
                        size={18}
                        color="#64748b"
                      />
                    </TouchableOpacity>
                    {isExpanded && (
                      <View className="px-4 pb-4 pt-1 border-t border-slate-200/60">
                        <Text className="text-slate-600 text-xs leading-relaxed">{item.a}</Text>
                      </View>
                    )}
                  </View>
                );
              })}

              <View className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 mt-3 mb-6">
                <Text className="text-emerald-900 font-bold text-sm mb-1">Need direct assistance?</Text>
                <Text className="text-emerald-700 text-xs">
                  Contact the Mahallu committee office at support@mahallu.app or visit the administration desk.
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 7. TERMS & PRIVACY MODAL */}
      {/* ─────────────────────────────────────────────────────────── */}
      <Modal visible={activeModal === 'terms'} animationType="slide" transparent>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl max-h-[85%] p-6">
            <View className="flex-row justify-between items-center pb-4 border-b border-slate-100">
              <Text className="text-slate-900 text-xl font-bold">{t('termsPrivacy', language)}</Text>
              <TouchableOpacity onPress={() => setActiveModal(null)} className="p-1">
                <Ionicons name="close-circle" size={26} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <ScrollView className="mt-4" showsVerticalScrollIndicator={false}>
              <View className="space-y-4 text-xs text-slate-600 leading-relaxed pb-6">
                <View>
                  <Text className="text-slate-900 font-bold text-sm mb-1">1. Community Data Privacy</Text>
                  <Text className="text-slate-600 text-xs leading-relaxed">
                    Mahallu ERP is dedicated to safeguarding family and personal records. All data, including contact numbers, Aadhaar details, and payment histories, are stored securely with strict tenant-level isolation.
                  </Text>
                </View>

                <View>
                  <Text className="text-slate-900 font-bold text-sm mb-1">2. Financial Integrity</Text>
                  <Text className="text-slate-600 text-xs leading-relaxed">
                    All monthly subscription dues, Sadaqah, and donations made through this application are reconciled directly with the Mahallu treasury bank accounts with automated receipt generation.
                  </Text>
                </View>

                <View>
                  <Text className="text-slate-900 font-bold text-sm mb-1">3. Madrasa Academic Records</Text>
                  <Text className="text-slate-600 text-xs leading-relaxed">
                    Student attendance and examination marks are managed by authorized teachers (Ustadhs) and monitored by the Sadar Mualim.
                  </Text>
                </View>

                <View>
                  <Text className="text-slate-900 font-bold text-sm mb-1">4. Acceptable Use</Text>
                  <Text className="text-slate-600 text-xs leading-relaxed">
                    Users must maintain the confidentiality of their login credentials. Any unauthorized access or misuse of community data should be reported to the Mahallu administration immediately.
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => setActiveModal(null)}
                className="bg-emerald-500 py-3.5 rounded-2xl items-center mb-6"
              >
                <Text className="text-white font-bold text-sm">Close</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const moreStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  header: {
    paddingBottom: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
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
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 4,
  },
  headerTitle: {
    color: colors.white,
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  profileCardWrapper: {
    paddingHorizontal: 20,
    marginTop: -12,
  },
  profileCard: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    ...shadows.elevated,
  },
  profileCardAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  profileInfo: {
    marginLeft: 14,
    flex: 1,
  },
  profileName: {
    color: colors.slate[800],
    fontSize: 17,
    fontWeight: '800',
  },
  profileId: {
    color: colors.teal.base,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  profileEmail: {
    color: colors.slate[500],
    fontSize: 12,
    fontWeight: '500',
    marginTop: 1,
  },
  profileChevron: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: colors.slate[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  menuSection: {
    marginBottom: 24,
  },
  sectionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionAccent: {
    width: 3,
    height: 14,
    borderRadius: 2,
    backgroundColor: colors.gold.base,
    marginRight: 8,
  },
  sectionLabel: {
    color: colors.slate[500],
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  menuCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: `${colors.teal.dark}06`,
    ...shadows.card,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.slate[100],
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  menuItemLabel: {
    color: colors.slate[800],
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  menuItemValue: {
    color: colors.slate[400],
    fontSize: 13,
    fontWeight: '500',
    marginRight: 8,
  },
  menuChevron: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: colors.slate[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutButton: {
    borderRadius: radius.md,
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 16,
  },
  logoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: `${colors.rose.base}20`,
  },
  logoutText: {
    color: colors.rose.base,
    fontWeight: '800',
    fontSize: 15,
  },
});
