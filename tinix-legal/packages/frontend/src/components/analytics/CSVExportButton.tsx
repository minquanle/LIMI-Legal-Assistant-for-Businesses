'use client';
import React from 'react';

export default function CSVExportButton({ data }: { data: any[] }) {
  const handleExport = () => {
    if (data.length === 0) return;
    
    // Convert to CSV
    // Ensure "year" is first
    const docTypes = new Set<string>();
    data.forEach(d => Object.keys(d).forEach(k => {
      if (k !== 'year') docTypes.add(k);
    }));

    const headers = ['year', ...Array.from(docTypes)];
    
    const rows = data.map(row => {
      return headers.map(header => {
        const val = row[header] ?? 0;
        return `"${val}"`;
      }).join(',');
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'xu_huong_ban_hanh.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <button 
      onClick={handleExport}
      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition flex items-center"
    >
      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
      Xuất CSV
    </button>
  );
}
