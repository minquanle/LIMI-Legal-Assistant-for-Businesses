'use client';

import React from 'react';
import Link from 'next/link';
import { ExternalLink, Info, Link2, Calendar, User, FileText, ArrowRight, CornerDownRight } from 'lucide-react';

interface RelatedDoc {
  id: string;
  documentNumber: string;
  title: string;
}

interface DocumentRelation {
  id: string;
  relationType: string;
  targetDocId?: string | null;
  targetDocNumber?: string;
  description: string;
  sourceDoc?: RelatedDoc | null;
  targetDoc?: RelatedDoc | null;
}

interface DocumentRelationshipsProps {
  incomingRelations: DocumentRelation[];
  outgoingRelations: DocumentRelation[];
  currentDoc: {
    id: string;
    title: string;
    documentNumber: string;
    documentType: string;
    issuingBody: string;
    signer: string;
    validityStatus: string;
    field: string;
    promulgationDate: any;
    effectiveDate: any;
    expiryDate: any;
  };
}

export function DocumentRelationships({ incomingRelations, outgoingRelations, currentDoc }: DocumentRelationshipsProps) {
  const formatDate = (dateStr: any) => {
    if (!dateStr) return '--';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('vi-VN');
    } catch (_) {
      return '--';
    }
  };

  // 1. Process Incoming Relations (Left Column)
  const incoming = incomingRelations || [];
  const incomingHuongDan = incoming.filter(r => r.relationType === "HUONG_DAN");
  const incomingCanCu = incoming.filter(r => r.relationType === "CAN_CU");
  const incomingHopNhat = incoming.filter(r => 
    r.sourceDoc?.title?.toLowerCase().includes("hợp nhất") || 
    r.description?.toLowerCase().includes("hợp nhất")
  );
  const incomingSuaDoi = incoming.filter(r => r.relationType === "SUA_DOI");
  const incomingDinhChinh = incoming.filter(r => 
    r.description?.toLowerCase().includes("đính chính")
  );
  const incomingThayThe = incoming.filter(r => r.relationType === "THAY_THE");
  const incomingBaiBo = incoming.filter(r => r.relationType === "BAI_BO");
  const incomingDanChieu = incoming.filter(r => r.relationType === "LIEN_QUAN");
  const incomingGiaiThich = incoming.filter(r => 
    r.description?.toLowerCase().includes("giải thích")
  );
  const incomingDinhChi = incoming.filter(r => 
    r.description?.toLowerCase().includes("đình chỉ")
  );
  const incomingTamNgung = incoming.filter(r => 
    r.description?.toLowerCase().includes("tạm ngưng")
  );
  const incomingCongBo = incoming.filter(r => 
    r.description?.toLowerCase().includes("công bố")
  );

  // 2. Process Outgoing Relations (Right Column)
  const outgoing = outgoingRelations || [];
  const outgoingHuongDan = outgoing.filter(r => r.relationType === "HUONG_DAN");
  const outgoingCanCu = outgoing.filter(r => r.relationType === "CAN_CU");
  const outgoingHopNhat = outgoing.filter(r => 
    r.targetDoc?.title?.toLowerCase().includes("hợp nhất") || 
    r.description?.toLowerCase().includes("hợp nhất")
  );
  const outgoingSuaDoi = outgoing.filter(r => r.relationType === "SUA_DOI");
  const outgoingDinhChinh = outgoing.filter(r => 
    r.description?.toLowerCase().includes("đính chính")
  );
  const outgoingThayThe = outgoing.filter(r => r.relationType === "THAY_THE");
  const outgoingBaiBo = outgoing.filter(r => r.relationType === "BAI_BO");
  const outgoingDanChieu = outgoing.filter(r => r.relationType === "LIEN_QUAN");
  const outgoingApDung = outgoing.filter(r => 
    r.description?.toLowerCase().includes("áp dụng")
  );
  const outgoingGiaiThich = outgoing.filter(r => 
    r.description?.toLowerCase().includes("giải thích")
  );
  const outgoingDinhChi = outgoing.filter(r => 
    r.description?.toLowerCase().includes("đình chỉ")
  );

  // Card list renderer helper
  const renderRelationList = (title: string, list: DocumentRelation[], isIncoming: boolean) => {
    return (
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4 hover:border-blue-300 transition-all">
        <h4 className="font-bold text-xs text-slate-800 mb-2 uppercase tracking-wide flex items-center justify-between">
          <span>{title}</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] ${list.length > 0 ? 'bg-blue-50 text-blue-600 font-bold border border-blue-100' : 'bg-slate-50 text-slate-400'}`}>
            {list.length}
          </span>
        </h4>
        {list.length === 0 ? (
          <div className="text-xs text-slate-400 font-mono italic pl-2">--</div>
        ) : (
          <div className="max-h-[180px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {list.map(rel => {
              // Related doc details
              const docId = isIncoming ? rel.sourceDoc?.id : rel.targetDocId;
              const docNumber = isIncoming ? rel.sourceDoc?.documentNumber : (rel.targetDoc?.documentNumber || rel.targetDocNumber);
              const docTitle = isIncoming ? rel.sourceDoc?.title : (rel.targetDoc?.title || rel.description);

              const linkHref = docId 
                ? `/documents/${docId}` 
                : `/search?q=${encodeURIComponent(docNumber || '')}`;

              return (
                <div key={rel.id} className="text-xs flex items-start gap-1.5 p-2 rounded-lg bg-slate-50 hover:bg-slate-100/80 border border-slate-100 transition-colors">
                  <span className="text-blue-500 mt-0.5 flex-shrink-0">•</span>
                  <div className="min-w-0 flex-1">
                    <Link 
                      href={linkHref} 
                      className="font-semibold text-blue-700 hover:text-blue-800 hover:underline inline-flex items-center gap-1 leading-snug"
                    >
                      <span>{docNumber || 'Xem chi tiết'}</span>
                      <ExternalLink className="w-2.5 h-2.5 inline opacity-70 flex-shrink-0" />
                    </Link>
                    {docTitle && (
                      <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2 leading-relaxed">
                        {docTitle}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
        <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
          <Link2 className="w-5 h-5 text-blue-600" />
          <span>Lược đồ Liên kết Văn bản</span>
        </h3>
        <span className="text-xs text-slate-500">
          Tổng số: {(incoming.length + outgoing.length)} liên kết được phát hiện
        </span>
      </div>

      {/* Grid Layout (3 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* COLUMN 1: LEFT SIDE (INCOMING RELATIONS) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-100/50 p-2.5 rounded-xl border border-slate-200 text-center mb-1">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Mối quan hệ thụ động (Incoming)</span>
          </div>
          {renderRelationList("Văn bản được hướng dẫn áp dụng", incomingHuongDan, true)}
          {renderRelationList("Văn bản được quy định chi tiết, hướng dẫn thi hành", incomingCanCu, true)}
          {renderRelationList("Văn bản được hợp nhất", incomingHopNhat, true)}
          {renderRelationList("Văn bản được sửa đổi bổ sung", incomingSuaDoi, true)}
          {renderRelationList("Văn bản được đính chính", incomingDinhChinh, true)}
          {renderRelationList("Văn bản được thay thế", incomingThayThe, true)}
          {renderRelationList("Văn bản bị bãi bỏ", incomingBaiBo, true)}
          {renderRelationList("Văn bản được dẫn chiếu", incomingDanChieu, true)}
          {renderRelationList("Văn bản được giải thích", incomingGiaiThich, true)}
          {renderRelationList("Văn bản bị đình chỉ thi hành", incomingDinhChi, true)}
          {renderRelationList("Văn bản bị tạm ngưng hiệu lực", incomingTamNgung, true)}
          {renderRelationList("Văn bản được công bố", incomingCongBo, true)}
        </div>

        {/* COLUMN 2: CENTER SIDE (CURRENT DOCUMENT METADATA) */}
        <div className="lg:col-span-4 sticky top-24">
          <div className="rounded-2xl border-2 border-blue-500/30 bg-gradient-to-b from-blue-50/60 to-white shadow-md p-5 space-y-4">
            <div className="text-center pb-2 border-b border-blue-100">
              <span className="text-[10px] font-extrabold text-blue-600 bg-blue-100/80 px-2.5 py-0.5 rounded-full uppercase tracking-widest">
                VĂN BẢN ĐANG XEM
              </span>
              <h4 className="text-sm font-bold text-slate-800 mt-2 line-clamp-3 leading-snug">
                {currentDoc.title}
              </h4>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-start gap-2 py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Số hiệu:</span>
                <span className="font-bold text-slate-800 text-right">{currentDoc.documentNumber || '--'}</span>
              </div>

              <div className="flex justify-between items-start gap-2 py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Ngành:</span>
                <span className="font-semibold text-slate-800 text-right">{currentDoc.field || '--'}</span>
              </div>

              <div className="flex justify-between items-start gap-2 py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Lĩnh vực:</span>
                <span className="font-semibold text-slate-800 text-right">{currentDoc.field || '--'}</span>
              </div>

              <div className="flex justify-between items-start gap-2 py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Cơ quan ban hành:</span>
                <span className="font-semibold text-slate-800 text-right">{currentDoc.issuingBody || '--'}</span>
              </div>

              <div className="flex justify-between items-start gap-2 py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Người ký / Chức danh:</span>
                <span className="font-semibold text-slate-800 text-right">{currentDoc.signer || '--'}</span>
              </div>

              <div className="flex justify-between items-start gap-2 py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Ngày có hiệu lực:</span>
                <span className="font-semibold text-slate-800 text-right">{formatDate(currentDoc.effectiveDate)}</span>
              </div>

              <div className="flex justify-between items-start gap-2 py-1.5">
                <span className="text-slate-500 font-medium">Ngày hết hiệu lực:</span>
                <span className="font-semibold text-slate-800 text-right">{formatDate(currentDoc.expiryDate)}</span>
              </div>
            </div>

            <div className="p-3 bg-blue-50/80 rounded-xl border border-blue-100/50 flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-[10px] text-blue-700 leading-relaxed">
                Hệ thống tự động đồng bộ lược đồ liên kết đa tầng giữa các văn bản liên quan. Bấm vào số hiệu bất kỳ để điều hướng sang văn bản đó.
              </p>
            </div>
          </div>
        </div>

        {/* COLUMN 3: RIGHT SIDE (OUTGOING RELATIONS) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-100/50 p-2.5 rounded-xl border border-slate-200 text-center mb-1">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Mối quan hệ chủ động (Outgoing)</span>
          </div>
          {renderRelationList("Văn bản hướng dẫn áp dụng", outgoingHuongDan, false)}
          {renderRelationList("Văn bản quy định chi tiết, hướng dẫn thi hành", outgoingCanCu, false)}
          {renderRelationList("Văn bản hợp nhất", outgoingHopNhat, false)}
          {renderRelationList("Văn bản sửa đổi bổ sung", outgoingSuaDoi, false)}
          {renderRelationList("Văn bản đính chính", outgoingDinhChinh, false)}
          {renderRelationList("Văn bản thay thế", outgoingThayThe, false)}
          {renderRelationList("Văn bản bãi bỏ", outgoingBaiBo, false)}
          {renderRelationList("Văn bản dẫn chiếu", outgoingDanChieu, false)}
          {renderRelationList("Văn bản áp dụng", outgoingApDung, false)}
          {renderRelationList("Văn bản giải thích", outgoingGiaiThich, false)}
          {renderRelationList("Văn bản đình chỉ thi hành", outgoingDinhChi, false)}
        </div>

      </div>
    </div>
  );
}
