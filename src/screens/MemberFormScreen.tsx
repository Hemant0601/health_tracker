import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Chip } from '../components/Chip';
import { FormField } from '../components/FormField';
import { PrimaryButton } from '../components/PrimaryButton';
import { ScreenHeader } from '../components/ScreenHeader';
import { AVATAR_COLORS, GENDER_OPTIONS, RELATIONS } from '../constants/profile';
import { useApp, useMember } from '../context/AppContext';
import type { RootStackParamList } from '../navigation/types';
import { colors, radius, spacing } from '../theme';
import type { Gender } from '../types';
import { formatDate } from '../utils/format';

function toIsoDate(d: Date): string {
  const m = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function MemberFormScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'MemberForm'>>();
  const memberId = route.params?.memberId;
  const existing = useMember(memberId);
  const isEditing = !!existing;

  const { addMember, updateMember } = useApp();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState(existing?.name ?? '');
  const [relation, setRelation] = useState(existing?.relation ?? 'Self');
  const [gender, setGender] = useState<Gender>(existing?.gender ?? 'male');
  const [dob, setDob] = useState<Date | null>(
    existing?.dateOfBirth ? new Date(existing.dateOfBirth) : null
  );
  const [height, setHeight] = useState(
    existing?.heightCm ? String(existing.heightCm) : ''
  );
  const [color, setColor] = useState(existing?.color ?? AVATAR_COLORS[0]);
  const [showDobPicker, setShowDobPicker] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; height?: string }>({});

  const onDobChange = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowDobPicker(false);
      if (event.type === 'set' && date) setDob(date);
    } else if (date) {
      setDob(date);
    }
  };

  const save = () => {
    const nextErrors: { name?: string; height?: string } = {};
    const trimmedName = name.trim();
    if (!trimmedName) nextErrors.name = 'Please enter a name';

    let heightCm: number | undefined;
    if (height.trim()) {
      const parsed = Number(height.trim().replace(',', '.'));
      if (!Number.isFinite(parsed) || parsed < 30 || parsed > 250) {
        nextErrors.height = 'Enter a height between 30 and 250 cm';
      } else {
        heightCm = Math.round(parsed * 10) / 10;
      }
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const data = {
      name: trimmedName,
      relation,
      gender,
      dateOfBirth: dob ? toIsoDate(dob) : undefined,
      heightCm,
      color,
    };

    if (isEditing && existing) {
      updateMember(existing.id, data);
    } else {
      addMember(data);
    }
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title={isEditing ? 'Edit Member' : 'Add Member'} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <FormField
            label="Full Name"
            value={name}
            onChangeText={(t) => {
              setName(t);
              if (errors.name) setErrors((e) => ({ ...e, name: undefined }));
            }}
            placeholder="e.g. Hemant Kumar"
            error={errors.name}
          />

          <Text style={styles.label}>Relation</Text>
          <View style={styles.chipWrap}>
            {RELATIONS.map((r) => (
              <Chip
                key={r}
                label={r}
                selected={relation === r}
                onPress={() => setRelation(r)}
              />
            ))}
          </View>

          <Text style={styles.label}>Gender</Text>
          <View style={styles.chipWrap}>
            {GENDER_OPTIONS.map((g) => (
              <Chip
                key={g.value}
                label={g.label}
                selected={gender === g.value}
                onPress={() => setGender(g.value)}
              />
            ))}
          </View>

          <Text style={styles.label}>Date of Birth (optional)</Text>
          <View style={styles.dobRow}>
            <Pressable
              onPress={() => setShowDobPicker(true)}
              style={({ pressed }) => [
                styles.dobField,
                pressed && styles.pressed,
              ]}
            >
              <Ionicons
                name="calendar-outline"
                size={18}
                color={colors.textMuted}
              />
              <Text style={dob ? styles.dobText : styles.dobPlaceholder}>
                {dob ? formatDate(dob) : 'Select date'}
              </Text>
            </Pressable>
            {dob ? (
              <Pressable onPress={() => setDob(null)} hitSlop={8}>
                <Text style={styles.clear}>Clear</Text>
              </Pressable>
            ) : null}
          </View>
          {showDobPicker ? (
            <>
              <DateTimePicker
                value={dob ?? new Date(1990, 0, 1)}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                maximumDate={new Date()}
                onChange={onDobChange}
              />
              {Platform.OS === 'ios' ? (
                <Pressable
                  onPress={() => setShowDobPicker(false)}
                  style={styles.doneBtn}
                >
                  <Text style={styles.doneText}>Done</Text>
                </Pressable>
              ) : null}
            </>
          ) : null}

          <View style={styles.heightField}>
            <FormField
              label="Height (optional)"
              value={height}
              onChangeText={(t) => {
                setHeight(t);
                if (errors.height)
                  setErrors((e) => ({ ...e, height: undefined }));
              }}
              placeholder="e.g. 170"
              keyboardType="decimal-pad"
              suffix="cm"
              error={errors.height}
            />
          </View>

          <Text style={styles.label}>Avatar Color</Text>
          <View style={styles.colorRow}>
            {AVATAR_COLORS.map((c) => (
              <Pressable
                key={c}
                onPress={() => setColor(c)}
                style={[
                  styles.colorDot,
                  { backgroundColor: c },
                  color === c && styles.colorDotSelected,
                ]}
              >
                {color === c ? (
                  <Ionicons name="checkmark" size={16} color={colors.white} />
                ) : null}
              </Pressable>
            ))}
          </View>
        </ScrollView>
        <View
          style={[
            styles.footer,
            { paddingBottom: Math.max(insets.bottom, spacing.lg) },
          ]}
        >
          <PrimaryButton
            label={isEditing ? 'Save Changes' : 'Add Member'}
            onPress={save}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: 6,
    marginTop: spacing.xl,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  dobRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  dobField: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  pressed: {
    opacity: 0.7,
  },
  dobText: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '500',
  },
  dobPlaceholder: {
    fontSize: 15,
    color: colors.textFaint,
  },
  clear: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.danger,
  },
  doneBtn: {
    alignSelf: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  doneText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
  },
  heightField: {
    marginTop: spacing.xl,
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  colorDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorDotSelected: {
    borderWidth: 3,
    borderColor: colors.text,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    backgroundColor: colors.background,
  },
});
