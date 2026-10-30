import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  BookOpen,
  ChevronRight,
  Eye,
  Filter,
  FolderOpen,
  MapPin,
  MessageCircleQuestion,
  Scale,
  Sparkles,
  ThumbsUp,
} from 'lucide-react';
import { getTopicIcon } from '@/lib/topic-icons';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';


interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

async function getTopicData(slug: string, page: number = 1) {
  try {
    const res = await fetch(`${API_BASE}/api/qa/topics/${encodeURIComponent(slug)}?page=${page}&limit=18`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch (err) {
    console.error('Error fetching topic QA data:', err);
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await getTopicData(slug);
  if (!data?.topic) {
    return {
      title: 'Chuyên đề Hỏi đáp Pháp luật | Tinix Legal',
    };
  }

  const { topic } = data;
  const title = `Hỏi đáp ${topic.name} | ${data.total || 0}+ Tình huống thực tế Tinix Legal`;
  const description = topic.description || `Tổng hợp các câu hỏi và tình huống thực tế thường gặp về ${topic.name}. Phân tích và hướng dẫn chi tiết từ Trợ lý Pháp chế AI Tinix Legal.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      siteName: 'Hệ thống Pháp luật Việt Nam - Tinix Legal',
      url: `https://tinix-legal.vn/hoi-dap/chu-de/${slug}`,
    },
    alternates: {
      canonical: `https://tinix-legal.vn/hoi-dap/chu-de/${slug}`,
    },
  };
}

export default async function TopicQAPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sParams = await searchParams;
  const currentPage = Math.max(1, parseInt(sParams.page || '1', 10));
  const data = await getTopicData(slug, currentPage);

  if (!data?.topic) {
    notFound();
  }

  const { topic, items = [], total = 0, totalPages = 1 } = data;

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Trang chủ',
        item: 'https://tinix-legal.vn',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Hỏi đáp Pháp luật',
        item: 'https://tinix-legal.vn/hoi-dap',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: topic.name,
        item: `https://tinix-legal.vn/hoi-dap/chu-de/${slug}`,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      {/* Schema.org Structured Data Injection */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      {/* Header Banner */}
      <div className="bg-white border-b border-slate-200 py-10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
            <Link href="/" className="hover:text-blue-700 transition-colors">Trang chủ</Link>
            <ChevronRight className="w-3 h-3 text-slate-300" />
            <Link href="/hoi-dap" className="hover:text-blue-700 transition-colors">Hỏi đáp Pháp luật</Link>
            <ChevronRight className="w-3 h-3 text-slate-300" />
            <span className="text-blue-700 font-medium">{topic.name}</span>
          </div>

          <div className="flex items-start gap-4">
            <div className="p-3.5 rounded-2xl bg-gradient-to-tr from-accent-500 to-accent-600 text-white shadow-md">
              {(() => {
                const TopicIcon = getTopicIcon(topic.icon);
                return <TopicIcon className="w-7 h-7" aria-hidden="true" />;
              })()}
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Hỏi đáp Chuyên đề: {topic.name}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl leading-relaxed">
                {topic.description || `Tổng hợp ${total} câu hỏi, tình huống thực tế và vướng mắc thường gặp về ${topic.name} kèm lời khuyên và căn cứ pháp luật.`}
              </p>
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-xs text-blue-700 font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{total} câu hỏi đã giải đáp</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 pt-8">
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/hoi-dap"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-yellow-600 dark:text-slate-400 dark:hover:text-yellow-400 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Xem tất cả Chủ đề</span>
          </Link>
          <span className="text-xs text-slate-400">
            Trang {currentPage} / {totalPages}
          </span>
        </div>

        {/* Questions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item: any) => (
            <Link
              key={item.id}
              href={`/hoi-dap/${item.slug || item.id}`}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 hover:border-yellow-400 dark:hover:border-yellow-400/50 hover:shadow-xl transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-yellow-400/15 text-yellow-700 dark:text-yellow-400 border border-yellow-400/30">
                    {item.persona || 'Chung'}
                  </span>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {item.viewCount || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="w-3 h-3 text-emerald-500" />
                      {item.helpfulCount || 0}
                    </span>
                  </div>
                </div>

                <h2 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-yellow-600 dark:group-hover:text-yellow-400 line-clamp-3 leading-snug mb-3">
                  {item.question}
                </h2>

                {item.situation && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl mb-3">
                    <MapPin className="w-3 h-3 inline shrink-0" aria-hidden="true" /> {item.situation}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span className="truncate max-w-[180px] font-medium text-slate-600 dark:text-slate-300">
                  {item.document?.documentNumber || 'Văn bản pháp luật'}
                </span>
                <span className="text-yellow-600 dark:text-yellow-400 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                  <span>Chi tiết</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-12 flex items-center justify-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Link
                key={p}
                href={`/hoi-dap/chu-de/${slug}?page=${p}`}
                className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${
                  p === currentPage
                    ? 'bg-[#0B1D51] text-yellow-400 shadow-md scale-105'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100'
                }`}
              >
                {p}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
