import { SUGAR_CONTEXT_LABELS, VITALS } from '../constants/vitals';
import type { Reading } from '../types';
import { fmtNum } from './format';

export type StatusLevel = 'low' | 'normal' | 'elevated' | 'high' | 'critical';

export interface VitalStatus {
  level: StatusLevel;
  label: string;
}

export const STATUS_COLORS: Record<
  StatusLevel,
  { color: string; soft: string }
> = {
  low: { color: '#2563EB', soft: '#DBEAFE' },
  normal: { color: '#16A34A', soft: '#DCFCE7' },
  elevated: { color: '#D97706', soft: '#FEF3C7' },
  high: { color: '#DC2626', soft: '#FEE2E2' },
  critical: { color: '#9F1239', soft: '#FFE4E6' },
};

// Classification follows the ESC/ESH (also used in Indian) guidelines, where
// hypertension begins at 140/90. A reading takes the worse of its systolic and
// diastolic category, so e.g. 121/92 is flagged on the diastolic.
function bpStatus(systolic: number, diastolic: number): VitalStatus {
  if (systolic >= 180 || diastolic >= 120)
    return { level: 'critical', label: 'Hypertensive crisis' };
  if (systolic < 90 || diastolic < 60)
    return { level: 'low', label: 'Low' };
  if (systolic >= 160 || diastolic >= 100)
    return { level: 'high', label: 'High · Grade 2' };
  if (systolic >= 140 || diastolic >= 90)
    return { level: 'high', label: 'High · Grade 1' };
  if (systolic >= 130 || diastolic >= 85)
    return { level: 'elevated', label: 'High–normal' };
  if (systolic >= 120 || diastolic >= 80)
    return { level: 'normal', label: 'Normal' };
  return { level: 'normal', label: 'Optimal' };
}

function sugarStatus(
  value: number,
  context: 'fasting' | 'postMeal' | 'random'
): VitalStatus {
  if (value < 54) return { level: 'critical', label: 'Very low' };
  if (value < 70) return { level: 'low', label: 'Low' };
  if (value >= 300) return { level: 'critical', label: 'Very high' };
  if (context === 'fasting') {
    if (value >= 126) return { level: 'high', label: 'Diabetic range' };
    if (value >= 100) return { level: 'elevated', label: 'Prediabetic range' };
    return { level: 'normal', label: 'Normal' };
  }
  // Post-meal and random share thresholds.
  if (value >= 200) return { level: 'high', label: 'Diabetic range' };
  if (value >= 140) return { level: 'elevated', label: 'Prediabetic range' };
  return { level: 'normal', label: 'Normal' };
}

function heartRateStatus(value: number): VitalStatus {
  if (value > 150) return { level: 'critical', label: 'Very high' };
  if (value > 120) return { level: 'high', label: 'High' };
  if (value > 100) return { level: 'elevated', label: 'Elevated' };
  if (value < 50) return { level: 'high', label: 'Very low' };
  if (value < 60) return { level: 'low', label: 'Low' };
  return { level: 'normal', label: 'Normal' };
}

function spo2Status(value: number): VitalStatus {
  if (value < 90) return { level: 'critical', label: 'Very low' };
  if (value < 95) return { level: 'high', label: 'Low' };
  return { level: 'normal', label: 'Normal' };
}

function temperatureStatus(value: number): VitalStatus {
  if (value >= 40) return { level: 'critical', label: 'Very high fever' };
  if (value >= 38) return { level: 'high', label: 'Fever' };
  if (value >= 37.3) return { level: 'elevated', label: 'Mild fever' };
  if (value < 35) return { level: 'low', label: 'Low' };
  return { level: 'normal', label: 'Normal' };
}

/** Returns null for vitals with no meaningful status (e.g. weight). */
export function evaluateReading(reading: Reading): VitalStatus | null {
  switch (reading.type) {
    case 'bp':
      return bpStatus(reading.systolic, reading.diastolic);
    case 'sugar':
      return sugarStatus(reading.value, reading.context);
    case 'heartRate':
      return heartRateStatus(reading.value);
    case 'spo2':
      return spo2Status(reading.value);
    case 'temperature':
      return temperatureStatus(reading.value);
    case 'weight':
      return null;
  }
}

/** Main display value, e.g. "120/80" or "98.6". */
export function readingValueText(reading: Reading): string {
  if (reading.type === 'bp')
    return `${fmtNum(reading.systolic)}/${fmtNum(reading.diastolic)}`;
  return fmtNum(reading.value);
}

export function readingUnitText(reading: Reading): string {
  return VITALS[reading.type].unit;
}

/** Secondary detail, e.g. "Fasting" or "Pulse 72 bpm". */
export function readingDetailText(reading: Reading): string | null {
  if (reading.type === 'sugar') return SUGAR_CONTEXT_LABELS[reading.context];
  if (reading.type === 'bp' && reading.pulse != null)
    return `Pulse ${fmtNum(reading.pulse)} bpm`;
  return null;
}

export interface BmiResult {
  bmi: number;
  status: VitalStatus;
}

export function calcBmi(weightKg: number, heightCm?: number): BmiResult | null {
  if (!heightCm || heightCm <= 0) return null;
  const meters = heightCm / 100;
  const bmi = weightKg / (meters * meters);
  let status: VitalStatus;
  if (bmi < 18.5) status = { level: 'low', label: 'Underweight' };
  else if (bmi < 25) status = { level: 'normal', label: 'Healthy' };
  else if (bmi < 30) status = { level: 'elevated', label: 'Overweight' };
  else status = { level: 'high', label: 'Obese' };
  return { bmi: Math.round(bmi * 10) / 10, status };
}
