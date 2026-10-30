'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { GraduationCap as GraduationCapIcon, Plus, Trash2 } from 'lucide-react';
import { calculateWeightedGpa, convertScoreToGpa } from '@tinix-legal/shared';

interface CourseRow {
  scoreOn10: string;
  credits: string;
}

export default function TinhDiemGpaPage() {
  const [courses, setCourses] = useState<CourseRow[]>([
    { scoreOn10: '9.0', credits: '3' },
    { scoreOn10: '7.5', credits: '4' },
    { scoreOn10: '6.0', credits: '2' },
  ]);
  const [submitted, setSubmitted] = useState(false);

  const parsedCourses = useMemo(
    () => courses.map((c) => ({ scoreOn10: Number(c.scoreOn10) || 0, credits: Number(c.credits) || 0 })),
    [courses]
  );

  const result = useMemo(() => calculateWeightedGpa(parsedCourses), [parsedCourses]);

  const updateCourse = (i: number, field: keyof CourseRow, value: string) => {
    setCourses((prev) => prev.map((c, idx) => (idx === i ? { ...c, [field]: value } : c)));
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <nav className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        <Link href="/cong-cu" className="hover:text-accent-600">Công cụ</Link>
        <span className="mx-1.5">›</span>
        <span>Tính điểm trung bình tích lũy (GPA)</span>
      </nav>

      <div className="flex items-center gap-3 mb-2">
        <div className="p-2.5 rounded-xl bg-accent-700/10 text-accent-700">
          <GraduationCapIcon className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Công cụ tính điểm trung bình tích lũy (GPA) và xếp loại tốt nghiệp
        </h1>
      </div>
      <p className="text-gray-600 dark:text-gray-300 mb-8">
        Quy đổi điểm hệ 10 sang hệ 4 theo tín chỉ và xếp loại tốt nghiệp, theo Thông tư
        56/2026/TT-BGDĐT (thay thế Thông tư 08/2021/TT-BGDĐT từ 07/7/2026).
      </p>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Điểm từng học phần (thang 10) và số tín chỉ</label>
        <div className="space-y-2 mb-3">
          {courses.map((c, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="number" step="0.1" min="0" max="10" value={c.scoreOn10}
                onChange={(e) => updateCourse(i, 'scoreOn10', e.target.value)}
                placeholder="Điểm (0-10)"
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              />
              <input
                type="number" min="0" value={c.credits}
                onChange={(e) => updateCourse(i, 'credits', e.target.value)}
                placeholder="Số tín chỉ"
                className="w-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              />
              <span className="text-xs text-gray-500 dark:text-gray-400 w-14 shrink-0">
                {convertScoreToGpa(Number(c.scoreOn10) || 0).letterGrade}
              </span>
              <button
                type="button" onClick={() => setCourses((prev) => prev.filter((_, idx) => idx !== i))}
                disabled={courses.length <= 1}
                className="p-2 text-gray-400 hover:text-red-600 disabled:opacity-30 disabled:hover:text-gray-400"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button" onClick={() => setCourses((prev) => [...prev, { scoreOn10: '', credits: '' }])}
          className="flex items-center gap-1.5 text-sm text-accent-700 hover:text-accent-700 font-medium mb-5"
        >
          <Plus className="w-4 h-4" /> Thêm học phần
        </button>

        <button type="button" onClick={() => setSubmitted(true)} className="block px-5 py-2.5 bg-accent-700 hover:bg-accent-700 text-white font-medium rounded-lg transition-colors">
          Tính GPA và xếp loại
        </button>
      </div>

      {submitted && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-600 dark:text-gray-400">Điểm trung bình tích lũy (thang 4)</dt>
              <dd className="font-medium text-gray-900 dark:text-white">{result.averageGpaOn4.toFixed(2)}</dd>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
              <dt className="text-gray-700 dark:text-gray-300 font-semibold">Xếp loại</dt>
              <dd className="font-bold text-accent-700">{result.classification}</dd>
            </div>
          </dl>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Quy đổi: A (8,5-10) = 4; B (7,0-8,4) = 3; C (5,5-6,9) = 2; D (4,0-5,4) = 1; F (dưới 4,0)
          = 0. Xếp loại: Xuất sắc (≥3,6); Giỏi (3,2-3,59); Khá (2,5-3,19); Trung bình (2,0-2,49).
          Công cụ chưa áp dụng quy tắc hạ một mức xếp loại khi tỷ lệ tín chỉ học lại vượt 5% hoặc
          có kỷ luật — vui lòng tra cứu quy chế đào tạo của trường.
        </p>
      </div>
    </div>
  );
}
