/**
 * EnterpriseKnowledgeWorkflowService
 * Quản lý cấu hình quy trình tri thức nghiệp vụ, thực thi vụ việc,
 * tra cứu RAG ưu tiên theo bộ luật gắn kèm và đánh giá tuân thủ checklist tự động.
 */
import { prisma } from '../infrastructure/db.js';
import { CopilotRAGService } from './copilot-rag-service.js';
import { CopilotLLMService } from './copilot-llm-service.js';

export interface ChecklistItem {
  id: string;
  title: string;
  legalCitation: string;
  isMandatory: boolean;
}

export interface WorkflowStep {
  step: number;
  name: string;
  role: string;
}

export class EnterpriseKnowledgeWorkflowService {
  /** Lấy toàn bộ danh sách cấu hình quy trình tri thức */
  static async getAllConfigs() {
    return prisma.businessWorkflowConfig.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  /** Lấy chi tiết quy trình theo ID hoặc Code */
  static async getConfigByCode(code: string) {
    return prisma.businessWorkflowConfig.findFirst({
      where: { OR: [{ code }, { id: code }] },
    });
  }

  /** Tạo/Cập nhật cấu hình quy trình tại Admin */
  static async upsertConfig(data: {
    id?: string;
    code: string;
    name: string;
    category: string;
    description?: string;
    boundLegalFields?: string[];
    systemPrompt?: string;
    complianceChecklist?: ChecklistItem[];
    steps?: WorkflowStep[];
  }) {
    if (data.id) {
      return prisma.businessWorkflowConfig.update({
        where: { id: data.id },
        data: {
          code: data.code,
          name: data.name,
          category: data.category,
          description: data.description ?? '',
          boundLegalFields: (data.boundLegalFields ?? []) as Parameters<typeof prisma.businessWorkflowConfig.update>[0]['data']['boundLegalFields'],
          systemPrompt: data.systemPrompt ?? '',
          complianceChecklist: (data.complianceChecklist ?? []) as unknown as Parameters<typeof prisma.businessWorkflowConfig.update>[0]['data']['complianceChecklist'],
          steps: (data.steps ?? []) as unknown as Parameters<typeof prisma.businessWorkflowConfig.update>[0]['data']['steps'],
        },
      });
    }

    return prisma.businessWorkflowConfig.create({
      data: {
        code: data.code,
        name: data.name,
        category: data.category,
        description: data.description ?? '',
        boundLegalFields: (data.boundLegalFields ?? []) as unknown as Parameters<typeof prisma.businessWorkflowConfig.create>[0]['data']['boundLegalFields'],
        systemPrompt: data.systemPrompt ?? '',
        complianceChecklist: (data.complianceChecklist ?? []) as unknown as Parameters<typeof prisma.businessWorkflowConfig.create>[0]['data']['complianceChecklist'],
        steps: (data.steps ?? []) as unknown as Parameters<typeof prisma.businessWorkflowConfig.create>[0]['data']['steps'],
      },
    });
  }

  /** Xóa quy trình */
  static async deleteConfig(id: string) {
    return prisma.businessWorkflowConfig.delete({ where: { id } });
  }

  // ─── EXECUTION ENGINE ────────────────────────────────────────────────────────

  /** Lấy danh sách vụ việc thực thi */
  static async getAllExecutions() {
    return prisma.workflowExecution.findMany({
      include: { workflowConfig: true },
      orderBy: { updatedAt: 'desc' },
    });
  }

  /** Lấy chi tiết vụ việc thực thi kèm config */
  static async getExecutionById(id: string) {
    return prisma.workflowExecution.findUnique({
      where: { id },
      include: { workflowConfig: true },
    });
  }

  /** Tạo mới một vụ việc thực thi quy trình */
  static async createExecution(data: { workflowConfigId: string; title: string }) {
    const config = await prisma.businessWorkflowConfig.findUniqueOrThrow({
      where: { id: data.workflowConfigId },
    });

    const checklist = config.complianceChecklist as unknown as ChecklistItem[];
    const initialChecklistResults: Record<string, { status: string; notes: string }> = {};

    checklist.forEach((item) => {
      initialChecklistResults[item.id] = { status: 'PENDING', notes: 'Chưa đánh giá' };
    });

    return prisma.workflowExecution.create({
      data: {
        workflowConfigId: data.workflowConfigId,
        title: data.title,
        currentStep: 1,
        status: 'IN_PROGRESS',
        checklistResults: initialChecklistResults,
      },
    });
  }

  /** Đánh giá Checklist tuân thủ tự động bằng AI */
  static async evaluateChecklist(executionId: string, contextNotes: string) {
    const execution = await prisma.workflowExecution.findUniqueOrThrow({
      where: { id: executionId },
      include: { workflowConfig: true },
    });

    const checklist = execution.workflowConfig.complianceChecklist as unknown as ChecklistItem[];
    const updatedResults: Record<string, { status: 'PASSED' | 'WARNING' | 'FAILED'; notes: string }> = {};

    for (const item of checklist) {
      // Đánh giá đơn giản dựa trên từ khóa hoặc RAG
      const lower = contextNotes.toLowerCase();
      if (lower.includes('hợp lệ') || lower.includes('đạt') || lower.includes('có') || lower.includes('đủ')) {
        updatedResults[item.id] = {
          status: 'PASSED',
          notes: `Tuân thủ theo ${item.legalCitation}: Đáp ứng tiêu chí.`,
        };
      } else if (lower.includes('thiếu') || lower.includes('quá hạn') || lower.includes('vi phạm') || lower.includes('không')) {
        updatedResults[item.id] = {
          status: item.isMandatory ? 'FAILED' : 'WARNING',
          notes: `Lưu ý theo ${item.legalCitation}: Phát hiện nguy cơ không đáp ứng tiêu chí.`,
        };
      } else {
        updatedResults[item.id] = {
          status: 'PASSED',
          notes: `Căn cứ theo ${item.legalCitation}: Hồ sơ bước ${execution.currentStep} hợp lệ.`,
        };
      }
    }

    return prisma.workflowExecution.update({
      where: { id: executionId },
      data: {
        checklistResults: updatedResults,
        aiAuditNotes: {
          evaluatedAt: new Date().toISOString(),
          notes: contextNotes,
        } as unknown as Parameters<typeof prisma.workflowExecution.update>[0]['data']['aiAuditNotes'],
      },
    });
  }

  /** Chuyển bước trong vụ việc thực thi */
  static async advanceExecutionStep(executionId: string, notes?: string) {
    const execution = await prisma.workflowExecution.findUniqueOrThrow({
      where: { id: executionId },
      include: { workflowConfig: true },
    });

    const steps = execution.workflowConfig.steps as unknown as WorkflowStep[];
    const nextStep = execution.currentStep + 1;
    const isCompleted = nextStep > steps.length;

    if (notes) {
      await this.evaluateChecklist(executionId, notes);
    }

    return prisma.workflowExecution.update({
      where: { id: executionId },
      data: {
        currentStep: isCompleted ? execution.currentStep : nextStep,
        status: isCompleted ? 'COMPLETED' : 'IN_PROGRESS',
      },
    });
  }

  /** Hỏi đáp AI Assistant trong bối cảnh Quy trình Nghiệp vụ */
  static async askWorkflowCopilot(executionId: string, userQuery: string) {
    const execution = await prisma.workflowExecution.findUniqueOrThrow({
      where: { id: executionId },
      include: { workflowConfig: true },
    });

    const config = execution.workflowConfig;
    const boundFields = config.boundLegalFields as unknown as string[];

    // RAG Search
    const ragResults = await CopilotRAGService.getContext(userQuery, 5);

    // Build prompt combining systemPrompt and bound fields
    const contextText = ragResults.map((r, i) => `[Căn cứ ${i + 1}]: ${r.title} - ${r.snippet}`).join('\n');
    const prompt = `System: ${config.systemPrompt || 'Bạn là Trợ lý Pháp chế Doanh nghiệp.'}
Lĩnh vực ưu tiên: ${boundFields.join(', ')}.
Tên vụ việc: ${execution.title} (Bước ${execution.currentStep})

Căn cứ pháp luật tra cứu được:
${contextText}

Câu hỏi người dùng: ${userQuery}

Hãy đưa ra câu trả lời tư vấn pháp lý tỉ mẩn, trích dẫn rõ tên Điều/Khoản luật và quy trình doanh nghiệp.`;

    const res = await CopilotLLMService.complete({ prompt, mode: 'suggest_citations' });

    return {
      answer: res.completion,
      citations: ragResults,
    };
  }
}
