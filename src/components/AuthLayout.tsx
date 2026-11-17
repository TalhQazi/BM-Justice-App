import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { LucideIcon } from 'lucide-react-native';
import { palette } from '../theme/tokens';
import { useTheme } from '../theme/ThemeProvider';
import { CONTENT_MAX_WIDTH } from '../theme/responsive';
import { AppText, Badge, BrandMark, HEADER_BAR_HEIGHT, ScreenHeader, enterUp } from './ui';

/** Shared shell for Login / Signup: navy hero band with a floating form card. */
export function AuthLayout({
  badge,
  badgeIcon,
  title,
  subtitle,
  children,
}: {
  badge: string;
  badgeIcon?: LucideIcon;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  const t = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { backgroundColor: t.colors.background }]}>
      <LinearGradient
        colors={[palette.navy700, palette.navy900, t.colors.background]}
        locations={[0, 0.55, 1]}
        style={[styles.band, { height: 340 + insets.top }]}
      />
      <ScreenHeader solid={false} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.content,
            { paddingTop: insets.top + HEADER_BAR_HEIGHT + 4, paddingBottom: insets.bottom + 32 },
          ]}
        >
          <Animated.View entering={enterUp(0)} style={{ alignItems: 'center', marginBottom: 24 }}>
            <BrandMark size="lg" onDark />
          </Animated.View>

          <Animated.View
            entering={enterUp(1)}
            style={[
              styles.card,
              { backgroundColor: t.colors.surfaceElevated, borderColor: t.colors.border },
              t.shadow(3),
            ]}
          >
            <Badge label={badge} tone="gold" icon={badgeIcon} />
            <AppText variant="h1" style={{ marginTop: 14 }}>
              {title}
            </AppText>
            <AppText variant="body" style={{ marginTop: 6, marginBottom: 22 }}>
              {subtitle}
            </AppText>
            {children}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  band: { position: 'absolute', top: 0, left: 0, right: 0 },
  content: { paddingHorizontal: 18, width: '100%', maxWidth: CONTENT_MAX_WIDTH - 200, alignSelf: 'center' },
  card: { borderRadius: 26, padding: 22, borderWidth: StyleSheet.hairlineWidth },
});
