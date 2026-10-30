'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Scale,
  Search,
  BookOpen,
  Calendar,
  ChevronRight,
  Sparkles,
  Quote,
  Copy,
  Check,
  Building2,
  Filter,
  Eye,
  Gavel,
  ShieldCheck,
  FileText,
  X,
} from 'lucide-react';
import { getTopicIcon } from '@/lib/topic-icons';
import { useEscapeToClose } from '@/lib/useEscapeToClose';

const API_BASE = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001');

interface CaseLawItem {
  id: string;
  precedentNumber: string;
  title: string;
  topic: string;
  issuingDecision: string;
  approvalDate?: string;
  legalRule: string;
  factualSummary: string;
  applicableArticles?: string;
  fullText: string;
  keywords: string[];
  citationCount: number;
}

// Fallback shown only until the real taxonomy loads from the backend (kept in
// sync there — see caseLawRouter.get('/topics') — so this list never has to
// be hand-copied here again).
const FALLBACK_TOPICS = [{ id: 'ALL', name: 'Tất cả Án lệ', icon: 'landmark' }];

export default function CaseLawPage() {
  const [items, setItems] = useState<CaseLawItem[]>([]);
  const [topics, setTopics] = useState<{ id: string; name: string; icon: string }[]>(FALLBACK_TOPICS);
  const [selectedTopic, setSelectedTopic] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<CaseLawItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEscapeToClose(!!selectedItem, () => setSelectedItem(null));

  useEffect(() => {
    fetch(`${API_BASE}/api/case-law/topics`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setTopics(data);
      })
      .catch((err) => console.error('[CaseLaw] Topics fetch error:', err));
  }, []);

  const fetchCaseLaws = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedTopic !== 'ALL') params.set('topic', selectedTopic);
      if (searchQuery) params.set('search', searchQuery);

      const res = await fetch(`${API_BASE}/api/case-law/items?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      }
    } catch (err) {
      console.error('[CaseLaw] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedTopic, searchQuery]);

  useEffect(() => {
    fetchCaseLaws();
  }, [fetchCaseLaws]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchInput.trim());
  };

  const handleCopyRule = (e: React.MouseEvent, item: CaseLawItem) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`[${item.precedentNumber}] ${item.legalRule}`);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 pb-24">
      {/* Hero Section */}
      <section className="relative bg-white border-b border-slate-200 py-14 px-4 overflow-hidden">
        <div className="relative max-w-5xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent-50 border border-accent-100 text-xs text-accent-700 font-semibold">
            <Gavel className="w-3.5 h-3.5" />
            <span>Kho Án Lệ Tòa Án Nhân Dân Tối Cao & Dự Đoán Phán Quyết</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900">
            Sổ Tay <span className="text-accent-600">Án Lệ Pháp Luật</span> Việt Nam
          </h1>

          <p className="text-sm sm:text-base text-slate-500 max-w-2xl mx-auto leading-relaxed">
            Tra cứu chuẩn xác 70+ Án lệ được Hội đồng Thẩm phán TAND Tối cao lựa chọn và công bố. Rút trích quy tắc pháp lý, căn cứ xét xử và hướng dẫn áp dụng vào tình huống tranh chấp thực tế.
          </p>

          {/* Search Box */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto pt-2">
            <div className="relative flex items-center">
              <label htmlFor="an-le-search" className="sr-only">Tìm kiếm án lệ</label>
              <input
                id="an-le-search"
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Tìm theo số hiệu án lệ (VD: Án lệ 25), từ khóa (đặt cọc, sa thải, phân chia tài sản)..."
                className="w-full bg-white border border-slate-300 rounded-2xl py-3.5 pl-11 pr-28 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent-400 shadow-sm"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-4" aria-hidden="true" />
              <button
                type="submit"
                className="absolute right-2 px-4 py-2 bg-accent-500 hover:bg-accent-600 text-white font-bold text-xs rounded-xl shadow-sm transition-colors"
              >
                Tra cứu
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 pt-8 space-y-6">
        {/* Topic Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {topics.map((t) => {
            const isSelected = selectedTopic === t.id;
            const TopicIcon = getTopicIcon(t.icon);
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedTopic(t.id)}
                className={`px-3.5 py-2 rounded-2xl text-xs font-bold shrink-0 transition-all border flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#0B1D51] text-yellow-400 border-[#0B1D51] dark:bg-yellow-400 dark:text-[#0B1D51] dark:border-yellow-400 shadow-md scale-105'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-yellow-400/40'
                }`}
              >
                <TopicIcon className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{t.name}</span>
              </button>
            );
          })}
        </div>

        {/* Counter and Results */}
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium px-1">
          <span>
            Tìm thấy <strong className="text-slate-800 dark:text-slate-100">{items.length}</strong> Án lệ tiêu biểu
          </span>
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSearchInput('');
              }}
              className="text-yellow-600 dark:text-yellow-400 hover:underline"
            >
              <X className="w-3 h-3 inline" aria-hidden="true" /> Xóa tìm kiếm &quot;{searchQuery}&quot;
            </button>
          )}
        </div>

        {/* Precedents Grid */}
        {loading ? (
          <div className="py-20 text-center text-xs text-slate-400">Đang tải danh mục án lệ...</div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
            <Scale className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">Không tìm thấy Án lệ phù hợp</h3>
            <p className="text-xs text-slate-400 mt-1">Thử đổi từ khóa hoặc chủ đề tra cứu.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {items.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 hover:border-yellow-400/50 transition-all shadow-sm cursor-pointer flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-extrabold border border-blue-500/20">
                      {item.precedentNumber}
                    </span>

                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Eye className="w-3 h-3" /> {item.citationCount} lượt tham khảo
                    </span>
                  </div>

                  <h3 className="text-base font-black text-slate-900 dark:text-white leading-snug group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-colors">
                    {item.title}
                  </h3>

                  {/* Legal Rule Quotation Box */}
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs leading-relaxed text-slate-800 dark:text-slate-200 space-y-2 relative">
                    <div className="flex items-center justify-between text-yellow-700 dark:text-yellow-400 font-bold uppercase text-[10px] tracking-wider">
                      <span className="flex items-center gap-1">
                        <Quote className="w-3 h-3" />
                        Khái quát Quy tắc Pháp lý
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleCopyRule(e, item)}
                        className="text-[10px] px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-amber-500/30 hover:bg-amber-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-1 text-slate-700 dark:text-slate-300"
                      >
                        {copiedId === item.id ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedId === item.id ? 'Đã copy' : 'Copy'}</span>
                      </button>
                    </div>
                    <p className="line-clamp-3 italic">{item.legalRule}</p>
                  </div>

                  {/* Applicable Articles */}
                  {item.applicableArticles && (
                    <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span className="truncate">Căn cứ: <strong>{item.applicableArticles}</strong></span>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400 truncate max-w-[200px]">
                    {item.issuingDecision}
                  </span>
                  <span className="text-yellow-600 dark:text-yellow-400 font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    <span>Xem toàn văn</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Precedent Detail Modal */}
      {selectedItem && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in-50"
          onClick={() => setSelectedItem(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="an-le-modal-title"
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-xs font-bold text-yellow-600 dark:text-yellow-400 uppercase tracking-wider block mb-1">
                  {selectedItem.precedentNumber} • {selectedItem.issuingDecision}
                </span>
                <h2 id="an-le-modal-title" className="text-xl font-black text-slate-900 dark:text-white leading-snug">
                  {selectedItem.title}
                </h2>
              </div>

              <button
                onClick={() => setSelectedItem(null)}
                aria-label="Đóng cửa sổ"
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            {/* Legal Rule Highlight */}
            <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs sm:text-sm text-slate-800 dark:text-slate-200 space-y-2">
              <strong className="text-yellow-700 dark:text-yellow-400 font-bold uppercase text-xs flex items-center gap-1.5">
                <Quote className="w-4 h-4" />
                Khái quát Nội dung Quy tắc Pháp lý Rút ra:
              </strong>
              <p className="leading-relaxed font-medium italic">{selectedItem.legalRule}</p>
            </div>

            {/* Factual Summary */}
            <div className="space-y-2 text-xs sm:text-sm">
              <h4 className="font-bold text-slate-900 dark:text-white uppercase text-xs tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-blue-500" />
                1. Tóm tắt Tình huống Thực tế của Án lệ
              </h4>
              <p className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 leading-relaxed">
                {selectedItem.factualSummary}
              </p>
            </div>

            {/* Judicial Reasoning & Decision */}
            <div className="space-y-2 text-xs sm:text-sm">
              <h4 className="font-bold text-slate-900 dark:text-white uppercase text-xs tracking-wider flex items-center gap-1.5">
                <Gavel className="w-4 h-4 text-emerald-500" />
                2. Nhận định và Phán quyết của Hội đồng Thẩm phán TANDTC
              </h4>
              <p className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 leading-relaxed">
                {selectedItem.fullText}
              </p>
            </div>

            {/* Applicable Legal Articles */}
            {selectedItem.applicableArticles && (
              <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 text-xs text-blue-900 dark:text-blue-300 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-500 shrink-0" />
                <span>Điều luật áp dụng: <strong>{selectedItem.applicableArticles}</strong></span>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="px-5 py-2.5 rounded-xl bg-[#0B1D51] text-yellow-400 dark:bg-yellow-400 dark:text-[#0B1D51] font-bold text-xs shadow transition-colors"
              >
                Đóng cửa sổ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
