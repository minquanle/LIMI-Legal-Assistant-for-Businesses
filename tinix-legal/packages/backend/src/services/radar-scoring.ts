/**
 * Pure compliance-radar logic: risk ordering, gap-audit scoring and CSV
 * rendering. Kept free of database imports so the rules can be exercised
 * directly in tests.
 */

export interface GapQuestion {
  id: string;
  question: string;
  weight: number;
  remediation: string;
}

export type ComplianceTier = 'NOT_APPLICABLE' | 'HIGH_RISK' | 'MODERATE' | 'GOOD' | 'EXCELLENT';

/**
 * Whole calendar days from `from` to `date`, ignoring time-of-day — so a
 * deadline of "today at 00:00" and a run at "today at 23:00" both count as 0
 * days away, not a fraction. Negative when `date` is in the past.
 */
export function daysUntil(date: Date, from: Date = new Date()): number {
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((startOfDay(date).getTime() - startOfDay(from).getTime()) / msPerDay);
}

/** The T-30/T-7/T-1 reminder milestones RadarReminderCron fires notifications at. */
export const REMINDER_MILESTONE_DAYS = [30, 7, 1] as const;
export type ReminderMilestoneDays = (typeof REMINDER_MILESTONE_DAYS)[number];

export interface GapAuditScore {
  score: number | null;
  tier: ComplianceTier;
  urgentRemediations: string[];
  compliantCount: number;
  totalQuestions: number;
}

/** Weight applied when a question does not declare one. */
export const DEFAULT_QUESTION_WEIGHT = 10;

/**
 * Risk ranking of the severity levels. `severity` is stored as a string, so
 * ordering by the column sorts alphabetically (CRITICAL < INFO < WARNING) and
 * floats INFO above WARNING. Sorting by this rank keeps the list in true risk
 * order instead.
 */
const SEVERITY_RANK: Record<string, number> = {
  CRITICAL: 0,
  WARNING: 1,
  INFO: 2,
};

export function severityRank(severity: string | null | undefined): number {
  return SEVERITY_RANK[severity ?? ''] ?? 99;
}

/**
 * Orders alerts by real risk, leaving the caller's secondary ordering (newest
 * effective date first) intact within each severity band.
 */
export function sortBySeverity<T extends { severity?: string | null }>(alerts: T[]): T[] {
  return [...alerts].sort((a, b) => severityRank(a.severity) - severityRank(b.severity));
}

/**
 * Scores a gap self-audit from the questionnaire attached to an alert.
 *
 * Only answers whose key matches a real question are counted: the payload is
 * client supplied, so unknown keys must not inflate the compliant tally.
 */
export function scoreGapAudit(questions: GapQuestion[], answers: Record<string, boolean>): GapAuditScore {
  // An alert with no questionnaire has not been assessed at all — reporting a
  // perfect score for it would read as "compliant" in the UI.
  if (questions.length === 0) {
    return {
      score: null,
      tier: 'NOT_APPLICABLE',
      urgentRemediations: [],
      compliantCount: 0,
      totalQuestions: 0,
    };
  }

  let totalWeight = 0;
  let compliantWeight = 0;
  let compliantCount = 0;
  const urgentRemediations: string[] = [];

  for (const q of questions) {
    const weight = q.weight || DEFAULT_QUESTION_WEIGHT;
    totalWeight += weight;

    if (answers[q.id] === true) {
      compliantWeight += weight;
      compliantCount += 1;
    } else {
      urgentRemediations.push(q.remediation || `Cần hoàn tất yêu cầu: ${q.question}`);
    }
  }

  const score = Math.round((compliantWeight / (totalWeight || 1)) * 100);

  let tier: ComplianceTier = 'EXCELLENT';
  if (score < 50) tier = 'HIGH_RISK';
  else if (score < 70) tier = 'MODERATE';
  else if (score < 85) tier = 'GOOD';

  return { score, tier, urgentRemediations, compliantCount, totalQuestions: questions.length };
}

/**
 * Quotes a CSV cell and neutralizes formula injection: a value starting with
 * =, +, -, or @ is interpreted as a formula by Excel/Sheets when the file is
 * opened, so such values are prefixed with a leading apostrophe (a standard
 * CSV-injection mitigation) before quoting.
 */
export function csvCell(value: string): string {
  const str = String(value ?? '');
  const escaped = str.replace(/"/g, '""');
  const neutralized = /^[=+\-@]/.test(escaped) ? `'${escaped}` : escaped;
  return `"${neutralized}"`;
}

/** Byte-order mark so Excel detects UTF-8 and renders Vietnamese diacritics. */
const UTF8_BOM = '\uFEFF';

const CSV_HEADERS = [
  'Ngành kinh tế',
  'Số hiệu văn bản',
  'Tiêu đề quy định',
  'Cấp độ rủi ro',
  'Ngày có hiệu lực',
  'Hạn chót tuân thủ',
  'Mức phạt tối đa',
  'Phòng ban phụ trách',
  'Danh mục hành động bắt buộc',
];

export const LEGAL_DISCLAIMER =
  'Thông tin trên mang tính chất tham khảo, không thay thế tư vấn pháp lý chuyên nghiệp. Vui lòng đối chiếu văn bản gốc và tham vấn chuyên gia pháp lý trước khi ra quyết định.';

/**
 * Renders the compliance action plan as CSV. A UTF-8 BOM is prepended so Excel
 * opens Vietnamese diacritics correctly.
 */
export function buildChecklistCSV(alerts: any[]): string {
  const rows = alerts.map((a: any) => {
    const depts = Array.isArray(a.affectedAreas) ? a.affectedAreas.join('; ') : '';
    const actions = Array.isArray(a.actionChecklist) ? a.actionChecklist.join(' | ') : '';
    return [
      csvCell(a.industryName || a.industry),
      csvCell(a.documentNumber),
      csvCell(a.title || ''),
      csvCell(a.severity),
      csvCell(a.effectiveDate ? new Date(a.effectiveDate).toLocaleDateString('vi-VN') : 'Đang cập nhật'),
      csvCell(a.deadlineDate ? new Date(a.deadlineDate).toLocaleDateString('vi-VN') : 'Theo hiệu lực'),
      csvCell(a.maxPenaltyAmount || 'Theo NĐ Xử phạt VPHC'),
      csvCell(depts),
      csvCell(actions),
    ].join(',');
  });

  return UTF8_BOM + [CSV_HEADERS.join(','), ...rows, '', csvCell(LEGAL_DISCLAIMER)].join('\r\n');
}
