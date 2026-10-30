'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Car } from 'lucide-react';
import { calculateRegistrationFee, type VehicleType, type RegistrationTime } from '@tinix-legal/shared';

const VEHICLE_LABELS: Record<VehicleType, string> = {
  oto_duoi_10_cho: 'Ô tô con dưới 10 chỗ (kể cả người lái)',
  oto_khac: 'Ô tô khác (tải, khách trên 9 chỗ, rơ moóc...)',
  oto_dien: 'Ô tô điện chạy pin',
  xe_may: 'Xe máy',
};

const TIME_LABELS: Record<RegistrationTime, string> = {
  lan_dau: 'Đăng ký lần đầu',
  tu_lan_2: 'Đăng ký từ lần thứ 2 trở đi',
};

function formatVnd(n: number): string {
  return n.toLocaleString('vi-VN') + ' đ';
}

export default function TinhLePhiTruocBaPage() {
  const [vehicleValue, setVehicleValue] = useState('600000000');
  const [vehicleType, setVehicleType] = useState<VehicleType>('oto_duoi_10_cho');
  const [registrationTime, setRegistrationTime] = useState<RegistrationTime>('lan_dau');
  const [submitted, setSubmitted] = useState(false);

  const value = Number(vehicleValue) || 0;
  const result = useMemo(() => calculateRegistrationFee(value, vehicleType, registrationTime), [value, vehicleType, registrationTime]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <nav className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        <Link href="/cong-cu" className="hover:text-accent-600">Công cụ</Link>
        <span className="mx-1.5">›</span>
        <span>Tính lệ phí trước bạ ô tô, xe máy</span>
      </nav>

      <div className="flex items-center gap-3 mb-2">
        <div className="p-2.5 rounded-xl bg-accent-600/10 text-accent-600">
          <Car className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Công cụ tính lệ phí trước bạ ô tô, xe máy
        </h1>
      </div>
      <p className="text-gray-600 dark:text-gray-300 mb-8">
        Mức thu chung toàn quốc theo Nghị định 10/2022/NĐ-CP, sửa đổi bởi Nghị định
        175/2025/NĐ-CP.
      </p>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Giá trị xe (đồng)</label>
        <input
          type="number" value={vehicleValue} onChange={(e) => setVehicleValue(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white mb-4"
        />

        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Loại xe</label>
        <div className="flex flex-wrap gap-2 mb-4">
          {(Object.keys(VEHICLE_LABELS) as VehicleType[]).map((v) => (
            <button
              key={v} type="button" onClick={() => setVehicleType(v)}
              className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${vehicleType === v ? 'bg-accent-600 text-white border-accent-600' : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'}`}
            >
              {VEHICLE_LABELS[v]}
            </button>
          ))}
        </div>

        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Lần đăng ký</label>
        <div className="flex flex-wrap gap-2 mb-5">
          {(Object.keys(TIME_LABELS) as RegistrationTime[]).map((t) => (
            <button
              key={t} type="button" onClick={() => setRegistrationTime(t)}
              className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${registrationTime === t ? 'bg-accent-600 text-white border-accent-600' : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'}`}
            >
              {TIME_LABELS[t]}
            </button>
          ))}
        </div>

        <button type="button" onClick={() => setSubmitted(true)} className="px-5 py-2.5 bg-accent-600 hover:bg-accent-700 text-white font-medium rounded-lg transition-colors">
          Tính lệ phí trước bạ
        </button>
      </div>

      {submitted && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-600 dark:text-gray-400">Giá trị xe</dt>
              <dd className="font-medium text-gray-900 dark:text-white">{formatVnd(result.vehicleValue)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600 dark:text-gray-400">Mức thu áp dụng</dt>
              <dd className="font-medium text-gray-900 dark:text-white">{result.ratePercent}%</dd>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
              <dt className="text-gray-700 dark:text-gray-300 font-semibold">Lệ phí trước bạ phải nộp</dt>
              <dd className="font-bold text-accent-600">{formatVnd(result.fee)}</dd>
            </div>
          </dl>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Lưu ý: một số tỉnh, thành phố trực thuộc trung ương (Hà Nội, TP.HCM...) có thể quy định
          mức riêng cao hơn cho ô tô con đăng ký lần đầu theo Nghị quyết HĐND cấp tỉnh. Công cụ
          này dùng mức chung toàn quốc, không thay thế biểu giá của từng địa phương. Xe máy được
          miễn lệ phí trước bạ từ lần đăng ký thứ 2 trở đi kể từ 15/8/2026; ô tô điện chạy pin
          được giảm 100% lệ phí trước bạ khi đăng ký lần đầu đến hết 28/02/2027.
        </p>
      </div>
    </div>
  );
}
