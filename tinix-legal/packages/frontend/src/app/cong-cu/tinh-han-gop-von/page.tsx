'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { CalendarClock } from 'lucide-react';
import { calculateCapitalContributionDeadline } from '@tinix-legal/shared';

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

export default function TinhHanGopVonPage() {
  const [certificateIssuanceDate, setCertificateIssuanceDate] = useState('2026-01-01');
  const [useShorterPeriod, setUseShorterPeriod] = useState(false);
  const [charterPeriodDays, setCharterPeriodDays] = useState('60');
  const [submitted, setSubmitted] = useState(false);

  const result = useMemo(
    () =>
      calculateCapitalContributionDeadline({
        certificateIssuanceDate,
        charterPeriodDays: useShorterPeriod ? Number(charterPeriodDays) || undefined : undefined,
      }),
    [certificateIssuanceDate, useShorterPeriod, charterPeriodDays]
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <nav className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        <Link href="/cong-cu" className="hover:text-accent-600">Công cụ</Link>
        <span className="mx-1.5">›</span>
        <span>Tính thời hạn góp vốn thành lập doanh nghiệp</span>
      </nav>

      <div className="flex items-center gap-3 mb-2">
        <div className="p-2.5 rounded-xl bg-accent-700/10 text-accent-700">
          <CalendarClock className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Công cụ tính thời hạn góp vốn thành lập doanh nghiệp
        </h1>
      </div>
      <p className="text-gray-600 dark:text-gray-300 mb-8">
        Áp dụng thống nhất cho công ty TNHH và công ty cổ phần, theo Điều 47, 75, 113 Luật
        Doanh nghiệp 2020.
      </p>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Ngày cấp Giấy chứng nhận đăng ký doanh nghiệp</label>
        <input
          type="date" value={certificateIssuanceDate} onChange={(e) => setCertificateIssuanceDate(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white mb-4"
        />

        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 mb-3">
          <input
            type="checkbox" checked={useShorterPeriod}
            onChange={(e) => setUseShorterPeriod(e.target.checked)}
            className="rounded border-gray-300 dark:border-gray-600"
          />
          Điều lệ/hợp đồng đăng ký mua cổ phần quy định thời hạn ngắn hơn 90 ngày
        </label>

        {useShorterPeriod && (
          <>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Thời hạn theo Điều lệ (ngày)</label>
            <input
              type="number" value={charterPeriodDays} onChange={(e) => setCharterPeriodDays(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white mb-4"
            />
          </>
        )}

        <button type="button" onClick={() => setSubmitted(true)} className="px-5 py-2.5 bg-accent-700 hover:bg-accent-700 text-white font-medium rounded-lg transition-colors">
          Tính thời hạn
        </button>
      </div>

      {submitted && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-600 dark:text-gray-400">Thời hạn góp vốn áp dụng</dt>
              <dd className="font-medium text-gray-900 dark:text-white">{result.contributionPeriodDays} ngày</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-700 dark:text-gray-300 font-semibold">Hạn chót góp vốn</dt>
              <dd className="font-bold text-accent-700">{formatDate(result.contributionDeadline)}</dd>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
              <dt className="text-gray-600 dark:text-gray-400">Hạn chót đăng ký điều chỉnh vốn điều lệ nếu góp không đủ</dt>
              <dd className="font-medium text-gray-900 dark:text-white">{formatDate(result.capitalAdjustmentDeadline)}</dd>
            </div>
          </dl>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Nếu góp vốn bằng tài sản, thời gian vận chuyển, nhập khẩu, làm thủ tục chuyển quyền sở
          hữu tài sản không tính vào thời hạn 90 ngày. Nếu thành viên/cổ đông không góp đủ vốn
          đúng hạn, doanh nghiệp phải đăng ký điều chỉnh vốn điều lệ và tỷ lệ góp vốn trong vòng
          30 ngày kể từ ngày cuối cùng phải góp đủ (Điều 47 khoản 4 Luật Doanh nghiệp 2020).
        </p>
      </div>
    </div>
  );
}
