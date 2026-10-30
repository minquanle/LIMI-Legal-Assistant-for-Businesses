'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck, Save, CheckCircle2, Lock, Users, ChevronRight,
  RefreshCw, Check, X
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { AdminNav } from '../components/AdminNav';

interface RolePermission {
  id?: string;
  role: string;
  roleName: string;
  description: string;
  permissions: string[];
}

interface FeatureItem {
  code: string;
  name: string;
}

export default function AdminRBACPermissionsPage() {
  const [roles, setRoles] = useState<RolePermission[]>([]);
  const [features, setFeatures] = useState<FeatureItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedRole, setSavedRole] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiClient.getRBACPermissions();
      setRoles(data.roles);
      setFeatures(data.features);
    } catch {
      /* Fallback demo matrix */
      setFeatures([
        { code: 'SEARCH_VIEW', name: 'Tra cứu & Xem Văn bản QPPL' },
        { code: 'DRAFT_EDIT', name: 'Soạn thảo Văn bản & Hợp đồng' },
        { code: 'REDLINE_AUDIT', name: 'Thẩm định Rủi ro AI Redline' },
        { code: 'WORKFLOW_ADVANCE', name: 'Trình bước & Chuyển luồng duyệt' },
        { code: 'WORKFLOW_FINAL_APPROVE', name: 'Phê duyệt Cuối cùng Dự thảo' },
        { code: 'CONTRACT_MANAGE', name: 'Quản lý Vòng đời Hợp đồng' },
        { code: 'ADMIN_CONFIG', name: 'Cấu hình Động Quy trình Admin' },
        { code: 'AI_BYOK_CONFIG', name: 'Cấu hình AI Provider & BYOK Keys' },
        { code: 'RBAC_MANAGE', name: 'Quản lý Ma trận Phân quyền RBAC' },
      ]);
      setRoles([
        {
          role: 'SUPER_ADMIN', roleName: 'Quản trị viên Cao cấp', description: 'Toàn quyền cấu hình hệ thống',
          permissions: ['SEARCH_VIEW', 'DRAFT_EDIT', 'REDLINE_AUDIT', 'WORKFLOW_ADVANCE', 'WORKFLOW_FINAL_APPROVE', 'CONTRACT_MANAGE', 'ADMIN_CONFIG', 'AI_BYOK_CONFIG', 'RBAC_MANAGE'],
        },
        {
          role: 'LEGAL_HEAD', roleName: 'Trưởng phòng Pháp chế', description: 'Phê duyệt cuối cùng & Quản lý Hợp đồng',
          permissions: ['SEARCH_VIEW', 'DRAFT_EDIT', 'REDLINE_AUDIT', 'WORKFLOW_ADVANCE', 'WORKFLOW_FINAL_APPROVE', 'CONTRACT_MANAGE'],
        },
        {
          role: 'LEGAL_SPECIALIST', roleName: 'Chuyên viên Pháp lý', description: 'Soạn thảo & Thẩm định rủi ro',
          permissions: ['SEARCH_VIEW', 'DRAFT_EDIT', 'REDLINE_AUDIT', 'WORKFLOW_ADVANCE', 'CONTRACT_MANAGE'],
        },
        {
          role: 'BUSINESS_USER', roleName: 'Nhân viên Nghiệp vụ', description: 'Tra cứu văn bản & Khởi tạo dự thảo',
          permissions: ['SEARCH_VIEW', 'DRAFT_EDIT', 'WORKFLOW_ADVANCE'],
        },
      ]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const togglePermission = (roleCode: string, featureCode: string) => {
    setRoles((prev) =>
      prev.map((r) => {
        if (r.role !== roleCode) return r;
        const current = r.permissions || [];
        const updated = current.includes(featureCode)
          ? current.filter((p) => p !== featureCode)
          : [...current, featureCode];
        return { ...r, permissions: updated };
      })
    );
  };

  const handleSaveRole = async (roleCode: string) => {
    const roleObj = roles.find((r) => r.role === roleCode);
    if (!roleObj) return;
    setSaving(true);
    try {
      await apiClient.updateRolePermissions(roleCode, roleObj.permissions);
      setSavedRole(roleCode);
      setTimeout(() => setSavedRole(null), 2000);
    } catch { /* ignore */ }
    setSaving(false);
  };

  return (
    <div>
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        <AdminNav />

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white">Bảng Ma trận Phân quyền Chức năng (RBAC)</h1>
            </div>
            <p className="text-sm text-slate-400">Cấu hình động quyền truy cập tính năng cho từng Vai trò trong doanh nghiệp</p>
          </div>
          <button onClick={load} className="p-2 text-slate-400 hover:bg-slate-950 border border-slate-800 rounded-xl transition">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Feature Permission Matrix Table */}
        <div className="bg-slate-950 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900 border-b border-slate-800 text-slate-200 font-bold">
                  <th className="p-4 w-72">Chức năng / Tính năng hệ thống</th>
                  {roles.map((r) => (
                    <th key={r.role} className="p-4 text-center border-l border-slate-800 min-w-[140px]">
                      <div>
                        <p className="font-bold text-white text-sm">{r.roleName}</p>
                        <p className="text-[10px] font-mono text-indigo-400 font-semibold">{r.role}</p>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {features.map((f) => (
                  <tr key={f.code} className="hover:bg-indigo-950/30 transition">
                    <td className="p-4 font-semibold text-slate-100 flex items-center justify-between gap-2">
                      <span>{f.name}</span>
                      <span className="text-[10px] font-mono text-slate-400 font-normal">{f.code}</span>
                    </td>
                    {roles.map((r) => {
                      const hasPerm = r.permissions?.includes(f.code) || r.role === 'SUPER_ADMIN';
                      const isSuperAdmin = r.role === 'SUPER_ADMIN';
                      return (
                        <td key={r.role} className="p-4 text-center border-l border-slate-800">
                          <button
                            disabled={isSuperAdmin}
                            onClick={() => togglePermission(r.role, f.code)}
                            className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition ${
                              hasPerm
                                ? 'bg-indigo-600 text-white shadow-sm hover:bg-indigo-700'
                                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                            }`}
                          >
                            {hasPerm ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Action Save Row per Role */}
          <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
            <p className="text-xs text-slate-400 font-medium">Nhấn nút bên dưới để lưu cập nhật ma trận phân quyền cho từng vai trò:</p>
            <div className="flex items-center gap-2">
              {roles.filter((r) => r.role !== 'SUPER_ADMIN').map((r) => (
                <button
                  key={r.role}
                  onClick={() => handleSaveRole(r.role)}
                  disabled={saving}
                  className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-xs font-semibold rounded-lg shadow-sm transition"
                >
                  {savedRole === r.role ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                  {savedRole === r.role ? 'Đã lưu!' : `Lưu ${r.roleName}`}
                </button>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
