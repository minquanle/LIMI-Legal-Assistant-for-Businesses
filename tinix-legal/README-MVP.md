# LIMI backend — B1

Đường chạy MVP riêng của TiniX Legal. Kế thừa Express 4, Prisma 6 và các dependency hiện có; không khởi động `src/index.ts` của backend cũ.

## Chạy lần đầu trên Windows

Yêu cầu: Node.js >= 20 theo repository, npm và Docker Desktop ở chế độ Linux containers. B1 được kiểm tra trên Node 24.11.1. Mở PowerShell tại thư mục repository:

```powershell
cd "C:\Rnd_To_Startup 2026\tinix-legal"
npm ci
npm run init:mvp:env
npm run infra:mvp:up
npm run build:mvp
npm run storage:mvp:init
npm run test:mvp
npm run smoke:mvp
npm run start:mvp
```

Lần đầu build MinIO có thể mất vài phút vì tải Go và dependency. `.limi.env` được tạo bằng mật khẩu ngẫu nhiên, không in ra terminal, đã gitignore. Chạy lại `init:mvp:env` giữ nguyên file; không đổi mật khẩu khi volume PostgreSQL đã có dữ liệu.

## Địa chỉ và tiến trình

| Thành phần | Địa chỉ local | Lệnh |
|---|---|---|
| API | `http://127.0.0.1:4010` | `npm run start:mvp` hoặc `npm run dev:mvp` |
| Worker health | `http://127.0.0.1:4011` | `npm run worker:mvp` |
| Scheduler health | `http://127.0.0.1:4012` | `npm run scheduler:mvp` |
| PostgreSQL | `127.0.0.1:5433`, database `limi_dev` | Docker Compose |
| Redis | `127.0.0.1:6381` | Docker Compose |
| S3 local | `http://127.0.0.1:9100` | MinIO |
| MinIO console | `http://127.0.0.1:9101` | Đăng nhập bằng `.limi.env` |

Chạy worker và scheduler ở hai terminal riêng nếu cần kiểm tra chúng. B1 tạo vòng đời tiến trình, cấu hình và health; các handler BullMQ/cron nghiệp vụ được bổ sung ở bước tương ứng, hiện chưa có job đăng ký. Khởi động API không tự crawl, không seed demo, không migrate và không nhập luật.

```powershell
Invoke-RestMethod http://127.0.0.1:4010/health/live
Invoke-RestMethod http://127.0.0.1:4010/health/ready
```

- `/health/live` và alias `/api/health`: tiến trình đang phục vụ HTTP, không kiểm tra DB.
- `/health/ready`: `SELECT 1` trên PostgreSQL, Redis `PING`, kiểm tra bucket S3 bằng thông tin xác thực. Trả 200 khi cả ba hoạt động; 503 nếu mất kết nối, sai credentials hoặc chưa tạo bucket. Không trả connection string hoặc lỗi có secret.
- Health được dùng giống nhau cho ba role. Khi nhận SIGINT/SIGTERM, server ngừng nhận request, đóng kết nối và giải phóng Prisma/Redis với giới hạn 10 giây. Ctrl+C dừng tiến trình foreground.
- API chưa có endpoint nghiệp vụ ở B1; các đường dẫn khác trả 404. CORS chỉ bật cho danh sách origin rõ ràng, chưa có phiên đăng nhập B5.

## Lưu dữ liệu và dừng môi trường

Compose project `limi-dev` tạo các volume `limi-dev_postgres_data`, `limi-dev_redis_data`, `limi-dev_minio_data`, tách khỏi volume TiniX cũ. Các cổng hạ tầng chỉ bind loopback. Bucket `limi-private` không có anonymous policy.

```powershell
npm run infra:mvp:status
npm run infra:mvp:down
```

Lệnh down giữ volume. Không dùng `down -v` nếu cần giữ dữ liệu. Có thể đổi cổng API trong `.limi.env`; các cổng hạ tầng host nằm trong `compose.limi.yml`, phải đổi đồng thời URL tương ứng.

Không đặt `LIMI_ENV_FILE` thì runtime tìm `.limi.env` theo vị trí source/build, không phụ thuộc cwd. Có thể đặt biến này thành đường dẫn tuyệt đối của file khác. Biến môi trường tiến trình ưu tiên hơn file. Cấu hình thiếu hoặc sai làm startup thất bại.

## Kiểm chứng B1

- `build:mvp`: generate Prisma client hiện có và compile TypeScript strict chỉ với đường chạy MVP; không import các route cũ đang thiếu.
- `test:mvp`: test cấu hình, không mở dependency khi tạo app/check liveness, HTTP 503, drain, CORS và lỗi JSON.
- `smoke:mvp`: khởi động ba role từ bản build; kiểm tra cả ba ready; roundtrip tệp rồi xóa riêng tệp test; anonymous download phải 403; schema DB và legacy BullMQ keys không thay đổi. Kiểm tra thực tế sai mật khẩu DB, Redis không kết nối được và sai S3 secret.
- Smoke cần hạ tầng và bucket sẵn sàng, đồng thời cổng 4010–4012 đang trống; nó tự dừng các tiến trình test.

## MinIO và giới hạn môi trường local

Registry MinIO cũ không tải được tại thời điểm triển khai. Dockerfile build từ [security release chính thức RELEASE.2025-10-15T17-29-55Z](https://github.com/minio/minio/releases/tag/RELEASE.2025-10-15T17-29-55Z), dùng base image có digest; không dùng bản cache 2025-09-07 để nghiệm thu. [Repository MinIO](https://github.com/minio/minio) đã archive và không còn được duy trì. Đây là S3 local phục vụ phát triển; phải quyết định dịch vụ S3 được duy trì trước production B16.

`npm ci` hiện báo 102 advisory trên toàn workspace kế thừa (1 low, 62 moderate, 35 high, 4 critical). B1 không chạy `npm audit fix --force` vì có thể làm hỏng các package khác. Cần phân loại dependency thực sự dùng và xử lý trước triển khai production; B1 hoàn thành không phải nghiệm thu bảo mật production.

## Docker Desktop lỗi socket trên máy này

Đã gặp `dockerInference` và `docker-secrets-engine/engine.sock` không truy cập được, tương tự [báo cáo lỗi trên repository Docker](https://github.com/docker/desktop-feedback/issues/448). Recovery chỉ khi Docker đã dừng: sao lưu thư mục runtime socket rồi cho Docker tạo lại. Không reset factory, không xóa volume/VHDX và không unregister WSL. Các backup ở `%LOCALAPPDATA%\Docker\run.b1-backup-*` và `%LOCALAPPDATA%\docker-secrets-engine.b1-backup-*`.

Nếu tái diễn, kiểm tra log và process trước; không tự lặp lại thao tác trong lúc Docker/container đang hoạt động.

## B2 và bước tiếp theo

Đã triển khai migrations kho luật, identity/snapshot/parse/provision/import/provenance và guard lịch sử. Xem [hướng dẫn B2](README-B2.md). B3–B4 đã nhập đủ 110 văn bản/54 biểu mẫu và nối API/thư viện web dữ liệu thật; xem [hướng dẫn B3–B4](README-B3-B4.md). B5 tiếp tục session/phân quyền.

B8–B12 đã hoàn thành phần kỹ thuật và tích hợp vào prototype chung. Worker hiện xử lý đánh giá qua BullMQ; scheduler dọn bằng chứng bỏ dở. Xem [hướng dẫn B8–B12](README-B8-B12.md) để khởi động, kích hoạt chuyên gia và phát hành checklist thật sau khi duyệt. Các mô tả "chưa có job" ở trên ghi nhận phạm vi B1 tại thời điểm ban đầu.

## B13–B15 hiện tại

Nhắc hạn, cảnh báo trong web, theo dõi nguồn chính thức và duyệt thay đổi đã tích hợp vào cùng prototype. Worker xử lý evaluation/impact/outbox; scheduler nhắc hạn, recheck watchset và dọn evidence hết hạn. Xem README-B13-B15.md và outputs/B13-B15-product-state.json ở thư mục dự án gốc. B16 vẫn là bước triển khai/pilot tiếp theo.

