'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Search, Building2, Info, ChevronLeft, ChevronRight } from 'lucide-react';

const API_BASE = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001');
const PAGE_SIZE = 20;

interface CompanyData {
  taxCode: string;
  legalName: string;
  status: string;
  address: string;
  legalRepresentative: string;
  registrationDate: string;
}

interface ResultItem {
  id: string;
  title: string;
  subtitle: string | null;
  data: CompanyData;
}

export default function TraCuuMaSoThuePage() {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<ResultItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const runSearch = useCallback(async (q: string, p: number) => {
    if (!q.trim()) {
      setItems([]);
      setTotal(0);
      setSearched(false);
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({ q, page: String(p), limit: String(PAGE_SIZE) });
      const res = await fetch(`${API_BASE}/api/reference/tax-registry/search?${params.toString()}`);
      const data = await res.json();
      setItems(data.items || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error('Search failed:', err);
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
      setSearched(true);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => runSearch(query, page), 400);
    return () => clearTimeout(timer);
  }, [query, page, runSearch]);

  useEffect(() => {
    setPage(1);
  }, [query]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <nav className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        <Link href="/cong-cu" className="hover:text-accent-600">Công cụ</Link>
        <span className="mx-1.5">›</span>
        <span>Tra cứu mã số thuế</span>
      </nav>

      <div className="flex items-center gap-3 mb-2">
        <div className="p-2.5 rounded-xl bg-blue-600/10 text-blue-600">
          <Building2 className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Tra cứu mã số thuế doanh nghiệp
        </h1>
      </div>
      <p className="text-gray-600 dark:text-gray-300 mb-6">
        Mã số thuế, người đại diện pháp luật, địa chỉ trụ sở và ngành nghề đăng ký kinh doanh
        của doanh nghiệp Việt Nam.
      </p>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nhập tên doanh nghiệp hoặc mã số thuế..."
            className="w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <p className="text-xs text-gray-500 mt-2">Tìm không dấu cũng được.</p>
      </div>

      {loading && <p className="text-sm text-gray-500 mb-4">Đang tìm...</p>}

      {searched && !loading && items.length === 0 && (
        <div className="flex items-start gap-2 p-4 rounded-lg bg-accent-50 dark:bg-accent-700/20 text-accent-700 dark:text-accent-200 text-sm mb-4">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <span>Không tìm thấy doanh nghiệp khớp với &quot;{query}&quot;.</span>
        </div>
      )}

      {items.length > 0 && (
        <>
          <div className="space-y-3">
            {items.map((item) => (
              <Link
                key={item.id}
                href={`/cong-cu/tra-cuu-ma-so-thue/${item.id}`}
                className="block bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-4 hover:border-blue-300 dark:hover:border-blue-500 transition-colors"
              >
                <p className="font-medium text-gray-900 dark:text-white mb-1">{item.title}</p>
                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                  <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium font-mono">
                    MST: {item.subtitle}
                  </span>
                  {item.data.address && <span className="truncate">{item.data.address}</span>}
                </div>
              </Link>
            ))}
          </div>

          <div className="flex items-center justify-between pt-4">
            <div className="text-xs text-gray-400">
              {total.toLocaleString('vi-VN')} kết quả, trang {page}/{totalPages}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-40 disabled:cursor-default hover:border-blue-300"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Trước
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-40 disabled:cursor-default hover:border-blue-300"
              >
                Sau <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </>
      )}

      {!searched && (
        <div className="text-center py-12 text-gray-400 text-sm">
          Nhập tên doanh nghiệp hoặc mã số thuế để bắt đầu tra cứu.
        </div>
      )}
    </div>
  );
}
