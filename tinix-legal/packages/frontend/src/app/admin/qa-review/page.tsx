'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  MessageCircleQuestion, CheckCircle2, XCircle, Loader2, FileText, RefreshCw, LayoutGrid, Scale,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface PendingQAItem {
  id: string;
  question: string;
  answer: string;
  situation?: string | null;
  legalBasis: string;
  persona: string;
  createdAt: string;
  topic: { id: string; name: string; slug: string } | null;
  document: { id: string; documentNumber: string; title: string } | null;
}

export default function AdminQAReviewPage() {
  const [items, setItems] = useState<PendingQAItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [actioningId, setActioningId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await apiClient.getPendingQAItems(1, 50);
      setItems(data.items || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error('Failed to load pending Q&A items:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handlePublish = async (id: string) => {
    setActioningId(id);
    try {
      await apiClient.publishQAItem(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
      setTotal((t) => Math.max(0, t - 1));
    } catch (err) {
      console.error('Failed to publish item:', err);
    } finally {
      setActioningId(null);
    }
  };

  const handleReject = async (id: string) => {
    if (!confirm('Từ chối câu hỏi này? Nó sẽ bị ẩn khỏi hệ thống.')) return;
    setActioningId(id);
    try {
      await apiClient.rejectQAItem(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
      setTotal((t) => Math.max(0, t - 1));
    } catch (err) {
      console.error('Failed to reject item:', err);
    } finally {
      setActioningId(null);
    }
  };

  return (
    <div className="space-y-6">
      <Link
        href="/admin/stats"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors"
      >
        <LayoutGrid className="w-3.5 h-3.5" aria-hidden="true" />
        <span>Về Bảng điều khiển Quản trị</span>
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600/20 border border-indigo-600/30 rounded-xl flex items-center justify-center">
            <MessageCircleQuestion className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Duyệt Hỏi Đáp AI Sinh</h1>
            <p className="text-xs text-slate-400">
              {loading ? 'Đang tải...' : `${total} câu hỏi đang chờ duyệt trước khi hiển thị công khai`}
            </p>
          </div>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Làm mới</span>
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-sm text-slate-400">Đang tải danh sách chờ duyệt...</div>
      ) : error ? (
        <div className="py-20 text-center text-sm text-rose-400">Không thể tải danh sách. Vui lòng kiểm tra quyền admin và thử lại.</div>
      ) : items.length === 0 ? (
        <div className="py-20 text-center text-sm text-slate-400">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3 opacity-70" />
          Không có câu hỏi nào đang chờ duyệt.
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  {item.topic && (
                    <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold">{item.topic.name}</span>
                  )}
                  <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">{item.persona}</span>
                  {item.document && (
                    <span className="flex items-center gap-1 text-slate-400">
                      <FileText className="w-3 h-3" /> {item.document.documentNumber}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-400">{new Date(item.createdAt).toLocaleString('vi-VN')}</span>
              </div>

              <h3 className="font-bold text-white text-sm">{item.question}</h3>
              {item.situation && <p className="text-xs text-slate-400 italic">{item.situation}</p>}
              <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">{item.answer}</p>
              {item.legalBasis && (
                <p className="text-[11px] text-indigo-400 font-medium flex items-start gap-1">
                  <Scale className="w-3 h-3 shrink-0 mt-0.5" aria-hidden="true" /> Căn cứ: {item.legalBasis}
                </p>
              )}

              <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                <button
                  onClick={() => handlePublish(item.id)}
                  disabled={actioningId === item.id}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition"
                >
                  {actioningId === item.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  Duyệt & Công khai
                </button>
                <button
                  onClick={() => handleReject(item.id)}
                  disabled={actioningId === item.id}
                  className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-rose-900/60 disabled:opacity-50 text-slate-300 hover:text-rose-300 text-xs font-bold rounded-lg transition border border-slate-700 hover:border-rose-800"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Từ chối
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
