import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { VITALS } from '../constants/vitals';
import type { Reminder } from '../types';

const CHANNEL_ID = 'reminders';

/** Call once at app start. */
export function initNotifications(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
  if (Platform.OS === 'android') {
    void Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Measurement reminders',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
    });
  }
}

export async function ensureNotificationPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

export function scheduleReminderNotification(
  reminder: Pick<Reminder, 'type' | 'hour' | 'minute'>,
  memberName: string
): Promise<string> {
  const vital = VITALS[reminder.type];
  return Notifications.scheduleNotificationAsync({
    content: {
      title: `${vital.label} check for ${memberName}`,
      body: `Time to measure and log ${memberName}'s ${vital.label.toLowerCase()}.`,
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: reminder.hour,
      minute: reminder.minute,
      channelId: CHANNEL_ID,
    },
  });
}

export async function cancelReminderNotification(
  notificationId?: string
): Promise<void> {
  if (!notificationId) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (e) {
    console.warn('Failed to cancel scheduled notification', e);
  }
}
