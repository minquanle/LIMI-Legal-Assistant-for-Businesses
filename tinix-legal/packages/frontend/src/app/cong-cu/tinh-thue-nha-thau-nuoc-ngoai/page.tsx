'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Globe } from 'lucide-react';
import { calculateForeignContractorTax, type FctIndustry } from '@tinix-legal/shared';

const INDUSTRY_LABELS: Record<FctIndustry, string> = {
  thuong_mai_phan_phoi_hang_hoa: 'Thương mại, phân phối, cung cấp hàng hóa',
  dich_vu: 'Dịch vụ',
  cho_thue_may_moc_thiet_bi: 'Cho thuê máy móc, thiết bị',
  xay_dung_lap_dat_khong_bao_thau_nvl: 'Xây dựng, lắp đặt không bao thầu nguyên vật liệu',
  xay_dung_lap_dat_co_bao_thau_nvl: 'Xây dựng, lắp đặt có bao thầu nguyên vật liệu',
  san_xuat_van_tai_khac: 'Sản xuất, vận tải, hoạt động kinh doanh khác',
  lai_tien_vay: 'Lãi tiền vay',
  thu_nhap_ban_quyen: 'Thu nhập bản quyền',
  chuyen_nhuong_chung_khoan_tai_bao_hiem: 'Chuyển nhượng chứng khoán, tái bảo hiểm',
};

function formatVnd(n: number): string {
  return Math.round(n).toLocaleString('vi-VN') + ' đ';
}

export default function TinhThueNhaThauNuocNgoaiPage() {
  const [netContractValue, setNetContractValue] = useState('950000000');
  const [industry, setIndustry] = useState<FctIndustry>('dich_vu');
  const [submitted, setSubmitted] = useState(false);

  const result = useMemo(() => calculateForeignContractorTax(Number(netContractValue) || 0, industry), [netContractValue, industry]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <nav className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        <Link href="/cong-cu" className="hover:text-accent-600">Công cụ</Link>
        <span className="mx-1.5">›</span>
        <span>Tính thuế nhà thầu nước ngoài</span>
      </nav>

      <div className="flex items-center gap-3 mb-2">
        <div className="p-2.5 rounded-xl bg-accent-700/10 text-accent-700">
          <Globe className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Công cụ tính thuế nhà thầu nước ngoài (FCT)
        </h1>
      </div>
      <p className="text-gray-600 dark:text-gray-300 mb-8">
        Áp dụng cho hợp đồng NET (bên Việt Nam chịu thuế thay), theo Thông tư 103/2014/TT-BTC.
        Tự động quy đổi doanh thu NET sang doanh thu tính thuế GTGT và TNDN.
      </p>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Giá trị hợp đồng NET (đồng)</label>
        <input
          type="number" value={netContractValue} onChange={(e) => setNetContractValue(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white mb-4"
        />

        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Ngành, lĩnh vực hoạt động</label>
        <div className="flex flex-col gap-2 mb-5">
          {(Object.keys(INDUSTRY_LABELS) as FctIndustry[]).map((i) => (
            <button
              key={i} type="button" onClick={() => setIndustry(i)}
              className={`px-3 py-2 text-sm text-left rounded-lg border transition-colors ${industry === i ? 'bg-accent-700 text-white border-accent-700' : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'}`}
            >
              {INDUSTRY_LABELS[i]}
            </button>
          ))}
        </div>

        <button type="button" onClick={() => setSubmitted(true)} className="px-5 py-2.5 bg-accent-700 hover:bg-accent-700 text-white font-medium rounded-lg transition-colors">
          Tính thuế nhà thầu
        </button>
      </div>

      {submitted && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-600 dark:text-gray-400">Doanh thu tính thuế GTGT (đã gross-up)</dt>
              <dd className="font-medium text-gray-900 dark:text-white">{formatVnd(result.vatTaxableRevenue)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600 dark:text-gray-400">Thuế GTGT ({result.vatPercent}%)</dt>
              <dd className="font-medium text-gray-900 dark:text-white">{formatVnd(result.vatAmount)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600 dark:text-gray-400">Doanh thu tính thuế TNDN (đã gross-up)</dt>
              <dd className="font-medium text-gray-900 dark:text-white">{formatVnd(result.citTaxableRevenue)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600 dark:text-gray-400">Thuế TNDN ({result.citPercent}%)</dt>
              <dd className="font-medium text-gray-900 dark:text-white">{formatVnd(result.citAmount)}</dd>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
              <dt className="text-gray-700 dark:text-gray-300 font-semibold">Tổng thuế nhà thầu phải nộp thay</dt>
              <dd className="font-bold text-accent-700">{formatVnd(result.totalTax)}</dd>
            </div>
          </dl>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Từ 12/3/2026, Thông tư 20/2026/TT-BTC bãi bỏ Điều 13 Thông tư 103/2014/TT-BTC (thuế
          TNDN) để hướng dẫn Luật Thuế TNDN 2025 — mức thuế suất TNDN theo ngành ở trên cần đối
          chiếu lại với văn bản mới cho hợp đồng ký sau ngày này. Phần thuế GTGT (Điều 12) chưa
          bị ảnh hưởng.
        </p>
      </div>
    </div>
  );
}
