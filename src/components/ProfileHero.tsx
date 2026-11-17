import React, { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import type { LucideIcon } from 'lucide-react-native';
import { ArrowRight } from 'lucide-react-native';
import { palette } from '../theme/tokens';
import type { ToneKey } from '../theme/themes';
import { AppText, Badge, Button, IconTile, Monogram } from './ui';

export interface HeroBadge {
  label: string;
  tone?: ToneKey;
  icon?: LucideIcon;
  dot?: boolean;
}

interface ProfileHeroProps {
  name: string;
  subtitle?: string;
  eyebrow?: string;
  badges?: HeroBadge[];
  /** Show an icon tile instead of a monogram (e.g. for cases). */
  icon?: LucideIcon;
  /** Portrait / member photo; falls back to a monogram if it fails to load. */
  imageUrl?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionIcon?: LucideIcon;
  children?: React.ReactNode;
}

/**
 * Navy/gold identity card at the top of every detail screen. The avatar zooms
 * in on mount, giving a shared-element-style continuity from the list row.
 */
export function ProfileHero({
  name,
  subtitle,
  eyebrow,
  badges = [],
  icon,
  imageUrl,
  actionLabel,
  onAction,
  actionIcon = ArrowRight,
  children,
}: ProfileHeroProps) {
  const [imageFailed, setImageFailed] = useState(false);
  return (
    <Animated.View entering={FadeIn.duration(320)} style={styles.card}>
      <LinearGradient
        colors={[palette.navy700, palette.navy800, palette.navy950]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={['transparent', 'rgba(210,182,118,0.8)', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.rule}
      />
      <View style={styles.glow} />

      <Animated.View entering={ZoomIn.springify().damping(16).stiffness(170)} style={styles.avatarRing}>
        {imageUrl && !imageFailed ? (
          <Image source={{ uri: imageUrl }} onError={() => setImageFailed(true)} style={styles.photo} />
        ) : icon ? (
          <IconTile icon={icon} tone="gold" size={76} />
        ) : (
          <Monogram name={name} size={84} tone="gold" style={{ backgroundColor: 'rgba(210,182,118,0.12)' }} />
        )}
      </Animated.View>

      {eyebrow ? (
        <AppText variant="overline" color={palette.gold300} align="center" style={{ marginTop: 16, letterSpacing: 1.6 }}>
          {eyebrow}
        </AppText>
      ) : null}
      <AppText variant="h1" color={palette.parchment} align="center" style={{ marginTop: eyebrow ? 6 : 16 }}>
        {name}
      </AppText>
      {subtitle ? (
        <AppText variant="callout" color={palette.navy300} align="center" style={{ marginTop: 6 }}>
          {subtitle}
        </AppText>
      ) : null}

      {badges.length > 0 ? (
        <View style={styles.badges}>
          {badges.map((b) => (
            <Badge key={b.label} label={b.label} tone={b.tone ?? 'gold'} icon={b.icon} dot={b.dot} />
          ))}
        </View>
      ) : null}

      {actionLabel && onAction ? (
        <Button
          label={actionLabel}
          iconRight={actionIcon}
          size="sm"
          onPress={onAction}
          style={{ alignSelf: 'center', marginTop: 18 }}
        />
      ) : null}

      {children ? <View style={{ marginTop: 18, alignSelf: 'stretch' }}>{children}</View> : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 26,
    paddingHorizontal: 20,
    paddingTop: 26,
    paddingBottom: 22,
    alignItems: 'center',
    overflow: 'hidden',
  },
  rule: { position: 'absolute', top: 0, left: 30, right: 30, height: 1.5 },
  glow: {
    position: 'absolute',
    top: -80,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(210,182,118,0.07)',
  },
  avatarRing: {
    padding: 5,
    borderRadius: 60,
    borderWidth: 1,
    borderColor: 'rgba(210,182,118,0.35)',
  },
  photo: { width: 84, height: 84, borderRadius: 42, backgroundColor: 'rgba(210,182,118,0.12)' },
  badges: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6, marginTop: 14 },
});
