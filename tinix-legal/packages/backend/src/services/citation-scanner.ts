import { prisma } from '../infrastructure/db.js';

export interface ScannedCitation {
  rawMatch: string;
  documentNumber: string;
  normalizedNumber: string;
  status: 'VALID' | 'EXPIRED' | 'PARTIALLY_EXPIRED' | 'UNKNOWN';
  statusLabel: string;
  canonicalDocId?: string;
  title?: string;
  validityStatus?: string;
  issuingBody?: string;
  notes?: string;
}

function normalizeDocNumber(num: string): string {
  return num
    .trim()
    .replace(/[\s]+/g, '')
    .replace(/[-–—]/g, '/')
    .replace(/\/+/g, '/')
    .toUpperCase();
}

export class CitationScanner {
  // Matches legal document numbers e.g. 31/2024/QH15, 30/2020/NĐ-CP, 123/QĐ-UBND
  private static DOC_NUMBER_REGEX = /\b(\d{1,5}\/(?:\d{4}\/)?[A-Za-z0-9-–\u00C0-\u024F\u1EA0-\u1EFF]+)/gi;

  /**
   * Scans draft text for legal document citations and checks their validity status in DB.
   */
  static async scanText(text: string): Promise<ScannedCitation[]> {
    if (!text || !text.trim()) return [];

    const matches = Array.from(text.matchAll(this.DOC_NUMBER_REGEX)).map((m) => m[1]);
    const uniqueNumbers = Array.from(new Set(matches));

    if (uniqueNumbers.length === 0) return [];

    const results: ScannedCitation[] = [];

    for (const rawNum of uniqueNumbers) {
      const normNum = normalizeDocNumber(rawNum);

      const doc = await prisma.canonicalDocument.findFirst({
        where: {
          OR: [
            { documentNumber: { equals: rawNum, mode: 'insensitive' } },
            { normalizedNumber: { equals: normNum, mode: 'insensitive' } },
            { documentNumber: { startsWith: normNum, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          documentNumber: true,
          title: true,
          validityStatus: true,
          issuingBody: true,
        },
      });

      if (!doc) {
        results.push({
          rawMatch: rawNum,
          documentNumber: rawNum,
          normalizedNumber: normNum,
          status: 'UNKNOWN',
          statusLabel: 'Chưa xác thực trong CSDL',
          notes: 'Không tìm thấy số hiệu này trong kho dữ liệu >158.000 văn bản.',
        });
        continue;
      }

      let status: ScannedCitation['status'] = 'VALID';
      let statusLabel = 'Còn hiệu lực';
      let notes = 'Văn bản đang có hiệu lực thi hành.';

      if (doc.validityStatus === 'HET_HIEU_LUC') {
        status = 'EXPIRED';
        statusLabel = 'Hết hiệu lực';
        notes = 'CẢNH BÁO: Văn bản này đã hết hiệu lực. Không nên dùng làm căn cứ pháp lý!';
      } else if (doc.validityStatus === 'HET_HIEU_LUC_MOT_PHAN') {
        status = 'PARTIALLY_EXPIRED';
        statusLabel = 'Hết hiệu lực 1 phần';
        notes = 'CHÚ Ý: Văn bản này đã bị sửa đổi/hết hiệu lực một phần.';
      } else if (doc.validityStatus === 'NGUNG_HIEU_LUC') {
        status = 'EXPIRED';
        statusLabel = 'Ngưng hiệu lực';
        notes = 'CHÚ Ý: Văn bản tạm ngưng hiệu lực thi hành.';
      }

      results.push({
        rawMatch: rawNum,
        documentNumber: doc.documentNumber,
        normalizedNumber: normNum,
        status,
        statusLabel,
        canonicalDocId: doc.id,
        title: doc.title,
        validityStatus: doc.validityStatus,
        issuingBody: doc.issuingBody,
        notes,
      });
    }

    return results;
  }
}
