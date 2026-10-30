'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { TrendingUp, Plus, Trash2 } from 'lucide-react';
import { calculateInvestment } from '@tinix-legal/shared';

function formatVnd(n: number): string {
  return Math.round(n).toLocaleString('vi-VN') + ' đ';
}

export default function TinhHieuQuaDauTuPage() {
  const [initialInvestment, setInitialInvestment] = useState('1000000000');
  const [discountRate, setDiscountRate] = useState('10');
  const [cashFlows, setCashFlows] = useState<string[]>(['300000000', '350000000', '400000000', '400000000']);
  const [submitted, setSubmitted] = useState(false);

  const investment = Number(initialInvestment) || 0;
  const rate = Number(discountRate) || 0;
  const flows = useMemo(() => cashFlows.map((f) => Number(f) || 0), [cashFlows]);

  const result = useMemo(() => calculateInvestment(investment, flows, rate), [investment, flows, rate]);

  const updateFlow = (i: number, v: string) => {
    setCashFlows((prev) => prev.map((f, idx) => (idx === i ? v : f)));
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <nav className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        <Link href="/cong-cu" className="hover:text-accent-600">Công cụ</Link>
        <span className="mx-1.5">›</span>
        <span>Tính hiệu quả dự án đầu tư (NPV, IRR, hoàn vốn)</span>
      </nav>

      <div className="flex items-center gap-3 mb-2">
        <div className="p-2.5 rounded-xl bg-accent-600/10 text-accent-600">
          <TrendingUp className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Công cụ tính hiệu quả dự án đầu tư
        </h1>
      </div>
      <p className="text-gray-600 dark:text-gray-300 mb-8">
        Tính giá trị hiện tại thuần (NPV), tỷ suất hoàn vốn nội bộ (IRR) và thời gian hoàn vốn
        (giản đơn và chiết khấu) từ dòng tiền dự án theo từng năm.
      </p>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Vốn đầu tư ban đầu (đồng)</label>
        <input
          type="number" value={initialInvestment} onChange={(e) => setInitialInvestment(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white mb-4"
        />

        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Tỷ lệ chiết khấu (%/năm)</label>
        <input
          type="number" step="0.1" value={discountRate} onChange={(e) => setDiscountRate(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white mb-4"
        />

        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Dòng tiền thuần theo từng năm (đồng)</label>
        <div className="space-y-2 mb-3">
          {cashFlows.map((f, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400 w-16 shrink-0">Năm {i + 1}</span>
              <input
                type="number" value={f} onChange={(e) => updateFlow(i, e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              />
              <button
                type="button" onClick={() => setCashFlows((prev) => prev.filter((_, idx) => idx !== i))}
                disabled={cashFlows.length <= 1}
                className="p-2 text-gray-400 hover:text-red-600 disabled:opacity-30 disabled:hover:text-gray-400"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button" onClick={() => setCashFlows((prev) => [...prev, '0'])}
          className="flex items-center gap-1.5 text-sm text-accent-600 hover:text-accent-700 font-medium mb-5"
        >
          <Plus className="w-4 h-4" /> Thêm năm
        </button>

        <button type="button" onClick={() => setSubmitted(true)} className="block px-5 py-2.5 bg-accent-600 hover:bg-accent-700 text-white font-medium rounded-lg transition-colors">
          Tính hiệu quả đầu tư
        </button>
      </div>

      {submitted && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-600 dark:text-gray-400">Giá trị hiện tại thuần (NPV)</dt>
              <dd className={`font-bold ${result.npv >= 0 ? 'text-accent-600' : 'text-red-600'}`}>{formatVnd(result.npv)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600 dark:text-gray-400">Tỷ suất hoàn vốn nội bộ (IRR)</dt>
              <dd className="font-medium text-gray-900 dark:text-white">
                {result.irrPercent !== null ? `${result.irrPercent.toFixed(2)}%` : 'Không hội tụ (dòng tiền không đổi dấu)'}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600 dark:text-gray-400">Thời gian hoàn vốn giản đơn</dt>
              <dd className="font-medium text-gray-900 dark:text-white">
                {result.simplePaybackYears !== null ? `${result.simplePaybackYears.toFixed(2)} năm` : 'Không hoàn vốn trong thời gian đã nhập'}
              </dd>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
              <dt className="text-gray-700 dark:text-gray-300 font-semibold">Thời gian hoàn vốn có chiết khấu</dt>
              <dd className="font-bold text-gray-900 dark:text-white">
                {result.discountedPaybackYears !== null ? `${result.discountedPaybackYears.toFixed(2)} năm` : 'Không hoàn vốn trong thời gian đã nhập'}
              </dd>
            </div>
          </dl>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          NPV dương và IRR lớn hơn tỷ lệ chiết khấu cho thấy dự án tạo ra giá trị vượt chi phí vốn.
          Đây là công thức tài chính tiêu chuẩn (không gắn với văn bản pháp luật cụ thể), dùng để
          tham khảo khi lập, thẩm định dự án đầu tư.
        </p>
      </div>
    </div>
  );
}
