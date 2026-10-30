import { describe, it, expect } from 'vitest';
import {
  buildChecklistCSV,
  csvCell,
  daysUntil,
  REMINDER_MILESTONE_DAYS,
  scoreGapAudit,
  severityRank,
  sortBySeverity,
  type GapQuestion,
} from '../services/radar-scoring.js';

const questions: GapQuestion[] = [
  { id: 'a', question: 'Đã nộp hồ sơ DPIA chưa?', weight: 40, remediation: 'Lập hồ sơ DPIA gửi A05' },
  { id: 'b', question: 'Đã bổ nhiệm DPO chưa?', weight: 35, remediation: 'Ban hành quyết định bổ nhiệm DPO' },
  { id: 'c', question: 'Đã kiểm kê dữ liệu chưa?', weight: 25, remediation: 'Thực hiện kiểm kê dòng chảy dữ liệu' },
];

describe('Radar severity ordering', () => {
  it('ranks CRITICAL above WARNING above INFO', () => {
    expect(severityRank('CRITICAL')).toBeLessThan(severityRank('WARNING'));
    expect(severityRank('WARNING')).toBeLessThan(severityRank('INFO'));
  });

  it('orders WARNING before INFO, which alphabetical sorting on the column gets wrong', () => {
    const sorted = sortBySeverity([
      { id: 1, severity: 'INFO' },
      { id: 2, severity: 'WARNING' },
      { id: 3, severity: 'CRITICAL' },
    ]);

    expect(sorted.map((a) => a.severity)).toEqual(['CRITICAL', 'WARNING', 'INFO']);
  });

  it('keeps the incoming order within a severity band and pushes unknown levels last', () => {
    const sorted = sortBySeverity([
      { id: 1, severity: 'WARNING' },
      { id: 2, severity: 'MYSTERY' },
      { id: 3, severity: 'WARNING' },
      { id: 4, severity: 'CRITICAL' },
    ]);

    expect(sorted.map((a) => a.id)).toEqual([4, 1, 3, 2]);
  });
});

describe('Gap audit scoring', () => {
  it('weights each answer rather than counting them equally', () => {
    // Only the 40-point question is met out of 100 total weight.
    const result = scoreGapAudit(questions, { a: true });

    expect(result.score).toBe(40);
    expect(result.compliantCount).toBe(1);
    expect(result.totalQuestions).toBe(3);
  });

  it('returns every unmet remediation and none of the met ones', () => {
    const result = scoreGapAudit(questions, { b: true });

    expect(result.urgentRemediations).toEqual([
      'Lập hồ sơ DPIA gửi A05',
      'Thực hiện kiểm kê dòng chảy dữ liệu',
    ]);
  });

  it('ignores answer keys that do not match a question', () => {
    const result = scoreGapAudit(questions, { khong_ton_tai: true, cung_khong_co: true });

    expect(result.score).toBe(0);
    expect(result.compliantCount).toBe(0);
    expect(result.tier).toBe('HIGH_RISK');
  });

  it('treats any non-true answer as not compliant', () => {
    const result = scoreGapAudit(questions, { a: undefined as any, b: 'yes' as any, c: false });

    expect(result.score).toBe(0);
    expect(result.compliantCount).toBe(0);
  });

  it('falls back to a default weight when a question declares none', () => {
    const unweighted: GapQuestion[] = [
      { id: 'x', question: 'X', weight: 0, remediation: 'Fix X' },
      { id: 'y', question: 'Y', weight: 0, remediation: 'Fix Y' },
    ];

    expect(scoreGapAudit(unweighted, { x: true }).score).toBe(50);
  });

  describe('tier thresholds', () => {
    const tierFor = (weight: number) =>
      scoreGapAudit(
        [
          { id: 'met', question: 'met', weight, remediation: 'r' },
          { id: 'unmet', question: 'unmet', weight: 100 - weight, remediation: 'r' },
        ],
        { met: true }
      );

    it('scores below 50 as HIGH_RISK', () => {
      expect(tierFor(49).tier).toBe('HIGH_RISK');
    });

    it('scores 50 to 69 as MODERATE', () => {
      expect(tierFor(50).tier).toBe('MODERATE');
      expect(tierFor(69).tier).toBe('MODERATE');
    });

    it('scores 70 to 84 as GOOD', () => {
      expect(tierFor(70).tier).toBe('GOOD');
      expect(tierFor(84).tier).toBe('GOOD');
    });

    it('scores 85 and above as EXCELLENT', () => {
      expect(tierFor(85).tier).toBe('EXCELLENT');
      expect(tierFor(90).tier).toBe('EXCELLENT');
    });
  });

  it('reports an un-assessable alert instead of a perfect score', () => {
    const result = scoreGapAudit([], { anything: true });

    expect(result.tier).toBe('NOT_APPLICABLE');
    expect(result.score).toBeNull();
    expect(result.compliantCount).toBe(0);
  });
});

describe('Checklist CSV export', () => {
  it('neutralizes values Excel would execute as a formula', () => {
    expect(csvCell('=CMD|calc!A1')).toBe('"\'=CMD|calc!A1"');
    expect(csvCell('+84 90 000 0000')).toBe('"\'+84 90 000 0000"');
    expect(csvCell('-1000000')).toBe('"\'-1000000"');
    expect(csvCell('@SUM(A1:A9)')).toBe('"\'@SUM(A1:A9)"');
  });

  it('escapes embedded quotes and leaves ordinary text alone', () => {
    expect(csvCell('Nghị định "13"')).toBe('"Nghị định ""13"""');
    expect(csvCell('Luật Đất đai 2024')).toBe('"Luật Đất đai 2024"');
  });

  it('starts with a UTF-8 BOM so Excel renders Vietnamese diacritics', () => {
    expect(buildChecklistCSV([]).startsWith('\uFEFF')).toBe(true);
  });

  it('joins list columns and fills in placeholders for missing dates', () => {
    const csv = buildChecklistCSV([
      {
        industryName: 'Lao động, Tiền lương & BHXH',
        documentNumber: '41/2024/QH15',
        title: 'Luật Bảo hiểm Xã hội 2024',
        severity: 'CRITICAL',
        effectiveDate: null,
        deadlineDate: null,
        maxPenaltyAmount: null,
        affectedAreas: ['Nhân sự', 'Pháp chế'],
        actionChecklist: ['Rà soát HĐLĐ', 'Đồng bộ VNeID'],
      },
    ]);

    const dataRow = csv.split('\r\n')[1];
    expect(dataRow).toContain('"Nhân sự; Pháp chế"');
    expect(dataRow).toContain('"Rà soát HĐLĐ | Đồng bộ VNeID"');
    expect(dataRow).toContain('"Đang cập nhật"');
    expect(dataRow).toContain('"Theo hiệu lực"');
    expect(dataRow).toContain('"Theo NĐ Xử phạt VPHC"');
  });

  it('emits a header row, one row per alert, and a trailing disclaimer', () => {
    const csv = buildChecklistCSV([
      { industryName: 'A', documentNumber: '1', title: 't', severity: 'INFO', affectedAreas: [], actionChecklist: [] },
      { industryName: 'B', documentNumber: '2', title: 't', severity: 'INFO', affectedAreas: [], actionChecklist: [] },
    ]);

    const lines = csv.split('\r\n');
    expect(lines).toHaveLength(5); // header + 2 data rows + blank separator + disclaimer
    expect(lines[3]).toBe('');
    expect(lines[4]).toContain('tư vấn pháp lý chuyên nghiệp');
  });
});

describe('Reminder day counting', () => {
  const today = new Date(2026, 7, 24); // 2026-08-24, matches the assessment's "today"

  it('counts whole calendar days regardless of time-of-day', () => {
    const morning = new Date(2026, 7, 24, 0, 5);
    const night = new Date(2026, 7, 24, 23, 55);
    expect(daysUntil(new Date(2026, 8, 1), morning)).toBe(daysUntil(new Date(2026, 8, 1), night));
  });

  it('is 0 for today, positive for the future, negative for the past', () => {
    expect(daysUntil(today, today)).toBe(0);
    expect(daysUntil(new Date(2026, 7, 31), today)).toBe(7);
    expect(daysUntil(new Date(2026, 7, 17), today)).toBe(-7);
  });

  it('matches the exact T-30/T-7/T-1 reminder milestones', () => {
    expect(REMINDER_MILESTONE_DAYS).toContain(daysUntil(new Date(2026, 8, 23), today)); // +30
    expect(REMINDER_MILESTONE_DAYS).toContain(daysUntil(new Date(2026, 7, 31), today)); // +7
    expect(REMINDER_MILESTONE_DAYS).toContain(daysUntil(new Date(2026, 7, 25), today)); // +1
  });

  it('does not match days adjacent to a milestone', () => {
    expect(REMINDER_MILESTONE_DAYS).not.toContain(daysUntil(new Date(2026, 8, 22), today)); // +29
    expect(REMINDER_MILESTONE_DAYS).not.toContain(daysUntil(new Date(2026, 8, 24), today)); // +31
    expect(REMINDER_MILESTONE_DAYS).not.toContain(daysUntil(today, today)); // 0
  });
});
