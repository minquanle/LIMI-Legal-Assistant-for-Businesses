/**
 * AIBYOKService
 * Quản lý động các AI Provider Clients (Google Gemini, OpenAI, Ollama Local)
 * và cơ chế Chìa khóa riêng BYOK (Bring Your Own Key).
 */
import { prisma } from '../infrastructure/db.js';

export interface AIProviderDTO {
  id?: string;
  provider: string;
  name: string;
  modelName: string;
  apiKey: string;
  baseUrl: string;
  isDefault: boolean;
  taskAssignments: string[];
}

export class AIBYOKService {
  /** Lấy danh sách tất cả AI Provider configs (Ẩn một phần API Key) */
  static async getAllProviders(): Promise<AIProviderDTO[]> {
    const providers = await prisma.aIProviderConfig.findMany({
      orderBy: { isDefault: 'desc' },
    });

    return providers.map((p) => ({
      id: p.id,
      provider: p.provider,
      name: p.name,
      modelName: p.modelName,
      apiKey: p.apiKey ? `${p.apiKey.slice(0, 4)}...${p.apiKey.slice(-4)}` : '',
      baseUrl: p.baseUrl,
      isDefault: p.isDefault,
      taskAssignments: p.taskAssignments as string[],
    }));
  }

  /** Cập nhật / Tạo mới AI Provider config (Lưu BYOK Key) */
  static async upsertProvider(data: AIProviderDTO) {
    if (data.isDefault) {
      // Unset previous defaults
      await prisma.aIProviderConfig.updateMany({
        where: {},
        data: { isDefault: false },
      });
    }

    if (data.id) {
      const existing = await prisma.aIProviderConfig.findUnique({ where: { id: data.id } });
      const finalKey = data.apiKey.includes('...') ? (existing?.apiKey || '') : data.apiKey;

      return prisma.aIProviderConfig.update({
        where: { id: data.id },
        data: {
          name: data.name,
          modelName: data.modelName,
          apiKey: finalKey,
          baseUrl: data.baseUrl,
          isDefault: data.isDefault,
          taskAssignments: data.taskAssignments as unknown as Parameters<typeof prisma.aIProviderConfig.update>[0]['data']['taskAssignments'],
        },
      });
    }

    return prisma.aIProviderConfig.create({
      data: {
        provider: data.provider,
        name: data.name,
        modelName: data.modelName,
        apiKey: data.apiKey,
        baseUrl: data.baseUrl,
        isDefault: data.isDefault,
        taskAssignments: data.taskAssignments as unknown as Parameters<typeof prisma.aIProviderConfig.create>[0]['data']['taskAssignments'],
      },
    });
  }

  /** Xóa Provider */
  static async deleteProvider(id: string) {
    return prisma.aIProviderConfig.delete({ where: { id } });
  }

  /** Lấy Provider phù hợp cho một Tác vụ cụ thể (RAG, Redline, OCR, Copilot) */
  static async getActiveProviderForTask(task: string) {
    const providers = await prisma.aIProviderConfig.findMany();
    const matched = providers.find((p) => {
      const assignments = p.taskAssignments as string[];
      return assignments.includes(task);
    });

    if (matched) return matched;

    // Fallback to default
    const defaultProvider = providers.find((p) => p.isDefault) || providers[0];
    return defaultProvider;
  }
}
