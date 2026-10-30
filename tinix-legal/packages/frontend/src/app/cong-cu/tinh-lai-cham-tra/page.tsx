'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { AlertCircle } from 'lucide-react';
import { calculateLatePaymentInterest, DEFAULT_LATE_PAYMENT_RATE, MAX_AGREED_INTEREST_RATE } from '@tinix-legal/shared';

function formatVND(n: number): string {
  return Math.round(n).toLocaleString('vi-VN') + ' đ';
}

export default function TinhLaiChamTraPage() {
  const [principalInput, setPrincipalInput] = useState('100000000');
  const [days, setDays] = useState('30');
  const [rate, setRate] = useState(String(DEFAULT_LATE_PAYMENT_RATE));
  const [submitted, setSubmitted] = useState(false);

  const principal = Number(principalInput.replace(/[^\d]/g, '')) || 0;
  const daysNum = Number(days) || 0;
  const rateNum = Number(rate) || 0;
  const result = useMemo(() => calculateLatePaymentInterest(principal, daysNum, rateNum), [principal, daysNum, rateNum]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <nav className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        <Link href="/cong-cu" className="hover:text-accent-600">Công cụ</Link>
        <span className="mx-1.5">›</span>
        <span>Tính lãi chậm trả</span>
      </nav>

      <div className="flex items-center gap-3 mb-2">
        <div className="p-2.5 rounded-xl bg-accent-600/10 text-accent-600">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Công cụ tính lãi chậm trả</h1>
      </div>
      <p className="text-gray-600 dark:text-gray-300 mb-8">
        Tiền lãi phải trả khi chậm thanh toán nghĩa vụ tài chính, theo Điều 357 và Điều 468 Bộ
        luật Dân sự 2015. Nếu các bên không thỏa thuận lãi suất, mặc định {DEFAULT_LATE_PAYMENT_RATE}%/năm
        (bằng 50% mức trần {MAX_AGREED_INTEREST_RATE}%/năm).
      </p>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Số tiền chậm trả</label>
            <input type="text" inputMode="numeric" value={principal.toLocaleString('vi-VN')} onChange={(e) => setPrincipalInput(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Số ngày chậm trả</label>
            <input type="number" value={days} onChange={(e) => setDays(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Lãi suất (%/năm)</label>
            <input type="number" step="0.1" value={rate} onChange={(e) => setRate(e.target.value)} max={MAX_AGREED_INTEREST_RATE} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white" />
          </div>
        </div>
        <button type="button" onClick={() => setSubmitted(true)} className="px-5 py-2.5 bg-accent-600 hover:bg-accent-700 text-white font-medium rounded-lg transition-colors">
          Tính lãi
        </button>
      </div>

      {submitted && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-600 dark:text-gray-400">Số tiền gốc</dt>
              <dd className="font-medium text-gray-900 dark:text-white">{formatVND(result.principal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600 dark:text-gray-400">Tiền lãi chậm trả</dt>
              <dd className="font-medium text-accent-600">+ {formatVND(result.interest)}</dd>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
              <dt className="text-gray-700 dark:text-gray-300 font-semibold">Tổng số tiền phải trả</dt>
              <dd className="font-bold text-gray-900 dark:text-white">{formatVND(result.totalOwed)}</dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  );
}
