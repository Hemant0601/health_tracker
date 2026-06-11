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
  loadReminders,
  saveMembers,
  saveReadings,
  saveReminders,
} from '../storage/storage';
import type {
  Member,
  NewMember,
  NewReading,
  Reading,
  Reminder,
} from '../types';
import { makeId } from '../utils/id';
import { cancelReminderNotification } from '../utils/notifications';

type NewReminder = Omit<Reminder, 'id' | 'createdAt'>;

interface AppContextValue {
  isReady: boolean;
  members: Member[];
  readings: Reading[];
  reminders: Reminder[];
  addMember: (data: NewMember) => Member;
  updateMember: (id: string, patch: Partial<NewMember>) => void;
  deleteMember: (id: string) => void;
  addReading: (data: NewReading) => Reading;
  updateReading: (id: string, data: NewReading) => void;
  deleteReading: (id: string) => void;
  addReminder: (data: NewReminder) => Reminder;
  updateReminder: (id: string, patch: Partial<NewReminder>) => void;
  deleteReminder: (id: string) => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

function sortByTakenAtDesc(readings: Reading[]): Reading[] {
  return [...readings].sort((a, b) => b.takenAt.localeCompare(a.takenAt));
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [readings, setReadings] = useState<Reading[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const hydrated = useRef(false);

  useEffect(() => {
    (async () => {
      const [storedMembers, storedReadings, storedReminders] =
        await Promise.all([loadMembers(), loadReadings(), loadReminders()]);
      setMembers(storedMembers);
      setReadings(sortByTakenAtDesc(storedReadings));
      setReminders(storedReminders);
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

  useEffect(() => {
    if (hydrated.current) void saveReminders(reminders);
  }, [reminders]);

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

  const deleteMember = useCallback(
    (id: string) => {
      for (const reminder of reminders) {
        if (reminder.memberId === id) {
          void cancelReminderNotification(reminder.notificationId);
        }
      }
      setMembers((prev) => prev.filter((m) => m.id !== id));
      setReadings((prev) => prev.filter((r) => r.memberId !== id));
      setReminders((prev) => prev.filter((r) => r.memberId !== id));
    },
    [reminders]
  );

  const addReading = useCallback((data: NewReading): Reading => {
    const reading: Reading = {
      ...data,
      id: makeId(),
      createdAt: new Date().toISOString(),
    } as Reading;
    setReadings((prev) => sortByTakenAtDesc([...prev, reading]));
    return reading;
  }, []);

  const updateReading = useCallback((id: string, data: NewReading) => {
    setReadings((prev) =>
      sortByTakenAtDesc(
        prev.map((r) =>
          r.id === id
            ? ({ ...data, id: r.id, createdAt: r.createdAt } as Reading)
            : r
        )
      )
    );
  }, []);

  const deleteReading = useCallback((id: string) => {
    setReadings((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const addReminder = useCallback((data: NewReminder): Reminder => {
    const reminder: Reminder = {
      ...data,
      id: makeId(),
      createdAt: new Date().toISOString(),
    };
    setReminders((prev) => [...prev, reminder]);
    return reminder;
  }, []);

  const updateReminder = useCallback(
    (id: string, patch: Partial<NewReminder>) => {
      setReminders((prev) =>
        prev.map((r) => (r.id === id ? { ...r, ...patch } : r))
      );
    },
    []
  );

  const deleteReminder = useCallback(
    (id: string) => {
      const target = reminders.find((r) => r.id === id);
      if (target) void cancelReminderNotification(target.notificationId);
      setReminders((prev) => prev.filter((r) => r.id !== id));
    },
    [reminders]
  );

  const value = useMemo(
    () => ({
      isReady,
      members,
      readings,
      reminders,
      addMember,
      updateMember,
      deleteMember,
      addReading,
      updateReading,
      deleteReading,
      addReminder,
      updateReminder,
      deleteReminder,
    }),
    [
      isReady,
      members,
      readings,
      reminders,
      addMember,
      updateMember,
      deleteMember,
      addReading,
      updateReading,
      deleteReading,
      addReminder,
      updateReminder,
      deleteReminder,
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
