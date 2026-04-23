import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  writeBatch,
} from 'firebase/firestore';
import { getDb } from '../firebase';

export type SocialLink = { label: string; url: string };

export interface SiteConfig {
  siteName: string;
  logoUrl: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
  supportUrl: string;
  socialLinks: SocialLink[];
  updatedAt?: string;
  updatedBy?: string;
}

export const DEFAULT_SITE_CONFIG: SiteConfig = {
  siteName: 'Ev Bütçe',
  logoUrl: '',
  seoTitle: 'Ev Bütçe — Akıllı Aile Bütçesi',
  seoDescription:
    'Gelir-gider takibi, alışveriş listesi, aile grubu ve akıllı analizle ev bütçenizi kolayca yönetin.',
  seoKeywords: 'ev bütçesi, gelir gider, alışveriş listesi, aile bütçesi, muhasebe',
  contactEmail: '',
  contactPhone: '',
  contactAddress: '',
  supportUrl: '',
  socialLinks: [],
};

export type AnnouncementCategory = 'news' | 'campaign' | 'system';

export interface Announcement {
  id: string;
  title: string;
  body: string;
  category: AnnouncementCategory;
  ctaLabel?: string;
  ctaUrl?: string;
  publishAt: string;
  expiresAt?: string;
  active: boolean;
  createdBy: string;
  createdAt: string;
}

export interface AdminEntry {
  userId: string;
  email: string;
  addedAt: string;
  addedBy: string;
}

const SITE_CONFIG_DOC = 'global';

export function subscribeSiteConfig(
  onValue: (cfg: SiteConfig | null) => void,
  onError?: (err: unknown) => void
): () => void {
  const ref = doc(getDb(), 'siteConfig', SITE_CONFIG_DOC);
  return onSnapshot(
    ref,
    (snap) => {
      if (!snap.exists()) {
        onValue(null);
        return;
      }
      const data = snap.data() as Partial<SiteConfig>;
      onValue({ ...DEFAULT_SITE_CONFIG, ...data });
    },
    (err) => {
      onError?.(err);
      onValue(null);
    }
  );
}

export async function fetchSiteConfig(): Promise<SiteConfig | null> {
  const ref = doc(getDb(), 'siteConfig', SITE_CONFIG_DOC);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { ...DEFAULT_SITE_CONFIG, ...(snap.data() as Partial<SiteConfig>) };
}

export async function saveSiteConfig(
  patch: Partial<SiteConfig>,
  updatedBy: string
): Promise<void> {
  const ref = doc(getDb(), 'siteConfig', SITE_CONFIG_DOC);
  const existing = await getDoc(ref);
  const base = existing.exists()
    ? ({ ...DEFAULT_SITE_CONFIG, ...(existing.data() as Partial<SiteConfig>) } as SiteConfig)
    : DEFAULT_SITE_CONFIG;
  const next: SiteConfig = {
    ...base,
    ...patch,
    updatedAt: new Date().toISOString(),
    updatedBy,
  };
  await setDoc(ref, next);
}

export function subscribeAnnouncements(
  onValue: (items: Announcement[]) => void,
  onError?: (err: unknown) => void
): () => void {
  const q = query(collection(getDb(), 'announcements'), orderBy('publishAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Announcement, 'id'>) }));
      onValue(items);
    },
    (err) => {
      onError?.(err);
      onValue([]);
    }
  );
}

function stripUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const out: Partial<T> = {};
  (Object.keys(obj) as Array<keyof T>).forEach((key) => {
    const value = obj[key];
    if (value !== undefined) {
      out[key] = value;
    }
  });
  return out;
}

export async function upsertAnnouncement(
  data: Omit<Announcement, 'id' | 'createdAt' | 'createdBy'> & {
    id?: string;
    createdBy: string;
  }
): Promise<string> {
  const { id, ...rest } = data;
  const cleaned = stripUndefined(rest);
  const now = new Date().toISOString();
  if (id) {
    const ref = doc(getDb(), 'announcements', id);
    const existing = await getDoc(ref);
    const createdAt = existing.exists()
      ? ((existing.data() as Announcement).createdAt ?? now)
      : now;
    await setDoc(ref, { ...cleaned, createdAt });
    return id;
  }
  const newId = doc(collection(getDb(), 'announcements')).id;
  const ref = doc(getDb(), 'announcements', newId);
  await setDoc(ref, { ...cleaned, createdAt: now });
  return newId;
}

export async function deleteAnnouncement(id: string): Promise<void> {
  await deleteDoc(doc(getDb(), 'announcements', id));
}

export function subscribeAdmins(
  onValue: (items: AdminEntry[]) => void,
  onError?: (err: unknown) => void
): () => void {
  const q = query(collection(getDb(), 'admins'));
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs.map((d) => ({ userId: d.id, ...(d.data() as Omit<AdminEntry, 'userId'>) }));
      onValue(items);
    },
    (err) => {
      onError?.(err);
      onValue([]);
    }
  );
}

export async function removeAdmin(userId: string): Promise<void> {
  await deleteDoc(doc(getDb(), 'admins', userId));
}

/**
 * Bulk add/remove admins. Accepts new UID→email map (kept) and userIds to drop.
 * Used by the admin screen to batch-save role changes.
 */
export async function commitAdminChanges(opts: {
  add: Array<{ userId: string; email: string; addedBy: string }>;
  remove: string[];
}): Promise<void> {
  const batch = writeBatch(getDb());
  const now = new Date().toISOString();
  for (const entry of opts.add) {
    batch.set(doc(getDb(), 'admins', entry.userId), {
      email: entry.email,
      addedAt: now,
      addedBy: entry.addedBy,
    });
  }
  for (const userId of opts.remove) {
    batch.delete(doc(getDb(), 'admins', userId));
  }
  await batch.commit();
}
