'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Search,
  MessageCircleQuestion,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  Sparkles,
  Tag,
  BookOpen,
  ArrowRight,
  Loader2,
  Lightbulb,
  Building2,
  Users,
  Scale,
  Calculator,
  ThumbsUp,
  SlidersHorizontal,
  ExternalLink,
  Globe,
  Home,
  X,
  MapPin,
  type LucideIcon,
} from 'lucide-react';
import { getTopicIcon } from '@/lib/topic-icons';
import { QALiveAskBox } from '@/components/qa/QALiveAskBox';

const API_BASE = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001');


interface QATopic {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  qaCount: number;
}

interface QAItem {
  id: string;
  slug?: string;
  question: string;
  answer: string;
  situation?: string;
  persona?: string;
  tldrSummary?: string;
  practicalTip?: string;
  legalBasis: string;
  tags: string[];
  viewCount: number;
  helpfulCount?: number;
  createdAt: string;
  topic: { id: string; name: string; slug: string; icon: string };
  document: { id: string; documentNumber: string; title: string; documentType: string };
}

interface QAResponse {
  items: QAItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const PERSONA_TABS: Array<{ id: string; label: string; icon: LucideIcon }> = [
  { id: 'ALL', label: 'Tất cả đối tượng', icon: Globe },
  { id: 'Doanh nghiệp & HR', label: 'Doanh nghiệp & HR', icon: Building2 },
  { id: 'Người dân & Đất đai', label: 'Người dân & Đất đai', icon: Home },
  { id: 'Kế toán & Thuế', label: 'Kế toán & Thuế', icon: Calculator },
  { id: 'Hợp đồng & Đầu tư', label: 'Hợp đồng & Đầu tư', icon: FileText },
  { id: 'Cán bộ & Thủ tục công', label: 'Cán bộ & Pháp chế', icon: Scale },
];

export default function HoiDapPage() {
  const [topics, setTopics] = useState<QATopic[]>([]);
  const [qaData, setQaData] = useState<QAResponse | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [selectedPersona, setSelectedPersona] = useState<string>('ALL');
  const [sortOrder, setSortOrder] = useState<'newest' | 'popular' | 'highest_voted'>('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const limit = 15;

  // Fetch topics
  useEffect(() => {
    fetch(`${API_BASE}/api/qa/topics`)
      .then((r) => r.json())
      .then(setTopics)
      .catch(console.error);
  }, []);

  // Fetch Q&A items
  const fetchQA = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: String(limit),
        sort: sortOrder,
      });
      if (selectedTopic) params.set('topicId', selectedTopic);
      if (selectedPersona && selectedPersona !== 'ALL') params.set('persona', selectedPersona);
      if (searchQuery) params.set('search', searchQuery);

      const res = await fetch(`${API_BASE}/api/qa/items?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setQaData(data);
      }
    } catch (err) {
      console.error('[HoiDap] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, selectedTopic, selectedPersona, searchQuery, sortOrder]);

  useEffect(() => {
    fetchQA();
  }, [fetchQA]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchInput.trim());
    setCurrentPage(1);
  };

  const handleTopicClick = (topicId: string) => {
    setSelectedTopic(selectedTopic === topicId ? '' : topicId);
    setCurrentPage(1);
  };

  const handlePersonaClick = (personaId: string) => {
    setSelectedPersona(personaId);
    setCurrentPage(1);
  };

  const toggleExpand = (id: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200">
      {/* Hero Header */}
      <section className="relative bg-white border-b border-slate-200 py-14 px-4 overflow-hidden">
        <div className="relative max-w-5xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-xs text-blue-700 font-semibold">
            <Sparkles className="w-4 h-4" />
            <span>Hơn 11.000+ Tình huống & Thắc mắc Pháp luật Thực tế</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900">
            Cổng Hỏi Đáp & Trợ Lý <span className="text-blue-700">Pháp Luật Tình Huống</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-500 max-w-2xl mx-auto leading-relaxed">
            Giải đáp vướng mắc pháp lý theo từng vai trò cụ thể: Doanh nghiệp, Kế toán, Nhân sự, Người dân. Tích hợp trích dẫn điều khoản và lời khuyên xử lý rủi ro.
          </p>

          {/* Main Search Bar */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto pt-2">
            <div className="relative flex items-center">
              <label htmlFor="hoi-dap-search" className="sr-only">Tìm kiếm câu hỏi pháp luật</label>
              <input
                id="hoi-dap-search"
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Nhập từ khóa tình huống (ví dụ: sa thải thai sản, bảng giá đất 2026, thử việc 2 lần...)"
                className="w-full bg-white border border-slate-300 focus:border-blue-400 rounded-2xl py-3.5 pl-11 pr-28 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all shadow-sm"
              />
              <Search className="w-5 h-5 text-slate-400 absolute left-4 pointer-events-none" aria-hidden="true" />
              <button
                type="submit"
                className="absolute right-2 px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs sm:text-sm transition-all shadow-sm"
              >
                Tìm kiếm
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-4 py-10 space-y-10">
        {/* 1. Live Ask AI Box Widget */}
        <QALiveAskBox onSuccess={fetchQA} />

        {/* 2. Persona Role Filters Bar */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-yellow-500" />
              Lọc theo Nhóm đối tượng & Vai trò
            </h2>
            {selectedPersona !== 'ALL' && (
              <button
                type="button"
                onClick={() => setSelectedPersona('ALL')}
                className="text-xs text-yellow-600 dark:text-yellow-400 font-semibold hover:underline"
              >
                Bỏ chọn lọc
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {PERSONA_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => handlePersonaClick(tab.id)}
                className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 border ${
                  selectedPersona === tab.id
                    ? 'bg-[#0B1D51] text-yellow-400 border-[#0B1D51] dark:bg-yellow-400 dark:text-[#0B1D51] dark:border-yellow-400 shadow-md scale-105'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-yellow-400/50 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 3. Topics Carousel / Horizontal Badges */}
        {topics.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-blue-500" />
                Chủ đề Pháp luật Nổi bật (3.800+ Chuyên đề)
              </h2>
              {selectedTopic && (
                <button
                  type="button"
                  onClick={() => setSelectedTopic('')}
                  className="text-xs text-yellow-600 dark:text-yellow-400 font-semibold hover:underline inline-flex items-center gap-1"
                >
                  <X className="w-3 h-3" aria-hidden="true" />
                  Bỏ lọc chủ đề
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              <button
                type="button"
                onClick={() => handleTopicClick('')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-colors border ${
                  !selectedTopic
                    ? 'bg-yellow-400 text-[#0B1D51] border-yellow-400'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                Tất cả chủ đề
              </button>

              {topics.map((t) => {
                const isSelected = selectedTopic === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleTopicClick(t.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium shrink-0 transition-all border flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-[#0B1D51] text-yellow-400 border-[#0B1D51] dark:bg-yellow-400 dark:text-[#0B1D51] font-bold shadow-md scale-105'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-yellow-400/40'
                    }`}
                  >
                    {(() => {
                      const TopicIcon = getTopicIcon(t.icon);
                      return <TopicIcon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />;
                    })()}
                    <span>{t.name}</span>
                    <span className="text-[10px] opacity-60">({t.qaCount})</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Selected Topic Notice Banner */}
        {selectedTopic && (
          <div className="p-4 rounded-2xl bg-yellow-400/10 border border-yellow-400/30 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-semibold">
              <span className="p-1 rounded-md bg-yellow-400 text-[#0B1D51] font-bold inline-flex">
                {(() => {
                  const TopicIcon = getTopicIcon(topics.find((t) => t.id === selectedTopic)?.icon);
                  return <TopicIcon className="w-3.5 h-3.5" aria-hidden="true" />;
                })()}
              </span>
              <span>
                Đang lọc câu hỏi theo chủ đề: <strong className="text-yellow-700 dark:text-yellow-400 font-bold">{topics.find((t) => t.id === selectedTopic)?.name}</strong>
              </span>
            </div>

            <div className="flex items-center gap-3">
              {topics.find((t) => t.id === selectedTopic)?.slug && (
                <Link
                  href={`/hoi-dap/chu-de/${topics.find((t) => t.id === selectedTopic)?.slug}`}
                  className="font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  <span>Xem trang chuyên đề riêng</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              )}
              <button
                type="button"
                onClick={() => setSelectedTopic('')}
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 font-semibold inline-flex items-center gap-1"
              >
                <X className="w-3 h-3" aria-hidden="true" />
                Bỏ lọc
              </button>
            </div>
          </div>
        )}


        {/* 4. Controls Bar: Sort and Counter */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-200 dark:border-slate-800">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Hiển thị <strong className="text-slate-800 dark:text-slate-100">{qaData?.items.length || 0}</strong> / {qaData?.total || 0} câu hỏi tình huống
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 flex items-center gap-1">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Sắp xếp theo:
            </span>
            <select
              value={sortOrder}
              onChange={(e) => {
                setSortOrder(e.target.value as any);
                setCurrentPage(1);
              }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-yellow-400"
            >
              <option value="newest">Mới cập nhật nhất</option>
              <option value="popular">Xem nhiều nhất</option>
              <option value="highest_voted">Đánh giá hữu ích cao nhất</option>
            </select>
          </div>
        </div>

        {/* 5. Q&A List with Accordion and Dedicated Link Cards */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
            <span className="text-xs font-medium">Đang tải danh sách câu hỏi tình huống...</span>
          </div>
        ) : qaData?.items.length === 0 ? (
          <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8">
            <MessageCircleQuestion className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">Không tìm thấy câu hỏi phù hợp</h3>
            <p className="text-xs text-slate-400 mt-1">Hãy thử tìm kiếm với từ khóa khác hoặc đặt câu hỏi trực tiếp cho AI ở trên.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {qaData?.items.map((item) => {
              const isExpanded = expandedItems.has(item.id);
              return (
                <div
                  key={item.id}
                  className={`bg-white dark:bg-slate-900 rounded-3xl border transition-all overflow-hidden ${
                    isExpanded
                      ? 'border-yellow-400 dark:border-yellow-400/60 shadow-lg'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm'
                  }`}
                >
                  {/* Header Clickable Row */}
                  <div
                    onClick={() => toggleExpand(item.id)}
                    className="p-5 sm:p-6 cursor-pointer flex items-start justify-between gap-4 select-none hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="px-2.5 py-0.5 rounded-full font-bold bg-yellow-400/15 text-yellow-700 dark:text-yellow-400 border border-yellow-400/30 text-[11px]">
                          {item.persona || 'Chung'}
                        </span>
                        {item.topic && (
                          <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-medium">
                            {item.topic.name}
                          </span>
                        )}
                        <span className="text-slate-400 text-[11px] flex items-center gap-1 ml-auto sm:ml-0">
                          <Eye className="w-3 h-3" />
                          {item.viewCount || 0} lượt xem
                        </span>
                        {item.helpfulCount ? (
                          <span className="text-emerald-600 text-[11px] font-semibold flex items-center gap-1">
                            <ThumbsUp className="w-3 h-3" />
                            {item.helpfulCount} hữu ích
                          </span>
                        ) : null}
                      </div>

                      <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
                        {item.question}
                      </h3>

                      {item.situation && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 leading-relaxed flex items-start gap-1">
                          <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden="true" />
                          <span><strong className="font-semibold text-slate-600 dark:text-slate-300">Tình huống:</strong> {item.situation}</span>
                        </p>
                      )}
                    </div>

                    <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 shrink-0 mt-1">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>

                  {/* Expanded Body */}
                  {isExpanded && (
                    <div className="px-5 pb-6 sm:px-6 sm:pb-6 pt-2 border-t border-slate-100 dark:border-slate-800 space-y-4 animate-in fade-in-50 duration-200">
                      {/* Situation Box */}
                      {item.situation && (
                        <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 text-xs sm:text-sm text-amber-900 dark:text-amber-200 leading-relaxed">
                          <strong className="text-amber-800 dark:text-amber-400 font-bold mb-1 flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
                            Chi tiết Bối cảnh Tình huống:
                          </strong>
                          {item.situation}
                        </div>
                      )}

                      {/* Main Answer */}
                      <div className="p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line">
                        {item.answer}
                      </div>

                      {/* Practical Tip */}
                      {item.practicalTip && (
                        <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 text-xs sm:text-sm text-blue-950 dark:text-blue-200 flex items-start gap-2.5">
                          <Lightbulb className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
                          <div>
                            <strong className="text-blue-800 dark:text-blue-300 font-bold">Lời khuyên bỏ túi: </strong>
                            {item.practicalTip}
                          </div>
                        </div>
                      )}

                      {/* Footer Actions & Dedicated Link */}
                      <div className="pt-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400 font-semibold">
                          <Scale className="w-3.5 h-3.5" />
                          <span>Căn cứ: {item.legalBasis}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Link
                            href={`/hoi-dap/${item.slug || item.id}`}
                            className="px-3.5 py-1.5 rounded-xl bg-[#0B1D51] hover:bg-[#142d7a] text-yellow-400 font-bold flex items-center gap-1.5 shadow-sm transition-colors"
                          >
                            <span>Mở Trang Chi Tiết & Tải Mẫu Đơn</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* 6. Pagination Controls */}
        {qaData && qaData.totalPages > 1 && (
          <div className="pt-6 flex items-center justify-center gap-2">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              aria-label="Trang trước"
              className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" aria-hidden="true" />
            </button>

            <span className="text-xs font-semibold px-4 py-2">
              Trang {currentPage} / {qaData.totalPages}
            </span>

            <button
              type="button"
              disabled={currentPage >= qaData.totalPages}
              onClick={() => setCurrentPage((p) => Math.min(qaData.totalPages, p + 1))}
              aria-label="Trang sau"
              className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
