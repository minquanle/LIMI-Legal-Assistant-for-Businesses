'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Hourglass } from 'lucide-react';
import { calculateCivilStatuteOfLimitations, type CivilClaimType } from '@tinix-legal/shared';

const CLAIM_TYPE_LABELS: Record<CivilClaimType, string> = {
  tranh_chap_hop_dong: 'Tranh chấp hợp đồng (3 năm)',
  boi_thuong_thiet_hai: 'Bồi thường thiệt hại ngoài hợp đồng (3 năm)',
  chia_di_san_bat_dong_san: 'Yêu cầu chia di sản là bất động sản (30 năm)',
  chia_di_san_dong_san: 'Yêu cầu chia di sản là động sản (10 năm)',
  xac_nhan_bac_bo_quyen_thua_ke: 'Yêu cầu xác nhận/bác bỏ quyền thừa kế (10 năm)',
  nghia_vu_tai_san_thua_ke: 'Yêu cầu người thừa kế thực hiện nghĩa vụ tài sản (3 năm)',
};

const START_DATE_LABELS: Record<CivilClaimType, string> = {
  tranh_chap_hop_dong: 'Ngày biết hoặc phải biết quyền, lợi ích hợp pháp bị xâm phạm',
  boi_thuong_thiet_hai: 'Ngày biết hoặc phải biết quyền, lợi ích hợp pháp bị xâm phạm',
  chia_di_san_bat_dong_san: 'Thời điểm mở thừa kế',
  chia_di_san_dong_san: 'Thời điểm mở thừa kế',
  xac_nhan_bac_bo_quyen_thua_ke: 'Thời điểm mở thừa kế',
  nghia_vu_tai_san_thua_ke: 'Thời điểm mở thừa kế',
};

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

export default function TinhThoiHieuKhoiKienPage() {
  const [claimType, setClaimType] = useState<CivilClaimType>('tranh_chap_hop_dong');
  const [startDate, setStartDate] = useState('2026-01-01');
  const [submitted, setSubmitted] = useState(false);

  const result = useMemo(() => calculateCivilStatuteOfLimitations({ claimType, startDate }), [claimType, startDate]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <nav className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        <Link href="/cong-cu" className="hover:text-accent-600">Công cụ</Link>
        <span className="mx-1.5">›</span>
        <span>Tính thời hiệu khởi kiện dân sự</span>
      </nav>

      <div className="flex items-center gap-3 mb-2">
        <div className="p-2.5 rounded-xl bg-red-700/10 text-red-700">
          <Hourglass className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Công cụ tính thời hiệu khởi kiện dân sự
        </h1>
      </div>
      <p className="text-gray-600 dark:text-gray-300 mb-8">
        Theo Điều 429, 588, 623 Bộ luật Dân sự 2015 — tranh chấp hợp đồng, bồi thường thiệt hại
        ngoài hợp đồng, và các yêu cầu liên quan đến thừa kế.
      </p>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Loại yêu cầu khởi kiện</label>
        <div className="flex flex-col gap-2 mb-4">
          {(Object.keys(CLAIM_TYPE_LABELS) as CivilClaimType[]).map((t) => (
            <button
              key={t} type="button" onClick={() => setClaimType(t)}
              className={`px-3 py-2 text-sm text-left rounded-lg border transition-colors ${claimType === t ? 'bg-red-700 text-white border-red-700' : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'}`}
            >
              {CLAIM_TYPE_LABELS[t]}
            </button>
          ))}
        </div>

        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{START_DATE_LABELS[claimType]}</label>
        <input
          type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white mb-5"
        />

        <button type="button" onClick={() => setSubmitted(true)} className="px-5 py-2.5 bg-red-700 hover:bg-red-800 text-white font-medium rounded-lg transition-colors">
          Tính thời hiệu
        </button>
      </div>

      {submitted && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-600 dark:text-gray-400">Thời hiệu khởi kiện</dt>
              <dd className="font-medium text-gray-900 dark:text-white">{result.limitationYears} năm</dd>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
              <dt className="text-gray-700 dark:text-gray-300 font-semibold">Hạn chót khởi kiện</dt>
              <dd className="font-bold text-red-700">{formatDate(result.deadline)}</dd>
            </div>
          </dl>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Một số yêu cầu không áp dụng thời hiệu khởi kiện (Điều 155 BLDS 2015): bảo vệ quyền
          nhân thân không gắn với tài sản, bảo vệ quyền sở hữu (trừ luật có quy định khác), và
          tranh chấp quyền sử dụng đất theo Luật Đất đai. Thời gian xảy ra sự kiện bất khả kháng
          hoặc trở ngại khách quan không tính vào thời hiệu (Điều 156) — công cụ chưa tính đến
          các trường hợp loại trừ này.
        </p>
      </div>
    </div>
  );
}
