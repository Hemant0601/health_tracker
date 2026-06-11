import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { VITALS } from '../constants/vitals';
import { colors, radius, shadow, spacing } from '../theme';
import type { Member, Reading } from '../types';
import { formatDateTime } from '../utils/format';
import {
  evaluateReading,
  readingDetailText,
  readingValueText,
} from '../utils/health';
import { StatusBadge } from './StatusBadge';

interface Props {
  reading: Reading;
  /** Shown when listing readings across multiple members. */
  member?: Member;
  onPress?: () => void;
  onDelete?: () => void;
}

export function ReadingRow({ reading, member, onPress, onDelete }: Props) {
  const config = VITALS[reading.type];
  const status = evaluateReading(reading);
  const detail = readingDetailText(reading);

  const subtitleParts = [
    member?.name,
    detail,
    formatDateTime(reading.takenAt),
  ].filter(Boolean);

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.row,
        pressed && onPress ? styles.pressed : null,
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: config.softColor }]}>
        <MaterialCommunityIcons
          name={config.icon}
          size={20}
          color={config.color}
        />
      </View>
      <View style={styles.middle}>
        <View style={styles.titleRow}>
          <Text style={styles.value}>
            {readingValueText(reading)}
            <Text style={styles.unit}> {config.unit}</Text>
          </Text>
          {status ? <StatusBadge status={status} /> : null}
        </View>
        <Text style={styles.subtitle} numberOfLines={1}>
          {subtitleParts.join(' · ')}
        </Text>
        {reading.note ? (
          <Text style={styles.note} numberOfLines={2}>
            “{reading.note}”
          </Text>
        ) : null}
      </View>
      {onDelete ? (
        <Pressable
          onPress={onDelete}
          hitSlop={10}
          style={({ pressed }) => [
            styles.deleteBtn,
            pressed && styles.pressed,
          ]}
        >
          <Ionicons name="trash-outline" size={17} color={colors.textFaint} />
        </Pressable>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
    ...shadow.card,
  },
  pressed: {
    opacity: 0.7,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  middle: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  value: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  unit: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textFaint,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 3,
  },
  note: {
    fontSize: 12,
    color: colors.textFaint,
    fontStyle: 'italic',
    marginTop: 3,
  },
  deleteBtn: {
    padding: 6,
  },
});
