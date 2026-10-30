import { describe, it, expect } from 'vitest';

function calculateRRFScore(bm25Rank?: number, vectorRank?: number, K = 60): number {
  let score = 0;
  if (bm25Rank !== undefined && bm25Rank >= 1) {
    score += 1 / (K + bm25Rank);
  }
  if (vectorRank !== undefined && vectorRank >= 1) {
    score += 1 / (K + vectorRank);
  }
  return score;
}

describe('RRF Hybrid Search Ranking', () => {
  it('should rank documents appearing in both BM25 and Vector higher than single matches', () => {
    // Doc A: Rank 1 in BM25, Rank 1 in Vector
    const docAScore = calculateRRFScore(1, 1);
    // Doc B: Rank 1 in BM25 only
    const docBScore = calculateRRFScore(1, undefined);
    // Doc C: Rank 2 in Vector only
    const docCScore = calculateRRFScore(undefined, 2);

    expect(docAScore).toBeGreaterThan(docBScore);
    expect(docBScore).toBeGreaterThan(docCScore);
  });

  it('should calculate correct RRF score formula: 1/(60 + rank)', () => {
    const scoreRank1 = calculateRRFScore(1, undefined);
    expect(scoreRank1).toBeCloseTo(1 / 61, 5);
  });
});
