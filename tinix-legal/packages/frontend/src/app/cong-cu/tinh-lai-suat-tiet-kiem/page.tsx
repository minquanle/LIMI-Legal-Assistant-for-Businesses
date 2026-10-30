'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { PiggyBank } from 'lucide-react';
import { calculateSavingsInterest, type SavingsPayoutMethod } from '@tinix-legal/shared';

function formatVND(n: number): string {
  return Math.round(n).toLocaleString('vi-VN') + ' đ';
}

const METHODS: { value: SavingsPayoutMethod; label: string }[] = [
  { value: 'cuoi_ky', label: 'Lĩnh lãi cuối kỳ' },
  { value: 'dau_ky', label: 'Lĩnh lãi đầu kỳ' },
  { value: 'dinh_ky_hang_thang', label: 'Lĩnh lãi hàng tháng' },
  { value: 'khong_ky_han', label: 'Không kỳ hạn' },
];

export default function TinhLaiSuatTietKiemPage() {
  const [principalInput, setPrincipalInput] = useState('100000000');
  const [rate, setRate] = useState('5.5');
  const [months, setMonths] = useState('12');
  const [method, setMethod] = useState<SavingsPayoutMethod>('cuoi_ky');
  const [submitted, setSubmitted] = useState(false);

  const principal = Number(principalInput.replace(/[^\d]/g, '')) || 0;
  const rateNum = Number(rate) || 0;
  const monthsNum = Math.max(1, Number(months) || 1);
  const result = useMemo(() => calculateSavingsInterest(principal, rateNum, monthsNum, method), [principal, rateNum, monthsNum, method]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <nav className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        <Link href="/cong-cu" className="hover:text-accent-600">Công cụ</Link>
        <span className="mx-1.5">›</span>
        <span>Tính lãi suất tiết kiệm</span>
      </nav>

      <div className="flex items-center gap-3 mb-2">
        <div className="p-2.5 rounded-xl bg-accent-600/10 text-accent-600">
          <PiggyBank className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Công cụ tính lãi suất tiết kiệm</h1>
      </div>
      <p className="text-gray-600 dark:text-gray-300 mb-8">
        Tính tiền lãi tiết kiệm theo 4 hình thức lĩnh lãi phổ biến. Lãi suất do bạn nhập theo biểu
        lãi suất ngân hàng bạn gửi — công cụ không tự tra lãi suất niêm yết.
      </p>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Số tiền gửi</label>
            <input
              type="text" inputMode="numeric"
              value={principal.toLocaleString('vi-VN')}
              onChange={(e) => setPrincipalInput(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Lãi suất (%/năm)</label>
            <input
              type="number" step="0.1" value={rate} onChange={(e) => setRate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Kỳ hạn (tháng)</label>
            <input
              type="number" value={months} onChange={(e) => setMonths(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Hình thức lĩnh lãi</label>
        <div className="flex flex-wrap gap-2 mb-5">
          {METHODS.map((m) => (
            <button
              key={m.value} type="button" onClick={() => setMethod(m.value)}
              className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${method === m.value ? 'bg-accent-600 text-white border-accent-600' : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'}`}
            >
              {m.label}
            </button>
          ))}
        </div>

        <button
          type="button" onClick={() => setSubmitted(true)}
          className="px-5 py-2.5 bg-accent-600 hover:bg-accent-700 text-white font-medium rounded-lg transition-colors"
        >
          Tính lãi
        </button>
      </div>

      {submitted && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-600 dark:text-gray-400">Số tiền gửi</dt>
              <dd className="font-medium text-gray-900 dark:text-white">{formatVND(result.principal)}</dd>
            </div>
            {result.monthlyInterest !== undefined && (
              <div className="flex justify-between">
                <dt className="text-gray-600 dark:text-gray-400">Lãi nhận mỗi tháng</dt>
                <dd className="font-medium text-accent-600">{formatVND(result.monthlyInterest)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-gray-600 dark:text-gray-400">Tổng tiền lãi</dt>
              <dd className="font-medium text-accent-600">{formatVND(result.totalInterest)}</dd>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
              <dt className="text-gray-700 dark:text-gray-300 font-semibold">
                {method === 'dau_ky' ? 'Tiền gốc nhận cuối kỳ' : 'Tổng tiền nhận cuối kỳ'}
              </dt>
              <dd className="font-bold text-gray-900 dark:text-white">{formatVND(result.totalReceived)}</dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  );
}
