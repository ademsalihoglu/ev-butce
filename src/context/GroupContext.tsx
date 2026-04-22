import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { firebaseConfigured, getDb } from '../firebase';
import { useAuth } from './AuthContext';

export interface FamilyGroup {
  id: string;
  name: string;
  ownerId: string;
  memberIds: string[];
  inviteCode: string;
  createdAt: string;
}

export interface GroupMember {
  userId: string;
  displayName: string;
  email: string;
  role: 'owner' | 'member';
  joinedAt: string;
}

interface GroupContextValue {
  available: boolean; // Firestore configured
  loading: boolean;
  activeGroupId: string | null;
  activeGroup: FamilyGroup | null;
  myGroups: FamilyGroup[];
  members: GroupMember[];
  createGroup: (name: string) => Promise<FamilyGroup>;
  joinGroupByCode: (code: string) => Promise<FamilyGroup>;
  selectGroup: (groupId: string | null) => Promise<void>;
  leaveGroup: (groupId: string) => Promise<void>;
  renameGroup: (groupId: string, name: string) => Promise<void>;
  rotateInviteCode: (groupId: string) => Promise<string>;
  refreshMembers: () => Promise<void>;
}

const GroupContext = createContext<GroupContextValue | null>(null);

function randomInviteCode(): string {
  // 6-char uppercase alphanumeric, no ambiguous chars.
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 6; i++) {
    out += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return out;
}

export function GroupProvider({ children }: { children: React.ReactNode }) {
  const { user, configured } = useAuth();
  const available = configured && firebaseConfigured;

  const [loading, setLoading] = useState<boolean>(false);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [activeGroup, setActiveGroup] = useState<FamilyGroup | null>(null);
  const [myGroups, setMyGroups] = useState<FamilyGroup[]>([]);
  const [members, setMembers] = useState<GroupMember[]>([]);

  // Subscribe to all groups the current user is a member of.
  useEffect(() => {
    if (!available || !user) {
      setMyGroups([]);
      setActiveGroupId(null);
      setActiveGroup(null);
      setMembers([]);
      return;
    }
    setLoading(true);
    const q = query(
      collection(getDb(), 'groups'),
      where('memberIds', 'array-contains', user.uid)
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const groups = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<FamilyGroup, 'id'>) }));
        setMyGroups(groups);
        setLoading(false);
      },
      () => {
        setMyGroups([]);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [user, available]);

  // Persist selection per user locally (via Firestore user doc for cross-device).
  useEffect(() => {
    if (!available || !user) return;
    let cancelled = false;
    (async () => {
      const userDoc = await getDoc(doc(getDb(), 'users', user.uid));
      if (cancelled) return;
      const stored = (userDoc.data() as { activeGroupId?: string | null } | undefined)?.activeGroupId ?? null;
      if (stored) setActiveGroupId(stored);
    })();
    return () => {
      cancelled = true;
    };
  }, [user, available]);

  // When active group changes, pick its doc from myGroups (or subscribe fresh).
  useEffect(() => {
    if (!activeGroupId) {
      setActiveGroup(null);
      setMembers([]);
      return;
    }
    const match = myGroups.find((g) => g.id === activeGroupId) ?? null;
    setActiveGroup(match);
  }, [activeGroupId, myGroups]);

  const refreshMembers = useCallback(async () => {
    if (!activeGroupId) {
      setMembers([]);
      return;
    }
    const snap = await getDocs(collection(getDb(), 'groups', activeGroupId, 'members'));
    const list = snap.docs.map((d) => d.data() as GroupMember);
    list.sort((a, b) => (a.role === b.role ? a.displayName.localeCompare(b.displayName, 'tr') : a.role === 'owner' ? -1 : 1));
    setMembers(list);
  }, [activeGroupId]);

  useEffect(() => {
    void refreshMembers();
  }, [refreshMembers]);

  const createGroup = useCallback(
    async (name: string): Promise<FamilyGroup> => {
      if (!user) throw new Error('Oturum bulunamadı.');
      const trimmed = name.trim();
      if (!trimmed) throw new Error('Grup adı boş olamaz.');
      const inviteCode = randomInviteCode();
      const groupRef = await addDoc(collection(getDb(), 'groups'), {
        name: trimmed,
        ownerId: user.uid,
        memberIds: [user.uid],
        inviteCode,
        createdAt: new Date().toISOString(),
      });
      // Self as first member.
      const memberDoc: GroupMember = {
        userId: user.uid,
        displayName: user.displayName || user.email || 'Ben',
        email: user.email || '',
        role: 'owner',
        joinedAt: new Date().toISOString(),
      };
      await setDoc(doc(getDb(), 'groups', groupRef.id, 'members', user.uid), memberDoc);
      // Invite doc for easy lookup by code.
      await setDoc(doc(getDb(), 'invites', inviteCode), {
        groupId: groupRef.id,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
      });
      const created: FamilyGroup = {
        id: groupRef.id,
        name: trimmed,
        ownerId: user.uid,
        memberIds: [user.uid],
        inviteCode,
        createdAt: new Date().toISOString(),
      };
      return created;
    },
    [user]
  );

  const joinGroupByCode = useCallback(
    async (code: string): Promise<FamilyGroup> => {
      if (!user) throw new Error('Oturum bulunamadı.');
      const normalized = code.trim().toUpperCase();
      if (!normalized) throw new Error('Davet kodu boş olamaz.');
      const inviteSnap = await getDoc(doc(getDb(), 'invites', normalized));
      if (!inviteSnap.exists()) throw new Error('Davet kodu bulunamadı.');
      const { groupId } = inviteSnap.data() as { groupId: string };
      const groupSnap = await getDoc(doc(getDb(), 'groups', groupId));
      if (!groupSnap.exists()) throw new Error('Grup bulunamadı.');
      const group = { id: groupSnap.id, ...(groupSnap.data() as Omit<FamilyGroup, 'id'>) };
      if (group.memberIds.includes(user.uid)) {
        return group;
      }
      await updateDoc(doc(getDb(), 'groups', group.id), {
        memberIds: [...group.memberIds, user.uid],
      });
      const memberDoc: GroupMember = {
        userId: user.uid,
        displayName: user.displayName || user.email || 'Üye',
        email: user.email || '',
        role: 'member',
        joinedAt: new Date().toISOString(),
      };
      await setDoc(doc(getDb(), 'groups', group.id, 'members', user.uid), memberDoc);
      return { ...group, memberIds: [...group.memberIds, user.uid] };
    },
    [user]
  );

  const selectGroup = useCallback(
    async (groupId: string | null) => {
      setActiveGroupId(groupId);
      if (!user) return;
      await setDoc(
        doc(getDb(), 'users', user.uid),
        { activeGroupId: groupId, updatedAt: new Date().toISOString() },
        { merge: true }
      );
    },
    [user]
  );

  const leaveGroup = useCallback(
    async (groupId: string) => {
      if (!user) return;
      const snap = await getDoc(doc(getDb(), 'groups', groupId));
      if (!snap.exists()) return;
      const g = snap.data() as FamilyGroup;
      if (g.ownerId === user.uid) {
        // Owner leaves → delete the whole group (cascade on subcollections is the member's job
        // on re-create; for MVP we just remove the group doc + members + invite code).
        await deleteDoc(doc(getDb(), 'invites', g.inviteCode)).catch(() => {});
        const membersSnap = await getDocs(collection(getDb(), 'groups', groupId, 'members'));
        for (const m of membersSnap.docs) await deleteDoc(m.ref);
        await deleteDoc(doc(getDb(), 'groups', groupId));
      } else {
        await updateDoc(doc(getDb(), 'groups', groupId), {
          memberIds: g.memberIds.filter((uid) => uid !== user.uid),
        });
        await deleteDoc(doc(getDb(), 'groups', groupId, 'members', user.uid));
      }
      if (activeGroupId === groupId) {
        await selectGroup(null);
      }
    },
    [user, activeGroupId, selectGroup]
  );

  const renameGroup = useCallback(async (groupId: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) throw new Error('Grup adı boş olamaz.');
    await updateDoc(doc(getDb(), 'groups', groupId), { name: trimmed });
  }, []);

  const rotateInviteCode = useCallback(
    async (groupId: string): Promise<string> => {
      if (!user) throw new Error('Oturum bulunamadı.');
      const snap = await getDoc(doc(getDb(), 'groups', groupId));
      if (!snap.exists()) throw new Error('Grup bulunamadı.');
      const g = snap.data() as FamilyGroup;
      const newCode = randomInviteCode();
      await setDoc(doc(getDb(), 'invites', newCode), {
        groupId,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
      });
      await deleteDoc(doc(getDb(), 'invites', g.inviteCode)).catch(() => {});
      await updateDoc(doc(getDb(), 'groups', groupId), { inviteCode: newCode });
      return newCode;
    },
    [user]
  );

  const value = useMemo<GroupContextValue>(
    () => ({
      available,
      loading,
      activeGroupId,
      activeGroup,
      myGroups,
      members,
      createGroup,
      joinGroupByCode,
      selectGroup,
      leaveGroup,
      renameGroup,
      rotateInviteCode,
      refreshMembers,
    }),
    [
      available,
      loading,
      activeGroupId,
      activeGroup,
      myGroups,
      members,
      createGroup,
      joinGroupByCode,
      selectGroup,
      leaveGroup,
      renameGroup,
      rotateInviteCode,
      refreshMembers,
    ]
  );

  return <GroupContext.Provider value={value}>{children}</GroupContext.Provider>;
}

export function useGroup(): GroupContextValue {
  const ctx = useContext(GroupContext);
  if (!ctx) throw new Error('useGroup must be used within GroupProvider');
  return ctx;
}
