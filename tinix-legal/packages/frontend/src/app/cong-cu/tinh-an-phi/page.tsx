'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Gavel } from 'lucide-react';
import { calculateCourtFee, NO_VALUE_CIVIL_FEE, NO_VALUE_COMMERCIAL_FEE, type CivilDisputeCategory } from '@tinix-legal/shared';

function formatVND(n: number): string {
  return Math.round(n).toLocaleString('vi-VN') + ' đ';
}

const CATEGORIES: { value: CivilDisputeCategory; label: string }[] = [
  { value: 'dan_su_hnvgd_lao_dong', label: 'Dân sự, hôn nhân & gia đình' },
  { value: 'kinh_doanh_thuong_mai', label: 'Kinh doanh, thương mại' },
  { value: 'lao_dong_co_gia_ngach', label: 'Lao động (có giá ngạch)' },
];

export default function TinhAnPhiPage() {
  const [hasValue, setHasValue] = useState(true);
  const [category, setCategory] = useState<CivilDisputeCategory>('dan_su_hnvgd_lao_dong');
  const [valueInput, setValueInput] = useState('100000000');
  const [submitted, setSubmitted] = useState(false);

  const disputeValue = Number(valueInput.replace(/[^\d]/g, '')) || 0;
  const result = useMemo(() => calculateCourtFee(disputeValue, category), [disputeValue, category]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <nav className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        <Link href="/cong-cu" className="hover:text-accent-600">Công cụ</Link>
        <span className="mx-1.5">›</span>
        <span>Tính án phí</span>
      </nav>

      <div className="flex items-center gap-3 mb-2">
        <div className="p-2.5 rounded-xl bg-slate-700/10 text-slate-700 dark:text-slate-300">
          <Gavel className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Công cụ tính án phí dân sự sơ thẩm</h1>
      </div>
      <p className="text-gray-600 dark:text-gray-300 mb-8">
        Tính án phí dân sự sơ thẩm theo Danh mục án phí, lệ phí Tòa án ban hành kèm theo Nghị
        quyết 326/2016/UBTVQH14, trích xuất trực tiếp từ toàn văn nghị định đã có trong hệ thống.
      </p>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Loại tranh chấp</label>
        <div className="flex flex-wrap gap-2 mb-5">
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setCategory(c.value)}
              className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${category === c.value ? 'bg-slate-700 text-white border-slate-700' : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'}`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 mb-4">
          <input type="checkbox" id="hasValue" checked={hasValue} onChange={(e) => setHasValue(e.target.checked)} className="w-4 h-4" />
          <label htmlFor="hasValue" className="text-sm text-gray-700 dark:text-gray-300">
            Tranh chấp có giá ngạch (tính được bằng tiền)
          </label>
        </div>

        {hasValue && (
          <>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Giá trị tài sản tranh chấp</label>
            <div className="flex items-center gap-2 mb-4">
              <input
                type="text"
                inputMode="numeric"
                value={disputeValue.toLocaleString('vi-VN')}
                onChange={(e) => setValueInput(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-500"
              />
              <span className="text-sm text-gray-500 shrink-0">VNĐ</span>
            </div>
          </>
        )}

        <button
          type="button"
          onClick={() => setSubmitted(true)}
          className="px-5 py-2.5 bg-slate-700 hover:bg-slate-800 text-white font-medium rounded-lg transition-colors"
        >
          Tính án phí
        </button>
      </div>

      {submitted && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6 text-center">
          <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">Án phí dự kiến</div>
          <div className="text-3xl font-bold text-slate-700 dark:text-slate-300 mb-2">
            {hasValue
              ? formatVND(result.fee)
              : formatVND(category === 'kinh_doanh_thuong_mai' ? NO_VALUE_COMMERCIAL_FEE : NO_VALUE_CIVIL_FEE)}
          </div>
          {hasValue && <p className="text-sm text-gray-500">Công thức: {result.formula}</p>}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Lưu ý</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Tạm ứng án phí sơ thẩm (nộp khi khởi kiện) thường bằng 50% mức án phí dự tính, tối
          thiểu không thấp hơn án phí không có giá ngạch. Kết quả mang tính tham khảo — mức thu
          chính thức do Tòa án ấn định theo hồ sơ cụ thể.
        </p>
      </div>
    </div>
  );
}
