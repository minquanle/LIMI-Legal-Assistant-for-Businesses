import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Server } from 'node:http';
import { once } from 'node:events';
import { createMvpApp } from '../mvp-app.js';
import { parseConfig } from '../modules/operations/config.js';
import type { Checks } from '../modules/operations/dependencies.js';

const env = { DATABASE_URL: 'postgresql://user:secret@localhost:5433/limi_test', REDIS_URL: 'redis://localhost:6381',
  MINIO_ENDPOINT: 'localhost', MINIO_ACCESS_KEY: 'test-access', MINIO_SECRET_KEY: 'test-secret-long',
  MINIO_BUCKET: 'test-private', ALLOWED_ORIGINS: 'http://localhost:3000', NODE_ENV: 'test' };
const servers: Server[] = [];
afterEach(async () => { await Promise.all(servers.splice(0).map(server => new Promise<void>(resolve => {
  server.closeIdleConnections(); server.close(() => resolve());
}))); });
async function setup(checks: Checks = {database:'up', redis:'up', storage:'up'}) {
  const check = vi.fn(async () => checks);
  const runtime = createMvpApp(parseConfig(env), { check, close: vi.fn() });
  const server = runtime.app.listen(0, '127.0.0.1'); servers.push(server);
  await once(server, 'listening');
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('No test address');
  return { ...runtime, check, url: `http://127.0.0.1:${address.port}` };
}
describe('MVP configuration and HTTP lifecycle', () => {
  it('requires HTTPS origins for production secure sessions', () => {
    expect(() => parseConfig({...env,NODE_ENV:'production'})).toThrow('HTTPS');
    expect(parseConfig({...env,NODE_ENV:'production',ALLOWED_ORIGINS:'https://localhost:8443'}).nodeEnv).toBe('production');
  });
  it('rejects missing secrets, malformed URLs, ports, booleans and wildcard CORS', () => {
    for (const overrides of [ {MINIO_SECRET_KEY: ''}, {DATABASE_URL:'http://secret@localhost'}, {REDIS_URL:'invalid'},
      {API_PORT:'4010abc'}, {API_PORT:'4011'}, {MINIO_USE_SSL:'yes'}, {ALLOWED_ORIGINS:'*'} ]) {
      expect(() => parseConfig({...env, ...overrides})).toThrow();
    }
  });
  it('constructing the app and checking liveness do not access infrastructure or start jobs', async () => {
    const {check,url} = await setup(); expect(check).not.toHaveBeenCalled();
    const response = await fetch(`${url}/health/live`);
    expect(response.status).toBe(200); expect(await response.json()).toMatchObject({status:'ok',role:'api'});
    expect(check).not.toHaveBeenCalled(); expect(response.headers.get('x-powered-by')).toBeNull();
    expect((await fetch(`${url}/api/admin/crawl-jobs`)).status).toBe(404);
  });
  it('returns 503 when any required dependency is unavailable', async () => {
    for (const dependency of ['database','redis','storage'] as const) {
      const {url} = await setup({database:'up',redis:'up',storage:'up',[dependency]:'down'});
      const response = await fetch(`${url}/health/ready`);
      expect(response.status).toBe(503); expect(await response.json()).toMatchObject({checks:{[dependency]:'down'}});
    }
  });
  it('returns ready only after all dependencies pass and drains without another probe', async () => {
    const {url,drain,check} = await setup();
    expect((await fetch(`${url}/health/ready`)).status).toBe(200);
    drain(); expect((await fetch(`${url}/health/ready`)).status).toBe(503);
    expect((await fetch(`${url}/health/live`)).status).toBe(503); expect(check).toHaveBeenCalledTimes(1);
  });
  it('does not leak exceptions and only enables CORS for configured origins', async () => {
    const {url} = await setup();
    const allowed = await fetch(`${url}/health/live`, {headers:{Origin:'http://localhost:3000'}});
    expect(allowed.headers.get('access-control-allow-origin')).toBe('http://localhost:3000');
    const denied = await fetch(`${url}/health/live`, {headers:{Origin:'https://untrusted.example'}});
    expect(denied.headers.get('access-control-allow-origin')).toBeNull();
    const invalid = await fetch(`${url}/missing`, {method:'POST',headers:{'Content-Type':'application/json'},body:'{invalid'});
    expect(invalid.status).toBe(400); expect(await invalid.text()).not.toContain('invalid');
  });
});
