'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Landmark } from 'lucide-react';
import { calculateLoanSchedule } from '@tinix-legal/shared';

function formatVND(n: number): string {
  return Math.round(n).toLocaleString('vi-VN') + ' đ';
}

export default function TinhLaiVayPage() {
  const [principalInput, setPrincipalInput] = useState('100000000');
  const [rate, setRate] = useState('10');
  const [months, setMonths] = useState('12');
  const [method, setMethod] = useState<'giam_dan' | 'co_dinh'>('giam_dan');
  const [submitted, setSubmitted] = useState(false);

  const principal = Number(principalInput.replace(/[^\d]/g, '')) || 0;
  const rateNum = Number(rate) || 0;
  const monthsNum = Math.max(1, Math.min(360, Number(months) || 1));
  const result = useMemo(() => calculateLoanSchedule(principal, rateNum, monthsNum, method), [principal, rateNum, monthsNum, method]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <nav className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        <Link href="/cong-cu" className="hover:text-accent-600">Công cụ</Link>
        <span className="mx-1.5">›</span>
        <span>Tính lãi vay</span>
      </nav>

      <div className="flex items-center gap-3 mb-2">
        <div className="p-2.5 rounded-xl bg-accent-600/10 text-accent-600">
          <Landmark className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Công cụ tính lãi vay</h1>
      </div>
      <p className="text-gray-600 dark:text-gray-300 mb-8">
        Lịch trả nợ theo dư nợ giảm dần hoặc dư nợ ban đầu (cố định) — hai cách tính lãi vay phổ
        biến nhất tại ngân hàng Việt Nam.
      </p>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Số tiền vay</label>
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
              type="number" value={rate} onChange={(e) => setRate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Thời hạn (tháng)</label>
            <input
              type="number" value={months} onChange={(e) => setMonths(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Phương thức tính lãi</label>
        <div className="flex gap-2 mb-5">
          <button
            type="button" onClick={() => setMethod('giam_dan')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${method === 'giam_dan' ? 'bg-accent-600 text-white border-accent-600' : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'}`}
          >
            Dư nợ giảm dần
          </button>
          <button
            type="button" onClick={() => setMethod('co_dinh')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${method === 'co_dinh' ? 'bg-accent-600 text-white border-accent-600' : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'}`}
          >
            Dư nợ ban đầu
          </button>
        </div>

        <button
          type="button" onClick={() => setSubmitted(true)}
          className="px-5 py-2.5 bg-accent-600 hover:bg-accent-700 text-white font-medium rounded-lg transition-colors"
        >
          Tính lãi vay
        </button>
      </div>

      {submitted && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
          <div className="grid grid-cols-2 gap-4 mb-5 text-center">
            <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900/40">
              <div className="text-xs uppercase text-gray-500 mb-1">Tổng lãi phải trả</div>
              <div className="text-xl font-bold text-accent-600">{formatVND(result.totalInterest)}</div>
            </div>
            <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900/40">
              <div className="text-xs uppercase text-gray-500 mb-1">Tổng phải trả (gốc + lãi)</div>
              <div className="text-xl font-bold text-gray-900 dark:text-white">{formatVND(result.totalPayment)}</div>
            </div>
          </div>

          <div className="overflow-x-auto max-h-80 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white dark:bg-gray-800">
                <tr className="border-b border-gray-200 dark:border-gray-700 text-left text-xs uppercase text-gray-500">
                  <th className="py-2 pr-2">Kỳ</th>
                  <th className="py-2 pr-2 text-right">Gốc</th>
                  <th className="py-2 pr-2 text-right">Lãi</th>
                  <th className="py-2 pr-2 text-right">Tổng trả</th>
                  <th className="py-2 pr-2 text-right">Dư nợ còn lại</th>
                </tr>
              </thead>
              <tbody>
                {result.schedule.map((row) => (
                  <tr key={row.period} className="border-b border-gray-50 dark:border-gray-700/50">
                    <td className="py-1.5 pr-2 text-gray-900 dark:text-white">{row.period}</td>
                    <td className="py-1.5 pr-2 text-right text-gray-600 dark:text-gray-400">{formatVND(row.principalPayment)}</td>
                    <td className="py-1.5 pr-2 text-right text-gray-600 dark:text-gray-400">{formatVND(row.interestPayment)}</td>
                    <td className="py-1.5 pr-2 text-right font-medium text-gray-900 dark:text-white">{formatVND(row.totalPayment)}</td>
                    <td className="py-1.5 pr-2 text-right text-gray-500">{formatVND(row.remainingBalance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
