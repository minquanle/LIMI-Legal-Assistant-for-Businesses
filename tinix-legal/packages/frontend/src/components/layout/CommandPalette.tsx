'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Search, FileText, UploadCloud, BarChart3, ShieldCheck, Cpu,
  GitFork, Layers, ArrowRight, X, Command, Bell,
  type LucideIcon,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ActionItem {
  id: string;
  title: string;
  category: 'Actions' | 'Navigation' | 'Admin';
  icon: LucideIcon;
  shortcut: string;
  href: string;
}

const ACTION_ITEMS: ActionItem[] = [
  { id: 'a1', title: 'Tạo Dự thảo Văn bản Doanh nghiệp (NĐ 30)', category: 'Actions', icon: FileText, shortcut: 'Ctrl+N', href: '/soan-thao' },
  { id: 'a2', title: 'Audit Rủi ro Hợp đồng Thương mại', category: 'Actions', icon: UploadCloud, shortcut: 'Ctrl+U', href: '/contract-audit' },
  { id: 'a9', title: 'Cảnh Báo & Nhắc Hạn Luật Mới (2025–2026)', category: 'Actions', icon: Bell, shortcut: 'Ctrl+B', href: '/canh-bao-luat-moi' },
  { id: 'a3', title: 'Khám Sức Khỏe Pháp Lý Doanh Nghiệp 360°', category: 'Actions', icon: ShieldCheck, shortcut: 'Ctrl+H', href: '/legal-healthcheck' },
  { id: 'a4', title: 'Sơ đồ Tư duy Pháp lý Mindmap Hub', category: 'Navigation', icon: GitFork, shortcut: 'Ctrl+M', href: '/mindmap' },
  { id: 'a5', title: 'Sổ Tay Án Lệ Tòa Án Nhân Dân Tối Cao', category: 'Navigation', icon: FileText, shortcut: 'Ctrl+J', href: '/an-le' },
  { id: 'a6', title: 'So Sánh Luật Cũ - Mới (Side-by-side Diff)', category: 'Navigation', icon: Layers, shortcut: 'Ctrl+D', href: '/so-sanh-luat' },
  { id: 'a7', title: 'Radar Pháp Lý Tuân Thủ 10 Nhóm Ngành', category: 'Navigation', icon: BarChart3, shortcut: 'Ctrl+R', href: '/radar-phap-ly' },
  { id: 'a8', title: 'Cấu hình AI Provider & BYOK Keys', category: 'Admin', icon: Cpu, shortcut: 'Ctrl+P', href: '/admin/ai-byok-config' },
];



export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Array<HTMLDivElement | null>>([]);
  const router = useRouter();

  // Listen for Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      document.body.style.overflow = 'auto';
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const filteredItems = ACTION_ITEMS.filter((item) =>
    item.title.toLowerCase().includes(query.toLowerCase())
  );

  // Keep the highlighted row visible: the list scrolls, so arrowing past the
  // last visible item would otherwise select something off-screen.
  useEffect(() => {
    itemRefs.current[selectedIndex]?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  const handleSelect = (href: string) => {
    setIsOpen(false);
    router.push(href);
  };

  const moveSelection = (delta: number) => {
    if (filteredItems.length === 0) return;
    setSelectedIndex((prev) => (prev + delta + filteredItems.length) % filteredItems.length);
  };

  const handleInputChange = (value: string) => {
    setQuery(value);
    // Reset during the same event rather than in an effect keyed on `query`,
    // which would render one frame with a stale (possibly out-of-range) index.
    setSelectedIndex(0);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      moveSelection(1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      moveSelection(-1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item = filteredItems[selectedIndex];
      if (item) handleSelect(item.href);
    }
  };

  /**
   * Focus trap. The dialog declares aria-modal="true", so focus must not be
   * able to reach the page behind it — otherwise assistive tech announces a
   * modal while the user tabs into content that is visually covered.
   */
  const handleDialogKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Tab') return;
    const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    if (!focusables || focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-start justify-center pt-20 px-4 z-50 animate-in fade-in duration-200"
      onClick={() => setIsOpen(false)}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Bảng lệnh nhanh"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleDialogKeyDown}
        className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col"
      >

        {/* Search Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" aria-hidden="true" />
          <label htmlFor="command-palette-input" className="sr-only">Tìm nhanh tính năng</label>
          <input
            id="command-palette-input"
            ref={inputRef}
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleInputKeyDown}
            role="combobox"
            aria-expanded="true"
            aria-controls="command-palette-list"
            aria-activedescendant={filteredItems[selectedIndex] ? `command-palette-item-${filteredItems[selectedIndex].id}` : undefined}
            placeholder="Gõ lệnh hoặc tìm nhanh tính năng, văn bản (Ctrl + K)..."
            className="w-full text-sm bg-transparent border-none text-slate-900 dark:text-slate-100 focus:outline-none placeholder-slate-400"
          />
          {query && (
            <button onClick={() => setQuery('')} aria-label="Xóa tìm kiếm" className="p-1 text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">ESC</span>
        </div>

        {/* Action Items List */}
        <div id="command-palette-list" role="listbox" className="max-h-96 overflow-y-auto p-2 space-y-1">
          {filteredItems.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">Không tìm thấy tính năng phù hợp với &quot;{query}&quot;</div>
          ) : (
            filteredItems.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  ref={(el) => { itemRefs.current[idx] = el; }}
                  id={`command-palette-item-${item.id}`}
                  role="option"
                  aria-selected={idx === selectedIndex}
                  onClick={() => handleSelect(item.href)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`p-3 rounded-xl flex items-center justify-between cursor-pointer transition ${
                    idx === selectedIndex
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                      <Icon className="w-4 h-4" aria-hidden="true" />
                    </div>
                    <span className="text-xs font-bold">{item.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">{item.shortcut}</span>
                    <ArrowRight className="w-3.5 h-3.5 opacity-50" aria-hidden="true" />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1"><Command className="w-3 h-3" /> Phím tắt Tinix Legal Next-Gen</span>
          <span>Dùng phím mũi tên để chọn, Enter để mở</span>
        </div>

      </div>
    </div>
  );
}
