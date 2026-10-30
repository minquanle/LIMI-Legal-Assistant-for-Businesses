"use client";

import { useMemo, useState } from "react";
import { parseLegalText, ParsedLegalDocument, ParsedNode } from "@tinix-legal/shared";
import { FileText, CheckCircle2, Type, ZoomIn, ZoomOut, AlignLeft } from "lucide-react";
import { cn } from "@/lib/utils";

function isMarkdownTable(text: string): boolean {
  if (!text) return false;
  const trimmed = text.trim();
  return trimmed.startsWith('|') && trimmed.endsWith('|') && trimmed.includes('\n');
}

interface ContentBlock {
  type: 'paragraph' | 'table';
  text: string;
}

function parseContentBlocks(text: string): ContentBlock[] {
  if (!text) return [];
  const lines = text.split('\n');
  const blocks: ContentBlock[] = [];
  let currentTableLines: string[] = [];
  let currentParagraphLines: string[] = [];
  
  const flushParagraph = () => {
    if (currentParagraphLines.length > 0) {
      blocks.push({
        type: 'paragraph',
        text: currentParagraphLines.join('\n').trim()
      });
      currentParagraphLines = [];
    }
  };
  
  const flushTable = () => {
    if (currentTableLines.length > 0) {
      blocks.push({
        type: 'table',
        text: currentTableLines.join('\n')
      });
      currentTableLines = [];
    }
  };
  
  for (const line of lines) {
    const trimmed = line.trim();
    const isTableLine = trimmed.startsWith('|') && trimmed.endsWith('|');
    
    if (isTableLine) {
      flushParagraph();
      currentTableLines.push(line);
    } else {
      flushTable();
      if (trimmed.length > 0) {
        currentParagraphLines.push(line);
      } else {
        flushParagraph();
      }
    }
  }
  
  flushParagraph();
  flushTable();
  
  return blocks.filter(b => b.text.length > 0);
}

function renderMarkdownTable(text: string) {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length < 2) return <span>{text}</span>;
  
  const rows = lines.map(line => {
    const parts = line.split('|');
    if (parts[0] === '') parts.shift();
    if (parts[parts.length - 1] === '') parts.pop();
    return parts.map(p => p.trim());
  });
  
  const isSeparator = (row: string[]) => row.every(cell => /^[:-]+$/.test(cell));
  const separatorIdx = rows.findIndex(isSeparator);
  
  const headerRow = separatorIdx > 0 ? rows[0] : null;
  const dataRows = separatorIdx >= 0 
    ? rows.filter((_, idx) => idx !== separatorIdx && (headerRow ? idx !== 0 : true))
    : rows;
    
  return (
    <div className="overflow-x-auto my-6 border border-slate-200 rounded-lg shadow-sm">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        {headerRow && (
          <thead className="bg-slate-50 font-semibold text-slate-900">
            <tr>
              {headerRow.map((cell, idx) => (
                <th key={idx} className="px-4 py-3 text-left border-r border-slate-200 last:border-r-0">
                  {cell}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody className="divide-y divide-slate-200 bg-white text-slate-700">
          {dataRows.map((row, rowIdx) => (
            <tr key={rowIdx} className="hover:bg-slate-50/50">
              {row.map((cell, cellIdx) => (
                <td key={cellIdx} className="px-4 py-2.5 border-r border-slate-100 last:border-r-0 max-w-xs break-words">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface LegalDocumentViewerProps {
  fullText: string;
  astNodes?: ParsedNode[];
  documentTitle?: string;
  documentNumber?: string;
  issuingBody?: string;
  promulgationDate?: Date | null;
}

export function LegalDocumentViewer({
  fullText,
  astNodes,
  documentTitle,
  documentNumber,
  issuingBody,
  promulgationDate,
}: LegalDocumentViewerProps) {
  const [useSerif, setUseSerif] = useState(false);
  const [fontSize, setFontSize] = useState<"sm" | "base" | "lg">("base");

  const parsedDoc = useMemo<ParsedLegalDocument>(() => {
    return parseLegalText(fullText);
  }, [fullText]);

  const finalAstNodes = astNodes && astNodes.length > 0 ? astNodes : parsedDoc.astNodes;

  // A persisted AST (from the DB, possibly a corrected one) proves the
  // document DOES have a valid Điều/Khoản/Điểm structure even if a fresh
  // re-parse of fullText disagrees (e.g. the regex parser's heuristics
  // changed since ingest, or this render's fullText differs slightly) — so
  // don't force the plain-paragraph fallback mode in that case.
  const effectivelyParsed = parsedDoc.isParsed || (!!astNodes && astNodes.length > 0);

  const tocNodesList = useMemo(() => {
    const list: ParsedNode[] = [];
    function traverse(node: ParsedNode) {
      list.push(node);
      if (node.children) node.children.forEach(traverse);
    }
    if (finalAstNodes) finalAstNodes.forEach(traverse);
    return list;
  }, [finalAstNodes]);

  const paragraphsWithIds = useMemo(() => {
    const list: { text: string; id?: string; type?: string; isHeading?: boolean }[] = [];
    function traverse(node: ParsedNode) {
      if (node.heading) {
        list.push({ text: node.heading, id: node.id, type: node.nodeType, isHeading: true });
      }
      
      let textContent = node.content;
      if (textContent) {
        if (node.nodeType === "KHOAN") {
          textContent = `${node.ordinal}. ${textContent}`;
        } else if (node.nodeType === "DIEM") {
          textContent = `${node.ordinal}) ${textContent}`;
        }
        list.push({ text: textContent, id: node.heading ? undefined : node.id, type: node.nodeType, isHeading: false });
      }
      
      if (node.children) node.children.forEach(traverse);
    }
    
    if (finalAstNodes && finalAstNodes.length > 0) {
      finalAstNodes.forEach(traverse);
    } else if (parsedDoc.rawBodyText) {
      list.push({ text: parsedDoc.rawBodyText, isHeading: false });
    }
    
    return list;
  }, [finalAstNodes, parsedDoc.rawBodyText]);

  const fontSizeClasses = {
    sm: "text-xs md:text-sm leading-relaxed",
    base: "text-sm md:text-base leading-relaxed md:leading-loose",
    lg: "text-base md:text-lg leading-loose",
  };

  if (!effectivelyParsed) {
    const paragraphs = fullText
      .split(/\n+/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex items-center justify-between text-xs text-slate-600 flex-wrap gap-3">
          <div className="flex items-center gap-2 font-medium">
            <FileText className="w-4 h-4 text-blue-600" />
            <span>Chế độ đọc văn bản</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setUseSerif(!useSerif)}
              className={`px-2.5 py-1 rounded border transition-colors flex items-center gap-1 ${
                useSerif ? "bg-blue-50 text-blue-700 border-blue-200 font-serif font-bold" : "bg-white text-slate-700 border-slate-200"
              }`}
            >
              <Type className="w-3.5 h-3.5" />
              <span>{useSerif ? "Serif" : "Sans"}</span>
            </button>
            <div className="flex items-center border border-slate-200 rounded bg-white overflow-hidden">
              <button
                onClick={() => setFontSize(fontSize === "lg" ? "base" : "sm")}
                className="px-2 py-1 text-slate-600 hover:bg-slate-100"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 font-semibold text-slate-700 text-[11px] uppercase">{fontSize}</span>
              <button
                onClick={() => setFontSize(fontSize === "sm" ? "base" : "lg")}
                className="px-2 py-1 text-slate-600 hover:bg-slate-100"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
        <div className={`p-6 md:p-10 text-slate-800 ${useSerif ? "font-serif" : "font-sans"} ${fontSizeClasses[fontSize]}`}>
          {paragraphs.map((para, i) => (
            <p key={i} className="mb-4 text-justify indent-6">
              {para}
            </p>
          ))}
        </div>
      </div>
    );
  }

  const { header, docType, docSubject, preambles, enactingClause, footer } = parsedDoc;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex items-center justify-between text-xs text-slate-600 flex-wrap gap-3 print:hidden">
        <div className="flex items-center gap-2 font-medium text-slate-700">
          <AlignLeft className="w-4 h-4 text-blue-600" />
          <span>Văn bản trình bày chuẩn quy phạm pháp luật</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setUseSerif(!useSerif)}
            className={`px-2.5 py-1 rounded border transition-colors flex items-center gap-1 ${
              useSerif ? "bg-blue-600 text-white border-blue-600 font-serif font-semibold" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
            }`}
          >
            <Type className="w-3.5 h-3.5" />
            <span>{useSerif ? "Font Có chân (Serif)" : "Font Không chân (Sans)"}</span>
          </button>
          <div className="flex items-center border border-slate-200 rounded bg-white overflow-hidden">
            <button
              onClick={() => setFontSize(fontSize === "lg" ? "base" : "sm")}
              className="px-2.5 py-1 text-slate-600 hover:bg-slate-100 border-r border-slate-200"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-2.5 font-semibold text-slate-700 text-[11px] uppercase">{fontSize}</span>
            <button
              onClick={() => setFontSize(fontSize === "sm" ? "base" : "lg")}
              className="px-2.5 py-1 text-slate-600 hover:bg-slate-100 border-l border-slate-200"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <div className={`p-6 md:p-12 text-slate-900 ${useSerif ? "font-serif" : "font-sans"} ${fontSizeClasses[fontSize]}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-slate-200 text-center md:text-left">
          <div className="flex flex-col items-center md:items-start justify-start">
            <div className="font-bold uppercase tracking-wider text-slate-900 text-sm md:text-base">
              {issuingBody || header?.issuingBody || "ỦY BAN NHÂN DÂN"}
            </div>
            <div className="text-xs md:text-sm font-semibold text-slate-700 mt-1">
              Số: {documentNumber || header?.documentNumber || "..."}
            </div>
            <div className="w-24 h-0.5 bg-slate-400 mt-2 rounded-full" />
          </div>
          <div className="flex flex-col items-center md:items-end justify-start text-center md:text-right">
            <div className="font-bold uppercase tracking-wider text-slate-900 text-sm md:text-base">
              CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
            </div>
            <div className="font-bold text-slate-800 text-xs md:text-sm mt-0.5">
              Độc lập - Tự do - Hạnh phúc
            </div>
            <div className="w-32 h-0.5 bg-slate-400 mt-2 rounded-full mx-auto md:mr-0" />
            <div className="text-xs md:text-sm italic text-slate-600 font-medium">
              {promulgationDate
                ? `Hà Nội, ngày ${new Date(promulgationDate).getDate().toString().padStart(2, '0')} tháng ${(new Date(promulgationDate).getMonth() + 1).toString().padStart(2, '0')} năm ${new Date(promulgationDate).getFullYear()}`
                : header?.locationDate || "Hà Nội, ngày ... tháng ... năm ..."}
            </div>
          </div>
        </div>

        <div className="py-8 text-center space-y-3">
          {docType && (
            <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-wider uppercase">
              {docType}
            </h2>
          )}
          {/* A real document subject/title is a short single line (well under
              300 chars). When the parser misfires and sweeps a chunk of the
              actual body text into docSubject, forcing it into a centered
              uppercase H1 makes several paragraphs of legal text unreadable.
              Fall back to normal left-justified body typography instead. */}
          {docSubject && docSubject.length <= 300 ? (
            <h1 className="text-base md:text-xl font-bold text-slate-800 max-w-3xl mx-auto uppercase leading-relaxed">
              {docSubject}
            </h1>
          ) : docSubject ? (
            <p className="text-sm md:text-base text-slate-800 text-justify indent-6 leading-relaxed">
              {docSubject}
            </p>
          ) : null}
        </div>

        {preambles && preambles.length > 0 && (
          <div className="mb-8 space-y-2 pl-4 border-l-2 border-blue-400/80 bg-blue-50/30 py-3 pr-4 rounded-r-lg">
            {preambles.map((pre, idx) => (
              <div key={idx} className="italic text-slate-700 leading-relaxed text-sm md:text-base">
                {pre}{pre.endsWith(";") || pre.endsWith(".") ? "" : ";"}
              </div>
            ))}
          </div>
        )}

        {enactingClause && (
          <div className="mb-8 font-medium text-slate-900 indent-6 leading-relaxed">
            {enactingClause}
          </div>
        )}

        {/* ── 4. RAW BODY CONTENT (Nội dung chi tiết) ── */}
        <div className="my-6">
          {paragraphsWithIds && paragraphsWithIds.length > 0 ? (
            paragraphsWithIds.map((item, index) => {
              const blocks = parseContentBlocks(item.text);
              const isPhanOrChuong = item.isHeading && (item.type === "PHAN" || item.type === "CHUONG" || item.type === "PHU_LUC");
              const isMuc = item.isHeading && item.type === "MUC";
              
              return (
                <div key={index} id={item.id} className={cn(
                  item.id && "scroll-mt-24",
                  isPhanOrChuong ? "mt-12 mb-6" : isMuc ? "mt-8 mb-4" : "mt-4 mb-3"
                )}>
                  {blocks.map((block, bIdx) => {
                    if (block.type === 'table') {
                      return (
                        <div key={bIdx} className="w-full overflow-hidden">
                          {renderMarkdownTable(block.text)}
                        </div>
                      );
                    }
                    return (
                      <p
                        key={bIdx}
                        className={cn(
                          "leading-relaxed mb-3",
                          isPhanOrChuong
                            ? "text-center font-extrabold text-lg md:text-xl text-blue-950 uppercase tracking-wide"
                            : isMuc
                            ? "text-center font-bold text-base md:text-lg text-slate-800"
                            : item.isHeading
                            ? "font-bold text-blue-950 text-left"
                            : "text-justify indent-6"
                        )}
                      >
                        {block.text}
                      </p>
                    );
                  })}
                </div>
              );
            })
          ) : (
            <div className="text-center text-slate-500 italic py-8 border border-dashed border-slate-200 rounded-lg bg-slate-50/50">
              Chưa có nội dung chi tiết
            </div>
          )}
        </div>

        <div className="mt-12 pt-8 border-t-2 border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <div>
            <div className="font-bold text-xs md:text-sm text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
              <span>Nơi nhận:</span>
            </div>
            {footer?.recipients && footer.recipients.length > 0 ? (
              <ul className="text-xs md:text-sm text-slate-700 space-y-1 pl-2">
                {footer.recipients.map((rec, rIdx) => (
                  <li key={rIdx} className="flex items-start gap-1">
                    <span className="text-slate-400">-</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-xs text-slate-400 italic">Như trên</div>
            )}
          </div>

          <div className="text-center flex flex-col items-center justify-center md:items-end md:text-right">
            {footer?.signerPrefix && (
              <div className="font-bold uppercase tracking-wider text-slate-900 text-sm md:text-base mb-1">
                {footer.signerPrefix}
              </div>
            )}
            <div className="font-bold uppercase tracking-wider text-slate-900 text-sm md:text-base">
              {footer?.signerRole || footer?.signerTitle || "NGƯỜI KÝ"}
            </div>
            {footer?.signerSignedMark && (
              <div className="text-xs italic text-blue-600 font-medium my-2 px-3 py-1 bg-blue-50/80 rounded-full border border-blue-200 inline-block">
                {footer.signerSignedMark.replace(/\[(daky|đã ký)\]/gi, 'Đã ký').replace(/\(\s*Đã ký\s*\)/gi, 'Đã ký')}
              </div>
            )}
            <div className="font-bold text-slate-900 text-sm md:text-base mt-8 md:mt-12">
              {footer?.signerName || ""}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
