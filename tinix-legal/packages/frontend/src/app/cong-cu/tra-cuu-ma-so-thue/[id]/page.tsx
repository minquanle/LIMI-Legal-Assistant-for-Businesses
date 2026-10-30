'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Building2, ArrowLeft, User, MapPin, Calendar, FileText, ExternalLink } from 'lucide-react';

const API_BASE = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001');

interface CompanyData {
  taxCode: string;
  legalName: string;
  status: string;
  address: string;
  legalRepresentative: string;
  registrationDate: string;
  operationStartDate: string;
  fiscalYearEnd: string;
  businessLines: string[];
  url: string;
}

export default function CompanyDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [data, setData] = useState<CompanyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`${API_BASE}/api/reference/tax-registry/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error('not found');
        return res.json();
      })
      .then((res) => setData(res.item.data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="container mx-auto px-4 py-8 max-w-3xl text-gray-500">Đang tải...</div>;
  }

  if (notFound || !data) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <p className="text-gray-500 mb-4">Không tìm thấy doanh nghiệp này.</p>
        <Link href="/cong-cu/tra-cuu-ma-so-thue" className="text-accent-600 hover:underline">
          ← Quay lại tra cứu
        </Link>
      </div>
    );
  }

  // Business lines come as a flat [code, name, code, name, ...] pair list.
  const lines: Array<{ code: string; name: string }> = [];
  for (let i = 0; i < (data.businessLines || []).length; i += 2) {
    lines.push({ code: data.businessLines[i], name: data.businessLines[i + 1] });
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <nav className="text-sm text-gray-500 dark:text-gray-400 mb-4 flex items-center gap-1.5">
        <Link href="/cong-cu" className="hover:text-accent-600">Công cụ</Link>
        <span className="mx-1">›</span>
        <Link href="/cong-cu/tra-cuu-ma-so-thue" className="hover:text-accent-600">Tra cứu mã số thuế</Link>
      </nav>

      <div className="flex items-center gap-3 mb-3">
        <div className="p-2.5 rounded-xl bg-blue-600/10 text-blue-600">
          <Building2 className="w-6 h-6" />
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{data.legalName}</h1>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6 space-y-3">
        <div>
          <span className="text-xs uppercase tracking-wide text-gray-500 block mb-0.5">Mã số thuế</span>
          <span className="text-lg font-bold font-mono text-blue-600">{data.taxCode}</span>
        </div>
        {data.status && (
          <div className="inline-block px-3 py-1 rounded-full bg-accent-50 dark:bg-accent-700/20 text-accent-700 dark:text-accent-300 text-sm font-medium">
            {data.status}
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-sm">
          {data.legalRepresentative && (
            <div className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
              <User className="w-4 h-4 mt-0.5 text-gray-400 shrink-0" />
              <span>Đại diện: <span className="font-medium">{data.legalRepresentative}</span></span>
            </div>
          )}
          {data.address && (
            <div className="flex items-start gap-2 text-gray-700 dark:text-gray-300 sm:col-span-2">
              <MapPin className="w-4 h-4 mt-0.5 text-gray-400 shrink-0" />
              <span>{data.address}</span>
            </div>
          )}
          {data.registrationDate && (
            <div className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
              <Calendar className="w-4 h-4 mt-0.5 text-gray-400 shrink-0" />
              <span>Ngày đăng ký: <span className="font-medium">{data.registrationDate}</span></span>
            </div>
          )}
          {data.fiscalYearEnd && (
            <div className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
              <FileText className="w-4 h-4 mt-0.5 text-gray-400 shrink-0" />
              <span>Kết thúc năm tài chính: <span className="font-medium">{data.fiscalYearEnd}</span></span>
            </div>
          )}
        </div>
      </div>

      {lines.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
            Ngành nghề kinh doanh ({lines.length})
          </h2>
          <ul className="space-y-1.5 text-sm">
            {lines.map((l, i) => (
              <li key={i} className="flex gap-2 text-gray-700 dark:text-gray-300">
                <span className="shrink-0 font-mono text-xs text-gray-400 mt-0.5">{l.code}</span>
                <span>{l.name}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-xs text-gray-400 mb-4">
        Dữ liệu tổng hợp từ Cổng thông tin quốc gia về đăng ký doanh nghiệp, chỉ mang tính tham khảo.
        {data.url && (
          <>
            {' '}
            <a href={data.url} target="_blank" rel="noopener noreferrer" className="text-accent-600 hover:underline inline-flex items-center gap-1">
              Nguồn <ExternalLink className="w-3 h-3" />
            </a>
          </>
        )}
      </p>

      <Link href="/cong-cu/tra-cuu-ma-so-thue" className="inline-flex items-center gap-1.5 text-sm text-accent-600 hover:underline">
        <ArrowLeft className="w-4 h-4" /> Quay lại tra cứu
      </Link>
    </div>
  );
}
