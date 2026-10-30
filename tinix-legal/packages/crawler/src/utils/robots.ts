import logger from './logger.js';

export interface RobotsRules {
  disallow: string[];
  allow: string[];
}

const cache = new Map<string, RobotsRules>();

/**
 * Minimal robots.txt fetch + parse, scoped to the `User-agent: *` block
 * (this crawler doesn't identify itself under a distinct UA, so it must
 * follow the rules meant for anonymous/generic crawlers). Not a full RFC
 * 9309 implementation — no wildcard/`$` path matching — but covers the
 * plain-prefix Disallow/Allow rules that Vietnamese government sites
 * actually publish, which is what was previously not checked at all.
 * A fetch failure (no robots.txt, network error) is treated as "no
 * restrictions", matching the spec's own default.
 */
export async function fetchRobotsRules(baseUrl: string): Promise<RobotsRules> {
  const origin = new URL(baseUrl).origin;
  const cached = cache.get(origin);
  if (cached) return cached;

  const rules: RobotsRules = { disallow: [], allow: [] };
  try {
    const res = await fetch(`${origin}/robots.txt`, { signal: AbortSignal.timeout(10000) });
    if (res.ok) {
      const text = await res.text();
      let inWildcardBlock = false;
      for (const rawLine of text.split('\n')) {
        const line = rawLine.split('#')[0].trim();
        if (!line) continue;
        const [rawKey, ...rest] = line.split(':');
        const key = rawKey.trim().toLowerCase();
        const value = rest.join(':').trim();

        if (key === 'user-agent') {
          inWildcardBlock = value === '*';
        } else if (inWildcardBlock && key === 'disallow' && value) {
          rules.disallow.push(value);
        } else if (inWildcardBlock && key === 'allow' && value) {
          rules.allow.push(value);
        }
      }
    }
  } catch (err) {
    logger.warn(`Could not fetch robots.txt for ${origin}, proceeding as unrestricted: ${(err as Error).message}`);
  }

  cache.set(origin, rules);
  return rules;
}

/**
 * Standard robots.txt precedence: the longest matching rule wins; an Allow
 * of equal length to a Disallow wins (Allow takes precedence on ties).
 */
export function isPathAllowed(rules: RobotsRules, pathname: string): boolean {
  let bestMatch: { length: number; allowed: boolean } | null = null;

  for (const rule of rules.disallow) {
    if (pathname.startsWith(rule) && (!bestMatch || rule.length > bestMatch.length)) {
      bestMatch = { length: rule.length, allowed: false };
    }
  }
  for (const rule of rules.allow) {
    if (pathname.startsWith(rule) && (!bestMatch || rule.length >= bestMatch.length)) {
      bestMatch = { length: rule.length, allowed: true };
    }
  }

  return bestMatch ? bestMatch.allowed : true;
}

/**
 * Convenience guard used at the start of each crawler's entry function:
 * logs and returns false if the given URL's path is disallowed for `*`.
 */
export async function assertCrawlAllowed(url: string, crawlerName: string): Promise<boolean> {
  const rules = await fetchRobotsRules(url);
  const pathname = new URL(url).pathname;
  const allowed = isPathAllowed(rules, pathname);
  if (!allowed) {
    logger.error(`[robots.txt] ${crawlerName}: ${pathname} is disallowed by ${new URL(url).origin}/robots.txt — aborting crawl.`);
  }
  return allowed;
}
