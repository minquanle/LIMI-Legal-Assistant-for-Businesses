'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Radar,
  RefreshCw,
  Plus,
  Pencil,
  Trash2,
  X,
  Save,
  AlertTriangle,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { AdminNav } from '../components/AdminNav';

interface IndustryOption {
  id: string;
  name: string;
}

interface RadarAlertRow {
  id: string;
  industry: string;
  industryName: string;
  documentId: string | null;
  documentNumber: string;
  title: string;
  promulgationDate: string | null;
  effectiveDate: string | null;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  summary: string;
  financialImpact: string | null;
  operationalImpact: string | null;
  hrImpact: string | null;
  penaltyReference: string | null;
  maxPenaltyAmount: string | null;
  gapQuestions: Array<{ id: string; question: string; weight: number; remediation: string }>;
  affectedAreas: string[];
  actionChecklist: string[];
  deadlineDate: string | null;
  sourceUrl: string | null;
  updatedAt: string;
}

/** The subset of RadarAlertRow the create/edit form actually edits, as plain strings
 * (dates as yyyy-mm-dd for <input type="date">, arrays as newline-joined text). */
interface FormState {
  industry: string;
  documentId: string;
  documentNumber: string;
  title: string;
  promulgationDate: string;
  effectiveDate: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  summary: string;
  financialImpact: string;
  operationalImpact: string;
  hrImpact: string;
  penaltyReference: string;
  maxPenaltyAmount: string;
  gapQuestionsJson: string;
  affectedAreasText: string;
  actionChecklistText: string;
  deadlineDate: string;
  sourceUrl: string;
}

const EMPTY_FORM: FormState = {
  industry: '',
  documentId: '',
  documentNumber: '',
  title: '',
  promulgationDate: '',
  effectiveDate: '',
  severity: 'WARNING',
  summary: '',
  financialImpact: '',
  operationalImpact: '',
  hrImpact: '',
  penaltyReference: '',
  maxPenaltyAmount: '',
  gapQuestionsJson: '[]',
  affectedAreasText: '',
  actionChecklistText: '',
  deadlineDate: '',
  sourceUrl: '',
};

/** yyyy-mm-ddThh:mm:ss.sssZ (API) -> yyyy-mm-dd (date input), tolerant of null/undefined. */
function toDateInputValue(iso: string | null | undefined): string {
  if (!iso) return '';
  return iso.slice(0, 10);
}

function alertToForm(a: RadarAlertRow): FormState {
  return {
    industry: a.industry,
    documentId: a.documentId ?? '',
    documentNumber: a.documentNumber,
    title: a.title,
    promulgationDate: toDateInputValue(a.promulgationDate),
    effectiveDate: toDateInputValue(a.effectiveDate),
    severity: a.severity,
    summary: a.summary,
    financialImpact: a.financialImpact ?? '',
    operationalImpact: a.operationalImpact ?? '',
    hrImpact: a.hrImpact ?? '',
    penaltyReference: a.penaltyReference ?? '',
    maxPenaltyAmount: a.maxPenaltyAmount ?? '',
    gapQuestionsJson: JSON.stringify(a.gapQuestions ?? [], null, 2),
    affectedAreasText: (a.affectedAreas ?? []).join('\n'),
    actionChecklistText: (a.actionChecklist ?? []).join('\n'),
    deadlineDate: toDateInputValue(a.deadlineDate),
    sourceUrl: a.sourceUrl ?? '',
  };
}

/** Builds the API payload from form state, throwing a Vietnamese message on bad gapQuestions JSON. */
function formToPayload(f: FormState): Record<string, unknown> {
  let gapQuestions: unknown;
  try {
    gapQuestions = f.gapQuestionsJson.trim() ? JSON.parse(f.gapQuestionsJson) : [];
  } catch {
    throw new Error('Câu hỏi tự đánh giá (JSON) không hợp lệ — kiểm tra lại cú pháp.');
  }
  if (!Array.isArray(gapQuestions)) {
    throw new Error('Câu hỏi tự đánh giá phải là một mảng JSON.');
  }

  return {
    industry: f.industry,
    documentId: f.documentId.trim() || null,
    documentNumber: f.documentNumber.trim(),
    title: f.title.trim(),
    promulgationDate: f.promulgationDate || null,
    effectiveDate: f.effectiveDate || null,
    severity: f.severity,
    summary: f.summary.trim(),
    financialImpact: f.financialImpact.trim() || null,
    operationalImpact: f.operationalImpact.trim() || null,
    hrImpact: f.hrImpact.trim() || null,
    penaltyReference: f.penaltyReference.trim() || null,
    maxPenaltyAmount: f.maxPenaltyAmount.trim() || null,
    gapQuestions,
    affectedAreas: f.affectedAreasText.split('\n').map((s) => s.trim()).filter(Boolean),
    actionChecklist: f.actionChecklistText.split('\n').map((s) => s.trim()).filter(Boolean),
    deadlineDate: f.deadlineDate || null,
    sourceUrl: f.sourceUrl.trim() || null,
  };
}

const SEVERITY_LABEL: Record<string, string> = {
  CRITICAL: 'Khẩn cấp',
  WARNING: 'Cảnh báo',
  INFO: 'Hướng dẫn',
};

const SEVERITY_BADGE: Record<string, string> = {
  CRITICAL: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
  WARNING: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  INFO: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
};

export default function RadarConfigAdminPage() {
  const [alerts, setAlerts] = useState<RadarAlertRow[]>([]);
  const [industries, setIndustries] = useState<IndustryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | 'new' | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RadarAlertRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const dialogRef = useRef<HTMLDivElement | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await apiClient.getRadarAlertsAdmin();
      setAlerts(data.alerts || []);
      setIndustries(data.industries || []);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Không thể tải danh sách cảnh báo radar');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditingId('new');
    setForm({ ...EMPTY_FORM, industry: industries[0]?.id ?? '' });
    setFormError(null);
  };

  const openEdit = (alert: RadarAlertRow) => {
    setEditingId(alert.id);
    setForm(alertToForm(alert));
    setFormError(null);
  };

  const closeForm = () => {
    setEditingId(null);
    setFormError(null);
  };

  // Escape closes the open dialog (edit/create form, or the delete confirmation).
  useEffect(() => {
    if (!editingId && !deleteTarget) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (deleteTarget) setDeleteTarget(null);
      else closeForm();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [editingId, deleteTarget]);

  useEffect(() => {
    if (editingId) dialogRef.current?.querySelector<HTMLElement>('input, textarea, select')?.focus();
  }, [editingId]);

  const handleSubmit = async () => {
    setFormError(null);
    let payload: Record<string, unknown>;
    try {
      payload = formToPayload(form);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Dữ liệu không hợp lệ');
      return;
    }

    setSaving(true);
    try {
      if (editingId === 'new') {
        await apiClient.createRadarAlert(payload);
      } else if (editingId) {
        await apiClient.updateRadarAlert(editingId, payload);
      }
      closeForm();
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Lưu thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiClient.deleteRadarAlert(deleteTarget.id);
      setDeleteTarget(null);
      await load();
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Xoá thất bại');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        <AdminNav />

        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Radar className="w-5 h-5 text-white" aria-hidden="true" />
              </div>
              <h1 className="text-2xl font-bold text-white">Cấu hình Radar Tuân thủ Pháp lý</h1>
            </div>
            <p className="text-sm text-slate-400">
              Quản lý các cảnh báo tuân thủ hiển thị trên trang công khai <code>/radar-phap-ly</code>. Thay đổi ở đây
              có hiệu lực ngay và không bị ghi đè khi máy chủ khởi động lại.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={load}
              className="p-2 text-slate-400 hover:bg-slate-950 border border-slate-800 rounded-xl transition"
              aria-label="Tải lại danh sách"
            >
              <RefreshCw className="w-4 h-4" aria-hidden="true" />
            </button>
            <button
              onClick={openCreate}
              disabled={industries.length === 0}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-sm transition"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              Thêm cảnh báo
            </button>
          </div>
        </div>

        {loadError && (
          <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-900/50 text-rose-300 text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
            {loadError}
          </div>
        )}

        <div className="bg-slate-950 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900 border-b border-slate-800 text-slate-200 font-bold">
                  <th className="p-3">Ngành</th>
                  <th className="p-3">Số hiệu</th>
                  <th className="p-3">Tiêu đề</th>
                  <th className="p-3">Mức độ</th>
                  <th className="p-3">Hạn chót</th>
                  <th className="p-3">Cập nhật</th>
                  <th className="p-3 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">
                      Đang tải...
                    </td>
                  </tr>
                ) : alerts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">
                      Chưa có cảnh báo nào.
                    </td>
                  </tr>
                ) : (
                  alerts.map((a) => (
                    <tr key={a.id} className="hover:bg-indigo-950/30 transition">
                      <td className="p-3 text-slate-300">{a.industryName}</td>
                      <td className="p-3 font-mono text-slate-400">{a.documentNumber}</td>
                      <td className="p-3 text-slate-100 font-medium max-w-xs truncate" title={a.title}>
                        {a.title}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${SEVERITY_BADGE[a.severity]}`}>
                          {SEVERITY_LABEL[a.severity] ?? a.severity}
                        </span>
                      </td>
                      <td className="p-3 text-slate-400">
                        {a.deadlineDate ? new Date(a.deadlineDate).toLocaleDateString('vi-VN') : '—'}
                      </td>
                      <td className="p-3 text-slate-500">{new Date(a.updatedAt).toLocaleDateString('vi-VN')}</td>
                      <td className="p-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEdit(a)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                            aria-label={`Sửa ${a.title}`}
                          >
                            <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(a)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                            aria-label={`Xoá ${a.title}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create / Edit form dialog */}
      {editingId && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={closeForm}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="radar-admin-form-title"
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-950 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between">
              <h2 id="radar-admin-form-title" className="text-base font-bold text-white">
                {editingId === 'new' ? 'Thêm cảnh báo mới' : 'Sửa cảnh báo'}
              </h2>
              <button
                onClick={closeForm}
                aria-label="Đóng"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-900/50 text-rose-300 text-xs">
                {formError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <label className="space-y-1">
                <span className="text-slate-400 font-semibold">Ngành *</span>
                <select
                  value={form.industry}
                  onChange={(e) => setForm({ ...form, industry: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-100"
                >
                  {industries.map((ind) => (
                    <option key={ind.id} value={ind.id}>
                      {ind.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1">
                <span className="text-slate-400 font-semibold">Mức độ rủi ro *</span>
                <select
                  value={form.severity}
                  onChange={(e) => setForm({ ...form, severity: e.target.value as FormState['severity'] })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-100"
                >
                  <option value="CRITICAL">Khẩn cấp</option>
                  <option value="WARNING">Cảnh báo</option>
                  <option value="INFO">Hướng dẫn</option>
                </select>
              </label>

              <label className="space-y-1">
                <span className="text-slate-400 font-semibold">Số hiệu văn bản *</span>
                <input
                  value={form.documentNumber}
                  onChange={(e) => setForm({ ...form, documentNumber: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-100"
                  placeholder="41/2024/QH15"
                />
              </label>

              <label className="space-y-1">
                <span className="text-slate-400 font-semibold">ID văn bản liên kết (tuỳ chọn)</span>
                <input
                  value={form.documentId}
                  onChange={(e) => setForm({ ...form, documentId: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-100 font-mono"
                  placeholder="uuid của văn bản trong hệ thống"
                />
              </label>

              <label className="space-y-1 sm:col-span-2">
                <span className="text-slate-400 font-semibold">Tiêu đề quy định *</span>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-100"
                />
              </label>

              <label className="space-y-1">
                <span className="text-slate-400 font-semibold">Ngày ban hành</span>
                <input
                  type="date"
                  value={form.promulgationDate}
                  onChange={(e) => setForm({ ...form, promulgationDate: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-100"
                />
              </label>

              <label className="space-y-1">
                <span className="text-slate-400 font-semibold">Ngày hiệu lực</span>
                <input
                  type="date"
                  value={form.effectiveDate}
                  onChange={(e) => setForm({ ...form, effectiveDate: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-100"
                />
              </label>

              <label className="space-y-1">
                <span className="text-slate-400 font-semibold">Hạn chót tuân thủ</span>
                <input
                  type="date"
                  value={form.deadlineDate}
                  onChange={(e) => setForm({ ...form, deadlineDate: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-100"
                />
              </label>

              <label className="space-y-1">
                <span className="text-slate-400 font-semibold">Mức phạt tối đa</span>
                <input
                  value={form.maxPenaltyAmount}
                  onChange={(e) => setForm({ ...form, maxPenaltyAmount: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-100"
                />
              </label>

              <label className="space-y-1 sm:col-span-2">
                <span className="text-slate-400 font-semibold">Tóm tắt tác động cốt lõi *</span>
                <textarea
                  value={form.summary}
                  onChange={(e) => setForm({ ...form, summary: e.target.value })}
                  rows={2}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-100"
                />
              </label>

              <label className="space-y-1 sm:col-span-2">
                <span className="text-slate-400 font-semibold">1. Tác động Tài chính</span>
                <textarea
                  value={form.financialImpact}
                  onChange={(e) => setForm({ ...form, financialImpact: e.target.value })}
                  rows={2}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-100"
                />
              </label>

              <label className="space-y-1 sm:col-span-2">
                <span className="text-slate-400 font-semibold">2. Tác động Quy trình & Vận hành</span>
                <textarea
                  value={form.operationalImpact}
                  onChange={(e) => setForm({ ...form, operationalImpact: e.target.value })}
                  rows={2}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-100"
                />
              </label>

              <label className="space-y-1 sm:col-span-2">
                <span className="text-slate-400 font-semibold">3. Tác động Nhân sự</span>
                <textarea
                  value={form.hrImpact}
                  onChange={(e) => setForm({ ...form, hrImpact: e.target.value })}
                  rows={2}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-100"
                />
              </label>

              <label className="space-y-1 sm:col-span-2">
                <span className="text-slate-400 font-semibold">4. Căn cứ Chế tài Xử phạt</span>
                <textarea
                  value={form.penaltyReference}
                  onChange={(e) => setForm({ ...form, penaltyReference: e.target.value })}
                  rows={2}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-100"
                />
              </label>

              <label className="space-y-1">
                <span className="text-slate-400 font-semibold">Phòng ban phụ trách (mỗi dòng một mục)</span>
                <textarea
                  value={form.affectedAreasText}
                  onChange={(e) => setForm({ ...form, affectedAreasText: e.target.value })}
                  rows={3}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-100"
                  placeholder={'Pháp chế\nNhân sự'}
                />
              </label>

              <label className="space-y-1">
                <span className="text-slate-400 font-semibold">Danh mục hành động (mỗi dòng một việc)</span>
                <textarea
                  value={form.actionChecklistText}
                  onChange={(e) => setForm({ ...form, actionChecklistText: e.target.value })}
                  rows={3}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-100"
                  placeholder={'Rà soát hợp đồng mẫu\nĐăng ký hồ sơ trước hạn'}
                />
              </label>

              <label className="space-y-1 sm:col-span-2">
                <span className="text-slate-400 font-semibold">
                  Câu hỏi tự đánh giá lỗ hổng tuân thủ (JSON:{' '}
                  <code className="text-slate-500">[{'{ id, question, weight, remediation }'}]</code>)
                </span>
                <textarea
                  value={form.gapQuestionsJson}
                  onChange={(e) => setForm({ ...form, gapQuestionsJson: e.target.value })}
                  rows={5}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-100 font-mono text-[11px]"
                />
              </label>

              <label className="space-y-1 sm:col-span-2">
                <span className="text-slate-400 font-semibold">Nguồn tham khảo (URL)</span>
                <input
                  value={form.sourceUrl}
                  onChange={(e) => setForm({ ...form, sourceUrl: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-100"
                  placeholder="https://..."
                />
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={closeForm}
                className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-800 transition"
              >
                Huỷ
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-xs font-semibold shadow-sm transition"
              >
                <Save className="w-3.5 h-3.5" aria-hidden="true" />
                {saving ? 'Đang lưu...' : 'Lưu'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setDeleteTarget(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="radar-admin-delete-title"
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-950 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4"
          >
            <h2 id="radar-admin-delete-title" className="text-base font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" aria-hidden="true" />
              Xoá cảnh báo?
            </h2>
            <p className="text-xs text-slate-400">
              Cảnh báo <strong className="text-slate-200">&quot;{deleteTarget.title}&quot;</strong> ({deleteTarget.documentNumber}) sẽ bị xoá
              khỏi trang công khai ngay lập tức. Hành động này không thể hoàn tác.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-800 transition"
              >
                Huỷ
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white text-xs font-semibold shadow-sm transition"
              >
                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                {deleting ? 'Đang xoá...' : 'Xoá'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
