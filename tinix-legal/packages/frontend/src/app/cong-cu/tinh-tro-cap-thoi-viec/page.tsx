'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Briefcase } from 'lucide-react';
import { calculateSeverancePay } from '@tinix-legal/shared';

function formatVnd(n: number): string {
  return Math.round(n).toLocaleString('vi-VN') + ' đ';
}

export default function TinhTroCapThoiViecPage() {
  const [averageMonthlySalary, setAverageMonthlySalary] = useState('12000000');
  const [totalActualMonths, setTotalActualMonths] = useState('60');
  const [unemploymentInsuranceMonths, setUnemploymentInsuranceMonths] = useState('24');
  const [previouslyCompensatedMonths, setPreviouslyCompensatedMonths] = useState('0');
  const [submitted, setSubmitted] = useState(false);

  const result = useMemo(
    () =>
      calculateSeverancePay({
        averageMonthlySalary: Number(averageMonthlySalary) || 0,
        totalActualMonths: Number(totalActualMonths) || 0,
        unemploymentInsuranceMonths: Number(unemploymentInsuranceMonths) || 0,
        previouslyCompensatedMonths: Number(previouslyCompensatedMonths) || 0,
      }),
    [averageMonthlySalary, totalActualMonths, unemploymentInsuranceMonths, previouslyCompensatedMonths]
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <nav className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        <Link href="/cong-cu" className="hover:text-accent-600">Công cụ</Link>
        <span className="mx-1.5">›</span>
        <span>Tính trợ cấp thôi việc</span>
      </nav>

      <div className="flex items-center gap-3 mb-2">
        <div className="p-2.5 rounded-xl bg-accent-600/10 text-accent-600">
          <Briefcase className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Công cụ tính trợ cấp thôi việc
        </h1>
      </div>
      <p className="text-gray-600 dark:text-gray-300 mb-8">
        Áp dụng với người lao động làm việc thường xuyên từ đủ 12 tháng trở lên, chấm dứt hợp
        đồng theo căn cứ hợp pháp, theo Điều 46 Bộ luật Lao động 2019.
      </p>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Tiền lương bình quân 6 tháng liền kề trước khi thôi việc (đồng)
        </label>
        <input
          type="number" value={averageMonthlySalary} onChange={(e) => setAverageMonthlySalary(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white mb-4"
        />

        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Tổng thời gian làm việc thực tế (tháng)
        </label>
        <input
          type="number" value={totalActualMonths} onChange={(e) => setTotalActualMonths(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white mb-4"
        />

        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Thời gian đã tham gia bảo hiểm thất nghiệp (tháng)
        </label>
        <input
          type="number" value={unemploymentInsuranceMonths} onChange={(e) => setUnemploymentInsuranceMonths(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white mb-4"
        />

        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Thời gian đã được chi trả trợ cấp thôi việc/mất việc làm trước đó (tháng)
        </label>
        <input
          type="number" value={previouslyCompensatedMonths} onChange={(e) => setPreviouslyCompensatedMonths(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white mb-5"
        />

        <button type="button" onClick={() => setSubmitted(true)} className="px-5 py-2.5 bg-accent-600 hover:bg-accent-700 text-white font-medium rounded-lg transition-colors">
          Tính trợ cấp thôi việc
        </button>
      </div>

      {submitted && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-600 dark:text-gray-400">Thời gian làm việc để tính trợ cấp</dt>
              <dd className="font-medium text-gray-900 dark:text-white">{result.eligibleMonths} tháng ({result.eligibleYears} năm)</dd>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
              <dt className="text-gray-700 dark:text-gray-300 font-semibold">Tiền trợ cấp thôi việc</dt>
              <dd className="font-bold text-accent-600">{formatVnd(result.severanceAllowance)}</dd>
            </div>
          </dl>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Công thức: Tiền trợ cấp thôi việc = 1/2 × Tiền lương tháng × Thời gian làm việc để tính
          trợ cấp thôi việc. Thời gian làm việc quy đổi theo năm: tháng lẻ ≤ 6 tháng tính bằng 1/2
          năm, trên 6 tháng tính bằng 1 năm. Không áp dụng nếu người lao động đủ điều kiện hưởng
          lương hưu (Điều 45 BLLĐ 2019) hoặc đơn phương chấm dứt hợp đồng trái pháp luật.
        </p>
      </div>
    </div>
  );
}
