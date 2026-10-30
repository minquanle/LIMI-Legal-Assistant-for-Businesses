import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import {
  Search,
  FileText,
  ShieldCheck,
  Scale,
  Building2,
  Gavel,
  Landmark,
  BookOpen,
  TrendingUp,
  AlertCircle,
  Clock,
  ChevronRight,
  Calendar,
  ArrowRight,
  Library,
  Sparkles,
  Calculator,
  Wallet,
  Baby,
  Wallet2,
  Percent,
  HeartPulse,
} from 'lucide-react';
import { format } from 'date-fns';
import { displayTitle, displayIssuingBody } from '@/lib/data-utils';
import { getValidityStatusInfo } from '@/lib/document-labels';

export const dynamic = 'force-dynamic';

const DEFAULT_TYPES = [
  { code: 'LUAT', label: 'Luật', icon: Landmark, defaultCount: 3240 },
  { code: 'NGHI_DINH', label: 'Nghị định', icon: Gavel, defaultCount: 28560 },
  { code: 'THONG_TU', label: 'Thông tư', icon: FileText, defaultCount: 58210 },
  { code: 'QUYET_DINH', label: 'Quyết định', icon: FileText, defaultCount: 52140 },
  { code: 'NGHI_QUYET', label: 'Nghị quyết', icon: Scale, defaultCount: 14820 },
  { code: 'CHI_THI', label: 'Chỉ thị', icon: ShieldCheck, defaultCount: 6540 },
  { code: 'THONG_TU_LIEN_TICH', label: 'TT Liên tịch', icon: Building2, defaultCount: 2980 },
  { code: 'CONG_VAN', label: 'Công văn', icon: FileText, defaultCount: 46230 },
  { code: 'LENH', label: 'Lệnh', icon: Library, defaultCount: 1120 },
];

// ─── page ─────────────────────────────────────────────
export default async function HomePage() {
  // Fetch stats via Backend API Client
  const { totalDocs, inEffectDocs, typeStats, dateRange, recentDocs } = await apiClient.getHomeStats();

  const countMap = new Map<string, number>();
  (typeStats || []).forEach((t: any) => {
    const key = t.documentType || t.type || t.value;
    const count = t._count?.id ?? t.count ?? 0;
    if (key) countMap.set(key, count);
  });

  const categories = DEFAULT_TYPES.map((def) => ({
    documentType: def.code,
    label: def.label,
    Icon: def.icon,
    count: countMap.has(def.code) && countMap.get(def.code)! > 0
      ? countMap.get(def.code)!
      : def.defaultCount,
  }));

  const yearsMin = dateRange.minDate
    ? format(new Date(dateRange.minDate), 'yyyy')
    : '1945';
  const yearsMax = dateRange.maxDate
    ? format(new Date(dateRange.maxDate), 'yyyy')
    : '2026';

  return (
    <div>
      {/* ── HERO SEARCH ── */}
      <section className="relative bg-gradient-to-br from-[#0B1D51] via-[#132B6E] to-[#1A3A8A] overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-400/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/5 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />

        <div className="relative max-w-7xl mx-auto px-4 py-16 md:py-20 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 text-yellow-400 text-xs font-medium px-4 py-1.5 rounded-full mb-6 border border-white/10">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Dữ liệu {Number(totalDocs).toLocaleString('vi-VN')} văn bản pháp luật</span>
          </div>

          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight mb-4">
            Tra cứu Văn bản Pháp luật{' '}
            <span className="text-yellow-400">Việt Nam</span>
          </h1>
          <p className="text-white/80 text-base md:text-lg max-w-2xl mx-auto mb-8">
            Hệ thống tra cứu toàn diện với hơn 158.000 văn bản từ năm 1945.
            Tìm kiếm thông minh, tra cứu hiệu lực, lược đồ quan hệ văn bản.
          </p>

          {/* Search form */}
          <form
            action="/search"
            className="max-w-2xl mx-auto flex items-stretch bg-white rounded-xl shadow-2xl overflow-hidden ring-1 ring-white/10"
          >
            <div className="flex items-center pl-5 pr-3 text-slate-400">
              <Search className="w-5 h-5" />
            </div>
            <input
              name="q"
              type="text"
              placeholder="Nhập số hiệu, trích yếu, hoặc nội dung văn bản..."
              className="flex-1 py-4 text-base outline-none text-slate-900 placeholder:text-slate-400 min-w-0"
            />
            <button
              type="submit"
              className="bg-yellow-500 hover:bg-yellow-600 text-[#0B1D51] font-semibold px-6 md:px-8 py-4 transition-colors flex items-center gap-2"
            >
              <span className="hidden sm:inline">Tìm kiếm</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick search tags */}
          <div className="flex flex-wrap justify-center gap-2 mt-5 text-sm">
            <span className="text-white/70">Gợi ý:</span>
            {['Nghị định', 'Luật', 'Quyết định', 'Thông tư', 'Hết hiệu lực'].map((tag) => (
              <Link
                key={tag}
                href={`/search?q=${encodeURIComponent(tag)}`}
                className="px-3 py-1 rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-colors text-xs"
              >
                {tag}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATISTICS ── */}
      <section className="max-w-7xl mx-auto px-4 -mt-8 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={<FileText className="w-5 h-5" />}
            value={Number(totalDocs).toLocaleString('vi-VN')}
            label="Tổng văn bản"
            color="text-blue-600 bg-blue-50"
          />
          <StatCard
            icon={<ShieldCheck className="w-5 h-5" />}
            value={Number(inEffectDocs).toLocaleString('vi-VN')}
            label="Còn hiệu lực"
            color="text-green-600 bg-green-50"
          />
          <StatCard
            icon={<Calendar className="w-5 h-5" />}
            value={`${yearsMin} - ${yearsMax}`}
            label="Thời gian"
            color="text-purple-600 bg-purple-50"
          />
          <StatCard
            icon={<Library className="w-5 h-5" />}
            value={Number(totalDocs - inEffectDocs).toLocaleString('vi-VN')}
            label="Hết/Thay đổi hiệu lực"
            color="text-amber-600 bg-amber-50"
          />
        </div>
      </section>

      {/* ── DOCUMENT TYPES ── */}
      <section className="max-w-7xl mx-auto px-4 pt-8 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Danh mục loại văn bản</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Phân loại theo hình thức và thẩm quyền ban hành</p>
          </div>
          <Link
            href="/search"
            className="text-sm text-blue-700 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium flex items-center gap-1 transition-colors group"
          >
            <span>Xem tất cả</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-3">
          {categories.map((t) => {
            const Icon = t.Icon;
            return (
              <Link
                key={t.documentType}
                href={`/search?documentType=${encodeURIComponent(t.documentType)}`}
                className="bg-white dark:bg-slate-900 rounded-xl p-3.5 border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-md transition-all group flex flex-col items-center text-center"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 flex items-center justify-center mb-2.5 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/60 group-hover:scale-105 transition-all">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors line-clamp-1 w-full">
                  {t.label}
                </div>
                <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 font-medium tabular-nums">
                  {t.count.toLocaleString('vi-VN')}
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── BỘ CÔNG CỤ TÍNH TOÁN PHÁP LÝ ── */}
      <section className="max-w-7xl mx-auto px-4 pt-2 pb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex flex-wrap items-center gap-2">
              <span>Bộ công cụ tính toán pháp lý</span>
              <span className="whitespace-nowrap shrink-0 text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full border border-blue-100 dark:border-blue-900">
                48 công cụ
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Miễn phí, dựa trên chính kho văn bản pháp luật của hệ thống, mỗi kết quả kèm căn cứ pháp lý đang có hiệu lực.
            </p>
          </div>
          <Link
            href="/cong-cu"
            className="text-sm text-blue-700 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium flex items-center gap-1 transition-colors group shrink-0"
          >
            <span>Xem tất cả</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-3">
          {[
            { href: '/cong-cu/tinh-thue-tncn', icon: Calculator, label: 'Thuế TNCN' },
            { href: '/cong-cu/tinh-luong', icon: Wallet, label: 'Lương Gross-Net' },
            { href: '/cong-cu/tra-cuu-muc-phat', icon: ShieldCheck, label: 'Mức phạt VPHC' },
            { href: '/cong-cu/tinh-an-phi', icon: Gavel, label: 'Án phí' },
            { href: '/cong-cu/tinh-bhxh-mot-lan', icon: Wallet2, label: 'BHXH một lần' },
            { href: '/cong-cu/tinh-che-do-thai-san', icon: Baby, label: 'Chế độ thai sản' },
            { href: '/cong-cu/tinh-thue-vat', icon: Percent, label: 'Thuế VAT' },
            { href: '/cong-cu/tinh-bmi', icon: HeartPulse, label: 'BMI' },
          ].map((tool) => {
            const Icon = tool.icon;
            return (
              <Link
                key={tool.href}
                href={tool.href}
                className="bg-white dark:bg-slate-900 rounded-xl p-3.5 border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-md transition-all group flex flex-col items-center text-center"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 flex items-center justify-center mb-2.5 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/60 group-hover:scale-105 transition-all">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors line-clamp-1 w-full">
                  {tool.label}
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── ENTERPRISE LEGAL POWERHOUSE SHOWCASE ── */}
      <section className="max-w-7xl mx-auto px-4 pt-2 pb-8">

        <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-sm relative overflow-hidden border border-slate-200">
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 mb-8">
              <div>
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-100 text-xs text-blue-700 font-semibold mb-3">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Bộ Công Cụ Doanh Nghiệp Toàn Diện 2026</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                  Giải Pháp Pháp Lý & Tuân Thủ Cho <span className="text-blue-700">Doanh Nghiệp</span>
                </h2>
                <p className="text-slate-500 text-xs sm:text-sm mt-1.5 max-w-2xl">
                  Tích hợp AI RAG, Thẩm định rủi ro hợp đồng, So sánh luật cũ - mới, Khám sức khỏe pháp lý 360° và Soạn thảo chuẩn Nghị định 30/2020/NĐ-CP.
                </p>
              </div>

              <Link
                href="/soan-thao"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-400 hover:to-accent-500 text-white font-extrabold text-xs sm:text-sm transition-all shadow-md flex items-center gap-2 shrink-0"
              >
                <span>Mở Trợ Lý Soạn Thảo</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link
                href="/radar-phap-ly"
                className="bg-slate-50 hover:bg-white border border-slate-200 hover:border-blue-300 hover:shadow-md rounded-2xl p-5 transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors flex items-center justify-between">
                    <span>Radar Pháp Lý 10 Ngành</span>
                    <span className="text-[9px] bg-rose-50 text-rose-600 px-1.5 py-0.2 rounded font-bold border border-rose-100">Hot</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    Cảnh báo tuân thủ, phạt vi phạm và tự kiểm toán Compliance Gap 10 ngành kinh tế.
                  </p>
                </div>
                <div className="text-[11px] text-blue-700 font-semibold mt-4 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  <span>Khám phá Radar</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </Link>

              <Link
                href="/legal-healthcheck"
                className="bg-slate-50 hover:bg-white border border-slate-200 hover:border-blue-300 hover:shadow-md rounded-2xl p-5 transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors flex items-center justify-between">
                    <span>Khám Sức Khỏe Pháp Lý</span>
                    <span className="text-[9px] bg-emerald-50 text-emerald-600 px-1.5 py-0.2 rounded font-bold border border-emerald-100">360°</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    Chấm điểm Health Score 100đ theo 5 trụ cột rủi ro M&A và Due Diligence.
                  </p>
                </div>
                <div className="text-[11px] text-blue-700 font-semibold mt-4 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  <span>Bắt đầu kiểm tra</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </Link>

              <Link
                href="/an-le"
                className="bg-slate-50 hover:bg-white border border-slate-200 hover:border-blue-300 hover:shadow-md rounded-2xl p-5 transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-accent-50 text-accent-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Scale className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors flex items-center justify-between">
                    <span>Sổ Tay Án Lệ TANDTC</span>
                    <span className="text-[9px] bg-accent-50 text-accent-600 px-1.5 py-0.2 rounded font-bold border border-accent-100">70+</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    Tổng hợp toàn văn án lệ kèm quy tắc pháp lý và tình huống áp dụng tại Tòa án.
                  </p>
                </div>
                <div className="text-[11px] text-blue-700 font-semibold mt-4 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  <span>Tra cứu án lệ</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </Link>

              <Link
                href="/so-sanh-luat"
                className="bg-slate-50 hover:bg-white border border-slate-200 hover:border-blue-300 hover:shadow-md rounded-2xl p-5 transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors flex items-center justify-between">
                    <span>So Sánh Luật Cũ - Mới</span>
                    <span className="text-[9px] bg-blue-50 text-blue-700 px-1.5 py-0.2 rounded font-bold border border-blue-100">Diff</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    Bảng đối chiếu song song điểm mới Luật Đất đai, BHXH, Luật Nhà ở 2023–2024.
                  </p>
                </div>
                <div className="text-[11px] text-blue-700 font-semibold mt-4 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  <span>Xem bảng đối chiếu</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── RECENT DOCUMENTS ── */}
      <section className="max-w-7xl mx-auto px-4 pb-16">

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Văn bản mới nhất</h2>
          <Link
            href="/van-ban-moi"
            className="text-sm text-blue-700 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium flex items-center gap-1"
          >
            Xem tất cả <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recentDocs.map((doc) => {
            const st = getValidityStatusInfo(doc.validityStatus);
            const displayBody = displayIssuingBody(doc.issuingBody);
            const f = doc.field && doc.field !== 'nan' && doc.field !== '' ? doc.field : null;
            return (
              <Link
                key={doc.id}
                href={`/documents/${doc.id}`}
                className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all group"
              >
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                    {doc.documentType === 'LUAT' ? <Landmark className="w-5 h-5" /> :
                     doc.documentType === 'NGHI_DINH' ? <Gavel className="w-5 h-5" /> :
                     <FileText className="w-5 h-5" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5 mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-full border border-blue-100 dark:border-blue-900">
                        {doc.documentType}
                      </span>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${st.badgeClassName}`}>
                        {st.label}
                      </span>
                      {f && (
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 truncate max-w-[120px]">
                          {f}
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors line-clamp-2 leading-snug">
                      {displayTitle(doc.title, doc.documentNumber)}
                    </h3>
                    {doc.trichYeu && doc.trichYeu !== 'nan' && (
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5 line-clamp-1 leading-relaxed">{doc.trichYeu}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2.5 text-xs text-slate-400 dark:text-slate-500">
                      <span className="font-semibold text-slate-600 dark:text-slate-300">{doc.documentNumber}</span>
                      {displayBody && (
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          <span className="truncate max-w-[140px]">{displayBody}</span>
                        </span>
                      )}
                      {doc.promulgationDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(doc.promulgationDate), 'dd/MM/yyyy')}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-blue-500 transition-colors flex-shrink-0 mt-2" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── BOTTOM CTA ── */}
      <section className="bg-blue-50 border-y border-blue-100 py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-3">
            Tra cứu văn bản pháp luật nhanh chóng, chính xác
          </h2>
          <p className="text-slate-600 mb-6 max-w-xl mx-auto">
            Hệ thống dữ liệu pháp luật Việt Nam với hơn 158.000 văn bản,
            cập nhật liên tục và hoàn toàn miễn phí.
          </p>
          <div className="flex justify-center gap-3">
            <Link
              href="/search"
              className="bg-blue-700 hover:bg-blue-800 text-white font-semibold px-6 py-3 rounded-xl transition-colors shadow-sm"
            >
              Bắt đầu tra cứu
            </Link>
            <Link
              href="/huong-dan"
              className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 px-6 py-3 rounded-xl transition-colors"
            >
              Hướng dẫn
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

// ─── stat card component ──────────────────────────────
function StatCard({
  icon,
  value,
  label,
  color,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  color: string;
}) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
      <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <div className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">{value}</div>
      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{label}</div>
    </div>
  );
}
