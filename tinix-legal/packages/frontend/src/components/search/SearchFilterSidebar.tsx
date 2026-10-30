"use client";

import { Filter, ChevronDown, ChevronUp, Search } from "lucide-react";
import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface FilterOption {
  value: string;
  label: string;
  count: number;
}

interface SearchFilterSidebarProps {
  typeStats: FilterOption[];
  validityCounts: FilterOption[];
  issuingBodies: FilterOption[];
  fields: FilterOption[];
  current: {
    q: string;
    documentType?: string;
    validityStatus?: string;
    issuingBody?: string;
    field?: string;
    yearFrom?: string;
    yearTo?: string;
    exact?: string;
    scope?: string;
  };
}

export function SearchFilterSidebar({ typeStats, validityCounts, issuingBodies, fields, current }: SearchFilterSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [showAllBodies, setShowAllBodies] = useState(false);
  const [showAllFields, setShowAllFields] = useState(false);
  const [bodySearch, setBodySearch] = useState("");
  const [fieldSearch, setFieldSearch] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);

  // Parse currently selected CSV filters
  const selectedTypes = current.documentType ? current.documentType.split(",").map(x => x.trim()).filter(Boolean) : [];
  const selectedStatuses = current.validityStatus ? current.validityStatus.split(",").map(x => x.trim()).filter(Boolean) : [];
  const selectedBodies = current.issuingBody ? current.issuingBody.split(",").map(x => x.trim()).filter(Boolean) : [];
  const selectedFields = current.field ? current.field.split(",").map(x => x.trim()).filter(Boolean) : [];

  const handleFilterToggle = (key: string, value: string, isChecked: boolean) => {
    let currentValues: string[] = [];
    if (key === "documentType") currentValues = selectedTypes;
    else if (key === "validityStatus") currentValues = selectedStatuses;
    else if (key === "issuingBody") currentValues = selectedBodies;
    else if (key === "field") currentValues = selectedFields;

    let nextValues: string[];
    if (isChecked) {
      nextValues = [...currentValues, value];
    } else {
      nextValues = currentValues.filter(v => v !== value);
    }

    const csvValue = nextValues.join(",");

    const params = new URLSearchParams();
    if (current.q) params.set("q", current.q);

    // Set other filters
    if (key !== "documentType" && current.documentType) params.set("documentType", current.documentType);
    if (key !== "validityStatus" && current.validityStatus) params.set("validityStatus", current.validityStatus);
    if (key !== "issuingBody" && current.issuingBody) params.set("issuingBody", current.issuingBody);
    if (key !== "field" && current.field) params.set("field", current.field);

    if (current.yearFrom) params.set("yearFrom", current.yearFrom);
    if (current.yearTo) params.set("yearTo", current.yearTo);
    if (current.exact && current.exact !== "false") params.set("exact", current.exact);
    if (current.scope && current.scope !== "all") params.set("scope", current.scope);

    // Update toggled filter
    if (csvValue) {
      params.set(key, csvValue);
    } else {
      params.delete(key);
    }

    // Reset page skip on filter change
    params.delete("skip");

    router.push(`${pathname}?${params.toString()}`);
  };

  const hasAnyFilter = !!(
    current.documentType ||
    current.validityStatus ||
    current.issuingBody ||
    current.field ||
    current.yearFrom ||
    current.yearTo
  );

  const activeFilterCount =
    selectedTypes.length +
    selectedStatuses.length +
    selectedBodies.length +
    selectedFields.length +
    (current.yearFrom ? 1 : 0) +
    (current.yearTo ? 1 : 0);

  // Client-side search and filtering for dropdown options
  const filteredBodies = issuingBodies.filter(b =>
    b.label.toLowerCase().includes(bodySearch.toLowerCase())
  );
  const displayedBodies = showAllBodies ? filteredBodies : filteredBodies.slice(0, 10);

  const filteredFields = fields.filter(f =>
    f.label.toLowerCase().includes(fieldSearch.toLowerCase())
  );
  const displayedFields = showAllFields ? filteredFields : filteredFields.slice(0, 10);

  return (
    <div>
      {/* Mobile-only toggle: filters stay collapsed by default so results are reachable without scrolling past every facet */}
      <button
        type="button"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-expanded={mobileOpen}
        className="md:hidden w-full flex items-center justify-between gap-2 bg-white rounded-xl border border-slate-200 shadow-sm px-4 py-3 mb-3 font-semibold text-slate-800"
      >
        <span className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-blue-700" />
          Bộ lọc nâng cao
          {activeFilterCount > 0 && (
            <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-blue-700 text-white text-[11px] font-bold">
              {activeFilterCount}
            </span>
          )}
        </span>
        {mobileOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>

      <div className={cn("bg-white rounded-xl border border-slate-200 shadow-sm p-5 md:sticky md:top-24", !mobileOpen && "hidden md:block")}>
      <div className="hidden md:flex items-center gap-2 font-semibold text-slate-800 mb-4 pb-3 border-b border-slate-100">
        <Filter className="w-4 h-4 text-blue-700" />
        Bộ lọc nâng cao
      </div>

      {/* Loại văn bản */}
      <h3 className="text-sm font-semibold text-slate-700 mb-3 mt-4">Loại văn bản</h3>
      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
        {typeStats.map((t) => {
          const isChecked = selectedTypes.includes(t.value);
          return (
            <label key={t.value} className="flex items-center justify-between text-sm text-slate-600 hover:text-slate-900 cursor-pointer select-none">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) => handleFilterToggle("documentType", t.value, e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <span className={cn(isChecked && "font-semibold text-blue-700")}>{t.label}</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">{t.count.toLocaleString("vi-VN")}</span>
            </label>
          );
        })}
      </div>

      {/* Hiệu lực */}
      <h3 className="text-sm font-semibold text-slate-700 mb-3 mt-5 pt-4 border-t border-slate-100">Tình trạng hiệu lực</h3>
      <div className="space-y-2">
        {validityCounts.map((v) => {
          const isChecked = selectedStatuses.includes(v.value);
          return (
            <label key={v.value} className="flex items-center justify-between text-sm text-slate-600 hover:text-slate-900 cursor-pointer select-none">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) => handleFilterToggle("validityStatus", v.value, e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <span className={cn(isChecked && "font-semibold text-blue-700")}>{v.label}</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">{v.count.toLocaleString("vi-VN")}</span>
            </label>
          );
        })}
      </div>

      {/* Cơ quan ban hành */}
      <h3 className="text-sm font-semibold text-slate-700 mb-3 mt-5 pt-4 border-t border-slate-100">Cơ quan ban hành</h3>
      {issuingBodies.length > 8 && (
        <div className="relative mb-3">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Lọc nhanh cơ quan..."
            value={bodySearch}
            onChange={(e) => setBodySearch(e.target.value)}
            className="w-full h-8 pl-8 pr-3 text-xs rounded-lg border border-slate-200 focus:border-blue-400 outline-none"
          />
        </div>
      )}
      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
        {displayedBodies.length > 0 ? (
          displayedBodies.map((b) => {
            const isChecked = selectedBodies.includes(b.value);
            return (
              <label key={b.value} className="flex items-center justify-between text-sm text-slate-600 hover:text-slate-900 cursor-pointer select-none">
                <div className="flex items-center gap-2 min-w-0">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => handleFilterToggle("issuingBody", b.value, e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer flex-shrink-0"
                  />
                  <span className={cn("truncate", isChecked && "font-semibold text-blue-700")}>{b.label}</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 ml-2 flex-shrink-0">
                  {b.count.toLocaleString("vi-VN")}
                </span>
              </label>
            );
          })
        ) : (
          <div className="text-xs text-slate-400 italic text-center py-2">Không tìm thấy cơ quan</div>
        )}
      </div>
      {filteredBodies.length > 10 && (
        <button
          onClick={() => setShowAllBodies(!showAllBodies)}
          className="flex items-center gap-1 text-xs text-blue-600 hover:underline mt-2 w-full cursor-pointer py-1.5"
        >
          {showAllBodies ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          {showAllBodies ? "Thu gọn" : `Xem thêm (${filteredBodies.length - 10} cơ quan)`}
        </button>
      )}

      {/* Lĩnh vực */}
      <h3 className="text-sm font-semibold text-slate-700 mb-3 mt-5 pt-4 border-t border-slate-100">Lĩnh vực</h3>
      {fields.length > 8 && (
        <div className="relative mb-3">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Lọc nhanh lĩnh vực..."
            value={fieldSearch}
            onChange={(e) => setFieldSearch(e.target.value)}
            className="w-full h-8 pl-8 pr-3 text-xs rounded-lg border border-slate-200 focus:border-blue-400 outline-none"
          />
        </div>
      )}
      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
        {displayedFields.length > 0 ? (
          displayedFields.map((f) => {
            const isChecked = selectedFields.includes(f.value);
            return (
              <label key={f.value} className="flex items-center justify-between text-sm text-slate-600 hover:text-slate-900 cursor-pointer select-none">
                <div className="flex items-center gap-2 min-w-0">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => handleFilterToggle("field", f.value, e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer flex-shrink-0"
                  />
                  <span className={cn("truncate", isChecked && "font-semibold text-blue-700")}>{f.label}</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 ml-2 flex-shrink-0">
                  {f.count.toLocaleString("vi-VN")}
                </span>
              </label>
            );
          })
        ) : (
          <div className="text-xs text-slate-400 italic text-center py-2">Không tìm thấy lĩnh vực</div>
        )}
      </div>
      {filteredFields.length > 10 && (
        <button
          onClick={() => setShowAllFields(!showAllFields)}
          className="flex items-center gap-1 text-xs text-blue-600 hover:underline mt-2 w-full cursor-pointer py-1.5"
        >
          {showAllFields ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          {showAllFields ? "Thu gọn" : `Xem thêm (${filteredFields.length - 10} lĩnh vực)`}
        </button>
      )}

      {/* Năm ban hành — lọc theo năm vì chỉ mục tìm kiếm chỉ lập chỉ mục theo độ chi tiết năm (promulgationYear), không theo ngày/tháng */}
      <h3 className="text-sm font-semibold text-slate-700 mb-3 mt-5 pt-4 border-t border-slate-100">Năm ban hành</h3>
      <form method="GET" action="/search" className="space-y-2">
        <input type="hidden" name="q" value={current.q} />
        {current.documentType && <input type="hidden" name="documentType" value={current.documentType} />}
        {current.validityStatus && <input type="hidden" name="validityStatus" value={current.validityStatus} />}
        {current.issuingBody && <input type="hidden" name="issuingBody" value={current.issuingBody} />}
        {current.field && <input type="hidden" name="field" value={current.field} />}
        {current.exact && <input type="hidden" name="exact" value={current.exact} />}
        {current.scope && <input type="hidden" name="scope" value={current.scope} />}

        <div className="space-y-1">
          <label htmlFor="filter-year-from" className="text-[11px] text-slate-500">Từ năm</label>
          <input
            id="filter-year-from"
            type="number"
            name="yearFrom"
            min={1945}
            max={2100}
            placeholder="VD: 2015"
            defaultValue={current.yearFrom}
            className="w-full h-9 px-3 text-sm rounded-lg border border-slate-200 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="filter-year-to" className="text-[11px] text-slate-500">Đến năm</label>
          <input
            id="filter-year-to"
            type="number"
            name="yearTo"
            min={1945}
            max={2100}
            placeholder="VD: 2026"
            defaultValue={current.yearTo}
            className="w-full h-9 px-3 text-sm rounded-lg border border-slate-200 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none"
          />
        </div>

        <button type="submit" className="w-full h-8 mt-2 text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer">
          Áp dụng khoảng năm
        </button>
      </form>

      {/* Bỏ lọc */}
      {hasAnyFilter && (
        <a href="/search" className="block text-center text-xs text-blue-600 hover:underline mt-4 pt-3 border-t border-slate-100 font-semibold">
          Xóa tất cả bộ lọc
        </a>
      )}
      </div>
    </div>
  );
}
