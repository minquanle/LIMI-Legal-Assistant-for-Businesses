'use client';

import React, { useCallback } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Card, CardContent } from '@/components/ui/card';
import { PlusCircle, MinusCircle, Edit3 } from 'lucide-react';

const initialNodes: Node[] = [
  { 
    id: '1', 
    position: { x: 250, y: 0 }, 
    data: { label: 'Luật Đất đai 2024', status: 'modified' },
    type: 'articleNode'
  },
  { 
    id: '2', 
    position: { x: 100, y: 150 }, 
    data: { label: 'Điều 15. Phân loại đất', status: 'unchanged', content: 'Phân loại đất dựa trên mục đích sử dụng...' },
    type: 'articleNode'
  },
  { 
    id: '3', 
    position: { x: 400, y: 150 }, 
    data: { label: 'Điều 16. Nhóm đất nông nghiệp', status: 'added', content: 'Bao gồm đất trồng lúa, đất rừng phòng hộ...' },
    type: 'articleNode'
  },
  { 
    id: '4', 
    position: { x: 400, y: 300 }, 
    data: { label: 'Điều 17. Thu hồi đất', status: 'removed', content: 'Cơ quan nhà nước có quyền thu hồi đất...' },
    type: 'articleNode'
  },
];

const initialEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2' },
  { id: 'e1-3', source: '1', target: '3' },
  { id: 'e3-4', source: '3', target: '4', animated: true, style: { stroke: '#ef4444' } },
];

const ArticleNode = ({ data }: { data: any }) => {
  const getBorderColor = (status: string) => {
    switch (status) {
      case 'added': return 'border-green-500';
      case 'removed': return 'border-red-500 line-through';
      case 'modified': return 'border-yellow-500';
      default: return 'border-slate-300';
    }
  };

  const getBgColor = (status: string) => {
    switch (status) {
      case 'added': return 'bg-green-50';
      case 'removed': return 'bg-red-50';
      case 'modified': return 'bg-yellow-50';
      default: return 'bg-white';
    }
  };

  const getIcon = (status: string) => {
    switch (status) {
      case 'added': return <PlusCircle className="w-4 h-4 text-green-600" />;
      case 'removed': return <MinusCircle className="w-4 h-4 text-red-600" />;
      case 'modified': return <Edit3 className="w-4 h-4 text-yellow-600" />;
      default: return null;
    }
  };

  return (
    <Card className={`w-[300px] border-2 shadow-sm ${getBorderColor(data.status)} ${getBgColor(data.status)}`}>
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-sm text-slate-800">{data.label}</h3>
          {getIcon(data.status)}
        </div>
        {data.content && (
          <p className="text-xs text-slate-600 line-clamp-3">{data.content}</p>
        )}
      </CardContent>
    </Card>
  );
};

const nodeTypes = {
  articleNode: ArticleNode,
};

export default function MindmapPage() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection | Edge) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      <div className="p-4 border-b bg-white flex justify-between items-center shadow-sm z-10">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Mindmap Compare (Tree Diff)</h1>
          <p className="text-sm text-slate-500">Trực quan hoá thay đổi giữa 2 phiên bản văn bản</p>
        </div>
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 bg-green-500 rounded-full"></span> Thêm mới</div>
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 bg-yellow-500 rounded-full"></span> Sửa đổi</div>
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 bg-red-500 rounded-full"></span> Bãi bỏ</div>
        </div>
      </div>
      
      <div className="flex-1 w-full h-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          attributionPosition="bottom-right"
        >
          <Controls />
          <MiniMap />
          <Background gap={12} size={1} />
        </ReactFlow>
      </div>
    </div>
  );
}
