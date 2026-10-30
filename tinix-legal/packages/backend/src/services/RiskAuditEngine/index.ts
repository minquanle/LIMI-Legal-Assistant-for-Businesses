/**
 * RiskAuditEngine - Hệ thống chấm điểm rủi ro hợp đồng
 */
import { prisma } from '../../infrastructure/db.js';
import { auditQueue } from './queue.js';

export class RiskAuditEngine {
  /**
   * Tạo một yêu cầu Audit mới
   * @param contractId Hợp đồng cần audit
   */
  async requestAudit(contractId?: string, draftId?: string, text: string = '') {
    const audit = await prisma.contractRiskAudit.create({
      data: {
        contractId,
        draftId,
        status: 'PENDING',
      }
    });
    
    // Đẩy vào Queue xử lý bất đồng bộ. When Redis is unreachable, ioredis
    // buffers the command in memory rather than rejecting immediately, which
    // would otherwise hang this request indefinitely — race it against a
    // short timeout so the caller gets a clear failure instead.
    try {
      await Promise.race([
        auditQueue.add('auditJob', { auditId: audit.id, text }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Redis queue timeout')), 3000)),
      ]);
    } catch (err) {
      await prisma.contractRiskAudit.update({
        where: { id: audit.id },
        data: { status: 'FAILED' },
      });
      throw new Error('Dịch vụ thẩm định rủi ro tạm thời không khả dụng, vui lòng thử lại sau.');
    }

    console.log(`Audit request enqueued: ${audit.id}`);
    return audit;
  }
}
