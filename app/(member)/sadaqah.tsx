import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useGlobalSearchParams } from 'expo-router';
import * as Linking from 'expo-linking';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, baseOrigin } from '../../lib/api';
import { useAuthStore } from '../../store/auth.store';
import { useLanguageStore } from '../../lib/store/languageStore';
import { generateAndShareReceipt } from '../../lib/services/receiptDownloadService';
import { t } from '../../lib/i18n';
import { colors } from '../../lib/theme';

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
  const processedParamRef = useRef<string | null>(null);

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
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>{t('sadaqahTitle', language)}</Text>
          <Text style={styles.headerSubtitle}>{t('voluntaryCharity', language)}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Banner */}
        <View style={styles.banner}>
          <View style={styles.bannerHeader}>
            <View style={styles.bannerIconCircle}>
              <Ionicons name="heart" size={18} color="#ffffff" />
            </View>
            <Text style={styles.bannerTag}>{t('nobleDeed', language)}</Text>
          </View>
          <Text style={styles.bannerTitle}>{t('sadaqahHadithTitle', language)}</Text>
          <Text style={styles.bannerDesc}>{t('sadaqahHadithDesc', language)}</Text>
        </View>

        {/* Amount Selector */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('selectAmount', language)}</Text>
          <View style={styles.presetGrid}>
            {PRESET_AMOUNTS.map((amt) => {
              const isSelected = selectedAmount === amt && !customAmount;
              return (
                <TouchableOpacity
                  key={amt}
                  activeOpacity={0.7}
                  onPress={() => {
                    setSelectedAmount(amt);
                    setCustomAmount('');
                  }}
                  style={[styles.presetBtn, isSelected ? styles.presetBtnActive : styles.presetBtnInactive]}
                >
                  <Text style={[styles.presetBtnText, isSelected ? styles.presetBtnTextActive : styles.presetBtnTextInactive]}>
                    ₹{amt}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Custom Amount Input */}
          <Text style={styles.inputLabel}>{t('customAmount', language)}</Text>
          <View style={styles.inputRow}>
            <Text style={styles.currencySymbol}>₹</Text>
            <TextInput
              placeholder="e.g. 5000"
              placeholderTextColor="#94a3b8"
              keyboardType="numeric"
              value={customAmount}
              onChangeText={(text) => {
                setCustomAmount(text);
                setSelectedAmount(null);
              }}
              style={styles.textInput}
            />
          </View>
        </View>

        {/* Category Selector */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('selectCategory', language)}</Text>
          <View style={styles.categoryList}>
            {SADAQAH_CATEGORIES.map((cat) => {
              const isSelected = category === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  activeOpacity={0.7}
                  onPress={() => setCategory(cat.id)}
                  style={[styles.categoryItem, isSelected ? styles.categoryItemActive : styles.categoryItemInactive]}
                >
                  <View style={[styles.categoryIconCircle, isSelected ? styles.categoryIconCircleActive : styles.categoryIconCircleInactive]}>
                    <Ionicons
                      name={cat.icon as any}
                      size={16}
                      color={isSelected ? '#ffffff' : '#64748b'}
                    />
                  </View>
                  <Text style={[styles.categoryLabel, isSelected ? styles.categoryLabelActive : styles.categoryLabelInactive]}>
                    {cat.label}
                  </Text>
                  {isSelected && <Ionicons name="checkmark-circle" size={18} color="#059669" />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Description / Notes */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('optionalNote', language)}</Text>
          <TextInput
            placeholder={language === 'en' ? 'e.g. For family wellbeing / Esaal-e-Sawab...' : 'ഉദാഹരണത്തിന്: കുടുംബത്തിന് വേണ്ടി / ഈസാൽ-എ-സവാബ്...'}
            placeholderTextColor="#94a3b8"
            value={description}
            onChangeText={setDescription}
            style={styles.textArea}
            multiline
          />
        </View>

        {/* Payment Method */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('paymentMethod', language)}</Text>
          <View style={styles.methodRow}>
            {[
              { id: 'razorpay', label: t('onlinePayment', language), icon: 'qr-code-outline' },
              { id: 'cash', label: t('cashInHand', language), icon: 'cash-outline' },
            ].map((m) => {
              const isSelected = gateway === m.id;
              return (
                <TouchableOpacity
                  key={m.id}
                  activeOpacity={0.7}
                  onPress={() => setGateway(m.id as any)}
                  style={[styles.methodBtn, isSelected ? styles.methodBtnActive : styles.methodBtnInactive]}
                >
                  <Ionicons name={m.icon as any} size={20} color={isSelected ? '#059669' : '#64748b'} />
                  <Text style={[styles.methodLabel, isSelected ? styles.methodLabelActive : styles.methodLabelInactive]}>
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
          style={styles.payBtn}
        >
          {isProcessing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <View style={styles.payBtnContent}>
              <Ionicons name="card-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.payBtnText}>
                {gateway === 'razorpay' ? `${t('proceedToRazorpay', language)}: ₹` : `${t('payCash', language)}: ₹`}{finalAmount || 0}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* History Section */}
        <View style={styles.historySection}>
          <Text style={styles.historyTitle}>{t('pastSadaqah', language)}</Text>
          {isLoading ? (
            <ActivityIndicator color="#059669" style={{ paddingVertical: 24 }} />
          ) : sadaqahHistory.length === 0 ? (
            <View style={styles.emptyHistory}>
              <Ionicons name="receipt-outline" size={32} color="#cbd5e1" />
              <Text style={styles.emptyHistoryText}>{t('noRecentContributions', language)}</Text>
            </View>
          ) : (
            <View style={styles.historyList}>
              {sadaqahHistory.map((item: any, i: number) => {
                const rNo = item.receiptNo || `RCP-${String(item._id).slice(-6).toUpperCase()}`;
                return (
                  <View key={item._id || i} style={styles.historyCard}>
                    <View style={{ flex: 1, marginRight: 12 }}>
                      <Text style={styles.historyReceiptNo}>{rNo}</Text>
                      <Text style={styles.historyDesc}>{item.description || 'General Sadaqah'}</Text>
                      <Text style={styles.historyDate}>
                        {new Date(item.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </Text>
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => {
                          generateAndShareReceipt({
                            receiptNo: rNo,
                            paymentNo: item.paymentNo,
                            payerName: item.payerName || user?.name || 'Mahallu Member',
                            payerPhone: item.payerPhone || user?.phone || '',
                            amount: item.amount,
                            category: item.category || 'General Sadaqah',
                            gateway: item.gateway,
                            date: item.createdAt,
                            description: item.description,
                          });
                        }}
                        style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}
                      >
                        <Ionicons name="download-outline" size={14} color="#059669" />
                        <Text style={{ fontSize: 11, fontWeight: '800', color: '#059669', marginLeft: 4 }}>
                          {language === 'en' ? 'Download Receipt PDF' : 'രസീത് ഡൗൺലോഡ് (PDF)'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.historyAmount}>₹{item.amount}</Text>
                      <View style={styles.historyStatusBadge}>
                        <Text style={styles.historyStatusText}>
                          {item.status || 'PAID'}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Success Receipt Modal */}
      <Modal visible={!!successReceipt} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.receiptCard}>
            <View style={styles.receiptIconCircle}>
              <Ionicons name="checkmark-circle" size={42} color="#059669" />
            </View>
            <Text style={styles.receiptHeading}>Jazakallah Khair!</Text>
            <Text style={styles.receiptSubheading}>
              Your Sadaqah contribution of ₹{successReceipt?.amount} has been received successfully.
            </Text>

            <View style={styles.receiptDetails}>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Receipt No:</Text>
                <Text style={styles.receiptValue}>{successReceipt?.receiptNo}</Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Purpose:</Text>
                <Text style={styles.receiptValue}>{successReceipt?.category}</Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Amount Paid:</Text>
                <Text style={[styles.receiptValue, { color: '#059669', fontSize: 15, fontWeight: '900' }]}>
                  ₹{successReceipt?.amount}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                generateAndShareReceipt({
                  receiptNo: successReceipt?.receiptNo || 'RCP-SADAQAH',
                  payerName: user?.name || 'Mahallu Member',
                  payerPhone: user?.phone || '',
                  amount: successReceipt?.amount || 0,
                  category: successReceipt?.category,
                  date: new Date(),
                  description: description,
                });
              }}
              style={{
                backgroundColor: '#ECFDF5',
                borderWidth: 1.5,
                borderColor: '#A7F3D0',
                width: '100%',
                paddingVertical: 12,
                borderRadius: 16,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                marginBottom: 10,
              }}
            >
              <Ionicons name="download-outline" size={18} color="#059669" style={{ marginRight: 6 }} />
              <Text style={{ color: '#047857', fontWeight: '900', fontSize: 14 }}>
                {language === 'en' ? 'Download Official Receipt (PDF)' : 'ഔദ്യോഗിക രസീത് ഡൗൺലോഡ് (PDF)'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setSuccessReceipt(null)}
              style={styles.doneBtn}
            >
              <Text style={styles.doneBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    padding: 8,
    marginLeft: -8,
    borderRadius: 12,
  },
  headerTextContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  banner: {
    backgroundColor: '#047857',
    padding: 20,
    borderRadius: 24,
    marginBottom: 20,
    shadowColor: '#047857',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  bannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  bannerIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  bannerTag: {
    color: '#D1FAE5',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bannerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 6,
  },
  bannerDesc: {
    color: '#ECFDF5',
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '500',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 24,
    padding: 20,
    marginBottom: 18,
    shadowColor: '#0F172A',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  presetBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 78,
  },
  presetBtnActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  presetBtnInactive: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  presetBtnText: {
    fontSize: 14,
    fontWeight: '900',
  },
  presetBtnTextActive: {
    color: '#FFFFFF',
  },
  presetBtnTextInactive: {
    color: '#334155',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#F8FAFC',
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '800',
    color: '#64748B',
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    padding: 0,
  },
  categoryList: {
    gap: 10,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  categoryItemActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
  },
  categoryItemInactive: {
    backgroundColor: '#F8FAFC',
    borderColor: '#F1F5F9',
  },
  categoryIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  categoryIconCircleActive: {
    backgroundColor: '#059669',
  },
  categoryIconCircleInactive: {
    backgroundColor: '#E2E8F0',
  },
  categoryLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
  },
  categoryLabelActive: {
    color: '#064E3B',
    fontWeight: '900',
  },
  categoryLabelInactive: {
    color: '#334155',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 13,
    backgroundColor: '#F8FAFC',
    color: '#0F172A',
    minHeight: 50,
  },
  methodRow: {
    flexDirection: 'row',
    gap: 12,
  },
  methodBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodBtnActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
  },
  methodBtnInactive: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  methodLabel: {
    fontSize: 11,
    fontWeight: '800',
    marginTop: 6,
    textAlign: 'center',
  },
  methodLabelActive: {
    color: '#064E3B',
  },
  methodLabelInactive: {
    color: '#64748B',
  },
  payBtn: {
    backgroundColor: '#059669',
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    shadowColor: '#059669',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  payBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  payBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  historySection: {
    marginBottom: 40,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 14,
  },
  emptyHistory: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  emptyHistoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 8,
  },
  historyList: {
    gap: 10,
  },
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  historyReceiptNo: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  historyDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  historyDate: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 4,
  },
  historyAmount: {
    fontSize: 16,
    fontWeight: '900',
    color: '#047857',
  },
  historyStatusBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginTop: 4,
  },
  historyStatusText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#047857',
    textTransform: 'uppercase',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  receiptCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  receiptIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  receiptHeading: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 4,
  },
  receiptSubheading: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 20,
  },
  receiptDetails: {
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    padding: 16,
    width: '100%',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 24,
    gap: 8,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  receiptLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  receiptValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  doneBtn: {
    backgroundColor: '#059669',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#059669',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
});
