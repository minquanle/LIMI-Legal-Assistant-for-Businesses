'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { HardHat } from 'lucide-react';
import { calculateConstructionWarrantyPeriod, type WarrantyCategory } from '@tinix-legal/shared';

const CATEGORY_LABELS: Record<WarrantyCategory, string> = {
  cong_trinh_dac_biet_cap_1: 'Công trình xây dựng cấp đặc biệt, cấp I',
  cong_trinh_cap_khac: 'Công trình xây dựng cấp II, III, IV',
  nha_chung_cu: 'Nhà chung cư',
  nha_o_rieng_le: 'Nhà ở riêng lẻ',
};

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

export default function TinhThoiHanBaoHanhCongTrinhPage() {
  const [category, setCategory] = useState<WarrantyCategory>('nha_chung_cu');
  const [acceptanceDate, setAcceptanceDate] = useState('2026-01-01');
  const [submitted, setSubmitted] = useState(false);

  const result = useMemo(() => calculateConstructionWarrantyPeriod(category, acceptanceDate), [category, acceptanceDate]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <nav className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        <Link href="/cong-cu" className="hover:text-accent-600">Công cụ</Link>
        <span className="mx-1.5">›</span>
        <span>Tính thời hạn bảo hành công trình, nhà ở</span>
      </nav>

      <div className="flex items-center gap-3 mb-2">
        <div className="p-2.5 rounded-xl bg-accent-700/10 text-accent-700">
          <HardHat className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Công cụ tính thời hạn bảo hành công trình xây dựng, nhà ở
        </h1>
      </div>
      <p className="text-gray-600 dark:text-gray-300 mb-8">
        Công trình xây dựng theo Điều 28 Nghị định 06/2021/NĐ-CP; nhà ở theo Luật Nhà ở 2023,
        tính từ ngày nghiệm thu hoàn thành đưa vào sử dụng.
      </p>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Loại công trình</label>
        <div className="flex flex-col gap-2 mb-4">
          {(Object.keys(CATEGORY_LABELS) as WarrantyCategory[]).map((c) => (
            <button
              key={c} type="button" onClick={() => setCategory(c)}
              className={`px-3 py-2 text-sm text-left rounded-lg border transition-colors ${category === c ? 'bg-accent-700 text-white border-accent-700' : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'}`}
            >
              {CATEGORY_LABELS[c]}
            </button>
          ))}
        </div>

        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Ngày nghiệm thu hoàn thành đưa vào sử dụng</label>
        <input
          type="date" value={acceptanceDate} onChange={(e) => setAcceptanceDate(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white mb-5"
        />

        <button type="button" onClick={() => setSubmitted(true)} className="px-5 py-2.5 bg-accent-700 hover:bg-accent-700 text-white font-medium rounded-lg transition-colors">
          Tính thời hạn bảo hành
        </button>
      </div>

      {submitted && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-600 dark:text-gray-400">Thời hạn bảo hành tối thiểu</dt>
              <dd className="font-medium text-gray-900 dark:text-white">{result.minimumMonths} tháng</dd>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
              <dt className="text-gray-700 dark:text-gray-300 font-semibold">Hạn kết thúc bảo hành</dt>
              <dd className="font-bold text-accent-700">{result.warrantyEndDate ? formatDate(result.warrantyEndDate) : '—'}</dd>
            </div>
          </dl>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Đây là mức tối thiểu theo quy định — chủ đầu tư và nhà thầu có thể thỏa thuận thời hạn
          bảo hành dài hơn trong hợp đồng xây dựng. Mức nêu trên áp dụng chung; công trình sử
          dụng vốn đầu tư công có thể có yêu cầu riêng theo hợp đồng cụ thể.
        </p>
      </div>
    </div>
  );
}
