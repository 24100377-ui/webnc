const vnd = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 });

/** 17750000 → "17.750.000đ" */
export function formatMoney(value, { suffix = 'đ', sign = false } = {}) {
  const n = Number(value) || 0;
  const body = `${vnd.format(Math.abs(n))}${suffix}`;
  if (sign) return `${n > 0 ? '+' : n < 0 ? '-' : ''}${body}`;
  return n < 0 ? `-${body}` : body;
}

/** 17750000 → "17,75tr" (dùng cho thẻ KPI, trục biểu đồ) */
export function formatCompact(value, { suffix = 'tr' } = {}) {
  const n = Number(value) || 0;
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs >= 1_000_000_000) return `${sign}${(abs / 1_000_000_000).toFixed(2).replace('.', ',')}tỷ`;
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(0)}${suffix}`;
  if (abs >= 1_000) return `${sign}${(abs / 1_000).toFixed(0)}k`;
  return `${sign}${abs}`;
}

/** "2026-10-30" → "30/10/2026" */
export function formatDate(value) {
  if (!value) return '';
  const [y, m, d] = String(value).slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}

export function todayLong() {
  const text = new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date());
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function initials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
