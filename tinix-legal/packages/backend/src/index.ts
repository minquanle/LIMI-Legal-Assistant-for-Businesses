import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { createLogger, format, transports } from 'winston';
import { searchRouter } from './routes/search.js';
import { documentsRouter } from './routes/documents.js';
import { adminRouter } from './routes/admin.js';
import { copilotRouter } from './routes/copilot.js';
import enterpriseRouter from './routes/enterprise.js';
import enterpriseKnowledgeRouter from './routes/enterprise-knowledge.js';
import aiRbacRouter from './routes/ai-rbac.js';
import deepAnalyticsRouter from './routes/deep-analytics.js';
import { mindmapRouter } from './routes/mindmap.js';
import { analyticsRouter } from './routes/analytics.js';
import { chatbotRouter } from './routes/chatbot.js';
import { watchlistRouter } from './routes/watchlist.js';
import { notificationsRouter } from './routes/notifications.js';
import { contractAuditRouter } from './routes/contract-audit.js';
import { qaRouter } from './routes/qa.js';
import { milestonesRouter } from './routes/milestones.js';
import { radarRouter } from './routes/radar.js';
import { radarAdminRouter } from './routes/radar-admin.js';
import { parserAdminRouter } from './routes/parser-admin.js';
import { RadarService } from './services/radar-service.js';
import { RadarReminderCron } from './application/RadarReminderCron.js';
import { caseLawRouter } from './routes/case-law.js';
import { legalDiffRouter } from './routes/legal-diff.js';
import { procedureRouter } from './routes/procedures.js';
import { healthcheckRouter } from './routes/healthcheck.js';
import { lawPulseRouter } from './routes/law-pulse.js';
import { adminViolationsRouter } from './routes/admin-violations.js';
import { referenceLookupRouter } from './routes/reference-lookup.js';
import { crawlJobsRouter } from './routes/crawl-jobs.js';
import { CrawlJobService } from './application/CrawlJobService.js';
import { authRouter } from './routes/auth.js';
import { usersRouter } from './routes/users.js';
import { auditLogsRouter } from './routes/audit-logs.js';
import organizationsRouter from './routes/organizations.js';
import organizationUnitsRouter from './routes/organization-units.js';
import enterpriseDocumentsRouter from './routes/enterprise-documents.js';
import { CronService } from './application/CronService.js';


import { securityHeaders, generalRateLimiter, aiRateLimiter, safeErrorHandler } from './middleware/security.js';

const logger = createLogger({
  level: 'info',
  format: format.combine(format.timestamp(), format.json()),
  transports: [new transports.Console()],
});

const app = express();
const PORT = parseInt(process.env.API_PORT || '4001', 10);
const HOST = process.env.API_HOST || '0.0.0.0';

// 1. Security Headers (OWASP)
app.use(securityHeaders);

// 2. CORS configuration with configurable whitelist
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:4000,http://localhost:4001')
  .split(',')
  .map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, server-to-server)
      if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        callback(null, true);
      } else {
        callback(new Error('CORS request blocked by security policy'));
      }
    },
    credentials: true,
  })
);

// 3. Body parsers with safe payload limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 4. Global Rate Limiter
app.use('/api', generalRateLimiter);

// 5. Dedicated AI Rate Limiter for compute-heavy endpoints
app.use('/api/copilot', aiRateLimiter);
app.use('/api/qa/ask-live', aiRateLimiter);
app.use('/api/contract-audit', aiRateLimiter);
app.use('/api/healthcheck', aiRateLimiter);
app.use('/api/chatbot', aiRateLimiter);

// 6. Routes
app.use('/api/search', searchRouter);
app.use('/api/documents', documentsRouter);
app.use('/api/admin/crawl-jobs', crawlJobsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/copilot', copilotRouter);
app.use('/api', enterpriseRouter);
app.use('/api', enterpriseKnowledgeRouter);
app.use('/api', aiRbacRouter);
app.use('/api', deepAnalyticsRouter);
app.use('/api/mindmap', mindmapRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/chatbot', chatbotRouter);
app.use('/api/watchlist', watchlistRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/contract-audit', contractAuditRouter);
app.use('/api/qa', qaRouter);
app.use('/api/milestones', milestonesRouter);
app.use('/api/radar', radarRouter);
app.use('/api', radarAdminRouter);
app.use('/api', parserAdminRouter);
app.use('/api/case-law', caseLawRouter);
app.use('/api/legal-diff', legalDiffRouter);
app.use('/api/procedures', procedureRouter);
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/audit-logs', auditLogsRouter);
app.use('/api', organizationsRouter);
app.use('/api', organizationUnitsRouter);
app.use('/api', enterpriseDocumentsRouter);
app.use('/api/healthcheck', healthcheckRouter);
app.use('/api/law-pulse', lawPulseRouter);
app.use('/api/admin-violations', adminViolationsRouter);
app.use('/api/reference', referenceLookupRouter);

// Health check

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Safe Error Handler
app.use(safeErrorHandler);

// Initialize Cron Jobs
CronService.start();

// Incremental dulieuphapluat.vn update jobs managed from /admin/crawl-jobs.
CrawlJobService.init().catch((err) => {
  logger.error('Crawl job scheduler failed to initialise', { error: String(err) });
});

// Warm the compliance radar seed once at boot so request handlers don't each
// probe the database for it. Failures are logged and retried on first request.
RadarService.ensureSeeded().catch((err) => {
  logger.warn('Compliance radar seed warm-up failed; will retry on first request', { error: String(err) });
});

// Independent of CronService.start() above — that job only runs when an
// admin has enabled the crawler config, unrelated to radar deadlines.
RadarReminderCron.start();

// Start server
app.listen(PORT, HOST, () => {
  logger.info(`Backend API server running on http://${HOST}:${PORT}`);
});

