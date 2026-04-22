import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getDb, firebaseConfigured } from '../firebase';
import { useAuth } from './AuthContext';
import {
  Announcement,
  DEFAULT_SITE_CONFIG,
  SiteConfig,
  fetchSiteConfig,
  subscribeAnnouncements,
  subscribeSiteConfig,
} from '../db/siteConfig';

interface AdminContextValue {
  isAdmin: boolean;
  adminChecked: boolean;
  siteConfig: SiteConfig;
  announcements: Announcement[];
  announcementsLoading: boolean;
  /** All active announcements (not expired, active=true) sorted by publishAt desc. */
  visibleAnnouncements: Announcement[];
  /** The subset of visibleAnnouncements the current user has not dismissed. */
  undismissedAnnouncements: Announcement[];
  dismissAnnouncement: (id: string) => void;
  /** Force re-fetch siteConfig (useful after admin edits when listener is debounced). */
  refreshSiteConfig: () => Promise<void>;
}

const AdminContext = createContext<AdminContextValue | null>(null);

const DISMISSED_STORAGE_KEY = 'ev-butce/dismissedAnnouncements';

function readDismissed(): Set<string> {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
    return new Set();
  }
  try {
    const raw = window.localStorage.getItem(DISMISSED_STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as string[];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function writeDismissed(set: Set<string>): void {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') return;
  try {
    window.localStorage.setItem(DISMISSED_STORAGE_KEY, JSON.stringify([...set]));
  } catch {
    /* ignore quota errors */
  }
}

function parseAdminEmails(): string[] {
  const raw: string = process.env.EXPO_PUBLIC_ADMIN_EMAILS ?? '';
  return raw
    .split(/[,\s]+/)
    .map((s: string) => s.trim().toLowerCase())
    .filter((s: string) => s.length > 0);
}

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminChecked, setAdminChecked] = useState(false);
  const [siteConfig, setSiteConfig] = useState<SiteConfig>(DEFAULT_SITE_CONFIG);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(true);
  const [dismissed, setDismissed] = useState<Set<string>>(() => readDismissed());
  const bootstrapAttempted = useRef(false);

  // Check admin role for the current user.
  useEffect(() => {
    if (!firebaseConfigured) {
      setIsAdmin(false);
      setAdminChecked(true);
      return;
    }
    if (!user) {
      setIsAdmin(false);
      setAdminChecked(true);
      return;
    }
    let cancelled = false;
    (async () => {
      // Make sure users/{uid} exists with an email field so admin-by-email
      // lookup works from the AdminPanel. setDoc with merge is idempotent.
      if (user.email) {
        try {
          await setDoc(
            doc(getDb(), 'users', user.uid),
            { email: user.email.toLowerCase(), displayName: user.displayName ?? null, updatedAt: new Date().toISOString() },
            { merge: true }
          );
        } catch {
          /* swallow — not fatal for admin detection */
        }
      }
      try {
        const adminDoc = await getDoc(doc(getDb(), 'admins', user.uid));
        if (cancelled) return;
        if (adminDoc.exists()) {
          setIsAdmin(true);
          setAdminChecked(true);
          return;
        }
        // Not admin yet — try bootstrap from env allowlist (once per mount).
        const emailList = parseAdminEmails();
        const email = (user.email ?? '').toLowerCase();
        if (email && emailList.includes(email) && !bootstrapAttempted.current) {
          bootstrapAttempted.current = true;
          try {
            await setDoc(doc(getDb(), 'admins', user.uid), {
              email,
              addedAt: new Date().toISOString(),
              addedBy: user.uid,
            });
            if (!cancelled) {
              setIsAdmin(true);
              setAdminChecked(true);
              return;
            }
          } catch {
            /* swallow — user simply won't be admin */
          }
        }
        if (!cancelled) {
          setIsAdmin(false);
          setAdminChecked(true);
        }
      } catch {
        if (!cancelled) {
          setIsAdmin(false);
          setAdminChecked(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Subscribe to siteConfig/global. Public read — works even before sign-in
  // so the Welcome screen and SEO meta tags reflect admin edits.
  useEffect(() => {
    if (!firebaseConfigured) {
      setSiteConfig(DEFAULT_SITE_CONFIG);
      return;
    }
    const unsub = subscribeSiteConfig(
      (cfg) => setSiteConfig(cfg ?? DEFAULT_SITE_CONFIG),
      () => setSiteConfig(DEFAULT_SITE_CONFIG)
    );
    return () => unsub();
  }, []);

  // Subscribe to announcements.
  useEffect(() => {
    if (!firebaseConfigured || !user) {
      setAnnouncements([]);
      setAnnouncementsLoading(false);
      return;
    }
    setAnnouncementsLoading(true);
    const unsub = subscribeAnnouncements(
      (items) => {
        setAnnouncements(items);
        setAnnouncementsLoading(false);
      },
      () => {
        setAnnouncements([]);
        setAnnouncementsLoading(false);
      }
    );
    return () => unsub();
  }, [user]);

  const refreshSiteConfig = useCallback(async () => {
    const cfg = await fetchSiteConfig();
    setSiteConfig(cfg ?? DEFAULT_SITE_CONFIG);
  }, []);

  const dismissAnnouncement = useCallback((id: string) => {
    setDismissed((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      writeDismissed(next);
      return next;
    });
  }, []);

  const visibleAnnouncements = useMemo(() => {
    const now = Date.now();
    return announcements.filter((a) => {
      if (!a.active) return false;
      const publishMs = Date.parse(a.publishAt);
      if (Number.isFinite(publishMs) && publishMs > now) return false;
      if (a.expiresAt) {
        const exp = Date.parse(a.expiresAt);
        if (Number.isFinite(exp) && exp <= now) return false;
      }
      return true;
    });
  }, [announcements]);

  const undismissedAnnouncements = useMemo(
    () => visibleAnnouncements.filter((a) => !dismissed.has(a.id)),
    [visibleAnnouncements, dismissed]
  );

  const value = useMemo<AdminContextValue>(
    () => ({
      isAdmin,
      adminChecked,
      siteConfig,
      announcements,
      announcementsLoading,
      visibleAnnouncements,
      undismissedAnnouncements,
      dismissAnnouncement,
      refreshSiteConfig,
    }),
    [
      isAdmin,
      adminChecked,
      siteConfig,
      announcements,
      announcementsLoading,
      visibleAnnouncements,
      undismissedAnnouncements,
      dismissAnnouncement,
      refreshSiteConfig,
    ]
  );

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdmin(): AdminContextValue {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used within AdminProvider');
  return ctx;
}
