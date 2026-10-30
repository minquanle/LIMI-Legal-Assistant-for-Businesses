'use client';

import { useState } from 'react';
import {
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  MessageSquare,
  PenLine,
  Send,
  XCircle,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface WorkflowStep {
  step: number;
  name: string;
  role: string;
  requireSignature: boolean;
  status: 'completed' | 'current' | 'pending';
  completedAt: string | null;
}

interface ApprovalTimelineProps {
  draftId: string;
  currentStatus: string;
  steps: WorkflowStep[];
  onStatusChange?: (newStatus: string) => void;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  DRAFT: { label: 'Bản nháp', color: 'bg-slate-100 text-slate-600' },
  IN_REVIEW: { label: 'Đang trình duyệt', color: 'bg-blue-100 text-blue-700' },
  LEGAL_CHECK: { label: 'Pháp chế thẩm định', color: 'bg-purple-100 text-purple-700' },
  APPROVED: { label: 'Đã phê duyệt', color: 'bg-green-100 text-green-700' },
  REJECTED: { label: 'Bị từ chối', color: 'bg-red-100 text-red-700' },
};

export function ApprovalTimeline({ draftId, currentStatus, steps, onStatusChange }: ApprovalTimelineProps) {
  const [comment, setComment] = useState('');
  const [advancing, setAdvancing] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [rejectComment, setRejectComment] = useState('');

  const statusInfo = STATUS_LABELS[currentStatus] ?? { label: currentStatus, color: 'bg-slate-100 text-slate-600' };
  const canAdvance = currentStatus !== 'APPROVED' && currentStatus !== 'REJECTED';
  const isApproved = currentStatus === 'APPROVED';
  const isRejected = currentStatus === 'REJECTED';
  // The backend now requires the actor's role to match the step being
  // completed (see EnterpriseWorkflowService.advanceDraft) — the current step
  // in the config tells us which role that is. There is no real per-user
  // identity system yet, so this is still an honor-system role, not enforced
  // authentication; it just has to match what the workflow config expects.
  const currentStep = steps.find((s) => s.status === 'current');
  const requiredRole = currentStep?.role || 'USER';

  const handleAdvance = async () => {
    setAdvancing(true);
    try {
      const updated = await apiClient.advanceDraft(draftId, {
        actorName: 'Người dùng hiện tại',
        actorRole: requiredRole,
        comment,
      });
      setComment('');
      onStatusChange?.(updated.status);
    } catch { /* ignore */ }
    setAdvancing(false);
  };

  const handleReject = async () => {
    setRejecting(true);
    try {
      const updated = await apiClient.rejectDraft(draftId, {
        actorName: 'Người dùng hiện tại',
        actorRole: 'USER',
        comment: rejectComment || 'Không đạt yêu cầu',
      });
      setShowReject(false);
      setRejectComment('');
      onStatusChange?.(updated.status);
    } catch { /* ignore */ }
    setRejecting(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-indigo-100 rounded-lg flex items-center justify-center">
            <ChevronRight className="w-4 h-4 text-indigo-600" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">Tiến trình Trình ký</h3>
        </div>
        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${statusInfo.color}`}>
          {statusInfo.label}
        </span>
      </div>

      {/* Steps Timeline */}
      <div className="px-4 py-4">
        <div className="relative">
          {/* Connecting line */}
          <div className="absolute left-3.5 top-4 bottom-4 w-0.5 bg-slate-100" />

          <div className="space-y-4">
            {steps.map((step, idx) => (
              <div key={idx} className="flex items-start gap-3 relative">
                {/* Step icon */}
                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 z-10 border-2 transition-all ${
                  step.status === 'completed'
                    ? 'bg-green-500 border-green-500'
                    : step.status === 'current'
                    ? 'bg-indigo-500 border-indigo-500 shadow-md shadow-indigo-200'
                    : 'bg-white border-slate-200'
                }`}>
                  {step.status === 'completed' ? (
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  ) : step.status === 'current' ? (
                    <Clock className="w-3.5 h-3.5 text-white animate-pulse" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-slate-300" />
                  )}
                </div>

                {/* Step info */}
                <div className={`flex-1 pb-1 ${step.status === 'current' ? 'opacity-100' : step.status === 'completed' ? 'opacity-80' : 'opacity-40'}`}>
                  <div className="flex items-center gap-2">
                    <p className={`text-xs font-semibold ${step.status === 'current' ? 'text-indigo-700' : 'text-slate-700'}`}>
                      {step.name}
                    </p>
                    {step.requireSignature && (
                      <span className="text-xs px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded-full border border-yellow-200"><PenLine className="w-3 h-3 inline" aria-hidden="true" />️ Cần ký</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 font-mono">{step.role}</p>
                  {step.completedAt && (
                    <p className="text-xs text-green-600 mt-0.5">
                      <Check className="w-3 h-3 inline" aria-hidden="true" /> {new Date(step.completedAt).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action Section */}
      {!isApproved && !isRejected && (
        <div className="px-4 pb-4 space-y-3 border-t border-slate-50 pt-3">
          {/* Comment input */}
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Ghi chú trình duyệt (tuỳ chọn)..."
              className="flex-1 text-xs border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>

          {/* Advance / Reject buttons */}
          <div className="flex items-center gap-2">
            {canAdvance && (
              <button
                onClick={handleAdvance}
                disabled={advancing}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-xs font-semibold rounded-xl transition shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                {advancing ? 'Đang chuyển...' : 'Trình bước tiếp theo'}
              </button>
            )}
            <button
              onClick={() => setShowReject((v) => !v)}
              className="px-3 py-2 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl border border-red-200 transition font-medium"
            >
              <XCircle className="w-3.5 h-3.5 inline mr-1" />Từ chối
            </button>
          </div>

          {/* Reject form */}
          {showReject && (
            <div className="bg-red-50 rounded-xl border border-red-200 p-3 space-y-2">
              <p className="text-xs font-semibold text-red-700">Lý do từ chối / Yêu cầu chỉnh sửa:</p>
              <textarea
                value={rejectComment}
                onChange={(e) => setRejectComment(e.target.value)}
                rows={2}
                className="w-full text-xs border border-red-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-300 bg-white resize-none"
                placeholder="Nêu rõ lý do để tác giả chỉnh sửa lại..."
              />
              <button
                onClick={handleReject}
                disabled={rejecting}
                className="w-full py-1.5 bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white text-xs font-semibold rounded-lg transition"
              >
                {rejecting ? 'Đang gửi...' : 'Xác nhận Từ chối'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Approved / Rejected final status */}
      {isApproved && (
        <div className="px-4 pb-4 pt-2">
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl p-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
            <div>
              <p className="text-xs font-bold text-green-800">Dự thảo đã được phê duyệt hoàn toàn</p>
              <p className="text-xs text-green-600">Văn bản đủ điều kiện để ban hành chính thức.</p>
            </div>
          </div>
        </div>
      )}
      {isRejected && (
        <div className="px-4 pb-4 pt-2">
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3">
            <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <div>
              <p className="text-xs font-bold text-red-800">Dự thảo bị từ chối</p>
              <p className="text-xs text-red-600">Vui lòng chỉnh sửa và trình lại.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
