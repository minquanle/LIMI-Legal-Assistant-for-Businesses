'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Key, Save, Plus, Trash2, CheckCircle2, ShieldAlert, Cpu, Sparkles,
  Server, Globe, RefreshCw
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { AdminNav } from '../components/AdminNav';

interface AIProvider {
  id?: string;
  provider: string;
  name: string;
  modelName: string;
  apiKey: string;
  baseUrl: string;
  isDefault: boolean;
  taskAssignments: string[];
}

const AVAILABLE_TASKS = [
  { code: 'RAG_SEARCH', label: 'Tra cứu & Search RAG 158k Văn bản' },
  { code: 'REDLINE_AUDIT', label: 'Thẩm định Rủi ro Hợp đồng Redline' },
  { code: 'OCR_PARSING', label: 'AI OCR Bóc tách File Hợp đồng' },
  { code: 'WORKFLOW_COPILOT', label: 'Trợ lý AI Copilot Nhúng Quy trình' },
];

export default function AdminAIBYOKConfigPage() {
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProvider, setEditingProvider] = useState<AIProvider | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiClient.getAIProviders();
      setProviders(data);
    } catch {
      /* Fallback demo data */
      setProviders([
        {
          id: 'p1', provider: 'GEMINI', name: 'Google Gemini 1.5 Pro', modelName: 'gemini-1.5-pro',
          apiKey: 'AIza...8899', baseUrl: 'https://generativelanguage.googleapis.com', isDefault: true,
          taskAssignments: ['RAG_SEARCH', 'REDLINE_AUDIT', 'OCR_PARSING', 'WORKFLOW_COPILOT'],
        },
        {
          id: 'p2', provider: 'OPENAI', name: 'OpenAI GPT-4o Enterprise', modelName: 'gpt-4o',
          apiKey: 'sk-proj...1122', baseUrl: 'https://api.openai.com/v1', isDefault: false,
          taskAssignments: ['REDLINE_AUDIT'],
        },
      ]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleOpenEdit = (provider?: AIProvider) => {
    if (provider) {
      setEditingProvider({ ...provider });
    } else {
      setEditingProvider({
        provider: 'GEMINI',
        name: 'AI Model Mới',
        modelName: 'gemini-1.5-flash',
        apiKey: '',
        baseUrl: 'https://generativelanguage.googleapis.com',
        isDefault: false,
        taskAssignments: ['RAG_SEARCH'],
      });
    }
  };

  const handleSave = async () => {
    if (!editingProvider || !editingProvider.name) return;
    setSaving(true);
    try {
      await apiClient.upsertAIProvider(editingProvider as unknown as Record<string, unknown>);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      setEditingProvider(null);
      load();
    } catch { /* ignore */ }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa Provider này?')) return;
    try {
      await apiClient.deleteAIProvider(id);
      load();
    } catch { /* ignore */ }
  };

  const toggleTaskAssignment = (taskCode: string) => {
    if (!editingProvider) return;
    const current = editingProvider.taskAssignments || [];
    const updated = current.includes(taskCode)
      ? current.filter((t) => t !== taskCode)
      : [...current, taskCode];
    setEditingProvider({ ...editingProvider, taskAssignments: updated });
  };

  return (
    <div>
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        <AdminNav />

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Key className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white">Cấu hình AI Provider & BYOK Keys</h1>
            </div>
            <p className="text-sm text-slate-400">Quản lý các nhà cung cấp AI Model và chìa khóa API riêng (Bring Your Own Key)</p>
          </div>
          <button
            onClick={() => handleOpenEdit()}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-md transition"
          >
            <Plus className="w-4 h-4" /> Thêm Provider Mới
          </button>
        </div>

        {/* Edit / New Provider Form Modal */}
        {editingProvider && (
          <div className="bg-slate-950 rounded-2xl border border-indigo-900 shadow-xl p-6 space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Cpu className="w-5 h-5 text-indigo-400" />
                {editingProvider.id ? 'Chỉnh sửa AI Provider' : 'Thêm AI Provider Mới'}
              </h2>
              <div className="flex items-center gap-2">
                <button onClick={() => setEditingProvider(null)} className="px-4 py-2 text-xs font-medium text-slate-400 hover:bg-slate-800 rounded-lg">
                  Hủy
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-xs font-semibold rounded-lg shadow-sm"
                >
                  {saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                  {saved ? 'Đã lưu!' : saving ? 'Đang lưu...' : 'Lưu cấu hình'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-200 block mb-1">Loại Provider *</label>
                <select
                  value={editingProvider.provider}
                  onChange={(e) => setEditingProvider({ ...editingProvider, provider: e.target.value })}
                  className="w-full border border-slate-800 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  <option value="GEMINI">Google Gemini</option>
                  <option value="OPENAI">OpenAI</option>
                  <option value="ANTHROPIC">Anthropic Claude</option>
                  <option value="LOCAL_OLLAMA">Local Ollama (On-Premise)</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-200 block mb-1">Tên Provider *</label>
                <input
                  type="text"
                  value={editingProvider.name}
                  onChange={(e) => setEditingProvider({ ...editingProvider, name: e.target.value })}
                  className="w-full border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  placeholder="Ví dụ: Google Gemini 1.5 Pro"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-200 block mb-1">Tên Model *</label>
                <input
                  type="text"
                  value={editingProvider.modelName}
                  onChange={(e) => setEditingProvider({ ...editingProvider, modelName: e.target.value })}
                  className="w-full border border-slate-800 rounded-xl px-3.5 py-2 text-sm font-mono text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  placeholder="gemini-1.5-pro hoặc gpt-4o"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-200 block mb-1">API Key (BYOK) *</label>
                <input
                  type="password"
                  value={editingProvider.apiKey}
                  onChange={(e) => setEditingProvider({ ...editingProvider, apiKey: e.target.value })}
                  className="w-full border border-slate-800 rounded-xl px-3.5 py-2 text-sm font-mono text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  placeholder="Nhập API Key riêng của bạn..."
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-200 block mb-1">Base URL Endpoint (Dành cho Local LLM)</label>
              <input
                type="text"
                value={editingProvider.baseUrl}
                onChange={(e) => setEditingProvider({ ...editingProvider, baseUrl: e.target.value })}
                className="w-full border border-slate-800 rounded-xl px-3.5 py-2 text-sm font-mono text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                placeholder="https://generativelanguage.googleapis.com"
              />
            </div>

            {/* Task assignments checkboxes */}
            <div className="space-y-2 pt-1">
              <label className="text-xs font-bold text-slate-100 block">Phân bổ Nhiệm vụ AI cho Model này:</label>
              <div className="grid grid-cols-2 gap-2">
                {AVAILABLE_TASKS.map((task) => {
                  const checked = editingProvider.taskAssignments?.includes(task.code);
                  return (
                    <label key={task.code} className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-800 text-xs text-slate-200 cursor-pointer bg-slate-900 hover:bg-indigo-950/40/50 transition">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleTaskAssignment(task.code)}
                        className="w-4 h-4 rounded accent-indigo-600"
                      />
                      <span>{task.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Is Default Checkbox */}
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-100 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={editingProvider.isDefault}
                onChange={(e) => setEditingProvider({ ...editingProvider, isDefault: e.target.checked })}
                className="w-4 h-4 rounded accent-indigo-600"
              />
              Đặt làm AI Model mặc định hệ thống
            </label>
          </div>
        )}

        {/* Providers List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12 text-slate-400 text-sm">Đang tải cấu hình AI Providers...</div>
          ) : providers.map((p) => (
            <div key={p.id} className="bg-slate-950 rounded-2xl border border-slate-800 shadow-sm p-6 space-y-4 hover:shadow-md transition">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-indigo-950/40 text-indigo-400 rounded-xl flex items-center justify-center font-bold">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-indigo-700 font-mono bg-indigo-950/40 px-2 py-0.5 rounded-full">{p.provider}</span>
                      {p.isDefault && (
                        <span className="text-xs bg-yellow-100 text-yellow-800 font-bold px-2 py-0.5 rounded-full">⭐ Mặc định</span>
                      )}
                    </div>
                    <h3 className="font-bold text-white text-lg">{p.name}</h3>
                    <p className="text-xs font-mono text-slate-400 mt-0.5">Model: {p.modelName} | API Key: {p.apiKey || 'Chưa thiết lập'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button onClick={() => handleOpenEdit(p)} className="px-3 py-1.5 text-xs text-indigo-400 hover:bg-indigo-950/40 font-semibold rounded-lg transition">
                    Sửa key & cấu hình
                  </button>
                  <button onClick={() => p.id && handleDelete(p.id)} className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Task assignments */}
              <div className="pt-3 border-t border-slate-800 flex items-center gap-2 text-xs">
                <span className="text-slate-400 font-medium">Nhiệm vụ đảm nhận:</span>
                <div className="flex flex-wrap gap-1.5">
                  {p.taskAssignments?.map((t) => (
                    <span key={t} className="bg-slate-800 text-slate-200 px-2 py-0.5 rounded-md font-semibold text-[11px]">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
