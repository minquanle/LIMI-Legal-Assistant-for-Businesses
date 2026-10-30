import { ParsedRelationship } from './metadata-parser.js';

const VIET_CHARS = "a-zA-Zà-ýÀ-ÝđĐ\u00C0-\u024F\u1EA0-\u1EF9";

export class TextRelationExtractor {
  /**
   * Helper to parse fullText and extract relationships
   */
  public static extractFromFullText(fullText: string): ParsedRelationship[] {
    if (!fullText) return [];
    // Split by Điều boundaries to track which article each relation comes from
    const articleParts = fullText.split(/\b(?=Điều\s+\d+[a-z]?[\.:\s])/i);
    const preambles = [articleParts[0] || ''];
    const articles = articleParts.slice(1);
    return this.extractRelations(preambles, articles);
  }

  /**
   * Extract relations from document preambles and articles
   * @param preambles Array of string (usually from ast or parsed text)
   * @param articles Array of article text
   */
  public static extractRelations(preambles: string[], articles: string[]): ParsedRelationship[] {
    const relations: ParsedRelationship[] = [];

    // 1. Extract CAN_CU from preambles
    for (const text of preambles) {
      const canCuRels = this.extractCanCu(text);
      relations.push(...canCuRels);
    }

    // 2. Extract THAY_THE, BAI_BO, SUA_DOI from articles
    for (const text of articles) {
      if (text.toLowerCase().includes('thi hành') || text.toLowerCase().includes('hiệu lực')) {
        // Try to capture the Điều number this relation belongs to
        const dieuMatch = text.match(/^Điều\s+(\d+[a-z]?)/i);
        const sourceNodeRef = dieuMatch ? `Điều ${dieuMatch[1]}` : undefined;
        const articleRels = this.extractArticleRelations(text, sourceNodeRef);
        relations.push(...articleRels);
      }
    }

    return relations;
  }

  /**
   * Extract CAN_CU relations
   * Pattern: "Căn cứ Luật [Tên luật] năm [Năm]" hoặc "Căn cứ Nghị định số [Số]/[Năm]/[Ký hiệu]"
   */
  private static extractCanCu(text: string): ParsedRelationship[] {
    const results: ParsedRelationship[] = [];
    
    // Match "Luật xyz năm 2013" hoặc "Bộ luật xyz năm 2015"
    const luatRegex = new RegExp(`(?:Căn cứ\\s+)?(Bộ luật|Luật)\\s+([${VIET_CHARS}\\s]+)\\s+năm\\s+(\\d{4})`, "gi");
    let match;
    while ((match = luatRegex.exec(text)) !== null) {
      const docType = match[1]; // Luật | Bộ luật
      const subject = match[2].trim(); // xyz
      const year = match[3];
      // Target number is pseudo: LUAT_xyz_2013 or similar?
      // Actually standard target format is usually just the title if it's a law without a number.
      // E.g. "Luật Xây dựng năm 2014" -> normalized: LUATXAYDUNGNAM2014
      results.push({
        relationshipType: 'CAN_CU',
        targetDocNumber: `${docType} ${subject} năm ${year}`
      });
    }

    // Match "số 45/2013/QH13" - require symbol to have at least one letter to avoid matching dates
    const symbolPattern = '\\d+\\/\\d{2,4}\\/[A-ZÀ-ÝđĐa-z0-9\\-]*[A-ZÀ-ÝđĐa-z\\-][A-ZÀ-ÝđĐa-z0-9\\-]*';
    const soRegex = new RegExp(`(?:số\\s+)?(${symbolPattern})`, "gi");
    while ((match = soRegex.exec(text)) !== null) {
      results.push({
        relationshipType: 'CAN_CU',
        targetDocNumber: match[1].trim()
      });
    }

    return results;
  }

  /**
   * Extract THAY_THE, BAI_BO, SUA_DOI
   */
  private static extractArticleRelations(text: string, sourceNodeRef?: string): ParsedRelationship[] {
    const results: ParsedRelationship[] = [];
    const symbolPattern = '\\d+\\/\\d{2,4}\\/[A-ZÀ-ÝđĐa-z0-9\\-]*[A-ZÀ-ÝđĐa-z\\-][A-ZÀ-ÝđĐa-z0-9\\-]*';

    // Pattern to extract targetNodeRef: "sửa đổi khoản 2 Điều 7" → "Khoản 2 Điều 7"
    const nodeRefPattern = /(?:khoản\s+\d+\s+)?(?:Điều|Mục|Chương|Phần|điểm)\s+[\d\w]+/gi;
    
    // Helper to map words to relation types
    const findRels = (patternStr: string, relType: string) => {
      // Regex looks for "thay thế Nghị định số 123/2020/NĐ-CP"
      const regex = new RegExp(`(?:${patternStr})([^.]*?)(${symbolPattern})`, "gi");
      let match;
      while ((match = regex.exec(text)) !== null) {
        // Try to extract targetNodeRef from the text between trigger word and doc number
        const contextText = match[1] || '';
        const nodeMatch = contextText.match(nodeRefPattern);
        const targetNodeRef = nodeMatch ? nodeMatch[0].trim() : undefined;
        results.push({
          relationshipType: relType,
          targetDocNumber: match[2].trim(),
          sourceNodeRef,
          targetNodeRef,
        });
      }

      // Handle laws: "thay thế Luật Đất đai năm 2013"
      const luatRegex = new RegExp(`(?:${patternStr})([^.]*?)(Bộ luật|Luật)\\s+([${VIET_CHARS}\\s]+)\\s+năm\\s+(\\d{4})`, "gi");
      while ((match = luatRegex.exec(text)) !== null) {
        const contextText = match[1] || '';
        const nodeMatch = contextText.match(nodeRefPattern);
        const targetNodeRef = nodeMatch ? nodeMatch[0].trim() : undefined;
        results.push({
          relationshipType: relType,
          targetDocNumber: `${match[2]} ${match[3].trim()} năm ${match[4]}`,
          sourceNodeRef,
          targetNodeRef,
        });
      }
    };

    findRels('thay thế', 'THAY_THE');
    findRels('bãi bỏ|huỷ bỏ|hủy bỏ', 'BAI_BO');
    findRels('sửa đổi|bổ sung', 'SUA_DOI');

    return results;
  }

  /**
   * Merge scraped relations (from tab) and regex relations (from text)
   */
  public static mergeRelations(scraped: ParsedRelationship[], regex: ParsedRelationship[]): ParsedRelationship[] {
    const map = new Map<string, ParsedRelationship>();

    const add = (rel: ParsedRelationship) => {
      if (!rel.targetDocNumber) return;
      // Normalize target for deduplication key
      const normTarget = rel.targetDocNumber.replace(/\s+/g, '').toUpperCase();
      const key = `${normTarget}_${rel.relationshipType}`;
      if (!map.has(key)) {
        map.set(key, {
          ...rel,
          normalizedTargetNumber: normTarget // Attach for later Prisma lookup
        });
      }
    };

    scraped.forEach(add);
    regex.forEach(add);

    return Array.from(map.values());
  }
}
