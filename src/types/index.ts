export type Gender = 'male' | 'female' | 'other';

export interface Member {
  id: string;
  name: string;
  relation: string;
  gender: Gender;
  /** ISO date string (yyyy-mm-dd) */
  dateOfBirth?: string;
  heightCm?: number;
  /** Avatar accent color */
  color: string;
  createdAt: string;
}

export type VitalType =
  | 'bp'
  | 'sugar'
  | 'heartRate'
  | 'spo2'
  | 'weight'
  | 'temperature';

export type SugarContext = 'fasting' | 'postMeal' | 'random';

interface ReadingBase {
  id: string;
  memberId: string;
  /** ISO datetime the measurement was taken */
  takenAt: string;
  note?: string;
  createdAt: string;
}

export interface BpReading extends ReadingBase {
  type: 'bp';
  systolic: number;
  diastolic: number;
  pulse?: number;
}

export interface SugarReading extends ReadingBase {
  type: 'sugar';
  value: number;
  context: SugarContext;
}

export interface SimpleReading extends ReadingBase {
  type: 'heartRate' | 'spo2' | 'weight' | 'temperature';
  value: number;
}

export type Reading = BpReading | SugarReading | SimpleReading;

/** Omit that distributes across union members (plain Omit collapses unions). */
export type DistributiveOmit<T, K extends keyof never> = T extends unknown
  ? Omit<T, K>
  : never;

export type NewReading = DistributiveOmit<Reading, 'id' | 'createdAt'>;
export type NewMember = Omit<Member, 'id' | 'createdAt'>;
