'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { UserRoundX } from 'lucide-react';
import { calculateNonResidentPit, type NonResidentIncomeType } from '@tinix-legal/shared';

const INCOME_TYPE_LABELS: Record<NonResidentIncomeType, string> = {
  tien_luong_tien_cong: 'Tiền lương, tiền công',
  chuyen_nhuong_bat_dong_san: 'Chuyển nhượng bất động sản',
  chuyen_nhuong_von: 'Chuyển nhượng vốn',
  trung_thuong_thua_ke_qua_tang: 'Trúng thưởng, thừa kế, quà tặng',
};

const AMOUNT_LABELS: Record<NonResidentIncomeType, string> = {
  tien_luong_tien_cong: 'Thu nhập chịu thuế phát sinh tại Việt Nam (đồng)',
  chuyen_nhuong_bat_dong_san: 'Giá chuyển nhượng bất động sản (đồng)',
  chuyen_nhuong_von: 'Giá chuyển nhượng vốn (đồng)',
  trung_thuong_thua_ke_qua_tang: 'Giá trị trúng thưởng/thừa kế/quà tặng mỗi lần phát sinh (đồng)',
};

function formatVnd(n: number): string {
  return Math.round(n).toLocaleString('vi-VN') + ' đ';
}

export default function TinhThueTncnKhongCuTruPage() {
  const [incomeType, setIncomeType] = useState<NonResidentIncomeType>('tien_luong_tien_cong');
  const [amount, setAmount] = useState('50000000');
  const [submitted, setSubmitted] = useState(false);

  const result = useMemo(
    () => calculateNonResidentPit({ incomeType, amount: Number(amount) || 0 }),
    [incomeType, amount]
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <nav className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        <Link href="/cong-cu" className="hover:text-accent-600">Công cụ</Link>
        <span className="mx-1.5">›</span>
        <span>Tính thuế TNCN cá nhân không cư trú</span>
      </nav>

      <div className="flex items-center gap-3 mb-2">
        <div className="p-2.5 rounded-xl bg-accent-600/10 text-accent-600">
          <UserRoundX className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Công cụ tính thuế TNCN đối với cá nhân không cư trú
        </h1>
      </div>
      <p className="text-gray-600 dark:text-gray-300 mb-8">
        Áp dụng thuế suất cố định trên thu nhập phát sinh tại Việt Nam, không áp dụng biểu lũy
        tiến và không giảm trừ gia cảnh, theo Luật Thuế TNCN và Thông tư 111/2013/TT-BTC.
      </p>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Loại thu nhập</label>
        <div className="flex flex-wrap gap-2 mb-4">
          {(Object.keys(INCOME_TYPE_LABELS) as NonResidentIncomeType[]).map((t) => (
            <button
              key={t} type="button" onClick={() => setIncomeType(t)}
              className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${incomeType === t ? 'bg-accent-600 text-white border-accent-600' : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'}`}
            >
              {INCOME_TYPE_LABELS[t]}
            </button>
          ))}
        </div>

        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{AMOUNT_LABELS[incomeType]}</label>
        <input
          type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white mb-5"
        />

        <button type="button" onClick={() => setSubmitted(true)} className="px-5 py-2.5 bg-accent-600 hover:bg-accent-700 text-white font-medium rounded-lg transition-colors">
          Tính thuế TNCN
        </button>
      </div>

      {submitted && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-600 dark:text-gray-400">Thuế suất áp dụng</dt>
              <dd className="font-medium text-gray-900 dark:text-white">{result.ratePercent}%</dd>
            </div>
            {incomeType === 'trung_thuong_thua_ke_qua_tang' && (
              <div className="flex justify-between">
                <dt className="text-gray-600 dark:text-gray-400">Phần chịu thuế (đã trừ 10 triệu đồng miễn thuế)</dt>
                <dd className="font-medium text-gray-900 dark:text-white">{formatVnd(result.taxableAmount)}</dd>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
              <dt className="text-gray-700 dark:text-gray-300 font-semibold">Thuế TNCN phải nộp</dt>
              <dd className="font-bold text-accent-600">{formatVnd(result.tax)}</dd>
            </div>
          </dl>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Cá nhân không cư trú: có mặt tại Việt Nam dưới 183 ngày trong năm dương lịch hoặc 12
          tháng liên tục kể từ ngày đến, và không có nơi ở thường xuyên/hợp đồng thuê nhà từ 183
          ngày trở lên tại Việt Nam. Công cụ chưa bao gồm thu nhập từ kinh doanh, tiền bản quyền,
          nhượng quyền thương mại — các loại thu nhập này có mức thuế suất chưa được xác minh đủ
          chắc chắn, vui lòng tra cứu văn bản gốc.
        </p>
      </div>
    </div>
  );
}
