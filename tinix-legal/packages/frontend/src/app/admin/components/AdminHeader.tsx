'use client';
import React from 'react';
import Link from 'next/link';
import { BarChart3, AlertTriangle, Activity, RefreshCw, LayoutGrid } from 'lucide-react';

interface AdminHeaderProps {
  activeTab: 'stats' | 'quality' | 'crawler';
  onRefresh: () => void;
  loading: boolean;
  badges?: {
    qualityCount?: number;
    crawlerRunning?: boolean;
  };
}

export function AdminHeader({ activeTab, onRefresh, loading, badges }: AdminHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-6">
      <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
        <Link
          href="/admin"
          aria-label="Về trang tổng quan Quản trị"
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs md:text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-900 transition-all border-r border-slate-800 mr-1 pr-3"
        >
          <LayoutGrid className="w-4 h-4" aria-hidden="true" />
        </Link>
        <Link
          href="/admin/stats"
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition-all ${
            activeTab === 'stats' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Thống kê Số liệu</span>
        </Link>
        <Link
          href="/admin/quality"
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition-all ${
            activeTab === 'quality' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Chất lượng DL</span>
          {badges?.qualityCount ? (
            <span className="ml-1 px-1.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-[10px]">
              {badges.qualityCount}
            </span>
          ) : null}
        </Link>
        <Link
          href="/admin/crawler"
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition-all ${
            activeTab === 'crawler' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Crawler</span>
          {badges?.crawlerRunning ? (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          ) : null}
        </Link>
      </div>
      <button
        onClick={onRefresh}
        disabled={loading}
        className="flex items-center gap-1.5 px-3 py-2 text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700 disabled:opacity-50"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        <span>Làm mới</span>
      </button>
    </div>
  );
}
