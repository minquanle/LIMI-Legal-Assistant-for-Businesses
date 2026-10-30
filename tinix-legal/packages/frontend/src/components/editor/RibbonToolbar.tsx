'use client';

import React, { useState } from 'react';
import { Editor } from '@tiptap/react';
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Table as TableIcon,
  BookOpen,
  FileCheck,
  ShieldAlert,
  Sparkles,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Type,
  FileSpreadsheet,
  Check,
  Strikethrough,
  Subscript as SubscriptIcon,
  Superscript as SuperscriptIcon,
  Highlighter,
  Palette,
  ChevronDown,
  WrapText,
  SplitSquareHorizontal,
  Undo,
  Redo,
  Search
} from 'lucide-react';

interface RibbonToolbarProps {
  editor: Editor | null;
  onScanValidity: () => void;
  onInsertCitationPrompt: () => void;
}

export function RibbonToolbar({ editor, onScanValidity, onInsertCitationPrompt, onOpenFindReplace }: RibbonToolbarProps & { onOpenFindReplace?: () => void }) {
  const [activeTab, setActiveTab] = useState<'home' | 'layout' | 'review' | 'legal'>('home');

  if (!editor) return null;

  return (
    <div className="bg-white border-b border-slate-200 shadow-sm flex flex-col z-20">
      {/* Ribbon Header Tabs */}
      <div className="flex items-center px-4 border-b border-slate-100 text-xs font-semibold bg-slate-50">
        <button
          onClick={() => setActiveTab('home')}
          className={`py-2 px-3 border-b-2 transition-colors ${
            activeTab === 'home'
              ? 'border-yellow-500 text-slate-900 bg-white font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Trang chủ
        </button>
        <button
          onClick={() => setActiveTab('layout')}
          className={`py-2 px-3 border-b-2 transition-colors ${
            activeTab === 'layout'
              ? 'border-yellow-500 text-slate-900 bg-white font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Bố cục trang (NĐ 30)
        </button>
        <button
          onClick={() => setActiveTab('review')}
          className={`py-2 px-3 border-b-2 transition-colors ${
            activeTab === 'review'
              ? 'border-yellow-500 text-slate-900 bg-white font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Đánh giá & Thay đổi
        </button>
        <button
          onClick={() => setActiveTab('legal')}
          className={`py-2 px-3 border-b-2 transition-colors ${
            activeTab === 'legal'
              ? 'border-yellow-500 text-slate-900 bg-white font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Trợ lý Pháp chế AI
        </button>
      </div>

      {/* Ribbon Action Buttons Bar */}
      <div className="px-4 py-2 flex flex-wrap items-center gap-1.5 text-xs bg-white">
        {activeTab === 'home' && (
          <>
            {/* History & Find */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => editor.chain().focus().undo().run()}
                disabled={!editor.can().undo()}
                className="p-1.5 rounded hover:bg-white transition-colors text-slate-600 disabled:opacity-50 disabled:hover:bg-transparent"
                title="Hoàn tác (Ctrl+Z)" aria-label="Hoàn tác (Ctrl+Z)"
              >
                <Undo className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => editor.chain().focus().redo().run()}
                disabled={!editor.can().redo()}
                className="p-1.5 rounded hover:bg-white transition-colors text-slate-600 disabled:opacity-50 disabled:hover:bg-transparent"
                title="Làm lại (Ctrl+Y)" aria-label="Làm lại (Ctrl+Y)"
              >
                <Redo className="w-3.5 h-3.5" />
              </button>
              <div className="h-4 w-px bg-slate-300 mx-1" />
              <button
                onClick={onOpenFindReplace}
                className="p-1.5 rounded hover:bg-white transition-colors text-slate-600 flex items-center gap-1"
                title="Tìm kiếm & Thay thế (Ctrl+H)" aria-label="Tìm kiếm & Thay thế (Ctrl+H)"
              >
                <Search className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="h-4 w-px bg-slate-200 mx-1" />

            {/* Font & Styles */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={`p-1.5 rounded hover:bg-white transition-colors ${
                  editor.isActive('bold') ? 'bg-white shadow-sm font-bold text-yellow-600' : 'text-slate-600'
                }`}
                title="In đậm (Ctrl+B)" aria-label="In đậm (Ctrl+B)"
              >
                <Bold className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={`p-1.5 rounded hover:bg-white transition-colors ${
                  editor.isActive('italic') ? 'bg-white shadow-sm font-bold text-yellow-600' : 'text-slate-600'
                }`}
                title="In nghiêng (Ctrl+I)" aria-label="In nghiêng (Ctrl+I)"
              >
                <Italic className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                className={`p-1.5 rounded hover:bg-white transition-colors ${
                  editor.isActive('underline') ? 'bg-white shadow-sm font-bold text-yellow-600' : 'text-slate-600'
                }`}
                title="Gạch chân (Ctrl+U)" aria-label="Gạch chân (Ctrl+U)"
              >
                <Underline className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => editor.chain().focus().toggleStrike().run()}
                className={`p-1.5 rounded hover:bg-white transition-colors ${
                  editor.isActive('strike') ? 'bg-white shadow-sm font-bold text-yellow-600' : 'text-slate-600'
                }`}
                title="Gạch ngang" aria-label="Gạch ngang"
              >
                <Strikethrough className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => editor.chain().focus().toggleSubscript().run()}
                className={`p-1.5 rounded hover:bg-white transition-colors ${
                  editor.isActive('subscript') ? 'bg-white shadow-sm font-bold text-yellow-600' : 'text-slate-600'
                }`}
                title="Chỉ số dưới" aria-label="Chỉ số dưới"
              >
                <SubscriptIcon className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => editor.chain().focus().toggleSuperscript().run()}
                className={`p-1.5 rounded hover:bg-white transition-colors ${
                  editor.isActive('superscript') ? 'bg-white shadow-sm font-bold text-yellow-600' : 'text-slate-600'
                }`}
                title="Chỉ số trên" aria-label="Chỉ số trên"
              >
                <SuperscriptIcon className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="h-4 w-px bg-slate-200 mx-1" />

            {/* Font Family & Size */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    editor.chain().focus().setFontFamily(e.target.value).run();
                  } else {
                    editor.chain().focus().unsetFontFamily().run();
                  }
                }}
                className="text-xs bg-transparent border-none focus:ring-0 text-slate-700 py-1 px-2 w-[140px] hover:bg-white rounded transition-colors"
                title="Phông chữ" aria-label="Phông chữ"
              >
                <option value="">Times New Roman (Mặc định)</option>
                <option value="Arial">Arial</option>
                <option value="Roboto">Roboto</option>
                <option value="Courier New">Courier New</option>
              </select>
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    editor.chain().focus().setFontSize(e.target.value).run();
                  } else {
                    editor.chain().focus().unsetFontSize().run();
                  }
                }}
                className="text-xs bg-transparent border-none focus:ring-0 text-slate-700 py-1 px-1 w-[60px] hover:bg-white rounded transition-colors"
                title="Kích thước chữ" aria-label="Kích thước chữ"
              >
                <option value="">14pt (MĐ)</option>
                {[8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 72].map(size => (
                  <option key={size} value={`${size}pt`}>{size}</option>
                ))}
              </select>
            </div>

            <div className="h-4 w-px bg-slate-200 mx-1" />

            {/* Colors */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
              <div className="relative flex items-center group">
                <input
                  type="color"
                  onInput={e => editor.chain().focus().setColor((e.target as HTMLInputElement).value).run()}
                  value={editor.getAttributes('textStyle').color || '#000000'}
                  className="w-6 h-6 p-0 border-0 bg-transparent rounded cursor-pointer"
                  title="Màu chữ" aria-label="Màu chữ"
                />
                <Palette className="w-3.5 h-3.5 absolute pointer-events-none left-1.5 top-1.5 text-slate-600 mix-blend-difference" />
              </div>
              <div className="relative flex items-center group">
                <input
                  type="color"
                  onInput={e => editor.chain().focus().toggleHighlight({ color: (e.target as HTMLInputElement).value }).run()}
                  value={editor.getAttributes('highlight').color || '#ffff00'}
                  className="w-6 h-6 p-0 border-0 bg-transparent rounded cursor-pointer"
                  title="Màu nền" aria-label="Màu nền"
                />
                <Highlighter className="w-3.5 h-3.5 absolute pointer-events-none left-1.5 top-1.5 text-slate-600 mix-blend-difference" />
              </div>
            </div>

            <div className="h-4 w-px bg-slate-200 mx-1" />

            {/* Alignment */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => editor.chain().focus().setTextAlign('left').run()}
                className={`p-1.5 rounded hover:bg-white transition-colors ${
                  editor.isActive({ textAlign: 'left' }) ? 'bg-white shadow-sm text-yellow-600' : 'text-slate-600'
                }`}
                title="Căn trái" aria-label="Căn trái"
              >
                <AlignLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => editor.chain().focus().setTextAlign('center').run()}
                className={`p-1.5 rounded hover:bg-white transition-colors ${
                  editor.isActive({ textAlign: 'center' }) ? 'bg-white shadow-sm text-yellow-600' : 'text-slate-600'
                }`}
                title="Căn giữa" aria-label="Căn giữa"
              >
                <AlignCenter className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => editor.chain().focus().setTextAlign('right').run()}
                className={`p-1.5 rounded hover:bg-white transition-colors ${
                  editor.isActive({ textAlign: 'right' }) ? 'bg-white shadow-sm text-yellow-600' : 'text-slate-600'
                }`}
                title="Căn phải" aria-label="Căn phải"
              >
                <AlignRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => editor.chain().focus().setTextAlign('justify').run()}
                className={`p-1.5 rounded hover:bg-white transition-colors ${
                  editor.isActive({ textAlign: 'justify' }) ? 'bg-white shadow-sm text-yellow-600' : 'text-slate-600'
                }`}
                title="Căn đều 2 bên" aria-label="Căn đều 2 bên"
              >
                <AlignJustify className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="h-4 w-px bg-slate-200 mx-1" />
            
            {/* Line Spacing */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
              <div className="flex items-center gap-1 text-slate-600 px-1" title="Khoảng cách dòng">
                <WrapText className="w-3.5 h-3.5" />
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      editor.chain().focus().setLineSpacing(e.target.value).run();
                    } else {
                      editor.chain().focus().unsetLineSpacing().run();
                    }
                  }}
                  className="text-xs bg-transparent border-none focus:ring-0 text-slate-700 py-1 px-1 w-[55px] hover:bg-white rounded transition-colors"
                >
                  <option value="1.0">1.0</option>
                  <option value="1.15">1.15</option>
                  <option value="1.5">1.5</option>
                  <option value="2.0">2.0</option>
                </select>
              </div>
            </div>

            <div className="h-4 w-px bg-slate-200 mx-1" />

            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                className={`p-1.5 rounded hover:bg-white transition-colors ${
                  editor.isActive('heading', { level: 1 }) ? 'bg-white shadow-sm text-yellow-600 font-bold' : 'text-slate-600'
                }`}
                title="Tiêu đề 1" aria-label="Tiêu đề 1"
              >
                <Heading1 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className={`p-1.5 rounded hover:bg-white transition-colors ${
                  editor.isActive('heading', { level: 2 }) ? 'bg-white shadow-sm text-yellow-600 font-bold' : 'text-slate-600'
                }`}
                title="Tiêu đề 2" aria-label="Tiêu đề 2"
              >
                <Heading2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                className={`p-1.5 rounded hover:bg-white transition-colors ${
                  editor.isActive('heading', { level: 3 }) ? 'bg-white shadow-sm text-yellow-600 font-bold' : 'text-slate-600'
                }`}
                title="Tiêu đề 3" aria-label="Tiêu đề 3"
              >
                <Heading3 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={`p-1.5 rounded hover:bg-white transition-colors ${
                  editor.isActive('bulletList') ? 'bg-white shadow-sm text-yellow-600' : 'text-slate-600'
                }`}
                title="Danh sách gạch đầu dòng" aria-label="Danh sách gạch đầu dòng"
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={`p-1.5 rounded hover:bg-white transition-colors ${
                  editor.isActive('orderedList') ? 'bg-white shadow-sm text-yellow-600' : 'text-slate-600'
                }`}
                title="Danh sách đánh số" aria-label="Danh sách đánh số"
              >
                <ListOrdered className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="h-4 w-px bg-slate-200 mx-1" />

            {/* Insert Table & Page Break */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
                className="px-2.5 py-1.5 border border-slate-200 hover:border-yellow-500 rounded-lg flex items-center gap-1 text-slate-700 hover:text-yellow-700 bg-slate-50 hover:bg-white transition-colors font-medium"
              >
                <TableIcon className="w-3.5 h-3.5 text-blue-600" />
                <span>Chèn Bảng (3x3)</span>
              </button>
              <button
                onClick={() => editor.chain().focus().setPageBreak().run()}
                className="px-2.5 py-1.5 border border-slate-200 hover:border-yellow-500 rounded-lg flex items-center gap-1 text-slate-700 hover:text-yellow-700 bg-slate-50 hover:bg-white transition-colors font-medium"
              >
                <SplitSquareHorizontal className="w-3.5 h-3.5 text-blue-600" />
                <span>Ngắt Trang</span>
              </button>
            </div>
          </>
        )}

        {activeTab === 'layout' && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 text-yellow-800 px-3 py-1.5 rounded-lg">
              <FileCheck className="w-4 h-4 text-yellow-600" />
              <span className="font-bold">Thể thức NĐ 30/2020/NĐ-CP:</span>
              <span className="text-[11px] opacity-90">Phông Times New Roman 14pt | Lề: Trái 3cm, Phải 2cm, Trên 2cm, Dưới 2cm</span>
            </div>
          </div>
        )}

        {activeTab === 'review' && (
          <div className="flex items-center gap-3">
            <button
              disabled
              title="Track Changes tự động đang được phát triển — hiện tại nút này chưa ghi nhận thay đổi thật trên tài liệu." aria-label="Track Changes tự động đang được phát triển — hiện tại nút này chưa ghi nhận thay đổi thật trên tài liệu."
              className="px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-bold shadow-sm bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed"
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>Track Changes (Sắp ra mắt)</span>
            </button>
            <button
              className="px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 rounded-lg flex items-center gap-1.5 font-bold transition-colors shadow-sm"
              onClick={() => {
                const comment = window.prompt('Nhập nội dung ghi chú pháp lý (Comment):');
                if (comment && comment.trim()) {
                  editor.chain().focus().insertContent(`<span style="background-color: #fef08a; padding: 2px 6px; border-radius: 4px; border: 1px dashed #ca8a04; font-size: 11px; color: #854d0e; font-family: sans-serif; font-weight: 600;">[GHI CHÚ: ${comment.trim()}]</span> `).run();
                }
              }}
            >
              <Type className="w-3.5 h-3.5 text-blue-600" />
              <span>Thêm Ghi chú (Comment)</span>
            </button>
          </div>
        )}


        {activeTab === 'legal' && (
          <div className="flex items-center gap-2">
            <button
              onClick={onScanValidity}
              className="px-3 py-1.5 bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 rounded-lg flex items-center gap-1.5 font-bold transition-colors shadow-sm"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-red-500" />
              <span>Quét Rủi ro Hiệu lực</span>
            </button>
            <button
              onClick={onInsertCitationPrompt}
              className="px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 rounded-lg flex items-center gap-1.5 font-bold transition-colors shadow-sm"
            >
              <BookOpen className="w-3.5 h-3.5 text-blue-600" />
              <span>Tra cứu Căn cứ Pháp lý RAG</span>
            </button>
            <a
              href="/hop-dong/lich-nhac-han"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100 rounded-lg flex items-center gap-1.5 font-bold transition-colors shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Lịch Mốc Hạn HĐ (.ics)</span>
            </a>
          </div>
        )}

      </div>
    </div>
  );
}
