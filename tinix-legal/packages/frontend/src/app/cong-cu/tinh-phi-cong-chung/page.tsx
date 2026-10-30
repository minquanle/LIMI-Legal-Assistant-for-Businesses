'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Stamp } from 'lucide-react';
import { calculateNotaryFee } from '@tinix-legal/shared';

function formatVND(n: number): string {
  return Math.round(n).toLocaleString('vi-VN') + ' đ';
}

export default function TinhPhiCongChungPage() {
  const [valueInput, setValueInput] = useState('500000000');
  const [submitted, setSubmitted] = useState(false);

  const assetValue = Number(valueInput.replace(/[^\d]/g, '')) || 0;
  const result = useMemo(() => calculateNotaryFee(assetValue), [assetValue]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <nav className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        <Link href="/cong-cu" className="hover:text-accent-600">Công cụ</Link>
        <span className="mx-1.5">›</span>
        <span>Tính phí công chứng</span>
      </nav>

      <div className="flex items-center gap-3 mb-2">
        <div className="p-2.5 rounded-xl bg-accent-600/10 text-accent-600">
          <Stamp className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Công cụ tính phí công chứng</h1>
      </div>
      <p className="text-gray-600 dark:text-gray-300 mb-8">
        Phí công chứng hợp đồng mua bán, chuyển nhượng, tặng cho, thế chấp, vay tiền, góp vốn theo
        giá trị tài sản hoặc giá trị hợp đồng, giao dịch — Điều 4 Thông tư 257/2016/TT-BTC.
      </p>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Giá trị tài sản / hợp đồng, giao dịch
        </label>
        <div className="flex items-center gap-2 mb-5">
          <input
            type="text" inputMode="numeric"
            value={assetValue.toLocaleString('vi-VN')}
            onChange={(e) => setValueInput(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-500"
          />
          <span className="text-sm text-gray-500 shrink-0">VNĐ</span>
        </div>
        <button
          type="button" onClick={() => setSubmitted(true)}
          className="px-5 py-2.5 bg-accent-600 hover:bg-accent-700 text-white font-medium rounded-lg transition-colors"
        >
          Tính phí
        </button>
      </div>

      {submitted && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6 text-center">
          <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">Phí công chứng</div>
          <div className="text-3xl font-bold text-accent-600 mb-2">{formatVND(result.fee)}</div>
          <p className="text-sm text-gray-500">Công thức: {result.formula}</p>
          {result.isCapped && <p className="text-xs text-accent-600 mt-1">Đã áp mức trần tối đa 70.000.000 đồng/trường hợp</p>}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Lưu ý</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Bảng phí này áp dụng cho hợp đồng mua bán, tặng cho, chia tách, góp vốn, vay tiền, thế
          chấp, kinh tế/thương mại/đầu tư. Hợp đồng thuê tài sản và mua bán tài sản đấu giá áp
          dụng biểu phí riêng theo Thông tư 257/2016/TT-BTC. Văn phòng công chứng thu phí đã bao
          gồm VAT.
        </p>
      </div>
    </div>
  );
}
