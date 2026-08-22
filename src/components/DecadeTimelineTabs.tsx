import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { colors } from '../theme/colors';

export type DecadeKey = 'ALL' | '2020s' | '2010s' | '2000s' | '1990s' | '1980s' | '1970s' | '1960s';

interface DecadeTimelineTabsProps {
  selectedDecade: DecadeKey;
  onSelectDecade: (decade: DecadeKey) => void;
  decadeTabs: { key: DecadeKey; label: string; count: number }[];
}

export default function DecadeTimelineTabs({
  selectedDecade,
  onSelectDecade,
  decadeTabs,
}: DecadeTimelineTabsProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>DECADE TIMELINE:</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {decadeTabs.map((tab) => {
          const isActive = selectedDecade === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, isActive ? styles.tabActive : styles.tabInactive]}
              activeOpacity={0.7}
              onPress={() => onSelectDecade(tab.key)}
            >
              <Text style={[styles.tabText, isActive ? styles.tabTextActive : styles.tabTextInactive]}>
                {tab.label}
              </Text>
              <View style={[styles.badge, isActive ? styles.badgeActive : styles.badgeInactive]}>
                <Text style={[styles.badgeText, isActive ? styles.badgeTextActive : styles.badgeTextInactive]}>
                  {tab.count}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1.2,
    marginBottom: 8,
    fontFamily: 'monospace',
  },
  scroll: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 16,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  tabActive: {
    backgroundColor: colors.brass,
    borderColor: colors.brass,
  },
  tabInactive: {
    backgroundColor: colors.card,
    borderColor: colors.border,
  },
  tabText: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
  tabTextActive: {
    color: colors.textDark,
    fontWeight: '800',
  },
  tabTextInactive: {
    color: colors.textMuted,
    fontWeight: '600',
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeActive: {
    backgroundColor: 'rgba(5, 11, 20, 0.25)',
  },
  badgeInactive: {
    backgroundColor: colors.surface,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: 'monospace',
  },
  badgeTextActive: {
    color: colors.textDark,
    fontWeight: '800',
  },
  badgeTextInactive: {
    color: colors.textMuted,
    fontWeight: '600',
  },
});
