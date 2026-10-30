/**
 * Seed script: Khởi tạo 4 Quy trình Tri thức Nghiệp vụ mặc định
 * kèm Bộ văn bản QPPL gắn kết và Dynamic Compliance Checklist Rules.
 * Chạy: npx ts-node src/scripts/seed-enterprise-knowledge.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SEED_WORKFLOWS = [
  {
    code: 'HR_DISCIPLINE',
    name: 'Quy trình Xử lý Kỷ luật & Sa thải Lao động',
    category: 'Nhân sự & Lao động',
    description: 'Quy trình thẩm định tuân thủ Bộ luật Lao động khi lập biên bản kỷ luật và quyết định sa thải.',
    boundLegalFields: ['Bộ luật Lao động 2019', 'Nghị định 145/2020/NĐ-CP', 'Luật Bảo hiểm xã hội 2014'],
    systemPrompt: 'Bạn là Trợ lý Pháp lý Nhân sự chuyên sâu Bộ luật Lao động 2019. Hãy tư vấn điều kiện kỷ luật sa thải, thời hiệu kỷ luật và thủ tục họp công đoàn đúng quy định.',
    complianceChecklist: [
      { id: 'check_hr_1', title: 'Hành vi vi phạm thuộc trường hợp bị xử lý kỷ luật sa thải', legalCitation: 'Điều 125 Bộ luật Lao động 2019', isMandatory: true },
      { id: 'check_hr_2', title: 'Thời hiệu xử lý kỷ luật còn hiệu lực (tối đa 06 tháng)', legalCitation: 'Điều 123 Bộ luật Lao động 2019', isMandatory: true },
      { id: 'check_hr_3', title: 'Có sự tham gia của Tổ chức đại diện người lao động tại cơ sở (Công đoàn)', legalCitation: 'Khoản 1 Điều 122 Bộ luật Lao động 2019', isMandatory: true },
      { id: 'check_hr_4', title: 'Không thuộc các trường hợp cấm xử lý kỷ luật (nghỉ thai sản, ốm đau)', legalCitation: 'Khoản 4 Điều 122 Bộ luật Lao động 2019', isMandatory: true },
    ],
    steps: [
      { step: 1, name: 'Lập Biên bản Vi phạm Kỷ luật', role: 'HR_OFFICER' },
      { step: 2, name: 'Gửi Thông báo Mời họp Kỷ luật trước 05 ngày', role: 'HR_MANAGER' },
      { step: 3, name: 'Tổ chức Cuộc họp Kỷ luật Lao động', role: 'LEGAL_REPRESENTATIVE' },
      { step: 4, name: 'Ban hành Quyết định Sa thải & Trả sổ BHXH', role: 'DIRECTOR' },
    ],
  },
  {
    code: 'PROCUREMENT_BIDDING',
    name: 'Quy trình Đánh giá Hồ sơ Mời thầu & Mua sắm',
    category: 'Đấu thầu & Mua sắm',
    description: 'Thẩm định hồ sơ mời thầu (HSMT) và hợp đồng thương thảo mua sắm tài sản doanh nghiệp.',
    boundLegalFields: ['Luật Đấu thầu 2023', 'Nghị định 24/2024/NĐ-CP', 'Luật Thương mại 2005'],
    systemPrompt: 'Bạn là Chuyên gia Pháp lý Đấu thầu & Mua sắm. Bạn thẩm định tính hợp lệ của HSMT, tiêu chuẩn đánh giá HSDT và bảo lãnh dự thầu.',
    complianceChecklist: [
      { id: 'check_bid_1', title: 'Đầy đủ Bảo lãnh dự thầu theo quy định (1% - 3% giá gói thầu)', legalCitation: 'Điều 14 Luật Đấu thầu 2023', isMandatory: true },
      { id: 'check_bid_2', title: 'Thời gian chuẩn bị Hồ sơ dự thầu tối thiểu 18 ngày', legalCitation: 'Điều 45 Luật Đấu thầu 2023', isMandatory: true },
      { id: 'check_bid_3', title: 'Không nêu nhãn hiệu, xuất xứ cụ thể gây hạn chế nhà thầu', legalCitation: 'Khoản 2 Điều 44 Luật Đấu thầu 2023', isMandatory: true },
    ],
    steps: [
      { step: 1, name: 'Lập & Phê duyệt Hồ sơ Mời thầu (HSMT)', role: 'PROCUREMENT_SPECIALIST' },
      { step: 2, name: 'Mở thầu & Đánh giá Hồ sơ Dự thầu (HSDT)', role: 'TENDER_COMMITTEE' },
      { step: 3, name: 'Thương thảo & Ký kết Hợp đồng Gói thầu', role: 'DIRECTOR' },
    ],
  },
  {
    code: 'MA_DUE_DILIGENCE',
    name: 'Quy trình Thẩm định Pháp lý Đầu tư & M&A (Due Diligence)',
    category: 'Đầu tư & M&A',
    description: 'Rà soát rủi ro pháp lý tài sản, tư cách pháp nhân và nghĩa vụ tài chính khi góp vốn / mua lại doanh nghiệp.',
    boundLegalFields: ['Luật Doanh nghiệp 2020', 'Luật Đầu tư 2020', 'Luật Đất đai 2024'],
    systemPrompt: 'Bạn là Cố vấn Pháp lý M&A & Đầu tư. Bạn phân tích rủi ro tranh chấp cổ phần, quyền sử dụng đất và nghĩa vụ nợ của doanh nghiệp mục tiêu.',
    complianceChecklist: [
      { id: 'check_ma_1', title: 'Giấy chứng nhận ĐKKD và tỷ lệ sở hữu vốn góp hợp lệ', legalCitation: 'Điều 34 Luật Doanh nghiệp 2020', isMandatory: true },
      { id: 'check_ma_2', title: 'Quyền sử dụng đất của dự án không bị thế chấp / tranh chấp', legalCitation: 'Điều 45 Luật Đất đai 2024', isMandatory: true },
      { id: 'check_ma_3', title: 'Báo cáo Kiểm toán Tài chính 03 năm gần nhất không có nợ đọng thuế', legalCitation: 'Luật Quản lý Thuế 2019', isMandatory: true },
    ],
    steps: [
      { step: 1, name: 'Ký Hợp đồng Bảo mật (NDA) & Thu thập Hồ sơ Target', role: 'MA_ANALYST' },
      { step: 2, name: 'Phát hành Báo cáo Thẩm định Pháp lý (Legal DD Report)', role: 'LEGAL_COUNSEL' },
      { step: 3, name: 'Đàm phán Hợp đồng Mua bán Cổ phần / Vốn góp (SPA)', role: 'BOARD_OF_DIRECTORS' },
    ],
  },
  {
    code: 'TAX_AUDIT',
    name: 'Quy trình Tuân thủ Quyết toán Thuế TNDN & GTGT',
    category: 'Thuế & Kế toán',
    description: 'Thẩm định hóa đơn chứng từ, chi phí hợp lý được trừ và các rủi ro ấn định thuế TNDN.',
    boundLegalFields: ['Luật Quản lý Thuế 2019', 'Thông tư 78/2014/TT-BTC', 'Thông tư 219/2013/TT-BTC'],
    systemPrompt: 'Bạn là Chuyên gia Tư vấn Thuế & Kế toán Doanh nghiệp. Bạn kiểm tra tính hợp pháp của hóa đơn điện tử và các khoản chi phí được trừ.',
    complianceChecklist: [
      { id: 'check_tax_1', title: 'Hóa đơn GTGT từ 20 triệu đồng trở lên có chứng từ thanh toán không dùng tiền mặt', legalCitation: 'Điều 6 Thông tư 78/2014/TT-BTC', isMandatory: true },
      { id: 'check_tax_2', title: 'Các khoản chi phúc lợi nhân viên không vượt quá 01 tháng lương bình quân', legalCitation: 'Thông tư 96/2015/TT-BTC', isMandatory: false },
    ],
    steps: [
      { step: 1, name: 'Rà soát Hóa đơn & Chứng từ Kế toán', role: 'CHIEF_ACCOUNTANT' },
      { step: 2, name: 'Lập Tờ khai Quyết toán Thuế TNDN', role: 'TAX_SPECIALIST' },
      { step: 3, name: 'Duyệt & Nộp Báo cáo Thuế cho Cơ quan Thuế', role: 'FINANCE_DIRECTOR' },
    ],
  },
];

async function main() {
  console.log('Seeding Enterprise Knowledge Workflows...');

  for (const wf of SEED_WORKFLOWS) {
    const existing = await prisma.businessWorkflowConfig.findUnique({ where: { code: wf.code } });
    if (!existing) {
      await prisma.businessWorkflowConfig.create({
        data: {
          code: wf.code,
          name: wf.name,
          category: wf.category,
          description: wf.description,
          boundLegalFields: wf.boundLegalFields,
          systemPrompt: wf.systemPrompt,
          complianceChecklist: wf.complianceChecklist,
          steps: wf.steps,
          isActive: true,
        },
      });
      console.log(`Đã nạp quy trình: ${wf.name} (${wf.code})`);
    } else {
      console.log(`ℹ️ Quy trình ${wf.code} đã tồn tại, bỏ qua.`);
    }
  }

  console.log('Seed hoàn tất!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
