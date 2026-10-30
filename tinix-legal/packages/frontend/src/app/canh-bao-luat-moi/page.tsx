'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  Bell,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Calendar,
  Building2,
  Users,
  DollarSign,
  Home,
  Cpu,
  Truck,
  Layers,
  Search,
  Download,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  ChevronRight,
  Printer,
  Scale,
  BookOpen,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface ActionChecklistItem {
  id: string;
  task: string;
  deadline: string;
  penaltyRisk: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM';
}

interface StakeholderImpact {
  role: string;
  roleName: string;
  iconName: string;
  riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  impactSummary: string;
  actionChecklist: ActionChecklistItem[];
}

interface LawPulseItem {
  id: string;
  code: string;
  number: string;
  title: string;
  effectiveDate: string;
  status: 'UPCOMING' | 'NEWLY_ENFORCED' | 'URGENT';
  category: string;
  summary: string;
  keyChanges: string[];
  penaltyHighlights: string[];
  stakeholderImpacts: StakeholderImpact[];
  relatedDocSlug?: string;
}

interface RoleItem {
  code: string;
  name: string;
  iconName: string;
}

const ROLE_ICONS: Record<string, typeof Building2> = {
  Building2,
  Users,
  DollarSign,
  Home,
  Cpu,
  Truck,
  Layers,
};

export default function CanhBaoLuatMoiPage() {
  const [items, setItems] = useState<LawPulseItem[]>([]);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [checkedTasks, setCheckedTasks] = useState<Record<string, boolean>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('tinix_law_pulse_checked_tasks');
        if (saved) return JSON.parse(saved);
      } catch (e) {
        console.warn('Failed to load checked tasks:', e);
      }
    }
    return {};
  });
  const [loading, setLoading] = useState<boolean>(true);

  // Sync checkedTasks to localStorage whenever changed
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('tinix_law_pulse_checked_tasks', JSON.stringify(checkedTasks));
      } catch (e) {
        console.warn('Failed to save checked tasks:', e);
      }
    }
  }, [checkedTasks]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiClient.getLawPulseItems({
        role: selectedRole,
        status: selectedStatus,
        search: searchQuery,
      });
      setItems(data.items || []);
      setRoles(data.roles || []);
    } catch (err) {
      console.error('Error loading law pulse data:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedRole, selectedStatus, searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const toggleTask = (taskId: string) => {
    setCheckedTasks((prev) => ({
      ...prev,
      [taskId]: !prev[taskId],
    }));
  };


  // Calculate stats
  const totalTasksCount = useMemo(() => {
    return items.reduce((acc, item) => {
      return (
        acc +
        item.stakeholderImpacts.reduce((sAcc, imp) => sAcc + imp.actionChecklist.length, 0)
      );
    }, 0);
  }, [items]);

  const completedTasksCount = useMemo(() => {
    return Object.values(checkedTasks).filter(Boolean).length;
  }, [checkedTasks]);

  const readinessPercent = useMemo(() => {
    if (totalTasksCount === 0) return 0;
    return Math.min(100, Math.round((completedTasksCount / totalTasksCount) * 100));
  }, [completedTasksCount, totalTasksCount]);

  // Export CSV Action Plan
  const exportCSV = () => {
    const rows = [
      ['Mã Luật', 'Tên Luật / Quy định', 'Ngày hiệu lực', 'Vai trò chịu tác động', 'Mức độ rủi ro', 'Đầu việc cần chuẩn bị', 'Hạn hoàn thành', 'Chế tài / Rủi ro nếu chậm trễ', 'Trạng thái hoàn thành'],
    ];

    items.forEach((item) => {
      item.stakeholderImpacts.forEach((imp) => {
        imp.actionChecklist.forEach((task) => {
          rows.push([
            `"${item.number}"`,
            `"${item.title}"`,
            `"${item.effectiveDate}"`,
            `"${imp.roleName}"`,
            `"${imp.riskLevel}"`,
            `"${task.task.replace(/"/g, '""')}"`,
            `"${task.deadline}"`,
            `"${task.penaltyRisk.replace(/"/g, '""')}"`,
            checkedTasks[task.id] ? '"ĐÃ HOÀN THÀNH"' : '"CHƯA HOÀN THÀNH"',
          ]);
        });
      });
    });

    const csvContent = '\uFEFF' + rows.map((e) => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Ke_Hoach_Tuan_Thu_Luat_Moi_2025_2026.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getDaysCountdown = (dateStr: string) => {
    const target = new Date(dateStr).getTime();
    const now = new Date().getTime();
    const diff = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
    if (diff > 0) return `Còn ${diff} ngày`;
    if (diff === 0) return 'Có hiệu lực hôm nay';
    return `Đã có hiệu lực ${Math.abs(diff)} ngày`;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans pb-20">
      {/* ── HERO HEADER ── */}
      <section className="relative bg-white border-b border-slate-200 overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-4 py-12 sm:py-16">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold uppercase tracking-wider">
              <Bell className="w-3.5 h-3.5 text-rose-500" />
              Radar Cảnh Báo & Nhắc Hạn
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-medium">
              <Sparkles className="w-3.5 h-3.5 text-accent-600" />
              Giai đoạn 2025 – 2026
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 mb-4">
            Trung Tâm Cảnh Báo & Nhắc Hạn <span className="text-blue-700">Luật Mới Chuẩn Bị Hiệu Lực</span>
          </h1>

          <p className="text-slate-500 text-xs sm:text-base max-w-3xl leading-relaxed mb-8">
            Bản đồ theo dõi mốc hiệu lực các Đại luật mới, phân tích tác động trực tiếp theo từng vị trí (Ban Giám đốc, HR, Kế toán, Bất động sản, IT, Logistics) kèm Checklist hành động và chế tài xử phạt phòng ngừa rủi ro.
          </p>

          {/* Key Metric Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-4xl bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200">
            <div>
              <div className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Luật đang theo dõi</div>
              <div className="text-xl sm:text-2xl font-black text-blue-700 mt-1">{items.length} Luật/Nghị định</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Tổng đầu việc cần làm</div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1">{totalTasksCount} Hạng mục</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Đã hoàn thành</div>
              <div className="text-xl sm:text-2xl font-black text-emerald-600 mt-1">{completedTasksCount} / {totalTasksCount}</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Mức độ sẵn sàng tuân thủ</div>
              <div className="flex items-center gap-2 mt-1">
                <div className="text-xl sm:text-2xl font-black text-blue-700">{readinessPercent}%</div>
                <div className="flex-1 bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-accent-500 to-emerald-500 h-full transition-all duration-500"
                    style={{ width: `${readinessPercent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FILTER & ACTION CONTROLS ── */}
      <section className="max-w-7xl mx-auto px-4 -mt-6 relative z-10">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 space-y-5">
          {/* Search and Action Bar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm luật, số hiệu, từ khóa (BHXH, Đất đai, Dữ liệu cá nhân, Giao thông...)"
                className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                onClick={exportCSV}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Xuất Kế Hoạch CSV</span>
              </button>

              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs sm:text-sm transition-all"
              >
                <Printer className="w-4 h-4" />
                <span>In Bản Cảnh Báo</span>
              </button>
            </div>
          </div>

          {/* Role Filter Tabs */}
          <div>
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2.5">
              Lọc theo Vai trò & Khối phòng ban:
            </div>
            <div className="flex flex-wrap gap-2">
              {roles.map((r) => {
                const IconComponent = ROLE_ICONS[r.iconName] || Layers;
                const isSelected = selectedRole === r.code;
                return (
                  <button
                    key={r.code}
                    onClick={() => setSelectedRole(r.code)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 ring-2 ring-blue-600'
                        : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <IconComponent className="w-3.5 h-3.5" />
                    <span>{r.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── LAW PULSE CARDS LIST ── */}
      <section className="max-w-7xl mx-auto px-4 py-10">
        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-xs text-slate-500">Đang tải danh sách cảnh báo hiệu lực luật mới...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
            <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Không tìm thấy cảnh báo phù hợp</h3>
            <p className="text-xs text-slate-500 mt-1">Vui lòng thử chọn vai trò khác hoặc xóa bộ lọc tìm kiếm.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {items.map((item) => {
              const countdown = getDaysCountdown(item.effectiveDate);
              return (
                <div
                  key={item.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all overflow-hidden"
                >
                  {/* Card Header */}
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                          {item.number}
                        </span>
                        <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          {item.category}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                            item.status === 'URGENT'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                              : item.status === 'UPCOMING'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          }`}
                        >
                          {item.status === 'URGENT' ? (
                            <AlertTriangle className="w-3 h-3" aria-hidden="true" />
                          ) : item.status === 'UPCOMING' ? (
                            <Clock className="w-3 h-3" aria-hidden="true" />
                          ) : (
                            <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
                          )}
                          {item.status === 'URGENT'
                            ? 'KHẨN CẤP / ĐANG THANH TRA'
                            : item.status === 'UPCOMING'
                            ? 'SẮP HIỆU LỰC'
                            : 'ĐANG ÁP DỤNG'}
                        </span>
                      </div>

                      <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-snug">
                        {item.title}
                      </h2>
                    </div>

                    {/* Countdown Box */}
                    <div className="flex items-center gap-3 shrink-0 bg-white dark:bg-slate-800 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                      <Calendar className="w-5 h-5 text-blue-600" />
                      <div>
                        <div className="text-[10px] uppercase font-bold text-slate-400">Hiệu lực: {item.effectiveDate}</div>
                        <div className="text-xs font-black text-rose-600 dark:text-rose-400">{countdown}</div>
                      </div>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 sm:p-6 space-y-6">
                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                      {item.summary}
                    </p>

                    {/* Key Changes & Penalty Highlights Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40">
                        <h4 className="text-xs font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-blue-600" />
                          Điểm mới cốt lõi cần lưu ý
                        </h4>
                        <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                          {item.keyChanges.map((change, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-blue-500 font-bold">•</span>
                              <span>{change}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="p-4 rounded-xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40">
                        <h4 className="text-xs font-bold text-rose-900 dark:text-rose-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-rose-600" />
                          Chế tài & Mức phạt nếu vi phạm
                        </h4>
                        <ul className="space-y-1.5 text-xs text-rose-700 dark:text-rose-300">
                          {item.penaltyHighlights.map((penalty, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-rose-500 font-bold">•</span>
                              <span>{penalty}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Stakeholder Action Checklists */}
                    <div>
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        Phân Tích Tác Động & Checklist Hành Động Theo Vai Trò
                      </h3>

                      <div className="space-y-4">
                        {item.stakeholderImpacts.map((impact, impIdx) => {
                          const IconComp = ROLE_ICONS[impact.iconName] || Users;
                          return (
                            <div
                              key={impIdx}
                              className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50/50 dark:bg-slate-800/30"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-200 dark:border-slate-700">
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 flex items-center justify-center">
                                    <IconComp className="w-4 h-4" />
                                  </div>
                                  <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                                    {impact.roleName}
                                  </span>
                                </div>

                                <span
                                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                                    impact.riskLevel === 'CRITICAL'
                                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                      : impact.riskLevel === 'HIGH'
                                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                      : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                                  }`}
                                >
                                  Mức độ rủi ro: {impact.riskLevel}
                                </span>
                              </div>

                              <p className="text-xs text-slate-600 dark:text-slate-400 mb-3 italic flex items-start gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-500" aria-hidden="true" />
                                {impact.impactSummary}
                              </p>

                              {/* Interactive Action Checklist */}
                              <div className="space-y-2">
                                {impact.actionChecklist.map((action) => {
                                  const isChecked = Boolean(checkedTasks[action.id]);
                                  return (
                                    <div
                                      key={action.id}
                                      onClick={() => toggleTask(action.id)}
                                      className={`p-3 rounded-lg border transition-all cursor-pointer flex items-start gap-3 ${
                                        isChecked
                                          ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
                                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-300'
                                      }`}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={() => toggleTask(action.id)}
                                        onClick={(e) => e.stopPropagation()}
                                        aria-label={action.task}
                                        className="mt-0.5 w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                                      />
                                      <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                          <span
                                            className={`text-xs font-semibold ${
                                              isChecked
                                                ? 'line-through text-slate-400 dark:text-slate-500'
                                                : 'text-slate-800 dark:text-slate-100'
                                            }`}
                                          >
                                            {action.task}
                                          </span>
                                          <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded">
                                            Hạn: {action.deadline}
                                          </span>
                                        </div>
                                        <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 flex items-start gap-1">
                                          <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" aria-hidden="true" />
                                          <span><strong className="text-slate-500 dark:text-slate-400">Rủi ro:</strong> {action.penaltyRisk}</span>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Quick Link Footer */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                      <Link
                        href="/so-sanh-luat"
                        className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                      >
                        <span>So sánh bảng đối chiếu luật cũ - mới</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── RELATED FLAGSHIP TOOLS ── */}
      <section className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm border border-slate-200">
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <Scale className="w-5 h-5 text-accent-600" />
              Cần Thẩm Định Rủi Ro Hợp Đồng Theo Luật Mới?
            </h3>
            <p className="text-xs sm:text-sm text-slate-500">
              Sử dụng Trợ lý AI Soạn thảo hoặc Audit Rủi ro để quét tự động các điều khoản vi phạm trần phạt hoặc quy định mới.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/contract-audit"
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
            >
              Audit Rủi Ro Hợp Đồng
            </Link>
            <Link
              href="/soan-thao"
              className="px-5 py-2.5 rounded-xl bg-accent-500 hover:bg-accent-600 text-white font-extrabold text-xs shadow-sm transition flex items-center gap-2"
            >
              <span>Mở Trợ Lý Soạn Thảo</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Cross-link to the complementary industry-based view */}
      <section className="max-w-7xl mx-auto px-4 pt-4">
        <Link
          href="/radar-phap-ly"
          className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-yellow-400/50 transition-colors group"
        >
          <span className="text-xs text-slate-600 dark:text-slate-400">
            <strong className="text-slate-900 dark:text-white">Muốn xem theo ngành kinh tế</strong> (Ngân hàng, Bất động sản, Y tế...) kèm tự chấm điểm sẵn sàng tuân thủ?
            Xem trang <strong className="text-slate-900 dark:text-white">Radar Tuân thủ Pháp lý</strong> — góc nhìn bổ sung, không thay thế trang này.
          </span>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-yellow-500 shrink-0" aria-hidden="true" />
        </Link>
      </section>
    </div>
  );
}
