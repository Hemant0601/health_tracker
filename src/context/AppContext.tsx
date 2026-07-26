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
  loadUnits,
  saveMembers,
  saveReadings,
  saveReminders,
  saveUnits,
} from '../storage/storage';
import type {
  Member,
  NewMember,
  NewReading,
  Reading,
  Reminder,
} from '../types';
import type { ParsedImport } from '../utils/csv';
import { makeId } from '../utils/id';
import { cancelReminderNotification } from '../utils/notifications';
import type { UnitPreferences } from '../utils/units';
import { DEFAULT_UNITS } from '../utils/units';

type NewReminder = Omit<Reminder, 'id' | 'createdAt'>;

export interface ImportResult {
  membersAdded: number;
  membersMatched: number;
  readingsAdded: number;
  readingsSkipped: number;
}

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
  importData: (parsed: ParsedImport) => ImportResult;
  units: UnitPreferences;
  updateUnits: (patch: Partial<UnitPreferences>) => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

function sortByTakenAtDesc(readings: Reading[]): Reading[] {
  return [...readings].sort((a, b) => b.takenAt.localeCompare(a.takenAt));
}

/** Identity of a reading for import de-duplication (ignores id/createdAt). */
function readingSignature(r: Reading): string {
  const core =
    r.type === 'bp'
      ? `${r.systolic}/${r.diastolic}/${r.pulse ?? ''}`
      : r.type === 'sugar'
        ? `${r.value}/${r.context}`
        : `${r.value}`;
  return `${r.memberId}|${r.type}|${r.takenAt}|${core}`;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [readings, setReadings] = useState<Reading[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [units, setUnits] = useState<UnitPreferences>(DEFAULT_UNITS);
  const hydrated = useRef(false);
  // Fresh snapshots for actions that read current state without re-binding.
  const membersRef = useRef<Member[]>(members);
  const readingsRef = useRef<Reading[]>(readings);
  membersRef.current = members;
  readingsRef.current = readings;

  useEffect(() => {
    (async () => {
      const [storedMembers, storedReadings, storedReminders, storedUnits] =
        await Promise.all([
          loadMembers(),
          loadReadings(),
          loadReminders(),
          loadUnits(),
        ]);
      setMembers(storedMembers);
      setReadings(sortByTakenAtDesc(storedReadings));
      setReminders(storedReminders);
      setUnits(storedUnits);
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

  useEffect(() => {
    if (hydrated.current) void saveUnits(units);
  }, [units]);

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

  const importData = useCallback((parsed: ParsedImport): ImportResult => {
    const result: ImportResult = {
      membersAdded: 0,
      membersMatched: 0,
      readingsAdded: 0,
      readingsSkipped: 0,
    };

    const nextMembers = [...membersRef.current];
    const nextReadings = [...readingsRef.current];
    const signatures = new Set(nextReadings.map(readingSignature));

    // Resolve each imported group to an existing or new member, then add its
    // readings while skipping exact duplicates.
    for (const group of parsed.groups) {
      const match = nextMembers.find(
        (m) =>
          m.name.trim().toLowerCase() ===
            group.member.name.trim().toLowerCase() &&
          m.relation.trim().toLowerCase() ===
            group.member.relation.trim().toLowerCase()
      );
      let memberId: string;
      if (match) {
        memberId = match.id;
        result.membersMatched++;
      } else {
        const created: Member = {
          ...group.member,
          id: makeId(),
          createdAt: new Date().toISOString(),
        };
        nextMembers.push(created);
        memberId = created.id;
        result.membersAdded++;
      }

      for (const r of group.readings) {
        const reading = {
          ...r,
          memberId,
          id: makeId(),
          createdAt: new Date().toISOString(),
        } as Reading;
        const sig = readingSignature(reading);
        if (signatures.has(sig)) {
          result.readingsSkipped++;
          continue;
        }
        signatures.add(sig);
        nextReadings.push(reading);
        result.readingsAdded++;
      }
    }

    if (result.membersAdded > 0) setMembers(nextMembers);
    if (result.readingsAdded > 0) setReadings(sortByTakenAtDesc(nextReadings));
    return result;
  }, []);

  const updateUnits = useCallback((patch: Partial<UnitPreferences>) => {
    setUnits((prev) => ({ ...prev, ...patch }));
  }, []);

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
      importData,
      units,
      updateUnits,
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
      importData,
      units,
      updateUnits,
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
