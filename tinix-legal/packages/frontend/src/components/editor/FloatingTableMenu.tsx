'use client';

import React from 'react';
import { Editor } from '@tiptap/react';
import {
  Rows,
  Trash2,
  Combine,
  Split,
  PlusSquare,
  MinusSquare,
} from 'lucide-react';

interface FloatingTableMenuProps {
  editor: Editor | null;
}

export function FloatingTableMenu({ editor }: FloatingTableMenuProps) {
  if (!editor || !editor.isActive('table')) return null;

  return (
    <div className="fixed top-36 right-[420px] z-40 bg-white shadow-xl rounded-xl border border-slate-200 p-1.5 flex items-center gap-1.5 animate-in fade-in zoom-in-95">

      <div className="flex items-center bg-slate-50 p-1 rounded-lg">
        <button
          onClick={() => editor.chain().focus().addColumnBefore().run()}
          className="p-1.5 hover:bg-white text-slate-600 rounded transition-colors cursor-pointer"
          title="Thêm cột bên trái" aria-label="Thêm cột bên trái"
        >
          <PlusSquare className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => editor.chain().focus().deleteColumn().run()}
          className="p-1.5 hover:bg-white text-red-500 rounded transition-colors cursor-pointer"
          title="Xóa cột" aria-label="Xóa cột"
        >
          <MinusSquare className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="h-4 w-px bg-slate-200" />

      <div className="flex items-center bg-slate-50 p-1 rounded-lg">
        <button
          onClick={() => editor.chain().focus().addRowAfter().run()}
          className="p-1.5 hover:bg-white text-slate-600 rounded transition-colors cursor-pointer"
          title="Thêm dòng bên dưới" aria-label="Thêm dòng bên dưới"
        >
          <Rows className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => editor.chain().focus().deleteRow().run()}
          className="p-1.5 hover:bg-white text-red-500 rounded transition-colors cursor-pointer"
          title="Xóa dòng" aria-label="Xóa dòng"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="h-4 w-px bg-slate-200" />

      <div className="flex items-center bg-slate-50 p-1 rounded-lg">
        <button
          onClick={() => editor.chain().focus().mergeCells().run()}
          disabled={!editor.can().mergeCells()}
          className="p-1.5 hover:bg-white text-slate-600 disabled:opacity-50 disabled:hover:bg-transparent rounded transition-colors flex items-center gap-1 cursor-pointer"
          title="Gộp ô (Merge Cells)" aria-label="Gộp ô (Merge Cells)"
        >
          <Combine className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => editor.chain().focus().splitCell().run()}
          disabled={!editor.can().splitCell()}
          className="p-1.5 hover:bg-white text-slate-600 disabled:opacity-50 disabled:hover:bg-transparent rounded transition-colors flex items-center gap-1 cursor-pointer"
          title="Tách ô (Split Cell)" aria-label="Tách ô (Split Cell)"
        >
          <Split className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="h-4 w-px bg-slate-200" />

      <button
        onClick={() => editor.chain().focus().deleteTable().run()}
        className="p-1.5 hover:bg-red-50 text-red-600 rounded transition-colors cursor-pointer"
        title="Xóa toàn bộ bảng" aria-label="Xóa toàn bộ bảng"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
