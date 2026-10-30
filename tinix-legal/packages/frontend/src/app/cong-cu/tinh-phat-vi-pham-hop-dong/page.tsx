'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { ScrollText } from 'lucide-react';
import { calculateContractPenalty, type ContractType } from '@tinix-legal/shared';

const CONTRACT_TYPE_LABELS: Record<ContractType, string> = {
  thuong_mai: 'Hợp đồng thương mại (giới hạn tối đa 8%)',
  dan_su: 'Hợp đồng dân sự (không giới hạn mức trần)',
};

function formatVnd(n: number): string {
  return Math.round(n).toLocaleString('vi-VN') + ' đ';
}

export default function TinhPhatViPhamHopDongPage() {
  const [contractType, setContractType] = useState<ContractType>('thuong_mai');
  const [breachedObligationValue, setBreachedObligationValue] = useState('500000000');
  const [agreedPenaltyPercent, setAgreedPenaltyPercent] = useState('10');
  const [submitted, setSubmitted] = useState(false);

  const result = useMemo(
    () =>
      calculateContractPenalty({
        contractType,
        breachedObligationValue: Number(breachedObligationValue) || 0,
        agreedPenaltyPercent: Number(agreedPenaltyPercent) || 0,
      }),
    [contractType, breachedObligationValue, agreedPenaltyPercent]
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <nav className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        <Link href="/cong-cu" className="hover:text-accent-600">Công cụ</Link>
        <span className="mx-1.5">›</span>
        <span>Tính mức phạt vi phạm hợp đồng</span>
      </nav>

      <div className="flex items-center gap-3 mb-2">
        <div className="p-2.5 rounded-xl bg-slate-600/10 text-slate-600">
          <ScrollText className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Công cụ tính mức phạt vi phạm hợp đồng
        </h1>
      </div>
      <p className="text-gray-600 dark:text-gray-300 mb-8">
        Hợp đồng thương mại bị giới hạn tối đa 8% giá trị phần nghĩa vụ bị vi phạm (Điều 301 Luật
        Thương mại 2005); hợp đồng dân sự không có mức trần, do các bên tự thỏa thuận (Điều 418
        Bộ luật Dân sự 2015).
      </p>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Loại hợp đồng</label>
        <div className="flex flex-wrap gap-2 mb-4">
          {(Object.keys(CONTRACT_TYPE_LABELS) as ContractType[]).map((t) => (
            <button
              key={t} type="button" onClick={() => setContractType(t)}
              className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${contractType === t ? 'bg-slate-600 text-white border-slate-600' : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'}`}
            >
              {CONTRACT_TYPE_LABELS[t]}
            </button>
          ))}
        </div>

        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Giá trị phần nghĩa vụ hợp đồng bị vi phạm (đồng)</label>
        <input
          type="number" value={breachedObligationValue} onChange={(e) => setBreachedObligationValue(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white mb-4"
        />

        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Mức phạt các bên đã thỏa thuận (%)</label>
        <input
          type="number" step="0.1" value={agreedPenaltyPercent} onChange={(e) => setAgreedPenaltyPercent(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white mb-5"
        />

        <button type="button" onClick={() => setSubmitted(true)} className="px-5 py-2.5 bg-slate-600 hover:bg-slate-700 text-white font-medium rounded-lg transition-colors">
          Tính mức phạt
        </button>
      </div>

      {submitted && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
          <dl className="space-y-2 text-sm">
            {result.capped && (
              <div className="flex justify-between">
                <dt className="text-accent-600">Mức thỏa thuận vượt trần — đã giới hạn lại</dt>
                <dd className="font-medium text-accent-600">{result.appliedPenaltyPercent}%</dd>
              </div>
            )}
            {!result.capped && (
              <div className="flex justify-between">
                <dt className="text-gray-600 dark:text-gray-400">Mức phạt áp dụng</dt>
                <dd className="font-medium text-gray-900 dark:text-white">{result.appliedPenaltyPercent}%</dd>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
              <dt className="text-gray-700 dark:text-gray-300 font-semibold">Tiền phạt vi phạm hợp đồng</dt>
              <dd className="font-bold text-slate-600">{formatVnd(result.penaltyAmount)}</dd>
            </div>
          </dl>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Mức trần 8% chỉ áp dụng cho phạt vi phạm hợp đồng thương mại và tính trên giá trị phần
          nghĩa vụ bị vi phạm, không phải toàn bộ giá trị hợp đồng. Tiền phạt vi phạm khác với
          tiền bồi thường thiệt hại (không có mức trần, tính theo thiệt hại thực tế).
        </p>
      </div>
    </div>
  );
}
