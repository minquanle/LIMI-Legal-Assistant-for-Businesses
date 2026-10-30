export type LegalSourceSite = 'VBPL' | 'LUATVIETNAM' | 'THUVIENPHAPLUAT' | 'CHINHPHU' | 'PHAPDIEN' | 'VANBANPHAPLUAT' | 'DULIEUPHAPLUAT' | 'HUNG_YEN' | 'OTHER';
export function sourceSiteForDomain(domain: string): LegalSourceSite {
  const host = domain.toLowerCase().replace(/\.$/, '');
  const belongs = (suffix: string) => host === suffix || host.endsWith(`.${suffix}`);
  if (belongs('hungyen.gov.vn')) return 'HUNG_YEN';
  if (belongs('vbpl.vn')) return 'VBPL';
  if (belongs('luatvietnam.vn')) return 'LUATVIETNAM';
  if (belongs('thuvienphapluat.vn')) return 'THUVIENPHAPLUAT';
  if (belongs('vanbanphapluat.gov.vn')) return 'VANBANPHAPLUAT';
  if (belongs('chinhphu.vn')) return 'CHINHPHU';
  if (host === 'phapdien.moj.gov.vn') return 'PHAPDIEN';
  if (belongs('dulieuphapluat.vn')) return 'DULIEUPHAPLUAT';
  return 'OTHER';
}
export function normalizeSourceUrl(rawUrl: string) {
  const url = new URL(rawUrl);
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) throw new Error('INVALID_SOURCE_URL');
  url.hostname = url.hostname.toLowerCase().replace(/\.$/, '');
  url.hash = '';
  for (const key of [...url.searchParams.keys()]) {
    if (/^utm_/i.test(key) || ['fbclid', 'gclid', '_ga'].includes(key.toLowerCase())) url.searchParams.delete(key);
  }
  const site = sourceSiteForDomain(url.hostname);
  return { domain: url.hostname, normalizedUrl: url.toString(), originalUrl: rawUrl, site,
    sourceKind: site === 'DULIEUPHAPLUAT' ? 'DATASET' as const
      : ['VBPL','CHINHPHU','PHAPDIEN','HUNG_YEN','VANBANPHAPLUAT'].includes(site) ? 'OFFICIAL' as const
      : ['LUATVIETNAM','THUVIENPHAPLUAT'].includes(site) ? 'REPUBLISHED' as const : 'OTHER' as const };
}
