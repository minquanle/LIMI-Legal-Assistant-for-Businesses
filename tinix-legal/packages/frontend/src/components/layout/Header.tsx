'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  Search,
  Menu,
  X,
  BookOpen,
  ChevronDown,
  MessageCircleQuestion,
  Sparkles,
  FileText,
  FileCheck2,
  Network,
  Layers,
  TrendingUp,
  HelpCircle,
  FileEdit,
  Workflow,
  Command,
  ArrowRight,
  Flame,
  Gavel,
  GitCompare,
  Activity,
  Bell,
  FileCheck,
  Building2,
  Calculator,
  ShieldAlert,
} from 'lucide-react';



import { ThemeToggle } from './ThemeToggle';

import { NotificationDrawer } from './NotificationDrawer';

const POPULAR_KEYWORDS = [
  'Luật Đất đai 2024',
  'Nghị định 30/2020/NĐ-CP',
  'Bộ luật Lao động 2019',
  'Thuế GTGT',
  'Văn bản mới 2026',
];

export function Header() {
  const [mobileMenu, setMobileMenu] = useState(false);
  const [query, setQuery] = useState('');
  const [toolsOpen, setToolsOpen] = useState(false);
  const [newsOpen, setNewsOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const toolsRef = useRef<HTMLDivElement>(null);
  const newsRef = useRef<HTMLDivElement>(null);
  // Escape closes the menu and returns focus to its trigger, so keyboard users
  // are not stranded at the end of the document.
  const toolsTriggerRef = useRef<HTMLButtonElement>(null);
  const newsTriggerRef = useRef<HTMLButtonElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (toolsRef.current && !toolsRef.current.contains(event.target as Node)) {
        setToolsOpen(false);
      }
      if (newsRef.current && !newsRef.current.contains(event.target as Node)) {
        setNewsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu & dropdowns on route change
  useEffect(() => {
    setMobileMenu(false);
    setToolsOpen(false);
    setNewsOpen(false);
  }, [pathname]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleKeywordClick = (keyword: string) => {
    setQuery(keyword);
    router.push(`/search?q=${encodeURIComponent(keyword)}`);
  };

  const isActive = (path: string) => pathname === path;

  return (
    <header className="relative z-40 bg-[#08163A] dark:bg-slate-950 border-b border-white/10 shadow-lg shadow-black/15 transition-all">
      {/* Top micro status bar */}
      <div className="hidden lg:block bg-[#050E26]/90 text-white/70 text-[11px] py-1 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 w-full flex justify-between items-center">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-white/80">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Cổng thông tin pháp luật & Trợ lý Enterprise AI
            </span>
            <span className="text-white/20">|</span>
            <span className="text-white/60">
              Dữ liệu: <strong className="text-yellow-400 font-medium">214.000+</strong> văn bản (1945 – 2026)
            </span>
          </div>
          <div className="flex items-center gap-3 text-white/60">
            <span>Hỗ trợ: <strong className="text-white/80 font-medium">contact@tinix-legal.vn</strong></span>
          </div>
        </div>
      </div>

      {/* Primary Navigation Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="bg-gradient-to-br from-yellow-400 via-amber-400 to-yellow-500 rounded-xl p-2 shadow-md shadow-yellow-500/20 group-hover:scale-105 group-hover:shadow-yellow-400/30 transition-all duration-300">
              <BookOpen className="w-5 h-5 text-[#0B1D51]" />
            </div>
            <div className="flex flex-col">
              <span className="text-white font-bold text-sm leading-tight tracking-wide group-hover:text-yellow-400 transition-colors">
                HỆ THỐNG PHÁP LUẬT
              </span>
              <span className="text-yellow-400 text-[10px] font-semibold tracking-wider">
                VIỆT NAM · TINIX LEGAL
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1.5">
            <Link
              href="/"
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                isActive('/')
                  ? 'bg-white/15 text-yellow-400 font-semibold shadow-inner'
                  : 'text-white/80 hover:text-yellow-400 hover:bg-white/5'
              }`}
            >
              Trang chủ
            </Link>

            <Link
              href="/search"
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                isActive('/search')
                  ? 'bg-white/15 text-yellow-400 font-semibold shadow-inner'
                  : 'text-white/80 hover:text-yellow-400 hover:bg-white/5'
              }`}
            >
              Tra cứu
            </Link>


            <Link
              href="/radar-phap-ly"
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 relative group ${
                isActive('/radar-phap-ly')
                  ? 'bg-white/15 text-yellow-400 font-semibold shadow-inner'
                  : 'text-white/80 hover:text-yellow-400 hover:bg-white/5'
              }`}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
              </span>
              <span>Radar Tuân thủ</span>
            </Link>

            <Link
              href="/hoi-dap"
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 relative group ${
                isActive('/hoi-dap')
                  ? 'bg-white/15 text-yellow-400 font-semibold shadow-inner'
                  : 'text-white/80 hover:text-yellow-400 hover:bg-white/5'
              }`}
            >
              <MessageCircleQuestion className="w-4 h-4 text-yellow-400" />
              <span>Hỏi đáp AI</span>
            </Link>

            {/* Dropdown 1: Công cụ (tính toán + trợ lý AI, gộp nhóm) */}
            <div
              className="relative"
              ref={toolsRef}
              onKeyDown={(e) => {
                if (e.key === 'Escape' && toolsOpen) {
                  setToolsOpen(false);
                  toolsTriggerRef.current?.focus();
                }
              }}
            >
              <button
                ref={toolsTriggerRef}
                type="button"
                onClick={() => {
                  setToolsOpen(!toolsOpen);
                  setNewsOpen(false);
                }}
                aria-expanded={toolsOpen}
                aria-haspopup="true"
                id="header-tools-trigger"
                className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center gap-1 ${
                  toolsOpen || pathname.includes('cong-cu') || pathname.includes('contract-audit') || pathname.includes('hop-dong') || pathname.includes('mindmap') || pathname.includes('soan-thao') || pathname.includes('so-sanh') || pathname.includes('quy-trinh') || pathname.includes('an-le') || pathname.includes('thu-tuc-hanh-chinh') || pathname.includes('legal-healthcheck')
                    ? 'bg-white/15 text-yellow-400 font-semibold'
                    : 'text-white/80 hover:text-yellow-400 hover:bg-white/5'
                }`}
              >
                <Calculator className="w-4 h-4 text-yellow-400" />
                <span>Công cụ</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${toolsOpen ? 'rotate-180 text-yellow-400' : 'text-white/60'}`} aria-hidden="true" />
              </button>

              {toolsOpen && (
                <div className="absolute top-full left-0 mt-2 w-80 bg-[#0B1D51]/95 dark:bg-slate-900/95 backdrop-blur-xl border border-white/15 rounded-2xl p-2 shadow-2xl z-50 animate-in fade-in-0 zoom-in-95 duration-150 max-h-[80vh] overflow-y-auto">
                  <div className="text-[10px] font-semibold text-white/40 uppercase tracking-wider px-3 py-1.5">
                    Tính toán pháp lý
                  </div>

                  <Link
                    href="/cong-cu/tinh-thue-tncn"
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/10 transition-colors group"
                  >
                    <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400 group-hover:bg-yellow-400 group-hover:text-[#0B1D51] transition-colors">
                      <Calculator className="w-4 h-4" />
                    </div>
                    <div className="text-xs font-semibold text-white group-hover:text-yellow-400 transition-colors">
                      Tính thuế TNCN
                    </div>
                  </Link>

                  <Link
                    href="/cong-cu/tinh-luong"
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/10 transition-colors group"
                  >
                    <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 group-hover:bg-yellow-400 group-hover:text-[#0B1D51] transition-colors">
                      <Calculator className="w-4 h-4" />
                    </div>
                    <div className="text-xs font-semibold text-white group-hover:text-yellow-400 transition-colors">
                      Tính lương Gross-Net
                    </div>
                  </Link>

                  <Link
                    href="/cong-cu/tra-cuu-muc-phat"
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/10 transition-colors group"
                  >
                    <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400 group-hover:bg-yellow-400 group-hover:text-[#0B1D51] transition-colors">
                      <ShieldAlert className="w-4 h-4" />
                    </div>
                    <div className="text-xs font-semibold text-white group-hover:text-yellow-400 transition-colors">
                      Tra cứu mức phạt VPHC
                    </div>
                  </Link>

                  <Link
                    href="/cong-cu"
                    className="flex items-center justify-between gap-2 mt-1 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-[11px] font-bold text-yellow-400"
                  >
                    <span>Xem tất cả 48 công cụ tính toán</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  <div className="text-[10px] font-semibold text-white/40 uppercase tracking-wider px-3 py-1.5 mt-2 border-t border-white/10 pt-3">
                    Trợ lý AI & Hợp đồng
                  </div>

                  <Link
                    href="/hop-dong/lich-nhac-han"
                    className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-white/10 transition-colors group"
                  >

                    <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 group-hover:bg-yellow-400 group-hover:text-[#0B1D51] transition-colors">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white group-hover:text-yellow-400 transition-colors flex items-center gap-1.5">
                        <span>Lịch Mốc Hạn Hợp Đồng</span>
                        <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-bold px-1.5 py-0.2 rounded border border-emerald-500/30">Mới</span>
                      </div>
                      <div className="text-[11px] text-white/50 leading-tight mt-0.5">
                        Trích xuất mốc thanh toán & Xuất .ics
                      </div>
                    </div>
                  </Link>

                  <Link
                    href="/contract-audit"
                    className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-white/10 transition-colors group"
                  >
                    <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400 group-hover:bg-yellow-400 group-hover:text-[#0B1D51] transition-colors">
                      <FileCheck2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white group-hover:text-yellow-400 transition-colors">
                        Audit Rủi ro Hợp đồng
                      </div>
                      <div className="text-[11px] text-white/50 leading-tight mt-0.5">
                        Chấm điểm rủi ro & Redlining tự động
                      </div>
                    </div>
                  </Link>


                  <Link
                    href="/soan-thao"
                    className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-white/10 transition-colors group"
                  >
                    <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 group-hover:bg-yellow-400 group-hover:text-[#0B1D51] transition-colors">
                      <FileEdit className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white group-hover:text-yellow-400 transition-colors">
                        Soạn thảo Văn bản (NĐ 30)
                      </div>
                      <div className="text-[11px] text-white/50 leading-tight mt-0.5">
                        Soạn thảo hành chính chuẩn thể thức
                      </div>
                    </div>
                  </Link>

                  <Link
                    href="/mindmap"
                    className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-white/10 transition-colors group"
                  >
                    <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400 group-hover:bg-yellow-400 group-hover:text-[#0B1D51] transition-colors">
                      <Network className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white group-hover:text-yellow-400 transition-colors">
                        Mindmap Điều khoản
                      </div>
                      <div className="text-[11px] text-white/50 leading-tight mt-0.5">
                        Cây cấu trúc trực quan hóa điều luật
                      </div>
                    </div>
                  </Link>


                  <Link
                    href="/an-le"
                    className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-white/10 transition-colors group"
                  >
                    <div className="p-2 rounded-lg bg-yellow-500/20 text-yellow-400 group-hover:bg-yellow-400 group-hover:text-[#0B1D51] transition-colors">
                      <Gavel className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white group-hover:text-yellow-400 transition-colors flex items-center gap-1.5">
                        <span>Sổ Tay Án Lệ TANDTC</span>
                        <span className="text-[9px] bg-yellow-500/20 text-yellow-300 font-bold px-1.5 py-0.2 rounded border border-yellow-500/30">Hot</span>
                      </div>
                      <div className="text-[11px] text-white/50 leading-tight mt-0.5">
                        70+ Án lệ & Quy tắc pháp lý áp dụng
                      </div>
                    </div>
                  </Link>

                  <Link
                    href="/so-sanh-luat"
                    className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-white/10 transition-colors group"
                  >
                    <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 group-hover:bg-yellow-400 group-hover:text-[#0B1D51] transition-colors">
                      <GitCompare className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white group-hover:text-yellow-400 transition-colors">
                        So Sánh Luật Cũ - Mới
                      </div>
                      <div className="text-[11px] text-white/50 leading-tight mt-0.5">
                        Diff song song Luật Đất đai, BHXH...
                      </div>
                    </div>
                  </Link>

                  <Link
                    href="/thu-tuc-hanh-chinh"
                    className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-white/10 transition-colors group"
                  >
                    <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400 group-hover:bg-yellow-400 group-hover:text-[#0B1D51] transition-colors">
                      <FileCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white group-hover:text-yellow-400 transition-colors">
                        Navigator Thủ Tục Hành Chính
                      </div>
                      <div className="text-[11px] text-white/50 leading-tight mt-0.5">
                        Hướng dẫn A-Z & Tải biểu mẫu chuẩn
                      </div>
                    </div>
                  </Link>

                  <Link
                    href="/legal-healthcheck"
                    className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-white/10 transition-colors group"
                  >
                    <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400 group-hover:bg-yellow-400 group-hover:text-[#0B1D51] transition-colors">
                      <Activity className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white group-hover:text-yellow-400 transition-colors flex items-center gap-1.5">
                        <span>Khám Sức Khỏe Pháp Lý DN</span>
                        <span className="text-[9px] bg-rose-500/20 text-rose-300 font-bold px-1.5 py-0.2 rounded border border-rose-500/30">360°</span>
                      </div>
                      <div className="text-[11px] text-white/50 leading-tight mt-0.5">
                        Tự kiểm toán rủi ro Due Diligence
                      </div>
                    </div>
                  </Link>

                  <Link
                    href="/quy-trinh"
                    className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-white/10 transition-colors group"
                  >
                    <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400 group-hover:bg-yellow-400 group-hover:text-[#0B1D51] transition-colors">
                      <Workflow className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white group-hover:text-yellow-400 transition-colors">
                        Quy trình Nghiệp vụ AI
                      </div>
                      <div className="text-[11px] text-white/50 leading-tight mt-0.5">
                        Quy trình pháp chế & Checklist tuân thủ
                      </div>
                    </div>
                  </Link>
                </div>
              )}
            </div>


            {/* Dropdown 2: Cập nhật (tin tức, cảnh báo luật mới, xu hướng) */}
            <div
              className="relative"
              ref={newsRef}
              onKeyDown={(e) => {
                if (e.key === 'Escape' && newsOpen) {
                  setNewsOpen(false);
                  newsTriggerRef.current?.focus();
                }
              }}
            >
              <button
                ref={newsTriggerRef}
                type="button"
                onClick={() => {
                  setNewsOpen(!newsOpen);
                  setToolsOpen(false);
                }}
                aria-expanded={newsOpen}
                aria-haspopup="true"
                id="header-news-trigger"
                className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center gap-1 ${
                  newsOpen || pathname.includes('van-ban-moi') || pathname.includes('xu-huong') || pathname.includes('canh-bao-luat-moi')
                    ? 'bg-white/15 text-yellow-400 font-semibold'
                    : 'text-white/80 hover:text-yellow-400 hover:bg-white/5'
                }`}
              >
                <span>Cập nhật</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${newsOpen ? 'rotate-180 text-yellow-400' : 'text-white/60'}`} aria-hidden="true" />
              </button>

              {newsOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-[#0B1D51]/95 dark:bg-slate-900/95 backdrop-blur-xl border border-white/15 rounded-2xl p-2 shadow-2xl z-50 animate-in fade-in-0 zoom-in-95 duration-150">
                  <Link
                    href="/canh-bao-luat-moi"
                    className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-white/10 transition-colors group"
                  >
                    <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400 group-hover:bg-yellow-400 group-hover:text-[#0B1D51] transition-colors">
                      <Bell className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white group-hover:text-yellow-400 transition-colors flex items-center gap-1.5">
                        <span>Cảnh Báo Luật Mới 2025–2026</span>
                        <span className="text-[9px] bg-rose-500/20 text-rose-300 font-bold px-1.5 py-0.2 rounded border border-rose-500/30">Hot</span>
                      </div>
                      <div className="text-[11px] text-white/50 leading-tight mt-0.5">
                        Nhắc hạn & Bản đồ tác động theo vai trò
                      </div>
                    </div>
                  </Link>

                  <Link
                    href="/van-ban-moi"
                    className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-white/10 transition-colors group"
                  >
                    <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 group-hover:bg-yellow-400 group-hover:text-[#0B1D51] transition-colors">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white group-hover:text-yellow-400 transition-colors">
                        Văn bản Mới 2025–2026
                      </div>
                      <div className="text-[11px] text-white/50 leading-tight mt-0.5">
                        Cập nhật luật, nghị định hàng ngày
                      </div>
                    </div>
                  </Link>

                  <Link
                    href="/xu-huong"
                    className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-white/10 transition-colors group"
                  >
                    <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400 group-hover:bg-yellow-400 group-hover:text-[#0B1D51] transition-colors">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white group-hover:text-yellow-400 transition-colors">
                        Phân tích Xu hướng
                      </div>
                      <div className="text-[11px] text-white/50 leading-tight mt-0.5">
                        Thống kê lĩnh vực ban hành
                      </div>
                    </div>
                  </Link>
                </div>
              )}
            </div>

            <Link
              href="/huong-dan"
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                isActive('/huong-dan')
                  ? 'bg-white/15 text-yellow-400 font-semibold shadow-inner'
                  : 'text-white/80 hover:text-yellow-400 hover:bg-white/5'
              }`}
            >
              Hướng dẫn
            </Link>
          </nav>

          {/* Right Action Icons */}
          <div className="flex items-center gap-2">
            <Link
              href="/admin"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 via-sky-600 to-indigo-600 hover:opacity-95 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition-all border border-indigo-400/30 group"
            >
              <Building2 className="w-3.5 h-3.5 text-sky-300 group-hover:scale-110 transition-transform" />
              <span>Legal Workspace</span>
              <span className="text-[9px] bg-amber-400 text-[#0B1D51] font-black px-1.5 py-0.2 rounded-full">B2B</span>
            </Link>

            <ThemeToggle />
            <NotificationDrawer />

            {/* Mobile Menu Toggle Button */}
            <button
              type="button"
              onClick={() => setMobileMenu(!mobileMenu)}
              className="lg:hidden p-2 text-white/80 hover:text-yellow-400 hover:bg-white/10 rounded-xl transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Dedicated Search Sub-bar Row (Placed cleanly below Navigation) */}
      <div className="border-t border-white/10 bg-[#050E26]/80 dark:bg-slate-900/80 backdrop-blur-md px-4 sm:px-6 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2.5 sm:gap-4">
          
          {/* Main Search Bar Form */}
          <form
            onSubmit={handleSearch}
            className="w-full md:flex-1 max-w-3xl flex items-center bg-white/10 dark:bg-white/5 hover:bg-white/15 focus-within:bg-white/20 focus-within:border-yellow-400 border border-white/15 rounded-xl px-3.5 py-1.5 transition-all shadow-inner group"
          >
            <Search className="w-4 h-4 text-yellow-400/80 group-focus-within:text-yellow-400 shrink-0 transition-colors" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tra cứu số hiệu văn bản, từ khóa pháp lý (ví dụ: 31/2024/QH15, Luật Đất đai, Thuế...)..."
              className="bg-transparent text-white placeholder:text-white/40 text-xs sm:text-sm px-3 flex-1 outline-none"
            />
            <div className="flex items-center gap-2 shrink-0">
              <span className="hidden sm:inline-flex items-center gap-0.5 text-[10px] text-white/40 font-mono bg-white/10 px-2 py-0.5 rounded border border-white/10">
                <Command className="w-2.5 h-2.5" />K
              </span>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-[#0B1D51] font-semibold text-xs rounded-lg shadow-sm transition-all"
              >
                <span>Tìm kiếm</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </form>

          {/* Quick Keyword Suggestion Chips */}
          <div className="hidden lg:flex items-center gap-1.5 text-xs min-w-0 max-w-[38%] overflow-x-auto">
            <span className="flex items-center gap-1 text-white/40 text-[11px] font-medium pr-1 shrink-0">
              <Flame className="w-3 h-3 text-amber-400" />
              Gợi ý:
            </span>
            {POPULAR_KEYWORDS.map((kw) => (
              <button
                key={kw}
                type="button"
                onClick={() => handleKeywordClick(kw)}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-yellow-400/20 hover:text-yellow-300 hover:border-yellow-400/30 border border-white/10 text-white/70 text-[11px] transition-all whitespace-nowrap shrink-0"
              >
                {kw}
              </button>
            ))}
          </div>

        </div>
      </div>

      {/* Mobile navigation drawer */}
      {mobileMenu && (
        <div className="lg:hidden bg-[#071333] dark:bg-slate-950 border-t border-white/10 px-4 py-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
          <nav className="grid grid-cols-2 gap-1.5 text-xs">
            <Link
              href="/"
              onClick={() => setMobileMenu(false)}
              className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5 text-white/90 hover:bg-white/10 hover:text-yellow-400"
            >
              <BookOpen className="w-4 h-4 text-yellow-400" />
              <span>Trang chủ</span>
            </Link>

            <Link
              href="/search"
              onClick={() => setMobileMenu(false)}
              className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5 text-white/90 hover:bg-white/10 hover:text-yellow-400"
            >
              <Search className="w-4 h-4 text-blue-400" />
              <span>Tra cứu văn bản</span>
            </Link>

            <Link
              href="/hoi-dap"
              onClick={() => setMobileMenu(false)}
              className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5 text-white/90 hover:bg-white/10 hover:text-yellow-400 col-span-2 border border-yellow-400/30"
            >
              <MessageCircleQuestion className="w-4 h-4 text-yellow-400" />
              <span className="font-semibold text-yellow-300">Hỏi đáp Pháp luật (Q&A AI)</span>
              <span className="ml-auto text-[9px] bg-yellow-400 text-[#0B1D51] font-bold px-1.5 py-0.5 rounded">
                MỚI
              </span>
            </Link>

            <Link
              href="/cong-cu"
              onClick={() => setMobileMenu(false)}
              className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5 text-white/90 hover:bg-white/10 hover:text-yellow-400"
            >
              <Calculator className="w-4 h-4 text-yellow-400" />
              <span>Công cụ tính toán</span>
            </Link>

            <Link
              href="/contract-audit"
              onClick={() => setMobileMenu(false)}
              className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5 text-white/90 hover:bg-white/10 hover:text-yellow-400"
            >
              <FileCheck2 className="w-4 h-4 text-emerald-400" />
              <span>Audit Hợp đồng</span>
            </Link>

            <Link
              href="/soan-thao"
              onClick={() => setMobileMenu(false)}
              className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5 text-white/90 hover:bg-white/10 hover:text-yellow-400"
            >
              <FileEdit className="w-4 h-4 text-amber-400" />
              <span>Soạn thảo AI</span>
            </Link>

            <Link
              href="/mindmap"
              onClick={() => setMobileMenu(false)}
              className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5 text-white/90 hover:bg-white/10 hover:text-yellow-400"
            >
              <Network className="w-4 h-4 text-purple-400" />
              <span>Mindmap Điều khoản</span>
            </Link>

            <Link
              href="/radar-phap-ly"
              onClick={() => setMobileMenu(false)}
              className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5 text-white/90 hover:bg-white/10 hover:text-yellow-400"
            >
              <Activity className="w-4 h-4 text-rose-400" />
              <span>Radar Tuân thủ</span>
            </Link>

            <Link
              href="/hop-dong/lich-nhac-han"
              onClick={() => setMobileMenu(false)}
              className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5 text-white/90 hover:bg-white/10 hover:text-yellow-400"
            >
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Lịch Mốc Hạn Hợp Đồng</span>
            </Link>

            <Link
              href="/an-le"
              onClick={() => setMobileMenu(false)}
              className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5 text-white/90 hover:bg-white/10 hover:text-yellow-400"
            >
              <Gavel className="w-4 h-4 text-yellow-400" />
              <span>Sổ Tay Án Lệ TANDTC</span>
            </Link>

            <Link
              href="/thu-tuc-hanh-chinh"
              onClick={() => setMobileMenu(false)}
              className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5 text-white/90 hover:bg-white/10 hover:text-yellow-400"
            >
              <FileCheck className="w-4 h-4 text-blue-400" />
              <span>Navigator TTHC</span>
            </Link>

            <Link
              href="/legal-healthcheck"
              onClick={() => setMobileMenu(false)}
              className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5 text-white/90 hover:bg-white/10 hover:text-yellow-400"
            >
              <Activity className="w-4 h-4 text-rose-400" />
              <span>Khám Sức Khỏe Pháp Lý</span>
            </Link>

            <Link
              href="/canh-bao-luat-moi"
              onClick={() => setMobileMenu(false)}
              className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5 text-white/90 hover:bg-white/10 hover:text-yellow-400 col-span-2 border border-rose-500/30"
            >
              <Bell className="w-4 h-4 text-rose-400" />
              <span className="font-semibold text-rose-300">Cảnh Báo Luật Mới 2025–2026</span>
              <span className="ml-auto text-[9px] bg-rose-500 text-white font-bold px-1.5 py-0.5 rounded">
                HOT
              </span>
            </Link>

            <Link
              href="/so-sanh-luat"
              onClick={() => setMobileMenu(false)}
              className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5 text-white/90 hover:bg-white/10 hover:text-yellow-400"
            >
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>So sánh luật (Diff)</span>
            </Link>


            <Link
              href="/van-ban-moi"
              onClick={() => setMobileMenu(false)}
              className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5 text-white/90 hover:bg-white/10 hover:text-yellow-400"
            >
              <FileText className="w-4 h-4 text-emerald-400" />
              <span>Văn bản mới nhất</span>
            </Link>

            <Link
              href="/xu-huong"
              onClick={() => setMobileMenu(false)}
              className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5 text-white/90 hover:bg-white/10 hover:text-yellow-400"
            >
              <TrendingUp className="w-4 h-4 text-blue-400" />
              <span>Xu hướng pháp lý</span>
            </Link>

            <Link
              href="/huong-dan"
              onClick={() => setMobileMenu(false)}
              className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5 text-white/90 hover:bg-white/10 hover:text-yellow-400 col-span-2"
            >
              <HelpCircle className="w-4 h-4 text-slate-400" />
              <span>Hướng dẫn sử dụng</span>
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
