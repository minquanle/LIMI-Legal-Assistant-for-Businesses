import { createHash } from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { createLogger, format, transports } from 'winston';

const logger = createLogger({
  level: 'info',
  format: format.combine(format.timestamp(), format.json()),
  transports: [new transports.Console()],
});

/**
 * Storage service for saving original PDF/DOC files.
 * Supports local filesystem storage. MinIO/S3 can be added later.
 */
export class StorageService {
  private basePath: string;

  constructor(basePath?: string) {
    this.basePath = basePath || process.env.STORAGE_LOCAL_PATH || './storage';
  }

  /** Initialize storage directory */
  async init(): Promise<void> {
    const pdfsDir = path.join(this.basePath, 'pdfs');
    const docsDir = path.join(this.basePath, 'docs');
    await fs.mkdir(pdfsDir, { recursive: true });
    await fs.mkdir(docsDir, { recursive: true });
    logger.info(`Storage initialized at ${this.basePath}`);
  }

  /**
   * Save a file buffer to storage.
   * Returns the SHA-256 hash and storage path.
   */
  async saveFile(
    buffer: Buffer,
    originalName: string,
    mimeType: string
  ): Promise<{
    hash: string;
    storagePath: string;
    sizeBytes: number;
  }> {
    const hash = createHash('sha256').update(buffer).digest('hex');
    const ext = this.getExtension(originalName, mimeType);
    const subDir = this.getSubDir(mimeType);
    const fileName = `${hash}${ext}`;
    const storagePath = path.join(subDir, fileName);
    const fullPath = path.join(this.basePath, storagePath);

    // Check if file already exists (dedup by hash)
    try {
      await fs.access(fullPath);
      logger.info(`File already exists: ${storagePath}`);
    } catch {
      await fs.mkdir(path.dirname(fullPath), { recursive: true });
      await fs.writeFile(fullPath, buffer);
      logger.info(`File saved: ${storagePath} (${buffer.length} bytes)`);
    }

    return {
      hash,
      storagePath,
      sizeBytes: buffer.length,
    };
  }

  /** Get the full filesystem path for a stored file */
  getFullPath(storagePath: string): string {
    return path.join(this.basePath, storagePath);
  }

  /** Check if a file exists by hash */
  async existsByHash(hash: string, mimeType: string): Promise<boolean> {
    const subDir = this.getSubDir(mimeType);
    const ext = mimeType.includes('pdf') ? '.pdf' : '.doc';
    const fullPath = path.join(this.basePath, subDir, `${hash}${ext}`);
    try {
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  /** Read a stored file */
  async readFile(storagePath: string): Promise<Buffer> {
    const fullPath = path.join(this.basePath, storagePath);
    return fs.readFile(fullPath);
  }

  private getSubDir(mimeType: string): string {
    if (mimeType.includes('pdf')) return 'pdfs';
    return 'docs';
  }

  private getExtension(originalName: string, mimeType: string): string {
    const ext = path.extname(originalName);
    if (ext) return ext;
    if (mimeType.includes('pdf')) return '.pdf';
    if (mimeType.includes('msword') || mimeType.includes('wordprocessing'))
      return '.docx';
    return '.bin';
  }
}

/** Singleton instance */
let storageInstance: StorageService | null = null;

export function getStorageService(): StorageService {
  if (!storageInstance) {
    storageInstance = new StorageService();
  }
  return storageInstance;
}
