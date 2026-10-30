'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Wrench } from 'lucide-react';
import {
  calculateInspectionCycle,
  getVehicleServiceLifeLimit,
  type InspectionVehicleType,
  type VehicleServiceLifeCategory,
} from '@tinix-legal/shared';

const VEHICLE_TYPE_LABELS: Record<InspectionVehicleType, string> = {
  khong_kinh_doanh_van_tai: 'Ô tô con không kinh doanh vận tải',
  kinh_doanh_van_tai_hoac_xe_tai: 'Xe kinh doanh vận tải hoặc xe tải',
};

const SERVICE_LIFE_LABELS: Record<VehicleServiceLifeCategory, string> = {
  xe_tai: 'Xe tải (chở hàng)',
  xe_khach: 'Xe khách (chở người)',
  xe_cai_tao_truoc_2002: 'Xe cải tạo thành xe chở người trước 01/01/2002',
};

export default function TinhChuKyDangKiemPage() {
  const [vehicleType, setVehicleType] = useState<InspectionVehicleType>('khong_kinh_doanh_van_tai');
  const [isFirstRegistration, setIsFirstRegistration] = useState(true);
  const [vehicleAgeYears, setVehicleAgeYears] = useState('5');
  const [submitted, setSubmitted] = useState(false);

  const result = useMemo(
    () => calculateInspectionCycle(vehicleType, Number(vehicleAgeYears) || 0, isFirstRegistration),
    [vehicleType, vehicleAgeYears, isFirstRegistration]
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <nav className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        <Link href="/cong-cu" className="hover:text-accent-600">Công cụ</Link>
        <span className="mx-1.5">›</span>
        <span>Tính chu kỳ đăng kiểm xe</span>
      </nav>

      <div className="flex items-center gap-3 mb-2">
        <div className="p-2.5 rounded-xl bg-accent-600/10 text-accent-700">
          <Wrench className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Công cụ tính chu kỳ đăng kiểm và niên hạn sử dụng xe
        </h1>
      </div>
      <p className="text-gray-600 dark:text-gray-300 mb-8">
        Theo Thông tư 47/2024/TT-BGTVT (hiệu lực 01/01/2025) và Nghị định 95/2009/NĐ-CP.
      </p>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Loại xe</label>
        <div className="flex flex-wrap gap-2 mb-4">
          {(Object.keys(VEHICLE_TYPE_LABELS) as InspectionVehicleType[]).map((t) => (
            <button
              key={t} type="button" onClick={() => setVehicleType(t)}
              className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${vehicleType === t ? 'bg-accent-700 text-white border-accent-700' : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'}`}
            >
              {VEHICLE_TYPE_LABELS[t]}
            </button>
          ))}
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 mb-4">
          <input
            type="checkbox" checked={isFirstRegistration}
            onChange={(e) => setIsFirstRegistration(e.target.checked)}
            className="rounded border-gray-300 dark:border-gray-600"
          />
          Đăng ký lần đầu (miễn kiểm định, chỉ cấp giấy chứng nhận)
        </label>

        {!isFirstRegistration && (
          <>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Tuổi xe (năm)</label>
            <input
              type="number" value={vehicleAgeYears} onChange={(e) => setVehicleAgeYears(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white mb-4"
            />
          </>
        )}

        <button type="button" onClick={() => setSubmitted(true)} className="px-5 py-2.5 bg-accent-700 hover:bg-accent-700 text-white font-medium rounded-lg transition-colors">
          Tính chu kỳ đăng kiểm
        </button>
      </div>

      {submitted && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
          <dl className="flex justify-between text-sm">
            <dt className="text-gray-700 dark:text-gray-300 font-semibold">Chu kỳ đăng kiểm áp dụng</dt>
            <dd className="font-bold text-accent-700">{result.cycleMonths} tháng</dd>
          </dl>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Niên hạn sử dụng tối đa (tính từ năm sản xuất)</h2>
        <dl className="space-y-2 text-sm">
          {(Object.keys(SERVICE_LIFE_LABELS) as VehicleServiceLifeCategory[]).map((c) => (
            <div key={c} className="flex justify-between">
              <dt className="text-gray-600 dark:text-gray-400">{SERVICE_LIFE_LABELS[c]}</dt>
              <dd className="font-medium text-gray-900 dark:text-white">{getVehicleServiceLifeLimit(c)} năm</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Đối với xe kinh doanh vận tải/xe tải, một số mốc tuổi xe cụ thể có thể khác nhau giữa
          xe chở người kinh doanh vận tải và xe tải theo Phụ lục Thông tư 47/2024/TT-BGTVT — công
          cụ dùng mức chung, vui lòng đối chiếu văn bản gốc cho trường hợp cụ thể.
        </p>
      </div>
    </div>
  );
}
