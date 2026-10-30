import { prisma } from '../infrastructure/db.js';
import { CopilotLLMService } from './copilot-llm-service.js';

interface PlaybookClause {
  name: string;
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  mustHave: string;
  preferred: string;
  walkAway: string;
}

function riskScoreToLevel(score: number): 'HIGH' | 'MEDIUM' | 'LOW' {
  if (score >= 25) return 'HIGH';
  if (score >= 10) return 'MEDIUM';
  return 'LOW';
}

/** Heuristic playbook built directly from the audit's own findings, used when the LLM is unavailable. */
function buildFallbackClauses(auditReport: any[]): PlaybookClause[] {
  if (!Array.isArray(auditReport) || auditReport.length === 0) {
    return [
      {
        name: 'Điều khoản thanh toán và phạt chậm trả',
        riskLevel: 'MEDIUM',
        mustHave: 'Mức phạt vi phạm không vượt trần 8% giá trị nghĩa vụ bị vi phạm theo Luật Thương mại 2005.',
        preferred: 'Miễn phạt nếu chậm trễ do nguyên nhân khách quan, bất khả kháng.',
        walkAway: 'Từ chối nếu đối tác yêu cầu mức phạt vượt trần luật định hoặc bồi thường không giới hạn.',
      },
    ];
  }
  return auditReport.slice(0, 8).map((item: any) => ({
    name: item.clause || item.ruleCode || 'Điều khoản cần đàm phán',
    riskLevel: riskScoreToLevel(Number(item.score) || 0),
    mustHave: item.description || item.issue || 'Sửa đổi điều khoản để phù hợp quy định pháp luật hiện hành.',
    preferred: 'Đàm phán để cân bằng quyền và nghĩa vụ giữa hai bên, giảm rủi ro pháp lý.',
    walkAway: 'Từ chối ký nếu đối tác không chấp nhận sửa đổi điều khoản rủi ro này.',
  }));
}

export class PlaybookGeneratorService {
  static async generatePlaybook(auditId: string) {
    const audit = await prisma.contractRiskAudit.findUnique({
      where: { id: auditId },
      include: { contract: true },
    });

    if (!audit) throw new Error('Audit not found');

    const auditReport = Array.isArray(audit.auditReport) ? (audit.auditReport as any[]) : [];
    let clauses: PlaybookClause[];

    try {
      const contractLabel = audit.contract?.title || 'hợp đồng đang thẩm định';
      const findingsText = auditReport.length > 0
        ? auditReport
            .map((f: any, i: number) => `${i + 1}. [${f.ruleCode || f.clause || 'N/A'}] (điểm rủi ro ${f.score ?? '?'}) ${f.description || f.issue || ''}`)
            .join('\n')
        : 'Không có phát hiện rủi ro cụ thể — hãy đưa ra các điều khoản đàm phán tiêu chuẩn thường gặp trong hợp đồng thương mại tại Việt Nam.';

      const prompt = `Bạn là luật sư đàm phán hợp đồng thương mại tại Việt Nam. Dựa trên các rủi ro đã phát hiện khi thẩm định "${contractLabel}", hãy soạn một Sổ Tay Đàm Phán (Negotiation Playbook).

CÁC RỦI RO ĐÃ PHÁT HIỆN:
${findingsText}

Với mỗi điều khoản rủi ro, đưa ra chính xác 3 mức lập trường đàm phán: mustHave (điều kiện bắt buộc phải đạt được, dựa trên quy định pháp luật), preferred (phương án ưu tiên nếu đàm phán được), walkAway (giới hạn từ chối ký nếu đối tác không nhượng bộ).

Trả về CHỈ MỘT JSON ARRAY, không kèm giải thích, đúng định dạng:
[{"name": "Tên điều khoản", "riskLevel": "HIGH|MEDIUM|LOW", "mustHave": "...", "preferred": "...", "walkAway": "..."}]`;

      const response = await CopilotLLMService.complete({ prompt, mode: 'risk_check' });
      const raw = response.completion || '';
      const jsonMatch = raw.match(/\[[\s\S]*\]/);
      const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

      clauses = Array.isArray(parsed) && parsed.length > 0
        ? parsed.map((c: any) => ({
            name: String(c.name || 'Điều khoản cần đàm phán'),
            riskLevel: (['HIGH', 'MEDIUM', 'LOW'].includes(c.riskLevel) ? c.riskLevel : 'MEDIUM') as PlaybookClause['riskLevel'],
            mustHave: String(c.mustHave || ''),
            preferred: String(c.preferred || ''),
            walkAway: String(c.walkAway || ''),
          }))
        : buildFallbackClauses(auditReport);
    } catch (err) {
      console.error('[PlaybookGeneratorService] LLM playbook generation failed, using fallback:', err);
      clauses = buildFallbackClauses(auditReport);
    }

    const playbookData = { clauses };

    const updated = await prisma.contractRiskAudit.update({
      where: { id: auditId },
      data: { playbookData: playbookData as any },
    });

    return updated;
  }
}
