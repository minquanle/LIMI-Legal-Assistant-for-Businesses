'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { GraduationCap } from 'lucide-react';
import {
  calculateAdmissionPriorityPoints,
  REGION_PRIORITY_POINTS,
  OBJECT_PRIORITY_POINTS,
  type PriorityRegion,
  type PriorityObjectGroup,
} from '@tinix-legal/shared';

const REGION_LABELS: Record<PriorityRegion, string> = {
  KV1: 'Khu vực 1 (KV1)',
  KV2_NT: 'Khu vực 2 - Nông thôn',
  KV2: 'Khu vực 2',
  KV3: 'Khu vực 3',
};

const OBJECT_LABELS: Record<PriorityObjectGroup, string> = {
  UT1: 'Nhóm UT1 (đối tượng 01-03)',
  UT2: 'Nhóm UT2 (đối tượng 04-06)',
  NONE: 'Không thuộc diện ưu tiên đối tượng',
};

export default function TinhDiemUuTienPage() {
  const [totalScore, setTotalScore] = useState('24');
  const [region, setRegion] = useState<PriorityRegion>('KV2');
  const [objectGroup, setObjectGroup] = useState<PriorityObjectGroup>('NONE');
  const [submitted, setSubmitted] = useState(false);

  const score = Number(totalScore) || 0;
  const result = useMemo(() => calculateAdmissionPriorityPoints(score, region, objectGroup), [score, region, objectGroup]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <nav className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        <Link href="/cong-cu" className="hover:text-accent-600">Công cụ</Link>
        <span className="mx-1.5">›</span>
        <span>Tính điểm ưu tiên xét tuyển đại học</span>
      </nav>

      <div className="flex items-center gap-3 mb-2">
        <div className="p-2.5 rounded-xl bg-accent-600/10 text-accent-600">
          <GraduationCap className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Công cụ tính điểm ưu tiên xét tuyển đại học
        </h1>
      </div>
      <p className="text-gray-600 dark:text-gray-300 mb-8">
        Ưu tiên khu vực, đối tượng và công thức giảm dần từ mốc 22,5 điểm (thang 30) — áp dụng
        theo Quy chế tuyển sinh hiện hành của Bộ Giáo dục và Đào tạo.
      </p>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Tổng điểm xét tuyển (thang 30)</label>
        <input
          type="number" step="0.01" value={totalScore} onChange={(e) => setTotalScore(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white mb-4"
        />

        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Khu vực ưu tiên</label>
        <div className="flex flex-wrap gap-2 mb-4">
          {(Object.keys(REGION_PRIORITY_POINTS) as PriorityRegion[]).map((r) => (
            <button
              key={r} type="button" onClick={() => setRegion(r)}
              className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${region === r ? 'bg-accent-600 text-white border-accent-600' : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'}`}
            >
              {REGION_LABELS[r]}
            </button>
          ))}
        </div>

        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Đối tượng ưu tiên</label>
        <div className="flex flex-wrap gap-2 mb-5">
          {(Object.keys(OBJECT_PRIORITY_POINTS) as PriorityObjectGroup[]).map((o) => (
            <button
              key={o} type="button" onClick={() => setObjectGroup(o)}
              className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${objectGroup === o ? 'bg-accent-600 text-white border-accent-600' : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'}`}
            >
              {OBJECT_LABELS[o]}
            </button>
          ))}
        </div>

        <button type="button" onClick={() => setSubmitted(true)} className="px-5 py-2.5 bg-accent-600 hover:bg-accent-700 text-white font-medium rounded-lg transition-colors">
          Tính điểm ưu tiên
        </button>
      </div>

      {submitted && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-600 dark:text-gray-400">Tổng điểm xét tuyển</dt>
              <dd className="font-medium text-gray-900 dark:text-white">{result.totalScore}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600 dark:text-gray-400">Mức điểm ưu tiên đầy đủ (khu vực + đối tượng)</dt>
              <dd className="font-medium text-gray-900 dark:text-white">{result.fullPriorityPoints}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600 dark:text-gray-400">Điểm ưu tiên thực nhận (đã giảm dần)</dt>
              <dd className="font-medium text-accent-600">+ {result.adjustedPriorityPoints}</dd>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
              <dt className="text-gray-700 dark:text-gray-300 font-semibold">Điểm xét tuyển cuối cùng</dt>
              <dd className="font-bold text-gray-900 dark:text-white">{result.finalScore}</dd>
            </div>
          </dl>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Công thức: nếu tổng điểm ≤ 22,5 thì hưởng trọn mức điểm ưu tiên; nếu trên 22,5 thì
          Điểm ưu tiên = [(30 − Tổng điểm) / 7,5] × Mức điểm ưu tiên, giảm dần về 0 khi đạt 30 điểm.
        </p>
      </div>
    </div>
  );
}
