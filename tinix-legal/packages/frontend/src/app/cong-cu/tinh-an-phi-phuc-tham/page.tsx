'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Landmark as LandmarkIcon } from 'lucide-react';
import { calculateAppellateCourtFee, type AppellateCourtFeeCategory } from '@tinix-legal/shared';

const CATEGORY_LABELS: Record<AppellateCourtFeeCategory, string> = {
  dan_su_hnvgd_lao_dong: 'Dân sự, hôn nhân và gia đình, lao động',
  kinh_doanh_thuong_mai: 'Kinh doanh, thương mại',
};

function formatVnd(n: number): string {
  return n.toLocaleString('vi-VN') + ' đ';
}

export default function TinhAnPhiPhucThamPage() {
  const [category, setCategory] = useState<AppellateCourtFeeCategory>('dan_su_hnvgd_lao_dong');
  const [submitted, setSubmitted] = useState(false);

  const result = useMemo(() => calculateAppellateCourtFee(category), [category]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <nav className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        <Link href="/cong-cu" className="hover:text-accent-600">Công cụ</Link>
        <span className="mx-1.5">›</span>
        <span>Tính án phí phúc thẩm</span>
      </nav>

      <div className="flex items-center gap-3 mb-2">
        <div className="p-2.5 rounded-xl bg-accent-700/10 text-accent-700">
          <LandmarkIcon className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Công cụ tính án phí dân sự phúc thẩm
        </h1>
      </div>
      <p className="text-gray-600 dark:text-gray-300 mb-8">
        Mức án phí phúc thẩm là mức cố định, không tính theo giá ngạch tranh chấp (khác với án
        phí sơ thẩm), theo Nghị quyết 326/2016/UBTVQH14, mục B Danh mục án phí, lệ phí Tòa án.
      </p>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Loại tranh chấp</label>
        <div className="flex flex-wrap gap-2 mb-5">
          {(Object.keys(CATEGORY_LABELS) as AppellateCourtFeeCategory[]).map((c) => (
            <button
              key={c} type="button" onClick={() => setCategory(c)}
              className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${category === c ? 'bg-accent-700 text-white border-accent-700' : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'}`}
            >
              {CATEGORY_LABELS[c]}
            </button>
          ))}
        </div>

        <button type="button" onClick={() => setSubmitted(true)} className="px-5 py-2.5 bg-accent-700 hover:bg-accent-700 text-white font-medium rounded-lg transition-colors">
          Tính án phí phúc thẩm
        </button>
      </div>

      {submitted && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
          <dl className="flex justify-between text-sm">
            <dt className="text-gray-700 dark:text-gray-300 font-semibold">Án phí phúc thẩm phải nộp</dt>
            <dd className="font-bold text-accent-700">{formatVnd(result.fee)}</dd>
          </dl>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Ở cấp phúc thẩm chỉ có 2 nhóm mức thu: 300.000 đồng cho tranh chấp dân sự, hôn nhân và
          gia đình, lao động; 2.000.000 đồng cho tranh chấp kinh doanh, thương mại — vì tòa phúc
          thẩm chỉ xem xét lại vụ án theo kháng cáo, không xác định lại giá ngạch tranh chấp.
        </p>
      </div>
    </div>
  );
}
