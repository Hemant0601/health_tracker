import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { VitalConfig } from '../constants/vitals';
import { colors, radius, shadow, spacing } from '../theme';
import type { Reading } from '../types';
import { timeAgo } from '../utils/format';
import {
  evaluateReading,
  readingValueText,
  STATUS_COLORS,
} from '../utils/health';

interface Props {
  config: VitalConfig;
  reading: Reading | undefined;
  onPress: () => void;
}

export function VitalTile({ config, reading, onPress }: Props) {
  const status = reading ? evaluateReading(reading) : null;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
    >
      <View style={styles.topRow}>
        <View style={[styles.iconWrap, { backgroundColor: config.softColor }]}>
          <MaterialCommunityIcons
            name={config.icon}
            size={20}
            color={config.color}
          />
        </View>
        {status ? (
          <View
            style={[
              styles.statusDot,
              { backgroundColor: STATUS_COLORS[status.level].color },
            ]}
          />
        ) : null}
      </View>
      <Text style={styles.label}>{config.label}</Text>
      {reading ? (
        <>
          <View style={styles.valueRow}>
            <Text style={styles.value}>{readingValueText(reading)}</Text>
            <Text style={styles.unit}>{config.unit}</Text>
          </View>
          <Text style={styles.time}>{timeAgo(reading.takenAt)}</Text>
        </>
      ) : (
        <>
          <Text style={styles.noData}>—</Text>
          <Text style={styles.time}>No readings yet</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    width: '48.2%',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadow.card,
  },
  pressed: {
    opacity: 0.8,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 2,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: 4,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  value: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
  },
  unit: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textFaint,
  },
  noData: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textFaint,
  },
  time: {
    fontSize: 11,
    color: colors.textFaint,
    marginTop: 3,
  },
});
