import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { ArrowRight, Briefcase, FileText, Gavel, Landmark, ShieldCheck, Vote } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import type { ToneKey } from '../theme/themes';
import { useTheme } from '../theme/ThemeProvider';
import { useCoverageStats } from '../hooks/useCoverageStats';
import { formatCount } from '../utils/format';
import { AppText, Badge, Card, IconTile, PressableScale, SectionHeader, enterUp } from './ui';

type Category = 'judges' | 'attorneys' | 'prosecutors' | 'legislators' | 'cases' | 'courts';

interface EntityCardsProps {
  onSelectCategory?: (category: Category) => void;
}

export default function EntityCards({ onSelectCategory }: EntityCardsProps) {
  const navigation = useNavigation<any>();
  const t = useTheme();
  const { stats, failed } = useCoverageStats();
  // Live count, "Loading…" until it arrives, "Unavailable" only if its request failed.
  const live = (n: number | undefined, unit: string, key: string) =>
    typeof n === 'number' ? `${formatCount(n)} ${unit}` : (failed as string[]).includes(key) ? 'Unavailable' : 'Loading…';

  const handleSelect = (category: Category) => {
    if (onSelectCategory) {
      onSelectCategory(category);
    } else if (category === 'courts') {
      navigation.navigate('Home', { screen: 'Courts' });
    } else {
      navigation.navigate('SearchResults', { initialCategory: category });
    }
  };

  const quickEntities: { id: Category; label: string; icon: LucideIcon; tone: ToneKey }[] = [
    { id: 'judges', label: 'Judges', icon: Gavel, tone: 'gold' },
    { id: 'attorneys', label: 'Lawyers', icon: Briefcase, tone: 'info' },
    { id: 'prosecutors', label: 'Prosecutors', icon: ShieldCheck, tone: 'plum' },
    { id: 'courts', label: 'Courts', icon: Landmark, tone: 'warning' },
    { id: 'cases', label: 'Cases', icon: FileText, tone: 'teal' },
  ];

  const directoryCards: {
    id: Category;
    title: string;
    subtitle: string;
    desc: string;
    count: string;
    tone: ToneKey;
    icon: LucideIcon;
  }[] = [
    {
      id: 'judges',
      title: 'Judges & Justices',
      subtitle: 'Judicial Profiles & Opinions',
      desc: 'Positions, appointments, education and authored opinions.',
      count: live(stats.judges, 'indexed', 'judges'),
      tone: 'success',
      icon: Gavel,
    },
    {
      id: 'attorneys',
      title: 'Trial & Appellate Attorneys',
      subtitle: 'Counsel of Record',
      desc: 'Contact details and every federal docket they appeared on.',
      count: 'Search by name',
      tone: 'info',
      icon: Briefcase,
    },
    {
      id: 'prosecutors',
      title: 'Public Prosecutors & DAs',
      subtitle: 'Government Counsel',
      desc: 'Attorneys listed under U.S. Attorney, DA and DOJ offices.',
      count: 'Search by name',
      tone: 'plum',
      icon: ShieldCheck,
    },
    {
      id: 'cases',
      title: 'Audited Cases & Dockets',
      subtitle: 'Case Law & Federal Dockets',
      desc: 'Published opinions, federal dockets, filings and parties.',
      count: live(stats.opinions, 'opinions', 'opinions'),
      tone: 'teal',
      icon: FileText,
    },
    {
      id: 'legislators',
      title: 'Members of Congress',
      subtitle: 'Members & Legislation',
      desc: 'Terms of service, sponsored bills and legislative activity.',
      count: live(stats.legislators, 'current members', 'legislators'),
      tone: 'warning',
      icon: Vote,
    },
  ];

  return (
    <View>
      {/* Quick category shortcuts */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.quickRow}
        style={styles.quickScroll}
      >
        {quickEntities.map((item, i) => (
          <Animated.View key={item.id} entering={enterUp(i)}>
            <PressableScale
              haptic
              scaleTo={0.94}
              onPress={() => handleSelect(item.id)}
              accessibilityLabel={`Browse ${item.label}`}
              style={[
                styles.quickCard,
                { backgroundColor: t.colors.surface, borderColor: t.colors.border },
                t.shadow(1),
              ]}
            >
              <IconTile icon={item.icon} tone={item.tone} size={44} />
              <AppText variant="callout" color={t.colors.text} style={{ marginTop: 8 }} numberOfLines={1}>
                {item.label}
              </AppText>
            </PressableScale>
          </Animated.View>
        ))}
      </ScrollView>

      {/* Directory cards */}
      <SectionHeader eyebrow="Research" title="Legal Directories" style={{ marginTop: 28 }} />
      <View style={styles.list}>
        {directoryCards.map((c, i) => {
          const tone = t.tone(c.tone);
          return (
            <Animated.View key={c.id} entering={enterUp(i, 80)}>
              <Card onPress={() => handleSelect(c.id)} haptic accessibilityLabel={c.title}>
                <View style={styles.cardTop}>
                  <IconTile icon={c.icon} tone={c.tone} size={46} />
                  <View style={{ flex: 1 }}>
                    <AppText variant="h3" numberOfLines={1}>
                      {c.title}
                    </AppText>
                    <AppText variant="caption" color={tone.fg} style={{ marginTop: 2, fontFamily: t.fonts.sansSemi }} numberOfLines={1}>
                      {c.subtitle}
                    </AppText>
                  </View>
                </View>
                <AppText variant="body" style={{ marginTop: 12 }}>
                  {c.desc}
                </AppText>
                <View style={[styles.cardFooter, { borderTopColor: t.colors.divider }]}>
                  <Badge label={c.count} tone={c.tone} dot />
                  <View style={[styles.arrow, { backgroundColor: t.colors.surfaceSunken }]}>
                    <ArrowRight size={15} color={t.colors.textSecondary} strokeWidth={2.2} />
                  </View>
                </View>
              </Card>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  quickScroll: { marginHorizontal: -4 },
  quickRow: { gap: 10, paddingHorizontal: 4, paddingVertical: 4 },
  quickCard: {
    width: 92,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
  },
  list: { gap: 12 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  cardFooter: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  arrow: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
});
