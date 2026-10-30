'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  FileText, AlertTriangle, Clock, CheckCircle2, Plus, TrendingUp,
  Calendar, Building2, DollarSign, ChevronRight, RefreshCw, Lightbulb
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface Contract {
  id: string;
  contractNumber: string;
  title: string;
  partnerName: string;
  contractValue: number | null;
  startDate: string | null;
  endDate: string | null;
  status: string;
  daysUntilExpiry: number | null;
  alertLevel: 'NONE' | 'WARNING' | 'URGENT' | 'EXPIRED';
  suggestedAction: string | null;
  paymentMilestones: Array<{ date: string; amount: number; description: string; isDone: boolean }>;
}

interface Summary {
  total: number;
  active: number;
  expiringSoon: number;
  urgent: number;
  expired: number;
  alerts: Contract[];
}

const ALERT_STYLES: Record<string, { bg: string; border: string; badge: string; icon: React.ReactNode; label: string }> = {
  EXPIRED: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    badge: 'bg-red-100 text-red-700',
    icon: <AlertTriangle className="w-4 h-4 text-red-500" />,
    label: 'Đã quá hạn',
  },
  URGENT: {
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    badge: 'bg-orange-100 text-orange-700',
    icon: <Clock className="w-4 h-4 text-orange-500" />,
    label: 'Khẩn cấp',
  },
  WARNING: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    badge: 'bg-yellow-100 text-yellow-700',
    icon: <AlertTriangle className="w-4 h-4 text-yellow-500" />,
    label: 'Sắp hết hạn',
  },
  NONE: {
    bg: 'bg-white',
    border: 'border-slate-200',
    badge: 'bg-green-100 text-green-700',
    icon: <CheckCircle2 className="w-4 h-4 text-green-500" />,
    label: 'Đang hiệu lực',
  },
};

const formatVND = (v: number | null) =>
  v == null ? '—' : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(v);

const formatDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

export default function ContractLifecyclePage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'WARNING' | 'URGENT' | 'EXPIRED' | 'NONE'>('ALL');
  const [showNewForm, setShowNewForm] = useState(false);
  const [newContract, setNewContract] = useState({ title: '', partnerName: '', contractValue: '', endDate: '', notes: '' });
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { contracts: c, summary: s } = await apiClient.getContracts();
      setContracts(c);
      setSummary(s);
    } catch {
      // Demo data if backend offline
      setContracts([
        {
          id: '1', contractNumber: 'HĐ-2024-001', title: 'Hợp đồng thuê văn phòng Tòa nhà ICON4',
          partnerName: 'Công ty BĐS ICON4', contractValue: 480_000_000, startDate: '2024-01-01', endDate: '2026-03-15',
          status: 'EXPIRING_SOON', daysUntilExpiry: 12, alertLevel: 'URGENT',
          suggestedAction: 'Còn 12 ngày - Xử lý ngay để ký gia hạn', paymentMilestones: [],
        },
        {
          id: '2', contractNumber: 'HĐLĐ-2023-088', title: 'HĐLĐ 36 tháng - Nguyễn Văn A',
          partnerName: 'Nguyễn Văn A', contractValue: null, startDate: '2023-04-01', endDate: '2026-03-28',
          status: 'EXPIRING_SOON', daysUntilExpiry: 25, alertLevel: 'WARNING',
          suggestedAction: 'Còn 25 ngày - Đề xuất đàm phán gia hạn', paymentMilestones: [],
        },
        {
          id: '3', contractNumber: 'HĐ-CNPM-2025-12', title: 'HĐ Cung cấp Phần mềm ERP 2025',
          partnerName: 'SAP Vietnam', contractValue: 1_500_000_000, startDate: '2025-01-01', endDate: '2027-12-31',
          status: 'ACTIVE', daysUntilExpiry: 512, alertLevel: 'NONE',
          suggestedAction: null, paymentMilestones: [
            { date: '2025-07-01', amount: 500_000_000, description: 'Đợt 2 - Triển khai module HR', isDone: true },
            { date: '2026-01-01', amount: 500_000_000, description: 'Đợt 3 - Go-live chính thức', isDone: false },
          ],
        },
      ]);
      setSummary({ total: 3, active: 1, expiringSoon: 1, urgent: 1, expired: 0, alerts: [] });
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!newContract.title) return;
    setCreating(true);
    try {
      await apiClient.createContract({
        title: newContract.title,
        partnerName: newContract.partnerName,
        contractValue: newContract.contractValue ? parseFloat(newContract.contractValue) : undefined,
        endDate: newContract.endDate || undefined,
        notes: newContract.notes,
      });
      setShowNewForm(false);
      setNewContract({ title: '', partnerName: '', contractValue: '', endDate: '', notes: '' });
      load();
    } catch { /* ignore */ }
    setCreating(false);
  };

  const filtered = filter === 'ALL' ? contracts : contracts.filter((c) => c.alertLevel === filter);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900">Quản lý Vòng đời Hợp đồng</h1>
            </div>
            <p className="text-sm text-slate-500">Theo dõi trạng thái, cảnh báo hạn và mốc thanh toán hợp đồng toàn doanh nghiệp</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={load} className="p-2 text-slate-500 hover:text-slate-700 hover:bg-white rounded-lg border border-slate-200 transition">
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowNewForm((v) => !v)}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-md transition"
            >
              <Plus className="w-4 h-4" /> Thêm hợp đồng
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Tổng hợp đồng', value: summary.total, color: 'indigo', icon: <TrendingUp className="w-5 h-5 text-indigo-600" /> },
              { label: 'Đang hiệu lực', value: summary.active, color: 'green', icon: <CheckCircle2 className="w-5 h-5 text-green-600" /> },
              { label: 'Sắp hết hạn', value: (summary.expiringSoon ?? 0) + (summary.urgent ?? 0), color: 'yellow', icon: <Clock className="w-5 h-5 text-yellow-600" /> },
              { label: 'Đã quá hạn', value: summary.expired, color: 'red', icon: <AlertTriangle className="w-5 h-5 text-red-600" /> },
            ].map(({ label, value, color, icon }) => (
              <div key={label} className={`bg-white rounded-2xl border border-${color}-100 shadow-sm p-5 flex items-center gap-4`}>
                <div className={`w-10 h-10 bg-${color}-100 rounded-xl flex items-center justify-center`}>{icon}</div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">{label}</p>
                  <p className="text-2xl font-bold text-slate-900">{value}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* New Contract Form */}
        {showNewForm && (
          <div className="bg-white rounded-2xl border border-blue-200 shadow-md p-6 space-y-4">
            <h2 className="font-bold text-slate-800 flex items-center gap-2"><Plus className="w-4 h-4 text-blue-600" /> Thêm hợp đồng mới</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-600 font-medium block mb-1">Tên hợp đồng *</label>
                <input value={newContract.title} onChange={(e) => setNewContract((p) => ({ ...p, title: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" placeholder="Ví dụ: HĐ Thuê mặt bằng Q1/2026" />
              </div>
              <div>
                <label className="text-xs text-slate-600 font-medium block mb-1">Tên đối tác / Bên B</label>
                <input value={newContract.partnerName} onChange={(e) => setNewContract((p) => ({ ...p, partnerName: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" placeholder="Tên công ty / cá nhân đối tác" />
              </div>
              <div>
                <label className="text-xs text-slate-600 font-medium block mb-1">Giá trị hợp đồng (VND)</label>
                <input type="number" value={newContract.contractValue} onChange={(e) => setNewContract((p) => ({ ...p, contractValue: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" placeholder="0" />
              </div>
              <div>
                <label className="text-xs text-slate-600 font-medium block mb-1">Ngày kết thúc hợp đồng</label>
                <input type="date" value={newContract.endDate} onChange={(e) => setNewContract((p) => ({ ...p, endDate: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button onClick={() => setShowNewForm(false)} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 font-medium">Hủy</button>
              <button onClick={handleCreate} disabled={creating || !newContract.title}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition">
                {creating ? 'Đang tạo...' : 'Tạo hợp đồng'}
              </button>
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex items-center gap-2">
          {(['ALL', 'URGENT', 'WARNING', 'NONE', 'EXPIRED'] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${filter === f ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200 hover:border-blue-300'}`}>
              {f === 'ALL' ? 'Tất cả' : f === 'URGENT' ? 'Khẩn cấp' : f === 'WARNING' ? 'Sắp hết hạn' : f === 'NONE' ? 'Hiệu lực' : 'Quá hạn'}
            </button>
          ))}
        </div>

        {/* Contract List */}
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-12 text-slate-400 text-sm">Đang tải danh sách hợp đồng...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">Không có hợp đồng nào phù hợp bộ lọc này</div>
          ) : filtered.map((contract) => {
            const style = ALERT_STYLES[contract.alertLevel];
            return (
              <div key={contract.id} className={`rounded-2xl border ${style.border} ${style.bg} p-5 transition hover:shadow-md`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    {style.icon}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-slate-400">{contract.contractNumber}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${style.badge}`}>{style.label}</span>
                        {contract.daysUntilExpiry !== null && (
                          <span className="text-xs text-slate-500">
                            {contract.daysUntilExpiry < 0 ? `Quá hạn ${Math.abs(contract.daysUntilExpiry)} ngày` : `Còn ${contract.daysUntilExpiry} ngày`}
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-slate-900 text-sm">{contract.title}</h3>
                      <div className="flex items-center gap-4 mt-1.5 text-xs text-slate-500">
                        <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{contract.partnerName || '—'}</span>
                        <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />{formatVND(contract.contractValue)}</span>
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(contract.endDate)}</span>
                      </div>
                    </div>
                  </div>
                  {contract.suggestedAction && (
                    <div className="flex-shrink-0 max-w-[280px]">
                      <div className={`text-xs p-3 rounded-xl ${style.bg} border ${style.border}`}>
                        <p className="font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                        <Lightbulb className="w-3.5 h-3.5 text-amber-500" aria-hidden="true" /> Đề xuất:
                      </p>
                        <p className="text-slate-600">{contract.suggestedAction}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Payment milestones */}
                {contract.paymentMilestones?.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <p className="text-xs font-semibold text-slate-600 mb-2">Mốc thanh toán:</p>
                    <div className="flex flex-wrap gap-2">
                      {contract.paymentMilestones.map((m, i) => (
                        <div key={i} className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border ${m.isDone ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white border-slate-200 text-slate-600'}`}>
                          {m.isDone ? <CheckCircle2 className="w-3 h-3 text-green-500" /> : <Clock className="w-3 h-3 text-slate-400" />}
                          <span>{formatDate(m.date)} — {formatVND(m.amount)}</span>
                          <ChevronRight className="w-3 h-3 opacity-50" />
                          <span className="font-medium">{m.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
