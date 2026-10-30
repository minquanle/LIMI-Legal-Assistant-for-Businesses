import { prisma } from '../infrastructure/db.js';
import { buildChecklistCSV, scoreGapAudit, sortBySeverity, type GapQuestion } from './radar-scoring.js';
import { RADAR_SEED_ALERTS } from './radar-alerts.seed.js';

/**
 * Editable fields for admin create/update of a ComplianceRadarAlert. All
 * fields are required on create; the admin form always submits the full
 * record rather than a sparse patch, so update() takes the same shape.
 */
export interface AdminAlertInput {
  industry: string;
  documentId?: string | null;
  documentNumber: string;
  title: string;
  promulgationDate?: Date | string | null;
  effectiveDate?: Date | string | null;
  severity: string;
  summary: string;
  financialImpact?: string | null;
  operationalImpact?: string | null;
  hrImpact?: string | null;
  penaltyReference?: string | null;
  maxPenaltyAmount?: string | null;
  gapQuestions?: GapQuestion[];
  affectedAreas?: string[];
  actionChecklist?: string[];
  deadlineDate?: Date | string | null;
  sourceUrl?: string | null;
}

export interface IndustryDefinition {
  id: string;
  name: string;
  icon: string;
  description: string;
  keywords: string[];
}

export const INDUSTRIES: IndustryDefinition[] = [
  {
    id: 'FINTECH_BANKING',
    name: 'Ngân hàng, Chứng khoán & Fintech',
    icon: 'credit-card',
    description: 'Thanh toán không dùng tiền mặt, định danh điện tử eKYC, tín dụng và phòng chống rửa tiền.',
    keywords: ['ngân hàng', 'tín dụng', 'thanh toán', 'tiền tệ', 'ví điện tử', 'fintech', 'rửa tiền', 'chứng khoán'],
  },
  {
    id: 'ECOMMERCE_DIGITAL',
    name: 'Thương mại điện tử & Dịch vụ số',
    icon: 'globe',
    description: 'Bán hàng trực tuyến, sàn TMĐT, thuế số, bảo mật giao dịch trực tuyến và quảng cáo số.',
    keywords: ['thương mại điện tử', 'sàn giao dịch', 'kinh tế số', 'dịch vụ số', 'internet', 'quảng cáo trực tuyến'],
  },
  {
    id: 'REAL_ESTATE_CONSTRUCTION',
    name: 'Bất động sản & Xây dựng',
    icon: 'hard-hat',
    description: 'Luật Đất đai 2024, định giá đất hàng năm, cấp sổ đỏ, quy hoạch xây dựng, condotel và nhà ở xã hội.',
    keywords: ['đất đai', 'bất động sản', 'xây dựng', 'nhà ở', 'quy hoạch', 'giá đất', 'sổ đỏ', 'chủ đầu tư'],
  },
  {
    id: 'LABOR_HR',
    name: 'Lao động, Tiền lương & BHXH',
    icon: 'users',
    description: 'Hợp đồng lao động, tiền lương tối thiểu, Luật BHXH 2024 (giảm 15 năm đóng), an toàn lao động.',
    keywords: ['lao động', 'bảo hiểm xã hội', 'tiền lương', 'thử việc', 'công đoàn', 'thất nghiệp', 'người lao động'],
  },
  {
    id: 'MANUFACTURING_IMPORT_EXPORT',
    name: 'Sản xuất, Hải quan & Xuất nhập khẩu',
    icon: 'ship',
    description: 'Thủ tục hải quan điện tử, thuế xuất nhập khẩu, tiêu chuẩn C/O, kiểm tra chuyên ngành.',
    keywords: ['hải quan', 'xuất khẩu', 'nhập khẩu', 'hàng hóa', 'thuế xuất', 'cảng biển', 'c/o', 'sản xuất'],
  },
  {
    id: 'HEALTHCARE_PHARMA',
    name: 'Y tế, Dược phẩm & Mỹ phẩm',
    icon: 'pill',
    description: 'Đăng ký lưu hành thuốc (TT 12/2025), thiết bị y tế, thực phẩm bảo vệ sức khỏe, mỹ phẩm.',
    keywords: ['dược', 'thuốc', 'y tế', 'bệnh viện', 'khám bệnh', 'mỹ phẩm', 'thực phẩm chức năng', 'thiết bị y tế'],
  },
  {
    id: 'ENERGY_GREEN_TRANSITION',
    name: 'Năng lượng, Tín chỉ Carbon & ESG',
    icon: 'zap',
    description: 'Cơ chế mua bán điện trực tiếp DPPA, kiểm kê phát thải nhà kính, thị trường tín chỉ carbon, tiêu chuẩn ESG.',
    keywords: ['năng lượng', 'điện lực', 'carbon', 'phát thải', 'esg', 'môi trường', 'dppa', 'năng lượng tái tạo'],
  },
  {
    id: 'LOGISTICS_TRANSPORT',
    name: 'Logistics, Kho bãi & Vận tải',
    icon: 'truck',
    description: 'Giấy phép vận tải hàng hóa đường bộ/đường sắt (TT 33/2025), cảng cạn ICD, chuỗi cung ứng lạnh.',
    keywords: ['vận tải', 'logistics', 'kho bãi', 'xe tải', 'đường sắt', 'giao thông', 'chuỗi cung ứng'],
  },
  {
    id: 'EDUCATION_TRAINING',
    name: 'Giáo dục, Đào tạo & EdTech',
    icon: 'graduation-cap',
    description: 'Cấp phép trung tâm đào tạo, liên kết quốc tế, dạy học trực tuyến và chứng chỉ nghề nghiệp.',
    keywords: ['giáo dục', 'đào tạo', 'trường học', 'edtech', 'dạy thêm', 'chứng chỉ', 'đại học'],
  },
  {
    id: 'DATA_PRIVACY_CYBERSECURITY',
    name: 'Bảo vệ Dữ liệu Cá nhân & An ninh mạng',
    icon: 'shield-check',
    description: 'Nghị định 13/2023/NĐ-CP, hồ sơ đánh giá tác động DPIA, bổ nhiệm DPO, chế tài phạt an ninh mạng.',
    keywords: ['dữ liệu cá nhân', 'an ninh mạng', 'nghị định 13', 'dpia', 'dpo', 'bảo mật', 'thông tin cá nhân'],
  },
];

export class RadarService {
  /**
   * Retrieves active compliance alerts filtered by industry and severity,
   * ordered by real risk (CRITICAL → WARNING → INFO), then by newest
   * effective date. `limit`/`offset` page the result set.
   */
  static async getAlerts(filters: {
    industry?: string;
    severity?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }) {
    await this.ensureSeeded();

    const where: any = {};
    if (filters.industry && filters.industry !== 'ALL') {
      where.industry = filters.industry;
    }
    if (filters.severity && filters.severity !== 'ALL') {
      where.severity = filters.severity;
    }
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { documentNumber: { contains: filters.search, mode: 'insensitive' } },
        { summary: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    // Severity is not stored as an ordered type, so risk ordering is applied
    // after the query. The curated alert table is small (tens of rows), so the
    // full filtered set is fetched and then paged rather than paging in SQL on
    // an order the database cannot express.
    const found: any[] = await (prisma as any).complianceRadarAlert.findMany({
      where,
      orderBy: [{ effectiveDate: 'desc' }],
    });

    const matched = sortBySeverity(found);

    const offset = Math.max(0, filters.offset ?? 0);
    const limit = filters.limit != null ? Math.max(0, filters.limit) : undefined;
    const alerts = limit != null ? matched.slice(offset, offset + limit) : matched.slice(offset);

    return { alerts, total: matched.length };
  }

  /**
   * Evaluates interactive compliance gap questionnaire for a specific alert.
   */
  static async evaluateGapAudit(alertId: string, answers: Record<string, boolean>, userId?: string) {
    // A deep-linked audit request may be the first request the server ever
    // sees (no prior call to /industries or /stats), in which case the alert
    // table would still be empty and this would always 404.
    await this.ensureSeeded();
    const alert = await (prisma as any).complianceRadarAlert.findUnique({
      where: { id: alertId },
    });

    if (!alert) return null;

    const questions: GapQuestion[] = Array.isArray(alert.gapQuestions) ? alert.gapQuestions : [];
    const result = scoreGapAudit(questions, answers);

    // Persisting is opt-in on the presence of a client id: an anonymous caller
    // (no userId sent) still gets a score back, it just isn't recorded.
    if (userId) {
      await (prisma as any).complianceAuditResult.create({
        data: {
          userId,
          alertId,
          score: result.score,
          tier: result.tier,
          answers,
          compliantCount: result.compliantCount,
          totalQuestions: result.totalQuestions,
        },
      });
    }

    return { alertId, ...result };
  }

  /**
   * Score history for one user's self-audits of a given alert, oldest first —
   * feeds the readiness-trend chart in the audit modal.
   */
  static async getAuditHistory(alertId: string, userId: string) {
    return (prisma as any).complianceAuditResult.findMany({
      where: { alertId, userId },
      orderBy: { createdAt: 'asc' },
      select: { id: true, score: true, tier: true, compliantCount: true, totalQuestions: true, createdAt: true },
    });
  }

  /**
   * Flips one checklist item's completion for a user. Idempotent creation via
   * upsert on the natural key means double-clicking "done" doesn't error, and
   * unchecking simply deletes the progress row (its mere existence is the
   * "done" signal — there's no boolean column to flip).
   */
  static async setChecklistItemCompleted(alertId: string, actionIndex: number, userId: string, completed: boolean) {
    if (completed) {
      await (prisma as any).complianceChecklistProgress.upsert({
        where: { userId_alertId_actionIndex: { userId, alertId, actionIndex } },
        update: {},
        create: { userId, alertId, actionIndex },
      });
    } else {
      await (prisma as any).complianceChecklistProgress.deleteMany({
        where: { userId, alertId, actionIndex },
      });
    }
  }

  /**
   * All of one user's completed checklist items across every alert, shaped as
   * `${alertId}_${actionIndex} -> true` to drop straight into frontend state.
   */
  static async getChecklistProgress(userId: string): Promise<Record<string, boolean>> {
    const rows: Array<{ alertId: string; actionIndex: number }> = await (prisma as any).complianceChecklistProgress.findMany({
      where: { userId },
      select: { alertId: true, actionIndex: true },
    });
    const map: Record<string, boolean> = {};
    for (const row of rows) {
      map[`${row.alertId}_${row.actionIndex}`] = true;
    }
    return map;
  }

  /** Subscribes a user to deadline reminders for one industry. Idempotent. */
  static async subscribeToIndustry(userId: string, industry: string) {
    if (!INDUSTRIES.some((ind) => ind.id === industry)) {
      throw new Error(`Ngành không hợp lệ: ${industry}`);
    }
    return (prisma as any).radarIndustrySubscription.upsert({
      where: { userId_industry: { userId, industry } },
      update: {},
      create: { userId, industry },
    });
  }

  static async unsubscribeFromIndustry(userId: string, industry: string) {
    await (prisma as any).radarIndustrySubscription.deleteMany({ where: { userId, industry } });
  }

  /** Every industry id a user is currently subscribed to. */
  static async getSubscribedIndustries(userId: string): Promise<string[]> {
    const rows: Array<{ industry: string }> = await (prisma as any).radarIndustrySubscription.findMany({
      where: { userId },
      select: { industry: true },
    });
    return rows.map((r) => r.industry);
  }

  /** Every userId subscribed to reminders for one industry. Used by RadarReminderCron. */
  static async getIndustrySubscribers(industry: string): Promise<string[]> {
    const rows: Array<{ userId: string }> = await (prisma as any).radarIndustrySubscription.findMany({
      where: { industry },
      select: { userId: true },
    });
    return rows.map((r) => r.userId);
  }

  /** Every alert that has a deadlineDate set, for the reminder cron to scan. */
  static async getAlertsWithDeadlines() {
    return (prisma as any).complianceRadarAlert.findMany({
      where: { deadlineDate: { not: null } },
      select: { id: true, industry: true, documentNumber: true, title: true, documentId: true, deadlineDate: true },
    });
  }

  /**
   * Generates formatted CSV content for downloading the action plan.
   */
  static async generateChecklistCSV(industry?: string, severity?: string, search?: string): Promise<string> {
    // The export mirrors exactly what the user is looking at, so it honours the
    // free-text search alongside the industry and severity filters.
    const { alerts } = await this.getAlerts({ industry, severity, search });
    return buildChecklistCSV(alerts);
  }

  /**
   * Seed curated 2024–2026 regulations across 10 industries if not yet updated.
   *
   * Callers run on every request, so the work is memoised per process: the
   * first caller's promise is shared with everyone else and the database is
   * only probed once. A failure clears the cache so the next request retries
   * instead of inheriting a rejected promise forever.
   */
  static async ensureSeeded(): Promise<void> {
    if (!this.seedPromise) {
      this.seedPromise = this.runSeed().catch((err) => {
        this.seedPromise = null;
        throw err;
      });
    }
    return this.seedPromise;
  }

  private static seedPromise: Promise<void> | null = null;

  private static async runSeed(): Promise<void> {
    // Each seed row is upserted on its natural key (industry + documentNumber)
    // with an empty `update`, so this only ever *creates* rows that are
    // missing — it never touches a row that already exists. That matters
    // because the same alert an admin edited through /admin/radar-config
    // keeps that edit across restarts instead of being reset back to the
    // bundled seed content on every reseed.
    for (const alert of RADAR_SEED_ALERTS) {
      await (prisma as any).complianceRadarAlert.upsert({
        where: { industry_document_key: { industry: alert.industry, documentNumber: alert.documentNumber } },
        update: {},
        create: alert,
      });
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // Admin CRUD — /api/admin/radar-alerts (requireAdminAuth). Separate from
  // the public getAlerts()/ensureSeeded() path above: admins see every row
  // unfiltered and unpaged, and writes here are what /admin/radar-config
  // edits persist.
  // ─────────────────────────────────────────────────────────────────

  private static readonly VALID_SEVERITIES = ['CRITICAL', 'WARNING', 'INFO'];

  /**
   * Validates the caller-supplied fields of an admin create/update payload.
   * Returns an error message, or null when the input is acceptable.
   */
  private static async validateAdminAlertInput(data: AdminAlertInput): Promise<string | null> {
    if (!data.industry || !INDUSTRIES.some((ind) => ind.id === data.industry)) {
      return `Ngành không hợp lệ: ${data.industry}`;
    }
    if (!data.severity || !this.VALID_SEVERITIES.includes(data.severity)) {
      return `Mức độ rủi ro không hợp lệ: ${data.severity}`;
    }
    if (!data.documentNumber?.trim()) {
      return 'Số hiệu văn bản là bắt buộc';
    }
    if (!data.title?.trim()) {
      return 'Tiêu đề quy định là bắt buộc';
    }
    if (!data.summary?.trim()) {
      return 'Tóm tắt tác động là bắt buộc';
    }
    if (data.documentId) {
      const doc = await (prisma as any).canonicalDocument.findUnique({ where: { id: data.documentId } });
      if (!doc) return `Không tìm thấy văn bản liên kết với id: ${data.documentId}`;
    }
    return null;
  }

  /** Lists every alert, unfiltered, newest first — for the admin table. */
  static async adminListAlerts() {
    return (prisma as any).complianceRadarAlert.findMany({ orderBy: { createdAt: 'desc' } });
  }

  static async adminGetAlert(id: string) {
    return (prisma as any).complianceRadarAlert.findUnique({ where: { id } });
  }

  /** Creates an alert. Throws with a Vietnamese message when validation fails. */
  static async adminCreateAlert(data: AdminAlertInput) {
    const validationError = await this.validateAdminAlertInput(data);
    if (validationError) throw new Error(validationError);

    const industryName = INDUSTRIES.find((ind) => ind.id === data.industry)?.name ?? data.industry;

    return (prisma as any).complianceRadarAlert.create({
      data: { ...data, industryName },
    });
  }

  /** Updates an alert. Throws with a Vietnamese message when validation fails. */
  static async adminUpdateAlert(id: string, data: AdminAlertInput) {
    const validationError = await this.validateAdminAlertInput(data);
    if (validationError) throw new Error(validationError);

    const industryName = INDUSTRIES.find((ind) => ind.id === data.industry)?.name ?? data.industry;

    return (prisma as any).complianceRadarAlert.update({
      where: { id },
      data: { ...data, industryName },
    });
  }

  static async adminDeleteAlert(id: string) {
    return (prisma as any).complianceRadarAlert.delete({ where: { id } });
  }
}
