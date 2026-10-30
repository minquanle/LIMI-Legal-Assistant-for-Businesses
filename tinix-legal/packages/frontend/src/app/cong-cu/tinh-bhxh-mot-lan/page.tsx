'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Wallet2 } from 'lucide-react';
import { calculateLumpSumSocialInsurance } from '@tinix-legal/shared';

function formatVnd(n: number): string {
  return Math.round(n).toLocaleString('vi-VN') + ' đ';
}

export default function TinhBhxhMotLanPage() {
  const [yearsBefore2014, setYearsBefore2014] = useState('4');
  const [yearsFrom2014, setYearsFrom2014] = useState('6');
  const [extraMonths, setExtraMonths] = useState('0');
  const [averageMonthlySalary, setAverageMonthlySalary] = useState('10000000');
  const [submitted, setSubmitted] = useState(false);

  const result = useMemo(
    () =>
      calculateLumpSumSocialInsurance({
        yearsContributedBefore2014: Number(yearsBefore2014) || 0,
        yearsContributedFrom2014: Number(yearsFrom2014) || 0,
        extraMonthsUnderOneYear: Number(extraMonths) || 0,
        averageMonthlySalary: Number(averageMonthlySalary) || 0,
      }),
    [yearsBefore2014, yearsFrom2014, extraMonths, averageMonthlySalary]
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <nav className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        <Link href="/cong-cu" className="hover:text-accent-600">Công cụ</Link>
        <span className="mx-1.5">›</span>
        <span>Tính bảo hiểm xã hội một lần</span>
      </nav>

      <div className="flex items-center gap-3 mb-2">
        <div className="p-2.5 rounded-xl bg-accent-600/10 text-accent-700">
          <Wallet2 className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Công cụ tính bảo hiểm xã hội một lần
        </h1>
      </div>
      <p className="text-gray-600 dark:text-gray-300 mb-8">
        Theo Điều 70 Luật Bảo hiểm xã hội 2024 (số 41/2024/QH15) — mỗi năm đóng trước 2014 = 1,5
        tháng, từ 2014 trở đi = 2 tháng bình quân tiền lương.
      </p>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Số năm đóng BHXH trước năm 2014</label>
        <input
          type="number" value={yearsBefore2014} onChange={(e) => setYearsBefore2014(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white mb-4"
        />

        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Số năm đóng BHXH từ năm 2014 trở đi</label>
        <input
          type="number" value={yearsFrom2014} onChange={(e) => setYearsFrom2014(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white mb-4"
        />

        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Số tháng lẻ đã đóng nhưng chưa đủ 1 năm</label>
        <input
          type="number" value={extraMonths} onChange={(e) => setExtraMonths(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white mb-4"
        />

        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Mức bình quân tiền lương tháng đóng BHXH (đồng)</label>
        <input
          type="number" value={averageMonthlySalary} onChange={(e) => setAverageMonthlySalary(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white mb-5"
        />

        <button type="button" onClick={() => setSubmitted(true)} className="px-5 py-2.5 bg-accent-700 hover:bg-accent-700 text-white font-medium rounded-lg transition-colors">
          Tính BHXH một lần
        </button>
      </div>

      {submitted && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-600 dark:text-gray-400">Số tháng tính từ giai đoạn trước 2014</dt>
              <dd className="font-medium text-gray-900 dark:text-white">{result.monthsFromBefore2014} tháng</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600 dark:text-gray-400">Số tháng tính từ giai đoạn 2014 trở đi</dt>
              <dd className="font-medium text-gray-900 dark:text-white">{result.monthsFrom2014} tháng</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600 dark:text-gray-400">Số tháng từ thời gian lẻ chưa đủ 1 năm</dt>
              <dd className="font-medium text-gray-900 dark:text-white">{result.monthsFromExtraPeriod} tháng</dd>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
              <dt className="text-gray-700 dark:text-gray-300 font-semibold">Số tiền BHXH một lần được nhận</dt>
              <dd className="font-bold text-accent-700">{formatVnd(result.lumpSumAmount)}</dd>
            </div>
          </dl>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Từ 01/7/2025, điều kiện rút BHXH một lần bị thu hẹp — chỉ áp dụng khi: đủ tuổi hưu
          nhưng chưa đủ 15 năm đóng; ra nước ngoài định cư; mắc bệnh hiểm nghèo hoặc suy giảm
          ≥81% khả năng lao động; hoặc trường hợp chuyển tiếp cho người tham gia BHXH lần đầu
          trước 01/7/2025. Công cụ chưa áp dụng hệ số trượt giá theo từng năm do Bảo hiểm xã hội
          Việt Nam ban hành — số tiền lương nhập vào cần tự điều chỉnh nếu muốn tính chính xác.
        </p>
      </div>
    </div>
  );
}
