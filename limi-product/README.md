# LIMI Product

Cập nhật 12/10/2026: đã nhập 4 checklist nháp có căn cứ thật và 19 mục chờ bổ sung; doanh nghiệp chạy thử/lưu tiến độ trên cùng giao diện prototype. Luồng reviewer duyệt–phát hành và checklist chính thức giữ riêng trạng thái rõ ràng. Xem [hướng dẫn checklist trên web](../outputs/HUONG_DAN_CHECKLIST_TREN_WEB_20261012.md).

Cập nhật B16: cùng prototype đã có bộ triển khai production localhost/HTTPS, backup–restore, kiểm thử rollback và runbook pilot. Xem [README-B16](../tinix-legal/README-B16.md). Bản cổng 3000 giữ nguyên; staging tách dữ liệu ở https://localhost:8443/workspace. Việc duyệt nghĩa vụ và nghiệm thu doanh nghiệp thật vẫn cần thực hiện.

Sản phẩm LIMI dùng chung giao diện từ `../Prototype/dist`, được Next phục vụ tại `/workspace`. Dữ liệu luật và hồ sơ doanh nghiệp đi qua API đến PostgreSQL; bản tĩnh chạy riêng vẫn dành cho demo.

## Chạy local

```bash
npm run dev
```

Mở `http://localhost:3000`.

## Quy ước

- Không đưa dữ liệu mẫu hoặc localStorage từ prototype vào luồng sản phẩm.
- UI dùng `Prototype/dist/product-workspace.js` làm API client; gateway Next giữ cookie cùng origin và chuyển tiếp đến backend.
- Sao chép `.env.example` thành `.env.local` khi bắt đầu kết nối dịch vụ; không đưa khóa vào source code.

## Lộ trình gần nhất

Đã tích hợp B1–B4 vào chính giao diện prototype: `/` mở `/workspace`; thư viện nằm trong sidebar chung ở `/workspace?view=laws`. `/library` cũ tự chuyển về giao diện chung. Source giao diện ở `../Prototype/dist`, được đồng bộ bằng `npm run sync:prototype` và tự đồng bộ trước build/dev. Không có iframe hay web tra cứu tách riêng. Backend `tinix-legal` dùng PostgreSQL/S3; URL cấu hình server-side bằng `LIMI_API_URL`. Hướng dẫn vận hành: `../outputs/HUONG_DAN_WEB_THONG_NHAT_B1_B4.md`. Tài liệu importer/API: `../tinix-legal/README-B3-B4.md`.

B1–B7 đã có PostgreSQL, thư viện luật, tài khoản, vai trò và hồ sơ doanh nghiệp. Bước tiếp theo là B8–B10: kho nghĩa vụ được duyệt, rule engine và đánh giá checklist; sau đó task/evidence và cảnh báo.

## Cập nhật B5–B7

Web `/workspace` dùng tài khoản và hồ sơ PostgreSQL qua `/api/workspace/*`, giữ nguyên giao diện prototype chung. Xem [README-B5-B7](../tinix-legal/README-B5-B7.md) cho login/pilot/migration/API và kiểm chứng. Hồ sơ mẫu/localStorage chỉ thuộc bản tĩnh demo; checklist và cảnh báo của tài khoản thật chờ catalogue được duyệt.
