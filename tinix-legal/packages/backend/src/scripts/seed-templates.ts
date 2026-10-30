import { prisma } from '../infrastructure/db.js';

const DEFAULT_TEMPLATES = [
  {
    code: 'QUYET_DINH',
    title: 'Mẫu Quyết định (Nghị định 30/2020/NĐ-CP)',
    category: 'Hành chính',
    description: 'Quyết định cá biệt hoặc quy phạm về việc thành lập, phê duyệt, ban hành quy định',
    templateBody: `# CƠ QUAN BAN HÀNH
**Số: ....../QĐ-......**
*Địa danh, ngày ... tháng ... năm 202...*

---

# QUYẾT ĐỊNH
## Về việc [Tên chủ đề quyết định]

---

### TÊN THẨM QUYỀN BAN HÀNH

- *Căn cứ Luật Tổ chức chính quyền địa phương số 77/2015/QH13;*
- *Căn cứ Nghị định số 30/2020/NĐ-CP ngày 05/3/2020 của Chính phủ về công tác văn thư;*
- *Theo đề nghị của [Tên chức danh / đơn vị trình].*

---

### QUYẾT ĐỊNH:

**Điều 1.** [Nội dung quyết định chính]

**Điều 2.** [Quy định về trách nhiệm thi hành]

**Điều 3.** Quyết định này có hiệu lực kể từ ngày ký. Các Chánh Văn phòng, Trưởng các đơn vị có trách nhiệm thi hành Quyết định này./.

---

| **Nơi nhận:** | **THẨM QUYỀN BAN HÀNH** |
| :--- | :--- |
| - Như Điều 3; | *(Ký, ghi rõ họ tên và đóng dấu)* |
| - Lưu: VT, ... | |
`,
  },
  {
    code: 'TO_TRINH',
    title: 'Mẫu Tờ trình (Nghị định 30/2020/NĐ-CP)',
    category: 'Hành chính',
    description: 'Tờ trình ban hành văn bản, phê duyệt chủ trương, đề án',
    templateBody: `# CƠ QUAN TRÌNH
**Số: ....../TTr-......**
*Địa danh, ngày ... tháng ... năm 202...*

---

# TỜ TRÌNH
## Về việc phê duyệt [Tên chủ trương / đề án / dự thảo]

---

**Kính gửi:** [Tên cơ quan / cấp có thẩm quyền nhận tờ trình]

Thực hiện quy định của pháp luật và yêu cầu thực tiễn, [Tên cơ quan trình] xin trình [Cấp có thẩm quyền] xem xét, phê duyệt [Tên chủ đề] với các nội dung sau:

### I. SỰ CẦN THIẾT BAN HÀNH / PHÊ DUYỆT
1. Bối cảnh và lý do thực tiễn.
2. Căn cứ pháp lý:
   - *Căn cứ Luật ...*
   - *Căn cứ Nghị định ...*

### II. NỘI DUNG CHÍNH CỦA ĐỀ ÁN / DỰ THẢO
1. Mục tiêu và phạm vi áp dụng.
2. Các nội dung cơ bản.

### III. KIẾN NGHỊ
Kính trình [Cấp có thẩm quyền] xem xét, quyết định./.

---

| **Nơi nhận:** | **THỦ TRƯỞNG ĐƠN VỊ TRÌNH** |
| :--- | :--- |
| - Như trên; | *(Ký, ghi rõ họ tên và đóng dấu)* |
| - Lưu: VT, ... | |
`,
  },
  {
    code: 'CONG_VAN',
    title: 'Mẫu Công văn hành chính',
    category: 'Hành chính',
    description: 'Công văn trao đổi, hướng dẫn, phối hợp công tác',
    templateBody: `# CƠ QUAN GỬI
**Số: ....../......-......**
*V/v [Trích yếu nội dung công văn]*

*Địa danh, ngày ... tháng ... năm 202...*

---

**Kính gửi:** [Tên cơ quan / tổ chức / cá nhân nhận]

Kính gửi Quý Cơ quan,

Thực hiện chỉ đạo tại [Số hiệu văn bản chỉ đạo nếu có], [Tên cơ quan gửi] xin trao đổi / hướng dẫn nội dung sau:

1. [Nội dung trao đổi / yêu cầu thứ nhất]
2. [Nội dung phối hợp thứ hai]

Rất mong nhận được sự phối hợp của Quý Cơ quan./.

---

| **Nơi nhận:** | **THỦ TRƯỞNG CƠ QUAN** |
| :--- | :--- |
| - Như trên; | *(Ký, ghi rõ họ tên và đóng dấu)* |
| - Lưu: VT. | |
`,
  },
];

async function main() {
  console.log('Seeding document templates...');
  for (const t of DEFAULT_TEMPLATES) {
    await prisma.documentTemplate.upsert({
      where: { code: t.code },
      update: t,
      create: t,
    });
    console.log(`Seeded template: ${t.code} (${t.title})`);
  }
  console.log('Document templates seeded successfully!');
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
