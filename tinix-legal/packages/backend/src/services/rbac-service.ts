/**
 * RBACService
 * Quản lý Ma trận Phân quyền Chức năng (Feature Permission Matrix)
 * và kiểm tra quyền của từng vai trò trong hệ thống Tinix Legal.
 */
import { prisma } from '../infrastructure/db.js';

export interface RolePermissionDTO {
  id?: string;
  role: string;
  roleName: string;
  description: string;
  permissions: string[];
}

export const ALL_FEATURES = [
  { code: 'SEARCH_VIEW', name: 'Tra cứu & Xem Văn bản QPPL' },
  { code: 'DRAFT_EDIT', name: 'Soạn thảo Văn bản & Hợp đồng' },
  { code: 'REDLINE_AUDIT', name: 'Thẩm định Rủi ro AI Redline' },
  { code: 'WORKFLOW_ADVANCE', name: 'Trình bước & Chuyển luồng duyệt' },
  { code: 'WORKFLOW_FINAL_APPROVE', name: 'Phê duyệt Cuối cùng Dự thảo' },
  { code: 'CONTRACT_MANAGE', name: 'Quản lý Vòng đời Hợp đồng' },
  { code: 'ADMIN_CONFIG', name: 'Cấu hình Động Quy trình Admin' },
  { code: 'AI_BYOK_CONFIG', name: 'Cấu hình AI Provider & BYOK Keys' },
  { code: 'RBAC_MANAGE', name: 'Quản lý Ma trận Phân quyền RBAC' },
  { code: 'RADAR_MANAGE', name: 'Quản lý Cấu hình Radar Tuân thủ' },
];

export class RBACService {
  /** Lấy danh sách tất cả vai trò và ma trận phân quyền */
  static async getAllRolePermissions(): Promise<RolePermissionDTO[]> {
    const roles = await prisma.rolePermission.findMany({
      orderBy: { role: 'asc' },
    });

    return roles.map((r) => ({
      id: r.id,
      role: r.role,
      roleName: r.roleName,
      description: r.description,
      permissions: r.permissions as string[],
    }));
  }

  /** Cập nhật mảng quyền cho một vai trò */
  static async updateRolePermissions(role: string, permissions: string[]) {
    return prisma.rolePermission.update({
      where: { role },
      data: {
        permissions: permissions as unknown as Parameters<typeof prisma.rolePermission.update>[0]['data']['permissions'],
      },
    });
  }

  /** Kiểm tra một vai trò có quyền thực hiện tính năng hay không */
  static async checkPermission(role: string, featureCode: string): Promise<boolean> {
    if (role === 'SUPER_ADMIN') return true;
    const roleConfig = await prisma.rolePermission.findUnique({ where: { role } });
    if (!roleConfig) return false;
    const permissions = roleConfig.permissions as string[];
    return permissions.includes(featureCode);
  }
}
