import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { apiClient } from '../../lib/api';
import { useAuthStore } from '../../store/auth.store';
import { useLanguageStore } from '../../lib/store/languageStore';
import { generateAndShareReceipt } from '../../lib/services/receiptDownloadService';
import { t } from '../../lib/i18n';

export default function PaymentHistoryScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { language } = useLanguageStore();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'donation' | 'monthly' | 'fees'>('all');
  const [isExporting, setIsExporting] = useState(false);

  // Fetch all payment transactions for the member
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['mobile-payment-history', user?._id],
    queryFn: async () => {
      const res = await apiClient.get('/mobile/me/payments?limit=100');
      return res.data?.data || [];
    },
  });

  const allPayments = Array.isArray(data) ? data : [];

  // Filter payments by search query and category
  const filteredPayments = useMemo(() => {
    return allPayments.filter((p: any) => {
      const matchesSearch =
        !search ||
        (p.paymentNo && p.paymentNo.toLowerCase().includes(search.toLowerCase())) ||
        (p.receiptId?.receiptNo && p.receiptId.receiptNo.toLowerCase().includes(search.toLowerCase())) ||
        (p.description && p.description.toLowerCase().includes(search.toLowerCase())) ||
        (p.type && p.type.toLowerCase().includes(search.toLowerCase()));

      let matchesCategory = true;
      if (selectedCategory === 'donation') {
        matchesCategory = p.type === 'donation' || p.type === 'zakat' || (p.description && p.description.toLowerCase().includes('sadaqah'));
      } else if (selectedCategory === 'monthly') {
        matchesCategory = p.type === 'recurring_donation' || p.type === 'monthly' || (p.description && p.description.toLowerCase().includes('monthly'));
      } else if (selectedCategory === 'fees') {
        matchesCategory = p.type === 'certificate_fee' || p.type === 'nikah_fee' || p.type === 'property_rent';
      }

      return matchesSearch && matchesCategory;
    });
  }, [allPayments, search, selectedCategory]);

  const totalCompletedAmount = useMemo(() => {
    return filteredPayments
      .filter((p: any) => {
        const s = String(p.status || '').toLowerCase();
        return s === 'completed' || s === 'paid' || s === 'success';
      })
      .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
  }, [filteredPayments]);

  const handleExportStatement = async () => {
    if (filteredPayments.length === 0) {
      Alert.alert('No Data', 'No transactions found to export.');
      return;
    }

    try {
      setIsExporting(true);
      const rowsHtml = filteredPayments
        .map((p: any) => {
          const rNo = p.receiptId?.receiptNo || `RCP-${String(p.paymentNo || p._id).slice(-6).toUpperCase()}`;
          const dateStr = dayjs(p.createdAt).format('DD/MM/YYYY');
          return `
            <tr>
              <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #047857;">${rNo}</td>
              <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0;">${p.paymentNo || 'N/A'}</td>
              <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0;">${dateStr}</td>
              <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0;">${p.description || p.type}</td>
              <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-transform: uppercase; font-size: 11px;">${p.gateway || 'ONLINE'}</td>
              <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: bold; color: #0f172a;">₹${p.amount}</td>
            </tr>
          `;
        })
        .join('');

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8" />
          <title>Payment Statement</title>
          <style>
            @page { size: A4; margin: 15mm; }
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #0f172a; padding: 20px; }
            .header { text-align: center; border-bottom: 2px solid #059669; padding-bottom: 15px; margin-bottom: 20px; }
            .title { font-size: 22px; font-weight: bold; color: #047857; margin: 0; }
            .subtitle { font-size: 13px; color: #64748b; margin-top: 4px; }
            .summary { background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 12px; padding: 15px; display: flex; justify-content: space-between; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th { background: #f8fafc; color: #475569; padding: 10px 12px; text-align: left; border-bottom: 2px solid #cbd5e1; text-transform: uppercase; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="title">MAHALLU COMMUNITY PORTAL</h1>
            <p class="subtitle">Member Payment History & Financial Statement</p>
          </div>
          <div class="summary">
            <div><strong>Member:</strong> ${user?.name || 'Member'} (${user?.phone || 'N/A'})</div>
            <div><strong>Total Paid:</strong> ₹${totalCompletedAmount.toLocaleString('en-IN')}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Receipt #</th>
                <th>Payment #</th>
                <th>Date</th>
                <th>Category / Purpose</th>
                <th>Method</th>
                <th style="text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
          <div style="text-align: center; margin-top: 30px; font-size: 11px; color: #94a3b8;">
            Computer generated statement • Mahallu ERP System
          </div>
        </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          UTI: '.pdf',
          mimeType: 'application/pdf',
          dialogTitle: 'Payment Statement PDF',
        });
      }
    } catch (e: any) {
      Alert.alert('Export Error', e?.message || 'Failed to export statement');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>
            {language === 'en' ? 'Payment & Receipt History' : 'പേയ്‌മെന്റ് ചരിത്രവും രസീതുകളും'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {language === 'en' ? 'All verified donations & dues' : 'എല്ലാ സംഭാവനകളും രസീതുകളും'}
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleExportStatement}
          disabled={isExporting}
          style={styles.exportBtn}
        >
          {isExporting ? (
            <ActivityIndicator size="small" color="#047857" />
          ) : (
            <Ionicons name="share-outline" size={20} color="#047857" />
          )}
        </TouchableOpacity>
      </View>

      {/* Search & Summary Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color="#94a3b8" style={{ marginRight: 8 }} />
          <TextInput
            placeholder={language === 'en' ? 'Search by Receipt #, Payment #, Purpose...' : 'രസീത്, പേയ്‌മെന്റ് നമ്പർ തിരയുക...'}
            placeholderTextColor="#94a3b8"
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color="#94a3b8" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Category Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
          {[
            { id: 'all', label: language === 'en' ? 'All Payments' : 'എല്ലാം' },
            { id: 'donation', label: language === 'en' ? 'Sadaqah & Zakat' : 'സ്വദഖ & സക്കാത്ത്' },
            { id: 'monthly', label: language === 'en' ? 'Monthly Subscriptions' : 'മാസവരി' },
            { id: 'fees', label: language === 'en' ? 'Official Fees' : 'ഫീസുകൾ' },
          ].map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setSelectedCategory(cat.id as any)}
                style={[styles.catPill, isSelected ? styles.catPillActive : styles.catPillInactive]}
              >
                <Text style={[styles.catPillText, isSelected ? styles.catPillTextActive : styles.catPillTextInactive]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Summary Card */}
      <View style={styles.summaryCard}>
        <View>
          <Text style={styles.summaryLabel}>
            {language === 'en' ? 'Total Completed Payments' : 'ആകെ അടച്ച തുക'}
          </Text>
          <Text style={styles.summaryAmount}>₹{totalCompletedAmount.toLocaleString('en-IN')}</Text>
        </View>
        <View style={styles.summaryBadge}>
          <Text style={styles.summaryBadgeText}>{filteredPayments.length} {language === 'en' ? 'Transactions' : 'ഇനങ്ങൾ'}</Text>
        </View>
      </View>

      {/* Transactions List */}
      <ScrollView
        style={styles.scrollList}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading || isRefetching} onRefresh={refetch} tintColor="#059669" />}
      >
        {isLoading ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator size="large" color="#059669" />
            <Text style={styles.loaderText}>{language === 'en' ? 'Loading payment records...' : 'വിവരങ്ങൾ ലഭ്യമാക്കുന്നു...'}</Text>
          </View>
        ) : filteredPayments.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="receipt-outline" size={36} color="#94a3b8" />
            </View>
            <Text style={styles.emptyTitle}>
              {language === 'en' ? 'No Payment Records Found' : 'പേയ്‌മെന്റ് വിവരങ്ങൾ ഒന്നും കണ്ടെത്തിയില്ല'}
            </Text>
            <Text style={styles.emptyDesc}>
              {language === 'en'
                ? 'Your payment history, Sadaqah contributions, and official receipts will appear here.'
                : 'നിങ്ങൾ നടത്തിയ പേയ്‌മെന്റുകളും സ്വദഖകളും ഇവിടെ ലഭ്യമാകും.'}
            </Text>
          </View>
        ) : (
          <View style={styles.itemsWrapper}>
            {filteredPayments.map((item: any, idx: number) => {
              const rNo = item.receiptId?.receiptNo || `RCP-${String(item.paymentNo || item._id).slice(-6).toUpperCase()}`;
              const dateStr = dayjs(item.createdAt).format('DD MMM YYYY, hh:mm A');
              const rawStatus = String(item.status || '').toLowerCase();
              const isSuccess = rawStatus === 'completed' || rawStatus === 'paid' || rawStatus === 'success';

              return (
                <View key={item._id || idx} style={styles.card}>
                  <View style={styles.cardTop}>
                    <View style={{ flex: 1, marginRight: 10 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                        <Text style={styles.receiptTag}>{rNo}</Text>
                        <Text style={styles.paymentNoTag}>{item.paymentNo}</Text>
                      </View>
                      <Text style={styles.cardTitle}>
                        {item.description || item.type?.replace(/_/g, ' ').toUpperCase()}
                      </Text>
                      <Text style={styles.cardDate}>{dateStr}</Text>
                    </View>

                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.cardAmount}>₹{item.amount}</Text>
                      <View style={[styles.statusBadge, isSuccess ? styles.statusSuccess : styles.statusPending]}>
                        <Text style={[styles.statusText, isSuccess ? styles.statusTextSuccess : styles.statusTextPending]}>
                          {isSuccess ? 'COMPLETED' : item.status?.toUpperCase() || 'PENDING'}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.cardBottom}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Ionicons name="card-outline" size={14} color="#64748b" style={{ marginRight: 4 }} />
                      <Text style={styles.gatewayText}>{item.gateway?.toUpperCase() || 'ONLINE'}</Text>
                    </View>

                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => {
                        generateAndShareReceipt({
                          receiptNo: rNo,
                          paymentNo: item.paymentNo,
                          payerName: item.paidForId?.name || item.paidById?.name || user?.name || 'Mahallu Member',
                          payerPhone: item.paidForId?.phone || item.paidById?.phone || user?.phone || '',
                          amount: item.amount,
                          category: item.type,
                          gateway: item.gateway,
                          date: item.createdAt,
                          description: item.description,
                        });
                      }}
                      style={styles.downloadBtn}
                    >
                      <Ionicons name="download-outline" size={14} color="#047857" style={{ marginRight: 4 }} />
                      <Text style={styles.downloadBtnText}>
                        {language === 'en' ? 'Download PDF' : 'രസീത് PDF'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
  },
  backBtn: {
    padding: 6,
    marginLeft: -6,
    borderRadius: 12,
  },
  headerTitleWrap: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '600',
  },
  exportBtn: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  searchSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '600',
    padding: 0,
  },
  categoryScroll: {
    gap: 8,
  },
  catPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  catPillActive: {
    backgroundColor: '#047857',
    borderColor: '#047857',
  },
  catPillInactive: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  catPillText: {
    fontSize: 12,
    fontWeight: '800',
  },
  catPillTextActive: {
    color: '#FFFFFF',
  },
  catPillTextInactive: {
    color: '#475569',
  },
  summaryCard: {
    backgroundColor: '#047857',
    marginHorizontal: 20,
    marginTop: 14,
    marginBottom: 6,
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#047857',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D1FAE5',
    textTransform: 'uppercase',
  },
  summaryAmount: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 2,
  },
  summaryBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  summaryBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  scrollList: {
    flex: 1,
  },
  listContent: {
    padding: 20,
    paddingBottom: 40,
  },
  loaderWrap: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loaderText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 10,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 20,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  emptyDesc: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
  itemsWrapper: {
    gap: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  receiptTag: {
    fontSize: 11,
    fontWeight: '900',
    color: '#047857',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginRight: 6,
  },
  paymentNoTag: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 4,
  },
  cardDate: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  cardAmount: {
    fontSize: 17,
    fontWeight: '900',
    color: '#047857',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    marginTop: 4,
  },
  statusSuccess: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  statusPending: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  statusText: {
    fontSize: 9,
    fontWeight: '900',
  },
  statusTextSuccess: {
    color: '#047857',
  },
  statusTextPending: {
    color: '#B45309',
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: '#F1F5F9',
    paddingTop: 10,
  },
  gatewayText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  downloadBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#047857',
  },
});
