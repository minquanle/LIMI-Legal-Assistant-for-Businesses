'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  ChevronRight,
  FileText,
  GitCompare,
  Info,
  Layers,
  Lightbulb,
  Sparkles,
  Zap,
} from 'lucide-react';

const API_BASE = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001');

interface ComparisonPairSummary {
  id: string;
  title: string;
  topic: string;
  oldLaw: { number: string; name: string; effectiveDate: string };
  newLaw: { number: string; name: string; effectiveDate: string };
  highlightsCount: number;
  articlesCount: number;
}

interface ComparisonPairDetail extends ComparisonPairSummary {
  keyHighlights: Array<{
    title: string;
    description: string;
    impactLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  }>;
  articlesDiff: Array<{
    articleNumber: string;
    topicName: string;
    changeType: 'MODIFIED' | 'ADDED' | 'DELETED';
    oldContent: string;
    newContent: string;
    analysisNote: string;
  }>;
}

export default function SoSanhLuatPage() {
  const [pairs, setPairs] = useState<ComparisonPairSummary[]>([]);
  const [selectedPairId, setSelectedPairId] = useState<string>('luat-dat-dai');
  const [pairDetail, setPairDetail] = useState<ComparisonPairDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [pairsError, setPairsError] = useState(false);
  const [detailError, setDetailError] = useState(false);

  // Fetch list of comparison pairs
  useEffect(() => {
    fetch(`${API_BASE}/api/legal-diff/pairs`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        setPairs(data);
        if (data.length > 0) setSelectedPairId(data[0].id);
      })
      .catch((err) => {
        console.error('Failed to load comparison pairs:', err);
        setPairsError(true);
      });
  }, []);

  // Fetch pair detail when selectedPairId changes
  useEffect(() => {
    if (!selectedPairId) return;
    setLoading(true);
    setDetailError(false);
    fetch(`${API_BASE}/api/legal-diff/pairs/${selectedPairId}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => setPairDetail(data))
      .catch((err) => {
        console.error('Failed to load comparison detail:', err);
        setPairDetail(null);
        setDetailError(true);
      })
      .finally(() => setLoading(false));
  }, [selectedPairId]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 pb-24">
      {/* Hero Section */}
      <section className="relative bg-white border-b border-slate-200 py-14 px-4 overflow-hidden">
        <div className="relative max-w-5xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-xs text-emerald-600 font-semibold">
            <GitCompare className="w-3.5 h-3.5" />
            <span>Công Cụ So Sánh Đối Chiếu Văn Bản Luật Song Song (Side-by-Side Diff)</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900">
            So Sánh <span className="text-emerald-600">Luật Cũ vs Luật Mới</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-500 max-w-2xl mx-auto leading-relaxed">
            Nhận diện tức thì mọi thay đổi về câu chữ, bổ sung điều khoản mới, xóa bỏ quy định cũ và đánh giá tác động chuyên sâu giữa các đại dự án Luật 2024–2026.
          </p>
        </div>
      </section>

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-4 pt-8 space-y-8">
        {/* 1. Comparison Pairs Selector Cards */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-blue-500" />
            Chọn Cặp Văn Bản Luật Cần Đối Chiếu:
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {pairs.map((p) => {
              const isSelected = selectedPairId === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedPairId(p.id)}
                  className={`p-5 rounded-3xl text-left transition-all border flex flex-col justify-between space-y-3 ${
                    isSelected
                      ? 'bg-[#0B1D51] text-white border-[#0B1D51] dark:bg-yellow-400 dark:text-[#0B1D51] dark:border-yellow-400 shadow-lg scale-[1.02]'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-yellow-400/50'
                  }`}
                >
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider opacity-70 block mb-1">
                      {p.topic}
                    </span>
                    <h3 className="text-sm font-black leading-snug">{p.title}</h3>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-2 border-t border-black/10 dark:border-white/10">
                    <span className="opacity-80 text-[11px]">
                      {p.oldLaw.number} <ArrowRight className="w-3 h-3 inline" aria-hidden="true" /> {p.newLaw.number}
                    </span>
                    <span className="font-bold text-xs flex items-center gap-0.5">
                      <span>Xem diff</span>
                      <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Detail Diff Viewer */}
        {pairsError ? (
          <div className="py-20 text-center text-xs text-rose-500">Không thể tải danh sách so sánh. Vui lòng thử lại sau.</div>
        ) : detailError ? (
          <div className="py-20 text-center text-xs text-rose-500">Không tìm thấy dữ liệu đối chiếu cho lựa chọn này.</div>
        ) : loading || !pairDetail ? (
          <div className="py-20 text-center text-xs text-slate-400">Đang đối chiếu dữ liệu điều khoản...</div>
        ) : (
          <div className="space-y-8 animate-in fade-in-50">
            {/* Highlights Banner */}
            <div className="bg-gradient-to-r from-blue-900/10 via-amber-500/10 to-emerald-500/10 border border-amber-500/30 rounded-3xl p-6 sm:p-8 space-y-4">
              <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400 font-extrabold text-xs uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                <span>Những Điểm Mới Trọng Tâm Cần Lưu Ý ({pairDetail.keyHighlights.length} Điểm mới)</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pairDetail.keyHighlights.map((hl, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 backdrop-blur-sm space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>{hl.title}</span>
                      </h4>
                      <span
                        className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                          hl.impactLevel === 'CRITICAL'
                            ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
                            : 'bg-amber-500/20 text-amber-600 dark:text-yellow-400'
                        }`}
                      >
                        {hl.impactLevel}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      {hl.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Side-by-Side Comparison Header */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <GitCompare className="w-4 h-4 text-emerald-500" />
                Bảng So Sánh Chi Tiết Từng Điều Khoản (Side-by-Side Analysis)
              </h3>

              <div className="space-y-6">
                {pairDetail.articlesDiff.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm space-y-0"
                  >
                    {/* Item Header */}
                    <div className="p-4 bg-slate-100/70 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-xs text-slate-900 dark:text-white">
                          {item.articleNumber}
                        </span>
                        <span className="text-slate-400 text-xs">•</span>
                        <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                          {item.topicName}
                        </span>
                      </div>

                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                          item.changeType === 'ADDED'
                            ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-700 dark:text-yellow-400 border border-amber-500/30'
                        }`}
                      >
                        {item.changeType === 'ADDED' ? (
                          <span className="inline-flex items-center gap-1"><Sparkles className="w-3 h-3" aria-hidden="true" /> Quy định mới bổ sung</span>
                        ) : (
                          <span className="inline-flex items-center gap-1"><Zap className="w-3 h-3" aria-hidden="true" /> Sửa đổi nội dung</span>
                        )}
                      </span>
                    </div>

                    {/* Dual Columns Diff */}
                    <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800">
                      {/* Left: Old Law */}
                      <div className="p-5 bg-rose-50/20 dark:bg-rose-950/10 space-y-2">
                        <div className="text-[11px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 shrink-0" aria-hidden="true" />
                          <span>{pairDetail.oldLaw.name} ({pairDetail.oldLaw.number})</span>
                        </div>
                        <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 font-mono bg-white/60 dark:bg-slate-900/60 p-3.5 rounded-xl border border-rose-200/50 dark:border-rose-900/30">
                          {item.oldContent}
                        </p>
                      </div>

                      {/* Right: New Law */}
                      <div className="p-5 bg-emerald-50/20 dark:bg-emerald-950/10 space-y-2">
                        <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 shrink-0" aria-hidden="true" />
                          <span>{pairDetail.newLaw.name} ({pairDetail.newLaw.number})</span>
                        </div>
                        <p className="text-xs leading-relaxed text-slate-800 dark:text-slate-100 font-mono bg-white/60 dark:bg-slate-900/60 p-3.5 rounded-xl border border-emerald-200/50 dark:border-emerald-900/30 font-semibold">
                          {item.newContent}
                        </p>
                      </div>
                    </div>

                    {/* Expert Analysis Note */}
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2.5">
                      <Zap className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-slate-900 dark:text-white font-bold block mb-0.5">
                          <Lightbulb className="w-3.5 h-3.5 inline text-amber-500" aria-hidden="true" /> Đánh giá tác động chuyên môn:
                        </strong>
                        <span>{item.analysisNote}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
