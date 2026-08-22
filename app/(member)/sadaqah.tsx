import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useGlobalSearchParams } from 'expo-router';
import * as Linking from 'expo-linking';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, baseOrigin } from '../../lib/api';
import { useAuthStore } from '../../store/auth.store';
import { useLanguageStore } from '../../lib/store/languageStore';
import { t } from '../../lib/i18n';

const PRESET_AMOUNTS = [50, 100, 250, 500, 1000, 2500];

export default function SadaqahScreen() {
  const router = useRouter();
  const params = useGlobalSearchParams<{ status?: string; paymentId?: string; error?: string }>();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { language } = useLanguageStore();

  const SADAQAH_CATEGORIES = [
    { id: 'General Sadaqah', label: language === 'ml' ? 'പൊതു സ്വദഖ (General Sadaqah)' : 'General Sadaqah (പൊതു സ്വദഖ)', icon: 'heart-outline' },
    { id: 'Mosque Maintenance', label: language === 'ml' ? 'പള്ളി സംരക്ഷണ ഫണ്ട്' : 'Mosque & Water Fund (പള്ളി ഫണ്ട്)', icon: 'business-outline' },
    { id: 'Orphan & Relief', label: language === 'ml' ? 'അഗതി-അനാഥ സംരക്ഷണം' : 'Orphan & Relief Support (അനാഥ ഫണ്ട്)', icon: 'people-outline' },
    { id: 'Food & Medical Aid', label: language === 'ml' ? 'മെഡിക്കൽ & റിലീഫ് ഫണ്ട്' : 'Food & Medical Aid (മെഡിക്കൽ ഫണ്ട്)', icon: 'medkit-outline' },
    { id: 'Education Fund', label: language === 'ml' ? 'വിദ്യാഭ്യാസ & മദ്രസ ഫണ്ട്' : 'Education & Madrasa (വിദ്യാഭ്യാസ ഫണ്ട്)', icon: 'school-outline' },
  ];

  const [selectedAmount, setSelectedAmount] = useState<number | null>(100);
  const [customAmount, setCustomAmount] = useState('');
  const [category, setCategory] = useState('General Sadaqah');
  const [description, setDescription] = useState('');
  const [gateway, setGateway] = useState<'razorpay' | 'cash'>('razorpay');
  const [isProcessing, setIsProcessing] = useState(false);

  const [successReceipt, setSuccessReceipt] = useState<any | null>(null);

  const finalAmount = customAmount ? Number(customAmount) : selectedAmount || 0;

  // Fetch member's past Sadaqah history
  const { data: memberPayments, isLoading, refetch } = useQuery({
    queryKey: ['my-sadaqah-history', user?._id],
    queryFn: () =>
      apiClient
        .get('/payments/reports/finance', { params: { category: 'donation' } })
        .then((r) => r.data.data?.items || []),
  });

  const sadaqahHistory = Array.isArray(memberPayments) ? memberPayments : [];
  const processedParamRef = React.useRef<string | null>(null);

  // Handle return from Razorpay Payment Gateway Redirect
  useEffect(() => {
    if (!params.status) return;
    const key = `${params.status}_${params.paymentId || ''}_${params.error || ''}`;
    if (processedParamRef.current === key) return;
    processedParamRef.current = key;

    if (params.status === 'success') {
      setSuccessReceipt({
        receiptNo: params.paymentId ? `RCP-${String(params.paymentId).slice(-6).toUpperCase()}` : 'RCP-SADAQAH',
        amount: finalAmount || 100,
        category,
      });
      queryClient.invalidateQueries({ queryKey: ['my-sadaqah-history'] });
      refetch();
    } else if (params.status === 'failure') {
      Alert.alert('Payment Failed', params.error || 'Transaction could not be completed.');
    } else if (params.status === 'cancelled') {
      Alert.alert('Payment Cancelled', 'You cancelled the payment process.');
    }
  }, [params.status, params.error, params.paymentId]);

  const handlePaySadaqah = async () => {
    if (!finalAmount || finalAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount to give Sadaqah.');
      return;
    }

    const memberId = (user as any)?.memberId || user?._id;

    try {
      setIsProcessing(true);

      if (gateway === 'cash') {
        // Record as manual receipt for cash
        const res = await apiClient.post('/receipts/manual', {
          type: 'donation',
          amount: finalAmount,
          paidById: memberId,
          paidForId: memberId,
          description: `[${category}] ${description}`.trim(),
          gateway: 'cash',
        });
        const receiptData = res.data?.data || {};
        setSuccessReceipt({
          receiptNo: receiptData.receiptNo || 'RCP-SADAQAH-CASH',
          amount: finalAmount,
          category,
        });
        queryClient.invalidateQueries({ queryKey: ['my-sadaqah-history'] });
        refetch();
        return;
      }

      // 1. Create Razorpay order on backend
      const response = await apiClient.post('/payments/create-order', {
        amount: finalAmount,
        type: 'donation',
        description: `[${category}] ${description}`.trim() || 'Sadaqah Contribution',
        paidForId: memberId,
        gateway: 'razorpay',
      });

      const { order, payment } = response.data.data;

      // 2. Generate dynamic deep link redirect URL
      const redirectUrl = Linking.createURL('/(member)/sadaqah');

      // 3. Build Razorpay hosted checkout page URL
      const backendUrl = baseOrigin;
      const checkoutUrl =
        `${backendUrl}/api/v1/payments/checkout` +
        `?orderId=${order.id}` +
        `&paymentId=${payment._id}` +
        `&amount=${order.amount}` +
        `&name=${encodeURIComponent(user?.name || 'Sadaqah Donor')}` +
        `&email=${encodeURIComponent(user?.email || '')}` +
        `&phone=${encodeURIComponent(user?.phone || '')}` +
        `&redirectUrl=${encodeURIComponent(redirectUrl)}`;

      // 4. Open Razorpay Gateway Checkout (UPI, Google Pay, PhonePe, Cards, Netbanking)
      await Linking.openURL(checkoutUrl);
    } catch (err: any) {
      Alert.alert('Payment Error', err?.response?.data?.message || err?.message || 'Failed to initiate payment gateway');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      {/* Header */}
      <View className="px-5 py-4 bg-white border-b border-slate-200 flex-row items-center justify-between shadow-sm">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2 rounded-xl">
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <View className="items-center">
          <Text className="text-slate-900 text-lg font-extrabold">{t('sadaqahTitle', language)}</Text>
          <Text className="text-slate-500 text-xs font-semibold">{t('voluntaryCharity', language)}</Text>
        </View>
        <View className="w-8" />
      </View>

      <ScrollView className="flex-1 p-5" showsVerticalScrollIndicator={false}>
        {/* Banner */}
        <View className="bg-gradient-to-r from-emerald-700 to-teal-800 p-5 rounded-3xl mb-6 shadow-md shadow-emerald-700/20 bg-emerald-700">
          <View className="flex-row items-center mb-2">
            <View className="w-8 h-8 rounded-full bg-emerald-600/80 items-center justify-center mr-2 border border-emerald-400/30">
              <Ionicons name="heart" size={18} color="#ffffff" />
            </View>
            <Text className="text-emerald-100 text-xs font-bold uppercase tracking-wider">
              {t('nobleDeed', language)}
            </Text>
          </View>
          <Text className="text-white text-xl font-extrabold">{t('sadaqahHadithTitle', language)}</Text>
          <Text className="text-emerald-100 text-xs mt-1 leading-relaxed">
            {t('sadaqahHadithDesc', language)}
          </Text>
        </View>

        {/* Amount Selector */}
        <View className="bg-white border border-slate-200 rounded-3xl p-5 mb-5 shadow-sm">
          <Text className="text-slate-900 font-bold text-sm mb-3">{t('selectAmount', language)}</Text>
          <View className="flex-row flex-wrap gap-2.5 mb-4">
            {PRESET_AMOUNTS.map((amt) => {
              const isSelected = selectedAmount === amt && !customAmount;
              return (
                <TouchableOpacity
                  key={amt}
                  onPress={() => {
                    setSelectedAmount(amt);
                    setCustomAmount('');
                  }}
                  className={`px-4 py-3 rounded-2xl border items-center justify-center min-w-[75px] ${
                    isSelected
                      ? 'bg-emerald-600 border-emerald-600 shadow-sm shadow-emerald-600/30'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <Text className={`font-extrabold text-sm ${isSelected ? 'text-white' : 'text-slate-700'}`}>
                    ₹{amt}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Custom Amount Input */}
          <Text className="text-slate-500 font-semibold text-xs mb-1.5">{t('customAmount', language)}</Text>
          <View className="flex-row items-center border border-slate-200 rounded-2xl px-4 py-3 bg-slate-50">
            <Text className="text-slate-500 font-bold text-base mr-2">₹</Text>
            <TextInput
              placeholder="e.g. 5000"
              keyboardType="numeric"
              value={customAmount}
              onChangeText={(text) => {
                setCustomAmount(text);
                setSelectedAmount(null);
              }}
              className="flex-1 font-bold text-base text-slate-900"
            />
          </View>
        </View>

        {/* Category Selector */}
        <View className="bg-white border border-slate-200 rounded-3xl p-5 mb-5 shadow-sm">
          <Text className="text-slate-900 font-bold text-sm mb-3">{t('selectCategory', language)}</Text>
          <View className="gap-2">
            {SADAQAH_CATEGORIES.map((cat) => {
              const isSelected = category === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => setCategory(cat.id)}
                  className={`flex-row items-center p-3.5 rounded-2xl border ${
                    isSelected ? 'bg-emerald-50 border-emerald-500' : 'bg-slate-50 border-slate-100'
                  }`}
                >
                  <View
                    className={`w-8 h-8 rounded-xl items-center justify-center mr-3 ${
                      isSelected ? 'bg-emerald-600' : 'bg-slate-200'
                    }`}
                  >
                    <Ionicons
                      name={cat.icon as any}
                      size={16}
                      color={isSelected ? '#ffffff' : '#64748b'}
                    />
                  </View>
                  <Text
                    className={`flex-1 text-xs font-bold ${
                      isSelected ? 'text-emerald-950 font-extrabold' : 'text-slate-700'
                    }`}
                  >
                    {cat.label}
                  </Text>
                  {isSelected && <Ionicons name="checkmark-circle" size={18} color="#059669" />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Description / Notes */}
        <View className="bg-white border border-slate-200 rounded-3xl p-5 mb-5 shadow-sm">
          <Text className="text-slate-900 font-bold text-sm mb-2">{t('optionalNote', language)}</Text>
          <TextInput
            placeholder={language === 'en' ? 'e.g. For family wellbeing / Esaal-e-Sawab...' : 'ഉദാഹരണത്തിന്: കുടുംബത്തിന് വേണ്ടി / ഈസാൽ-എ-സവാബ്...'}
            value={description}
            onChangeText={setDescription}
            className="border border-slate-200 rounded-2xl px-4 py-3 text-sm bg-slate-50 text-slate-900"
            multiline
          />
        </View>

        {/* Payment Method */}
        <View className="bg-white border border-slate-200 rounded-3xl p-5 mb-6 shadow-sm">
          <Text className="text-slate-900 font-bold text-sm mb-3">{t('paymentMethod', language)}</Text>
          <View className="flex-row gap-3">
            {[
              { id: 'razorpay', label: t('onlinePayment', language), icon: 'qr-code-outline' },
              { id: 'cash', label: t('cashInHand', language), icon: 'cash-outline' },
            ].map((m) => {
              const isSelected = gateway === m.id;
              return (
                <TouchableOpacity
                  key={m.id}
                  onPress={() => setGateway(m.id as any)}
                  className={`flex-1 p-3 rounded-2xl border items-center ${
                    isSelected
                      ? 'bg-emerald-50 border-emerald-500'
                      : 'bg-slate-50 border-slate-100'
                  }`}
                >
                  <Ionicons name={m.icon as any} size={20} color={isSelected ? '#059669' : '#64748b'} />
                  <Text className={`text-[11px] font-bold mt-1 text-center ${isSelected ? 'text-emerald-900' : 'text-slate-600'}`}>
                    {m.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Pay Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handlePaySadaqah}
          disabled={isProcessing}
          className="bg-emerald-600 py-4 rounded-2xl items-center shadow-lg shadow-emerald-600/30 mb-8 flex-row justify-center"
        >
          {isProcessing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="card-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text className="text-white text-base font-extrabold">
                {gateway === 'razorpay' ? `${t('proceedToRazorpay', language)}: ₹` : `${t('payCash', language)}: ₹`}{finalAmount || 0}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* History Section */}
        <View className="mb-12">
          <Text className="text-slate-900 font-extrabold text-base mb-3">{t('pastSadaqah', language)}</Text>
          {isLoading ? (
            <ActivityIndicator color="#059669" className="py-6" />
          ) : sadaqahHistory.length === 0 ? (
            <View className="bg-white border border-slate-200 rounded-3xl p-6 items-center">
              <Ionicons name="receipt-outline" size={32} color="#cbd5e1" />
              <Text className="text-slate-500 text-xs font-semibold mt-2">{t('noRecentContributions', language)}</Text>
            </View>
          ) : (
            <View className="gap-2.5">
              {sadaqahHistory.map((item: any, i: number) => (
                <View
                  key={item._id || i}
                  className="bg-white border border-slate-200 rounded-2xl p-4 flex-row items-center justify-between"
                >
                  <View className="flex-1 mr-3">
                    <Text className="text-slate-900 font-bold text-sm">
                      {item.receiptNo || 'RCP-SADAQAH'}
                    </Text>
                    <Text className="text-slate-500 text-xs">{item.description || 'General Sadaqah'}</Text>
                    <Text className="text-slate-400 text-[10px] mt-0.5">
                      {new Date(item.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-emerald-700 font-extrabold text-base">₹{item.amount}</Text>
                    <Text className="text-emerald-600 text-[10px] font-bold uppercase bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 mt-0.5">
                      {item.status || 'PAID'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Success Receipt Modal */}
      <Modal visible={!!successReceipt} transparent animationType="fade">
        <View className="flex-1 bg-black/60 items-center justify-center p-5">
          <View className="bg-white rounded-3xl p-6 w-full max-w-sm items-center shadow-2xl">
            <View className="w-16 h-16 rounded-full bg-emerald-100 items-center justify-center mb-4">
              <Ionicons name="checkmark-circle" size={42} color="#059669" />
            </View>
            <Text className="text-slate-900 text-xl font-extrabold mb-1">Jazakallah Khair!</Text>
            <Text className="text-slate-500 text-xs text-center mb-5">
              Your Sadaqah contribution of ₹{successReceipt?.amount} has been received successfully.
            </Text>

            <View className="bg-slate-50 rounded-2xl p-4 w-full border border-slate-100 mb-6">
              <View className="flex-row justify-between mb-2">
                <Text className="text-slate-400 text-xs">Receipt No:</Text>
                <Text className="text-slate-800 font-bold text-xs">{successReceipt?.receiptNo}</Text>
              </View>
              <View className="flex-row justify-between mb-2">
                <Text className="text-slate-400 text-xs">Purpose:</Text>
                <Text className="text-slate-800 font-bold text-xs">{successReceipt?.category}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-slate-400 text-xs">Amount Paid:</Text>
                <Text className="text-emerald-700 font-extrabold text-sm">₹{successReceipt?.amount}</Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => setSuccessReceipt(null)}
              className="bg-emerald-600 w-full py-3.5 rounded-2xl items-center shadow-md shadow-emerald-600/30"
            >
              <Text className="text-white font-extrabold text-sm">Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
