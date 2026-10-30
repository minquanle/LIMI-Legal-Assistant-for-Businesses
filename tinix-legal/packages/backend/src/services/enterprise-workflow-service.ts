/**
 * EnterpriseWorkflowService
 * Quản lý luồng trình ký phê duyệt văn bản đa cấp dựa trên cấu hình động từ EnterpriseConfig.
 * Lưu lịch sử chuyển bước qua ApprovalHistory.
 */
import { prisma } from '../infrastructure/db.js';

export interface WorkflowStep {
  step: number;
  name: string;
  role: string;
  requireSignature: boolean;
}

const DEFAULT_WORKFLOW_STEPS: WorkflowStep[] = [
  { step: 1, name: 'Chuyên viên soạn thảo', role: 'EDITOR', requireSignature: false },
  { step: 2, name: 'Trưởng phòng duyệt', role: 'MANAGER', requireSignature: false },
  { step: 3, name: 'Pháp chế thẩm định', role: 'LEGAL', requireSignature: false },
  { step: 4, name: 'Ban Giám đốc phê duyệt', role: 'DIRECTOR', requireSignature: true },
];

const STATUS_SEQUENCE = ['DRAFT', 'IN_REVIEW', 'LEGAL_CHECK', 'APPROVED'];

export class EnterpriseWorkflowService {
  /** Lấy cấu hình quy trình duyệt mặc định */
  static async getDefaultConfig() {
    let config = await prisma.enterpriseConfig.findFirst({ where: { isDefault: true } });
    if (!config) {
      // Tự động tạo nếu chưa có
      config = await prisma.enterpriseConfig.create({
        data: {
          orgName: 'Doanh nghiệp mặc định',
          workflowSteps: DEFAULT_WORKFLOW_STEPS as unknown as Parameters<typeof prisma.enterpriseConfig.create>[0]['data']['workflowSteps'],
          alertThresholds: [30, 15, 7],
          riskRules: { maxPenaltyPercent: 8, maxProbationDays: 60, maxPaymentDelay: 45 },
          isDefault: true,
        },
      });
    }
    return config;
  }

  /** Lấy bước trình ký tiếp theo từ config */
  static async getNextStatus(currentStatus: string): Promise<string | null> {
    const idx = STATUS_SEQUENCE.indexOf(currentStatus);
    if (idx === -1 || idx >= STATUS_SEQUENCE.length - 1) return null;
    return STATUS_SEQUENCE[idx + 1];
  }

  /** Chuyển trạng thái dự thảo sang bước tiếp theo */
  static async advanceDraft(params: {
    draftId: string;
    actorName: string;
    actorRole: string;
    comment?: string;
  }) {
    const draft = await prisma.draftDocument.findUniqueOrThrow({ where: { id: params.draftId } });
    const nextStatus = await this.getNextStatus(draft.status);
    if (!nextStatus) {
      throw new Error(`Dự thảo đã ở trạng thái cuối cùng: ${draft.status}`);
    }

    const config = await this.getDefaultConfig();
    const steps = config.workflowSteps as unknown as WorkflowStep[];
    const nextIdx = STATUS_SEQUENCE.indexOf(nextStatus);
    const stepInfo = steps[nextIdx - 1] ?? { name: nextStatus, role: params.actorRole };

    if (stepInfo.role && params.actorRole !== stepInfo.role) {
      throw new Error(
        `Bước "${stepInfo.name}" yêu cầu vai trò [${stepInfo.role}], nhưng người thực hiện có vai trò [${params.actorRole}].`
      );
    }

    // Ghi lịch sử chuyển bước
    await prisma.approvalHistory.create({
      data: {
        draftId: params.draftId,
        fromStatus: draft.status,
        toStatus: nextStatus,
        stepName: stepInfo.name,
        actorName: params.actorName,
        actorRole: params.actorRole,
        comment: params.comment ?? '',
      },
    });

    // Cập nhật trạng thái dự thảo
    const updated = await prisma.draftDocument.update({
      where: { id: params.draftId },
      data: { status: nextStatus },
    });

    return updated;
  }

  /** Từ chối/Trả lại dự thảo */
  static async rejectDraft(params: {
    draftId: string;
    actorName: string;
    actorRole: string;
    comment: string;
  }) {
    const draft = await prisma.draftDocument.findUniqueOrThrow({ where: { id: params.draftId } });

    if (draft.status === 'APPROVED' || draft.status === 'REJECTED') {
      throw new Error(`Dự thảo đã ở trạng thái cuối cùng (${draft.status}), không thể từ chối lại.`);
    }

    await prisma.approvalHistory.create({
      data: {
        draftId: params.draftId,
        fromStatus: draft.status,
        toStatus: 'REJECTED',
        stepName: 'Từ chối duyệt',
        actorName: params.actorName,
        actorRole: params.actorRole,
        comment: params.comment,
      },
    });

    return prisma.draftDocument.update({
      where: { id: params.draftId },
      data: { status: 'REJECTED' },
    });
  }

  /** Lấy lịch sử duyệt của một dự thảo */
  static async getApprovalHistory(draftId: string) {
    return prisma.approvalHistory.findMany({
      where: { draftId },
      orderBy: { createdAt: 'asc' },
    });
  }

  /** Lấy tiến trình duyệt kèm config bước */
  static async getWorkflowProgress(draftId: string) {
    const draft = await prisma.draftDocument.findUniqueOrThrow({ where: { id: draftId } });
    const config = await this.getDefaultConfig();
    const steps = config.workflowSteps as unknown as WorkflowStep[];
    const history = await this.getApprovalHistory(draftId);
    const currentIdx = STATUS_SEQUENCE.indexOf(draft.status);

    return {
      draftId,
      currentStatus: draft.status,
      steps: steps.map((s, i) => ({
        ...s,
        status:
          i < currentIdx ? 'completed' : i === currentIdx ? 'current' : 'pending',
        completedAt: history.find((h) => STATUS_SEQUENCE[i + 1] === h.toStatus)?.createdAt ?? null,
      })),
      history,
    };
  }
}
