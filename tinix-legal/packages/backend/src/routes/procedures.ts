import { Router, Request, Response } from 'express';
import { prisma } from '../infrastructure/db.js';

export const procedureRouter = Router();

export const PROCEDURE_CATEGORIES = [
  { id: 'ALL', name: 'Tất cả thủ tục', icon: 'landmark' },
  { id: 'DOANH_NGHIEP', name: 'Doanh nghiệp & Đầu tư', icon: 'building-2' },
  { id: 'DAT_DAI', name: 'Đất đai & Nhà ở', icon: 'home' },
  { id: 'LAO_DONG', name: 'Lao động & BHXH', icon: 'users' },
  { id: 'SHTT', name: 'Sở hữu Trí tuệ (IP)', icon: 'lightbulb' },
  { id: 'THUE_KETOAN', name: 'Thuế & Hóa đơn', icon: 'dollar-sign' },
];

const SEED_PROCEDURES = [
  {
    code: 'TTHC-DN-01',
    title: 'Đăng ký thành lập Công ty Trách nhiệm Hữu hạn Hai thành viên trở lên',
    category: 'DOANH_NGHIEP',
    categoryName: 'Doanh nghiệp & Đầu tư',
    authority: 'Phòng Đăng ký kinh doanh - Sở Kế hoạch và Đầu tư tỉnh/thành phố',
    processingDays: 3,
    fee: '50.000 VNĐ (Miễn phí nếu nộp 100% trực tuyến qua Cổng QG)',
    targetSubject: 'Tổ chức, cá nhân Việt Nam và nhà đầu tư nước ngoài',
    legalBasis: 'Luật Doanh nghiệp 2020, Nghị định 01/2021/NĐ-CP, Thông tư 01/2021/TT-BKHĐT',
    dossierList: [
      { id: '1', name: 'Giấy đề nghị đăng ký doanh nghiệp (Phụ lục I-3)', required: true, note: 'Do Người đại diện ký' },
      { id: '2', name: 'Điều lệ công ty TNHH 2 TV trở lên', required: true, note: 'Tất cả thành viên góp vốn ký từng trang' },
      { id: '3', name: 'Danh sách thành viên góp vốn (Phụ lục I-6)', required: true, note: 'Kèm tỷ lệ % vốn góp' },
      { id: '4', name: 'Bản sao CCCD/Hộ chiếu của thành viên cá nhân và Người đại diện', required: true, note: 'Bản sao y công chứng hoặc quét CCCD gắn chip' },
    ],
    stepTimeline: [
      { stepNumber: 1, title: 'Chuẩn bị hồ sơ & Đặt tên công ty', description: 'Tra cứu tên công ty không bị trùng, xác định mã ngành cấp 4 và vốn điều lệ', department: 'Người thành lập', duration: '1 ngày' },
      { stepNumber: 2, title: 'Nộp hồ sơ trực tuyến', description: 'Nộp qua Cổng thông tin Quốc gia về Đăng ký Doanh nghiệp bằng Tài khoản định danh hoặc Chữ ký số', department: 'Cổng dangkykinhdoanh.gov.vn', duration: '30 phút' },
      { stepNumber: 3, title: 'Thẩm định & Cấp Giấy phép', description: 'Chuyên viên thụ lý hồ sơ và cấp Giấy chứng nhận ĐKDN điện tử', department: 'Sở KH&ĐT', duration: '3 ngày làm việc' },
      { stepNumber: 4, title: 'Khắc dấu & Công bố thông tin', description: 'Tự khắc con dấu doanh nghiệp, mở tài khoản ngân hàng và mua chữ ký số kê khai thuế ban đầu', department: 'Doanh nghiệp & Thuế', duration: '1-2 ngày' },
    ],
    templates: [
      { name: 'Mẫu Giấy đề nghị ĐKDN Công ty TNHH 2TV (Phụ lục I-3).docx', format: 'DOCX', url: '/templates/tthc/giay-de-nghi-tnhh-2tv.docx' },
      { name: 'Mẫu Điều lệ Công ty TNHH chuẩn Luật DN 2020.docx', format: 'DOCX', url: '/templates/tthc/dieu-le-tnhh.docx' },
      { name: 'Mẫu Danh sách Thành viên góp vốn.docx', format: 'DOCX', url: '/templates/tthc/danh-sach-thanh-vien.docx' },
    ],
    onlinePortalUrl: 'https://dangkykinhdoanh.gov.vn',
    notes: 'Lưu ý kiểm tra kỹ ngành nghề kinh doanh có điều kiện. Nếu có thành viên là tổ chức nước ngoài cần hợp pháp hóa lãnh sự Giấy phép thành lập.',
  },
  {
    code: 'TTHC-DAT-01',
    title: 'Đăng ký biến động quyền sử dụng đất (Sang tên Sổ đỏ khi Mua bán / Tặng cho)',
    category: 'DAT_DAI',
    categoryName: 'Đất đai & Nhà ở',
    authority: 'Văn phòng Đăng ký đất đai / Chi nhánh VP Đăng ký đất đai cấp huyện',
    processingDays: 10,
    fee: 'Thuế TNCN 2% (Bên bán) + Lệ phí trước bạ 0.5% (Bên mua) + Phí thẩm định hồ sơ',
    targetSubject: 'Cá nhân, hộ gia đình nhận chuyển nhượng, tặng cho BĐS',
    legalBasis: 'Luật Đất đai 2024, Nghị định 101/2024/NĐ-CP',
    dossierList: [
      { id: '1', name: 'Hợp đồng chuyển nhượng / tặng cho quyền sử dụng đất đã công chứng', required: true, note: 'Bản chính công chứng' },
      { id: '2', name: 'Bản gốc Giấy chứng nhận quyền sử dụng đất (Sổ đỏ / Sổ hồng)', required: true, note: 'Bản chính' },
      { id: '3', name: 'Đơn đăng ký biến động đất đai (Mẫu số 09/ĐK)', required: true, note: 'Bản gốc người mua ký' },
      { id: '4', name: 'Tờ khai lệ phí trước bạ + Tờ khai thuế thu nhập cá nhân', required: true, note: 'Theo mẫu của cơ quan thuế' },
    ],
    stepTimeline: [
      { stepNumber: 1, title: 'Ký hợp đồng công chứng', description: 'Hai bên mang CCCD và sổ gốc đến Văn phòng Công chứng ký kết hợp đồng', department: 'VP Công chứng', duration: '1 buổi' },
      { stepNumber: 2, title: 'Nộp hồ sơ tại Chi nhánh VP ĐKĐĐ', description: 'Nộp hồ sơ tại Bộ phận Một cửa hoặc Văn phòng Đăng ký đất đai cấp huyện', department: 'Bộ phận 1 Cửa', duration: '1 ngày' },
      { stepNumber: 3, title: 'Nộp thuế & Thực hiện nghĩa vụ tài chính', description: 'Nhận thông báo thuế qua tin nhắn và nộp tiền vào Kho bạc / Ngân hàng', department: 'Chi cục Thuế', duration: '3-5 ngày' },
      { stepNumber: 4, title: 'Nhận Sổ đỏ đã cập nhật biến động', description: 'Nộp biên lai thuế và nhận sổ hồng đã in thông tin chủ mới tại trang 4 hoặc cấp sổ mới', department: 'VP ĐKĐĐ', duration: '1-2 ngày' },
    ],
    templates: [
      { name: 'Đơn đăng ký biến động đất đai Mẫu 09-ĐK.docx', format: 'DOCX', url: '/templates/tthc/don-dang-ky-bien-dong-09dk.docx' },
      { name: 'Tờ khai Lệ phí Trước bạ Nhà đất Mẫu 01-LPTB.docx', format: 'DOCX', url: '/templates/tthc/to-khai-truoc-ba.docx' },
    ],
    onlinePortalUrl: 'https://dichvucong.gov.vn',
    notes: 'Thời hạn bắt buộc phải làm thủ tục sang tên là trong vòng 30 ngày kể từ ngày ký hợp đồng công chứng, quá hạn sẽ bị phạt tiền.',
  },
  {
    code: 'TTHC-SHTT-01',
    title: 'Đăng ký Nhãn hiệu Hàng hóa & Dịch vụ (Trademark Filing)',
    category: 'SHTT',
    categoryName: 'Sở hữu Trí tuệ (IP)',
    authority: 'Cục Sở hữu Trí tuệ (Bộ Khoa học và Công nghệ)',
    processingDays: 12, // tháng
    fee: 'Lệ phí nộp đơn: 150.000 VNĐ / 01 nhóm 6 sản phẩm; Phí thẩm định: 550.000 VNĐ',
    targetSubject: 'Cá nhân, Doanh nghiệp sở hữu thương hiệu, logo sản phẩm',
    legalBasis: 'Luật Sở hữu Trí tuệ sửa đổi 2022, Nghị định 65/2023/NĐ-CP',
    dossierList: [
      { id: '1', name: 'Tờ khai đăng ký nhãn hiệu (02 bản)', required: true, note: 'Theo mẫu 04-NH Phụ lục I NĐ 65/2023' },
      { id: '2', name: 'Mẫu nhãn hiệu (05 mẫu)', required: true, note: 'Kích thước không quá 80x80mm, rõ nét' },
      { id: '3', name: 'Danh mục hàng hóa/dịch vụ phân loại theo Bảng Ni-xơ phiên bản 12', required: true, note: 'Ghi rõ mã nhóm 01-45' },
      { id: '4', name: 'Giấy ủy quyền (nếu nộp qua đại diện SHCN)', required: false, note: 'Bản gốc' },
    ],
    stepTimeline: [
      { stepNumber: 1, title: 'Tra cứu sơ bộ nhãn hiệu', description: 'Đánh giá khả năng đăng ký và trùng lặp với các nhãn hiệu đã nộp trước đó', department: 'Tự tra cứu IP Lib', duration: '1 ngày' },
      { stepNumber: 2, title: 'Nộp đơn & Thẩm định hình thức', description: 'Cục SHTT kiểm tra tính hợp lệ của hồ sơ và cấp Quyết định chấp nhận đơn hợp lệ', department: 'Cục SHTT', duration: '01 tháng' },
      { stepNumber: 3, title: 'Công bố đơn trên Công báo SHCN', description: 'Công khai đơn đăng ký trên Cổng thông tin Cục SHTT', department: 'Cục SHTT', duration: '02 tháng' },
      { stepNumber: 4, title: 'Thẩm định nội dung & Cấp văn bằng', description: 'Đánh giá tính phân biệt và ra Quyết định cấp Giấy chứng nhận đăng ký nhãn hiệu', department: 'Cục SHTT', duration: '09-12 tháng' },
    ],
    templates: [
      { name: 'Mẫu Tờ khai Đăng ký Nhãn hiệu (Phụ lục I NĐ 65-2023).docx', format: 'DOCX', url: '/templates/tthc/to-khai-nhan-hieu-nd65.docx' },
    ],
    onlinePortalUrl: 'http://dvctructuyen.noip.gov.vn',
    notes: 'Áp dụng nguyên tắc "First to File" (Nộp đơn đầu tiên). Doanh nghiệp nên nộp đơn sớm nhất có thể ngay khi có kế hoạch ra mắt sản phẩm.',
  },
];

async function ensureProceduresSeeded() {
  const count = await (prisma as any).adminProcedureGuide.count();
  if (count >= 3) return;

  for (const item of SEED_PROCEDURES) {
    await (prisma as any).adminProcedureGuide.upsert({
      where: { code: item.code },
      create: item as any,
      update: item as any,
    });
  }
}

/**
 * GET /api/procedures/list — Get all administrative procedure guides
 */
/**
 * GET /api/procedures/categories — List category taxonomy (single source of truth,
 * avoids the frontend keeping its own hand-copied, driftable category list).
 */
procedureRouter.get('/categories', async (_req: Request, res: Response) => {
  return res.json(PROCEDURE_CATEGORIES);
});

procedureRouter.get('/list', async (req: Request, res: Response) => {
  try {
    await ensureProceduresSeeded();

    const category = req.query.category as string | undefined;
    const search = req.query.search as string | undefined;

    const where: any = {};
    if (category && category !== 'ALL') {
      where.category = category;
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { authority: { contains: search, mode: 'insensitive' } },
      ];
    }

    const items = await (prisma as any).adminProcedureGuide.findMany({
      where,
      orderBy: { code: 'asc' },
    });

    return res.json({ items, count: items.length });
  } catch (err) {
    console.error('[Procedure Router] Error fetching procedures:', err);
    return res.status(500).json({ error: 'Failed to fetch procedure guides' });
  }
});

/**
 * GET /api/procedures/:id — Get details of a specific procedure
 */
procedureRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const item = await (prisma as any).adminProcedureGuide.findFirst({
      where: {
        OR: [{ id }, { code: id }],
      },
    });

    if (!item) {
      return res.status(404).json({ error: 'Procedure not found' });
    }

    return res.json(item);
  } catch (err) {
    console.error('[Procedure Router] Error fetching detail:', err);
    return res.status(500).json({ error: 'Failed to fetch procedure detail' });
  }
});
