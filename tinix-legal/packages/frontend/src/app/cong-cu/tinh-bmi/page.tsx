'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { HeartPulse } from 'lucide-react';
import { calculateBmi } from '@tinix-legal/shared';

const CATEGORY_COLOR: Record<string, string> = {
  thieu_can: 'text-accent-600 bg-accent-50 dark:bg-accent-700/20',
  binh_thuong: 'text-accent-600 bg-accent-50 dark:bg-accent-700/20',
  thua_can: 'text-accent-600 bg-accent-50 dark:bg-accent-700/20',
  beo_phi_1: 'text-accent-600 bg-accent-50 dark:bg-accent-700/20',
  beo_phi_2: 'text-red-600 bg-red-50 dark:bg-red-900/20',
};

export default function TinhBmiPage() {
  const [height, setHeight] = useState('170');
  const [weight, setWeight] = useState('65');
  const [submitted, setSubmitted] = useState(false);

  const h = Number(height) || 0;
  const w = Number(weight) || 0;
  const result = useMemo(() => calculateBmi(h, w), [h, w]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <nav className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        <Link href="/cong-cu" className="hover:text-accent-600">Công cụ</Link>
        <span className="mx-1.5">›</span>
        <span>Tính BMI</span>
      </nav>

      <div className="flex items-center gap-3 mb-2">
        <div className="p-2.5 rounded-xl bg-accent-600/10 text-accent-600">
          <HeartPulse className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Công cụ tính BMI và đánh giá thừa cân, béo phì
        </h1>
      </div>
      <p className="text-gray-600 dark:text-gray-300 mb-8">
        BMI theo ngưỡng dành cho người châu Á tại Quyết định 2892/QĐ-BYT năm 2022 của Bộ Y tế —
        ngưỡng thấp hơn thang quốc tế vì người châu Á có nguy cơ chuyển hoá cao hơn ở cùng mức BMI.
      </p>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
        <div className="grid grid-cols-2 gap-4 mb-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Chiều cao (cm)</label>
            <input
              type="number"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Cân nặng (kg)</label>
            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            />
          </div>
        </div>
        <button
          type="button"
          onClick={() => setSubmitted(true)}
          className="px-5 py-2.5 bg-accent-600 hover:bg-accent-700 text-white font-medium rounded-lg transition-colors"
        >
          Tính BMI
        </button>
      </div>

      {submitted && h > 0 && w > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6 text-center">
          <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">{result.bmi}</div>
          <div className={`inline-block px-4 py-1.5 rounded-full font-semibold ${CATEGORY_COLOR[result.categoryCode]}`}>
            {result.category}
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Thang phân loại BMI người châu Á</h2>
        <table className="w-full text-sm">
          <tbody>
            <tr className="border-b border-gray-50 dark:border-gray-700/50"><td className="py-1.5">Dưới 18,5</td><td className="py-1.5 text-right">Thiếu cân</td></tr>
            <tr className="border-b border-gray-50 dark:border-gray-700/50"><td className="py-1.5">18,5 – 22,9</td><td className="py-1.5 text-right">Bình thường</td></tr>
            <tr className="border-b border-gray-50 dark:border-gray-700/50"><td className="py-1.5">23 – 24,9</td><td className="py-1.5 text-right">Thừa cân (tiền béo phì)</td></tr>
            <tr className="border-b border-gray-50 dark:border-gray-700/50"><td className="py-1.5">25 – 29,9</td><td className="py-1.5 text-right">Béo phì độ I</td></tr>
            <tr><td className="py-1.5">Từ 30 trở lên</td><td className="py-1.5 text-right">Béo phì độ II</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
