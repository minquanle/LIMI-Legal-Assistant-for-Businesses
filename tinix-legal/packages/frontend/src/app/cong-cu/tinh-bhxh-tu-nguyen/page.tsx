'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { calculateVoluntarySocialInsurance, type VoluntaryInsuranceSupportType } from '@tinix-legal/shared';

const SUPPORT_TYPE_LABELS: Record<VoluntaryInsuranceSupportType, string> = {
  ho_ngheo: 'Hộ nghèo (hỗ trợ 50%)',
  ho_can_ngheo: 'Hộ cận nghèo (hỗ trợ 40%)',
  dan_toc_thieu_so: 'Dân tộc thiểu số (hỗ trợ 30%)',
  doi_tuong_khac: 'Đối tượng khác (hỗ trợ 20%)',
};

function formatVnd(n: number): string {
  return Math.round(n).toLocaleString('vi-VN') + ' đ';
}

export default function TinhBhxhTuNguyenPage() {
  const [selectedMonthlyIncome, setSelectedMonthlyIncome] = useState('5000000');
  const [supportType, setSupportType] = useState<VoluntaryInsuranceSupportType>('doi_tuong_khac');
  const [submitted, setSubmitted] = useState(false);

  const result = useMemo(
    () => calculateVoluntarySocialInsurance(Number(selectedMonthlyIncome) || 0, supportType),
    [selectedMonthlyIncome, supportType]
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <nav className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        <Link href="/cong-cu" className="hover:text-accent-600">Công cụ</Link>
        <span className="mx-1.5">›</span>
        <span>Tính bảo hiểm xã hội tự nguyện</span>
      </nav>

      <div className="flex items-center gap-3 mb-2">
        <div className="p-2.5 rounded-xl bg-accent-700/10 text-accent-700">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Công cụ tính bảo hiểm xã hội tự nguyện
        </h1>
      </div>
      <p className="text-gray-600 dark:text-gray-300 mb-8">
        Mức đóng 22% thu nhập tháng tự chọn, đã trừ mức hỗ trợ của Nhà nước, theo Luật Bảo hiểm
        xã hội 2024 (số 41/2024/QH15) và Nghị định 159/2025/NĐ-CP.
      </p>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Thu nhập tháng tự chọn để đóng BHXH (đồng) — từ 1.500.000đ đến 50.600.000đ
        </label>
        <input
          type="number" value={selectedMonthlyIncome} onChange={(e) => setSelectedMonthlyIncome(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white mb-4"
        />

        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Đối tượng hỗ trợ</label>
        <div className="flex flex-col gap-2 mb-5">
          {(Object.keys(SUPPORT_TYPE_LABELS) as VoluntaryInsuranceSupportType[]).map((t) => (
            <button
              key={t} type="button" onClick={() => setSupportType(t)}
              className={`px-3 py-2 text-sm text-left rounded-lg border transition-colors ${supportType === t ? 'bg-accent-700 text-white border-accent-700' : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'}`}
            >
              {SUPPORT_TYPE_LABELS[t]}
            </button>
          ))}
        </div>

        <button type="button" onClick={() => setSubmitted(true)} className="px-5 py-2.5 bg-accent-700 hover:bg-accent-700 text-white font-medium rounded-lg transition-colors">
          Tính mức đóng
        </button>
      </div>

      {submitted && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-600 dark:text-gray-400">Thu nhập tháng dùng để tính (sau khi áp sàn/trần)</dt>
              <dd className="font-medium text-gray-900 dark:text-white">{formatVnd(result.selectedMonthlyIncome)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600 dark:text-gray-400">Mức đóng (22%)</dt>
              <dd className="font-medium text-gray-900 dark:text-white">{formatVnd(result.monthlyContribution)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600 dark:text-gray-400">Nhà nước hỗ trợ ({result.stateSupportRatePercent}% mức đóng theo chuẩn hộ nghèo)</dt>
              <dd className="font-medium text-accent-600">- {formatVnd(result.stateSupportAmount)}</dd>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
              <dt className="text-gray-700 dark:text-gray-300 font-semibold">Số tiền thực đóng hằng tháng</dt>
              <dd className="font-bold text-accent-700">{formatVnd(result.netMonthlyPayable)}</dd>
            </div>
          </dl>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Mức hỗ trợ của Nhà nước tính trên mức đóng theo chuẩn hộ nghèo khu vực nông thôn
          (1.500.000đ/tháng), không phải trên thu nhập tự chọn thực tế, và tối đa được hỗ trợ
          không quá 120 tháng (10 năm). Nếu thuộc nhiều diện hỗ trợ cùng lúc, áp dụng mức hỗ trợ
          cao nhất. Một số địa phương có thể hỗ trợ thêm ngoài mức của Nhà nước.
        </p>
      </div>
    </div>
  );
}
