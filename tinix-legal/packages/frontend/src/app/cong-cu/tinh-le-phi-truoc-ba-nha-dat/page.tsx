'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Home } from 'lucide-react';
import { calculateRealEstateRegistrationFee } from '@tinix-legal/shared';

function formatVnd(n: number): string {
  return Math.round(n).toLocaleString('vi-VN') + ' đ';
}

export default function TinhLePhiTruocBaNhaDatPage() {
  const [ubndPriceValue, setUbndPriceValue] = useState('2000000000');
  const [contractPrice, setContractPrice] = useState('2500000000');
  const [submitted, setSubmitted] = useState(false);

  const result = useMemo(
    () => calculateRealEstateRegistrationFee(Number(ubndPriceValue) || 0, Number(contractPrice) || 0),
    [ubndPriceValue, contractPrice]
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <nav className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        <Link href="/cong-cu" className="hover:text-accent-600">Công cụ</Link>
        <span className="mx-1.5">›</span>
        <span>Tính lệ phí trước bạ nhà, đất</span>
      </nav>

      <div className="flex items-center gap-3 mb-2">
        <div className="p-2.5 rounded-xl bg-accent-600/10 text-accent-700">
          <Home className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Công cụ tính lệ phí trước bạ nhà, đất
        </h1>
      </div>
      <p className="text-gray-600 dark:text-gray-300 mb-8">
        Mức 0,5% theo Nghị định 10/2022/NĐ-CP, tính trên giá trị cao hơn giữa giá đất tại bảng
        giá đất của UBND cấp tỉnh và giá tại hợp đồng chuyển nhượng.
      </p>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Giá trị theo bảng giá đất/nhà của UBND cấp tỉnh (đồng)
        </label>
        <input
          type="number" value={ubndPriceValue} onChange={(e) => setUbndPriceValue(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white mb-4"
        />

        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Giá tại hợp đồng chuyển nhượng (đồng)
        </label>
        <input
          type="number" value={contractPrice} onChange={(e) => setContractPrice(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white mb-5"
        />

        <button type="button" onClick={() => setSubmitted(true)} className="px-5 py-2.5 bg-accent-700 hover:bg-accent-700 text-white font-medium rounded-lg transition-colors">
          Tính lệ phí trước bạ
        </button>
      </div>

      {submitted && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-600 dark:text-gray-400">Giá tính lệ phí trước bạ (giá trị cao hơn)</dt>
              <dd className="font-medium text-gray-900 dark:text-white">{formatVnd(result.taxBase)}</dd>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
              <dt className="text-gray-700 dark:text-gray-300 font-semibold">Lệ phí trước bạ phải nộp (0,5%)</dt>
              <dd className="font-bold text-accent-700">{formatVnd(result.fee)}</dd>
            </div>
          </dl>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Lệ phí trước bạ nhà, đất không có mức trần (khác với ô tô, xe máy đăng ký lần đầu). Nếu
          giá tại hợp đồng chuyển nhượng cao hơn giá đất tại bảng giá đất của UBND cấp tỉnh thì
          lấy giá hợp đồng làm giá tính lệ phí trước bạ (theo Nghị định 175/2025/NĐ-CP sửa đổi
          Nghị định 10/2022/NĐ-CP).
        </p>
      </div>
    </div>
  );
}
