'use client';

import React, { useState } from 'react';
import { Sparkles, X, Check, FileText, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';

import { convertMarkdownToLegalHtml } from '@/lib/legal-markdown-parser';

interface TemplateWizardModalProps {
  template: any;
  onClose: () => void;
}

export function TemplateWizardModal({ template, onClose }: TemplateWizardModalProps) {
  const router = useRouter();
  const variables: Array<{ key: string; label: string; placeholder: string }> = template.variables || [];
  
  const [formData, setFormData] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    variables.forEach((v) => {
      initial[v.key] = v.placeholder || '';
    });
    return initial;
  });
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleGenerate = async () => {
    setSubmitting(true);
    setError(null);
    try {
      let rawContent = template.templateBody || '';
      Object.entries(formData).forEach(([key, val]) => {
        const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
        rawContent = rawContent.replace(regex, val || `[${key}]`);
      });

      // Format markdown to beautiful legal HTML according to Decree 30/2020
      const formattedHtml = convertMarkdownToLegalHtml(rawContent);

      const draft = await apiClient.createDraft({
        title: `Dự thảo - ${template.title}`,
        templateId: template.id,
        content: formattedHtml,
      });

      router.push(`/soan-thao/${draft.id}`);
    } catch {
      setError('Không thể khởi tạo dự thảo từ mẫu. Vui lòng thử lại.');
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-100 text-yellow-700 flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">{template.title}</h2>
              <p className="text-xs text-slate-500 mt-0.5">{template.category} • Nhập thông tin để sinh tự động</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Inputs */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {variables.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-4">Mẫu này chưa cấu hình biến số động. Bạn có thể sinh trực tiếp dự thảo.</p>
          ) : (
            variables.map((v) => (
              <div key={v.key} className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">
                  {v.label} <span className="text-slate-400 font-mono">({`{{${v.key}}}`})</span>
                </label>
                <input
                  type="text"
                  value={formData[v.key] || ''}
                  onChange={(e) => handleChange(v.key, e.target.value)}
                  placeholder={v.placeholder}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:bg-white transition-all"
                />
              </div>
            ))
          )}
        </div>

        {error && (
          <div role="alert" className="mt-3 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        {/* Modal Footer Actions */}
        <div className="border-t border-slate-100 pt-4 mt-6 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            Hủy bỏ
          </button>
          <button
            onClick={handleGenerate}
            disabled={submitting}
            className="px-5 py-2.5 bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 text-[#0B1D51] font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>{submitting ? 'Đang sinh dự thảo...' : 'Khởi tạo dự thảo ngay'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
