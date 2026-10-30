# LIMI trên máy chủ — chuẩn bị 29/10/2026

Trạng thái: có lớp cấu hình VPS; chưa triển khai lên máy chủ bên ngoài, chưa chạy GitHub Actions. Đường dẫn ngrok vẫn chạy từ máy cá nhân.

## Những gì cần có

- Một máy chủ Linux có Docker và Docker Compose từ 2.24.4, kết nối SSH và dung lượng lưu dữ liệu lâu dài.
- Một hostname công khai trỏ đến máy chủ, mở cổng 80/443. Không dùng HTTP cho tài khoản thật: cookie production yêu cầu HTTPS.
- Một repository riêng chứa đủ ba thư mục cùng cấp: `tinix-legal`, `limi-product`, `Prototype/dist`, và `.dockerignore` ở gốc. Repo backend hiện tại không chứa toàn bộ sản phẩm.
- Nâng dependency Next.js có cảnh báo bảo mật và kiểm thử lại trước khi mở bản VPS cho người dùng thật. Bản build Docker mới chưa được kiểm chứng trong thay đổi cấu hình này.

## Cấu hình và chạy lần đầu trên VPS

Đứng tại thư mục `tinix-legal` trong checkout chung. Tạo `deploy/.staging.env` từ file example, đặt mật khẩu ngẫu nhiên riêng cho PostgreSQL/MinIO; đặt `LIMI_SITE=https://<hostname-thật>` và `LIMI_RELEASE` bằng mã phiên bản mới. File này chỉ ở máy chủ, quyền đọc hạn chế. Không đưa `.env`, backup, cookie, tài khoản hoặc dữ liệu doanh nghiệp vào GitHub.

```sh
docker compose --env-file deploy/.staging.env -f deploy/compose.staging.yml -f deploy/compose.vps.yml config --quiet
docker compose --env-file deploy/.staging.env -f deploy/compose.staging.yml -f deploy/compose.vps.yml build api web migrate storage-init
docker compose --env-file deploy/.staging.env -f deploy/compose.staging.yml -f deploy/compose.vps.yml up -d --wait postgres redis minio
docker compose --env-file deploy/.staging.env -f deploy/compose.staging.yml -f deploy/compose.vps.yml run --rm migrate
docker compose --env-file deploy/.staging.env -f deploy/compose.staging.yml -f deploy/compose.vps.yml run --rm storage-init
docker compose --env-file deploy/.staging.env -f deploy/compose.staging.yml -f deploy/compose.vps.yml up -d --wait api worker web gateway
```

Không khởi động scheduler/crawler. Chỉ gateway mở cổng ra ngoài; database, API và kho tệp nằm trong mạng Docker. Caddy public cấp chứng chỉ HTTPS qua ACME, khác chứng chỉ nội bộ localhost. Không chạy `down -v` để cập nhật.

Database mới không tự có bộ luật/checklist hay người kiểm duyệt. Muốn giữ dữ liệu hiện có phải sao lưu và chuyển cả PostgreSQL lẫn tệp MinIO theo runbook B16 bằng kênh riêng; không đưa vào Git. Không ghi đè database đang có. Trước các lần cập nhật tiếp theo cần backup, kiểm thử migration và giữ image cũ để quay lui ứng dụng.

## GitHub sẽ làm gì

GitHub lưu source; Actions kiểm thử, dựng image và chuyển phiên bản đã chọn lên VPS. GitHub không thay VPS. Chưa cấu hình Actions deploy vì chưa có repository chung, máy chủ đích và SSH deploy credential. Sau khi có các thành phần này mới nối luồng tự động, giới hạn nhánh/môi trường deploy và kiểm tra sức khỏe sau mỗi lần cập nhật.
