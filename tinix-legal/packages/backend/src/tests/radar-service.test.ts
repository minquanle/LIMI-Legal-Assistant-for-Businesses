import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * RadarService talks to Postgres, so the Prisma singleton is stubbed with an
 * in-memory table. That keeps the filtering, risk ordering and paging
 * behaviour under test without needing a live database.
 */
const rows: any[] = [];

const complianceRadarAlert = {
  findMany: vi.fn(async ({ where }: any = {}) => {
    let result = [...rows];
    if (where?.industry) result = result.filter((r) => r.industry === where.industry);
    if (where?.severity) result = result.filter((r) => r.severity === where.severity);
    if (where?.OR) {
      const needle = where.OR[0].title.contains.toLowerCase();
      result = result.filter((r) =>
        [r.title, r.documentNumber, r.summary].some((f: string) => (f ?? '').toLowerCase().includes(needle))
      );
    }
    // Mirrors the service's `orderBy: [{ effectiveDate: 'desc' }]`.
    return result.sort((a, b) => Number(new Date(b.effectiveDate)) - Number(new Date(a.effectiveDate)));
  }),
  findUnique: vi.fn(async ({ where }: any) => rows.find((r) => r.id === where.id) ?? null),
  // Mirrors runSeed()'s upsert-on-natural-key: creates when the key is new,
  // is a no-op (matching the real `update: {}`) when it already exists —
  // seeding never overwrites a row a test (or an admin) already put there.
  upsert: vi.fn(async ({ where, create }: any) => {
    const key = where.industry_document_key;
    const existing = rows.find((r) => r.industry === key.industry && r.documentNumber === key.documentNumber);
    if (existing) return existing;
    const created = { id: `seed-${rows.length}`, ...create };
    rows.push(created);
    return created;
  }),
};

const auditResults: any[] = [];
const complianceAuditResult = {
  create: vi.fn(async ({ data }: any) => {
    const row = { id: `audit-${auditResults.length}`, createdAt: new Date(), ...data };
    auditResults.push(row);
    return row;
  }),
  findMany: vi.fn(async ({ where }: any = {}) => {
    return auditResults
      .filter((r) => (!where?.alertId || r.alertId === where.alertId) && (!where?.userId || r.userId === where.userId))
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }),
};

const checklistProgress: any[] = [];
const complianceChecklistProgress = {
  upsert: vi.fn(async ({ where }: any) => {
    const key = where.userId_alertId_actionIndex;
    const existing = checklistProgress.find(
      (r) => r.userId === key.userId && r.alertId === key.alertId && r.actionIndex === key.actionIndex
    );
    if (existing) return existing;
    const created = { userId: key.userId, alertId: key.alertId, actionIndex: key.actionIndex, completedAt: new Date() };
    checklistProgress.push(created);
    return created;
  }),
  deleteMany: vi.fn(async ({ where }: any) => {
    const before = checklistProgress.length;
    for (let i = checklistProgress.length - 1; i >= 0; i--) {
      const r = checklistProgress[i];
      if (r.userId === where.userId && r.alertId === where.alertId && r.actionIndex === where.actionIndex) {
        checklistProgress.splice(i, 1);
      }
    }
    return { count: before - checklistProgress.length };
  }),
  findMany: vi.fn(async ({ where }: any = {}) => checklistProgress.filter((r) => r.userId === where.userId)),
};

const industrySubscriptions: any[] = [];
const radarIndustrySubscription = {
  upsert: vi.fn(async ({ where, create }: any) => {
    const key = where.userId_industry;
    const existing = industrySubscriptions.find((r) => r.userId === key.userId && r.industry === key.industry);
    if (existing) return existing;
    const created = { ...create };
    industrySubscriptions.push(created);
    return created;
  }),
  deleteMany: vi.fn(async ({ where }: any) => {
    const before = industrySubscriptions.length;
    for (let i = industrySubscriptions.length - 1; i >= 0; i--) {
      const r = industrySubscriptions[i];
      if (r.userId === where.userId && r.industry === where.industry) industrySubscriptions.splice(i, 1);
    }
    return { count: before - industrySubscriptions.length };
  }),
  findMany: vi.fn(async ({ where }: any = {}) =>
    industrySubscriptions.filter((r) => (where.userId ? r.userId === where.userId : r.industry === where.industry))
  ),
};

vi.mock('../infrastructure/db.js', () => ({
  prisma: { complianceRadarAlert, complianceAuditResult, complianceChecklistProgress, radarIndustrySubscription },
}));

vi.mock('../services/radar-alerts.seed.js', () => ({
  // Seeding is exercised directly in the "seeding" describe block below with
  // its own fixtures; every other test only cares that ensureSeeded()
  // resolves, so the bundled seed list is irrelevant noise here.
  RADAR_SEED_ALERTS: [],
}));

const { RadarService } = await import('../services/radar-service.js');

function alert(overrides: Partial<any> = {}) {
  return {
    id: overrides.id ?? 'id-1',
    industry: 'LABOR_HR',
    industryName: 'Lao động',
    documentNumber: '41/2024/QH15',
    title: 'Luật BHXH 2024',
    summary: 'Tóm tắt',
    severity: 'WARNING',
    effectiveDate: new Date('2025-01-01'),
    deadlineDate: null,
    maxPenaltyAmount: null,
    affectedAreas: [],
    actionChecklist: [],
    gapQuestions: [],
    ...overrides,
  };
}

beforeEach(() => {
  rows.length = 0;
  auditResults.length = 0;
  checklistProgress.length = 0;
  industrySubscriptions.length = 0;
});

describe('RadarService.getAlerts', () => {
  it('returns alerts in risk order, not the alphabetical order of the column', async () => {
    rows.push(
      alert({ id: 'info', severity: 'INFO', effectiveDate: new Date('2025-06-01') }),
      alert({ id: 'warn', severity: 'WARNING', effectiveDate: new Date('2025-05-01') }),
      alert({ id: 'crit', severity: 'CRITICAL', effectiveDate: new Date('2025-04-01') })
    );

    const { alerts } = await RadarService.getAlerts({});

    expect(alerts.map((a: any) => a.id)).toEqual(['crit', 'warn', 'info']);
  });

  it('keeps newest-first ordering inside a severity band', async () => {
    rows.push(
      alert({ id: 'older', severity: 'CRITICAL', effectiveDate: new Date('2024-01-01') }),
      alert({ id: 'newer', severity: 'CRITICAL', effectiveDate: new Date('2026-01-01') })
    );

    const { alerts } = await RadarService.getAlerts({});

    expect(alerts.map((a: any) => a.id)).toEqual(['newer', 'older']);
  });

  it('pages the result set while reporting the unpaged total', async () => {
    rows.push(
      alert({ id: 'a', severity: 'CRITICAL' }),
      alert({ id: 'b', severity: 'WARNING' }),
      alert({ id: 'c', severity: 'INFO' })
    );

    const firstPage = await RadarService.getAlerts({ limit: 2, offset: 0 });
    expect(firstPage.alerts.map((a: any) => a.id)).toEqual(['a', 'b']);
    expect(firstPage.total).toBe(3);

    const secondPage = await RadarService.getAlerts({ limit: 2, offset: 2 });
    expect(secondPage.alerts.map((a: any) => a.id)).toEqual(['c']);
    expect(secondPage.total).toBe(3);
  });

  it('treats ALL as no filter for industry and severity', async () => {
    rows.push(alert({ id: 'a', severity: 'CRITICAL' }), alert({ id: 'b', industry: 'FINTECH_BANKING' }));

    const { alerts } = await RadarService.getAlerts({ industry: 'ALL', severity: 'ALL' });

    expect(alerts).toHaveLength(2);
  });
});

describe('RadarService.evaluateGapAudit', () => {
  it('returns null for an unknown alert so the route can answer 404', async () => {
    expect(await RadarService.evaluateGapAudit('missing', {})).toBeNull();
  });

  it('scores the alert questionnaire and echoes the alert id', async () => {
    rows.push(
      alert({
        id: 'audit-me',
        gapQuestions: [
          { id: 'q1', question: 'Q1', weight: 70, remediation: 'Fix 1' },
          { id: 'q2', question: 'Q2', weight: 30, remediation: 'Fix 2' },
        ],
      })
    );

    const result: any = await RadarService.evaluateGapAudit('audit-me', { q1: true });

    expect(result.alertId).toBe('audit-me');
    expect(result.score).toBe(70);
    expect(result.tier).toBe('GOOD');
    expect(result.urgentRemediations).toEqual(['Fix 2']);
  });

  it('does not let unknown answer keys inflate the score', async () => {
    rows.push(
      alert({ id: 'strict', gapQuestions: [{ id: 'real', question: 'R', weight: 50, remediation: 'Fix' }] })
    );

    const result: any = await RadarService.evaluateGapAudit('strict', { fake: true, alsoFake: true });

    expect(result.score).toBe(0);
    expect(result.compliantCount).toBe(0);
  });
});

describe('RadarService.generateChecklistCSV', () => {
  it('applies the free-text search to the exported rows', async () => {
    rows.push(
      alert({ id: 'a', documentNumber: '41/2024/QH15', title: 'Luật BHXH 2024' }),
      alert({ id: 'b', documentNumber: '31/2024/QH15', title: 'Luật Đất đai 2024' })
    );

    const csv = await RadarService.generateChecklistCSV(undefined, undefined, 'Đất đai');
    const lines = csv.split('\r\n');

    expect(lines).toHaveLength(4); // header + one match + blank separator + disclaimer
    expect(lines[1]).toContain('31/2024/QH15');
  });
});

describe('RadarService audit history persistence', () => {
  it('does not persist anything when no userId is supplied', async () => {
    rows.push(alert({ id: 'a', gapQuestions: [{ id: 'q', question: 'Q', weight: 100, remediation: 'r' }] }));

    await RadarService.evaluateGapAudit('a', { q: true });

    expect(await RadarService.getAuditHistory('a', 'anyone')).toEqual([]);
  });

  it('persists a scored run under the given userId and returns it in history, oldest first', async () => {
    rows.push(alert({ id: 'a', gapQuestions: [{ id: 'q', question: 'Q', weight: 100, remediation: 'r' }] }));

    await RadarService.evaluateGapAudit('a', { q: false }, 'user-1');
    await RadarService.evaluateGapAudit('a', { q: true }, 'user-1');

    const history = await RadarService.getAuditHistory('a', 'user-1');
    expect(history.map((h: any) => h.score)).toEqual([0, 100]);
  });

  it('keeps each user’s history separate', async () => {
    rows.push(alert({ id: 'a', gapQuestions: [{ id: 'q', question: 'Q', weight: 100, remediation: 'r' }] }));

    await RadarService.evaluateGapAudit('a', { q: true }, 'user-1');
    await RadarService.evaluateGapAudit('a', { q: false }, 'user-2');

    expect(await RadarService.getAuditHistory('a', 'user-1')).toHaveLength(1);
    expect(await RadarService.getAuditHistory('a', 'user-2')).toHaveLength(1);
  });
});

describe('RadarService checklist progress', () => {
  it('marks an item completed and reports it in the user’s progress map', async () => {
    await RadarService.setChecklistItemCompleted('alert-1', 0, 'user-1', true);

    const progress = await RadarService.getChecklistProgress('user-1');
    expect(progress).toEqual({ 'alert-1_0': true });
  });

  it('un-marks an item by deleting its progress row', async () => {
    await RadarService.setChecklistItemCompleted('alert-1', 0, 'user-1', true);
    await RadarService.setChecklistItemCompleted('alert-1', 0, 'user-1', false);

    expect(await RadarService.getChecklistProgress('user-1')).toEqual({});
  });

  it('marking the same item completed twice does not error or duplicate', async () => {
    await RadarService.setChecklistItemCompleted('alert-1', 0, 'user-1', true);
    await RadarService.setChecklistItemCompleted('alert-1', 0, 'user-1', true);

    expect(await RadarService.getChecklistProgress('user-1')).toEqual({ 'alert-1_0': true });
  });

  it('keeps progress separate per user', async () => {
    await RadarService.setChecklistItemCompleted('alert-1', 0, 'user-1', true);

    expect(await RadarService.getChecklistProgress('user-2')).toEqual({});
  });
});

describe('RadarService industry subscriptions', () => {
  it('rejects an unknown industry', async () => {
    await expect(RadarService.subscribeToIndustry('user-1', 'NOT_REAL')).rejects.toThrow('Ngành không hợp lệ');
  });

  it('subscribes and lists the industry back for that user', async () => {
    await RadarService.subscribeToIndustry('user-1', 'LABOR_HR');

    expect(await RadarService.getSubscribedIndustries('user-1')).toEqual(['LABOR_HR']);
  });

  it('subscribing twice does not duplicate', async () => {
    await RadarService.subscribeToIndustry('user-1', 'LABOR_HR');
    await RadarService.subscribeToIndustry('user-1', 'LABOR_HR');

    expect(await RadarService.getSubscribedIndustries('user-1')).toEqual(['LABOR_HR']);
  });

  it('unsubscribing removes the subscription', async () => {
    await RadarService.subscribeToIndustry('user-1', 'LABOR_HR');
    await RadarService.unsubscribeFromIndustry('user-1', 'LABOR_HR');

    expect(await RadarService.getSubscribedIndustries('user-1')).toEqual([]);
  });

  it('getIndustrySubscribers finds every user subscribed to that industry, not other industries', async () => {
    await RadarService.subscribeToIndustry('user-1', 'LABOR_HR');
    await RadarService.subscribeToIndustry('user-2', 'LABOR_HR');
    await RadarService.subscribeToIndustry('user-3', 'FINTECH_BANKING');

    const subscribers = await RadarService.getIndustrySubscribers('LABOR_HR');
    expect(subscribers.sort()).toEqual(['user-1', 'user-2']);
  });
});
