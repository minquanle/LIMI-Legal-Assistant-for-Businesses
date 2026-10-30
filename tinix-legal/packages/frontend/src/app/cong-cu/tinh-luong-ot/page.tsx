'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Clock } from 'lucide-react';
import { calculateOvertimePay, type OvertimeDayType } from '@tinix-legal/shared';

function formatVND(n: number): string {
  return Math.round(n).toLocaleString('vi-VN') + ' đ';
}

const DAY_TYPES: { value: OvertimeDayType; label: string; rate: string }[] = [
  { value: 'ngay_thuong', label: 'Ngày thường', rate: '150%' },
  { value: 'ngay_nghi_hang_tuan', label: 'Ngày nghỉ hàng tuần', rate: '200%' },
  { value: 'ngay_le_tet', label: 'Ngày nghỉ lễ, Tết', rate: '300%' },
];

export default function TinhLuongOtPage() {
  const [hourlyWageInput, setHourlyWageInput] = useState('50000');
  const [hours, setHours] = useState('2');
  const [dayType, setDayType] = useState<OvertimeDayType>('ngay_thuong');
  const [isNightShift, setIsNightShift] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const hourlyWage = Number(hourlyWageInput.replace(/[^\d]/g, '')) || 0;
  const hoursNum = Number(hours) || 0;
  const result = useMemo(() => calculateOvertimePay(hourlyWage, hoursNum, dayType, isNightShift), [hourlyWage, hoursNum, dayType, isNightShift]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <nav className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        <Link href="/cong-cu" className="hover:text-accent-600">Công cụ</Link>
        <span className="mx-1.5">›</span>
        <span>Tính tiền làm thêm giờ</span>
      </nav>

      <div className="flex items-center gap-3 mb-2">
        <div className="p-2.5 rounded-xl bg-accent-600/10 text-accent-600">
          <Clock className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Công cụ tính tiền làm thêm giờ (OT)</h1>
      </div>
      <p className="text-gray-600 dark:text-gray-300 mb-8">
        Tăng ca 150%, 200%, 300%, cộng thêm 30% + 20% khi làm thêm giờ vào ban đêm, theo Điều 98
        Bộ luật Lao động 2019 và Điều 57 Nghị định 145/2020/NĐ-CP.
      </p>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Lương giờ thực trả</label>
            <input
              type="text" inputMode="numeric"
              value={hourlyWage.toLocaleString('vi-VN')}
              onChange={(e) => setHourlyWageInput(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Số giờ làm thêm</label>
            <input
              type="number" value={hours} onChange={(e) => setHours(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Loại ngày làm thêm</label>
        <div className="flex flex-wrap gap-2 mb-4">
          {DAY_TYPES.map((d) => (
            <button
              key={d.value} type="button" onClick={() => setDayType(d.value)}
              className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${dayType === d.value ? 'bg-accent-600 text-white border-accent-600' : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'}`}
            >
              {d.label} ({d.rate})
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 mb-5">
          <input type="checkbox" id="night" checked={isNightShift} onChange={(e) => setIsNightShift(e.target.checked)} className="w-4 h-4" />
          <label htmlFor="night" className="text-sm text-gray-700 dark:text-gray-300">Làm thêm giờ vào ban đêm (22h - 6h)</label>
        </div>

        <button
          type="button" onClick={() => setSubmitted(true)}
          className="px-5 py-2.5 bg-accent-600 hover:bg-accent-700 text-white font-medium rounded-lg transition-colors"
        >
          Tính tiền OT
        </button>
      </div>

      {submitted && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6 text-center">
          <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">Tiền làm thêm giờ</div>
          <div className="text-3xl font-bold text-accent-600 mb-2">{formatVND(result.pay)}</div>
          <p className="text-sm text-gray-500">Hệ số áp dụng: {(result.rate * 100).toFixed(0)}%</p>
        </div>
      )}
    </div>
  );
}
