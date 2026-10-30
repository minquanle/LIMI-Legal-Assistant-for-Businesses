import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fetchRobotsRules, isPathAllowed } from '../utils/robots.js';

describe('robots.txt parsing', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('parses Disallow rules under User-agent: *', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        text: async () => 'User-agent: *\nDisallow: /admin\nDisallow: /private/\nAllow: /private/public-page\n',
      })) as any
    );

    const rules = await fetchRobotsRules('https://example.test/some/path?query=1');
    expect(rules.disallow).toContain('/admin');
    expect(rules.disallow).toContain('/private/');
    expect(rules.allow).toContain('/private/public-page');
  });

  it('ignores rules under a different, non-wildcard User-agent block', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        text: async () => 'User-agent: SomeOtherBot\nDisallow: /everything\n',
      })) as any
    );

    const rules = await fetchRobotsRules('https://example2.test/');
    expect(rules.disallow).toHaveLength(0);
  });

  it('treats a fetch failure as unrestricted (no robots.txt = crawl allowed)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('network error');
      }) as any
    );

    const rules = await fetchRobotsRules('https://example3.test/');
    expect(rules.disallow).toHaveLength(0);
    expect(isPathAllowed(rules, '/anything')).toBe(true);
  });
});

describe('isPathAllowed', () => {
  it('disallows a path matching a Disallow rule', () => {
    expect(isPathAllowed({ disallow: ['/admin'], allow: [] }, '/admin/settings')).toBe(false);
  });

  it('allows a path not matching any rule', () => {
    expect(isPathAllowed({ disallow: ['/admin'], allow: [] }, '/van-ban/trung-uong')).toBe(true);
  });

  it('longest matching rule wins — a more specific Allow overrides a broader Disallow', () => {
    const rules = { disallow: ['/private/'], allow: ['/private/public-page'] };
    expect(isPathAllowed(rules, '/private/public-page')).toBe(true);
    expect(isPathAllowed(rules, '/private/secret')).toBe(false);
  });
});
