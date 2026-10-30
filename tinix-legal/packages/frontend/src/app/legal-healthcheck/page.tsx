'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Activity,
  Award,
  ShieldCheck,
  AlertOctagon,
  CheckCircle2,
  AlertTriangle,
  Building2,
  FileCheck2,
  Printer,
  Sparkles,
  ChevronRight,
  ArrowRight,
  RotateCcw,
  Scale,
} from 'lucide-react';
import { getTopicIcon } from '@/lib/topic-icons';

const API_BASE = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001');

interface Question {
  id: string;
  question: string;
  weight: number;
  riskIfNotCompliant: string;
  remediationGuide: string;
  legalBasis: string;
}

interface Pillar {
  id: string;
  name: string;
  icon: string;
  weight: number;
  description: string;
  questions: Question[];
}

interface EvaluationResult {
  companyName: string;
  evaluatedAt: string;
  overallScore: number;
  grade: string;
  gradeText: string;
  pillarResults: Array<{
    pillarId: string;
    pillarName: string;
    icon: string;
    weight: number;
    score: number;
    remediations: Array<{
      question: string;
      risk: string;
      action: string;
      legalBasis: string;
    }>;
  }>;
  urgentActions: Array<{
    question: string;
    risk: string;
    action: string;
    legalBasis: string;
  }>;
  totalUrgentCount: number;
}

export default function LegalHealthcheckPage() {
  const [pillars, setPillars] = useState<Pillar[]>([]);
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [companyName, setCompanyName] = useState('Công ty Cổ phần / TNHH');
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [evaluating, setEvaluating] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch schema
  useEffect(() => {
    fetch(`${API_BASE}/api/healthcheck/schema`)
      .then((r) => r.json())
      .then((data) => {
        setPillars(data.pillars || []);
        // Initialize default answers to false
        const initAnswers: Record<string, boolean> = {};
        (data.pillars || []).forEach((p: Pillar) => {
          p.questions.forEach((q) => {
            initAnswers[q.id] = false;
          });
        });
        setAnswers(initAnswers);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleEvaluate = async () => {
    setEvaluating(true);
    try {
      const res = await fetch(`${API_BASE}/api/healthcheck/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers, companyName }),
      });
      if (res.ok) {
        const data = await res.json();
        setResult(data);
      }
    } catch (err) {
      console.error('Healthcheck evaluation error:', err);
    } finally {
      setEvaluating(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    const resetAnswers: Record<string, boolean> = {};
    pillars.forEach((p) => {
      p.questions.forEach((q) => {
        resetAnswers[q.id] = false;
      });
    });
    setAnswers(resetAnswers);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 pb-24">
      {/* Hero Section */}
      <section className="relative bg-white border-b border-slate-200 py-14 px-4 overflow-hidden">
        <div className="relative max-w-5xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-xs text-blue-700 font-semibold">
            <Activity className="w-3.5 h-3.5" />
            <span>Công Cụ Khám Sức Khỏe Pháp Lý & Tự Kiểm Toán Rủi Ro (Due Diligence 360°)</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900">
            Đo Lường <span className="text-blue-700">Sức Khỏe Pháp Lý</span> Doanh Nghiệp
          </h1>

          <p className="text-sm sm:text-base text-slate-500 max-w-2xl mx-auto leading-relaxed">
            Kiểm tra 5 trụ cột rủi ro cốt lõi: Hồ sơ pháp nhân & vốn, Hợp đồng kinh tế, Lao động & BHXH, Sở hữu trí tuệ và Dữ liệu cá nhân (NĐ 13). Nhận ngay Báo cáo Khắc phục Rủi ro dành cho Ban Giám đốc.
          </p>
        </div>
      </section>

      {/* Main Container */}
      <div className="max-w-5xl mx-auto px-4 pt-8 space-y-8">
        {!result ? (
          /* Diagnostic Wizard Mode */
          <div className="space-y-8 animate-in fade-in-50">
            <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Tên Doanh Nghiệp / Đơn Vị Đánh Giá:</h3>
                <p className="text-xs text-slate-500">Báo cáo sẽ được xuất dưới tên pháp nhân này.</p>
              </div>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="VD: Công ty TNHH Công Nghệ & TM Tinix..."
                className="w-full sm:w-80 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>

            {loading ? (
              <div className="py-20 text-center text-xs text-slate-400">Đang tải bộ tiêu chuẩn thẩm định...</div>
            ) : (
              <div className="space-y-8">
                {pillars.map((pillar) => (
                  <div
                    key={pillar.id}
                    className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-4 shadow-sm"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {(() => {
                          const PillarIcon = getTopicIcon(pillar.icon);
                          return <PillarIcon className="w-6 h-6 text-indigo-500 shrink-0" aria-hidden="true" />;
                        })()}
                        <div className="min-w-0">
                          <h3 className="text-base font-black text-slate-900 dark:text-white">
                            {pillar.name}
                          </h3>
                          <p className="text-xs text-slate-500">{pillar.description}</p>
                        </div>
                      </div>
                      <span className="shrink-0 whitespace-nowrap text-xs font-bold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        Trọng số: {pillar.weight}%
                      </span>
                    </div>

                    {/* Questions Checklist */}
                    <div className="space-y-3 pt-1">
                      {pillar.questions.map((q) => {
                        const checked = !!answers[q.id];
                        return (
                          <label
                            key={q.id}
                            className={`p-4 rounded-2xl border flex items-start gap-3.5 cursor-pointer select-none transition-all ${
                              checked
                                ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200 font-semibold'
                                : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.checked })}
                              className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                            />
                            <div className="flex-1 space-y-1 text-xs sm:text-sm">
                              <p className="leading-relaxed">{q.question}</p>
                              <span className="text-[11px] text-slate-400 block font-normal">
                                <Scale className="w-3 h-3 inline" aria-hidden="true" /> Căn cứ: {q.legalBasis}
                              </span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* Submit Action */}
                <div className="p-6 bg-blue-50 border border-blue-100 rounded-3xl flex flex-wrap items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h4 className="text-base font-extrabold flex items-center gap-2 text-slate-900">
                      <Sparkles className="w-5 h-5 text-accent-600" />
                      <span>Hoàn tất trắc nghiệm đánh giá</span>
                    </h4>
                    <p className="text-xs text-slate-500">
                      Hệ thống sẽ tính điểm chi tiết 5 trụ cột và chỉ ra danh sách hành động cần khắc phục ngay.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleEvaluate}
                    disabled={evaluating}
                    className="px-6 py-3 bg-blue-700 hover:bg-blue-800 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-sm transition-transform active:scale-95 flex items-center gap-2"
                  >
                    <span>{evaluating ? 'Đang thẩm định...' : 'Xem Kết Quả & Xuất Báo Cáo'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Diagnostic Result Report Mode */
          <div className="space-y-8 animate-in fade-in-50">
            {/* Top Score Banner */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-xs font-bold text-yellow-600 dark:text-yellow-400 uppercase tracking-wider block mb-1">
                    Báo Cáo Thẩm Định Sức Khỏe Pháp Lý Doanh Nghiệp (Due Diligence)
                  </span>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                    {result.companyName}
                  </h2>
                  <span className="text-[11px] text-slate-400">
                    Thời điểm đánh giá: {new Date(result.evaluatedAt).toLocaleString('vi-VN')}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <Printer className="w-4 h-4" />
                    <span>In / Lưu PDF</span>
                  </button>

                  <button
                    onClick={handleReset}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors text-slate-600 dark:text-slate-300"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Đánh giá lại</span>
                  </button>
                </div>
              </div>

              {/* Overall Score Gauge */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                <div className="p-6 rounded-3xl bg-blue-50 border border-blue-100 text-center space-y-2">
                  <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">
                    Điểm Sức Khỏe Pháp Lý (Health Score)
                  </span>
                  <span className="text-5xl font-black text-accent-600 block">{result.overallScore}/100</span>
                  <span className="text-[11px] text-slate-500 block">Thang điểm 100 theo chuẩn Due Diligence</span>
                </div>

                <div className="col-span-2 space-y-3">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Xếp loại & Nhận định Tổng quan:</h3>
                  <div
                    className={`p-4 rounded-2xl border text-xs sm:text-sm font-bold leading-relaxed flex items-start gap-2 ${
                      result.grade === 'EXCELLENT'
                        ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300'
                        : result.grade === 'GOOD'
                        ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-300 dark:border-blue-800 text-blue-900 dark:text-blue-300'
                        : result.grade === 'MODERATE_RISK'
                        ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-yellow-300'
                        : 'bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-300'
                    }`}
                  >
                    {/* Icon carries the grade too, so it never rests on colour alone. */}
                    {result.grade === 'EXCELLENT' ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                    ) : result.grade === 'GOOD' ? (
                      <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                    ) : result.grade === 'MODERATE_RISK' ? (
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                    ) : (
                      <AlertOctagon className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                    )}
                    <span>{result.gradeText}</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Có tổng cộng <strong>{result.totalUrgentCount} điểm nóng</strong> tiềm ẩn rủi ro xử phạt vi phạm hành chính hoặc tranh chấp hợp đồng cần được khắc phục theo lộ trình bên dưới.
                  </p>
                </div>
              </div>

              {/* 5-Pillar Score Cards */}
              <div className="space-y-3 pt-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Điểm Số Chi Tiết Theo 5 Trụ Cột:
                  </h4>
                  <div className="flex flex-wrap items-center gap-3 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                    <span className="inline-flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-500" aria-hidden="true" /> ≥ 80%: Tốt</span>
                    <span className="inline-flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-yellow-500" aria-hidden="true" /> 50–79%: Cần cải thiện</span>
                    <span className="inline-flex items-center gap-1"><AlertOctagon className="w-3 h-3 text-rose-500" aria-hidden="true" /> &lt; 50%: Rủi ro cao</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                  {result.pillarResults.map((pr) => {
                    const ScoreIcon = pr.score >= 80 ? CheckCircle2 : pr.score >= 50 ? AlertTriangle : AlertOctagon;
                    const scoreColorClass = pr.score >= 80 ? 'text-emerald-500' : pr.score >= 50 ? 'text-yellow-500' : 'text-rose-500';
                    const PillarIcon = getTopicIcon(pr.icon);
                    return (
                      <div
                        key={pr.pillarId}
                        className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-center space-y-1.5"
                      >
                        <PillarIcon className="w-5 h-5 mx-auto text-indigo-500" aria-hidden="true" />
                        <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{pr.pillarName}</h5>
                        <span className={`text-lg font-black flex items-center justify-center gap-1 ${scoreColorClass}`}>
                          <ScoreIcon className="w-3.5 h-3.5" aria-hidden="true" />
                          {pr.score}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* High-Risk Action Plan */}
            {result.urgentActions.length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-rose-300/40 dark:border-rose-900/40 p-6 sm:p-8 space-y-4 shadow-sm">
                <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-extrabold text-xs uppercase tracking-wider">
                  <AlertOctagon className="w-5 h-5" />
                  <span>Kế Hoạch Khắc Phục Rủi Ro Cần Ưu Tiên ({result.urgentActions.length} Hạng mục)</span>
                </div>

                <div className="space-y-4">
                  {result.urgentActions.map((action, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 space-y-2 text-xs leading-relaxed"
                    >
                      <strong className="text-rose-900 dark:text-rose-300 font-bold block text-sm">
                        {idx + 1}. {action.question}
                      </strong>
                      <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-rose-200/60 dark:border-rose-900/30 space-y-1">
                        <span className="text-rose-700 dark:text-rose-400 font-semibold flex items-start gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden="true" /> Rủi ro nếu không tuân thủ: {action.risk}
                        </span>
                        <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-start gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden="true" /> Hướng dẫn khắc phục: {action.action}
                        </span>
                        <span className="text-slate-400 text-[11px] flex items-start gap-1.5 mt-1">
                          <Scale className="w-3 h-3 shrink-0 mt-0.5" aria-hidden="true" /> Căn cứ pháp luật: {action.legalBasis}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
