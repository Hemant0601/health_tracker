import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '../components/EmptyState';
import { PrimaryButton } from '../components/PrimaryButton';
import { ReadingRow } from '../components/ReadingRow';
import { StatCard } from '../components/StatCard';
import { useApp } from '../context/AppContext';
import type { RootStackParamList } from '../navigation/types';
import { colors, spacing } from '../theme';
import { formatDate, greeting } from '../utils/format';
import { evaluateReading } from '../utils/health';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export function HomeScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { members, readings } = useApp();

  const memberById = useMemo(
    () => new Map(members.map((m) => [m.id, m])),
    [members]
  );

  const { weekCount, alertCount } = useMemo(() => {
    const cutoff = Date.now() - WEEK_MS;
    let week = 0;
    let alerts = 0;
    for (const r of readings) {
      if (new Date(r.takenAt).getTime() < cutoff) continue;
      week += 1;
      const status = evaluateReading(r);
      if (status && (status.level === 'high' || status.level === 'critical')) {
        alerts += 1;
      }
    }
    return { weekCount: week, alertCount: alerts };
  }, [readings]);

  const recent = readings.slice(0, 8);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <View style={styles.headerText}>
            <Text style={styles.greeting}>{greeting()} 👋</Text>
            <Text style={styles.date}>{formatDate(new Date())}</Text>
          </View>
          <View style={styles.logo}>
            <MaterialCommunityIcons
              name="heart-pulse"
              size={26}
              color={colors.primary}
            />
          </View>
        </View>

        <View style={styles.statsRow}>
          <StatCard
            icon="account-group"
            iconColor={colors.primary}
            iconBg={colors.primarySoft}
            value={String(members.length)}
            label="Members"
          />
          <StatCard
            icon="clipboard-pulse"
            iconColor="#2563EB"
            iconBg="#DBEAFE"
            value={String(weekCount)}
            label="This week"
          />
          <StatCard
            icon="alert-circle"
            iconColor="#DC2626"
            iconBg="#FEE2E2"
            value={String(alertCount)}
            label="Alerts"
          />
        </View>

        <View style={styles.actionsRow}>
          <View style={styles.actionItem}>
            <PrimaryButton
              label="Log Reading"
              icon="add-circle-outline"
              onPress={() => navigation.navigate('LogReading')}
            />
          </View>
          <View style={styles.actionItem}>
            <PrimaryButton
              label="Add Member"
              icon="person-add-outline"
              variant="outline"
              onPress={() => navigation.navigate('MemberForm')}
            />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Recent Readings</Text>
        {recent.length === 0 ? (
          <EmptyState
            icon="clipboard-text-outline"
            title="No readings yet"
            message="Add a family member and log their first reading to see recent activity here."
          />
        ) : (
          <View style={styles.list}>
            {recent.map((reading) => {
              const member = memberById.get(reading.memberId);
              return (
                <ReadingRow
                  key={reading.id}
                  reading={reading}
                  member={member}
                  onPress={
                    member
                      ? () =>
                          navigation.navigate('VitalHistory', {
                            memberId: member.id,
                            type: reading.type,
                          })
                      : undefined
                  }
                />
              );
            })}
          </View>
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
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  headerText: {
    flex: 1,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
  },
  date: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 3,
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },
  actionItem: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  list: {
    gap: spacing.md,
  },
});
