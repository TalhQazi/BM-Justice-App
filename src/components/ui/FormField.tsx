import React, { useEffect, useState } from 'react';
import { StyleSheet, TextInput, TextInputProps, View } from 'react-native';
import Animated, { interpolateColor, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Eye, EyeOff } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { AppText } from './AppText';
import { PressableScale } from './PressableScale';

export interface FormFieldProps extends Omit<TextInputProps, 'style'> {
  label: string;
  icon?: LucideIcon;
  /** Adds a show/hide toggle for password fields. */
  secureToggle?: boolean;
}

/** Labelled input with animated focus ring and optional password reveal. */
export function FormField({ label, icon: Icon, secureToggle, secureTextEntry, onFocus, onBlur, ...rest }: FormFieldProps) {
  const t = useTheme();
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(!!secureTextEntry);
  const focus = useSharedValue(0);

  useEffect(() => {
    focus.value = withTiming(focused ? 1 : 0, { duration: t.motion.base });
  }, [focused, focus, t.motion.base]);

  const border = t.colors.borderStrong;
  const accent = t.colors.accent;
  const ring = useAnimatedStyle(() => ({ borderColor: interpolateColor(focus.value, [0, 1], [border, accent]) }));

  return (
    <View style={{ gap: 6 }}>
      <AppText variant="overline" style={{ fontSize: 10, marginLeft: 2 }}>
        {label}
      </AppText>
      <Animated.View style={[styles.box, { backgroundColor: t.colors.inputBg }, ring]}>
        {Icon ? <Icon size={17} color={focused ? t.colors.accent : t.colors.textTertiary} strokeWidth={1.9} /> : null}
        <TextInput
          placeholderTextColor={t.colors.textTertiary}
          selectionColor={t.colors.accent}
          secureTextEntry={hidden}
          {...rest}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[styles.input, { color: t.colors.text, fontFamily: t.fonts.sans }]}
        />
        {secureToggle ? (
          <PressableScale
            onPress={() => setHidden((h) => !h)}
            hitSlop={10}
            accessibilityLabel={hidden ? 'Show password' : 'Hide password'}
          >
            {hidden ? (
              <Eye size={18} color={t.colors.textTertiary} />
            ) : (
              <EyeOff size={18} color={t.colors.textTertiary} />
            )}
          </PressableScale>
        ) : null}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 50,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1.2,
  },
  input: { flex: 1, height: '100%', fontSize: 15, paddingVertical: 0 },
});
