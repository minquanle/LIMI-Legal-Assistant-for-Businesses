'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Route } from 'lucide-react';
import { calculateRoadMaintenanceFee, type PassengerCarUsage } from '@tinix-legal/shared';

const USAGE_LABELS: Record<PassengerCarUsage, string> = {
  khong_kinh_doanh_van_tai: 'Không kinh doanh vận tải',
  kinh_doanh_van_tai: 'Kinh doanh vận tải',
};

const CYCLE_OPTIONS = [1, 3, 6, 12, 18, 24, 30];

function formatVnd(n: number): string {
  return n.toLocaleString('vi-VN') + ' đ';
}

export default function TinhPhiSuDungDuongBoPage() {
  const [usage, setUsage] = useState<PassengerCarUsage>('khong_kinh_doanh_van_tai');
  const [months, setMonths] = useState(12);
  const [submitted, setSubmitted] = useState(false);

  const result = useMemo(() => calculateRoadMaintenanceFee(usage, months), [usage, months]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <nav className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        <Link href="/cong-cu" className="hover:text-accent-600">Công cụ</Link>
        <span className="mx-1.5">›</span>
        <span>Tính phí sử dụng đường bộ</span>
      </nav>

      <div className="flex items-center gap-3 mb-2">
        <div className="p-2.5 rounded-xl bg-stone-600/10 text-stone-700">
          <Route className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Công cụ tính phí sử dụng đường bộ
        </h1>
      </div>
      <p className="text-gray-600 dark:text-gray-300 mb-8">
        Áp dụng cho ô tô con dưới 10 chỗ, thu theo chu kỳ đăng kiểm, theo Nghị định
        364/2025/NĐ-CP, hiệu lực từ 01/01/2026.
      </p>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Mục đích sử dụng xe</label>
        <div className="flex flex-wrap gap-2 mb-4">
          {(Object.keys(USAGE_LABELS) as PassengerCarUsage[]).map((u) => (
            <button
              key={u} type="button" onClick={() => setUsage(u)}
              className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${usage === u ? 'bg-stone-700 text-white border-stone-700' : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'}`}
            >
              {USAGE_LABELS[u]}
            </button>
          ))}
        </div>

        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Chu kỳ đăng kiểm (tháng)</label>
        <div className="flex flex-wrap gap-2 mb-5">
          {CYCLE_OPTIONS.map((m) => (
            <button
              key={m} type="button" onClick={() => setMonths(m)}
              className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${months === m ? 'bg-stone-700 text-white border-stone-700' : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'}`}
            >
              {m} tháng
            </button>
          ))}
        </div>

        <button type="button" onClick={() => setSubmitted(true)} className="px-5 py-2.5 bg-stone-700 hover:bg-stone-800 text-white font-medium rounded-lg transition-colors">
          Tính phí
        </button>
      </div>

      {submitted && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-600 dark:text-gray-400">Mức phí</dt>
              <dd className="font-medium text-gray-900 dark:text-white">{formatVnd(result.monthlyFee)}/tháng</dd>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
              <dt className="text-gray-700 dark:text-gray-300 font-semibold">Phí phải nộp cho chu kỳ {result.months} tháng</dt>
              <dd className="font-bold text-stone-700">{formatVnd(result.totalFee)}</dd>
            </div>
          </dl>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Công cụ hiện chỉ áp dụng cho ô tô con dưới 10 chỗ (kể cả người lái). Xe tải, xe chuyên
          dùng, xe đầu kéo, xe khách có bảng mức thu riêng theo tấn trọng tải/số chỗ ngồi tại Phụ
          lục I Nghị định 364/2025/NĐ-CP — chưa đưa vào công cụ do cần xác minh đầy đủ bảng biểu.
          Xe máy hiện không thuộc diện thu phí sử dụng đường bộ tập trung ở cấp trung ương.
        </p>
      </div>
    </div>
  );
}
