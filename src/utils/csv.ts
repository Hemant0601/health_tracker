import { File, Paths } from 'expo-file-system';
import { readAsStringAsync } from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

import { AVATAR_COLORS } from '../constants/profile';
import { SUGAR_CONTEXT_LABELS, VITALS } from '../constants/vitals';
import type {
  DistributiveOmit,
  Gender,
  Member,
  NewMember,
  NewReading,
  Reading,
  SugarContext,
  VitalType,
} from '../types';

/** A reading parsed from CSV, before a memberId is assigned on import. */
type ReadingDraft = DistributiveOmit<NewReading, 'memberId'>;
import { formatTime } from './format';
import { evaluateReading } from './health';

const COLUMNS = [
  'Member',
  'Relation',
  'Gender',
  'Date of Birth',
  'Height (cm)',
  'Vital',
  'Systolic',
  'Diastolic',
  'Pulse',
  'Value',
  'Context',
  'Unit',
  'Status',
  'Date',
  'Time',
  'Timestamp',
  'Note',
] as const;

const LABEL_TO_TYPE: Record<string, VitalType> = Object.fromEntries(
  Object.values(VITALS).map((v) => [v.label.toLowerCase(), v.type])
);

const LABEL_TO_CONTEXT: Record<string, SugarContext> = Object.fromEntries(
  Object.entries(SUGAR_CONTEXT_LABELS).map(([k, v]) => [
    v.toLowerCase(),
    k as SugarContext,
  ])
);

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

function isoDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Builds a flat CSV with patient details repeated on every reading row, so a
 * single file fully describes one or more members and all their readings. The
 * format round-trips through `parseReadingsCsv`.
 */
export function buildReadingsCsv(
  readings: Reading[],
  members: Member[]
): string {
  const memberById = new Map(members.map((m) => [m.id, m]));
  const lines = [COLUMNS.join(',')];
  for (const r of readings) {
    const m = memberById.get(r.memberId);
    const d = new Date(r.takenAt);
    const row: Record<(typeof COLUMNS)[number], string> = {
      Member: m?.name ?? 'Unknown',
      Relation: m?.relation ?? '',
      Gender: m?.gender ?? '',
      'Date of Birth': m?.dateOfBirth ?? '',
      'Height (cm)': m?.heightCm != null ? String(m.heightCm) : '',
      Vital: VITALS[r.type].label,
      Systolic: r.type === 'bp' ? String(r.systolic) : '',
      Diastolic: r.type === 'bp' ? String(r.diastolic) : '',
      Pulse: r.type === 'bp' && r.pulse != null ? String(r.pulse) : '',
      Value: r.type !== 'bp' ? String(r.value) : '',
      Context: r.type === 'sugar' ? SUGAR_CONTEXT_LABELS[r.context] : '',
      Unit: VITALS[r.type].unit,
      Status: evaluateReading(r)?.label ?? '',
      Date: isoDate(d),
      Time: formatTime(d),
      Timestamp: r.takenAt,
      Note: r.note ?? '',
    };
    lines.push(COLUMNS.map((c) => csvEscape(row[c])).join(','));
  }
  return lines.join('\n');
}

// ---------- import ----------

export interface ParsedMemberGroup {
  member: NewMember;
  readings: ReadingDraft[];
}

export interface ParsedImport {
  groups: ParsedMemberGroup[];
  rowCount: number;
  skipped: number;
}

/** RFC 4180-ish parser: handles quoted fields, escaped quotes, and CRLF. */
function parseCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let field = '';
  let row: string[] = [];
  let inQuotes = false;
  let i = 0;
  const pushField = () => {
    row.push(field);
    field = '';
  };
  const pushRow = () => {
    pushField();
    rows.push(row);
    row = [];
  };
  while (i < text.length) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += ch;
      i++;
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (ch === ',') {
      pushField();
      i++;
      continue;
    }
    if (ch === '\r') {
      i++;
      continue;
    }
    if (ch === '\n') {
      pushRow();
      i++;
      continue;
    }
    field += ch;
    i++;
  }
  // flush trailing field/row if any content remains
  if (field.length > 0 || row.length > 0) pushRow();
  return rows;
}

function colorForName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function parseGender(raw: string): Gender {
  const g = raw.trim().toLowerCase();
  if (g === 'male' || g === 'female' || g === 'other') return g;
  return 'other';
}

function num(raw: string | undefined): number | null {
  if (!raw) return null;
  const n = Number(raw.trim().replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

function memberKey(name: string, relation: string): string {
  return `${name.trim().toLowerCase()}|${relation.trim().toLowerCase()}`;
}

export function parseReadingsCsv(text: string): ParsedImport {
  const rows = parseCsvRows(text);
  if (rows.length < 2) return { groups: [], rowCount: 0, skipped: 0 };

  const header = rows[0].map((h) => h.trim().toLowerCase());
  const idx = (name: string) => header.indexOf(name.toLowerCase());
  const col = {
    member: idx('Member'),
    relation: idx('Relation'),
    gender: idx('Gender'),
    dob: idx('Date of Birth'),
    height: idx('Height (cm)'),
    vital: idx('Vital'),
    systolic: idx('Systolic'),
    diastolic: idx('Diastolic'),
    pulse: idx('Pulse'),
    value: idx('Value'),
    context: idx('Context'),
    timestamp: idx('Timestamp'),
    date: idx('Date'),
    time: idx('Time'),
    note: idx('Note'),
  };
  if (col.member < 0 || col.vital < 0) {
    throw new Error(
      'This file does not look like a Health Tracker export (missing Member or Vital column).'
    );
  }

  const groups = new Map<string, ParsedMemberGroup>();
  let skipped = 0;
  let rowCount = 0;

  const at = (r: string[], c: number) => (c >= 0 ? (r[c] ?? '').trim() : '');

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (r.length === 1 && r[0].trim() === '') continue; // blank line
    const name = at(r, col.member);
    const vitalLabel = at(r, col.vital).toLowerCase();
    const type = LABEL_TO_TYPE[vitalLabel];
    if (!name || !type) {
      skipped++;
      continue;
    }
    rowCount++;

    const relation = at(r, col.relation) || 'Other';
    const key = memberKey(name, relation);
    if (!groups.has(key)) {
      const heightCm = num(at(r, col.height));
      const dob = at(r, col.dob);
      groups.set(key, {
        member: {
          name,
          relation,
          gender: parseGender(at(r, col.gender)),
          dateOfBirth: /^\d{4}-\d{2}-\d{2}$/.test(dob) ? dob : undefined,
          heightCm: heightCm != null ? heightCm : undefined,
          color: colorForName(name),
        },
        readings: [],
      });
    }

    // takenAt: prefer ISO timestamp, else Date+Time, else now.
    let takenAt = at(r, col.timestamp);
    if (!takenAt || Number.isNaN(new Date(takenAt).getTime())) {
      const composed = new Date(`${at(r, col.date)} ${at(r, col.time)}`);
      takenAt = Number.isNaN(composed.getTime())
        ? new Date().toISOString()
        : composed.toISOString();
    } else {
      takenAt = new Date(takenAt).toISOString();
    }

    const note = at(r, col.note) || undefined;

    let reading: ReadingDraft | null = null;
    if (type === 'bp') {
      const s = num(at(r, col.systolic));
      const d = num(at(r, col.diastolic));
      const p = num(at(r, col.pulse));
      if (s != null && d != null) {
        reading = {
          type: 'bp',
          systolic: s,
          diastolic: d,
          pulse: p != null ? p : undefined,
          takenAt,
          note,
        };
      }
    } else if (type === 'sugar') {
      const v = num(at(r, col.value));
      if (v != null) {
        const ctx = LABEL_TO_CONTEXT[at(r, col.context).toLowerCase()];
        reading = {
          type: 'sugar',
          value: v,
          context: ctx ?? 'random',
          takenAt,
          note,
        };
      }
    } else {
      const v = num(at(r, col.value));
      if (v != null) reading = { type, value: v, takenAt, note };
    }

    if (reading) groups.get(key)!.readings.push(reading);
    else skipped++;
  }

  return { groups: [...groups.values()], rowCount, skipped };
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

/** Reads a picked file (file:// or content://) and parses it. */
export async function readAndParseCsv(uri: string): Promise<ParsedImport> {
  const text = await readAsStringAsync(uri);
  return parseReadingsCsv(text);
}
