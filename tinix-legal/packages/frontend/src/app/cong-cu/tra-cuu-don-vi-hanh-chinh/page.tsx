'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Search, MapPin, Info } from 'lucide-react';

const API_BASE = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001');

interface AdminUnitData {
  kind: 'new' | 'old-ward' | 'old-district';
  province?: string;
}

interface ResultItem {
  id: string;
  title: string;
  subtitle: string | null;
  data: AdminUnitData;
}

export default function TraCuuDonViHanhChinhPage() {
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<ResultItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const runSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setItems([]);
      setTotal(0);
      setSearched(false);
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({ q, limit: '30' });
      const res = await fetch(`${API_BASE}/api/reference/admin-unit/search?${params.toString()}`);
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
    const timer = setTimeout(() => runSearch(query), 400);
    return () => clearTimeout(timer);
  }, [query, runSearch]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <nav className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        <Link href="/cong-cu" className="hover:text-accent-600">Công cụ</Link>
        <span className="mx-1.5">›</span>
        <span>Tra cứu đơn vị hành chính</span>
      </nav>

      <div className="flex items-center gap-3 mb-2">
        <div className="p-2.5 rounded-xl bg-emerald-600/10 text-emerald-600">
          <MapPin className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Tra cứu đơn vị hành chính
        </h1>
      </div>
      <p className="text-gray-600 dark:text-gray-300 mb-6">
        Tỉnh, xã, phường hiện hành sau sắp xếp, và tra ngược đơn vị cấp huyện cũ nay thuộc đơn vị nào.
      </p>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nhập tên phường, xã hoặc huyện cũ..."
            className="w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <p className="text-xs text-gray-500 mt-2">Tìm không dấu cũng được.</p>
      </div>

      {loading && <p className="text-sm text-gray-500 mb-4">Đang tìm...</p>}

      {searched && !loading && items.length === 0 && (
        <div className="flex items-start gap-2 p-4 rounded-lg bg-accent-50 dark:bg-accent-700/20 text-accent-700 dark:text-accent-200 text-sm mb-4">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <span>Không tìm thấy đơn vị khớp với &quot;{query}&quot;.</span>
        </div>
      )}

      {items.length > 0 && (
        <div className="space-y-3">
          {total > items.length && (
            <p className="text-xs text-gray-400">Hiển thị {items.length}/{total.toLocaleString('vi-VN')} kết quả, gõ thêm để thu hẹp.</p>
          )}
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium text-gray-900 dark:text-white">{item.title}</p>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
                    item.data.kind === 'new'
                      ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
                      : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'
                  }`}
                >
                  {item.data.kind === 'new'
                    ? 'Đơn vị hiện hành'
                    : item.data.kind === 'old-ward'
                    ? 'Xã/phường cũ'
                    : 'Huyện cũ'}
                </span>
              </div>
              {item.subtitle && (
                <p className="text-xs text-gray-500 mt-1">{item.subtitle}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {!searched && (
        <div className="text-center py-12 text-gray-400 text-sm">
          Nhập tên đơn vị để bắt đầu tra cứu.
        </div>
      )}
    </div>
  );
}
