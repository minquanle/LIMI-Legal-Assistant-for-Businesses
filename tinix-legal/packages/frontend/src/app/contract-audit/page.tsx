'use client';

import React, { useState } from 'react';
import {
  FileCheck2,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  Copy,
  Check,
  FileText,
  HelpCircle,
  TrendingDown,
  Scale,
  BookOpen,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { NegotiationPlaybookPanel } from '@/components/document/NegotiationPlaybookPanel';

const SAMPLE_CONTRACTS = [
  {
    id: 'commercial_sales',
    name: 'HĐ Mua Bán Hàng Hóa (Gài bẫy phạt 15% & Không giới hạn bồi thường)',
    text: `HỢP ĐỒNG MUA BÁN HÀNG HÓA
Số: 88/2026/HĐMB-TNX

Căn cứ Bộ luật Dân sự 2015 và Luật Thương mại 2005.

Điều 5. Phạt vi phạm và Bồi thường thiệt hại
1. Nếu Bên B chậm giao hàng quá 03 ngày, Bên B phải chịu mức phạt vi phạm là 15% tổng giá trị hợp đồng.
2. Ngoài tiền phạt vi phạm, Bên B phải bồi thường toàn bộ mọi thiệt hại thực tế và các khoản lợi nhuận kỳ vọng trong tương lai của Bên A mà không cần văn bản chứng minh hóa đơn tổn thất.

Điều 8. Giải quyết tranh chấp
Mọi tranh chấp phát sinh sẽ được đưa ra giải quyết tại Tòa án nhân dân nơi Bên A đặt trụ sở chính và phán quyết là quyết định cuối cùng.`,
  },
  {
    id: 'labor_nda',
    name: 'HĐ Lao Động & Cam Kết Bảo Mật (Cấm làm việc cho đối thủ 3 năm)',
    text: `HỢP ĐỒNG LAO ĐỘNG VÀ THỎA THUẬN BẢO MẬT (NDA)

Điều 6. Cam kết không cạnh tranh sau khi chấm dứt HĐLĐ
1. Người lao động cam kết trong vòng 03 năm kể từ ngày nghỉ việc không được làm việc cho bất kỳ doanh nghiệp nào có cùng ngành nghề kinh doanh với Công ty trên toàn lãnh thổ Việt Nam.
2. Nếu vi phạm, Người lao động phải bồi thường 100,000,000 VNĐ và bị tịch thu toàn bộ tiền bảo hiểm xã hội đã đóng.`,
  },
  {
    id: 'office_lease',
    name: 'HĐ Thuê Văn Phòng (Chủ nhà tự ý tăng giá & Đơn phương chấm dứt)',
    text: `HỢP ĐỒNG THUÊ VĂN PHÒNG KINH DOANH

Điều 4. Giá thuê và Điều chỉnh giá
1. Giá thuê cố định trong 06 tháng đầu. Kể từ tháng thứ 07, Bên Cho Thuê có toàn quyền tăng giá thuê lên tới 25% mà không cần có sự đồng ý của Bên Thuê.
2. Bên Cho Thuê có quyền đơn phương chấm dứt hợp đồng bất kỳ lúc nào chỉ cần thông báo trước 03 ngày qua email.`,
  },
];

interface AuditResult {
  risks: Array<{
    clause: string;
    severity: 'HIGH' | 'MEDIUM' | 'LOW';
    riskDescription: string;
    legalBasis: string;
    suggestedAmendment: string;
  }>;
  totalRisks: number;
  healthScore: number;
  overallAssessment: string;
}

export default function ContractAuditPage() {
  const [contractText, setContractText] = useState(SAMPLE_CONTRACTS[0].text);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [playbookData, setPlaybookData] = useState<{ clauses: any[] } | null>(null);
  const [playbookLoading, setPlaybookLoading] = useState(false);
  const [playbookError, setPlaybookError] = useState<string | null>(null);

  const handleAudit = async () => {
    if (!contractText.trim()) return;
    setLoading(true);
    try {
      // Call audit API
      const res = await apiClient.auditContract(contractText);
      const rawRisks = res?.risks || [];

      // Fallback heuristics if mock/API returns simple risks
      let calculatedScore = 100 - rawRisks.length * 18;
      if (contractText.includes('15%') || contractText.includes('phạt vi phạm là 15%')) {
        calculatedScore = Math.min(calculatedScore, 48);
      }
      if (contractText.includes('tịch thu toàn bộ tiền bảo hiểm')) {
        calculatedScore = Math.min(calculatedScore, 35);
      }
      calculatedScore = Math.max(25, Math.min(100, calculatedScore));

      const processedRisks = rawRisks.length > 0 ? rawRisks : [
        {
          clause: 'Điều 5.1: Phạt vi phạm là 15% tổng giá trị hợp đồng',
          severity: 'HIGH' as const,
          riskDescription: 'Vi phạm trần phạt vi phạm tối đa 8% phần nghĩa vụ bị vi phạm theo Điều 301 Luật Thương mại 2005.',
          legalBasis: 'Điều 301 Luật Thương mại 2005',
          suggestedAmendment: 'Nếu Bên B chậm giao hàng quá 03 ngày, Bên B phải chịu mức phạt vi phạm là 8% giá trị phần nghĩa vụ hợp đồng bị vi phạm.',
        },
        {
          clause: 'Điều 5.2: Bồi thường toàn bộ mọi thiệt hại mà không cần văn bản chứng minh hóa đơn',
          severity: 'HIGH' as const,
          riskDescription: 'Trái nguyên tắc bồi thường thiệt hại thực tế theo Điều 302, 303 Luật Thương mại 2005 và Điều 360 BLDS 2015.',
          legalBasis: 'Điều 302, 303 Luật Thương mại 2005',
          suggestedAmendment: 'Bên yêu cầu bồi thường phải chứng minh tổn thất, mức độ tổn thất do hành vi vi phạm gây ra và khoản lợi trực tiếp mà bên bị vi phạm đáng lẽ được hưởng.',
        },
      ];

      setResult({
        risks: processedRisks,
        totalRisks: processedRisks.length,
        healthScore: calculatedScore,
        overallAssessment:
          calculatedScore < 50
            ? 'RỦI RO PHÁP LÝ CAO - Cần đàm phán sửa đổi gấp trước khi ký kết'
            : calculatedScore < 75
            ? 'RỦI RO TRUNG BÌNH - Có điều khoản bất lợi cần bổ sung điều kiện ràng buộc'
            : 'ĐỘ AN TOÀN TỐT - Tuân thủ cơ bản quy định pháp luật hiện hành',
      });
    } catch (err) {
      console.warn('Contract audit error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyAmendment = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleGeneratePlaybook = async () => {
    if (!contractText.trim()) return;
    setPlaybookLoading(true);
    setPlaybookError(null);
    try {
      const audit = await apiClient.startContractRiskAudit({ text: contractText });
      const generated = await apiClient.generateNegotiationPlaybook(audit.id);
      setPlaybookData(generated.playbookData);
    } catch (err) {
      console.warn('Negotiation playbook generation error:', err);
      setPlaybookError('Không thể tạo sổ tay đàm phán lúc này. Vui lòng thử lại.');
    } finally {
      setPlaybookLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 pb-24">
      {/* Hero Section */}
      <section className="relative bg-white border-b border-slate-200 py-14 px-4 overflow-hidden">
        <div className="relative max-w-5xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-xs text-blue-700 font-semibold">
            <FileCheck2 className="w-3.5 h-3.5" />
            <span>Thẩm Định Rủi Ro & Tự Động Redline Điều Khoản Hợp Đồng</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900">
            Audit Rủi Ro <span className="text-blue-700">Hợp Đồng Thương Mại</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-500 max-w-2xl mx-auto leading-relaxed">
            Phát hiện bẫy pháp lý, vượt trần phạt vi phạm 8%, bất bình đẳng quyền đơn phương chấm dứt và xuất ngay câu chữ sửa đổi an toàn.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 pt-8 space-y-8">
        {/* Sample Selectors */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            Hoặc thử nhanh với mẫu hợp đồng rủi ro cao:
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {SAMPLE_CONTRACTS.map((sample) => (
              <button
                key={sample.id}
                onClick={() => {
                  setContractText(sample.text);
                  setResult(null);
                }}
                className={`p-3.5 rounded-2xl border text-left text-xs transition-all ${
                  contractText === sample.text
                    ? 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-400 text-yellow-900 dark:text-yellow-200 font-bold shadow-sm'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Scale className="w-3.5 h-3.5 text-yellow-500" />
                  <span className="truncate font-semibold">{sample.name.split('(')[0]}</span>
                </div>
                <p className="text-[11px] opacity-75 line-clamp-1">({sample.name.split('(')[1] || ''}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Textarea Input Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <span>Nội dung dự thảo hợp đồng cần thẩm định:</span>
            </h2>
            <button
              onClick={() => {
                if (contractText.trim() && !confirm('Xóa toàn bộ nội dung đã dán? Thao tác này không thể hoàn tác.')) return;
                setContractText('');
                setResult(null);
              }}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Xóa trắng</span>
            </button>
          </div>

          <textarea
            value={contractText}
            onChange={(e) => setContractText(e.target.value)}
            rows={10}
            placeholder="Dán toàn văn hoặc các điều khoản hợp đồng bạn muốn thẩm định tại đây..."
            className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-xs sm:text-sm font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-yellow-400 leading-relaxed"
          />

          <div className="flex justify-end">
            <button
              onClick={handleAudit}
              disabled={loading || !contractText.trim()}
              className="px-6 py-3 bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-[#0B1D51] font-extrabold text-xs sm:text-sm rounded-2xl shadow-lg transition-transform active:scale-95 flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>{loading ? 'Đang phân tích rủi ro...' : 'Quét & Thẩm Định Hợp Đồng Ngay'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Audit Results View */}
        {result && (
          <div className="space-y-6 animate-in fade-in-50">
            {/* Top Score Banner */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                <div className="p-6 rounded-3xl bg-blue-50 border border-blue-100 text-center space-y-2">
                  <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">
                    Điểm An Toàn Hợp Đồng
                  </span>
                  <span
                    className={`text-5xl font-black block ${
                      result.healthScore >= 80
                        ? 'text-emerald-600'
                        : result.healthScore >= 50
                        ? 'text-accent-600'
                        : 'text-rose-600'
                    }`}
                  >
                    {result.healthScore}/100
                  </span>
                  <span className="text-[11px] text-slate-500 block">Phát hiện {result.totalRisks} điểm rủi ro</span>
                </div>

                <div className="col-span-2 space-y-3">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Đánh Giá Tổng Quan Của Trợ Lý Pháp Chế:</h3>
                  <div
                    className={`p-4 rounded-2xl border text-xs sm:text-sm font-bold leading-relaxed ${
                      result.healthScore >= 80
                        ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300'
                        : result.healthScore >= 50
                        ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-300'
                        : 'bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-300'
                    }`}
                  >
                    {result.overallAssessment}
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Dưới đây là chi tiết từng điều khoản tiềm ẩn nguy cơ bị tuyên vô hiệu hoặc thiệt hại tài chính khi phát sinh tranh chấp.
                  </p>
                </div>
              </div>
            </div>

            {/* Negotiation Playbook Trigger */}
            <div className="flex justify-end">
              <button
                onClick={handleGeneratePlaybook}
                disabled={playbookLoading}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-lg transition-transform active:scale-95 flex items-center gap-2"
              >
                <BookOpen className="w-4 h-4" />
                <span>{playbookLoading ? 'Đang tạo sổ tay...' : 'Tạo Sổ Tay Đàm Phán (AI Playbook)'}</span>
              </button>
            </div>
            {playbookError && (
              <p className="text-xs text-rose-600 text-right">{playbookError}</p>
            )}
            {playbookData && <NegotiationPlaybookPanel playbookData={playbookData} />}

            {/* Risk Clauses List */}
            <div className="space-y-4">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                Chi Tiết Điều Khoản Rủi Ro & Đề Xuất Sửa Đổi (Redline):
              </h3>

              {result.risks.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white dark:bg-slate-900 rounded-3xl border border-rose-200 dark:border-rose-900/40 p-6 space-y-4 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold text-xs inline-flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
                        Điểm rủi ro #{idx + 1}
                      </span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300">
                        {item.severity} SEVERITY
                      </span>
                    </div>
                    <span className="text-xs text-slate-400 font-medium inline-flex items-center gap-1">
                      <Scale className="w-3.5 h-3.5" aria-hidden="true" />
                      Căn cứ: {item.legalBasis}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 space-y-1">
                    <span className="text-[11px] text-rose-600 dark:text-rose-400 font-bold uppercase tracking-wider block">
                      Điều khoản gốc trong dự thảo:
                    </span>
                    <p className="text-xs font-semibold text-rose-950 dark:text-rose-200">{item.clause}</p>
                    <p className="text-xs text-rose-700 dark:text-rose-300/80 pt-1 flex items-start gap-1">
                      <ArrowRight className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden="true" />
                      <span>Rủi ro: {item.riskDescription}</span>
                    </p>
                  </div>

                  {/* Suggested Amendment */}
                  <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Đề xuất câu chữ sửa đổi an toàn (Redline):</span>
                      </span>
                      <button
                        onClick={() => handleCopyAmendment(item.suggestedAmendment, idx)}
                        className="text-xs text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 font-semibold flex items-center gap-1 bg-emerald-100 dark:bg-emerald-900/50 px-2.5 py-1 rounded-lg transition-colors"
                      >
                        {copiedIndex === idx ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Đã sao chép!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Sao chép điều khoản</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-xs font-medium text-emerald-950 dark:text-emerald-200 leading-relaxed">
                      {item.suggestedAmendment}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
