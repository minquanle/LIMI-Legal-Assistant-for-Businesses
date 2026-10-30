'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  BarChart3,
  AlertTriangle,
  Activity,
  Sparkles,
  KeyRound,
  ShieldCheck,
  BookOpen,
  MessageSquareText,
  LayoutGrid,
  Radar,
  Users,
  ScrollText,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Shield,
  Briefcase,
  Layers,
  Settings,
  ExternalLink,
  Lock,
  FolderTree,
  FileSearch,
  CalendarClock,
} from 'lucide-react';

import { WorkspaceSelector } from '@/components/layout/WorkspaceSelector';

export interface AdminUserClient {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  phone?: string;
  department?: string;
  jobTitle?: string;
  roleCode: string;
  roleName: string;
  permissions: string[];
}

interface NavGroup {
  title: string;
  items: Array<{
    href: string;
    label: string;
    icon: React.ElementType;
    badge?: string | number;
    badgeColor?: string;
    permission?: string;
  }>;
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: 'Tổng quan & Điều hành',
    items: [
      { href: '/admin/stats', label: 'Thống kê Số liệu', icon: BarChart3 },
      { href: '/admin/quality', label: 'Chất lượng Dữ liệu', icon: AlertTriangle },
      { href: '/admin/audit-logs', label: 'Nhật ký Hoạt động', icon: ScrollText, permission: 'AUDIT_LOG_VIEW' },
    ],
  },
  {
    title: 'Không gian Doanh nghiệp (RAG Hub)',
    items: [
      { href: '/admin/organization-tree', label: 'Cơ cấu Cây & Quyền Đơn vị', icon: FolderTree, permission: 'RBAC_MANAGE' },
      { href: '/admin/enterprise-documents', label: 'Kho Quy chế & RAG', icon: BookOpen, permission: 'KNOWLEDGE_BASE_MANAGE' },
      { href: '/admin/enterprise-knowledge-config', label: 'Tri thức & Quy trình', icon: Layers, permission: 'KNOWLEDGE_BASE_MANAGE' },
      { href: '/admin/enterprise-config', label: 'Quy trình Trình ký', icon: LayoutGrid, permission: 'ADMIN_CONFIG' },
    ],
  },
  {
    title: 'Dữ liệu & Thu thập',
    items: [
      { href: '/admin/crawler', label: 'Quản trị Crawler', icon: Activity, permission: 'CRAWLER_OPERATE' },
      { href: '/admin/crawl-jobs', label: 'Cập nhật Dữ liệu Định kỳ', icon: CalendarClock, permission: 'CRAWLER_OPERATE' },
      { href: '/admin/qa-review', label: 'Duyệt Hỏi Đáp QA', icon: MessageSquareText, permission: 'QA_REVIEW_MANAGE' },
      { href: '/admin/radar-config', label: 'Radar Tuân thủ', icon: Radar, permission: 'RADAR_MANAGE' },
      { href: '/admin/parser-quality', label: 'Chất lượng Bóc tách', icon: FileSearch, permission: 'RADAR_MANAGE' },
    ],
  },
  {
    title: 'Tài khoản & Phân quyền',
    items: [
      { href: '/admin/users', label: 'Quản lý Người dùng', icon: Users, permission: 'USER_MANAGE' },
      { href: '/admin/rbac-permissions', label: 'Ma trận Phân quyền', icon: ShieldCheck, permission: 'RBAC_MANAGE' },
    ],
  },
  {
    title: 'Cấu hình AI & BYOK',
    items: [
      { href: '/admin/ai-byok-config', label: 'Cấu hình AI BYOK', icon: KeyRound, permission: 'AI_BYOK_CONFIG' },
      { href: '/admin/ai-analytics', label: 'Chi phí & Token AI', icon: Sparkles },
    ],
  },
];

interface AdminSidebarProps {
  user?: AdminUserClient | null;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  className?: string;
}

export function AdminSidebar({ user, collapsed = false, onToggleCollapse, className }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch('/api/admin-session', { method: 'DELETE' });
    } catch {}
    router.push('/admin');
    router.refresh();
  };

  const getRoleBadgeColor = (roleCode?: string) => {
    switch (roleCode) {
      case 'SUPER_ADMIN':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      case 'LEGAL_HEAD':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'LEGAL_SPECIALIST':
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
      case 'AUDITOR':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      default:
        return 'bg-sky-500/20 text-sky-300 border-sky-500/30';
    }
  };

  return (
    <aside
      className={cn(
        'h-screen sticky top-0 flex flex-col bg-slate-950/95 backdrop-blur-xl border-r border-slate-800/80 transition-all duration-300 z-40 select-none shadow-2xl',
        collapsed ? 'w-20' : 'w-72',
        className
      )}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/80">
        <Link href="/admin" className="flex items-center gap-3 overflow-hidden group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-sky-500 to-emerald-400 p-[1.5px] shadow-lg shadow-indigo-500/20 flex-shrink-0 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Shield className="w-5 h-5 text-sky-400" />
            </div>
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-extrabold text-sm tracking-tight text-white flex items-center gap-1.5 font-mono">
                TINIX <span className="text-sky-400 font-sans font-bold">LEGAL</span>
              </span>
              <span className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase">
                Admin Console
              </span>
            </div>
          )}
        </Link>

        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-all cursor-pointer"
            title={collapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Workspace Selector */}
      {!collapsed && (
        <div className="px-3 pt-3 pb-1 border-b border-slate-800/60">
          <WorkspaceSelector />
        </div>
      )}

      {/* Navigation Links Scrollable Area */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
        {NAV_GROUPS.map((group) => {
          return (
            <div key={group.title} className="space-y-1">
              {!collapsed && (
                <div className="px-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  {group.title}
                </div>
              )}
              {group.items.map(({ href, label, icon: Icon, badge, badgeColor }) => {
                const isActive = pathname === href || pathname.startsWith(`${href}/`);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group relative cursor-pointer',
                      isActive
                        ? 'bg-gradient-to-r from-indigo-600 to-sky-600 text-white shadow-lg shadow-indigo-600/30 font-bold'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/80'
                    )}
                    title={collapsed ? label : undefined}
                  >
                    <Icon
                      className={cn(
                        'w-4 h-4 flex-shrink-0 transition-transform group-hover:scale-110',
                        isActive ? 'text-white' : 'text-slate-400 group-hover:text-sky-400'
                      )}
                    />
                    {!collapsed && <span className="truncate flex-1">{label}</span>}
                    {!collapsed && badge && (
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded-full text-[10px] font-bold border',
                          badgeColor || 'bg-slate-800 text-slate-300 border-slate-700'
                        )}
                      >
                        {badge}
                      </span>
                    )}
                    {collapsed && isActive && (
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-sky-400 rounded-l-full" />
                    )}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* User Card & Sign Out Footer */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/60">
        <div
          className={cn(
            'flex items-center gap-3 p-2.5 rounded-xl bg-slate-900/90 border border-slate-800/80 transition-all',
            collapsed ? 'justify-center p-2' : ''
          )}
        >
          {/* Avatar */}
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center flex-shrink-0 text-sm shadow-md">
            {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'A'}
          </div>

          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-white truncate" title={user?.fullName || 'Administrator'}>
                {user?.fullName || 'Administrator'}
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <span
                  className={cn(
                    'px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider border truncate',
                    getRoleBadgeColor(user?.roleCode)
                  )}
                  title={user?.roleName || user?.roleCode}
                >
                  {user?.roleName || user?.roleCode || 'SUPER ADMIN'}
                </span>
              </div>
            </div>
          )}

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
            title="Đăng xuất khỏi hệ thống"
          >
            <LogOut className={cn('w-4 h-4', loggingOut && 'animate-spin')} />
          </button>
        </div>

        {/* Back to Client App Link */}
        {!collapsed && (
          <Link
            href="/"
            className="mt-2 flex items-center justify-center gap-1.5 w-full py-1.5 rounded-lg text-[11px] font-semibold text-slate-400 hover:text-sky-400 hover:bg-slate-900 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Trang tra cứu Pháp luật</span>
          </Link>
        )}
      </div>
    </aside>
  );
}
