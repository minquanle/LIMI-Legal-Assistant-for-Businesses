'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  RefreshCw,
  Scale,
  ShieldAlert,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface ContractAuditPanelProps {
  draftContent: string;
  onAcceptRedline: (originalText: string, suggestedText: string) => void;
}

export function ContractAuditPanel({ draftContent, onAcceptRedline }: ContractAuditPanelProps) {
  const [risks, setRisks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [audited, setAudited] = useState(false);
  const [acceptedIds, setAcceptedIds] = useState<Set<string>>(new Set());

  const handleRunAudit = async () => {
    setLoading(true);
    try {
      const res = await apiClient.auditContract(draftContent);
      setRisks(res.risks || []);
      setAudited(true);
    } catch {
      alert('Không thể thực hiện thẩm định hợp đồng.');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = (risk: any) => {
    onAcceptRedline(risk.originalText, risk.suggestedText);
    setAcceptedIds((prev) => new Set(prev).add(risk.id));
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Thẩm định Hợp đồng AI</h3>
          <p className="text-[11px] text-slate-500">Rà soát rủi ro pháp lý & Redline tự động</p>
        </div>
        <button
          onClick={handleRunAudit}
          disabled={loading}
          className="px-3 py-1.5 bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 text-[#0B1D51] font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Đang thẩm định...' : 'Chạy Thẩm định'}</span>
        </button>
      </div>

      {/* Audit Results List */}
      {!audited ? (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center text-slate-400 text-xs">
          <ShieldAlert className="w-8 h-8 mx-auto mb-2 text-yellow-500 opacity-60" />
          <span>Nhấn "Chạy Thẩm định" để AI quét rủi ro phạt vi phạm, ngày thử việc và các điều khoản bất lợi trong hợp đồng.</span>
        </div>
      ) : risks.length === 0 ? (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center text-green-800 text-xs">
          <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-600" />
          <span className="font-bold block mb-1">Hợp đồng An toàn!</span>
          <span>Không phát hiện vi phạm pháp luật hoặc điều khoản rủi ro cao.</span>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="text-[11px] font-semibold text-slate-500">
            Phát hiện {risks.length} điểm rủi ro cần lưu ý:
          </div>

          {risks.map((risk) => {
            const isAccepted = acceptedIds.has(risk.id);
            return (
              <div
                key={risk.id}
                className={`border rounded-2xl p-3.5 text-xs space-y-2.5 transition-all ${
                  isAccepted
                    ? 'bg-slate-50 border-slate-200 opacity-60'
                    : risk.level === 'HIGH'
                    ? 'bg-red-50/80 border-red-200 text-red-950'
                    : 'bg-amber-50/80 border-amber-200 text-amber-950'
                }`}
              >
                {/* Risk Title & Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 font-bold">
                    {risk.level === 'HIGH' ? (
                      <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                    ) : (
                      <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    )}
                    <span>{risk.title}</span>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border flex-shrink-0 ${
                      risk.level === 'HIGH'
                        ? 'bg-red-100 text-red-800 border-red-300'
                        : 'bg-amber-100 text-amber-800 border-amber-300'
                    }`}
                  >
                    {risk.level === 'HIGH' ? 'Rủi ro Cao' : 'Cảnh báo'}
                  </span>
                </div>

                {/* Legal Citation & Description */}
                <div className="text-[11px] opacity-90 leading-relaxed">{risk.description}</div>
                <div className="text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-1 rounded-lg">
                  <Scale className="w-3 h-3 shrink-0 inline" aria-hidden="true" /> {risk.legalCitation}
                </div>

                {/* Redline Diff Comparison */}
                <div className="bg-white border border-slate-200 rounded-xl p-2.5 text-[11px] space-y-1 font-mono">
                  <div className="text-red-600 line-through bg-red-50 p-1 rounded">
                    - {risk.originalText}
                  </div>
                  <div className="text-green-700 font-bold bg-green-50 p-1 rounded">
                    + {risk.suggestedText}
                  </div>
                </div>

                {/* 1-Click Accept Button */}
                <button
                  onClick={() => handleAccept(risk)}
                  disabled={isAccepted}
                  className={`w-full py-1.5 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm ${
                    isAccepted
                      ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  {isAccepted ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Đã chấp nhận Redline</span>
                    </>
                  ) : (
                    <>
                      <ArrowRight className="w-3.5 h-3.5" />
                      <span>Chấp nhận Redline 1-Click</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
