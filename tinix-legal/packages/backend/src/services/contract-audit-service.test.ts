import { describe, it, expect } from 'vitest';
import { ContractAuditService } from './contract-audit-service.js';

describe('ContractAuditService', () => {
  it('should detect penalty percentage > 8% and generate redline fix', () => {
    const text = 'Bên vi phạm chịu mức phạt vi phạm 15% giá trị hợp đồng.';
    const risks = ContractAuditService.auditContract(text);

    expect(risks.length).toBeGreaterThan(0);
    const penaltyRisk = risks.find((r) => r.title.includes('15%'));
    expect(penaltyRisk).toBeDefined();
    expect(penaltyRisk?.level).toBe('HIGH');
    expect(penaltyRisk?.legalCitation).toContain('Luật Thương mại');
    expect(penaltyRisk?.suggestedText).toContain('8%');
  });

  it('should detect probation period > 60 days', () => {
    const text = 'Thời gian thử việc là 90 ngày kể từ ngày nhận việc.';
    const risks = ContractAuditService.auditContract(text);

    const probationRisk = risks.find((r) => r.title.includes('90 ngày'));
    expect(probationRisk).toBeDefined();
    expect(probationRisk?.level).toBe('HIGH');
    expect(probationRisk?.legalCitation).toContain('Bộ luật Lao động');
  });
});
