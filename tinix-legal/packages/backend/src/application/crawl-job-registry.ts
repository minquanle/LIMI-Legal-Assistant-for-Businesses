/**
 * Catalogue of incrementally-updatable crawl sources. `key` doubles as the
 * crawler's JOB_DATASET (packages/crawler/src/jobs/run-update-job.ts) — keep
 * the two in sync when adding a dataset. Rows are seeded into `crawl_jobs`
 * on first boot with these defaults; after that the DB row (edited from the
 * admin UI) is the source of truth for schedule/enabled/limits.
 */
export interface CrawlJobDefinition {
  key: string;
  name: string;
  description: string;
  groupName: 'Văn bản pháp luật' | 'Doanh nghiệp' | 'Biểu mẫu & thuật ngữ' | 'Công cụ tra cứu';
  defaultSchedule: string;
  defaultMaxNewUrls: number;
  /** ReferenceLookup datasetKey new rows are appended to after a successful run. */
  importTarget?: 'tax-registry' | 'admin-unit' | 'land-price';
}

const TOOLS: Array<[string, string, string, CrawlJobDefinition['importTarget']?]> = [
  ['danh-muc-dung-chung', 'Danh mục dùng chung (tài chính)', 'Bộ mã dùng chung ngành Tài chính: mục lục ngân sách, mã HS...'],
  ['co-so-luu-tru', 'Cơ sở lưu trú du lịch', 'Khách sạn, nhà nghỉ, homestay theo tỉnh và hạng sao'],
  ['doanh-nghiep-lu-hanh', 'Doanh nghiệp lữ hành', 'Danh sách doanh nghiệp có giấy phép lữ hành'],
  ['mua-sam-cong', 'Mua sắm công', 'Thông báo mời thầu, đấu thầu'],
  ['tai-khoan-ke-toan', 'Tài khoản kế toán', 'Hệ thống tài khoản kế toán theo Thông tư 99/2025'],
  ['muc-phat-nghi-dinh', 'Mức phạt theo nghị định', 'Bảng mức phạt vi phạm hành chính theo nghị định'],
  ['muc-phat-giao-thong', 'Mức phạt giao thông', 'Bảng mức phạt vi phạm giao thông'],
  ['gia-dat', 'Giá đất (cấp tỉnh)', 'Bảng giá đất theo tỉnh, thành phố', 'land-price'],
  ['gia-dat-duong', 'Giá đất theo tuyến đường', 'Giá đất theo tuyến đường và vị trí VT1-VT5', 'land-price'],
  ['don-vi-hanh-chinh', 'Đơn vị hành chính hiện hành', 'Tỉnh, xã, phường sau sắp xếp và đơn vị cũ hợp thành', 'admin-unit'],
  ['don-vi-hanh-chinh-cu', 'Đơn vị hành chính cũ', 'Đơn vị cấp huyện cũ trước sáp nhập', 'admin-unit'],
  ['le-phi-truoc-ba', 'Lệ phí trước bạ', 'Bảng giá tính lệ phí trước bạ ô tô, xe máy'],
  ['cong-ty-niem-yet', 'Công ty niêm yết', 'Doanh nghiệp trên HOSE, HNX, UPCoM'],
  ['van-phong-cong-chung', 'Văn phòng công chứng', 'Tổ chức hành nghề công chứng theo tỉnh'],
];

export const CRAWL_JOB_DEFINITIONS: CrawlJobDefinition[] = [
  {
    key: 'van-ban',
    name: 'Văn bản pháp luật mới',
    description: 'Văn bản pháp luật mới đăng trên dulieuphapluat.vn (luật, nghị định, thông tư, quyết định...).',
    groupName: 'Văn bản pháp luật',
    defaultSchedule: '0 3 * * *',
    defaultMaxNewUrls: 20000,
  },
  {
    key: 'tax-registry',
    name: 'Mã số thuế doanh nghiệp mới',
    description: 'Doanh nghiệp mới đăng ký; tự động nạp vào công cụ Tra cứu mã số thuế.',
    groupName: 'Doanh nghiệp',
    defaultSchedule: '0 1 * * *',
    defaultMaxNewUrls: 10000, // ~5.5h at the crawler's 30 req/min
    importTarget: 'tax-registry',
  },
  {
    key: 'form-templates',
    name: 'Biểu mẫu mới',
    description: 'Biểu mẫu, mẫu đơn, mẫu hợp đồng mới.',
    groupName: 'Biểu mẫu & thuật ngữ',
    defaultSchedule: '30 4 * * 1',
    defaultMaxNewUrls: 5000,
  },
  {
    key: 'legal-terms',
    name: 'Thuật ngữ pháp lý mới',
    description: 'Thuật ngữ, định nghĩa pháp lý mới bổ sung.',
    groupName: 'Biểu mẫu & thuật ngữ',
    defaultSchedule: '45 4 * * 1',
    defaultMaxNewUrls: 5000,
  },
  {
    key: 'so-tay-ke-toan',
    name: 'Sổ tay kế toán',
    description: 'Bài viết mới trong sổ tay kế toán, cẩm nang nghiệp vụ thuế.',
    groupName: 'Biểu mẫu & thuật ngữ',
    defaultSchedule: '55 4 * * 1',
    defaultMaxNewUrls: 500,
  },
  ...TOOLS.map(([key, name, description, importTarget], i): CrawlJobDefinition => ({
    key,
    name,
    description,
    groupName: 'Công cụ tra cứu',
    // Weekly on Tuesday, staggered 10 minutes apart so runs don't stack up.
    defaultSchedule: `${(i * 10) % 60} ${5 + Math.floor((i * 10) / 60)} * * 2`,
    defaultMaxNewUrls: 5000,
    importTarget,
  })),
];
