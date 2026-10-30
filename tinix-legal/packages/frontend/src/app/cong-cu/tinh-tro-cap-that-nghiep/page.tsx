'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { UserX } from 'lucide-react';
import { calculateUnemploymentBenefit, REGIONAL_MIN_WAGE, type WageRegion } from '@tinix-legal/shared';

function formatVND(n: number): string {
  return Math.round(n).toLocaleString('vi-VN') + ' đ';
}

export default function TinhTroCapThatNghiepPage() {
  const [salaryInput, setSalaryInput] = useState('10000000');
  const [months, setMonths] = useState('36');
  const [region, setRegion] = useState<WageRegion>('I');
  const [submitted, setSubmitted] = useState(false);

  const salary = Number(salaryInput.replace(/[^\d]/g, '')) || 0;
  const monthsNum = Number(months) || 0;
  const result = useMemo(() => calculateUnemploymentBenefit(salary, monthsNum, region), [salary, monthsNum, region]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <nav className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        <Link href="/cong-cu" className="hover:text-accent-600">Công cụ</Link>
        <span className="mx-1.5">›</span>
        <span>Tính trợ cấp thất nghiệp</span>
      </nav>

      <div className="flex items-center gap-3 mb-2">
        <div className="p-2.5 rounded-xl bg-accent-600/10 text-accent-600">
          <UserX className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Công cụ tính trợ cấp thất nghiệp</h1>
      </div>
      <p className="text-gray-600 dark:text-gray-300 mb-8">
        Mức hưởng bằng 60% bình quân tiền lương đóng BHTN của 6 tháng liền kề, tối đa 5 lần lương
        tối thiểu vùng — theo Điều 50 Luật Việc làm 2013.
      </p>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Bình quân lương 6 tháng</label>
            <input type="text" inputMode="numeric" value={salary.toLocaleString('vi-VN')} onChange={(e) => setSalaryInput(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Số tháng đã đóng BHTN</label>
            <input type="number" value={months} onChange={(e) => setMonths(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Vùng lương tối thiểu</label>
            <select value={region} onChange={(e) => setRegion(e.target.value as WageRegion)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm">
              {(Object.keys(REGIONAL_MIN_WAGE) as WageRegion[]).map((r) => (
                <option key={r} value={r}>Vùng {r}</option>
              ))}
            </select>
          </div>
        </div>
        <button type="button" onClick={() => setSubmitted(true)} className="px-5 py-2.5 bg-accent-600 hover:bg-accent-700 text-white font-medium rounded-lg transition-colors">
          Tính trợ cấp
        </button>
      </div>

      {submitted && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6 text-center">
            <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">Mức hưởng hằng tháng</div>
            <div className="text-2xl font-bold text-accent-600">{formatVND(result.cappedMonthlyBenefit)}</div>
            {result.isCapped && <p className="text-xs text-accent-600 mt-1">Đã áp trần 5 lần lương tối thiểu vùng</p>}
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6 text-center">
            <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">Số tháng được hưởng</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{result.benefitMonths} tháng</div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Đóng đủ 12–36 tháng: hưởng 3 tháng trợ cấp; cứ đóng đủ thêm 12 tháng thì hưởng thêm 1
          tháng, tối đa 12 tháng.
        </p>
      </div>
    </div>
  );
}
