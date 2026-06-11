import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, radius } from '../theme';

interface Props {
  label: string;
  onPress: () => void;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  variant?: 'primary' | 'outline';
  disabled?: boolean;
}

export function PrimaryButton({
  label,
  onPress,
  icon,
  variant = 'primary',
  disabled,
}: Props) {
  const isOutline = variant === 'outline';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        isOutline && styles.outline,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      {icon ? (
        <Ionicons
          name={icon}
          size={18}
          color={isOutline ? colors.primary : colors.white}
        />
      ) : null}
      <Text style={[styles.label, isOutline && styles.labelOutline]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  outline: {
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.85,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
  labelOutline: {
    color: colors.primary,
  },
});
