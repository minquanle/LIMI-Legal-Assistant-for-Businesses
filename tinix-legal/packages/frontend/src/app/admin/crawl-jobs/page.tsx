'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarClock, CheckCircle2, Clock, History, Loader2, Play, RefreshCw, Settings, Square, X, XCircle } from 'lucide-react';

const ADMIN_API = '/api/admin-proxy/admin/crawl-jobs';

interface JobRun {
  id: string;
  trigger: string;
  status: 'QUEUED' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
  startedAt: string;
  finishedAt: string | null;
  newUrls: number;
  newRecords: number;
  failedUrls: number;
  imported: number;
  truncated: boolean;
  error: string | null;
  logTail?: string | null;
}

interface Job {
  id: string;
  key: string;
  name: string;
  description: string;
  groupName: string;
  importTarget: string | null;
  enabled: boolean;
  schedule: string;
  maxNewUrls: number;
  running: boolean;
  nextRunAt: string | null;
  lastRunAt: string | null;
  lastStatus: string | null;
  lastDurationMs: number | null;
  lastNewRecords: number | null;
  lastRun: JobRun | null;
}

const PRESETS: Array<{ label: string; cron: string }> = [
  { label: 'Mỗi giờ', cron: '0 * * * *' },
  { label: 'Mỗi 6 giờ', cron: '0 */6 * * *' },
  { label: 'Hằng ngày lúc 03:00', cron: '0 3 * * *' },
  { label: 'Hằng tuần, Chủ nhật 04:00', cron: '0 4 * * 0' },
  { label: 'Hằng tuần, Thứ hai 04:00', cron: '0 4 * * 1' },
  { label: 'Hằng tháng, ngày 1 lúc 04:00', cron: '0 4 1 * *' },
];

function scheduleLabel(cron: string): string {
  return PRESETS.find((p) => p.cron === cron)?.label ?? cron;
}

function fmtTime(iso: string | null): string {
  return iso ? new Date(iso).toLocaleString('vi-VN', { hour12: false }) : '-';
}

function fmtDuration(ms: number | null): string {
  if (ms === null) return '-';
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  return m < 60 ? `${m}p ${s % 60}s` : `${Math.floor(m / 60)}g ${m % 60}p`;
}

function StatusBadge({ status }: { status: string | null }) {
  const map: Record<string, { cls: string; text: string; icon: React.ReactNode }> = {
    SUCCESS: { cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', text: 'Thành công', icon: <CheckCircle2 className="w-3 h-3" /> },
    FAILED: { cls: 'bg-rose-500/15 text-rose-400 border-rose-500/30', text: 'Lỗi', icon: <XCircle className="w-3 h-3" /> },
    RUNNING: { cls: 'bg-sky-500/15 text-sky-400 border-sky-500/30', text: 'Đang chạy', icon: <Loader2 className="w-3 h-3 animate-spin" /> },
    QUEUED: { cls: 'bg-amber-500/15 text-amber-400 border-amber-500/30', text: 'Trong hàng đợi', icon: <Clock className="w-3 h-3" /> },
    CANCELLED: { cls: 'bg-slate-500/15 text-slate-400 border-slate-500/30', text: 'Đã dừng', icon: <Square className="w-3 h-3" /> },
  };
  if (!status) return <span className="text-xs text-slate-500">Chưa chạy lần nào</span>;
  const m = map[status] ?? { cls: 'bg-slate-500/15 text-slate-400 border-slate-500/30', text: status, icon: null };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${m.cls}`}>
      {m.icon}
      {m.text}
    </span>
  );
}

export default function CrawlJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [editing, setEditing] = useState<Job | null>(null);
  const [historyFor, setHistoryFor] = useState<Job | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(ADMIN_API);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setJobs((await res.json()).jobs);
    } catch (err) {
      setMessage({ type: 'err', text: `Không tải được danh sách job: ${(err as Error).message}` });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 8000);
    return () => clearInterval(t);
  }, [load]);

  const call = async (url: string, init: RequestInit, okText: string) => {
    try {
      const res = await fetch(url, { ...init, headers: { 'Content-Type': 'application/json' } });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
      setMessage({ type: 'ok', text: okText });
      await load();
      return true;
    } catch (err) {
      setMessage({ type: 'err', text: (err as Error).message });
      return false;
    }
  };

  const toggle = (j: Job) =>
    call(`${ADMIN_API}/${j.key}`, { method: 'PUT', body: JSON.stringify({ enabled: !j.enabled }) }, `${j.enabled ? 'Đã tắt' : 'Đã bật'} lịch chạy "${j.name}"`);
  const runNow = (j: Job) => call(`${ADMIN_API}/${j.key}/run`, { method: 'POST' }, `Đã đưa "${j.name}" vào hàng đợi chạy`);
  const stop = (j: Job) => call(`${ADMIN_API}/${j.key}/stop`, { method: 'POST' }, `Đã gửi lệnh dừng "${j.name}"`);

  const groups = useMemo(() => {
    const map = new Map<string, Job[]>();
    for (const j of jobs) map.set(j.groupName, [...(map.get(j.groupName) ?? []), j]);
    return [...map.entries()];
  }, [jobs]);

  const enabledCount = jobs.filter((j) => j.enabled).length;
  const runningCount = jobs.filter((j) => j.running).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-sky-400" aria-hidden="true" />
            Cập nhật dữ liệu định kỳ
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Mỗi nguồn dulieuphapluat.vn chạy theo lịch riêng: so sánh sitemap với dữ liệu đã có, chỉ thu thập trang mới rồi nạp vào công cụ tra cứu.
            Tối đa 2 job chạy đồng thời, các job còn lại xếp hàng.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">{jobs.length} nguồn</span>
          <span className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-emerald-400">{enabledCount} đang bật lịch</span>
          <span className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-sky-400">{runningCount} đang chạy</span>
          <button onClick={load} className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white cursor-pointer" aria-label="Làm mới">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`p-3 rounded-xl text-sm flex items-center justify-between border ${
            message.type === 'ok' ? 'bg-emerald-950/60 border-emerald-800 text-emerald-200' : 'bg-rose-950/60 border-rose-800 text-rose-200'
          }`}
        >
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} aria-label="Đóng thông báo">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {loading && jobs.length === 0 && <p className="text-sm text-slate-400">Đang tải...</p>}

      {groups.map(([group, list]) => (
        <section key={group} className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">{group}</h2>
          <div className="rounded-2xl bg-slate-950 border border-slate-800 divide-y divide-slate-800">
            {list.map((j) => (
              <div key={j.key} className="p-4 grid gap-3 md:grid-cols-[minmax(0,2fr)_minmax(0,1.3fr)_minmax(0,1.6fr)_auto] md:items-center">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-white">{j.name}</h3>
                    {j.importTarget && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30">tự nạp vào công cụ tra cứu</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 truncate" title={j.description}>{j.description}</p>
                </div>

                <div className="text-xs space-y-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input type="checkbox" checked={j.enabled} onChange={() => toggle(j)} className="sr-only peer" />
                    <span className="w-9 h-5 rounded-full bg-slate-700 peer-checked:bg-emerald-600 relative transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-4 after:h-4 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-4" />
                    <span className={j.enabled ? 'text-emerald-400 font-medium' : 'text-slate-500'}>{j.enabled ? 'Đang bật' : 'Đã tắt'}</span>
                  </label>
                  <div className="text-slate-300">{scheduleLabel(j.schedule)}</div>
                  <div className="text-slate-500">{j.enabled ? `Lần tới: ${fmtTime(j.nextRunAt)}` : 'Không chạy tự động'}</div>
                </div>

                <div className="text-xs space-y-1">
                  <StatusBadge status={j.running ? 'RUNNING' : j.lastStatus} />
                  {j.lastRunAt && (
                    <div className="text-slate-400">
                      {fmtTime(j.lastRunAt)} · {fmtDuration(j.lastDurationMs)}
                    </div>
                  )}
                  {j.lastRun && j.lastRun.status !== 'RUNNING' && (
                    <div className="text-slate-500">
                      {j.lastRun.newRecords.toLocaleString('vi-VN')} bản ghi mới
                      {j.importTarget ? `, nạp ${j.lastRun.imported.toLocaleString('vi-VN')}` : ''}
                      {j.lastRun.failedUrls > 0 ? `, ${j.lastRun.failedUrls} lỗi` : ''}
                      {j.lastRun.truncated ? ', còn tồn (chạm giới hạn)' : ''}
                    </div>
                  )}
                  {j.lastRun?.error && <div className="text-rose-400 truncate" title={j.lastRun.error}>{j.lastRun.error}</div>}
                </div>

                <div className="flex items-center gap-2 md:justify-end">
                  {j.running ? (
                    <button onClick={() => stop(j)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-rose-600/20 text-rose-300 border border-rose-600/40 text-xs font-semibold hover:bg-rose-600/30 cursor-pointer">
                      <Square className="w-3.5 h-3.5 fill-current" /> Dừng
                    </button>
                  ) : (
                    <button onClick={() => runNow(j)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-sky-600 text-white text-xs font-semibold hover:bg-sky-500 cursor-pointer">
                      <Play className="w-3.5 h-3.5 fill-current" /> Chạy ngay
                    </button>
                  )}
                  <button onClick={() => setEditing(j)} className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white cursor-pointer" aria-label={`Cài đặt ${j.name}`} title="Cài đặt lịch">
                    <Settings className="w-4 h-4" />
                  </button>
                  <button onClick={() => setHistoryFor(j)} className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white cursor-pointer" aria-label={`Lịch sử ${j.name}`} title="Lịch sử chạy">
                    <History className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}

      {editing && (
        <EditDialog
          job={editing}
          onClose={() => setEditing(null)}
          onSave={async (schedule, maxNewUrls) => {
            const ok = await call(`${ADMIN_API}/${editing.key}`, { method: 'PUT', body: JSON.stringify({ schedule, maxNewUrls }) }, `Đã lưu cài đặt "${editing.name}"`);
            if (ok) setEditing(null);
          }}
        />
      )}
      {historyFor && <HistoryDialog job={historyFor} onClose={() => setHistoryFor(null)} />}
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[70] bg-black/60 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={title} onClick={onClose}>
      <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl bg-slate-950 border border-slate-800 p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-white">{title}</h3>
          <button onClick={onClose} aria-label="Đóng" className="text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function EditDialog({ job, onClose, onSave }: { job: Job; onClose: () => void; onSave: (schedule: string, maxNewUrls: number) => void }) {
  const isPreset = PRESETS.some((p) => p.cron === job.schedule);
  const [preset, setPreset] = useState(isPreset ? job.schedule : 'custom');
  const [custom, setCustom] = useState(job.schedule);
  const [maxNew, setMaxNew] = useState(job.maxNewUrls);
  const schedule = preset === 'custom' ? custom : preset;

  return (
    <Modal title={`Cài đặt: ${job.name}`} onClose={onClose}>
      <div className="space-y-4 text-sm">
        <div>
          <label htmlFor="cj-preset" className="block text-xs text-slate-400 mb-1.5">Tần suất chạy</label>
          <select id="cj-preset" value={preset} onChange={(e) => setPreset(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white">
            {PRESETS.map((p) => (
              <option key={p.cron} value={p.cron}>{p.label}</option>
            ))}
            <option value="custom">Tùy chỉnh (biểu thức cron)</option>
          </select>
        </div>
        {preset === 'custom' && (
          <div>
            <label htmlFor="cj-cron" className="block text-xs text-slate-400 mb-1.5">Biểu thức cron (phút giờ ngày tháng thứ)</label>
            <input id="cj-cron" value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="0 3 * * *" className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono" />
          </div>
        )}
        <div>
          <label htmlFor="cj-max" className="block text-xs text-slate-400 mb-1.5">Giới hạn số trang mới mỗi lần chạy</label>
          <input id="cj-max" type="number" min={1} max={200000} value={maxNew} onChange={(e) => setMaxNew(parseInt(e.target.value || '0', 10))} className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white" />
          <p className="text-[11px] text-slate-500 mt-1">Trang vượt giới hạn sẽ được thu thập ở lần chạy sau, không bị bỏ sót.</p>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 text-xs font-semibold cursor-pointer">Hủy</button>
          <button onClick={() => onSave(schedule, maxNew)} className="px-4 py-2 rounded-lg bg-sky-600 text-white text-xs font-semibold hover:bg-sky-500 cursor-pointer">Lưu</button>
        </div>
      </div>
    </Modal>
  );
}

function HistoryDialog({ job, onClose }: { job: Job; onClose: () => void }) {
  const [runs, setRuns] = useState<JobRun[] | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${ADMIN_API}/${job.key}/runs?limit=30`)
      .then((r) => r.json())
      .then((d) => setRuns(d.runs ?? []))
      .catch(() => setRuns([]));
  }, [job.key]);

  return (
    <Modal title={`Lịch sử chạy: ${job.name}`} onClose={onClose}>
      {runs === null && <p className="text-sm text-slate-400">Đang tải...</p>}
      {runs?.length === 0 && <p className="text-sm text-slate-400">Chưa có lần chạy nào.</p>}
      <ul className="space-y-2">
        {runs?.map((r) => (
          <li key={r.id} className="rounded-xl bg-slate-900 border border-slate-800 p-3 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <StatusBadge status={r.status} />
                <span className="text-slate-400">{fmtTime(r.startedAt)}</span>
                <span className="text-slate-600">{r.trigger === 'cron' ? 'theo lịch' : 'thủ công'}</span>
              </div>
              <div className="text-slate-400">
                {r.newUrls.toLocaleString('vi-VN')} trang mới · {r.newRecords.toLocaleString('vi-VN')} bản ghi
                {job.importTarget ? ` · nạp ${r.imported.toLocaleString('vi-VN')}` : ''}
                {r.failedUrls ? ` · ${r.failedUrls} lỗi` : ''}
              </div>
            </div>
            {r.error && <p className="mt-2 text-rose-400">{r.error}</p>}
            {r.logTail && (
              <>
                <button onClick={() => setOpen(open === r.id ? null : r.id)} className="mt-2 text-sky-400 hover:underline cursor-pointer">
                  {open === r.id ? 'Ẩn log' : 'Xem log cuối'}
                </button>
                {open === r.id && <pre className="mt-2 p-2 rounded bg-black/50 text-[11px] text-slate-300 whitespace-pre-wrap max-h-60 overflow-y-auto">{r.logTail}</pre>}
              </>
            )}
          </li>
        ))}
      </ul>
    </Modal>
  );
}
