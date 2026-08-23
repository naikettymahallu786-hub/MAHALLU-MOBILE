import React from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, AppState, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useGlobalSearchParams } from 'expo-router';
import { usePayments } from '../../lib/hooks/usePayments';
import { useProfile } from '../../lib/hooks/useProfile';
import { useDues } from '../../lib/hooks/useDues';
import { LoadingScreen } from '../../components/ui/LoadingScreen';
import { Badge, getPaymentStatusVariant } from '../../components/ui/Badge';
import dayjs from 'dayjs';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Linking from 'expo-linking';
import { apiClient, baseOrigin } from '../../lib/api';
import { useLanguageStore } from '../../lib/store/languageStore';
import { useAuthStore } from '../../store/auth.store';
import { generateAndShareReceipt } from '../../lib/services/receiptDownloadService';
import { t } from '../../lib/i18n';

const TEAL_DARK = '#0B4A42';
const TEAL = '#0F6B5C';
const GOLD = '#C9972E';
const CREAM = '#FBF8F2';

export default function PaymentsScreen() {
  const router = useRouter();
  const { language } = useLanguageStore();
  const { user } = useAuthStore();
  const params = useGlobalSearchParams<{ status?: string; error?: string; paymentId?: string }>();
  const { data: paymentsData, isLoading: paymentsLoading, refetch: refetchPayments } = usePayments(1);
  const { data: profileData, isLoading: profileLoading, refetch: refetchProfile } = useProfile();
  const { data: duesData, isLoading: duesLoading, refetch: refetchDues } = useDues();

  const [isProcessing, setIsProcessing] = React.useState(false);

  const isLoading = paymentsLoading || profileLoading || duesLoading;
  const payments = paymentsData?.data || [];
  const family = profileData?.family;
  const dues = duesData || [];
  const balance = family?.outstandingBalance || 0;
  const hasRecurring = family?.recurringDonationType && family.recurringDonationType !== 'none';

  const processedParamRef = React.useRef<string | null>(null);
  const pendingPaymentRef = React.useRef<{ paymentId?: string; orderId?: string; amount?: number } | null>(null);

  const onRefresh = React.useCallback(() => {
    refetchPayments();
    refetchProfile();
    refetchDues();
  }, [refetchPayments, refetchProfile, refetchDues]);

  // Check pending payment on app resume / foreground
  const checkPendingPayment = async () => {
    try {
      if (pendingPaymentRef.current?.orderId) {
        const verifyRes = await apiClient.post('/payments/cashfree-verify', {
          orderId: pendingPaymentRef.current.orderId,
          paymentId: pendingPaymentRef.current.paymentId,
        });
        const verifyData = verifyRes.data?.data;
        if (verifyData?.success && verifyData?.status === 'PAID') {
          Alert.alert(
            language === 'en' ? 'Payment Successful!' : 'പേയ്‌മെന്റ് വിജയകരം!',
            language === 'en'
              ? 'Your dues payment has been verified successfully.'
              : 'നിങ്ങളുടെ പേയ്‌മെന്റ് വിജയകരമായി പൂർത്തിയായി.'
          );
          pendingPaymentRef.current = null;
          onRefresh();
          return;
        }
      }

      onRefresh();
    } catch (e) {}
  };

  // Listen to AppState when user returns manually from browser
  React.useEffect(() => {
    const sub = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        checkPendingPayment();
      }
    });

    return () => sub.remove();
  }, []);

  // Handle return from Payment Gateway Redirect
  React.useEffect(() => {
    if (!params.status) return;
    const key = `${params.status}_${params.paymentId || ''}_${params.error || ''}`;
    if (processedParamRef.current === key) return;
    processedParamRef.current = key;

    if (params.status === 'success') {
      Alert.alert(
        language === 'en' ? 'Payment Successful!' : 'പേയ്‌മെന്റ് വിജയകരം!',
        language === 'en'
          ? 'Your transaction has been verified successfully.'
          : 'നിങ്ങളുടെ പേയ്‌മെന്റ് വിജയകരമായി രേഖപ്പെടുത്തി.'
      );
      pendingPaymentRef.current = null;
      onRefresh();
    } else if (params.status === 'failure') {
      Alert.alert('Payment Failed', params.error || 'Transaction could not be completed.');
      pendingPaymentRef.current = null;
    } else if (params.status === 'cancelled') {
      Alert.alert('Payment Cancelled', 'You cancelled the payment process.');
      pendingPaymentRef.current = null;
    }
  }, [params.status, params.error, params.paymentId, onRefresh]);

  const handlePayment = async () => {
    if (balance <= 0 || !profileData?.member) return;

    try {
      setIsProcessing(true);

      // Generate dynamic deep link redirect URL
      const redirectUrl = Linking.createURL('/(member)/payments');

      // 1. Create Cashfree order on the backend
      const response = await apiClient.post('/payments/create-order', {
        amount: balance,
        type: 'donation',
        description: 'Pending Dues Payment',
        paidForId: profileData.member._id,
        gateway: 'cashfree',
        redirectUrl,
      });

      const { order, payment } = response.data.data;

      // Track pending payment for auto-verification on return
      pendingPaymentRef.current = {
        paymentId: payment?._id,
        orderId: order?.order_id || order?.id,
        amount: balance,
      };

      // 2. Build Cashfree checkout page URL
      const backendUrl = baseOrigin;
      const checkoutUrl = `${backendUrl}/api/v1/payments/cashfree-checkout` +
        `?paymentSessionId=${encodeURIComponent(order?.payment_session_id || '')}` +
        `&orderId=${encodeURIComponent(order?.order_id || order?.id || '')}` +
        `&paymentId=${encodeURIComponent(payment?._id || '')}` +
        `&amount=${encodeURIComponent(balance)}` +
        `&name=${encodeURIComponent(profileData.member.name || '')}` +
        `&email=${encodeURIComponent(profileData.user?.email || '')}` +
        `&phone=${encodeURIComponent(profileData.member.phone || '')}` +
        `&redirectUrl=${encodeURIComponent(redirectUrl)}`;

      // 3. Open Cashfree checkout page in device browser
      await Linking.openURL(checkoutUrl);
    } catch (err: any) {
      Alert.alert('Payment Error', err?.message || 'Cashfree payment initiation failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: CREAM }} edges={['top']}>
      <View className="px-5 pt-2 pb-4 flex-row items-center border-b border-slate-200">
        <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
          <Ionicons name="arrow-back" size={24} color={TEAL_DARK} />
        </TouchableOpacity>
        <Text className="text-xl font-bold" style={{ color: TEAL_DARK }}>{t('paymentsTitle', language)}</Text>
      </View>

      <ScrollView 
        className="flex-1"
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor={TEAL} />}
      >
        <View className="p-5">
          {/* Balance Card */}
          <Animated.View entering={FadeInDown.delay(50).springify()} className="mb-6">
            <View 
              className="rounded-[24px] p-6 items-center" 
              style={{ 
                backgroundColor: 'white',
                shadowColor: TEAL_DARK,
                shadowOpacity: 0.1,
                shadowRadius: 16,
                shadowOffset: { width: 0, height: 8 },
                elevation: 4,
              }}
            >
              <View className="w-12 h-12 rounded-full items-center justify-center mb-3" style={{ backgroundColor: balance > 0 ? '#FEE2E2' : '#DCFCE7' }}>
                <Ionicons name={balance > 0 ? 'alert-circle' : 'checkmark-circle'} size={26} color={balance > 0 ? '#DC2626' : '#16A34A'} />
              </View>
              
              <Text className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">{t('totalPendingDues', language)}</Text>
              <Text className="text-4xl font-extrabold mb-6" style={{ color: balance > 0 ? '#DC2626' : '#16A34A' }}>₹{balance}</Text>
              
              <TouchableOpacity 
                className={`w-full py-4 rounded-2xl items-center flex-row justify-center ${balance > 0 && !isProcessing ? '' : 'opacity-50'}`}
                style={{ backgroundColor: balance > 0 && !isProcessing ? GOLD : '#E2E8F0' }}
                disabled={balance === 0 || isProcessing}
                onPress={handlePayment}
              >
                <Ionicons name="card-outline" size={20} color={balance > 0 && !isProcessing ? '#FFF' : '#94A3B8'} style={{ marginRight: 8 }} />
                <Text className={`font-extrabold text-sm ${balance > 0 && !isProcessing ? 'text-white' : 'text-slate-500'}`}>
                  {isProcessing ? t('processingPayment', language) : balance > 0 ? t('payTotalBalance', language) : t('noPendingDues', language)}
                </Text>
              </TouchableOpacity>

              {/* Recurring Payment Due Info */}
              {hasRecurring && (
                <View className="w-full mt-4 pt-3 border-t border-slate-100 flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <Ionicons name="calendar-outline" size={16} color={TEAL} />
                    <Text className="text-xs font-semibold text-slate-600 ml-1.5">
                      Next Due: <Text className="font-extrabold text-slate-900">
                        {family?.nextPaymentDueDate ? dayjs(family.nextPaymentDueDate).format('DD MMM YYYY') : 'Upcoming'}
                      </Text>
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => router.push('/(member)/family')}
                    className="px-2.5 py-0.5 rounded-full bg-teal-50 border border-teal-100 flex-row items-center gap-1"
                  >
                    <Text className="text-[10px] font-bold text-teal-800 capitalize">
                      ₹{family.recurringDonationAmount || 0} / {family.recurringDonationType}
                    </Text>
                    <Ionicons name="create-outline" size={12} color="#0F6B5C" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </Animated.View>

          {/* Individual Dues List */}
          {dues.length > 0 && (
            <Animated.View entering={FadeInDown.delay(75).springify()} className="mb-8">
              <Text className="text-slate-800 text-sm font-bold mb-3 px-1">{t('individualDues', language)}</Text>
              <View className="space-y-3">
                {dues.map((due: any, idx: number) => (
                  <View 
                    key={due._id} 
                    className="bg-red-50 rounded-[20px] p-4 flex-row justify-between items-center border border-red-100"
                  >
                    <View className="flex-row items-center flex-1 pr-4">
                      <View className="w-10 h-10 rounded-full bg-red-100 items-center justify-center mr-3">
                        <Ionicons name="warning-outline" size={18} color="#DC2626" />
                      </View>
                      <View>
                        <Text className="text-slate-900 font-extrabold text-sm">
                          {due.purpose || due.campaign || (language === 'en' ? 'General Due' : 'പൊതുവായ കുടിശ്ശിക')}
                        </Text>
                        <Text className="text-slate-500 text-[11px] mt-0.5">
                          {language === 'en' ? 'Added:' : 'ചേർത്തത്:'} {dayjs(due.createdAt).format('DD MMM YYYY')}
                        </Text>
                      </View>
                    </View>
                    <Text className="font-extrabold text-base text-red-600">₹{due.amount}</Text>
                  </View>
                ))}
              </View>
            </Animated.View>
          )}

          {/* Recurring Config Details */}
          {hasRecurring && (
            <Animated.View entering={FadeInDown.delay(100).springify()} className="mb-8">
              <Text className="text-slate-800 text-sm font-bold mb-3 px-1">
                {language === 'en' ? 'Recurring Plan' : 'ആവർത്തിച്ചുള്ള സംഭാവന'}
              </Text>
              <View 
                className="bg-white rounded-[20px] p-4 flex-row items-center justify-between"
                style={{ shadowColor: '#0f172a', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 }}
              >
                <View className="flex-row items-center flex-1">
                  <View className="w-10 h-10 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: '#E8F3F0' }}>
                    <Ionicons name="calendar-outline" size={18} color={TEAL} />
                  </View>
                  <View>
                    <Text className="text-slate-900 font-extrabold capitalize">
                      {family.recurringDonationType === 'monthly' ? (language === 'en' ? 'Monthly' : 'പ്രതിമാസം') : (language === 'en' ? 'Yearly' : 'പ്രതിവർഷം')}
                    </Text>
                    <Text className="text-slate-500 text-[11px] mt-0.5">
                      {language === 'en' ? 'Automated billing' : 'സ്വയമേവയുള്ള ബില്ലിംഗ്'}
                    </Text>
                  </View>
                </View>
                <View className="items-end">
                  <Text className="font-extrabold text-base text-slate-800">₹{family.recurringDonationAmount}</Text>
                  <Text className="text-slate-400 text-[10px] uppercase font-bold">
                    {language === 'en' ? 'Configured' : 'ക്രമീകരിച്ചിരിക്കുന്നു'}
                  </Text>
                </View>
              </View>
            </Animated.View>
          )}

          {/* Payment History */}
          <View className="flex-row items-center justify-between mb-3 px-1">
            <Text className="text-slate-800 text-sm font-bold">{t('recentPayments', language)}</Text>
            <TouchableOpacity
              onPress={() => router.push('/(member)/payment-history')}
              className="flex-row items-center"
            >
              <Text className="text-xs font-bold text-teal-800 mr-1">
                {language === 'en' ? 'View All & Filter' : 'എല്ലാം കാണുക'}
              </Text>
              <Ionicons name="chevron-forward" size={14} color="#0F6B5C" />
            </TouchableOpacity>
          </View>
          
          {payments.length === 0 ? (
            <View className="bg-white rounded-[24px] p-8 items-center border border-slate-100">
              <View className="w-16 h-16 rounded-full bg-slate-50 items-center justify-center mb-3">
                <Ionicons name="receipt-outline" size={32} color="#CBD5E1" />
              </View>
              <Text className="text-slate-400 font-medium">{t('noRecentPayments', language)}</Text>
            </View>
          ) : (
            <View className="space-y-3 mb-8">
              {payments.map((payment: any, idx: number) => (
                <Animated.View 
                  key={payment._id} 
                  entering={FadeInDown.delay(150 + (idx * 50)).springify()}
                  className="bg-white rounded-[20px] p-4 border border-slate-100"
                  style={{ shadowColor: '#0f172a', shadowOpacity: 0.03, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1 }}
                >
                  <View className="flex-row justify-between items-start mb-2">
                    <View className="flex-1">
                      <Text className="text-slate-900 font-extrabold text-base">₹{payment.amount}</Text>
                      <Text className="text-slate-500 text-[11px] mt-0.5 font-medium" numberOfLines={1}>
                        {payment.description || payment.type.replace('_', ' ').toUpperCase()}
                      </Text>
                    </View>
                    <Badge label={payment.status} variant={getPaymentStatusVariant(payment.status)} />
                  </View>
                  
                  <View className="flex-row justify-between items-center pt-3 mt-3 border-t border-slate-50">
                    <View>
                      <Text className="text-slate-400 font-bold text-[10px]">{payment.paymentNo}</Text>
                      <Text className="text-slate-400 font-bold text-[10px]">{dayjs(payment.createdAt).format('DD MMM YYYY, hh:mm A')}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => {
                        const receiptNo = payment.receiptId?.receiptNo || `RCP-${String(payment.paymentNo || payment._id).slice(-6).toUpperCase()}`;
                        generateAndShareReceipt({
                          receiptNo,
                          paymentNo: payment.paymentNo,
                          payerName: profileData?.member?.name || user?.name || 'Mahallu Member',
                          payerPhone: profileData?.member?.phone || user?.phone || '',
                          amount: payment.amount,
                          category: payment.type,
                          gateway: payment.gateway,
                          date: payment.createdAt,
                          description: payment.description,
                        });
                      }}
                      className="flex-row items-center px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200"
                    >
                      <Ionicons name="download-outline" size={14} color="#059669" />
                      <Text className="text-[11px] font-extrabold text-emerald-800 ml-1">
                        {language === 'en' ? 'Receipt PDF' : 'രസീത് ഡൗൺലോഡ്'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </Animated.View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
