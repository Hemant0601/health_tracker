import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { VitalIconName } from '../constants/vitals';
import { colors, radius, shadow, spacing } from '../theme';

interface Props {
  icon: VitalIconName;
  iconColor: string;
  iconBg: string;
  value: string;
  label: string;
}

export function StatCard({ icon, iconColor, iconBg, value, label }: Props) {
  return (
    <View style={styles.card}>
      <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
        <MaterialCommunityIcons name={icon} size={18} color={iconColor} />
      </View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    ...shadow.card,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  value: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  label: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 1,
  },
});
