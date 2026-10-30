import Link from "next/link";
import { format } from "date-fns";
import React from "react";
import {
  FileText, Calendar, Building2, Tag, Landmark,
  Gavel, Scale, ShieldCheck, Library, BookText
} from "lucide-react";
import { displayTitle, displayIssuingBody, hasMeaningfulContent } from "@/lib/data-utils";
import { DOCUMENT_TYPE_LABELS, getValidityStatusInfo } from "@/lib/document-labels";

/**
 * Strip all HTML tags from a string, keeping only plain text and <mark> tags.
 * Then convert to React elements so we never use dangerouslySetInnerHTML.
 */
function stripAllHtml(html: string): string {
  if (!html) return "";
  return html.replace(/<[^>]+>/gi, "");
}

function parseHighlightedHtml(html: string): React.ReactNode {
  if (!html) return null;
  // Step 1: Strip all HTML tags EXCEPT <mark> and </mark>
  const stripped = html.replace(/<(?!\/?mark\b)[^>]+>/gi, "");
  // Step 2: Split by <mark>...</mark> and convert to React elements
  const parts = stripped.split(/(<mark>[\s\S]*?<\/mark>)/gi);
  return parts.map((part, i) => {
    const match = part.match(/^<mark>([\s\S]*?)<\/mark>$/i);
    if (match) {
      return (
        <mark key={i} className="bg-yellow-200/80 text-slate-950 px-0.5 rounded-sm">
          {match[1]}
        </mark>
      );
    }
    return part || null;
  });
}

interface SearchResultCardProps {
  document: {
    id: string;
    title: string;
    documentNumber: string;
    validityStatus: string;
    issuingBody: string;
    documentType: string;
    field?: string;
    trichYeu?: string;
    promulgationDate?: Date | null;
    
    // Meilisearch highlighs and AST match
    _formatted?: {
      title?: string;
      fullText?: string;
      trichYeu?: string;
    };
    astMatch?: {
      id: string;
      nodeType: string;
      heading: string;
      contentSnippet: string;
    } | null;
    vectorScore?: number;
  };
}

const typeIcons: Record<string, typeof FileText> = {
  LUAT: Landmark, NGHI_DINH: Gavel, NGHI_QUYET: Scale,
  THONG_TU: FileText, CHI_THI: ShieldCheck, QUYET_DINH: FileText,
  THONG_TU_LIEN_TICH: Building2, LENH: Library, KHAC: FileText,
};

export function SearchResultCard({ document }: SearchResultCardProps) {
  const TypeIcon = typeIcons[document.documentType] || FileText;
  const typeLabel = DOCUMENT_TYPE_LABELS[document.documentType] || document.documentType;
  const displayBody = displayIssuingBody(document.issuingBody);

  const validityInfo = getValidityStatusInfo(document.validityStatus);
  const v = { label: validityInfo.label, cls: validityInfo.badgeClassName };
  const field = document.field && (document.field !== 'nan') && (document.field !== '') ? document.field : null;

  // Use formatted highlighted text if returned by Meilisearch, else fallback
  const rawHighlightedText = document._formatted?.fullText || document._formatted?.trichYeu || document.trichYeu;
  const showHighlightedText = hasMeaningfulContent(rawHighlightedText);

  // Parse title: strip all HTML for plain text (title highlights from exact match use <mark>)
  const titleContent = document._formatted?.title
    ? parseHighlightedHtml(document._formatted.title)
    : displayTitle(document.title, document.documentNumber);

  return (
    <Link href={`/documents/${document.id}`}>
      <div className="bg-white rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all group cursor-pointer">
        <div className="flex items-start gap-4 p-5">
          {/* Type icon */}
          <div className="w-11 h-11 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-blue-100 transition-colors">
            <TypeIcon className="w-5.5 h-5.5" />
          </div>

          <div className="min-w-0 flex-1">
            {/* Badge row */}
            <div className="flex flex-wrap items-center gap-1.5 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                {typeLabel}
              </span>
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${v.cls}`}>
                {v.label}
              </span>
              {field && (
                <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200 truncate max-w-[140px]">
                  {field}
                </span>
              )}
              {document.vectorScore !== undefined && (
                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200 flex items-center gap-1 ml-auto">
                  Semantic Score: {Math.round(document.vectorScore * 100)}%
                </span>
              )}
            </div>

            {/* Title - rendered as React elements, never dangerouslySetInnerHTML */}
            <h3 className="text-sm font-semibold text-slate-900 group-hover:text-blue-700 transition-colors line-clamp-2 leading-snug">
              {titleContent}
            </h3>

            {/* Highlighted fullText excerpt or trichYeu - rendered as React elements */}
            {showHighlightedText && (
              <div className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed bg-slate-50/60 p-2 rounded-lg border border-slate-100/60 font-normal">
                {parseHighlightedHtml(rawHighlightedText || "")}
              </div>
            )}

            {/* AST detailed terms match - rendered as React elements */}
            {document.astMatch && (
              <div className="mt-3 p-3 bg-blue-50/30 border border-blue-100/40 rounded-lg text-xs">
                <div className="flex items-center gap-1.5 text-blue-800 font-semibold mb-1">
                  <BookText className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Khớp tại {document.astMatch.nodeType}: {stripAllHtml(document.astMatch.heading)}</span>
                </div>
                <div className="text-slate-600 leading-relaxed italic border-l-2 border-blue-200 pl-2 mt-1.5">
                  {parseHighlightedHtml(document.astMatch.contentSnippet)}
                </div>
              </div>
            )}

            {/* Metadata row */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs text-slate-400">
              <span className="font-semibold text-slate-600">
                {document.documentNumber}
              </span>
              {displayBody && (
                <span className="flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  <span className="truncate max-w-[160px]">{displayBody}</span>
                </span>
              )}
              {document.promulgationDate && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {format(new Date(document.promulgationDate), "dd/MM/yyyy")}
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
        </div>
      </div>
    </Link>
  );
}
