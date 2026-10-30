'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Beer } from 'lucide-react';
import {
  calculateSpecialConsumptionTax,
  type ScTaxCategory,
  type SpiritStrength,
  type GasolineType,
} from '@tinix-legal/shared';

const CATEGORY_LABELS: Record<ScTaxCategory, string> = {
  bia: 'Bia',
  ruou: 'Rượu',
  xang: 'Xăng',
  dieu_hoa: 'Điều hòa nhiệt độ',
  oto: 'Ô tô dưới 24 chỗ',
};

function formatVnd(n: number): string {
  return Math.round(n).toLocaleString('vi-VN') + ' đ';
}

export default function TinhThueTtdbPage() {
  const [category, setCategory] = useState<ScTaxCategory>('bia');
  const [price, setPrice] = useState('16500000');
  const [spiritStrength, setSpiritStrength] = useState<SpiritStrength>('tu_20_do_tro_len');
  const [gasolineType, setGasolineType] = useState<GasolineType>('thuong');
  const [btu, setBtu] = useState('24000');
  const [engineCc, setEngineCc] = useState('2000');
  const [submitted, setSubmitted] = useState(false);

  const sellingPriceExclVat = Number(price) || 0;
  const result = useMemo(
    () =>
      calculateSpecialConsumptionTax({
        category,
        sellingPriceExclVat,
        spiritStrength,
        gasolineType,
        btu: Number(btu) || 0,
        engineCc: Number(engineCc) || 0,
      }),
    [category, sellingPriceExclVat, spiritStrength, gasolineType, btu, engineCc]
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <nav className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        <Link href="/cong-cu" className="hover:text-accent-600">Công cụ</Link>
        <span className="mx-1.5">›</span>
        <span>Tính thuế tiêu thụ đặc biệt</span>
      </nav>

      <div className="flex items-center gap-3 mb-2">
        <div className="p-2.5 rounded-xl bg-accent-600/10 text-accent-600">
          <Beer className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Công cụ tính thuế tiêu thụ đặc biệt (TTĐB)
        </h1>
      </div>
      <p className="text-gray-600 dark:text-gray-300 mb-8">
        Áp dụng biểu thuế suất từ 01/01/2026 theo Luật Thuế tiêu thụ đặc biệt số 66/2025/QH15,
        cho các nhóm: bia, rượu, xăng, điều hòa nhiệt độ, ô tô dưới 24 chỗ.
      </p>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nhóm hàng</label>
        <div className="flex flex-wrap gap-2 mb-4">
          {(Object.keys(CATEGORY_LABELS) as ScTaxCategory[]).map((c) => (
            <button
              key={c} type="button" onClick={() => setCategory(c)}
              className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${category === c ? 'bg-accent-600 text-white border-accent-600' : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'}`}
            >
              {CATEGORY_LABELS[c]}
            </button>
          ))}
        </div>

        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Giá bán chưa có thuế GTGT (đồng)</label>
        <input
          type="number" value={price} onChange={(e) => setPrice(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white mb-4"
        />

        {category === 'ruou' && (
          <>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nồng độ cồn</label>
            <div className="flex flex-wrap gap-2 mb-4">
              {(['tu_20_do_tro_len', 'duoi_20_do'] as SpiritStrength[]).map((s) => (
                <button
                  key={s} type="button" onClick={() => setSpiritStrength(s)}
                  className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${spiritStrength === s ? 'bg-accent-600 text-white border-accent-600' : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'}`}
                >
                  {s === 'tu_20_do_tro_len' ? 'Từ 20 độ trở lên' : 'Dưới 20 độ'}
                </button>
              ))}
            </div>
          </>
        )}

        {category === 'xang' && (
          <>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Loại xăng</label>
            <div className="flex flex-wrap gap-2 mb-4">
              {(['thuong', 'e5', 'e10'] as GasolineType[]).map((g) => (
                <button
                  key={g} type="button" onClick={() => setGasolineType(g)}
                  className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${gasolineType === g ? 'bg-accent-600 text-white border-accent-600' : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'}`}
                >
                  {g === 'thuong' ? 'Xăng thường' : g.toUpperCase()}
                </button>
              ))}
            </div>
          </>
        )}

        {category === 'dieu_hoa' && (
          <>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Công suất (BTU)</label>
            <input
              type="number" value={btu} onChange={(e) => setBtu(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white mb-4"
            />
          </>
        )}

        {category === 'oto' && (
          <>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Dung tích xi-lanh (cm³)</label>
            <input
              type="number" value={engineCc} onChange={(e) => setEngineCc(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white mb-4"
            />
          </>
        )}

        <button type="button" onClick={() => setSubmitted(true)} className="px-5 py-2.5 bg-accent-600 hover:bg-accent-700 text-white font-medium rounded-lg transition-colors">
          Tính thuế TTĐB
        </button>
      </div>

      {submitted && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
          {result.exempt ? (
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Mặt hàng này không thuộc diện chịu thuế tiêu thụ đặc biệt theo thông số đã nhập.
            </p>
          ) : (
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-600 dark:text-gray-400">Thuế suất áp dụng</dt>
                <dd className="font-medium text-gray-900 dark:text-white">{result.ratePercent}%</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600 dark:text-gray-400">Giá tính thuế TTĐB</dt>
                <dd className="font-medium text-gray-900 dark:text-white">{formatVnd(result.taxBase)}</dd>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                <dt className="text-gray-700 dark:text-gray-300 font-semibold">Thuế TTĐB phải nộp</dt>
                <dd className="font-bold text-accent-600">{formatVnd(result.tax)}</dd>
              </div>
            </dl>
          )}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Công thức: Giá tính thuế TTĐB = Giá bán chưa VAT / (1 + Thuế suất TTĐB); Thuế TTĐB phải
          nộp = Giá tính thuế TTĐB × Thuế suất. Công cụ chưa bao gồm thuốc lá (áp dụng thêm mức
          thuế tuyệt đối theo đơn vị từ 2027) và ô tô điện (biểu thuế theo lộ trình riêng) — vui
          lòng tra cứu văn bản gốc cho hai nhóm này.
        </p>
      </div>
    </div>
  );
}
