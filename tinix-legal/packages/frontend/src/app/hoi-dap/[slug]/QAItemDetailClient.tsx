'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  MessageCircleQuestion,
  Scale,
  Sparkles,
  Lightbulb,
  Share2,
  ThumbsUp,
  ThumbsDown,
  BookOpen,
  Copy,
  Check,
  Eye,
  ShieldCheck,
  Download,
  Building2,
  Calendar,
  FileCheck2,
  HelpCircle,
  MapPin,
  Zap,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface QAItemDetailClientProps {
  item: any;
  relatedItems: any[];
}

export function QAItemDetailClient({ item, relatedItems }: QAItemDetailClientProps) {
  const [activeTab, setActiveTab] = useState<'full' | 'tldr'>('full');
  const [helpfulCount, setHelpfulCount] = useState(item.helpfulCount || 0);
  const [unhelpfulCount, setUnhelpfulCount] = useState(item.unhelpfulCount || 0);
  const [voted, setVoted] = useState<'helpful' | 'unhelpful' | null>(null);
  const [copied, setCopied] = useState(false);

  const handleVote = async (type: 'helpful' | 'unhelpful') => {
    if (voted) return;
    setVoted(type);
    if (type === 'helpful') setHelpfulCount((prev: number) => prev + 1);
    else setUnhelpfulCount((prev: number) => prev + 1);

    try {
      await apiClient.voteQAItem(item.id, type);
    } catch (err) {
      console.error('Error voting:', err);
    }
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Main Column (2/3) */}
      <div className="lg:col-span-2 space-y-6">
        {/* Question Header Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
          {/* Metadata Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full font-bold bg-yellow-400/15 text-yellow-700 dark:text-yellow-400 border border-yellow-400/30">
                {item.persona || 'Chung'}
              </span>
              {item.topic && (
                <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                  {item.topic.name}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 text-slate-400">
              <span className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" />
                {item.viewCount || 1} lượt xem
              </span>
              <span className="flex items-center gap-1">
                <ThumbsUp className="w-3.5 h-3.5 text-emerald-500" />
                {helpfulCount} hữu ích
              </span>
            </div>
          </div>

          {/* Question Title */}
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white leading-snug mb-4">
            {item.question}
          </h1>

          {/* Situation Callout */}
          {item.situation && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-xs sm:text-sm text-amber-900 dark:text-amber-200 leading-relaxed mb-6">
              <strong className="text-amber-800 dark:text-amber-400 font-bold mb-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
                Tình huống thực tế điển hình:
              </strong>
              {item.situation}
            </div>
          )}

          {/* Mode Switcher Tabs */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-6">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('full')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'full'
                    ? 'bg-[#0B1D51] text-white dark:bg-yellow-400 dark:text-[#0B1D51] shadow-md'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
                Phân tích Chuyên sâu
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('tldr')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'tldr'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-500 hover:text-emerald-600 dark:text-slate-400'
                }`}
              >
                <Zap className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Tóm tắt 30s (TL;DR)</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleCopyLink}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Đã sao chép' : 'Chia sẻ'}</span>
            </button>
          </div>

          {/* Answer Body */}
          {activeTab === 'tldr' ? (
            <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-emerald-950 dark:text-emerald-100 text-sm sm:text-base leading-relaxed animate-in fade-in-50">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold mb-2">
                <Sparkles className="w-4 h-4" />
                <span>KẾT LUẬN & HƯỚNG XỬ LÝ NHANH:</span>
              </div>
              <p>{item.tldrSummary || item.answer}</p>
            </div>
          ) : (
            <div className="space-y-6 text-sm sm:text-base text-slate-800 dark:text-slate-200 leading-relaxed animate-in fade-in-50">
              <div className="whitespace-pre-line bg-slate-50/70 dark:bg-slate-800/40 p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
                {item.answer}
              </div>

              {/* Practical Tip */}
              {item.practicalTip && (
                <div className="p-5 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 text-xs sm:text-sm text-blue-950 dark:text-blue-100 flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-blue-500 text-white shrink-0 shadow-sm">
                    <Lightbulb className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="text-blue-800 dark:text-blue-300 font-bold block mb-1">
                      Lời khuyên thực tiễn từ Chuyên gia:
                    </strong>
                    {item.practicalTip}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Legal Basis Footer */}
          {item.legalBasis && (
            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400 font-semibold">
                <Scale className="w-4 h-4" />
                <span>Căn cứ áp dụng: {item.legalBasis}</span>
              </div>
              {item.documentId && (
                <Link
                  href={`/documents/${item.documentId}`}
                  className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 font-semibold"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Xem toàn văn văn bản</span>
                </Link>
              )}
            </div>
          )}

          {/* Voting Action Box */}
          <div className="mt-8 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 block">
                Câu trả lời này có hữu ích cho bạn không?
              </span>
              <span className="text-xs text-slate-400">
                Đánh giá của bạn giúp AI cải thiện độ chuẩn xác và phù hợp thực tế
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleVote('helpful')}
                disabled={voted !== null}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                  voted === 'helpful'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:border-emerald-500 hover:text-emerald-600 shadow-sm'
                }`}
              >
                <ThumbsUp className="w-4 h-4" />
                <span>Hữu ích ({helpfulCount})</span>
              </button>

              <button
                type="button"
                onClick={() => handleVote('unhelpful')}
                disabled={voted !== null}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                  voted === 'unhelpful'
                    ? 'bg-rose-600 text-white'
                    : 'bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:border-rose-500 hover:text-rose-600 shadow-sm'
                }`}
              >
                <ThumbsDown className="w-4 h-4" />
                <span>Chưa rõ ({unhelpfulCount})</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar Column (1/3) */}
      <div className="space-y-6">
        {/* Associated Document Card */}
        {item.document && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-blue-500" />
              Văn bản pháp lý gốc
            </h2>

            <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30">
              <span className="text-xs font-bold text-blue-700 dark:text-blue-400 block mb-1">
                {item.document.documentNumber}
              </span>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-2 leading-snug mb-3">
                {item.document.title}
              </p>

              <Link
                href={`/documents/${item.document.id}`}
                className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
              >
                <span>Mở Toàn văn & Cây Phả hệ</span>
              </Link>
            </div>
          </div>
        )}

        {/* Recommended Decree 30 / Contract Template */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-slate-900 dark:to-slate-800 rounded-3xl p-6 border border-amber-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center gap-2 text-amber-800 dark:text-yellow-400 font-bold text-xs uppercase tracking-wider mb-2">
            <FileCheck2 className="w-4 h-4" />
            Mẫu tài liệu liên quan (.docx)
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
            Áp dụng chuẩn Thể thức Văn bản Hành chính (NĐ 30/2020/NĐ-CP) và Mẫu Hợp đồng Doanh nghiệp.
          </p>

          <div className="space-y-2">
            <a
              href="/soan-thao"
              className="w-full py-2.5 px-3 rounded-xl bg-white dark:bg-slate-800 border border-amber-200 dark:border-slate-600 hover:border-amber-400 text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center justify-between transition-all group shadow-sm"
            >
              <div className="flex items-center gap-2">
                <Download className="w-3.5 h-3.5 text-amber-600 group-hover:scale-110 transition-transform" />
                <span>Mẫu Văn bản Soạn thảo AI</span>
              </div>
              <span className="text-[10px] bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 px-1.5 py-0.5 rounded font-bold">
                NĐ 30
              </span>
            </a>
          </div>
        </div>

        {/* Related Questions List */}
        {relatedItems.length > 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-1.5">
              <MessageCircleQuestion className="w-4 h-4 text-yellow-500" />
              Tình huống cùng chủ đề
            </h2>

            <div className="space-y-3">
              {relatedItems.map((rel) => (
                <Link
                  key={rel.id}
                  href={`/hoi-dap/${rel.slug || rel.id}`}
                  className="block p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800 hover:border-yellow-400/40 transition-all group"
                >
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-yellow-600 dark:group-hover:text-yellow-400 line-clamp-2 leading-snug mb-1">
                    {rel.question}
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>{rel.persona || 'Chung'}</span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {rel.viewCount || 0}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
