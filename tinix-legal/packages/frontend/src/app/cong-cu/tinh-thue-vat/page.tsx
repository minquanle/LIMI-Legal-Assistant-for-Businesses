'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Percent } from 'lucide-react';
import { calculateVatFromExclPrice, calculateVatFromInclPrice, VAT_RATES, type VatRate } from '@tinix-legal/shared';

function formatVND(n: number): string {
  return Math.round(n).toLocaleString('vi-VN') + ' đ';
}

export default function TinhThueVatPage() {
  const [mode, setMode] = useState<'excl' | 'incl'>('excl');
  const [amountInput, setAmountInput] = useState('1000000');
  const [rate, setRate] = useState<VatRate>(8);
  const [submitted, setSubmitted] = useState(false);

  const amount = Number(amountInput.replace(/[^\d]/g, '')) || 0;
  const result = useMemo(
    () => (mode === 'excl' ? calculateVatFromExclPrice(amount, rate) : calculateVatFromInclPrice(amount, rate)),
    [mode, amount, rate]
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <nav className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        <Link href="/cong-cu" className="hover:text-accent-600">Công cụ</Link>
        <span className="mx-1.5">›</span>
        <span>Tính thuế VAT</span>
      </nav>

      <div className="flex items-center gap-3 mb-2">
        <div className="p-2.5 rounded-xl bg-accent-600/10 text-accent-600">
          <Percent className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Công cụ tính thuế VAT (GTGT)</h1>
      </div>
      <p className="text-gray-600 dark:text-gray-300 mb-8">
        Tính thuế GTGT từ giá chưa thuế, hoặc bóc ngược thuế từ giá đã có thuế. Áp dụng mức thuế
        suất 8% (giảm cho hầu hết hàng hóa, dịch vụ từ 01/07/2025 đến hết 31/12/2026 theo Nghị
        quyết 204/2025/QH15) hoặc 10% (mức chuẩn, áp dụng cho nhóm loại trừ: viễn thông, tài
        chính/ngân hàng/bảo hiểm, bất động sản, kim loại, khai khoáng trừ than, hàng chịu thuế
        TTĐB).
      </p>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
        <div className="flex gap-2 mb-5">
          <button
            type="button"
            onClick={() => setMode('excl')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${mode === 'excl' ? 'bg-accent-600 text-white border-accent-600' : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'}`}
          >
            Từ giá chưa thuế
          </button>
          <button
            type="button"
            onClick={() => setMode('incl')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${mode === 'incl' ? 'bg-accent-600 text-white border-accent-600' : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'}`}
          >
            Bóc ngược từ giá đã có thuế
          </button>
        </div>

        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          {mode === 'excl' ? 'Giá chưa thuế' : 'Giá đã có thuế'} <span className="text-red-500">*</span>
        </label>
        <div className="flex items-center gap-2 mb-4">
          <input
            type="text"
            inputMode="numeric"
            value={amount.toLocaleString('vi-VN')}
            onChange={(e) => setAmountInput(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-500"
          />
          <span className="text-sm text-gray-500 shrink-0">VNĐ</span>
        </div>

        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Thuế suất</label>
        <div className="flex gap-2 mb-5">
          {VAT_RATES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRate(r)}
              className={`px-4 py-1.5 text-sm rounded-full border transition-colors ${rate === r ? 'bg-accent-600 text-white border-accent-600' : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'}`}
            >
              {r}%
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setSubmitted(true)}
          className="px-5 py-2.5 bg-accent-600 hover:bg-accent-700 text-white font-medium rounded-lg transition-colors"
        >
          Tính thuế
        </button>
      </div>

      {submitted && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-600 dark:text-gray-400">Giá chưa thuế</dt>
              <dd className="font-medium text-gray-900 dark:text-white">{formatVND(result.priceExclVat)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600 dark:text-gray-400">Thuế GTGT ({rate}%)</dt>
              <dd className="font-medium text-accent-600">+ {formatVND(result.vatAmount)}</dd>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
              <dt className="text-gray-700 dark:text-gray-300 font-semibold">Giá đã có thuế</dt>
              <dd className="font-bold text-gray-900 dark:text-white">{formatVND(result.priceInclVat)}</dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  );
}
