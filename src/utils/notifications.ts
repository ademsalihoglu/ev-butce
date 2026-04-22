import { Platform } from 'react-native';
import type { Transaction } from '../db/types';
import { nextDueDate } from './recurring';

// Dynamic require so web builds don't need the native module at runtime.
// expo-notifications is installed but the web polyfill is a no-op.
let Notifications: typeof import('expo-notifications') | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Notifications = require('expo-notifications');
} catch {
  Notifications = null;
}

const CHANNEL_ID = 'recurring-payments';
let handlerConfigured = false;
let permissionStatus: 'unknown' | 'granted' | 'denied' = 'unknown';

async function ensureHandler(): Promise<void> {
  if (Platform.OS === 'web' || !Notifications) return;
  if (handlerConfigured) return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
  if (Platform.OS === 'android') {
    try {
      await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
        name: 'Tekrarlayan ödemeler',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    } catch {
      // ignore channel setup failure
    }
  }
  handlerConfigured = true;
}

export async function requestPermissionsIfNeeded(): Promise<boolean> {
  if (Platform.OS === 'web' || !Notifications) return false;
  await ensureHandler();
  try {
    const { status: current } = await Notifications.getPermissionsAsync();
    if (current === 'granted') {
      permissionStatus = 'granted';
      return true;
    }
    const { status: next } = await Notifications.requestPermissionsAsync();
    permissionStatus = next === 'granted' ? 'granted' : 'denied';
    return next === 'granted';
  } catch {
    return false;
  }
}

function identifierFor(txId: string): string {
  return `recurring-${txId}`;
}

async function cancelForTx(txId: string): Promise<void> {
  if (!Notifications) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(identifierFor(txId));
  } catch {
    // ignore
  }
}

export async function scheduleRecurring(tx: Transaction): Promise<void> {
  if (Platform.OS === 'web' || !Notifications) return;
  await ensureHandler();
  if (!tx.recurring) {
    await cancelForTx(tx.id);
    return;
  }
  if (permissionStatus === 'unknown') {
    const granted = await requestPermissionsIfNeeded();
    if (!granted) return;
  }
  if (permissionStatus !== 'granted') return;

  const due = nextDueDate(tx.recurring);
  due.setHours(9, 0, 0, 0);
  await cancelForTx(tx.id);
  try {
    const trigger =
      tx.recurring.frequency === 'weekly'
        ? {
            weekday: tx.recurring.dueDay + 1, // expo expects 1-7 (Sunday=1)
            hour: 9,
            minute: 0,
            repeats: true,
          }
        : {
            day: Math.min(Math.max(1, tx.recurring.dueDay), 28),
            hour: 9,
            minute: 0,
            repeats: true,
          };
    await Notifications.scheduleNotificationAsync({
      identifier: identifierFor(tx.id),
      content: {
        title: tx.type === 'expense' ? 'Ödeme hatırlatması' : 'Gelir hatırlatması',
        body: `${tx.description || (tx.type === 'expense' ? 'Tekrarlayan ödeme' : 'Tekrarlayan gelir')} · ${tx.amount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}`,
        data: { transactionId: tx.id, type: tx.type },
      },
      trigger: trigger as unknown as Parameters<typeof Notifications.scheduleNotificationAsync>[0]['trigger'],
    });
  } catch {
    // Triggers are finicky across expo versions; swallow so we don't break the app.
  }
}

export async function cancelRecurring(txId: string): Promise<void> {
  if (Platform.OS === 'web' || !Notifications) return;
  await cancelForTx(txId);
}

export function notificationsSupported(): boolean {
  return Platform.OS !== 'web' && !!Notifications;
}
