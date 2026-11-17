import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { CalendarRange } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeProvider';
import { AppText, Chip } from './ui';

export type DecadeKey = 'ALL' | '2020s' | '2010s' | '2000s' | '1990s' | '1980s' | '1970s' | '1960s' | 'earlier';

interface DecadeTimelineTabsProps {
  selectedDecade: DecadeKey;
  onSelectDecade: (decade: DecadeKey) => void;
  decadeTabs: { key: DecadeKey; label: string; count: number }[];
}

export default function DecadeTimelineTabs({ selectedDecade, onSelectDecade, decadeTabs }: DecadeTimelineTabsProps) {
  const t = useTheme();
  return (
    <View>
      <View style={styles.labelRow}>
        <CalendarRange size={14} color={t.colors.accent} />
        <AppText variant="overline">Decade timeline</AppText>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {decadeTabs.map((tab) => (
          <Chip
            key={tab.key}
            label={tab.label}
            count={tab.count}
            selected={selectedDecade === tab.key}
            onPress={() => onSelectDecade(tab.key)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  scroll: { gap: 8, paddingRight: 16 },
});
