import React from 'react';
import Link from 'next/link';
import { Calculator, Wallet, ShieldAlert, FileText, Percent, Gavel, Landmark, PiggyBank, HeartPulse, Clock, Users, UserX, AlertCircle, Stamp, GraduationCap, Car, TrendingUp, Beer, Briefcase, Receipt, Building2, UserRoundX, Home, BriefcaseBusiness, Building, ScrollText, HeartHandshake, FileCheck, Map, MapPin, CalendarClock, Sprout, Route, ShieldCheck, Hourglass, IdCard, HardHat, LineChart, LogOut, UserCheck, CalendarDays, Baby, Gift, PieChart, Wrench, Globe, Wallet2 } from 'lucide-react';

interface ToolCard {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  badge?: 'Mới' | 'Hot';
}

const QUICK_LINKS = [
  { href: '/cong-cu/tinh-luong', label: 'Tính lương' },
  { href: '/cong-cu/tinh-thue-tncn', label: 'Tính thuế TNCN' },
  { href: '/cong-cu/tra-cuu-muc-phat', label: 'Tra cứu mức phạt' },
  { href: '/cong-cu/tinh-bmi', label: 'Tính BMI' },
];

const CATEGORIES: { name: string; tools: ToolCard[] }[] = [
  {
    name: 'Thuế & kế toán',
    tools: [
      {
        href: '/cong-cu/tinh-thue-tncn',
        icon: <Calculator className="w-5 h-5" />,
        title: 'Tính thuế TNCN',
        description: 'Thuế thu nhập cá nhân theo biểu lũy tiến 7 bậc, có giảm trừ gia cảnh.',
      },
      {
        href: '/cong-cu/tinh-thue-vat',
        icon: <Percent className="w-5 h-5" />,
        title: 'Tính thuế VAT',
        description: 'Tính thuế GTGT từ giá chưa thuế hoặc bóc ngược từ giá đã có thuế.',
      },
      {
        href: '/cong-cu/tinh-thue-ttdb',
        icon: <Beer className="w-5 h-5" />,
        title: 'Tính thuế tiêu thụ đặc biệt',
        description: 'Bia, rượu, xăng, điều hòa, ô tô theo Luật Thuế TTĐB số 66/2025/QH15, hiệu lực 01/01/2026.',
        badge: 'Mới',
      },
      {
        href: '/cong-cu/tinh-cham-nop-thue',
        icon: <Receipt className="w-5 h-5" />,
        title: 'Tính tiền chậm nộp thuế',
        description: 'Mức 0,03%/ngày trên số tiền thuế chậm nộp, Điều 59 Luật Quản lý thuế 2019.',
      },
      {
        href: '/cong-cu/tinh-thue-chuyen-nhuong-chung-khoan',
        icon: <LineChart className="w-5 h-5" />,
        title: 'Tính thuế chuyển nhượng chứng khoán, vốn góp',
        description: '0,1% trên giá bán (chứng khoán) hoặc 20% trên lãi ròng (vốn góp TNHH).',
      },
      {
        href: '/cong-cu/tinh-thue-nha-thau-nuoc-ngoai',
        icon: <Globe className="w-5 h-5" />,
        title: 'Tính thuế nhà thầu nước ngoài',
        description: 'Quy đổi hợp đồng NET, thuế suất ấn định theo ngành, Thông tư 103/2014/TT-BTC.',
      },
      {
        href: '/cong-cu/tinh-tran-lai-vay-ebitda',
        icon: <PieChart className="w-5 h-5" />,
        title: 'Tính trần lãi vay theo EBITDA',
        description: 'Trần 30% EBITDA cho DN có giao dịch liên kết, Nghị định 132/2020 sửa đổi 2025.',
      },
      {
        href: '/cong-cu/tinh-thue-tndn',
        icon: <Building2 className="w-5 h-5" />,
        title: 'Tính thuế thu nhập doanh nghiệp',
        description: 'Thuế suất phổ thông và ưu đãi DNVVN theo doanh thu, Luật số 67/2025/QH15.',
        badge: 'Mới',
      },
      {
        href: '/cong-cu/tinh-thue-tncn-khong-cu-tru',
        icon: <UserRoundX className="w-5 h-5" />,
        title: 'Tính thuế TNCN cá nhân không cư trú',
        description: 'Thuế suất cố định theo từng loại thu nhập, không áp dụng biểu lũy tiến.',
      },
    ],
  },
  {
    name: 'Lao động & BHXH',
    tools: [
      {
        href: '/cong-cu/tinh-luong',
        icon: <Wallet className="w-5 h-5" />,
        title: 'Tính lương Gross ↔ Net',
        description: 'Đổi lương Gross sang Net hoặc ngược lại, tách rõ bảo hiểm bắt buộc và thuế TNCN.',
      },
      {
        href: '/cong-cu/tinh-luong-ot',
        icon: <Clock className="w-5 h-5" />,
        title: 'Tính tiền làm thêm giờ (OT)',
        description: 'Tăng ca 150%, 200%, 300%, cộng thêm ban đêm theo Điều 98 BLLĐ 2019.',
      },
      {
        href: '/cong-cu/tinh-luong-huu',
        icon: <Users className="w-5 h-5" />,
        title: 'Tính lương hưu & tra tuổi nghỉ hưu',
        description: 'Tuổi nghỉ hưu theo lộ trình và mức lương hưu hằng tháng.',
      },
      {
        href: '/cong-cu/tinh-tro-cap-that-nghiep',
        icon: <UserX className="w-5 h-5" />,
        title: 'Tính trợ cấp thất nghiệp',
        description: 'Mức đóng và mức hưởng bảo hiểm thất nghiệp theo lương và địa bàn làm việc.',
      },
      {
        href: '/cong-cu/tinh-tro-cap-thoi-viec',
        icon: <Briefcase className="w-5 h-5" />,
        title: 'Tính trợ cấp thôi việc',
        description: 'Nửa tháng lương mỗi năm làm việc, theo Điều 46 Bộ luật Lao động 2019.',
      },
      {
        href: '/cong-cu/tinh-tro-cap-mat-viec-lam',
        icon: <BriefcaseBusiness className="w-5 h-5" />,
        title: 'Tính trợ cấp mất việc làm',
        description: 'Mỗi năm 1 tháng lương, tối thiểu 2 tháng, khi mất việc do cơ cấu/sáp nhập (Điều 47 BLLĐ 2019).',
      },
      {
        href: '/cong-cu/tinh-bhxh-tu-nguyen',
        icon: <ShieldCheck className="w-5 h-5" />,
        title: 'Tính bảo hiểm xã hội tự nguyện',
        description: 'Mức đóng 22% thu nhập tự chọn, trừ hỗ trợ Nhà nước, Nghị định 159/2025/NĐ-CP.',
        badge: 'Mới',
      },
      {
        href: '/cong-cu/tinh-bhxh-mot-lan',
        icon: <Wallet2 className="w-5 h-5" />,
        title: 'Tính bảo hiểm xã hội một lần',
        description: '1,5 tháng/năm (trước 2014), 2 tháng/năm (từ 2014), Điều 70 Luật BHXH 2024.',
      },
      {
        href: '/cong-cu/tinh-thoi-han-bao-truoc-cham-dut-hdld',
        icon: <LogOut className="w-5 h-5" />,
        title: 'Tính thời hạn báo trước chấm dứt HĐLĐ',
        description: '45/30/3 ngày theo loại hợp đồng, Điều 35/36 Bộ luật Lao động 2019.',
      },
      {
        href: '/cong-cu/tinh-thoi-gian-thu-viec',
        icon: <UserCheck className="w-5 h-5" />,
        title: 'Tính thời gian thử việc và lương thử việc',
        description: 'Tối đa 6-180 ngày theo vị trí; lương tối thiểu 85%, Điều 25/26 BLLĐ 2019.',
      },
      {
        href: '/cong-cu/tinh-ngay-nghi-phep-nam',
        icon: <CalendarDays className="w-5 h-5" />,
        title: 'Tính ngày nghỉ phép năm',
        description: '12-16 ngày theo điều kiện lao động, cộng thâm niên, Điều 113/114 BLLĐ 2019.',
      },
      {
        href: '/cong-cu/tinh-che-do-thai-san',
        icon: <Baby className="w-5 h-5" />,
        title: 'Tính chế độ thai sản khi sinh con',
        description: 'Nghỉ 6 tháng, hưởng 100% lương, trợ cấp một lần, Luật BHXH 2024.',
      },
    ],
  },
  {
    name: 'Tài chính',
    tools: [
      {
        href: '/cong-cu/tinh-lai-vay',
        icon: <Landmark className="w-5 h-5" />,
        title: 'Tính lãi vay',
        description: 'Lịch trả nợ theo dư nợ giảm dần hoặc dư nợ ban đầu.',
      },
      {
        href: '/cong-cu/tinh-lai-suat-tiet-kiem',
        icon: <PiggyBank className="w-5 h-5" />,
        title: 'Tính lãi suất tiết kiệm',
        description: '4 hình thức lĩnh lãi: cuối kỳ, đầu kỳ, hàng tháng, không kỳ hạn.',
      },
      {
        href: '/cong-cu/tinh-hieu-qua-dau-tu',
        icon: <TrendingUp className="w-5 h-5" />,
        title: 'Tính hiệu quả dự án đầu tư',
        description: 'NPV, IRR và thời gian hoàn vốn từ dòng tiền dự án theo từng năm.',
      },
    ],
  },
  {
    name: 'Giao thông',
    tools: [
      {
        href: '/cong-cu/tinh-le-phi-truoc-ba',
        icon: <Car className="w-5 h-5" />,
        title: 'Tính lệ phí trước bạ ô tô, xe máy',
        description: 'Mức thu theo loại xe và lần đăng ký, Nghị định 10/2022/NĐ-CP sửa đổi bởi NĐ 175/2025/NĐ-CP.',
        badge: 'Mới',
      },
      {
        href: '/cong-cu/tinh-phi-su-dung-duong-bo',
        icon: <Route className="w-5 h-5" />,
        title: 'Tính phí sử dụng đường bộ',
        description: 'Ô tô con dưới 10 chỗ, thu theo chu kỳ đăng kiểm, Nghị định 364/2025/NĐ-CP.',
        badge: 'Mới',
      },
      {
        href: '/cong-cu/tinh-chu-ky-dang-kiem',
        icon: <Wrench className="w-5 h-5" />,
        title: 'Tính chu kỳ đăng kiểm và niên hạn sử dụng xe',
        description: '6-36 tháng theo tuổi xe; niên hạn tối đa 20-25 năm, Thông tư 47/2024/TT-BGTVT.',
      },
    ],
  },
  {
    name: 'Đất đai & Xây dựng',
    tools: [
      {
        href: '/cong-cu/tinh-le-phi-truoc-ba-nha-dat',
        icon: <Home className="w-5 h-5" />,
        title: 'Tính lệ phí trước bạ nhà, đất',
        description: 'Mức 0,5% trên giá trị cao hơn giữa bảng giá đất và giá hợp đồng chuyển nhượng.',
      },
      {
        href: '/cong-cu/tinh-thue-su-dung-dat-phi-nong-nghiep',
        icon: <Map className="w-5 h-5" />,
        title: 'Tính thuế sử dụng đất phi nông nghiệp',
        description: 'Thuế suất lũy tiến theo hạn mức đất ở, Luật số 48/2010/QH12.',
      },
      {
        href: '/cong-cu/tinh-thoi-han-bao-hanh-cong-trinh',
        icon: <HardHat className="w-5 h-5" />,
        title: 'Tính thời hạn bảo hành công trình, nhà ở',
        description: 'Từ 12 tháng (công trình) đến 60 tháng (nhà chung cư), Nghị định 06/2021/NĐ-CP.',
      },
      {
        href: '/cong-cu/tinh-thue-tang-cho-nha-dat',
        icon: <Gift className="w-5 h-5" />,
        title: 'Tính thuế nhận tặng cho nhà đất',
        description: 'Mức 10% trên phần giá trị vượt 10 triệu đồng, miễn giữa người thân trực hệ.',
      },
      {
        href: '/cong-cu/tra-cuu-gia-dat-duong',
        icon: <Map className="w-5 h-5" />,
        title: 'Tra cứu giá đất theo tuyến đường',
        description: 'Giá đất theo tuyến đường và vị trí (VT1-VT5) theo bảng giá đất từng tỉnh, thành phố.',
        badge: 'Mới',
      },
    ],
  },
  {
    name: 'Dân sự',
    tools: [
      {
        href: '/cong-cu/tinh-an-phi',
        icon: <Gavel className="w-5 h-5" />,
        title: 'Tính án phí',
        description: 'Án phí dân sự sơ thẩm theo giá trị tranh chấp, Nghị quyết 326/2016/UBTVQH14.',
      },
      {
        href: '/cong-cu/tinh-an-phi-phuc-tham',
        icon: <Gavel className="w-5 h-5" />,
        title: 'Tính án phí phúc thẩm',
        description: 'Mức cố định theo loại tranh chấp, không tính theo giá ngạch, Nghị quyết 326/2016/UBTVQH14.',
      },
      {
        href: '/cong-cu/tinh-lai-cham-tra',
        icon: <AlertCircle className="w-5 h-5" />,
        title: 'Tính lãi chậm trả',
        description: 'Tiền lãi phải trả khi chậm thanh toán nghĩa vụ tài chính, Điều 357/468 BLDS 2015.',
      },
      {
        href: '/cong-cu/tinh-phi-cong-chung',
        icon: <Stamp className="w-5 h-5" />,
        title: 'Tính phí công chứng',
        description: 'Phí công chứng hợp đồng, giao dịch theo giá trị tài sản, Thông tư 257/2016/TT-BTC.',
      },
      {
        href: '/cong-cu/tinh-thue-chuyen-nhuong-bds',
        icon: <Building className="w-5 h-5" />,
        title: 'Tính thuế TNCN chuyển nhượng bất động sản',
        description: 'Mức 2% trên giá chuyển nhượng, cá nhân cư trú, Điều 14 Luật Thuế TNCN.',
      },
      {
        href: '/cong-cu/tinh-phat-vi-pham-hop-dong',
        icon: <ScrollText className="w-5 h-5" />,
        title: 'Tính mức phạt vi phạm hợp đồng',
        description: 'Trần 8% (hợp đồng thương mại) hoặc không giới hạn (hợp đồng dân sự).',
      },
      {
        href: '/cong-cu/tinh-thoi-hieu-khoi-kien',
        icon: <Hourglass className="w-5 h-5" />,
        title: 'Tính thời hiệu khởi kiện dân sự',
        description: 'Hợp đồng, bồi thường thiệt hại, thừa kế, theo Điều 429/588/623 BLDS 2015.',
      },
    ],
  },
  {
    name: 'Hành chính',
    tools: [
      {
        href: '/cong-cu/tra-cuu-muc-phat',
        icon: <ShieldAlert className="w-5 h-5" />,
        title: 'Tra cứu mức phạt vi phạm hành chính',
        description: 'Mức phạt 6 lĩnh vực (giao thông, lao động, y tế, đất đai, xây dựng, môi trường), kèm căn cứ điều khoản.',
      },
      {
        href: '/cong-cu/tinh-le-phi-ho-chieu-can-cuoc',
        icon: <IdCard className="w-5 h-5" />,
        title: 'Tính lệ phí hộ chiếu, căn cước',
        description: 'Hộ chiếu Thông tư 28/2026/TT-BTC (đang giảm 50%); căn cước Thông tư 73/2024/TT-BTC.',
        badge: 'Mới',
      },
      {
        href: '/cong-cu/tra-cuu-don-vi-hanh-chinh',
        icon: <MapPin className="w-5 h-5" />,
        title: 'Tra cứu đơn vị hành chính',
        description: 'Tỉnh, xã, phường hiện hành và tra ngược đơn vị cấp huyện cũ nay thuộc đâu.',
        badge: 'Mới',
      },
    ],
  },
  {
    name: 'Doanh nghiệp',
    tools: [
      {
        href: '/cong-cu/tinh-le-phi-dang-ky-doanh-nghiep',
        icon: <FileCheck className="w-5 h-5" />,
        title: 'Tính lệ phí đăng ký doanh nghiệp',
        description: 'Miễn phí khi đăng ký qua mạng; 150.000đ nếu nộp trực tiếp, Thông tư 47/2019/TT-BTC.',
      },
      {
        href: '/cong-cu/tinh-han-gop-von',
        icon: <CalendarClock className="w-5 h-5" />,
        title: 'Tính thời hạn góp vốn thành lập doanh nghiệp',
        description: '90 ngày kể từ ngày cấp GCN đăng ký doanh nghiệp, Điều 47/75/113 Luật Doanh nghiệp 2020.',
      },
      {
        href: '/cong-cu/tra-cuu-ma-so-thue',
        icon: <Building2 className="w-5 h-5" />,
        title: 'Tra cứu mã số thuế doanh nghiệp',
        description: 'Mã số thuế, người đại diện và địa chỉ của doanh nghiệp.',
        badge: 'Mới',
      },
    ],
  },
  {
    name: 'Nông nghiệp',
    tools: [
      {
        href: '/cong-cu/kiem-tra-mien-thue-dat-nong-nghiep',
        icon: <Sprout className="w-5 h-5" />,
        title: 'Kiểm tra miễn thuế sử dụng đất nông nghiệp',
        description: 'Miễn toàn bộ đến hết 2030 cho hầu hết người sử dụng đất, Nghị quyết 216/2025/QH15.',
        badge: 'Mới',
      },
    ],
  },
  {
    name: 'Giáo dục',
    tools: [
      {
        href: '/cong-cu/tinh-diem-uu-tien',
        icon: <GraduationCap className="w-5 h-5" />,
        title: 'Tính điểm ưu tiên xét tuyển đại học',
        description: 'Ưu tiên khu vực, đối tượng và công thức giảm dần từ 22,50 điểm.',
      },
      {
        href: '/cong-cu/tinh-diem-gpa',
        icon: <GraduationCap className="w-5 h-5" />,
        title: 'Tính điểm trung bình tích lũy (GPA)',
        description: 'Quy đổi hệ 10 sang hệ 4 theo tín chỉ, xếp loại tốt nghiệp, Thông tư 56/2026/TT-BGDĐT.',
        badge: 'Mới',
      },
    ],
  },
  {
    name: 'Y tế',
    tools: [
      {
        href: '/cong-cu/tinh-bmi',
        icon: <HeartPulse className="w-5 h-5" />,
        title: 'Tính BMI',
        description: 'Đánh giá thừa cân, béo phì theo ngưỡng người châu Á (QĐ 2892/QĐ-BYT).',
      },
      {
        href: '/cong-cu/tinh-bhyt-ho-gia-dinh',
        icon: <HeartHandshake className="w-5 h-5" />,
        title: 'Tính bảo hiểm y tế hộ gia đình',
        description: 'Mức đóng giảm dần theo số thành viên tham gia, Nghị định 146/2018/NĐ-CP.',
      },
      {
        href: '/cong-cu/tinh-muc-huong-bhyt',
        icon: <HeartPulse className="w-5 h-5" />,
        title: 'Tính mức hưởng bảo hiểm y tế',
        description: 'Theo nhóm đối tượng và cấp chuyên môn kỹ thuật, Luật BHYT sửa đổi 2024.',
      },
    ],
  },
  {
    name: 'Biểu mẫu',
    tools: [
      {
        href: '/bieu-mau',
        icon: <FileText className="w-5 h-5" />,
        title: 'Biểu mẫu pháp lý',
        description: 'Đơn từ, hợp đồng soạn sẵn, chỉnh sửa trực tiếp trên trình duyệt và tải về Word.',
      },
    ],
  },
];

export default function CongCuPage() {
  const calculatorCategories = CATEGORIES.filter((cat) => cat.name !== 'Biểu mẫu');
  const toolCount = calculatorCategories.reduce((sum, cat) => sum + cat.tools.length, 0);
  const groupCount = calculatorCategories.length;

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
        Bộ công cụ tính toán pháp lý
      </h1>
      <p className="text-gray-600 dark:text-gray-300 mb-4">
        Công cụ tính toán miễn phí dựa trên chính kho văn bản pháp luật của hệ thống, mỗi
        kết quả đều dẫn kèm căn cứ pháp lý đang có hiệu lực.
      </p>

      <div className="flex flex-wrap items-center gap-3 mb-8 text-sm">
        <span className="font-bold text-blue-700 dark:text-blue-400">{toolCount} công cụ</span>
        <span className="text-gray-300 dark:text-gray-700">|</span>
        <span className="font-bold text-blue-700 dark:text-blue-400">{groupCount} nhóm</span>
        <span className="text-gray-300 dark:text-gray-700">|</span>
        <span className="text-gray-500 dark:text-gray-400">Xem nhiều:</span>
        {QUICK_LINKS.map((q) => (
          <Link
            key={q.href}
            href={q.href}
            className="px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 text-xs font-medium hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
          >
            {q.label}
          </Link>
        ))}
      </div>

      {CATEGORIES.map((cat) => (
        <div key={cat.name} className="mb-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3">
            {cat.name} <span className="text-gray-400 font-normal normal-case">({cat.tools.length})</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {cat.tools.map((tool) => (
              <Link
                key={tool.href}
                href={tool.href}
                className="flex items-start gap-3 p-5 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md transition-all"
              >
                <div className="p-2.5 rounded-xl bg-blue-600/10 text-blue-600 shrink-0">{tool.icon}</div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1 flex items-center gap-1.5">
                    <span>{tool.title}</span>
                    {tool.badge && (
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded border shrink-0 ${
                          tool.badge === 'Hot'
                            ? 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900'
                            : 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900'
                        }`}
                      >
                        {tool.badge}
                      </span>
                    )}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{tool.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
