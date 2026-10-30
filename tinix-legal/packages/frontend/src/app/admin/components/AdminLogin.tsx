'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  KeyRound,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  Sparkles,
  CheckCircle2,
  Building2,
  Users,
  AlertCircle,
  Briefcase,
  Crown,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminLoginProps {
  configured: boolean;
}

const DEMO_ORGANIZATIONS = [
  {
    id: 'vingroup',
    name: 'Tập đoàn Vingroup',
    code: 'VINGROUP',
    accounts: [
      { label: 'Tổng Giám Đốc (CEO)', email: 'ceo.vin@vingroup.net', pass: 'Tinix@2026', role: 'SUPER_ADMIN' },
      { label: 'Trưởng Ban Pháp Chế', email: 'legal.director@vingroup.net', pass: 'Tinix@2026', role: 'LEGAL_HEAD' },
      { label: 'Chuyên Viên Pháp Chế Dự Án', email: 'lawyer.phapche@vingroup.net', pass: 'Tinix@2026', role: 'LEGAL_SPECIALIST' },
      { label: 'Trưởng Khối Kinh Doanh', email: 'sales.vin@vingroup.net', pass: 'Tinix@2026', role: 'BUSINESS_USER' },
      { label: 'Kiểm Toán Viên Trưởng', email: 'audit.vin@vingroup.net', pass: 'Tinix@2026', role: 'AUDITOR' },
    ],
  },
  {
    id: 'tinix',
    name: 'TiniX Technology Solutions',
    code: 'TINIX_TECH',
    accounts: [
      { label: 'Super Admin', email: 'admin@tinix.vn', pass: 'Tinix@2026', role: 'SUPER_ADMIN' },
      { label: 'Trưởng Phòng Pháp Chế', email: 'legal.head@tinix.vn', pass: 'Tinix@2026', role: 'LEGAL_HEAD' },
      { label: 'Chuyên Viên Pháp Lý', email: 'chuyenvien@tinix.vn', pass: 'Tinix@2026', role: 'LEGAL_SPECIALIST' },
      { label: 'Chuyên Viên Nghiệp Vụ', email: 'nghiepvu@tinix.vn', pass: 'Tinix@2026', role: 'BUSINESS_USER' },
      { label: 'Kiểm Toán & Tuân Thủ', email: 'kiemtoan@tinix.vn', pass: 'Tinix@2026', role: 'AUDITOR' },
    ],
  },
  {
    id: 'fpt',
    name: 'FPT Software Legal Hub',
    code: 'FPT_SOFTWARE',
    accounts: [
      { label: 'Giám Đốc Pháp Chế (CLO)', email: 'director.fpt@fpt.com', pass: 'Tinix@2026', role: 'SUPER_ADMIN' },
      { label: 'Luật Sư Hợp Đồng IT', email: 'legal.fpt@fpt.com', pass: 'Tinix@2026', role: 'LEGAL_HEAD' },
    ],
  },
];

export function AdminLogin({ configured }: AdminLoginProps) {
  const [activeTab, setActiveTab] = useState<'credentials' | 'emergency'>('credentials');
  const [selectedDemoOrg, setSelectedDemoOrg] = useState('vingroup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emergencyKey, setEmergencyKey] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showDemoAccounts, setShowDemoAccounts] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  const handleCredentialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/admin-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        router.push('/admin/stats');
        router.refresh();
        return;
      }

      setError(data.message || 'Không thể đăng nhập. Vui lòng kiểm tra lại thông tin.');
    } catch {
      setError('Không thể kết nối đến máy chủ xác thực. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEmergencySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/admin-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: emergencyKey }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        router.push('/admin/stats');
        router.refresh();
        return;
      }

      setError(data.message || 'Khóa quản trị khẩn cấp không chính xác.');
    } catch {
      setError('Không thể kết nối đến máy chủ. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemoAccount = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  const currentOrgData = DEMO_ORGANIZATIONS.find((o) => o.id === selectedDemoOrg) || DEMO_ORGANIZATIONS[0];

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-indigo-600 via-sky-500 to-emerald-400 p-[1.5px] shadow-2xl shadow-indigo-500/30">
            <div className="w-12 h-12 bg-slate-950 rounded-[14px] flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-sky-400" />
            </div>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white font-mono">
            TINIX <span className="text-sky-400 font-sans font-bold">LEGAL WORKSPACE</span>
          </h1>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Hệ thống Quản trị Pháp chế Doanh nghiệp, Phân quyền RBAC &amp; Kho Tri thức RAG
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 backdrop-blur-xl relative overflow-hidden">
          {/* Tabs */}
          <div className="flex rounded-xl bg-slate-900/80 p-1 border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setActiveTab('credentials');
                setError(null);
              }}
              className={cn(
                'flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5',
                activeTab === 'credentials'
                  ? 'bg-gradient-to-r from-indigo-600 to-sky-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              )}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Tài khoản Cán bộ</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('emergency');
                setError(null);
              }}
              className={cn(
                'flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5',
                activeTab === 'emergency'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              )}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Khóa Khẩn cấp</span>
            </button>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-950/50 border border-rose-900/60 text-rose-300 text-xs flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {activeTab === 'credentials' ? (
            <form onSubmit={handleCredentialSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">Email Cán bộ / Doanh nghiệp</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="legal.head@vingroup.net"
                    required
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">Mật khẩu</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || !email || !password}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-sky-600 to-indigo-600 hover:opacity-95 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{submitting ? 'Đang xác thực bảo mật...' : 'Đăng nhập vào Workspace'}</span>
              </button>

              {/* Demo Accounts Quick-Fill Helper with Organization Tabs — collapsed by
                  default so real login credentials aren't shown in plaintext to
                  anyone who lands on this screen; opt-in via the toggle below. */}
              <div className="mt-6 pt-5 border-t border-slate-800/80 space-y-2.5">
                <button
                  type="button"
                  onClick={() => setShowDemoAccounts((v) => !v)}
                  className="w-full text-[11px] font-bold text-slate-400 hover:text-slate-200 uppercase tracking-wider flex items-center justify-between cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>{showDemoAccounts ? 'Ẩn tài khoản Demo' : 'Hiện tài khoản Demo'}</span>
                  </span>
                  {showDemoAccounts ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {showDemoAccounts && (
                  <>
                    <div className="text-right text-[10px] text-sky-400 font-mono">Pass: Tinix@2026</div>

                    {/* Organization Selection Tabs */}
                    <div className="grid grid-cols-3 gap-1 bg-slate-900/60 p-1 rounded-xl border border-slate-800/60">
                      {DEMO_ORGANIZATIONS.map((org) => (
                        <button
                          key={org.id}
                          type="button"
                          onClick={() => setSelectedDemoOrg(org.id)}
                          className={cn(
                            'py-1.5 px-2 rounded-lg text-[10px] font-bold truncate transition cursor-pointer',
                            selectedDemoOrg === org.id
                              ? 'bg-indigo-600 text-white shadow-sm'
                              : 'text-slate-400 hover:text-white'
                          )}
                        >
                          {org.name.split(' ')[0]} {org.name.split(' ')[1] || ''}
                        </button>
                      ))}
                    </div>

                    {/* Account Buttons */}
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {currentOrgData.accounts.map((acc) => (
                        <button
                          key={acc.email}
                          type="button"
                          onClick={() => fillDemoAccount(acc.email, acc.pass)}
                          className="w-full p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-left transition-all group cursor-pointer flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <div className="text-[11px] font-bold text-sky-400 group-hover:text-sky-300 truncate">
                              {acc.label}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono truncate">{acc.email}</div>
                          </div>
                          <span className="text-[9px] font-mono font-bold bg-indigo-950/60 border border-indigo-800/40 text-indigo-300 px-1.5 py-0.5 rounded flex-shrink-0">
                            {acc.role}
                          </span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </form>
          ) : (
            /* Tab 2: Emergency Key Login */
            <form onSubmit={handleEmergencySubmit} className="space-y-4">
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs leading-relaxed">
                Chế độ khẩn cấp dành riêng cho Quản trị viên cơ sở hạ tầng khi cần khôi phục quyền truy cập hoặc cấu hình trực tiếp máy chủ.
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">Khóa Quản trị Khẩn cấp (ADMIN_SECRET_KEY)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    value={emergencyKey}
                    onChange={(e) => setEmergencyKey(e.target.value)}
                    placeholder="Nhập khóa bảo mật bí mật..."
                    required
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || !emergencyKey}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:opacity-95 text-white font-bold text-xs shadow-lg shadow-amber-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{submitting ? 'Đang xác thực...' : 'Mở khóa Quản trị Khẩn cấp'}</span>
              </button>
            </form>
          )}
        </div>

        {/* Security Trust Badges */}
        <div className="flex items-center justify-center gap-6 text-[11px] text-slate-500">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            PBKDF2 SHA-512
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Org Unit Hierarchy
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Multi-Tenant RAG
          </span>
        </div>
      </div>
    </div>
  );
}
