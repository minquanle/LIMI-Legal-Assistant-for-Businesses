import { prisma } from '../infrastructure/db.js';

const ENTERPRISE_TEMPLATES = [
  // ─────────────────────────────────────────────────────────────────
  // 1. HÀNH CHÍNH & QUẢN TRỊ (ADMIN & GOVERNANCE)
  // ─────────────────────────────────────────────────────────────────
  {
    code: 'QUYET_DINH_BAN_HANH',
    title: 'Quyết định Ban hành Quy chế / Quy định nội bộ',
    category: 'Hành chính & Quản trị',
    description: 'Quyết định ban hành quy chế hoạt động, quy định quản lý nội bộ doanh nghiệp',
    variables: [
      { key: 'ten_cong_ty', label: 'Tên Công ty', placeholder: 'CÔNG TY CP TECHVN' },
      { key: 'so_quyet_dinh', label: 'Số Quyết định', placeholder: '15/2026/QĐ-TECHVN' },
      { key: 'ten_quy_che', label: 'Tên Quy chế ban hành', placeholder: 'Quy chế Quản lý Tài sản Doanh nghiệp' },
      { key: 'ngay_hieu_luc', label: 'Ngày có hiệu lực', placeholder: '01/03/2026' },
      { key: 'nguoi_ky', label: 'Người ký (Chức vụ & Họ tên)', placeholder: 'Tổng Giám đốc Nguyễn Văn A' },
    ],
    templateBody: `# {{ten_cong_ty}}
**Số: {{so_quyet_dinh}}**
*Hà Nội, ngày ... tháng ... năm 202...*

---

# QUYẾT ĐỊNH
## Về việc ban hành {{ten_quy_che}}

---

### TỔNG GIÁM ĐỐC {{ten_cong_ty}}

- *Căn cứ Luật Doanh nghiệp số 59/2020/QH14 được Quốc hội thông qua ngày 17/06/2020;*
- *Căn cứ Điều lệ tổ chức và hoạt động của {{ten_cong_ty}};*
- *Xét yêu cầu quản trị nội bộ và đề nghị của Trưởng phòng Hành chính - Nhân sự.*

---

### QUYẾT ĐỊNH:

**Điều 1.** Ban hành kèm theo Quyết định này **{{ten_quy_che}}** áp dụng đối với toàn thể cán bộ, nhân viên trong Công ty.

**Điều 2.** Quyết định này có hiệu lực kể từ ngày {{ngay_hieu_luc}}. Các quy định trước đây trái với Quyết định này đều bãi bỏ.

**Điều 3.** Các Trưởng phòng/Ban và toàn thể cán bộ nhân viên chịu trách nhiệm thi hành Quyết định này./.

---

| **Nơi nhận:** | **{{ten_cong_ty}}** |
| :--- | :--- |
| - Như Điều 3; | **TỔNG GIÁM ĐỐC** |
| - Lưu: VT, HCNS. | *(Ký, ghi rõ họ tên và đóng dấu)* |
| | **{{nguoi_ky}}** |
`,
  },
  {
    code: 'TO_TRINH_NGAN_SACH',
    title: 'Tờ trình Xin phê duyệt Ngân sách / Dự án đầu tư',
    category: 'Hành chính & Quản trị',
    description: 'Tờ trình đề xuất Ban Giám đốc phê duyệt chủ trương và ngân sách triển khai dự án',
    variables: [
      { key: 'phong_ban_trinh', label: 'Phòng ban trình', placeholder: 'Phòng Công nghệ Thông tin' },
      { key: 'ten_du_an', label: 'Tên Dự án / Nhu cầu chi', placeholder: 'Nâng cấp Hạ tầng Server & AI Legal Copilot' },
      { key: 'tong_ngan_sach', label: 'Tổng ngân sách đề xuất', placeholder: '500,000,000 VNĐ (Năm trăm triệu đồng)' },
    ],
    templateBody: `# {{phong_ban_trinh}}
**Số: .../TTr-IT**
*Hà Nội, ngày ... tháng ... năm 202...*

---

# TỜ TRÌNH
## Về việc phê duyệt chủ trương và ngân sách {{ten_du_an}}

---

**Kính gửi:** BAN GIÁM ĐỐC CÔNG TY

### I. SỰ CẦN THIẾT TRIỂN KHAI
Nhằm đáp ứng yêu cầu chuyển đổi số và nâng cao năng suất hoạt động của doanh nghiệp, {{phong_ban_trinh}} xin trình Ban Giám đốc phê duyệt chủ trương triển khai **{{ten_du_an}}**.

### II. NỘI DUNG VÀ HẠNG MỤC ĐẦU TƯ
1. **Mục tiêu**: Xây dựng hệ thống tự động hóa tra cứu luật và soạn thảo văn bản.
2. **Kế hoạch triển khai**: Quý I/2026 - Quý II/2026.
3. **Dự toán ngân sách**: **{{tong_ngan_sach}}**.

### III. KIẾN NGHỊ
Kính trình Ban Giám đốc xem xét phê duyệt chủ trương và hạn mức kinh phí nêu trên để phòng ban tiến hành các bước tiếp theo./.

---

| **Nơi nhận:** | **TRƯỞNG PHÒNG TRÌNH** |
| :--- | :--- |
| - Kính gửi Ban Giám đốc; | *(Ký và ghi rõ họ tên)* |
| - Lưu: VT, IT. | |
`,
  },

  // ─────────────────────────────────────────────────────────────────
  // 2. NHÂN SỰ & LAO ĐỘNG (HR & LABOR)
  // ─────────────────────────────────────────────────────────────────
  {
    code: 'HDLD_2019',
    title: 'Hợp đồng Lao động (Bộ luật Lao động 2019)',
    category: 'Nhân sự & Lao động',
    description: 'Mẫu hợp đồng lao động xác định / không xác định thời hạn chuẩn Bộ luật Lao động 2019',
    variables: [
      { key: 'ten_cong_ty', label: 'Tên Công ty (Bên A)', placeholder: 'CÔNG TY CP TECHVN' },
      { key: 'ho_ten_nld', label: 'Họ và tên Người lao động (Bên B)', placeholder: 'Nguyễn Văn B' },
      { key: 'cccd_nld', label: 'Số CCCD Bên B', placeholder: '001092001234' },
      { key: 'chuc_danh', label: 'Vị trí công việc / Chức danh', placeholder: 'Chuyên viên Pháp chế Senior' },
      { key: 'muc_luong', label: 'Mức lương chính (VNĐ/tháng)', placeholder: '25,000,000 VNĐ' },
      { key: 'thoi_gian_thu_viec', label: 'Thời gian thử việc', placeholder: '60 ngày' },
    ],
    templateBody: `# CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
**Độc lập - Tự do - Hạnh phúc**
---

# HỢP ĐỒNG LAO ĐỘNG
**Số: .../HĐLĐ-TECHVN**

- *Căn cứ Bộ luật Lao động số 45/2019/QH14 ngày 20/11/2019;*
- *Căn cứ nhu cầu và khả năng của hai Bên.*

Hôm nay, ngày ... tháng ... năm 202..., tại văn phòng {{ten_cong_ty}}, chúng tôi gồm:

### BÊN A: NGUỜI SỬ DỤNG LAO ĐỘNG
- **Tên đơn vị**: {{ten_cong_ty}}
- **Đại diện**: Ông/Bà... - Chức vụ: Tổng Giám đốc

### BÊN B: NGƯỜI LAO ĐỘNG
- **Họ và tên**: **{{ho_ten_nld}}**
- **Số CCCD**: {{cccd_nld}} ngày cấp... tại Cục CSQLHC về TTXH
- **Địa chỉ thường trú**: ...

---

### THỎA THUẬN CÁC ĐIỀU KHOẢN:

**Điều 1. Công việc và Thời hạn hợp đồng**
1. Vị trí công tác: **{{chuc_danh}}**.
2. Thời gian thử việc: **{{thoi_gian_thu_viec}}** (Hưởng 85% lương chính thức theo đúng Điều 25, 26 Bộ luật Lao động 2019).

**Điều 2. Chế độ Lương và Phụ cấp**
1. Mức lương chính: **{{muc_luong}}**/tháng.
2. Hình thức trả lương: Chuyển khoản vào ngày 05 hằng tháng.
3. Chế độ BHXH, BHYT, BHTN: Được đóng đầy đủ theo quy định của pháp luật hiện hành.

**Điều 3. Trách nhiệm và Quyền hạn mỗi bên**
1. Bên B có nghĩa vụ hoàn thành công việc được giao và tuân thủ Nội quy lao động công ty.
2. Bên A có trách nhiệm thanh toán tiền lương đúng hạn và cung cấp phương tiện làm việc.

**Điều 4. Điều khoản thi hành**
Hợp đồng này được lập thành 02 bản có giá trị pháp lý như nhau, mỗi bên giữ 01 bản./.

---

| **ĐẠI DIỆN BÊN A** | **NGƯỜI LAO ĐỘNG (BÊN B)** |
| :--- | :--- |
| *(Ký, ghi rõ họ tên và đóng dấu)* | *(Ký và ghi rõ họ tên)* |
| | **{{ho_ten_nld}}** |
`,
  },
  {
    code: 'THOA_THUAN_NDA',
    title: 'Thỏa thuận Bảo mật Thông tin & Không cạnh tranh (NDA)',
    category: 'Nhân sự & Lao động',
    description: 'Thỏa thuận bảo mật bí mật kinh doanh, dữ liệu khách hàng và sở hữu trí tuệ',
    variables: [
      { key: 'ten_cong_ty', label: 'Tên Công ty', placeholder: 'CÔNG TY CP TECHVN' },
      { key: 'ho_ten_nhan_vien', label: 'Họ tên Nhân viên', placeholder: 'Trần Thị C' },
    ],
    templateBody: `# THỎA THUẬN BẢO MẬT THÔNG TIN (NDA)
**Và Thỏa thuận Không Cạnh tranh**

Giữa **{{ten_cong_ty}}** và Ông/Bà **{{ho_ten_nhan_vien}}**.

### Điều 1. Phạm vi Thông tin Bảo mật
Mọi thông tin bao gồm mã nguồn, thuật toán AI, cơ sở dữ liệu luật, danh sách khách hàng, kế hoạch kinh doanh và bí quyết công nghệ của {{ten_cong_ty}} đều là tài sản bảo mật tuyệt đối.

### Điều 2. Nghĩa vụ Bảo mật
1. Nhân viên cam kết không tiết lộ, sao chép hoặc chuyển giao thông tin bảo mật cho bất kỳ bên thứ ba nào nếu không có sự đồng ý bằng văn bản.
2. Cam kết giữ bảo mật ngay cả sau khi chấm dứt Hợp đồng lao động.

---
| **ĐẠI DIỆN CÔNG TY** | **NHÂN VIÊN CAM KẾT** |
| :--- | :--- |
| *(Ký và đóng dấu)* | *(Ký và ghi rõ họ tên)* |
`,
  },

  // ─────────────────────────────────────────────────────────────────
  // 3. PHÁP CHẾ DOANH NGHIỆP & ĐẦU TƯ (CORPORATE & GOVERNANCE)
  // ─────────────────────────────────────────────────────────────────
  {
    code: 'NGHI_QUYET_HDQT',
    title: 'Nghị quyết Hội đồng Quản trị (Luật Doanh nghiệp 2020)',
    category: 'Pháp chế & Đầu tư',
    description: 'Nghị quyết HĐQT về việc thông qua các quyết định quản trị và đầu tư doanh nghiệp',
    variables: [
      { key: 'ten_cong_ty', label: 'Tên Công ty', placeholder: 'CÔNG TY CP TECHVN' },
      { key: 'so_nghi_quyet', label: 'Số Nghị quyết', placeholder: '08/2026/NQ-HĐQT' },
      { key: 'noi_dung_thong_qua', label: 'Nội dung thông qua', placeholder: 'Thông qua chủ trương mở rộng dự án AI Legal Copilot Enterprise' },
      { key: 'chu_tich_hdqt', label: 'Chủ tịch HĐQT', placeholder: 'Phạm Văn D' },
    ],
    templateBody: `# HỘI ĐỒNG QUẢN TRỊ {{ten_cong_ty}}
**Số: {{so_nghi_quyet}}**
*Hà Nội, ngày ... tháng ... năm 202...*

---

# NGHỊ QUYẾT HỘI ĐỒNG QUẢN TRỊ
## Về việc {{noi_dung_thong_qua}}

---

### HỘI ĐỒNG QUẢN TRỊ {{ten_cong_ty}}

- *Căn cứ Luật Doanh nghiệp số 59/2020/QH14 được Quốc hội thông qua ngày 17/06/2020;*
- *Căn cứ Điều lệ {{ten_cong_ty}};*
- *Căn cứ Biên bản kiểm phiếu biểu quyết của Hội đồng Quản trị họp ngày...*

---

### QUYẾT NGHỊ:

**Điều 1.** Thông qua **{{noi_dung_thong_qua}}** với tỷ lệ tán thành 100% tổng số thành viên HĐQT.

**Điều 2.** Giao Tổng Giám đốc chỉ đạo các phòng ban triển khai thực hiện đúng quy định của pháp luật và Điều lệ Công ty.

**Điều 3.** Nghị quyết này có hiệu lực kể từ ngày ký./.

---

| **Nơi nhận:** | **TM. HỘI ĐỒNG QUẢN TRỊ** |
| :--- | :--- |
| - Các thành viên HĐQT; | **CHỦ TỊCH HĐQT** |
| - Ban Giám đốc; | *(Ký, ghi rõ họ tên và đóng dấu)* |
| - Lưu: VT. | **{{chu_tich_hdqt}}** |
`,
  },

  // ─────────────────────────────────────────────────────────────────
  // 4. MUA BÁN & THƯƠNG MẠI (COMMERCIAL CONTRACTS)
  // ─────────────────────────────────────────────────────────────────
  {
    code: 'HD_MUA_BAN_HANG_HOA',
    title: 'Hợp đồng Mua bán Hàng hóa Thương mại',
    category: 'Mua bán & Thương mại',
    description: 'Hợp đồng mua bán hàng hóa chuẩn Luật Thương mại 2005 và Bộ luật Dân sự 2015',
    variables: [
      { key: 'ben_ban', label: 'Tên Bên Bán (Bên A)', placeholder: 'CÔNG TY CP TÍCH HỢP TECH' },
      { key: 'ben_mua', label: 'Tên Bên Mua (Bên B)', placeholder: 'CÔNG TY TNHH ĐẦU TƯ ABC' },
      { key: 'ten_hang_hoa', label: 'Tên Hàng hóa / Sản phẩm', placeholder: 'Bản quyền Phần mềm Tinix Legal Copilot Enterprise' },
      { key: 'tong_gia_tri', label: 'Tổng giá trị hợp đồng (VNĐ)', placeholder: '350,000,000 VNĐ (Đã bao gồm VAT)' },
    ],
    templateBody: `# HỢP ĐỒNG MUA BÁN HÀNG HÓA
**Số: .../HĐMB-2026**

- *Căn cứ Luật Thương mại số 36/2005/QH11 ngày 14/06/2005;*
- *Căn cứ Bộ luật Dân sự số 91/2015/QH13 ngày 24/11/2015;*

Hôm nay, hai bên gồm:

**BÊN A (BÊN BÁN)**: {{ben_ban}}
- Mã số thuế: ...
- Đại diện: ... - Chức vụ: ...

**BÊN B (BÊN MUA)**: {{ben_mua}}
- Mã số thuế: ...
- Đại diện: ... - Chức vụ: ...

### ĐIỀU KHOẢN THỎA THUẬN:

**Điều 1. Đối tượng hợp đồng**
Bên A đồng ý bán và Bên B đồng ý mua **{{ten_hang_hoa}}** mới 100% kèm tài liệu hướng dẫn.

**Điều 2. Giá trị hợp đồng và Phương thức thanh toán**
1. Tổng giá trị hợp đồng: **{{tong_gia_tri}}**.
2. Phương thức thanh toán: Chuyển khoản ngân hàng 02 đợt.

**Điều 3. Trách nhiệm bảo hành & Bảo mật**
Bên A cam kết bảo hành kỹ thuật 12 tháng kể từ ngày ký Biên bản bàn giao nghiệm thu.

---
| **ĐẠI DIỆN BÊN A** | **ĐẠI DIỆN BÊN B** |
| :--- | :--- |
| *(Ký và đóng dấu)* | *(Ký và đóng dấu)* |
`,
  },
  {
    code: 'HD_DICH_VU_CNTT',
    title: 'Hợp đồng Cung cấp Dịch vụ CNTT & Phần mềm',
    category: 'Mua bán & Thương mại',
    description: 'Hợp đồng triển khai phần mềm, giải pháp AI và bảo trì hệ thống công nghệ',
    variables: [
      { key: 'ben_cung_cap', label: 'Bên Cung cấp Dịch vụ', placeholder: 'CÔNG TY CP TINIX AI' },
      { key: 'ben_su_dung', label: 'Bên Sử dụng Dịch vụ', placeholder: 'CÔNG TY CP TẬP ĐOÀN XYZ' },
      { key: 'ten_dich_vu', label: 'Tên Dịch vụ triển khai', placeholder: 'Triển khai Trợ lý Pháp chế AI Copilot' },
    ],
    templateBody: `# HỢP ĐỒNG CUNG CẤP DỊCH VỤ CNTT
**Số: .../HĐDV-IT**

Giữa **{{ben_cung_cap}}** (Bên A) và **{{ben_su_dung}}** (Bên B) về việc triển khai **{{ten_dich_vu}}**.

### Điều 1. Nội dung công việc
Bên A cung cấp hạ tầng, mô hình AI và cài đặt hệ thống phần mềm cho Bên B.

### Điều 2. Tiêu chuẩn nghiệm thu
Dịch vụ được nghiệm thu khi đáp ứng đầy đủ tính năng tra cứu RAG và đạt tỷ lệ kiểm tra 100% không lỗi nghiêm trọng.

---
| **ĐẠI DIỆN BÊN A** | **ĐẠI DIỆN BÊN B** |
| :--- | :--- |
| *(Ký và đóng dấu)* | *(Ký và đóng dấu)* |
`,
  },

  // ─────────────────────────────────────────────────────────────────
  // 5. TÀI CHÍNH & KẾ TOÁN (FINANCE & ACCOUNTING)
  // ─────────────────────────────────────────────────────────────────
  {
    code: 'QUYET_DINH_CHI_TIEU',
    title: 'Quyết định Phê duyệt Chi tiêu / Tạm ứng Ngân sách',
    category: 'Tài chính & Kế toán',
    description: 'Quyết định phê duyệt kinh phí và tạm ứng cho các hoạt động sản xuất kinh doanh',
    variables: [
      { key: 'ten_cong_ty', label: 'Tên Công ty', placeholder: 'CÔNG TY CP TECHVN' },
      { key: 'nguoi_tam_ung', label: 'Người nhận tạm ứng / Chi trả', placeholder: 'Bà Lê Thị E - Kế toán trưởng' },
      { key: 'so_tien_chi', label: 'Số tiền phê duyệt (VNĐ)', placeholder: '120,000,000 VNĐ' },
      { key: 'ly_do_chi', label: 'Lý do chi tiêu', placeholder: 'Thanh toán phí duy trì hạ tầng Cloud & Database năm 2026' },
    ],
    templateBody: `# {{ten_cong_ty}}
**Số: .../QĐ-TCKT**
*Hà Nội, ngày ... tháng ... năm 202...*

---

# QUYẾT ĐỊNH
## Về việc phê duyệt chi kinh phí {{ly_do_chi}}

---

### TỔNG GIÁM ĐỐC {{ten_cong_ty}}

- *Căn cứ Luật Kế toán số 88/2015/QH13 ngày 20/11/2015;*
- *Căn cứ Quy chế Quản lý Tài chính của {{ten_cong_ty}};*
- *Xét Đề nghị thanh toán của Phòng TCKT.*

---

### QUYẾT ĐỊNH:

**Điều 1.** Phê duyệt xuất chi ngân sách số tiền: **{{so_tien_chi}}** cho {{nguoi_tam_ung}} để thực hiện {{ly_do_chi}}.

**Điều 2.** Phòng Tài chính - Kế toán chịu trách nhiệm kiểm tra chứng từ hợp lệ và thực hiện hạch toán kế toán theo đúng quy định.

**Điều 3.** Quyết định này có hiệu lực kể từ ngày ký./.

---

| **Nơi nhận:** | **TỔNG GIÁM ĐỐC** |
| :--- | :--- |
| - Phòng TCKT; | *(Ký và đóng dấu)* |
| - Lưu: VT. | |
`,
  },
];

async function main() {
  console.log('Seeding enterprise document templates...');
  for (const t of ENTERPRISE_TEMPLATES) {
    await prisma.documentTemplate.upsert({
      where: { code: t.code },
      update: {
        title: t.title,
        category: t.category,
        description: t.description,
        templateBody: t.templateBody,
        variables: t.variables,
      },
      create: {
        code: t.code,
        title: t.title,
        category: t.category,
        description: t.description,
        templateBody: t.templateBody,
        variables: t.variables,
      },
    });
    console.log(`Seeded enterprise template: [${t.category}] ${t.code} - ${t.title}`);
  }
  console.log('All 10+ Enterprise templates seeded successfully!');
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
