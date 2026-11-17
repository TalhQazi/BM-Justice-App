import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Activity, Moon, Sun } from 'lucide-react-native';
import { useTheme, useThemePreference } from '../theme/ThemeProvider';
import { BrandMark, PressableScale } from './ui';

/** Dashboard top bar: brand lock-up with quick theme toggle and activity feed. */
export default function Header() {
  const navigation = useNavigation<any>();
  const t = useTheme();
  const { setPreference } = useThemePreference();

  const btn = [styles.btn, { backgroundColor: t.colors.surface, borderColor: t.colors.border }, t.shadow(1)];

  return (
    <View style={styles.container}>
      <PressableScale onPress={() => navigation.navigate('Home', { screen: 'Dashboard' })} scaleTo={0.97}>
        <BrandMark size="md" />
      </PressableScale>
      <View style={styles.actions}>
        <PressableScale
          haptic
          onPress={() => setPreference(t.dark ? 'light' : 'dark')}
          accessibilityLabel={t.dark ? 'Switch to light theme' : 'Switch to dark theme'}
          style={btn}
        >
          {t.dark ? (
            <Sun size={18} color={t.colors.accent} strokeWidth={2} />
          ) : (
            <Moon size={18} color={t.colors.navy} strokeWidth={2} />
          )}
        </PressableScale>
        <PressableScale
          haptic
          onPress={() => navigation.navigate('Activity')}
          accessibilityLabel="Open live activity feed"
          style={btn}
        >
          <Activity size={18} color={t.colors.text} strokeWidth={2} />
          <View style={[styles.liveDot, { backgroundColor: t.colors.success, borderColor: t.colors.surface }]} />
        </PressableScale>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  actions: { flexDirection: 'row', gap: 10 },
  btn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  liveDot: { position: 'absolute', top: 9, right: 9, width: 8, height: 8, borderRadius: 4, borderWidth: 1.5 },
});
