'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Wallet, Info } from 'lucide-react';
import {
  grossToNet,
  netToGross,
  EMPLOYEE_BHXH_RATE,
  EMPLOYEE_BHYT_RATE,
  EMPLOYEE_BHTN_RATE,
  LUONG_CO_SO,
  REGIONAL_MIN_WAGE,
  type WageRegion,
  type SalaryBreakdown,
} from '@tinix-legal/shared';

function formatVND(n: number): string {
  return Math.round(n).toLocaleString('vi-VN') + ' VNĐ';
}

type Mode = 'gross-to-net' | 'net-to-gross';

export default function TinhLuongPage() {
  const [mode, setMode] = useState<Mode>('gross-to-net');
  const [amountInput, setAmountInput] = useState('20000000');
  const [dependents, setDependents] = useState(0);
  const [region, setRegion] = useState<WageRegion>('I');
  const [submitted, setSubmitted] = useState(false);

  const amount = Number(amountInput.replace(/[^\d]/g, '')) || 0;

  const result: SalaryBreakdown = useMemo(() => {
    return mode === 'gross-to-net'
      ? grossToNet(amount, dependents, region)
      : netToGross(amount, dependents, region);
  }, [mode, amount, dependents, region]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <nav className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        <Link href="/cong-cu" className="hover:text-accent-600">Công cụ</Link>
        <span className="mx-1.5">›</span>
        <span>Tính lương Gross ↔ Net</span>
      </nav>

      <div className="flex items-center gap-3 mb-2">
        <div className="p-2.5 rounded-xl bg-accent-600/10 text-accent-600">
          <Wallet className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Công cụ tính lương Gross ↔ Net
        </h1>
      </div>
      <p className="text-gray-600 dark:text-gray-300 mb-8">
        Đổi lương Gross sang Net hoặc ngược lại, tách rõ từng khoản bảo hiểm bắt buộc (BHXH,
        BHYT, BHTN) và thuế TNCN theo quy định hiện hành.
      </p>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
        <div className="flex gap-2 mb-5">
          <button
            type="button"
            onClick={() => setMode('gross-to-net')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
              mode === 'gross-to-net'
                ? 'bg-accent-600 text-white border-accent-600'
                : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
            }`}
          >
            Gross → Net
          </button>
          <button
            type="button"
            onClick={() => setMode('net-to-gross')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
              mode === 'net-to-gross'
                ? 'bg-accent-600 text-white border-accent-600'
                : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
            }`}
          >
            Net → Gross
          </button>
        </div>

        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          {mode === 'gross-to-net' ? 'Lương Gross (trước trừ)' : 'Lương Net (thực nhận mong muốn)'}{' '}
          <span className="text-red-500">*</span>
        </label>
        <div className="flex items-center gap-2 mb-4">
          <input
            type="text"
            inputMode="numeric"
            value={Number(amountInput.replace(/[^\d]/g, '') || 0).toLocaleString('vi-VN')}
            onChange={(e) => setAmountInput(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-500"
          />
          <span className="text-sm text-gray-500 shrink-0">VNĐ</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Số người phụ thuộc
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setDependents((d) => Math.max(0, d - 1))}
                className="w-9 h-9 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
              >
                −
              </button>
              <span className="w-8 text-center font-semibold text-gray-900 dark:text-white">{dependents}</span>
              <button
                type="button"
                onClick={() => setDependents((d) => d + 1)}
                className="w-9 h-9 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
              >
                +
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Vùng lương tối thiểu (trần đóng BHTN)
            </label>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value as WageRegion)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
            >
              {(Object.keys(REGIONAL_MIN_WAGE) as WageRegion[]).map((r) => (
                <option key={r} value={r}>
                  Vùng {r} ({formatVND(REGIONAL_MIN_WAGE[r])})
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setSubmitted(true)}
          className="px-5 py-2.5 bg-accent-600 hover:bg-accent-700 text-white font-medium rounded-lg transition-colors"
        >
          Tính lương
        </button>
      </div>

      {submitted && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Kết quả</h2>

          <div className="grid grid-cols-2 gap-4 mb-5 text-center">
            <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900/40">
              <div className="text-xs uppercase text-gray-500 mb-1">Lương Gross</div>
              <div className="text-xl font-bold text-gray-900 dark:text-white">{formatVND(result.grossIncome)}</div>
            </div>
            <div className="p-4 rounded-lg bg-accent-50 dark:bg-accent-700/20">
              <div className="text-xs uppercase text-accent-700 dark:text-accent-400 mb-1">Lương Net (thực nhận)</div>
              <div className="text-xl font-bold text-accent-600">{formatVND(result.netIncome)}</div>
            </div>
          </div>

          <dl className="space-y-2 text-sm mb-2">
            <div className="flex justify-between">
              <dt className="text-gray-600 dark:text-gray-400">BHXH ({(EMPLOYEE_BHXH_RATE * 100).toFixed(0)}%)</dt>
              <dd className="font-medium text-red-500">− {formatVND(result.bhxh)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600 dark:text-gray-400">BHYT ({(EMPLOYEE_BHYT_RATE * 100).toFixed(1)}%)</dt>
              <dd className="font-medium text-red-500">− {formatVND(result.bhyt)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600 dark:text-gray-400">BHTN ({(EMPLOYEE_BHTN_RATE * 100).toFixed(0)}%)</dt>
              <dd className="font-medium text-red-500">− {formatVND(result.bhtn)}</dd>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
              <dt className="text-gray-700 dark:text-gray-300 font-medium">Thu nhập sau bảo hiểm</dt>
              <dd className="font-semibold text-gray-900 dark:text-white">{formatVND(result.incomeAfterInsurance)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600 dark:text-gray-400">Thuế TNCN phải nộp</dt>
              <dd className="font-medium text-red-500">− {formatVND(result.tax.totalTax)}</dd>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
              <dt className="text-gray-700 dark:text-gray-300 font-medium">Lương Net thực nhận</dt>
              <dd className="font-bold text-accent-600">{formatVND(result.netIncome)}</dd>
            </div>
          </dl>

          <p className="text-xs text-gray-500 mt-3">
            Xem chi tiết thuế TNCN theo từng bậc tại{' '}
            <Link href="/cong-cu/tinh-thue-tncn" className="text-accent-600 hover:underline">
              công cụ tính thuế TNCN
            </Link>.
          </p>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white flex items-center gap-2">
          <Info className="w-4 h-4 text-accent-500" /> Cách tính
        </h2>
        <ul className="text-sm text-gray-600 dark:text-gray-400 list-disc pl-5 space-y-1.5">
          <li>
            Người lao động đóng bảo hiểm bắt buộc {((EMPLOYEE_BHXH_RATE + EMPLOYEE_BHYT_RATE + EMPLOYEE_BHTN_RATE) * 100).toFixed(1)}%
            trên lương: BHXH {(EMPLOYEE_BHXH_RATE * 100).toFixed(0)}% + BHYT {(EMPLOYEE_BHYT_RATE * 100).toFixed(1)}% + BHTN{' '}
            {(EMPLOYEE_BHTN_RATE * 100).toFixed(0)}%.
          </li>
          <li>
            Mức đóng BHXH/BHYT tính trên phần lương tối đa 20 lần lương cơ sở
            ({formatVND(LUONG_CO_SO)} × 20 = {formatVND(LUONG_CO_SO * 20)}).
          </li>
          <li>Mức đóng BHTN tính trên phần lương tối đa 20 lần lương tối thiểu vùng nơi làm việc.</li>
          <li>Thuế TNCN tính trên thu nhập sau khi đã trừ bảo hiểm bắt buộc, theo biểu lũy tiến 7 bậc.</li>
          <li>Kết quả mang tính tham khảo, không thay thế bảng lương chính thức của đơn vị sử dụng lao động.</li>
        </ul>
      </div>
    </div>
  );
}
