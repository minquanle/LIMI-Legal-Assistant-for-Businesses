'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Sprout } from 'lucide-react';
import { checkAgriculturalLandUseTaxExemption, type AgriculturalLandHolderType } from '@tinix-legal/shared';

const HOLDER_TYPE_LABELS: Record<AgriculturalLandHolderType, string> = {
  ho_gia_dinh_ca_nhan: 'Hộ gia đình, cá nhân được giao/công nhận đất nông nghiệp',
  thanh_vien_htx_nong_truong: 'Thành viên hợp tác xã nông nghiệp/nông trường viên nhận khoán',
  to_chuc_nghien_cuu_san_xuat_thu_nghiem: 'Tổ chức phục vụ nghiên cứu, sản xuất thử nghiệm nông nghiệp',
  ho_ngheo: 'Hộ nghèo được giao/công nhận đất nông nghiệp',
};

export default function KiemTraMienThueDatNongNghiepPage() {
  const [holderType, setHolderType] = useState<AgriculturalLandHolderType>('ho_gia_dinh_ca_nhan');
  const [submitted, setSubmitted] = useState(false);

  const result = useMemo(() => checkAgriculturalLandUseTaxExemption(holderType), [holderType]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <nav className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        <Link href="/cong-cu" className="hover:text-accent-600">Công cụ</Link>
        <span className="mx-1.5">›</span>
        <span>Kiểm tra miễn thuế sử dụng đất nông nghiệp</span>
      </nav>

      <div className="flex items-center gap-3 mb-2">
        <div className="p-2.5 rounded-xl bg-accent-700/10 text-accent-700">
          <Sprout className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Công cụ kiểm tra diện miễn thuế sử dụng đất nông nghiệp
        </h1>
      </div>
      <p className="text-gray-600 dark:text-gray-300 mb-8">
        Thuế sử dụng đất nông nghiệp hiện đã được miễn toàn bộ cho hầu hết người sử dụng đất
        trong thực tế đến hết năm 2030, theo Nghị quyết 216/2025/QH15. Công cụ này giúp xác nhận
        diện miễn thuế thay vì tính ra một số tiền thuế không còn phải nộp.
      </p>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Đối tượng sử dụng đất</label>
        <div className="flex flex-col gap-2 mb-5">
          {(Object.keys(HOLDER_TYPE_LABELS) as AgriculturalLandHolderType[]).map((t) => (
            <button
              key={t} type="button" onClick={() => setHolderType(t)}
              className={`px-3 py-2 text-sm text-left rounded-lg border transition-colors ${holderType === t ? 'bg-accent-700 text-white border-accent-700' : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'}`}
            >
              {HOLDER_TYPE_LABELS[t]}
            </button>
          ))}
        </div>

        <button type="button" onClick={() => setSubmitted(true)} className="px-5 py-2.5 bg-accent-700 hover:bg-accent-700 text-white font-medium rounded-lg transition-colors">
          Kiểm tra diện miễn thuế
        </button>
      </div>

      {submitted && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-700 dark:text-gray-300 font-semibold">Kết quả</dt>
              <dd className="font-bold text-accent-700">Được miễn toàn bộ thuế sử dụng đất nông nghiệp</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600 dark:text-gray-400">Thời gian miễn thuế</dt>
              <dd className="font-medium text-gray-900 dark:text-white">{result.exemptionPeriod}</dd>
            </div>
          </dl>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
            {result.legalBasis}
          </p>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Chính sách miễn thuế sử dụng đất nông nghiệp đã được Quốc hội kéo dài liên tục qua
          nhiều nghị quyết (NQ 55/2010, NQ 28/2016, NQ 107/2020, NQ 216/2025), lần gần nhất áp
          dụng từ 01/01/2026 đến hết 31/12/2030. Luật Thuế sử dụng đất nông nghiệp 1993 vẫn là
          văn bản gốc quy định mức thu, nhưng trên thực tế gần như không còn trường hợp phải nộp
          khoản thuế này.
        </p>
      </div>
    </div>
  );
}
