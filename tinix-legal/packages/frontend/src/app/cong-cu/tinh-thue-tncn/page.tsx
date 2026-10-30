'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Calculator, Info } from 'lucide-react';
import { calculatePersonalIncomeTax, PERSONAL_DEDUCTION_MONTHLY, DEPENDENT_DEDUCTION_MONTHLY, TAX_BRACKETS } from '@tinix-legal/shared';

const QUICK_AMOUNTS = [10, 15, 20, 30, 50, 80];

function formatVND(n: number): string {
  return Math.round(n).toLocaleString('vi-VN') + ' VNĐ';
}

export default function TinhThueTNCNPage() {
  const [incomeInput, setIncomeInput] = useState('20000000');
  const [dependents, setDependents] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const income = Number(incomeInput.replace(/[^\d]/g, '')) || 0;
  const result = useMemo(() => calculatePersonalIncomeTax(income, dependents), [income, dependents]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <nav className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        <Link href="/cong-cu" className="hover:text-accent-600">Công cụ</Link>
        <span className="mx-1.5">›</span>
        <span>Tính thuế TNCN</span>
      </nav>

      <div className="flex items-center gap-3 mb-2">
        <div className="p-2.5 rounded-xl bg-accent-600/10 text-accent-600">
          <Calculator className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Công cụ tính thuế thu nhập cá nhân (TNCN)
        </h1>
      </div>
      <p className="text-gray-600 dark:text-gray-300 mb-8">
        Tính số thuế TNCN phải nộp từ thu nhập tháng theo biểu thuế lũy tiến từng phần 7 bậc,
        kèm diễn giải chi tiết từng bậc — dựa trên mức giảm trừ gia cảnh hiện hành theo Nghị
        quyết 110/2025/UBTVQH15.
      </p>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Nhập thông tin</h2>

        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Tổng thu nhập tháng <span className="text-red-500">*</span>
        </label>
        <div className="flex items-center gap-2 mb-1.5">
          <input
            type="text"
            inputMode="numeric"
            value={Number(incomeInput.replace(/[^\d]/g, '') || 0).toLocaleString('vi-VN')}
            onChange={(e) => setIncomeInput(e.target.value)}
            placeholder="VD: 20.000.000"
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-500"
          />
          <span className="text-sm text-gray-500 shrink-0">VNĐ</span>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          Thu nhập đã trừ các khoản BHXH/BHYT/BHTN (nếu có). Chưa trừ? Dùng{' '}
          <Link href="/cong-cu/tinh-luong" className="text-accent-600 hover:underline">
            công cụ tính lương Gross → Net
          </Link>.
        </p>

        <div className="flex flex-wrap gap-2 mb-5">
          <span className="text-xs text-gray-500 self-center mr-1">Chọn nhanh:</span>
          {QUICK_AMOUNTS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setIncomeInput(String(m * 1_000_000))}
              className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                income === m * 1_000_000
                  ? 'bg-accent-600 text-white border-accent-600'
                  : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-accent-400'
              }`}
            >
              {m} triệu
            </button>
          ))}
        </div>

        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Số người phụ thuộc <span className="text-red-500">*</span>
        </label>
        <div className="flex items-center gap-3 mb-1.5">
          <button
            type="button"
            onClick={() => setDependents((d) => Math.max(0, d - 1))}
            className="w-9 h-9 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            −
          </button>
          <span className="w-10 text-center text-lg font-semibold text-gray-900 dark:text-white">{dependents}</span>
          <button
            type="button"
            onClick={() => setDependents((d) => d + 1)}
            className="w-9 h-9 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            +
          </button>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-5">
          Mỗi người phụ thuộc được giảm trừ {formatVND(DEPENDENT_DEDUCTION_MONTHLY)}/tháng.
        </p>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setSubmitted(true)}
            className="px-5 py-2.5 bg-accent-600 hover:bg-accent-700 text-white font-medium rounded-lg transition-colors"
          >
            Tính thuế
          </button>
          <button
            type="button"
            onClick={() => {
              setIncomeInput('20000000');
              setDependents(0);
              setSubmitted(false);
            }}
            className="px-5 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Nhập lại
          </button>
        </div>
      </div>

      {submitted && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Kết quả tính thuế TNCN</h2>

          <div className="text-center py-4 border-b border-gray-100 dark:border-gray-700 mb-4">
            <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">Tổng thuế phải nộp</div>
            <div className="text-3xl font-bold text-accent-600">{formatVND(result.totalTax)}</div>
            <div className="text-sm text-gray-500 mt-1">
              Thực nhận sau thuế: {formatVND(result.netIncome)} · Thuế suất hiệu dụng:{' '}
              {(result.effectiveRate * 100).toFixed(2)}%
            </div>
          </div>

          <dl className="space-y-2 text-sm mb-4">
            <div className="flex justify-between">
              <dt className="text-gray-600 dark:text-gray-400">Tổng thu nhập tháng</dt>
              <dd className="font-medium text-gray-900 dark:text-white">{formatVND(result.monthlyIncome)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600 dark:text-gray-400">Giảm trừ bản thân</dt>
              <dd className="font-medium text-red-500">− {formatVND(result.personalDeduction)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600 dark:text-gray-400">Giảm trừ phụ thuộc ({result.numDependents} người)</dt>
              <dd className="font-medium text-red-500">− {formatVND(result.dependentDeduction)}</dd>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
              <dt className="text-gray-700 dark:text-gray-300 font-medium">Thu nhập tính thuế</dt>
              <dd className="font-semibold text-gray-900 dark:text-white">{formatVND(result.taxableIncome)}</dd>
            </div>
          </dl>

          {result.breakdown.length === 0 ? (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-accent-50 dark:bg-accent-700/20 text-accent-700 dark:text-accent-400 text-sm">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Thu nhập sau khi giảm trừ ≤ 0 — bạn không phải nộp thuế TNCN.</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 text-left text-xs uppercase text-gray-500">
                    <th className="py-2 pr-2">Bậc</th>
                    <th className="py-2 pr-2">Thu nhập tính thuế/tháng</th>
                    <th className="py-2 pr-2">Thuế suất</th>
                    <th className="py-2 pr-2 text-right">Số thuế</th>
                  </tr>
                </thead>
                <tbody>
                  {result.breakdown.map((b) => (
                    <tr key={b.bracket} className="border-b border-gray-50 dark:border-gray-700/50">
                      <td className="py-2 pr-2 text-gray-900 dark:text-white">{b.bracket}</td>
                      <td className="py-2 pr-2 text-gray-600 dark:text-gray-400">{b.rangeLabel}</td>
                      <td className="py-2 pr-2 text-gray-600 dark:text-gray-400">{(b.rate * 100).toFixed(0)}%</td>
                      <td className="py-2 pr-2 text-right font-medium text-gray-900 dark:text-white">
                        {formatVND(b.taxInBracket)}
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <td colSpan={3} className="py-2 pr-2 font-semibold text-gray-900 dark:text-white">
                      Tổng thuế phải nộp
                    </td>
                    <td className="py-2 pr-2 text-right font-bold text-accent-600">{formatVND(result.totalTax)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
        <h2 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Cách tính thuế thu nhập cá nhân</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          Thuế TNCN đối với thu nhập từ tiền lương, tiền công của cá nhân cư trú được tính
          theo phương pháp lũy tiến từng phần: thu nhập càng cao thì phần vượt lên chịu thuế
          suất càng lớn.
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 font-medium">Công thức:</p>
        <ul className="text-sm text-gray-600 dark:text-gray-400 list-disc pl-5 mb-4 space-y-1">
          <li>Thu nhập tính thuế = Tổng thu nhập − Bảo hiểm bắt buộc − Giảm trừ gia cảnh.</li>
          <li>
            Giảm trừ gia cảnh = {formatVND(PERSONAL_DEDUCTION_MONTHLY)} (bản thân) +{' '}
            {formatVND(DEPENDENT_DEDUCTION_MONTHLY)} × số người phụ thuộc.
          </li>
          <li>Thuế TNCN phải nộp = tổng số thuế của từng bậc trong biểu thuế lũy tiến 7 bậc.</li>
        </ul>

        <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">Bảng thuế suất TNCN (lũy tiến từng phần)</p>
        <div className="overflow-x-auto mb-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 text-left text-xs uppercase text-gray-500">
                <th className="py-2 pr-2">Bậc</th>
                <th className="py-2 pr-2">Thu nhập tính thuế / tháng</th>
                <th className="py-2 pr-2">Thuế suất</th>
              </tr>
            </thead>
            <tbody>
              {TAX_BRACKETS.map((b, i) => (
                <tr key={b.bracket} className="border-b border-gray-50 dark:border-gray-700/50">
                  <td className="py-2 pr-2 text-gray-900 dark:text-white">{b.bracket}</td>
                  <td className="py-2 pr-2 text-gray-600 dark:text-gray-400">
                    {b.upTo === null
                      ? `Trên ${(TAX_BRACKETS[i - 1].upTo! / 1_000_000).toLocaleString('vi-VN')} triệu đồng`
                      : i === 0
                        ? `Đến ${(b.upTo / 1_000_000).toLocaleString('vi-VN')} triệu đồng`
                        : `Trên ${(TAX_BRACKETS[i - 1].upTo! / 1_000_000).toLocaleString('vi-VN')} - ${(b.upTo / 1_000_000).toLocaleString('vi-VN')} triệu đồng`}
                  </td>
                  <td className="py-2 pr-2 text-gray-600 dark:text-gray-400">{(b.rate * 100).toFixed(0)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-3 rounded-lg bg-accent-50 dark:bg-accent-700/20 text-accent-700 dark:text-accent-200 text-xs space-y-1">
          <p>Áp dụng mức giảm trừ gia cảnh theo Nghị quyết 110/2025/UBTVQH15 (từ kỳ tính thuế năm 2026).</p>
          <p>Giảm trừ bản thân: {formatVND(PERSONAL_DEDUCTION_MONTHLY)}/tháng ({(PERSONAL_DEDUCTION_MONTHLY * 12 / 1_000_000).toLocaleString('vi-VN')} triệu/năm).</p>
          <p>Giảm trừ phụ thuộc: {formatVND(DEPENDENT_DEDUCTION_MONTHLY)}/tháng/người.</p>
          <p>Kết quả mang tính tham khảo. Để biết chính xác, vui lòng liên hệ cơ quan thuế.</p>
        </div>
      </div>
    </div>
  );
}
