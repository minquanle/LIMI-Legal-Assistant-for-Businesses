import crypto from 'crypto';

export class EmbeddingService {
  private static API_URL = process.env.EMBEDDING_API_URL || 'http://localhost:20128/v1/embeddings';
  private static MODEL_NAME = process.env.EMBEDDING_MODEL_NAME || 'bkai-foundation-models/vietnamese-bi-encoder';
  private static VECTOR_DIM = 768;

  /**
   * Generates a 768-dimensional embedding vector for input text.
   * Attempts remote API call first; falls back to deterministic hash embedding if offline.
   */
  static async generateEmbedding(text: string): Promise<number[]> {
    const cleanText = (text || '').trim();
    if (!cleanText) {
      return new Array(this.VECTOR_DIM).fill(0);
    }

    try {
      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: cleanText,
          model: this.MODEL_NAME,
        }),
      });

      if (response.ok) {
        const data = (await response.json()) as any;
        if (data?.data?.[0]?.embedding && Array.isArray(data.data[0].embedding)) {
          const emb = data.data[0].embedding;
          if (emb.length === this.VECTOR_DIM) {
            return emb;
          }
        }
      }
    } catch {
      // Offline fallback
    }

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
