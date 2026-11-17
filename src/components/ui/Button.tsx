import React from 'react';
import { ActivityIndicator, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { LucideIcon } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { PressableScale } from './PressableScale';
import { AppText } from './AppText';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'navy';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon;
  iconRight?: LucideIcon;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconRight: IconRight,
  loading,
  disabled,
  fullWidth,
  style,
  accessibilityLabel,
}: ButtonProps) {
  const t = useTheme();
  const height = size === 'sm' ? 36 : size === 'lg' ? 54 : 46;
  const padH = size === 'sm' ? 14 : size === 'lg' ? 24 : 18;
  const iconSize = size === 'sm' ? 15 : 17;

  const fg =
    variant === 'primary'
      ? t.colors.onAccent
      : variant === 'navy'
        ? t.colors.onNavy
        : variant === 'secondary'
          ? t.colors.accentStrong
          : variant === 'outline'
            ? t.colors.text
            : t.colors.accent;

  const containerStyle: ViewStyle = {
    height,
    paddingHorizontal: padH,
    borderRadius: t.radius.pill,
    alignSelf: fullWidth ? 'stretch' : 'flex-start',
    overflow: 'hidden',
    ...(variant === 'secondary' && { backgroundColor: t.colors.accentSoft, borderWidth: 1, borderColor: t.colors.accentBorder }),
    ...(variant === 'outline' && { borderWidth: 1, borderColor: t.colors.borderStrong, backgroundColor: t.colors.surface }),
    ...(variant === 'navy' && { backgroundColor: t.colors.navy }),
    ...(variant === 'primary' && t.shadow(1)),
  };

  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled || loading}
      haptic
      accessibilityLabel={accessibilityLabel || label}
      accessibilityState={{ disabled: !!(disabled || loading), busy: !!loading }}
      style={[containerStyle, style]}
    >
      {variant === 'primary' ? (
        <LinearGradient
          colors={t.colors.accentGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      <View style={styles.inner}>
        {loading ? (
          <ActivityIndicator size="small" color={fg} />
        ) : (
          <>
            {Icon ? <Icon size={iconSize} color={fg} strokeWidth={2} /> : null}
            <AppText
              variant="title"
              color={fg}
              style={{ fontSize: size === 'sm' ? 13 : 15, letterSpacing: 0.2 }}
              numberOfLines={1}
            >
              {label}
            </AppText>
            {IconRight ? <IconRight size={iconSize} color={fg} strokeWidth={2} /> : null}
          </>
        )}
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  inner: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
});
