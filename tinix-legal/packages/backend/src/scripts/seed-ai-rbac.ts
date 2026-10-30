/**
 * Seed script: Khởi tạo cấu hình AI Providers (BYOK) mặc định
 * và Ma trận Phân quyền Chức năng (RBAC) 5 vai trò cho hệ thống Tinix Legal.
 * Chạy: npx ts-node src/scripts/seed-ai-rbac.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_AI_PROVIDERS = [
  {
    provider: 'GEMINI',
    name: 'Google Gemini 1.5 Pro',
    modelName: 'gemini-1.5-pro',
    apiKey: '',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    isDefault: true,
    taskAssignments: ['RAG_SEARCH', 'REDLINE_AUDIT', 'OCR_PARSING', 'WORKFLOW_COPILOT'],
  },
  {
    provider: 'OPENAI',
    name: 'OpenAI GPT-4o Enterprise',
    modelName: 'gpt-4o',
    apiKey: '',
    baseUrl: 'https://api.openai.com/v1',
    isDefault: false,
    taskAssignments: ['REDLINE_AUDIT', 'OCR_PARSING'],
  },
  {
    provider: 'LOCAL_OLLAMA',
    name: 'Local Ollama Llama-3 8B (On-Premise)',
    modelName: 'llama3:8b',
    apiKey: '',
    baseUrl: 'http://localhost:11434',
    isDefault: false,
    taskAssignments: ['RAG_SEARCH'],
  },
];

const DEFAULT_ROLES_PERMISSIONS = [
  {
    role: 'SUPER_ADMIN',
    roleName: 'Quản trị viên Cao cấp',
    description: 'Toàn quyền cấu hình hệ thống, AI BYOK, quy trình và quản lý phân quyền.',
    permissions: [
      'SEARCH_VIEW', 'DRAFT_EDIT', 'REDLINE_AUDIT', 'WORKFLOW_ADVANCE',
      'WORKFLOW_FINAL_APPROVE', 'CONTRACT_MANAGE', 'ADMIN_CONFIG',
      'AI_BYOK_CONFIG', 'RBAC_MANAGE',
    ],
  },
  {
    role: 'LEGAL_HEAD',
    roleName: 'Trưởng phòng Pháp chế',
    description: 'Quyền phê duyệt cuối cùng dự thảo, thẩm định rủi ro hợp đồng và quản lý hợp đồng.',
    permissions: [
      'SEARCH_VIEW', 'DRAFT_EDIT', 'REDLINE_AUDIT', 'WORKFLOW_ADVANCE',
      'WORKFLOW_FINAL_APPROVE', 'CONTRACT_MANAGE',
    ],
  },
  {
    role: 'LEGAL_SPECIALIST',
    roleName: 'Chuyên viên Pháp lý',
    description: 'Soạn thảo văn bản, chạy Thẩm định AI Redline và trình ký quy trình.',
    permissions: [
      'SEARCH_VIEW', 'DRAFT_EDIT', 'REDLINE_AUDIT', 'WORKFLOW_ADVANCE', 'CONTRACT_MANAGE',
    ],
  },
  {
    role: 'BUSINESS_USER',
    roleName: 'Nhân viên Nghiệp vụ',
    description: 'Tra cứu văn bản QPPL, khởi tạo vụ việc nghiệp vụ và tạo bản nháp hợp đồng.',
    permissions: [
      'SEARCH_VIEW', 'DRAFT_EDIT', 'WORKFLOW_ADVANCE',
    ],
  },
  {
    role: 'AUDITOR',
    roleName: 'Kiểm toán viên / Tuân thủ',
    description: 'Xem toàn bộ báo cáo tuân thủ, bảng checklist và lịch sử trình ký (Chỉ xem).',
    permissions: [
      'SEARCH_VIEW',
    ],
  },
];

async function main() {
  console.log('Seeding AI Providers & RBAC Matrix...');

  // 1. Seed AI Providers
  for (const provider of DEFAULT_AI_PROVIDERS) {
    const existing = await prisma.aIProviderConfig.findFirst({ where: { provider: provider.provider } });
    if (!existing) {
      await prisma.aIProviderConfig.create({ data: provider });
      console.log(`Đã nạp AI Provider: ${provider.name}`);
    }
  }

  // 2. Seed RBAC Roles
  for (const role of DEFAULT_ROLES_PERMISSIONS) {
    const existing = await prisma.rolePermission.findUnique({ where: { role: role.role } });
    if (!existing) {
      await prisma.rolePermission.create({ data: role });
      console.log(`Đã nạp RBAC Role: ${role.roleName} (${role.role})`);
    }
  }

  console.log('Seed AI Providers & RBAC Matrix hoàn tất!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
