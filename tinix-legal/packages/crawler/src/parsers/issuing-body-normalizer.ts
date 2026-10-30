/**
 * Normalizes issuing body names to a standardized code to prevent duplication collisions.
 */
export function normalizeIssuingBody(body: string): string {
  if (!body) return '';

  // 1. Lowercase and trim
  let normalized = body.toLowerCase().trim();

  // 2. Remove Vietnamese diacritics
  normalized = normalized.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  normalized = normalized.replace(/đ/g, 'd');

  // 3. Map known equivalents
  normalized = normalized.replace(/u[y] ban nhan dan/g, 'ubnd');
  normalized = normalized.replace(/hoi dong nhan dan/g, 'hdnd');
  normalized = normalized.replace(/b[o]/g, 'bo');

  // 4. Safely strip location prefixes ONLY if they are standalone words right after "ubnd " or "hdnd " or "bo " or at the beginning of the location part.
  // We use regex to match "tinh", "thanh pho", "tp" as full words.
  // To avoid removing "tinh" in "ha tinh", we only remove them if they appear before other words, or we can just remove them globally as long as it's not the LAST word?
  // A safer approach: replace `\b(tinh|thanh pho|tp)\b\s+` only if it's followed by another word.
  // Actually, standardizing `ubnd tinh x` to `ubnd x` is what we want.
  normalized = normalized.replace(/\btinh\b\.?\s+/g, '');
  normalized = normalized.replace(/\bthanh pho\b\.?\s+/g, '');
  normalized = normalized.replace(/\btp\b\.?\s+/g, '');
  normalized = normalized.replace(/\bthi xa\b\.?\s+/g, '');
  normalized = normalized.replace(/\bhuyen\b\.?\s+/g, '');

  // 5. Replace non-alphanumeric characters with underscores
  normalized = normalized.replace(/[^a-z0-9]/g, '_');
  
  // 6. Collapse multiple underscores and trim
  normalized = normalized.replace(/_+/g, '_');
  normalized = normalized.replace(/^_|_$/g, '');

  return normalized;
}
