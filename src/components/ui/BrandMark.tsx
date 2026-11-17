import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Landmark } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { palette } from '../../theme/tokens';
import { AppText } from './AppText';

/** Vector brand lock-up that renders crisply in both light and dark themes. */
export function BrandMark({ size = 'md', onDark = false }: { size?: 'sm' | 'md' | 'lg'; onDark?: boolean }) {
  const t = useTheme();
  const tile = size === 'sm' ? 30 : size === 'lg' ? 52 : 38;
  const word = size === 'sm' ? 13 : size === 'lg' ? 22 : 16;
  const textColor = onDark ? palette.parchment : t.colors.text;

  return (
    <View style={styles.row} accessibilityRole="header" accessibilityLabel="Benchmark Justice">
      <View style={[styles.tile, { width: tile, height: tile, borderRadius: tile * 0.3 }]}>
        <LinearGradient
          colors={[palette.navy600, palette.navy900]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFill, { borderRadius: tile * 0.3 }]}
        />
        <View
          style={[
            StyleSheet.absoluteFill,
            { borderRadius: tile * 0.3, borderWidth: 1, borderColor: 'rgba(210,182,118,0.55)' },
          ]}
        />
        <Landmark size={tile * 0.52} color={palette.gold400} strokeWidth={1.8} />
      </View>
      <View>
        <AppText
          variant="h3"
          color={textColor}
          style={{ fontFamily: t.fonts.sansBold, fontSize: word, lineHeight: word * 1.15, letterSpacing: 1.6 }}
          maxFontSizeMultiplier={1.1}
        >
          BENCHMARK
        </AppText>
        <AppText
          variant="overline"
          color={t.colors.accent}
          style={{ fontSize: word * 0.62, letterSpacing: word * 0.42, lineHeight: word * 0.85 }}
          maxFontSizeMultiplier={1.1}
        >
          JUSTICE
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  tile: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
});
