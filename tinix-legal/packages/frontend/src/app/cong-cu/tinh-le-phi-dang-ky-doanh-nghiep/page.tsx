'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { FileCheck } from 'lucide-react';
import { calculateBusinessRegistrationFee } from '@tinix-legal/shared';

function formatVnd(n: number): string {
  return n.toLocaleString('vi-VN') + ' đ';
}

export default function TinhLePhiDangKyDoanhNghiepPage() {
  const [isOnlineRegistration, setIsOnlineRegistration] = useState(true);
  const [submitted, setSubmitted] = useState(false);

  const result = useMemo(() => calculateBusinessRegistrationFee(isOnlineRegistration), [isOnlineRegistration]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <nav className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        <Link href="/cong-cu" className="hover:text-accent-600">Công cụ</Link>
        <span className="mx-1.5">›</span>
        <span>Tính lệ phí đăng ký doanh nghiệp</span>
      </nav>

      <div className="flex items-center gap-3 mb-2">
        <div className="p-2.5 rounded-xl bg-accent-700/10 text-accent-700">
          <FileCheck className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Công cụ tính lệ phí đăng ký doanh nghiệp
        </h1>
      </div>
      <p className="text-gray-600 dark:text-gray-300 mb-8">
        Lệ phí đăng ký doanh nghiệp và phí công bố nội dung đăng ký, theo Thông tư
        47/2019/TT-BTC.
      </p>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Hình thức nộp hồ sơ</label>
        <div className="flex flex-wrap gap-2 mb-5">
          <button
            type="button" onClick={() => setIsOnlineRegistration(true)}
            className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${isOnlineRegistration ? 'bg-accent-700 text-white border-accent-700' : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'}`}
          >
            Qua mạng điện tử
          </button>
          <button
            type="button" onClick={() => setIsOnlineRegistration(false)}
            className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${!isOnlineRegistration ? 'bg-accent-700 text-white border-accent-700' : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'}`}
          >
            Nộp trực tiếp/qua bưu điện
          </button>
        </div>

        <button type="button" onClick={() => setSubmitted(true)} className="px-5 py-2.5 bg-accent-700 hover:bg-accent-700 text-white font-medium rounded-lg transition-colors">
          Tính lệ phí
        </button>
      </div>

      {submitted && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
          {result.totalFee === 0 ? (
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Đăng ký qua mạng điện tử được miễn toàn bộ lệ phí đăng ký doanh nghiệp và phí công
              bố nội dung đăng ký.
            </p>
          ) : (
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-600 dark:text-gray-400">Lệ phí đăng ký doanh nghiệp</dt>
                <dd className="font-medium text-gray-900 dark:text-white">{formatVnd(result.registrationFee)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600 dark:text-gray-400">Phí công bố nội dung đăng ký</dt>
                <dd className="font-medium text-gray-900 dark:text-white">{formatVnd(result.publicationFee)}</dd>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                <dt className="text-gray-700 dark:text-gray-300 font-semibold">Tổng cộng</dt>
                <dd className="font-bold text-accent-700">{formatVnd(result.totalFee)}</dd>
              </div>
            </dl>
          )}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Lưu ý: lệ phí môn bài (thuế môn bài) đã chính thức bị bãi bỏ từ 01/01/2026 theo Nghị
          quyết 198/2025/QH15 — doanh nghiệp không còn phải kê khai, nộp khoản này cho năm 2026
          trở đi.
        </p>
      </div>
    </div>
  );
}
