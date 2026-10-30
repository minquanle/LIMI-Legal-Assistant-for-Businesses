'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { LineChart } from 'lucide-react';
import { calculateSecuritiesTransferTax, calculateLlcCapitalTransferTax } from '@tinix-legal/shared';

function formatVnd(n: number): string {
  return Math.round(n).toLocaleString('vi-VN') + ' đ';
}

export default function TinhThueChuyenNhuongChungKhoanPage() {
  const [tab, setTab] = useState<'chung_khoan' | 'von_gop_tnhh'>('chung_khoan');

  const [transferPrice, setTransferPrice] = useState('500000000');
  const [submittedSecurities, setSubmittedSecurities] = useState(false);
  const securitiesResult = useMemo(() => calculateSecuritiesTransferTax(Number(transferPrice) || 0), [transferPrice]);

  const [llcTransferPrice, setLlcTransferPrice] = useState('2000000000');
  const [costBasis, setCostBasis] = useState('1000000000');
  const [expenses, setExpenses] = useState('50000000');
  const [submittedLlc, setSubmittedLlc] = useState(false);
  const llcResult = useMemo(
    () =>
      calculateLlcCapitalTransferTax({
        transferPrice: Number(llcTransferPrice) || 0,
        costBasis: Number(costBasis) || 0,
        reasonableExpenses: Number(expenses) || 0,
      }),
    [llcTransferPrice, costBasis, expenses]
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <nav className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        <Link href="/cong-cu" className="hover:text-accent-600">Công cụ</Link>
        <span className="mx-1.5">›</span>
        <span>Tính thuế chuyển nhượng chứng khoán, vốn góp</span>
      </nav>

      <div className="flex items-center gap-3 mb-2">
        <div className="p-2.5 rounded-xl bg-accent-700/10 text-accent-700">
          <LineChart className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Công cụ tính thuế chuyển nhượng chứng khoán, vốn góp
        </h1>
      </div>
      <p className="text-gray-600 dark:text-gray-300 mb-8">
        Hai cơ chế khác nhau theo Thông tư 111/2013/TT-BTC: chứng khoán tính 0,1% trên giá bán;
        vốn góp công ty TNHH tính 20% trên lãi ròng.
      </p>

      <div className="flex gap-2 mb-6">
        <button
          type="button" onClick={() => setTab('chung_khoan')}
          className={`px-4 py-2 text-sm rounded-lg border transition-colors ${tab === 'chung_khoan' ? 'bg-accent-700 text-white border-accent-700' : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'}`}
        >
          Chứng khoán / cổ phần công ty cổ phần
        </button>
        <button
          type="button" onClick={() => setTab('von_gop_tnhh')}
          className={`px-4 py-2 text-sm rounded-lg border transition-colors ${tab === 'von_gop_tnhh' ? 'bg-accent-700 text-white border-accent-700' : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'}`}
        >
          Vốn góp công ty TNHH
        </button>
      </div>

      {tab === 'chung_khoan' ? (
        <>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Giá chuyển nhượng (đồng)</label>
            <input
              type="number" value={transferPrice} onChange={(e) => setTransferPrice(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white mb-5"
            />
            <button type="button" onClick={() => setSubmittedSecurities(true)} className="px-5 py-2.5 bg-accent-700 hover:bg-accent-700 text-white font-medium rounded-lg transition-colors">
              Tính thuế
            </button>
          </div>

          {submittedSecurities && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
              <dl className="flex justify-between text-sm">
                <dt className="text-gray-700 dark:text-gray-300 font-semibold">Thuế TNCN phải nộp (0,1%)</dt>
                <dd className="font-bold text-accent-700">{formatVnd(securitiesResult.tax)}</dd>
              </dl>
            </div>
          )}

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Áp dụng cho cổ phiếu niêm yết, UPCoM, trái phiếu, chứng chỉ quỹ, cổ phần công ty cổ
              phần chưa niêm yết, chứng khoán phái sinh. Tính trên giá bán mỗi lần, không trừ giá
              vốn, không phân biệt lãi hay lỗ.
            </p>
          </div>
        </>
      ) : (
        <>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Giá chuyển nhượng (đồng)</label>
            <input
              type="number" value={llcTransferPrice} onChange={(e) => setLlcTransferPrice(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white mb-4"
            />
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Giá vốn (đồng)</label>
            <input
              type="number" value={costBasis} onChange={(e) => setCostBasis(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white mb-4"
            />
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Chi phí hợp lý liên quan (đồng)</label>
            <input
              type="number" value={expenses} onChange={(e) => setExpenses(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white mb-5"
            />
            <button type="button" onClick={() => setSubmittedLlc(true)} className="px-5 py-2.5 bg-accent-700 hover:bg-accent-700 text-white font-medium rounded-lg transition-colors">
              Tính thuế
            </button>
          </div>

          {submittedLlc && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-600 dark:text-gray-400">Lãi ròng chịu thuế</dt>
                  <dd className="font-medium text-gray-900 dark:text-white">{formatVnd(llcResult.taxableGain)}</dd>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                  <dt className="text-gray-700 dark:text-gray-300 font-semibold">Thuế TNCN phải nộp (20%)</dt>
                  <dd className="font-bold text-accent-700">{formatVnd(llcResult.tax)}</dd>
                </div>
              </dl>
            </div>
          )}

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Áp dụng cho phần vốn góp trong công ty TNHH, công ty hợp danh (không đại diện bằng
              &quot;cổ phần&quot;). Tính trên phần lãi ròng thực tế, không phải trên giá bán — nếu
              không có lãi thì không phải nộp thuế.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
