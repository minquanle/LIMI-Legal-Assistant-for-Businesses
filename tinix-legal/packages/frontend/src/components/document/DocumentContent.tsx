import { AlertTriangle } from "lucide-react";
import { LegalDocumentViewer } from "./LegalDocumentViewer";
import { ParsedNode } from "@tinix-legal/shared";

interface DocumentContentProps {
  fullText: string;
  astNodes: ParsedNode[];
  documentTitle?: string;
  documentNumber?: string;
  issuingBody?: string;
  promulgationDate?: Date | null;
}

function isNan(v: string | null | undefined): boolean {
  return !v || v.trim() === "" || v === "nan" || v === "null" || v.trim().length <= 3;
}

export function DocumentContent({
  fullText,
  astNodes,
  documentTitle,
  documentNumber,
  issuingBody,
  promulgationDate,
}: DocumentContentProps) {
  const hasRealText = fullText && !isNan(fullText);

  // Check if AST nodes have real substantial body content
  const substantialAstNodes = astNodes ? astNodes.filter(n => {
    if (!n.content || n.content.trim().length < 15) return false;
    const cleanContent = n.content.trim().toLowerCase();
    const cleanHeading = (n.heading || "").trim().toLowerCase();
    if (cleanContent === cleanHeading || cleanContent === `điều ${n.ordinal}`) return false;
    return true;
  }) : [];

  const hasSubstantialAst = substantialAstNodes.length > 0;

  if (!hasSubstantialAst && !hasRealText) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
        <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto mb-4" />
        <h3 className="text-base font-semibold text-slate-900 mb-1">Nội dung văn bản chưa được cập nhật</h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          Văn bản này có trong hệ thống nhưng nội dung chi tiết chưa được trích xuất từ nguồn dữ liệu.
        </p>
      </div>
    );
  }

  return (
    <LegalDocumentViewer
      fullText={fullText}
      astNodes={astNodes}
      documentTitle={documentTitle}
      documentNumber={documentNumber}
      issuingBody={issuingBody}
      promulgationDate={promulgationDate}
    />
  );
}
