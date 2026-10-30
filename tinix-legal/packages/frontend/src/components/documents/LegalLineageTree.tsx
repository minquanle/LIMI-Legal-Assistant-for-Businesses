'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowDown,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  FileText,
  GitBranch,
  HelpCircle,
  Layers,
  Scale,
  Sparkles,
  Star,
  XCircle,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { getValidityStatusInfo } from '@/lib/document-labels';

interface LineageDocument {
  id: string | null;
  title: string;
  documentNumber: string;
  documentType: string;
  issuingBody?: string;
  validityStatus?: string;
  effectiveDate?: string;
  relationType: string;
  description?: string;
}

interface LineageData {
  root: {
    id: string;
    title: string;
    documentNumber: string;
    documentType: string;
    issuingBody?: string;
    promulgationDate?: string;
    effectiveDate?: string;
    expiryDate?: string;
    validityStatus?: string;
  };
  baseLaws: LineageDocument[];
  guidingDocuments: LineageDocument[];
  amendingDocuments: LineageDocument[];
  supersedingDocuments: LineageDocument[];
  totalConnected: number;
}

// Visual treatment here (translucent bg/dot, dark-tree node styling) is
// deliberately distinct from the solid badge style used elsewhere — but the
// label text is sourced from the shared map (see document-labels.ts) so
// wording can't drift out of sync with the other 3 places that render this
// same enum.
const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  CON_HIEU_LUC: { label: getValidityStatusInfo('CON_HIEU_LUC').label, bg: 'bg-emerald-500/10 border-emerald-500/30', text: 'text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-500' },
  HET_HIEU_LUC_MOT_PHAN: { label: getValidityStatusInfo('HET_HIEU_LUC_MOT_PHAN').label, bg: 'bg-amber-500/10 border-amber-500/30', text: 'text-amber-700 dark:text-amber-300', dot: 'bg-amber-500' },
  HET_HIEU_LUC: { label: getValidityStatusInfo('HET_HIEU_LUC').label, bg: 'bg-rose-500/10 border-rose-500/30', text: 'text-rose-700 dark:text-rose-300', dot: 'bg-rose-500' },
  NGUNG_HIEU_LUC: { label: getValidityStatusInfo('NGUNG_HIEU_LUC').label, bg: 'bg-rose-500/10 border-rose-500/30', text: 'text-rose-700 dark:text-rose-300', dot: 'bg-rose-500' },
  CHUA_CO_HIEU_LUC: { label: getValidityStatusInfo('CHUA_CO_HIEU_LUC').label, bg: 'bg-blue-500/10 border-blue-500/30', text: 'text-blue-700 dark:text-blue-300', dot: 'bg-blue-500' },
  KHONG_XAC_DINH: { label: getValidityStatusInfo('KHONG_XAC_DINH').label, bg: 'bg-slate-500/10 border-slate-500/30', text: 'text-slate-700 dark:text-slate-300', dot: 'bg-slate-500' },
};
const DEFAULT_STATUS_KEY = 'KHONG_XAC_DINH';

export function LegalLineageTree({ documentId }: { documentId: string }) {
  const [data, setData] = useState<LineageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeTab, setActiveTab] = useState<'ALL' | 'GUIDING' | 'AMENDING' | 'BASE'>('ALL');

  useEffect(() => {
    setLoading(true);
    setError(false);
    apiClient
      .getDocumentLineage(documentId)
      .then(setData)
      .catch((err) => {
        console.error('Failed to load document lineage:', err);
        setError(true);
      })
      .finally(() => setLoading(false));
  }, [documentId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <div className="w-8 h-8 border-3 border-[#0B1D51] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-400">Đang dựng cây phả hệ hiệu lực & văn bản hướng dẫn...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center bg-rose-50 dark:bg-rose-950/20 rounded-2xl border border-rose-200 dark:border-rose-900/40">
        <AlertCircle className="w-10 h-10 text-rose-400 mx-auto mb-2 opacity-70" />
        <p className="text-sm font-semibold text-rose-700 dark:text-rose-300">Không thể tải sơ đồ phả hệ lúc này</p>
        <p className="text-xs text-rose-500 mt-1">Vui lòng thử lại sau ít phút.</p>
      </div>
    );
  }

  if (!data || !data.root) {
    return (
      <div className="p-8 text-center bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
        <GitBranch className="w-10 h-10 text-slate-400 mx-auto mb-2 opacity-50" />
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Không tìm thấy sơ đồ phả hệ cho văn bản này</p>
      </div>
    );
  }

  const rootStatus = STATUS_CONFIG[data.root.validityStatus || DEFAULT_STATUS_KEY] || STATUS_CONFIG[DEFAULT_STATUS_KEY];

  return (
    <div className="space-y-8 font-sans">
      {/* Header Bar */}
      <div className="bg-gradient-to-r from-[#091536] to-[#132B6A] text-white p-5 rounded-2xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-yellow-400 font-semibold mb-1">
            <GitBranch className="w-4 h-4" />
            <span>SƠ ĐỒ PHẢ HỆ HIỆU LỰC & QUAN HỆ VĂN BẢN</span>
          </div>
          <h3 className="text-base sm:text-lg font-bold">
            Vòng đời & Văn bản Hướng dẫn của {data.root.documentNumber}
          </h3>
        </div>

        <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-xl text-xs backdrop-blur-md">
          <span>Liên kết:</span>
          <strong className="text-yellow-400">{data.totalConnected}</strong>
          <span>văn bản liên quan</span>
        </div>
      </div>

      {/* Visual Tree Hierarchy */}
      <div className="relative">
        
        {/* Tier 1: Base Laws (Căn cứ cấp trên) */}
        {data.baseLaws.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                1. Căn cứ ban hành (Luật / Pháp lệnh cấp trên):
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {data.baseLaws.map((doc, idx) => (
                <DocumentNodeCard key={idx} doc={doc} badgeText="CĂN CỨ PHÁP LÝ" badgeColor="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300" />
              ))}
            </div>

            {/* Connecting Arrow */}
            <div className="flex justify-center my-4">
              <div className="flex flex-col items-center text-slate-400">
                <div className="w-0.5 h-6 bg-slate-300 dark:bg-slate-700" />
                <ArrowDown className="w-4 h-4 text-slate-400" />
              </div>
            </div>
          </div>
        )}

        {/* Tier 2: The Focal/Root Document */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-yellow-400/80 dark:border-yellow-400/60 shadow-lg relative">
          <div className="absolute -top-3 left-6 bg-yellow-400 text-slate-950 text-[10px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full shadow-sm">
            <Star className="w-2.5 h-2.5 inline" aria-hidden="true" /> VĂN BẢN ĐANG XEM
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mt-1">
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-xs font-bold text-blue-700 dark:text-yellow-400">
                  {data.root.documentNumber}
                </span>
                <span className="text-xs text-slate-500">• {data.root.documentType}</span>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1.5 ${rootStatus.bg} ${rootStatus.text}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${rootStatus.dot}`} />
                  <span>{rootStatus.label}</span>
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-relaxed">
                {data.root.title}
              </h2>
            </div>
          </div>
        </div>

        {/* Connecting Arrow Down */}
        {(data.guidingDocuments.length > 0 || data.amendingDocuments.length > 0 || data.supersedingDocuments.length > 0) && (
          <div className="flex justify-center my-4">
            <div className="flex flex-col items-center text-slate-400">
              <div className="w-0.5 h-6 bg-slate-300 dark:bg-slate-700" />
              <ArrowDown className="w-4 h-4 text-slate-400" />
            </div>
          </div>
        )}

        {/* Tier 3: Subordinate Guiding Decrees & Circulars + Amendments */}
        <div className="space-y-6">
          
          {/* Guiding Decrees / Circulars */}
          {data.guidingDocuments.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  2. Văn bản Hướng dẫn thi hành (Nghị định & Thông tư):
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {data.guidingDocuments.map((doc, idx) => (
                  <DocumentNodeCard key={idx} doc={doc} badgeText="HƯỚNG DẪN THI HÀNH" badgeColor="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300" />
                ))}
              </div>
            </div>
          )}

          {/* Amending / Replacing documents */}
          {(data.amendingDocuments.length > 0 || data.supersedingDocuments.length > 0) && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                  3. Văn bản Sửa đổi / Bổ sung / Thay thế:
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {data.amendingDocuments.map((doc, idx) => (
                  <DocumentNodeCard key={idx} doc={doc} badgeText="SỬA ĐỔI / BỔ SUNG" badgeColor="bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300" />
                ))}
                {data.supersedingDocuments.map((doc, idx) => (
                  <DocumentNodeCard key={idx} doc={doc} badgeText="THAY THẾ" badgeColor="bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300" />
                ))}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}

function DocumentNodeCard({ doc, badgeText, badgeColor }: { doc: LineageDocument; badgeText: string; badgeColor: string }) {
  const status = STATUS_CONFIG[doc.validityStatus || DEFAULT_STATUS_KEY] || STATUS_CONFIG[DEFAULT_STATUS_KEY];
  return (
    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-all">
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeColor}`}>
          {badgeText}
        </span>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1 ${status.bg} ${status.text}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
          <span>{status.label}</span>
        </span>
      </div>

      <div className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200 line-clamp-2 leading-snug mb-2">
        {doc.title}
      </div>

      <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-slate-800/60">
        <span className="font-bold text-blue-600 dark:text-blue-400">
          {doc.documentNumber}
        </span>

        {doc.id ? (
          <Link
            href={`/documents/${doc.id}`}
            className="text-[#0B1D51] dark:text-yellow-400 hover:underline font-semibold flex items-center gap-1 text-[11px]"
          >
            <span>Xem chi tiết</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        ) : (
          <span className="text-[11px] text-slate-400 italic">Văn bản trích dẫn</span>
        )}
      </div>
    </div>
  );
}
