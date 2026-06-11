import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { STATUS_COLORS, VitalStatus } from '../utils/health';

interface Props {
  status: VitalStatus;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'sm' }: Props) {
  const palette = STATUS_COLORS[status.level];
  const isMd = size === 'md';
  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: palette.soft },
        isMd && styles.badgeMd,
      ]}
    >
      <View style={[styles.dot, { backgroundColor: palette.color }]} />
      <Text
        style={[styles.text, { color: palette.color }, isMd && styles.textMd]}
        numberOfLines={1}
      >
        {status.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    gap: 5,
  },
  badgeMd: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
  },
  textMd: {
    fontSize: 13,
  },
});
