import { diff_match_patch, Diff } from 'diff-match-patch';

export function computeTextDiff(textA: string, textB: string): Diff[] {
  const dmp = new diff_match_patch();
  const diffs = dmp.diff_main(textA, textB);
  dmp.diff_cleanupSemantic(diffs);
  return diffs;
}
