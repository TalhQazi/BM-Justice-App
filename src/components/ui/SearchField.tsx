import React, { forwardRef, useEffect, useState } from 'react';
import { ActivityIndicator, StyleProp, StyleSheet, TextInput, TextInputProps, View, ViewStyle } from 'react-native';
import Animated, {
  ZoomIn,
  ZoomOut,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Search, X } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { PressableScale } from './PressableScale';
import { AppText } from './AppText';

export interface SearchFieldProps extends Omit<TextInputProps, 'style'> {
  value: string;
  onChangeText: (v: string) => void;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  size?: 'md' | 'lg';
  /**
   * When set, nothing is fetched while typing: a "Search" button (and the
   * keyboard's search key) runs the search once the user has finished.
   */
  onSubmit?: (value: string) => void;
}

/** Search input with an animated gold focus ring, clear button and loader. */
export const SearchField = forwardRef<TextInput, SearchFieldProps>(function SearchField(
  { value, onChangeText, loading, style, size = 'md', onFocus, onBlur, onSubmit, ...rest },
  ref,
) {
  const t = useTheme();
  const focus = useSharedValue(0);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    focus.value = withTiming(focused ? 1 : 0, { duration: t.motion.base });
  }, [focused, focus, t.motion.base]);

  const border = t.colors.border;
  const accent = t.colors.accent;
  const ringStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(focus.value, [0, 1], [border, accent]),
  }));

  const height = size === 'lg' ? 54 : 46;

  return (
    <Animated.View
      style={[
        styles.box,
        { height, borderRadius: t.radius.pill, backgroundColor: t.colors.inputBg },
        t.shadow(1),
        ringStyle,
        style,
      ]}
    >
      <Search size={18} color={focused ? t.colors.accent : t.colors.textTertiary} strokeWidth={2} />
      <TextInput
        ref={ref}
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor={t.colors.textTertiary}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        selectionColor={t.colors.accent}
        {...rest}
        onSubmitEditing={(e) => {
          if (onSubmit && value.trim()) onSubmit(value.trim());
          rest.onSubmitEditing?.(e);
        }}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        style={[
          styles.input,
          { color: t.colors.text, fontFamily: t.fonts.sans, fontSize: size === 'lg' ? 15.5 : 14.5 },
        ]}
      />
      <View style={styles.trailing}>
        {loading ? (
          <ActivityIndicator size="small" color={t.colors.accent} />
        ) : value.length > 0 && onSubmit ? (
          <View style={styles.actions}>
            <Animated.View entering={ZoomIn.duration(160)} exiting={ZoomOut.duration(120)}>
              <PressableScale
                onPress={() => onChangeText('')}
                hitSlop={10}
                accessibilityLabel="Clear search"
                style={[styles.clear, { backgroundColor: t.colors.surfaceSunken }]}
              >
                <X size={13} color={t.colors.textSecondary} strokeWidth={2.4} />
              </PressableScale>
            </Animated.View>
            <Animated.View entering={ZoomIn.duration(180)} exiting={ZoomOut.duration(120)}>
              <PressableScale
                onPress={() => value.trim() && onSubmit(value.trim())}
                haptic
                accessibilityLabel="Search"
                style={[styles.go, { backgroundColor: t.colors.accent, height: height - 14 }]}
              >
                <Search size={14} color={t.colors.onAccent} strokeWidth={2.6} />
                <AppText variant="callout" color={t.colors.onAccent} style={{ fontFamily: t.fonts.sansSemi }}>
                  Search
                </AppText>
              </PressableScale>
            </Animated.View>
          </View>
        ) : value.length > 0 ? (
          <Animated.View entering={ZoomIn.duration(160)} exiting={ZoomOut.duration(120)}>
            <PressableScale
              onPress={() => onChangeText('')}
              hitSlop={10}
              accessibilityLabel="Clear search"
              style={[styles.clear, { backgroundColor: t.colors.surfaceSunken }]}
            >
              <X size={13} color={t.colors.textSecondary} strokeWidth={2.4} />
            </PressableScale>
          </Animated.View>
        ) : null}
      </View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderWidth: 1.2,
    gap: 10,
  },
  input: { flex: 1, height: '100%', paddingVertical: 0 },
  trailing: { minWidth: 22, alignItems: 'center', justifyContent: 'center' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8, marginRight: -8 },
  go: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, borderRadius: 999 },
  clear: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
});
