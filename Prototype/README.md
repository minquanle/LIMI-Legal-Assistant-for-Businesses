# TiniX Legal — Trợ lý tuân thủ doanh nghiệp

**Cập nhật B1–B4 (12/10/2026):** giao diện `dist` đã tích hợp thư viện 110 luật từ backend và được phục vụ trong web chung ở `http://127.0.0.1:3000/` qua `limi-product`. Menu thư viện, toàn văn/citation và tải biểu mẫu dùng API thật; hồ sơ/công việc/cảnh báo prototype vẫn được ghi rõ là trải nghiệm cục bộ. Hướng dẫn chạy hiện tại: `../outputs/HUONG_DAN_WEB_THONG_NHAT_B1_B4.md`. Không cần chạy server prototype 4174 để dùng phiên bản tích hợp.

Website trình diễn có **tra cứu mã số thuế thật**, hồ sơ hoạt động do người dùng xác nhận, checklist theo từng bước, thư viện văn bản tham chiếu và cảnh báo mô phỏng.

## Bản tĩnh trình diễn trước khi tích hợp

Chạy `python -m http.server 4174 --bind 127.0.0.1 --directory dist`, rồi mở `http://127.0.0.1:4174/`. Website là các tệp tĩnh, không cần cài thêm thư viện hay build.

## Tra cứu thật

`dist/business.js` gọi `GET https://api.vietqr.io/v2/business/{taxCode}` qua HTTPS. Nguồn hỗ trợ CORS và không yêu cầu khóa trong lần kiểm tra ngày 18/09/2026 (giờ Việt Nam). Mã số thuế doanh nghiệp do người dùng nhập được gửi trực tiếp đến VietQR/CASSO. Không gửi các câu trả lời hoạt động hay ghi chú checklist.

Trường dữ liệu được ánh xạ từ kết quả, không suy diễn:

- `id`: mã số thuế (phải khớp mã người dùng đã nhập).
- `name`: tên doanh nghiệp.
- `internationalName`: tên quốc tế, nếu có.
- `shortName`: tên viết tắt, nếu có.
- `address`: địa chỉ đăng ký, nếu có.
- `status`: tình trạng thuế, nếu có; không được coi là kết luận về tình trạng pháp lý.
- `metadata.updatedAt`: thời điểm cập nhật do nguồn khai báo, nếu có; hiển thị riêng với thời điểm website thực hiện tra cứu.

Nguồn này **không cung cấp** loại hình pháp lý, ngày thành lập, người đại diện, vốn điều lệ và ngành nghề đăng ký trong giao diện API được tích hợp. Các thông tin hoạt động, số nhân viên, kênh bán hàng và tín hiệu nghĩa vụ đều cần người dùng xác nhận. Chưa có dữ liệu lao động được giữ là “Chưa xác nhận”, không mặc định là có hoặc không có nhân viên.

Tài liệu nguồn: https://vietqr.io/danh-sach-api/tax-id-lookup/

**Vòng đời nguồn:** VietQR thông báo ngừng API này từ 01/03/2027 và chuyển sang Xinvoice. Cần thay adapter `lookupBusiness` bằng API mới đã được cấp quyền trước mốc này nếu đưa sản phẩm vào vận hành dài hạn. Đây không phải tích hợp trực tiếp Cục Thuế; độ phủ và độ mới phụ thuộc nguồn cung cấp.

Đã xử lý định dạng 10/13 số (giữ số 0 đầu), timeout 15 giây, lỗi kết nối, giới hạn truy cập, không tìm thấy và phản hồi sai mã số thuế. Khi tra cứu thất bại, có thể thử lại hoặc tự nhập hồ sơ; không thay kết quả bằng dữ liệu demo. Hai hồ sơ mẫu được giữ ở phần khám phá riêng.

## Các màn hình

- Thiết lập: thanh tiến trình bốn bước, không có sidebar dashboard.
- Hôm nay: hàng đợi được ưu tiên theo trạng thái, ngày nhắc và mức rủi ro; chủ đề quan tâm chỉ là tiêu chí phụ.
- Công việc: tìm kiếm, lọc, sắp xếp, đánh giá tiêu chí theo nhóm, ghi chú vị trí bằng chứng và ngày nhắc trong LIMI.
- Cảnh báo: thẻ tóm tắt có thể mở rộng, tạo công việc, chọn ngày hiển thị lại và liên kết nguồn chính thức.
- Tra cứu văn bản và Phương pháp & dữ liệu mẫu: nội dung cấp hai, tách khỏi luồng công việc chính.
- Hồ sơ doanh nghiệp: dữ liệu nhận diện kèm nguồn, hoạt động tự xác nhận và nhật ký thay đổi.

Hồ sơ, tiến độ, ngày nhắc và trạng thái cảnh báo được lưu bằng `localStorage` trên trình duyệt hiện tại và còn sau khi tải lại. Nút “Đổi doanh nghiệp” xóa dữ liệu này để bắt đầu lại. Chưa có tài khoản, đồng bộ nhiều thiết bị, backend hoặc gửi email/thông báo hệ thống. Ngày nhắc chỉ làm nội dung xuất hiện lại bên trong LIMI.

Các cảnh báo thay đổi luật vẫn là **tình huống giả lập** với ngày giả định. Thư viện có liên kết văn bản thật; phần diễn giải/checklist chưa được chuyên gia pháp lý thẩm định.

## Cấu trúc và kiểm tra

- `dist/index.html`: metadata và điểm vào.
- `dist/studio.css`: hệ giao diện mới, responsive, focus và giảm chuyển động.
- `dist/app.js`: UI, thao tác và lưu trạng thái cục bộ trên trình duyệt.
- `dist/business.js`: adapter tra cứu thật và chuẩn hóa MST.
- `dist/data.js`, `dist/rules.js`, `dist/legal.js`: hồ sơ mẫu, quy tắc checklist và nguồn tham chiếu.
- Các stylesheet cũ được giữ để tham khảo, không được trang tải.
- `.openai/hosting.json`: định danh Site hiện có và thư mục tĩnh `dist`.

Kiểm tra logic tích hợp bằng `node --test tests/business.test.mjs`. Bộ test dùng phản hồi giả lập để kiểm tra tình huống lỗi, độc lập với việc kiểm tra API thật và UI trên trình duyệt.

## Cập nhật sản phẩm B5–B7

Khi được Next phục vụ ở `/workspace`, `product-workspace.js` bật tài khoản/hồ sơ PostgreSQL qua gateway cùng origin. Không nhập dữ liệu mẫu/localStorage vào tài khoản thật. Xem [hướng dẫn B5–B7](../tinix-legal/README-B5-B7.md). Bản tĩnh chạy riêng vẫn là demo.
