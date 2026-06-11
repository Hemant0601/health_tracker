import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { colors, shadow } from '../theme';

interface Props {
  onPress: () => void;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
}

export function FAB({ onPress, icon = 'add' }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.fab, pressed && styles.pressed]}
    >
      <Ionicons name={icon} size={28} color={colors.white} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.fab,
  },
  pressed: {
    opacity: 0.85,
  },
});
