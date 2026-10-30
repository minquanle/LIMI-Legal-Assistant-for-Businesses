'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3, AlertTriangle, Activity, Sparkles, KeyRound,
  ShieldCheck, BookOpen, MessageSquareText, LayoutGrid, Radar,
} from 'lucide-react';

const ADMIN_LINKS = [
  { href: '/admin/stats', label: 'Thống kê', icon: BarChart3 },
  { href: '/admin/quality', label: 'Chất lượng DL', icon: AlertTriangle },
  { href: '/admin/crawler', label: 'Crawler', icon: Activity },
  { href: '/admin/ai-analytics', label: 'AI Analytics', icon: Sparkles },
  { href: '/admin/ai-byok-config', label: 'AI BYOK', icon: KeyRound },
  { href: '/admin/rbac-permissions', label: 'Phân quyền RBAC', icon: ShieldCheck },
  { href: '/admin/enterprise-config', label: 'Cấu hình Doanh nghiệp', icon: LayoutGrid },
  { href: '/admin/enterprise-knowledge-config', label: 'Tri thức Doanh nghiệp', icon: BookOpen },
  { href: '/admin/qa-review', label: 'Duyệt Hỏi Đáp', icon: MessageSquareText },
  { href: '/admin/radar-config', label: 'Radar Tuân thủ', icon: Radar },
];

/** Cross-navigation bar for admin pages that are not fronted by AdminHeader. */
export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Điều hướng khu vực Quản trị"
      className="flex flex-wrap items-center gap-1.5 mb-6 p-2 bg-slate-950 rounded-xl border border-slate-800 shadow-sm"
    >
      {ADMIN_LINKS.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            aria-current={isActive ? 'page' : undefined}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              isActive
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Icon className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
