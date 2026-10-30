/**
 * Seed script: Khởi tạo 50 log tiêu thụ Token AI (AITokenLog) và Phụ lục Hợp đồng mẫu.
 * Chạy: npx ts-node src/scripts/seed-analytics-addendum.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding AI Token Logs & Contract Addendums...');

  // 1. Fetch or create a contract master
  let contract = await prisma.contractMaster.findFirst();
  if (!contract) {
    contract = await prisma.contractMaster.create({
      data: {
        title: 'Hợp đồng Thuê Máy chủ Cloud Server 2026',
        contractNumber: 'HĐ-2026-CLOUD01',
        partnerName: 'Công ty Viễn thông FPT',
        contractValue: 1_200_000_000,
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-12-31'),
        notes: 'Hợp đồng hạ tầng chính',
      },
    });
  }

  // 2. Create Addendum 01 & 02
  const existingAddendum = await prisma.contractAddendum.findFirst({
    where: { contractId: contract.id },
  });

  if (!existingAddendum) {
    const add1 = await prisma.contractAddendum.create({
      data: {
        contractId: contract.id,
        title: 'Phụ lục 01: Nâng cấp Dung lượng Đĩa cứng NVMe',
        addendumNumber: 'PL-01/CLOUD01',
        valueAdjustment: 200_000_000,
        notes: 'Nâng giá trị từ 1.2 tỷ lên 1.4 tỷ VNĐ',
      },
    });

    await prisma.contractAddendum.create({
      data: {
        contractId: contract.id,
        parentId: add1.id,
        title: 'Phụ lục 02: Gia hạn Thời gian Sử dụng Thêm 06 Tháng',
        addendumNumber: 'PL-02/CLOUD01',
        valueAdjustment: 150_000_000,
        dateAdjustment: new Date('2027-06-30'),
        notes: 'Gia hạn hạn hiệu lực đến 30/06/2027',
      },
    });
    console.log('Đã nạp Cây Phụ lục Hợp đồng mẫu!');
  }

  // 3. Seed 50 AITokenLog entries
  const tasks = ['RAG_SEARCH', 'REDLINE_AUDIT', 'OCR_PARSING', 'WORKFLOW_COPILOT'];
  const providers = [
    { provider: 'GEMINI', model: 'gemini-1.5-pro', rate: 0.000007 },
    { provider: 'OPENAI', model: 'gpt-4o', rate: 0.00001 },
    { provider: 'LOCAL_OLLAMA', model: 'llama3:8b', rate: 0 },
  ];

  const now = Date.now();
  const count = await prisma.aITokenLog.count();

  if (count < 20) {
    for (let i = 0; i < 40; i++) {
      const p = providers[i % providers.length];
      const task = tasks[i % tasks.length];
      const promptTokens = Math.floor(Math.random() * 2000) + 500;
      const completionTokens = Math.floor(Math.random() * 800) + 150;
      const totalTokens = promptTokens + completionTokens;
      const costUSD = Number((totalTokens * p.rate).toFixed(5));

      await prisma.aITokenLog.create({
        data: {
          provider: p.provider,
          modelName: p.model,
          task,
          promptTokens,
          completionTokens,
          totalTokens,
          costUSD,
          userRole: i % 2 === 0 ? 'LEGAL_HEAD' : 'BUSINESS_USER',
          createdAt: new Date(now - i * 3600 * 1000 * 4), // 4 hours interval
        },
      });
    }
    console.log('Đã nạp 40 bản ghi AITokenLog mẫu!');
  }

  console.log('Seed Analytics & Addendums hoàn tất!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
