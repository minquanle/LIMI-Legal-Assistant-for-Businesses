'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { HeartPulse } from 'lucide-react';
import {
  calculateHealthInsuranceCoverage,
  type BeneficiaryGroup,
  type ReferralScenario,
} from '@tinix-legal/shared';

const BENEFICIARY_LABELS: Record<BeneficiaryGroup, string> = {
  muc_100: '100% (người có công, trẻ dưới 6 tuổi, hộ nghèo, người từ đủ 75 tuổi...)',
  muc_95: '95% (người hưởng lương hưu, hộ cận nghèo)',
  muc_80: '80% (đối tượng khác — BHYT hộ gia đình thông thường)',
};

const REFERRAL_LABELS: Record<ReferralScenario, string> = {
  dung_quy_dinh_hoac_tu_den_ban_dau_co_ban: 'Đúng quy định, hoặc tự đến cơ sở cấp ban đầu/cấp cơ bản',
  cap_cuu: 'Cấp cứu (tại bất kỳ cơ sở nào)',
  tu_den_chuyen_sau_noi_tru: 'Tự đến cấp chuyên sâu, điều trị nội trú, không có giấy chuyển',
  tu_den_chuyen_sau_ngoai_tru: 'Tự đến cấp chuyên sâu, điều trị ngoại trú, không có giấy chuyển',
};

export default function TinhMucHuongBhytPage() {
  const [beneficiaryGroup, setBeneficiaryGroup] = useState<BeneficiaryGroup>('muc_80');
  const [referralScenario, setReferralScenario] = useState<ReferralScenario>('dung_quy_dinh_hoac_tu_den_ban_dau_co_ban');
  const [meetsFiveYear, setMeetsFiveYear] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const result = useMemo(
    () => calculateHealthInsuranceCoverage({ beneficiaryGroup, referralScenario, meetsFiveYearContinuousThreshold: meetsFiveYear }),
    [beneficiaryGroup, referralScenario, meetsFiveYear]
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <nav className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        <Link href="/cong-cu" className="hover:text-accent-600">Công cụ</Link>
        <span className="mx-1.5">›</span>
        <span>Tính mức hưởng bảo hiểm y tế</span>
      </nav>

      <div className="flex items-center gap-3 mb-2">
        <div className="p-2.5 rounded-xl bg-accent-600/10 text-accent-600">
          <HeartPulse className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Công cụ tính mức hưởng bảo hiểm y tế
        </h1>
      </div>
      <p className="text-gray-600 dark:text-gray-300 mb-8">
        Theo Luật Bảo hiểm y tế sửa đổi 2024 (số 51/2024/QH15), hiệu lực 01/7/2025 — dùng khái
        niệm cấp chuyên môn kỹ thuật (ban đầu, cơ bản, chuyên sâu) thay cho tuyến khám chữa bệnh
        cũ.
      </p>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nhóm đối tượng</label>
        <div className="flex flex-col gap-2 mb-4">
          {(Object.keys(BENEFICIARY_LABELS) as BeneficiaryGroup[]).map((g) => (
            <button
              key={g} type="button" onClick={() => setBeneficiaryGroup(g)}
              className={`px-3 py-2 text-sm text-left rounded-lg border transition-colors ${beneficiaryGroup === g ? 'bg-accent-600 text-white border-accent-600' : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'}`}
            >
              {BENEFICIARY_LABELS[g]}
            </button>
          ))}
        </div>

        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Tình huống khám chữa bệnh</label>
        <div className="flex flex-col gap-2 mb-4">
          {(Object.keys(REFERRAL_LABELS) as ReferralScenario[]).map((s) => (
            <button
              key={s} type="button" onClick={() => setReferralScenario(s)}
              className={`px-3 py-2 text-sm text-left rounded-lg border transition-colors ${referralScenario === s ? 'bg-accent-600 text-white border-accent-600' : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'}`}
            >
              {REFERRAL_LABELS[s]}
            </button>
          ))}
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 mb-5">
          <input
            type="checkbox" checked={meetsFiveYear}
            onChange={(e) => setMeetsFiveYear(e.target.checked)}
            className="rounded border-gray-300 dark:border-gray-600"
          />
          Đã tham gia BHYT liên tục ≥5 năm và số tiền cùng chi trả trong năm đã vượt ngưỡng
        </label>

        <button type="button" onClick={() => setSubmitted(true)} className="px-5 py-2.5 bg-accent-600 hover:bg-accent-700 text-white font-medium rounded-lg transition-colors">
          Tính mức hưởng
        </button>
      </div>

      {submitted && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
          {result.notCovered ? (
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Không được BHYT chi trả trong trường hợp này (tự đến cấp chuyên sâu, điều trị
              ngoại trú, không có giấy chuyển).
            </p>
          ) : (
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-600 dark:text-gray-400">Mức được hưởng theo nhóm đối tượng</dt>
                <dd className="font-medium text-gray-900 dark:text-white">{result.entitledRatePercent}%</dd>
              </div>
              {result.coveredForInpatientOnly && (
                <div className="flex justify-between">
                  <dt className="text-accent-600">Chỉ áp dụng cho điều trị nội trú</dt>
                  <dd className="font-medium text-accent-600">Có</dd>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                <dt className="text-gray-700 dark:text-gray-300 font-semibold">Mức hưởng thực tế</dt>
                <dd className="font-bold text-accent-600">{result.effectiveCoveragePercent}%</dd>
              </div>
            </dl>
          )}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Tự đến khám tại cơ sở cấp ban đầu/cấp cơ bản không thuộc nơi đăng ký ban đầu vẫn được
          hưởng đầy đủ mức quy định, không bị giới hạn theo địa giới hành chính. Tự đến cấp
          chuyên sâu mà không có giấy chuyển chỉ được thanh toán nội trú ở mức 40% mức hưởng,
          không thanh toán ngoại trú — trừ trường hợp cấp cứu hoặc mắc bệnh hiếm/bệnh hiểm nghèo
          được phép vượt cấp.
        </p>
      </div>
    </div>
  );
}
