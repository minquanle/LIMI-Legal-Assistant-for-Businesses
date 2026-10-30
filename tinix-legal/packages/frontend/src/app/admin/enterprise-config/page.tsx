'use client';

import { useState, useEffect, useCallback } from 'react';
import { Save, Plus, Trash2, Settings2, Bell, ShieldAlert, CheckCircle } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { AdminNav } from '../components/AdminNav';

interface WorkflowStep {
  step: number;
  name: string;
  role: string;
  requireSignature: boolean;
}

interface EnterpriseConfig {
  id: string;
  orgName: string;
  workflowSteps: WorkflowStep[];
  alertThresholds: number[];
  riskRules: Record<string, unknown>;
}

export default function EnterpriseConfigPage() {
  const [config, setConfig] = useState<EnterpriseConfig | null>(null);
  const [steps, setSteps] = useState<WorkflowStep[]>([]);
  const [thresholds, setThresholds] = useState<number[]>([30, 15, 7]);
  const [riskRules, setRiskRules] = useState<Record<string, unknown>>({});
  const [orgName, setOrgName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await apiClient.getEnterpriseConfig();
      setConfig(data);
      setSteps(data.workflowSteps || []);
      setThresholds(data.alertThresholds || [30, 15, 7]);
      setRiskRules(data.riskRules || {});
      setOrgName(data.orgName || '');
    } catch {
      // Use defaults if backend not ready yet
      setSteps([
        { step: 1, name: 'Chuyên viên soạn thảo', role: 'EDITOR', requireSignature: false },
        { step: 2, name: 'Trưởng phòng duyệt', role: 'MANAGER', requireSignature: false },
        { step: 3, name: 'Pháp chế thẩm định', role: 'LEGAL', requireSignature: false },
        { step: 4, name: 'Ban Giám đốc phê duyệt', role: 'DIRECTOR', requireSignature: true },
      ]);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiClient.updateEnterpriseConfig({ orgName, workflowSteps: steps, alertThresholds: thresholds, riskRules });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch { /* ignore */ }
    setSaving(false);
  };

  const addStep = () => {
    setSteps((prev) => [
      ...prev,
      { step: prev.length + 1, name: 'Bước mới', role: 'USER', requireSignature: false },
    ]);
  };

  const removeStep = (idx: number) => {
    setSteps((prev) => prev.filter((_, i) => i !== idx).map((s, i) => ({ ...s, step: i + 1 })));
  };

  const updateStep = (idx: number, field: keyof WorkflowStep, value: unknown) => {
    setSteps((prev) => prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s)));
  };

  const updateThreshold = (idx: number, value: string) => {
    setThresholds((prev) => prev.map((t, i) => (i === idx ? parseInt(value) || t : t)));
  };

  return (
    <div>
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        <AdminNav />

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Settings2 className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white">Cấu hình Doanh nghiệp</h1>
            </div>
            <p className="text-sm text-slate-400">Tùy chỉnh quy trình trình ký, mốc cảnh báo và quy tắc rủi ro cho tổ chức của bạn</p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl shadow-md transition-all"
          >
            {saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saved ? 'Đã lưu!' : saving ? 'Đang lưu...' : 'Lưu cấu hình'}
          </button>
        </div>

        {/* Org Name */}
        <div className="bg-slate-950 rounded-2xl border border-slate-800 shadow-sm p-6">
          <label className="block text-sm font-semibold text-slate-200 mb-2">Tên doanh nghiệp / Tổ chức</label>
          <input
            type="text"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            className="w-full border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            placeholder="Ví dụ: Công ty TNHH Kỹ thuật ABC"
          />
        </div>

        {/* Workflow Steps */}
        <div className="bg-slate-950 rounded-2xl border border-slate-800 shadow-sm p-6 space-y-5">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-950/60 rounded-lg flex items-center justify-center">
                <Settings2 className="w-4 h-4 text-indigo-400" />
              </div>
              <div>
                <h2 className="font-bold text-slate-100 text-sm">Quy trình Trình ký Phê duyệt</h2>
                <p className="text-xs text-slate-400">Định nghĩa các bước duyệt văn bản đa cấp</p>
              </div>
            </div>
            <button
              onClick={addStep}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-950/40 hover:bg-indigo-900/50 text-indigo-700 text-xs font-semibold rounded-lg border border-indigo-900 transition"
            >
              <Plus className="w-3.5 h-3.5" /> Thêm bước
            </button>
          </div>

          <div className="space-y-3">
            {steps.map((step, idx) => (
              <div key={idx} className="flex items-center gap-3 p-4 bg-slate-900 rounded-xl border border-slate-800 group">
                {/* Step number badge */}
                <div className="w-7 h-7 bg-indigo-600 text-white rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {step.step}
                </div>
                {/* Name */}
                <input
                  value={step.name}
                  onChange={(e) => updateStep(idx, 'name', e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  placeholder="Tên bước duyệt"
                />
                {/* Role */}
                <input
                  value={step.role}
                  onChange={(e) => updateStep(idx, 'role', e.target.value.toUpperCase())}
                  className="w-32 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-sm text-slate-300 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  placeholder="Vai trò"
                />
                {/* Requires signature */}
                <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={step.requireSignature}
                    onChange={(e) => updateStep(idx, 'requireSignature', e.target.checked)}
                    className="w-4 h-4 rounded accent-indigo-600"
                  />
                  Cần ký
                </label>
                {/* Delete */}
                <button
                  onClick={() => removeStep(idx)}
                  aria-label={`Xóa bước ${step.name || idx + 1}`}
                  className="opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus:opacity-100 p-1.5 text-red-400 hover:text-rose-400 rounded-lg hover:bg-rose-950/40 transition"
                >
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Alert Thresholds */}
        <div className="bg-slate-950 rounded-2xl border border-slate-800 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Bell className="w-4 h-4 text-yellow-600" />
            </div>
            <div>
              <h2 className="font-bold text-slate-100 text-sm">Mốc Cảnh báo Hạn Hợp đồng</h2>
              <p className="text-xs text-slate-400">Số ngày trước khi hết hạn sẽ kích hoạt cảnh báo</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {thresholds.map((t, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${idx === 0 ? 'bg-yellow-100 text-yellow-700' : idx === 1 ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>
                  {idx === 0 ? 'Sắp hết hạn' : idx === 1 ? 'Cần xử lý' : 'Khẩn cấp'}
                </span>
                <input
                  type="number"
                  value={t}
                  onChange={(e) => updateThreshold(idx, e.target.value)}
                  className="w-16 border border-slate-800 rounded-lg px-2 py-1.5 text-sm text-center text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
                <span className="text-xs text-slate-400">ngày</span>
              </div>
            ))}
          </div>
        </div>

        {/* Risk Rules */}
        <div className="bg-slate-950 rounded-2xl border border-slate-800 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
            </div>
            <div>
              <h2 className="font-bold text-slate-100 text-sm">Quy tắc Rủi ro Hợp đồng</h2>
              <p className="text-xs text-slate-400">Ngưỡng pháp lý áp dụng cho thẩm định AI Redline</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { key: 'maxPenaltyPercent', label: 'Phạt vi phạm tối đa (%)', unit: '%' },
              { key: 'maxProbationDays', label: 'Thử việc tối đa (ngày)', unit: 'ngày' },
              { key: 'maxPaymentDelayDays', label: 'Thanh toán chậm tối đa (ngày)', unit: 'ngày' },
              { key: 'requireBankGuaranteeAbove', label: 'Bảo lãnh NH từ (triệu VND)', unit: 'tr.VNĐ' },
            ].map(({ key, label, unit }) => (
              <div key={key}>
                <label className="text-xs text-slate-300 font-medium block mb-1">{label}</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={
                      key === 'requireBankGuaranteeAbove'
                        ? (Number(riskRules[key] ?? 200000000) / 1000000).toString()
                        : String(riskRules[key] ?? '')
                    }
                    onChange={(e) => {
                      const raw = key === 'requireBankGuaranteeAbove'
                        ? parseFloat(e.target.value) * 1000000
                        : parseFloat(e.target.value);
                      setRiskRules((prev) => ({ ...prev, [key]: raw }));
                    }}
                    className="w-full border border-slate-800 rounded-lg px-3 py-1.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                  <span className="text-xs text-slate-400 whitespace-nowrap">{unit}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
