/**
 * ContractLifecycleService
 * Quản lý danh mục Hợp đồng, tính toán mốc cảnh báo hạn (real-time) và đề xuất hành động.
 */
import { ContractStatus } from '@prisma/client';
import { prisma } from '../infrastructure/db.js';
import { EnterpriseWorkflowService } from './enterprise-workflow-service.js';

export interface ContractWithAlert {
  id: string;
  contractNumber: string;
  title: string;
  partnerName: string;
  contractValue: number | null;
  startDate: Date | null;
  endDate: Date | null;
  status: ContractStatus;
  daysUntilExpiry: number | null;
  alertLevel: 'NONE' | 'WARNING' | 'URGENT' | 'EXPIRED';
  suggestedAction: string | null;
  paymentMilestones: unknown;
}

export class ContractLifecycleService {
  /** Tính toán trạng thái cảnh báo dựa trên ngày hết hạn và ngưỡng config */
  static computeAlertLevel(
    endDate: Date | null,
    alertThresholds: number[],
  ): { alertLevel: ContractWithAlert['alertLevel']; daysUntilExpiry: number | null; suggestedAction: string | null } {
    if (!endDate) return { alertLevel: 'NONE', daysUntilExpiry: null, suggestedAction: null };
    const now = new Date();
    const diffMs = endDate.getTime() - now.getTime();
    const daysUntilExpiry = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry < 0) {
      return { alertLevel: 'EXPIRED', daysUntilExpiry, suggestedAction: 'Hợp đồng đã quá hạn - Thanh lý hoặc gia hạn ngay' };
    }

    const sorted = [...alertThresholds].sort((a, b) => b - a);
    const urgentThreshold = sorted[1] ?? 15;
    const warnThreshold = sorted[0] ?? 30;

    if (daysUntilExpiry <= urgentThreshold) {
      return { alertLevel: 'URGENT', daysUntilExpiry, suggestedAction: `Còn ${daysUntilExpiry} ngày - Xử lý ngay để ký gia hạn` };
    }
    if (daysUntilExpiry <= warnThreshold) {
      return { alertLevel: 'WARNING', daysUntilExpiry, suggestedAction: `Còn ${daysUntilExpiry} ngày - Đề xuất đàm phán gia hạn` };
    }
    return { alertLevel: 'NONE', daysUntilExpiry, suggestedAction: null };
  }

  /** Lấy toàn bộ danh mục hợp đồng kèm thông tin cảnh báo */
  static async getAllContracts(): Promise<ContractWithAlert[]> {
    const config = await EnterpriseWorkflowService.getDefaultConfig();
    const thresholds = config.alertThresholds as unknown as number[];

    const contracts = await prisma.contractMaster.findMany({
      where: { status: { not: 'TERMINATED' } },
      orderBy: { endDate: 'asc' },
    });

    return contracts.map((c) => {
      const { alertLevel, daysUntilExpiry, suggestedAction } = this.computeAlertLevel(c.endDate, thresholds);
      return {
        id: c.id,
        contractNumber: c.contractNumber,
        title: c.title,
        partnerName: c.partnerName,
        contractValue: c.contractValue,
        startDate: c.startDate,
        endDate: c.endDate,
        status: alertLevel === 'EXPIRED' ? ContractStatus.EXPIRED :
                alertLevel !== 'NONE' ? ContractStatus.EXPIRING_SOON : c.status,
        daysUntilExpiry,
        alertLevel,
        suggestedAction,
        paymentMilestones: c.paymentMilestones,
      };
    });
  }

  /** Tạo mới hợp đồng */
  static async createContract(data: {
    title: string;
    contractNumber?: string;
    partnerName?: string;
    contractValue?: number;
    startDate?: string;
    endDate?: string;
    paymentMilestones?: unknown[];
    notes?: string;
    draftId?: string;
  }) {
    return prisma.contractMaster.create({
      data: {
        title: data.title,
        contractNumber: data.contractNumber ?? '',
        partnerName: data.partnerName ?? '',
        contractValue: data.contractValue ?? null,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        paymentMilestones: (data.paymentMilestones ?? []) as Parameters<typeof prisma.contractMaster.create>[0]['data']['paymentMilestones'],
        notes: data.notes ?? '',
        draftId: data.draftId ?? null,
        status: 'ACTIVE',
      },
    });
  }

  /** Cập nhật hợp đồng */
  static async updateContract(id: string, data: Partial<{
    title: string;
    partnerName: string;
    contractValue: number;
    endDate: string;
    paymentMilestones: unknown[];
    notes: string;
    status: ContractStatus;
  }>) {
    return prisma.contractMaster.update({
      where: { id },
      data: {
        ...data,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        paymentMilestones: data.paymentMilestones as Parameters<typeof prisma.contractMaster.update>[0]['data']['paymentMilestones'],
      },
    });
  }

  /** Thống kê nhanh */
  static async getSummary() {
    const all = await this.getAllContracts();
    return {
      total: all.length,
      active: all.filter((c) => c.alertLevel === 'NONE').length,
      expiringSoon: all.filter((c) => c.alertLevel === 'WARNING').length,
      urgent: all.filter((c) => c.alertLevel === 'URGENT').length,
      expired: all.filter((c) => c.alertLevel === 'EXPIRED').length,
      alerts: all.filter((c) => c.alertLevel !== 'NONE'),
    };
  }
}
