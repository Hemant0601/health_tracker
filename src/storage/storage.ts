import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Member, Reading, Reminder } from '../types';
import type { UnitPreferences } from '../utils/units';
import { DEFAULT_UNITS } from '../utils/units';

const MEMBERS_KEY = 'health_tracker.members';
const READINGS_KEY = 'health_tracker.readings';
const REMINDERS_KEY = 'health_tracker.reminders';
const UNITS_KEY = 'health_tracker.units';

async function loadJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch (e) {
    console.warn(`Failed to load ${key}`, e);
    return fallback;
  }
}

async function saveJson(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn(`Failed to save ${key}`, e);
  }
}

export function loadMembers(): Promise<Member[]> {
  return loadJson<Member[]>(MEMBERS_KEY, []);
}

export function saveMembers(members: Member[]): Promise<void> {
  return saveJson(MEMBERS_KEY, members);
}

export function loadReadings(): Promise<Reading[]> {
  return loadJson<Reading[]>(READINGS_KEY, []);
}

export function saveReadings(readings: Reading[]): Promise<void> {
  return saveJson(READINGS_KEY, readings);
}

export function loadReminders(): Promise<Reminder[]> {
  return loadJson<Reminder[]>(REMINDERS_KEY, []);
}

export function saveReminders(reminders: Reminder[]): Promise<void> {
  return saveJson(REMINDERS_KEY, reminders);
}

export async function loadUnits(): Promise<UnitPreferences> {
  const stored = await loadJson<Partial<UnitPreferences>>(UNITS_KEY, {});
  // Merge so any newly-added unit dimension falls back to its default.
  return { ...DEFAULT_UNITS, ...stored };
}

export function saveUnits(units: UnitPreferences): Promise<void> {
  return saveJson(UNITS_KEY, units);
}
