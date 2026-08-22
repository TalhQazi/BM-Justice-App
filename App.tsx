import React, { useState } from 'react';
import { View, StyleSheet, AppRegistry } from 'react-native';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import RootNavigator from './src/navigation/RootNavigator';
import AnimatedSplashScreen from './src/components/AnimatedSplashScreen';
import { colors } from './src/theme/colors';

const CustomDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.background,
    card: colors.card,
    text: colors.text,
    border: colors.border,
    primary: colors.primary,
  },
};

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" backgroundColor={colors.background} />
      <View style={styles.root}>
        <NavigationContainer theme={CustomDarkTheme}>
          <RootNavigator />
        </NavigationContainer>
        {showSplash && (
          <AnimatedSplashScreen onFinish={() => setShowSplash(false)} />
        )}
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
});

AppRegistry.registerComponent('main', () => App);
AppRegistry.registerComponent('BenchmarkJustice', () => App);
