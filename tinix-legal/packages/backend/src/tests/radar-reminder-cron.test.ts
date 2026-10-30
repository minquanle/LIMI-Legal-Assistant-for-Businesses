import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * Exercises RadarReminderCron.runOnce() against stubbed RadarService,
 * NotificationService and prisma.userNotification (used directly for the
 * existence check), rather than the real database.
 */
const today = new Date(2026, 7, 24); // matches the T-30/T-7/T-1 fixture dates below

function alertWithDeadline(overrides: Partial<any> = {}) {
  return {
    id: 'alert-1',
    industry: 'LABOR_HR',
    documentNumber: '41/2024/QH15',
    title: 'Luật BHXH 2024',
    documentId: null,
    deadlineDate: new Date(2026, 7, 31), // +7 days from `today`
    ...overrides,
  };
}

const getAlertsWithDeadlines = vi.fn(async () => [alertWithDeadline()]);
const getIndustrySubscribers = vi.fn(async (_industry: string) => ['user-1']);

vi.mock('../services/radar-service.js', () => ({
  RadarService: { getAlertsWithDeadlines, getIndustrySubscribers },
  INDUSTRIES: [{ id: 'LABOR_HR', name: 'Lao động, Tiền lương & BHXH' }],
}));

const createNotification = vi.fn(async (data: any) => data);
vi.mock('../services/notification-service.js', () => ({
  NotificationService: { createNotification },
}));

const existingNotifications: any[] = [];
const userNotification = {
  findFirst: vi.fn(async ({ where }: any) =>
    existingNotifications.find((n) => n.userId === where.userId && n.type === where.type && n.title === where.title) ?? null
  ),
};
vi.mock('../infrastructure/db.js', () => ({
  prisma: { userNotification },
}));

// A real system clock would make this test's T-30/T-7/T-1 fixtures flaky
// (they'd stop matching the day after this code was written), so `Date` is
// pinned to a fixed "today" for the duration of the suite.
vi.useFakeTimers();
vi.setSystemTime(today);

const { RadarReminderCron } = await import('../application/RadarReminderCron.js');

beforeEach(() => {
  getAlertsWithDeadlines.mockClear();
  getIndustrySubscribers.mockClear();
  createNotification.mockClear();
  existingNotifications.length = 0;
  getAlertsWithDeadlines.mockResolvedValue([alertWithDeadline()]);
  getIndustrySubscribers.mockResolvedValue(['user-1']);
});

describe('RadarReminderCron.runOnce', () => {
  it('notifies a subscriber when a deadline is exactly 7 days away', async () => {
    const result = await RadarReminderCron.runOnce();

    expect(result.notified).toBe(1);
    expect(createNotification).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-1', type: 'RADAR_DEADLINE_T7' })
    );
  });

  it('does not notify when the deadline is not on a T-30/T-7/T-1 milestone', async () => {
    getAlertsWithDeadlines.mockResolvedValue([alertWithDeadline({ deadlineDate: new Date(2026, 8, 2) })]); // +9 days

    const result = await RadarReminderCron.runOnce();

    expect(result.notified).toBe(0);
    expect(createNotification).not.toHaveBeenCalled();
  });

  it('does not notify when nobody is subscribed to the alert’s industry', async () => {
    getIndustrySubscribers.mockResolvedValue([]);

    const result = await RadarReminderCron.runOnce();

    expect(result.notified).toBe(0);
  });

  it('is idempotent: a second run on the same day sends nothing new', async () => {
    await RadarReminderCron.runOnce();
    // Simulate the notification now existing, as a real second run would see it.
    existingNotifications.push({ userId: 'user-1', type: 'RADAR_DEADLINE_T7', title: 'Còn 7 ngày: 41/2024/QH15' });
    createNotification.mockClear();

    const result = await RadarReminderCron.runOnce();

    expect(result.notified).toBe(0);
    expect(createNotification).not.toHaveBeenCalled();
  });

  it('notifies every subscriber of the industry independently', async () => {
    getIndustrySubscribers.mockResolvedValue(['user-1', 'user-2', 'user-3']);

    const result = await RadarReminderCron.runOnce();

    expect(result.notified).toBe(3);
  });
});
