'use client';

import { useState, use } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  FileDiff,
  GitFork,
  Layers,
  RefreshCw,
  ScrollText,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import Link from 'next/link';

interface ArticleNode {
  id: string;
  articleNumber: string;
  title: string;
  status: 'CURRENT' | 'EXPIRED' | 'AMENDED';
  guidedByDecrees: Array<{ number: string; title: string }>;
  guidedByCirculars: Array<{ number: string; title: string }>;
  oldVsNewDiff?: { oldText: string; newText: string };
}

const DEMO_ARTICLES: ArticleNode[] = [
  {
    id: 'dieu_125',
    articleNumber: 'Điều 125',
    title: 'Áp dụng hình thức kỷ luật sa thải',
    status: 'CURRENT',
    guidedByDecrees: [
      { number: 'NĐ 145/2020/NĐ-CP', title: 'Điều 70: Thủ tục cuộc họp kỷ luật lao động sa thải' },
    ],
    guidedByCirculars: [
      { number: 'TT 10/2020/TT-BLĐTBXH', title: 'Mẫu biên bản vi phạm và thông báo mời họp' },
    ],
    oldVsNewDiff: {
      oldText: 'BLLĐ 2012: Hướng dẫn họp kỷ luật phải có đại diện Công đoàn cấp trên nếu cơ sở chưa có.',
      newText: 'BLLĐ 2019: Quy định sự tham gia của Tổ chức đại diện người lao động tại cơ sở (Công đoàn cơ sở).',
    },
  },
  {
    id: 'dieu_123',
    articleNumber: 'Điều 123',
    title: 'Thời hiệu xử lý kỷ luật lao động',
    status: 'CURRENT',
    guidedByDecrees: [
      { number: 'NĐ 145/2020/NĐ-CP', title: 'Điều 71: Gia hạn thời hiệu kỷ luật trong trường hợp đặc biệt' },
    ],
    guidedByCirculars: [],
    oldVsNewDiff: {
      oldText: 'BLLĐ 2012: Thời hiệu tối đa 06 tháng, trường hợp đặc biệt 12 tháng.',
      newText: 'BLLĐ 2019: Giữ nguyên thời hiệu 06 tháng, làm rõ thời hạn không tính vào thời hiệu.',
    },
  },
];

export default function ArticleLevelMindmapPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const docId = resolvedParams.id;

  const [selectedArticle, setSelectedArticle] = useState<ArticleNode>(DEMO_ARTICLES[0]);
  const [showDiff, setShowDiff] = useState(false);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* Header */}
      <header className="bg-slate-800/80 backdrop-blur border-b border-slate-700 px-6 py-4 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <Link href={`/van-ban/${docId}/mindmap`} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-400 text-slate-950">ARTICLE-LEVEL MINDMAP</span>
              <span className="text-xs text-slate-400">ID: {docId}</span>
            </div>
            <h1 className="text-base font-bold text-white">Sơ đồ Tư duy Chi tiết Cấp Điều/Khoản & So sánh Hiệu lực</h1>
          </div>
        </div>

        <button
          onClick={() => setShowDiff(!showDiff)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            showDiff ? 'bg-purple-600 text-white' : 'bg-slate-700 text-slate-300 hover:text-white'
          }`}
        >
          <FileDiff className="w-4 h-4" /> So sánh Văn bản Cũ vs Mới
        </button>
      </header>

      {/* Main Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 overflow-hidden">

        {/* Article Selector Column */}
        <div className="p-6 border-r border-slate-700 bg-slate-800/50 space-y-4 overflow-y-auto">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Danh mục Điều khoản AST</h2>
          <div className="space-y-2">
            {DEMO_ARTICLES.map((art) => (
              <div
                key={art.id}
                role="button"
                tabIndex={0}
                aria-label={art.title}
                aria-pressed={selectedArticle.id === art.id}
                onClick={() => setSelectedArticle(art)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedArticle(art); } }}
                className={`p-4 rounded-xl border cursor-pointer transition focus:outline-none focus:ring-4 focus:ring-purple-400/60 ${
                  selectedArticle.id === art.id
                    ? 'bg-purple-900/60 border-purple-400 text-white shadow-lg'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-purple-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-purple-400">{art.articleNumber}</span>
                  <span className="text-[10px] bg-green-950 text-green-400 border border-green-700 px-2 py-0.5 rounded">CON_HIEU_LUC</span>
                </div>
                <h3 className="font-semibold text-xs leading-snug">{art.title}</h3>
              </div>
            ))}
          </div>
        </div>

        {/* Article Node Branch Visualizer (2 cols) */}
        <div className="lg:col-span-2 p-8 overflow-auto space-y-6">

          {/* Selected Article Card */}
          <div className="bg-slate-800 rounded-2xl border border-purple-500/50 p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <div>
                <span className="text-xs font-bold text-purple-400">{selectedArticle.articleNumber}</span>
                <h2 className="text-lg font-bold text-white">{selectedArticle.title}</h2>
              </div>
              <span className="text-xs bg-slate-700 text-slate-300 px-3 py-1 rounded-full font-mono">AST NODE</span>
            </div>

            {/* Guided Decrees */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                <GitFork className="w-4 h-4" /> Nghị định Hướng dẫn chi tiết Điều này ({selectedArticle.guidedByDecrees.length})
              </h3>
              {selectedArticle.guidedByDecrees.map((d, i) => (
                <div key={i} className="p-3 bg-indigo-950/50 rounded-xl border border-indigo-700/60 text-xs space-y-0.5">
                  <p className="font-bold text-indigo-300"><ScrollText className="w-3 h-3 inline" aria-hidden="true" /> {d.number}</p>
                  <p className="text-slate-300">{d.title}</p>
                </div>
              ))}
            </div>

            {/* Guided Circulars */}
            {selectedArticle.guidedByCirculars.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
                  <GitFork className="w-4 h-4" /> Thông tư Quy định mẫu chi tiết ({selectedArticle.guidedByCirculars.length})
                </h3>
                {selectedArticle.guidedByCirculars.map((c, i) => (
                  <div key={i} className="p-3 bg-blue-950/50 rounded-xl border border-blue-700/60 text-xs space-y-0.5">
                    <p className="font-bold text-blue-300"><ScrollText className="w-3 h-3 inline" aria-hidden="true" /> {c.number}</p>
                    <p className="text-slate-300">{c.title}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Old vs New Diff View */}
            {showDiff && selectedArticle.oldVsNewDiff && (
              <div className="p-4 bg-slate-900 rounded-xl border border-purple-400/40 space-y-3 pt-3">
                <h3 className="text-xs font-bold text-purple-400 flex items-center gap-1.5">
                  <FileDiff className="w-4 h-4" /> So sánh Quy định Cũ vs Mới
                </h3>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-red-950/40 border border-red-800 rounded-lg text-red-300 space-y-1">
                    <span className="font-bold text-[10px] uppercase text-red-400">Văn bản Cũ (BLLĐ 2012)</span>
                    <p>{selectedArticle.oldVsNewDiff.oldText}</p>
                  </div>
                  <div className="p-3 bg-green-950/40 border border-green-800 rounded-lg text-green-300 space-y-1">
                    <span className="font-bold text-[10px] uppercase text-green-400">Văn bản Mới (BLLĐ 2019)</span>
                    <p>{selectedArticle.oldVsNewDiff.newText}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
