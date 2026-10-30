/**
 * AITokenAnalyticsService
 * Ghi log tiêu thụ token và thống kê báo cáo chi phí LLM BYOK real-time.
 */
import { prisma } from '../infrastructure/db.js';

const USD_TO_VND_RATE = 25450; // 1 USD = 25,450 VND

export class AITokenAnalyticsService {
  /** Ghi nhận log tiêu thụ Token khi gọi AI */
  static async logUsage(data: {
    provider: string;
    modelName: string;
    task: string;
    promptTokens: number;
    completionTokens: number;
    userRole?: string;
  }) {
    const totalTokens = data.promptTokens + data.completionTokens;
    let ratePer1k = 0.000007; // Gemini 1.5 default
    if (data.provider === 'OPENAI') ratePer1k = 0.00001;
    if (data.provider === 'LOCAL_OLLAMA') ratePer1k = 0;

    const costUSD = Number((totalTokens * ratePer1k).toFixed(5));

    return prisma.aITokenLog.create({
      data: {
        provider: data.provider,
        modelName: data.modelName,
        task: data.task,
        promptTokens: data.promptTokens,
        completionTokens: data.completionTokens,
        totalTokens,
        costUSD,
        userRole: data.userRole || 'BUSINESS_USER',
      },
    });
  }

  /** Báo cáo Thống kê Tổng quan (Tổng Token, Chi phí USD, Chi phí VND, Số lượt gọi) */
  static async getAnalyticsSummary() {
    const logs = await prisma.aITokenLog.findMany();

    const totalRequests = logs.length;
    const totalTokens = logs.reduce((acc, l) => acc + l.totalTokens, 0);
    const totalCostUSD = Number(logs.reduce((acc, l) => acc + l.costUSD, 0).toFixed(3));
    const totalCostVND = Math.round(totalCostUSD * USD_TO_VND_RATE);

    // Budget Cap alert rule (Default budget limit $50 USD/month)
    const budgetLimitUSD = 50.0;
    const isBudgetAlert = totalCostUSD >= budgetLimitUSD * 0.8;

    return {
      totalRequests,
      totalTokens,
      totalCostUSD,
      totalCostVND,
      budgetLimitUSD,
      isBudgetAlert,
      recentLogs: logs.slice(0, 10),
    };
  }

  /** Thống kê Chi phí theo AI Provider */
  static async getCostByProvider() {
    const logs = await prisma.aITokenLog.findMany();
    const map: Record<string, { provider: string; totalTokens: number; costUSD: number; count: number }> = {};

    logs.forEach((l) => {
      if (!map[l.provider]) {
        map[l.provider] = { provider: l.provider, totalTokens: 0, costUSD: 0, count: 0 };
      }
      map[l.provider].totalTokens += l.totalTokens;
      map[l.provider].costUSD += l.costUSD;
      map[l.provider].count += 1;
    });

    return Object.values(map).map((item) => ({
      ...item,
      costUSD: Number(item.costUSD.toFixed(3)),
      costVND: Math.round(item.costUSD * USD_TO_VND_RATE),
    }));
  }

  /** Thống kê Chi phí theo Nhiệm vụ (RAG Search, Redline Audit, OCR Parsing, Copilot) */
  static async getCostByTask() {
    const logs = await prisma.aITokenLog.findMany();
    const map: Record<string, { task: string; totalTokens: number; costUSD: number; count: number }> = {};

    logs.forEach((l) => {
      if (!map[l.task]) {
        map[l.task] = { task: l.task, totalTokens: 0, costUSD: 0, count: 0 };
      }
      map[l.task].totalTokens += l.totalTokens;
      map[l.task].costUSD += l.costUSD;
      map[l.task].count += 1;
    });

    return Object.values(map).map((item) => ({
      ...item,
      costUSD: Number(item.costUSD.toFixed(3)),
      costVND: Math.round(item.costUSD * USD_TO_VND_RATE),
    }));
  }
}
