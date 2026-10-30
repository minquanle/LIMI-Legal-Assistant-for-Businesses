'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { UserCheck } from 'lucide-react';
import {
  calculateProbationaryPeriod,
  calculateMinimumProbationarySalary,
  type ProbationaryJobLevel,
} from '@tinix-legal/shared';

const JOB_LEVEL_LABELS: Record<ProbationaryJobLevel, string> = {
  quan_ly_doanh_nghiep: 'Người quản lý doanh nghiệp',
  cao_dang_tro_len: 'Chức danh cần trình độ chuyên môn, kỹ thuật từ cao đẳng trở lên',
  trung_cap_cong_nhan_ky_thuat: 'Trình độ trung cấp, công nhân kỹ thuật, nhân viên nghiệp vụ',
  cong_viec_khac: 'Công việc khác',
};

function formatVnd(n: number): string {
  return Math.round(n).toLocaleString('vi-VN') + ' đ';
}

export default function TinhThoiGianThuViecPage() {
  const [jobLevel, setJobLevel] = useState<ProbationaryJobLevel>('cao_dang_tro_len');
  const [officialSalary, setOfficialSalary] = useState('10000000');
  const [submitted, setSubmitted] = useState(false);

  const periodResult = useMemo(() => calculateProbationaryPeriod(jobLevel), [jobLevel]);
  const minSalary = useMemo(() => calculateMinimumProbationarySalary(Number(officialSalary) || 0), [officialSalary]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <nav className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        <Link href="/cong-cu" className="hover:text-accent-600">Công cụ</Link>
        <span className="mx-1.5">›</span>
        <span>Tính thời gian thử việc và lương thử việc</span>
      </nav>

      <div className="flex items-center gap-3 mb-2">
        <div className="p-2.5 rounded-xl bg-accent-600/10 text-accent-600">
          <UserCheck className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Công cụ tính thời gian thử việc và lương thử việc tối thiểu
        </h1>
      </div>
      <p className="text-gray-600 dark:text-gray-300 mb-8">
        Theo Điều 25, 26 Bộ luật Lao động 2019 — thời gian thử việc tối đa theo vị trí công việc
        và mức lương thử việc tối thiểu bằng 85% lương chính thức.
      </p>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Vị trí công việc</label>
        <div className="flex flex-col gap-2 mb-4">
          {(Object.keys(JOB_LEVEL_LABELS) as ProbationaryJobLevel[]).map((l) => (
            <button
              key={l} type="button" onClick={() => setJobLevel(l)}
              className={`px-3 py-2 text-sm text-left rounded-lg border transition-colors ${jobLevel === l ? 'bg-accent-600 text-white border-accent-600' : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'}`}
            >
              {JOB_LEVEL_LABELS[l]}
            </button>
          ))}
        </div>

        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Lương chính thức của công việc (đồng/tháng)</label>
        <input
          type="number" value={officialSalary} onChange={(e) => setOfficialSalary(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white mb-5"
        />

        <button type="button" onClick={() => setSubmitted(true)} className="px-5 py-2.5 bg-accent-600 hover:bg-accent-700 text-white font-medium rounded-lg transition-colors">
          Tính thời gian và lương thử việc
        </button>
      </div>

      {submitted && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-600 dark:text-gray-400">Thời gian thử việc tối đa</dt>
              <dd className="font-medium text-gray-900 dark:text-white">{periodResult.maximumPeriod} {periodResult.periodUnit}</dd>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
              <dt className="text-gray-700 dark:text-gray-300 font-semibold">Lương thử việc tối thiểu (85%)</dt>
              <dd className="font-bold text-accent-600">{formatVnd(minSalary)}</dd>
            </div>
          </dl>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Chỉ được thử việc một lần đối với một công việc. Hợp đồng lao động có thời hạn dưới 1
          tháng không được áp dụng thử việc (Điều 24 khoản 3). Trả lương thử việc thấp hơn 85%
          có thể bị phạt tiền từ 2-5 triệu đồng (cá nhân) hoặc 4-10 triệu đồng (tổ chức) và buộc
          trả đủ phần chênh lệch.
        </p>
      </div>
    </div>
  );
}
