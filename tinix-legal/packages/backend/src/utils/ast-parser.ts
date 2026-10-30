import * as cheerio from 'cheerio';
import { ASTNodeType, DocumentType, ValidityStatus } from '@prisma/client';

export interface ExtractedMetadata {
  title?: string;
  documentNumber?: string;
  normalizedNumber?: string;
  documentType?: DocumentType;
  issuingBody?: string;
  issuingBodyCode?: string;
  signer?: string;
  promulgationDate?: Date | null;
  effectiveDate?: Date | null;
  validityStatus?: ValidityStatus;
  field?: string;
}

export interface ParsedBlock {
  type: ASTNodeType | 'TEXT';
  ordinal: string;
  heading: string;
  content: string;
  rawText: string;
}

export interface ASTNode extends ParsedBlock {
  id: string;
  parentId: string | null;
  children: ASTNode[];
  orderIndex: number;
  depth: number;
  path: string;
}

const DOCUMENT_TYPE_MAP: Record<string, DocumentType> = {
  'luật': 'LUAT',
  'bộ luật': 'LUAT',
  'pháp lệnh': 'PHAP_LENH',
  'nghị định': 'NGHI_DINH',
  'nghị quyết': 'NGHI_QUYET',
  'quyết định': 'QUYET_DINH',
  'thông tư': 'THONG_TU',
  'thông tư liên tịch': 'THONG_TU_LIEN_TICH',
  'chỉ thị': 'CHI_THI',
  'công văn': 'CONG_VAN',
  'thông báo': 'THONG_BAO',
  'lệnh': 'LENH',
};

function normalizeDocType(typeStr: string): DocumentType {
  const lower = typeStr.toLowerCase().trim();
  for (const [key, value] of Object.entries(DOCUMENT_TYPE_MAP)) {
    if (lower.includes(key)) return value;
  }
  return 'KHAC';
}

function inferDocTypeFromNumber(docNumber: string): DocumentType {
  const upper = docNumber.toUpperCase();
  if (upper.includes('/QH')) return 'LUAT';
  if (upper.includes('/NĐ-CP') || upper.includes('/ND-CP')) return 'NGHI_DINH';
  if (upper.includes('/NQ-') || upper.includes('/NQ/')) return 'NGHI_QUYET';
  if (upper.includes('/QĐ-') || upper.includes('/QD-')) return 'QUYET_DINH';
  if (upper.includes('/TT-') || upper.includes('/TT/')) return 'THONG_TU';
  if (upper.includes('/TTLT-')) return 'THONG_TU_LIEN_TICH';
  if (upper.includes('/CT-')) return 'CHI_THI';
  if (upper.includes('/PL-')) return 'PHAP_LENH';
  return 'KHAC';
}

function normalizeDocNumber(num: string): string {
  return num
    .trim()
    .replace(/[\s]+/g, '')
    .replace(/[-–—]/g, '/')
    .replace(/\/+/g, '/')
    .toUpperCase();
}

function normalizeIssuingBodyCode(bodyStr: string): string {
  return bodyStr
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '_')
}
const VIET_CHARS = "a-zA-Zà-ýÀ-ÝđĐ\\u00C0-\\u024F\\u1EA0-\\u1EF9";

export class LegalHtmlParser {
  private static readonly RE_PHAN = /^(?:PHẦN|Phần)\s+([IVXLCDM]+(?:[,;\s]+[IVXLCDM]+)*)\b/i;
  private static readonly RE_CHUONG = /^(?:CHƯƠNG|Chương)\s+([IVXLCDM]+(?:[,;\s]+[IVXLCDM]+)*)\b/i;
  private static readonly RE_MUC = /^(?:MỤC|Mục)\s+(\d+)\b/i;
  private static readonly RE_DIEU = /^(?:ĐIỀU|Điều)\s+(\d+[a-zđ]?)\./i;
  private static readonly RE_KHOAN = /^(\d+)\.\s+/;
  private static readonly RE_DIEM = /^([a-zđ])\)\s+/i;
  
  public extractMetadata(html: string): ExtractedMetadata {
    const $ = cheerio.load(html);
    const meta: ExtractedMetadata = {};

    // 1. Try extracting title from h1
    const h1Text = $('h1').text().replace(/\s+/g, ' ').trim();
    if (h1Text && !h1Text.includes('Pending')) {
      meta.title = h1Text;
    }

    // 2. Scan metadata table rows and divs
    $('tr, div.row-info, div.document-item').each((_, el) => {
      const text = $(el).text().replace(/\s+/g, ' ').trim();
      
      // Số hiệu
      if (text.includes('Số hiệu:')) {
        const afterKey = text.substring(text.indexOf('Số hiệu:') + 8).trim();
        // Take up to next label like "Ngày" or "Cơ quan" or "Loại"
        const cleanVal = afterKey.split(/(?:Ngày|Cơ quan|Loại|Người|Trích yếu)/i)[0].trim();
        if (cleanVal) {
          meta.documentNumber = cleanVal;
          meta.normalizedNumber = normalizeDocNumber(cleanVal);
        }
      }
      
      // Loại văn bản
      if (text.includes('Loại văn bản:')) {
        const afterKey = text.substring(text.indexOf('Loại văn bản:') + 13).trim();
        const cleanVal = afterKey.split(/(?:Người|Ngày|Trích yếu|Số hiệu)/i)[0].trim();
        if (cleanVal) {
          meta.documentType = normalizeDocType(cleanVal);
        }
      }

      // Cơ quan ban hành
      if (text.includes('Cơ quan ban hành:')) {
        const afterKey = text.substring(text.indexOf('Cơ quan ban hành:') + 17).trim();
        const cleanVal = afterKey.split(/(?:Số công|Số hiệu|Người|Ngày|Trích yếu)/i)[0].trim();
        if (cleanVal) {
          meta.issuingBody = cleanVal;
          meta.issuingBodyCode = normalizeIssuingBodyCode(cleanVal);
        }
      }

      // Người ký
      if (text.includes('Người ký:')) {
        const afterKey = text.substring(text.indexOf('Người ký:') + 9).trim();
        const cleanVal = afterKey.split(/(?:Trích yếu|Ngày|Loại|Số hiệu)/i)[0].trim();
        if (cleanVal) {
          meta.signer = cleanVal;
        }
      }

      // Trích yếu
      if (text.includes('Trích yếu:')) {
        const afterKey = text.substring(text.indexOf('Trích yếu:') + 10).trim();
        const cleanVal = afterKey.split(/(?:Ngày|Cơ quan|Số hiệu)/i)[0].trim();
        if (cleanVal) {
          meta.title = cleanVal;
        }
      }

      // Ngày ban hành
      if (text.includes('Ngày ban hành:')) {
        const match = text.match(/(\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2})/);
        if (match) {
          meta.promulgationDate = this.parseDate(match[1]);
        }
      }

      // Ngày có hiệu lực / Áp dụng
      if (text.includes('Ngày có hiệu lực:') || text.includes('Áp dụng:')) {
        const match = text.match(/(\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2})/);
        if (match) {
          meta.effectiveDate = this.parseDate(match[1]);
        }
      }

      // Tình trạng hiệu lực
      if (text.includes('Tình trạng hiệu lực:')) {
        const lower = text.toLowerCase();
        if (lower.includes('còn hiệu lực')) {
          meta.validityStatus = 'CON_HIEU_LUC';
        } else if (lower.includes('hết hiệu lực một phần')) {
          meta.validityStatus = 'HET_HIEU_LUC_MOT_PHAN';
        } else if (lower.includes('hết hiệu lực')) {
          meta.validityStatus = 'HET_HIEU_LUC';
        } else if (lower.includes('chưa')) {
          meta.validityStatus = 'CHUA_CO_HIEU_LUC';
        } else if (lower.includes('ngưng')) {
          meta.validityStatus = 'NGUNG_HIEU_LUC';
        } else {
          meta.validityStatus = 'KHONG_XAC_DINH';
        }
      }

      // Lĩnh vực
      if (text.includes('Lĩnh vực:')) {
        const afterKey = text.substring(text.indexOf('Lĩnh vực:') + 9).trim();
        if (afterKey) {
          meta.field = afterKey.split(/(?:Ngày|Cơ quan)/i)[0].trim();
        }
      }
    });

    // Fallback documentType from documentNumber if still KHAC
    if ((!meta.documentType || meta.documentType === 'KHAC') && meta.documentNumber) {
      meta.documentType = inferDocTypeFromNumber(meta.documentNumber);
    }

    return meta;
  }

  private parseDate(str: string): Date | null {
    if (str.includes('/')) {
      const parts = str.split('/');
      if (parts.length === 3) {
        return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      }
    } else if (str.includes('-')) {
      return new Date(str);
    }
    return null;
  }

  public sanitize(html: string): string {
    const $ = cheerio.load(html);
    
    // 1. Remove scripts, styles, iframe
    $('script, style, link, meta, noscript, iframe').remove();
    
    // 2. Remove website header, sidebar, footer, ads, navigation elements
    $(
      '.menu-mega-content, .sidebar-content, .footer-content, header, footer, nav, ' +
      '.header, .footer, .sidebar, .menu, .breadcrumb, .box-social, .banner, .box-hotline, ' +
      '#header, #footer, .popup-content, .tooltip-content-1, .the-document-item, ' +
      '.box-text-content, .tooltip-1, .cat-box-content, .cat-title, .box-tools, ' +
      '.document-tools, .nav-tab, .tab-title, .table-doc, ' +
      '.lv-header, .lv-footer, .breadcrumb-lv, .widget, .sidebar-lv, .d-none.d-md-block'
    ).remove();

    // 3. Try finding specific legal content containers
    const containers = [
      '.the-document-entry',
      '.the-document-body',
      '#toanvancontent',
      '#fulltext',
      '.content-law',
      '.the-document-vbl',
      'div[class*="content-law"]'
    ];

    for (const sel of containers) {
      if ($(sel).length > 0) {
        return $(sel).first().html() || '';
      }
    }

    $('*').removeAttr('style').removeAttr('class').removeAttr('id').removeAttr('align');
    return $('body').html() || '';
  }

  private normalizeSpacing(text: string): string {
    // 1. Normalize spaces in numeric ordinals, e.g. "Điều 3 2" -> "Điều 32"
    const numRegex = new RegExp(`(?:^|[\\s\\.\\;\\:\\_\\-\\n\\(\\)])(Điều|Chương|Mục|Phần|Khoản|khoản)\\s+(\\d+(?:\\s+\\d+)*(?:\\s+[a-zđ](?![${VIET_CHARS}]))?)`, 'gi');
    text = text.replace(numRegex, (match, g1, g2) => {
      const firstChar = match.charAt(0);
      const prefix = /^[a-zA-Z0-9]$/.test(firstChar) ? '' : (match.startsWith(g1) ? '' : firstChar);
      return prefix + g1 + ' ' + g2.replace(/\s+/g, '');
    });

    // 2. Normalize spaces in Roman ordinals, e.g. "Chương I I" -> "Chương II"
    const romanRegex = new RegExp(`(?:^|[\\s\\.\\?\\!\\;\\:\\_\\-\\n\\(\\)])(Chương|Phần)\\s+([ivxlcdm]+(?:\\s+[ivxlcdm]+)*(?![${VIET_CHARS}]))`, 'gi');
    text = text.replace(romanRegex, (match, g1, g2) => {
      const firstChar = match.charAt(0);
      const prefix = /^[a-zA-Z0-9]$/.test(firstChar) ? '' : (match.startsWith(g1) ? '' : firstChar);
      return prefix + g1 + ' ' + g2.replace(/\s+/g, '').toUpperCase();
    });

    return text;
  }

  public extractBlocks(html: string): string[] {
    const sanitized = this.sanitize(html);
    const $ = cheerio.load(sanitized);
    
    const blocks: string[] = [];
    
    const elements = $('p, tr, li, h1, h2, h3, h4, h5, h6, div:not(:has(p, div, tr, li))');
    
    elements.each((_, el) => {
      let text = $(el).text().replace(/\s+/g, ' ').trim();
      text = this.normalizeSpacing(text);
      if (text.length > 0 && !this.isNoiseText(text)) {
        blocks.push(text);
      }
    });
    
    if (blocks.length === 0) {
      const fallbackText = $.text();
      return fallbackText
        .split(/\n|<br\/?>/gi)
        .map(t => this.normalizeSpacing(t.replace(/\s+/g, ' ').trim()))
        .filter(t => t.length > 0 && !this.isNoiseText(t));
    }

    return blocks;
  }

  private isNoiseText(text: string): boolean {
    const noisePatterns = [
      'Tổng đài trực tuyến',
      'Gói dịch vụ & Giá',
      'Dịch vụ dịch thuật',
      'Đăng ký / Đăng nhập',
      'Văn bản luật Việt Nam',
      'Bản quyền ©',
      'Giấy phép thiết lập',
      'Cơ quan chủ quản',
      'Quét mã QR code',
      'Vui lòng Đăng nhập',
      'Tính năng này chỉ có tại',
      'Ghi chú',
      'Báo lỗi',
      'Chia sẻ:',
      'Danh mục | Tổng đài trực tuyến',
      'Gói dịch vụ & Giá Tra cứu văn bản',
      'Phân tích văn bản Dịch vụ dịch',
      'Dịch vụ nội dung Tổng đài tư vấn',
      'Đăng ký / Đăng nhập Văn bản mới',
      'Tra cứu văn bản Văn bản luật Việt Nam',
      'Hành chính Thuế - Phí Đất đai',
      'Bản tin luật Điểm tin văn bản mới',
      'Luật sư tư vấn AI Luật',
      'Giá xăng hôm nay Tất cả chuyên mục',
      'Trang chủ | Giới thiệu | Trợ giúp',
      'Copyright'
    ];

    return noisePatterns.some(p => text.includes(p));
  }

  public classifyBlock(text: string): ParsedBlock {
    let match;

    if ((match = text.match(LegalHtmlParser.RE_PHAN))) {
      return { type: 'PHAN', ordinal: match[1].toUpperCase(), heading: text, content: text, rawText: text };
    }
    if ((match = text.match(LegalHtmlParser.RE_CHUONG))) {
      return { type: 'CHUONG', ordinal: match[1].toUpperCase(), heading: text, content: text, rawText: text };
    }
    if ((match = text.match(LegalHtmlParser.RE_MUC))) {
      return { type: 'MUC', ordinal: match[1], heading: text, content: text, rawText: text };
    }
    if ((match = text.match(LegalHtmlParser.RE_DIEU))) {
      return { type: 'DIEU', ordinal: match[1], heading: match[0], content: text.substring(match[0].length).trim() || text, rawText: text };
    }
    if ((match = text.match(LegalHtmlParser.RE_KHOAN))) {
      return { type: 'KHOAN', ordinal: match[1], heading: match[0], content: text.substring(match[0].length).trim() || text, rawText: text };
    }
    if ((match = text.match(LegalHtmlParser.RE_DIEM))) {
      return { type: 'DIEM', ordinal: match[1].toLowerCase(), heading: match[0], content: text.substring(match[0].length).trim() || text, rawText: text };
    }

    return { type: 'TEXT', ordinal: '', heading: '', content: text, rawText: text };
  }

  public buildTree(blocks: ParsedBlock[]): ASTNode[] {
    const rootNodes: ASTNode[] = [];
    let orderCounter = 0;

    const stack: { node: ASTNode; type: ASTNodeType | 'TEXT' }[] = [];

    const hierarchy: Record<ASTNodeType | 'TEXT', number> = {
      'PHAN': 1,
      'CHUONG': 2,
      'MUC': 3,
      'DIEU': 4,
      'KHOAN': 5,
      'DIEM': 6,
      'PHU_LUC': 7,
      'TEXT': 99
    };

    for (const block of blocks) {
      const newNode: ASTNode = {
        ...block,
        id: Math.random().toString(36).substring(2, 9),
        parentId: null,
        children: [],
        orderIndex: orderCounter++,
        depth: 0,
        path: ''
      };

      if (block.type === 'TEXT') {
        if (stack.length > 0) {
          const parent = stack[stack.length - 1].node;
          newNode.parentId = parent.id;
          newNode.depth = parent.depth + 1;
          newNode.path = `${parent.path}.text-${newNode.orderIndex}`;
          parent.children.push(newNode);
        } else {
          newNode.path = `text-${newNode.orderIndex}`;
          rootNodes.push(newNode);
        }
        continue;
      }

      while (stack.length > 0) {
        const top = stack[stack.length - 1];
        if (hierarchy[top.type] < hierarchy[block.type]) {
          break;
        }
        stack.pop();
      }

      if (stack.length > 0) {
        const parent = stack[stack.length - 1].node;
        newNode.parentId = parent.id;
        newNode.depth = parent.depth + 1;
        newNode.path = `${parent.path}.${block.type.toLowerCase()}-${block.ordinal}`;
        parent.children.push(newNode);
      } else {
        newNode.depth = 0;
        newNode.path = `${block.type.toLowerCase()}-${block.ordinal}`;
        rootNodes.push(newNode);
      }

      stack.push({ node: newNode, type: block.type });
    }

    return rootNodes;
  }

  public parse(html: string): ASTNode[] {
    const blocks = this.extractBlocks(html);
    const parsedBlocks = blocks.map(b => this.classifyBlock(b));
    return this.buildTree(parsedBlocks);
  }
}
