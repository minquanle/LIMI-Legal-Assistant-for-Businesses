import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { EnterpriseTemplateCatalog } from '@/components/editor/EnterpriseTemplateCatalog';
import {
  FileText,
  Plus,
  Sparkles,
  Clock,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import { format } from 'date-fns';

export default async function SoanThaoLandingPage() {
  const [templates, drafts] = await Promise.all([
    apiClient.getCopilotTemplates().catch(() => []),
    apiClient.getDrafts().catch(() => []),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-8 mb-8 shadow-sm relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full mb-4 border border-blue-100">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Legal Word Online & Kho Mẫu Doanh nghiệp</span>
          </div>
          <h1 className="text-3xl font-bold mb-3 text-slate-900">Soạn thảo Word Online & Sinh Văn bản Doanh nghiệp</h1>
          <p className="text-slate-500 text-sm leading-relaxed mb-6">
            Hệ thống trình soạn thảo WYSIWYG A4 Canvas chuẩn Word Online, tự động điền biến số mềm cho 15+ mẫu văn bản doanh nghiệp Việt Nam và tra cứu RAG kho luật &gt;158.000 văn bản.
          </p>
          <Link
            href="/soan-thao/moi"
            className="bg-blue-700 hover:bg-blue-800 text-white font-bold text-sm px-6 py-3 rounded-xl inline-flex items-center gap-2 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo dự thảo mới (Trang trắng)</span>
          </Link>
        </div>
      </div>

      {/* Templates Catalog Grid with 5 Categories */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            Kho Mẫu Văn bản Doanh nghiệp Việt Nam
          </h2>
        </div>
        <EnterpriseTemplateCatalog templates={templates} />
      </section>

      {/* Recent Drafts List */}
      <section>
        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-slate-600" />
          Dự thảo gần đây
        </h2>
        {drafts.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-400 text-sm">
            Chưa có bản dự thảo nào. Hãy chọn một mẫu văn bản ở trên hoặc nhấn "Tạo dự thảo mới" để bắt đầu!
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100 shadow-sm">
            {drafts.map((d) => (
              <Link
                key={d.id}
                href={`/soan-thao/${d.id}`}
                className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">
                      {d.title}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      Cập nhật: {format(new Date(d.updatedAt), 'dd/MM/yyyy HH:mm')}
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 transition-colors" />
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
