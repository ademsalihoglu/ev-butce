import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AssetCurrency } from '../db/types';

const CACHE_KEY = 'ev_butce.rates_v2';
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Rates expressed as: how many TRY does 1 unit of this currency equal.
 * e.g. rates.USD = 38.5 means 1 USD ≈ 38.5 TRY.
 */
export type RatesInTRY = Record<AssetCurrency, number>;

export interface CachedRates {
  rates: RatesInTRY;
  fetchedAt: number;
  source: 'network' | 'cache' | 'fallback';
}

export const CURRENCY_META: Record<
  AssetCurrency,
  { label: string; symbol: string; icon: string; group: 'fiat' | 'metal' | 'crypto' }
> = {
  TRY: { label: 'Türk Lirası', symbol: '₺', icon: 'currency-try', group: 'fiat' },
  USD: { label: 'ABD Doları', symbol: '$', icon: 'currency-usd', group: 'fiat' },
  EUR: { label: 'Euro', symbol: '€', icon: 'currency-eur', group: 'fiat' },
  GBP: { label: 'İngiliz Sterlini', symbol: '£', icon: 'currency-gbp', group: 'fiat' },
  XAU: { label: 'Gram Altın', symbol: 'gr', icon: 'gold', group: 'metal' },
  BTC: { label: 'Bitcoin', symbol: '₿', icon: 'bitcoin', group: 'crypto' },
  ETH: { label: 'Ethereum', symbol: 'Ξ', icon: 'ethereum', group: 'crypto' },
};

export const ALL_CURRENCIES: AssetCurrency[] = ['TRY', 'USD', 'EUR', 'GBP', 'XAU', 'BTC', 'ETH'];

// Offline fallback values — last-known-good approximate rates (April 2024) so
// the UI never shows "0" when network is unreachable. Values are conservative;
// live rates override immediately once fetched.
const FALLBACK_RATES: RatesInTRY = {
  TRY: 1,
  USD: 38.5,
  EUR: 42.0,
  GBP: 49.0,
  XAU: 4300, // TRY per gram
  BTC: 4_100_000,
  ETH: 220_000,
};

interface OpenErAnswer {
  result?: string;
  conversion_rates?: Record<string, number>;
  rates?: Record<string, number>;
  base?: string;
  base_code?: string;
}

async function fetchJson<T>(url: string, timeoutMs = 8000): Promise<T | null> {
  try {
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(tid);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function fetchForexTRY(): Promise<Partial<RatesInTRY>> {
  // Primary: open.er-api.com returns fiat rates against a base. Base=TRY so
  // rates.USD is TRY→USD, meaning 1 TRY = rates.USD USD. Invert to get 1 USD in TRY.
  const primary = await fetchJson<OpenErAnswer>('https://open.er-api.com/v6/latest/TRY');
  const src = primary?.rates ?? primary?.conversion_rates;
  if (primary && src && (primary.result === 'success' || primary.base_code === 'TRY' || primary.base === 'TRY')) {
    const out: Partial<RatesInTRY> = {};
    if (typeof src.USD === 'number' && src.USD > 0) out.USD = 1 / src.USD;
    if (typeof src.EUR === 'number' && src.EUR > 0) out.EUR = 1 / src.EUR;
    if (typeof src.GBP === 'number' && src.GBP > 0) out.GBP = 1 / src.GBP;
    return out;
  }
  // Fallback: exchangerate.host
  const alt = await fetchJson<{ rates?: Record<string, number> }>(
    'https://api.exchangerate.host/latest?base=TRY&symbols=USD,EUR,GBP'
  );
  const arates = alt?.rates;
  if (arates) {
    const out: Partial<RatesInTRY> = {};
    if (typeof arates.USD === 'number' && arates.USD > 0) out.USD = 1 / arates.USD;
    if (typeof arates.EUR === 'number' && arates.EUR > 0) out.EUR = 1 / arates.EUR;
    if (typeof arates.GBP === 'number' && arates.GBP > 0) out.GBP = 1 / arates.GBP;
    return out;
  }
  return {};
}

async function fetchCryptoTRY(): Promise<Partial<RatesInTRY>> {
  const res = await fetchJson<Record<string, { try?: number }>>(
    'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=try'
  );
  if (!res) return {};
  const out: Partial<RatesInTRY> = {};
  const btc = res.bitcoin?.try;
  const eth = res.ethereum?.try;
  if (typeof btc === 'number' && btc > 0) out.BTC = btc;
  if (typeof eth === 'number' && eth > 0) out.ETH = eth;
  return out;
}

async function fetchGoldTRY(usdPerTRY: number | undefined): Promise<Partial<RatesInTRY>> {
  // CoinGecko exposes tokenized gold (pax-gold) priced per troy ounce in USD.
  // 1 troy ounce = 31.1034768 grams. Convert to TRY/gram.
  const res = await fetchJson<Record<string, { usd?: number }>>(
    'https://api.coingecko.com/api/v3/simple/price?ids=pax-gold&vs_currencies=usd'
  );
  const usdPerOz = res?.['pax-gold']?.usd;
  if (typeof usdPerOz !== 'number' || usdPerOz <= 0) return {};
  if (!usdPerTRY || usdPerTRY <= 0) return {};
  const usdPerGram = usdPerOz / 31.1034768;
  return { XAU: usdPerGram * usdPerTRY };
}

export async function loadCachedRates(): Promise<CachedRates | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CachedRates;
  } catch {
    return null;
  }
}

async function writeCache(cached: CachedRates): Promise<void> {
  try {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cached));
  } catch {
    // ignore
  }
}

export async function getRates(force = false): Promise<CachedRates> {
  const cached = await loadCachedRates();
  const now = Date.now();
  if (!force && cached && now - cached.fetchedAt < CACHE_TTL_MS) {
    return { ...cached, source: 'cache' };
  }

  const [forex, crypto] = await Promise.all([fetchForexTRY(), fetchCryptoTRY()]);
  const gold = await fetchGoldTRY(forex.USD);

  const merged: RatesInTRY = {
    ...FALLBACK_RATES,
    ...(cached?.rates ?? {}),
    ...forex,
    ...crypto,
    ...gold,
    TRY: 1,
  };

  const hasAnyLive =
    Object.keys(forex).length > 0 || Object.keys(crypto).length > 0 || Object.keys(gold).length > 0;

  const next: CachedRates = {
    rates: merged,
    fetchedAt: hasAnyLive ? now : cached?.fetchedAt ?? 0,
    source: hasAnyLive ? 'network' : cached ? 'cache' : 'fallback',
  };

  if (hasAnyLive) {
    await writeCache({ rates: merged, fetchedAt: now, source: 'network' });
  }
  return next;
}

export function convertToTRY(amount: number, currency: AssetCurrency, rates: RatesInTRY): number {
  const rate = rates[currency] ?? FALLBACK_RATES[currency] ?? 0;
  return amount * rate;
}

export function formatAssetAmount(amount: number, currency: AssetCurrency): string {
  const meta = CURRENCY_META[currency];
  const decimals = currency === 'BTC' || currency === 'ETH' ? 6 : currency === 'XAU' ? 3 : 2;
  const formatter = new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: currency === 'BTC' || currency === 'ETH' ? 2 : 2,
    maximumFractionDigits: decimals,
  });
  if (currency === 'XAU') return `${formatter.format(amount)} gr altın`;
  return `${formatter.format(amount)} ${meta.symbol}`;
}
