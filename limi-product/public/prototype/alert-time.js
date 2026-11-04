// Treat legal effective dates as calendar dates, independent of daylight-saving offsets.
export function daysUntil(dateStr, today = new Date()) {
  const [year, month, day] = dateStr.split('-').map(Number);
  return Math.round((Date.UTC(year, month - 1, day) - Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())) / 86400000);
}

export function countdownLabel(dateStr, today = new Date()) {
  const days = daysUntil(dateStr, today);
  return days > 0 ? `còn ${days} ngày` : days === 0 ? 'hiệu lực hôm nay' : `đã hiệu lực ${Math.abs(days)} ngày`;
}

export function alertPhase(dateStr, today = new Date()) {
  const days = daysUntil(dateStr, today);
  if (days > 90) return 'Theo dõi sớm';
  if (days > 30) return 'Chuẩn bị trước hiệu lực';
  if (days > 0) return 'Sắp có hiệu lực';
  if (days === 0) return 'Hiệu lực hôm nay';
  return 'Đã có hiệu lực';
}

export function alertMilestones(dateStr, today = new Date()) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const effective = Date.UTC(year, month - 1, day);
  return [90, 30, 7, 0].map(daysBefore => {
    const date = new Date(effective - daysBefore * 86400000).toISOString().slice(0, 10);
    return { daysBefore, date, passed: daysUntil(date, today) < 0 };
  });
}
