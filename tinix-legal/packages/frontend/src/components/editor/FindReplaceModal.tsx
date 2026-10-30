import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
import { Editor } from '@tiptap/react';

interface FindReplaceModalProps {
  editor: Editor | null;
  isOpen: boolean;
  onClose: () => void;
}

export function FindReplaceModal({ editor, isOpen, onClose }: FindReplaceModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [replaceTerm, setReplaceTerm] = useState('');

  if (!isOpen || !editor) return null;

  const handleReplaceAll = () => {
    if (!searchTerm) return;
    
    // Simple replace using TipTap's commands if available, or raw HTML replace as a basic fallback
    const content = editor.getHTML();
    // Note: A true Find & Replace should traverse Text nodes to avoid replacing HTML tags.
    // This is a simplified version for demonstration.
    const regex = new RegExp(searchTerm, 'gi');
    const newContent = content.replace(regex, replaceTerm);
    
    editor.commands.setContent(newContent);
    onClose();
  };

  return (
    <div className="absolute top-20 right-8 w-80 bg-white shadow-2xl rounded-xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-4">
      <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex justify-between items-center">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
          <Search className="w-4 h-4 text-blue-600" />
          Tìm kiếm & Thay thế
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="p-4 flex flex-col gap-3">
        <div>
          <label className="text-xs font-semibold text-slate-600 block mb-1">Tìm gì:</label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-blue-500"
            placeholder="Nhập từ khóa..."
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-600 block mb-1">Thay thế bằng:</label>
          <input
            type="text"
            value={replaceTerm}
            onChange={(e) => setReplaceTerm(e.target.value)}
            className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-blue-500"
            placeholder="Nội dung mới..."
          />
        </div>
        <div className="flex justify-end gap-2 mt-2">
          <button
            onClick={handleReplaceAll}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-1.5 px-3 rounded transition-colors"
          >
            Thay thế tất cả
          </button>
        </div>
      </div>
    </div>
  );
}
