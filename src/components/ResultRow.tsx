import React, { memo } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import type { SearchResultItem } from '../types';
import { useTheme } from '../theme/ThemeProvider';
import { ENTITY_META, resultSubtitle } from '../utils/entities';
import { AppText, Badge, IconTile, Monogram, PressableScale } from './ui';

interface ResultRowProps {
  item: SearchResultItem;
  onPress: (item: SearchResultItem) => void;
  showType?: boolean;
}

/** Premium list row for any search result (people get a monogram, cases an icon). */
function ResultRowBase({ item, onPress, showType = true }: ResultRowProps) {
  const t = useTheme();
  const meta = ENTITY_META[item.type];
  const isPerson = item.type !== 'case';
  const [imageFailed, setImageFailed] = React.useState(false);

  return (
    <PressableScale
      onPress={() => onPress(item)}
      haptic
      accessibilityLabel={`${meta.label}: ${item.name}`}
      style={[styles.row, { backgroundColor: t.colors.surface, borderColor: t.colors.border }, t.shadow(1)]}
    >
      {item.imageUrl && !imageFailed ? (
        <Image
          source={{ uri: item.imageUrl }}
          onError={() => setImageFailed(true)}
          style={[styles.photo, { borderColor: t.tone(meta.tone).border, backgroundColor: t.colors.surfaceSunken }]}
        />
      ) : isPerson ? (
        <Monogram name={item.name} size={46} tone={meta.tone} />
      ) : (
        <IconTile icon={meta.icon} tone={meta.tone} size={46} />
      )}

      <View style={{ flex: 1, minWidth: 0 }}>
        <AppText variant="title" numberOfLines={1}>
          {item.name}
        </AppText>
        <AppText variant="caption" numberOfLines={1} style={{ marginTop: 2 }}>
          {resultSubtitle(item)}
        </AppText>
        {showType || item.tag ? (
          <View style={styles.metaRow}>
            {showType ? <Badge label={meta.label} tone={meta.tone} icon={meta.icon} /> : null}
            {item.tag ? (
              <AppText variant="caption" color={t.colors.textSecondary} style={{ fontFamily: t.fonts.sansSemi }} numberOfLines={1}>
                {item.tag}
              </AppText>
            ) : null}
          </View>
        ) : null}
      </View>

      <View style={[styles.chev, { backgroundColor: t.colors.surfaceSunken }]}>
        <ChevronRight size={16} color={t.colors.textTertiary} strokeWidth={2.2} />
      </View>
    </PressableScale>
  );
}

export const ResultRow = memo(ResultRowBase);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  photo: { width: 46, height: 46, borderRadius: 23, borderWidth: 1.5 },
  chev: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
});
