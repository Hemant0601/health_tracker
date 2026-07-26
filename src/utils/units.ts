import { VITALS } from '../constants/vitals';
import type { Reading, VitalType } from '../types';
import { fmtNum } from './format';

export type TempUnit = 'C' | 'F';
export type WeightUnit = 'kg' | 'lb';
export type SugarUnit = 'mg/dL' | 'mmol/L';

export interface UnitPreferences {
  temperature: TempUnit;
  weight: WeightUnit;
  sugar: SugarUnit;
}

// Readings are always STORED in these canonical units (°C, kg, mg/dL); the
// values here only affect how they are displayed and entered.
export const DEFAULT_UNITS: UnitPreferences = {
  temperature: 'F',
  weight: 'kg',
  sugar: 'mg/dL',
};

const GLUCOSE_FACTOR = 18.0182; // mg/dL per mmol/L
const LB_PER_KG = 2.20462262;

/** Number of decimals to show for a vital in a given unit. */
function displayDecimals(type: VitalType, u: UnitPreferences): number {
  if (type === 'temperature') return 1;
  if (type === 'weight') return 1;
  if (type === 'sugar') return u.sugar === 'mmol/L' ? 1 : 0;
  return 0;
}

function round(value: number, decimals: number): number {
  const f = 10 ** decimals;
  return Math.round(value * f) / f;
}

/** Canonical stored value → the number shown to the user. */
export function toDisplay(
  type: VitalType,
  canonical: number,
  u: UnitPreferences
): number {
  switch (type) {
    case 'temperature':
      return u.temperature === 'F' ? canonical * 1.8 + 32 : canonical;
    case 'weight':
      return u.weight === 'lb' ? canonical * LB_PER_KG : canonical;
    case 'sugar':
      return u.sugar === 'mmol/L' ? canonical / GLUCOSE_FACTOR : canonical;
    default:
      return canonical;
  }
}

/** Number the user typed (in their unit) → canonical stored value. */
export function toCanonical(
  type: VitalType,
  display: number,
  u: UnitPreferences
): number {
  switch (type) {
    case 'temperature':
      return u.temperature === 'F' ? (display - 32) / 1.8 : display;
    case 'weight':
      return u.weight === 'lb' ? display / LB_PER_KG : display;
    case 'sugar':
      return u.sugar === 'mmol/L' ? display * GLUCOSE_FACTOR : display;
    default:
      return display;
  }
}

/** The unit label to show for a vital, honouring the user's preferences. */
export function unitLabel(type: VitalType, u: UnitPreferences): string {
  switch (type) {
    case 'temperature':
      return u.temperature === 'F' ? '°F' : '°C';
    case 'weight':
      return u.weight;
    case 'sugar':
      return u.sugar;
    default:
      return VITALS[type].unit;
  }
}

/** Canonical value rounded to a sensible number of decimals in display units. */
export function displayValue(
  type: VitalType,
  canonical: number,
  u: UnitPreferences
): number {
  return round(toDisplay(type, canonical, u), displayDecimals(type, u));
}

/** Main value text for a reading in display units, e.g. "98.6" or "120/80". */
export function formatReadingValue(
  reading: Reading,
  u: UnitPreferences
): string {
  if (reading.type === 'bp')
    return `${fmtNum(reading.systolic)}/${fmtNum(reading.diastolic)}`;
  return fmtNum(displayValue(reading.type, reading.value, u));
}

/** A neutral example value (in display units) used as an input placeholder. */
export function placeholderFor(type: VitalType, u: UnitPreferences): string {
  switch (type) {
    case 'sugar':
      return u.sugar === 'mmol/L' ? '5.4' : '98';
    case 'heartRate':
      return '72';
    case 'spo2':
      return '98';
    case 'weight':
      return u.weight === 'lb' ? '155' : '70.5';
    case 'temperature':
      return u.temperature === 'F' ? '98.6' : '36.8';
    default:
      return '';
  }
}

export interface DisplayBounds {
  min: number;
  max: number;
}

/** Canonical INPUT_BOUNDS converted to display units for validation/messaging. */
export function displayBounds(
  type: VitalType,
  canonical: DisplayBounds,
  u: UnitPreferences
): DisplayBounds {
  const decimals = displayDecimals(type, u);
  const a = round(toDisplay(type, canonical.min, u), decimals);
  const b = round(toDisplay(type, canonical.max, u), decimals);
  // Conversion can invert ordering only if a factor were negative; it never is,
  // but guard anyway so min ≤ max holds for the caller.
  return { min: Math.min(a, b), max: Math.max(a, b) };
}

/**
 * Canonicalizes a value read from a CSV using the file's own unit label, so a
 * file exported in °F/lb/mmol/L imports correctly regardless of current prefs.
 */
export function canonicalFromUnitLabel(
  type: VitalType,
  value: number,
  unitLabelRaw: string
): number {
  const label = unitLabelRaw.trim().toLowerCase();
  switch (type) {
    case 'temperature':
      return label.includes('f') ? (value - 32) / 1.8 : value;
    case 'weight':
      return label.includes('lb') ? value / LB_PER_KG : value;
    case 'sugar':
      return label.includes('mmol') ? value * GLUCOSE_FACTOR : value;
    default:
      return value;
  }
}

/** Reference ranges, expressed in the user's chosen units. */
export function referenceNote(type: VitalType, u: UnitPreferences): string {
  if (type === 'temperature') {
    return u.temperature === 'F'
      ? 'Normal: 97.0–99.0°F · Mild fever: 99.1–100.2°F · Fever: 100.4°F or above'
      : 'Normal: 36.1–37.2°C · Mild fever: 37.3–37.9°C · Fever: 38°C or above';
  }
  if (type === 'sugar') {
    return u.sugar === 'mmol/L'
      ? 'Fasting — Normal: 3.9–5.5 · Prediabetes: 5.6–6.9 · Diabetes: 7.0+\nPost-meal (2h) — Normal: below 7.8 · Prediabetes: 7.8–11.0 · Diabetes: 11.1+'
      : VITALS.sugar.referenceNote;
  }
  return VITALS[type].referenceNote;
}
