import type { NavigatorScreenParams } from '@react-navigation/native';

import type { VitalType } from '../types';

export type TabParamList = {
  Home: undefined;
  Members: undefined;
};

export type RootStackParamList = {
  Tabs: NavigatorScreenParams<TabParamList> | undefined;
  MemberDetail: { memberId: string };
  MemberForm: { memberId?: string } | undefined;
  LogReading:
    | { memberId?: string; type?: VitalType; readingId?: string }
    | undefined;
  VitalHistory: { memberId: string; type: VitalType };
  Reminders: { memberId: string };
};
