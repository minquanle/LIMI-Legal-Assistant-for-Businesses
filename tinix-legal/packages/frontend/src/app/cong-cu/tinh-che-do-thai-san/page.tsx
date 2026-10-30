'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Baby } from 'lucide-react';
import { calculateMaternityLeaveBenefit } from '@tinix-legal/shared';

function formatVnd(n: number): string {
  return Math.round(n).toLocaleString('vi-VN') + ' đ';
}

export default function TinhCheDoThaiSanPage() {
  const [numberOfChildren, setNumberOfChildren] = useState('1');
  const [averageMonthlySalary, setAverageMonthlySalary] = useState('10000000');
  const [submitted, setSubmitted] = useState(false);

  const result = useMemo(
    () =>
      calculateMaternityLeaveBenefit({
        numberOfChildren: Math.max(1, Number(numberOfChildren) || 1),
        averageMonthlySalary: Number(averageMonthlySalary) || 0,
      }),
    [numberOfChildren, averageMonthlySalary]
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <nav className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        <Link href="/cong-cu" className="hover:text-accent-600">Công cụ</Link>
        <span className="mx-1.5">›</span>
        <span>Tính chế độ thai sản khi sinh con</span>
      </nav>

      <div className="flex items-center gap-3 mb-2">
        <div className="p-2.5 rounded-xl bg-accent-500/10 text-accent-600">
          <Baby className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Công cụ tính chế độ thai sản khi sinh con
        </h1>
      </div>
      <p className="text-gray-600 dark:text-gray-300 mb-8">
        Theo Luật Bảo hiểm xã hội 2024 (số 41/2024/QH15), hiệu lực 01/7/2025 — thời gian nghỉ,
        mức hưởng hằng tháng và trợ cấp một lần khi sinh con.
      </p>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Số con trong lần sinh này</label>
        <input
          type="number" min="1" value={numberOfChildren} onChange={(e) => setNumberOfChildren(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white mb-4"
        />

        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Bình quân tiền lương tháng đóng BHXH của 6 tháng liền kề (đồng)
        </label>
        <input
          type="number" value={averageMonthlySalary} onChange={(e) => setAverageMonthlySalary(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white mb-5"
        />

        <button type="button" onClick={() => setSubmitted(true)} className="px-5 py-2.5 bg-accent-600 hover:bg-accent-700 text-white font-medium rounded-lg transition-colors">
          Tính chế độ thai sản
        </button>
      </div>

      {submitted && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-600 dark:text-gray-400">Thời gian nghỉ hưởng chế độ</dt>
              <dd className="font-medium text-gray-900 dark:text-white">{result.leaveMonths} tháng</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600 dark:text-gray-400">Tiền hưởng trong thời gian nghỉ (100% lương)</dt>
              <dd className="font-medium text-gray-900 dark:text-white">{formatVnd(result.totalLeaveBenefit)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600 dark:text-gray-400">Trợ cấp một lần khi sinh con (2 lần mức tham chiếu/con)</dt>
              <dd className="font-medium text-gray-900 dark:text-white">{formatVnd(result.oneTimeAllowance)}</dd>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
              <dt className="text-gray-700 dark:text-gray-300 font-semibold">Tổng tiền được hưởng</dt>
              <dd className="font-bold text-accent-600">{formatVnd(result.totalBenefit)}</dd>
            </div>
          </dl>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Nghỉ trước và sau sinh 6 tháng, trong đó nghỉ trước sinh tối đa không quá 2 tháng; từ
          con thứ hai trở đi, mỗi con được nghỉ thêm 1 tháng. Điều kiện hưởng: đã đóng BHXH bắt
          buộc từ đủ 6 tháng trở lên trong 12 tháng trước khi sinh con (hoặc từ đủ 3 tháng nếu
          phải nghỉ dưỡng thai theo chỉ định y tế và đã đóng đủ 12 tháng trở lên trước đó).
        </p>
      </div>
    </div>
  );
}
