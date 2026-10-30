'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Receipt } from 'lucide-react';
import { calculateTaxLatePayment } from '@tinix-legal/shared';

function formatVnd(n: number): string {
  return Math.round(n).toLocaleString('vi-VN') + ' đ';
}

export default function TinhChamNopThuePage() {
  const [overdueTaxAmount, setOverdueTaxAmount] = useState('100000000');
  const [overdueDays, setOverdueDays] = useState('30');
  const [submitted, setSubmitted] = useState(false);

  const result = useMemo(
    () => calculateTaxLatePayment(Number(overdueTaxAmount) || 0, Number(overdueDays) || 0),
    [overdueTaxAmount, overdueDays]
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <nav className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        <Link href="/cong-cu" className="hover:text-accent-600">Công cụ</Link>
        <span className="mx-1.5">›</span>
        <span>Tính tiền chậm nộp thuế</span>
      </nav>

      <div className="flex items-center gap-3 mb-2">
        <div className="p-2.5 rounded-xl bg-accent-600/10 text-accent-600">
          <Receipt className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Công cụ tính tiền chậm nộp thuế
        </h1>
      </div>
      <p className="text-gray-600 dark:text-gray-300 mb-8">
        Mức 0,03%/ngày tính trên số tiền thuế chậm nộp, theo Điều 59 Luật Quản lý thuế 2019
        (số 38/2019/QH14).
      </p>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Số tiền thuế chậm nộp (đồng)</label>
        <input
          type="number" value={overdueTaxAmount} onChange={(e) => setOverdueTaxAmount(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white mb-4"
        />

        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Số ngày chậm nộp (tính theo ngày lịch, kể cả ngày lễ, ngày nghỉ)</label>
        <input
          type="number" value={overdueDays} onChange={(e) => setOverdueDays(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white mb-5"
        />

        <button type="button" onClick={() => setSubmitted(true)} className="px-5 py-2.5 bg-accent-600 hover:bg-accent-700 text-white font-medium rounded-lg transition-colors">
          Tính tiền chậm nộp
        </button>
      </div>

      {submitted && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-600 dark:text-gray-400">Mức tính chậm nộp</dt>
              <dd className="font-medium text-gray-900 dark:text-white">{result.dailyRatePercent}%/ngày</dd>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
              <dt className="text-gray-700 dark:text-gray-300 font-semibold">Tiền chậm nộp phải trả</dt>
              <dd className="font-bold text-accent-600">{formatVnd(result.latePaymentInterest)}</dd>
            </div>
          </dl>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Công thức: Tiền chậm nộp = Số tiền thuế chậm nộp × 0,03% × Số ngày chậm nộp, tính liên
          tục từ ngày kế tiếp ngày hết hạn nộp đến ngày liền kề trước ngày nộp tiền thuế vào ngân
          sách nhà nước. Từ 01/7/2026, Luật Quản lý thuế số 108/2025/QH15 thay thế Luật số
          38/2019/QH14 nhưng vẫn giữ nguyên mức 0,03%/ngày.
        </p>
      </div>
    </div>
  );
}
