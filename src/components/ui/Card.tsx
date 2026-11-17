import React from 'react';
import { Platform, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme/ThemeProvider';
import { PressableScale } from './PressableScale';

export type CardVariant = 'surface' | 'elevated' | 'outline' | 'sunken' | 'glass' | 'navy';

export interface CardProps {
  variant?: CardVariant;
  padding?: number;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  onPress?: () => void;
  haptic?: boolean;
  accessibilityLabel?: string;
  /** Thin gold rule along the top edge — used for "featured" cards. */
  accentEdge?: boolean;
}

export function Card({
  variant = 'surface',
  padding,
  style,
  children,
  onPress,
  haptic,
  accessibilityLabel,
  accentEdge,
}: CardProps) {
  const t = useTheme();
  const pad = padding ?? t.spacing.lg;

  const base: ViewStyle = {
    borderRadius: t.radius.lg,
    padding: pad,
    overflow: Platform.OS === 'android' && variant !== 'elevated' ? 'hidden' : 'visible',
  };

  let variantStyle: ViewStyle;
  switch (variant) {
    case 'elevated':
      variantStyle = {
        backgroundColor: t.colors.surfaceElevated,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: t.colors.border,
        ...t.shadow(2),
      };
      break;
    case 'outline':
      variantStyle = { backgroundColor: 'transparent', borderWidth: 1, borderColor: t.colors.border };
      break;
    case 'sunken':
      variantStyle = { backgroundColor: t.colors.surfaceSunken, borderWidth: StyleSheet.hairlineWidth, borderColor: t.colors.divider };
      break;
    case 'glass':
      variantStyle = {
        backgroundColor: Platform.OS === 'ios' ? 'transparent' : t.colors.glass,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: t.colors.glassBorder,
        overflow: 'hidden',
      };
      break;
    case 'navy':
      variantStyle = { backgroundColor: t.colors.navyDeep, overflow: 'hidden', ...t.shadow(2) };
      break;
    default:
      variantStyle = {
        backgroundColor: t.colors.surface,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: t.colors.border,
        ...t.shadow(1),
      };
  }

  const content = (
    <>
      {variant === 'glass' && Platform.OS === 'ios' ? (
        <BlurView intensity={40} tint={t.dark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
      ) : null}
      {variant === 'navy' ? (
        <LinearGradient
          colors={t.colors.heroGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      {accentEdge ? (
        <LinearGradient
          colors={['transparent', t.colors.accent, 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.accentEdge}
        />
      ) : null}
      {children}
    </>
  );

  if (onPress) {
    return (
      <PressableScale
        onPress={onPress}
        haptic={haptic}
        accessibilityLabel={accessibilityLabel}
        style={[base, variantStyle, style]}
      >
        {content}
      </PressableScale>
    );
  }

  return <View style={[base, variantStyle, style]}>{content}</View>;
}

const styles = StyleSheet.create({
  accentEdge: { position: 'absolute', top: 0, left: 18, right: 18, height: 1.5, opacity: 0.85 },
});
