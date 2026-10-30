import { apiClient } from "@/lib/api-client";
import Link from "next/link";
import { format } from "date-fns";
import {
  FileText, ChevronRight, Calendar, Building2, Tag,
  Landmark, Gavel, Scale, ShieldCheck, Library
} from "lucide-react";
import { displayTitle, displayIssuingBody } from "@/lib/data-utils";

export const dynamic = 'force-dynamic';

const typeIcons: Record<string, typeof FileText> = {
  LUAT: Landmark, NGHI_DINH: Gavel, NGHI_QUYET: Scale,
  THONG_TU: FileText, CHI_THI: ShieldCheck, QUYET_DINH: FileText,
  THONG_TU_LIEN_TICH: Building2, LENH: Library, KHAC: FileText,
};

const typeLabels: Record<string, string> = {
  LUAT: "Luật", NGHI_DINH: "Nghị định", NGHI_QUYET: "Nghị quyết",
  THONG_TU: "Thông tư", THONG_TU_LIEN_TICH: "TT Liên tịch",
  CHI_THI: "Chỉ thị", QUYET_DINH: "Quyết định",
  LENH: "Lệnh", CONG_VAN: "Công văn", KHAC: "Khác",
};

const validityStyles: Record<string, { label: string; cls: string }> = {
  CON_HIEU_LUC:         { label: "Còn hiệu lực",         cls: "bg-green-100 text-green-800 border-green-200" },
  HET_HIEU_LUC:         { label: "Hết hiệu lực",         cls: "bg-red-100 text-red-800 border-red-200" },
  HET_HIEU_LUC_MOT_PHAN:{ label: "Hết hiệu lực một phần",cls: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  CHUA_CO_HIEU_LUC:     { label: "Chưa có hiệu lực",     cls: "bg-blue-100 text-blue-800 border-blue-200" },
  NGUNG_HIEU_LUC:       { label: "Ngưng hiệu lực",       cls: "bg-slate-100 text-slate-800 border-slate-200" },
  KHONG_XAC_DINH:       { label: "Không xác định",       cls: "bg-slate-50 text-slate-500 border-slate-200" },
};

export default async function VanBanMoiPage() {
  const docs = await apiClient.getRecentDocuments(30);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">Văn bản mới nhất</h1>
        <p className="text-slate-500 text-sm">
          Danh sách 30 văn bản pháp luật được ban hành gần đây nhất
        </p>
      </div>

      <div className="space-y-3">
        {docs.map((doc) => {
          const TypeIcon = typeIcons[doc.documentType] || FileText;
          const st = validityStyles[doc.validityStatus] || validityStyles.KHONG_XAC_DINH;
          const displayBody = displayIssuingBody(doc.issuingBody);
          const field = doc.field && doc.field !== 'nan' && doc.field !== '' ? doc.field : null;

          return (
            <Link
              key={doc.id}
              href={`/documents/${doc.id}`}
              className="bg-white rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all group flex items-start gap-4 p-5"
            >
              <div className="w-11 h-11 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-blue-100 transition-colors">
                <TypeIcon className="w-5.5 h-5.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                    {typeLabels[doc.documentType] || doc.documentType}
                  </span>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${st.cls}`}>
                    {st.label}
                  </span>
                  {field && (
                    <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200 truncate max-w-[140px]">
                      {field}
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-semibold text-slate-900 group-hover:text-blue-700 transition-colors line-clamp-2 leading-snug">
                  {displayTitle(doc.title, doc.documentNumber)}
                </h3>
                {doc.trichYeu && doc.trichYeu !== 'nan' && (
                  <p className="text-xs text-slate-400 mt-1.5 line-clamp-1 leading-relaxed">{doc.trichYeu}</p>
                )}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2.5 text-xs text-slate-400">
                  <span className="font-semibold text-slate-600">{doc.documentNumber}</span>
                  {displayBody && (
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      <span className="truncate max-w-[160px]">{displayBody}</span>
                    </span>
                  )}
                  {doc.promulgationDate && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(doc.promulgationDate), "dd/MM/yyyy")}
                    </span>
                  )}
                  {field && (
                    <span className="flex items-center gap-1 text-slate-400">
                      <Tag className="w-3 h-3" />
                      <span className="truncate max-w-[120px]">{field}</span>
                    </span>
                  )}
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors flex-shrink-0 mt-2" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
