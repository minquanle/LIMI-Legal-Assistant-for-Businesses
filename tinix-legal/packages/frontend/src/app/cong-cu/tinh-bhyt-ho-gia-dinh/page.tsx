'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { HeartHandshake } from 'lucide-react';
import { calculateHouseholdHealthInsurance } from '@tinix-legal/shared';

function formatVnd(n: number): string {
  return Math.round(n).toLocaleString('vi-VN') + ' đ';
}

export default function TinhBhytHoGiaDinhPage() {
  const [numberOfMembers, setNumberOfMembers] = useState('4');
  const [submitted, setSubmitted] = useState(false);

  const members = Math.max(0, Math.floor(Number(numberOfMembers) || 0));
  const result = useMemo(() => calculateHouseholdHealthInsurance(members), [members]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <nav className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        <Link href="/cong-cu" className="hover:text-accent-600">Công cụ</Link>
        <span className="mx-1.5">›</span>
        <span>Tính bảo hiểm y tế hộ gia đình</span>
      </nav>

      <div className="flex items-center gap-3 mb-2">
        <div className="p-2.5 rounded-xl bg-red-600/10 text-red-600">
          <HeartHandshake className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Công cụ tính bảo hiểm y tế hộ gia đình
        </h1>
      </div>
      <p className="text-gray-600 dark:text-gray-300 mb-8">
        Mức đóng 4,5% mức tham chiếu, giảm dần theo số thành viên cùng tham gia trong hộ gia
        đình, theo Nghị định 146/2018/NĐ-CP.
      </p>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Số thành viên cùng tham gia BHYT hộ gia đình</label>
        <input
          type="number" min="1" value={numberOfMembers} onChange={(e) => setNumberOfMembers(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white mb-5"
        />

        <button type="button" onClick={() => setSubmitted(true)} className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors">
          Tính mức đóng
        </button>
      </div>

      {submitted && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
          <table className="w-full text-sm mb-4">
            <thead>
              <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
                <th className="py-2 font-medium">Thành viên</th>
                <th className="py-2 font-medium">Tỷ lệ</th>
                <th className="py-2 font-medium text-right">Mức đóng/năm</th>
              </tr>
            </thead>
            <tbody>
              {result.members.map((m) => (
                <tr key={m.memberIndex} className="border-b border-gray-50 dark:border-gray-800">
                  <td className="py-2 text-gray-700 dark:text-gray-300">Người thứ {m.memberIndex}</td>
                  <td className="py-2 text-gray-700 dark:text-gray-300">{m.discountPercent}%</td>
                  <td className="py-2 text-right font-medium text-gray-900 dark:text-white">{formatVnd(m.annualPremium)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex justify-between pt-2 border-t border-gray-100 dark:border-gray-700 text-sm">
            <dt className="text-gray-700 dark:text-gray-300 font-semibold">Tổng mức đóng cả hộ/năm</dt>
            <dd className="font-bold text-red-600">{formatVnd(result.totalAnnualPremium)}</dd>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Người thứ nhất đóng 100% mức chuẩn (4,5% × mức tham chiếu × 12 tháng); người thứ hai
          đóng 70%; người thứ ba đóng 60%; người thứ tư đóng 50%; từ người thứ năm trở đi đóng
          40% mức đóng của người thứ nhất. Mức tham chiếu hiện hành: {formatVnd(2_530_000)}/tháng.
        </p>
      </div>
    </div>
  );
}
