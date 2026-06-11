import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useMemo } from 'react';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { ReadingRow } from '../components/ReadingRow';
import { HeaderIconButton, ScreenHeader } from '../components/ScreenHeader';
import { TrendChart, type ChartSeries } from '../components/TrendChart';
import { VITALS } from '../constants/vitals';
import { useApp, useMember, useMemberReadings } from '../context/AppContext';
import type { RootStackParamList } from '../navigation/types';
import { colors, spacing } from '../theme';
import type { BpReading, Reading } from '../types';
import { fmtNum, formatShortDate } from '../utils/format';
import { calcBmi, readingValueText } from '../utils/health';

const CHART_POINTS = 20;

interface Stat {
  label: string;
  value: string;
  hint?: string;
}

export function VitalHistoryScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'VitalHistory'>>();
  const { memberId, type } = route.params;

  const { deleteReading } = useApp();
  const member = useMember(memberId);
  const memberReadings = useMemberReadings(memberId);
  const config = VITALS[type];

  const readings = useMemo(
    () => memberReadings.filter((r) => r.type === type),
    [memberReadings, type]
  );

  // Oldest → newest, capped to the most recent CHART_POINTS readings.
  const chartReadings = useMemo(
    () => readings.slice(0, CHART_POINTS).reverse(),
    [readings]
  );

  const series: ChartSeries[] = useMemo(() => {
    if (type === 'bp') {
      const bp = chartReadings as BpReading[];
      return [
        {
          label: 'Systolic',
          color: '#E11D48',
          points: bp.map((r) => r.systolic),
        },
        {
          label: 'Diastolic',
          color: '#2563EB',
          points: bp.map((r) => r.diastolic),
        },
      ];
    }
    return [
      {
        label: config.label,
        color: config.color,
        points: chartReadings.map((r) =>
          r.type === 'bp' ? 0 : r.value
        ),
      },
    ];
  }, [chartReadings, type, config]);

  const stats: Stat[] = useMemo(() => {
    if (readings.length === 0) return [];
    if (type === 'bp') {
      const bp = readings as BpReading[];
      const avgSys = bp.reduce((s, r) => s + r.systolic, 0) / bp.length;
      const avgDia = bp.reduce((s, r) => s + r.diastolic, 0) / bp.length;
      const highest = bp.reduce((a, b) => (b.systolic > a.systolic ? b : a));
      const lowest = bp.reduce((a, b) => (b.systolic < a.systolic ? b : a));
      return [
        {
          label: 'Average',
          value: `${Math.round(avgSys)}/${Math.round(avgDia)}`,
        },
        { label: 'Lowest', value: readingValueText(lowest) },
        { label: 'Highest', value: readingValueText(highest) },
      ];
    }
    const values = readings.map((r) => (r.type === 'bp' ? 0 : r.value));
    const avg = values.reduce((s, v) => s + v, 0) / values.length;
    const result: Stat[] = [
      { label: 'Average', value: fmtNum(Math.round(avg * 10) / 10) },
      { label: 'Lowest', value: fmtNum(Math.min(...values)) },
      { label: 'Highest', value: fmtNum(Math.max(...values)) },
    ];
    if (type === 'weight' && member?.heightCm) {
      const latest = readings[0];
      const bmi =
        latest.type !== 'bp' ? calcBmi(latest.value, member.heightCm) : null;
      if (bmi) {
        result.push({
          label: 'BMI',
          value: fmtNum(bmi.bmi),
          hint: bmi.status.label,
        });
      }
    }
    return result;
  }, [readings, type, member]);

  const confirmDelete = (reading: Reading) => {
    Alert.alert('Delete reading?', 'This reading will be removed.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteReading(reading.id),
      },
    ]);
  };

  const header = (
    <View>
      {chartReadings.length > 0 ? (
        <Card style={styles.chartCard}>
          <Text style={styles.cardTitle}>
            Trend{' '}
            <Text style={styles.cardTitleHint}>
              · last {chartReadings.length}{' '}
              {chartReadings.length === 1 ? 'reading' : 'readings'}
            </Text>
          </Text>
          <TrendChart
            series={series}
            startLabel={formatShortDate(chartReadings[0].takenAt)}
            endLabel={formatShortDate(
              chartReadings[chartReadings.length - 1].takenAt
            )}
          />
        </Card>
      ) : null}

      {stats.length > 0 ? (
        <View style={styles.statsRow}>
          {stats.map((s) => (
            <View key={s.label} style={styles.statBox}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
              {s.hint ? <Text style={styles.statHint}>{s.hint}</Text> : null}
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.refCard}>
        <Ionicons
          name="information-circle-outline"
          size={18}
          color={colors.textMuted}
        />
        <Text style={styles.refText}>{config.referenceNote}</Text>
      </View>

      {readings.length > 0 ? (
        <Text style={styles.sectionTitle}>History</Text>
      ) : null}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader
        title={config.label}
        subtitle={member?.name}
        right={
          <HeaderIconButton
            icon="add"
            color={colors.primary}
            onPress={() =>
              navigation.navigate('LogReading', { memberId, type })
            }
          />
        }
      />
      <FlatList
        data={readings}
        keyExtractor={(r) => r.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={header}
        renderItem={({ item }) => (
          <ReadingRow reading={item} onDelete={() => confirmDelete(item)} />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <EmptyState
            icon={config.icon}
            title={`No ${config.label.toLowerCase()} readings`}
            message={`Log the first ${config.label.toLowerCase()} reading for ${member?.name ?? 'this member'} to see trends here.`}
            actionLabel="Log Reading"
            onAction={() =>
              navigation.navigate('LogReading', { memberId, type })
            }
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  chartCard: {
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  cardTitleHint: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textFaint,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 14,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statValue: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    marginTop: 2,
  },
  statHint: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 1,
  },
  refCard: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: '#EEF4F4',
    borderRadius: 14,
    padding: spacing.md,
    marginBottom: spacing.lg,
    alignItems: 'flex-start',
  },
  refText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    color: colors.textMuted,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  separator: {
    height: spacing.md,
  },
});
