'use client';

import React, { useState } from 'react';
import { CopilotSidePanel } from './CopilotSidePanel';
import { WordOnlineEditor } from '../editor/WordOnlineEditor';
import { apiClient } from '@/lib/api-client';
import {
  FileText,
  Download,
  ArrowLeft,
  CheckCircle2,
  Printer,
  Save,
  History,
} from 'lucide-react';
import Link from 'next/link';
import { exportToPDF } from '@/lib/pdf-export';
import { convertMarkdownToLegalHtml } from '@/lib/legal-markdown-parser';

interface DraftingWorkspaceProps {
  initialDraft?: {
    id?: string;
    title?: string;
    content?: string;
    status?: string;
  };
}

export function DraftingWorkspace({ initialDraft }: DraftingWorkspaceProps) {
  const [draftId, setDraftId] = useState<string | undefined>(initialDraft?.id);
  const [title, setTitle] = useState<string>(initialDraft?.title || 'Dự thảo mới');
  // Detect already-converted HTML to prevent double-conversion
  const isAlreadyHtml = (s: string) => /<[a-z][\s\S]*>/i.test(s.trim().slice(0, 200));

  const [content, setContent] = useState<string>(() => {
    if (initialDraft?.content) {
      const c = initialDraft.content.trim();
      // If already HTML, return as-is to avoid double conversion
      if (isAlreadyHtml(c)) return c;
      return convertMarkdownToLegalHtml(c);
    }
    return convertMarkdownToLegalHtml(`# CÔNG TY CP DOANH NGHIỆP
**Số: 01/2026/QĐ-DN**
*Hà Nội, ngày ... tháng ... năm 2026*

# QUYẾT ĐỊNH
## Về việc phê duyệt dự thảo văn bản

### TỔNG GIÁM ĐỐC CÔNG TY

- *Căn cứ Nghị định số 30/2020/NĐ-CP ngày 05/3/2020 của Chính phủ về công tác văn thư;*
- *Căn cứ Điều lệ tổ chức và hoạt động của Công ty;*
- *Theo đề nghị của Trưởng phòng Hành chính - Nhân sự.*

### QUYẾT ĐỊNH:

**Điều 1.** Phê duyệt và ban hành văn bản hành chính theo đúng thể thức quy định.

**Điều 2.** Quyết định này có hiệu lực kể từ ngày ký.

**Điều 3.** Các phòng ban và cá nhân liên quan chịu trách nhiệm thi hành Quyết định này./.

| **Nơi nhận:** | **TỔNG GIÁM ĐỐC** |
| :--- | :--- |
| - Như Điều 3; | *(Ký, ghi rõ họ tên và đóng dấu)* |
| - Lưu: VT. | |
`);
  });

  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [scannedCitations, setScannedCitations] = useState<any[]>([]);
  const [autosaveStatus, setAutosaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [autosaveTime, setAutosaveTime] = useState<string>('');
  const [recoveryDraft, setRecoveryDraft] = useState<{ title: string; content: string; updatedAt: number } | null>(null);

  // Stable per-session id for drafts that don't have a server id yet — without
  // this, every unsaved draft shared the literal key "tinix_draft_autosave_new",
  // so opening a second new draft (or two tabs) would show a false "recover
  // previous session" banner and clobber each other's autosave.
  const [newDraftSessionId] = useState(() => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`);
  const storageKey = `tinix_draft_autosave_${draftId || newDraftSessionId}`;

  // Check for existing local backup on mount
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.content && parsed.content.trim().length > 30) {
          // If local backup is different from initial content, offer recovery
          const initialClean = (initialDraft?.content || '').trim();
          if (parsed.content.trim() !== initialClean) {
            setRecoveryDraft(parsed);
          }
        }
      }
    } catch (e) {
      console.warn('Failed to check draft recovery:', e);
    }
  }, [storageKey, initialDraft?.content]);

  // Debounced auto-save to localStorage
  React.useEffect(() => {
    if (!content || content.trim().length < 10) return;

    setAutosaveStatus('saving');
    const timer = setTimeout(() => {
      try {
        const payload = {
          title,
          content,
          updatedAt: Date.now(),
        };
        localStorage.setItem(storageKey, JSON.stringify(payload));
        setAutosaveStatus('saved');
        const now = new Date();
        const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
        setAutosaveTime(timeStr);
      } catch (e) {
        console.warn('Autosave error:', e);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [title, content, storageKey]);

  const handleRestoreBackup = () => {
    if (recoveryDraft) {
      setTitle(recoveryDraft.title || 'Dự thảo đã khôi phục');
      setContent(recoveryDraft.content);
      setRecoveryDraft(null);
      setSavedMessage(true);
      setTimeout(() => setSavedMessage(false), 3000);
    }
  };

  const handleDismissBackup = () => {
    setRecoveryDraft(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      if (draftId) {
        await apiClient.updateDraft(draftId, { title, content });
      } else {
        const newDraft = await apiClient.createDraft({ title, content });
        setDraftId(newDraft.id);
      }
      setSavedMessage(true);
      setTimeout(() => setSavedMessage(false), 3000);
    } catch {
      // In case of backend network failure, notify that local backup is safe
      setSaveError('Không thể lưu lên máy chủ. Bản nháp đã được lưu an toàn trên máy (tự động lưu cục bộ).');
      setTimeout(() => setSaveError(null), 6000);
    } finally {
      setSaving(false);
    }
  };

  const handleScanValidity = async () => {
    try {
      const res = await apiClient.scanCitationValidity(content);
      setScannedCitations(res.citations || []);
    } catch (err) {
      console.warn('Scan validity error:', err);
      setSaveError('Không thể quét căn cứ pháp lý lúc này. Vui lòng thử lại.');
      setTimeout(() => setSaveError(null), 6000);
    }
  };

  const handleInsertText = (insertedText: string) => {
    setContent((prev) => prev + `<p>${insertedText}</p>`);
  };

  const handleExportPDF = () => {
    exportToPDF(content, title);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleAcceptRedline = (originalText: string, suggestedText: string) => {
    setContent((prev) => {
      // A plain string replace on raw HTML can't reliably tell which occurrence
      // the user meant to accept when the text appears more than once (or is
      // split across tag boundaries, in which case it won't match at all) — in
      // the ambiguous multi-match case, fall back to appending the accepted
      // text as a note rather than silently editing the wrong occurrence.
      const occurrences = originalText ? prev.split(originalText).length - 1 : 0;
      if (occurrences === 1) {
        return prev.replace(originalText, suggestedText);
      }
      return prev + `<p><strong>[Đã chấp nhận Redline]:</strong> ${suggestedText}</p>`;
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-65px)] bg-slate-100 dark:bg-slate-950 overflow-hidden">
      {/* Top Toolbar Header */}
      <header className="h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 flex items-center justify-between flex-shrink-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            href="/soan-thao"
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-sm font-bold text-slate-900 dark:text-slate-100 bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:border-yellow-500 outline-none px-1 py-0.5"
            />
          </div>

          {/* Autosave Status Badge */}
          {autosaveStatus === 'saved' && (
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-700 dark:text-emerald-300 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Đã lưu nháp tự động {autosaveTime ? `(${autosaveTime})` : ''}</span>
            </span>
          )}
          {autosaveStatus === 'saving' && (
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-500">
              <span>Đang lưu...</span>
            </span>
          )}

          {savedMessage && (
            <span className="text-xs text-green-600 dark:text-green-400 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" /> Đã lưu máy chủ
            </span>
          )}

          {saveError && (
            <span role="alert" className="text-xs text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1 max-w-xs">
              <FileText className="w-3.5 h-3.5 shrink-0" aria-hidden="true" /> {saveError}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-3.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:border-slate-400 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Save className="w-4 h-4 text-slate-500" />
            <span>{saving ? 'Đang lưu...' : 'Lưu dự thảo'}</span>
          </button>
          <button
            onClick={handlePrint}
            className="px-3.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:border-slate-400 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">In (Ctrl+P)</span>
          </button>
          <button
            onClick={handleExportPDF}
            className="px-4 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-[#0B1D51] text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors shadow-sm font-bold"
          >
            <Download className="w-4 h-4" />
            <span>Xuất file PDF</span>
          </button>
        </div>
      </header>

      {/* Offline Recovery Prompt Banner */}
      {recoveryDraft && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2.5 flex items-center justify-between text-xs font-semibold shadow-md animate-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>
              Phát hiện bản sao lưu nháp tự động từ phiên làm việc trước ({new Date(recoveryDraft.updatedAt).toLocaleTimeString('vi-VN')}). Bạn có muốn khôi phục không?
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRestoreBackup}
              className="px-3 py-1 bg-slate-950 hover:bg-slate-800 text-white rounded-lg font-bold text-xs transition-colors"
            >
              Khôi phục ngay
            </button>
            <button
              onClick={handleDismissBackup}
              className="px-2.5 py-1 hover:bg-amber-600 rounded-lg text-slate-950 font-semibold text-xs transition-colors"
            >
              Bỏ qua
            </button>
          </div>
        </div>
      )}


      {/* Main Split-View Body */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left Column: Word Online WYSIWYG A4 Canvas */}
        <WordOnlineEditor
          initialContent={content}
          onChangeContent={setContent}
          onScanValidity={handleScanValidity}
          onInsertCitationPrompt={handleScanValidity}
          onAIAskPrompt={(prompt, selected) => {
            handleInsertText(`[Gợi ý AI cho "${selected}"]: ${prompt}`);
          }}
        />

        {/* Right Column: AI Copilot Side Panel */}
        <CopilotSidePanel
          draftContent={content}
          onInsertText={handleInsertText}
          onScanValidity={handleScanValidity}
          scannedCitations={scannedCitations}
          onAcceptRedline={handleAcceptRedline}
          draftId={draftId}
        />
      </div>
    </div>
  );
}
