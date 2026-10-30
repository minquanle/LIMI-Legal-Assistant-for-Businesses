# LIMI — Legal Intelligence, Monitoring & Insights

Trợ lý tuân thủ pháp luật cho doanh nghiệp Việt Nam: checklist nghĩa vụ theo hồ sơ doanh nghiệp, lịch hạn, cảnh báo thay đổi pháp luật và phòng duyệt cho chuyên gia.

| Thư mục | Nội dung |
|---|---|
| `tinix-legal/` | API (Express + Prisma + PostgreSQL), engine `compliance-core`, worker/scheduler |
| `limi-product/` | Next.js: trang web và cổng `/api/workspace`, `/api/legal` |
| `Prototype/` | Giao diện workspace (ES modules) được đồng bộ vào `limi-product/public/prototype` |
| `render.yaml` | Blueprint triển khai trên Render |

## Triển khai trên Render
Dashboard → **New → Blueprint** → chọn repo này. Điền các biến được hỏi (`ALLOWED_ORIGINS`, khóa Cloudflare R2), chờ build xong.

## Chạy cục bộ
Xem `tinix-legal/README-MVP.md` (Docker cho PostgreSQL/Redis/MinIO, rồi `npm run dev:mvp`) và `limi-product` (`npm run dev`).

Không commit `.limi.env`, `account.txt` hay bản sao lưu cơ sở dữ liệu.
