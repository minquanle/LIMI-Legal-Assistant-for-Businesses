/** Clean bogus values coming from the dataset */
export function displayValue(value: string | null | undefined, fallback = "Không xác định"): string {
  if (!value || value.trim() === "" || value === "nan" || value === "null" || value === "undefined") {
    return fallback;
  }
  return value.trim();
}

/** Check if a string is a slug (lowercase with hyphens, no uppercase) */
export function isSlug(text: string): boolean {
  // If it contains uppercase Vietnamese chars, it's a real title
  if (/[A-ZÀ-Ý]/.test(text)) return false;
  // If it's mostly lowercase + hyphens + numbers, it's a slug
  return /^[a-z0-9à-ý\-]+$/.test(text.replace(/\s/g, ""));
}

/** Convert a slug to a readable title: 'nghi-quyet-so-13-2011' -> 'Nghi Quyết Số 13/2011' */
export function slugToTitle(slug: string): string {
  return slug
    .split("-")
    .map(word => {
      // Handle known Vietnamese words
      const vietMap: Record<string, string> = {
        "nghi": "Nghị", "quyet": "Quyết", "so": "Số",
        "thong": "Thông", "tu": "Tư", "cua": "của",
        "ve": "về", "va": "và", "ban": "Ban", "hanh": "Hành",
        "quyet-dinh": "Quyết định", "nghi-dinh": "Nghị định",
        "chi-thi": "Chỉ thị", "thong-tu": "Thông tư",
        "phap-lenh": "Pháp lệnh", "lenh": "Lệnh",
        "qd": "QĐ", "nq": "NQ", "tt": "TT", "ct": "CT",
        "ubnd": "UBND", "hdnd": "HĐND", "tw": "TW",
        "cp": "CP", "ttg": "TTg", "ctn": "CTN",
      };
      return vietMap[word] || word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

/** Get a display-ready title for a document */
export function displayTitle(title: string | null | undefined, documentNumber?: string | null): string {
  const fallback = documentNumber ? `Văn bản ${documentNumber}` : "Văn bản không có tiêu đề";
  if (!title || title.trim() === "") return fallback;
  if (isSlug(title)) return slugToTitle(title);
  return title;
}

/** Get a readable body name */
export function displayIssuingBody(body: string | null | undefined): string | null {
  const cleaned = displayValue(body, "");
  if (!cleaned) return null;
  return cleaned;
}

/** Check if fullText is meaningful (> 3 chars and not 'nan') */
export function hasMeaningfulContent(text: string | null | undefined): boolean {
  if (!text) return false;
  const trimmed = text.trim();
  if (trimmed === "nan" || trimmed === "null" || trimmed === "") return false;
  return trimmed.length > 3;
}
