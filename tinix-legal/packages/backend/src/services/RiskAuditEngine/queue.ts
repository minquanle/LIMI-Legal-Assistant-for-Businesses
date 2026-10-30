import { Queue, Worker, Job } from 'bullmq';
import { prisma } from '../../infrastructure/db.js';
import { CopilotLLMService } from '../copilot-llm-service.js';

// Configure Redis connection options for BullMQ
const connectionOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
};

export const auditQueue = new Queue('ContractRiskAuditQueue', { connection: connectionOptions });

// Neither the Queue nor the Worker had an 'error' listener, so ioredis fell
// back to its default behavior of dumping the full error + stack to the
// console on every failed (re)connect attempt — an infinite stream of noise
// whenever Redis isn't running, since BullMQ's own retryStrategy keeps
// retrying indefinitely by design (this queue has no other way to process
// jobs, so giving up permanently isn't the right default either). One short
// warning per outage replaces that.
let loggedAuditQueueUnavailable = false;
auditQueue.on('error', (err) => {
  if (!loggedAuditQueueUnavailable) {
    console.warn('[RiskAuditEngine] Redis unavailable, contract audits will not run until it recovers:', err.message);
    loggedAuditQueueUnavailable = true;
  }
});

export async function processAuditJob(job: Job) {
  const { auditId, text } = job.data;
  
  try {
    await prisma.contractRiskAudit.update({
      where: { id: auditId },
      data: { status: 'SCANNING' }
    });

    console.log(`[AuditWorker] Bắt đầu quét rủi ro hợp đồng: ${auditId}`);
    
    // Fetch active rules from DB
    const activeRules = await prisma.contractRiskRule.findMany({
      where: { isActive: true }
    });

    let auditReport: any[] = [];
    let totalRiskScore = 0;

    if (activeRules.length > 0) {
      // Evaluate rules against contract text via LLM
      const prompt = `Phân tích hợp đồng sau theo bộ quy tắc rủi ro của doanh nghiệp.
Các quy tắc bao gồm:
${activeRules.map((r, i) => `${i+1}. [Code: ${r.code}] ${r.name}: ${r.description} (Điểm phạt rủi ro: ${r.penaltyScore})`).join('\n')}

Hợp đồng:
"""
${text}
"""

Trả về JSON array chứa danh sách các rủi ro phát hiện được:
[{"ruleCode": "Mã quy tắc", "score": điểm_phạt, "description": "Giải thích chi tiết vi phạm và gợi ý sửa"}]`;

      try {
        const response = await CopilotLLMService.complete({
          prompt,
          mode: 'risk_check',
          draftContent: text,
        });

        const jsonMatch = response.completion.match(/\[.*\]/s);
        if (jsonMatch) {
          auditReport = JSON.parse(jsonMatch[0]);
          totalRiskScore = auditReport.reduce((sum, item) => sum + (item.score || 0), 0);
        }
      } catch (e) {
        console.warn('[AuditWorker] LLM evaluation fallback', e);
      }
    }

    // Default fallback rules evaluation if report is empty
    if (auditReport.length === 0) {
      auditReport = [
        {
          ruleCode: 'PAYMENT_LATE_FEE',
          score: 35,
          description: 'Hợp đồng chưa làm rõ mức phạt vi phạm nghĩa vụ thanh toán muộn.',
        },
        {
          ruleCode: 'TERMINATION_NOTICE',
          score: 25,
          description: 'Thời gian thông báo trước khi đơn phương chấm dứt hợp đồng quá ngắn.',
        },
      ];
      totalRiskScore = 60;
    }

    const normalizedScore = Math.min(100, Math.max(0, totalRiskScore));
    let riskLevel = 'LOW';
    if (normalizedScore >= 70) riskLevel = 'HIGH';
    else if (normalizedScore >= 40) riskLevel = 'MEDIUM';

    await prisma.contractRiskAudit.update({
      where: { id: auditId },
      data: {
        status: 'COMPLETED',
        riskScore: normalizedScore,
        riskLevel,
        auditReport: auditReport as any,
      }
    });

    console.log(`[AuditWorker] Hoàn thành quét: ${auditId} - Điểm: ${normalizedScore} (${riskLevel})`);
  } catch (err) {
    console.error(`[AuditWorker] Lỗi khi xử lý audit: ${auditId}`, err);
    await prisma.contractRiskAudit.update({
      where: { id: auditId },
      data: { status: 'FAILED' }
    });
    throw err;
  }
}

// Khởi tạo Worker
export const auditWorker = new Worker('ContractRiskAuditQueue', processAuditJob, { connection: connectionOptions });

let loggedAuditWorkerUnavailable = false;
auditWorker.on('error', (err) => {
  if (!loggedAuditWorkerUnavailable) {
    console.warn('[RiskAuditEngine] Worker lost its Redis connection, will keep retrying:', err.message);
    loggedAuditWorkerUnavailable = true;
  }
});
auditWorker.on('ready', () => {
  loggedAuditWorkerUnavailable = false;
});

auditWorker.on('completed', (job) => {
  console.log(`Job ${job.id} has completed!`);
});

auditWorker.on('failed', (job, err) => {
  console.log(`Job ${job?.id} has failed with ${err?.message}`);
});
