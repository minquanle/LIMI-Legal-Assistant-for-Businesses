'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Scale,
  BookOpen,
  FileText,
  Copy,
  Check,
  ChevronRight,
  ShieldCheck,
  MapPin,
  Zap,
  X,
} from 'lucide-react';
import Link from 'next/link';

interface QALiveAskBoxProps {
  onSuccess?: () => void;
}

const SAMPLE_PROMPTS = [
  'Công ty có được ký HĐ thử việc 2 lần không?',
  'Bảng giá đất 2026 áp dụng tính thuế thế nào?',
  'Thời gian thử việc tối đa của Kế toán trưởng?',
  'Quy định đóng BHXH tối thiểu 15 năm từ 2025?',
];

export function QALiveAskBox({ onSuccess }: QALiveAskBoxProps) {
  const [question, setQuestion] = useState('');
  const [persona, setPersona] = useState('Chung');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'tldr' | 'full'>('full');
  const [error, setError] = useState<string | null>(null);
  const MAX_QUESTION_LENGTH = 2000;

  const handleAsk = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!question.trim() || loading) return;

    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch('/api/qa/ask-live', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: question.trim(), persona }),
      });

      if (!res.ok) throw new Error('Yêu cầu thất bại');
      const data = await res.json();
      setResult(data);
      if (onSuccess) onSuccess();
    } catch (err) {
      setError('Không thể kết nối với Trợ lý AI. Vui lòng thử lại sau giây lát.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    const text = `CÂU HỎI: ${result.question}\n\nTÌNH HUỐNG: ${result.situation}\n\nTÓM TẮT: ${result.tldrSummary}\n\nHƯỚNG DẪN:\n${result.answer}\n\nLỜI KHUYÊN: ${result.practicalTip}\n\nCĂN CỨ: ${result.legalBasis}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative rounded-3xl bg-gradient-to-b from-[#0B1D51] to-[#08163A] border border-yellow-400/30 p-6 sm:p-8 shadow-2xl overflow-hidden text-white mb-10">
      {/* Decorative ambient background glows */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto">
        {/* Header Title */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-yellow-400 to-amber-500 text-[#0B1D51] shadow-lg shadow-yellow-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Hỏi Trợ lý AI Pháp lý Trực tiếp
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Live RAG 2026
                </span>
              </h2>
              <p className="text-xs text-white/60">
                Nhập tình huống pháp lý của bạn — AI đối chiếu 214.000+ văn bản và giải đáp trong 3 giây
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="qa-ask-persona" className="text-xs text-white/60 hidden sm:inline">Đối tượng:</label>
            <select
              id="qa-ask-persona"
              value={persona}
              onChange={(e) => setPersona(e.target.value)}
              className="text-xs bg-white/10 border border-white/20 rounded-xl px-3 py-1.5 text-white font-medium focus:outline-none focus:ring-2 focus:ring-yellow-400"
            >
              <option value="Chung" className="bg-[#0B1D51] text-white">Chung (Mọi đối tượng)</option>
              <option value="Doanh nghiệp & HR" className="bg-[#0B1D51] text-white">Doanh nghiệp & HR</option>
              <option value="Người dân & Đất đai" className="bg-[#0B1D51] text-white">Người dân & Đất đai</option>
              <option value="Kế toán & Thuế" className="bg-[#0B1D51] text-white">Kế toán & Thuế</option>
              <option value="Hợp đồng & Đầu tư" className="bg-[#0B1D51] text-white">Hợp đồng & Đầu tư</option>
              <option value="Cán bộ & Thủ tục công" className="bg-[#0B1D51] text-white">Cán bộ & Pháp chế</option>
            </select>
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleAsk} className="relative mt-3">
          <label htmlFor="qa-ask-question" className="sr-only">Câu hỏi pháp lý của bạn</label>
          <div className="relative flex items-center">
            <textarea
              id="qa-ask-question"
              value={question}
              onChange={(e) => setQuestion(e.target.value.slice(0, MAX_QUESTION_LENGTH))}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleAsk();
                }
              }}
              rows={2}
              maxLength={MAX_QUESTION_LENGTH}
              placeholder="Ví dụ: Công ty có được quyền sa thải nhân viên đang trong thời gian nghỉ thai sản không? Mức phạt là bao nhiêu?"
              className="w-full bg-white/10 hover:bg-white/[0.12] focus:bg-white/15 border border-white/20 focus:border-yellow-400 rounded-2xl py-3.5 pl-4 pr-28 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-4 focus:ring-yellow-400/20 transition-all resize-none shadow-inner"
            />
            <button
              type="submit"
              disabled={loading || !question.trim()}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-[#0B1D51] font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-md shadow-yellow-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  <span>Đang giải đáp...</span>
                </>
              ) : (
                <>
                  <span>Hỏi ngay</span>
                  <Send className="w-3.5 h-3.5" aria-hidden="true" />
                </>
              )}
            </button>
          </div>
          <div className="mt-1 flex items-center justify-between text-[10px] text-white/40">
            <span>{error ? '' : ' '}</span>
            <span>{question.length}/{MAX_QUESTION_LENGTH}</span>
          </div>
        </form>

        {error && (
          <div role="alert" className="mt-2 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-200 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span className="flex-1">{error}</span>
            <button type="button" onClick={() => setError(null)} aria-label="Đóng thông báo" className="text-rose-200/60 hover:text-rose-100">
              <X className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        )}

        {/* Quick Suggestion Chips */}
        <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-white/40 font-medium mr-1 flex items-center gap-1">
            <Lightbulb className="w-3 h-3 text-yellow-400" />
            Gợi ý nhanh:
          </span>
          {SAMPLE_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setQuestion(prompt);
              }}
              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 hover:border-yellow-400/40 text-white/70 hover:text-yellow-300 transition-colors text-[11px]"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* AI Answer Result Card */}
        {result && (
          <div className="mt-6 p-5 sm:p-6 rounded-2xl bg-white/[0.07] border border-white/15 backdrop-blur-xl shadow-xl animate-in fade-in-50 duration-300">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-md bg-emerald-500/20 text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                </span>
                <span className="text-xs font-semibold text-white/90">
                  Kết quả giải đáp từ AI Copilot
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* View Mode Toggle */}
                <div className="bg-black/30 p-0.5 rounded-lg border border-white/10 flex items-center text-xs">
                  <button
                    type="button"
                    onClick={() => setActiveTab('full')}
                    className={`px-2.5 py-1 rounded-md transition-colors ${
                      activeTab === 'full'
                        ? 'bg-yellow-400 text-[#0B1D51] font-bold shadow'
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    Chi tiết đầy đủ
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('tldr')}
                    className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 ${
                      activeTab === 'tldr'
                        ? 'bg-yellow-400 text-[#0B1D51] font-bold shadow'
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    <Zap className="w-3 h-3" aria-hidden="true" />
                    Tóm tắt 30s
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white text-xs flex items-center gap-1.5 transition-colors border border-white/10"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Đã copy' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Situation Header */}
            {result.situation && (
              <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200/90 leading-relaxed">
                <strong className="text-yellow-400 font-semibold mb-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
                  Bối cảnh tình huống thực tế:
                </strong>
                {result.situation}
              </div>
            )}

            {/* Content Based on Active Tab */}
            {activeTab === 'tldr' ? (
              <div className="mt-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-100 text-sm leading-relaxed">
                <strong className="text-emerald-400 font-bold mb-1 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" aria-hidden="true" />
                  KẾT LUẬN NHANH TRONG 30 GIÂY:
                </strong>
                {result.tldrSummary || result.answer}
              </div>
            ) : (
              <div className="mt-4 space-y-4 text-xs sm:text-sm text-white/90 leading-relaxed">
                <div className="whitespace-pre-line bg-black/20 p-4 rounded-xl border border-white/5 font-sans">
                  {result.answer}
                </div>

                {result.practicalTip && (
                  <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-200 text-xs flex items-start gap-2">
                    <Lightbulb className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-blue-300 font-semibold">Lời khuyên bỏ túi: </strong>
                      {result.practicalTip}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Statutory Citations */}
            {result.legalBasis && (
              <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5 text-yellow-400 font-medium">
                  <Scale className="w-3.5 h-3.5" />
                  <span>Căn cứ pháp lý: {result.legalBasis}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
