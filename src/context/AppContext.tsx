import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  loadMembers,
  loadReadings,
  saveMembers,
  saveReadings,
} from '../storage/storage';
import type { Member, NewMember, NewReading, Reading } from '../types';
import { makeId } from '../utils/id';

interface AppContextValue {
  isReady: boolean;
  members: Member[];
  readings: Reading[];
  addMember: (data: NewMember) => Member;
  updateMember: (id: string, patch: Partial<NewMember>) => void;
  deleteMember: (id: string) => void;
  addReading: (data: NewReading) => Reading;
  deleteReading: (id: string) => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

function sortByTakenAtDesc(readings: Reading[]): Reading[] {
  return [...readings].sort((a, b) => b.takenAt.localeCompare(a.takenAt));
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [readings, setReadings] = useState<Reading[]>([]);
  const hydrated = useRef(false);

  useEffect(() => {
    (async () => {
      const [storedMembers, storedReadings] = await Promise.all([
        loadMembers(),
        loadReadings(),
      ]);
      setMembers(storedMembers);
      setReadings(sortByTakenAtDesc(storedReadings));
      hydrated.current = true;
      setIsReady(true);
    })();
  }, []);

  useEffect(() => {
    if (hydrated.current) void saveMembers(members);
  }, [members]);

  useEffect(() => {
    if (hydrated.current) void saveReadings(readings);
  }, [readings]);

  const addMember = useCallback((data: NewMember): Member => {
    const member: Member = {
      ...data,
      id: makeId(),
      createdAt: new Date().toISOString(),
    };
    setMembers((prev) => [...prev, member]);
    return member;
  }, []);

  const updateMember = useCallback(
    (id: string, patch: Partial<NewMember>) => {
      setMembers((prev) =>
        prev.map((m) => (m.id === id ? { ...m, ...patch } : m))
      );
    },
    []
  );

  const deleteMember = useCallback((id: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
    setReadings((prev) => prev.filter((r) => r.memberId !== id));
  }, []);

  const addReading = useCallback((data: NewReading): Reading => {
    const reading: Reading = {
      ...data,
      id: makeId(),
      createdAt: new Date().toISOString(),
    } as Reading;
    setReadings((prev) => sortByTakenAtDesc([...prev, reading]));
    return reading;
  }, []);

  const deleteReading = useCallback((id: string) => {
    setReadings((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const value = useMemo(
    () => ({
      isReady,
      members,
      readings,
      addMember,
      updateMember,
      deleteMember,
      addReading,
      deleteReading,
    }),
    [
      isReady,
      members,
      readings,
      addMember,
      updateMember,
      deleteMember,
      addReading,
      deleteReading,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

export function useMember(id: string | undefined): Member | undefined {
  const { members } = useApp();
  return members.find((m) => m.id === id);
}

export function useMemberReadings(memberId: string | undefined): Reading[] {
  const { readings } = useApp();
  return useMemo(
    () => readings.filter((r) => r.memberId === memberId),
    [readings, memberId]
  );
}
