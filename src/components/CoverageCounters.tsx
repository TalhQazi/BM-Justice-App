import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { CalendarClock, FileText, FolderOpen, Gavel, Landmark, Vote } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import type { ToneKey } from '../theme/themes';
import { useTheme } from '../theme/ThemeProvider';
import { useResponsive } from '../theme/responsive';
import { useCoverageStats } from '../hooks/useCoverageStats';
import { AppText, IconTile, SkeletonStatGrid, enterUp } from './ui';

/** Animates the numeric part of strings like "12,450+" from zero. */
function useCountUp(value: string, duration = 950) {
  const parsed = useMemo(() => {
    const m = /^([\d,]+(?:\.\d+)?)(.*)$/.exec(value.trim());
    if (!m) return null;
    const num = parseFloat(m[1].replace(/,/g, ''));
    if (isNaN(num)) return null;
    return { num, suffix: m[2], decimals: m[1].includes('.') ? m[1].split('.')[1].length : 0 };
  }, [value]);

  const [display, setDisplay] = useState(parsed ? '0' : value);

  useEffect(() => {
    if (!parsed || parsed.num === 0) {
      setDisplay(value);
      return;
    }
    let raf = 0;
    const start = Date.now();
    const tick = () => {
      const p = Math.min(1, (Date.now() - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      const cur = parsed.num * eased;
      setDisplay(
        `${cur.toLocaleString('en-US', {
          minimumFractionDigits: parsed.decimals,
          maximumFractionDigits: parsed.decimals,
        })}${p === 1 ? parsed.suffix : ''}`,
      );
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [parsed, value, duration]);

  return display;
}

function StatTile({
  value,
  label,
  icon,
  tone,
  index,
  width,
}: {
  value: string;
  label: string;
  icon: LucideIcon;
  tone: ToneKey;
  index: number;
  width: string;
}) {
  const t = useTheme();
  const display = useCountUp(value);
  return (
    <Animated.View
      entering={enterUp(index)}
      style={[
        styles.tile,
        {
          width: width as any,
          backgroundColor: t.colors.surface,
          borderColor: t.colors.border,
          borderRadius: t.radius.lg,
        },
        t.shadow(1),
      ]}
    >
      <IconTile icon={icon} tone={tone} size={32} />
      <AppText variant="stat" style={{ marginTop: 10 }} numberOfLines={1} adjustsFontSizeToFit>
        {display}
      </AppText>
      <AppText variant="overline" style={{ fontSize: 9.5, marginTop: 2 }} numberOfLines={2}>
        {label}
      </AppText>
    </Animated.View>
  );
}

export default function CoverageCounters() {
  const { stats, failed, loading } = useCoverageStats();
  const { gridColumns } = useResponsive();

  // "…" while a number is still loading, "—" only if its source failed.
  const show = (n: number | undefined, key: string) =>
    typeof n === 'number' ? n.toLocaleString('en-US') : (failed as string[]).includes(key) ? '—' : '…';

  // Every value is a live count from CourtListener or Congress.gov ("—" if a source fails).
  const items: { value: string; label: string; icon: LucideIcon; tone: ToneKey }[] = [
    { value: show(stats.opinions, 'opinions'), label: 'Published opinions', icon: FileText, tone: 'gold' },
    { value: show(stats.dockets, 'dockets'), label: 'Federal dockets (approx.)', icon: FolderOpen, tone: 'teal' },
    { value: show(stats.judges, 'judges'), label: 'Judges indexed', icon: Gavel, tone: 'success' },
    { value: show(stats.courts, 'courts'), label: 'Active courts', icon: Landmark, tone: 'warning' },
    { value: show(stats.recentOpinions, 'recentOpinions'), label: 'Opinions · last 30 days', icon: CalendarClock, tone: 'info' },
    { value: show(stats.legislators, 'legislators'), label: 'Members of Congress', icon: Vote, tone: 'plum' },
  ];

  if (loading) return <SkeletonStatGrid count={6} />;

  const width = gridColumns === 3 ? '32.4%' : '48.6%';

  return (
    <View style={styles.grid}>
      {items.map((stat, idx) => (
        <StatTile key={stat.label} {...stat} index={idx} width={width} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between' },
  tile: { paddingVertical: 14, paddingHorizontal: 14, borderWidth: StyleSheet.hairlineWidth },
});
