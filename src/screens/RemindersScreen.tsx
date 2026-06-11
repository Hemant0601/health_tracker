import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRoute, type RouteProp } from '@react-navigation/native';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '../components/Card';
import { Chip } from '../components/Chip';
import { PrimaryButton } from '../components/PrimaryButton';
import { ScreenHeader } from '../components/ScreenHeader';
import { VITAL_ORDER, VITALS } from '../constants/vitals';
import { useApp, useMember } from '../context/AppContext';
import type { RootStackParamList } from '../navigation/types';
import { colors, radius, spacing } from '../theme';
import type { Reminder, VitalType } from '../types';
import { formatTime } from '../utils/format';
import {
  cancelReminderNotification,
  ensureNotificationPermission,
  scheduleReminderNotification,
} from '../utils/notifications';

function reminderTimeText(reminder: Reminder): string {
  const d = new Date();
  d.setHours(reminder.hour, reminder.minute, 0, 0);
  return formatTime(d);
}

function defaultTime(): Date {
  const d = new Date();
  d.setHours(8, 0, 0, 0);
  return d;
}

export function RemindersScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'Reminders'>>();
  const { memberId } = route.params;

  const member = useMember(memberId);
  const { reminders, addReminder, updateReminder, deleteReminder } = useApp();

  const memberReminders = useMemo(
    () => reminders.filter((r) => r.memberId === memberId),
    [reminders, memberId]
  );

  const [type, setType] = useState<VitalType>('bp');
  const [time, setTime] = useState<Date>(defaultTime);
  const [showPicker, setShowPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const onTimeChange = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
      if (event.type === 'set' && date) setTime(date);
    } else if (date) {
      setTime(date);
    }
  };

  const permissionAlert = () =>
    Alert.alert(
      'Notifications disabled',
      'Allow notifications for Health Tracker in your system settings to receive reminders.'
    );

  const add = async () => {
    if (!member || saving) return;
    const hour = time.getHours();
    const minute = time.getMinutes();
    const duplicate = memberReminders.some(
      (r) => r.type === type && r.hour === hour && r.minute === minute
    );
    if (duplicate) {
      Alert.alert(
        'Already added',
        `A ${VITALS[type].label.toLowerCase()} reminder at ${formatTime(time)} already exists.`
      );
      return;
    }
    setSaving(true);
    try {
      if (!(await ensureNotificationPermission())) {
        permissionAlert();
        return;
      }
      const notificationId = await scheduleReminderNotification(
        { type, hour, minute },
        member.name
      );
      addReminder({
        memberId,
        type,
        hour,
        minute,
        enabled: true,
        notificationId,
      });
    } catch (e) {
      console.warn('Failed to schedule reminder', e);
      Alert.alert('Something went wrong', 'Could not schedule the reminder.');
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (reminder: Reminder, enabled: boolean) => {
    if (!member) return;
    try {
      if (enabled) {
        if (!(await ensureNotificationPermission())) {
          permissionAlert();
          return;
        }
        const notificationId = await scheduleReminderNotification(
          reminder,
          member.name
        );
        updateReminder(reminder.id, { enabled: true, notificationId });
      } else {
        await cancelReminderNotification(reminder.notificationId);
        updateReminder(reminder.id, { enabled: false, notificationId: undefined });
      }
    } catch (e) {
      console.warn('Failed to toggle reminder', e);
    }
  };

  const confirmDelete = (reminder: Reminder) => {
    Alert.alert('Delete reminder?', 'This reminder will be removed.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteReminder(reminder.id),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="Reminders" subtitle={member?.name} />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Card>
          <Text style={styles.cardTitle}>New Reminder</Text>
          <Text style={styles.label}>Vital</Text>
          <View style={styles.chipWrap}>
            {VITAL_ORDER.map((t) => (
              <Chip
                key={t}
                label={VITALS[t].shortLabel}
                icon={VITALS[t].icon}
                accent={VITALS[t].color}
                selected={type === t}
                onPress={() => setType(t)}
              />
            ))}
          </View>
          <Text style={styles.label}>Time (daily)</Text>
          <Pressable
            onPress={() => setShowPicker(true)}
            style={({ pressed }) => [
              styles.timeField,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons name="time-outline" size={18} color={colors.textMuted} />
            <Text style={styles.timeText}>{formatTime(time)}</Text>
          </Pressable>
          {showPicker ? (
            <>
              <DateTimePicker
                value={time}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onTimeChange}
              />
              {Platform.OS === 'ios' ? (
                <Pressable
                  onPress={() => setShowPicker(false)}
                  style={styles.doneBtn}
                >
                  <Text style={styles.doneText}>Done</Text>
                </Pressable>
              ) : null}
            </>
          ) : null}
          <View style={styles.addBtn}>
            <PrimaryButton
              label={saving ? 'Adding…' : 'Add Reminder'}
              icon="notifications-outline"
              onPress={() => void add()}
              disabled={saving}
            />
          </View>
        </Card>

        {memberReminders.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>Active Reminders</Text>
            <View style={styles.list}>
              {memberReminders.map((reminder) => {
                const config = VITALS[reminder.type];
                return (
                  <View key={reminder.id} style={styles.row}>
                    <View
                      style={[
                        styles.iconWrap,
                        { backgroundColor: config.softColor },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={config.icon}
                        size={20}
                        color={config.color}
                      />
                    </View>
                    <View style={styles.rowText}>
                      <Text style={styles.rowTitle}>{config.label}</Text>
                      <Text style={styles.rowSubtitle}>
                        Daily at {reminderTimeText(reminder)}
                      </Text>
                    </View>
                    <Switch
                      value={reminder.enabled}
                      onValueChange={(v) => void toggle(reminder, v)}
                      trackColor={{
                        false: colors.border,
                        true: colors.primary,
                      }}
                      thumbColor={colors.white}
                    />
                    <Pressable
                      onPress={() => confirmDelete(reminder)}
                      hitSlop={10}
                      style={({ pressed }) => [
                        styles.deleteBtn,
                        pressed && styles.pressed,
                      ]}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={17}
                        color={colors.textFaint}
                      />
                    </Pressable>
                  </View>
                );
              })}
            </View>
          </>
        ) : (
          <Text style={styles.hint}>
            No reminders yet. Daily reminders help you keep measurements
            consistent — for example blood pressure every morning at 8:00 AM.
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: 8,
    marginTop: spacing.lg,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  timeField: {
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
  timeText: {
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
  addBtn: {
    marginTop: spacing.lg,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.xxl,
    marginBottom: spacing.md,
  },
  list: {
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  rowSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  deleteBtn: {
    padding: 4,
  },
  hint: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 19,
    marginTop: spacing.xl,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
});
