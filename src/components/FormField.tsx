import React from 'react';
import {
  KeyboardTypeOptions,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { colors, radius } from '../theme';

interface Props {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  suffix?: string;
  multiline?: boolean;
  error?: string;
  autoFocus?: boolean;
  /** Smaller label + tighter field, for use inside input rows. */
  compact?: boolean;
}

export function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  suffix,
  multiline,
  error,
  autoFocus,
  compact,
}: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, compact && styles.labelCompact]}>
        {label}
      </Text>
      <View
        style={[
          styles.inputRow,
          multiline && styles.inputRowMultiline,
          !!error && styles.inputRowError,
        ]}
      >
        <TextInput
          style={[styles.input, multiline && styles.inputMultiline]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textFaint}
          keyboardType={keyboardType}
          multiline={multiline}
          autoFocus={autoFocus}
        />
        {suffix ? <Text style={styles.suffix}>{suffix}</Text> : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: 6,
  },
  labelCompact: {
    fontSize: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
  },
  inputRowMultiline: {
    alignItems: 'flex-start',
  },
  inputRowError: {
    borderColor: colors.danger,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    paddingVertical: 12,
  },
  inputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  suffix: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textFaint,
    marginLeft: 8,
  },
  error: {
    fontSize: 12,
    color: colors.danger,
    marginTop: 4,
  },
});
