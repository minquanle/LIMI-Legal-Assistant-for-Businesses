/**
 * Curated seed data for the compliance radar: one CRITICAL/WARNING/INFO
 * regulation per tracked industry, each carrying the 4-pillar impact
 * analysis and a weighted gap self-audit questionnaire.
 *
 * This is reference content maintained by the legal team through the
 * `/admin/radar-config` screen; edits made there persist directly to the
 * database. This file only supplies the initial rows the first time the
 * table is empty (see `RadarService.runSeed`), and is upserted on a natural
 * key (`industry` + `documentNumber`) so re-running the seed never
 * overwrites admin-entered content for the same document.
 */

import type { GapQuestion } from './radar-scoring.js';

export interface RadarAlertSeed {
  industry: string;
  industryName: string;
  documentNumber: string;
  title: string;
  effectiveDate: Date;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  summary: string;
  financialImpact: string;
  operationalImpact: string;
  hrImpact: string;
  penaltyReference: string;
  maxPenaltyAmount: string;
  affectedAreas: string[];
  actionChecklist: string[];
  gapQuestions: GapQuestion[];
  deadlineDate: Date;
}

export const RADAR_SEED_ALERTS: RadarAlertSeed[] = [
  // 1. DATA PRIVACY & CYBERSECURITY
  {
    industry: 'DATA_PRIVACY_CYBERSECURITY',
    industryName: 'Bảo vệ Dữ liệu Cá nhân & An ninh mạng',
    documentNumber: '13/2023/NĐ-CP',
    title: 'Nghị định về Bảo vệ Dữ liệu Cá nhân & Đánh giá Tác động DPIA',
    effectiveDate: new Date('2023-07-01'),
    severity: 'CRITICAL',
    summary: 'Mọi doanh nghiệp có xử lý dữ liệu khách hàng/nhân sự bắt buộc phải lập Hồ sơ Đánh giá tác động xử lý dữ liệu cá nhân (DPIA), nộp Cục A05 và bổ nhiệm Cán bộ Bảo vệ Dữ liệu (DPO).',
    financialImpact: 'Chi phí triển khai hệ thống quản lý đồng thuận, thuê ngoài DPO hoặc đào tạo nội bộ. Phạt tối đa 5% tổng doanh thu nếu vi phạm nghiêm trọng.',
    operationalImpact: 'Cập nhật lại toàn bộ Điều khoản Điều kiện trên website/ứng dụng, hợp đồng lao động, quy trình thu thập dữ liệu khách hàng.',
    hrImpact: 'Bắt buộc chỉ định DPO, tổ chức đào tạo nhận thức bảo mật bắt buộc cho 100% nhân sự phòng Kinh doanh, Marketing và CSKH.',
    penaltyReference: 'Dự thảo Nghị định Xử phạt VPHC trong lĩnh vực Bảo vệ Dữ liệu Cá nhân & Điều 84 Nghị định 15/2020/NĐ-CP',
    maxPenaltyAmount: 'Phạt tiền đến 5% tổng doanh thu năm tài chính liền kề hoặc phạt tới 100.000.000 VNĐ / hành vi',
    affectedAreas: ['Pháp chế', 'Công nghệ thông tin', 'Marketing', 'Nhân sự', 'Ban Giám đốc'],
    actionChecklist: [
      'Lập và lưu trữ Hồ sơ Đánh giá tác động DPIA theo Mẫu số 04, 05',
      'Nộp 01 bộ hồ sơ DPIA gốc về Cục A05 (Bộ Công an)',
      'Soạn thảo văn bản Đồng thuận Xử lý Dữ liệu Cá nhân cho khách hàng & người lao động',
      'Rà soát quy trình chuyển dữ liệu cá nhân ra nước ngoài (nếu dùng AWS/Google Cloud nước ngoài)',
    ],
    gapQuestions: [
      { id: 'dpia_filed', question: 'Doanh nghiệp đã hoàn tất và nộp Hồ sơ DPIA cho Cục An ninh mạng (A05) chưa?', weight: 35, remediation: 'Lập ngay hồ sơ DPIA theo Mẫu 04/05 NĐ 13 gửi A05' },
      { id: 'consent_updated', question: 'Đã có biểu mẫu lấy Đồng thuận rõ ràng trước khi thu thập dữ liệu cá nhân chưa?', weight: 25, remediation: 'Cập nhật hộp kiểm đồng thuận và Chính sách Bảo mật trên website' },
      { id: 'dpo_assigned', question: 'Đã có quyết định phân công Cán bộ Bảo vệ Dữ liệu (DPO) chuyên trách chưa?', weight: 20, remediation: 'Ban hành quyết định bổ nhiệm DPO phụ trách an toàn thông tin' },
      { id: 'data_inventory', question: 'Đã lập Bảng kiểm kê phân loại dữ liệu cơ bản và dữ liệu nhạy cảm chưa?', weight: 20, remediation: 'Thực hiện kiểm kê dòng chảy dữ liệu nội bộ' },
    ],
    deadlineDate: new Date('2025-06-30'),
  },

  // 2. FINTECH & BANKING
  {
    industry: 'FINTECH_BANKING',
    industryName: 'Ngân hàng, Chứng khoán & Fintech',
    documentNumber: 'QĐ 2345/QĐ-NHNN',
    title: 'Triển khai Xác thực Sinh trắc học trong Giao dịch Chuyển tiền Trực tuyến',
    effectiveDate: new Date('2024-07-01'),
    severity: 'CRITICAL',
    summary: 'Bắt buộc xác thực khuôn mặt khớp với dữ liệu trên CCCD gắn chip đối với giao dịch chuyển tiền trên 10 triệu đồng/lần hoặc trên 20 triệu đồng/ngày.',
    financialImpact: 'Đầu tư cổng kết nối NFC và giải pháp AI Face Matching so khớp dữ liệu căn cước công dân gắn chip.',
    operationalImpact: 'Nâng cấp luồng thanh toán App Mobile Banking/Ví điện tử, bổ sung kịch bản hỗ trợ khách hàng không có điện thoại NFC.',
    hrImpact: 'Đào tạo nhân viên giao dịch quầy hỗ trợ cài đặt sinh trắc học trực tiếp.',
    penaltyReference: 'Nghị định 88/2019/NĐ-CP về xử phạt VPHC lĩnh vực tiền tệ và ngân hàng',
    maxPenaltyAmount: 'Phạt tiền từ 150.000.000 VNĐ đến 250.000.000 VNĐ và tạm dừng tính năng chuyển tiền',
    affectedAreas: ['Công nghệ thông tin', 'Khối Vận hành', 'Chăm sóc khách hàng', 'Pháp chế'],
    actionChecklist: [
      'Hoàn tất tích hợp SDK sinh trắc học thẻ CCCD gắn chip trên ứng dụng di động',
      'Thiết lập ngưỡng chặn giao dịch tự động >10tr/lần khi chưa khớp sinh trắc học',
      'Đăng ký kiểm thử an ninh an toàn thông tin định kỳ theo chuẩn NHNN',
    ],
    gapQuestions: [
      { id: 'biometric_live', question: 'Ứng dụng đã kích hoạt tính năng bắt buộc xác thực khuôn mặt giao dịch >10 triệu chưa?', weight: 40, remediation: 'Kích hoạt module Face Matching SDK trên Production' },
      { id: 'nfc_flow', question: 'Hệ thống đã có luồng đọc thẻ CCCD gắn chip chuẩn Bộ Công an chưa?', weight: 30, remediation: 'Tích hợp giải pháp đọc chip FIDO/NFC' },
      { id: 'cs_training', question: 'Bộ phận CSKH đã có quy trình hướng dẫn khách hàng xác thực lỗi chưa?', weight: 30, remediation: 'Ban hành kịch bản FAQ xử lý lỗi Face Match' },
    ],
    deadlineDate: new Date('2025-01-01'),
  },

  // 3. LABOR & HR
  {
    industry: 'LABOR_HR',
    industryName: 'Lao động, Tiền lương & BHXH',
    documentNumber: '41/2024/QH15',
    title: 'Luật Bảo hiểm Xã hội 2024: Giảm điều kiện hưởng lương hưu xuống 15 năm',
    effectiveDate: new Date('2025-07-01'),
    severity: 'CRITICAL',
    summary: 'Giảm số năm đóng BHXH tối thiểu để hưởng lương hưu từ 20 năm xuống 15 năm; bổ sung trợ cấp hưu trí xã hội và chế tài xử lý chậm đóng, trốn đóng BHXH nghiêm ngặt.',
    financialImpact: 'Tăng chi phí trích nộp BHXH theo mức lương đóng thực tế. Lãi suất phạt chậm nộp 0.03%/ngày.',
    operationalImpact: 'Rà soát lại quy chế lương, cơ cấu phụ cấp không đóng BHXH và hợp đồng lao động của người lao động cao tuổi.',
    hrImpact: 'Cập nhật lại phần mềm tính lương, phổ biến chính sách lương hưu 15 năm cho toàn bộ người lao động.',
    penaltyReference: 'Điều 39 Nghị định 12/2022/NĐ-CP & Điều 216 Bộ luật Hình sự 2015 (Trốn đóng BHXH)',
    maxPenaltyAmount: 'Phạt tiền từ 12% đến 15% tổng số tiền phải đóng và có thể bị truy cứu trách nhiệm hình sự',
    affectedAreas: ['Nhân sự (C&B)', 'Kế toán tiền lương', 'Pháp chế', 'Ban Giám đốc'],
    actionChecklist: [
      'Rà soát danh sách nhân sự đóng BHXH từ 15-20 năm để tư vấn chính sách hưu trí',
      'Đồng bộ dữ liệu mã số BHXH với cơ sở dữ liệu VNeID của toàn bộ nhân viên',
      'Cập nhật thang bảng lương và hợp đồng thử việc theo mức lương tối thiểu vùng mới',
    ],
    gapQuestions: [
      { id: 'bhxh_audit', question: 'Doanh nghiệp đã kiểm tra 100% hợp đồng lao động >1 tháng đều được đóng BHXH chưa?', weight: 40, remediation: 'Rà soát ký HĐLĐ và báo tăng BHXH cho nhân viên đúng hạn' },
      { id: 'vneid_sync', question: 'Đã hoàn tất định danh VNeID cho hồ sơ người lao động chưa?', weight: 30, remediation: 'Yêu cầu nhân sự bổ sung CCCD gắn chip' },
      { id: 'overtime_limit', question: 'Doanh nghiệp có theo dõi giờ làm thêm không vượt trần 40 giờ/tháng, 200 giờ/năm?', weight: 30, remediation: 'Kiểm soát hạn mức OT qua phần mềm chấm công' },
    ],
    deadlineDate: new Date('2025-07-01'),
  },

  // 4. REAL ESTATE & CONSTRUCTION
  {
    industry: 'REAL_ESTATE_CONSTRUCTION',
    industryName: 'Bất động sản & Xây dựng',
    documentNumber: '31/2024/QH15',
    title: 'Luật Đất đai 2024: Bỏ Khung giá đất, áp dụng Bảng giá đất theo thị trường',
    effectiveDate: new Date('2024-08-01'),
    severity: 'CRITICAL',
    summary: 'Bỏ khung giá đất định kỳ 5 năm, các tỉnh thành ban hành Bảng giá đất hàng năm sát giá thị trường từ 01/01/2026. Thay đổi căn bản chi phí bồi thường, tiền sử dụng đất và cấp sổ đỏ.',
    financialImpact: 'Chi phí nộp tiền sử dụng đất cho các dự án bất động sản và chuyển mục đích sử dụng đất dự kiến tăng từ 2-5 lần.',
    operationalImpact: 'Phải tính toán lại phương án tài chính dự án (Feasibility Study) và thẩm định lại giá vốn hàng tồn kho.',
    hrImpact: 'Ban Dự án và Phòng Đấu thầu cần cập nhật quy trình tính toán hệ số K và phương pháp thặng dư.',
    penaltyReference: 'Nghị định 123/2024/NĐ-CP về xử phạt VPHC trong lĩnh vực đất đai',
    maxPenaltyAmount: 'Phạt tiền tối đa 1.000.000.000 VNĐ đối với tổ chức và truy thu toàn bộ số lợi bất hợp pháp',
    affectedAreas: ['Ban Quản lý Dự án', 'Tài chính - Kế toán', 'Pháp chế Bất động sản', 'Ban Giám đốc'],
    actionChecklist: [
      'Thực hiện nộp hồ sơ thẩm định tiền sử dụng đất trước thời điểm áp dụng bảng giá mới',
      'Rà soát giấy tờ pháp lý quyền sử dụng đất của toàn bộ tài sản doanh nghiệp',
      'Đăng ký biến động đất đai trực tuyến trên Cổng Dịch vụ công Quốc gia',
    ],
    gapQuestions: [
      { id: 'land_valuation', question: 'Dự án đã nộp hồ sơ tính tiền sử dụng đất theo phương pháp mới chưa?', weight: 40, remediation: 'Liên hệ Sở TN&MT để hoàn tất xác định nghĩa vụ tài chính' },
      { id: 'book_registry', question: 'Toàn bộ diện tích đất thuê / đất thương mại của công ty đã có Giấy chứng nhận hợp pháp?', weight: 30, remediation: 'Bổ sung hồ sơ cấp đổi sổ hồng theo Luật Đất đai 2024' },
      { id: 'social_housing', question: 'Doanh nghiệp có dự án nhà ở thương mại đã bố trí quỹ đất 20% nhà ở xã hội đúng luật?', weight: 30, remediation: 'Rà soát quy hoạch 1/500 đảm bảo tỷ lệ nhà ở xã hội' },
    ],
    deadlineDate: new Date('2025-12-31'),
  },

  // 5. ECOMMERCE & DIGITAL
  {
    industry: 'ECOMMERCE_DIGITAL',
    industryName: 'Thương mại điện tử & Dịch vụ số',
    documentNumber: '117/2024/NĐ-CP',
    title: 'Quy định Sàn TMĐT Bắt buộc Khấu trừ & Nộp thuế thay Người bán hàng',
    effectiveDate: new Date('2025-01-01'),
    severity: 'CRITICAL',
    summary: 'Các sàn giao dịch thương mại điện tử (Shopee, TikTok Shop, Lazada, Tiki) có chức năng đặt hàng trực tuyến bắt buộc phải khấu trừ, kê khai và nộp thuế GTGT, TNCN thay cho người bán hàng cá nhân.',
    financialImpact: 'Chi phí xây dựng cổng kết nối truyền nhận dữ liệu hóa đơn điện tử với Tổng cục Thuế.',
    operationalImpact: 'Tự động tính thuế 1.5% (1% GTGT + 0.5% TNCN) trên mỗi đơn hàng thành công và xuất biên lai khấu trừ điện tử cho seller.',
    hrImpact: 'Phòng Kế toán thuế và IT TMĐT cần vận hành hệ thống đối soát thuế hàng ngày.',
    penaltyReference: 'Nghị định 125/2020/NĐ-CP về xử phạt VPHC về thuế, hóa đơn',
    maxPenaltyAmount: 'Phạt tiền từ 1 lần đến 3 lần số tiền thuế trốn đối với hành vi không khấu trừ thuế đúng luật',
    affectedAreas: ['Kế toán Thuế', 'Lập trình viên Backend', 'Pháp chế TMĐT', 'Chăm sóc Người bán'],
    actionChecklist: [
      'Hoàn thành kết nối API tự động khấu trừ thuế 1.5% với Tổng cục Thuế',
      'Cập nhật Hợp đồng Hợp tác Kinh doanh với người bán hàng trên sàn',
      'Ban hành tính năng xuất Biên lai khấu trừ thuế TNCN điện tử cho Seller',
    ],
    gapQuestions: [
      { id: 'tax_api', question: 'Sàn TMĐT đã kết nối cổng chia sẻ dữ liệu doanh thu với cơ quan thuế chưa?', weight: 40, remediation: 'Tích hợp API Cổng thông tin TMĐT Tổng cục Thuế' },
      { id: 'seller_kyc', question: 'Đã thu thập đủ Mã số thuế / CCCD của 100% người bán hàng trên sàn?', weight: 30, remediation: 'Khóa tính năng rút tiền đối với tài khoản chưa định danh MST' },
      { id: 'e_receipt', question: 'Hệ thống đã có chức năng cấp chứng từ khấu trừ thuế điện tử cho seller?', weight: 30, remediation: 'Đăng ký sử dụng chứng từ điện tử theo Thông tư 78' },
    ],
    deadlineDate: new Date('2025-04-30'),
  },

  // 6. ENERGY & GREEN TRANSITION
  {
    industry: 'ENERGY_GREEN_TRANSITION',
    industryName: 'Năng lượng, Tín chỉ Carbon & ESG',
    documentNumber: '80/2024/NĐ-CP',
    title: 'Cơ chế Mua bán Điện Trực tiếp (DPPA) giữa Đơn vị phát điện tái tạo & Khách hàng lớn',
    effectiveDate: new Date('2024-07-03'),
    severity: 'WARNING',
    summary: 'Cho phép doanh nghiệp tiêu thụ điện lớn mua trực tiếp điện mặt trời, điện gió từ chủ đầu tư qua đường dây riêng hoặc qua lưới điện quốc gia (thị trường điện giao ngay).',
    financialImpact: 'Tiết kiệm chi phí điện năng dài hạn và gia tăng giá trị xuất khẩu nhờ chứng chỉ năng lượng tái tạo I-REC.',
    operationalImpact: 'Đàm phán Hợp đồng mua bán điện kỳ hạn (CfD) và lắp đặt hệ thống đo đếm điện năng từ xa.',
    hrImpact: 'Thành lập Ban Quản lý Năng lượng & Chuyển dịch Xanh (ESG).',
    penaltyReference: 'Nghị định 134/2013/NĐ-CP xử phạt vi phạm hành chính trong lĩnh vực điện lực',
    maxPenaltyAmount: 'Phạt tiền đến 100.000.000 VNĐ và thu hồi quyền tham gia thị trường điện',
    affectedAreas: ['Ban Năng lượng - ESG', 'Tài chính - Đấu thầu', 'Kỹ thuật - Vận hành', 'Pháp chế'],
    actionChecklist: [
      'Đăng ký tham gia cơ chế DPPA với Cục Điều tiết Điện lực (Bộ Công Thương)',
      'Ký kết Hợp đồng mua bán điện kỳ hạn mẫu theo Nghị định 80',
      'Thực hiện kiểm kê khí nhà kính hàng năm theo Quyết định 13/2024/QĐ-TTg',
    ],
    gapQuestions: [
      { id: 'dppa_eligible', question: 'Công ty có sản lượng tiêu thụ điện bình quân từ 200.000 kWh/tháng trở lên?', weight: 35, remediation: 'Lấy dữ liệu hóa đơn EVN 12 tháng gần nhất để đăng ký DPPA' },
      { id: 'ghg_inventory', question: 'Doanh nghiệp đã hoàn thành Báo cáo Kiểm kê Phát thải Khí nhà kính chưa?', weight: 35, remediation: 'Thuê đơn vị tư vấn lập báo cáo GHG theo ISO 14064' },
      { id: 'irec_audit', question: 'Đã có tài khoản đăng ký chứng chỉ năng lượng tái tạo I-REC quốc tế?', weight: 30, remediation: 'Mở tài khoản I-REC phục vụ xuất khẩu sang thị trường EU' },
    ],
    deadlineDate: new Date('2025-10-31'),
  },

  // 7. LOGISTICS & TRANSPORT
  {
    industry: 'LOGISTICS_TRANSPORT',
    industryName: 'Logistics, Kho bãi & Vận tải',
    documentNumber: '33/2025/TT-BXD',
    title: 'Quy chuẩn Kỹ thuật Quốc gia về Khí thải & Kiểm định Phương tiện Giao thông Vận tải',
    effectiveDate: new Date('2025-05-15'),
    severity: 'WARNING',
    summary: 'Áp dụng tiêu chuẩn khí thải Mức 4/Mức 5 bắt buộc cho toàn bộ phương tiện vận tải thương mại và hệ thống kho bãi logistics đường bộ, đường sắt.',
    financialImpact: 'Chi phí bảo dưỡng, nâng cấp động cơ hoặc chuyển đổi dần sang đội xe điện / xe nhiên liệu sinh học.',
    operationalImpact: 'Kiểm định khí thải định kỳ, tối ưu hóa cung đường vận chuyển để giảm hệ số phát thải carbon.',
    hrImpact: 'Tập huấn kỹ năng lái xe sinh thái (Eco-driving) cho 100% tài xế.',
    penaltyReference: 'Nghị định 100/2019/NĐ-CP và Nghị định 123/2021/NĐ-CP',
    maxPenaltyAmount: 'Phạt tiền từ 10.000.000 VNĐ đến 20.000.000 VNĐ và tước phù hiệu xe vận tải 1-3 tháng',
    affectedAreas: ['Đội xe - Vận tải', 'Kỹ thuật - Kho bãi', 'An toàn - Môi trường', 'Pháp chế'],
    actionChecklist: [
      'Kiểm tra toàn bộ hạn đăng kiểm và mức khí thải của đội xe vận tải',
      'Lắp đặt thiết bị giám sát hành trình và camera cabin truyền dữ liệu về Cục Đường bộ',
      'Đăng ký giấy phép vận chuyển hàng siêu trường, siêu trọng trực tuyến',
    ],
    gapQuestions: [
      { id: 'gps_camera', question: '100% xe vận tải của công ty đã lắp camera giám sát truyền dữ liệu liên tục?', weight: 40, remediation: 'Kiểm tra đường truyền camera cabin về Cục Đường bộ' },
      { id: 'emission_cert', question: 'Xe vận tải đã đạt tiêu chuẩn khí thải Euro 4/Euro 5 theo quy chuẩn mới?', weight: 30, remediation: 'Bảo dưỡng hệ thống lọc khí xả trước kỳ đăng kiểm' },
      { id: 'driver_health', question: 'Tài xế có khám sức khỏe định kỳ và xét nghiệm ma túy 6 tháng/lần?', weight: 30, remediation: 'Tổ chức khám sức khỏe nghề nghiệp định kỳ cho lái xe' },
    ],
    deadlineDate: new Date('2025-08-31'),
  },

  // 8. HEALTHCARE & PHARMA
  {
    industry: 'HEALTHCARE_PHARMA',
    industryName: 'Y tế, Dược phẩm & Mỹ phẩm',
    documentNumber: '12/2025/TT-BYT',
    title: 'Quy định Đăng ký Lưu hành Thuốc, Nguyên liệu làm thuốc & Mỹ phẩm',
    effectiveDate: new Date('2025-06-01'),
    severity: 'CRITICAL',
    summary: 'Tối ưu hóa hồ sơ đăng ký gia hạn số lưu hành thuốc theo định dạng điện tử ACTD/ICH; tăng cường kiểm tra hậu mại và thu hồi thuốc không đạt tiêu chuẩn chất lượng.',
    financialImpact: 'Chi phí thử nghiệm lâm sàng, nghiên cứu tương đương sinh học (BE) và phí thẩm định hồ sơ đăng ký.',
    operationalImpact: 'Chuyển đổi 100% hồ sơ đăng ký sang hệ thống Dịch vụ công trực tuyến Cục Quản lý Dược.',
    hrImpact: 'Dược sĩ phụ trách chuyên môn và bộ phận Regulatory Affairs (RA) cần cập nhật quy chuẩn GLP/GMP mới.',
    penaltyReference: 'Nghị định 117/2020/NĐ-CP về xử phạt VPHC trong lĩnh vực y tế',
    maxPenaltyAmount: 'Phạt tiền đến 100.000.000 VNĐ và đình chỉ hoạt động sản xuất kinh doanh 6-12 tháng',
    affectedAreas: ['Phòng Đăng ký Thuốc (RA)', 'Đảm bảo chất lượng (QA/QC)', 'Kho vận GSP', 'Pháp chế'],
    actionChecklist: [
      'Nộp hồ sơ gia hạn số đăng ký thuốc trước thời hạn hết hiệu lực tối thiểu 12 tháng',
      'Chuẩn hóa hồ sơ kỹ thuật theo chuẩn ACTD phiên bản mới nhất',
      'Kiểm tra định kỳ điều kiện bảo quản kho thuốc GSP và chuỗi lạnh Cold Chain',
    ],
    gapQuestions: [
      { id: 'actd_format', question: 'Hồ sơ đăng ký lưu hành đã được chuẩn hóa theo định dạng ACTD điện tử chưa?', weight: 40, remediation: 'Chuyển đổi hồ sơ sang ACTD nộp qua cổng dịch vụ công BYT' },
      { id: 'gmp_valid', question: 'Nhà máy sản xuất có Giấy chứng nhận GMP còn hiệu lực tối thiểu 6 tháng?', weight: 30, remediation: 'Lập hồ sơ tái đánh giá GMP với Cục Quản lý Dược' },
      { id: 'pharmacovigilance', question: 'Doanh nghiệp đã thiết lập hệ thống Cảnh giác Dược theo dõi phản ứng có hại (ADR)?', weight: 30, remediation: 'Ban hành quy trình SOP thu thập và báo cáo biến cố bất lợi ADR' },
    ],
    deadlineDate: new Date('2025-06-01'),
  },

  // 9. MANUFACTURING & IMPORT-EXPORT
  {
    industry: 'MANUFACTURING_IMPORT_EXPORT',
    industryName: 'Sản xuất, Hải quan & Xuất nhập khẩu',
    documentNumber: '121/2025/TT-BTC',
    title: 'Thủ tục Hải quan Điện tử & Quản lý Thuế Hàng hóa Xuất Nhập Khẩu',
    effectiveDate: new Date('2025-04-01'),
    severity: 'WARNING',
    summary: 'Hiện đại hóa thủ tục thông quan một cửa quốc gia, áp dụng cơ chế tự chứng nhận xuất xứ hàng hóa C/O điện tử trong các hiệp định FTA (CPTPP, EVFTA, RCEP).',
    financialImpact: 'Giảm chi phí lưu kho bãi tại cảng nhờ thông quan luồng xanh tự động.',
    operationalImpact: 'Lưu trữ hồ sơ chứng từ hải quan điện tử tối thiểu 05 năm để phục vụ kiểm tra sau thông quan.',
    hrImpact: 'Nhân viên xuất nhập khẩu cần thành thạo hệ thống khai báo VNACCS/VCIS nâng cấp.',
    penaltyReference: 'Nghị định 128/2020/NĐ-CP về xử phạt VPHC trong lĩnh vực hải quan',
    maxPenaltyAmount: 'Phạt tiền từ 20% đến 100% số tiền thuế khai thiếu và tịch thu tang vật vi phạm',
    affectedAreas: ['Phòng Xuất Nhập Khẩu', 'Kế toán Hải quan', 'Kho ngoại quan', 'Pháp chế'],
    actionChecklist: [
      'Đăng ký mã định danh tự chứng nhận xuất xứ (REX) đối với hàng xuất khẩu sang EU',
      'Rà soát bảng định mức tiêu hao nguyên vật liệu gia công xuất khẩu',
      'Thiết lập hệ thống sao lưu điện tử chứng từ hải quan theo đúng thời hạn 5 năm',
    ],
    gapQuestions: [
      { id: 'co_origin', question: 'Doanh nghiệp đã kiểm tra tiêu chí xuất xứ hàm lượng GTGT (RVC) hoặc chuyển đổi mã số (CTC)?', weight: 35, remediation: 'Lập bảng phân tích tiêu chí xuất xứ trước khi xin C/O' },
      { id: 'post_clearance', question: 'Hồ sơ chứng từ khai hải quan 5 năm gần nhất đã được lưu trữ sẵn sàng kiểm tra sau thông quan?', weight: 35, remediation: 'Tổ chức rà soát nội bộ hồ sơ kiểm tra sau thông quan' },
      { id: 'customs_code', question: 'Mã HS Code khai báo đã được tham vấn và xác định trước mã số với Tổng cục Hải quan?', weight: 30, remediation: 'Nộp hồ sơ xác định trước mã HS nếu mặt hàng mới' },
    ],
    deadlineDate: new Date('2025-07-31'),
  },

  // 10. EDUCATION & TRAINING
  {
    industry: 'EDUCATION_TRAINING',
    industryName: 'Giáo dục, Đào tạo & EdTech',
    documentNumber: '08/2025/NĐ-CP',
    title: 'Điều kiện Đầu tư & Hoạt động trong Lĩnh vực Giáo dục, Đào tạo Trực tuyến',
    effectiveDate: new Date('2025-05-01'),
    severity: 'INFO',
    summary: 'Quy định tiêu chuẩn diện tích sàn, chứng chỉ sư phạm của giảng viên và bản quyền học liệu đối với các trung tâm ngoại ngữ, tin học và nền tảng đào tạo từ xa EdTech.',
    financialImpact: 'Chi phí mua bản quyền giáo trình và nâng cấp máy chủ học trực tuyến LMS.',
    operationalImpact: 'Đăng ký giấy phép hoạt động giáo dục với Sở Giáo dục & Đào tạo địa phương.',
    hrImpact: 'Chuẩn hóa 100% văn bằng chứng chỉ nghiệp vụ sư phạm của giáo viên/trợ giảng.',
    penaltyReference: 'Nghị định 04/2021/NĐ-CP về xử phạt VPHC trong lĩnh vực giáo dục',
    maxPenaltyAmount: 'Phạt tiền đến 50.000.000 VNĐ và đình chỉ tuyển sinh khóa học',
    affectedAreas: ['Ban Đào tạo', 'Pháp chế Giáo dục', 'Hành chính - Nhân sự', 'Kinh doanh EdTech'],
    actionChecklist: [
      'Rà soát hồ sơ năng lực giáo viên và hợp đồng giảng dạy đúng quy định Sở GD&ĐT',
      'Đăng ký thẩm định chương trình đào tạo trực tuyến với cơ quan quản lý',
      'Công khai mức học phí và chính sách hoàn phí minh bạch trên website',
    ],
    gapQuestions: [
      { id: 'teacher_cert', question: '100% giáo viên người nước ngoài / người Việt Nam có đủ chứng chỉ sư phạm?', weight: 40, remediation: 'Cử nhân sự hoàn thành chứng chỉ nghiệp vụ sư phạm' },
      { id: 'edu_license', question: 'Cơ sở đào tạo đã có Giấy phép hoạt động giáo dục do Sở GD&ĐT cấp?', weight: 35, remediation: 'Hoàn tất hồ sơ xin cấp phép hoạt động giáo dục' },
      { id: 'tuition_transparency', question: 'Chính sách học phí và cam kết đầu ra đã được công khai minh bạch?', weight: 25, remediation: 'Đăng tải thông báo biểu phí trên trang thông tin điện tử' },
    ],
    deadlineDate: new Date('2025-09-30'),
  },
];
