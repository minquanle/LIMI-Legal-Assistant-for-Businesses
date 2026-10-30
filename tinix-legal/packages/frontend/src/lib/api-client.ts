const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';

const RADAR_CLIENT_ID_KEY = 'tinix_radar_client_id';

/**
 * Stable per-browser id for the compliance radar's audit history, checklist
 * progress and industry subscriptions. The app has no real login system, so
 * this is a self-declared label like the rest of the codebase's `userId`
 * fields (UserWatchlist, UserNotification) — not a verified identity, and
 * trivially reset by clearing site data. It exists only to stop one shared
 * default (e.g. `'demo-user'`) from mixing every anonymous visitor's data
 * together: a random id generated once and cached in localStorage keeps each
 * browser's state separate from every other browser's.
 */
let inMemoryFallbackClientId: string | null = null;

export function getRadarClientId(): string {
  if (typeof window === 'undefined') return 'server';
  try {
    let id = localStorage.getItem(RADAR_CLIENT_ID_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(RADAR_CLIENT_ID_KEY, id);
    }
    return id;
  } catch {
    // Storage unavailable (private mode, disabled cookies): keep one id for
    // the lifetime of this page load instead of a fresh one per call, so a
    // user's own actions within the same visit stay consistent with each
    // other even though they won't persist across reloads.
    if (!inMemoryFallbackClientId) inMemoryFallbackClientId = crypto.randomUUID();
    return inMemoryFallbackClientId;
  }
}

export interface DocumentSummary {
  id: string;
  documentNumber: string;
  normalizedNumber?: string;
  documentType: string;
  title: string;
  issuingBody: string;
  promulgationDate: string | null;
  effectiveDate: string | null;
  validityStatus: string;
  field: string;
  trichYeu?: string;
  rrfScore?: number;
  vectorScore?: number;
  astMatch?: any;
}

export interface SearchResponse {
  results: DocumentSummary[];
  total: number;
  page: number;
  limit: number;
  query: string;
  processingTimeMs?: number;
  isHybrid?: boolean;
  degraded?: boolean;
}

export interface DocumentDetail extends DocumentSummary {
  signer: string;
  expiryDate: string | null;
  gazetteNumber: string;
  gazetteDate: string | null;
  isConsolidated: boolean;
  isTranslation: boolean;
  trichYeu: string;
  author: string;
  lastUpdatedAt: string | null;
  fullText: string;
  ast: any;
  createdAt: string;
  updatedAt: string;
  sources: Array<{ id: string; site: string; url: string; lastCrawledAt: string }>;
  attachments: Array<{ id: string; originalName: string; mimeType: string; sizeBytes: number }>;
  astNodes: any[];
  outgoingRelations: any[];
  incomingRelations: any[];
}

export interface HomeStats {
  totalDocs: number;
  docsWithFull: number;
  inEffectDocs: number;
  typeStats: Array<{ documentType: string; _count: { id: number } }>;
  dateRange: { minDate: string | null; maxDate: string | null };
  recentDocs: DocumentSummary[];
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async fetchJson<T>(path: string, options: RequestInit = {}): Promise<T> {
    // Matches any path requireAdminAuth guards on the backend: /admin/*,
    // and admin-only sub-actions nested under other routers (e.g.
    // /qa/admin/pending, /qa/items/:id/publish|reject).
    const isAdminRoute =
      path.startsWith('/admin') ||
      /\/admin\//.test(path) ||
      /\/items\/[^/]+\/(publish|reject)(\?|$)/.test(path);
    const isBrowser = typeof window !== 'undefined';

    // The admin secret must never be shipped to the browser. From the client we
    // go through the Next.js proxy, which validates an httpOnly session cookie
    // and attaches the key server-side; on the server we can use it directly.
    const adminHeaders: Record<string, string> = {};
    let url: string;
    if (isAdminRoute && isBrowser) {
      url = `/api/admin-proxy${path}`;
    } else {
      url = `${this.baseUrl}${path}`;
      if (isAdminRoute) {
        const serverKey = process.env.ADMIN_SECRET_KEY || process.env.API_ADMIN_KEY;
        if (serverKey) adminHeaders['x-admin-key'] = serverKey;
      }
    }

    try {
      const res = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...adminHeaders,
          ...(options.headers || {}),
        },
        // Admin data is per-session and must never be cached or shared.
        ...(isAdminRoute
          ? { cache: 'no-store' as const }
          : { next: { revalidate: 30, ...(options as any)?.next } }),
      });

      if (!res.ok) {
        // Prefer the backend's own message (routes return { error, message? } as
        // JSON) over the generic HTTP status text, since e.g. admin validation
        // errors carry the actionable detail there.
        const errText = await res.text().catch(() => '');
        let detail = res.statusText;
        try {
          const parsed = JSON.parse(errText);
          detail = parsed.message || parsed.error || detail;
        } catch {
          if (errText) detail = errText;
        }
        throw new Error(`API Error ${res.status}: ${detail} on ${path}`);
      }

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        return (await res.json()) as T;
      }
      const rawText = await res.text();
      try {
        return JSON.parse(rawText) as T;
      } catch {
        return rawText as unknown as T;
      }
    } catch (err: any) {
      console.warn(`[ApiClient] Request to ${path} failed:`, err.message);
      throw err;
    }
  }

  async scanRedlines(content: string): Promise<{ redlines: any[]; totalScanned: number }> {
    try {
      return await this.fetchJson<{ redlines: any[]; totalScanned: number }>('/copilot/redline', {
        method: 'POST',
        body: JSON.stringify({ content }),
      });
    } catch {
      return { redlines: [], totalScanned: 0 };
    }
  }


  async searchDocuments(params: {
    q?: string;
    documentType?: string;
    issuingBody?: string;
    validityStatus?: string;
    field?: string;
    exact?: string;
    scope?: string;
    yearFrom?: string;
    yearTo?: string;
    page?: number;
    limit?: number;
    hybrid?: boolean | string;
  }): Promise<SearchResponse> {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, String(val));
      }
    });

    return this.fetchJson<SearchResponse>(`/search?${query.toString()}`);
  }

  async getHomeStats(): Promise<HomeStats> {
    try {
      const stats = await this.fetchJson<any>('/admin/stats', { next: { revalidate: 60 } });
      const searchRes = await this.searchDocuments({ page: 1, limit: 8 });

      const typeStats = (stats.byType || []).map((t: any) => ({
        documentType: t.type,
        _count: { id: t.count },
      }));

      return {
        totalDocs: stats.totalDocs || 0,
        docsWithFull: stats.totalDocs - (stats.docsWithoutFullTextCount || 0),
        inEffectDocs: (stats.byStatus || []).find((s: any) => s.status === 'CON_HIEU_LUC')?.count || 0,
        typeStats,
        dateRange: { minDate: '1945-01-01', maxDate: new Date().toISOString() },
        recentDocs: searchRes.results || [],
      };
    } catch {
      // Fallback response if admin API is offline
      const searchRes = await this.searchDocuments({ page: 1, limit: 8 });
      return {
        totalDocs: searchRes.total || 0,
        docsWithFull: searchRes.total || 0,
        inEffectDocs: Math.round((searchRes.total || 0) * 0.7),
        typeStats: [],
        dateRange: { minDate: '1945-01-01', maxDate: new Date().toISOString() },
        recentDocs: searchRes.results || [],
      };
    }
  }

  async getRecentDocuments(limit: number = 8): Promise<DocumentSummary[]> {
    const res = await this.searchDocuments({ page: 1, limit });
    return res.results;
  }

  async getDocumentById(id: string): Promise<DocumentDetail | null> {
    try {
      return await this.fetchJson<DocumentDetail>(`/documents/${id}`);
    } catch {
      return null;
    }
  }

  async getDocumentAst(id: string): Promise<any[]> {
    return this.fetchJson<any[]>(`/documents/${id}/ast`);
  }

  async getDocumentLineage(id: string): Promise<any> {
    return this.fetchJson<any>(`/documents/${id}/lineage`);
  }

  async getDocumentRelations(id: string): Promise<any[]> {
    return this.fetchJson<any[]>(`/documents/${id}/relations`);
  }

  async getAdminStats(): Promise<any> {
    return this.fetchJson<any>('/admin/stats');
  }

  async getQualityReport(): Promise<any> {
    return this.fetchJson<any>('/admin/quality');
  }

  async getFacetsStats(): Promise<any> {
    return this.fetchJson<any>('/documents/facets/stats');
  }

  async getCopilotTemplates(): Promise<any[]> {
    return this.fetchJson<any[]>('/copilot/templates');
  }

  async getDrafts(): Promise<any[]> {
    return this.fetchJson<any[]>('/copilot/drafts');
  }

  async getDraftById(id: string): Promise<any> {
    return this.fetchJson<any>(`/copilot/drafts/${id}`);
  }

  async createDraft(data: { title: string; templateId?: string; content?: string }): Promise<any> {
    return this.fetchJson<any>('/copilot/drafts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateDraft(id: string, data: { title?: string; content?: string; status?: string }): Promise<any> {
    return this.fetchJson<any>(`/copilot/drafts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async scanCitationValidity(text: string): Promise<{ citations: any[]; totalScanned: number }> {
    return this.fetchJson<{ citations: any[]; totalScanned: number }>('/copilot/scan-validity', {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  }

  async getCopilotCompletion(payload: { prompt: string; mode?: string; draftContent?: string }): Promise<any> {
    return this.fetchJson<any>('/copilot/completion', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async executeContextualAIAction(payload: {
    action: string;
    selectedText: string;
    customPrompt?: string;
    documentTitle?: string;
  }): Promise<{ result: string; warnings?: string[] }> {
    return this.fetchJson<{ result: string; warnings?: string[] }>('/copilot/ai-action', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async auditContract(text: string): Promise<{ risks: any[]; totalRisks: number }> {
    return this.fetchJson<{ risks: any[]; totalRisks: number }>('/copilot/audit-contract', {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  }

  // ─── Enterprise: Admin Config ───────────────────────────────────────────────

  async getEnterpriseConfig(): Promise<any> {
    return this.fetchJson<any>('/admin/enterprise-config');
  }

  async updateEnterpriseConfig(data: {
    orgName?: string;
    workflowSteps?: Array<{ step: number; name: string; role: string; requireSignature: boolean }>;
    alertThresholds?: number[];
    riskRules?: Record<string, unknown>;
  }): Promise<any> {
    return this.fetchJson<any>('/admin/enterprise-config', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // ─── Enterprise: Approval Workflow ──────────────────────────────────────────

  async getWorkflowProgress(draftId: string): Promise<any> {
    return this.fetchJson<any>(`/enterprise/workflows/${draftId}`);
  }

  async advanceDraft(draftId: string, payload: { actorName: string; actorRole: string; comment?: string }): Promise<any> {
    return this.fetchJson<any>(`/enterprise/workflows/${draftId}/advance`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async rejectDraft(draftId: string, payload: { actorName: string; actorRole: string; comment: string }): Promise<any> {
    return this.fetchJson<any>(`/enterprise/workflows/${draftId}/reject`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // ─── Enterprise: Contract Lifecycle ─────────────────────────────────────────

  async getContracts(): Promise<{ contracts: any[]; summary: any }> {
    return this.fetchJson<{ contracts: any[]; summary: any }>('/enterprise/contracts');
  }

  async createContract(data: {
    title: string;
    contractNumber?: string;
    partnerName?: string;
    contractValue?: number;
    startDate?: string;
    endDate?: string;
    paymentMilestones?: any[];
    notes?: string;
    draftId?: string;
  }): Promise<any> {
    return this.fetchJson<any>('/enterprise/contracts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateContract(id: string, data: Record<string, unknown>): Promise<any> {
    return this.fetchJson<any>(`/enterprise/contracts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // ─── Enterprise: Knowledge Workflows & Executions ──────────────────────────

  async getKnowledgeConfigs(): Promise<any[]> {
    return this.fetchJson<any[]>('/admin/enterprise-knowledge-configs');
  }

  async upsertKnowledgeConfig(data: Record<string, unknown>): Promise<any> {
    return this.fetchJson<any>('/admin/enterprise-knowledge-configs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteKnowledgeConfig(id: string): Promise<any> {
    return this.fetchJson<any>(`/admin/enterprise-knowledge-configs/${id}`, {
      method: 'DELETE',
    });
  }

  async getWorkflowExecutions(): Promise<any[]> {
    return this.fetchJson<any[]>('/enterprise/workflow-executions');
  }

  async getWorkflowExecutionById(id: string): Promise<any> {
    return this.fetchJson<any>(`/enterprise/workflow-executions/${id}`);
  }

  async createWorkflowExecution(data: { workflowConfigId: string; title: string }): Promise<any> {
    return this.fetchJson<any>('/enterprise/workflow-executions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async advanceWorkflowExecution(id: string, notes?: string): Promise<any> {
    return this.fetchJson<any>(`/enterprise/workflow-executions/${id}/advance`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  }

  async evaluateWorkflowChecklist(id: string, notes: string): Promise<any> {
    return this.fetchJson<any>(`/enterprise/workflow-executions/${id}/evaluate`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  }

  async askWorkflowCopilot(id: string, query: string): Promise<{ answer: string; citations: any[] }> {
    return this.fetchJson<{ answer: string; citations: any[] }>(`/enterprise/workflow-executions/${id}/ask`, {
      method: 'POST',
      body: JSON.stringify({ query }),
    });
  }

  // ─── Enterprise: AI BYOK, RBAC, Contract OCR & Mindmap ─────────────────────

  async getAIProviders(): Promise<any[]> {
    return this.fetchJson<any[]>('/admin/ai-byok');
  }

  async upsertAIProvider(data: Record<string, unknown>): Promise<any> {
    return this.fetchJson<any>('/admin/ai-byok', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteAIProvider(id: string): Promise<any> {
    return this.fetchJson<any>(`/admin/ai-byok/${id}`, {
      method: 'DELETE',
    });
  }

  async getRBACPermissions(): Promise<{ roles: any[]; features: any[] }> {
    return this.fetchJson<{ roles: any[]; features: any[] }>('/admin/rbac');
  }

  async updateRolePermissions(role: string, permissions: string[]): Promise<any> {
    return this.fetchJson<any>(`/admin/rbac/${role}`, {
      method: 'PUT',
      body: JSON.stringify({ permissions }),
    });
  }

  // ─────────────────────────────────────────────────────────────────
  // Admin: Compliance Radar Alerts
  // ─────────────────────────────────────────────────────────────────

  async getRadarAlertsAdmin(): Promise<{ alerts: any[]; industries: any[] }> {
    return this.fetchJson<{ alerts: any[]; industries: any[] }>('/admin/radar-alerts');
  }

  async createRadarAlert(data: Record<string, unknown>): Promise<any> {
    return this.fetchJson<any>('/admin/radar-alerts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateRadarAlert(id: string, data: Record<string, unknown>): Promise<any> {
    return this.fetchJson<any>(`/admin/radar-alerts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteRadarAlert(id: string): Promise<any> {
    return this.fetchJson<any>(`/admin/radar-alerts/${id}`, {
      method: 'DELETE',
    });
  }

  async parseContractOCR(contractText: string): Promise<any> {
    return this.fetchJson<any>('/contracts/ocr', {
      method: 'POST',
      body: JSON.stringify({ contractText }),
    });
  }

  async saveContractOCR(contractText: string): Promise<any> {
    return this.fetchJson<any>('/contracts/ocr/save', {
      method: 'POST',
      body: JSON.stringify({ contractText }),
    });
  }

  async getLegalMindmap(docId: string): Promise<{ nodes: any[]; edges: any[] }> {
    return this.fetchJson<{ nodes: any[]; edges: any[] }>(`/documents/${docId}/mindmap`);
  }

  // ─── Enterprise: Deep Analytics, Deep OCR & Addendum Tree ──────────────────

  async getAIAnalyticsSummary(): Promise<any> {
    return this.fetchJson<any>('/admin/ai-analytics/summary');
  }

  async getAIAnalyticsByProvider(): Promise<any[]> {
    return this.fetchJson<any[]>('/admin/ai-analytics/by-provider');
  }

  async getAIAnalyticsByTask(): Promise<any[]> {
    return this.fetchJson<any[]>('/admin/ai-analytics/by-task');
  }

  async extractDeepOCRTables(contractText: string): Promise<any[]> {
    return this.fetchJson<any[]>('/contracts/deep-ocr/tables', {
      method: 'POST',
      body: JSON.stringify({ contractText }),
    });
  }

  async extractDeepOCRRisks(contractText: string): Promise<any[]> {
    return this.fetchJson<any[]>('/contracts/deep-ocr/risks', {
      method: 'POST',
      body: JSON.stringify({ contractText }),
    });
  }

  async getContractAddendums(contractId: string): Promise<any[]> {
    return this.fetchJson<any[]>(`/contracts/${contractId}/addendums`);
  }

  async createContractAddendum(contractId: string, data: Record<string, unknown>): Promise<any> {
    return this.fetchJson<any>(`/contracts/${contractId}/addendums`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async compareContractVersions(contractId: string, v1Id: string, v2Id: string): Promise<any> {
    return this.fetchJson<any>(`/contracts/${contractId}/addendums/compare?v1Id=${v1Id}&v2Id=${v2Id}`);
  }

  // ─── Contract Risk Audit & Mindmap Diff ──────────────────────────────────────

  async startContractRiskAudit(data: { contractId?: string; draftId?: string; text?: string }): Promise<any> {
    return this.fetchJson<any>('/copilot/risk-audits', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getContractRiskAuditStatus(id: string): Promise<any> {
    return this.fetchJson<any>(`/copilot/risk-audits/${id}`);
  }

  async generateNegotiationPlaybook(auditId: string): Promise<{ playbookData: { clauses: any[] } }> {
    return this.fetchJson<{ playbookData: { clauses: any[] } }>(`/contract-audit/${auditId}/playbook`, {
      method: 'POST',
    });
  }

  async getNotifications(userId?: string): Promise<Array<{ id: string; userId: string; type: string; title: string; body: string; documentId: string | null; read: boolean; createdAt: string }>> {
    const q = userId ? `?userId=${encodeURIComponent(userId)}` : '';
    return this.fetchJson(`/notifications${q}`);
  }

  async markNotificationRead(id: string): Promise<any> {
    return this.fetchJson(`/notifications/${id}/read`, { method: 'POST' });
  }

  async markAllNotificationsRead(userId?: string): Promise<any> {
    return this.fetchJson('/notifications/read-all', {
      method: 'POST',
      body: JSON.stringify(userId ? { userId } : {}),
    });
  }

  async getPendingQAItems(page = 1, limit = 20): Promise<{ items: any[]; total: number; page: number; limit: number; totalPages: number }> {
    return this.fetchJson(`/qa/admin/pending?page=${page}&limit=${limit}`);
  }

  async publishQAItem(id: string): Promise<any> {
    return this.fetchJson(`/qa/items/${id}/publish`, { method: 'POST' });
  }

  async rejectQAItem(id: string): Promise<any> {
    return this.fetchJson(`/qa/items/${id}/reject`, { method: 'POST' });
  }

  async voteQAItem(itemId: string, type: 'helpful' | 'unhelpful'): Promise<{ id: string; helpfulCount: number; unhelpfulCount: number }> {
    return this.fetchJson(`/qa/items/${itemId}/vote`, {
      method: 'POST',
      body: JSON.stringify({ type }),
    });
  }

  async getMindmapDiff(docId1?: string, docId2?: string): Promise<{ nodes: any[]; edges: any[] }> {
    return this.fetchJson<{ nodes: any[]; edges: any[] }>('/mindmap/diff', {
      method: 'POST',
      body: JSON.stringify({ docId1, docId2 }),
    });
  }

  // ─── Law Pulse & Upcoming Enforcement Radar ─────────────────────────────────

  async getLawPulseItems(params?: { role?: string; status?: string; search?: string }): Promise<{
    items: any[];
    total: number;
    roles: any[];
  }> {
    const q = new URLSearchParams();
    if (params?.role) q.set('role', params.role);
    if (params?.status) q.set('status', params.status);
    if (params?.search) q.set('search', params.search);
    return this.fetchJson<{ items: any[]; total: number; roles: any[] }>(`/law-pulse/items?${q.toString()}`);
  }

  async getLawPulseRoles(): Promise<any[]> {
    return this.fetchJson<any[]>('/law-pulse/roles');
  }
}

export const apiClient = new ApiClient();




