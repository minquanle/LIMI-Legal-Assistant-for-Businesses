import { Router, Request, Response } from 'express';

export const healthcheckRouter = Router();

export interface HealthcheckPillar {
  id: string;
  name: string;
  icon: string;
  weight: number;
  description: string;
  questions: Array<{
    id: string;
    question: string;
    weight: number;
    riskIfNotCompliant: string;
    remediationGuide: string;
    legalBasis: string;
  }>;
}

export const HEALTHCHECK_PILLARS: HealthcheckPillar[] = [
  {
    id: 'CORPORATE_GOVERNANCE',
    name: '1. Pháp lý Doanh nghiệp & Vốn',
    icon: 'building-2',
    weight: 20,
    description: 'Hồ sơ pháp lý, điều lệ, góp vốn điều lệ 90 ngày, đăng ký kinh doanh và quyền của cổ đông/thành viên.',
    questions: [
      {
        id: 'corp_capital_90d',
        question: 'Các thành viên/cổ đông đã góp đủ 100% số vốn điều lệ đã đăng ký trong thời hạn 90 ngày kể từ ngày cấp Giấy ĐKDN?',
        weight: 35,
        riskIfNotCompliant: 'Bị xử phạt vi phạm hành chính từ 30-50 triệu đồng và phải làm thủ tục giảm vốn điều lệ.',
        remediationGuide: 'Rà soát chứng từ chuyển khoản góp vốn vào tài khoản công ty hoặc nộp hồ sơ điều chỉnh giảm vốn điều lệ.',
        legalBasis: 'Điều 47, Điều 75 Luật Doanh nghiệp 2020 & Nghị định 122/2021/NĐ-CP',
      },
      {
        id: 'corp_charter_updated',
        question: 'Điều lệ công ty đã được cập nhật theo Luật Doanh nghiệp 2020 và có đầy đủ chữ ký của các thành viên?',
        weight: 35,
        riskIfNotCompliant: 'Các nghị quyết của HĐTV/ĐHĐCĐ có nguy cơ bị Tòa án tuyên vô hiệu khi phát sinh tranh chấp nội bộ.',
        remediationGuide: 'Ban hành Điều lệ sửa đổi mới nhất và lưu trữ bản gốc có chữ ký tại trụ sở chính.',
        legalBasis: 'Điều 24 Luật Doanh nghiệp 2020',
      },
      {
        id: 'corp_annual_meeting',
        question: 'Công ty có tổ chức Đại hội đồng cổ đông / Họp HĐTV thường niên và lập sổ biên bản họp đầy đủ theo định kỳ?',
        weight: 30,
        riskIfNotCompliant: 'Bị xử phạt hành chính và mất hiệu lực thi hành các quyết định phân phối lợi nhuận.',
        remediationGuide: 'Lập sổ biên bản họp và nghị quyết lưu trữ theo quy chuẩn.',
        legalBasis: 'Điều 139 Luật Doanh nghiệp 2020',
      },
    ],
  },
  {
    id: 'CONTRACTS_COMMERCIAL',
    name: '2. Hợp đồng & Khách hàng',
    icon: 'scroll-text',
    weight: 25,
    description: 'Quy trình kiểm soát hợp đồng kinh tế, điều khoản phạt vi phạm (8%), giải quyết tranh chấp và bất khả kháng.',
    questions: [
      {
        id: 'contract_penalty_cap',
        question: 'Mức phạt vi phạm trong các hợp đồng thương mại của công ty có được khống chế không quá 8% giá trị phần nghĩa vụ bị vi phạm?',
        weight: 40,
        riskIfNotCompliant: 'Điều khoản phạt vượt quá 8% sẽ bị Tòa án tuyên vô hiệu một phần và không được chấp nhận khi khởi kiện.',
        remediationGuide: 'Rà soát lại toàn bộ hợp đồng mẫu, tách biệt rõ giữa "Phạt vi phạm" (tối đa 8%) và "Bồi thường thiệt hại" (100% thiệt hại thực tế).',
        legalBasis: 'Điều 301 Luật Thương mại 2005',
      },
      {
        id: 'contract_authority_audit',
        question: 'Tất cả hợp đồng có giá trị lớn đều do đúng Người đại diện theo pháp luật ký hoặc có Giấy ủy quyền hợp lệ?',
        weight: 35,
        riskIfNotCompliant: 'Hợp đồng do người không có thẩm quyền ký có nguy cơ bị vô hiệu, không đòi được nợ.',
        remediationGuide: 'Kiểm tra chặt chẽ Điều lệ và ban hành Quy chế phân quyền ký kết hợp đồng rõ ràng.',
        legalBasis: 'Điều 141, 142 Bộ luật Dân sự 2015',
      },
      {
        id: 'contract_dispute_clause',
        question: 'Hợp đồng có điều khoản lựa chọn Trọng tài thương mại (VIAC) hoặc Tòa án có thẩm quyền cụ thể rõ ràng?',
        weight: 25,
        riskIfNotCompliant: 'Mất nhiều thời gian giải quyết tranh chấp do khiếu nại thẩm quyền thụ lý.',
        remediationGuide: 'Chuẩn hóa điều khoản tài phán mẫu trong mọi giao kết.',
        legalBasis: 'Luật Trọng tài Thương mại 2010',
      },
    ],
  },
  {
    id: 'LABOR_SOCIAL_INSURANCE',
    name: '3. Lao động, Tiền lương & BHXH',
    icon: 'users',
    weight: 25,
    description: 'Hợp đồng lao động, đóng BHXH bắt buộc 100%, nội quy lao động đăng ký Sở LĐ-TB&XH, bảo vệ dữ liệu cá nhân.',
    questions: [
      {
        id: 'labor_internal_rules',
        question: 'Doanh nghiệp sử dụng từ 10 người lao động trở lên đã đăng ký Nội quy Lao động tại cơ quan quản lý nhà nước?',
        weight: 35,
        riskIfNotCompliant: 'Phạt tiền từ 10-20 triệu đồng và không thể áp dụng hình thức kỷ luật sa thải hợp pháp đối với nhân viên vi phạm.',
        remediationGuide: 'Soạn thảo Nội quy lao động và nộp hồ sơ đăng ký tại Sở/Phòng Lao động - TB&XH.',
        legalBasis: 'Điều 118, 119 Bộ luật Lao động 2019',
      },
      {
        id: 'labor_bhxh_100pct',
        question: 'Doanh nghiệp đóng đầy đủ BHXH, BHYT, BHTN cho 100% người lao động ký hợp đồng từ 01 tháng trở lên?',
        weight: 40,
        riskIfNotCompliant: 'Bị truy thu kèm lãi chậm nộp 0.03%/ngày, phạt tiền đến 15% tổng số tiền nộp và cấm xuất cảnh Người đại diện.',
        remediationGuide: 'Rà soát danh sách nhân sự và trích nộp BHXH đúng hạn hàng tháng.',
        legalBasis: 'Luật Bảo hiểm Xã hội 2024 & Nghị định 12/2022/NĐ-CP',
      },
      {
        id: 'labor_overtime_cap',
        question: 'Tổng số giờ làm thêm của nhân viên được kiểm soát chặt chẽ không quá 40 giờ/tháng và 200 giờ/năm?',
        weight: 25,
        riskIfNotCompliant: 'Phạt tiền từ 20-40 triệu đồng đối với hành vi huy động làm thêm giờ vượt trần.',
        remediationGuide: 'Kiểm soát giờ làm việc và thỏa thuận làm thêm giờ bằng văn bản.',
        legalBasis: 'Điều 107 Bộ luật Lao động 2019',
      },
    ],
  },
  {
    id: 'INTELLECTUAL_PROPERTY',
    name: '4. Sở hữu Trí tuệ (IP) & Bản quyền',
    icon: 'lightbulb',
    weight: 15,
    description: 'Đăng ký bảo hộ nhãn hiệu, logo, tên miền, bản quyền phần mềm và bảo mật bí mật kinh doanh (NDA).',
    questions: [
      {
        id: 'ip_trademark_filed',
        question: 'Doanh nghiệp đã nộp đơn đăng ký bảo hộ Nhãn hiệu/Logo thương hiệu cốt lõi tại Cục Sở hữu Trí tuệ?',
        weight: 50,
        riskIfNotCompliant: 'Nguy cơ bị đối thủ nộp đơn trước (nguyên tắc First to File) dẫn đến mất thương hiệu hoặc bị kiện xâm phạm.',
        remediationGuide: 'Nộp đơn đăng ký nhãn hiệu ngay lập tức cho các nhóm ngành kinh doanh cốt lõi.',
        legalBasis: 'Điều 90 Luật Sở hữu Trí tuệ',
      },
      {
        id: 'ip_software_license',
        question: '100% máy tính và phần mềm sử dụng trong công ty đều có bản quyền hợp pháp (Windows, Office, Adobe...)?',
        weight: 50,
        riskIfNotCompliant: 'Bị thanh tra liên ngành kiểm tra đột xuất, phạt tiền đến 500 triệu đồng và tịch thu tang vật.',
        remediationGuide: 'Rà soát phần mềm cài đặt trên máy trạm và chuyển sang gói doanh nghiệp (Microsoft 365, Google Workspace).',
        legalBasis: 'Nghị định 131/2013/NĐ-CP',
      },
    ],
  },
  {
    id: 'TAX_ENVIRONMENT_DATA',
    name: '5. Thuế, Môi trường & Dữ liệu Cá nhân',
    icon: 'shield-check',
    weight: 15,
    description: 'Hóa đơn điện tử, giao dịch liên kết, hồ sơ bảo vệ dữ liệu cá nhân DPIA (Nghị định 13/2023).',
    questions: [
      {
        id: 'tax_dpia_nd13',
        question: 'Doanh nghiệp đã hoàn thành lập và nộp Hồ sơ Đánh giá tác động xử lý dữ liệu cá nhân (DPIA) cho Cục A05?',
        weight: 60,
        riskIfNotCompliant: 'Nguy cơ bị xử phạt đến 5% tổng doanh thu khi có sự cố lộ lọt dữ liệu khách hàng/nhân viên.',
        remediationGuide: 'Lập hồ sơ DPIA theo Mẫu 04/05 Nghị định 13/2023 gửi về Bộ Công an.',
        legalBasis: 'Nghị định 13/2023/NĐ-CP',
      },
      {
        id: 'tax_einvoice_matching',
        question: '100% hóa đơn đầu vào - đầu ra được đối soát tính hợp pháp và lưu trữ điện tử theo Thông tư 78/2021?',
        weight: 40,
        riskIfNotCompliant: 'Bị loại trừ chi phí hợp lý khi tính thuế TNDN và phạt hành vi sử dụng hóa đơn bất hợp pháp.',
        remediationGuide: 'Tra cứu tình trạng hoạt động của người bán trên Cổng hóa đơn điện tử Tổng cục Thuế.',
        legalBasis: 'Nghị định 123/2020/NĐ-CP & Thông tư 78/2021/TT-BTC',
      },
    ],
  },
];

/**
 * GET /api/healthcheck/schema — Get the 5-pillar diagnostic questionnaire structure
 */
healthcheckRouter.get('/schema', (_req: Request, res: Response) => {
  return res.json({
    pillars: HEALTHCHECK_PILLARS,
    totalQuestions: HEALTHCHECK_PILLARS.reduce((acc, p) => acc + p.questions.length, 0),
  });
});

/**
 * POST /api/healthcheck/evaluate — Calculate comprehensive 5-pillar health score & remediation
 */
healthcheckRouter.post('/evaluate', (req: Request, res: Response) => {
  try {
    const { answers = {}, companyName = 'Doanh nghiệp' } = req.body;

    const pillarResults = HEALTHCHECK_PILLARS.map((pillar) => {
      let maxPillarPoints = 0;
      let earnedPillarPoints = 0;
      const remediations: Array<{
        question: string;
        risk: string;
        action: string;
        legalBasis: string;
      }> = [];

      for (const q of pillar.questions) {
        maxPillarPoints += q.weight || 10;
        if (answers[q.id] === true) {
          earnedPillarPoints += q.weight || 10;
        } else {
          remediations.push({
            question: q.question,
            risk: q.riskIfNotCompliant,
            action: q.remediationGuide,
            legalBasis: q.legalBasis,
          });
        }
      }

      const score = Math.round((earnedPillarPoints / (maxPillarPoints || 1)) * 100);
      return {
        pillarId: pillar.id,
        pillarName: pillar.name,
        icon: pillar.icon,
        weight: pillar.weight,
        score,
        remediations,
      };
    });

    // Overall Score
    let totalWeightedScore = 0;
    for (const pr of pillarResults) {
      totalWeightedScore += pr.score * (pr.weight / 100);
    }
    const overallScore = Math.round(totalWeightedScore);

    let grade = 'EXCELLENT';
    let gradeText = 'Doanh nghiệp Tuân thủ Xuất sắc - Rủi ro Pháp lý Rất Thấp';
    if (overallScore < 50) {
      grade = 'CRITICAL_RISK';
      gradeText = 'Báo động Đỏ - Nguy cơ Phạt nặng & Tranh chấp Pháp lý Cao';
    } else if (overallScore < 70) {
      grade = 'MODERATE_RISK';
      gradeText = 'Mức độ Rủi ro Trung bình - Cần khắc phục gấp 3 điểm nóng';
    } else if (overallScore < 85) {
      grade = 'GOOD';
      gradeText = 'Tương đối Tốt - Cần hoàn thiện một số hồ sơ bổ trợ';
    }

    const urgentActions = pillarResults.flatMap((pr) => pr.remediations);

    return res.json({
      companyName,
      evaluatedAt: new Date().toISOString(),
      overallScore,
      grade,
      gradeText,
      pillarResults,
      urgentActions,
      totalUrgentCount: urgentActions.length,
    });
  } catch (err) {
    console.error('[Healthcheck Router] Error evaluating diagnostic:', err);
    return res.status(500).json({ error: 'Failed to evaluate legal healthcheck' });
  }
});
