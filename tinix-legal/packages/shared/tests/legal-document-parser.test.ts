import { describe, it, expect } from 'vitest';
import { parseLegalText, flattenAST } from '../src/legal-document-parser';
import { ASTNodeType } from '../src/types';

describe('Legal Document Parser', () => {
  describe('parseLegalText structural parsing', () => {
    it('should parse a basic document structure (Chương, Điều, Khoản, Điểm)', () => {
      const text = `
CHÍNH PHỦ ------- CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                 Độc lập - Tự do - Hạnh phúc
                 ---------------
Số: 12/2026/NĐ-CP
Hà Nội, ngày 15 tháng 1 năm 2026

NGHỊ ĐỊNH
Quy định chi tiết thi hành một số điều của Luật Hải quan

Căn cứ Luật Tổ chức Chính phủ ngày 19 tháng 6 năm 2015;
Chính phủ ban hành Nghị định quy định chi tiết thi hành một số điều của Luật Hải quan.

Chương I
QUY ĐỊNH CHUNG

Điều 1. Phạm vi điều chỉnh
1. Nghị định này quy định chi tiết về thủ tục hải quan.
2. Các biện pháp kiểm tra giám sát hải quan bao gồm:
a) Kiểm tra hồ sơ hải quan;
b) Kiểm tra thực tế hàng hóa.

Điều 2. Đối tượng áp dụng
Nghị định này áp dụng đối với tổ chức, cá nhân thực hiện hoạt động xuất nhập khẩu.
      `.trim();

      const result = parseLegalText(text);
      expect(result.isParsed).toBe(true);
      expect(result.header?.documentNumber).toBe('12/2026/NĐ-CP');
      expect(result.header?.issuingBody).toBe('CHÍNH PHỦ');
      expect(result.docType).toBe('NGHỊ ĐỊNH');
      expect(result.preambles).toHaveLength(1);
      expect(result.preambles[0]).toContain('Căn cứ Luật Tổ chức Chính phủ');
      expect(result.enactingClause).toContain('Chính phủ ban hành Nghị định');

      // Check AST
      const flat = flattenAST(result.astNodes);
      expect(flat).toHaveLength(7);
      // Let's check exactly:
      // Node 0: CHUONG I
      // Node 1: DIEU 1
      // Node 2: KHOAN 1
      // Node 3: KHOAN 2
      // Node 4: DIEM a
      // Node 5: DIEM b
      // Node 6: DIEU 2
      
      const chuong = flat.find(n => n.nodeType === ASTNodeType.CHUONG);
      expect(chuong).toBeDefined();
      expect(chuong?.ordinal).toBe('I');
      expect(chuong?.heading).toContain('Chương I');

      const dieu1 = flat.find(n => n.nodeType === ASTNodeType.DIEU && n.ordinal === '1');
      expect(dieu1).toBeDefined();
      expect(dieu1?.heading).toContain('Điều 1. Phạm vi điều chỉnh');

      const diemA = flat.find(n => n.nodeType === ASTNodeType.DIEM && n.ordinal === 'a');
      expect(diemA).toBeDefined();
      expect(diemA?.content).toContain('Kiểm tra hồ sơ hải quan');
    });

    it('should parse a complete complex document structure (Phần, Chương, Mục, Điều, Khoản, Điểm)', () => {
      const text = `
CHÍNH PHỦ ------- CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                 Độc lập - Tự do - Hạnh phúc
                 ---------------
Số: 99/2026/NĐ-CP
Hà Nội, ngày 20 tháng 3 năm 2026

NGHỊ ĐỊNH
Quy định về quản lý hoạt động vận tải thủy nội địa

Căn cứ Luật Tổ chức Chính phủ ngày 19 tháng 6 năm 2015;
Chính phủ ban hành Nghị định quy định về quản lý hoạt động vận tải thủy nội địa.

Phần thứ nhất
QUY ĐỊNH CHUNG VỀ HOẠT ĐỘNG VẬN TẢI

Chương I
PHẠM VI VÀ ĐỐI TƯỢNG

Mục 1
QUY ĐỊNH CHUNG

Điều 1. Phạm vi điều chỉnh
1. Nghị định này quy định về điều kiện kinh doanh vận tải thủy.
2. Hoạt động vận tải thủy bao gồm các dịch vụ sau:
a) Vận tải hàng hóa nguy hiểm;
b) Vận tải hành khách theo tuyến cố định.
      `.trim();

      const result = parseLegalText(text);
      expect(result.isParsed).toBe(true);

      const flat = flattenAST(result.astNodes);
      
      expect(flat).toHaveLength(8);

      const phan = flat.find(n => n.nodeType === ASTNodeType.PHAN);
      expect(phan).toBeDefined();
      expect(phan?.ordinal).toBe('nhất');
      expect(phan?.heading).toContain('Phần thứ nhất');

      const chuong = flat.find(n => n.nodeType === ASTNodeType.CHUONG);
      expect(chuong).toBeDefined();
      expect(chuong?.ordinal).toBe('I');
      expect(chuong?.heading).toContain('Chương I');

      const muc = flat.find(n => n.nodeType === ASTNodeType.MUC);
      expect(muc).toBeDefined();
      expect(muc?.ordinal).toBe('1');
      expect(muc?.heading).toContain('Mục 1');

      const dieu = flat.find(n => n.nodeType === ASTNodeType.DIEU);
      expect(dieu).toBeDefined();
      expect(dieu?.ordinal).toBe('1');

      const khoan = flat.find(n => n.nodeType === ASTNodeType.KHOAN && n.ordinal === '2');
      expect(khoan).toBeDefined();

      const diem = flat.find(n => n.nodeType === ASTNodeType.DIEM && n.ordinal === 'b');
      expect(diem).toBeDefined();
      expect(diem?.content).toContain('Vận tải hành khách theo tuyến cố định');
    });
  });

  describe('Bug Regression Tests', () => {
    it('should NOT match cross-references like "của Điều X" as new nodes', () => {
      const text = `
Điều 1. Sửa đổi, bổ sung một số điểm, khoản của Điều 2
1. Sửa đổi, bổ sung khoản 1 Điều 2 như sau:
“1. Nghị định này quy định về hành vi...”
      `.trim();

      const result = parseLegalText(text);
      const flat = flattenAST(result.astNodes);
      
      // It should only have "Điều 1" and its children, NOT "Điều 2"
      const dieu2 = flat.find(n => n.nodeType === ASTNodeType.DIEU && n.ordinal === '2');
      expect(dieu2).toBeUndefined(); // Should not parse "của Điều 2" or "khoản 1 Điều 2" as a separate Điều 2 node!

      const dieu1 = flat.find(n => n.nodeType === ASTNodeType.DIEU && n.ordinal === '1');
      expect(dieu1).toBeDefined();
    });

    it('should NOT match cross-references like "theo quy định tại Điều Y" as new nodes', () => {
      const text = `
Điều 3. Biện pháp xử lý
Thực hiện cưỡng chế theo quy định tại Điều 15 của Luật này.
      `.trim();

      const result = parseLegalText(text);
      const flat = flattenAST(result.astNodes);

      const dieu15 = flat.find(n => n.nodeType === ASTNodeType.DIEU && n.ordinal === '15');
      expect(dieu15).toBeUndefined();

      const dieu3 = flat.find(n => n.nodeType === ASTNodeType.DIEU && n.ordinal === '3');
      expect(dieu3).toBeDefined();
    });

    it('should NOT start parsing body at a cross-reference in the document title', () => {
      const text = `
ỦY BAN NHÂN DÂN
Số: 101/2025/TT-BNNMT
Hà Nội, ngày 20 tháng 3 năm 2026

THÔNG TƯ
Hướng dẫn các loại máy phục vụ cho sản xuất nông nghiệp chưa được quy định tại khoản 6 Điều 19 của Chính phủ quy định chi tiết thi hành một số điều của Luật Thuế giá trị gia tăng

Điều 1. Phạm vi điều chỉnh
Thông tư này quy định các loại máy...
      `.trim();

      const result = parseLegalText(text);
      const flat = flattenAST(result.astNodes);

      // The title's "Điều 19" should NOT be parsed as a node!
      const dieu19 = flat.find(n => n.nodeType === ASTNodeType.DIEU && n.ordinal === '19');
      expect(dieu19).toBeUndefined();

      // Only the actual "Điều 1" should be parsed
      const dieu1 = flat.find(n => n.nodeType === ASTNodeType.DIEU && n.ordinal === '1');
      expect(dieu1).toBeDefined();
      expect(dieu1?.heading).toContain('Điều 1. Phạm vi điều chỉnh');
    });

    it('should normalize spaced numbers and Roman numerals in headings', () => {
      const text = `
Chương I I
PHẠM VI ĐIỀU CHỈNH
Điều 3 2. Quy định chung
Đây là nội dung của Điều 32.
Điều 3 3. Bổ sung Điều 4 a vào sau Điều 4
Đây là nội dung của Điều 33.
      `.trim();

      const result = parseLegalText(text);
      const flat = flattenAST(result.astNodes);

      // Should normalize "Chương I I" to "Chương II"
      const chuong = flat.find(n => n.nodeType === ASTNodeType.CHUONG);
      expect(chuong).toBeDefined();
      expect(chuong?.ordinal).toBe('II');
      expect(chuong?.heading).toContain('Chương II');

      // Should normalize "Điều 3 2" to "Điều 32"
      const dieu32 = flat.find(n => n.nodeType === ASTNodeType.DIEU && n.ordinal === '32');
      expect(dieu32).toBeDefined();
      expect(dieu32?.heading).toContain('Điều 32. Quy định chung');

      // Should normalize "Điều 3 3" to "Điều 33" and "Điều 4 a" to "Điều 4a"
      const dieu33 = flat.find(n => n.nodeType === ASTNodeType.DIEU && n.ordinal === '33');
      expect(dieu33).toBeDefined();
      expect(dieu33?.heading).toContain('Điều 33. Bổ sung Điều 4a vào sau Điều 4');
    });

    it('should NOT match cross-references in preambles using "Căn cứ"', () => {
      const text = `
Căn cứ Điều 4 Luật Tổ chức Chính phủ.
Chính phủ ban hành Nghị định:

Điều 1. Phạm vi điều chỉnh
Nội dung Điều 1.
      `.trim();
      const result = parseLegalText(text);
      const flat = flattenAST(result.astNodes);
      
      const dieu4 = flat.find(n => n.nodeType === ASTNodeType.DIEU && n.ordinal === '4');
      expect(dieu4).toBeUndefined();

      const dieu1 = flat.find(n => n.nodeType === ASTNodeType.DIEU && n.ordinal === '1');
      expect(dieu1).toBeDefined();
    });

    it('should NOT match self-references like "Điều X của Nghị định này"', () => {
      const text = `
Điều 1. Phạm vi điều chỉnh
Điều 1 của Nghị định này được áp dụng đối với tất cả mọi người.
      `.trim();
      const result = parseLegalText(text);
      const flat = flattenAST(result.astNodes);
      
      // We should only have one "Điều 1" node
      const dieu1Matches = flat.filter(n => n.nodeType === ASTNodeType.DIEU && n.ordinal === '1');
      expect(dieu1Matches).toHaveLength(1);
    });

    it('should NOT match quoted article headings inside amending laws', () => {
      const text = `
Điều 1. Sửa đổi, bổ sung một số điều
Bổ sung Điều 20a vào sau Điều 20 như sau:
“Điều 20a. Gia hạn thời hạn trái phiếu đặc biệt
Nội dung Điều 20a.
”

Điều 2. Hiệu lực thi hành
      `.trim();
      const result = parseLegalText(text);
      const flat = flattenAST(result.astNodes);

      // It should NOT match "Điều 20a" because it is inside quotes (preceded by open quote)
      const dieu20a = flat.find(n => n.nodeType === ASTNodeType.DIEU && n.ordinal === '20a');
      expect(dieu20a).toBeUndefined();

      const dieu1 = flat.find(n => n.nodeType === ASTNodeType.DIEU && n.ordinal === '1');
      expect(dieu1).toBeDefined();

      const dieu2 = flat.find(n => n.nodeType === ASTNodeType.DIEU && n.ordinal === '2');
      expect(dieu2).toBeDefined();
    });

    it('should match a new article even if it immediately follows a cross-reference ending a sentence on the same line', () => {
      const text = `
Điều 52. Nội dung
Nội dung 52.

Điều 38. Tổ chức thực hiện
Thay thế cụm từ “đại diện” tại Điều 41. Điều 53. Bãi bỏ Điều 46.

Điều 54. Hiệu lực thi hành
      `.trim();
      const result = parseLegalText(text);
      const flat = flattenAST(result.astNodes);

      const dieu53 = flat.find(n => n.nodeType === ASTNodeType.DIEU && n.ordinal === '53');
      expect(dieu53).toBeDefined();
      expect(dieu53?.heading).toContain('Điều 53. Bãi bỏ Điều 46');
    });
    it('should NOT match Phụ lục as a separate node if it is separated from a cross-reference by two newlines', () => {
      const text = `
Điều 13. Quy đổi sang giờ tín chỉ
1. Việc quy đổi sang giờ tín chỉ được thực hiện theo

PHỤ LỤC 04 BAN HÀNH KÈM THEO THÔNG TƯ NÀY.

2. Đối với việc cập nhật kiến thức...
      `.trim();
      const result = parseLegalText(text);
      const flat = flattenAST(result.astNodes);

      const phuLuc04 = flat.find(n => n.nodeType === ASTNodeType.PHU_LUC && n.ordinal === '04');
      expect(phuLuc04).toBeUndefined(); // Should be considered a cross-reference and not parsed as a node!
    });
  });
});
