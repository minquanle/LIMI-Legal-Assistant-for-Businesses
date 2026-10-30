'use client';

import React, { useState, useRef, useEffect } from 'react';
import { BubbleMenu } from '@tiptap/react/menus';
import { Editor } from '@tiptap/react';
import DOMPurify from 'dompurify';

/** Sanitizes AI-generated HTML before it is inserted into the editor (XSS defense-in-depth). */
function sanitizeAIHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'strong', 'em', 'u', 'br', 'span', 'ul', 'ol', 'li', 'mark'],
    ALLOWED_ATTR: ['class'],
  });
}
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignJustify,
  Highlighter,
  Sparkles,
  ChevronDown,
  BookOpen,
  ShieldAlert,
  AlertTriangle,
  Indent,
  Check,
  X,
  Plus,
  Send,
  Loader2,
  FileCheck2,
  Minimize2,
  Maximize2,
  ShieldCheck,
  Scale,
  ArrowDown,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { computeTextDiff } from '@/lib/diff-utils';

interface SelectionContextMenuProps {
  editor: Editor | null;
  documentTitle?: string;
  onScanValidity?: () => void;
  onInsertCitation?: (citation: string) => void;
}

export function SelectionContextMenu({
  editor,
  documentTitle,
  onScanValidity,
  onInsertCitation,
}: SelectionContextMenuProps) {
  const [aiMenuOpen, setAiMenuOpen] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [diffData, setDiffData] = useState<{
    originalText: string;
    suggestedText: string;
    diffs: Array<[number, string]>;
  } | null>(null);

  const [legalSuggestions, setLegalSuggestions] = useState<any[] | null>(null);
  const [searchingLaws, setSearchingLaws] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setAiMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!editor) return null;

  const getSelectedText = () => {
    const { from, to } = editor.state.selection;
    return editor.state.doc.textBetween(from, to, ' ');
  };

  const handleAIAction = async (actionType: string, customText?: string) => {
    const text = getSelectedText();
    if (!text || !text.trim()) return;

    setLoading(true);
    setAiMenuOpen(false);
    setLegalSuggestions(null);
    setAiError(null);

    try {
      const res = await apiClient.executeContextualAIAction({
        action: actionType,
        selectedText: text,
        customPrompt: customText || customPrompt,
        documentTitle: documentTitle || 'Dự thảo văn bản pháp lý',
      });

      if (res && res.result) {
        const diffs = computeTextDiff(text, res.result);
        setDiffData({
          originalText: text,
          suggestedText: res.result,
          diffs,
        });
      }
    } catch (err) {
      console.error('Error executing AI action:', err);
      setAiError('Không thể thực hiện yêu cầu AI. Vui lòng thử lại.');
    } finally {
      setLoading(false);
      setCustomPrompt('');
    }
  };

  const handleLookupLaws = async () => {
    const text = getSelectedText();
    if (!text || !text.trim()) return;

    setSearchingLaws(true);
    setAiMenuOpen(false);
    setDiffData(null);

    // Clean text: strip article numbers and punctuation to extract core search terms
    const cleanTerms = text
      .replace(/^Điều\s+\d+[\.:]?/i, '')
      .replace(/^Khoản\s+\d+[\.:]?/i, '')
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .trim()
      .split(/\s+/)
      .filter((w) => w.length > 1)
      .slice(0, 6)
      .join(' ');

    const finalQuery = cleanTerms || text.slice(0, 40).trim();

    try {
      const res = await apiClient.searchDocuments({
        q: finalQuery,
        limit: 4,
      });

      setLegalSuggestions(res?.results || []);
    } catch (err) {
      console.warn('Failed to search laws, graceful fallback:', err);
      setLegalSuggestions([]);
    } finally {
      setSearchingLaws(false);
    }
  };


  const handleApplyDiffReplace = () => {
    if (!diffData || !editor) return;
    editor.chain().focus().insertContent(sanitizeAIHtml(diffData.suggestedText)).run();
    setDiffData(null);
  };

  const handleApplyDiffInsertBelow = () => {
    if (!diffData || !editor) return;
    const { to } = editor.state.selection;
    editor
      .chain()
      .focus()
      .setTextSelection(to)
      .insertContent(`<p>${sanitizeAIHtml(diffData.suggestedText)}</p>`)
      .run();
    setDiffData(null);
  };

  const handleApplyIndent = () => {
    // Set Decree 30 standard 1.27cm first line indent
    editor.chain().focus().setTextAlign('justify').run();
  };

  return (
    <>
      <BubbleMenu
        editor={editor}
        options={{
          placement: 'top',
        }}
      >
        <div className="font-sans antialiased bg-[#091536]/95 dark:bg-slate-950/95 backdrop-blur-2xl border border-white/15 shadow-[0_12px_36px_rgba(0,0,0,0.45),0_0_0_1px_rgba(255,255,255,0.08)] rounded-2xl p-1.5 flex flex-col gap-1.5 text-white animate-in fade-in-0 zoom-in-95 duration-150 select-none max-w-2xl whitespace-nowrap">
          
          {/* Main Action Bar */}
          <div className="flex items-center gap-1.5">
            
            {/* Quick Formatting Segmented Group */}
            <div className="flex items-center bg-white/[0.06] border border-white/10 rounded-xl p-0.5 gap-0.5">
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={`p-1.5 rounded-lg transition-all active:scale-95 ${
                  editor.isActive('bold')
                    ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                    : 'text-white/75 hover:text-white hover:bg-white/10'
                }`}
                title="In đậm (Ctrl+B)" aria-label="In đậm (Ctrl+B)"
              >
                <Bold className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={`p-1.5 rounded-lg transition-all active:scale-95 ${
                  editor.isActive('italic')
                    ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                    : 'text-white/75 hover:text-white hover:bg-white/10'
                }`}
                title="In nghiêng (Ctrl+I)" aria-label="In nghiêng (Ctrl+I)"
              >
                <Italic className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                className={`p-1.5 rounded-lg transition-all active:scale-95 ${
                  editor.isActive('underline')
                    ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                    : 'text-white/75 hover:text-white hover:bg-white/10'
                }`}
                title="Gạch chân (Ctrl+U)" aria-label="Gạch chân (Ctrl+U)"
              >
                <UnderlineIcon className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => editor.chain().focus().toggleStrike().run()}
                className={`p-1.5 rounded-lg transition-all active:scale-95 ${
                  editor.isActive('strike')
                    ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                    : 'text-white/75 hover:text-white hover:bg-white/10'
                }`}
                title="Gạch ngang" aria-label="Gạch ngang"
              >
                <Strikethrough className="w-3.5 h-3.5" />
              </button>

              <div className="h-4 w-px bg-white/15 mx-0.5" />

              <button
                type="button"
                onClick={() => editor.chain().focus().setTextAlign('justify').run()}
                className={`p-1.5 rounded-lg transition-all active:scale-95 ${
                  editor.isActive({ textAlign: 'justify' })
                    ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                    : 'text-white/75 hover:text-white hover:bg-white/10'
                }`}
                title="Căn đều 2 bên (Justify)" aria-label="Căn đều 2 bên (Justify)"
              >
                <AlignJustify className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => editor.chain().focus().setTextAlign('center').run()}
                className={`p-1.5 rounded-lg transition-all active:scale-95 ${
                  editor.isActive({ textAlign: 'center' })
                    ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                    : 'text-white/75 hover:text-white hover:bg-white/10'
                }`}
                title="Căn giữa (Center)" aria-label="Căn giữa (Center)"
              >
                <AlignCenter className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => editor.chain().focus().toggleHighlight({ color: '#fef08a' }).run()}
                className={`p-1.5 rounded-lg transition-all active:scale-95 ${
                  editor.isActive('highlight')
                    ? 'bg-yellow-400 text-slate-950 font-bold shadow-sm'
                    : 'text-yellow-300 hover:text-yellow-200 hover:bg-white/10'
                }`}
                title="Đánh dấu Highlight" aria-label="Đánh dấu Highlight"
              >
                <Highlighter className="w-3.5 h-3.5" />
              </button>

              <div className="h-4 w-px bg-white/15 mx-0.5" />

              <button
                type="button"
                onClick={handleApplyIndent}
                className="px-2 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 font-medium text-[11px] flex items-center gap-1 transition-all active:scale-95"
                title="Thụt lề đầu dòng chuẩn NĐ 30/2020 (1.27cm)" aria-label="Thụt lề đầu dòng chuẩn NĐ 30/2020 (1.27cm)"
              >
                <Indent className="w-3 h-3" />
                <span>1.27cm</span>
              </button>
            </div>

            <div className="h-5 w-px bg-white/15" />

            {/* AI Writing Copilot Button */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setAiMenuOpen(!aiMenuOpen)}
                disabled={loading}
                aria-expanded={aiMenuOpen}
                aria-haspopup="menu"
                className="whitespace-nowrap px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-[0_2px_12px_rgba(251,191,36,0.35)] transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>Trợ lý AI</span>
                <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${aiMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* AI Dropdown Menu */}
              {aiMenuOpen && (
                <div className="absolute top-full right-0 mt-2 w-72 bg-[#091536]/98 dark:bg-slate-950/98 backdrop-blur-2xl border border-amber-500/30 shadow-[0_16px_48px_rgba(0,0,0,0.5)] rounded-2xl p-2.5 z-50 animate-in fade-in-0 zoom-in-95 duration-150 text-white font-sans">
                  <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider px-2 py-1 flex items-center justify-between border-b border-white/10 pb-1.5 mb-1.5">
                    <span>Tác vụ viết lại thông minh</span>
                    <Sparkles className="w-3 h-3 text-amber-400" />
                  </div>

                  <div className="space-y-1">
                    <button
                      type="button"
                      onClick={() => handleAIAction('formal_rewrite')}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left hover:bg-white/10 transition-colors text-xs group"
                    >
                      <FileCheck2 className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform shrink-0" />
                      <div>
                        <div className="font-semibold text-white group-hover:text-amber-300">Viết lại chuẩn NĐ 30/2020</div>
                        <div className="text-[10px] text-white/50">Văn phong hành chính trang trọng</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAIAction('shorten')}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left hover:bg-white/10 transition-colors text-xs group"
                    >
                      <Minimize2 className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform shrink-0" />
                      <div>
                        <div className="font-semibold text-white group-hover:text-amber-300">Rút gọn câu văn</div>
                        <div className="text-[10px] text-white/50">Diễn đạt súc tích, gãy gọn</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAIAction('expand')}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left hover:bg-white/10 transition-colors text-xs group"
                    >
                      <Maximize2 className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform shrink-0" />
                      <div>
                        <div className="font-semibold text-white group-hover:text-amber-300">Mở rộng & Diễn giải chi tiết</div>
                        <div className="text-[10px] text-white/50">Bổ sung điều kiện, thời hạn thực hiện</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAIAction('grammar_fix')}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left hover:bg-white/10 transition-colors text-xs group"
                    >
                      <Check className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform shrink-0" />
                      <div>
                        <div className="font-semibold text-white group-hover:text-amber-300">Sửa chính tả & Ngữ pháp</div>
                        <div className="text-[10px] text-white/50">Chuẩn hóa từ ngữ & dấu câu</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAIAction('compliance_sanctions')}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left hover:bg-white/10 transition-colors text-xs group"
                    >
                      <ShieldCheck className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform shrink-0" />
                      <div>
                        <div className="font-semibold text-white group-hover:text-amber-300">Thêm chế tài & Bảo vệ quyền</div>
                        <div className="text-[10px] text-white/50">Thêm phạt vi phạm và bồi thường</div>
                      </div>
                    </button>
                  </div>

                  <div className="border-t border-white/10 my-2" />

                  {/* Custom Prompt Input */}
                  <div className="p-1">
                    <div className="text-[10px] font-medium text-white/60 mb-1">Yêu cầu AI tùy chỉnh:</div>
                    <div className="flex items-center gap-1.5 bg-white/[0.08] rounded-xl px-2.5 py-1.5 border border-white/15 focus-within:border-amber-400 transition-colors">
                      <input
                        type="text"
                        value={customPrompt}
                        onChange={(e) => setCustomPrompt(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && customPrompt.trim()) {
                            e.preventDefault();
                            handleAIAction('custom_prompt', customPrompt);
                          }
                        }}
                        placeholder="Ví dụ: Đổi hạn thanh toán sang 30 ngày..."
                        className="bg-transparent text-white placeholder:text-white/40 text-xs w-full outline-none font-sans"
                      />
                      <button
                        type="button"
                        onClick={() => customPrompt.trim() && handleAIAction('custom_prompt', customPrompt)}
                        className="p-1 text-amber-400 hover:text-amber-300 transition-colors shrink-0"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Legal Lookup Button */}
            <button
              type="button"
              onClick={handleLookupLaws}
              className="whitespace-nowrap px-2.5 py-1.5 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 text-blue-300 hover:text-blue-200 text-xs font-medium flex items-center gap-1.5 transition-all active:scale-95"
              title="Tra cứu điều luật liên quan đến đoạn này" aria-label="Tra cứu điều luật liên quan đến đoạn này"
            >
              {searchingLaws ? <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-300" /> : <Scale className="w-3.5 h-3.5 text-blue-400" />}
              <span>Tra luật</span>
            </button>

            {/* Scan Risk Button */}
            {onScanValidity && (
              <button
                type="button"
                onClick={onScanValidity}
                className="p-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 hover:text-rose-200 transition-all active:scale-95"
                title="Quét rủi ro hiệu lực pháp lý" aria-label="Quét rủi ro hiệu lực pháp lý"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
              </button>
            )}

          </div>

        </div>
      </BubbleMenu>

      {/* AI action error — inline, matches the menu's own visual language instead of a blocking window.alert() */}
      {aiError && (
        <div
          role="alert"
          className="fixed bottom-6 right-6 max-w-sm bg-[#08163A]/98 dark:bg-slate-950/98 backdrop-blur-2xl border border-rose-500/40 rounded-2xl shadow-2xl p-3.5 z-50 animate-in slide-in-from-bottom-4 duration-200 text-white flex items-start gap-2.5"
        >
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" aria-hidden="true" />
          <span className="text-xs flex-1">{aiError}</span>
          <button
            type="button"
            onClick={() => setAiError(null)}
            aria-label="Đóng thông báo"
            className="text-white/50 hover:text-white shrink-0"
          >
            <X className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Floating Diff Preview Card */}
      {diffData && (
        <div className="fixed bottom-6 right-6 max-w-lg w-full bg-[#08163A]/98 dark:bg-slate-950/98 backdrop-blur-2xl border-2 border-yellow-500/50 rounded-2xl shadow-2xl p-4 z-50 animate-in slide-in-from-bottom-4 duration-200 text-white">
          <div className="flex items-center justify-between border-b border-white/10 pb-2.5 mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-yellow-400" />
              <span className="font-bold text-sm text-white">So sánh Đề xuất AI (Diff Preview)</span>
            </div>
            <button
              type="button"
              onClick={() => setDiffData(null)}
              className="p-1 text-white/50 hover:text-white rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Diff Content Box */}
          <div className="bg-slate-950/70 border border-white/10 rounded-xl p-3 max-h-48 overflow-y-auto text-xs leading-relaxed font-mono">
            {diffData.diffs.map(([op, text], idx) => {
              if (op === 1) {
                // Addition (Green)
                return (
                  <span key={idx} className="bg-emerald-500/20 text-emerald-300 font-semibold px-0.5 rounded">
                    {text}
                  </span>
                );
              }
              if (op === -1) {
                // Deletion (Red)
                return (
                  <span key={idx} className="bg-rose-500/20 text-rose-300 line-through px-0.5 rounded opacity-75">
                    {text}
                  </span>
                );
              }
              return <span key={idx} className="text-white/80">{text}</span>;
            })}
          </div>

          {/* Diff Action Buttons */}
          <div className="flex items-center justify-between mt-3.5 pt-2.5 border-t border-white/10 gap-2">
            <button
              type="button"
              onClick={() => setDiffData(null)}
              className="px-3 py-1.5 text-xs text-white/60 hover:text-white transition-colors"
            >
              Bỏ qua
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleApplyDiffInsertBelow}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
              >
                <ArrowDown className="w-3.5 h-3.5" />
                <span>Chèn xuống dưới</span>
              </button>
              <button
                type="button"
                onClick={handleApplyDiffReplace}
                className="px-4 py-1.5 bg-yellow-500 hover:bg-yellow-400 text-[#0B1D51] text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md transition-all active:scale-95"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Chấp nhận thay thế</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Legal Citations Lookup Result Card */}
      {legalSuggestions && (
        <div className="fixed bottom-6 right-6 max-w-md w-full bg-[#08163A]/98 dark:bg-slate-950/98 backdrop-blur-2xl border-2 border-blue-500/50 rounded-2xl shadow-2xl p-4 z-50 animate-in slide-in-from-bottom-4 duration-200 text-white">
          <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-blue-400" />
              <span className="font-bold text-sm text-white">Căn cứ pháp lý gợi ý ({legalSuggestions.length})</span>
            </div>
            <button
              type="button"
              onClick={() => setLegalSuggestions(null)}
              className="p-1 text-white/50 hover:text-white rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {legalSuggestions.length === 0 ? (
              <p className="text-xs text-white/50 italic py-2 text-center">Không tìm thấy điều luật khớp chính xác.</p>
            ) : (
              legalSuggestions.map((doc: any) => (
                <div
                  key={doc.id}
                  className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-2.5 transition-colors flex flex-col justify-between gap-1.5"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-yellow-400">{doc.documentNumber}</span>
                      <span className="text-[10px] text-white/40">{doc.documentType}</span>
                    </div>
                    <div className="text-xs font-semibold text-white line-clamp-2 mt-0.5">{doc.title}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const citationText = `(Theo ${doc.documentType} số ${doc.documentNumber} "${doc.title}")`;
                      editor.chain().focus().insertContent(sanitizeAIHtml(` ${citationText} `)).run();
                      setLegalSuggestions(null);
                    }}
                    className="self-end text-[11px] font-semibold text-blue-300 hover:text-yellow-300 flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Chèn căn cứ vào bài</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </>
  );
}
