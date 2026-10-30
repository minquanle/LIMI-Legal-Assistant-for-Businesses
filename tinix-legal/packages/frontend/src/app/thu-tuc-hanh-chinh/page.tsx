'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  FileCheck,
  Search,
  Building2,
  Clock,
  DollarSign,
  Download,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  FileText,
  Layers,
  Sparkles,
  Info,
  CheckCircle2,
  X,
} from 'lucide-react';
import { getTopicIcon } from '@/lib/topic-icons';
import { useEscapeToClose } from '@/lib/useEscapeToClose';

const API_BASE = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001');

interface DossierItem {
  id: string;
  name: string;
  required: boolean;
  note?: string;
}

interface StepItem {
  stepNumber: number;
  title: string;
  description: string;
  department: string;
  duration: string;
}

interface TemplateItem {
  name: string;
  format: string;
  url: string;
}

interface ProcedureItem {
  id: string;
  code: string;
  title: string;
  category: string;
  categoryName: string;
  authority: string;
  processingDays: number;
  fee: string;
  targetSubject: string;
  legalBasis: string;
  dossierList: DossierItem[];
  stepTimeline: StepItem[];
  templates: TemplateItem[];
  onlinePortalUrl?: string;
  notes?: string;
}

// Fallback shown only until the real taxonomy loads from the backend (kept in
// sync there — see procedureRouter.get('/categories') — so this list never
// has to be hand-maintained here again).
const FALLBACK_CATEGORIES = [{ id: 'ALL', name: 'Tất cả thủ tục', icon: 'landmark' }];

export default function ThuTucHanhChinhPage() {
  const [items, setItems] = useState<ProcedureItem[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string; icon: string }[]>(FALLBACK_CATEGORIES);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedProcedure, setSelectedProcedure] = useState<ProcedureItem | null>(null);

  useEscapeToClose(!!selectedProcedure, () => setSelectedProcedure(null));

  useEffect(() => {
    fetch(`${API_BASE}/api/procedures/categories`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setCategories(data);
      })
      .catch((err) => console.error('[Procedures] Categories fetch error:', err));
  }, []);

  const fetchProcedures = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== 'ALL') params.set('category', selectedCategory);
      if (searchQuery) params.set('search', searchQuery);

      const res = await fetch(`${API_BASE}/api/procedures/list?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      }
    } catch (err) {
      console.error('[Procedures] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, searchQuery]);

  useEffect(() => {
    fetchProcedures();
  }, [fetchProcedures]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchInput.trim());
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 pb-24">
      {/* Hero Section */}
      <section className="relative bg-white border-b border-slate-200 py-14 px-4 overflow-hidden">
        <div className="relative max-w-5xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-xs text-blue-700 font-semibold">
            <FileCheck className="w-3.5 h-3.5" />
            <span>Cẩm Nang Hướng Dẫn Từng Bước Thủ Tục Hành Chính Công Chuẩn Xác</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900">
            Navigator <span className="text-blue-700">Thủ Tục Hành Chính</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-500 max-w-2xl mx-auto leading-relaxed">
            Quy trình chuẩn hóa từng bước nộp hồ sơ, thời hạn giải quyết, mức phí nhà nước và tải 1-click toàn bộ biểu mẫu đơn từ theo quy định mới nhất.
          </p>

          {/* Search Box */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto pt-2">
            <div className="relative flex items-center">
              <label htmlFor="tthc-search" className="sr-only">Tìm kiếm thủ tục hành chính</label>
              <input
                id="tthc-search"
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Tìm tên thủ tục (thành lập công ty, sang tên sổ đỏ, đăng ký nhãn hiệu)..."
                className="w-full bg-white border border-slate-300 rounded-2xl py-3.5 pl-11 pr-28 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-4" aria-hidden="true" />
              <button
                type="submit"
                className="absolute right-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-sm transition-colors"
              >
                Tìm kiếm
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 pt-8 space-y-6">
        {/* Category Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((c) => {
            const isSelected = selectedCategory === c.id;
            const CategoryIcon = getTopicIcon(c.icon);
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedCategory(c.id)}
                className={`px-3.5 py-2 rounded-2xl text-xs font-bold shrink-0 transition-all border flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#0B1D51] text-yellow-400 border-[#0B1D51] dark:bg-yellow-400 dark:text-[#0B1D51] dark:border-yellow-400 shadow-md scale-105'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-yellow-400/40'
                }`}
              >
                <CategoryIcon className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{c.name}</span>
              </button>
            );
          })}
        </div>

        {/* List of Procedures */}
        {loading ? (
          <div className="py-20 text-center text-xs text-slate-400">Đang tải danh mục thủ tục hành chính...</div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
            <FileCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">Không tìm thấy thủ tục phù hợp</h3>
            <p className="text-xs text-slate-400 mt-1">Thử đổi từ khóa hoặc danh mục tra cứu.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {items.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedProcedure(item)}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 hover:border-yellow-400/50 transition-all shadow-sm cursor-pointer flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-extrabold border border-emerald-500/20">
                      {item.code}
                    </span>

                    <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-yellow-500" />
                      Thời hạn: <strong>{item.processingDays} ngày</strong>
                    </span>
                  </div>

                  <h3 className="text-base font-black text-slate-900 dark:text-white leading-snug group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-colors">
                    {item.title}
                  </h3>

                  <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span className="truncate" title={item.authority}>Thẩm quyền: <strong>{item.authority}</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span className="truncate" title={item.fee}>Lệ phí: <strong>{item.fee}</strong></span>
                    </div>
                  </div>

                  {/* Dossier counter badge */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs flex items-center justify-between text-slate-700 dark:text-slate-300">
                    <span>Hồ sơ yêu cầu: <strong>{item.dossierList?.length || 0} loại giấy tờ</strong></span>
                    <span className="text-[11px] text-blue-600 dark:text-blue-400 font-bold">{item.stepTimeline?.length || 0} Bước thực hiện</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400 truncate max-w-[200px]" title={item.categoryName}>
                    {item.categoryName}
                  </span>
                  <span className="text-yellow-600 dark:text-yellow-400 font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    <span>Xem hướng dẫn A-Z</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Procedure Detail Modal */}
      {selectedProcedure && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in-50"
          onClick={() => setSelectedProcedure(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="tthc-modal-title"
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-xs font-bold text-yellow-600 dark:text-yellow-400 uppercase tracking-wider block mb-1">
                  {selectedProcedure.code} • {selectedProcedure.categoryName}
                </span>
                <h2 id="tthc-modal-title" className="text-xl font-black text-slate-900 dark:text-white leading-snug">
                  {selectedProcedure.title}
                </h2>
              </div>

              <button
                onClick={() => setSelectedProcedure(null)}
                aria-label="Đóng cửa sổ"
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/30 text-xs">
                <span className="text-slate-500 block mb-0.5">Thời hạn giải quyết</span>
                <strong className="text-sm font-black text-blue-700 dark:text-blue-400">{selectedProcedure.processingDays} ngày làm việc</strong>
              </div>
              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/30 text-xs">
                <span className="text-slate-500 block mb-0.5">Lệ phí nhà nước</span>
                <strong className="text-xs font-bold text-emerald-700 dark:text-emerald-400">{selectedProcedure.fee}</strong>
              </div>
              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/30 text-xs col-span-2 sm:col-span-1">
                <span className="text-slate-500 block mb-0.5">Cơ quan thụ lý</span>
                <strong className="text-xs font-bold text-amber-700 dark:text-yellow-400 truncate block">{selectedProcedure.authority}</strong>
              </div>
            </div>

            {/* Step-by-Step Timeline */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-yellow-500" />
                Quy trình {selectedProcedure.stepTimeline?.length || 0} Bước Thực hiện:
              </h4>
              <div className="space-y-3">
                {(selectedProcedure.stepTimeline || []).map((step) => (
                  <div
                    key={step.stepNumber}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-start gap-3.5"
                  >
                    <span className="w-7 h-7 rounded-xl bg-[#0B1D51] text-yellow-400 dark:bg-yellow-400 dark:text-[#0B1D51] font-black text-xs flex items-center justify-center shrink-0 shadow-sm">
                      {step.stepNumber}
                    </span>
                    <div className="space-y-1 text-xs">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <strong className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">{step.title}</strong>
                        <span className="text-[10px] text-slate-400 bg-white dark:bg-slate-700 px-2 py-0.5 rounded">Thời gian: {step.duration}</span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Required Dossiers Checklist */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Danh mục Giấy tờ Hồ sơ Bắt buộc:
              </h4>
              <div className="space-y-2">
                {(selectedProcedure.dossierList || []).map((doc) => (
                  <div
                    key={doc.id}
                    className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-start gap-3 text-xs"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900 dark:text-white font-semibold block">{doc.name}</strong>
                      {doc.note && <span className="text-[11px] text-slate-400">{doc.note}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Downloadable Official Templates */}
            {selectedProcedure.templates && selectedProcedure.templates.length > 0 && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-500/10 to-amber-500/10 border border-amber-500/30 space-y-2">
                <span className="text-xs font-bold text-yellow-700 dark:text-yellow-400 flex items-center gap-1.5">
                  <Download className="w-4 h-4" />
                  Tải Biểu Mẫu Đơn Từ Soạn Thảo Sẵn (.docx)
                </span>
                <div className="flex flex-wrap gap-2 pt-1">
                  {selectedProcedure.templates.map((tpl, i) => (
                    <a
                      key={i}
                      href={tpl.url}
                      download
                      className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-blue-600 dark:text-yellow-400 hover:bg-slate-50 flex items-center gap-1.5 shadow-sm"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>{tpl.name}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Online Portal Link */}
            {selectedProcedure.onlinePortalUrl && (
              <div className="flex items-center justify-between pt-2">
                <a
                  href={selectedProcedure.onlinePortalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <span>Cổng Dịch vụ công Trực tuyến</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <button
                  type="button"
                  onClick={() => setSelectedProcedure(null)}
                  className="px-5 py-2.5 rounded-xl bg-[#0B1D51] text-yellow-400 dark:bg-yellow-400 dark:text-[#0B1D51] font-bold text-xs shadow"
                >
                  Đóng cửa sổ
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
