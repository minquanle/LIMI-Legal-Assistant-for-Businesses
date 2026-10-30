'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  BookOpen, Plus, Save, Trash2, Edit2, CheckCircle2, ShieldAlert,
  BrainCircuit, Layers, ChevronRight
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { AdminNav } from '../components/AdminNav';

interface ChecklistItem {
  id: string;
  title: string;
  legalCitation: string;
  isMandatory: boolean;
}

interface WorkflowStep {
  step: number;
  name: string;
  role: string;
}

interface KnowledgeConfig {
  id?: string;
  code: string;
  name: string;
  category: string;
  description: string;
  boundLegalFields: string[];
  systemPrompt: string;
  complianceChecklist: ChecklistItem[];
  steps: WorkflowStep[];
  isActive?: boolean;
}

const CATEGORIES = [
  'Nhân sự & Lao động',
  'Đấu thầu & Mua sắm',
  'Đầu tư & M&A',
  'Thuế & Kế toán',
  'Khác',
];

export default function EnterpriseKnowledgeConfigPage() {
  const [configs, setConfigs] = useState<KnowledgeConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingConfig, setEditingConfig] = useState<KnowledgeConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiClient.getKnowledgeConfigs();
      setConfigs(data);
    } catch {
      /* fallback */
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleOpenEdit = (config?: KnowledgeConfig) => {
    if (config) {
      setEditingConfig({ ...config });
    } else {
      setEditingConfig({
        code: `WF_${Date.now().toString().slice(-4)}`,
        name: 'Quy trình Tri thức Mới',
        category: 'Nhân sự & Lao động',
        description: '',
        boundLegalFields: ['Bộ luật Lao động 2019'],
        systemPrompt: 'Bạn là Trợ lý Pháp lý Doanh nghiệp chuyên sâu.',
        complianceChecklist: [
          { id: `check_${Date.now()}`, title: 'Tiêu chí tuân thủ bắt buộc 1', legalCitation: 'Căn cứ Điều 1...', isMandatory: true },
        ],
        steps: [
          { step: 1, name: 'Bước 1: Tiếp nhận & Rà soát', role: 'SPECIALIST' },
          { step: 2, name: 'Bước 2: Phê duyệt & Ban hành', role: 'MANAGER' },
        ],
      });
    }
  };

  const handleSave = async () => {
    if (!editingConfig || !editingConfig.name || !editingConfig.code) return;
    setSaving(true);
    try {
      await apiClient.upsertKnowledgeConfig(editingConfig as unknown as Record<string, unknown>);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      setEditingConfig(null);
      load();
    } catch { /* ignore */ }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa quy trình này?')) return;
    try {
      await apiClient.deleteKnowledgeConfig(id);
      load();
    } catch { /* ignore */ }
  };

  // Checklist helpers
  const addChecklistItem = () => {
    if (!editingConfig) return;
    setEditingConfig({
      ...editingConfig,
      complianceChecklist: [
        ...editingConfig.complianceChecklist,
        { id: `check_${Date.now()}`, title: 'Tiêu chí tuân thủ mới', legalCitation: 'Trích dẫn luật...', isMandatory: true },
      ],
    });
  };

  const removeChecklistItem = (idx: number) => {
    if (!editingConfig) return;
    setEditingConfig({
      ...editingConfig,
      complianceChecklist: editingConfig.complianceChecklist.filter((_, i) => i !== idx),
    });
  };

  const filteredConfigs = selectedCategory === 'ALL'
    ? configs
    : configs.filter((c) => c.category === selectedCategory);

  return (
    <div>
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        <AdminNav />

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <BrainCircuit className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white">Cấu hình Tri thức & Quy trình AI</h1>
            </div>
            <p className="text-sm text-slate-400">Quản lý các bộ quy trình nghiệp vụ, bộ văn bản QPPL gắn kèm và Dynamic Compliance Checklist</p>
          </div>
          <button
            onClick={() => handleOpenEdit()}
            className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl shadow-md transition"
          >
            <Plus className="w-4 h-4" /> Thêm quy trình mới
          </button>
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
              selectedCategory === 'ALL' ? 'bg-purple-600 text-white shadow-sm' : 'bg-slate-950 text-slate-300 border border-slate-800 hover:border-purple-600'
            }`}
          >
            Tất cả ({configs.length})
          </button>
          {CATEGORIES.map((cat) => {
            const count = configs.filter((c) => c.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                  selectedCategory === cat ? 'bg-purple-600 text-white shadow-sm' : 'bg-slate-950 text-slate-300 border border-slate-800 hover:border-purple-600'
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>

        {/* Edit Modal / Form Card */}
        {editingConfig && (
          <div className="bg-slate-950 rounded-2xl border border-purple-900 shadow-xl p-6 space-y-6 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-purple-400" />
                {editingConfig.id ? 'Chỉnh sửa Quy trình' : 'Tạo Quy trình Tri thức Mới'}
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditingConfig(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:bg-slate-800 rounded-lg"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-5 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white text-xs font-semibold rounded-lg shadow-sm"
                >
                  {saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                  {saved ? 'Đã lưu!' : saving ? 'Đang lưu...' : 'Lưu quy trình'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-200 block mb-1">Tên Quy trình *</label>
                <input
                  type="text"
                  value={editingConfig.name}
                  onChange={(e) => setEditingConfig({ ...editingConfig, name: e.target.value })}
                  className="w-full border border-slate-800 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                  placeholder="Ví dụ: Quy trình Thẩm định Đất đai M&A"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-200 block mb-1">Mã Quy trình (Code) *</label>
                <input
                  type="text"
                  value={editingConfig.code}
                  onChange={(e) => setEditingConfig({ ...editingConfig, code: e.target.value.toUpperCase() })}
                  className="w-full border border-slate-800 rounded-xl px-3.5 py-2 text-sm font-mono text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  placeholder="WORKFLOW_CODE"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-200 block mb-1">Nhóm Nghiệp vụ</label>
                <select
                  value={editingConfig.category}
                  onChange={(e) => setEditingConfig({ ...editingConfig, category: e.target.value })}
                  className="w-full border border-slate-800 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-200 block mb-1">Mô tả ngắn</label>
                <input
                  type="text"
                  value={editingConfig.description}
                  onChange={(e) => setEditingConfig({ ...editingConfig, description: e.target.value })}
                  className="w-full border border-slate-800 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                  placeholder="Mô tả phạm vi áp dụng quy trình..."
                />
              </div>
            </div>

            {/* Bound Legal Fields */}
            <div>
              <label className="text-xs font-semibold text-slate-200 block mb-1">Bộ Văn bản Pháp luật gắn kèm (RAG Binding)</label>
              <input
                type="text"
                value={editingConfig.boundLegalFields.join(', ')}
                onChange={(e) => setEditingConfig({
                  ...editingConfig,
                  boundLegalFields: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                })}
                className="w-full border border-slate-800 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                placeholder="Phân cách bởi dấu phẩy, ví dụ: Luật Đất đai 2024, Luật Kinh doanh BĐS 2023"
              />
              <p className="text-xs text-slate-400 mt-1">Hệ thống AI sẽ ưu tiên trích dẫn các văn bản này khi thực thi vụ việc.</p>
            </div>

            {/* System Prompt Template */}
            <div>
              <label className="text-xs font-semibold text-slate-200 block mb-1">System Prompt Template cho Trợ lý AI</label>
              <textarea
                rows={2}
                value={editingConfig.systemPrompt}
                onChange={(e) => setEditingConfig({ ...editingConfig, systemPrompt: e.target.value })}
                className="w-full border border-slate-800 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-purple-400 font-mono resize-none"
                placeholder="Định hướng vai trò và chuyên môn của AI Copilot cho quy trình này..."
              />
            </div>

            {/* Dynamic Compliance Checklist */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-purple-400" />
                  Dynamic Compliance Checklist Rules ({editingConfig.complianceChecklist.length})
                </label>
                <button
                  type="button"
                  onClick={addChecklistItem}
                  className="px-3 py-1 bg-purple-50 hover:bg-purple-950/60 text-purple-700 text-xs font-semibold rounded-lg border border-purple-900 transition flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Thêm tiêu chí
                </button>
              </div>

              <div className="space-y-2.5">
                {editingConfig.complianceChecklist.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-3 bg-slate-900 rounded-xl border border-slate-800">
                    <input
                      type="text"
                      value={item.title}
                      onChange={(e) => {
                        const updated = [...editingConfig.complianceChecklist];
                        updated[idx].title = e.target.value;
                        setEditingConfig({ ...editingConfig, complianceChecklist: updated });
                      }}
                      className="flex-1 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-purple-400"
                      placeholder="Tên tiêu chí kiểm tra tuân thủ..."
                    />
                    <input
                      type="text"
                      value={item.legalCitation}
                      onChange={(e) => {
                        const updated = [...editingConfig.complianceChecklist];
                        updated[idx].legalCitation = e.target.value;
                        setEditingConfig({ ...editingConfig, complianceChecklist: updated });
                      }}
                      className="w-48 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-purple-400"
                      placeholder="Căn cứ pháp lý (e.g. Điều 125 BLLĐ)"
                    />
                    <label className="flex items-center gap-1 text-xs text-slate-300 cursor-pointer whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={item.isMandatory}
                        onChange={(e) => {
                          const updated = [...editingConfig.complianceChecklist];
                          updated[idx].isMandatory = e.target.checked;
                          setEditingConfig({ ...editingConfig, complianceChecklist: updated });
                        }}
                        className="w-3.5 h-3.5 rounded accent-purple-600"
                      />
                      Bắt buộc
                    </label>
                    <button
                      type="button"
                      onClick={() => removeChecklistItem(idx)}
                      aria-label="Xóa mục checklist"
                      className="p-1 text-red-400 hover:text-rose-400 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Config Cards List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {loading ? (
            <div className="col-span-2 text-center py-12 text-slate-400 text-sm">Đang tải cấu hình quy trình...</div>
          ) : filteredConfigs.length === 0 ? (
            <div className="col-span-2 text-center py-12 text-slate-400 text-sm">Chưa có quy trình nào trong nhóm này</div>
          ) : filteredConfigs.map((config) => (
            <div key={config.id} className="bg-slate-950 rounded-2xl border border-slate-800 shadow-sm p-5 space-y-4 hover:shadow-md transition">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono font-bold text-purple-700 bg-purple-50 border border-purple-900 px-2 py-0.5 rounded-full">{config.code}</span>
                    <span className="text-xs font-medium text-slate-400 bg-slate-800 px-2.5 py-0.5 rounded-full">{config.category}</span>
                  </div>
                  <h3 className="font-bold text-white text-base">{config.name}</h3>
                  <p className="text-xs text-slate-400 mt-1">{config.description}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleOpenEdit(config)} className="p-1.5 text-slate-400 hover:text-purple-400 hover:bg-purple-50 rounded-lg transition">
                    <Edit2 className="w-4 h-4" />
                  </button>

                    <button onClick={() => config.id && handleDelete(config.id)} className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition">
                      <Trash2 className="w-4 h-4" />
                    </button>

                </div>
              </div>

              {/* Bound legal fields */}
              {config.boundLegalFields?.length > 0 && (
                <div className="bg-purple-50/60 rounded-xl p-3 border border-purple-100/60">
                  <p className="text-xs font-semibold text-purple-800 mb-1 flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5 text-purple-400" /> Bộ văn bản QPPL gắn kèm ({config.boundLegalFields.length}):
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {config.boundLegalFields.map((field, i) => (
                      <span key={i} className="text-xs bg-slate-950 text-purple-700 border border-purple-900 px-2 py-0.5 rounded-md font-medium">
                        {field}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Checklist summary */}
              <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-800">
                <span className="flex items-center gap-1 font-medium text-slate-200">
                  <ShieldAlert className="w-3.5 h-3.5 text-purple-500" /> {config.complianceChecklist?.length || 0} Tiêu chí Checklist Tuân thủ
                </span>
                <span className="flex items-center gap-1 font-medium text-slate-200">
                  <Layers className="w-3.5 h-3.5 text-indigo-500" /> {config.steps?.length || 0} Bước thực thi
                </span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
