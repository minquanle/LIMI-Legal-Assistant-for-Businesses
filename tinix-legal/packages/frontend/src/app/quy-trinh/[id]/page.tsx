'use client';

import { useState, useEffect, useCallback, use } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  BrainCircuit,
  Check,
  CheckCircle2,
  Clock,
  Layers,
  RefreshCw,
  ScrollText,
  Send,
  ShieldCheck,
  Sparkles,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';

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

interface WorkflowExecutionDetail {
  id: string;
  title: string;
  currentStep: number;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  checklistResults: Record<string, { status: 'PASSED' | 'WARNING' | 'FAILED' | 'PENDING'; notes: string }>;
  workflowConfig: {
    id: string;
    code: string;
    name: string;
    category: string;
    description: string;
    boundLegalFields: string[];
    systemPrompt: string;
    complianceChecklist: ChecklistItem[];
    steps: WorkflowStep[];
  };
}

const CHECKLIST_STATUS_STYLES: Record<string, { bg: string; border: string; text: string; icon: React.ReactNode; label: string }> = {
  PASSED: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-700',
    icon: <CheckCircle2 className="w-4 h-4 text-green-600" />,
    label: 'Đạt tuân thủ',
  },
  WARNING: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    text: 'text-yellow-700',
    icon: <AlertTriangle className="w-4 h-4 text-yellow-600" />,
    label: 'Cảnh báo rủi ro',
  },
  FAILED: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700',
    icon: <XCircle className="w-4 h-4 text-red-600" />,
    label: 'Vi phạm quy định',
  },
  PENDING: {
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    text: 'text-slate-500',
    icon: <Clock className="w-4 h-4 text-slate-400" />,
    label: 'Chưa đánh giá',
  },
};

export default function WorkflowExecutionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const executionId = resolvedParams.id;

  const [execution, setExecution] = useState<WorkflowExecutionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [stepNotes, setStepNotes] = useState('');
  const [advancing, setAdvancing] = useState(false);
  const [evaluating, setEvaluating] = useState(false);

  // Copilot chat state
  const [chatQuery, setChatQuery] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string; citations?: any[] }>>([
    {
      role: 'assistant',
      text: 'Xin chào! Tôi là Trợ lý AI Pháp chế được gán riêng cho quy trình này. Bạn có thể hỏi bất kỳ câu hỏi nào liên quan tới quy định pháp luật và checklist tuân thủ của vụ việc.',
    },
  ]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiClient.getWorkflowExecutionById(executionId);
      setExecution(data);
    } catch {
      /* Fallback demo execution detail */
      setExecution({
        id: executionId,
        title: 'Hồ sơ Kỷ luật Lao động NV Nguyễn Văn X',
        currentStep: 2,
        status: 'IN_PROGRESS',
        checklistResults: {
          check_hr_1: { status: 'PASSED', notes: 'Tuân thủ Điều 125 BLLĐ: Có hành vi vi phạm kỷ luật.' },
          check_hr_2: { status: 'PASSED', notes: 'Tuân thủ Điều 123 BLLĐ: Còn 45 ngày thời hiệu.' },
          check_hr_3: { status: 'WARNING', notes: 'Lưu ý Khoản 1 Điều 122 BLLĐ: Cần đảm bảo Công đoàn tham dự họp.' },
        },
        workflowConfig: {
          id: 'cfg_1',
          code: 'HR_DISCIPLINE',
          name: 'Quy trình Xử lý Kỷ luật & Sa thải Lao động',
          category: 'Nhân sự & Lao động',
          description: 'Thẩm định tuân thủ Bộ luật Lao động 2019',
          boundLegalFields: ['Bộ luật Lao động 2019', 'Nghị định 145/2020/NĐ-CP'],
          systemPrompt: 'Bạn là Trợ lý Pháp lý Lao động.',
          complianceChecklist: [
            { id: 'check_hr_1', title: 'Hành vi vi phạm thuộc trường hợp bị xử lý kỷ luật sa thải', legalCitation: 'Điều 125 Bộ luật Lao động 2019', isMandatory: true },
            { id: 'check_hr_2', title: 'Thời hiệu xử lý kỷ luật còn hiệu lực (tối đa 06 tháng)', legalCitation: 'Điều 123 Bộ luật Lao động 2019', isMandatory: true },
            { id: 'check_hr_3', title: 'Có sự tham gia của Tổ chức đại diện người lao động tại cơ sở (Công đoàn)', legalCitation: 'Khoản 1 Điều 122 Bộ luật Lao động 2019', isMandatory: true },
          ],
          steps: [
            { step: 1, name: 'Lập Biên bản Vi phạm Kỷ luật', role: 'HR_OFFICER' },
            { step: 2, name: 'Gửi Thông báo Mời họp Kỷ luật trước 05 ngày', role: 'HR_MANAGER' },
            { step: 3, name: 'Tổ chức Cuộc họp Kỷ luật Lao động', role: 'LEGAL' },
            { step: 4, name: 'Ban hành Quyết định Sa thải & Trả sổ BHXH', role: 'DIRECTOR' },
          ],
        },
      });
    }
    setLoading(false);
  }, [executionId]);

  useEffect(() => { load(); }, [load]);

  const handleEvaluate = async () => {
    setEvaluating(true);
    try {
      const updated = await apiClient.evaluateWorkflowChecklist(executionId, stepNotes || 'Kiểm tra hồ sơ hợp lệ');
      setExecution(updated);
    } catch { /* ignore */ }
    setEvaluating(false);
  };

  const handleAdvance = async () => {
    setAdvancing(true);
    try {
      const updated = await apiClient.advanceWorkflowExecution(executionId, stepNotes);
      setExecution(updated);
      setStepNotes('');
    } catch { /* ignore */ }
    setAdvancing(false);
  };

  const handleSendQuery = async () => {
    if (!chatQuery.trim() || chatLoading) return;
    const q = chatQuery.trim();
    setChatQuery('');
    setChatMessages((prev) => [...prev, { role: 'user', text: q }]);
    setChatLoading(true);

    try {
      const res = await apiClient.askWorkflowCopilot(executionId, q);
      setChatMessages((prev) => [...prev, { role: 'assistant', text: res.answer, citations: res.citations }]);
    } catch {
      setChatMessages((prev) => [
        ...prev,
        { role: 'assistant', text: 'Xin lỗi, không thể kết nối hệ thống AI Legal Copilot lúc này.' },
      ]);
    }
    setChatLoading(false);
  };

  if (loading || !execution) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500 text-sm">Đang tải chi tiết vụ việc...</div>;
  }

  const config = execution.workflowConfig;
  const steps = config.steps || [];
  const checklist = config.complianceChecklist || [];
  const results = execution.checklistResults || {};

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/20 to-indigo-50/20">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Link href="/quy-trinh" className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">{config.category}</span>
              <span className="text-xs text-slate-400 font-mono">{config.code}</span>
            </div>
            <h1 className="text-lg font-bold text-slate-900">{execution.title}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={load} className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition">
            <RefreshCw className="w-4 h-4" />
          </button>
          {execution.status !== 'COMPLETED' && (
            <button
              onClick={handleAdvance}
              disabled={advancing}
              className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-xs font-bold rounded-xl shadow-md transition"
            >
              <Send className="w-3.5 h-3.5" />
              {advancing ? 'Đang chuyển...' : `Chuyển sang Bước ${execution.currentStep + 1}`}
            </button>
          )}
        </div>
      </header>

      {/* Main Content Grid */}
      <div className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left 2 Columns: Steps & Dynamic Compliance Checklist */}
        <div className="lg:col-span-2 space-y-6">

          {/* Workflow Steps Visualizer */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" /> Tiến trình Thực thi Quy trình ({execution.currentStep}/{steps.length})
            </h2>

            <div className="grid grid-cols-4 gap-2">
              {steps.map((s) => {
                const isCompleted = s.step < execution.currentStep || execution.status === 'COMPLETED';
                const isCurrent = s.step === execution.currentStep && execution.status !== 'COMPLETED';
                return (
                  <div
                    key={s.step}
                    className={`p-3 rounded-xl border text-xs space-y-1 transition ${
                      isCompleted
                        ? 'bg-green-50 border-green-200 text-green-800'
                        : isCurrent
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-900 shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold">Bước {s.step}</span>
                      {isCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />}
                      {isCurrent && <Clock className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />}
                    </div>
                    <p className="font-semibold line-clamp-1">{s.name}</p>
                    <p className="text-[10px] font-mono opacity-75">{s.role}</p>
                  </div>
                );
              })}
            </div>

            {/* Note input & AI Evaluate Button */}
            {execution.status !== 'COMPLETED' && (
              <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                <input
                  type="text"
                  value={stepNotes}
                  onChange={(e) => setStepNotes(e.target.value)}
                  placeholder="Nhập thông tin / ghi chú hồ sơ cho bước hiện tại..."
                  className="flex-1 text-xs border border-slate-200 rounded-xl px-3.5 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
                <button
                  onClick={handleEvaluate}
                  disabled={evaluating}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white text-xs font-semibold rounded-xl shadow-sm transition flex items-center gap-1.5 whitespace-nowrap"
                >
                  <BrainCircuit className="w-3.5 h-3.5" />
                  {evaluating ? 'Đang quét...' : 'AI Quét Checklist'}
                </button>
              </div>
            )}
          </div>

          {/* Dynamic Compliance Checklist Panel */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-purple-600" /> Bảng Compliance Checklist Tuân thủ Pháp lý
                </h2>
                <p className="text-xs text-slate-500">Tự động kiểm tra tiêu chí theo cấu hình động từ Admin</p>
              </div>
              <span className="text-xs bg-purple-50 text-purple-700 font-semibold px-3 py-1 rounded-full border border-purple-200">
                {checklist.length} Tiêu chí
              </span>
            </div>

            <div className="space-y-3">
              {checklist.map((item) => {
                const res = results[item.id] || { status: 'PENDING', notes: 'Chưa đánh giá' };
                const style = CHECKLIST_STATUS_STYLES[res.status] || CHECKLIST_STATUS_STYLES.PENDING;

                return (
                  <div key={item.id} className={`p-4 rounded-xl border ${style.border} ${style.bg} space-y-2 transition`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        {style.icon}
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-slate-900 text-sm">{item.title}</h3>
                            {item.isMandatory && (
                              <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold">Bắt buộc</span>
                            )}
                          </div>
                          <p className="text-xs font-medium text-slate-500 mt-0.5 flex items-start gap-1.5"><ScrollText className="w-3 h-3 shrink-0 mt-0.5" aria-hidden="true" /> Căn cứ: {item.legalCitation}</p>
                        </div>
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-bold whitespace-nowrap ${style.text} bg-white shadow-xs`}>
                        {style.label}
                      </span>
                    </div>

                    {res.notes && (
                      <p className="text-xs text-slate-600 bg-white/80 p-2.5 rounded-lg border border-slate-100">
                        {res.notes}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right Column: Embedded AI Legal Copilot Chat */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[calc(100vh-120px)] sticky top-20">
          {/* Header */}
          <div className="p-4 border-b border-slate-100 flex items-center gap-2 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-t-2xl">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <div>
              <h3 className="text-xs font-bold text-slate-900">AI Legal Copilot</h3>
              <p className="text-[10px] text-slate-500">Đã gắn tri thức: {config.boundLegalFields?.slice(0, 2).join(', ')}</p>
            </div>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 min-h-0 text-xs">
            {chatMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-xl p-3 ${
                  msg.role === 'user' ? 'bg-indigo-600 text-white font-medium' : 'bg-slate-50 border border-slate-200 text-slate-800'
                }`}>
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                  {Boolean(msg.citations && msg.citations.length > 0) && (
                    <div className="mt-2 pt-2 border-t border-slate-200/60 space-y-1">
                      <p className="text-[10px] font-bold text-purple-700 flex items-center gap-1">
                        <BookOpen className="w-3 h-3" /> Căn cứ dẫn chiếu:
                      </p>
                      {msg.citations!.map((c: any, ci: number) => (
                        <p key={ci} className="text-[10px] text-slate-500 line-clamp-1 flex items-center gap-1"><Check className="w-2.5 h-2.5 shrink-0" aria-hidden="true" /> {c.title}</p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Chat Input */}
          <div className="p-3 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={chatQuery}
                onChange={(e) => setChatQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendQuery()}
                placeholder="Hỏi AI Copilot về quy định pháp luật vụ việc..."
                className="flex-1 text-xs border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-300"
              />
              <button
                onClick={handleSendQuery}
                disabled={chatLoading || !chatQuery.trim()}
                className="p-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl transition shadow-sm"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
