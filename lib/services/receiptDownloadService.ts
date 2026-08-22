import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';

export interface ReceiptData {
  receiptNo: string;
  paymentNo?: string;
  payerName?: string;
  payerPhone?: string;
  amount: number;
  category?: string;
  gateway?: string;
  date?: string | Date;
  description?: string;
  status?: string;
}

export async function generateAndShareReceipt(data: ReceiptData) {
  try {
    const formattedDate = data.date
      ? new Date(data.date).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : new Date().toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Receipt ${data.receiptNo}</title>
        <style>
          @page {
            size: A4;
            margin: 15mm;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact;
          }
          body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            color: #1e293b;
            margin: 0;
            padding: 30px;
            background: #ffffff;
          }
          .receipt-container {
            border: 2px solid #059669;
            border-radius: 20px;
            padding: 35px;
            background: #ffffff;
            position: relative;
            box-shadow: 0 10px 25px rgba(5, 150, 105, 0.08);
          }
          .watermark {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-30deg);
            font-size: 80px;
            font-weight: 900;
            color: rgba(5, 150, 105, 0.05);
            pointer-events: none;
            letter-spacing: 5px;
            text-transform: uppercase;
          }
          .header {
            text-align: center;
            border-bottom: 2px dashed #cbd5e1;
            padding-bottom: 25px;
            margin-bottom: 25px;
          }
          .arabic-bismillah {
            font-size: 20px;
            color: #065f46;
            margin-bottom: 8px;
            font-weight: bold;
          }
          .org-title {
            font-size: 26px;
            font-weight: 900;
            color: #047857;
            letter-spacing: 1px;
            margin: 0 0 4px 0;
          }
          .org-subtitle {
            font-size: 13px;
            color: #64748b;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin: 0;
          }
          .receipt-badge {
            display: inline-block;
            background: #ecfdf5;
            color: #047857;
            font-size: 13px;
            font-weight: 800;
            padding: 6px 18px;
            border-radius: 20px;
            margin-top: 12px;
            border: 1px solid #a7f3d0;
          }
          .grid {
            display: flex;
            justify-content: space-between;
            margin-bottom: 25px;
          }
          .grid-col {
            flex: 1;
          }
          .info-label {
            font-size: 11px;
            font-weight: 700;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
          }
          .info-val {
            font-size: 15px;
            font-weight: 800;
            color: #0f172a;
          }
          .table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          .table th {
            background: #f8fafc;
            color: #475569;
            font-size: 12px;
            font-weight: 800;
            text-transform: uppercase;
            text-align: left;
            padding: 12px 16px;
            border-top: 1px solid #e2e8f0;
            border-bottom: 1px solid #e2e8f0;
          }
          .table td {
            padding: 14px 16px;
            font-size: 14px;
            color: #1e293b;
            border-bottom: 1px solid #f1f5f9;
          }
          .amount-box {
            background: linear-gradient(135deg, #059669 0%, #047857 100%);
            color: #ffffff;
            border-radius: 16px;
            padding: 20px 25px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin: 25px 0;
          }
          .amount-label {
            font-size: 14px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #d1fae5;
          }
          .amount-number {
            font-size: 32px;
            font-weight: 900;
            color: #ffffff;
          }
          .status-stamp {
            display: inline-block;
            border: 2px solid #059669;
            color: #059669;
            font-size: 12px;
            font-weight: 900;
            padding: 4px 12px;
            border-radius: 8px;
            text-transform: uppercase;
          }
          .footer {
            text-align: center;
            border-top: 1px solid #e2e8f0;
            padding-top: 20px;
            margin-top: 30px;
            font-size: 11px;
            color: #94a3b8;
          }
        </style>
      </head>
      <body>
        <div class="receipt-container">
          <div class="watermark">PAID & VERIFIED</div>

          <div class="header">
            <div class="arabic-bismillah">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>
            <h1 class="org-title">MAHALLU COMMUNITY PORTAL</h1>
            <p class="org-subtitle">Official Mahallu Digital Receipt • ഔദ്യോഗിക രസീത്</p>
            <div class="receipt-badge">RECEIPT NO: ${data.receiptNo}</div>
          </div>

          <div class="grid">
            <div class="grid-col">
              <div class="info-label">Received From (അംഗം / ദാതാവ്):</div>
              <div class="info-val">${data.payerName || 'Mahallu Member'}</div>
              ${data.payerPhone ? `<div style="font-size: 12px; color: #64748b; margin-top: 2px;">📞 ${data.payerPhone}</div>` : ''}
            </div>
            <div class="grid-col" style="text-align: right;">
              <div class="info-label">Date & Time (തീയതി):</div>
              <div class="info-val">${formattedDate}</div>
              ${data.paymentNo ? `<div style="font-size: 12px; color: #64748b; margin-top: 2px;">Ref: ${data.paymentNo}</div>` : ''}
            </div>
          </div>

          <table class="table">
            <thead>
              <tr>
                <th>Purpose / Category (ഇനം)</th>
                <th>Payment Mode (രീതി)</th>
                <th style="text-align: right;">Amount (തുക)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <strong>${data.category ? data.category.replace(/_/g, ' ').toUpperCase() : 'GENERAL SADAQAH / DONATION'}</strong>
                  ${data.description ? `<div style="font-size: 12px; color: #64748b; margin-top: 3px;">${data.description}</div>` : ''}
                </td>
                <td style="text-transform: uppercase; font-weight: 700; color: #475569;">
                  ${data.gateway || 'Razorpay Online'}
                </td>
                <td style="text-align: right; font-weight: 900; font-size: 16px; color: #047857;">
                  ₹${data.amount.toLocaleString('en-IN')}
                </td>
              </tr>
            </tbody>
          </table>

          <div class="amount-box">
            <div>
              <div class="amount-label">Total Amount Paid (ആകെ അടച്ച തുക)</div>
              <div style="font-size: 11px; color: #a7f3d0; margin-top: 2px;">All dues and taxes cleared</div>
            </div>
            <div class="amount-number">₹${data.amount.toLocaleString('en-IN')}</div>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 15px;">
            <div class="status-stamp">✓ PAYMENT VERIFIED & COMPLETED</div>
            <div style="font-size: 11px; color: #64748b; font-weight: 600;">System Generated Official Receipt</div>
          </div>

          <div class="footer">
            <p>Jazakallah Khair for your valuable contribution towards the Mahallu Welfare Fund.</p>
            <p style="margin-top: 4px;">This is a computer-generated digital receipt and requires no physical signature.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const { uri } = await Print.printToFileAsync({ html });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        UTI: '.pdf',
        mimeType: 'application/pdf',
        dialogTitle: `Receipt ${data.receiptNo}`,
      });
    } else {
      Alert.alert('Success', `Receipt generated at: ${uri}`);
    }
  } catch (error: any) {
    Alert.alert('Download Error', error?.message || 'Failed to generate receipt PDF');
  }
}
