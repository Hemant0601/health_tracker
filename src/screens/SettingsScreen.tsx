import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '../components/Card';
import { ScreenHeader } from '../components/ScreenHeader';
import type { VitalIconName } from '../constants/vitals';
import { useApp } from '../context/AppContext';
import { colors, radius, spacing } from '../theme';
import type { UnitPreferences } from '../utils/units';

interface UnitRow<K extends keyof UnitPreferences> {
  key: K;
  label: string;
  icon: VitalIconName;
  color: string;
  options: { value: UnitPreferences[K]; label: string; hint: string }[];
}

const TEMP_ROW: UnitRow<'temperature'> = {
  key: 'temperature',
  label: 'Temperature',
  icon: 'thermometer',
  color: '#0891B2',
  options: [
    { value: 'F', label: '°F', hint: 'Fahrenheit' },
    { value: 'C', label: '°C', hint: 'Celsius' },
  ],
};

const WEIGHT_ROW: UnitRow<'weight'> = {
  key: 'weight',
  label: 'Weight',
  icon: 'scale-bathroom',
  color: '#7C3AED',
  options: [
    { value: 'kg', label: 'kg', hint: 'Kilograms' },
    { value: 'lb', label: 'lb', hint: 'Pounds' },
  ],
};

const SUGAR_ROW: UnitRow<'sugar'> = {
  key: 'sugar',
  label: 'Blood Sugar',
  icon: 'water',
  color: '#D97706',
  options: [
    { value: 'mg/dL', label: 'mg/dL', hint: 'Milligrams / dL' },
    { value: 'mmol/L', label: 'mmol/L', hint: 'Millimoles / L' },
  ],
};

function UnitSelector<K extends keyof UnitPreferences>({
  row,
  selected,
  onSelect,
}: {
  row: UnitRow<K>;
  selected: UnitPreferences[K];
  onSelect: (value: UnitPreferences[K]) => void;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowHead}>
        <View style={[styles.iconWrap, { backgroundColor: `${row.color}1A` }]}>
          <MaterialCommunityIcons name={row.icon} size={20} color={row.color} />
        </View>
        <Text style={styles.rowLabel}>{row.label}</Text>
      </View>
      <View style={styles.segment}>
        {row.options.map((opt) => {
          const active = opt.value === selected;
          return (
            <Pressable
              key={String(opt.value)}
              onPress={() => onSelect(opt.value)}
              style={({ pressed }) => [
                styles.segmentItem,
                active && styles.segmentItemActive,
                pressed && !active && styles.segmentItemPressed,
              ]}
            >
              <Text
                style={[
                  styles.segmentLabel,
                  active && styles.segmentLabelActive,
                ]}
              >
                {opt.label}
              </Text>
              <Text
                style={[
                  styles.segmentHint,
                  active && styles.segmentHintActive,
                ]}
              >
                {opt.hint}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function SettingsScreen() {
  const { units, updateUnits } = useApp();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="Settings" subtitle="Measurement units" />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>Units</Text>
        <Card style={styles.card}>
          <UnitSelector
            row={TEMP_ROW}
            selected={units.temperature}
            onSelect={(v) => updateUnits({ temperature: v })}
          />
          <View style={styles.divider} />
          <UnitSelector
            row={WEIGHT_ROW}
            selected={units.weight}
            onSelect={(v) => updateUnits({ weight: v })}
          />
          <View style={styles.divider} />
          <UnitSelector
            row={SUGAR_ROW}
            selected={units.sugar}
            onSelect={(v) => updateUnits({ sugar: v })}
          />
        </Card>

        <View style={styles.noteCard}>
          <MaterialCommunityIcons
            name="information-outline"
            size={18}
            color={colors.textMuted}
          />
          <Text style={styles.noteText}>
            Changing a unit re-displays every existing reading instantly — your
            data is stored independently of units, so nothing is lost or
            rounded. Blood pressure, heart rate and SpO₂ use universal units.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  card: {
    gap: spacing.lg,
  },
  row: {
    gap: spacing.md,
  },
  rowHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  segment: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  segmentItem: {
    flex: 1,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.inputBg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  segmentItemActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  segmentItemPressed: {
    opacity: 0.7,
  },
  segmentLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  segmentLabelActive: {
    color: colors.primaryDark,
  },
  segmentHint: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textFaint,
    marginTop: 2,
  },
  segmentHintActive: {
    color: colors.primary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  noteCard: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
    backgroundColor: '#EEF4F4',
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  noteText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    color: colors.textMuted,
  },
});
