/**
 * Seed script: Khởi tạo cấu hình quy trình trình ký 4 bước mặc định
 * và mốc cảnh báo 30-15-7 ngày cho hệ thống Enterprise Legal.
 * Chạy: npx ts-node src/scripts/seed-enterprise-config.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_WORKFLOW_STEPS = [
  { step: 1, name: 'Chuyên viên soạn thảo', role: 'EDITOR', requireSignature: false },
  { step: 2, name: 'Trưởng phòng duyệt nội dung', role: 'MANAGER', requireSignature: false },
  { step: 3, name: 'Pháp chế thẩm định rủi ro', role: 'LEGAL', requireSignature: false },
  { step: 4, name: 'Ban Giám đốc phê duyệt & Ký', role: 'DIRECTOR', requireSignature: true },
];

async function main() {
  console.log('Seeding Enterprise Config...');
  const existing = await prisma.enterpriseConfig.findFirst({ where: { isDefault: true } });
  if (existing) {
    console.log('Cấu hình mặc định đã tồn tại, bỏ qua seed.');
    return;
  }

  await prisma.enterpriseConfig.create({
    data: {
      orgName: 'Doanh nghiệp mặc định',
      workflowSteps: DEFAULT_WORKFLOW_STEPS,
      alertThresholds: [30, 15, 7],
      riskRules: {
        maxPenaltyPercent: 8,
        maxProbationDays: 60,
        maxPaymentDelayDays: 45,
        requireBankGuaranteeAbove: 200_000_000, // 200 triệu VND
      },
      isDefault: true,
    },
  });

  console.log('Đã tạo EnterpriseConfig mặc định: 4 bước duyệt, cảnh báo [30, 15, 7] ngày.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
