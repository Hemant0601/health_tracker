import type { Gender } from '../types';

export const RELATIONS = [
  'Self',
  'Father',
  'Mother',
  'Spouse',
  'Son',
  'Daughter',
  'Brother',
  'Sister',
  'Grandfather',
  'Grandmother',
  'Other',
];

export const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];

export const AVATAR_COLORS = [
  '#0D9488',
  '#2563EB',
  '#7C3AED',
  '#DB2777',
  '#D97706',
  '#DC2626',
  '#059669',
  '#475569',
];
