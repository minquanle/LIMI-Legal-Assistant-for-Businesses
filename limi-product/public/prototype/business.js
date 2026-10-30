// Public business lookup. The source is VietQR/CASSO, not a direct government API.
// Provider notice: this endpoint is scheduled to retire on 2027-03-01.
export const BUSINESS_SOURCE = { name: 'VietQR / CASSO', url: 'https://vietqr.io/danh-sach-api/tax-id-lookup/' };

export function normalizeTaxId(value) {
  const input = String(value || '').trim().replace(/\s/g, '');
  if (!/^\d{10}(?:-?\d{3})?$/.test(input)) return null;
  const digits = input.replace('-', '');
  return digits.length === 13 ? `${digits.slice(0, 10)}-${digits.slice(10)}` : digits;
}

export function emptyBusiness() {
  return { name: '', taxId: '', internationalName: '', shortName: '', address: '', status: '', type: '', founded: '', province: '', registered: '', stage: '', activity: [], employees: 'unknown', channels: [], places: [], signals: [], topics: [], role: '', sourceKind: 'manual' };
}

export async function lookupBusiness(value, { signal } = {}) {
  const taxId = normalizeTaxId(value);
  if (!taxId) throw new Error('Nhập mã số thuế gồm 10 số hoặc mã đơn vị phụ thuộc gồm 13 số.');
  const response = await fetch(`https://api.vietqr.io/v2/business/${encodeURIComponent(taxId)}`, { signal, credentials: 'omit', referrerPolicy: 'no-referrer', headers: { Accept: 'application/json' } });
  if (response.status === 429) throw new Error('Nguồn tra cứu đang giới hạn lượt truy cập. Vui lòng đợi một lát rồi thử lại.');
  if (!response.ok) throw new Error('Nguồn tra cứu tạm thời không phản hồi. Bạn có thể thử lại hoặc tự nhập hồ sơ.');
  const payload = await response.json();
  const data = payload?.data;
  if (payload?.code !== '00' || !data || typeof data.name !== 'string' || !data.name.trim()) throw new Error('Không tìm thấy doanh nghiệp trong nguồn tra cứu này. Kiểm tra lại mã hoặc tự nhập hồ sơ; kết quả này không có nghĩa doanh nghiệp không tồn tại.');
  if (normalizeTaxId(data.id) !== taxId) throw new Error('Nguồn trả về mã số thuế không khớp. Vui lòng thử lại hoặc tự nhập hồ sơ.');
  const text = value => typeof value === 'string' ? value.trim().slice(0, 2000) : '';
  return {
    ...emptyBusiness(), taxId, name: text(data.name), internationalName: text(data.internationalName),
    shortName: text(data.shortName), address: text(data.address), status: text(data.status),
    sourceKind: 'live', sourceName: BUSINESS_SOURCE.name, sourceUrl: BUSINESS_SOURCE.url,
    retrievedAt: new Date().toISOString(), sourceUpdatedAt: text(payload.metadata?.updatedAt),
  };
}
