'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { PieChart } from 'lucide-react';
import { calculateEbitdaInterestCap } from '@tinix-legal/shared';

function formatVnd(n: number): string {
  return Math.round(n).toLocaleString('vi-VN') + ' đ';
}

export default function TinhTranLaiVayEbitdaPage() {
  const [netOperatingProfit, setNetOperatingProfit] = useState('1000000000');
  const [netInterestExpense, setNetInterestExpense] = useState('800000000');
  const [depreciationExpense, setDepreciationExpense] = useState('200000000');
  const [submitted, setSubmitted] = useState(false);

  const result = useMemo(
    () =>
      calculateEbitdaInterestCap({
        netOperatingProfit: Number(netOperatingProfit) || 0,
        netInterestExpense: Number(netInterestExpense) || 0,
        depreciationExpense: Number(depreciationExpense) || 0,
      }),
    [netOperatingProfit, netInterestExpense, depreciationExpense]
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <nav className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        <Link href="/cong-cu" className="hover:text-accent-600">Công cụ</Link>
        <span className="mx-1.5">›</span>
        <span>Tính trần chi phí lãi vay theo EBITDA</span>
      </nav>

      <div className="flex items-center gap-3 mb-2">
        <div className="p-2.5 rounded-xl bg-accent-600/10 text-accent-600">
          <PieChart className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Công cụ tính trần chi phí lãi vay được trừ (giao dịch liên kết)
        </h1>
      </div>
      <p className="text-gray-600 dark:text-gray-300 mb-8">
        Áp dụng cho doanh nghiệp có giao dịch liên kết, theo Điều 16 khoản 3 Nghị định
        132/2020/NĐ-CP (sửa đổi bởi Nghị định 20/2025/NĐ-CP).
      </p>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Lợi nhuận thuần từ hoạt động kinh doanh (đồng)</label>
        <input
          type="number" value={netOperatingProfit} onChange={(e) => setNetOperatingProfit(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white mb-4"
        />

        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Chi phí lãi vay ròng (đã trừ lãi tiền gửi, lãi cho vay, đồng)</label>
        <input
          type="number" value={netInterestExpense} onChange={(e) => setNetInterestExpense(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white mb-4"
        />

        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Chi phí khấu hao (đồng)</label>
        <input
          type="number" value={depreciationExpense} onChange={(e) => setDepreciationExpense(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white mb-5"
        />

        <button type="button" onClick={() => setSubmitted(true)} className="px-5 py-2.5 bg-accent-600 hover:bg-accent-700 text-white font-medium rounded-lg transition-colors">
          Tính trần lãi vay
        </button>
      </div>

      {submitted && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-600 dark:text-gray-400">EBITDA</dt>
              <dd className="font-medium text-gray-900 dark:text-white">{formatVnd(result.ebitda)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600 dark:text-gray-400">Trần lãi vay được trừ tối đa (30% EBITDA)</dt>
              <dd className="font-medium text-gray-900 dark:text-white">{formatVnd(result.maximumDeductibleInterest)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600 dark:text-gray-400">Lãi vay được trừ thực tế</dt>
              <dd className="font-medium text-gray-900 dark:text-white">{formatVnd(result.deductibleInterest)}</dd>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
              <dt className="text-gray-700 dark:text-gray-300 font-semibold">Lãi vay không được trừ</dt>
              <dd className="font-bold text-accent-600">{formatVnd(result.nonDeductibleInterest)}</dd>
            </div>
          </dl>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Nếu EBITDA âm, toàn bộ chi phí lãi vay không được trừ và không được chuyển sang kỳ tính
          thuế sau. Công thức: Trần lãi vay = 30% × (Lợi nhuận thuần HĐKD + Chi phí lãi vay ròng
          + Chi phí khấu hao).
        </p>
      </div>
    </div>
  );
}
