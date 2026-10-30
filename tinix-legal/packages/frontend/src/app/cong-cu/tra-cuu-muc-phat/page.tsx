'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Search, ShieldAlert, Info, X } from 'lucide-react';

const API_BASE = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001');

interface ViolationItem {
  id: string;
  behavior: string;
  field: string;
  vehicleType: string;
  category: string;
  fineIndividualMin: string | null;
  fineIndividualMax: string | null;
  fineOrgMin: string | null;
  fineOrgMax: string | null;
  pointsDeducted: number | null;
  citation: string;
  sourceDocNumber: string;
}

interface FieldCount {
  field: string;
  count: number;
}

function formatVND(v: string | null): string | null {
  if (v === null) return null;
  return Number(v).toLocaleString('vi-VN') + ' đ';
}

function formatFineRange(min: string | null, max: string | null): string {
  const minF = formatVND(min);
  const maxF = formatVND(max);
  if (!minF) return '—';
  if (minF === maxF) return minF;
  return `${minF} – ${maxF}`;
}

export default function TraCuuMucPhatPage() {
  const [query, setQuery] = useState('');
  const [fieldFilter, setFieldFilter] = useState<string | null>(null);
  const [fields, setFields] = useState<FieldCount[]>([]);
  const [items, setItems] = useState<ViolationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/api/admin-violations/fields`)
      .then((res) => res.json())
      .then(setFields)
      .catch(() => setFields([]));
  }, []);

  const runSearch = useCallback(async (q: string, field: string | null) => {
    if (!q.trim()) {
      setItems([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({ q });
      if (field) params.set('field', field);
      const res = await fetch(`${API_BASE}/api/admin-violations/search?${params.toString()}`);
      const data = await res.json();
      setItems(data.items || []);
    } catch (err) {
      console.error('Search failed:', err);
      setItems([]);
    } finally {
      setLoading(false);
      setSearched(true);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => runSearch(query, fieldFilter), 400);
    return () => clearTimeout(timer);
  }, [query, fieldFilter, runSearch]);

  const totalCount = fields.reduce((sum, f) => sum + f.count, 0);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <nav className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        <Link href="/cong-cu" className="hover:text-accent-600">Công cụ</Link>
        <span className="mx-1.5">›</span>
        <span>Tra cứu mức phạt vi phạm hành chính</span>
      </nav>

      <div className="flex items-center gap-3 mb-2">
        <div className="p-2.5 rounded-xl bg-red-600/10 text-red-600">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Tra cứu mức phạt vi phạm hành chính
        </h1>
      </div>
      <p className="text-gray-600 dark:text-gray-300 mb-6">
        Tra cứu {totalCount > 0 ? totalCount.toLocaleString('vi-VN') : ''} hành vi vi phạm hành chính
        thuộc {fields.length} lĩnh vực. Mỗi hành vi có mức phạt với cá nhân và tổ chức (nếu có),
        điểm trừ giấy phép lái xe (nếu có) và căn cứ Điểm/Khoản/Điều dẫn thẳng về nguyên văn.
      </p>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-4 mb-6">
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Gõ hành vi vi phạm: vượt đèn đỏ, nồng độ cồn, sa thải trái luật, xây không phép..."
            className="w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>
        <p className="text-xs text-gray-500 mb-3">Tìm không dấu cũng được.</p>

        <div className="flex flex-wrap gap-2">
          {fields.map((f) => (
            <button
              key={f.field}
              type="button"
              onClick={() => setFieldFilter(fieldFilter === f.field ? null : f.field)}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded-full border transition-colors ${
                fieldFilter === f.field
                  ? 'bg-red-600 text-white border-red-600'
                  : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-red-400'
              }`}
            >
              {f.field}
              <span className={fieldFilter === f.field ? 'text-white/80' : 'text-gray-400'}>({f.count})</span>
              {fieldFilter === f.field && <X className="w-3 h-3" />}
            </button>
          ))}
        </div>
      </div>

      {loading && <p className="text-sm text-gray-500 mb-4">Đang tìm...</p>}

      {searched && !loading && items.length === 0 && (
        <div className="flex items-start gap-2 p-4 rounded-lg bg-accent-50 dark:bg-accent-700/20 text-accent-700 dark:text-accent-200 text-sm mb-4">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            Không tìm thấy hành vi khớp với &quot;{query}&quot;{fieldFilter ? ` trong lĩnh vực ${fieldFilter}` : ''}.
            Thử dùng đúng từ ngữ trong văn bản pháp luật, hoặc bỏ bớt bộ lọc lĩnh vực.
          </span>
        </div>
      )}

      {items.length > 0 && (
        <div className="space-y-3">
          {items.map((item) => (
            <Link
              key={item.id}
              href={`/cong-cu/tra-cuu-muc-phat/${item.id}`}
              className="block bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-4 hover:border-red-300 dark:hover:border-red-500 transition-colors"
            >
              <div className="flex flex-wrap items-start justify-between gap-2 mb-1.5">
                <p className="font-medium text-gray-900 dark:text-white flex-1 min-w-[200px]">{item.behavior}</p>
                <div className="text-right shrink-0">
                  <div className="font-bold text-red-600">{formatFineRange(item.fineIndividualMin, item.fineIndividualMax)}</div>
                  {item.pointsDeducted && (
                    <div className="text-xs text-accent-600">Trừ {item.pointsDeducted} điểm</div>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                <span className="px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-medium">{item.field}</span>
                {item.vehicleType && <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700">{item.vehicleType}</span>}
                <span>{item.citation}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {!searched && (
        <div className="text-center py-12 text-gray-400 text-sm">
          Nhập từ khóa để bắt đầu tra cứu.
        </div>
      )}
    </div>
  );
}
