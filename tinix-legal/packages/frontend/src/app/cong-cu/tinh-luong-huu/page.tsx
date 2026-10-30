'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Users } from 'lucide-react';
import { getRetirementAge, calculatePension } from '@tinix-legal/shared';

function formatVND(n: number): string {
  return Math.round(n).toLocaleString('vi-VN') + ' đ';
}

export default function TinhLuongHuuPage() {
  const [gender, setGender] = useState<'nam' | 'nu'>('nam');
  const [retirementYear, setRetirementYear] = useState('2026');
  const [yearsContributed, setYearsContributed] = useState('25');
  const [avgSalaryInput, setAvgSalaryInput] = useState('10000000');
  const [submitted, setSubmitted] = useState(false);

  const year = Number(retirementYear) || 2026;
  const years = Number(yearsContributed) || 0;
  const avgSalary = Number(avgSalaryInput.replace(/[^\d]/g, '')) || 0;

  const age = useMemo(() => getRetirementAge(gender, year), [gender, year]);
  const pension = useMemo(() => calculatePension(gender, years, avgSalary), [gender, years, avgSalary]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <nav className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        <Link href="/cong-cu" className="hover:text-accent-600">Công cụ</Link>
        <span className="mx-1.5">›</span>
        <span>Tính lương hưu</span>
      </nav>

      <div className="flex items-center gap-3 mb-2">
        <div className="p-2.5 rounded-xl bg-accent-600/10 text-accent-600">
          <Users className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Công cụ tra tuổi nghỉ hưu & tính lương hưu</h1>
      </div>
      <p className="text-gray-600 dark:text-gray-300 mb-8">
        Tuổi nghỉ hưu theo lộ trình Điều 169 Bộ luật Lao động 2019, và tỷ lệ hưởng lương hưu hằng
        tháng theo Luật Bảo hiểm xã hội.
      </p>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Giới tính</label>
        <div className="flex gap-2 mb-4">
          <button type="button" onClick={() => setGender('nam')} className={`flex-1 py-2 rounded-lg text-sm font-medium border ${gender === 'nam' ? 'bg-accent-600 text-white border-accent-600' : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'}`}>Nam</button>
          <button type="button" onClick={() => setGender('nu')} className={`flex-1 py-2 rounded-lg text-sm font-medium border ${gender === 'nu' ? 'bg-accent-600 text-white border-accent-600' : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'}`}>Nữ</button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Năm dự kiến nghỉ hưu</label>
            <input type="number" value={retirementYear} onChange={(e) => setRetirementYear(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Số năm đóng BHXH</label>
            <input type="number" value={yearsContributed} onChange={(e) => setYearsContributed(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Bình quân lương đóng BHXH</label>
            <input type="text" inputMode="numeric" value={avgSalary.toLocaleString('vi-VN')} onChange={(e) => setAvgSalaryInput(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white" />
          </div>
        </div>

        <button type="button" onClick={() => setSubmitted(true)} className="px-5 py-2.5 bg-accent-600 hover:bg-accent-700 text-white font-medium rounded-lg transition-colors">
          Tính
        </button>
      </div>

      {submitted && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6 text-center">
            <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">Tuổi nghỉ hưu</div>
            <div className="text-2xl font-bold text-accent-600">{age.years} tuổi {age.months > 0 ? `${age.months} tháng` : ''}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6 text-center">
            <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">Lương hưu hằng tháng ({pension.ratePercent}%)</div>
            <div className="text-2xl font-bold text-accent-600">{formatVND(pension.monthlyPension)}</div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6 mt-6">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Tỷ lệ hưởng: nữ đủ 15 năm đóng = 45%, nam đủ 20 năm đóng = 45%; sau đó cứ thêm mỗi năm
          đóng được cộng 2%, tối đa 75%. Điều kiện hưởng lương hưu cần tối thiểu 15 năm đóng BHXH
          theo Luật BHXH hiện hành.
        </p>
      </div>
    </div>
  );
}
