/**
 * ContractAddendumService
 * Quản lý cây Phụ lục Hợp đồng (Addendum Hierarchy Tree) và so sánh phiên bản (Track Changes Diff).
 */
import { prisma } from '../infrastructure/db.js';

export class ContractAddendumService {
  /** Lấy danh sách cây Phụ lục của một Hợp đồng */
  static async getAddendumsByContractId(contractId: string) {
    return prisma.contractAddendum.findMany({
      where: { contractId },
      include: { childAddendums: true, parentAddendum: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  /** Tạo mới một Phụ lục Hợp đồng và cập nhật Hợp đồng gốc */
  static async createAddendum(data: {
    contractId: string;
    parentId?: string;
    title: string;
    addendumNumber: string;
    valueAdjustment?: number;
    dateAdjustment?: string;
    notes?: string;
  }) {
    const addendum = await prisma.contractAddendum.create({
      data: {
        contractId: data.contractId,
        parentId: data.parentId ?? null,
        title: data.title,
        addendumNumber: data.addendumNumber,
        valueAdjustment: data.valueAdjustment ?? null,
        dateAdjustment: data.dateAdjustment ? new Date(data.dateAdjustment) : null,
        notes: data.notes ?? '',
      },
    });

    // Cập nhật giá trị hoặc ngày kết thúc mới cho Hợp đồng gốc nếu có điều chỉnh
    if (data.valueAdjustment || data.dateAdjustment) {
      const contract = await prisma.contractMaster.findUnique({ where: { id: data.contractId } });
      if (contract) {
        const newCost = data.valueAdjustment
          ? (contract.contractValue || 0) + data.valueAdjustment
          : contract.contractValue;
        const newEnd = data.dateAdjustment ? new Date(data.dateAdjustment) : contract.endDate;

        await prisma.contractMaster.update({
          where: { id: data.contractId },
          data: {
            contractValue: newCost,
            endDate: newEnd,
          },
        });
      }
    }

    return addendum;
  }

  /** So sánh Diff giữa 2 phiên bản Phụ lục / Hợp đồng */
  static async compareVersions(v1Id: string, v2Id: string) {
    const [v1, v2] = await Promise.all([
      prisma.contractAddendum.findUnique({ where: { id: v1Id } }),
      prisma.contractAddendum.findUnique({ where: { id: v2Id } }),
    ]);

    return {
      v1Title: v1?.title || 'Hợp đồng gốc',
      v2Title: v2?.title || 'Phụ lục mới',
      differences: [
        { field: 'Giá trị hợp đồng', oldVal: v1?.valueAdjustment ?? 0, newVal: v2?.valueAdjustment ?? 0 },
        { field: 'Thời hạn hết hiệu lực', oldVal: v1?.dateAdjustment?.toISOString() ?? 'N/A', newVal: v2?.dateAdjustment?.toISOString() ?? 'N/A' },
      ],
      trackChangesHtml: `<p>Nội dung hợp đồng được sửa đổi bổ sung: <del class="bg-red-100 text-red-700">Giá trị cũ ${v1?.valueAdjustment || 0}</del> <ins class="bg-green-100 text-green-700">Giá trị mới ${v2?.valueAdjustment || 0}</ins></p>`,
    };
  }
}
