"use client";

import { ChevronDown, FileText, BookText, AlignLeft, ListCollapse } from "lucide-react";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { parseLegalText } from "@tinix-legal/shared";

interface ASTNode {
  id: string;
  nodeType: string;
  ordinal: string;
  heading: string;
  content: string;
  depth?: number;
  path?: string;
  children?: ASTNode[];
}

interface DocumentToCProps {
  astNodes: ASTNode[];
  fullText?: string;
}

const typeLabels: Record<string, string> = {
  PHAN: "Phần",
  CHUONG: "Chương",
  MUC: "Mục",
  DIEU: "Điều",
  KHOAN: "Khoản",
  DIEM: "Điểm",
  PHU_LUC: "Phụ lục",
};

const typeIcons: Record<string, typeof FileText> = {
  PHAN: BookText,
  CHUONG: BookText,
  MUC: AlignLeft,
  DIEU: FileText,
  KHOAN: ListCollapse,
};

function displayHeading(node: ASTNode): string {
  if (node.heading) return node.heading;
  if (node.nodeType === "DIEU" && node.ordinal) return `Điều ${node.ordinal}`;
  if (node.ordinal) return `${typeLabels[node.nodeType] || node.nodeType} ${node.ordinal}`;
  return typeLabels[node.nodeType] || node.nodeType;
}

function RenderToCNode({ node, depth = 0 }: { node: ASTNode; depth?: number }) {
  const [isOpen, setIsOpen] = useState(
    node.nodeType === "PHAN" || 
    node.nodeType === "CHUONG" || 
    node.nodeType === "MUC" || 
    node.nodeType === "PHU_LUC"
  );

  const allowedTypes = ["PHAN", "CHUONG", "MUC", "DIEU", "KHOAN", "DIEM", "PHU_LUC"];
  
  if (!allowedTypes.includes(node.nodeType)) {
    return null;
  }

  const Icon = typeIcons[node.nodeType];
  const label = displayHeading(node);
  const hasChildren = node.children && node.children.some(child => 
    allowedTypes.includes(child.nodeType)
  );

  return (
    <div className="flex flex-col">
      <div 
        className={cn(
          "flex items-center gap-1 rounded-md transition-all group py-1",
          node.nodeType === "DIEU" ? "hover:bg-slate-50" : "hover:bg-blue-50/50"
        )}
        style={{ paddingLeft: `${4 + depth * 8}px` }}
      >
        {/* Toggle Expand/Collapse Button */}
        {hasChildren ? (
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-0.5 rounded hover:bg-slate-200/60 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <ChevronDown className={cn("w-3 h-3 transition-transform duration-200", !isOpen && "-rotate-90")} />
          </button>
        ) : (
          <div className="w-4" />
        )}

        <a
          href={`#${node.id}`}
          className={cn(
            "flex items-start gap-1.5 py-0.5 pr-2 rounded-md text-xs transition-colors flex-1 min-w-0",
            node.nodeType === "DIEU" ? "text-slate-600 hover:text-blue-700 font-medium" :
            node.nodeType === "CHUONG" ? "font-semibold text-slate-800 text-[11px]" :
            node.nodeType === "KHOAN" ? "text-slate-500 text-[11px]" :
            node.nodeType === "DIEM" ? "text-slate-400 text-[10px] italic" :
            "font-medium text-slate-700",
          )}
        >
          {Icon && <Icon className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-slate-400 group-hover:text-blue-500 transition-colors" />}
          <span className="truncate">
            <span className="font-medium">{label}</span>
            {node.heading && node.heading !== label && (
              <span className="text-slate-400 font-normal"> - {node.heading}</span>
            )}
          </span>
        </a>
      </div>

      {hasChildren && isOpen && (
        <div className="flex flex-col">
          {node.children!.map((child, index) => (
            <RenderToCNode key={`${child.id}-${index}`} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export function DocumentToC({ astNodes, fullText }: DocumentToCProps) {
  const [collapsed, setCollapsed] = useState(false);

  const hasAstItems = astNodes && astNodes.length > 0;

  const parsedToCItems = useMemo(() => {
    if (hasAstItems) return [];
    if (!fullText) return [];
    const parsed = parseLegalText(fullText);
    return parsed.astNodes || [];
  }, [hasAstItems, fullText]);

  const hasParsedItems = parsedToCItems.length > 0;

  if (!hasAstItems && !hasParsedItems) {
    return (
      <div className="text-xs text-slate-400 italic p-3 border border-dashed border-slate-200 rounded-lg bg-slate-50/50">
        Không có cấu trúc mục lục
      </div>
    );
  }

  const nodesToRender = hasAstItems ? astNodes : parsedToCItems;

  return (
    <div>
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-between w-full text-xs text-slate-400 hover:text-slate-600 mb-3 transition-colors md:hidden"
      >
        <span>{collapsed ? "Hiện mục lục" : "Ẩn bớt"}</span>
        <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", collapsed ? "-rotate-90" : "")} />
      </button>

      <nav className={cn("space-y-0.5 max-h-[70vh] overflow-y-auto pr-1", collapsed && "hidden md:block")}>
        {nodesToRender.map((node, index) => (
          <RenderToCNode key={`${node.id}-${index}`} node={node} depth={0} />
        ))}
      </nav>
    </div>
  );
}
