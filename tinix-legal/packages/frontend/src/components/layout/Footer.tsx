import Link from 'next/link';
import {
  BookOpen,
  Mail,
  Search,
  FileText,
  TrendingUp,
  HelpCircle,
  MessageCircleQuestion,
  FileCheck2,
  FileEdit,
  Workflow,
  Sparkles,
  ShieldCheck,
  Cpu,
  Key,
  BarChart3,
  ScanText,
  Network,
  Scale,
  CheckCircle2,
  Shield,
  Layers,
  Clock,
  Bell,
} from 'lucide-react';




export function Footer() {
  return (
    <footer className="relative bg-gradient-to-b from-[#08163A] via-[#0B1D51] to-[#050E26] text-white/80 mt-auto border-t border-white/10 overflow-hidden">
      {/* Decorative top ambient glow */}
      <div className="absolute top-0 left-1/4 w-96 h-24 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-0 right-1/4 w-96 h-24 bg-yellow-400/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Banner: Quick Key Metrics */}
      <div className="border-b border-white/10 bg-white/[0.02] backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:py-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs sm:text-sm font-medium text-white/90">
              Cơ sở dữ liệu: <strong className="text-yellow-400 font-semibold">214.000+</strong> văn bản pháp luật từ 1945 – 2026
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-white/80">
              <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
              Trợ lý AI Copilot Pháp lý
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-white/80">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Nghị định 30/2020/NĐ-CP
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-white/80">
              <Cpu className="w-3.5 h-3.5 text-blue-400" />
              Hybrid Search & RAG
            </span>
          </div>
        </div>
      </div>

      {/* Main Footer Navigation (4 Balanced Columns) */}
      <div className="max-w-7xl mx-auto px-4 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 sm:gap-8">
          
          {/* Column 1: Brand & Info */}
          <div className="space-y-4 lg:pr-4">
            <Link href="/" className="inline-flex items-center gap-2.5 group">
              <div className="bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-xl p-2 shadow-md shadow-yellow-500/20 group-hover:scale-105 transition-transform">
                <BookOpen className="w-5 h-5 text-[#0B1D51]" />
              </div>
              <div>
                <span className="text-white font-bold text-sm leading-tight tracking-wide block">
                  HỆ THỐNG PHÁP LUẬT
                </span>
                <span className="text-yellow-400 text-xs font-semibold tracking-wider block">
                  VIỆT NAM · TINIX LEGAL
                </span>
              </div>
            </Link>

            <p className="text-xs sm:text-sm text-white/60 leading-relaxed">
              Cổng thông tin tra cứu văn bản pháp luật, hỏi đáp AI và trợ lý pháp chế doanh nghiệp thông minh hàng đầu Việt Nam.
            </p>

            <div className="pt-2 space-y-2 text-xs text-white/70">
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-yellow-400 shrink-0" />
                <a href="mailto:contact@tinix-legal.vn" className="hover:text-yellow-400 transition-colors">
                  contact@tinix-legal.vn
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Bảo mật dữ liệu & RBAC Enterprise</span>
              </div>
            </div>

            <div className="pt-3">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[11px] text-white/60">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Hệ thống AI: Hoạt động bình thường
              </div>
            </div>
          </div>

          {/* Column 2: Tra cứu & Tri thức Pháp luật */}
          <div>
            <h3 className="text-white font-semibold text-xs uppercase tracking-wider mb-4 pb-2 border-b border-white/10 flex items-center gap-2">
              <Scale className="w-4 h-4 text-yellow-400" />
              Tra cứu & Tri thức
            </h3>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              <li>
                <Link href="/search" className="text-white/60 hover:text-yellow-400 hover:translate-x-1 transition-all flex items-center gap-2">
                  <Search className="w-3.5 h-3.5 text-white/40" />
                  Tra cứu văn bản toàn văn
                </Link>
              </li>
              <li>
                <Link href="/radar-phap-ly" className="text-white/80 font-medium hover:text-yellow-400 hover:translate-x-1 transition-all flex items-center justify-between group">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                    Radar Cảnh báo Luật theo Ngành
                  </span>
                  <span className="text-[10px] bg-rose-500/20 text-rose-300 font-semibold px-2 py-0.5 rounded-full border border-rose-500/30">
                    Hot
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/canh-bao-luat-moi" className="text-white/80 font-medium hover:text-yellow-400 hover:translate-x-1 transition-all flex items-center justify-between group">
                  <span className="flex items-center gap-2">
                    <Bell className="w-3.5 h-3.5 text-rose-400" />
                    Cảnh Báo & Nhắc Hạn Luật Mới
                  </span>
                  <span className="text-[10px] bg-rose-500/20 text-rose-300 font-semibold px-2 py-0.5 rounded-full border border-rose-500/30">
                    Mới
                  </span>
                </Link>
              </li>

              <li>
                <Link href="/van-ban-moi" className="text-white/60 hover:text-yellow-400 hover:translate-x-1 transition-all flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-white/40" />
                  Văn bản mới nhất 2025–2026
                </Link>
              </li>
              <li>
                <Link href="/an-le" className="text-white/80 font-medium hover:text-yellow-400 hover:translate-x-1 transition-all flex items-center justify-between group">
                  <span className="flex items-center gap-2">
                    <Scale className="w-3.5 h-3.5 text-yellow-400" />
                    Sổ Tay Án Lệ TANDTC (70+)
                  </span>
                  <span className="text-[10px] bg-yellow-400/20 text-yellow-300 font-semibold px-2 py-0.5 rounded-full border border-yellow-400/30">
                    Hot
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/so-sanh-luat" className="text-white/60 hover:text-yellow-400 hover:translate-x-1 transition-all flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-white/40" />
                  So Sánh Luật Cũ - Mới (Diff)
                </Link>
              </li>
              <li>
                <Link href="/mindmap" className="text-white/60 hover:text-yellow-400 hover:translate-x-1 transition-all flex items-center gap-2">
                  <Network className="w-3.5 h-3.5 text-white/40" />
                  Mindmap Cấu Trúc Điều Khoản
                </Link>
              </li>
              <li>
                <Link href="/hoi-dap" className="text-white/60 hover:text-yellow-400 hover:translate-x-1 transition-all flex items-center gap-2">
                  <MessageCircleQuestion className="w-3.5 h-3.5 text-white/40" />
                  Hỏi Đáp Pháp Luật (Tình Huống AI)
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Trợ lý Hợp đồng & Pháp chế Doanh nghiệp AI */}
          <div>
            <h3 className="text-white font-semibold text-xs uppercase tracking-wider mb-4 pb-2 border-b border-white/10 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-400" />
              Pháp Chế Doanh Nghiệp
            </h3>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              <li>
                <Link href="/legal-healthcheck" className="text-white/80 font-medium hover:text-yellow-400 hover:translate-x-1 transition-all flex items-center justify-between group">
                  <span className="flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />
                    Khám Sức Khỏe Pháp Lý 360°
                  </span>
                  <span className="text-[10px] bg-rose-500/20 text-rose-300 font-semibold px-2 py-0.5 rounded-full border border-rose-500/30">
                    Mới
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/thu-tuc-hanh-chinh" className="text-white/60 hover:text-yellow-400 hover:translate-x-1 transition-all flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-white/40" />
                  Navigator Thủ Tục Hành Chính A-Z
                </Link>
              </li>
              <li>
                <Link href="/contract-audit" className="text-white/60 hover:text-yellow-400 hover:translate-x-1 transition-all flex items-center gap-2">
                  <FileCheck2 className="w-3.5 h-3.5 text-white/40" />
                  Audit & Chấm Điểm Rủi Ro Hợp Đồng
                </Link>
              </li>
              <li>
                <Link href="/hop-dong/lich-nhac-han" className="text-white/60 hover:text-yellow-400 hover:translate-x-1 transition-all flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-white/40" />
                  Lịch Mốc Hạn Hợp Đồng (.ics)
                </Link>
              </li>
              <li>
                <Link href="/soan-thao" className="text-white/60 hover:text-yellow-400 hover:translate-x-1 transition-all flex items-center gap-2">
                  <FileEdit className="w-3.5 h-3.5 text-white/40" />
                  Soạn Thảo Văn Bản WYSIWYG A4 (NĐ 30)
                </Link>
              </li>
              <li>
                <Link href="/quy-trinh" className="text-white/60 hover:text-yellow-400 hover:translate-x-1 transition-all flex items-center gap-2">
                  <Workflow className="w-3.5 h-3.5 text-white/40" />
                  Quy Trình Nghiệp Vụ Pháp Chế AI
                </Link>
              </li>
            </ul>
          </div>



          {/* Column 4: Quản trị & Cấu hình Enterprise */}
          <div>
            <h3 className="text-white font-semibold text-xs uppercase tracking-wider mb-4 pb-2 border-b border-white/10 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-emerald-400" />
              Quản trị & Cấu hình
            </h3>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              <li>
                <Link href="/admin/enterprise-knowledge-config" className="text-white/60 hover:text-yellow-400 hover:translate-x-1 transition-all flex items-center gap-2">
                  <BookOpen className="w-3.5 h-3.5 text-white/40" />
                  Cấu hình Tri thức Doanh nghiệp
                </Link>
              </li>
              <li>
                <Link href="/admin/ai-byok-config" className="text-white/60 hover:text-yellow-400 hover:translate-x-1 transition-all flex items-center gap-2">
                  <Key className="w-3.5 h-3.5 text-white/40" />
                  Quản lý AI Provider & BYOK Keys
                </Link>
              </li>
              <li>
                <Link href="/admin/rbac-permissions" className="text-white/60 hover:text-yellow-400 hover:translate-x-1 transition-all flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-white/40" />
                  Ma trận Phân quyền bảo mật RBAC
                </Link>
              </li>
              <li>
                <Link href="/admin/ai-analytics" className="text-white/60 hover:text-yellow-400 hover:translate-x-1 transition-all flex items-center gap-2">
                  <BarChart3 className="w-3.5 h-3.5 text-white/40" />
                  Thống kê Chi phí LLM & Token
                </Link>
              </li>
              <li>
                <Link href="/admin/crawler" className="text-white/60 hover:text-yellow-400 hover:translate-x-1 transition-all flex items-center gap-2">
                  <Workflow className="w-3.5 h-3.5 text-white/40" />
                  Quản trị Thu thập Dữ liệu (Crawler)
                </Link>
              </li>
            </ul>
          </div>

        </div>
      </div>

      {/* Bottom Bar: Copyright & Legal Notice */}
      <div className="border-t border-white/10 bg-[#050E26]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-5 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-white/50">
          <div className="flex flex-wrap items-center gap-2 text-center sm:text-left">
            <span>&copy; {new Date().getFullYear()} <strong className="text-white/80 font-medium">Hệ thống Pháp luật Việt Nam (Tinix Legal)</strong>.</span>
            <span className="hidden sm:inline">·</span>
            <span>Phân phối theo giấy phép <strong className="text-white/70">CC-BY-4.0</strong></span>
          </div>

          <div className="flex items-center gap-4 text-white/50">
            <Link href="/huong-dan" className="hover:text-yellow-400 transition-colors">
              Điều khoản
            </Link>
            <span>·</span>
            <Link href="/huong-dan" className="hover:text-yellow-400 transition-colors">
              Bảo mật
            </Link>
            <span>·</span>
            <span className="text-white/40">Phiên bản 2.4.0</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
