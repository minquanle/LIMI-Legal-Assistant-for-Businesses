'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { AdminHeader } from '../components/AdminHeader';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Building2,
  Check,
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

export default function CrawlerPage() {
  const [activeTab, setActiveTab] = useState<'stats' | 'quality' | 'crawler'>('stats');
  const [stats, setStats] = useState<StatsData | null>(null);
  const [quality, setQuality] = useState<QualityData | null>(null);
  const [heartbeat, setHeartbeat] = useState<HeartbeatState | null>(null);
  const [logs, setLogs] = useState<CrawlLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState('');

  interface CronConfig {
    enabled: boolean;
    schedule: string;
    maxPagesPerKeyword: number;
    lastRun?: string;
    lastStatus?: string;
  }

  const [cronConfig, setCronConfig] = useState<CronConfig | null>(null);
  const [cronEnabled, setCronEnabled] = useState(false);
  const [cronHour, setCronHour] = useState('02');
  const [cronMinute, setCronMinute] = useState('00');
  const [cronMaxPages, setCronMaxPages] = useState(10);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';
  // All /admin/* routes require admin auth (see auth-guard.ts requireAdminAuth).
  // Calls go through the Next.js server-side proxy, which validates the
  // httpOnly admin session cookie and attaches the secret there, so the admin
  // key is never shipped to the browser.
  const ADMIN_API = '/api/admin-proxy';

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(() => {
      fetchHeartbeat();
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  async function fetchAllData() {
    setLoading(true);
    await Promise.all([fetchStats(), fetchQuality(), fetchHeartbeat(), fetchLogs(), fetchCronConfig()]);
    setLoading(false);
  }

  async function fetchStats() {
    try {
      const res = await fetch(`${ADMIN_API}/admin/stats`);
      if (res.ok) setStats(await res.json());
    } catch (_) {}
  }

  async function fetchQuality() {
    try {
      const res = await fetch(`${ADMIN_API}/admin/quality`);
      if (res.ok) setQuality(await res.json());
    } catch (_) {}
  }

  async function fetchHeartbeat() {
    try {
      const res = await fetch(`${ADMIN_API}/admin/crawler/heartbeat`);
      if (res.ok) setHeartbeat(await res.json());
    } catch (_) {}
  }

  async function fetchLogs() {
    try {
      const res = await fetch(`${ADMIN_API}/admin/crawler/logs`);
      if (res.ok) setLogs(await res.json());
    } catch (_) {}
  }

  const parseCronExpression = (cronExpr: string) => {
    const parts = cronExpr.trim().split(/\s+/);
    if (parts.length >= 2) {
      const min = parts[0].padStart(2, '0');
      const hr = parts[1].padStart(2, '0');
      return { hour: hr, minute: min };
    }
    return { hour: '02', minute: '00' };
  };

  async function fetchCronConfig() {
    try {
      const res = await fetch(`${ADMIN_API}/admin/crawler/cron`);
      if (res.ok) {
        const data = await res.json();
        setCronConfig(data);
        setCronEnabled(data.enabled);
        const { hour, minute } = parseCronExpression(data.schedule);
        setCronHour(hour);
        setCronMinute(minute);
        setCronMaxPages(data.maxPagesPerKeyword ?? 10);
      }
    } catch (_) {}
  }

  async function saveCronConfig() {
    setActionLoading(true);
    setMessage('');
    try {
      const schedule = `${parseInt(cronMinute, 10)} ${parseInt(cronHour, 10)} * * *`;
      const res = await fetch(`${ADMIN_API}/admin/crawler/cron`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: cronEnabled, schedule, maxPagesPerKeyword: cronMaxPages }),
      });
      const data = await res.json();
      setMessage(data.message || 'Cập nhật cấu hình lịch biểu thành công');
      await fetchCronConfig();
    } catch (err) {
      setMessage('Lỗi lưu cấu hình: ' + (err as Error).message);
    } finally {
      setActionLoading(false);
    }
  }

  async function triggerCrawler() {
    setActionLoading(true);
    setMessage('');
    try {
      const res = await fetch(`${ADMIN_API}/admin/crawler/trigger`, { method: 'POST' });
      const data = await res.json();
      setMessage(data.message || 'Triggered daily incremental sweep');
      await fetchHeartbeat();
    } catch (err) {
      setMessage('Lỗi kích hoạt crawler: ' + (err as Error).message);
    } finally {
      setActionLoading(false);
    }
  }

  async function triggerFullScan() {
    setActionLoading(true);
    setMessage('');
    try {
      const res = await fetch(`${ADMIN_API}/admin/crawler/trigger-full`, { method: 'POST' });
      const data = await res.json();
      setMessage(data.message || 'Full deep scan triggered — quá trình có thể mất vài giờ');
      await fetchHeartbeat();
    } catch (err) {
      setMessage('Lỗi kích hoạt full scan: ' + (err as Error).message);
    } finally {
      setActionLoading(false);
    }
  }

  async function stopCrawler() {
    setActionLoading(true);
    setMessage('');
    try {
      const res = await fetch(`${ADMIN_API}/admin/crawler/stop`, { method: 'POST' });
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
      const res = await fetch(`${ADMIN_API}/admin/relink-relations`, { method: 'POST' });
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
        activeTab="crawler"
        onRefresh={fetchAllData}
        loading={loading}
        badges={{
          qualityCount: quality?.unmappedRelationsCount || 0,
          crawlerRunning: heartbeat?.status === 'RUNNING'
        }}
      />

      {/* ── TAB 3: ĐIỀU KHIỂN CRAWLER & HEARTBEAT ── */}
      
        <div className="space-y-6">
          {/* ── JOB 1: Daily Incremental Sweep ── */}
          <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800">
            <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-800 pb-4 mb-4">
              <div>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-sky-500/10 border border-sky-500/20">
                    <Clock className="w-4 h-4 text-sky-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Job 1 — Thu thập định kỳ hàng ngày</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Quét top N trang mới nhất mỗi từ khóa · Chỉ tải các văn bản chưa có trong DB</p>
                  </div>
                  {heartbeat?.status === 'RUNNING' && heartbeat?.message?.includes('incremental') ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      RUNNING
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="flex items-center gap-3">
                {heartbeat?.status !== 'RUNNING' ? (
                  <button
                    onClick={triggerCrawler}
                    disabled={actionLoading}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Chạy ngay (Incremental)</span>
                  </button>
                ) : heartbeat?.message?.includes('incremental') ? (
                  <button
                    onClick={stopCrawler}
                    disabled={actionLoading}
                    className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-md transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <Square className="w-4 h-4 fill-current" />
                    <span>Dừng Crawler</span>
                  </button>
                ) : (
                  <button
                    disabled
                    className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 text-slate-400 font-bold text-xs rounded-xl shadow-md cursor-not-allowed opacity-50"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Đang chạy Full Scan</span>
                  </button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400 block">Lịch tự động</span>
                <span className="font-mono text-sm font-bold text-sky-400">{cronConfig?.schedule || '0 2 * * *'}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400 block">Trang / từ khóa</span>
                <span className="font-mono text-sm font-bold text-slate-200">{cronConfig?.maxPagesPerKeyword ?? 10} trang</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400 block">Trạng thái cron</span>
                <span className={cn("font-bold text-sm", cronConfig?.enabled ? "text-emerald-400" : "text-slate-400")}>
                  {cronConfig?.enabled ? '● ĐANG BẬT' : '○ ĐANG TẮT'}
                </span>
              </div>
            </div>
          </div>

          {/* ── JOB 2: Full Deep Scan ── */}
          <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800">
            <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-800 pb-4 mb-4">
              <div>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <Database className="w-4 h-4 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Job 2 — Quét sâu toàn bộ VBPL</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Cào đầy đủ tất cả nguồn (VBPL, Chính phủ, Pháp điển, TVPL) · Thời gian dài · Chỉ chạy thủ công</p>
                  </div>
                  {heartbeat?.status === 'RUNNING' && !heartbeat?.message?.includes('incremental') ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                      RUNNING
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="flex items-center gap-3">
                {heartbeat?.status !== 'RUNNING' ? (
                  <button
                    onClick={triggerFullScan}
                    disabled={actionLoading}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs rounded-xl shadow-md transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <Layers className="w-4 h-4" />
                    <span>Chạy Full Deep Scan</span>
                  </button>
                ) : !heartbeat?.message?.includes('incremental') ? (
                  <button
                    onClick={stopCrawler}
                    disabled={actionLoading}
                    className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-md transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <Square className="w-4 h-4 fill-current" />
                    <span>Dừng Crawler</span>
                  </button>
                ) : (
                  <button
                    disabled
                    className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 text-slate-400 font-bold text-xs rounded-xl shadow-md cursor-not-allowed opacity-50"
                  >
                    <Layers className="w-4 h-4" />
                    <span>Đang chạy Incremental</span>
                  </button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400 block">Nguồn thu thập</span>
                <span className="text-slate-200 font-semibold">VBPL · Chính phủ · Pháp điển · TVPL</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400 block">Heartbeat cuối</span>
                <span className="font-mono text-sm font-bold text-slate-200">
                  {heartbeat?.lastHeartbeat ? new Date(heartbeat.lastHeartbeat).toLocaleTimeString('vi-VN') : 'N/A'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400 block">Tiến độ hiện tại</span>
                <span className="font-mono text-sm font-bold text-slate-200">
                  <Check className="w-3 h-3 inline" aria-hidden="true" /> {heartbeat?.successCount || 0} &nbsp;<X className="w-3 h-3 inline" aria-hidden="true" /> {heartbeat?.errorCount || 0}
                </span>
              </div>
            </div>
          </div>

          {/* ── Live Heartbeat Monitor ── */}
          <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800">
            <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-800 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <Activity className="w-4 h-4 text-slate-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">Giám sát Heartbeat</h3>
                  <p className="text-xs text-slate-400">Trạng thái tiến trình crawler ngầm realtime</p>
                </div>
                {heartbeat?.status === 'RUNNING' ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    RUNNING
                  </span>
                ) : heartbeat?.status === 'STALLED' ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    STALLED
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-400 border border-slate-700">
                    STOPPED
                  </span>
                )}
              </div>
            </div>
            {heartbeat?.message && (
              <div className="mb-4 p-4 rounded-xl bg-slate-900 border border-slate-800/80">
                <span className="text-slate-400 block text-xs mb-1">Chi tiết Tiến trình</span>
                <p className="text-sm font-semibold text-sky-400 font-mono">{heartbeat.message}</p>
              </div>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400 block">Process ID (PID)</span>
                <span className="font-mono text-sm font-bold text-slate-200">{heartbeat?.pid || 'N/A'}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400 block">Heartbeat Cuối</span>
                <span className="font-mono text-sm font-bold text-slate-200">
                  {heartbeat?.lastHeartbeat ? new Date(heartbeat.lastHeartbeat).toLocaleTimeString('vi-VN') : 'N/A'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400 block">Đã xử lý (Tổng)</span>
                <span className="font-mono text-sm font-bold text-slate-200">{heartbeat?.processedCount || 0}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400 block">Thành công</span>
                <span className="font-mono text-sm font-bold text-emerald-400">{heartbeat?.successCount || 0}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400 block">Số lỗi</span>
                <span className="font-mono text-sm font-bold text-rose-400">{heartbeat?.errorCount || 0}</span>
              </div>
            </div>
          </div>


          {/* Daily Scheduler Configuration Card */}
          <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4 mb-4">
              <Clock className="w-5 h-5 text-sky-400" />
              <div>
                <h3 className="text-base font-bold text-white">Lên lịch thu thập định kỳ hàng ngày</h3>
                <p className="text-xs text-slate-400 mt-1">Cấu hình tự động quét và thu thập các văn bản luật mới ban hành</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-xs text-slate-300">
              <div className="space-y-2">
                <span className="text-slate-400 block">Kích hoạt Lịch biểu</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={cronEnabled}
                    onChange={(e) => setCronEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500 peer-checked:after:bg-white"></div>
                  <span className="ml-3 font-semibold text-slate-200">
                    {cronEnabled ? 'ĐANG BẬT' : 'ĐANG TẮT'}
                  </span>
                </label>
              </div>

              <div className="space-y-2">
                <span className="text-slate-400 block">Thời gian chạy (Daily Run Time)</span>
                <div className="flex items-center gap-2">
                  <select
                    value={cronHour}
                    onChange={(e) => setCronHour(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-white font-bold"
                  >
                    {Array.from({ length: 24 }).map((_, i) => {
                      const val = i.toString().padStart(2, '0');
                      return <option key={val} value={val}>{val} Giờ</option>;
                    })}
                  </select>
                  <span className="font-bold">:</span>
                  <select
                    value={cronMinute}
                    onChange={(e) => setCronMinute(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-white font-bold"
                  >
                    {['00', '15', '30', '45'].map((val) => (
                      <option key={val} value={val}>{val} Phút</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-slate-400 block">Trạng thái Lịch biểu</span>
                <div className="space-y-1 font-mono text-[11px]">
                  <div>Lịch chạy: <span className="text-sky-400 font-bold">{cronConfig?.schedule || 'N/A'}</span></div>
                  <div>Chạy lần cuối: <span className="text-slate-300">{cronConfig?.lastRun ? new Date(cronConfig.lastRun).toLocaleString('vi-VN') : 'Chưa có'}</span></div>
                  <div>Kết quả: <span className={cn(
                    "font-bold",
                    cronConfig?.lastStatus === 'SUCCESS' ? "text-emerald-400" :
                    cronConfig?.lastStatus === 'FAILED' ? "text-rose-400" :
                    cronConfig?.lastStatus === 'RUNNING' ? "text-sky-400" : "text-slate-400"
                  )}>{cronConfig?.lastStatus || 'N/A'}</span></div>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-slate-400 block">Số trang mới nhất / từ khóa</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={cronMaxPages}
                    onChange={(e) => setCronMaxPages(Math.max(1, Math.min(50, parseInt(e.target.value) || 10)))}
                    className="w-20 bg-slate-900 border border-slate-800 rounded-lg p-2 text-white font-bold text-center"
                  />
                  <span className="text-slate-400">trang</span>
                </div>
                <p className="text-slate-600 text-[10px] leading-relaxed">
                  Quét N trang đầu tiên (mới nhất) cho mỗi từ khóa tìm kiếm. Mặc định: 10
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={saveCronConfig}
                disabled={actionLoading}
                className="flex items-center gap-2 px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow-md transition-all disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={cn("w-3.5 h-3.5", actionLoading && "animate-spin")} />
                Lưu Cấu hình Lịch biểu
              </button>
            </div>
          </div>

          {/* Crawl Log Table */}
          <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800">
            <h3 className="text-sm font-bold text-white mb-4">Nhật ký Tiến trình Thu thập (CrawlLog)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/50">
                    <th className="py-2.5 px-3">Thời gian</th>
                    <th className="py-2.5 px-3">Nguồn</th>
                    <th className="py-2.5 px-3">Trạng thái</th>
                    <th className="py-2.5 px-3">Chi tiết Message</th>
                    <th className="py-2.5 px-3">URL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {logs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-900/40">
                      <td className="py-2.5 px-3 font-mono text-slate-400">
                        {new Date(log.createdAt).toLocaleString('vi-VN')}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-300">{log.site}</td>
                      <td className="py-2.5 px-3">
                        {log.status === 'success' ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-mono border border-emerald-500/30">
                            SUCCESS
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 text-[10px] font-mono border border-rose-500/30">
                            ERROR
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-300 max-w-[300px] truncate">{log.message}</td>
                      <td className="py-2.5 px-3 text-slate-400 font-mono max-w-[200px] truncate">{log.url}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
  );
}
