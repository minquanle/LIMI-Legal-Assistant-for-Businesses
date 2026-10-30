import crypto from 'crypto';

export class EmbeddingService {
  private static API_URL = process.env.EMBEDDING_API_URL || 'http://localhost:20128/v1/embeddings';
  private static MODEL_NAME = process.env.EMBEDDING_MODEL_NAME || 'bkai-foundation-models/vietnamese-bi-encoder';
  private static VECTOR_DIM = 768;
  private static REQUEST_TIMEOUT_MS = 15000;
  private static MAX_ATTEMPTS = 2;

  private static async callEmbeddingApi(cleanText: string): Promise<number[] | null> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: cleanText,
          model: this.MODEL_NAME,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        console.warn(`[EmbeddingService] API returned HTTP ${response.status} for embedding request`);
        return null;
      }

      const data = (await response.json()) as any;
      const emb = data?.data?.[0]?.embedding;
      if (Array.isArray(emb) && emb.length === this.VECTOR_DIM) {
        return emb;
      }
      console.warn(`[EmbeddingService] API response had unexpected shape (dim=${Array.isArray(emb) ? emb.length : 'n/a'})`);
      return null;
    } catch (err) {
      console.warn('[EmbeddingService] Embedding API call failed:', err instanceof Error ? err.message : err);
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Generates a 768-dimensional embedding vector for input text.
   * Attempts the remote API (with a short retry) first; falls back to a
   * deterministic hash-based vector if the API is unreachable or misbehaving.
   * The fallback vector has no real semantic relationship to the model's
   * embedding space — it exists only so ingestion doesn't hard-fail, and its
   * use is always logged so degraded search quality for that document is
   * visible in server logs rather than silent.
   */
  static async generateEmbedding(text: string): Promise<number[]> {
    const cleanText = (text || '').trim();
    if (!cleanText) {
      return new Array(this.VECTOR_DIM).fill(0);
    }

    for (let attempt = 1; attempt <= this.MAX_ATTEMPTS; attempt++) {
      const result = await this.callEmbeddingApi(cleanText);
      if (result) return result;
      if (attempt < this.MAX_ATTEMPTS) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      }
    }

    console.error(
      `[EmbeddingService] Falling back to hash-based pseudo-embedding after ${this.MAX_ATTEMPTS} failed attempts — ` +
      `this document's vector will NOT be semantically meaningful until re-embedded.`
    );
    return this.generateFallbackEmbedding(cleanText);
  }

  /**
   * Generates a normalized 768-dim deterministic fallback vector based on text n-grams and hashing.
   */
  private static generateFallbackEmbedding(text: string): number[] {
    const vector = new Array(this.VECTOR_DIM).fill(0);
    const words = text.toLowerCase().split(/\s+/).filter(Boolean);

    for (const word of words) {
      const hash = crypto.createHash('sha256').update(word).digest();
      for (let i = 0; i < hash.length; i++) {
        const idx = (hash[i] * 31 + i) % this.VECTOR_DIM;
        const val = (hash[i] / 128.5) - 1.0;
        vector[idx] += val;
      }
    }

    // L2 Normalize
    const norm = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
    if (norm > 0) {
      return vector.map((v) => Number((v / norm).toFixed(6)));
    }

    return vector;
  }
}
