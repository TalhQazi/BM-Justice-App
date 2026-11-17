import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { ChevronRight, Inbox } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeProvider';
import type { ToneKey } from '../../theme/themes';
import { AppText } from './AppText';
import { PressableScale } from './PressableScale';

/* -------------------------------------------------------------- IconTile */

export function IconTile({
  icon: Icon,
  tone = 'gold',
  size = 44,
  style,
}: {
  icon: LucideIcon;
  tone?: ToneKey;
  size?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useTheme();
  const c = t.tone(tone);
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size * 0.3,
          backgroundColor: c.bg,
          borderWidth: 1,
          borderColor: c.border,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      <Icon size={size * 0.46} color={c.fg} strokeWidth={1.9} />
    </View>
  );
}

/* -------------------------------------------------------------- Monogram */

function initials(name?: string) {
  if (!name) return '—';
  const cleaned = name.replace(/^(hon\.?|judge|justice|the)\s+/i, '').trim();
  const parts = cleaned.split(/\s+/).filter((p) => /^[A-Za-z]/.test(p));
  if (parts.length === 0) return cleaned.slice(0, 2).toUpperCase();
  const first = parts[0][0];
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

/** Serif monogram avatar used for people (judges, attorneys, prosecutors). */
export function Monogram({
  name,
  size = 48,
  tone = 'gold',
  style,
}: {
  name?: string;
  size?: number;
  tone?: ToneKey;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useTheme();
  const c = t.tone(tone);
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: c.bg,
          borderWidth: 1.5,
          borderColor: c.border,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      <AppText
        variant="h2"
        color={c.fg}
        style={{ fontSize: size * 0.38, lineHeight: size * 0.48 }}
        maxFontSizeMultiplier={1}
      >
        {initials(name)}
      </AppText>
    </View>
  );
}

/* --------------------------------------------------------- SectionHeader */

export function SectionHeader({
  title,
  eyebrow,
  actionLabel,
  onAction,
  style,
}: {
  title: string;
  eyebrow?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useTheme();
  return (
    <View style={[styles.sectionHeader, style]}>
      <View style={{ flex: 1, paddingRight: 12 }}>
        {eyebrow ? (
          <AppText variant="overline" color={t.colors.accent} style={{ marginBottom: 3 }}>
            {eyebrow}
          </AppText>
        ) : null}
        <AppText variant="h2" numberOfLines={2}>
          {title}
        </AppText>
      </View>
      {actionLabel && onAction ? (
        <PressableScale onPress={onAction} haptic style={styles.sectionAction} hitSlop={8}>
          <AppText variant="callout" color={t.colors.accent}>
            {actionLabel}
          </AppText>
          <ChevronRight size={15} color={t.colors.accent} strokeWidth={2.2} />
        </PressableScale>
      ) : null}
    </View>
  );
}

/* ------------------------------------------------------------ EmptyState */

export function EmptyState({
  icon: Icon = Inbox,
  title,
  message,
  action,
  style,
}: {
  icon?: LucideIcon;
  title: string;
  message?: string;
  action?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useTheme();
  return (
    <View style={[styles.empty, style]}>
      <View
        style={[
          styles.emptyIcon,
          { backgroundColor: t.colors.accentSoft, borderColor: t.colors.accentBorder },
        ]}
      >
        <Icon size={24} color={t.colors.accent} strokeWidth={1.7} />
      </View>
      <AppText variant="title" align="center">
        {title}
      </AppText>
      {message ? (
        <AppText variant="caption" align="center" style={{ marginTop: 6, maxWidth: 300, lineHeight: 18 }}>
          {message}
        </AppText>
      ) : null}
      {action ? <View style={{ marginTop: 16 }}>{action}</View> : null}
    </View>
  );
}

/* --------------------------------------------------------------- Divider */

export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  const t = useTheme();
  return <View style={[{ height: StyleSheet.hairlineWidth, backgroundColor: t.colors.divider }, style]} />;
}

/* ------------------------------------------------------------- InfoRow */

/** Label/value pair used inside detail cards. */
export function InfoRow({
  icon: Icon,
  label,
  value,
  sub,
  last,
}: {
  icon?: LucideIcon;
  label: string;
  value: string;
  sub?: string;
  last?: boolean;
}) {
  const t = useTheme();
  return (
    <View
      style={[
        styles.infoRow,
        !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.colors.divider },
      ]}
    >
      {Icon ? (
        <View style={[styles.infoIcon, { backgroundColor: t.colors.surfaceSunken }]}>
          <Icon size={16} color={t.colors.accent} strokeWidth={1.9} />
        </View>
      ) : null}
      <View style={{ flex: 1 }}>
        <AppText variant="overline" style={{ fontSize: 9.5 }}>
          {label}
        </AppText>
        <AppText variant="bodyStrong" style={{ marginTop: 2 }}>
          {value}
        </AppText>
        {sub ? (
          <AppText variant="caption" style={{ marginTop: 1 }}>
            {sub}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHeader: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 12 },
  sectionAction: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingVertical: 4 },
  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 32, paddingHorizontal: 20 },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 12 },
  infoIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
});
