import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import SearchResultsScreen from '../screens/SearchResultsScreen';
import JudgeProfileScreen from '../screens/JudgeProfileScreen';
import AttorneyProfileScreen from '../screens/AttorneyProfileScreen';
import ProsecutorProfileScreen from '../screens/ProsecutorProfileScreen';
import LegislatorProfileScreen from '../screens/LegislatorProfileScreen';
import CaseDetailScreen from '../screens/CaseDetailScreen';
import ActivityScreen from '../screens/ActivityScreen';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';

export type RootStackParamList = {
  Home: undefined;
  SearchResults: { initialCategory?: string; query?: string } | undefined;
  JudgeProfile: { id: string };
  AttorneyProfile: { id: string };
  ProsecutorProfile: { id: string };
  LegislatorProfile: { id: string };
  CaseDetail: { id: string };
  Activity: undefined;
  Login: undefined;
  Signup: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#050B14' },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="SearchResults" component={SearchResultsScreen} />
      <Stack.Screen name="JudgeProfile" component={JudgeProfileScreen} />
      <Stack.Screen name="AttorneyProfile" component={AttorneyProfileScreen} />
      <Stack.Screen name="ProsecutorProfile" component={ProsecutorProfileScreen} />
      <Stack.Screen name="LegislatorProfile" component={LegislatorProfileScreen} />
      <Stack.Screen name="CaseDetail" component={CaseDetailScreen} />
      <Stack.Screen name="Activity" component={ActivityScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
    </Stack.Navigator>
  );
}
