import express, { type ErrorRequestHandler } from 'express';
import cors from 'cors';
import type { MvpConfig, Role } from './modules/operations/config.js';
import type { Dependencies } from './modules/operations/dependencies.js';
import { createLegalRouter } from './modules/legal/legal-router.js';
import { createWorkspaceRouter } from './modules/workspace/router.js';
import { createComplianceRouter } from './modules/compliance/router.js';
import { createChangesRouter } from './modules/changes/router.js';
import { createFeedbackRouter } from './modules/feedback/router.js';

// Constructing the app never opens a listener, starts a cron or imports legacy routes.
export function createMvpApp(config: MvpConfig, dependencies: Dependencies, role: Role = 'api') {
  const app = express();
  app.disable('x-powered-by');
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Cache-Control', 'no-store');
    next();
  });
  app.use(cors({ origin(origin, callback) {
    callback(null, !origin || config.origins.includes(origin));
  }, credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  let draining = false;
  app.get(['/health/live', '/api/health'], (_req, res) => {
    res.status(draining ? 503 : 200).json({ status: draining ? 'draining' : 'ok', role });
  });
  app.get('/health/ready', async (_req, res) => {
    if (draining) { res.status(503).json({ status: 'not_ready', role }); return; }
    try {
      const checks = await dependencies.check();
      const ready = Object.values(checks).every(status => status === 'up');
      res.status(ready ? 200 : 503).json({ status: ready ? 'ready' : 'not_ready', role, checks });
    } catch { res.status(503).json({ status: 'not_ready', role }); }
  });
  if(role==='api'&&dependencies.database&&dependencies.storage)app.use('/api/v1',createLegalRouter(dependencies.database,dependencies.storage));
  if(role==='api'&&dependencies.database)app.use('/api/v1',createWorkspaceRouter(dependencies.database,config));
  if(role==='api'&&dependencies.database&&dependencies.storage)app.use('/api/v1',createComplianceRouter(dependencies.database,dependencies.storage,config));
  if(role==='api'&&dependencies.database)app.use('/api/v1',createChangesRouter(dependencies.database,config));
  if(role==='api'&&dependencies.database)app.use('/api/v1',createFeedbackRouter(dependencies.database,config));
  app.use((_req, res) => { res.status(404).json({ error: 'NOT_FOUND' }); });
  const errors: ErrorRequestHandler = (error, _req, res, _next) => {
    const status = error.status === 400 || error.status === 413 ? error.status : 500;
    res.status(status).json({ error: status === 500 ? 'INTERNAL_ERROR' : 'INVALID_REQUEST' });
  };
  app.use(errors);
  return { app, drain() { draining = true; } };
}
