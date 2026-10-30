export const dynamic = 'force-dynamic';

import React from 'react';
import TrendLineChart from '@/components/analytics/TrendLineChart';
import DocumentTypeBarChart from '@/components/analytics/DocumentTypeBarChart';
import CSVExportButton from '@/components/analytics/CSVExportButton';
import { DOCUMENT_TYPE_LABELS } from '@/lib/document-labels';

export default async function TrendsPage() {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4001';
  let trendsData = { trends: [], summary: [] };
  
  try {
    const res = await fetch(`${backendUrl}/api/analytics/trends`, { cache: 'no-store' });
    if (res.ok) {
      trendsData = await res.json();
    }
  } catch (err) {
    console.error('Error fetching trends:', err);
  }

  // Get distinct document types from trends
  const docTypesSet = new Set<string>();
  trendsData.trends.forEach((t: any) => {
    Object.keys(t).forEach(k => {
      if (k !== 'year') docTypesSet.add(k);
    });
  });
  const docTypes = Array.from(docTypesSet);

  const summaryWithLabels = trendsData.summary.map((s: any) => ({
    ...s,
    name: DOCUMENT_TYPE_LABELS[s.name] || s.name,
  }));

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Phân Tích Xu Hướng Ban Hành</h1>
          <p className="text-gray-500 mt-2">Dữ liệu phân tích từ kho văn bản pháp luật</p>
        </div>
        
        <CSVExportButton data={trendsData.trends} />
      </div>

      <div className="grid grid-cols-1 gap-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">Xu hướng ban hành qua các năm</h2>
          <TrendLineChart data={trendsData.trends} docTypes={docTypes} />
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">Phân bổ loại văn bản</h2>
          <DocumentTypeBarChart data={summaryWithLabels} />
        </div>
      </div>
    </div>
  );
}
