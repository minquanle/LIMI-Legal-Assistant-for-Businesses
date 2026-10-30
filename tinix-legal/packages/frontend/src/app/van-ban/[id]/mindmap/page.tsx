'use client';

import { useState, useEffect, useCallback, use } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  ChevronRight,
  FileText,
  GitFork,
  Layers,
  Link2,
  RefreshCw,
  Sparkles,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';

interface MindmapNode {
  id: string;
  label: string;
  type: 'root' | 'nghidinh' | 'thongtu' | 'related';
  level: number;
}

interface MindmapEdge {
  source: string;
  target: string;
  relation: string;
}

const NODE_STYLES: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  root: {
    bg: 'bg-indigo-900',
    border: 'border-indigo-700',
    text: 'text-white',
    badge: 'bg-yellow-400 text-indigo-950 font-bold',
  },
  nghidinh: {
    bg: 'bg-purple-50',
    border: 'border-purple-300',
    text: 'text-purple-950',
    badge: 'bg-purple-200 text-purple-800 font-semibold',
  },
  thongtu: {
    bg: 'bg-blue-50',
    border: 'border-blue-300',
    text: 'text-blue-950',
    badge: 'bg-blue-200 text-blue-800 font-semibold',
  },
  related: {
    bg: 'bg-slate-50',
    border: 'border-slate-300',
    text: 'text-slate-800',
    badge: 'bg-slate-200 text-slate-700',
  },
};

export default function LegalMindmapPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const docId = resolvedParams.id;

  const [nodes, setNodes] = useState<MindmapNode[]>([]);
  const [edges, setEdges] = useState<MindmapEdge[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<MindmapNode | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiClient.getLegalMindmap(docId);
      setNodes(data.nodes);
      setEdges(data.edges);
      if (data.nodes.length > 0) setSelectedNode(data.nodes[0]);
    } catch {
      /* Fallback demo graph */
      const demoNodes: MindmapNode[] = [
        { id: 'root', label: 'Luật Đất đai 2024 (31/2024/QH15)', type: 'root', level: 1 },
        { id: 'nghidinh_102', label: 'NĐ 102/2024/NĐ-CP - Hướng dẫn chi tiết thi hành Luật Đất đai', type: 'nghidinh', level: 2 },
        { id: 'nghidinh_103', label: 'NĐ 103/2024/NĐ-CP - Tiền sử dụng đất, tiền thuê đất', type: 'nghidinh', level: 2 },
        { id: 'thongtu_10', label: 'TT 10/2024/TT-BTNMT - Mẫu Giấy chứng nhận QSDĐ (Sổ đỏ)', type: 'thongtu', level: 3 },
      ];
      const demoEdges: MindmapEdge[] = [
        { source: 'root', target: 'nghidinh_102', relation: 'Hướng dẫn thi hành' },
        { source: 'root', target: 'nghidinh_103', relation: 'Quy định tài chính đất đai' },
        { source: 'nghidinh_102', target: 'thongtu_10', relation: 'Ban hành biểu mẫu chi tiết' },
      ];
      setNodes(demoNodes);
      setEdges(demoEdges);
      setSelectedNode(demoNodes[0]);
    }
    setLoading(false);
  }, [docId]);

  useEffect(() => { load(); }, [load]);

  const level1Nodes = nodes.filter((n) => n.level === 1);
  const level2Nodes = nodes.filter((n) => n.level === 2);
  const level3Nodes = nodes.filter((n) => n.level === 3);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* Header */}
      <header className="bg-slate-800/80 backdrop-blur border-b border-slate-700 px-6 py-4 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <Link href={`/documents/${docId}`} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-yellow-400 text-slate-950">MINDMAP GRAPH</span>
              <span className="text-xs text-slate-400">ID: {docId}</span>
            </div>
            <h1 className="text-base font-bold text-white">Sơ đồ Tư duy Quan hệ Văn bản Pháp luật</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setZoomLevel((z) => Math.min(z + 0.1, 1.5))} aria-label="Phóng to" className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg">
            <ZoomIn className="w-4 h-4" aria-hidden="true" />
          </button>
          <span className="text-xs font-mono text-slate-400">{Math.round(zoomLevel * 100)}%</span>
          <button onClick={() => setZoomLevel((z) => Math.max(z - 0.1, 0.7))} aria-label="Thu nhỏ" className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg">
            <ZoomOut className="w-4 h-4" aria-hidden="true" />
          </button>
          <button onClick={load} aria-label="Tải lại sơ đồ" className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg">
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </header>

      {/* Main Graph Body */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 overflow-hidden">

        {/* Node Canvas Area (3 cols) */}
        <div className="lg:col-span-3 p-8 overflow-auto flex items-center justify-center bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:24px_24px]">
          {loading ? (
            <div className="text-slate-400 text-sm">Đang nạp đồ thị quan hệ văn bản...</div>
          ) : (
            <div
              className="space-y-12 transition-transform duration-200 origin-center"
              style={{ transform: `scale(${zoomLevel})` }}
            >
              {/* Level 1: Root Document */}
              <div className="flex justify-center">
                {level1Nodes.map((n) => (
                  <div
                    key={n.id}
                    role="button"
                    tabIndex={0}
                    aria-label={n.label}
                    onClick={() => setSelectedNode(n)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedNode(n); } }}
                    className={`max-w-md p-5 rounded-2xl border-2 shadow-2xl cursor-pointer transition transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-yellow-400/60 ${
                      NODE_STYLES[n.type].bg
                    } ${selectedNode?.id === n.id ? 'ring-4 ring-yellow-400 border-yellow-400' : NODE_STYLES[n.type].border}`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${NODE_STYLES[n.type].badge}`}>VĂN BẢN GỐC</span>
                      <GitFork className="w-4 h-4 text-yellow-400" />
                    </div>
                    <h3 className="font-bold text-white text-base leading-snug">{n.label}</h3>
                  </div>
                ))}
              </div>

              {/* Connecting Edges Visual */}
              <div className="flex justify-center items-center gap-4 py-2">
                <div className="w-0.5 h-8 bg-slate-600" />
              </div>

              {/* Level 2: Decrees & Guidelines */}
              <div className="flex flex-wrap justify-center gap-6">
                {level2Nodes.map((n) => (
                  <div
                    key={n.id}
                    role="button"
                    tabIndex={0}
                    aria-label={n.label}
                    onClick={() => setSelectedNode(n)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedNode(n); } }}
                    className={`max-w-xs p-4 rounded-xl border-2 shadow-lg cursor-pointer transition transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-purple-400/60 ${
                      NODE_STYLES[n.type].bg
                    } ${selectedNode?.id === n.id ? 'ring-4 ring-purple-400 border-purple-400' : NODE_STYLES[n.type].border}`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${NODE_STYLES[n.type].badge}`}>NGHỊ ĐỊNH HƯỚNG DẪN</span>
                    </div>
                    <h4 className={`font-semibold text-xs leading-relaxed ${NODE_STYLES[n.type].text}`}>{n.label}</h4>
                  </div>
                ))}
              </div>

              {/* Level 3: Circulars */}
              {level3Nodes.length > 0 && (
                <>
                  <div className="flex justify-center items-center gap-4 py-2">
                    <div className="w-0.5 h-8 bg-slate-600" />
                  </div>
                  <div className="flex flex-wrap justify-center gap-6">
                    {level3Nodes.map((n) => (
                      <div
                        key={n.id}
                        role="button"
                        tabIndex={0}
                        aria-label={n.label}
                        onClick={() => setSelectedNode(n)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedNode(n); } }}
                        className={`max-w-xs p-4 rounded-xl border-2 shadow-lg cursor-pointer transition transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-400/60 ${
                          NODE_STYLES[n.type].bg
                        } ${selectedNode?.id === n.id ? 'ring-4 ring-blue-400 border-blue-400' : NODE_STYLES[n.type].border}`}
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full ${NODE_STYLES[n.type].badge}`}>THÔNG TƯ CHI TIẾT</span>
                        </div>
                        <h4 className={`font-semibold text-xs leading-relaxed ${NODE_STYLES[n.type].text}`}>{n.label}</h4>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Node Detail Sidebar (1 col) */}
        <div className="bg-slate-800 border-l border-slate-700 p-6 flex flex-col space-y-5 overflow-y-auto">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-yellow-400" /> Chi tiết Node Văn bản
          </h2>

          {selectedNode ? (
            <div className="space-y-4 text-xs">
              <div className="bg-slate-900 rounded-xl p-4 border border-slate-700 space-y-2">
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${NODE_STYLES[selectedNode.type].badge}`}>
                  {selectedNode.type.toUpperCase()}
                </span>
                <h3 className="font-bold text-white text-sm leading-snug">{selectedNode.label}</h3>
                <p className="text-slate-400">Cấp phân loại: Level {selectedNode.level}</p>
              </div>

              {/* Relations count */}
              <div className="space-y-2">
                <p className="font-semibold text-slate-300">Các mối quan hệ liên kết:</p>
                {edges.map((e, idx) => (
                  <div key={idx} className="p-3 bg-slate-900/60 rounded-lg border border-slate-700/60 text-[11px] space-y-1">
                    <span className="text-yellow-400 font-bold"><Link2 className="w-3 h-3 inline" aria-hidden="true" /> {e.relation}</span>
                    <p className="text-slate-400 line-clamp-1">Từ: {e.source} <ArrowRight className="w-3 h-3 inline" aria-hidden="true" /> Đến: {e.target}</p>
                  </div>
                ))}
              </div>

              <div className="pt-4">
                <Link
                  href={`/documents/${docId}`}
                  className="w-full py-2.5 bg-yellow-400 hover:bg-yellow-500 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition"
                >
                  <FileText className="w-4 h-4" /> Xem toàn văn bản luật
                </Link>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500">Nhấp vào một node trên đồ thị để xem chi tiết.</p>
          )}
        </div>

      </div>
    </div>
  );
}
