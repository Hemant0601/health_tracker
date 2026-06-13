import * as DocumentPicker from 'expo-document-picker';
import { useCallback, useState } from 'react';
import { Alert } from 'react-native';

import { useApp } from '../context/AppContext';
import type { Member } from '../types';
import {
  buildReadingsCsv,
  csvFilename,
  readAndParseCsv,
  shareCsv,
  slugify,
} from '../utils/csv';

export function useDataTransfer() {
  const { members, readings, importData } = useApp();
  const [busy, setBusy] = useState(false);

  /** Share a CSV of the given members' readings (defaults to everyone). */
  const exportReadings = useCallback(
    async (scopeMembers?: Member[]) => {
      const targets = scopeMembers ?? members;
      const ids = new Set(targets.map((m) => m.id));
      const rows = readings.filter((r) => ids.has(r.memberId));
      if (rows.length === 0) {
        Alert.alert('Nothing to export', 'Log a reading first.');
        return;
      }
      const scope =
        targets.length === 1 ? slugify(targets[0].name) : 'all-members';
      try {
        const csv = buildReadingsCsv(rows, targets);
        const shared = await shareCsv(csvFilename(scope), csv);
        if (!shared) {
          Alert.alert(
            'Sharing unavailable',
            'Sharing is not available on this device.'
          );
        }
      } catch (e) {
        console.warn('CSV export failed', e);
        Alert.alert('Something went wrong', 'Could not export the readings.');
      }
    },
    [members, readings]
  );

  /** Pick a CSV file and merge its members + readings into the app. */
  const importReadings = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'text/comma-separated-values', 'text/plain', '*/*'],
        copyToCacheDirectory: true,
      });
      if (res.canceled || !res.assets?.[0]) return;

      const parsed = await readAndParseCsv(res.assets[0].uri);
      if (parsed.groups.length === 0) {
        Alert.alert(
          'No readings found',
          'This file did not contain any readings we could import.'
        );
        return;
      }

      const r = importData(parsed);
      const lines = [
        r.membersAdded > 0 ? `${r.membersAdded} member(s) added` : null,
        r.membersMatched > 0
          ? `${r.membersMatched} matched existing member(s)`
          : null,
        `${r.readingsAdded} reading(s) imported`,
        r.readingsSkipped > 0
          ? `${r.readingsSkipped} duplicate(s) skipped`
          : null,
      ].filter(Boolean);
      Alert.alert('Import complete', lines.join('\n'));
    } catch (e) {
      console.warn('CSV import failed', e);
      Alert.alert(
        'Import failed',
        e instanceof Error
          ? e.message
          : 'Could not read this file. Make sure it is a Health Tracker CSV export.'
      );
    } finally {
      setBusy(false);
    }
  }, [busy, importData]);

  return { exportReadings, importReadings, busy };
}
