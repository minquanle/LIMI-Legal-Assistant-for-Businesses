'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  BrainCircuit,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Layers,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';

interface WorkflowConfig {
  id: string;
  code: string;
  name: string;
  category: string;
  description: string;
  boundLegalFields: string[];
  steps: Array<{ step: number; name: string; role: string }>;
}

interface WorkflowExecution {
  id: string;
  workflowConfigId: string;
  title: string;
  currentStep: number;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  checklistResults: Record<string, { status: string; notes: string }>;
  workflowConfig: WorkflowConfig;
  createdAt: string;
  updatedAt: string;
}

export default function WorkflowDashboardPage() {
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [configs, setConfigs] = useState<WorkflowConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);
  const [selectedConfigId, setSelectedConfigId] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [creating, setCreating] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [execData, cfgData] = await Promise.all([
        apiClient.getWorkflowExecutions(),
        apiClient.getKnowledgeConfigs(),
      ]);
      setExecutions(execData);
      setConfigs(cfgData);
    } catch {
      /* Fallback demo data */
      setConfigs([
        {
          id: 'cfg_1', code: 'HR_DISCIPLINE', name: 'Quy trình Xử lý Kỷ luật & Sa thải Lao động',
          category: 'Nhân sự & Lao động', description: 'Thẩm định tuân thủ Bộ luật Lao động 2019',
          boundLegalFields: ['Bộ luật Lao động 2019'], steps: [{ step: 1, name: 'Biên bản', role: 'HR' }],
        },
      ]);
      setExecutions([
        {
          id: 'exec_1', workflowConfigId: 'cfg_1', title: 'Hồ sơ Kỷ luật Lao động NV Nguyễn Văn X',
          currentStep: 2, status: 'IN_PROGRESS', checklistResults: { check_1: { status: 'PASSED', notes: '' } },
          createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
          workflowConfig: {
            id: 'cfg_1', code: 'HR_DISCIPLINE', name: 'Quy trình Xử lý Kỷ luật & Sa thải Lao động',
            category: 'Nhân sự & Lao động', description: '', boundLegalFields: ['Bộ luật Lao động 2019'],
            steps: [
              { step: 1, name: 'Lập Biên bản Vi phạm', role: 'HR' },
              { step: 2, name: 'Gửi Thông báo Mời họp Kỷ luật', role: 'HR' },
              { step: 3, name: 'Tổ chức Cuộc họp Kỷ luật', role: 'LEGAL' },
              { step: 4, name: 'Ban hành Quyết định Sa thải', role: 'DIRECTOR' },
            ],
          },
        },
      ]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!selectedConfigId || !newTitle) return;
    setCreating(true);
    try {
      const res = await apiClient.createWorkflowExecution({ workflowConfigId: selectedConfigId, title: newTitle });
      setShowNewModal(false);
      setNewTitle('');
      load();
    } catch { /* ignore */ }
    setCreating(false);
  };

  const filtered = selectedCategory === 'ALL'
    ? executions
    : executions.filter((e) => e.workflowConfig?.category === selectedCategory);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/20 to-indigo-50/20">
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Layers className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900">Thực thi Quy trình Tri thức AI</h1>
            </div>
            <p className="text-sm text-slate-500">Quản lý và thực thi các vụ việc nghiệp vụ doanh nghiệp tích hợp AI Compliance Auditor</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={load} className="p-2 text-slate-500 hover:text-slate-700 hover:bg-white rounded-lg border border-slate-200 transition">
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                if (configs.length > 0) setSelectedConfigId(configs[0].id);
                setShowNewModal(true);
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-md transition"
            >
              <Plus className="w-4 h-4" /> Bắt đầu vụ việc mới
            </button>
          </div>
        </div>

        {/* New Execution Modal */}
        {showNewModal && (
          <div className="bg-white rounded-2xl border border-indigo-200 shadow-xl p-6 space-y-4">
            <h2 className="font-bold text-slate-800 flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-indigo-600" /> Khởi tạo Vụ việc Nghiệp vụ Mới
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Chọn Quy trình Nghiệp vụ *</label>
                <select
                  value={selectedConfigId}
                  onChange={(e) => setSelectedConfigId(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  {configs.map((cfg) => (
                    <option key={cfg.id} value={cfg.id}>
                      [{cfg.category}] {cfg.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Tên Vụ việc / Hồ sơ *</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  placeholder="Ví dụ: Vụ kỷ luật sa thải NV Nguyễn Văn A Q1/2026"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button onClick={() => setShowNewModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800">
                Hủy
              </button>
              <button
                onClick={handleCreate}
                disabled={creating || !newTitle}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition"
              >
                {creating ? 'Đang tạo...' : 'Tạo vụ việc'}
              </button>
            </div>
          </div>
        )}

        {/* Executions List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12 text-slate-400 text-sm">Đang tải danh sách vụ việc...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">Chưa có vụ việc nào đang thực thi</div>
          ) : filtered.map((exec) => {
            const config = exec.workflowConfig;
            const steps = config?.steps || [];
            const totalSteps = steps.length || 1;
            const percent = Math.round((exec.currentStep / totalSteps) * 100);

            // Compute checklist summary stats
            const results = Object.values(exec.checklistResults || {});
            const passedCount = results.filter((r) => r.status === 'PASSED').length;
            const failedCount = results.filter((r) => r.status === 'FAILED').length;
            const warnCount = results.filter((r) => r.status === 'WARNING').length;

            return (
              <div key={exec.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {config?.category || 'Nghiệp vụ'}
                      </span>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                        exec.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {exec.status === 'COMPLETED' ? 'Đã hoàn thành' : `Đang thực hiện (Bước ${exec.currentStep}/${totalSteps})`}
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-lg">{exec.title}</h3>
                    <p className="text-xs text-slate-500 mt-1">{config?.name}</p>
                  </div>
                  <Link
                    href={`/quy-trinh/${exec.id}`}
                    className="flex items-center gap-1.5 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-200 transition"
                  >
                    <span>Vào vụ việc</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </Link>
                </div>

                {/* Step progress bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                    <span>Tiến trình thực thi ({percent}%)</span>
                    <span>Bước {exec.currentStep}: {steps[exec.currentStep - 1]?.name || 'Hoàn tất'}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-indigo-600 h-full transition-all duration-300" style={{ width: `${percent}%` }} />
                  </div>
                </div>

                {/* Compliance checklist summary */}
                <div className="flex items-center gap-4 text-xs pt-2 border-t border-slate-100">
                  <span className="text-slate-500 font-medium flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" /> Kết quả Tuân thủ AI:
                  </span>
                  <span className="text-green-700 bg-green-50 px-2 py-0.5 rounded-md font-semibold"><Check className="w-3 h-3 inline" aria-hidden="true" /> {passedCount} Đạt</span>
                  {warnCount > 0 && <span className="text-yellow-700 bg-yellow-50 px-2 py-0.5 rounded-md font-semibold"><AlertTriangle className="w-3 h-3 inline" aria-hidden="true" /> {warnCount} Cảnh báo</span>}
                  {failedCount > 0 && <span className="text-red-700 bg-red-50 px-2 py-0.5 rounded-md font-semibold"><XCircle className="w-3 h-3 inline" aria-hidden="true" /> {failedCount} Vi phạm</span>}
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
