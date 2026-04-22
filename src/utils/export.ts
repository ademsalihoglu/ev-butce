import { Platform } from 'react-native';
import * as XLSX from 'xlsx';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { Category, Transaction } from '../db';
import { formatCurrency, formatDate, monthKey, monthLabel } from './format';

export interface ExportInput {
  transactions: Transaction[];
  categories: Category[];
  from?: string; // ISO date (inclusive)
  to?: string; // ISO date (inclusive)
  title?: string;
}

function filterRange(txs: Transaction[], from?: string, to?: string): Transaction[] {
  return txs.filter((t) => {
    if (from && t.date < from) return false;
    if (to && t.date > to) return false;
    return true;
  });
}

function monthSummary(txs: Transaction[]) {
  const map = new Map<string, { income: number; expense: number }>();
  for (const t of txs) {
    const k = monthKey(t.date);
    const row = map.get(k) ?? { income: 0, expense: 0 };
    if (t.type === 'income') row.income += t.amount;
    else row.expense += t.amount;
    map.set(k, row);
  }
  return [...map.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([k, v]) => ({
      month: monthLabel(k),
      income: v.income,
      expense: v.expense,
      net: v.income - v.expense,
    }));
}

function categoryTotals(txs: Transaction[], categories: Category[]) {
  const map = new Map<string, { name: string; color: string; income: number; expense: number }>();
  for (const t of txs) {
    const cat = categories.find((c) => c.id === t.categoryId);
    const key = cat?.id ?? 'other';
    const row = map.get(key) ?? {
      name: cat?.name ?? 'Diğer',
      color: cat?.color ?? '#64748B',
      income: 0,
      expense: 0,
    };
    if (t.type === 'income') row.income += t.amount;
    else row.expense += t.amount;
    map.set(key, row);
  }
  return [...map.values()].sort((a, b) => b.expense + b.income - (a.expense + a.income));
}

async function savePayload(fileName: string, data: Uint8Array | string, mimeType: string): Promise<string> {
  if (Platform.OS === 'web') {
    const blob = new Blob([typeof data === 'string' ? data : new Uint8Array(data)], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
    return url;
  }
  const dir = FileSystem.cacheDirectory ?? FileSystem.documentDirectory ?? '';
  const fileUri = `${dir}${fileName}`;
  if (typeof data === 'string') {
    await FileSystem.writeAsStringAsync(fileUri, data, { encoding: FileSystem.EncodingType.UTF8 });
  } else {
    const base64 = bytesToBase64(data);
    await FileSystem.writeAsStringAsync(fileUri, base64, { encoding: FileSystem.EncodingType.Base64 });
  }
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(fileUri, { mimeType, dialogTitle: fileName });
  }
  return fileUri;
}

function bytesToBase64(buf: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < buf.byteLength; i++) {
    binary += String.fromCharCode(buf[i]);
  }
  if (typeof btoa !== 'undefined') return btoa(binary);
  // Node fallback (used in tests / SSR-like environments)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bufferCtor: any = (globalThis as any).Buffer;
  return bufferCtor ? bufferCtor.from(binary, 'binary').toString('base64') : binary;
}

export async function exportTransactionsToExcel(input: ExportInput): Promise<string> {
  const { categories } = input;
  const txs = filterRange(input.transactions, input.from, input.to).slice().sort((a, b) =>
    a.date.localeCompare(b.date)
  );
  const byId = new Map(categories.map((c) => [c.id, c]));
  const txRows = txs.map((t) => ({
    Tarih: t.date,
    Tür: t.type === 'income' ? 'Gelir' : 'Gider',
    Kategori: byId.get(t.categoryId)?.name ?? '',
    Açıklama: t.description,
    'Tutar (₺)': t.amount,
  }));
  const summary = monthSummary(txs).map((r) => ({
    Ay: r.month,
    Gelir: r.income,
    Gider: r.expense,
    Net: r.net,
  }));
  const catRows = categoryTotals(txs, categories).map((c) => ({
    Kategori: c.name,
    Gelir: c.income,
    Gider: c.expense,
  }));

  const wb = XLSX.utils.book_new();
  const ws1 = XLSX.utils.json_to_sheet(txRows);
  XLSX.utils.book_append_sheet(wb, ws1, 'İşlemler');
  const ws2 = XLSX.utils.json_to_sheet(summary);
  XLSX.utils.book_append_sheet(wb, ws2, 'Ay Özeti');
  const ws3 = XLSX.utils.json_to_sheet(catRows);
  XLSX.utils.book_append_sheet(wb, ws3, 'Kategori Özeti');

  const out = XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
  const bytes = new Uint8Array(out);
  const stamp = new Date().toISOString().slice(0, 10);
  return savePayload(
    `ev-butce-${stamp}.xlsx`,
    bytes,
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
}

function buildHtml(input: ExportInput): string {
  const txs = filterRange(input.transactions, input.from, input.to).slice().sort((a, b) =>
    a.date.localeCompare(b.date)
  );
  const byId = new Map(input.categories.map((c) => [c.id, c]));
  const totals = txs.reduce(
    (acc, t) => {
      if (t.type === 'income') acc.income += t.amount;
      else acc.expense += t.amount;
      return acc;
    },
    { income: 0, expense: 0 }
  );
  const net = totals.income - totals.expense;

  const cats = categoryTotals(txs, input.categories);
  const totalExpense = cats.reduce((acc, c) => acc + c.expense, 0) || 1;

  // Build simple pie chart as SVG
  let angle = 0;
  const cx = 120;
  const cy = 120;
  const r = 100;
  const slices = cats
    .filter((c) => c.expense > 0)
    .map((c) => {
      const portion = c.expense / totalExpense;
      const start = angle;
      const end = angle + portion * 2 * Math.PI;
      angle = end;
      const large = end - start > Math.PI ? 1 : 0;
      const x1 = cx + r * Math.cos(start);
      const y1 = cy + r * Math.sin(start);
      const x2 = cx + r * Math.cos(end);
      const y2 = cy + r * Math.sin(end);
      return `<path d="M${cx},${cy} L${x1.toFixed(2)},${y1.toFixed(2)} A${r},${r} 0 ${large} 1 ${x2.toFixed(2)},${y2.toFixed(2)} Z" fill="${c.color}" />`;
    })
    .join('\n');

  const txRows = txs
    .map(
      (t) => `<tr>
      <td>${formatDate(t.date)}</td>
      <td>${t.type === 'income' ? 'Gelir' : 'Gider'}</td>
      <td>${byId.get(t.categoryId)?.name ?? ''}</td>
      <td>${escapeHtml(t.description)}</td>
      <td style="text-align:right">${formatCurrency(t.amount)}</td>
    </tr>`
    )
    .join('\n');

  const catRows = cats
    .map(
      (c) => `<tr>
      <td><span style="display:inline-block;width:10px;height:10px;border-radius:999px;background:${c.color};margin-right:6px"></span>${c.name}</td>
      <td style="text-align:right">${formatCurrency(c.expense)}</td>
      <td style="text-align:right">${formatCurrency(c.income)}</td>
    </tr>`
    )
    .join('\n');

  const rangeText =
    input.from || input.to
      ? `${input.from ? formatDate(input.from) : 'Başlangıç'} – ${input.to ? formatDate(input.to) : 'Bugün'}`
      : 'Tüm işlemler';

  return `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(input.title ?? 'Ev Bütçe Raporu')}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: 'Helvetica', 'Arial', sans-serif; color: #0F172A; margin: 24px; background: #F8FAFC; }
  h1 { margin: 0 0 4px; font-size: 28px; }
  .subtitle { color: #475569; margin-bottom: 20px; }
  .hero {
    background: linear-gradient(120deg,#4338CA,#7C3AED 55%,#0EA5E9);
    color: #fff;
    padding: 24px;
    border-radius: 20px;
    margin-bottom: 20px;
  }
  .hero h1 { color: #fff; }
  .stats { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 18px; }
  .stat { flex: 1 1 200px; background: rgba(255,255,255,0.15); padding: 14px 16px; border-radius: 14px; border: 1px solid rgba(255,255,255,0.25); }
  .stat .label { text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; opacity: 0.85; }
  .stat .value { font-size: 22px; font-weight: 700; margin-top: 4px; }
  .card { background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 16px; padding: 20px; margin-bottom: 18px; box-shadow: 0 4px 14px rgba(15,23,42,0.04); }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th, td { padding: 8px 10px; border-bottom: 1px solid #E2E8F0; }
  th { background: #F1F5F9; text-align: left; color: #334155; font-weight: 600; }
  .two-col { display: flex; gap: 16px; }
  .two-col > div { flex: 1; }
  .pie-wrap { display: flex; justify-content: center; align-items: center; padding: 8px; }
  .legend li { display: flex; justify-content: space-between; gap: 10px; padding: 4px 0; border-bottom: 1px dashed #E2E8F0; list-style: none; }
  ul { padding: 0; margin: 0; }
  footer { color: #94A3B8; font-size: 11px; margin-top: 16px; text-align: center; }
</style>
</head>
<body>
  <div class="hero">
    <div style="font-size:12px;letter-spacing:0.5px;text-transform:uppercase;opacity:0.8">Ev Bütçe</div>
    <h1>${escapeHtml(input.title ?? 'Finans Raporu')}</h1>
    <div class="subtitle" style="color:rgba(255,255,255,0.85)">${rangeText}</div>
    <div class="stats">
      <div class="stat"><div class="label">Gelir</div><div class="value">${formatCurrency(totals.income)}</div></div>
      <div class="stat"><div class="label">Gider</div><div class="value">${formatCurrency(totals.expense)}</div></div>
      <div class="stat"><div class="label">Net</div><div class="value">${formatCurrency(net)}</div></div>
    </div>
  </div>

  <div class="two-col">
    <div class="card">
      <h2 style="margin:0 0 10px">Gider Dağılımı</h2>
      <div class="pie-wrap">
        <svg viewBox="0 0 240 240" width="240" height="240">
          ${cats.filter((c) => c.expense > 0).length > 0
            ? slices
            : '<circle cx="120" cy="120" r="100" fill="#E2E8F0" />'}
        </svg>
      </div>
    </div>
    <div class="card">
      <h2 style="margin:0 0 10px">Kategori Özeti</h2>
      <table>
        <thead><tr><th>Kategori</th><th style="text-align:right">Gider</th><th style="text-align:right">Gelir</th></tr></thead>
        <tbody>${catRows || '<tr><td colspan="3" style="text-align:center;color:#94A3B8">Veri yok</td></tr>'}</tbody>
      </table>
    </div>
  </div>

  <div class="card">
    <h2 style="margin:0 0 10px">İşlem Detayı (${txs.length})</h2>
    <table>
      <thead><tr><th>Tarih</th><th>Tür</th><th>Kategori</th><th>Açıklama</th><th style="text-align:right">Tutar</th></tr></thead>
      <tbody>${txRows || '<tr><td colspan="5" style="text-align:center;color:#94A3B8">İşlem yok</td></tr>'}</tbody>
    </table>
  </div>

  <footer>Oluşturulma: ${new Date().toLocaleString('tr-TR')} · Ev Bütçe</footer>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function exportTransactionsToPdf(input: ExportInput): Promise<string> {
  const html = buildHtml(input);
  if (Platform.OS === 'web') {
    // On web, open a printable tab — user can "Save as PDF".
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const w = window.open(url, '_blank');
    if (w) {
      setTimeout(() => {
        try {
          w.focus();
          w.print();
        } catch {
          // ignore
        }
      }, 500);
    }
    setTimeout(() => URL.revokeObjectURL(url), 120_000);
    return url;
  }
  const { uri } = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Ev Bütçe PDF' });
  }
  return uri;
}
