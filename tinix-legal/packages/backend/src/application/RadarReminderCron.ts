/**
 * Daily job that notifies industry subscribers when a compliance radar
 * alert's deadline is 30, 7, or 1 day(s) away.
 *
 * Deliberately independent of CronService: that service's single scheduled
 * task only runs when an admin has enabled the crawler config
 * (crawler-cron-config.json) — unrelated semantics to "always check radar
 * deadlines". This runs on its own node-cron schedule, started once at boot,
 * with no Redis/BullMQ dependency.
 */
import cron from 'node-cron';
import { prisma } from '../infrastructure/db.js';
import { RadarService, INDUSTRIES } from '../services/radar-service.js';
import { NotificationService } from '../services/notification-service.js';
import { daysUntil, REMINDER_MILESTONE_DAYS, type ReminderMilestoneDays } from '../services/radar-scoring.js';

const DAILY_AT_8AM = '0 8 * * *';

export class RadarReminderCron {
  private static task: cron.ScheduledTask | null = null;

  static start(schedule: string = DAILY_AT_8AM) {
    if (this.task) {
      this.task.stop();
      this.task = null;
    }
    if (!cron.validate(schedule)) {
      console.error(`[RadarReminderCron] Invalid schedule, not starting: ${schedule}`);
      return;
    }
    this.task = cron.schedule(schedule, () => {
      this.runOnce().catch((err) => console.error('[RadarReminderCron] Run failed:', err));
    });
    console.log(`[RadarReminderCron] Scheduled at: ${schedule}`);
  }

  /**
   * Scans every alert with a deadline, notifies each industry's subscribers
   * at the T-30/T-7/T-1 milestones. Safe to call more than once on the same
   * day (e.g. a restart re-triggering the schedule): each notification's
   * `type` encodes the milestone and is checked for existence first, so a
   * repeat run creates nothing new.
   */
  static async runOnce(): Promise<{ notified: number }> {
    const alerts = await RadarService.getAlertsWithDeadlines();
    let notified = 0;

    for (const alert of alerts) {
      if (!alert.deadlineDate) continue;
      const days = daysUntil(new Date(alert.deadlineDate));
      if (!REMINDER_MILESTONE_DAYS.includes(days as ReminderMilestoneDays)) continue;

      const subscribers = await RadarService.getIndustrySubscribers(alert.industry);
      if (subscribers.length === 0) continue;

      const type = `RADAR_DEADLINE_T${days}`;
      const industryName = INDUSTRIES.find((ind) => ind.id === alert.industry)?.name ?? alert.industry;
      const title = `Còn ${days} ngày: ${alert.documentNumber}`;
      const body = `${alert.title} (${industryName}) đến hạn tuân thủ trong ${days} ngày.`;

      for (const userId of subscribers) {
        const alreadySent = await (prisma as any).userNotification.findFirst({
          where: { userId, type, title },
        });
        if (alreadySent) continue;

        await NotificationService.createNotification({
          userId,
          type,
          title,
          body,
          documentId: alert.documentId ?? undefined,
        });
        notified += 1;
      }
    }

    if (notified > 0) console.log(`[RadarReminderCron] Sent ${notified} deadline notification(s).`);
    return { notified };
  }
}
