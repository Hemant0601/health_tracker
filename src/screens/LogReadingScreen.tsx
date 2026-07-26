import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useMemo, useState } from 'react';
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

import { Avatar } from '../components/Avatar';
import { Chip } from '../components/Chip';
import { EmptyState } from '../components/EmptyState';
import { FormField } from '../components/FormField';
import { PrimaryButton } from '../components/PrimaryButton';
import { ScreenHeader } from '../components/ScreenHeader';
import { StatusBadge } from '../components/StatusBadge';
import {
  INPUT_BOUNDS,
  SUGAR_CONTEXT_LABELS,
  VITAL_ORDER,
  VITALS,
} from '../constants/vitals';
import { useApp } from '../context/AppContext';
import type { RootStackParamList } from '../navigation/types';
import { colors, radius, spacing } from '../theme';
import type {
  Member,
  NewReading,
  Reading,
  SugarContext,
  VitalType,
} from '../types';
import { formatShortDate, formatTime } from '../utils/format';
import { evaluateReading } from '../utils/health';
import {
  displayBounds,
  displayValue,
  formatReadingValue,
  placeholderFor,
  toCanonical,
  unitLabel,
} from '../utils/units';

function parseNum(s: string): number | null {
  const t = s.trim().replace(',', '.');
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

interface FieldErrors {
  systolic?: string;
  diastolic?: string;
  pulse?: string;
  value?: string;
}

function MemberChip({
  member,
  selected,
  onPress,
}: {
  member: Member;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.memberChip,
        selected && {
          borderColor: member.color,
          backgroundColor: colors.card,
          borderWidth: 2,
        },
        pressed && styles.pressed,
      ]}
    >
      <Avatar name={member.name} color={member.color} size={22} />
      <Text
        style={[
          styles.memberChipText,
          selected && { color: colors.text },
        ]}
        numberOfLines={1}
      >
        {member.name}
      </Text>
    </Pressable>
  );
}

export function LogReadingScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'LogReading'>>();
  const lockedMemberId = route.params?.memberId;
  const readingId = route.params?.readingId;

  const { members, readings, addReading, updateReading, units } = useApp();
  const insets = useSafeAreaInsets();

  const editing = readingId
    ? readings.find((r) => r.id === readingId)
    : undefined;
  const isEditing = !!editing;
  const initialType = editing?.type ?? route.params?.type ?? 'bp';

  const [memberId, setMemberId] = useState(
    editing?.memberId ?? lockedMemberId ?? members[0]?.id ?? ''
  );
  const [type, setType] = useState<VitalType>(initialType);
  const [systolic, setSystolic] = useState(
    editing?.type === 'bp' ? String(editing.systolic) : ''
  );
  const [diastolic, setDiastolic] = useState(
    editing?.type === 'bp' ? String(editing.diastolic) : ''
  );
  const [pulse, setPulse] = useState(
    editing?.type === 'bp' && editing.pulse != null
      ? String(editing.pulse)
      : ''
  );
  const [value, setValue] = useState(
    editing && editing.type !== 'bp'
      ? String(displayValue(editing.type, editing.value, units))
      : ''
  );
  const [sugarContext, setSugarContext] = useState<SugarContext>(
    editing?.type === 'sugar' ? editing.context : 'fasting'
  );
  const [note, setNote] = useState(editing?.note ?? '');
  const [takenAt, setTakenAt] = useState(
    editing ? new Date(editing.takenAt) : new Date()
  );
  const [picker, setPicker] = useState<'date' | 'time' | null>(null);
  const [attempted, setAttempted] = useState(false);

  useEffect(() => {
    if (!memberId && members.length > 0) setMemberId(members[0].id);
  }, [members, memberId]);

  const member = members.find((m) => m.id === memberId);
  const config = VITALS[type];

  const switchType = (next: VitalType) => {
    setType(next);
    setSystolic('');
    setDiastolic('');
    setPulse('');
    setValue('');
    setAttempted(false);
  };

  const { reading, errors } = useMemo((): {
    reading: NewReading | null;
    errors: FieldErrors;
  } => {
    const errs: FieldErrors = {};
    const base = {
      memberId,
      takenAt: takenAt.toISOString(),
      note: note.trim() || undefined,
    };

    if (type === 'bp') {
      const sys = parseNum(systolic);
      const dia = parseNum(diastolic);
      const pul = parseNum(pulse);
      const sysBounds = INPUT_BOUNDS.systolic;
      const diaBounds = INPUT_BOUNDS.diastolic;
      const pulseBounds = INPUT_BOUNDS.pulse;

      if (sys == null) errs.systolic = 'Required';
      else if (sys < sysBounds.min || sys > sysBounds.max)
        errs.systolic = `${sysBounds.min}–${sysBounds.max}`;
      if (dia == null) errs.diastolic = 'Required';
      else if (dia < diaBounds.min || dia > diaBounds.max)
        errs.diastolic = `${diaBounds.min}–${diaBounds.max}`;
      if (pulse.trim()) {
        if (pul == null) errs.pulse = 'Invalid';
        else if (pul < pulseBounds.min || pul > pulseBounds.max)
          errs.pulse = `${pulseBounds.min}–${pulseBounds.max}`;
      }

      if (Object.keys(errs).length > 0 || sys == null || dia == null)
        return { reading: null, errors: errs };
      return {
        reading: {
          ...base,
          type: 'bp',
          systolic: sys,
          diastolic: dia,
          pulse: pulse.trim() && pul != null ? pul : undefined,
        },
        errors: errs,
      };
    }

    const boundsKey = type === 'sugar' ? 'sugar' : type;
    const bounds = INPUT_BOUNDS[boundsKey as keyof typeof INPUT_BOUNDS];
    // The user types in their chosen unit; bounds are defined canonically.
    const entered = parseNum(value);
    const canonical = entered == null ? null : toCanonical(type, entered, units);
    if (entered == null || canonical == null) {
      errs.value = 'Required';
    } else if (canonical < bounds.min || canonical > bounds.max) {
      const db = displayBounds(type, bounds, units);
      errs.value = `Enter a value between ${db.min} and ${db.max}`;
    }

    if (canonical == null || Object.keys(errs).length > 0)
      return { reading: null, errors: errs };

    if (type === 'sugar') {
      return {
        reading: {
          ...base,
          type: 'sugar',
          value: canonical,
          context: sugarContext,
        },
        errors: errs,
      };
    }
    return {
      reading: { ...base, type, value: canonical },
      errors: errs,
    };
  }, [type, memberId, takenAt, note, systolic, diastolic, pulse, value, sugarContext, units]);

  const previewReading: Reading | null = reading
    ? ({ ...reading, id: 'preview', createdAt: '' } as Reading)
    : null;
  const previewStatus = previewReading ? evaluateReading(previewReading) : null;

  const onPickerChange = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') {
      setPicker(null);
      if (event.type === 'set' && date) setTakenAt(date);
    } else if (date) {
      setTakenAt(date);
    }
  };

  const save = () => {
    setAttempted(true);
    if (!reading || !memberId) return;
    if (editing) {
      updateReading(editing.id, reading);
    } else {
      addReading(reading);
    }
    navigation.goBack();
  };

  if (members.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScreenHeader title="Log Reading" />
        <EmptyState
          icon="account-plus"
          title="Add a member first"
          message="Readings belong to a family member. Add your first member to start logging."
          actionLabel="Add Member"
          onAction={() => navigation.navigate('MemberForm')}
        />
      </SafeAreaView>
    );
  }

  const showError = (key: keyof FieldErrors) =>
    attempted ? errors[key] : undefined;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader
        title={isEditing ? 'Edit Reading' : 'Log Reading'}
        subtitle={member?.name}
      />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {!lockedMemberId && !isEditing ? (
            <>
              <Text style={styles.label}>Member</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.memberRow}
              >
                {members.map((m) => (
                  <MemberChip
                    key={m.id}
                    member={m}
                    selected={m.id === memberId}
                    onPress={() => setMemberId(m.id)}
                  />
                ))}
              </ScrollView>
            </>
          ) : null}

          {!isEditing ? (
            <>
              <Text style={styles.label}>Vital</Text>
              <View style={styles.chipWrap}>
                {VITAL_ORDER.map((t) => (
                  <Chip
                    key={t}
                    label={VITALS[t].shortLabel}
                    icon={VITALS[t].icon}
                    accent={VITALS[t].color}
                    selected={type === t}
                    onPress={() => switchType(t)}
                  />
                ))}
              </View>
            </>
          ) : null}

          <Text style={styles.label}>
            {config.label} ({unitLabel(type, units)})
          </Text>
          {type === 'bp' ? (
            <View style={styles.inputRow}>
              <FormField
                label="Systolic"
                value={systolic}
                onChangeText={setSystolic}
                placeholder="120"
                keyboardType="number-pad"
                compact
                error={showError('systolic')}
              />
              <FormField
                label="Diastolic"
                value={diastolic}
                onChangeText={setDiastolic}
                placeholder="80"
                keyboardType="number-pad"
                compact
                error={showError('diastolic')}
              />
              <FormField
                label="Pulse (opt.)"
                value={pulse}
                onChangeText={setPulse}
                placeholder="72"
                keyboardType="number-pad"
                compact
                error={showError('pulse')}
              />
            </View>
          ) : (
            <>
              <FormField
                label={`Value (${unitLabel(type, units)})`}
                value={value}
                onChangeText={setValue}
                placeholder={placeholderFor(type, units)}
                keyboardType="decimal-pad"
                suffix={unitLabel(type, units)}
                error={showError('value')}
              />
              {type === 'sugar' ? (
                <View style={[styles.chipWrap, styles.contextWrap]}>
                  {(
                    Object.keys(SUGAR_CONTEXT_LABELS) as SugarContext[]
                  ).map((ctx) => (
                    <Chip
                      key={ctx}
                      label={SUGAR_CONTEXT_LABELS[ctx]}
                      accent={VITALS.sugar.color}
                      selected={sugarContext === ctx}
                      onPress={() => setSugarContext(ctx)}
                    />
                  ))}
                </View>
              ) : null}
            </>
          )}

          {previewReading ? (
            <View
              style={[
                styles.preview,
                { backgroundColor: config.softColor },
              ]}
            >
              <Text style={[styles.previewValue, { color: config.color }]}>
                {formatReadingValue(previewReading, units)}
                <Text style={styles.previewUnit}> {unitLabel(type, units)}</Text>
              </Text>
              {previewStatus ? <StatusBadge status={previewStatus} size="md" /> : null}
            </View>
          ) : null}

          <Text style={styles.label}>When</Text>
          <View style={styles.inputRow}>
            <Pressable
              onPress={() => setPicker('date')}
              style={({ pressed }) => [
                styles.whenField,
                pressed && styles.pressed,
              ]}
            >
              <Ionicons
                name="calendar-outline"
                size={17}
                color={colors.textMuted}
              />
              <Text style={styles.whenText}>{formatShortDate(takenAt)}</Text>
            </Pressable>
            <Pressable
              onPress={() => setPicker('time')}
              style={({ pressed }) => [
                styles.whenField,
                pressed && styles.pressed,
              ]}
            >
              <Ionicons
                name="time-outline"
                size={17}
                color={colors.textMuted}
              />
              <Text style={styles.whenText}>{formatTime(takenAt)}</Text>
            </Pressable>
          </View>
          {picker ? (
            <>
              <DateTimePicker
                value={takenAt}
                mode={picker}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                maximumDate={picker === 'date' ? new Date() : undefined}
                onChange={onPickerChange}
              />
              {Platform.OS === 'ios' ? (
                <Pressable
                  onPress={() => setPicker(null)}
                  style={styles.doneBtn}
                >
                  <Text style={styles.doneText}>Done</Text>
                </Pressable>
              ) : null}
            </>
          ) : null}

          <View style={styles.noteField}>
            <FormField
              label="Note (optional)"
              value={note}
              onChangeText={setNote}
              placeholder="e.g. After morning walk"
              multiline
            />
          </View>
        </ScrollView>
        <View
          style={[
            styles.footer,
            { paddingBottom: Math.max(insets.bottom, spacing.lg) },
          ]}
        >
          <PrimaryButton
            label={isEditing ? 'Save Changes' : 'Save Reading'}
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
    marginBottom: 8,
    marginTop: spacing.xl,
  },
  memberRow: {
    gap: spacing.sm,
    paddingRight: spacing.xl,
  },
  memberChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.full,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.border,
    maxWidth: 180,
  },
  memberChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },
  pressed: {
    opacity: 0.75,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  contextWrap: {
    marginTop: spacing.md,
  },
  inputRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  preview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginTop: spacing.lg,
  },
  previewValue: {
    fontSize: 24,
    fontWeight: '800',
  },
  previewUnit: {
    fontSize: 13,
    fontWeight: '700',
  },
  whenField: {
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
  whenText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
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
  noteField: {
    marginTop: spacing.xl,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    backgroundColor: colors.background,
  },
});
