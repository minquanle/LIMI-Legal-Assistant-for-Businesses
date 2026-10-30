'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import {
  Network,
  Search,
  BookOpen,
  ArrowRight,
  Sparkles,
  Layers,
  ChevronRight,
  Building2,
  Users,
  Scale,
  Home,
  Briefcase,
  GitFork,
  ExternalLink,
} from 'lucide-react';
import { getTopicIcon } from '@/lib/topic-icons';

interface LawItem {
  id: string;
  docNumber: string;
  title: string;
  category: string;
  effectiveYear: string;
  chaptersCount: number;
  articlesCount: number;
  description: string;
  badgeColor: string;
  icon: string;
}

const FLAGSHIP_LAWS: LawItem[] = [
  {
    id: 'luat-dat-dai-2024',
    docNumber: '31/2024/QH15',
    title: 'Luật Đất đai 2024',
    category: 'Đất đai & Bất động sản',
    effectiveYear: '01/08/2024',
    chaptersCount: 16,
    articlesCount: 260,
    description: 'Quy định về chế độ sở hữu đất đai, quyền hạn và trách nhiệm của Nhà nước, quyền và nghĩa vụ của người sử dụng đất.',
    badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    icon: 'landmark',
  },
  {
    id: 'luat-doanh-nghiep-2020',
    docNumber: '59/2020/QH14',
    title: 'Luật Doanh nghiệp 2020',
    category: 'Doanh nghiệp & Đầu tư',
    effectiveYear: '01/01/2021',
    chaptersCount: 10,
    articlesCount: 218,
    description: 'Quy định về việc thành lập, tổ chức quản lý, tổ chức lại, giải thể và hoạt động có liên quan của doanh nghiệp.',
    badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    icon: 'building-2',
  },
  {
    id: 'bo-luat-lao-dong-2019',
    docNumber: '45/2019/QH14',
    title: 'Bộ luật Lao động 2019',
    category: 'Lao động & Tiền lương',
    effectiveYear: '01/01/2021',
    chaptersCount: 17,
    articlesCount: 220,
    description: 'Tiêu chuẩn lao động; quyền, nghĩa vụ, trách nhiệm của người lao động, người sử dụng lao động, đại diện người lao động.',
    badgeColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    icon: 'users',
  },
  {
    id: 'bo-luat-dan-su-2015',
    docNumber: '91/2015/QH13',
    title: 'Bộ luật Dân sự 2015',
    category: 'Dân sự & Hợp đồng',
    effectiveYear: '01/01/2017',
    chaptersCount: 27,
    articlesCount: 689,
    description: 'Địa vị pháp lý, chuẩn mực pháp lý về cách ứng xử của cá nhân, pháp nhân; quyền, nghĩa vụ về nhân thân và tài sản.',
    badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    icon: 'scale',
  },
  {
    id: 'luat-nha-o-2023',
    docNumber: '27/2023/QH15',
    title: 'Luật Nhà ở 2023',
    category: 'Nhà ở & Đô thị',
    effectiveYear: '01/08/2024',
    chaptersCount: 13,
    articlesCount: 198,
    description: 'Sở hữu, phát triển, quản lý vận hành, sử dụng nhà ở; giao dịch về nhà ở; quản lý nhà nước về nhà ở tại Việt Nam.',
    badgeColor: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    icon: 'home',
  },
  {
    id: 'luat-kinh-doanh-bds-2023',
    docNumber: '29/2023/QH15',
    title: 'Luật Kinh doanh Bất động sản 2023',
    category: 'Đất đai & Bất động sản',
    effectiveYear: '01/08/2024',
    chaptersCount: 10,
    articlesCount: 83,
    description: 'Kinh doanh bất động sản, quyền và nghĩa vụ của tổ chức, cá nhân trong kinh doanh bất động sản và quản lý thị trường.',
    badgeColor: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20',
    icon: 'hard-hat',
  },
];

const CATEGORIES = [
  'Tất cả',
  'Đất đai & Bất động sản',
  'Doanh nghiệp & Đầu tư',
  'Lao động & Tiền lương',
  'Dân sự & Hợp đồng',
  'Nhà ở & Đô thị',
];

export default function MindmapHubPage() {
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [searchQuery, setSearchQuery] = useState('');
  // FLAGSHIP_LAWS.id values are curated labels, not real database ids — the
  // "Xem Mindmap" / "Xem toàn văn" links used to point straight at them and
  // 404 for every law. Resolve each to its real document id by exact document
  // number match before linking; laws that aren't in the corpus yet fall back
  // to a search link instead of a broken direct link.
  const [resolvedIds, setResolvedIds] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    Promise.all(
      FLAGSHIP_LAWS.map(async (law) => {
        try {
          const res = await apiClient.searchDocuments({ q: law.docNumber, exact: 'true', limit: 1, hybrid: false });
          const match = res.results?.[0];
          return match ? ([law.id, match.id] as const) : null;
        } catch {
          return null;
        }
      })
    ).then((pairs) => {
      if (cancelled) return;
      const entries = pairs.filter((p): p is readonly [string, string] => p !== null);
      setResolvedIds(Object.fromEntries(entries));
    });
    return () => { cancelled = true; };
  }, []);

  const filteredLaws = FLAGSHIP_LAWS.filter((law) => {
    const matchesCategory = selectedCategory === 'Tất cả' || law.category === selectedCategory;
    const matchesSearch =
      law.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      law.docNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      law.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 pb-24">
      {/* Hero Header */}
      <section className="relative bg-white border-b border-slate-200 py-16 px-4 overflow-hidden">
        <div className="relative max-w-5xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-xs text-blue-700 font-semibold">
            <Network className="w-3.5 h-3.5" />
            <span>Sơ Đồ Tư Duy & Cây Cấu Trúc Pháp Lý Trực Quan</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900">
            Khám Phá <span className="text-blue-700">Mindmap Điều Khoản</span> Luật
          </h1>

          <p className="text-sm sm:text-base text-slate-500 max-w-2xl mx-auto leading-relaxed">
            Trực quan hóa cấu trúc phân cấp đa tầng từ Đạo luật gốc → Chương → Mục → Điều → Khoản và mạng lưới Nghị định/Thông tư hướng dẫn thi hành.
          </p>

          {/* Quick Search */}
          <div className="max-w-xl mx-auto pt-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm nhanh đạo luật (VD: Đất đai, Doanh nghiệp, Dân sự...)"
                className="w-full bg-white border border-slate-300 rounded-2xl pl-11 pr-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all shadow-sm"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-4 pt-8 space-y-8">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-yellow-400 text-[#0B1D51] shadow-md shadow-yellow-400/20'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Law Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLaws.map((law) => (
            <div
              key={law.id}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-5 shadow-sm hover:shadow-xl hover:border-yellow-400/50 transition-all flex flex-col justify-between group"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {(() => { const LawIcon = getTopicIcon(law.icon); return <LawIcon className="w-8 h-8 text-yellow-400 shrink-0" aria-hidden="true" />; })()}
                    <div>
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${law.badgeColor}`}>
                        {law.category}
                      </span>
                      <h3 className="text-base font-extrabold text-slate-900 dark:text-white mt-1 group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-colors">
                        {law.title}
                      </h3>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-slate-500 space-y-1 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between">
                    <span>Số hiệu:</span>
                    <strong className="text-slate-800 dark:text-slate-200">{law.docNumber}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Hiệu lực:</span>
                    <strong className="text-emerald-600 dark:text-emerald-400">{law.effectiveYear}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Quy mô:</span>
                    <span className="text-slate-700 dark:text-slate-300 font-semibold">{law.chaptersCount} Chương • {law.articlesCount} Điều</span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {law.description}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
                {resolvedIds[law.id] ? (
                  <>
                    <Link
                      href={`/van-ban/${resolvedIds[law.id]}/mindmap`}
                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#08163A] to-[#0B1D51] hover:from-[#0B1D51] hover:to-[#132B6E] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
                    >
                      <Network className="w-3.5 h-3.5 text-yellow-400" />
                      <span>Xem Mindmap Cấu Trúc</span>
                      <ArrowRight className="w-3.5 h-3.5 ml-auto" />
                    </Link>

                    <Link
                      href={`/documents/${resolvedIds[law.id]}`}
                      className="w-full py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Layers className="w-3 h-3 text-slate-400" />
                      <span>Xem toàn văn bản luật</span>
                    </Link>
                  </>
                ) : (
                  <Link
                    href={`/search?q=${encodeURIComponent(law.docNumber)}&exact=true`}
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800/60 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold flex items-center justify-center gap-2 transition-all"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>Tìm văn bản này trong hệ thống</span>
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
