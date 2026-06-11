import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '../components/Avatar';
import { EmptyState } from '../components/EmptyState';
import { FAB } from '../components/FAB';
import { useApp } from '../context/AppContext';
import { VITALS } from '../constants/vitals';
import type { RootStackParamList } from '../navigation/types';
import { colors, radius, shadow, spacing } from '../theme';
import type { Member, Reading } from '../types';
import { calcAge } from '../utils/format';
import { readingValueText } from '../utils/health';

function MemberCard({
  member,
  readings,
  onPress,
}: {
  member: Member;
  readings: Reading[];
  onPress: () => void;
}) {
  const age = calcAge(member.dateOfBirth);
  const latestBp = readings.find(
    (r) => r.memberId === member.id && r.type === 'bp'
  );
  const latestSugar = readings.find(
    (r) => r.memberId === member.id && r.type === 'sugar'
  );
  const meta = [member.relation, age != null ? `${age} yrs` : null]
    .filter(Boolean)
    .join(' · ');

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.cardTop}>
        <Avatar name={member.name} color={member.color} size={52} />
        <View style={styles.cardText}>
          <Text style={styles.name} numberOfLines={1}>
            {member.name}
          </Text>
          <Text style={styles.meta}>{meta}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
      </View>
      <View style={styles.vitalsRow}>
        {latestBp ? (
          <View style={[styles.vitalPill, { backgroundColor: VITALS.bp.softColor }]}>
            <Text style={[styles.vitalPillText, { color: VITALS.bp.color }]}>
              BP {readingValueText(latestBp)}
            </Text>
          </View>
        ) : null}
        {latestSugar ? (
          <View
            style={[styles.vitalPill, { backgroundColor: VITALS.sugar.softColor }]}
          >
            <Text style={[styles.vitalPillText, { color: VITALS.sugar.color }]}>
              Sugar {readingValueText(latestSugar)}
            </Text>
          </View>
        ) : null}
        {!latestBp && !latestSugar ? (
          <Text style={styles.noReadings}>No readings yet</Text>
        ) : null}
      </View>
    </Pressable>
  );
}

export function MembersScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { members, readings } = useApp();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>Family Members</Text>
          <Text style={styles.subtitle}>
            {members.length === 0
              ? 'Add the people you care for'
              : `${members.length} ${members.length === 1 ? 'member' : 'members'}`}
          </Text>
        </View>
      </View>
      <FlatList
        data={members}
        keyExtractor={(m) => m.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <MemberCard
            member={item}
            readings={readings}
            onPress={() =>
              navigation.navigate('MemberDetail', { memberId: item.id })
            }
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <EmptyState
            icon="account-group"
            title="No members yet"
            message="Add yourself and your family members to start tracking everyone's health in one place."
            actionLabel="Add First Member"
            onAction={() => navigation.navigate('MemberForm')}
          />
        }
      />
      <FAB onPress={() => navigation.navigate('MemberForm')} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 3,
  },
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 100,
    flexGrow: 1,
  },
  separator: {
    height: spacing.md,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadow.card,
  },
  pressed: {
    opacity: 0.8,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  cardText: {
    flex: 1,
  },
  name: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  meta: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  vitalsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  vitalPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
  },
  vitalPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  noReadings: {
    fontSize: 12,
    color: colors.textFaint,
  },
});
