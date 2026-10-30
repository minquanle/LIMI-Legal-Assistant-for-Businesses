'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { BriefcaseBusiness } from 'lucide-react';
import { calculateJobLossAllowance } from '@tinix-legal/shared';

function formatVnd(n: number): string {
  return Math.round(n).toLocaleString('vi-VN') + ' đ';
}

export default function TinhTroCapMatViecLamPage() {
  const [averageMonthlySalary, setAverageMonthlySalary] = useState('12000000');
  const [totalActualMonths, setTotalActualMonths] = useState('40');
  const [unemploymentInsuranceMonths, setUnemploymentInsuranceMonths] = useState('12');
  const [previouslyCompensatedMonths, setPreviouslyCompensatedMonths] = useState('0');
  const [submitted, setSubmitted] = useState(false);

  const result = useMemo(
    () =>
      calculateJobLossAllowance({
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
        <span>Tính trợ cấp mất việc làm</span>
      </nav>

      <div className="flex items-center gap-3 mb-2">
        <div className="p-2.5 rounded-xl bg-accent-600/10 text-accent-600">
          <BriefcaseBusiness className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Công cụ tính trợ cấp mất việc làm
        </h1>
      </div>
      <p className="text-gray-600 dark:text-gray-300 mb-8">
        Áp dụng khi người lao động mất việc do thay đổi cơ cấu, công nghệ, lý do kinh tế hoặc
        chia, tách, hợp nhất, sáp nhập doanh nghiệp, theo Điều 47 Bộ luật Lao động 2019 — khác
        với trợ cấp thôi việc áp dụng cho các căn cứ chấm dứt hợp đồng khác.
      </p>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Tiền lương bình quân 6 tháng liền kề trước khi mất việc (đồng)
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
          Tính trợ cấp mất việc làm
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
              <dt className="text-gray-700 dark:text-gray-300 font-semibold">Tiền trợ cấp mất việc làm</dt>
              <dd className="font-bold text-accent-600">{formatVnd(result.jobLossAllowance)}</dd>
            </div>
          </dl>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Công thức: mỗi năm làm việc = 1 tháng tiền lương, tối thiểu 02 tháng tiền lương dù thời
          gian tính ra thấp hơn. Thời gian làm việc quy đổi theo năm: tháng lẻ ≤ 6 tháng tính bằng
          1/2 năm, trên 6 tháng tính bằng 1 năm (Nghị định 145/2020/NĐ-CP).
        </p>
      </div>
    </div>
  );
}
