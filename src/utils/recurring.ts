import type { RecurrenceInfo, Transaction } from '../db/types';

export interface UpcomingPayment {
  transactionId: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  categoryId: string;
  dueDate: Date;
  daysUntil: number;
  frequency: RecurrenceInfo['frequency'];
  dueDay: number;
}

function clampDay(year: number, month: number, day: number): number {
  const lastDay = new Date(year, month + 1, 0).getDate();
  return Math.min(Math.max(1, day), lastDay);
}

function nextMonthlyDue(dueDay: number, from: Date): Date {
  const today = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const thisMonthDay = clampDay(today.getFullYear(), today.getMonth(), dueDay);
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), thisMonthDay);
  if (thisMonth >= today) return thisMonth;
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  const nextDay = clampDay(nextMonth.getFullYear(), nextMonth.getMonth(), dueDay);
  return new Date(nextMonth.getFullYear(), nextMonth.getMonth(), nextDay);
}

function nextWeeklyDue(dueDay: number, from: Date): Date {
  const today = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const currentDow = today.getDay();
  let diff = (dueDay - currentDow + 7) % 7;
  const next = new Date(today);
  next.setDate(today.getDate() + diff);
  return next;
}

export function nextDueDate(info: RecurrenceInfo, from: Date = new Date()): Date {
  if (info.frequency === 'weekly') return nextWeeklyDue(info.dueDay, from);
  return nextMonthlyDue(info.dueDay, from);
}

export function computeUpcomingPayments(
  transactions: Transaction[],
  horizonDays = 31,
  from: Date = new Date()
): UpcomingPayment[] {
  const today = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const results: UpcomingPayment[] = [];
  for (const tx of transactions) {
    if (!tx.recurring) continue;
    const info = tx.recurring;
    if (info.endsAt) {
      const endsAt = new Date(info.endsAt);
      if (endsAt < today) continue;
    }
    const due = nextDueDate(info, today);
    const diffMs = due.getTime() - today.getTime();
    const daysUntil = Math.round(diffMs / (1000 * 60 * 60 * 24));
    if (daysUntil > horizonDays) continue;
    results.push({
      transactionId: tx.id,
      description: tx.description || (tx.type === 'expense' ? 'Gider' : 'Gelir'),
      amount: tx.amount,
      type: tx.type,
      categoryId: tx.categoryId,
      dueDate: due,
      daysUntil,
      frequency: info.frequency,
      dueDay: info.dueDay,
    });
  }
  return results.sort((a, b) => a.daysUntil - b.daysUntil);
}

export function describeRecurrence(info: RecurrenceInfo): string {
  if (info.frequency === 'weekly') {
    const dayNames = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
    return `Her ${dayNames[info.dueDay] ?? '—'}`;
  }
  return `Her ayın ${info.dueDay}'i`;
}

export function formatDaysUntil(days: number): string {
  if (days === 0) return 'Bugün';
  if (days === 1) return 'Yarın';
  if (days < 0) return `${Math.abs(days)} gün gecikti`;
  return `${days} gün sonra`;
}
