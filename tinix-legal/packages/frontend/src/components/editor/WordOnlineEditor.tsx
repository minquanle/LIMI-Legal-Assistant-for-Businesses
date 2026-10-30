'use client';

import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import TextAlign from '@tiptap/extension-text-align';
import FontFamily from '@tiptap/extension-font-family';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import Underline from '@tiptap/extension-underline';
import { FontSize } from './extensions/FontSize';
import { LineSpacing } from './extensions/LineSpacing';
import { PageBreak } from './extensions/PageBreak';
import { TrackChangeAdd, TrackChangeDelete } from './extensions/TrackChangeMarks';
import { AutoRedline, RedlineSuggestion } from './extensions/AutoRedline';
import { CitationHighlight, CitationMatch } from './extensions/CitationHighlight';
import { FindReplaceModal } from './FindReplaceModal';
import { FloatingTableMenu } from './FloatingTableMenu';
import { FloatingSuggestionCard } from './FloatingSuggestionCard';

import { RibbonToolbar } from './RibbonToolbar';
import { SelectionContextMenu } from './SelectionContextMenu';
import { CheckCircle2, WifiOff } from 'lucide-react';
import { apiClient } from '@/lib/api-client';


interface WordOnlineEditorProps {
  initialContent: string;
  onChangeContent: (contentHtml: string) => void;
  onScanValidity: () => void;
  onInsertCitationPrompt: () => void;
  onAIAskPrompt: (prompt: string, selectedText: string) => void;
}

export function WordOnlineEditor({
  initialContent,
  onChangeContent,
  onScanValidity,
  onInsertCitationPrompt,
  onAIAskPrompt,
}: WordOnlineEditorProps) {
  const [headerText, setHeaderText] = React.useState('');
  const [footerText, setFooterText] = React.useState('');
  const [isFindReplaceOpen, setIsFindReplaceOpen] = React.useState(false);
  const [activeSuggestion, setActiveSuggestion] = React.useState<{ suggestion: RedlineSuggestion; position: { top: number; left: number } } | null>(null);
  const [zoomScale, setZoomScale] = React.useState<number>(100);
  // Surfaced in the status bar (not a toast — this fires on a background,
  // debounced scan on every pause in typing, so a per-failure toast would be
  // noisy) so the user has some visible signal when AI scanning has silently
  // stopped working, instead of it failing invisibly forever.
  const [scanDegraded, setScanDegraded] = React.useState(false);

  // Ref to track typing timer
  const typingTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  // Monotonically increasing token — lets an in-flight scan detect it has been
  // superseded by a newer keystroke and discard its (stale) results instead of
  // overwriting newer redlines/citations with an outdated response.
  const scanRequestIdRef = React.useRef(0);

  React.useEffect(() => {
    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      scanRequestIdRef.current += 1;
    };
  }, []);

  const handleRedlineClick = (suggestion: RedlineSuggestion, event: MouseEvent) => {
    setActiveSuggestion({
      suggestion,
      position: { top: event.clientY + window.scrollY + 15, left: event.clientX + window.scrollX - 100 },
    });
  };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      TextStyle,
      FontFamily,
      Color,
      Highlight.configure({ multicolor: true }),
      Subscript,
      Superscript,
      Underline,
      FontSize,
      LineSpacing,
      PageBreak,
      TrackChangeAdd,
      TrackChangeDelete,
      AutoRedline.configure({
        onRedlineClick: handleRedlineClick,
      }),
      CitationHighlight,
    ],
    content: initialContent || '<p>Nhập nội dung dự thảo...</p>',
    onUpdate: ({ editor }) => {
      onChangeContent(editor.getHTML());

      // Debounce logic for Auto-Redlining and Citations
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(async () => {
        const textContent = editor.getText();
        if (!textContent || textContent.trim().length < 5) return;

        const requestId = ++scanRequestIdRef.current;

        let scanFailed = false;

        // 1. Redline
        try {
          const redlineData = await apiClient.scanRedlines(textContent);
          if (requestId !== scanRequestIdRef.current) return; // superseded by a newer keystroke
          if (redlineData?.redlines && redlineData.redlines.length > 0) {
            editor.commands.setRedlines(redlineData.redlines);
          } else {
            editor.commands.clearRedlines();
          }
        } catch (e) {
          console.warn('[WordOnlineEditor] Auto-redlining skipped:', e);
          scanFailed = true;
        }

        // 2. Citation Validity
        try {
          const citationData = await apiClient.scanCitationValidity(textContent);
          if (requestId !== scanRequestIdRef.current) return; // superseded by a newer keystroke
          if (citationData?.citations && citationData.citations.length > 0) {
            editor.commands.setCitations(citationData.citations);
          } else {
            editor.commands.clearCitations();
          }
        } catch (e) {
          console.warn('[WordOnlineEditor] Citation scanning skipped:', e);
          scanFailed = true;
        }

        if (requestId === scanRequestIdRef.current) setScanDegraded(scanFailed);
      }, 2000);

    },
    immediatelyRender: false,
  });

  // Tiptap only reads `content` at construction time. When content is changed
  // externally (AI panel inserts, redline accept, draft load) the parent's
  // `initialContent` prop changes but the editor never re-reads it on its own —
  // without this, external inserts are silently lost on the next keystroke,
  // because onUpdate() below would then overwrite the parent state with the
  // editor's stale HTML. Guard against feedback loops by only pushing content
  // in when it actually differs from what the editor currently holds (a plain
  // typing-driven update already matches, so this is a no-op in that case).
  React.useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (initialContent && initialContent !== current) {
      editor.commands.setContent(initialContent, { emitUpdate: false });
    }
  }, [initialContent, editor]);

  const getSelectedText = () => {
    if (!editor) return '';
    const { from, to } = editor.state.selection;
    return editor.state.doc.textBetween(from, to, ' ');
  };

  return (
    <div className="flex flex-col h-full bg-slate-100 overflow-hidden flex-1 relative">
      {/* Ribbon Toolbar Component */}
      <RibbonToolbar
        editor={editor}
        onScanValidity={onScanValidity}
        onInsertCitationPrompt={onInsertCitationPrompt}
        onOpenFindReplace={() => setIsFindReplaceOpen(true)}
      />

      <FindReplaceModal 
        editor={editor} 
        isOpen={isFindReplaceOpen} 
        onClose={() => setIsFindReplaceOpen(false)} 
      />

      <FloatingTableMenu editor={editor} />

      {activeSuggestion && (
        <FloatingSuggestionCard
          suggestion={activeSuggestion.suggestion}
          position={activeSuggestion.position}
          onAccept={(id) => {
            if (editor) editor.commands.acceptRedline(id);
            setActiveSuggestion(null);
          }}
          onReject={() => setActiveSuggestion(null)}
        />
      )}

      {/* Dynamic Contextual Selection AI & Formatting Menu */}
      <SelectionContextMenu
        editor={editor}
        documentTitle={headerText || 'Dự thảo văn bản'}
        onScanValidity={onScanValidity}
      />

      {/* This is a fixed-width A4-print-fidelity WYSIWYG canvas (like Word/Google
          Docs web) by design — it does not reflow to narrow viewports, so warn
          rather than silently letting it overflow/clip on small screens. */}
      <div className="md:hidden bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs px-4 py-2 text-center">
        Trình soạn thảo này được tối ưu cho màn hình rộng (máy tính/tablet ngang). Trên điện thoại, một số chức năng có thể khó dùng.
      </div>

      {/* Main Editor Canvas Container */}
      <div className="flex-1 overflow-y-auto p-8 flex flex-col items-center bg-slate-200 custom-scrollbar">
        {/* Real A4 Paper Canvas with Responsive Zoom Scaling */}
        <div
          style={{
            transform: `scale(${zoomScale / 100})`,
            transformOrigin: 'top center',
            transition: 'transform 0.15s ease-out',
          }}
          className="w-[800px] min-h-[1123px] bg-white border border-slate-300 rounded-sm shadow-2xl p-[2.5cm_2cm_2.5cm_3cm] font-serif text-slate-900 leading-relaxed flex flex-col relative mb-8"
        >
          
          {/* Header Input */}
          <div className="border-b border-dashed border-slate-200 pb-2 mb-6 group select-none">
            <input 
              type="text" 
              value={headerText}
              onChange={(e) => setHeaderText(e.target.value)}
              placeholder="Thêm Header văn bản (VD: CÔNG TY CP TINIX)..."
              className="w-full bg-transparent outline-none text-xs text-slate-400 placeholder-slate-300 group-hover:bg-slate-50 transition-colors uppercase font-sans tracking-wider"
            />
          </div>

          <EditorContent
            editor={editor}
            className="prose max-w-none focus:outline-none flex-1 text-[15px] font-['Times_New_Roman',serif] min-h-[900px]"
          />

          {/* Footer Input */}
          <div className="border-t border-dashed border-slate-200 pt-3 mt-12 group select-none">
            <input 
              type="text" 
              value={footerText}
              onChange={(e) => setFooterText(e.target.value)}
              placeholder="Thêm Footer văn bản (VD: Trang 1/2 - Tài liệu Lưu hành Nội bộ)..."
              className="w-full bg-transparent outline-none text-xs text-slate-400 placeholder-slate-300 text-center group-hover:bg-slate-50 transition-colors font-sans"
            />
          </div>
        </div>
      </div>

      {/* Bottom Status Bar with Zoom Scale Controls */}
      <div className="bg-slate-200 border-t border-slate-300 py-1.5 px-4 flex items-center justify-between text-[11px] text-slate-600 font-sans select-none">
        <div className="flex items-center gap-3">
          <span>Khổ A4 (210 × 297 mm)</span>
          <span>•</span>
          <span>Lề chuẩn NĐ 30: Trái 3cm, Phải 2cm, Trên 2cm, Dưới 2cm</span>
          <span>•</span>
          <span>Phông chữ: Times New Roman</span>
        </div>
        <div className="flex items-center gap-3">
          <span>{editor?.getText().trim().split(/\s+/).filter(Boolean).length || 0} từ</span>
          <span>•</span>
          <span className="text-emerald-700 font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
            Chuẩn thể thức NĐ 30/2020/NĐ-CP
          </span>
          {scanDegraded && (
            <>
              <span>•</span>
              <span role="status" className="text-amber-700 font-bold flex items-center gap-1" title="Quét redline/căn cứ pháp lý tự động đang tạm gián đoạn">
                <WifiOff className="w-3 h-3" aria-hidden="true" />
                Quét AI tạm gián đoạn
              </span>
            </>
          )}
          <span>•</span>
          {/* Zoom Controller */}
          <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-300 rounded-lg px-2 py-0.5 shadow-inner">
            <button
              onClick={() => setZoomScale((prev) => Math.max(50, prev - 10))}
              className="px-1 text-slate-600 hover:text-slate-900 font-bold"
              title="Thu nhỏ"
            >
              -
            </button>
            <span className="text-[10px] font-mono font-bold text-slate-700 w-8 text-center">{zoomScale}%</span>
            <button
              onClick={() => setZoomScale((prev) => Math.min(150, prev + 10))}
              className="px-1 text-slate-600 hover:text-slate-900 font-bold"
              title="Phóng to"
            >
              +
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
