export interface ContractRiskItem {
  id: string;
  level: 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  category: string;
  description: string;
  legalCitation: string;
  originalText: string;
  suggestedText: string;
}

export class ContractAuditService {
  /**
   * Audits contract text for legal risks, statutory violations, and generates Redline fixes.
   */
  static auditContract(content: string): ContractRiskItem[] {
    if (!content || !content.trim()) return [];

    const risks: ContractRiskItem[] = [];
    const plainText = content.replace(/<[^>]*>/g, ' ');

    // 1. Check Penalty percentage > 8% (Điều 301 Luật Thương mại 2005)
    const penaltyRegex = /\b(phạt\s+(?:vi\s+phạm\s+)?(\d{1,2})\s*%)/gi;
    let match: RegExpExecArray | null;

    while ((match = penaltyRegex.exec(plainText)) !== null) {
      const fullMatch = match[1];
      const percent = parseInt(match[2], 10);
      if (percent > 8) {
        risks.push({
          id: `risk-penalty-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          level: 'HIGH',
          title: `Mức phạt vi phạm ${percent}% vượt quá giới hạn 8% luật định`,
          category: 'Thương mại & Hợp đồng',
          description: `Theo Điều 301 Luật Thương mại 2005, mức phạt vi phạm nghĩa vụ hợp đồng thương mại do các bên thỏa thuận nhưng không quá 8% giá trị phần nghĩa vụ hợp đồng bị vi phạm.`,
          legalCitation: 'Luật Thương mại 36/2005/QH11 (Điều 301)',
          originalText: fullMatch,
          suggestedText: `phạt vi phạm 8% (theo đúng Điều 301 Luật Thương mại 2005)`,
        });
      }
    }

    // 2. Check Probation duration > 60 days (Điều 25 Bộ luật Lao động 2019)
    const probationRegex = /\b(thử\s+việc\s+(?:là\s+)?(\d{2,3})\s*ngày|thử\s+việc\s+(\d{1,2})\s*tháng)\b/gi;
    while ((match = probationRegex.exec(plainText)) !== null) {
      const fullMatch = match[1];
      let days = 0;
      if (match[2]) days = parseInt(match[2], 10);
      if (match[3]) days = parseInt(match[3], 10) * 30;

      if (days > 60) {
        risks.push({
          id: `risk-probation-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          level: 'HIGH',
          title: `Thời gian thử việc ${days} ngày vượt quá giới hạn 60 ngày`,
          category: 'Nhân sự & Lao động',
          description: `Theo Điều 25 Bộ luật Lao động 2019, thời gian thử việc đối với chức danh trình độ cao đẳng trở lên không quá 60 ngày.`,
          legalCitation: 'Bộ luật Lao động 45/2019/QH14 (Điều 25)',
          originalText: fullMatch,
          suggestedText: `thử việc 60 ngày (theo đúng Điều 25 Bộ luật Lao động 2019)`,
        });
      }
    }

    // 3. Check Unilateral termination without 30 days notice
    if (/đơn\s+phương\s+chấm\s+dứt/i.test(plainText) && !/30\s*ngày/i.test(plainText)) {
      risks.push({
        id: `risk-unilateral-${Date.now()}`,
        level: 'MEDIUM',
        title: 'Điều khoản đơn phương chấm dứt thiếu quy định báo trước 30 ngày',
        category: 'Pháp lý Doanh nghiệp',
        description: 'Quyền đơn phương chấm dứt hợp đồng nên đi kèm thời hạn thông báo trước tối thiểu 30 ngày để giảm rủi ro tranh chấp.',
        legalCitation: 'Bộ luật Dân sự 91/2015/QH13 (Điều 428)',
        originalText: 'đơn phương chấm dứt',
        suggestedText: 'đơn phương chấm dứt Hợp đồng khi thông báo bằng văn bản trước ít nhất 30 ngày',
      });
    }

    // 4. Check Disclaimer of all liability
    if (/miễn\s+trừ\s+(?:toàn\s+bộ\s+)?trách\s+nhiệm/i.test(plainText)) {
      risks.push({
        id: `risk-disclaimer-${Date.now()}`,
        level: 'MEDIUM',
        title: 'Điều khoản miễn trừ trách nhiệm toàn bộ có rủi ro bị tuyên vô hiệu',
        category: 'Thương mại & Hợp đồng',
        description: 'Thỏa thuận miễn trừ trách nhiệm trước đối với thiệt hại do lỗi cố ý sẽ bị vô hiệu theo quy định pháp luật dân sự.',
        legalCitation: 'Bộ luật Dân sự 91/2015/QH13 (Điều 360, 361)',
        originalText: 'miễn trừ trách nhiệm',
        suggestedText: 'miễn trừ trách nhiệm trong trường hợp Sự kiện Bất khả kháng theo đúng quy định pháp luật',
      });
    }

    return risks;
  }
}
