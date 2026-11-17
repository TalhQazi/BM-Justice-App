import React, { useMemo, useState } from 'react';
import { View, StyleSheet, AppRegistry } from 'react-native';
import { NavigationContainer, DarkTheme, DefaultTheme, Theme as NavTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import RootNavigator from './src/navigation/RootNavigator';
import AnimatedSplashScreen from './src/components/AnimatedSplashScreen';
import { ThemeProvider, useTheme } from './src/theme/ThemeProvider';
import { palette } from './src/theme/tokens';

function ThemedApp({ showSplash, onSplashFinish }: { showSplash: boolean; onSplashFinish: () => void }) {
  const t = useTheme();

  const navTheme: NavTheme = useMemo(() => {
    const base = t.dark ? DarkTheme : DefaultTheme;
    return {
      ...base,
      dark: t.dark,
      colors: {
        ...base.colors,
        background: t.colors.background,
        card: t.colors.surface,
        text: t.colors.text,
        border: t.colors.border,
        primary: t.colors.accent,
        notification: t.colors.accent,
      },
    };
  }, [t]);

  return (
    <View style={[styles.root, { backgroundColor: t.colors.background }]}>
      <StatusBar style={showSplash || t.dark ? 'light' : 'dark'} translucent backgroundColor="transparent" />
      <NavigationContainer theme={navTheme}>
        <RootNavigator />
      </NavigationContainer>
      {showSplash && <AnimatedSplashScreen onFinish={onSplashFinish} />}
    </View>
  );
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  // Require only the weights we use (the package index would bundle every weight).
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular: require('@expo-google-fonts/inter/Inter_400Regular.ttf'),
    Inter_500Medium: require('@expo-google-fonts/inter/Inter_500Medium.ttf'),
    Inter_600SemiBold: require('@expo-google-fonts/inter/Inter_600SemiBold.ttf'),
    Inter_700Bold: require('@expo-google-fonts/inter/Inter_700Bold.ttf'),
    PlayfairDisplay_400Regular_Italic: require('@expo-google-fonts/playfair-display/PlayfairDisplay_400Regular_Italic.ttf'),
    PlayfairDisplay_600SemiBold: require('@expo-google-fonts/playfair-display/PlayfairDisplay_600SemiBold.ttf'),
    PlayfairDisplay_700Bold: require('@expo-google-fonts/playfair-display/PlayfairDisplay_700Bold.ttf'),
  });

  // Hold on the brand background until fonts resolve (success or failure);
  // on failure the theme falls back to system fonts.
  const ready = fontsLoaded || !!fontError;

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        {ready ? (
          <ThemeProvider fontsLoaded={fontsLoaded}>
            <ThemedApp showSplash={showSplash} onSplashFinish={() => setShowSplash(false)} />
          </ThemeProvider>
        ) : (
          <View style={[styles.root, { backgroundColor: palette.navy950 }]} />
        )}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});

AppRegistry.registerComponent('main', () => App);
AppRegistry.registerComponent('BenchmarkJustice', () => App);
