# LIMI Design System — MASTER

Nguồn sự thật cho giao diện LIMI. Mã nguồn: `Prototype/dist/limi-ds.css` (nạp **sau cùng** trong `index.html`).
Hướng thiết kế lấy từ catalog [UI UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill):
nhóm sản phẩm *Legal Services* + *B2B Service* + *Government/Public Service*.

Khi làm một màn hình cụ thể, đọc file này trước; nếu có `pages/<tên-màn-hình>.md` thì quy tắc trong đó được ưu tiên.

## Định hướng

| Hạng mục | Lựa chọn | Lý do |
|---|---|---|
| Style | Accessible & Ethical + Minimalism & Swiss | Pháp lý cần uy tín, rõ ràng, đọc lâu không mỏi |
| Màu | Navy thương hiệu + **một** màu hành động (teal đậm) | Màu trạng thái chỉ dành cho trạng thái |
| Chữ | Be Vietnam Pro (cặp "Vietnamese Friendly") | Dấu tiếng Việt chuẩn, nhiều độ đậm |
| Mật độ | Dashboard vừa phải, nhịp 4/8px | Nhiều dữ liệu nhưng vẫn thoáng |

## Token chính

| Token | Giá trị | Dùng cho | Tương phản |
|---|---|---|---|
| `--ds-navy-900` | `#0b3156` | Sidebar, banner nhấn, khối tối | — |
| `--ds-primary` | `#0f6e80` | Nút chính, link, focus | 5.9:1 với trắng |
| `--ds-heading` | `#0b2e4f` | Tiêu đề | 13.8:1 |
| `--ds-text` | `#1f3a52` | Nội dung | 10.8:1 |
| `--ds-muted` | `#4d6475` | Chú thích, nhãn phụ | 6.2:1 |
| `--ds-subtle` | `#5e7484` | Placeholder, ngày ngoài tháng | 4.9:1 |
| `--ds-control-border` | `#7a909c` | Viền input/select | ≥3:1 |
| `--ds-teal-400` | `#5cbfaf` | **Chỉ** trên nền navy (badge, vòng focus) | 6.0:1 trên navy, 2.2:1 trên trắng |
| `--ds-danger/-warning/-success/-info` | xem file CSS | Trạng thái: luôn kèm chấm/biểu tượng + chữ | ≥5.4:1 |

Thang chữ: 12 / 13 / 14 / **15 (body)** / 17 / 20 / 24 / 30px. Không có chữ nhỏ hơn 12px.
Bo góc: 6 (chip) · 10 (control) · 14 (thẻ) · pill. Đổ bóng: `sm` cho thẻ, `md` khi hover, `lg` cho sheet/toast.

## Quy tắc bắt buộc

1. Không mã màu cứng trong component mới — dùng `var(--ds-*)`.
2. Mỗi màn hình chỉ có **một** nút chính (`.primary-button`).
3. Trạng thái không chỉ bằng màu: `.status-badge` luôn có chấm + chữ.
4. Focus: viền 3px `--ds-primary`, chỉ hiện khi dùng bàn phím; tiêu đề nhận focus (`tabindex=-1`) không bị đóng khung.
5. Không họa tiết trang trí chuyển động, không nhấc thẻ khi hover (tránh nhảy layout); tôn trọng `prefers-reduced-motion`.
6. Control cao tối thiểu 44px; input trên điện thoại 16px để iOS không tự phóng to.
7. Không vẽ biểu đồ giả: chỉ hiển thị số liệu thật.
8. Trường đăng nhập khai báo `autocomplete` (email, current-password, new-password, one-time-code).

## Cách ghi đè

`studio.css` còn nhiều lớp theme cũ dùng `!important`. Component trong `limi-ds.css` được bọc trong
`:is(#app,#overlay){ … }` (CSS nesting) để có độ đặc hiệu cấp ID, thắng các chuỗi class cũ mà không leo thang thêm.
Rule nền tảng cho input dùng `:where()` để các component (vd. `.search-control`) ghi đè dễ dàng.

## Kiểm tra trước khi phát hành

- [ ] Không chữ < 12px, tương phản chữ ≥ 4.5:1 (đã kiểm bằng script trên toàn bộ màn hình demo + product)
- [ ] Không cuộn ngang ở 375px; lịch tháng cuộn trong khung riêng trên điện thoại
- [ ] Focus thấy được khi Tab qua sidebar, form, sheet
- [ ] Kiểm tra lại với `prefers-reduced-motion: reduce`
