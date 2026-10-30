import { apiClient } from "@/lib/api-client";
import { SearchResultCard } from "@/components/search/SearchResultCard";
import { SearchFilterSidebar } from "@/components/search/SearchFilterSidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ChevronLeft, ChevronRight, FileText } from "lucide-react";
import { DOCUMENT_TYPE_LABELS, VALIDITY_STATUS_INFO } from "@/lib/document-labels";

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 30;

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    documentType?: string;
    validityStatus?: string;
    issuingBody?: string;
    field?: string;
    yearFrom?: string;
    yearTo?: string;
    exact?: string;
    scope?: string;
    skip?: string;
  }>;
}) {
  const sp = await searchParams;
  const q = sp.q || "";
  const documentType = sp.documentType || "";
  const validityStatus = sp.validityStatus || "";
  const issuingBody = sp.issuingBody || "";
  const field = sp.field || "";
  const yearFrom = sp.yearFrom || "";
  const yearTo = sp.yearTo || "";
  const exact = sp.exact || "false";
  const scope = sp.scope || "all";
  const skip = Math.max(0, parseInt(sp.skip || "0", 10) || 0);

  const page = Math.floor(skip / PAGE_SIZE) + 1;

  let results: any[] = [];
  let total = 0;
  let searchFailed = false;
  let searchDegraded = false;

  try {
    const searchRes = await apiClient.searchDocuments({
      q,
      documentType,
      issuingBody,
      validityStatus,
      field,
      exact,
      scope,
      yearFrom: yearFrom || undefined,
      yearTo: yearTo || undefined,
      page,
      limit: PAGE_SIZE,
      hybrid: true,
    });
    results = searchRes.results || [];
    total = searchRes.total || 0;
    searchDegraded = !!(searchRes as any).degraded;
  } catch (err) {
    console.error("Backend search API error:", err);
    searchFailed = true;
  }

  // Fetch sidebar facet statistics via API
  let facetsData: any = { documentTypes: [], validityStatuses: [], issuingBodies: [] };
  try {
    facetsData = await apiClient.getFacetsStats();
  } catch (err) {
    console.error("Backend facets API error:", err);
  }

  const typeStats = (facetsData.documentTypes || []).map((t: any) => ({
    documentType: t.value,
    _count: { id: t.count },
  }));
  const validityCounts = (facetsData.validityStatuses || []).map((v: any) => ({
    validityStatus: v.value,
    _count: { id: v.count },
  }));
  const bodyStats = (facetsData.issuingBodies || []).map((b: any) => ({
    issuingBody: b.value,
    _count: { id: b.count },
  }));
  const fieldStats = (facetsData.fields || []).map((f: any) => ({
    field: f.value,
    _count: { id: f.count },
  }));


  const typeLabels = DOCUMENT_TYPE_LABELS;
  const validityLabels: Record<string, string> = Object.fromEntries(
    Object.entries(VALIDITY_STATUS_INFO).map(([status, info]) => [status, info.label])
  );

  // Calc pagination
  const hasPrev = skip > 0;
  const hasNext = skip + PAGE_SIZE < total;
  const pageStart = total > 0 ? skip + 1 : 0;
  const pageEnd = Math.min(skip + PAGE_SIZE, total);

  function pageUrl(override: Record<string, string | undefined>): string {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (documentType) p.set("documentType", documentType);
    if (validityStatus) p.set("validityStatus", validityStatus);
    if (issuingBody) p.set("issuingBody", issuingBody);
    if (field) p.set("field", field);
    if (yearFrom) p.set("yearFrom", yearFrom);
    if (yearTo) p.set("yearTo", yearTo);
    if (exact !== "false") p.set("exact", exact);
    if (scope !== "all") p.set("scope", scope);
    Object.entries(override).forEach(([k, v]) => (v ? p.set(k, v) : p.delete(k)));
    return `/search?${p.toString()}`;
  }

  const current = { q, documentType, validityStatus, issuingBody, field, yearFrom, yearTo, exact, scope };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">Tra cứu Văn bản Pháp luật</h1>
        <p className="text-slate-500 text-sm">Tìm kiếm trong hơn 158.000 văn bản pháp luật Việt Nam</p>
      </div>

      {/* Search Form */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-8">
        <form method="GET" action="/search" className="space-y-4">
          <div className="flex items-stretch gap-3">
            <div className="relative flex-1">
              <label htmlFor="search-q" className="sr-only">Tìm kiếm văn bản pháp luật</label>
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" aria-hidden="true" />
              <Input
                id="search-q"
                name="q"
                defaultValue={q}
                placeholder="Nhập số hiệu, trích yếu, hoặc nội dung văn bản..."
                className="pl-11 h-12 text-base border-slate-200"
              />
            </div>
            {/* Preserve other filters on search submit */}
            {documentType && <input type="hidden" name="documentType" value={documentType} />}
            {validityStatus && <input type="hidden" name="validityStatus" value={validityStatus} />}
            {issuingBody && <input type="hidden" name="issuingBody" value={issuingBody} />}
            {field && <input type="hidden" name="field" value={field} />}
            {yearFrom && <input type="hidden" name="yearFrom" value={yearFrom} />}
            {yearTo && <input type="hidden" name="yearTo" value={yearTo} />}

            <Button type="submit" size="lg" className="h-12 px-6 bg-[#0B1D51] hover:bg-[#132B6E] text-white font-medium cursor-pointer">
              Tìm kiếm
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-slate-100/50 text-sm text-slate-600">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                name="exact"
                value="true"
                defaultChecked={exact === "true"}
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="font-medium text-slate-700">Khớp cụm từ chính xác</span>
            </label>

            <div className="flex items-center gap-4">
              <span className="text-slate-400 font-medium">Phạm vi tìm:</span>
              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="radio"
                  name="scope"
                  value="all"
                  defaultChecked={scope !== "title"}
                  className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                />
                <span>Toàn văn nội dung</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="radio"
                  name="scope"
                  value="title"
                  defaultChecked={scope === "title"}
                  className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                />
                <span>Chỉ Tiêu đề & Trích yếu</span>
              </label>
            </div>
          </div>
        </form>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Sidebar Filters */}
        <div className="col-span-12 md:col-span-3">
          <SearchFilterSidebar
            typeStats={(typeStats as any[]).map((t: any) => ({
              value: t.documentType,
              label: typeLabels[t.documentType] || t.documentType,
              count: t._count.id,
            }))}
            validityCounts={(validityCounts as any[]).map((v: any) => ({
              value: v.validityStatus,
              label: validityLabels[v.validityStatus] || v.validityStatus,
              count: v._count.id,
            }))}
            issuingBodies={(bodyStats as any[])
              .filter((b: any) => b.issuingBody && b.issuingBody !== "nan")
              .map((b: any) => ({ value: b.issuingBody, label: b.issuingBody, count: b._count.id }))}
            fields={(fieldStats as any[])
              .filter((f: any) => f.field && f.field !== "nan" && f.field !== "Chưa phân loại")
              .map((f: any) => ({ value: f.field, label: f.field, count: f._count.id }))}
            current={current}
          />
        </div>

        {/* Search Results */}
        <div className="col-span-12 md:col-span-9 space-y-4">
          {searchFailed && (
            <div className="bg-red-50 border border-red-200 text-red-800 text-sm rounded-lg px-4 py-3">
              Hệ thống tìm kiếm hiện không phản hồi. Đây không phải là "không có kết quả" — vui lòng thử lại sau ít phút.
            </div>
          )}
          {!searchFailed && searchDegraded && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-lg px-4 py-3">
              Đang hiển thị kết quả ở chế độ dự phòng (chỉ mục toàn văn tạm thời gián đoạn) — kết quả có thể kém đầy đủ hơn bình thường.
            </div>
          )}
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-slate-800">
              {q ? `Kết quả cho "${q}"` : validityStatus ? validityLabels[validityStatus.split(",")[0]] || validityStatus : typeLabels[documentType.split(",")[0] || ""] || "Tất cả văn bản"}
            </h2>
            <span className="text-sm text-slate-400 bg-white px-3 py-1 rounded-full border">
              {results.length > 0 ? `${pageStart}–${pageEnd} / ${total.toLocaleString("vi-VN")}` : `${total.toLocaleString("vi-VN")} kết quả`}
            </span>
          </div>

          {results.length > 0 ? (
            <>
              <div className="space-y-3">
                {results.map((doc) => (
                  <SearchResultCard key={doc.id} document={doc as any} />
                ))}
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between pt-4">
                <div className="text-xs text-slate-400">
                  Trang {Math.floor(skip / PAGE_SIZE) + 1} / {Math.max(1, Math.ceil(total / PAGE_SIZE))}
                </div>
                <div className="flex gap-2">
                  {hasPrev ? (
                    <a
                      href={pageUrl({ skip: String(Math.max(0, skip - PAGE_SIZE)) })}
                      className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-slate-700 bg-white rounded-lg border border-slate-200 hover:border-blue-300 hover:text-blue-700 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" /> Trang trước
                    </a>
                  ) : (
                    <span className="flex items-center gap-1.5 px-4 py-2 text-sm text-slate-300 bg-slate-50 rounded-lg border border-slate-100 cursor-default">
                      <ChevronLeft className="w-4 h-4" /> Trang trước
                    </span>
                  )}
                  {hasNext ? (
                    <a
                      href={pageUrl({ skip: String(skip + PAGE_SIZE) })}
                      className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-slate-700 bg-white rounded-lg border border-slate-200 hover:border-blue-300 hover:text-blue-700 transition-colors"
                    >
                      Trang sau <ChevronRight className="w-4 h-4" />
                    </a>
                  ) : (
                    <span className="flex items-center gap-1.5 px-4 py-2 text-sm text-slate-300 bg-slate-50 rounded-lg border border-slate-100 cursor-default">
                      Trang sau <ChevronRight className="w-4 h-4" />
                    </span>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-16 text-center">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-1">Không tìm thấy kết quả</h3>
              <p className="text-sm text-slate-500">Vui lòng thử lại với từ khóa hoặc bộ lọc khác.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
