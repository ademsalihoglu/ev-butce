import { Category } from './types';

export const defaultCategories: Omit<Category, 'id'>[] = [
  { name: 'Mutfak', color: '#EF4444', icon: 'food', type: 'expense' },
  { name: 'Kira', color: '#8B5CF6', icon: 'home-city', type: 'expense' },
  { name: 'Faturalar', color: '#F59E0B', icon: 'file-document', type: 'expense' },
  { name: 'Eğlence', color: '#EC4899', icon: 'gamepad-variant', type: 'expense' },
  { name: 'Ulaşım', color: '#3B82F6', icon: 'bus', type: 'expense' },
  { name: 'Sağlık', color: '#10B981', icon: 'heart-pulse', type: 'expense' },
  { name: 'Diğer Gider', color: '#6B7280', icon: 'dots-horizontal', type: 'expense' },
  { name: 'Maaş', color: '#22C55E', icon: 'cash', type: 'income' },
  { name: 'Ek Gelir', color: '#14B8A6', icon: 'trending-up', type: 'income' },
];

export function createId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
