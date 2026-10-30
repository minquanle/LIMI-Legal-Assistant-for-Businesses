import { describe, it, expect, vi } from 'vitest';

/**
 * Exercises RadarService's seeding behaviour directly against a small fixture
 * seed list, separately from radar-service.test.ts (which stubs
 * RADAR_SEED_ALERTS to `[]` so the bulk of its tests don't care about seed
 * content). This file cares specifically about what runSeed() does to rows
 * that already exist.
 */
const rows: any[] = [];

const complianceRadarAlert = {
  // Mirrors the real upsert: `update: {}` is a genuine no-op, so an existing
  // row is returned untouched — only a brand-new natural key gets `create`.
  upsert: vi.fn(async ({ where, update, create }: any) => {
    const key = where.industry_document_key;
    const idx = rows.findIndex((r) => r.industry === key.industry && r.documentNumber === key.documentNumber);
    if (idx === -1) {
      const created = { id: `seed-${rows.length}`, ...create };
      rows.push(created);
      return created;
    }
    Object.assign(rows[idx], update);
    return rows[idx];
  }),
};

vi.mock('../infrastructure/db.js', () => ({
  prisma: { complianceRadarAlert },
}));

vi.mock('../services/radar-alerts.seed.js', () => ({
  RADAR_SEED_ALERTS: [
    { industry: 'LABOR_HR', documentNumber: 'SEED-1', title: 'Seed Title 1' },
    { industry: 'FINTECH_BANKING', documentNumber: 'SEED-2', title: 'Seed Title 2' },
  ],
}));

const { RadarService } = await import('../services/radar-service.js');

describe('RadarService seeding (runSeed)', () => {
  it('creates every seed row on first run', async () => {
    await (RadarService as any).runSeed();

    expect(rows).toHaveLength(2);
    expect(rows.map((r) => r.documentNumber).sort()).toEqual(['SEED-1', 'SEED-2']);
  });

  it('never overwrites a row that already exists, even across a simulated restart', async () => {
    // Simulate an admin editing the seeded row through /admin/radar-config.
    const seeded = rows.find((r) => r.documentNumber === 'SEED-1');
    seeded.title = 'ADMIN EDITED TITLE';
    const originalId = seeded.id;

    // runSeed() called again models the server restarting and re-running the
    // seed against a database that already has this row.
    await (RadarService as any).runSeed();

    const stillThere = rows.find((r) => r.documentNumber === 'SEED-1');
    expect(stillThere.id).toBe(originalId);
    expect(stillThere.title).toBe('ADMIN EDITED TITLE');
    expect(rows).toHaveLength(2); // no duplicate row was created
  });

  it('ensureSeeded() memoises per process: a second call does not re-run the upsert loop', async () => {
    // First call actually runs the seed loop (nothing has called ensureSeeded
    // in this file yet); the count after it is the baseline.
    await RadarService.ensureSeeded();
    const callsAfterFirst = complianceRadarAlert.upsert.mock.calls.length;

    await RadarService.ensureSeeded();

    expect(complianceRadarAlert.upsert.mock.calls.length).toBe(callsAfterFirst);
  });
});
