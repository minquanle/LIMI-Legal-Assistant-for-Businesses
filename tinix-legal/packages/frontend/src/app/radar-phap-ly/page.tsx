'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Activity,
  AlertTriangle,
  Award,
  Bell,
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  CheckSquare,
  ChevronRight,
  Clock,
  DollarSign,
  Download,
  ExternalLink,
  FileCheck2,
  Filter,
  Globe,
  Info,
  Layers,
  Scale,
  Search,
  Settings,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  Users,
  X,
} from 'lucide-react';
import { getTopicIcon } from '@/lib/topic-icons';
import { getRadarClientId } from '@/lib/api-client';

const API_BASE = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001');

interface Industry {
  id: string;
  name: string;
  icon: string;
  description: string;
  alertCount: number;
}

interface GapQuestion {
  id: string;
  question: string;
  weight: number;
  remediation: string;
}

/** One industry's own analysis of a document — same law, different lens. */
interface IndustryVariant {
  id: string;
  industry: string;
  industryName: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  summary: string;
  financialImpact?: string;
  operationalImpact?: string;
  hrImpact?: string;
  penaltyReference?: string;
  maxPenaltyAmount?: string;
  gapQuestions?: GapQuestion[];
  affectedAreas: string[];
  actionChecklist: string[];
  deadlineDate?: string;
}

/**
 * One card per document. A single law can affect several industries
 * differently (see compliance-analysis-service.ts), so the backend groups
 * every ComplianceRadarAlert row for the same documentNumber into one
 * `industries` list here instead of returning a separate flat row per
 * industry — that's what lets the UI show the title exactly once, with the
 * industries selectable as tabs inside the card rather than repeated cards.
 */
interface AlertItem {
  documentNumber: string;
  documentId?: string;
  title: string;
  promulgationDate?: string;
  effectiveDate?: string;
  sourceUrl?: string;
  /** Worst-case across `industries` — drives the page's severity sort/filter. */
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  /** Earliest across `industries`. */
  deadlineDate?: string;
  industries: IndustryVariant[];
}

/** Compact, deliberately-flat shape for the "Luật Sắp Có Hiệu Lực" strip —
 * one representative (worst-severity) row per document plus a count of how
 * many other industries it also affects, not the full per-industry detail
 * the main list's grouped `AlertItem` carries. */
interface UpcomingAlertItem {
  id: string;
  industry: string;
  industryName: string;
  documentNumber: string;
  title: string;
  effectiveDate?: string;
  otherIndustryCount: number;
}

interface Stats {
  totalAlerts: number;
  criticalAlerts: number;
  upcomingDeadlines: number;
  totalIndustries: number;
  lastSync: string;
}

interface TaxonomyEntry {
  code: string;
  name: string;
}

const PAGE_SIZE = 10;

export default function RadarPhapLyPage() {
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  // Total matching the current filters, which can exceed the page the API returns.
  const [matchingTotal, setMatchingTotal] = useState<number | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [selectedIndustry, setSelectedIndustry] = useState<string>('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [selectedSubjectCode, setSelectedSubjectCode] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [checkedActions, setCheckedActions] = useState<Record<string, boolean>>({});
  const [subscribedIndustries, setSubscribedIndustries] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [businessEntityTypes, setBusinessEntityTypes] = useState<TaxonomyEntry[]>([]);
  const [nonIndustrySubjects, setNonIndustrySubjects] = useState<TaxonomyEntry[]>([]);
  const [upcomingAlerts, setUpcomingAlerts] = useState<UpcomingAlertItem[]>([]);

  // 4-Pillar Active Tab per Alert
  const [activePillarTabs, setActivePillarTabs] = useState<Record<string, 'financial' | 'operational' | 'hr' | 'penalty'>>({});
  // Which industry variant is showing inside a multi-industry card, keyed by
  // documentNumber. Defaults to the group's first (worst-severity) industry.
  const [activeIndustryTab, setActiveIndustryTab] = useState<Record<string, string>>({});

  // Audit Modal State
  // The audit modal operates on one industry's own gapQuestions/id, but still
  // needs the document-level title/documentNumber for its header — combine
  // the selected IndustryVariant with those two group fields when opening it.
  const [auditAlert, setAuditAlert] = useState<(IndustryVariant & { title: string; documentNumber: string }) | null>(null);
  const [auditAnswers, setAuditAnswers] = useState<Record<string, boolean>>({});
  const [auditResult, setAuditResult] = useState<any>(null);
  const [evaluatingAudit, setEvaluatingAudit] = useState(false);
  const [auditHistory, setAuditHistory] = useState<Array<{ id: string; score: number | null; createdAt: string }>>([]);
  const auditDialogRef = useRef<HTMLDivElement | null>(null);
  const auditTriggerRef = useRef<HTMLElement | null>(null);

  // Fetch Industries & Stats
  useEffect(() => {
    fetch(`${API_BASE}/api/radar/industries`)
      .then((r) => r.json())
      .then(setIndustries)
      .catch(console.error);

    fetch(`${API_BASE}/api/radar/stats`)
      .then((r) => r.json())
      .then(setStats)
      .catch(console.error);

    // Checklist progress now lives server-side, keyed by this browser's
    // client id, so it survives alert reseeding and doesn't leak between
    // different visitors sharing a machine the way a single shared default
    // id would.
    const userId = getRadarClientId();
    fetch(`${API_BASE}/api/radar/checklist?userId=${encodeURIComponent(userId)}`)
      .then((r) => r.json())
      .then((data) => setCheckedActions(data.progress || {}))
      .catch(console.error);

    fetch(`${API_BASE}/api/radar/subscriptions?userId=${encodeURIComponent(userId)}`)
      .then((r) => r.json())
      .then((data) => setSubscribedIndustries(new Set(data.industries || [])))
      .catch(console.error);

    fetch(`${API_BASE}/api/radar/subject-taxonomy`)
      .then((r) => r.json())
      .then((data) => {
        setBusinessEntityTypes(data.businessEntityTypes || []);
        setNonIndustrySubjects(data.nonIndustrySubjects || []);
      })
      .catch(console.error);

    fetch(`${API_BASE}/api/radar/upcoming?limit=8`)
      .then((r) => r.json())
      .then((data) => setUpcomingAlerts(data.alerts || []))
      .catch(console.error);
  }, []);

  // Debounce the free-text query so typing doesn't fire one request per
  // keystroke; the industry and severity filters are single clicks and apply
  // immediately.
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Any filter change invalidates the current page — otherwise switching
  // industry while on page 3 could silently land on an empty page.
  useEffect(() => {
    setPage(1);
  }, [selectedIndustry, selectedSeverity, selectedSubjectCode, debouncedSearch]);

  // Fetch Alerts
  useEffect(() => {
    // Aborting the previous request stops a slow earlier response from
    // overwriting the results of a newer filter.
    const controller = new AbortController();
    setLoading(true);

    const params = new URLSearchParams();
    if (selectedIndustry !== 'ALL') params.set('industry', selectedIndustry);
    if (selectedSeverity !== 'ALL') params.set('severity', selectedSeverity);
    if (selectedSubjectCode !== 'ALL') params.set('subjectCode', selectedSubjectCode);
    if (debouncedSearch) params.set('search', debouncedSearch);
    params.set('limit', String(PAGE_SIZE));
    params.set('offset', String((page - 1) * PAGE_SIZE));

    fetch(`${API_BASE}/api/radar/alerts?${params.toString()}`, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) return;
        const data = await res.json();
        setAlerts(data.alerts || []);
        setMatchingTotal(typeof data.total === 'number' ? data.total : null);
      })
      .catch((err) => {
        if (err?.name !== 'AbortError') console.error('[Radar] Fetch alerts error:', err);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [selectedIndustry, selectedSeverity, selectedSubjectCode, debouncedSearch, page]);

  const totalPages = matchingTotal != null ? Math.max(1, Math.ceil(matchingTotal / PAGE_SIZE)) : 1;

  // Scroll the list back into view on page change so the user isn't left
  // staring at the pagination controls at the bottom of the previous page.
  const alertsListTopRef = useRef<HTMLDivElement | null>(null);
  const goToPage = (next: number) => {
    setPage(Math.min(totalPages, Math.max(1, next)));
    alertsListTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const toggleAction = (alertId: string, actionIdx: number) => {
    const key = `${alertId}_${actionIdx}`;
    const completed = !checkedActions[key];

    // Optimistic update: the checkbox flips immediately, and rolls back only
    // if the save actually fails.
    setCheckedActions((prev) => ({ ...prev, [key]: completed }));

    const userId = getRadarClientId();
    fetch(`${API_BASE}/api/radar/alerts/${alertId}/checklist/${actionIdx}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, completed }),
    }).catch((err) => {
      console.error('[Radar] Failed to save checklist progress:', err);
      setCheckedActions((prev) => ({ ...prev, [key]: !completed }));
    });
  };

  const toggleIndustrySubscription = (industry: string) => {
    const userId = getRadarClientId();
    const isSubscribed = subscribedIndustries.has(industry);

    setSubscribedIndustries((prev) => {
      const next = new Set(prev);
      if (isSubscribed) next.delete(industry);
      else next.add(industry);
      return next;
    });

    const request = isSubscribed
      ? fetch(`${API_BASE}/api/radar/subscriptions/${encodeURIComponent(industry)}?userId=${encodeURIComponent(userId)}`, {
          method: 'DELETE',
        })
      : fetch(`${API_BASE}/api/radar/subscriptions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, industry }),
        });

    request.catch((err) => {
      console.error('[Radar] Failed to update industry subscription:', err);
      setSubscribedIndustries((prev) => {
        const next = new Set(prev);
        if (isSubscribed) next.add(industry);
        else next.delete(industry);
        return next;
      });
    });
  };

  const handleOpenAudit = (alert: IndustryVariant & { title: string; documentNumber: string }, trigger: HTMLElement | null) => {
    auditTriggerRef.current = trigger;
    setAuditAlert(alert);
    const initialAnswers: Record<string, boolean> = {};
    (alert.gapQuestions || []).forEach((q) => {
      initialAnswers[q.id] = false;
    });
    setAuditAnswers(initialAnswers);
    setAuditResult(null);
    setAuditHistory([]);

    const userId = getRadarClientId();
    fetch(`${API_BASE}/api/radar/alerts/${alert.id}/audit/history?userId=${encodeURIComponent(userId)}`)
      .then((r) => r.json())
      .then((data) => setAuditHistory(data.history || []))
      .catch(console.error);
  };

  // Returning focus to the button that opened the dialog keeps keyboard users
  // where they were in the alert list.
  const handleCloseAudit = () => {
    setAuditAlert(null);
    auditTriggerRef.current?.focus();
    auditTriggerRef.current = null;
  };

  // Modal keyboard contract: Escape closes, Tab cycles inside the dialog.
  useEffect(() => {
    if (!auditAlert) return;

    const dialog = auditDialogRef.current;
    const focusables = () =>
      Array.from(
        dialog?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
        ) ?? []
      );

    focusables()[0]?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleCloseAudit();
        return;
      }
      if (e.key !== 'Tab') return;

      const items = focusables();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [auditAlert]);

  const handleRunAudit = async () => {
    if (!auditAlert) return;
    setEvaluatingAudit(true);
    try {
      const userId = getRadarClientId();
      const res = await fetch(`${API_BASE}/api/radar/alerts/${auditAlert.id}/audit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: auditAnswers, userId }),
      });
      if (res.ok) {
        const data = await res.json();
        setAuditResult(data);
        // This run just persisted a new history row on the server; append it
        // locally instead of a full refetch.
        setAuditHistory((prev) => [...prev, { id: `local-${Date.now()}`, score: data.score, createdAt: new Date().toISOString() }]);
      }
    } catch (err) {
      console.error('Audit evaluation error:', err);
    } finally {
      setEvaluatingAudit(false);
    }
  };

  const handleDownloadCSV = () => {
    // Export what the user is actually looking at, search filter included.
    const params = new URLSearchParams();
    if (selectedIndustry !== 'ALL') params.set('industry', selectedIndustry);
    if (selectedSeverity !== 'ALL') params.set('severity', selectedSeverity);
    if (selectedSubjectCode !== 'ALL') params.set('subjectCode', selectedSubjectCode);
    if (debouncedSearch) params.set('search', debouncedSearch);
    window.open(`${API_BASE}/api/radar/export-checklist?${params.toString()}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 pb-24">
      {/* Hero Header */}
      <section className="relative bg-white border-b border-slate-200 py-14 px-4 overflow-hidden">
        <div className="relative max-w-6xl mx-auto space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-50 border border-rose-100 text-xs text-rose-600 font-semibold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
              </span>
              <span>Hệ thống Giám sát & Đánh giá Rủi ro Tuân thủ 24/7 (10 Ngành Trọng Điểm)</span>
            </div>

            <button
              onClick={handleDownloadCSV}
              className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-bold flex items-center gap-2 transition-colors shadow-sm"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>Xuất Kế hoạch Tuân thủ (.csv)</span>
            </button>
          </div>

          <div className="max-w-3xl space-y-3">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900">
              Radar Cảnh Báo <span className="text-rose-600">Pháp Lý & Tuân Thủ</span>
            </h1>
            <p className="text-sm sm:text-base text-slate-500 leading-relaxed">
              Theo dõi biến động quy định mới nhất 2024–2026. Phân tích ma trận 4 trụ cột tác động: Tài chính, Quy trình, Nhân sự và Chế tài xử phạt, kèm công cụ trắc nghiệm tự chấm điểm độ sẵn sàng tuân thủ.
            </p>
          </div>

          {/* Key Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-2">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
              <span className="text-[11px] text-slate-500 font-medium block">Tổng cảnh báo ngành</span>
              <span className="text-2xl font-black text-slate-900 mt-1 block">{stats?.totalAlerts || alerts.length}</span>
            </div>
            <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4">
              <span className="text-[11px] text-rose-600 font-semibold block flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" /> Chế tài khẩn cấp
              </span>
              <span className="text-2xl font-black text-rose-600 mt-1 block">{stats?.criticalAlerts || 0}</span>
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
              <span className="text-[11px] text-amber-700 font-semibold block flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Hạn chót sắp tới
              </span>
              <span className="text-2xl font-black text-amber-600 mt-1 block">{stats?.upcomingDeadlines || 0}</span>
            </div>
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
              <span className="text-[11px] text-emerald-600 font-semibold block flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" /> Ngành kinh tế phủ sóng
              </span>
              <span className="text-2xl font-black text-emerald-600 mt-1 block">{industries.length || 10}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="max-w-6xl mx-auto px-4 pt-10 space-y-8">
        {/* 0. Luật sắp có hiệu lực */}
        {upcomingAlerts.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-500" aria-hidden="true" />
              Luật Sắp Có Hiệu Lực
            </h2>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x">
              {upcomingAlerts.map((item) => {
                const daysLeft = item.effectiveDate
                  ? Math.ceil((new Date(item.effectiveDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                  : null;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setSelectedIndustry(item.industry);
                      setSearchQuery(item.documentNumber);
                    }}
                    className="shrink-0 w-64 snap-start text-left p-4 rounded-2xl bg-white dark:bg-slate-900 border border-amber-300/50 dark:border-amber-700/40 hover:border-amber-400 transition-colors shadow-sm"
                  >
                    <div className="flex items-center justify-between mb-1.5 gap-1.5">
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                        {daysLeft != null ? `Còn ${daysLeft} ngày` : 'Sắp hiệu lực'}
                      </span>
                      {item.otherIndustryCount > 0 && (
                        <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 shrink-0">
                          +{item.otherIndustryCount} ngành khác
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">{item.documentNumber}</div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug mt-0.5" title={item.title}>
                      {item.title}
                    </div>
                    {item.effectiveDate && (
                      <div className="text-[10px] text-slate-400 mt-2">
                        Hiệu lực: {new Date(item.effectiveDate).toLocaleDateString('vi-VN')}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 1. Industry Selector Grid (10 Industries) */}
        <div ref={alertsListTopRef} className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-blue-500" />
              Chọn Lĩnh vực & Ngành Kinh tế (10 Ngành)
            </h2>
            {selectedIndustry !== 'ALL' && (
              <button
                type="button"
                onClick={() => setSelectedIndustry('ALL')}
                className="text-xs text-blue-600 dark:text-yellow-400 font-semibold hover:underline"
              >
                Xem tất cả các ngành
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <button
              type="button"
              onClick={() => setSelectedIndustry('ALL')}
              className={`p-3.5 rounded-2xl text-left transition-all border ${
                selectedIndustry === 'ALL'
                  ? 'bg-[#0B1D51] text-white border-[#0B1D51] dark:bg-yellow-400 dark:text-[#0B1D51] dark:border-yellow-400 shadow-md font-bold scale-[1.02]'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-yellow-400/50'
              }`}
            >
              <Globe className="w-5 h-5 mb-1.5" aria-hidden="true" />
              <div className="text-xs font-bold leading-snug">Tất cả ngành</div>
              <div className="text-[10px] opacity-60 mt-0.5">{stats?.totalAlerts ?? alerts.length} văn bản</div>
            </button>

            {industries.map((ind) => {
              const isSelected = selectedIndustry === ind.id;
              const IndustryIcon = getTopicIcon(ind.icon);
              const isSubscribed = subscribedIndustries.has(ind.id);
              return (
                <div key={ind.id} className="relative">
                  <button
                    type="button"
                    onClick={() => setSelectedIndustry(ind.id)}
                    aria-pressed={isSelected}
                    className={`w-full p-3.5 rounded-2xl text-left transition-all border ${
                      isSelected
                        ? 'bg-[#0B1D51] text-white border-[#0B1D51] dark:bg-yellow-400 dark:text-[#0B1D51] dark:border-yellow-400 shadow-md font-bold scale-[1.02]'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-yellow-400/50'
                    }`}
                  >
                    <IndustryIcon className="w-5 h-5 mb-1.5" aria-hidden="true" />
                    <div className="text-xs font-bold leading-snug line-clamp-2 pr-4 min-h-[2lh]">{ind.name}</div>
                    <div className="text-[10px] opacity-60 mt-0.5">{ind.alertCount} cảnh báo</div>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleIndustrySubscription(ind.id);
                    }}
                    aria-pressed={isSubscribed}
                    aria-label={isSubscribed ? `Bỏ theo dõi ${ind.name}` : `Theo dõi ${ind.name} để nhận nhắc hạn`}
                    title={isSubscribed ? 'Đang theo dõi — nhận nhắc hạn tuân thủ ngành này' : 'Theo dõi ngành này để nhận nhắc hạn'}
                    className={`absolute top-2.5 right-2.5 p-1 rounded-lg transition-colors ${
                      isSubscribed
                        ? 'text-amber-400'
                        : isSelected
                        ? 'text-white/50 hover:text-white'
                        : 'text-slate-300 dark:text-slate-600 hover:text-amber-400'
                    }`}
                  >
                    <Bell className="w-3.5 h-3.5" fill={isSubscribed ? 'currentColor' : 'none'} aria-hidden="true" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. Filter & Search Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-yellow-500" /> Mức độ rủi ro:
            </span>
            {(['ALL', 'CRITICAL', 'WARNING', 'INFO'] as const).map((sev) => (
              <button
                key={sev}
                type="button"
                onClick={() => setSelectedSeverity(sev)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  selectedSeverity === sev
                    ? sev === 'CRITICAL'
                      ? 'bg-rose-600 text-white shadow'
                      : sev === 'WARNING'
                      ? 'bg-amber-500 text-slate-950 shadow'
                      : sev === 'INFO'
                      ? 'bg-blue-600 text-white shadow'
                      : 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {sev === 'ALL' && 'Tất cả'}
                {sev === 'CRITICAL' && (
                  <span className="inline-flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" /> Khẩn cấp / Chế tài nặng
                  </span>
                )}
                {sev === 'WARNING' && (
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" aria-hidden="true" /> Cảnh báo thay đổi
                  </span>
                )}
                {sev === 'INFO' && (
                  <span className="inline-flex items-center gap-1">
                    <Info className="w-3.5 h-3.5" aria-hidden="true" /> Hướng dẫn & Khuyến nghị
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-1.5">
              <label htmlFor="radar-subject-filter" className="sr-only">Lọc theo đối tượng áp dụng</label>
              <select
                id="radar-subject-filter"
                value={selectedSubjectCode}
                onChange={(e) => setSelectedSubjectCode(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 pl-2.5 pr-7 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-yellow-400"
              >
                <option value="ALL">Mọi đối tượng áp dụng</option>
                {businessEntityTypes.length > 0 && (
                  <optgroup label="Loại hình doanh nghiệp">
                    {businessEntityTypes.map((t) => (
                      <option key={t.code} value={t.code}>{t.name}</option>
                    ))}
                  </optgroup>
                )}
                {nonIndustrySubjects.length > 0 && (
                  <optgroup label="Nhóm đối tượng">
                    {nonIndustrySubjects.map((t) => (
                      <option key={t.code} value={t.code}>{t.name}</option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>

            <div className="relative flex items-center flex-1 sm:w-64">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm luật liên quan theo số hiệu, tên luật..."
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 pl-8 pr-3 text-xs focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5" />
            </div>
          </div>
        </div>

        {/* 3. Alerts List with 4-Pillar Impact Matrix */}
        {loading ? (
          <div className="py-20 text-center text-slate-400 text-xs">Đang tải cảnh báo tuân thủ...</div>
        ) : alerts.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
            <ShieldAlert className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">Không có cảnh báo phù hợp</h3>
            <p className="text-xs text-slate-400 mt-1">Thử đổi bộ lọc ngành hoặc mức độ rủi ro.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {matchingTotal !== null && matchingTotal > 0 && (
              <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                Tìm thấy <strong className="text-slate-800 dark:text-white">{matchingTotal}</strong> cảnh báo phù hợp
                {totalPages > 1 ? ` — trang ${page}/${totalPages}` : ''}.
              </p>
            )}

            {alerts.map((alert) => {
              const activeIndustryCode = activeIndustryTab[alert.documentNumber] || alert.industries[0].industry;
              const variant = alert.industries.find((i) => i.industry === activeIndustryCode) || alert.industries[0];
              const activeTab = activePillarTabs[variant.id] || 'financial';
              return (
                <div
                  key={alert.documentNumber}
                  className={`bg-white dark:bg-slate-900 rounded-3xl border overflow-hidden transition-all shadow-sm ${
                    variant.severity === 'CRITICAL'
                      ? 'border-rose-500/40 hover:border-rose-500'
                      : variant.severity === 'WARNING'
                      ? 'border-amber-500/40 hover:border-amber-500'
                      : 'border-slate-200 dark:border-slate-800 hover:border-blue-400'
                  }`}
                >
                  {/* Alert Header */}
                  <div className="p-6 border-b border-slate-100 dark:border-slate-800 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-extrabold flex items-center gap-1.5 ${
                            variant.severity === 'CRITICAL'
                              ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                              : variant.severity === 'WARNING'
                              ? 'bg-amber-500/15 text-amber-700 dark:text-yellow-400 border border-amber-500/30'
                              : 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                          }`}
                        >
                          {variant.severity === 'CRITICAL' && <ShieldAlert className="w-3.5 h-3.5" />}
                          {variant.severity === 'WARNING' && <AlertTriangle className="w-3.5 h-3.5" />}
                          {variant.severity === 'INFO' && <Info className="w-3.5 h-3.5" />}
                          <span>
                            {variant.severity === 'CRITICAL' ? 'KHẨN CẤP / CHẾ TÀI NẶNG' : variant.severity === 'WARNING' ? 'CẢNH BÁO THAY ĐỔI' : 'HƯỚNG DẪN'}
                          </span>
                        </span>

                        {alert.industries.length === 1 && (
                          <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {variant.industryName}
                          </span>
                        )}
                      </div>

                      {/* Right Action: Self-Audit Button */}
                      {variant.gapQuestions && variant.gapQuestions.length > 0 && (
                        <button
                          type="button"
                          onClick={(e) => handleOpenAudit({ ...variant, title: alert.title, documentNumber: alert.documentNumber }, e.currentTarget)}
                          className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-sm transition-transform active:scale-95"
                        >
                          <Award className="w-3.5 h-3.5" />
                          <span>Tự Đánh Giá Lỗ Hổng Tuân Thủ</span>
                        </button>
                      )}
                    </div>

                    {/* Industry tabs — same law, different lens. Only shown when
                        this document actually has more than one. */}
                    {alert.industries.length > 1 && (
                      <div role="tablist" aria-label="Chọn ngành để xem phân tích" className="flex flex-wrap gap-1.5">
                        {alert.industries.map((ind) => {
                          const isActive = ind.industry === variant.industry;
                          return (
                            <button
                              key={ind.industry}
                              type="button"
                              role="tab"
                              aria-selected={isActive}
                              onClick={() => setActiveIndustryTab({ ...activeIndustryTab, [alert.documentNumber]: ind.industry })}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                                isActive
                                  ? 'bg-[#0B1D51] text-yellow-400 dark:bg-yellow-400 dark:text-[#0B1D51]'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                              }`}
                            >
                              {ind.severity === 'CRITICAL' && (
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" aria-hidden="true" />
                              )}
                              {ind.industryName}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                          {alert.documentNumber}
                        </span>
                        {alert.documentId && (
                          <Link
                            href={`/documents/${alert.documentId}`}
                            className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" aria-hidden="true" />
                            <span>Xem văn bản gốc</span>
                          </Link>
                        )}
                      </div>
                      <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-snug">
                        {alert.title}
                      </h2>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl">
                      {variant.summary}
                    </p>

                    {/* Timeline & Max Penalty Badge */}
                    <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1">
                      <div className="flex flex-wrap items-center gap-4 text-slate-500">
                        {alert.effectiveDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-blue-500" />
                            Hiệu lực: <strong>{new Date(alert.effectiveDate).toLocaleDateString('vi-VN')}</strong>
                          </span>
                        )}
                        {variant.deadlineDate && (
                          <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-semibold">
                            <Clock className="w-3.5 h-3.5" />
                            Hạn chót tuân thủ: <strong>{new Date(variant.deadlineDate).toLocaleDateString('vi-VN')}</strong>
                          </span>
                        )}
                      </div>

                      {variant.maxPenaltyAmount && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs font-bold">
                          <Scale className="w-3.5 h-3.5" />
                          <span>Mức phạt tối đa: {variant.maxPenaltyAmount}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 4-Pillar Impact Matrix */}
                  <div className="p-6 bg-slate-50/50 dark:bg-slate-800/20 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-yellow-500" />
                      Ma trận Phân tích 4 Trụ cột Tác động Doanh nghiệp
                    </h3>

                    {/* Pillar Tabs */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                      <button
                        type="button"
                        onClick={() => setActivePillarTabs({ ...activePillarTabs, [variant.id]: 'financial' })}
                        className={`p-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                          activeTab === 'financial'
                            ? 'bg-[#0B1D51] text-yellow-400 dark:bg-yellow-400 dark:text-[#0B1D51] shadow-sm'
                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        <DollarSign className="w-3.5 h-3.5" />
                        <span>1. Tài chính & Chi phí</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActivePillarTabs({ ...activePillarTabs, [variant.id]: 'operational' })}
                        className={`p-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                          activeTab === 'operational'
                            ? 'bg-[#0B1D51] text-yellow-400 dark:bg-yellow-400 dark:text-[#0B1D51] shadow-sm'
                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        <Briefcase className="w-3.5 h-3.5" />
                        <span>2. Quy trình & Vận hành</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActivePillarTabs({ ...activePillarTabs, [variant.id]: 'hr' })}
                        className={`p-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                          activeTab === 'hr'
                            ? 'bg-[#0B1D51] text-yellow-400 dark:bg-yellow-400 dark:text-[#0B1D51] shadow-sm'
                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>3. Nhân sự & Phân quyền</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActivePillarTabs({ ...activePillarTabs, [variant.id]: 'penalty' })}
                        className={`p-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                          activeTab === 'penalty'
                            ? 'bg-[#0B1D51] text-yellow-400 dark:bg-yellow-400 dark:text-[#0B1D51] shadow-sm'
                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        <Scale className="w-3.5 h-3.5" />
                        <span>4. Chế tài & Xử phạt VPHC</span>
                      </button>
                    </div>

                    {/* Pillar Content Panel */}
                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed min-h-[70px]">
                      {activeTab === 'financial' && (
                        <div>
                          <strong className="text-emerald-700 dark:text-emerald-400 font-bold block mb-1"><DollarSign className="w-3.5 h-3.5 inline" aria-hidden="true" /> Tác động Tài chính & Chi phí đầu tư tuân thủ:</strong>
                          {variant.financialImpact || 'Cần trích lập ngân sách dự phòng tuân thủ và nâng cấp cơ sở vật chất kỹ thuật.'}
                        </div>
                      )}
                      {activeTab === 'operational' && (
                        <div>
                          <strong className="text-blue-700 dark:text-blue-400 font-bold block mb-1"><Settings className="w-3.5 h-3.5 inline" aria-hidden="true" /> Tác động Quy trình & Biểu mẫu Vận hành:</strong>
                          {variant.operationalImpact || 'Rà soát lại toàn bộ hợp đồng mẫu, chính sách nội bộ và quy chế kinh doanh.'}
                        </div>
                      )}
                      {activeTab === 'hr' && (
                        <div>
                          <strong className="text-amber-700 dark:text-yellow-400 font-bold block mb-1"><Users className="w-3.5 h-3.5 inline" aria-hidden="true" /> Tác động Nhân sự, Phân quyền & Đào tạo:</strong>
                          {variant.hrImpact || 'Phân công nhân sự đầu mối chuyên trách và tổ chức phổ biến nội bộ.'}
                        </div>
                      )}
                      {activeTab === 'penalty' && (
                        <div>
                          <strong className="text-rose-700 dark:text-rose-400 font-bold block mb-1"><Scale className="w-3.5 h-3.5 inline" aria-hidden="true" /> Căn cứ Chế tài Xử phạt & Mức phạt tối đa:</strong>
                          <p>{variant.penaltyReference || 'Theo Nghị định xử phạt vi phạm hành chính chuyên ngành tương ứng.'}</p>
                          {variant.maxPenaltyAmount && (
                            <p className="mt-1 font-bold text-rose-600 dark:text-rose-400">Mức phạt cao nhất: {variant.maxPenaltyAmount}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Checklist */}
                  <div className="p-6 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <CheckSquare className="w-4 h-4 text-emerald-500" />
                        Danh mục Hành động Cần Thực hiện Ngay ({variant.actionChecklist?.length || 0} việc)
                      </h4>
                      <div className="flex items-center gap-1">
                        {(variant.affectedAreas || []).map((area, idx) => (
                          <span key={idx} className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded font-medium">
                            {area}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      {(variant.actionChecklist || []).map((action, idx) => {
                        const isDone = !!checkedActions[`${variant.id}_${idx}`];
                        return (
                          <label
                            key={idx}
                            className={`p-3 rounded-2xl border flex items-start gap-3 cursor-pointer select-none transition-all ${
                              isDone
                                ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40 text-emerald-900 dark:text-emerald-300 line-through opacity-75'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isDone}
                              onChange={() => toggleAction(variant.id, idx)}
                              className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                            />
                            <span className="text-xs font-medium leading-relaxed">{action}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Pagination */}
            {totalPages > 1 && (
              <nav aria-label="Điều hướng trang cảnh báo" className="flex items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => goToPage(page - 1)}
                  disabled={page <= 1}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:border-yellow-400/60 transition-colors"
                >
                  Trước
                </button>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-2">
                  Trang <strong className="text-slate-800 dark:text-white">{page}</strong> / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => goToPage(page + 1)}
                  disabled={page >= totalPages}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:border-yellow-400/60 transition-colors"
                >
                  Sau
                </button>
              </nav>
            )}
          </div>
        )}
      </div>

      {/* Cross-link to the complementary role-based view + legal disclaimer */}
      <div className="max-w-6xl mx-auto px-4 pb-10 space-y-4">
        <Link
          href="/canh-bao-luat-moi"
          className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-yellow-400/50 transition-colors group"
        >
          <span className="text-xs text-slate-600 dark:text-slate-400">
            <strong className="text-slate-900 dark:text-white">Muốn xem theo vai trò trong doanh nghiệp</strong> (Ban Giám đốc, HR, Kế toán...) thay vì theo ngành?
            Xem trang <strong className="text-slate-900 dark:text-white">Cảnh báo Luật mới & Nhắc hạn Tuân thủ</strong> — góc nhìn bổ sung, không thay thế Radar.
          </span>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-yellow-500 shrink-0" aria-hidden="true" />
        </Link>

        <p className="text-[11px] leading-relaxed text-slate-400 dark:text-slate-500 text-center px-4">
          Thông tin trên mang tính chất tham khảo, không thay thế tư vấn pháp lý chuyên nghiệp. Vui lòng đối chiếu văn bản gốc và tham vấn chuyên gia pháp lý trước khi ra quyết định.
        </p>
      </div>

      {/* 4. Interactive Compliance Gap Self-Audit Modal */}
      {auditAlert && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in-50"
          onClick={handleCloseAudit}
        >
          <div
            ref={auditDialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="radar-audit-title"
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-xs font-bold text-yellow-600 dark:text-yellow-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                  <Award className="w-4 h-4" />
                  Trắc Nghiệm Tự Đánh Giá Lỗ Hổng Tuân Thủ
                </span>
                <h3 id="radar-audit-title" className="text-lg font-black text-slate-900 dark:text-white leading-snug">
                  {auditAlert.title} ({auditAlert.documentNumber})
                </h3>
              </div>

              <button
                type="button"
                onClick={handleCloseAudit}
                aria-label="Đóng bảng tự đánh giá"
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            {/* Score Trend — this browser's history of self-audits for this alert */}
            {auditHistory.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1 shrink-0">
                  <TrendingUp className="w-3.5 h-3.5" aria-hidden="true" />
                  Lịch sử điểm:
                </span>
                {auditHistory.map((h, i) => (
                  <span
                    key={h.id}
                    className={`text-xs font-bold px-2 py-0.5 rounded-lg ${
                      i === auditHistory.length - 1
                        ? 'bg-yellow-400 text-slate-950'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                    title={new Date(h.createdAt).toLocaleString('vi-VN')}
                  >
                    {h.score === null ? '—' : `${h.score}%`}
                  </span>
                ))}
              </div>
            )}

            {/* Questions Checklist */}
            <div className="space-y-3">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tick chọn các hạng mục mà doanh nghiệp bạn <strong>đã hoàn thành thực tế</strong>:
              </p>

              {(auditAlert.gapQuestions || []).map((q) => {
                const checked = !!auditAnswers[q.id];
                return (
                  <label
                    key={q.id}
                    className={`p-3.5 rounded-2xl border flex items-start gap-3 cursor-pointer select-none transition-all ${
                      checked
                        ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 font-semibold'
                        : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => setAuditAnswers({ ...auditAnswers, [q.id]: e.target.checked })}
                      className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div className="flex-1 text-xs leading-relaxed">
                      <span>{q.question}</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">Trọng số rủi ro: {q.weight} điểm</span>
                    </div>
                  </label>
                );
              })}
            </div>

            {/* Result Assessment Card */}
            {auditResult && (
              <div
                className={`p-5 rounded-2xl border space-y-3 animate-in fade-in-50 ${
                  auditResult.tier === 'NOT_APPLICABLE'
                    ? 'bg-slate-50 dark:bg-slate-800/50 border-slate-300 dark:border-slate-700'
                    : auditResult.tier === 'EXCELLENT'
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800'
                    : auditResult.tier === 'GOOD'
                    ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-300 dark:border-blue-800'
                    : auditResult.tier === 'MODERATE'
                    ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800'
                    : 'bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Điểm số Sẵn sàng Tuân thủ (Readiness Score):
                  </span>
                  <span className="text-2xl font-black">
                    {auditResult.score === null || auditResult.score === undefined ? '—' : `${auditResult.score}%`}
                  </span>
                </div>

                <div className="text-xs font-bold flex items-center gap-1.5">
                  <span>Xếp loại:</span>
                  {auditResult.tier === 'NOT_APPLICABLE' && (
                    <span className="inline-flex items-center gap-1"><Info className="w-3.5 h-3.5" aria-hidden="true" /> CHƯA CÓ BỘ TIÊU CHÍ ĐÁNH GIÁ</span>
                  )}
                  {auditResult.tier === 'EXCELLENT' && (
                    <span className="inline-flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" /> XUẤT SẮC - RỦI RO THẤP</span>
                  )}
                  {auditResult.tier === 'GOOD' && (
                    <span className="inline-flex items-center gap-1"><Info className="w-3.5 h-3.5" aria-hidden="true" /> TỐT - CẦN BỔ SUNG NHẸ</span>
                  )}
                  {auditResult.tier === 'MODERATE' && (
                    <span className="inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5" aria-hidden="true" /> TRUNG BÌNH - CẦN KHẮC PHỤC SỚM</span>
                  )}
                  {auditResult.tier === 'HIGH_RISK' && (
                    <span className="inline-flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" /> NGUY CƠ RỦI RO CAO - DỄ BỊ PHẠT</span>
                  )}
                </div>

                {auditResult.urgentRemediations?.length > 0 && (
                  <div className="pt-2 border-t border-black/10 dark:border-white/10 text-xs space-y-1.5">
                    <strong className="flex items-center gap-1.5 text-rose-700 dark:text-rose-400 font-bold">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" /> Các hành động cần bổ sung ngay:
                    </strong>
                    {auditResult.urgentRemediations.map((rem: string, i: number) => (
                      <div key={i} className="flex items-start gap-1.5">
                        <span>•</span>
                        <span>{rem}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleCloseAudit}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200"
              >
                Đóng
              </button>

              <button
                type="button"
                onClick={handleRunAudit}
                disabled={evaluatingAudit}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 text-xs font-bold shadow-md shadow-yellow-500/20 active:scale-95 transition-all"
              >
                {evaluatingAudit ? 'Đang chấm điểm...' : 'Chấm điểm & Xem Khuyến nghị'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
