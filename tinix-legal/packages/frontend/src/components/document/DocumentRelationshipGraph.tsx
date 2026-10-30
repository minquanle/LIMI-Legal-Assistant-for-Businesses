'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ReactFlow, Controls, Background, Node, Edge, Position, Handle, MarkerType } from '@xyflow/react';
import { Info, Calendar, ArrowRight, CornerDownRight, ZoomIn, Search, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import '@xyflow/react/dist/style.css';

interface RelatedDoc {
  id: string;
  documentNumber: string;
  title: string;
}

interface DocumentRelation {
  id: string;
  relationType: string;
  targetDocId?: string | null;
  targetDocNumber?: string;
  description: string;
  sourceDoc?: RelatedDoc | null;
  targetDoc?: RelatedDoc | null;
  sourceNodeRef?: string | null;
  targetNodeRef?: string | null;
}

interface DocumentRelationshipGraphProps {
  incomingRelations: DocumentRelation[];
  outgoingRelations: DocumentRelation[];
  currentDoc: {
    id: string;
    title: string;
    documentNumber: string;
    documentType: string;
    issuingBody: string;
    signer: string;
    validityStatus: string;
    field: string;
    promulgationDate: any;
    effectiveDate: any;
    expiryDate: any;
  };
}

const getRelationDetails = (type: string) => {
  switch (type) {
    case 'HUONG_DAN':
      return { label: 'Hướng dẫn', color: '#2563eb' }; // blue-600
    case 'CAN_CU':
      return { label: 'Căn cứ', color: '#4f46e5' }; // indigo-600
    case 'SUA_DOI':
    case 'SUA_DOI_BO_SUNG':
      return { label: 'Sửa đổi', color: '#d97706' }; // amber-600
    case 'THAY_THE':
      return { label: 'Thay thế', color: '#dc2626' }; // red-600
    case 'BAI_BO':
      return { label: 'Bãi bỏ', color: '#991b1b' }; // dark red
    default:
      return { label: type || 'Liên quan', color: '#64748b' }; // slate-500
  }
};

function DocumentNode({ data }: { data: any }) {
  const { isCurrent, title, documentNumber, documentType, validityStatus, issuingBody } = data;
  return (
    <div className={cn(
      "p-3 rounded-xl border text-xs w-[240px] shadow-sm transition-all duration-200 hover:shadow-md select-none relative",
      isCurrent 
        ? "bg-blue-50 border-blue-400 ring-2 ring-blue-500/20 text-blue-950 font-bold" 
        : "bg-white border-slate-200 text-slate-800 hover:border-blue-300"
    )}>
      {/* Connection Handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-2 !h-2 !bg-slate-300 border-2 border-white hover:!bg-blue-500 transition-colors"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!w-2 !h-2 !bg-slate-300 border-2 border-white hover:!bg-blue-500 transition-colors"
      />

      <div className="font-semibold truncate mb-1 flex items-center justify-between" title={documentNumber}>
        <span>{documentNumber || "Chưa có số hiệu"}</span>
        {isCurrent && (
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
        )}
      </div>
      <div className="text-[10px] text-slate-500 line-clamp-2 mb-2 font-normal leading-relaxed">
        {title}
      </div>
      <div className="flex justify-between items-center mt-1 border-t border-slate-100/70 pt-1.5">
        <span className="text-[9px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 uppercase font-bold tracking-wider">
          {issuingBody || documentType || "VĂN BẢN"}
        </span>
        {validityStatus && (
          <span className={cn(
            "text-[9px] px-1.5 py-0.5 rounded font-medium",
            validityStatus === "ConHieuLuc" ? "bg-emerald-50 text-emerald-700" :
            validityStatus === "HetHieuLuc" ? "bg-rose-50 text-rose-700" : "bg-slate-50 text-slate-600"
          )}>
            {validityStatus === "ConHieuLuc" ? "Còn hiệu lực" : 
             validityStatus === "HetHieuLuc" ? "Hết hiệu lực" : "Chưa xác định"}
          </span>
        )}
      </div>
    </div>
  );
}

const nodeTypes = {
  documentNode: DocumentNode,
};

export function DocumentRelationshipGraph({ incomingRelations, outgoingRelations, currentDoc }: DocumentRelationshipGraphProps) {
  const router = useRouter();
  const [selectedNodeData, setSelectedNodeData] = useState<any>(null);

  // Parse nodes & edges
  const { initialNodes, initialEdges } = useMemo(() => {
    const nodesMap = new Map<string, Node>();
    const edges: Edge[] = [];
    const seenEdgeKeys = new Set<string>(); // track source-target-type to avoid duplicate edges

    // 1. Root center node
    const centerNode: Node = {
      id: currentDoc.id,
      type: 'documentNode',
      position: { x: 0, y: 0 },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      data: {
        id: currentDoc.id,
        isCurrent: true,
        title: currentDoc.title,
        documentNumber: currentDoc.documentNumber,
        documentType: currentDoc.documentType,
        validityStatus: currentDoc.validityStatus,
        issuingBody: currentDoc.issuingBody,
        signer: currentDoc.signer,
        effectiveDate: currentDoc.effectiveDate,
        expiryDate: currentDoc.expiryDate,
        promulgationDate: currentDoc.promulgationDate,
      }
    };
    nodesMap.set(currentDoc.id, centerNode);

    // 2. Process incoming
    incomingRelations.forEach((rel) => {
      const doc = rel.sourceDoc;
      if (!doc || !doc.id) return;

      if (!nodesMap.has(doc.id)) {
        nodesMap.set(doc.id, {
          id: doc.id,
          type: 'documentNode',
          position: { x: -340, y: 0 },
          sourcePosition: Position.Right,
          targetPosition: Position.Left,
          data: {
            id: doc.id,
            isCurrent: false,
            title: doc.title,
            documentNumber: doc.documentNumber,
            documentType: doc.title?.split(' ')[0] || 'VĂN BẢN',
            validityStatus: 'ConHieuLuc',
            issuingBody: doc.title?.includes('Chính phủ') ? 'Chính phủ' : doc.title?.includes('Bộ') ? 'Bộ ngành' : 'UBND',
          }
        });
      }

      const relDetails = getRelationDetails(rel.relationType);
      const edgeKey = `${doc.id}->${currentDoc.id}::${rel.relationType}::${rel.sourceNodeRef || ''}::${rel.targetNodeRef || ''}`;
      if (!seenEdgeKeys.has(edgeKey)) {
        seenEdgeKeys.add(edgeKey);
        
        let edgeLabel = relDetails.label;
        if (rel.sourceNodeRef || rel.targetNodeRef) {
          const parts = [];
          if (rel.sourceNodeRef) parts.push(rel.sourceNodeRef);
          if (rel.targetNodeRef) parts.push(`→ ${rel.targetNodeRef}`);
          edgeLabel = `${relDetails.label} (${parts.join(' ')})`;
        }

        edges.push({
          id: `in-${rel.id}`,
          source: doc.id,
          target: currentDoc.id,
          label: edgeLabel,
          type: 'smoothstep',
          style: { stroke: relDetails.color, strokeWidth: 2 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 14,
            height: 14,
            color: relDetails.color,
          },
          labelStyle: { fill: '#334155', fontSize: 10, fontWeight: 600 },
          labelBgPadding: [4, 2],
          labelBgBorderRadius: 4,
          labelBgStyle: { fill: '#f1f5f9', fillOpacity: 0.85 },
        });
      }
    });

    // 3. Process outgoing
    outgoingRelations.forEach((rel) => {
      const docId = rel.targetDocId || rel.targetDoc?.id;
      if (!docId) return;

      const docNumber = rel.targetDoc?.documentNumber || rel.targetDocNumber || 'Xem chi tiết';
      const docTitle = rel.targetDoc?.title || rel.description;

      if (!nodesMap.has(docId)) {
        nodesMap.set(docId, {
          id: docId,
          type: 'documentNode',
          position: { x: 340, y: 0 },
          sourcePosition: Position.Right,
          targetPosition: Position.Left,
          data: {
            id: docId,
            isCurrent: false,
            title: docTitle,
            documentNumber: docNumber,
            documentType: docTitle?.split(' ')[0] || 'VĂN BẢN',
            validityStatus: 'ConHieuLuc',
            issuingBody: docTitle?.includes('Chính phủ') ? 'Chính phủ' : docTitle?.includes('Bộ') ? 'Bộ ngành' : 'UBND',
          }
        });
      }

      const relDetails = getRelationDetails(rel.relationType);
      const edgeKey = `${currentDoc.id}->${docId}::${rel.relationType}::${rel.sourceNodeRef || ''}::${rel.targetNodeRef || ''}`;
      if (!seenEdgeKeys.has(edgeKey)) {
        seenEdgeKeys.add(edgeKey);
        
        let edgeLabel = relDetails.label;
        if (rel.sourceNodeRef || rel.targetNodeRef) {
          const parts = [];
          if (rel.sourceNodeRef) parts.push(rel.sourceNodeRef);
          if (rel.targetNodeRef) parts.push(`→ ${rel.targetNodeRef}`);
          edgeLabel = `${relDetails.label} (${parts.join(' ')})`;
        }

        edges.push({
          id: `out-${rel.id}`,
          source: currentDoc.id,
          target: docId,
          label: edgeLabel,
          type: 'smoothstep',
          style: { stroke: relDetails.color, strokeWidth: 2 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 14,
            height: 14,
            color: relDetails.color,
          },
          labelStyle: { fill: '#334155', fontSize: 10, fontWeight: 600 },
          labelBgPadding: [4, 2],
          labelBgBorderRadius: 4,
          labelBgStyle: { fill: '#f1f5f9', fillOpacity: 0.85 },
        });
      }
    });

    // Calculate vertical distributions
    const incomingNodes = Array.from(nodesMap.values()).filter(n => n.position.x === -340);
    const outgoingNodes = Array.from(nodesMap.values()).filter(n => n.position.x === 340);

    const verticalSpacing = 140;

    incomingNodes.forEach((node, i) => {
      node.position.y = (i - (incomingNodes.length - 1) / 2) * verticalSpacing;
    });

    outgoingNodes.forEach((node, i) => {
      node.position.y = (i - (outgoingNodes.length - 1) / 2) * verticalSpacing;
    });

    return {
      initialNodes: Array.from(nodesMap.values()),
      initialEdges: edges,
    };
  }, [incomingRelations, outgoingRelations, currentDoc]);

  const onNodeClick = (_: any, node: Node) => {
    setSelectedNodeData(node.data);
  };

  const onNodeDoubleClick = (_: any, node: Node) => {
    if (node.data.id && !node.data.isCurrent) {
      router.push(`/documents/${node.data.id}`);
    }
  };

  const formatDate = (dateStr: any) => {
    if (!dateStr) return '--';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('vi-VN');
    } catch (_) {
      return '--';
    }
  };

  return (
    <div className="h-[600px] flex flex-col border border-slate-200 rounded-2xl overflow-hidden bg-slate-50 relative">
      {/* Legend & Instructions */}
      <div className="absolute top-4 left-4 z-10 bg-white/95 backdrop-blur-sm border border-slate-200 p-4 rounded-xl shadow-md text-[11px] space-y-3 pointer-events-auto max-w-[280px]">
        <div className="font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
          <Info className="w-3.5 h-3.5 text-blue-500" />
          Chú thích & Tương tác
        </div>
        <div className="text-slate-500 space-y-1 text-[10px]">
          <div>• Kéo chuột để di chuyển vùng nhìn</div>
          <div>• Cuộn chuột để Phóng to/Thu nhỏ</div>
          <div>• Click đúp để mở chi tiết văn bản</div>
        </div>
        <div className="border-t border-slate-100 pt-2.5 space-y-2">
          <div className="font-semibold text-slate-700 text-[10px] uppercase tracking-wider">
            Phân loại quan hệ (Cạnh)
          </div>
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 inline-block rounded-full" style={{ backgroundColor: '#4f46e5' }} />
              <span className="text-slate-600 font-medium">Căn cứ</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 inline-block rounded-full" style={{ backgroundColor: '#2563eb' }} />
              <span className="text-slate-600 font-medium">Hướng dẫn</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 inline-block rounded-full" style={{ backgroundColor: '#d97706' }} />
              <span className="text-slate-600 font-medium">Sửa đổi</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 inline-block rounded-full" style={{ backgroundColor: '#dc2626' }} />
              <span className="text-slate-600 font-medium">Thay thế</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 inline-block rounded-full" style={{ backgroundColor: '#991b1b' }} />
              <span className="text-slate-600 font-medium">Bãi bỏ</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 inline-block rounded-full" style={{ backgroundColor: '#64748b' }} />
              <span className="text-slate-600 font-medium">Liên quan</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Flow Component */}
      <div className="flex-1 w-full h-full pointer-events-auto">
        <ReactFlow
          nodes={initialNodes}
          edges={initialEdges}
          nodeTypes={nodeTypes}
          onNodeClick={onNodeClick}
          onNodeDoubleClick={onNodeDoubleClick}
          fitView
          fitViewOptions={{ padding: 0.15 }}
          minZoom={0.2}
          maxZoom={1.5}
        >
          <Background color="#cbd5e1" gap={16} size={1} />
          <Controls showInteractive={false} className="bg-white border border-slate-200 shadow-sm rounded-lg" />
        </ReactFlow>
      </div>

      {/* Preview Card (Details on click) */}
      {selectedNodeData && (
        <div className="absolute bottom-4 right-4 z-10 w-96 bg-white/98 backdrop-blur-md border border-slate-200/80 rounded-xl shadow-lg p-4 animate-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2">
            <div>
              <span className="text-[9px] bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                {selectedNodeData.issuingBody || selectedNodeData.documentType || "VĂN BẢN"}
              </span>
              <h5 className="font-extrabold text-slate-800 text-xs mt-1 leading-normal">
                {selectedNodeData.documentNumber || "Chưa có số hiệu"}
              </h5>
            </div>
            <button 
              onClick={() => setSelectedNodeData(null)}
              className="text-slate-400 hover:text-slate-600 text-xs font-semibold px-1 rounded hover:bg-slate-100"
            >
              Đóng
            </button>
          </div>
          
          <div className="mt-2.5 space-y-2 text-[11px] text-slate-600">
            <p className="font-medium text-slate-700 leading-snug line-clamp-3">
              {selectedNodeData.title}
            </p>
            {selectedNodeData.signer && (
              <div className="flex justify-between items-center py-1 border-b border-slate-50">
                <span className="text-slate-400">Người ký:</span>
                <span className="font-semibold text-slate-700">{selectedNodeData.signer}</span>
              </div>
            )}
            <div className="flex justify-between items-center py-1 border-b border-slate-50">
              <span className="text-slate-400">Hiệu lực:</span>
              <span className={cn(
                "font-semibold",
                selectedNodeData.validityStatus === "ConHieuLuc" ? "text-emerald-600" :
                selectedNodeData.validityStatus === "HetHieuLuc" ? "text-rose-600" : "text-slate-600"
              )}>
                {selectedNodeData.validityStatus === "ConHieuLuc" ? "Còn hiệu lực" :
                 selectedNodeData.validityStatus === "HetHieuLuc" ? "Hết hiệu lực" : "Chưa xác định"}
              </span>
            </div>
            {selectedNodeData.promulgationDate && (
              <div className="flex justify-between items-center py-1 border-b border-slate-50">
                <span className="text-slate-400">Ngày ban hành:</span>
                <span className="font-semibold text-slate-700">{formatDate(selectedNodeData.promulgationDate)}</span>
              </div>
            )}
          </div>

          {!selectedNodeData.isCurrent && (
            <button
              onClick={() => router.push(`/documents/${selectedNodeData.id}`)}
              className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 px-3 rounded-lg text-[10px] flex items-center justify-center gap-1 cursor-pointer transition-colors"
            >
              <span>Xem chi tiết văn bản này</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
