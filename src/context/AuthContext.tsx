import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { getFirebaseAuth, firebaseConfigured } from '../firebase';

interface AuthContextValue {
  user: User | null;
  initializing: boolean;
  configured: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function mapAuthError(err: unknown): Error {
  const code = (err as { code?: string } | null)?.code ?? '';
  const message = (err as { message?: string } | null)?.message ?? 'Bilinmeyen hata';
  const map: Record<string, string> = {
    'auth/invalid-email': 'Geçersiz e-posta adresi.',
    'auth/invalid-credential': 'E-posta veya şifre hatalı.',
    'auth/user-not-found': 'Bu e-posta ile kayıtlı kullanıcı bulunamadı.',
    'auth/wrong-password': 'Şifre hatalı.',
    'auth/email-already-in-use': 'Bu e-posta adresi zaten kayıtlı.',
    'auth/weak-password': 'Şifre çok zayıf. En az 6 karakter olmalı.',
    'auth/too-many-requests': 'Çok fazla deneme yapıldı. Lütfen biraz sonra tekrar deneyin.',
    'auth/network-request-failed': 'Ağ hatası. İnternet bağlantınızı kontrol edin.',
    'auth/missing-password': 'Şifre boş bırakılamaz.',
  };
  return new Error(map[code] ?? message);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    if (!firebaseConfigured) {
      setInitializing(false);
      return;
    }
    const auth = getFirebaseAuth();
    const unsub = onAuthStateChanged(auth, (next) => {
      setUser(next);
      setInitializing(false);
    });
    return () => unsub();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);
    } catch (err) {
      throw mapAuthError(err);
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, displayName?: string) => {
    try {
      const cred = await createUserWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);
      if (displayName) {
        await updateProfile(cred.user, { displayName });
      }
    } catch (err) {
      throw mapAuthError(err);
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    try {
      await sendPasswordResetEmail(getFirebaseAuth(), email.trim());
    } catch (err) {
      throw mapAuthError(err);
    }
  }, []);

  const signOutUser = useCallback(async () => {
    try {
      await signOut(getFirebaseAuth());
    } catch (err) {
      throw mapAuthError(err);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      initializing,
      configured: firebaseConfigured,
      signIn,
      signUp,
      resetPassword,
      signOutUser,
    }),
    [user, initializing, signIn, signUp, resetPassword, signOutUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
