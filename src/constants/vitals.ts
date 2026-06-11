import type { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';

import type { SugarContext, VitalType } from '../types';

export type VitalIconName = React.ComponentProps<
  typeof MaterialCommunityIcons
>['name'];

export interface VitalConfig {
  type: VitalType;
  label: string;
  shortLabel: string;
  unit: string;
  icon: VitalIconName;
  color: string;
  softColor: string;
  referenceNote: string;
}

export const VITALS: Record<VitalType, VitalConfig> = {
  bp: {
    type: 'bp',
    label: 'Blood Pressure',
    shortLabel: 'BP',
    unit: 'mmHg',
    icon: 'heart-pulse',
    color: '#E11D48',
    softColor: '#FFE4E6',
    referenceNote:
      'Normal: below 120/80 · Elevated: 120–129 systolic · High (S1): 130–139 / 80–89 · High (S2): 140+/90+ · Crisis: 180+/120+',
  },
  sugar: {
    type: 'sugar',
    label: 'Blood Sugar',
    shortLabel: 'Sugar',
    unit: 'mg/dL',
    icon: 'water',
    color: '#D97706',
    softColor: '#FEF3C7',
    referenceNote:
      'Fasting — Normal: 70–99 · Prediabetes: 100–125 · Diabetes: 126+\nPost-meal (2h) — Normal: below 140 · Prediabetes: 140–199 · Diabetes: 200+',
  },
  heartRate: {
    type: 'heartRate',
    label: 'Heart Rate',
    shortLabel: 'Heart',
    unit: 'bpm',
    icon: 'heart',
    color: '#DB2777',
    softColor: '#FCE7F3',
    referenceNote: 'Normal resting heart rate for adults: 60–100 bpm',
  },
  spo2: {
    type: 'spo2',
    label: 'Oxygen (SpO₂)',
    shortLabel: 'SpO₂',
    unit: '%',
    icon: 'lungs',
    color: '#2563EB',
    softColor: '#DBEAFE',
    referenceNote:
      'Normal: 95–100% · Low: 90–94% · Below 90% needs medical attention',
  },
  weight: {
    type: 'weight',
    label: 'Weight',
    shortLabel: 'Weight',
    unit: 'kg',
    icon: 'scale-bathroom',
    color: '#7C3AED',
    softColor: '#EDE9FE',
    referenceNote:
      'Track your trend over time. Add height to the profile to see BMI.',
  },
  temperature: {
    type: 'temperature',
    label: 'Temperature',
    shortLabel: 'Temp',
    unit: '°C',
    icon: 'thermometer',
    color: '#0891B2',
    softColor: '#CFFAFE',
    referenceNote:
      'Normal: 36.1–37.2°C · Mild fever: 37.3–37.9°C · Fever: 38°C or above',
  },
};

export const VITAL_ORDER: VitalType[] = [
  'bp',
  'sugar',
  'heartRate',
  'spo2',
  'weight',
  'temperature',
];

export const SUGAR_CONTEXT_LABELS: Record<SugarContext, string> = {
  fasting: 'Fasting',
  postMeal: 'Post-meal',
  random: 'Random',
};

/** Sanity bounds used by the log-reading form. */
export const INPUT_BOUNDS = {
  systolic: { min: 40, max: 300 },
  diastolic: { min: 20, max: 200 },
  pulse: { min: 20, max: 250 },
  sugar: { min: 10, max: 1000 },
  heartRate: { min: 20, max: 250 },
  spo2: { min: 50, max: 100 },
  weight: { min: 1, max: 400 },
  temperature: { min: 30, max: 45 },
} as const;
