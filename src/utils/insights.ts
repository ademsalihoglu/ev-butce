import type { Category, Transaction } from '../db';
import { monthKey } from './format';

export type InsightTone = 'positive' | 'neutral' | 'warning' | 'danger' | 'info';

export interface Insight {
  id: string;
  tone: InsightTone;
  icon: string;
  title: string;
  detail: string;
}

interface BuildArgs {
  transactions: Transaction[];
  categories: Category[];
  now?: Date;
}

function currentMonthKeys(now: Date): { current: string; previous: string } {
  const currentYear = now.getFullYear();
  const currentMonthIndex = now.getMonth();
  const currentKey = `${currentYear}-${String(currentMonthIndex + 1).padStart(2, '0')}`;
  const previousDate = new Date(currentYear, currentMonthIndex - 1, 1);
  const previousKey = `${previousDate.getFullYear()}-${String(previousDate.getMonth() + 1).padStart(
    2,
    '0'
  )}`;
  return { current: currentKey, previous: previousKey };
}

function aggregateByCategory(
  txs: Transaction[],
  key: string
): { totals: Map<string, number>; sum: number } {
  const totals = new Map<string, number>();
  let sum = 0;
  for (const t of txs) {
    if (t.type !== 'expense') continue;
    if (monthKey(t.date) !== key) continue;
    totals.set(t.categoryId, (totals.get(t.categoryId) ?? 0) + t.amount);
    sum += t.amount;
  }
  return { totals, sum };
}

function percentChange(current: number, previous: number): number | null {
  if (previous <= 0) {
    return current > 0 ? Infinity : null;
  }
  return ((current - previous) / previous) * 100;
}

function formatPercent(p: number): string {
  if (!Number.isFinite(p)) return 'yeni';
  const rounded = Math.round(p);
  const sign = rounded > 0 ? '+' : '';
  return `${sign}${rounded}%`;
}

export function buildInsights({ transactions, categories, now }: BuildArgs): Insight[] {
  const today = now ?? new Date();
  const { current, previous } = currentMonthKeys(today);
  const currentAgg = aggregateByCategory(transactions, current);
  const previousAgg = aggregateByCategory(transactions, previous);
  const catName = (id: string) => categories.find((c) => c.id === id)?.name ?? 'Diğer';

  const insights: Insight[] = [];

  if (currentAgg.sum === 0 && previousAgg.sum === 0) {
    insights.push({
      id: 'empty',
      tone: 'info',
      icon: 'lightbulb-on-outline',
      title: 'Veri birikmeye başlayınca öneriler burada',
      detail:
        'Birkaç gider ekledikten sonra kategori bazlı trendleri ve tavsiyeleri burada özetleyeceğim.',
    });
    return insights;
  }

  const totalChange = percentChange(currentAgg.sum, previousAgg.sum);
  if (totalChange !== null) {
    if (totalChange === Infinity) {
      insights.push({
        id: 'total-new',
        tone: 'info',
        icon: 'chart-line',
        title: 'Bu ay ilk gider kayıtların',
        detail: 'Geçen aya göre karşılaştırma bir sonraki ay anlamlı olacak.',
      });
    } else if (totalChange >= 25) {
      insights.push({
        id: 'total-up',
        tone: 'warning',
        icon: 'trending-up',
        title: `Toplam gider geçen aya göre ${formatPercent(totalChange)}`,
        detail: 'Artış belirgin; kategori dağılımına bakıp gereksiz olanları kesmek iyi olabilir.',
      });
    } else if (totalChange <= -15) {
      insights.push({
        id: 'total-down',
        tone: 'positive',
        icon: 'trending-down',
        title: `Toplam gider ${formatPercent(totalChange)} azalmış`,
        detail: 'Tebrikler, geçen aya göre ciddi tasarruf yapmışsın.',
      });
    } else {
      insights.push({
        id: 'total-flat',
        tone: 'neutral',
        icon: 'equal',
        title: `Toplam gider ${formatPercent(totalChange)}`,
        detail: 'Harcamaların geçen ay ile benzer seviyede.',
      });
    }
  }

  const changes: { id: string; change: number | null; current: number; previous: number }[] = [];
  const allCats = new Set<string>([...currentAgg.totals.keys(), ...previousAgg.totals.keys()]);
  for (const id of allCats) {
    const c = currentAgg.totals.get(id) ?? 0;
    const p = previousAgg.totals.get(id) ?? 0;
    changes.push({ id, change: percentChange(c, p), current: c, previous: p });
  }

  const increases = changes
    .filter((c) => c.change !== null && c.change !== Infinity && c.change >= 20 && c.current >= 50)
    .sort((a, b) => (b.change ?? 0) - (a.change ?? 0))
    .slice(0, 2);
  for (const inc of increases) {
    insights.push({
      id: `inc-${inc.id}`,
      tone: inc.change! >= 50 ? 'danger' : 'warning',
      icon: 'alert-circle-outline',
      title: `${catName(inc.id)} masrafın ${formatPercent(inc.change!)}`,
      detail: 'Dikkatli olmalısın — bu kategoride ciddi bir artış var.',
    });
  }

  const newCats = changes.filter((c) => c.change === Infinity && c.current >= 100);
  for (const nc of newCats.slice(0, 1)) {
    insights.push({
      id: `new-${nc.id}`,
      tone: 'info',
      icon: 'plus-circle-outline',
      title: `${catName(nc.id)} kategorisinde bu ay ilk defa harcama var`,
      detail: 'Bu kalem geçen ay bütçende yoktu.',
    });
  }

  const decreases = changes
    .filter((c) => c.change !== null && c.change !== Infinity && c.change <= -20 && c.previous >= 50)
    .sort((a, b) => (a.change ?? 0) - (b.change ?? 0))
    .slice(0, 1);
  for (const dec of decreases) {
    insights.push({
      id: `dec-${dec.id}`,
      tone: 'positive',
      icon: 'leaf',
      title: `${catName(dec.id)} kategorisinde ${formatPercent(dec.change!)} tasarruf`,
      detail: 'Geçen aya göre bu kalemde belirgin düşüş var.',
    });
  }

  const topCurrent = [...currentAgg.totals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  if (topCurrent.length > 0 && currentAgg.sum > 0) {
    const top = topCurrent[0]!;
    const share = Math.round((top[1] / currentAgg.sum) * 100);
    if (share >= 40) {
      insights.push({
        id: `dominant-${top[0]}`,
        tone: 'warning',
        icon: 'chart-donut',
        title: `Bütçenin %${share}'i ${catName(top[0])} kategorisinde`,
        detail: 'Tek kategoriye fazla konsantrasyon var — bölmeyi/izlemeyi düşünebilirsin.',
      });
    }
  }

  return insights.slice(0, 5);
}
