'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Gift } from 'lucide-react';
import { calculateRealEstateGiftTax } from '@tinix-legal/shared';

function formatVnd(n: number): string {
  return Math.round(n).toLocaleString('vi-VN') + ' đ';
}

export default function TinhThueTangChoNhaDatPage() {
  const [giftValue, setGiftValue] = useState('500000000');
  const [isExemptRelation, setIsExemptRelation] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const result = useMemo(() => calculateRealEstateGiftTax(Number(giftValue) || 0, isExemptRelation), [giftValue, isExemptRelation]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <nav className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        <Link href="/cong-cu" className="hover:text-accent-600">Công cụ</Link>
        <span className="mx-1.5">›</span>
        <span>Tính thuế nhận tặng cho nhà đất</span>
      </nav>

      <div className="flex items-center gap-3 mb-2">
        <div className="p-2.5 rounded-xl bg-accent-500/10 text-accent-600">
          <Gift className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Công cụ tính thuế TNCN nhận tặng cho nhà đất
        </h1>
      </div>
      <p className="text-gray-600 dark:text-gray-300 mb-8">
        Mức 10% trên phần giá trị vượt 10 triệu đồng mỗi lần nhận — khác với thuế chuyển nhượng
        bất động sản (2% trên giá bán).
      </p>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Giá trị bất động sản (theo bảng giá đất/nhà của UBND cấp tỉnh, đồng)
        </label>
        <input
          type="number" value={giftValue} onChange={(e) => setGiftValue(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white mb-4"
        />

        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 mb-5">
          <input
            type="checkbox" checked={isExemptRelation}
            onChange={(e) => setIsExemptRelation(e.target.checked)}
            className="rounded border-gray-300 dark:border-gray-600"
          />
          Người tặng và người nhận có quan hệ vợ chồng, cha mẹ-con, ông bà-cháu, hoặc anh chị em
          ruột (thuộc diện miễn thuế)
        </label>

        <button type="button" onClick={() => setSubmitted(true)} className="px-5 py-2.5 bg-accent-600 hover:bg-accent-700 text-white font-medium rounded-lg transition-colors">
          Tính thuế
        </button>
      </div>

      {submitted && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
          {result.exempt ? (
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Được miễn thuế TNCN do có quan hệ hôn nhân, huyết thống, nuôi dưỡng trực tiếp
              (Điều 4 Luật Thuế TNCN).
            </p>
          ) : (
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-600 dark:text-gray-400">Phần giá trị chịu thuế (đã trừ 10 triệu đồng)</dt>
                <dd className="font-medium text-gray-900 dark:text-white">{formatVnd(result.taxableAmount)}</dd>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                <dt className="text-gray-700 dark:text-gray-300 font-semibold">Thuế TNCN phải nộp (10%)</dt>
                <dd className="font-bold text-accent-600">{formatVnd(result.tax)}</dd>
              </div>
            </dl>
          )}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Diện miễn thuế chỉ áp dụng giữa: vợ chồng; cha mẹ đẻ/nuôi với con đẻ/nuôi; cha mẹ chồng/
          vợ với con dâu/rể; ông bà nội/ngoại với cháu nội/ngoại; anh chị em ruột. Không áp dụng
          cho cô/dì/chú/bác với cháu hoặc anh chị em họ.
        </p>
      </div>
    </div>
  );
}
