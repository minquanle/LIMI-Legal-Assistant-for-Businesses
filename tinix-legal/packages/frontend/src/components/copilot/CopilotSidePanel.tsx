'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Bot,
  ShieldAlert,
  ShieldCheck,
  BookOpen,
  Send,
  PlusCircle,
  FileCheck,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';

import { ContractAuditPanel } from './ContractAuditPanel';
import { Scale, GitBranch } from 'lucide-react';
import { ApprovalTimeline } from '@/components/workflow/ApprovalTimeline';

interface CopilotSidePanelProps {
  draftContent: string;
  onInsertText: (text: string) => void;
  onScanValidity: () => void;
  scannedCitations: any[];
  onAcceptRedline?: (originalText: string, suggestedText: string) => void;
  draftId?: string;
}

export function CopilotSidePanel({
  draftContent,
  onInsertText,
  onScanValidity,
  scannedCitations,
  onAcceptRedline,
  draftId,
}: CopilotSidePanelProps) {
  const [activeTab, setActiveTab] = useState<'copilot' | 'rag' | 'risks' | 'audit' | 'workflow'>('copilot');
  const [workflowProgress, setWorkflowProgress] = useState<any>(null);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string; citations?: any[] }>>([
    {
      role: 'assistant',
      text: 'Xin chào! Tôi là AI Legal Copilot. Tôi có thể hỗ trợ bạn sinh nội dung dự thảo, đề xuất căn cứ pháp lý từ kho dữ liệu luật, hoặc kiểm tra rủi ro hiệu lực của văn bản dẫn chiếu.',
    },
  ]);
  const [ragItems, setRagItems] = useState<any[]>([]);

  const handleSend = async () => {
    if (!prompt.trim() || loading) return;

    const userText = prompt.trim();
    setPrompt('');
    setMessages((prev) => [...prev, { role: 'user', text: userText }]);
    setLoading(true);

    try {
      const res = await apiClient.getCopilotCompletion({
        prompt: userText,
        draftContent,
        mode: 'generate_draft',
      });

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: res.completion || 'Không nhận được phản hồi từ AI.',
          citations: res.suggestedCitations || [],
        },
      ]);
      if (res.suggestedCitations && res.suggestedCitations.length > 0) {
        setRagItems(res.suggestedCitations);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: 'Có lỗi xảy ra khi kết nối tới AI Copilot service.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefineStyle = async () => {
    setLoading(true);
    try {
      const res = await apiClient.getCopilotCompletion({
        prompt: 'Chuẩn hóa thể thức hành chính theo NĐ 30/2020/NĐ-CP',
        draftContent,
        mode: 'refine_style',
      });
      if (res.completion) {
        onInsertText('\n\n' + res.completion);
      }
    } catch {
      alert('Không thể kết nối AI service.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-96 bg-white border-l border-slate-200 flex flex-col h-full shadow-lg">
      {/* Header Tabs */}
      <div className="flex items-center border-b border-slate-200 bg-slate-50 text-xs font-medium overflow-x-auto">
        <button
          onClick={() => setActiveTab('copilot')}
          className={`flex-1 py-3 px-2 flex items-center justify-center gap-1.5 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'copilot'
              ? 'border-yellow-500 text-slate-900 bg-white font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-yellow-500" />
          <span>AI Chat</span>
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`flex-1 py-3 px-2 flex items-center justify-center gap-1.5 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'audit'
              ? 'border-[#0B1D51] text-[#0B1D51] bg-white font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Scale className="w-3.5 h-3.5 text-purple-600" />
          <span>Thẩm định Redline</span>
        </button>
        <button
          onClick={() => setActiveTab('rag')}
          className={`flex-1 py-3 px-2 flex items-center justify-center gap-1.5 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'rag'
              ? 'border-blue-600 text-blue-700 bg-white font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5 text-blue-600" />
          <span>Kho luật ({ragItems.length})</span>
        </button>
        <button
          onClick={() => {
            setActiveTab('risks');
            onScanValidity();
          }}
          className={`flex-1 py-3 px-2 flex items-center justify-center gap-1.5 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'risks'
              ? 'border-red-500 text-red-700 bg-white font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5 text-red-500" />
          <span>Rủi ro ({scannedCitations.length})</span>
        </button>
        {draftId && (
          <button
            onClick={async () => {
              setActiveTab('workflow');
              try {
                const p = await import('@/lib/api-client').then(m => m.apiClient.getWorkflowProgress(draftId));
                setWorkflowProgress(p);
              } catch { setWorkflowProgress({ currentStatus: 'DRAFT', steps: [], history: [] }); }
            }}
            className={`flex-1 py-3 px-2 flex items-center justify-center gap-1.5 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'workflow'
                ? 'border-indigo-500 text-indigo-700 bg-white font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <GitBranch className="w-3.5 h-3.5 text-indigo-500" />
            <span>Trình ký</span>
          </button>
        )}
      </div>

      {/* Tab Content 1: AI Chat Assistant */}
      {activeTab === 'copilot' && (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Quick Actions */}
          <div className="p-3 bg-slate-50 border-b border-slate-200 flex gap-2">
            <button
              onClick={handleRefineStyle}
              disabled={loading}
              className="text-[11px] bg-white border border-slate-300 hover:border-yellow-500 text-slate-700 px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-colors shadow-sm"
            >
              <FileCheck className="w-3 h-3 text-yellow-600" />
              <span>Chuẩn hóa NĐ 30/2020</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('risks');
                onScanValidity();
              }}
              className="text-[11px] bg-white border border-slate-300 hover:border-red-500 text-slate-700 px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-colors shadow-sm"
            >
              <ShieldAlert className="w-3 h-3 text-red-500" />
              <span>Quét căn cứ</span>
            </button>
          </div>

          {/* Chat Messages Log */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            {messages.map((m, idx) => (
              <div key={idx} className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : ''}`}>
                {m.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-full bg-yellow-100 text-yellow-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] p-3 rounded-xl whitespace-pre-wrap leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-yellow-500 text-[#0B1D51] font-medium rounded-tr-none'
                      : 'bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200'
                  }`}
                >
                  {m.text}
                  {m.role === 'assistant' && (
                    <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex justify-end">
                      <button
                        onClick={() => onInsertText('\n\n' + m.text)}
                        className="text-[10px] text-blue-700 font-semibold hover:underline flex items-center gap-1"
                      >
                        <PlusCircle className="w-3 h-3" /> Chèn vào văn bản
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-xs text-slate-400 italic">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-yellow-500" />
                <span>AI Copilot đang phân tích và soạn thảo...</span>
              </div>
            )}
          </div>

          {/* Prompt Input Box */}
          <div className="p-3 border-t border-slate-200 bg-white">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 focus-within:ring-2 focus-within:ring-yellow-500 focus-within:border-transparent">
              <input
                type="text"
                placeholder="Yêu cầu AI viết tiếp, sửa câu, tìm căn cứ..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                className="flex-1 bg-transparent text-xs outline-none text-slate-900 placeholder:text-slate-400 py-1.5"
              />
              <button
                onClick={handleSend}
                disabled={loading || !prompt.trim()}
                className="w-7 h-7 bg-yellow-500 hover:bg-yellow-600 disabled:opacity-40 text-[#0B1D51] rounded-lg flex items-center justify-center transition-colors flex-shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content 2: RAG Legal Knowledge Base */}
      {activeTab === 'rag' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Căn cứ pháp lý trích xuất
          </div>
          {ragItems.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <span>Chưa có căn cứ pháp lý được trích xuất. Hãy đặt câu hỏi ở tab AI Assistant.</span>
            </div>
          ) : (
            ragItems.map((item, idx) => (
              <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-800">{item.documentNumber}</span>
                  <span className="text-[10px] bg-green-100 text-green-800 px-2 py-0.5 rounded-full border border-green-200">
                    {item.validityStatus}
                  </span>
                </div>
                <div className="font-medium text-slate-900 line-clamp-2">{item.title}</div>
                <p className="text-slate-500 line-clamp-3 text-[11px] bg-white p-2 rounded border border-slate-200">
                  "{item.snippet}"
                </p>
                <button
                  onClick={() =>
                    onInsertText(`- Căn cứ ${item.documentType} số ${item.documentNumber} (${item.title});\n`)
                  }
                  className="w-full text-[11px] bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 py-1.5 rounded-lg flex items-center justify-center gap-1 font-semibold transition-colors mt-2"
                >
                  <PlusCircle className="w-3.5 h-3.5" /> Chèn làm căn cứ pháp lý
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab Content 3: Real-time Validity Risk Checker */}
      {activeTab === 'risks' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Kết quả quét hiệu lực ({scannedCitations.length})
            </span>
            <button
              onClick={onScanValidity}
              className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 font-medium"
            >
              <RefreshCw className="w-3 h-3" /> Quét lại
            </button>
          </div>

          {scannedCitations.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              <ShieldCheck className="w-8 h-8 mx-auto mb-2 text-green-500 opacity-60" />
              <span>Chưa phát hiện số hiệu văn bản pháp luật trong dự thảo.</span>
            </div>
          ) : (
            scannedCitations.map((c, idx) => (
              <div
                key={idx}
                className={`border rounded-xl p-3 text-xs space-y-1.5 ${
                  c.status === 'EXPIRED'
                    ? 'bg-red-50 border-red-200 text-red-900'
                    : c.status === 'PARTIALLY_EXPIRED'
                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                    : 'bg-green-50 border-green-200 text-green-900'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold">{c.documentNumber}</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                      c.status === 'EXPIRED'
                        ? 'bg-red-100 text-red-800 border-red-300'
                        : c.status === 'PARTIALLY_EXPIRED'
                        ? 'bg-amber-100 text-amber-800 border-amber-300'
                        : 'bg-green-100 text-green-800 border-green-300'
                    }`}
                  >
                    {c.statusLabel}
                  </span>
                </div>
                {c.title && <div className="font-medium line-clamp-2 text-[11px]">{c.title}</div>}
                <div className="text-[11px] opacity-90 flex items-start gap-1">
                  {c.status !== 'VALID' && <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 text-red-500 mt-0.5" />}
                  <span>{c.notes}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab Content 4: AI Contract Audit & Redlining */}
      {activeTab === 'audit' && (
        <ContractAuditPanel
          draftContent={draftContent}
          onAcceptRedline={(orig, sugg) => {
            if (onAcceptRedline) onAcceptRedline(orig, sugg);
          }}
        />
      )}

      {/* Tab Content 5: Approval Workflow Timeline */}
      {activeTab === 'workflow' && draftId && (
        <div className="flex-1 overflow-y-auto p-3">
          {workflowProgress ? (
            <ApprovalTimeline
              draftId={draftId}
              currentStatus={workflowProgress.currentStatus}
              steps={workflowProgress.steps}
              onStatusChange={(newStatus) => {
                setWorkflowProgress((prev: any) => prev ? { ...prev, currentStatus: newStatus } : prev);
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-32 text-slate-400 text-sm">
              Đang tải tiến trình duyệt...
            </div>
          )}
        </div>
      )}
    </div>
  );
}
