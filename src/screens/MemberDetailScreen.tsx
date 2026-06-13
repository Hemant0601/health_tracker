import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useMemo } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '../components/Avatar';
import { PrimaryButton } from '../components/PrimaryButton';
import { ReadingRow } from '../components/ReadingRow';
import { HeaderIconButton, ScreenHeader } from '../components/ScreenHeader';
import { VitalTile } from '../components/VitalTile';
import { VITAL_ORDER, VITALS } from '../constants/vitals';
import { useApp, useMember, useMemberReadings } from '../context/AppContext';
import type { RootStackParamList } from '../navigation/types';
import { colors, radius, spacing } from '../theme';
import type { Reading, VitalType } from '../types';
import { buildReadingsCsv, csvFilename, shareCsv, slugify } from '../utils/csv';
import { calcAge } from '../utils/format';

export function MemberDetailScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'MemberDetail'>>();
  const { memberId } = route.params;

  const { deleteMember } = useApp();
  const member = useMember(memberId);
  const memberReadings = useMemberReadings(memberId);

  const latestByType = useMemo(() => {
    const map = new Map<VitalType, Reading>();
    for (const r of memberReadings) {
      if (!map.has(r.type)) map.set(r.type, r);
    }
    return map;
  }, [memberReadings]);

  if (!member) return null;

  const age = calcAge(member.dateOfBirth);
  const metaChips = [
    member.relation,
    age != null ? `${age} yrs` : null,
    member.gender.charAt(0).toUpperCase() + member.gender.slice(1),
    member.heightCm ? `${member.heightCm} cm` : null,
  ].filter((c): c is string => !!c);

  const exportCsv = async () => {
    if (memberReadings.length === 0) {
      Alert.alert('Nothing to export', 'Log a reading first.');
      return;
    }
    try {
      const csv = buildReadingsCsv(memberReadings, [member]);
      const shared = await shareCsv(csvFilename(slugify(member.name)), csv);
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
  };

  const confirmDelete = () => {
    Alert.alert(
      'Remove member?',
      `This will remove ${member.name} and all of their readings. This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            navigation.goBack();
            deleteMember(member.id);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader
        title={member.name}
        subtitle={member.relation}
        right={
          <View style={styles.headerActions}>
            <HeaderIconButton
              icon="pencil"
              onPress={() =>
                navigation.navigate('MemberForm', { memberId: member.id })
              }
            />
            <HeaderIconButton
              icon="trash-outline"
              color={colors.danger}
              onPress={confirmDelete}
            />
          </View>
        }
      />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profile}>
          <Avatar name={member.name} color={member.color} size={72} />
          <Text style={styles.name}>{member.name}</Text>
          <View style={styles.chipsRow}>
            {metaChips.map((chip) => (
              <View key={chip} style={styles.metaChip}>
                <Text style={styles.metaChipText}>{chip}</Text>
              </View>
            ))}
          </View>
        </View>

        <PrimaryButton
          label="Log Reading"
          icon="add-circle-outline"
          onPress={() =>
            navigation.navigate('LogReading', { memberId: member.id })
          }
        />
        <View style={styles.secondaryActions}>
          <View style={styles.secondaryItem}>
            <PrimaryButton
              label="Reminders"
              icon="notifications-outline"
              variant="outline"
              onPress={() =>
                navigation.navigate('Reminders', { memberId: member.id })
              }
            />
          </View>
          <View style={styles.secondaryItem}>
            <PrimaryButton
              label="Export CSV"
              icon="share-outline"
              variant="outline"
              onPress={() => void exportCsv()}
            />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Vitals</Text>
        <View style={styles.grid}>
          {VITAL_ORDER.map((type) => (
            <VitalTile
              key={type}
              config={VITALS[type]}
              reading={latestByType.get(type)}
              onPress={() =>
                navigation.navigate('VitalHistory', {
                  memberId: member.id,
                  type,
                })
              }
            />
          ))}
        </View>

        {memberReadings.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>Recent</Text>
            <View style={styles.list}>
              {memberReadings.slice(0, 5).map((reading) => (
                <ReadingRow
                  key={reading.id}
                  reading={reading}
                  onPress={() =>
                    navigation.navigate('VitalHistory', {
                      memberId: member.id,
                      type: reading.type,
                    })
                  }
                />
              ))}
            </View>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  profile: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    marginTop: spacing.sm,
  },
  name: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    marginTop: spacing.md,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  metaChip: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  metaChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  secondaryItem: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.xxl,
    marginBottom: spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: spacing.md,
  },
  list: {
    gap: spacing.md,
  },
});
