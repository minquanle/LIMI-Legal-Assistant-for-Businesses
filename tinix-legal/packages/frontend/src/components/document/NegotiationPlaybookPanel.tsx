'use client';
import React from 'react';
import { FileDown, AlertTriangle, CheckCircle, Info, BookOpen } from 'lucide-react';

interface PlaybookClause {
  name: string;
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  mustHave: string;
  preferred: string;
  walkAway: string;
}

export function NegotiationPlaybookPanel({ playbookData }: { playbookData: { clauses: PlaybookClause[] } }) {
  if (!playbookData || !playbookData.clauses) return null;

  const exportText = () => {
    const text = `SỔ TAY ĐÀM PHÁN HỢP ĐỒNG (AI NEGOTIATION PLAYBOOK)\nTinix Legal AI\n\n` +
      playbookData.clauses
        .map(
          (c, i) =>
            `--------------------------------------------------\n${i + 1}. ${c.name} [Mức rủi ro: ${c.riskLevel}]\n--------------------------------------------------\n• BẮT BUỘC (Must Have):\n  ${c.mustHave}\n\n• ƯU TIÊN (Preferred):\n  ${c.preferred}\n\n• TỪ CHỐI / ĐIỂM DỪNG (Walk Away):\n  ${c.walkAway}\n`
        )
        .join('\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `So_Tay_Dam_Phan_Playbook.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };


  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mt-6">
      <div className="border-b border-slate-200 bg-slate-50 p-4 flex items-center justify-between">
        <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-600" />
          Sổ tay Đàm phán (AI Playbook)
        </h2>
        <button onClick={exportText} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-sm transition">
          <FileDown className="w-4 h-4" />
          Tải văn bản (.txt)
        </button>
      </div>

      <div className="p-4 space-y-4">
        {playbookData.clauses.map((clause, idx) => (
          <div key={idx} className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="bg-slate-100 p-3 font-semibold text-slate-800 flex items-center gap-2 border-b">
              {clause.riskLevel === 'HIGH' && <AlertTriangle className="w-4 h-4 text-red-600" />}
              {clause.riskLevel === 'MEDIUM' && <AlertTriangle className="w-4 h-4 text-amber-500" />}
              {clause.riskLevel === 'LOW' && <CheckCircle className="w-4 h-4 text-green-600" />}
              {clause.name}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-200">
              <div className="p-4 bg-green-50/30">
                <div className="text-xs font-bold text-green-800 uppercase mb-2">Must Have (Bắt buộc)</div>
                <div className="text-sm text-slate-700">{clause.mustHave}</div>
              </div>
              <div className="p-4 bg-blue-50/30">
                <div className="text-xs font-bold text-blue-800 uppercase mb-2">Preferred (Ưu tiên)</div>
                <div className="text-sm text-slate-700">{clause.preferred}</div>
              </div>
              <div className="p-4 bg-red-50/30">
                <div className="text-xs font-bold text-red-800 uppercase mb-2">Walk Away (Từ chối)</div>
                <div className="text-sm text-slate-700">{clause.walkAway}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
