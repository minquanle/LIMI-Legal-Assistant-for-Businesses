'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Building } from 'lucide-react';
import { calculateResidentRealEstateTransferPit } from '@tinix-legal/shared';

function formatVnd(n: number): string {
  return Math.round(n).toLocaleString('vi-VN') + ' đ';
}

export default function TinhThueChuyenNhuongBdsPage() {
  const [contractTransferPrice, setContractTransferPrice] = useState('3000000000');
  const [ubndPriceValue, setUbndPriceValue] = useState('2000000000');
  const [isSoleResidentialPropertyExempt, setIsSoleResidentialPropertyExempt] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const result = useMemo(
    () =>
      calculateResidentRealEstateTransferPit({
        contractTransferPrice: Number(contractTransferPrice) || 0,
        ubndPriceValue: Number(ubndPriceValue) || 0,
        isSoleResidentialPropertyExempt,
      }),
    [contractTransferPrice, ubndPriceValue, isSoleResidentialPropertyExempt]
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <nav className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        <Link href="/cong-cu" className="hover:text-accent-600">Công cụ</Link>
        <span className="mx-1.5">›</span>
        <span>Tính thuế TNCN chuyển nhượng bất động sản</span>
      </nav>

      <div className="flex items-center gap-3 mb-2">
        <div className="p-2.5 rounded-xl bg-accent-600/10 text-accent-600">
          <Building className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Công cụ tính thuế TNCN chuyển nhượng bất động sản
        </h1>
      </div>
      <p className="text-gray-600 dark:text-gray-300 mb-8">
        Áp dụng cho cá nhân cư trú, mức 2% trên giá chuyển nhượng, theo Điều 14 Luật Thuế TNCN
        2007 (sửa đổi).
      </p>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Giá tại hợp đồng chuyển nhượng (đồng)</label>
        <input
          type="number" value={contractTransferPrice} onChange={(e) => setContractTransferPrice(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white mb-4"
        />

        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Giá theo bảng giá đất/nhà của UBND cấp tỉnh (đồng)</label>
        <input
          type="number" value={ubndPriceValue} onChange={(e) => setUbndPriceValue(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white mb-4"
        />

        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 mb-5">
          <input
            type="checkbox" checked={isSoleResidentialPropertyExempt}
            onChange={(e) => setIsSoleResidentialPropertyExempt(e.target.checked)}
            className="rounded border-gray-300 dark:border-gray-600"
          />
          Đây là nhà ở/đất ở duy nhất tại Việt Nam, được chuyển nhượng toàn bộ (thuộc diện miễn thuế)
        </label>

        <button type="button" onClick={() => setSubmitted(true)} className="px-5 py-2.5 bg-accent-600 hover:bg-accent-700 text-white font-medium rounded-lg transition-colors">
          Tính thuế chuyển nhượng
        </button>
      </div>

      {submitted && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
          {result.exempt ? (
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Được miễn thuế TNCN do chuyển nhượng toàn bộ nhà ở/đất ở duy nhất (Điều 4 Luật Thuế TNCN).
            </p>
          ) : (
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-600 dark:text-gray-400">Giá tính thuế (giá trị cao hơn)</dt>
                <dd className="font-medium text-gray-900 dark:text-white">{formatVnd(result.taxBase)}</dd>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                <dt className="text-gray-700 dark:text-gray-300 font-semibold">Thuế TNCN phải nộp (2%)</dt>
                <dd className="font-bold text-accent-600">{formatVnd(result.tax)}</dd>
              </div>
            </dl>
          )}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Thuế tính trên giá trị cao hơn giữa giá tại hợp đồng chuyển nhượng và giá đất/nhà theo
          bảng giá của UBND cấp tỉnh. Từ 01/7/2026, Luật Thuế TNCN mới đánh số lại điều khoản
          nhưng vẫn giữ nguyên mức 2%.
        </p>
      </div>
    </div>
  );
}
