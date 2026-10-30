import { apiClient } from "@/lib/api-client";
import { notFound } from "next/navigation";
import { DocumentHeader } from "@/components/document/DocumentHeader";
import { DocumentToC } from "@/components/document/DocumentToC";
import { DocumentContent } from "@/components/document/DocumentContent";
import { DocumentRelationships } from "@/components/document/DocumentRelationships";
import { DocumentRelationshipGraph } from "@/components/document/DocumentRelationshipGraph";
import { parseLegalText } from "@tinix-legal/shared";
import { LegalLineageTree } from "@/components/documents/LegalLineageTree";
import { DocumentTabs } from "@/components/document/DocumentTabs";
import { FileText, Globe, ExternalLink, Calendar } from "lucide-react";
import { format } from "date-fns";

export default async function DocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Legal Document View page

  const document = await apiClient.getDocumentById(id);

  if (!document) {
    notFound();
  }

  const { astNodes: dbAstNodes, incomingRelations = [], outgoingRelations = [], sources = [], ...meta } = document as any;

  // Use pre-saved AST structure from database if available (especially for LLM-corrected TOCs),
  // otherwise fallback to on-the-fly parsing.
  let astNodes: any[] = [];
  if (document.ast && typeof document.ast === 'object' && !Array.isArray(document.ast)) {
    const astJson = document.ast as any;
    if (Array.isArray(astJson.astNodes) && astJson.astNodes.length > 0) {
      astNodes = astJson.astNodes;
    }
  }

  if (astNodes.length === 0) {
    const parsedDoc = parseLegalText(document.fullText || "");
    astNodes = parsedDoc.isParsed ? parsedDoc.astNodes : [];
  }

  const formattedAstNodes = astNodes.map(node => ({
    id: node.id || node.title || '',
    nodeType: node.nodeType || node.type || 'SECTION',
    ordinal: node.ordinal || '',
    heading: node.heading || node.title || '',
    content: node.content || '',
    depth: node.depth || 0,
    path: node.path || node.id || '',
    children: node.children || [],
  }));


  const sourceLabels: Record<string, string> = {
    VBPL: "Cổng VBPL Quốc gia",
    THUVIENPHAPLUAT: "Thư Viện Pháp Luật",
    LUATVIETNAM: "Luật Việt Nam",
    PHAPDIEN: "Pháp Điển",
    CHINHPHU: "Cổng Chính Phủ",
    VANBANPHAPLUAT: "Văn Bản Pháp Luật",
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <DocumentHeader document={meta} />

      <div className="grid grid-cols-12 gap-8 mt-8">
        {/* Sidebar */}
        <div className="col-span-12 md:col-span-3">
          <div className="sticky top-4 space-y-6">
            {/* Table of Contents */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <h3 className="font-bold text-sm text-slate-900 mb-4 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                MỤC LỤC
              </h3>
              <DocumentToC astNodes={formattedAstNodes} fullText={document.fullText} />
            </div>

            {/* Nguồn trích xuất */}
            {sources && sources.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                <h3 className="font-bold text-sm text-slate-900 mb-3 uppercase tracking-wider flex items-center gap-2">
                  <Globe className="w-4 h-4 text-blue-600" />
                  NGUỒN
                </h3>
                <div className="space-y-3">
                  {sources.map((src: any, i: number) => (
                    <div key={i} className="text-xs">
                      <div className="font-medium text-slate-700 mb-1">
                        {sourceLabels[src.site] || src.site}
                      </div>
                      {src.url && (
                        <a
                          href={src.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-blue-600 hover:underline break-all"
                        >
                          <ExternalLink className="w-3 h-3 flex-shrink-0" />
                          <span className="line-clamp-2">{src.url}</span>
                        </a>
                      )}
                      {src.lastCrawledAt && (
                        <div className="flex items-center gap-1 text-slate-400 mt-1.5">
                          <Calendar className="w-3 h-3" />
                          <span>Cập nhật: {format(new Date(src.lastCrawledAt), "dd/MM/yyyy")}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="col-span-12 md:col-span-9">
          <DocumentTabs
            contentTab={
              <DocumentContent
                fullText={document.fullText}
                astNodes={formattedAstNodes}
                documentTitle={document.title}
                documentNumber={document.documentNumber}
                issuingBody={document.issuingBody}
                promulgationDate={document.promulgationDate ? new Date(document.promulgationDate) : null}
              />
            }
            lineageTab={<LegalLineageTree documentId={id} />}
            relationshipsTab={
              <DocumentRelationships 
                incomingRelations={incomingRelations} 
                outgoingRelations={outgoingRelations} 
                currentDoc={meta}
              />
            }
            originalTab={
              <DocumentRelationshipGraph
                incomingRelations={incomingRelations}
                outgoingRelations={outgoingRelations}
                currentDoc={meta}
              />
            }
          />
        </div>
      </div>
    </div>
  );
}
