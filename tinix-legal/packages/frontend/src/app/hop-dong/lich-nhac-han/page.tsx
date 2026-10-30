'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Calendar as CalendarIcon,
  Clock,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  FileText,
  Sparkles,
  Download,
  Plus,
  Trash2,
  ChevronRight,
  Filter,
  Search,
  ArrowRight,
  Loader2,
  BellRing,
  ShieldAlert,
  Layers,
  CreditCard,
  RefreshCw,
  ShieldCheck,
  Package,
  Scale,
  X,
  type LucideIcon,
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';

// POST/PATCH/DELETE on /api/milestones require admin auth (see auth-guard.ts
// requireAdminAuth). These go through the Next.js server-side proxy, which
// validates the httpOnly admin session cookie and attaches the secret there —
// the key is never shipped to the browser.
const ADMIN_API = '/api/admin-proxy';

interface MilestoneItem {
  id: string;
  contractTitle: string;
  milestoneTitle: string;
  milestoneType: 'PAYMENT' | 'RENEWAL' | 'TERMINATION_NOTICE' | 'WARRANTY' | 'DELIVERY' | 'COMPLIANCE';
  dueDate?: string;
  relativeOffset?: string;
  amount?: string;
  obligatedParty?: string;
  actionRequired: string;
  riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  isCompleted: boolean;
  reminderDays: number;
  notes?: string;
}

const TYPE_CONFIG: Record<string, { label: string; icon: LucideIcon; color: string; badge: string }> = {
  PAYMENT: {
    label: 'Thanh toán',
    icon: CreditCard,
    color: 'border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300',
    badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200',
  },
  RENEWAL: {
    label: 'Gia hạn / Tái ký',
    icon: RefreshCw,
    color: 'border-blue-500 bg-blue-50 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300',
    badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200',
  },
  TERMINATION_NOTICE: {
    label: 'Báo trước chấm dứt',
    icon: AlertTriangle,
    color: 'border-rose-500 bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300',
    badge: 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200',
  },
  WARRANTY: {
    label: 'Bảo hành & Nghiệm thu',
    icon: ShieldCheck,
    color: 'border-purple-500 bg-purple-50 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300',
    badge: 'bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-200',
  },
  DELIVERY: {
    label: 'Bàn giao tiến độ',
    icon: Package,
    color: 'border-amber-500 bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300',
    badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200',
  },
  COMPLIANCE: {
    label: 'Tuân thủ & Báo cáo',
    icon: Scale,
    color: 'border-indigo-500 bg-indigo-50 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300',
    badge: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-200',
  },
};

const RISK_BADGES: Record<string, { label: string; bg: string }> = {
  CRITICAL: { label: 'RỦI RO CAO NHẤT', bg: 'bg-red-600 text-white font-bold animate-pulse' },
  HIGH: { label: 'Rủi ro cao', bg: 'bg-rose-500/20 text-rose-700 dark:text-rose-300 font-semibold' },
  MEDIUM: { label: 'Rủi ro trung bình', bg: 'bg-amber-500/20 text-amber-700 dark:text-amber-300 font-medium' },
  LOW: { label: 'Rủi ro thấp', bg: 'bg-slate-500/20 text-slate-700 dark:text-slate-300 font-normal' },
};

export default function ContractMilestonesPage() {
  const [milestones, setMilestones] = useState<MilestoneItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showExtractModal, setShowExtractModal] = useState(false);
  const [contractTitleInput, setContractTitleInput] = useState('');
  const [contractTextInput, setContractTextInput] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);

  const fetchMilestones = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedType !== 'ALL') params.set('type', selectedType);
      if (searchQuery) params.set('search', searchQuery);

      const res = await fetch(`${API_BASE}/api/milestones?${params}`);
      const data = await res.json();
      setMilestones(data.milestones || []);
    } catch (err) {
      console.error('Error fetching milestones:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedType, searchQuery]);

  useEffect(() => {
    fetchMilestones();
  }, [fetchMilestones]);

  const toggleComplete = async (id: string, currentStatus: boolean) => {
    try {
      await fetch(`${ADMIN_API}/milestones/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isCompleted: !currentStatus }),
      });
      setMilestones((prev) =>
        prev.map((m) => (m.id === id ? { ...m, isCompleted: !currentStatus } : m))
      );
    } catch (err) {
      console.error('Error updating milestone:', err);
    }
  };

  const deleteMilestone = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa mốc hạn này?')) return;
    try {
      await fetch(`${ADMIN_API}/milestones/${id}`, { method: 'DELETE' });
      setMilestones((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      console.error('Error deleting milestone:', err);
    }
  };

  const [extractError, setExtractError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleExtractAI = async () => {
    setExtractError(null);
    if (!contractTextInput.trim()) {
      setExtractError('Vui lòng dán nội dung văn bản hợp đồng để AI phân tích.');
      return;
    }
    setIsExtracting(true);
    try {
      const res = await fetch(`${ADMIN_API}/milestones/extract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractText: contractTextInput,
          contractTitle: contractTitleInput || 'Hợp đồng mới',
        }),
      });
      const data = await res.json();
      if (data.milestones && data.milestones.length > 0) {
        // Save batch to database
        const saveRes = await fetch(`${ADMIN_API}/milestones`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: data.milestones.map((m: any) => ({
              ...m,
              contractTitle: contractTitleInput || 'Hợp đồng mới',
            })),
          }),
        });
        if (saveRes.ok) {
          setShowExtractModal(false);
          setContractTextInput('');
          setContractTitleInput('');
          setExtractError(null);
          fetchMilestones();
          showToast(`Đã thêm ${data.milestones.length} mốc hạn mới.`);
        }
      } else {
        setExtractError('Không tìm thấy mốc hạn nào từ nội dung văn bản. Vui lòng kiểm tra lại văn bản hợp đồng.');
      }
    } catch (err) {
      console.error('Error extracting milestones:', err);
      setExtractError('Có lỗi xảy ra trong quá trình trích xuất mốc hạn. Vui lòng thử lại.');
    } finally {
      setIsExtracting(false);
    }
  };


  const totalCount = milestones.length;
  const criticalCount = milestones.filter((m) => m.riskLevel === 'CRITICAL' || m.riskLevel === 'HIGH').length;
  const completedCount = milestones.filter((m) => m.isCompleted).length;
  const pendingCount = totalCount - completedCount;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans">
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-4 right-4 z-[60] px-4 py-3 bg-emerald-600 text-white text-xs font-semibold rounded-xl shadow-lg flex items-center gap-2 animate-in fade-in-50 slide-in-from-top-2"
        >
          <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
          {toastMessage}
        </div>
      )}
      {/* Hero Header */}
      <section className="relative bg-white border-b border-slate-200 overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-4 py-12 sm:py-16">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-full px-3.5 py-1 text-xs mb-4">
                <Clock className="w-3.5 h-3.5 text-accent-600" />
                <span className="text-blue-700">Quản trị Mốc hạn & Lịch nhắc Hợp đồng Doanh nghiệp</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-bold tracking-tight mb-3 text-slate-900">
                Lịch Mốc Hạn <span className="text-blue-700">& Cảnh Báo Hợp Đồng</span>
              </h1>
              <p className="text-slate-500 text-sm sm:text-base leading-relaxed">
                Tự động trích xuất các mốc thanh toán, hạn thông báo gia hạn, thời hạn bảo hành và nộp báo cáo bằng AI. Không bao giờ bỏ lỡ nghĩa vụ hợp đồng quan trọng.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={() => setShowExtractModal(true)}
                className="px-4 py-2.5 bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-400 hover:to-accent-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md flex items-center gap-2 transition-all active:scale-95"
              >
                <Sparkles className="w-4 h-4" />
                <span>AI Trích xuất Mốc Hạn</span>
              </button>

              <a
                href={`${API_BASE}/api/milestones/export-ical`}
                download="lich-nhac-han-hop-dong.ics"
                className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm rounded-xl border border-slate-300 shadow-sm flex items-center gap-2 transition-all active:scale-95"
              >
                <Download className="w-4 h-4 text-emerald-600" />
                <span>Xuất Lịch (.ics)</span>
              </a>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-200">
            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200">
              <div className="text-xs text-slate-500">Tổng số mốc theo dõi</div>
              <div className="text-xl sm:text-2xl font-bold mt-1 text-slate-900">{totalCount}</div>
            </div>
            <div className="bg-amber-50 rounded-xl p-3.5 border border-amber-100">
              <div className="text-xs text-amber-700">Đang chờ xử lý</div>
              <div className="text-xl sm:text-2xl font-bold mt-1 text-amber-600">{pendingCount}</div>
            </div>
            <div className="bg-rose-50 rounded-xl p-3.5 border border-rose-100">
              <div className="text-xs text-rose-600">Mốc rủi ro cao / Khẩn</div>
              <div className="text-xl sm:text-2xl font-bold mt-1 text-rose-600">{criticalCount}</div>
            </div>
            <div className="bg-emerald-50 rounded-xl p-3.5 border border-emerald-100">
              <div className="text-xs text-emerald-600">Đã hoàn tất</div>
              <div className="text-xl sm:text-2xl font-bold mt-1 text-emerald-600">{completedCount}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Filter Strip */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          {/* Type Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full sm:w-auto pb-1">
            <button
              onClick={() => setSelectedType('ALL')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                selectedType === 'ALL'
                  ? 'bg-[#0B1D51] text-white shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
              }`}
            >
              Tất cả ({totalCount})
            </button>
            {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
              <button
                key={key}
                onClick={() => setSelectedType(key)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all ${
                  selectedType === key
                    ? 'bg-[#0B1D51] text-white shadow-sm'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100'
                }`}
              >
                <cfg.icon className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{cfg.label}</span>
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên hợp đồng, mốc..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Milestone Timeline List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 text-[#0B1D51] dark:text-yellow-400 animate-spin" />
            <p className="text-xs text-slate-400">Đang tải danh sách mốc hạn...</p>
          </div>
        ) : milestones.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
            <CalendarIcon className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800 dark:text-white">Chưa có mốc hạn hợp đồng nào</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Dán nội dung hợp đồng để AI tự động quét và phân tích các mốc thanh toán, ngày gia hạn và nghĩa vụ cần thực hiện.
            </p>
            <button
              onClick={() => setShowExtractModal(true)}
              className="mt-4 px-4 py-2 bg-[#0B1D51] text-white rounded-xl text-xs font-bold shadow-md hover:bg-opacity-90 inline-flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
              <span>Trích xuất mốc hạn ngay</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {milestones.map((item) => {
              const cfg = TYPE_CONFIG[item.milestoneType] || TYPE_CONFIG.COMPLIANCE;
              const risk = RISK_BADGES[item.riskLevel] || RISK_BADGES.MEDIUM;
              return (
                <div
                  key={item.id}
                  className={`bg-white dark:bg-slate-900 rounded-2xl border transition-all p-5 shadow-xs hover:shadow-md ${
                    item.isCompleted
                      ? 'border-slate-200 dark:border-slate-800 opacity-65'
                      : item.riskLevel === 'CRITICAL'
                      ? 'border-red-300 dark:border-red-900/60 shadow-red-500/5'
                      : 'border-slate-200/90 dark:border-slate-800'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    {/* Checkbox & Details */}
                    <div className="flex items-start gap-3.5 flex-1 min-w-0">
                      <button
                        onClick={() => toggleComplete(item.id, item.isCompleted)}
                        role="checkbox"
                        aria-checked={item.isCompleted}
                        aria-label={item.isCompleted ? 'Đánh dấu chưa hoàn thành' : 'Đánh dấu đã hoàn thành'}
                        className={`mt-1 w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${
                          item.isCompleted
                            ? 'bg-emerald-500 border-emerald-500 text-white'
                            : 'border-slate-300 dark:border-slate-600 hover:border-[#0B1D51]'
                        }`}
                      >
                        {item.isCompleted && <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 ${cfg.badge}`}>
                            <cfg.icon className="w-3 h-3" aria-hidden="true" />
                            {cfg.label}
                          </span>
                          <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md ${risk.bg}`}>
                            {risk.label}
                          </span>
                          {item.amount && (
                            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800 inline-flex items-center gap-1">
                              <DollarSign className="w-3 h-3" aria-hidden="true" />
                              {item.amount}
                            </span>
                          )}
                        </div>

                        <h3
                          className={`text-base font-bold text-slate-900 dark:text-white ${
                            item.isCompleted ? 'line-through text-slate-400 dark:text-slate-500' : ''
                          }`}
                        >
                          {item.milestoneTitle}
                        </h3>

                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5" />
                          <span>Hợp đồng: <strong>{item.contractTitle}</strong></span>
                          {item.obligatedParty && (
                            <>
                              <span>•</span>
                              <span>Bên chịu trách nhiệm: <strong>{item.obligatedParty}</strong></span>
                            </>
                          )}
                        </p>

                        <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-2.5 mt-2.5 text-xs text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-800">
                          <div className="font-semibold text-slate-800 dark:text-slate-200 mb-0.5 flex items-center gap-1.5">
                            <BellRing className="w-3.5 h-3.5" aria-hidden="true" />
                            Hành động bắt buộc:
                          </div>
                          <div>{item.actionRequired}</div>
                        </div>
                      </div>
                    </div>

                    {/* Due Date & Actions */}
                    <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-2 shrink-0 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                      <div className="text-right">
                        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                          Thời hạn thực hiện
                        </div>
                        {item.dueDate ? (
                          <div className="text-sm font-bold text-blue-700 dark:text-yellow-400 mt-0.5 flex items-center gap-1">
                            <CalendarIcon className="w-3.5 h-3.5" />
                            <span>{new Date(item.dueDate).toLocaleDateString('vi-VN')}</span>
                          </div>
                        ) : (
                          <div className="text-xs font-semibold text-amber-600 dark:text-amber-400 mt-0.5">
                            {item.relativeOffset || 'Theo tiến độ'}
                          </div>
                        )}
                        <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1 justify-end">
                          <BellRing className="w-3 h-3" aria-hidden="true" />
                          Báo trước {item.reminderDays} ngày
                        </div>
                      </div>

                      <button
                        onClick={() => deleteMilestone(item.id)}
                        className="p-2.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                        title="Xóa mốc hạn"
                        aria-label="Xóa mốc hạn"
                      >
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* AI Extraction Modal */}
      {showExtractModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center text-slate-950 font-bold shadow-sm">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    AI Tự Động Trích Xuất Mốc Hạn Hợp Đồng
                  </h3>
                  <p className="text-xs text-slate-500">
                    Phát hiện các đợt thanh toán, hạn tái ký, bàn giao và thời hạn báo trước
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowExtractModal(false);
                  setExtractError(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                aria-label="Đóng cửa sổ"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            {extractError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{extractError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Tên Hợp đồng / Dự án:
              </label>

              <input
                type="text"
                value={contractTitleInput}
                onChange={(e) => setContractTitleInput(e.target.value)}
                placeholder="VD: Hợp đồng Thuê Văn phòng Landmark 81, HĐ Mua bán thiết bị IT..."
                disabled={isExtracting}
                className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500 disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Nội dung Hợp đồng (Dán văn bản vào đây):
              </label>
              <textarea
                rows={8}
                value={contractTextInput}
                onChange={(e) => setContractTextInput(e.target.value)}
                placeholder="Dán toàn bộ hoặc các điều khoản thanh toán, thời hạn, hiệu lực hợp đồng vào đây để AI phân tích..."
                disabled={isExtracting}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500 leading-relaxed font-mono disabled:opacity-60"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setShowExtractModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleExtractAI}
                disabled={isExtracting}
                className="px-5 py-2.5 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 font-bold text-xs sm:text-sm rounded-xl shadow-md flex items-center gap-2 disabled:opacity-50"
              >
                {isExtracting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang trích xuất mốc hạn...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Bắt đầu phân tích AI</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
