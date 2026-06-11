import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { VITALS } from '../constants/vitals';
import type { Member, Reading } from '../types';
import { formatTime } from './format';
import {
  evaluateReading,
  readingDetailText,
  readingValueText,
} from './health';

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

export function buildReadingsCsv(
  readings: Reading[],
  memberById: Map<string, Member>
): string {
  const header = [
    'Member',
    'Vital',
    'Value',
    'Unit',
    'Detail',
    'Status',
    'Date',
    'Time',
    'Note',
  ];
  const lines = [header.join(',')];
  for (const r of readings) {
    const d = new Date(r.takenAt);
    const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    lines.push(
      [
        memberById.get(r.memberId)?.name ?? 'Unknown',
        VITALS[r.type].label,
        readingValueText(r),
        VITALS[r.type].unit,
        readingDetailText(r) ?? '',
        evaluateReading(r)?.label ?? '',
        date,
        formatTime(d),
        r.note ?? '',
      ]
        .map(csvEscape)
        .join(',')
    );
  }
  return lines.join('\n');
}

export function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'member'
  );
}

export function csvFilename(scope: string): string {
  const d = new Date();
  const stamp = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
  return `health-readings-${scope}-${stamp}.csv`;
}

/** Writes the CSV to cache and opens the share sheet. Returns false when sharing is unavailable. */
export async function shareCsv(
  filename: string,
  csv: string
): Promise<boolean> {
  if (!(await Sharing.isAvailableAsync())) return false;
  const file = new File(Paths.cache, filename);
  file.create({ overwrite: true, intermediates: true });
  file.write(csv);
  await Sharing.shareAsync(file.uri, {
    mimeType: 'text/csv',
    dialogTitle: 'Share health readings',
    UTI: 'public.comma-separated-values-text',
  });
  return true;
}
