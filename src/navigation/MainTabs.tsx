import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Gavel, LayoutDashboard, Landmark, Search, UserRound } from 'lucide-react-native';
import HomeScreen from '../screens/HomeScreen';
import SearchResultsScreen from '../screens/SearchResultsScreen';
import JudgesDirectoryScreen from '../screens/JudgesDirectoryScreen';
import CourtsDirectoryScreen from '../screens/CourtsDirectoryScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { createAnimatedTabBar } from './AnimatedTabBar';

export type MainTabParamList = {
  Dashboard: undefined;
  Search: { initialCategory?: string; query?: string } | undefined;
  Judges: undefined;
  Courts: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

const TabBar = createAnimatedTabBar({
  Dashboard: { icon: LayoutDashboard, label: 'Home' },
  Search: { icon: Search, label: 'Search' },
  Judges: { icon: Gavel, label: 'Judges' },
  Courts: { icon: Landmark, label: 'Courts' },
  Profile: { icon: UserRound, label: 'Profile' },
});

export default function MainTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Dashboard"
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false, lazy: true }}
    >
      <Tab.Screen name="Dashboard" component={HomeScreen} />
      <Tab.Screen name="Search" component={SearchResultsScreen} />
      <Tab.Screen name="Judges" component={JudgesDirectoryScreen} />
      <Tab.Screen name="Courts" component={CourtsDirectoryScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
