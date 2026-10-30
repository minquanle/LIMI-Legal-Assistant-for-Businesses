'use client';

import React from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';

export default function OfflinePage() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 px-4 text-center">
      <div className="bg-amber-100 dark:bg-amber-950/40 p-4 rounded-full text-amber-600 dark:text-amber-400 mb-4">
        <WifiOff className="w-12 h-12" />
      </div>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">Mất kết nối mạng</h1>
      <p className="text-slate-600 dark:text-slate-400 max-w-md mb-6 text-sm">
        Bạn đang ở chế độ ngoại tuyến (Offline). Vui lòng kiểm tra kết nối Internet để tiếp tục tra cứu dữ liệu mới nhất.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-5 py-2.5 rounded-xl text-sm transition shadow-md"
      >
        <RefreshCw className="w-4 h-4" />
        Thử lại
      </button>
    </div>
  );
}
