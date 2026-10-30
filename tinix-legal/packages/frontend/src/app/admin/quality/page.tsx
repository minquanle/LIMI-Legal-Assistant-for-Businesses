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

export default function QualityPage() {
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
        activeTab="quality"
        onRefresh={fetchAllData}
        loading={loading}
        badges={{
          qualityCount: quality?.unmappedRelationsCount || 0,
          crawlerRunning: heartbeat?.status === 'RUNNING'
        }}
      />

      {/* ── TAB 2: CHẤT LƯỢNG DỮ LIỆU (QUALITY) ── */}
      
        <div className="space-y-6">
          {/* Action Toolbar */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="text-sm font-bold text-white">Công cụ Kiểm soát & Sửa lỗi Dữ liệu</h3>
              <p className="text-xs text-slate-400">Tự động quét lại liên kết mồ côi và nối lại ID cho mạng lưới quan hệ</p>
            </div>
            <button
              onClick={relinkRelations}
              disabled={actionLoading}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${actionLoading ? 'animate-spin' : ''}`} />
              <span>Nối lại Liên kết Mồ côi (Relink Relations)</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Unmapped Relations Box */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-amber-900/50">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Liên kết Mồ côi</span>
                </h3>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {quality?.unmappedRelationsCount || 0} lượt
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-4">Các lượt tham chiếu có số hiệu đích nhưng chưa nối được ID văn bản trong DB</p>
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {quality?.unmappedRelationsSample.map(item => (
                  <div key={item.id} className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs flex justify-between items-center">
                    <span className="font-mono text-amber-300">{item.targetDocNumber}</span>
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                      {item.relationType}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Docs Without Relations Sample */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <Unlink className="w-4 h-4 text-amber-400" />
                  <span>VB Chưa có Liên kết</span>
                </h3>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                  {stats?.docsWithoutRelationsCount?.toLocaleString('vi-VN') || 0} VB
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-4">Danh sách mẫu văn bản chưa được kết nối vào mạng lưới quan hệ pháp lý</p>
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {quality?.docsWithoutRelationsSample?.map(item => (
                  <div key={item.id} className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs">
                    <div className="font-bold text-slate-300">{item.documentNumber}</div>
                    <div className="text-slate-400 truncate text-[11px] mt-0.5">{item.title}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Missing Dates Box */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <span>Thiếu Ngày Hiệu lực</span>
                </h3>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {quality?.missingEffectiveDateCount || 0} VB
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-4">Các văn bản cần được rà soát bổ sung thông tin ngày có hiệu lực</p>
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {quality?.missingEffectiveDateSample.map(item => (
                  <div key={item.id} className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs">
                    <div className="font-bold text-slate-300">{item.documentNumber}</div>
                    <div className="text-slate-400 truncate text-[11px] mt-0.5">{item.title}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}