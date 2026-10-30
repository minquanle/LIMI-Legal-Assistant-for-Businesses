import { format } from "date-fns";
import { Calendar, Building2, FileText, Clock, ShieldCheck, Tag, BookText, Landmark, Gavel, Scale, Library, User, Globe, AlertCircle } from "lucide-react";
import { displayValue, displayTitle, displayIssuingBody, hasMeaningfulContent, extractDocNumber } from "@/lib/data-utils";
import { DOCUMENT_TYPE_LABELS, getValidityStatusInfo } from "@/lib/document-labels";
import { WatchlistButton } from "./WatchlistButton";

interface DocumentHeaderProps {
  document: {
    id: string;
    title: string;
    documentNumber: string;
    validityStatus: string;
    issuingBody: string;
    documentType: string;
    field?: string;
    trichYeu?: string;
    issuingBodyCode?: string;
    promulgationDate?: Date | null;
    effectiveDate?: Date | null;
    expiryDate?: Date | null;
    gazetteNumber?: string;
    gazetteDate?: Date | null;
    signer?: string;
    isConsolidated?: boolean;
  };
}

function uc(value: string | null | undefined, fallback = "Đang cập nhật"): string {
  const v = displayValue(value || "", "");
  return v || fallback;
}

export function DocumentHeader({ document }: DocumentHeaderProps) {
  const displayBody = displayIssuingBody(document.issuingBody);
  const hasGoodTitle = hasMeaningfulContent(document.title);
  const displayField = displayValue(document.field || "", "");
  const hasTrichYeu = hasMeaningfulContent(document.trichYeu);
  const typeLabel = DOCUMENT_TYPE_LABELS[document.documentType] || displayValue(document.documentType);
  const validityInfo = getValidityStatusInfo(document.validityStatus);
  const validityLabel = validityInfo.label;
  const signer = displayValue(document.signer || "", "");
  const gazetteNum = displayValue(document.gazetteNumber || "", "");
  const realDocNumber = extractDocNumber(document.documentNumber, document.title);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-blue-700 via-yellow-400 to-blue-700" />

      <div className="p-6 md:p-8">
        {/* ── BADGES ── */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
            {typeLabel}
          </span>
          <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full border ${validityInfo.badgeClassName}`}>
            {document.validityStatus === "CON_HIEU_LUC" || document.validityStatus === "HET_HIEU_LUC" ? (
              <ShieldCheck className="w-3 h-3" />
            ) : (
              <Clock className="w-3 h-3" />
            )}
            {validityLabel}
          </span>
          {displayField && (
            <span className="text-[11px] text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
              {displayField}
            </span>
          )}
          {document.isConsolidated && (
            <span className="text-[11px] text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200">
              Hợp nhất
            </span>
          )}
        </div>

        {/* ── TITLE ── */}
        <div className="flex justify-between items-start gap-4">
          {hasGoodTitle && (
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 leading-tight mb-2 flex-1">
              {displayTitle(document.title, realDocNumber)}
            </h1>
          )}
          <WatchlistButton documentId={document.id} />
        </div>

        {/* ── INFO TABLE (vbpl.vn style) ── */}
        <div className="border border-slate-200 rounded-lg overflow-hidden mt-5">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-slate-200">
              {/* Row 1: Cơ quan ban hành | Số công báo */}
              <tr className="even:bg-slate-50/50">
                <td className="w-[160px] px-4 py-3 text-slate-500 font-medium whitespace-nowrap">Cơ quan ban hành:</td>
                <td className="px-4 py-3 text-slate-800 font-semibold">{displayBody || "Đang cập nhật"}</td>
                <td className="w-[160px] px-4 py-3 text-slate-500 font-medium whitespace-nowrap">Số công báo:</td>
                <td className="px-4 py-3 text-slate-600">{gazetteNum || <span className="text-slate-400 italic">Đang cập nhật</span>}</td>
              </tr>

              {/* Row 2: Số hiệu | Ngày đăng công báo */}
              <tr className="even:bg-slate-50/50">
                <td className="px-4 py-3 text-slate-500 font-medium whitespace-nowrap">Số hiệu:</td>
                <td className="px-4 py-3 text-slate-800 font-semibold">{uc(realDocNumber)}</td>
                <td className="px-4 py-3 text-slate-500 font-medium whitespace-nowrap">Ngày đăng công báo:</td>
                <td className="px-4 py-3 text-slate-600">
                  {document.gazetteDate
                    ? format(new Date(document.gazetteDate), "dd/MM/yyyy")
                    : <span className="text-slate-400 italic">Đang cập nhật</span>}
                </td>
              </tr>

              {/* Row 3: Loại văn bản | Người ký */}
              <tr className="even:bg-slate-50/50">
                <td className="px-4 py-3 text-slate-500 font-medium whitespace-nowrap">Loại văn bản:</td>
                <td className="px-4 py-3 text-slate-800 font-semibold">{typeLabel}</td>
                <td className="px-4 py-3 text-slate-500 font-medium whitespace-nowrap">Người ký:</td>
                <td className="px-4 py-3 text-slate-600">
                  {signer ? (
                    <span className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      {signer}
                    </span>
                  ) : (
                    <span className="text-slate-400 italic">Đang cập nhật</span>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ── TRÍCH YẾU (full width) ── */}
        {hasTrichYeu && (
          <div className="mt-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Trích yếu</span>
            <p className="text-sm text-slate-700 mt-1 leading-relaxed">{document.trichYeu}</p>
          </div>
        )}

        {/* ── METADATA ROW 2 ── */}
        <div className="border border-slate-200 rounded-lg overflow-hidden mt-3">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-slate-200">
              {/* Row 1: Ngày ban hành | Ngày hết hiệu lực */}
              <tr className="even:bg-slate-50/50">
                <td className="w-[160px] px-4 py-3 text-slate-500 font-medium whitespace-nowrap">Ngày ban hành:</td>
                <td className="px-4 py-3 text-slate-800 font-semibold">
                  {document.promulgationDate
                    ? format(new Date(document.promulgationDate), "dd/MM/yyyy")
                    : <span className="text-slate-400 italic">Đang cập nhật</span>}
                </td>
                <td className="w-[160px] px-4 py-3 text-slate-500 font-medium whitespace-nowrap">Ngày hết hiệu lực:</td>
                <td className="px-4 py-3 text-slate-600">
                  {document.expiryDate
                    ? format(new Date(document.expiryDate), "dd/MM/yyyy")
                    : <span className="text-slate-400 italic">Đang cập nhật</span>}
                </td>
              </tr>

              {/* Row 2: Ngày hiệu lực | Tình trạng hiệu lực */}
              <tr className="even:bg-slate-50/50">
                <td className="px-4 py-3 text-slate-500 font-medium whitespace-nowrap">Ngày hiệu lực:</td>
                <td className="px-4 py-3 text-slate-800 font-semibold">
                  {document.effectiveDate
                    ? format(new Date(document.effectiveDate), "dd/MM/yyyy")
                    : <span className="text-slate-400 italic font-normal">Đang cập nhật</span>}
                </td>
                <td className="px-4 py-3 text-slate-500 font-medium whitespace-nowrap">Tình trạng hiệu lực:</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 text-sm font-semibold ${
                    document.validityStatus === "CON_HIEU_LUC" ? "text-green-700" :
                    document.validityStatus === "HET_HIEU_LUC" ? "text-red-600" :
                    "text-slate-500"
                  }`}>
                    {document.validityStatus === "CON_HIEU_LUC" ? (
                      <ShieldCheck className="w-3.5 h-3.5" />
                    ) : document.validityStatus === "HET_HIEU_LUC" ? (
                      <AlertCircle className="w-3.5 h-3.5" />
                    ) : null}
                    {validityLabel}
                  </span>
                </td>
              </tr>

              {/* Row 3: Lĩnh vực (full width) */}
              <tr className="even:bg-slate-50/50">
                <td className="px-4 py-3 text-slate-500 font-medium whitespace-nowrap">Lĩnh vực:</td>
                <td colSpan={3} className="px-4 py-3">
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-amber-800 bg-amber-50 px-2.5 py-1 rounded-md">
                    <Tag className="w-3.5 h-3.5" />
                    {displayField || <span className="text-slate-400 italic">Đang cập nhật</span>}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
