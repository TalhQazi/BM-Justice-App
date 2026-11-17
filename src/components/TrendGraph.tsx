import React, { useEffect, useState } from 'react';
import { LayoutChangeEvent, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { Easing, FadeIn, useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Rect, Stop, Text as SvgText } from 'react-native-svg';
import { MoveHorizontal, TrendingUp } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeProvider';
import { AppText, Card, EmptyState } from './ui';

const AnimatedPath = Animated.createAnimatedComponent(Path);

export interface TrendPoint {
  year: number;
  value: number;
}

interface TrendGraphProps {
  points: TrendPoint[];
  title: string;
  /** Unit for tooltips, e.g. "opinions". */
  unit: string;
  /** Headline under the title; defaults to the total. */
  headline?: string;
}

/** Year-by-year activity chart drawn from live records (no sample data). */
export default function TrendGraph({ points, title, unit, headline }: TrendGraphProps) {
  const t = useTheme();
  const [selectedPoint, setSelectedPoint] = useState<TrendPoint | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  const max = Math.max(1, ...points.map((p) => p.value));
  const total = points.reduce((sum, p) => sum + p.value, 0);

  const isScrollable = points.length > 6;
  const pointSpacing = 48;
  const width = isScrollable ? Math.max(containerWidth, points.length * pointSpacing) : containerWidth;
  const height = 170;
  const padX = 22;
  const padTop = 20;
  const padBottom = 34;
  const graphHeight = height - padTop - padBottom;
  const xStep = (width - padX * 2) / Math.max(1, points.length - 1);
  const coords = points.map((p, idx) => ({
    ...p,
    x: padX + idx * xStep,
    y: padTop + (1 - p.value / max) * graphHeight,
  }));

  const path = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(' ');
  const area =
    coords.length > 1
      ? `${path} L ${coords[coords.length - 1].x.toFixed(1)} ${height - padBottom} L ${coords[0].x.toFixed(1)} ${height - padBottom} Z`
      : '';
  const pathLength = coords.reduce(
    (len, c, i) => (i === 0 ? 0 : len + Math.hypot(c.x - coords[i - 1].x, c.y - coords[i - 1].y)),
    0,
  );

  // Draw-in animation whenever the data set changes.
  const draw = useSharedValue(0);
  useEffect(() => {
    draw.value = 0;
    draw.value = withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) });
    setSelectedPoint(null);
  }, [points, containerWidth, draw]);

  const lineProps = useAnimatedProps(() => ({ strokeDashoffset: pathLength * (1 - draw.value) }));

  if (points.length < 2) {
    return (
      <Card>
        <AppText variant="overline">{title}</AppText>
        <EmptyState icon={TrendingUp} title="Not enough dated records to chart" style={{ paddingVertical: 18 }} />
      </Card>
    );
  }

  return (
    <Card>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <AppText variant="overline">{title}</AppText>
          <AppText variant="title" style={{ marginTop: 4 }}>
            {headline ?? `${total.toLocaleString()} ${unit} across ${points.length} years`}
          </AppText>
        </View>
        {isScrollable ? (
          <View style={[styles.hint, { backgroundColor: t.colors.surfaceSunken }]}>
            <MoveHorizontal size={12} color={t.colors.textTertiary} />
            <AppText variant="caption" style={{ fontSize: 10.5 }}>
              Swipe
            </AppText>
          </View>
        ) : (
          <TrendingUp size={18} color={t.colors.accent} />
        )}
      </View>

      <View style={styles.tooltipSlot}>
        {selectedPoint ? (
          <Animated.View
            key={selectedPoint.year}
            entering={FadeIn.duration(160)}
            style={[styles.tooltip, { backgroundColor: t.colors.accentSoft, borderColor: t.colors.accentBorder }]}
          >
            <AppText variant="caption" color={t.colors.accentStrong} style={{ fontFamily: t.fonts.sansSemi }}>
              {selectedPoint.year}: {selectedPoint.value.toLocaleString()} {unit}
            </AppText>
          </Animated.View>
        ) : (
          <AppText variant="caption">Tap a year to inspect</AppText>
        )}
      </View>

      <View onLayout={(e: LayoutChangeEvent) => setContainerWidth(e.nativeEvent.layout.width)} style={styles.graphWrapper}>
        {containerWidth > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} scrollEnabled={isScrollable}>
            <Svg width={width} height={height}>
              <Defs>
                <LinearGradient id="trendArea" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor={t.colors.accent} stopOpacity={0.28} />
                  <Stop offset="1" stopColor={t.colors.accent} stopOpacity={0} />
                </LinearGradient>
              </Defs>

              {[0, 0.5, 1].map((g) => (
                <Line
                  key={g}
                  x1={padX}
                  y1={padTop + g * graphHeight}
                  x2={width - padX}
                  y2={padTop + g * graphHeight}
                  stroke={t.colors.divider}
                  strokeWidth={1}
                  strokeDasharray={g === 0.5 ? '4 4' : undefined}
                />
              ))}

              {area ? <Path d={area} fill="url(#trendArea)" /> : null}
              <AnimatedPath
                d={path}
                fill="none"
                stroke={t.colors.accent}
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={`${pathLength} ${pathLength}`}
                animatedProps={lineProps}
              />

              {coords.map((c) => {
                const isSelected = selectedPoint?.year === c.year;
                return (
                  <React.Fragment key={c.year}>
                    {isSelected && (
                      <Line
                        x1={c.x}
                        y1={padTop}
                        x2={c.x}
                        y2={height - padBottom + 4}
                        stroke={t.colors.accent}
                        strokeWidth={1}
                        strokeDasharray="2 3"
                        opacity={0.7}
                      />
                    )}
                    <Circle
                      cx={c.x}
                      cy={c.y}
                      r={isSelected ? 6.5 : 4}
                      fill={isSelected ? t.colors.accent : t.colors.surface}
                      stroke={t.colors.accent}
                      strokeWidth={2}
                    />
                    <SvgText
                      x={c.x}
                      y={height - 10}
                      fontSize={10.5}
                      fontWeight={isSelected ? 'bold' : 'normal'}
                      fill={isSelected ? t.colors.accent : t.colors.textTertiary}
                      textAnchor="middle"
                    >
                      {c.year}
                    </SvgText>
                    <Rect
                      x={c.x - pointSpacing / 2}
                      y={0}
                      width={pointSpacing}
                      height={height}
                      fill="transparent"
                      onPress={() => setSelectedPoint(c)}
                    />
                  </React.Fragment>
                );
              })}
            </Svg>
          </ScrollView>
        ) : (
          <View style={{ height }} />
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  hint: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  tooltipSlot: { height: 30, justifyContent: 'center', marginTop: 8 },
  tooltip: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, borderWidth: 1 },
  graphWrapper: { width: '100%', overflow: 'hidden', marginTop: 4 },
});
