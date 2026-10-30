'use client';

import React, { useState } from 'react';
import { BookOpen, FileCheck, ChevronRight, Sparkles, Building2, Users, Scale, ShoppingBag, Landmark } from 'lucide-react';
import { TemplateWizardModal } from './TemplateWizardModal';

interface EnterpriseTemplateCatalogProps {
  templates: any[];
}

const CATEGORIES = [
  { id: 'ALL', name: 'Tất cả mẫu', icon: BookOpen },
  { id: 'Hành chính & Quản trị', name: 'Hành chính & Quản trị', icon: Building2 },
  { id: 'Nhân sự & Lao động', name: 'Nhân sự & Lao động', icon: Users },
  { id: 'Pháp chế & Đầu tư', name: 'Pháp chế & Đầu tư', icon: Scale },
  { id: 'Mua bán & Thương mại', name: 'Mua bán & Thương mại', icon: ShoppingBag },
  { id: 'Tài chính & Kế toán', name: 'Tài chính & Kế toán', icon: Landmark },
];

export function EnterpriseTemplateCatalog({ templates }: EnterpriseTemplateCatalogProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [activeModalTemplate, setActiveModalTemplate] = useState<any | null>(null);

  const filteredTemplates = selectedCategory === 'ALL'
    ? templates
    : templates.filter((t) => t.category === selectedCategory);

  return (
    <div>
      {/* Category Tabs Header */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all ${
                isSelected
                  ? 'bg-yellow-500 text-[#0B1D51] shadow-md font-bold'
                  : 'bg-white border border-slate-200 text-slate-700 hover:border-yellow-500'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>

      {/* Template Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {filteredTemplates.map((tpl) => (
          <div
            key={tpl.id}
            onClick={() => setActiveModalTemplate(tpl)}
            className="bg-white border border-slate-200 hover:border-yellow-500 rounded-xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-yellow-50 text-yellow-700 flex items-center justify-center group-hover:bg-yellow-100 transition-colors">
                  <FileCheck className="w-5 h-5" />
                </div>
                <span className="text-[10px] bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-medium">
                  {tpl.category}
                </span>
              </div>
              <h3 className="font-bold text-slate-900 text-sm mb-1.5 group-hover:text-yellow-700 transition-colors">
                {tpl.title}
              </h3>
              <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4">{tpl.description}</p>
            </div>

            <div className="text-xs text-blue-600 font-semibold flex items-center gap-1 pt-2 border-t border-slate-100">
              <Sparkles className="w-3.5 h-3.5 text-yellow-500" />
              <span>Dùng mẫu này (Điền biến số)</span>
              <ChevronRight className="w-3.5 h-3.5 ml-auto" />
            </div>
          </div>
        ))}
      </div>

      {/* Smart Variable Wizard Modal */}
      {activeModalTemplate && (
        <TemplateWizardModal
          template={activeModalTemplate}
          onClose={() => setActiveModalTemplate(null)}
        />
      )}
    </div>
  );
}
