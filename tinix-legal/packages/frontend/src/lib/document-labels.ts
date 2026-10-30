/**
 * Single source of truth for CanonicalDocument enum labels/colors.
 *
 * Previously SearchResultCard, DocumentHeader, LegalLineageTree, and
 * search/page.tsx each hand-maintained their own copy of the
 * documentType → label and validityStatus → label/color mappings. That let
 * the mappings drift independently (e.g. one map missing a status the
 * Prisma enum actually has). Import from here instead of redefining locally.
 */

export const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  LUAT: 'Luật',
  NGHI_DINH: 'Nghị định',
  NGHI_QUYET: 'Nghị quyết',
  THONG_TU: 'Thông tư',
  THONG_TU_LIEN_TICH: 'TT Liên tịch',
  CHI_THI: 'Chỉ thị',
  QUYET_DINH: 'Quyết định',
  LENH: 'Lệnh',
  CONG_VAN: 'Công văn',
  PHAP_LENH: 'Pháp lệnh',
  THONG_BAO: 'Thông báo',
  KHAC: 'Khác',
};

export interface ValidityStatusInfo {
  label: string;
  /** bg + text + border, with dark: variants — for pill/badge components. */
  badgeClassName: string;
  /** solid background only — for a small status dot. */
  dotClassName: string;
}

export const VALIDITY_STATUS_INFO: Record<string, ValidityStatusInfo> = {
  CON_HIEU_LUC: {
    label: 'Còn hiệu lực',
    badgeClassName: 'bg-green-100 text-green-800 border-green-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
    dotClassName: 'bg-emerald-500',
  },
  HET_HIEU_LUC: {
    label: 'Hết hiệu lực',
    badgeClassName: 'bg-red-100 text-red-800 border-red-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
    dotClassName: 'bg-rose-500',
  },
  HET_HIEU_LUC_MOT_PHAN: {
    label: 'Hết hiệu lực một phần',
    badgeClassName: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
    dotClassName: 'bg-amber-500',
  },
  CHUA_CO_HIEU_LUC: {
    label: 'Chưa có hiệu lực',
    badgeClassName: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
    dotClassName: 'bg-blue-500',
  },
  NGUNG_HIEU_LUC: {
    label: 'Ngưng hiệu lực',
    badgeClassName: 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700',
    dotClassName: 'bg-slate-500',
  },
  KHONG_XAC_DINH: {
    label: 'Không xác định',
    badgeClassName: 'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800',
    dotClassName: 'bg-slate-400',
  },
};

export function getValidityStatusInfo(status: string | null | undefined): ValidityStatusInfo {
  return (status && VALIDITY_STATUS_INFO[status]) || VALIDITY_STATUS_INFO.KHONG_XAC_DINH;
}

export function getDocumentTypeLabel(documentType: string | null | undefined): string {
  return (documentType && DOCUMENT_TYPE_LABELS[documentType]) || documentType || '';
}
