import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  MessageCircleQuestion,
  Scale,
  Sparkles,
  Lightbulb,
  Share2,
  ThumbsUp,
  ThumbsDown,
  BookOpen,
  ArrowLeft,
  ChevronRight,
  FileText,
  Clock,
  Eye,
  ShieldCheck,
  Download,
  Building2,
  Calendar,
} from 'lucide-react';
import { QAItemDetailClient } from './QAItemDetailClient';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';


interface Props {
  params: Promise<{ slug: string }>;
}

async function getQAItem(idOrSlug: string) {
  try {
    const res = await fetch(`${API_BASE}/api/qa/items/${encodeURIComponent(idOrSlug)}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch (err) {
    console.error('Error fetching QA item:', err);
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await getQAItem(slug);
  if (!data?.item) {
    return {
      title: 'Hỏi đáp Pháp luật Việt Nam | Tinix Legal',
    };
  }

  const { item } = data;
  const title = `${item.question} | Hỏi đáp Tinix Legal`;
  const description = item.situation
    ? `Giải đáp tình huống: ${item.situation.slice(0, 160)}...`
    : `Căn cứ pháp lý: ${item.legalBasis || 'Pháp luật hiện hành'}. Hướng dẫn chi tiết từ Trợ lý Pháp chế AI Tinix Legal.`;

  return {
    title,
    description,
    keywords: [
      item.question,
      item.persona,
      item.topic?.name,
      'hỏi đáp pháp luật',
      'tư vấn pháp lý',
      'căn cứ pháp luật',
    ].filter(Boolean),
    openGraph: {
      title,
      description,
      type: 'article',
      siteName: 'Hệ thống Pháp luật Việt Nam - Tinix Legal',
      url: `https://tinix-legal.vn/hoi-dap/${slug}`,
    },
    alternates: {
      canonical: `https://tinix-legal.vn/hoi-dap/${slug}`,
    },
  };
}

export default async function QAItemDetailPage({ params }: Props) {
  const { slug } = await params;
  const data = await getQAItem(slug);

  if (!data?.item) {
    notFound();
  }

  const { item, relatedItems = [] } = data;

  // Schema.org JSON-LD structured data for Google Search FAQ Rich Snippets
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `${item.tldrSummary ? `Tóm tắt: ${item.tldrSummary}\n\n` : ''}${item.answer}\n\nCăn cứ pháp lý: ${item.legalBasis}`,
        },
      },
    ],
  };

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
        name: item.topic?.name || 'Tình huống',
        item: `https://tinix-legal.vn/hoi-dap/chu-de/${item.topic?.slug || ''}`,
      },
      {
        '@type': 'ListItem',
        position: 4,
        name: item.question,
        item: `https://tinix-legal.vn/hoi-dap/${slug}`,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 pb-20">
      {/* Schema.org Structured Data Injection */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      {/* Header Breadcrumb Bar */}
      <div className="bg-slate-50 border-b border-slate-200 py-4">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <Link href="/" className="hover:text-blue-700 transition-colors">Trang chủ</Link>
            <ChevronRight className="w-3 h-3 text-slate-300" />
            <Link href="/hoi-dap" className="hover:text-blue-700 transition-colors">Hỏi đáp Pháp luật</Link>
            {item.topic && (
              <>
                <ChevronRight className="w-3 h-3 text-slate-300" />
                <Link href={`/hoi-dap/chu-de/${item.topic.slug}`} className="hover:text-blue-800 transition-colors font-medium text-blue-700">
                  {item.topic.name}
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pt-8">
        <Link
          href="/hoi-dap"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-yellow-600 dark:text-slate-400 dark:hover:text-yellow-400 mb-6 group transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
          <span>Quay lại Danh mục Hỏi đáp</span>
        </Link>

        {/* Main Content Component with Client Interactions */}
        <QAItemDetailClient item={item} relatedItems={relatedItems} />
      </div>
    </div>
  );
}
