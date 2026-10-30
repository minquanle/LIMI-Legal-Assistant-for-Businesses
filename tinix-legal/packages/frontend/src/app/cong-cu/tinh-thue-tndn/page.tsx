'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Building2 } from 'lucide-react';
import { calculateCorporateIncomeTax } from '@tinix-legal/shared';

function formatVnd(n: number): string {
  return Math.round(n).toLocaleString('vi-VN') + ' đ';
}

export default function TinhThueTndnPage() {
  const [taxableIncome, setTaxableIncome] = useState('2000000000');
  const [priorYearRevenue, setPriorYearRevenue] = useState('10000000000');
  const [submitted, setSubmitted] = useState(false);

  const result = useMemo(
    () => calculateCorporateIncomeTax(Number(taxableIncome) || 0, Number(priorYearRevenue) || 0),
    [taxableIncome, priorYearRevenue]
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <nav className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        <Link href="/cong-cu" className="hover:text-accent-600">Công cụ</Link>
        <span className="mx-1.5">›</span>
        <span>Tính thuế thu nhập doanh nghiệp</span>
      </nav>

      <div className="flex items-center gap-3 mb-2">
        <div className="p-2.5 rounded-xl bg-accent-600/10 text-accent-600">
          <Building2 className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Công cụ tính thuế thu nhập doanh nghiệp (TNDN)
        </h1>
      </div>
      <p className="text-gray-600 dark:text-gray-300 mb-8">
        Áp dụng mức thuế suất phổ thông và mức ưu đãi cho doanh nghiệp nhỏ và vừa theo Luật Thuế
        thu nhập doanh nghiệp số 67/2025/QH15, hiệu lực 01/10/2025.
      </p>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Thu nhập tính thuế (đồng)</label>
        <input
          type="number" value={taxableIncome} onChange={(e) => setTaxableIncome(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white mb-4"
        />

        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Doanh thu năm trước liền kề (đồng)</label>
        <input
          type="number" value={priorYearRevenue} onChange={(e) => setPriorYearRevenue(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white mb-5"
        />

        <button type="button" onClick={() => setSubmitted(true)} className="px-5 py-2.5 bg-accent-600 hover:bg-accent-700 text-white font-medium rounded-lg transition-colors">
          Tính thuế TNDN
        </button>
      </div>

      {submitted && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-600 dark:text-gray-400">Thuế suất áp dụng</dt>
              <dd className="font-medium text-gray-900 dark:text-white">{result.ratePercent}%</dd>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
              <dt className="text-gray-700 dark:text-gray-300 font-semibold">Thuế TNDN phải nộp</dt>
              <dd className="font-bold text-accent-600">{formatVnd(result.tax)}</dd>
            </div>
          </dl>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Thuế suất: 15% nếu doanh thu năm trước liền kề ≤ 3 tỷ đồng; 17% nếu từ trên 3 đến 50 tỷ
          đồng; 20% (mức phổ thông) nếu trên 50 tỷ đồng. Công cụ chưa bao gồm các mức ưu đãi theo
          ngành nghề, địa bàn đầu tư (Điều 13 Luật 67/2025/QH15) — vui lòng tra cứu riêng nếu
          doanh nghiệp thuộc diện ưu đãi.
        </p>
      </div>
    </div>
  );
}
