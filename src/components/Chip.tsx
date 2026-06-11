import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import type { VitalIconName } from '../constants/vitals';
import { colors, radius } from '../theme';

interface Props {
  label: string;
  selected: boolean;
  onPress: () => void;
  icon?: VitalIconName;
  /** Accent color used when selected; defaults to the app primary. */
  accent?: string;
}

export function Chip({ label, selected, onPress, icon, accent }: Props) {
  const accentColor = accent ?? colors.primary;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selected && {
          backgroundColor: accentColor,
          borderColor: accentColor,
        },
        pressed && styles.pressed,
      ]}
    >
      {icon ? (
        <MaterialCommunityIcons
          name={icon}
          size={15}
          color={selected ? colors.white : colors.textMuted}
        />
      ) : null}
      <Text style={[styles.label, selected && styles.labelSelected]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: {
    opacity: 0.75,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },
  labelSelected: {
    color: colors.white,
  },
});
