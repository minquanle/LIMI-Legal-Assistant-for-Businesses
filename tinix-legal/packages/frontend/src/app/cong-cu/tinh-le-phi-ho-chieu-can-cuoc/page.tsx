'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { IdCard } from 'lucide-react';
import {
  calculatePassportFee,
  calculateIdCardFee,
  type PassportFeeType,
  type IdCardFeeType,
} from '@tinix-legal/shared';

const PASSPORT_TYPE_LABELS: Record<PassportFeeType, string> = {
  cap_moi: 'Cấp mới',
  cap_lai_hong_mat: 'Cấp lại do hỏng, mất',
};

const ID_CARD_TYPE_LABELS: Record<IdCardFeeType, string> = {
  cap_lan_dau: 'Cấp lần đầu',
  doi_theo_do_tuoi_hoac_chuyen_doi: 'Đổi khi đủ 25/40/60 tuổi hoặc chuyển đổi từ CCCD cũ',
  doi_hong_sai_thong_tin: 'Đổi do hỏng, sai thông tin',
  cap_lai_mat: 'Cấp lại do mất',
};

function formatVnd(n: number): string {
  return n.toLocaleString('vi-VN') + ' đ';
}

export default function TinhLePhiHoChieuCanCuocPage() {
  const [tab, setTab] = useState<'ho_chieu' | 'can_cuoc'>('ho_chieu');
  const [passportType, setPassportType] = useState<PassportFeeType>('cap_moi');
  const [applyReduction, setApplyReduction] = useState(true);
  const [idCardType, setIdCardType] = useState<IdCardFeeType>('doi_theo_do_tuoi_hoac_chuyen_doi');
  const [submitted, setSubmitted] = useState(false);

  const passportResult = useMemo(() => calculatePassportFee(passportType, applyReduction), [passportType, applyReduction]);
  const idCardFee = useMemo(() => calculateIdCardFee(idCardType), [idCardType]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <nav className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        <Link href="/cong-cu" className="hover:text-accent-600">Công cụ</Link>
        <span className="mx-1.5">›</span>
        <span>Tính lệ phí hộ chiếu, căn cước</span>
      </nav>

      <div className="flex items-center gap-3 mb-2">
        <div className="p-2.5 rounded-xl bg-accent-700/10 text-accent-700">
          <IdCard className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Công cụ tính lệ phí hộ chiếu, căn cước
        </h1>
      </div>
      <p className="text-gray-600 dark:text-gray-300 mb-8">
        Hộ chiếu phổ thông theo Thông tư 28/2026/TT-BTC; thẻ Căn cước theo Thông tư
        73/2024/TT-BTC.
      </p>

      <div className="flex gap-2 mb-6">
        <button
          type="button" onClick={() => { setTab('ho_chieu'); setSubmitted(false); }}
          className={`px-4 py-2 text-sm rounded-lg border transition-colors ${tab === 'ho_chieu' ? 'bg-accent-700 text-white border-accent-700' : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'}`}
        >
          Hộ chiếu phổ thông
        </button>
        <button
          type="button" onClick={() => { setTab('can_cuoc'); setSubmitted(false); }}
          className={`px-4 py-2 text-sm rounded-lg border transition-colors ${tab === 'can_cuoc' ? 'bg-accent-700 text-white border-accent-700' : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'}`}
        >
          Thẻ Căn cước
        </button>
      </div>

      {tab === 'ho_chieu' ? (
        <>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Loại yêu cầu</label>
            <div className="flex flex-wrap gap-2 mb-4">
              {(Object.keys(PASSPORT_TYPE_LABELS) as PassportFeeType[]).map((t) => (
                <button
                  key={t} type="button" onClick={() => setPassportType(t)}
                  className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${passportType === t ? 'bg-accent-700 text-white border-accent-700' : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'}`}
                >
                  {PASSPORT_TYPE_LABELS[t]}
                </button>
              ))}
            </div>

            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 mb-5">
              <input
                type="checkbox" checked={applyReduction}
                onChange={(e) => setApplyReduction(e.target.checked)}
                className="rounded border-gray-300 dark:border-gray-600"
              />
              Áp dụng giảm 50% tạm thời (hiệu lực 01/7/2025 – 31/12/2026)
            </label>

            <button type="button" onClick={() => setSubmitted(true)} className="px-5 py-2.5 bg-accent-700 hover:bg-accent-700 text-white font-medium rounded-lg transition-colors">
              Tính lệ phí
            </button>
          </div>

          {submitted && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-600 dark:text-gray-400">Mức thu theo quy định</dt>
                  <dd className="font-medium text-gray-900 dark:text-white">{formatVnd(passportResult.baseFee)}</dd>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                  <dt className="text-gray-700 dark:text-gray-300 font-semibold">Lệ phí thực nộp</dt>
                  <dd className="font-bold text-accent-700">{formatVnd(passportResult.payableFee)}</dd>
                </div>
              </dl>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Loại yêu cầu</label>
            <div className="flex flex-col gap-2 mb-5">
              {(Object.keys(ID_CARD_TYPE_LABELS) as IdCardFeeType[]).map((t) => (
                <button
                  key={t} type="button" onClick={() => setIdCardType(t)}
                  className={`px-3 py-2 text-sm text-left rounded-lg border transition-colors ${idCardType === t ? 'bg-accent-700 text-white border-accent-700' : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'}`}
                >
                  {ID_CARD_TYPE_LABELS[t]}
                </button>
              ))}
            </div>

            <button type="button" onClick={() => setSubmitted(true)} className="px-5 py-2.5 bg-accent-700 hover:bg-accent-700 text-white font-medium rounded-lg transition-colors">
              Tính lệ phí
            </button>
          </div>

          {submitted && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
              <dl className="flex justify-between text-sm">
                <dt className="text-gray-700 dark:text-gray-300 font-semibold">Lệ phí phải nộp</dt>
                <dd className="font-bold text-accent-700">{idCardFee === 0 ? 'Miễn phí' : formatVnd(idCardFee)}</dd>
              </dl>
            </div>
          )}
        </>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Thẻ Căn cước được miễn lệ phí đối với trẻ em, người cao tuổi, người khuyết tật, gia
          đình có công với cách mạng, đồng bào dân tộc thiểu số ở vùng khó khăn, hộ nghèo, cư dân
          biên giới/hải đảo (Điều 5 Thông tư 73/2024/TT-BTC).
        </p>
      </div>
    </div>
  );
}
