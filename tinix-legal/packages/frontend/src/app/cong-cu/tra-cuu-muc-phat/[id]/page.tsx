'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

const API_BASE = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001');

interface ViolationItem {
  id: string;
  behavior: string;
  field: string;
  vehicleType: string;
  category: string;
  fineIndividualMin: string | null;
  fineIndividualMax: string | null;
  fineOrgMin: string | null;
  fineOrgMax: string | null;
  pointsDeducted: number | null;
  citation: string;
  sourceDocNumber: string;
  sourceDocId: string;
  dieuOrdinal: string;
}

function formatVND(v: string | null): string | null {
  if (v === null) return null;
  return Number(v).toLocaleString('vi-VN') + ' đ';
}

function formatFineRange(min: string | null, max: string | null): string {
  const minF = formatVND(min);
  const maxF = formatVND(max);
  if (!minF) return '—';
  if (minF === maxF) return minF;
  return `${minF} – ${maxF}`;
}

export default function ViolationDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [item, setItem] = useState<ViolationItem | null>(null);
  const [sameAcrossVehicles, setSameAcrossVehicles] = useState<ViolationItem[]>([]);
  const [relatedInSameArticle, setRelatedInSameArticle] = useState<ViolationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`${API_BASE}/api/admin-violations/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error('not found');
        return res.json();
      })
      .then((data) => {
        setItem(data.item);
        setSameAcrossVehicles(data.sameAcrossVehicles || []);
        setRelatedInSameArticle(data.relatedInSameArticle || []);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="container mx-auto px-4 py-8 max-w-3xl text-gray-500">Đang tải...</div>;
  }

  if (notFound || !item) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <p className="text-gray-500 mb-4">Không tìm thấy hành vi vi phạm này.</p>
        <Link href="/cong-cu/tra-cuu-muc-phat" className="text-accent-600 hover:underline">
          ← Quay lại tra cứu
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <nav className="text-sm text-gray-500 dark:text-gray-400 mb-4 flex items-center gap-1.5">
        <Link href="/cong-cu" className="hover:text-accent-600">Công cụ</Link>
        <span className="mx-1">›</span>
        <Link href="/cong-cu/tra-cuu-muc-phat" className="hover:text-accent-600">Mức phạt giao thông</Link>
        {item.vehicleType && (
          <>
            <span className="mx-1">›</span>
            <span>{item.vehicleType}</span>
          </>
        )}
      </nav>

      <div className="flex items-center gap-3 mb-3">
        <div className="p-2.5 rounded-xl bg-red-600/10 text-red-600">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{item.behavior}</h1>
      </div>
      {item.vehicleType && (
        <p className="text-sm text-gray-500 mb-6">Áp dụng với {item.vehicleType} · nhóm {item.category}</p>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
        <h2 className="text-xs uppercase tracking-wide text-gray-500 mb-1">Mức phạt</h2>
        <div className="text-2xl font-bold text-red-600 mb-1">
          {formatFineRange(item.fineIndividualMin, item.fineIndividualMax)}
          <span className="text-sm font-normal text-gray-500 ml-2">(cá nhân)</span>
        </div>
        {item.fineOrgMin && (
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            Tổ chức: <span className="font-semibold">{formatFineRange(item.fineOrgMin, item.fineOrgMax)}</span>
          </div>
        )}
        <p className="text-sm text-gray-500 mb-3">Theo {item.citation}</p>
        {item.pointsDeducted && (
          <div className="inline-block px-3 py-1 rounded-full bg-accent-100 dark:bg-accent-700/30 text-accent-700 dark:text-accent-400 text-sm font-medium">
            Trừ {item.pointsDeducted} điểm giấy phép lái xe
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Trích dẫn quy định trong văn bản</h2>
        <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">{item.behavior}</p>
        <p className="text-xs text-gray-500">
          Căn cứ: <span className="font-medium">{item.citation}</span> — xem toàn văn tại{' '}
          <Link href={`/van-ban/${item.sourceDocId}`} className="text-accent-600 hover:underline">
            {item.sourceDocNumber}
          </Link>.
        </p>
      </div>

      {sameAcrossVehicles.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Cùng hành vi này ở phương tiện khác</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-gray-500 border-b border-gray-200 dark:border-gray-700">
                  <th className="py-2 pr-2">Phương tiện</th>
                  <th className="py-2 pr-2 text-right">Mức phạt</th>
                  <th className="py-2 pr-2 text-right">Trừ điểm</th>
                </tr>
              </thead>
              <tbody>
                {sameAcrossVehicles.map((v) => (
                  <tr key={v.id} className="border-b border-gray-50 dark:border-gray-700/50">
                    <td className="py-2 pr-2 text-gray-700 dark:text-gray-300">
                      <Link href={`/cong-cu/tra-cuu-muc-phat/${v.id}`} className="hover:text-accent-600">
                        {v.vehicleType || '—'}
                      </Link>
                    </td>
                    <td className="py-2 pr-2 text-right font-medium text-gray-900 dark:text-white">
                      {formatFineRange(v.fineIndividualMin, v.fineIndividualMax)}
                    </td>
                    <td className="py-2 pr-2 text-right text-gray-500">{v.pointsDeducted ? `${v.pointsDeducted} điểm` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {relatedInSameArticle.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Lỗi liên quan (cùng Điều {item.dieuOrdinal})</h2>
          <ul className="space-y-2">
            {relatedInSameArticle.map((v) => (
              <li key={v.id}>
                <Link href={`/cong-cu/tra-cuu-muc-phat/${v.id}`} className="text-sm text-gray-700 dark:text-gray-300 hover:text-accent-600 flex justify-between gap-2">
                  <span className="flex-1">{v.behavior}</span>
                  <span className="shrink-0 font-medium">{formatFineRange(v.fineIndividualMin, v.fineIndividualMax)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-xs text-gray-400 mb-6">
        Trang này là công cụ tra cứu, không thay thế quyết định xử phạt của cơ quan có thẩm quyền.
        Mức phạt thực tế do người có thẩm quyền quyết định trong khung mà nghị định quy định.
      </p>

      <Link href="/cong-cu/tra-cuu-muc-phat" className="inline-flex items-center gap-1.5 text-sm text-accent-600 hover:underline">
        <ArrowLeft className="w-4 h-4" /> Quay lại tra cứu
      </Link>
    </div>
  );
}
