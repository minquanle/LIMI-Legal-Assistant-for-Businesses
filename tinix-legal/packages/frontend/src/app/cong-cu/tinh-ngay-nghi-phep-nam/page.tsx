'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { CalendarDays } from 'lucide-react';
import { calculateAnnualLeaveEntitlement, type WorkingCondition } from '@tinix-legal/shared';

const CONDITION_LABELS: Record<WorkingCondition, string> = {
  binh_thuong: 'Điều kiện lao động bình thường (12 ngày)',
  nang_nhoc_doc_hai_nguy_hiem: 'Nghề, công việc nặng nhọc, độc hại, nguy hiểm (14 ngày)',
  dac_biet_nang_nhoc_doc_hai_nguy_hiem: 'Nghề, công việc đặc biệt nặng nhọc, độc hại, nguy hiểm (16 ngày)',
};

export default function TinhNgayNghiPhepNamPage() {
  const [workingCondition, setWorkingCondition] = useState<WorkingCondition>('binh_thuong');
  const [yearsOfService, setYearsOfService] = useState('3');
  const [monthsWorkedThisYear, setMonthsWorkedThisYear] = useState('12');
  const [submitted, setSubmitted] = useState(false);

  const result = useMemo(
    () =>
      calculateAnnualLeaveEntitlement({
        workingCondition,
        yearsOfService: Number(yearsOfService) || 0,
        monthsWorkedThisYear: Number(monthsWorkedThisYear) || 0,
      }),
    [workingCondition, yearsOfService, monthsWorkedThisYear]
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <nav className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        <Link href="/cong-cu" className="hover:text-accent-600">Công cụ</Link>
        <span className="mx-1.5">›</span>
        <span>Tính ngày nghỉ phép năm</span>
      </nav>

      <div className="flex items-center gap-3 mb-2">
        <div className="p-2.5 rounded-xl bg-accent-600/10 text-accent-600">
          <CalendarDays className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Công cụ tính ngày nghỉ phép năm
        </h1>
      </div>
      <p className="text-gray-600 dark:text-gray-300 mb-8">
        Theo Điều 113, 114 Bộ luật Lao động 2019 — số ngày nghỉ hằng năm hưởng nguyên lương theo
        điều kiện lao động, cộng thêm thâm niên.
      </p>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Điều kiện lao động</label>
        <div className="flex flex-col gap-2 mb-4">
          {(Object.keys(CONDITION_LABELS) as WorkingCondition[]).map((c) => (
            <button
              key={c} type="button" onClick={() => setWorkingCondition(c)}
              className={`px-3 py-2 text-sm text-left rounded-lg border transition-colors ${workingCondition === c ? 'bg-accent-600 text-white border-accent-600' : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'}`}
            >
              {CONDITION_LABELS[c]}
            </button>
          ))}
        </div>

        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Số năm đã làm việc liên tục cho người sử dụng lao động hiện tại</label>
        <input
          type="number" value={yearsOfService} onChange={(e) => setYearsOfService(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white mb-4"
        />

        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Số tháng đã làm việc trong năm nay (tối đa 12)</label>
        <input
          type="number" max={12} value={monthsWorkedThisYear} onChange={(e) => setMonthsWorkedThisYear(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white mb-5"
        />

        <button type="button" onClick={() => setSubmitted(true)} className="px-5 py-2.5 bg-accent-600 hover:bg-accent-700 text-white font-medium rounded-lg transition-colors">
          Tính ngày nghỉ phép
        </button>
      </div>

      {submitted && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-600 dark:text-gray-400">Số ngày cơ bản</dt>
              <dd className="font-medium text-gray-900 dark:text-white">{result.baseDays} ngày</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600 dark:text-gray-400">Ngày thâm niên (mỗi 5 năm +1 ngày)</dt>
              <dd className="font-medium text-gray-900 dark:text-white">+{result.seniorityBonusDays} ngày</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600 dark:text-gray-400">Tổng số ngày nếu làm đủ 12 tháng</dt>
              <dd className="font-medium text-gray-900 dark:text-white">{result.fullYearEntitlementDays} ngày</dd>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
              <dt className="text-gray-700 dark:text-gray-300 font-semibold">Số ngày nghỉ phép được hưởng năm nay</dt>
              <dd className="font-bold text-accent-600">{result.proratedEntitlementDays.toFixed(2)} ngày</dd>
            </div>
          </dl>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Người lao động làm việc chưa đủ 12 tháng trong năm được tính ngày nghỉ theo tỷ lệ
          tương ứng số tháng đã làm việc. Được tạm ứng lương cho ngày phép; khi thôi việc, mất
          việc mà chưa nghỉ hoặc chưa nghỉ hết số ngày phép năm thì được thanh toán tiền lương
          cho những ngày chưa nghỉ (Điều 113 khoản 3).
        </p>
      </div>
    </div>
  );
}
