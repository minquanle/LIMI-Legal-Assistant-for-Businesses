'use client';

import React, { useState, useEffect } from 'react';
import { AdminHeader } from '../components/AdminHeader';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Building2,
  Clock,
  Database,
  FileCode,
  FileWarning,
  GitFork,
  Layers,
  Link2,
  ListOrdered,
  Play,
  RefreshCw,
  Square,
  Unlink,
  X,
} from 'lucide-react';

interface StatsData {
  totalDocs: number;
  totalRelations: number;
  totalAstNodes: number;
  totalSources: number;
  docsWithoutRelationsCount: number;
  docsWithRelationsCount: number;
  docsWithoutFullTextCount: number;
  byType: Array<{ type: string; count: number }>;
  byStatus: Array<{ status: string; count: number }>;
  topIssuingBody: Array<{ name: string; count: number }>;
  relationBreakdown: Array<{ type: string; count: number }>;
}

interface QualityData {
  missingEffectiveDateCount: number;
  missingEffectiveDateSample: Array<{ id: string; documentNumber: string; title: string }>;
  unmappedRelationsCount: number;
  unmappedRelationsSample: Array<{ id: string; targetDocNumber: string; relationType: string }>;
  docsWithoutAstCount: number;
  docsWithoutRelationsSample: Array<{ id: string; documentNumber: string; title: string; issuingBody: string }>;
}

interface HeartbeatState {
  pid?: number;
  status: 'RUNNING' | 'STOPPED' | 'STALLED';
  lastHeartbeat?: string;
  processedCount?: number;
  successCount?: number;
  errorCount?: number;
  message?: string;
}

interface CrawlLogItem {
  id: string;
  site: string;
  url: string;
  status: string;
  message: string;
  documentsFound: number;
  createdAt: string;
}

export default function StatsPage() {
  const [activeTab, setActiveTab] = useState<'stats' | 'quality' | 'crawler'>('stats');
  const [stats, setStats] = useState<StatsData | null>(null);
  const [quality, setQuality] = useState<QualityData | null>(null);
  const [heartbeat, setHeartbeat] = useState<HeartbeatState | null>(null);
  const [logs, setLogs] = useState<CrawlLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState('');

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(() => {
      fetchHeartbeat();
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  async function fetchAllData() {
    setLoading(true);
    await Promise.all([fetchStats(), fetchQuality(), fetchHeartbeat(), fetchLogs()]);
    setLoading(false);
  }

  async function fetchStats() {
    try {
      const res = await fetch(`${API_BASE}/admin/stats`);
      if (res.ok) setStats(await res.json());
    } catch (_) {}
  }

  async function fetchQuality() {
    try {
      const res = await fetch(`${API_BASE}/admin/quality`);
      if (res.ok) setQuality(await res.json());
    } catch (_) {}
  }

  async function fetchHeartbeat() {
    try {
      const res = await fetch(`${API_BASE}/admin/crawler/heartbeat`);
      if (res.ok) setHeartbeat(await res.json());
    } catch (_) {}
  }

  async function fetchLogs() {
    try {
      const res = await fetch(`${API_BASE}/admin/crawler/logs`);
      if (res.ok) setLogs(await res.json());
    } catch (_) {}
  }

  async function triggerCrawler() {
    setActionLoading(true);
    setMessage('');
    try {
      const res = await fetch(`${API_BASE}/admin/crawler/trigger`, { method: 'POST' });
      const data = await res.json();
      setMessage(data.message || 'Triggered crawler process');
      await fetchHeartbeat();
    } catch (err) {
      setMessage('Lỗi kích hoạt crawler: ' + (err as Error).message);
    } finally {
      setActionLoading(false);
    }
  }

  async function stopCrawler() {
    setActionLoading(true);
    setMessage('');
    try {
      const res = await fetch(`${API_BASE}/admin/crawler/stop`, { method: 'POST' });
      const data = await res.json();
      setMessage(data.message || 'Stopped crawler process');
      await fetchHeartbeat();
    } catch (err) {
      setMessage('Lỗi dừng crawler: ' + (err as Error).message);
    } finally {
      setActionLoading(false);
    }
  }

  async function relinkRelations() {
    setActionLoading(true);
    setMessage('');
    try {
      const res = await fetch(`${API_BASE}/admin/relink-relations`);
      const data = await res.json();
      setMessage(data.message || 'Khớp lại mối quan hệ thành công');
      await fetchQuality();
      await fetchStats();
    } catch (err) {
      setMessage('Lỗi relink: ' + (err as Error).message);
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Banner Alert Message */}
      {message && (
        <div className="p-4 rounded-xl bg-blue-950/80 border border-blue-800 text-blue-200 text-sm flex items-center justify-between">
          <span>{message}</span>
          <button onClick={() => setMessage('')} className="text-blue-400 hover:text-white" aria-label="Dong thong bao"><X className="w-4 h-4" aria-hidden="true" /></button>
        </div>
      )}

      <AdminHeader
        activeTab="stats"
        onRefresh={fetchAllData}
        loading={loading}
        badges={{
          qualityCount: quality?.unmappedRelationsCount || 0,
          crawlerRunning: heartbeat?.status === 'RUNNING'
        }}
      />

      {/* ── TAB 1: THỐNG KÊ SỐ LIỆU (STATS) ── */}
      
        <div className="space-y-6">
          {/* Main KPI Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800/80 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">Tổng số Văn bản</span>
                <Database className="w-5 h-5 text-blue-400" />
              </div>
              <div className="text-3xl font-extrabold text-white mt-3 tabular-nums">
                {stats?.totalDocs.toLocaleString('vi-VN') || 0}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Bản ghi chuẩn hóa trong hệ thống</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800/80 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">Mối quan hệ Pháp lý</span>
                <GitFork className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="text-3xl font-extrabold text-white mt-3 tabular-nums">
                {stats?.totalRelations.toLocaleString('vi-VN') || 0}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Lượt liên kết Căn cứ/Sửa đổi/Thay thế</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-950 border border-amber-900/50 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-amber-400">Chưa có Mối quan hệ</span>
                <Unlink className="w-5 h-5 text-amber-400" />
              </div>
              <div className="text-3xl font-extrabold text-amber-300 mt-3 tabular-nums">
                {stats?.docsWithoutRelationsCount?.toLocaleString('vi-VN') || 0}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Chiếm {stats?.totalDocs ? ((stats.docsWithoutRelationsCount / stats.totalDocs) * 100).toFixed(1) : 0}% tổng số văn bản
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-950 border border-blue-900/50 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-blue-400">Đã nối Mối quan hệ</span>
                <Link2 className="w-5 h-5 text-blue-400" />
              </div>
              <div className="text-3xl font-extrabold text-blue-300 mt-3 tabular-nums">
                {stats?.docsWithRelationsCount?.toLocaleString('vi-VN') || 0}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Chiếm {stats?.totalDocs ? ((stats.docsWithRelationsCount / stats.totalDocs) * 100).toFixed(1) : 0}% tổng số văn bản
              </p>
            </div>
          </div>

          {/* Secondary KPI Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 block">Cấu trúc AST Nodes</span>
                <span className="text-xl font-bold text-purple-400 mt-1 block tabular-nums">
                  {stats?.totalAstNodes.toLocaleString('vi-VN') || 0} nodes
                </span>
              </div>
              <FileCode className="w-6 h-6 text-purple-400 opacity-60" />
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 block">Số Nguồn dữ liệu</span>
                <span className="text-xl font-bold text-amber-400 mt-1 block tabular-nums">
                  {stats?.totalSources.toLocaleString('vi-VN') || 0} nguồn
                </span>
              </div>
              <Layers className="w-6 h-6 text-amber-400 opacity-60" />
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-rose-900/40 flex items-center justify-between">
              <div>
                <span className="text-xs text-rose-300 block">Chưa có Toàn văn (Text)</span>
                <span className="text-xl font-bold text-rose-400 mt-1 block tabular-nums">
                  {stats?.docsWithoutFullTextCount?.toLocaleString('vi-VN') || 0} VB
                </span>
              </div>
              <FileWarning className="w-6 h-6 text-rose-400 opacity-60" />
            </div>
          </div>

          {/* Breakdown Tables & Lists */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Document Types Breakdown */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <ListOrdered className="w-4 h-4 text-blue-400" />
                  <span>Phân loại Loại văn bản</span>
                </h3>
              </div>
              <div className="space-y-2.5">
                {stats?.byType.map(item => (
                  <div key={item.type} className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-900/60 border border-slate-800/60">
                    <span className="font-semibold text-slate-200">{item.type}</span>
                    <span className="font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {item.count.toLocaleString('vi-VN')} VB
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Issuing Bodies */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-400" />
                  <span>Cơ quan Ban hành</span>
                </h3>
              </div>
              <div className="space-y-2.5">
                {stats?.topIssuingBody.map(item => (
                  <div key={item.name} className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-900/60 border border-slate-800/60">
                    <span className="font-semibold text-slate-200 truncate max-w-[180px]">{item.name}</span>
                    <span className="font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {item.count.toLocaleString('vi-VN')} VB
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Legal Relation Types Breakdown */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <GitFork className="w-4 h-4 text-purple-400" />
                  <span>Cơ cấu Loại Mối quan hệ</span>
                </h3>
              </div>
              <div className="space-y-2.5">
                {stats?.relationBreakdown.map(item => (
                  <div key={item.type} className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-900/60 border border-slate-800/60">
                    <span className="font-semibold text-slate-200">{item.type}</span>
                    <span className="font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      {item.count.toLocaleString('vi-VN')} lượt
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}