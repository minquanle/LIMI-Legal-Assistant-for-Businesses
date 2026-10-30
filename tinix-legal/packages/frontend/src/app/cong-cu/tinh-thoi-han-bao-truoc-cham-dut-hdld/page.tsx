'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { LogOut } from 'lucide-react';
import { calculateTerminationNoticePeriod, type EmploymentContractType } from '@tinix-legal/shared';

const CONTRACT_TYPE_LABELS: Record<EmploymentContractType, string> = {
  khong_xac_dinh_thoi_han: 'Hợp đồng không xác định thời hạn',
  xac_dinh_12_36_thang: 'Hợp đồng xác định thời hạn từ 12 đến 36 tháng',
  duoi_12_thang: 'Hợp đồng có thời hạn dưới 12 tháng',
};

export default function TinhThoiHanBaoTruocChamDutHdldPage() {
  const [contractType, setContractType] = useState<EmploymentContractType>('khong_xac_dinh_thoi_han');
  const [submitted, setSubmitted] = useState(false);

  const result = useMemo(() => calculateTerminationNoticePeriod(contractType), [contractType]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <nav className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        <Link href="/cong-cu" className="hover:text-accent-600">Công cụ</Link>
        <span className="mx-1.5">›</span>
        <span>Tính thời hạn báo trước khi chấm dứt hợp đồng lao động</span>
      </nav>

      <div className="flex items-center gap-3 mb-2">
        <div className="p-2.5 rounded-xl bg-accent-700/10 text-accent-700">
          <LogOut className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Công cụ tính thời hạn báo trước khi chấm dứt hợp đồng lao động
        </h1>
      </div>
      <p className="text-gray-600 dark:text-gray-300 mb-8">
        Mức báo trước áp dụng thống nhất cho cả người lao động (Điều 35) và người sử dụng lao
        động (Điều 36 khoản 2) Bộ luật Lao động 2019.
      </p>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Loại hợp đồng lao động</label>
        <div className="flex flex-col gap-2 mb-5">
          {(Object.keys(CONTRACT_TYPE_LABELS) as EmploymentContractType[]).map((t) => (
            <button
              key={t} type="button" onClick={() => setContractType(t)}
              className={`px-3 py-2 text-sm text-left rounded-lg border transition-colors ${contractType === t ? 'bg-accent-700 text-white border-accent-700' : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'}`}
            >
              {CONTRACT_TYPE_LABELS[t]}
            </button>
          ))}
        </div>

        <button type="button" onClick={() => setSubmitted(true)} className="px-5 py-2.5 bg-accent-700 hover:bg-accent-700 text-white font-medium rounded-lg transition-colors">
          Tính thời hạn báo trước
        </button>
      </div>

      {submitted && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
          <dl className="flex justify-between text-sm">
            <dt className="text-gray-700 dark:text-gray-300 font-semibold">Thời hạn báo trước tối thiểu</dt>
            <dd className="font-bold text-accent-700">{result.noticeValue} {result.noticeUnit}</dd>
          </dl>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Ngành, nghề, công việc đặc thù có thể có thời hạn báo trước dài hơn theo quy định riêng
          của Chính phủ (Nghị định 145/2020/NĐ-CP). Người lao động được chấm dứt ngay không cần
          báo trước trong một số trường hợp (Điều 35 khoản 2): không được bố trí đúng công việc/
          địa điểm, không được trả đủ lương đúng hạn, bị ngược đãi/cưỡng bức lao động, lao động
          nữ mang thai phải nghỉ theo chỉ định y tế, đủ tuổi nghỉ hưu (trừ thỏa thuận khác), hoặc
          người sử dụng lao động cung cấp thông tin sai lệch. Người sử dụng lao động cũng không
          cần báo trước nếu người lao động tự ý bỏ việc từ 5 ngày liên tục trở lên không có lý do
          chính đáng.
        </p>
      </div>
    </div>
  );
}
