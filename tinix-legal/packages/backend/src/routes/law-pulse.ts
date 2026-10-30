import { Router, Request, Response } from 'express';

export const lawPulseRouter = Router();

export interface ActionChecklistItem {
  id: string;
  task: string;
  deadline: string;
  penaltyRisk: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM';
}

export interface StakeholderImpact {
  role: string;
  roleName: string;
  iconName: string;
  riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  impactSummary: string;
  actionChecklist: ActionChecklistItem[];
}

export interface LawPulseItem {
  id: string;
  code: string;
  number: string;
  title: string;
  effectiveDate: string; // YYYY-MM-DD
  status: 'UPCOMING' | 'NEWLY_ENFORCED' | 'URGENT';
  category: string;
  summary: string;
  keyChanges: string[];
  penaltyHighlights: string[];
  stakeholderImpacts: StakeholderImpact[];
  relatedDocSlug?: string;
}

const LAW_PULSE_DATA: LawPulseItem[] = [
  {
    id: 'lp-bhxh-2024',
    code: 'BHXH_2024',
    number: 'Luật số 41/2024/QH15',
    title: 'Luật Bảo hiểm xã hội năm 2024',
    effectiveDate: '2025-07-01',
    status: 'UPCOMING',
    category: 'Lao động - Tiền lương & BHXH',
    summary: 'Giảm thời gian đóng BHXH tối thiểu hưởng hưu xuống 15 năm; siết chặt chế tài xử lý chậm đóng, trốn đóng BHXH; cấm xuất cảnh người đại diện pháp luật nếu nợ đọng kéo dài.',
    keyChanges: [
      'Giảm điều kiện số năm đóng BHXH tối thiểu để hưởng lương hưu từ 20 năm xuống còn 15 năm.',
      'Quy định rõ hành vi chậm đóng, trốn đóng BHXH: phạt lãi 0.03%/ngày, ngừng sử dụng hóa đơn, hoãn xuất cảnh người đại diện theo pháp luật.',
      'Bổ sung trợ cấp thai sản cho người tham gia BHXH tự nguyện.',
      'Bắt buộc tham gia BHXH đối với chủ hộ kinh doanh và người lao động làm việc theo hợp đồng từ 1 tháng trở lên.',
    ],
    penaltyHighlights: [
      'Phạt tiền 12% đến 20% tổng số tiền phải đóng nhưng tối đa không quá 75 triệu đồng đối với hành vi chậm đóng.',
      'Truy cứu trách nhiệm hình sự theo Điều 216 Bộ luật Hình sự (phạt tù tới 07 năm) đối với tội trốn đóng BHXH từ 1 tỷ đồng trở lên hoặc từ 6 tháng trở lên.',
    ],
    stakeholderImpacts: [
      {
        role: 'CEO_DIRECTOR',
        roleName: 'Ban Tổng Giám Đốc & Đại Diện Pháp Luật',
        iconName: 'Building2',
        riskLevel: 'CRITICAL',
        impactSummary: 'Chịu trách nhiệm pháp lý cao nhất; nguy cơ bị tạm hoãn xuất cảnh và doanh nghiệp bị dừng hóa đơn nếu nợ BHXH.',
        actionChecklist: [
          {
            id: 'bhxh-ceo-1',
            task: 'Yêu cầu phòng Kế toán & HR rà soát toàn bộ công nợ BHXH tồn đọng trước 30/04/2025.',
            deadline: '30/04/2025',
            penaltyRisk: 'Tránh bị cơ quan BHXH chuyển hồ sơ sang cơ quan Công an thụ lý.',
            priority: 'CRITICAL',
          },
          {
            id: 'bhxh-ceo-2',
            task: 'Phê duyệt ngân sách dự phòng và quy trình thanh toán BHXH định kỳ tự động ngày 20 hàng tháng.',
            deadline: '15/05/2025',
            penaltyRisk: 'Tránh phát sinh lãi phạt chậm nộp 0.03%/ngày.',
            priority: 'HIGH',
          },
        ],
      },
      {
        role: 'HR_PAYROLL',
        roleName: 'Phòng Nhân Sự (HR) & Tiền Lương',
        iconName: 'Users',
        riskLevel: 'HIGH',
        impactSummary: 'Phải rà soát lại toàn bộ hợp đồng thử việc, hợp đồng cộng tác viên và cơ cấu thang bảng lương đóng bảo hiểm.',
        actionChecklist: [
          {
            id: 'bhxh-hr-1',
            task: 'Rà soát hợp đồng cộng tác viên, khoán việc có thời hạn từ 1 tháng trở lên để chuyển sang HĐLĐ chuẩn.',
            deadline: '31/05/2025',
            penaltyRisk: 'Phạt vi phạm hành chính từ 2.000.000đ đến 25.000.000đ/người vi phạm.',
            priority: 'CRITICAL',
          },
          {
            id: 'bhxh-hr-2',
            task: 'Tổ chức truyền thông nội bộ về chính sách 15 năm hưởng hưu để giữ chân nhân sự lớn tuổi.',
            deadline: '15/06/2025',
            penaltyRisk: 'Giảm thiểu tình trạng nhân sự xin nghỉ việc để rút BHXH 1 lần.',
            priority: 'MEDIUM',
          },
        ],
      },
      {
        role: 'FINANCE_TAX',
        roleName: 'Phòng Kế Toán & Tài Chính',
        iconName: 'DollarSign',
        riskLevel: 'HIGH',
        impactSummary: 'Tách biệt rõ quỹ tiền lương và tiền trích nộp BHXH để tránh bị xếp vào diện trốn đóng.',
        actionChecklist: [
          {
            id: 'bhxh-fin-1',
            task: 'Thiết lập lệnh chuyển tiền tự động trích nộp BHXH hàng tháng đúng hạn theo thông báo mẫu C12-TS.',
            deadline: '01/06/2025',
            penaltyRisk: 'Tránh bị phạt cưỡng chế tài khoản ngân hàng từ cơ quan Thuế & BHXH.',
            priority: 'HIGH',
          },
        ],
      },
    ],
  },
  {
    id: 'lp-ttatgt-2024',
    code: 'TTATGT_2024',
    number: 'Luật số 36/2024/QH15',
    title: 'Luật Trật tự, an toàn giao thông đường bộ năm 2024',
    effectiveDate: '2025-01-01',
    status: 'NEWLY_ENFORCED',
    category: 'Vận tải & Giao thông Đô thị',
    summary: 'Áp dụng hệ thống trừ điểm Giấy phép lái xe (12 điểm/năm); bắt buộc trang bị thiết bị an toàn cho trẻ em trên ô tô; siết chặt thời gian lái xe của tài xế.',
    keyChanges: [
      'Mỗi bằng lái xe có 12 điểm/năm. Bị trừ điểm theo từng mức độ vi phạm, hết điểm phải học và thi lại.',
      'Trẻ em dưới 10 tuổi và chiều cao dưới 1,35m ngồi trên xe ô tô con không được ngồi cùng hàng ghế với người lái và phải có thiết bị an toàn phù hợp.',
      'Thời gian lái xe của tài xế kinh doanh vận tải: không quá 4 giờ liên tục, tổng không quá 10 giờ/ngày.',
      'Cấm tuyệt đối điều khiển phương tiện tham gia giao thông đường bộ mà trong máu hoặc hơi thở có nồng độ cồn.',
    ],
    penaltyHighlights: [
      'Tước quyền sử dụng giấy phép lái xe và trừ từ 2 đến 12 điểm tùy theo hành vi vi phạm.',
      'Phạt doanh nghiệp vận tải từ 10.000.000đ đến 20.000.000đ nếu bố trí tài xế lái xe quá giờ quy định.',
    ],
    stakeholderImpacts: [
      {
        role: 'LOGISTICS_FLEET',
        roleName: 'Phòng Vận Tải, Đội Xe & Logistics',
        iconName: 'Truck',
        riskLevel: 'CRITICAL',
        impactSummary: 'Tài xế bị trừ hết điểm bằng lái sẽ không được phép chạy xe, dẫn đến nguy cơ đứt gãy chuỗi giao vận.',
        actionChecklist: [
          {
            id: 'gt-log-1',
            task: 'Nâng cấp phần mềm GPS / giám sát hành trình để cảnh báo tài xế khi chạy liên tục đạt ngưỡng 3.5 giờ.',
            deadline: 'Khẩn cấp',
            penaltyRisk: 'Phạt trực tiếp doanh nghiệp vận tải và tước phù hiệu xe 1-3 tháng.',
            priority: 'CRITICAL',
          },
          {
            id: 'gt-log-2',
            task: 'Tổ chức tập huấn nội bộ cho 100% tài xế về danh mục lỗi bị trừ điểm bằng lái xe.',
            deadline: 'Khẩn cấp',
            penaltyRisk: 'Giảm thiểu rủi ro tài xế bị giữ bằng làm xe nằm bãi.',
            priority: 'HIGH',
          },
        ],
      },
      {
        role: 'CEO_DIRECTOR',
        roleName: 'Ban Tổng Giám Đốc & Hành Chính',
        iconName: 'Building2',
        riskLevel: 'MEDIUM',
        impactSummary: 'Cần trang bị ghế an toàn trẻ em cho xe công tác và ban hành quy chế cấm cồn trong giờ làm việc.',
        actionChecklist: [
          {
            id: 'gt-ceo-1',
            task: 'Rà soát xe đưa đón cán bộ, xe công tác để trang bị ghế giữ trẻ em theo quy chuẩn mới.',
            deadline: 'Khẩn cấp',
            penaltyRisk: 'Xử phạt khi lưu thông trên cao tốc.',
            priority: 'MEDIUM',
          },
        ],
      },
    ],
  },
  {
    id: 'lp-bds-land-2024',
    code: 'BDS_LAND_2024',
    number: 'Luật số 31/2024/QH15 & Luật số 29/2023/QH15',
    title: 'Bộ Đôi Luật Đất Đai 2024 & Luật Kinh Doanh Bất Động Sản 2023',
    effectiveDate: '2024-08-01',
    status: 'NEWLY_ENFORCED',
    category: 'Đất đai, Nhà ở & Bất động sản',
    summary: 'Áp dụng bảng giá đất thị trường; giới hạn tiền đặt cọc nhà ở hình thành trong tương lai tối đa 5%; bắt buộc thanh toán qua tài khoản ngân hàng.',
    keyChanges: [
      'Bỏ khung giá đất, bảng giá đất mới điều chỉnh sát giá thị trường làm tăng chi phí bồi thường và thuê đất hàng năm.',
      'Chủ đầu tư chỉ được nhận tiền đặt cọc không quá 5% giá bán/thuê mua khi công trình đã đủ điều kiện kinh doanh.',
      'Doanh nghiệp kinh doanh BĐS phải công khai đầy đủ thông tin dự án, bảo lãnh ngân hàng trên hệ thống trước khi bán.',
      'Tất cả giao dịch thanh toán bất động sản phải chuyển khoản qua tài khoản ngân hàng tại TCTD Việt Nam.',
    ],
    penaltyHighlights: [
      'Phạt tiền từ 800.000.000đ đến 1.000.000.000đ đối với hành vi thu tiền đặt cọc hoặc huy động vốn trái quy định.',
      'Buộc hoàn trả toàn bộ số tiền đã huy động sai và đình chỉ hoạt động kinh doanh BĐS từ 3 đến 6 tháng.',
    ],
    stakeholderImpacts: [
      {
        role: 'REAL_ESTATE_SALES',
        roleName: 'Chủ Đầu Tư, Sàn Giao Dịch & Khối Kinh Doanh BĐS',
        iconName: 'Home',
        riskLevel: 'CRITICAL',
        impactSummary: 'Toàn bộ hợp đồng cọc, hợp đồng mua bán và quy trình huy động vốn phải sửa đổi 100% theo mẫu mới.',
        actionChecklist: [
          {
            id: 'bds-sale-1',
            task: 'Hủy bỏ và sửa toàn bộ mẫu Thỏa thuận giữ chỗ / Đặt cọc vượt quá 5% giá trị sản phẩm.',
            deadline: 'Khẩn cấp',
            penaltyRisk: 'Hợp đồng vô hiệu, phạt tới 1 tỷ đồng và đình chỉ bán hàng.',
            priority: 'CRITICAL',
          },
          {
            id: 'bds-sale-2',
            task: 'Cập nhật mẫu Hợp đồng Mua bán nhà ở chuẩn theo Nghị định 96/2024/NĐ-CP.',
            deadline: 'Khẩn cấp',
            penaltyRisk: 'Từ chối cấp sổ hồng cho cư dân nếu hợp đồng mua bán sai mẫu quy định.',
            priority: 'CRITICAL',
          },
        ],
      },
      {
        role: 'FINANCE_TAX',
        roleName: 'Phòng Kế Toán & Thuế',
        iconName: 'DollarSign',
        riskLevel: 'HIGH',
        impactSummary: 'Tính toán lại nghĩa vụ tài chính đất đai và chi phí thuê đất sản xuất kinh doanh theo bảng giá mới.',
        actionChecklist: [
          {
            id: 'bds-fin-1',
            task: 'Đánh giá tác động của bảng giá đất mới đến chi phí thuê đất khu công nghiệp hàng năm.',
            deadline: '30/06/2025',
            penaltyRisk: 'Tránh bị động dòng tiền khi địa phương ban hành hệ số K mới.',
            priority: 'HIGH',
          },
        ],
      },
    ],
  },
  {
    id: 'lp-data-privacy-2025',
    code: 'DATA_PRIVACY_2025',
    number: 'Nghị định số 13/2023/NĐ-CP & Dự thảo Luật Bảo vệ dữ liệu cá nhân',
    title: 'Quy Định Bảo Vệ Dữ Liệu Cá Nhân & Hồ Sơ DPIA (2025 – 2026)',
    effectiveDate: '2025-01-01',
    status: 'URGENT',
    category: 'Công nghệ, Dữ liệu & An ninh mạng',
    summary: 'Bắt buộc lập Hồ sơ Đánh giá tác động xử lý dữ liệu cá nhân (DPIA) gửi Bộ Công an; chỉ định nhân sự DPO; phạt tối đa 5% doanh thu nếu vi phạm.',
    keyChanges: [
      'Doanh nghiệp thu thập dữ liệu khách hàng (số điện thoại, email, hành vi) bắt buộc lập hồ sơ DPIA gửi Cục A05 - Bộ Công an.',
      'Phải có sự đồng ý rõ ràng (Opt-in Consent) của khách hàng trước khi chia sẻ dữ liệu cho bên thứ ba hoặc chạy quảng cáo.',
      'Dự thảo Luật mới đề xuất mức phạt vi phạm bảo vệ dữ liệu lên tới 5% tổng doanh thu của doanh nghiệp.',
      'Nghiêm cấm hành vi mua bán data khách hàng dưới mọi hình thức.',
    ],
    penaltyHighlights: [
      'Phạt tiền từ 80.000.000đ đến 100.000.000đ do không lập hồ sơ DPIA nộp Cục An ninh mạng (A05).',
      'Đình chỉ hoạt động xử lý dữ liệu từ 1 đến 3 tháng và tịch thu toàn bộ tang vật, phương tiện vi phạm.',
    ],
    stakeholderImpacts: [
      {
        role: 'TECH_ECOMMERCE',
        roleName: 'Khối Công Nghệ (IT), E-Commerce & Marketing',
        iconName: 'Cpu',
        riskLevel: 'CRITICAL',
        impactSummary: 'Rà soát toàn bộ website, app di động, popup đồng ý Cookie/Consent và luồng lưu trữ Database.',
        actionChecklist: [
          {
            id: 'dp-tech-1',
            task: 'Hoàn thiện hồ sơ Đánh giá tác động xử lý dữ liệu cá nhân (Mẫu 04/DPIA) nộp Cục A05.',
            deadline: 'Khẩn cấp',
            penaltyRisk: 'Bộ Công an đang tiến hành thanh tra diện rộng các doanh nghiệp công nghệ & bán lẻ.',
            priority: 'CRITICAL',
          },
          {
            id: 'dp-tech-2',
            task: 'Sửa đổi Terms of Service và Privacy Policy trên Web/App yêu cầu người dùng tích chọn đồng ý riêng biệt.',
            deadline: 'Khẩn cấp',
            penaltyRisk: 'Xử lý dữ liệu không có sự đồng ý bị phạt tiền và khóa cổng dịch vụ.',
            priority: 'HIGH',
          },
        ],
      },
      {
        role: 'HR_PAYROLL',
        roleName: 'Phòng Nhân Sự (HR)',
        iconName: 'Users',
        riskLevel: 'MEDIUM',
        impactSummary: 'Dữ liệu CCCD, sinh trắc học vân tay, lương thưởng của nhân viên là dữ liệu cá nhân nhạy cảm cần bảo mật.',
        actionChecklist: [
          {
            id: 'dp-hr-1',
            task: 'Ký Phụ lục thỏa thuận bảo vệ dữ liệu cá nhân với 100% nhân viên trong công ty.',
            deadline: '30/04/2025',
            penaltyRisk: 'Tránh khiếu nại của người lao động khi công ty sử dụng hình ảnh/dữ liệu nội bộ.',
            priority: 'MEDIUM',
          },
        ],
      },
    ],
  },
  {
    id: 'lp-tax-ecom-2025',
    code: 'TAX_ECOM_2025',
    number: 'Luật Thuế GTGT & Quản lý Thuế Sàn TMĐT',
    title: 'Chính Sách Thuế Mới Cho Thương Mại Điện Tử & Hàng Xuyên Biên Giới (2025 – 2026)',
    effectiveDate: '2025-07-01',
    status: 'UPCOMING',
    category: 'Tài chính - Kế toán & Thuế',
    summary: 'Sàn TMĐT khấu trừ và nộp thuế thay người bán; bãi bỏ miễn thuế GTGT đối với hàng nhập khẩu chuyển phát nhanh giá trị nhỏ.',
    keyChanges: [
      'Sàn giao dịch thương mại điện tử (Shopee, Lazada, TikTok Shop, Tiki) có chức năng đặt hàng trực tuyến phải khấu trừ, kê khai và nộp thuế thay cho hộ, cá nhân kinh doanh trên sàn.',
      'Bãi bỏ quy định miễn thuế GTGT với hàng nhập khẩu giá trị dưới 1 triệu đồng gửi qua dịch vụ chuyển phát nhanh.',
      'Áp dụng cơ chế chia sẻ dữ liệu tự động giữa Bộ Công Thương, Ngân hàng Nhà nước và Tổng cục Thuế.',
    ],
    penaltyHighlights: [
      'Phạt hành chính về thuế từ 1 đến 3 lần số tiền thuế trốn đối với hành vi che giấu doanh thu trên sàn TMĐT.',
      'Tạm dừng thủ tục hải quan và khóa cổng thanh toán đối với các nền tảng xuyên biên giới không đăng ký thuế.',
    ],
    stakeholderImpacts: [
      {
        role: 'FINANCE_TAX',
        roleName: 'Phòng Kế Toán, Thuế & Nhà Bán Hàng E-Commerce',
        iconName: 'DollarSign',
        riskLevel: 'CRITICAL',
        impactSummary: 'Doanh thu trên sàn TMĐT sẽ được tự động đối soát với cơ quan Thuế; phải chuẩn hóa hóa đơn đầu vào.',
        actionChecklist: [
          {
            id: 'tax-fin-1',
            task: 'Khớp nối doanh thu báo cáo trên sàn với doanh thu kê khai trên tờ khai thuế quý.',
            deadline: '30/06/2025',
            penaltyRisk: 'Truy thu thuế GTGT, TNCN kèm tiền chậm nộp 0.03%/ngày và phạt trốn thuế.',
            priority: 'CRITICAL',
          },
          {
            id: 'tax-fin-2',
            task: 'Rà soát chứng từ nguồn gốc hàng hóa nhập khẩu để chuẩn bị cho việc thu thuế GTGT từ 0 đồng.',
            deadline: '31/07/2025',
            penaltyRisk: 'Hàng hóa bị giữ tại cửa khẩu hải quan nếu thiếu chứng từ nộp thuế GTGT.',
            priority: 'HIGH',
          },
        ],
      },
    ],
  },
];

const ROLES_LIST = [
  { code: 'ALL', name: 'Tất cả các vai trò', iconName: 'Layers' },
  { code: 'CEO_DIRECTOR', name: 'Ban Giám Đốc & Pháp Chế', iconName: 'Building2' },
  { code: 'HR_PAYROLL', name: 'Nhân Sự (HR) & Tiền Lương', iconName: 'Users' },
  { code: 'FINANCE_TAX', name: 'Kế Toán, Thuế & Tài Chính', iconName: 'DollarSign' },
  { code: 'REAL_ESTATE_SALES', name: 'Bất Động Sản & Kinh Doanh', iconName: 'Home' },
  { code: 'TECH_ECOMMERCE', name: 'Công Nghệ, IT & E-Commerce', iconName: 'Cpu' },
  { code: 'LOGISTICS_FLEET', name: 'Vận Tải, Đội Xe & Logistics', iconName: 'Truck' },
];

/**
 * Derives an item's status from its effectiveDate relative to today, instead
 * of trusting the hardcoded value in LAW_PULSE_DATA — a law whose effective
 * date has already passed no longer counts as UPCOMING just because that's
 * what it was seeded as, which previously produced a visibly contradictory
 * badge (e.g. "Sắp hiệu lực" next to a countdown reading "Đã có hiệu lực").
 */
function deriveStatus(effectiveDate: string): LawPulseItem['status'] {
  const eff = new Date(effectiveDate + 'T00:00:00Z');
  if (Number.isNaN(eff.getTime())) return 'UPCOMING';
  const now = new Date();
  const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const daysUntil = Math.round((eff.getTime() - todayUTC.getTime()) / 86400000);

  if (daysUntil > 30) return 'UPCOMING';
  if (daysUntil >= 0) return 'URGENT'; // effective within 30 days — action window
  return 'NEWLY_ENFORCED'; // already in effect
}

function withDerivedStatus(item: LawPulseItem): LawPulseItem {
  return { ...item, status: deriveStatus(item.effectiveDate) };
}

/** GET /api/law-pulse/items */
lawPulseRouter.get('/items', (_req: Request, res: Response) => {
  const role = _req.query.role as string;
  const status = _req.query.status as string;
  const search = (_req.query.search as string || '').toLowerCase().trim();

  let filtered = LAW_PULSE_DATA.map(withDerivedStatus);

  if (status && status !== 'ALL') {
    filtered = filtered.filter((item) => item.status === status);
  }

  if (role && role !== 'ALL') {
    filtered = filtered.filter((item) =>
      item.stakeholderImpacts.some((imp) => imp.role === role)
    );
  }

  if (search) {
    filtered = filtered.filter(
      (item) =>
        item.title.toLowerCase().includes(search) ||
        item.number.toLowerCase().includes(search) ||
        item.summary.toLowerCase().includes(search) ||
        item.category.toLowerCase().includes(search)
    );
  }

  return res.json({
    items: filtered,
    total: filtered.length,
    roles: ROLES_LIST,
  });
});

/** GET /api/law-pulse/roles */
lawPulseRouter.get('/roles', (_req: Request, res: Response) => {
  return res.json(ROLES_LIST);
});
