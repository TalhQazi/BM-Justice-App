import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { NavigatorScreenParams } from '@react-navigation/native';
import MainTabs, { MainTabParamList } from './MainTabs';
import SearchResultsScreen from '../screens/SearchResultsScreen';
import JudgeProfileScreen from '../screens/JudgeProfileScreen';
import AttorneyProfileScreen from '../screens/AttorneyProfileScreen';
import ProsecutorProfileScreen from '../screens/ProsecutorProfileScreen';
import LegislatorProfileScreen from '../screens/LegislatorProfileScreen';
import CaseDetailScreen from '../screens/CaseDetailScreen';
import BillDetailScreen from '../screens/BillDetailScreen';
import DocumentScreen from '../screens/DocumentScreen';
import ActivityScreen from '../screens/ActivityScreen';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import { useTheme } from '../theme/ThemeProvider';

export type RootStackParamList = {
  /** The tab shell. Kept as "Home" so existing `navigate('Home')` calls still work. */
  Home: NavigatorScreenParams<MainTabParamList> | undefined;
  SearchResults: { initialCategory?: string; query?: string } | undefined;
  JudgeProfile: { id: string };
  AttorneyProfile: { id: string };
  ProsecutorProfile: { id: string };
  LegislatorProfile: { id: string };
  CaseDetail: { id: string };
  BillDetail: { congress: number; type: string; number: string };
  Document: { id: string; caseName?: string };
  Activity: undefined;
  Login: undefined;
  Signup: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const t = useTheme();
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: t.colors.background },
        animation: 'slide_from_right',
        gestureEnabled: true,
        fullScreenGestureEnabled: true,
        animationDuration: 320,
      }}
    >
      <Stack.Screen name="Home" component={MainTabs} options={{ animation: 'fade' }} />
      <Stack.Screen name="SearchResults" component={SearchResultsScreen} />
      <Stack.Screen name="JudgeProfile" component={JudgeProfileScreen} />
      <Stack.Screen name="AttorneyProfile" component={AttorneyProfileScreen} />
      <Stack.Screen name="ProsecutorProfile" component={ProsecutorProfileScreen} />
      <Stack.Screen name="LegislatorProfile" component={LegislatorProfileScreen} />
      <Stack.Screen name="CaseDetail" component={CaseDetailScreen} />
      <Stack.Screen name="BillDetail" component={BillDetailScreen} />
      <Stack.Screen name="Document" component={DocumentScreen} />
      <Stack.Screen name="Activity" component={ActivityScreen} options={{ animation: 'fade_from_bottom' }} />
      <Stack.Screen name="Login" component={LoginScreen} options={{ animation: 'fade_from_bottom' }} />
      <Stack.Screen name="Signup" component={SignupScreen} options={{ animation: 'fade_from_bottom' }} />
    </Stack.Navigator>
  );
}
