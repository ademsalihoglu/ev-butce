import { Platform } from 'react-native';
import { toIsoDate } from './format';

export interface OcrResult {
  amount: number | null;
  date: string | null;
  rawText: string;
  provider: 'ocr.space' | 'none';
  error?: string;
}

const OCR_SPACE_ENDPOINT = 'https://api.ocr.space/parse/image';

export async function pickImageAsBase64(): Promise<{ base64: string; mimeType: string } | null> {
  if (Platform.OS === 'web') {
    return pickImageWeb();
  }
  return pickImageNative();
}

async function pickImageWeb(): Promise<{ base64: string; mimeType: string } | null> {
  return new Promise((resolve) => {
    if (typeof document === 'undefined') {
      resolve(null);
      return;
    }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment' as unknown as string;
    input.style.display = 'none';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) {
        resolve(null);
        return;
      }
      const reader = new FileReader();
      reader.onerror = () => resolve(null);
      reader.onload = () => {
        const result = typeof reader.result === 'string' ? reader.result : '';
        const m = /^data:([^;]+);base64,(.+)$/.exec(result);
        if (!m) {
          resolve(null);
          return;
        }
        resolve({ mimeType: m[1]!, base64: m[2]! });
      };
      reader.readAsDataURL(file);
    };
    document.body.appendChild(input);
    input.click();
    setTimeout(() => input.remove(), 60_000);
  });
}

async function pickImageNative(): Promise<{ base64: string; mimeType: string } | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const ImagePicker = require('expo-image-picker') as typeof import('expo-image-picker');
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return null;
    const result = await ImagePicker.launchCameraAsync({
      base64: true,
      quality: 0.7,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });
    if (result.canceled) return null;
    const asset = result.assets?.[0];
    if (!asset?.base64) return null;
    return { base64: asset.base64, mimeType: 'image/jpeg' };
  } catch {
    return null;
  }
}

export async function runOcr(
  image: { base64: string; mimeType: string },
  apiKey?: string
): Promise<OcrResult> {
  const key = apiKey || process.env.EXPO_PUBLIC_OCRSPACE_API_KEY || 'helloworld';
  const body = new FormData();
  body.append('base64Image', `data:${image.mimeType};base64,${image.base64}`);
  body.append('language', 'tur');
  body.append('OCREngine', '2');
  body.append('scale', 'true');
  body.append('isTable', 'true');
  try {
    const res = await fetch(OCR_SPACE_ENDPOINT, {
      method: 'POST',
      headers: { apikey: key },
      body,
    });
    if (!res.ok) {
      return {
        amount: null,
        date: null,
        rawText: '',
        provider: 'ocr.space',
        error: `HTTP ${res.status}`,
      };
    }
    const json = (await res.json()) as {
      IsErroredOnProcessing?: boolean;
      ErrorMessage?: string | string[];
      ParsedResults?: Array<{ ParsedText?: string }>;
    };
    if (json.IsErroredOnProcessing) {
      const msg = Array.isArray(json.ErrorMessage) ? json.ErrorMessage.join(' ') : json.ErrorMessage;
      return { amount: null, date: null, rawText: '', provider: 'ocr.space', error: msg || 'OCR hatası' };
    }
    const rawText = (json.ParsedResults ?? [])
      .map((r) => r.ParsedText ?? '')
      .join('\n')
      .trim();
    const parsed = parseReceiptText(rawText);
    return { ...parsed, rawText, provider: 'ocr.space' };
  } catch (e) {
    return {
      amount: null,
      date: null,
      rawText: '',
      provider: 'ocr.space',
      error: e instanceof Error ? e.message : 'Bilinmeyen hata',
    };
  }
}

/**
 * Parse Turkish receipt text for total amount and date.
 * Handles common patterns: "TOPLAM 123,45", "GENEL TOPLAM 234,56", and dates
 * in DD/MM/YYYY, DD.MM.YYYY, YYYY-MM-DD formats.
 */
export function parseReceiptText(text: string): { amount: number | null; date: string | null } {
  const normalized = text.toUpperCase();
  const amount = extractAmount(normalized);
  const date = extractDate(text);
  return { amount, date };
}

function extractAmount(normalized: string): number | null {
  const patterns = [
    /GENEL\s*TOPLAM[:\s]*([0-9.,]+)/,
    /TOPLAM\s*TUTAR[:\s]*([0-9.,]+)/,
    /TOPLAM[:\s]*([0-9.,]+)/,
    /TOTAL[:\s]*([0-9.,]+)/,
    /TUTAR[:\s]*([0-9.,]+)/,
    /KDV\s*DAHIL[:\s]*([0-9.,]+)/,
  ];
  for (const p of patterns) {
    const m = p.exec(normalized);
    if (m && m[1]) {
      const v = parseAmountString(m[1]);
      if (v !== null) return v;
    }
  }
  // Fallback: pick the largest reasonable number (< 1_000_000 to avoid phone/fiscal IDs)
  const matches = normalized.match(/\d{1,6}[.,]\d{2}/g) ?? [];
  let best: number | null = null;
  for (const m of matches) {
    const v = parseAmountString(m);
    if (v === null || v > 1_000_000) continue;
    if (best === null || v > best) best = v;
  }
  return best;
}

function parseAmountString(raw: string): number | null {
  const stripped = raw.replace(/[^0-9.,]/g, '');
  if (!stripped) return null;
  // If both separators present, treat last one as decimal.
  const lastComma = stripped.lastIndexOf(',');
  const lastDot = stripped.lastIndexOf('.');
  let normalized: string;
  if (lastComma === -1 && lastDot === -1) {
    normalized = stripped;
  } else if (lastComma > lastDot) {
    normalized = stripped.replace(/\./g, '').replace(',', '.');
  } else {
    normalized = stripped.replace(/,/g, '');
  }
  const n = Number(normalized);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 100) / 100;
}

function extractDate(text: string): string | null {
  const patterns: Array<{ re: RegExp; order: 'dmy' | 'ymd' }> = [
    { re: /(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/, order: 'ymd' },
    { re: /(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})/, order: 'dmy' },
  ];
  for (const { re, order } of patterns) {
    const m = re.exec(text);
    if (!m) continue;
    let year: number;
    let month: number;
    let day: number;
    if (order === 'ymd') {
      year = Number(m[1]);
      month = Number(m[2]);
      day = Number(m[3]);
    } else {
      day = Number(m[1]);
      month = Number(m[2]);
      year = Number(m[3]);
      if (year < 100) year += 2000;
    }
    if (!year || !month || !day) continue;
    if (month < 1 || month > 12 || day < 1 || day > 31) continue;
    const d = new Date(year, month - 1, day);
    if (d.getFullYear() < 2000 || d.getFullYear() > new Date().getFullYear() + 1) continue;
    return toIsoDate(d);
  }
  return null;
}
