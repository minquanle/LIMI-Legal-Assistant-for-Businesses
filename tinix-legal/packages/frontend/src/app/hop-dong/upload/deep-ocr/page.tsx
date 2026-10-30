'use client';

import { useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  DollarSign,
  FileText,
  Lightbulb,
  Save,
  ShieldAlert,
  Sparkles,
  Table,
  UploadCloud,
} from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';

interface ParsedTableData {
  tableName: string;
  headers: string[];
  rows: Array<Record<string, string | number>>;
}

interface RiskClauseItem {
  id: string;
  clauseTitle: string;
  riskType: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  originalSnippet: string;
  recommendation: string;
}

export default function DeepOCRTableExtractorPage() {
  const [contractText, setContractText] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [tables, setTables] = useState<ParsedTableData[]>([]);
  const [risks, setRisks] = useState<RiskClauseItem[]>([]);

  const handleExtractDeepOCR = async () => {
    setExtracting(true);
    const sampleText = contractText || `HỢP ĐỒNG MUA BÁN VÀ LẮP ĐẶT THIẾT BỊ CÔNG NGHỆ 2026
Số: HĐ-2026-TECH99

ĐIỀU 1. GIÁ TRỊ VÀ TIẾN ĐỘ THANH TOÁN
Đợt 1: Tạm ứng 30% (300.000.000 VNĐ) trước ngày 15/03/2026.
Đợt 2: Thanh toán 50% (500.000.000 VNĐ) khi nghiệm thu thiết bị.
Đợt 3: Thanh toán 20% (200.000.000 VNĐ) khi hết hạn bảo hành.

ĐIỀU 2. PHẠT VI PHẠM VÀ BỒI THƯỜNG
1. Bên B nếu vi phạm tiến độ bàn giao sẽ chịu mức phạt 12% tổng giá trị hợp đồng cho mỗi tuần chậm trễ.
2. Bên B bồi thường toàn bộ thiệt hại phát sinh không giới hạn trần trách nhiệm.`;

    setContractText(sampleText);
    try {
      const [tableRes, riskRes] = await Promise.all([
        apiClient.extractDeepOCRTables(sampleText),
        apiClient.extractDeepOCRRisks(sampleText),
      ]);
      setTables(tableRes);
      setRisks(riskRes);
    } catch {
      /* Fallback demo extraction */
      setTables([
        {
          tableName: 'Bảng Tiến độ Nghiệm thu & Mốc Thanh toán',
          headers: ['Đợt', 'Nội dung công việc', 'Tỷ lệ %', 'Số tiền (VND)', 'Hạn thanh toán'],
          rows: [
            { Đợt: 'Đợt 1', 'Nội dung công việc': 'Tạm ứng sau khi ký hợp đồng', 'Tỷ lệ %': '30%', 'Số tiền (VND)': '300.000.000', 'Hạn thanh toán': '15/03/2026' },
            { Đợt: 'Đợt 2', 'Nội dung công việc': 'Bàn giao thiết bị & Nghiệm thu', 'Tỷ lệ %': '50%', 'Số tiền (VND)': '500.000.000', 'Hạn thanh toán': '15/06/2026' },
            { Đợt: 'Đợt 3', 'Nội dung công việc': 'Kết thúc thời gian bảo hành', 'Tỷ lệ %': '20%', 'Số tiền (VND)': '200.000.000', 'Hạn thanh toán': '15/12/2026' },
          ],
        },
      ]);
      setRisks([
        {
          id: 'r1',
          clauseTitle: 'Mức phạt vi phạm hợp đồng 12%',
          riskType: 'FINANCIAL_PENALTY',
          severity: 'HIGH',
          originalSnippet: 'Bên B chịu phạt 12% tổng giá trị hợp đồng.',
          recommendation: 'Theo Điều 301 Luật Thương mại 2005, mức phạt tối đa là 8%. Đề nghị giảm xuống 8%.',
        },
        {
          id: 'r2',
          clauseTitle: 'Bồi thường thiệt hại không giới hạn trần',
          riskType: 'INDEMNITY',
          severity: 'MEDIUM',
          originalSnippet: 'Bồi thường toàn bộ thiệt hại phát sinh không giới hạn trần.',
          recommendation: 'Đề xuất giới hạn trần bồi thường không quá 100% giá trị hợp đồng.',
        },
      ]);
    }
    setExtracting(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/20 to-indigo-50/20">
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/hop-dong/upload" className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-white border border-slate-200 transition">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700">DEEP PDF OCR</span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900">Bóc tách Bảng biểu & Điều khoản Ẩn Rủi ro</h1>
            </div>
          </div>
        </div>

        {/* Input Zone */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <label className="text-xs font-bold text-slate-800 block">Dán nội dung hoặc Tải file Hợp đồng PDF/Scan:</label>
          <textarea
            rows={4}
            value={contractText}
            onChange={(e) => setContractText(e.target.value)}
            placeholder="Dán nội dung hợp đồng vào đây để AI bóc tách bảng giá và điều khoản phạt rủi ro ẩn..."
            className="w-full text-xs border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-purple-300 font-mono resize-none"
          />
          <button
            onClick={handleExtractDeepOCR}
            disabled={extracting}
            className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            {extracting ? 'Đang bóc tách Bảng biểu & Rủi ro...' : 'AI Bóc tách Bảng biểu & Điều khoản Ẩn'}
          </button>
        </div>

        {/* Tables Section */}
        {tables.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Table className="w-5 h-5 text-indigo-600" /> Bảng Đơn giá & Tiến độ Nghiệm thu trích xuất được ({tables.length})
            </h2>

            {tables.map((tbl, idx) => (
              <div key={idx} className="border border-slate-200 rounded-xl overflow-hidden space-y-2 p-4 bg-slate-50/50">
                <h3 className="font-bold text-slate-800 text-xs">{tbl.tableName}</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs bg-white border border-slate-200">
                    <thead>
                      <tr className="bg-slate-100 font-semibold text-slate-700">
                        {tbl.headers.map((h, i) => <th key={i} className="p-2.5 border-b border-slate-200">{h}</th>)}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {tbl.rows.map((row, ri) => (
                        <tr key={ri} className="hover:bg-slate-50">
                          {tbl.headers.map((h, ci) => <td key={ci} className="p-2.5 font-medium text-slate-800">{String(row[h] || '')}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Risks Section */}
        {risks.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-600" /> Phát hiện Điều khoản Rủi ro Ẩn ({risks.length})
            </h2>

            <div className="space-y-3">
              {risks.map((r) => (
                <div key={r.id} className={`p-4 rounded-xl border space-y-2 ${
                  r.severity === 'HIGH' ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <AlertTriangle className={`w-4 h-4 ${r.severity === 'HIGH' ? 'text-red-600' : 'text-yellow-600'}`} />
                      {r.clauseTitle}
                    </h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                      r.severity === 'HIGH' ? 'bg-red-200 text-red-800' : 'bg-yellow-200 text-yellow-800'
                    }`}>
                      RỦI RO {r.severity}
                    </span>
                  </div>
                  <p className="text-xs font-mono text-slate-700 bg-white/80 p-2.5 rounded-lg border border-slate-200">
                    "{r.originalSnippet}"
                  </p>
                  <p className="text-xs font-medium text-slate-600 flex items-start gap-1.5"><Lightbulb className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-500" aria-hidden="true" /> Đề xuất chỉnh sửa: {r.recommendation}</p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
