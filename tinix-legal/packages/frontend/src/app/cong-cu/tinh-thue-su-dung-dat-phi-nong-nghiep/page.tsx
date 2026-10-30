'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Map } from 'lucide-react';
import { calculateNonAgriculturalLandUseTax, type LandUseTaxType } from '@tinix-legal/shared';

const LAND_TYPE_LABELS: Record<LandUseTaxType, string> = {
  dat_o: 'Đất ở',
  dat_san_xuat_kinh_doanh: 'Đất sản xuất, kinh doanh phi nông nghiệp',
  lan_chiem: 'Đất lấn, chiếm',
  khong_dung_muc_dich: 'Đất sử dụng không đúng mục đích/chưa sử dụng đúng quy định',
};

function formatVnd(n: number): string {
  return Math.round(n).toLocaleString('vi-VN') + ' đ';
}

export default function TinhThueSuDungDatPhiNongNghiepPage() {
  const [landType, setLandType] = useState<LandUseTaxType>('dat_o');
  const [landArea, setLandArea] = useState('150');
  const [pricePerSqm, setPricePerSqm] = useState('20000000');
  const [quotaArea, setQuotaArea] = useState('120');
  const [submitted, setSubmitted] = useState(false);

  const result = useMemo(
    () =>
      calculateNonAgriculturalLandUseTax({
        landType,
        landArea: Number(landArea) || 0,
        pricePerSqm: Number(pricePerSqm) || 0,
        quotaArea: Number(quotaArea) || 0,
      }),
    [landType, landArea, pricePerSqm, quotaArea]
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <nav className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        <Link href="/cong-cu" className="hover:text-accent-600">Công cụ</Link>
        <span className="mx-1.5">›</span>
        <span>Tính thuế sử dụng đất phi nông nghiệp</span>
      </nav>

      <div className="flex items-center gap-3 mb-2">
        <div className="p-2.5 rounded-xl bg-accent-700/10 text-accent-700">
          <Map className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Công cụ tính thuế sử dụng đất phi nông nghiệp
        </h1>
      </div>
      <p className="text-gray-600 dark:text-gray-300 mb-8">
        Theo Luật Thuế sử dụng đất phi nông nghiệp số 48/2010/QH12, tính trên diện tích × giá đất
        theo bảng giá đất của UBND cấp tỉnh × thuế suất.
      </p>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Loại đất</label>
        <div className="flex flex-wrap gap-2 mb-4">
          {(Object.keys(LAND_TYPE_LABELS) as LandUseTaxType[]).map((t) => (
            <button
              key={t} type="button" onClick={() => setLandType(t)}
              className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${landType === t ? 'bg-accent-700 text-white border-accent-700' : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'}`}
            >
              {LAND_TYPE_LABELS[t]}
            </button>
          ))}
        </div>

        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Diện tích đất tính thuế (m²)</label>
        <input
          type="number" value={landArea} onChange={(e) => setLandArea(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white mb-4"
        />

        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Giá 1m² đất theo bảng giá đất của UBND cấp tỉnh (đồng)</label>
        <input
          type="number" value={pricePerSqm} onChange={(e) => setPricePerSqm(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white mb-4"
        />

        {landType === 'dat_o' && (
          <>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Hạn mức đất ở tại địa phương (m²) — do UBND cấp tỉnh quy định</label>
            <input
              type="number" value={quotaArea} onChange={(e) => setQuotaArea(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white mb-4"
            />
          </>
        )}

        <button type="button" onClick={() => setSubmitted(true)} className="px-5 py-2.5 bg-accent-700 hover:bg-accent-700 text-white font-medium rounded-lg transition-colors">
          Tính thuế
        </button>
      </div>

      {submitted && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
          <table className="w-full text-sm mb-4">
            <thead>
              <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
                <th className="py-2 font-medium">Bậc</th>
                <th className="py-2 font-medium text-right">Diện tích (m²)</th>
                <th className="py-2 font-medium text-right">Thuế suất</th>
                <th className="py-2 font-medium text-right">Thuế</th>
              </tr>
            </thead>
            <tbody>
              {result.brackets.filter((b) => b.area > 0).map((b, i) => (
                <tr key={i} className="border-b border-gray-50 dark:border-gray-800">
                  <td className="py-2 text-gray-700 dark:text-gray-300">{b.label}</td>
                  <td className="py-2 text-right text-gray-700 dark:text-gray-300">{b.area.toLocaleString('vi-VN')}</td>
                  <td className="py-2 text-right text-gray-700 dark:text-gray-300">{b.ratePercent}%</td>
                  <td className="py-2 text-right font-medium text-gray-900 dark:text-white">{formatVnd(b.tax)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex justify-between pt-2 border-t border-gray-100 dark:border-gray-700 text-sm">
            <dt className="text-gray-700 dark:text-gray-300 font-semibold">Tổng thuế phải nộp</dt>
            <dd className="font-bold text-accent-700">{formatVnd(result.totalTax)}</dd>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Đất ở áp dụng thuế suất lũy tiến: 0,03% trong hạn mức; 0,07% phần vượt hạn mức đến 3
          lần; 0,15% phần vượt trên 3 lần hạn mức. Hạn mức đất ở do UBND cấp tỉnh quy định riêng
          từng địa phương — vui lòng tra cứu văn bản của địa phương mình. Từ năm 2026, giá đất
          được UBND cấp tỉnh cập nhật hằng năm theo Luật Đất đai 2024 thay vì chu kỳ 5 năm như
          trước.
        </p>
      </div>
    </div>
  );
}
