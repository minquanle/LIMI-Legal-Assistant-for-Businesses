# Tinix Legal

Nền tảng công nghệ pháp lý (LegalTech) cho thị trường Việt Nam — tra cứu văn bản quy phạm pháp luật, soạn thảo hợp đồng có trợ lý AI, thẩm định rủi ro, quản lý vòng đời hợp đồng doanh nghiệp và các công cụ tuân thủ theo ngành.

Monorepo npm workspaces gồm 3 gói:

| Gói | Vai trò | Công nghệ chính |
|---|---|---|
| [`packages/backend`](packages/backend) | API server | Express + Prisma (PostgreSQL) + MeiliSearch + BullMQ/Redis + MinIO |
| [`packages/frontend`](packages/frontend) | Ứng dụng web | Next.js (App Router) + Tailwind CSS + Tiptap + Recharts + React Flow |
| [`packages/crawler`](packages/crawler) | Thu thập dữ liệu | Playwright/Crawlee, các crawler theo nguồn (VBPL, Thư viện Pháp luật, Chính phủ, Pháp điển) |

---

## Mục lục

- [Kiến trúc tổng quan](#kiến-trúc-tổng-quan)
- [Tính năng theo nhóm](#tính-năng-theo-nhóm)
  - [1. Tra cứu & Văn bản pháp luật](#1-tra-cứu--văn-bản-pháp-luật)
  - [2. Soạn thảo văn bản với AI (Copilot)](#2-soạn-thảo-văn-bản-với-ai-copilot)
  - [3. Quản lý Hợp đồng & Thẩm định Rủi ro](#3-quản-lý-hợp-đồng--thẩm-định-rủi-ro)
  - [4. Hỏi đáp pháp lý AI](#4-hỏi-đáp-pháp-lý-ai)
  - [5. Án lệ & Thủ tục hành chính & Cảnh báo luật mới](#5-án-lệ--thủ-tục-hành-chính--cảnh-báo-luật-mới)
  - [6. Radar Tuân thủ Pháp lý & Khám sức khỏe pháp lý](#6-radar-tuân-thủ-pháp-lý--khám-sức-khỏe-pháp-lý)
  - [7. Sơ đồ tư duy & So sánh luật](#7-sơ-đồ-tư-duy--so-sánh-luật)
  - [8. Khu vực Quản trị (Admin)](#8-khu-vực-quản-trị-admin)
  - [9. Chatbot, Thông báo & Điều hướng nhanh](#9-chatbot-thông-báo--điều-hướng-nhanh)
  - [10. Trang chủ & Hệ thống thiết kế](#10-trang-chủ--hệ-thống-thiết-kế)
- [Thu thập dữ liệu (Crawler)](#thu-thập-dữ-liệu-crawler)
- [Mô hình dữ liệu (Prisma)](#mô-hình-dữ-liệu-prisma)
- [API Backend](#api-backend)
- [Bảo mật & Xác thực Admin](#bảo-mật--xác-thực-admin)
- [Cài đặt & Chạy dự án](#cài-đặt--chạy-dự-án)
- [Biến môi trường](#biến-môi-trường)
- [Cấu trúc thư mục](#cấu-trúc-thư-mục)

---

## Kiến trúc tổng quan

```
                       ┌─────────────────────┐
                       │   packages/crawler   │
                       │  Playwright/Crawlee   │
                       │ VBPL · TVPL · Chính   │
                       │ phủ · Pháp điển       │
                       └──────────┬───────────┘
                                  │ ghi dữ liệu văn bản gốc
                                  ▼
┌──────────────────┐   REST/JSON   ┌──────────────────────┐
│ packages/frontend │◄─────────────►│  packages/backend     │
│ Next.js App Router │              │  Express API          │
│ Tailwind + Tiptap   │              │                       │
│ React Flow + Recharts│             │  ┌─────────────────┐  │
└──────────────────┘               │  │ PostgreSQL       │  │
                                    │  │ (Prisma ORM)     │  │
                                    │  ├─────────────────┤  │
                                    │  │ MeiliSearch      │  │
                                    │  │ (hybrid + RRF)   │  │
                                    │  ├─────────────────┤  │
                                    │  │ Redis + BullMQ   │  │
                                    │  │ (hàng đợi audit) │  │
                                    │  ├─────────────────┤  │
                                    │  │ MinIO            │  │
                                    │  │ (lưu trữ file)   │  │
                                    │  └─────────────────┘  │
                                    └──────────────────────┘
```

Frontend gọi backend qua `packages/frontend/src/lib/api-client.ts`. Các endpoint quản trị đi qua một proxy server-side (`/api/admin-proxy`) để khóa bí mật quản trị (`ADMIN_SECRET_KEY`) không bao giờ lộ ra trình duyệt — xem [Bảo mật & Xác thực Admin](#bảo-mật--xác-thực-admin).

---

## Tính năng theo nhóm

### 1. Tra cứu & Văn bản pháp luật

- **Tra cứu toàn văn** (`/search`) — tìm kiếm hybrid kết hợp full-text (MeiliSearch) và vector embedding, hợp nhất kết quả bằng thuật toán Reciprocal Rank Fusion (RRF); ưu tiên khớp chính xác số hiệu văn bản qua Prisma trước khi fallback full-text.
- **Trang chi tiết văn bản** (`/documents/[id]`) — hiển thị nội dung theo cấu trúc AST (Điều/Khoản/Điểm) đã được parse sẵn, không parse on-the-fly; hiển thị trạng thái hiệu lực (còn hiệu lực / hết hiệu lực / hết hiệu lực một phần / chưa có hiệu lực).
- **Cây phả hệ văn bản** (Legal Lineage Tree) — quan hệ Căn cứ / Hướng dẫn / Sửa đổi / Thay thế / Bãi bỏ giữa các văn bản, hiển thị dạng cây phân cấp.
- **Sơ đồ quan hệ văn bản** — trực quan hóa bằng React Flow (`@xyflow/react`), node văn bản kết nối theo loại quan hệ, có điều khiển zoom/pan.
- **Danh sách văn bản mới nhất** (`/van-ban-moi`).
- **Watchlist** — người dùng theo dõi văn bản quan tâm, nhận thông báo khi có thay đổi hiệu lực.
- **Xuất PDF** văn bản/hợp đồng (`pdfmake` + `html-to-pdfmake`).

### 2. Soạn thảo văn bản với AI (Copilot)

- **Trình soạn thảo WYSIWYG** (`/soan-thao`) dựng trên Tiptap/ProseMirror (`WordOnlineEditor`) — bảng biểu, căn chỉnh văn bản, highlight, subscript/superscript, font family/màu sắc, page break tùy biến, thanh Ribbon Toolbar kiểu Word.
- **Trợ lý AI trong ngữ cảnh** (`SelectionContextMenu`) — chọn đoạn văn bản để yêu cầu AI diễn giải lại, rút gọn, kiểm tra rủi ro pháp lý ngay tại chỗ.
- **Trích dẫn tự động (Draft Citation)** — AI gợi ý căn cứ pháp lý khi soạn thảo, lưu lại danh sách trích dẫn kèm dự thảo.
- **Bộ mẫu văn bản** (`DocumentTemplate`) và **Wizard tạo văn bản theo mẫu** (`TemplateWizardModal`) — chuẩn Nghị định 30/2020/NĐ-CP về công tác văn thư.
- **Đối tác đàm phán (Negotiation Playbook)** — AI sinh gợi ý điều khoản thương lượng dựa trên kết quả thẩm định rủi ro thực tế của hợp đồng, có fallback theo bộ quy tắc khi AI lỗi.
- **Quy trình phê duyệt nhiều cấp (Workflow)** (`/quy-trinh`) — cấu hình động các bước trình ký, vai trò bắt buộc từng bước, dòng thời gian phê duyệt (`ApprovalTimeline`), chặn chuyển bước sai vai trò.
- **Trợ lý giọng nói** (`VoiceAssistantModal`) — hỏi nhanh AI bằng giọng nói trong lúc soạn thảo.

### 3. Quản lý Hợp đồng & Thẩm định Rủi ro

- **Thẩm định rủi ro hợp đồng (Contract Audit)** (`/contract-audit`) — AI quét toàn văn hợp đồng, gắn cờ điều khoản rủi ro theo mức độ (thấp/trung bình/cao/nghiêm trọng), đối chiếu với bộ quy tắc rủi ro (`ContractRiskRule`) và pháp luật hiện hành; xử lý bất đồng bộ qua hàng đợi BullMQ (`RiskAuditEngine`).
- **Upload & OCR hợp đồng** (`/hop-dong/upload`, `/deep-ocr`) — trích xuất văn bản từ file scan/ảnh (Deep OCR Service), tự động nhận diện điều khoản.
- **Vòng đời hợp đồng** (`/hop-dong`) — theo dõi trạng thái từ soạn thảo → ký kết → hiệu lực → gia hạn/chấm dứt.
- **Phụ lục hợp đồng (Addendum)** (`/hop-dong/[id]/addendums`) — quản lý sửa đổi bổ sung, hiển thị track-changes (nội dung cũ gạch ngang, nội dung mới tô đậm).
- **Lịch nhắc hạn mốc hợp đồng** (`/hop-dong/lich-nhac-han`) — trích xuất mốc thời gian (thanh toán, gia hạn, bảo hành, thông báo chấm dứt...) bằng AI từ nội dung hợp đồng, xuất lịch `.ics`, đánh dấu hoàn thành, cảnh báo theo mức độ rủi ro và số ngày còn lại.
- **Phân tích chi phí AI** (AI Token Analytics) — theo dõi số lượng token, chi phí USD/VNĐ theo từng tính năng AI sử dụng, có ngân sách giới hạn (budget limit) cảnh báo.

### 4. Hỏi đáp pháp lý AI

- **Hỏi đáp trực tiếp (Live Ask)** (`QALiveAskBox`) — người dùng đặt câu hỏi tình huống thực tế, AI trả lời kèm tóm tắt, hướng dẫn chi tiết, lời khuyên thực tiễn và căn cứ pháp lý; hỗ trợ chọn persona (theo vai trò: cá nhân, doanh nghiệp, bất động sản, kế toán...).
- **Kho câu hỏi theo chủ đề** (`/hoi-dap`, `/hoi-dap/chu-de/[slug]`) — phân loại theo lĩnh vực (đất đai, lao động, thuế, hôn nhân gia đình, doanh nghiệp, hình sự, dân sự, giáo dục, y tế, môi trường, xây dựng, giao thông, bảo hiểm, đầu tư, sở hữu trí tuệ...).
- **Kiểm duyệt nội dung AI sinh** — câu hỏi/trả lời do AI tạo ở trạng thái `DRAFT` chờ admin duyệt trước khi hiển thị công khai (`/admin/qa-review`), tránh phát tán nội dung sai lệch.
- **Bỏ phiếu hữu ích** — người dùng đánh giá câu trả lời, chống trùng theo IP + item.

### 5. Án lệ & Thủ tục hành chính & Cảnh báo luật mới

- **Sổ tay Án lệ TANDTC** (`/an-le`) — tra cứu án lệ Tòa án Nhân dân Tối cao theo chủ đề, tình huống áp dụng và quy tắc pháp lý rút ra.
- **Thủ tục hành chính** (`/thu-tuc-hanh-chinh`) — hướng dẫn thủ tục theo nhóm ngành, kèm cơ quan thụ lý, lệ phí, thời hạn giải quyết.
- **Cảnh báo luật mới & Nhắc hạn tuân thủ** (`/canh-bao-luat-moi`) — bảng radar theo dõi các luật/nghị định sắp/đã có hiệu lực (giai đoạn 2025–2026), phân tích tác động theo từng vai trò (Ban Giám đốc, HR, Kế toán, Bất động sản, IT, Logistics), kèm checklist hành động cần thực hiện và mức độ sẵn sàng tuân thủ (%). Xuất kế hoạch CSV, in bản cảnh báo.

### 6. Radar Tuân thủ Pháp lý & Khám sức khỏe pháp lý

- **Radar Tuân thủ Pháp lý** (`/radar-phap-ly`) — giám sát rủi ro tuân thủ theo 10 ngành trọng điểm (tài chính-ngân hàng, viễn thông, xây dựng, lao động, hàng hải, dược phẩm, năng lượng, logistics, giáo dục, bảo hiểm...); mỗi cảnh báo phân tích theo 4 trụ cột: Tác động Tài chính, Tác động Quy trình & Vận hành, Tác động Nhân sự, Căn cứ Chế tài Xử phạt. Có bài kiểm tra khoảng trống tuân thủ (Compliance Gap Audit) tính điểm sẵn sàng theo 4 mức xếp loại.
- **Khám sức khỏe pháp lý doanh nghiệp 360°** (`/legal-healthcheck`) — bộ câu hỏi tự đánh giá theo 5 trụ cột rủi ro cốt lõi (Pháp lý Doanh nghiệp & Vốn, Hợp đồng & Khách hàng, Lao động/Tiền lương/BHXH, Sở hữu Trí tuệ, Thuế/Môi trường/Dữ liệu cá nhân theo NĐ 13); chấm điểm Health Score /100, xếp loại (Xuất sắc/Tốt/Trung bình/Nguy cơ cao), sinh Báo cáo Khắc phục Rủi ro ưu tiên cho Ban Giám đốc.

### 7. Sơ đồ tư duy & So sánh luật

- **Mindmap Hub** (`/mindmap`) — bản đồ tư duy các luật lớn theo lĩnh vực (Đất đai, Doanh nghiệp, Lao động...).
- **Sơ đồ quan hệ văn bản chi tiết** (`/van-ban/[id]/mindmap`) — hiển thị văn bản gốc, nghị định hướng dẫn, thông tư chi tiết theo 3 cấp, có zoom, điều hướng bàn phím đầy đủ (WCAG).
- **Sơ đồ cấp Điều/Khoản** (`/van-ban/[id]/mindmap/articles`) — so sánh hiệu lực điều khoản cũ/mới ở cấp độ chi tiết.
- **So sánh Luật Cũ – Mới** (`/so-sanh-luat`) — đối chiếu song song (side-by-side diff) từng điều khoản giữa hai phiên bản luật, đánh dấu điều khoản Bổ sung mới / Sửa đổi nội dung, kèm đánh giá tác động chuyên môn.
- **Tree Diff** (`/so-sanh-luat/tree-diff`) — hiển thị khác biệt dạng cây cấu trúc.

### 8. Khu vực Quản trị (Admin)

Toàn bộ nằm dưới `/admin`, được bảo vệ bởi cổng đăng nhập server-side (xem [Bảo mật](#bảo-mật--xác-thực-admin)):

- **Thống kê hệ thống** (`/admin/stats`) — tổng số văn bản, quan hệ pháp lý, phạm vi thời gian dữ liệu, tỷ lệ văn bản thiếu quan hệ/toàn văn.
- **Chất lượng dữ liệu** (`/admin/quality`) — phát hiện văn bản trùng lặp, thiếu trường bắt buộc, dữ liệu bất thường.
- **Bảng điều khiển Crawler** (`/admin/crawler`) — theo dõi heartbeat, log crawl, kích hoạt crawl gia tăng hằng ngày / crawl toàn bộ (full scan) / dừng tiến trình, cấu hình lịch cron.
- **AI Analytics** (`/admin/ai-analytics`) — chi phí và mức sử dụng AI theo thời gian, ngân sách.
- **Cấu hình AI Provider / BYOK** (`/admin/ai-byok-config`) — "Bring Your Own Key": doanh nghiệp tự cấu hình nhà cung cấp LLM và khóa API riêng.
- **Ma trận phân quyền RBAC** (`/admin/rbac-permissions`) — cấu hình động quyền truy cập tính năng theo vai trò (Super Admin, Trưởng phòng Pháp chế, Chuyên viên Pháp lý, Nhân viên Nghiệp vụ...).
- **Cấu hình Doanh nghiệp** (`/admin/enterprise-config`) — quy trình trình ký nhiều bước, mốc cảnh báo, quy tắc rủi ro theo tổ chức.
- **Cấu hình Tri thức Doanh nghiệp** (`/admin/enterprise-knowledge-config`) — quy trình nghiệp vụ gắn kèm bộ văn bản QPPL và checklist tuân thủ động theo từng ngành.
- **Duyệt Hỏi Đáp AI** (`/admin/qa-review`) — kiểm duyệt nội dung Q&A do AI sinh trước khi công khai.
- **Điều hướng chéo** (`AdminNav`) — thanh điều hướng dùng chung giữa tất cả các trang quản trị.

### 9. Chatbot, Thông báo & Điều hướng nhanh

- **Chatbot trợ lý** (`ChatWindow`) — hỏi đáp pháp lý nhanh dạng chat nổi, có phiên hội thoại lưu lại (Conversation Session/Message).
- **Trung tâm thông báo** (`NotificationDrawer`) — thông báo thay đổi hiệu lực văn bản đang theo dõi, cập nhật quy trình phê duyệt.
- **Command Palette** (`Ctrl/⌘ + K`) — tìm nhanh và điều hướng tới mọi tính năng bằng bàn phím, hỗ trợ mũi tên lên/xuống, Enter chọn, Esc đóng.

### 10. Trang chủ & Hệ thống thiết kế

- **Trang chủ** (`/`) — tra cứu nhanh, thống kê tổng quan (số văn bản, năm dữ liệu, còn hiệu lực), danh mục loại văn bản, showcase các công cụ doanh nghiệp, văn bản mới nhất; hỗ trợ đầy đủ chế độ tối (dark mode).
- **Thư viện thành phần dùng chung** — nhãn trạng thái hiệu lực và loại văn bản (`document-labels.ts`), bộ icon theo chủ đề ngữ nghĩa (`topic-icons.ts`) dùng Lucide React thay cho emoji, hook đóng modal bằng phím Esc (`useEscapeToClose`).

---

## Thu thập dữ liệu (Crawler)

Gói `packages/crawler` (Playwright + Crawlee) thu thập văn bản pháp luật từ nhiều nguồn:

| Crawler | Nguồn |
|---|---|
| `vbpl` | Cổng thông tin điện tử Chính phủ – Văn bản Pháp luật |
| `tvpl` | Thư Viện Pháp Luật (thuvienphapluat.vn) |
| `chinhphu` | Cổng thông tin Chính phủ |
| `phapdien` | Hệ thống hóa Pháp điển |

**Pipeline xử lý:**
1. Crawl HTML/PDF nguồn → parse cấu trúc AST (Điều/Khoản/Điểm) bằng bộ `parsers`.
2. Khử trùng lặp (`dedup`) giữa các nguồn.
3. Sinh embedding vector cho tìm kiếm ngữ nghĩa (`embedding-service`, có retry + timeout).
4. Ghi vào PostgreSQL qua Prisma, đẩy chỉ mục sang MeiliSearch.
5. Theo dõi trạng thái qua `CrawlLog` — phân biệt `success` / `partial` (có lỗi từng phần) / thất bại.
6. Lịch chạy tự động qua `node-cron`, điều khiển thủ công qua Admin Crawler Dashboard.

---

## Mô hình dữ liệu (Prisma)

Schema PostgreSQL tại [`packages/backend/prisma/schema.prisma`](packages/backend/prisma/schema.prisma) — 31 model, nhóm theo miền nghiệp vụ:

- **Văn bản pháp luật**: `CanonicalDocument`, `DocumentSource`, `Attachment`, `LegalASTNode`, `DocumentRelation`, `CrawlLog`, `DocumentEmbedding`.
- **Soạn thảo**: `DocumentTemplate`, `DraftDocument`, `DraftCitation`.
- **Doanh nghiệp & Quy trình**: `EnterpriseConfig`, `ApprovalHistory`, `BusinessWorkflowConfig`, `WorkflowExecution`, `RolePermission`.
- **Hợp đồng**: `ContractMaster`, `ContractAddendum`, `ContractRiskAudit`, `ContractRiskRule`, `ContractMilestone`.
- **AI & Hội thoại**: `AIProviderConfig`, `AITokenLog`, `ConversationSession`, `ConversationMessage`.
- **Người dùng**: `UserWatchlist`, `UserNotification`.
- **Hỏi đáp**: `LegalQATopic`, `LegalQAItem`.
- **Tuân thủ & Tra cứu chuyên đề**: `ComplianceRadarAlert`, `CaseLawPrecedent`, `AdminProcedureGuide`.

---

## API Backend

Các router chính được mount tại [`packages/backend/src/index.ts`](packages/backend/src/index.ts) dưới tiền tố `/api`:

| Route | Chức năng |
|---|---|
| `/api/search` | Tìm kiếm hybrid (full-text + vector, RRF) |
| `/api/documents` | Chi tiết văn bản, phả hệ, mindmap |
| `/api/admin` | Thống kê, chất lượng dữ liệu, crawler control |
| `/api/copilot` | Soạn thảo AI, RAG, mẫu văn bản |
| `/api/mindmap` | Dữ liệu sơ đồ tư duy |
| `/api/analytics`, `/api/deep-analytics` | Phân tích xu hướng |
| `/api/chatbot` | Chatbot hội thoại |
| `/api/watchlist` | Theo dõi văn bản |
| `/api/notifications` | Thông báo người dùng |
| `/api/contract-audit` | Thẩm định rủi ro hợp đồng |
| `/api/qa` | Hỏi đáp AI (kèm kiểm duyệt) |
| `/api/milestones` | Mốc hạn hợp đồng |
| `/api/radar` | Radar tuân thủ pháp lý |
| `/api/case-law` | Án lệ |
| `/api/legal-diff` | So sánh luật cũ/mới |
| `/api/procedures` | Thủ tục hành chính |
| `/api/healthcheck` | Khám sức khỏe pháp lý |
| `/api/law-pulse` | Cảnh báo luật mới / nhắc hạn |

Rate limiting riêng cho các endpoint gọi AI (`aiRateLimiter`): `/copilot`, `/qa/ask-live`, `/contract-audit`, `/healthcheck`, `/chatbot`.

---

## Bảo mật & Xác thực Admin

Khu vực `/admin` được bảo vệ theo mô hình **session cookie httpOnly**, khóa bí mật `ADMIN_SECRET_KEY` **không bao giờ được gửi tới trình duyệt**:

1. `packages/frontend/src/app/admin/layout.tsx` xác minh cookie phiên ở server trước khi trả HTML — chưa đăng nhập thì chỉ nhận được form đăng nhập.
2. `POST /api/admin-session` đổi khóa quản trị lấy cookie `httpOnly` ký bằng HMAC-SHA256, hết hạn sau 8 giờ, so sánh hằng thời gian (`crypto.timingSafeEqual`) để chống timing attack.
3. Mọi lời gọi API quản trị từ trình duyệt đi qua `/api/admin-proxy/[...path]` — proxy xác minh cookie phiên rồi mới gắn `x-admin-key` thật khi gọi backend.
4. Backend (`packages/backend/src/middleware/auth-guard.ts`) **fail-closed**: nếu `ADMIN_SECRET_KEY` chưa được cấu hình, mọi request quản trị bị từ chối (không có bypass ngầm định), trừ khi bật rõ ràng `ALLOW_DEV_ADMIN_BYPASS=true` ở môi trường phát triển.

---

## Cài đặt & Chạy dự án

### Yêu cầu

- Node.js ≥ 18, npm workspaces
- PostgreSQL
- MeiliSearch (tìm kiếm)
- Redis (hàng đợi BullMQ)
- MinIO (lưu trữ file, tương thích S3)

### Cài đặt

```bash
npm install
```

### Cấu hình môi trường

Sao chép `.env.example` thành `.env` ở thư mục gốc và điền giá trị (xem [Biến môi trường](#biến-môi-trường)).

### Khởi tạo cơ sở dữ liệu

```bash
cd packages/backend
npx prisma generate
npx prisma migrate dev
```

### Chạy từng gói (development)

```bash
# Backend API (http://localhost:4001)
cd packages/backend && npm run dev

# Frontend (http://localhost:4000)
cd packages/frontend && npm run dev

# Crawler (chạy thủ công / theo lịch cron)
cd packages/crawler && npm run dev
```

### Build production

```bash
cd packages/backend && npm run build   # tsc
cd packages/frontend && npm run build  # next build
```

---

## Biến môi trường

Tham khảo đầy đủ tại [`.env.example`](.env.example). Các biến quan trọng:

| Biến | Mô tả |
|---|---|
| `DATABASE_URL` | Chuỗi kết nối PostgreSQL |
| `ADMIN_SECRET_KEY` | Khóa quản trị — **chỉ đặt phía server**, không bao giờ thêm tiền tố `NEXT_PUBLIC_` |
| `BACKEND_API_URL` | Origin backend dùng bởi admin-proxy phía frontend |
| `NEXT_PUBLIC_API_URL` | Origin backend công khai cho client |
| `QA_LLM_API_KEY`, `QA_LLM_MODEL` | Cấu hình LLM cho module Hỏi đáp AI |
| `ALLOWED_ORIGINS` | Danh sách origin bổ sung cho CORS |
| `ALLOW_DEV_ADMIN_BYPASS` | Chỉ dùng ở development, bật bypass xác thực admin có kiểm soát |

> **Lưu ý bảo mật:** không tạo bất kỳ biến `NEXT_PUBLIC_*` nào chứa bí mật — Next.js nhúng thẳng các biến này vào bundle JavaScript gửi cho trình duyệt.

---

## Cấu trúc thư mục

```
tinix-legal/
├── packages/
│   ├── backend/
│   │   ├── prisma/schema.prisma        # 31 model dữ liệu
│   │   └── src/
│   │       ├── routes/                 # API endpoints theo tính năng
│   │       ├── services/               # Logic nghiệp vụ (AI, OCR, rủi ro...)
│   │       ├── application/            # Use-case tầng ứng dụng
│   │       ├── middleware/             # auth-guard, rate limiter
│   │       └── infrastructure/         # Prisma client dùng chung
│   ├── frontend/
│   │   └── src/
│   │       ├── app/                    # Next.js App Router — mỗi thư mục là 1 tính năng
│   │       ├── components/             # UI components theo domain (editor, contract, admin...)
│   │       └── lib/                    # api-client, document-labels, topic-icons, admin-session
│   └── crawler/
│       └── src/
│           ├── crawlers/               # vbpl, tvpl, chinhphu, phapdien
│           ├── parsers/                # Parse cấu trúc AST văn bản
│           ├── pipeline/               # Điều phối ingest dữ liệu
│           └── dedup/                  # Khử trùng lặp đa nguồn
└── .env.example
```
