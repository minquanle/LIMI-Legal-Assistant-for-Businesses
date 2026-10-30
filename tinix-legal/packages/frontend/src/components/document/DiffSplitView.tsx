'use client';
import React from 'react';
import { Diff } from 'diff-match-patch';

const DIFF_DELETE = -1;
const DIFF_INSERT = 1;

export function DiffSplitView({ diffs }: { diffs: Diff[] }) {
  const renderLeft = () => {
    return diffs.map((diff, index) => {
      const [type, text] = diff;
      if (type === DIFF_INSERT) return null;
      if (type === DIFF_DELETE) {
        return <span key={index} className="bg-red-200 text-red-900 line-through rounded px-1">{text}</span>;
      }
      return <span key={index}>{text}</span>;
    });
  };

  const renderRight = () => {
    return diffs.map((diff, index) => {
      const [type, text] = diff;
      if (type === DIFF_DELETE) return null;
      if (type === DIFF_INSERT) {
        return <span key={index} className="bg-green-200 text-green-900 font-medium rounded px-1">{text}</span>;
      }
      return <span key={index}>{text}</span>;
    });
  };

  return (
    <div className="flex flex-col md:flex-row gap-0 w-full h-[600px] border border-slate-200 rounded-lg overflow-hidden shadow-sm">
      <div className="flex-1 flex flex-col border-r border-slate-200 bg-white">
        <div className="bg-slate-50 p-3 font-semibold text-sm border-b border-slate-200 text-center text-slate-700">Văn bản cũ</div>
        <div className="p-6 overflow-y-auto flex-1 whitespace-pre-wrap text-sm leading-relaxed text-slate-800">
          {renderLeft()}
        </div>
      </div>
      <div className="flex-1 flex flex-col bg-white">
        <div className="bg-slate-50 p-3 font-semibold text-sm border-b border-slate-200 text-center text-slate-700">Văn bản mới</div>
        <div className="p-6 overflow-y-auto flex-1 whitespace-pre-wrap text-sm leading-relaxed text-slate-800">
          {renderRight()}
        </div>
      </div>
    </div>
  );
}
