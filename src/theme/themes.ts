import { Platform, TextStyle, ViewStyle } from 'react-native';
import { palette, spacing, radius, fontFamilies, motion, FontSet } from './tokens';

export type ToneKey = 'gold' | 'navy' | 'success' | 'danger' | 'warning' | 'info' | 'plum' | 'teal' | 'neutral';

export interface ThemeColors {
  background: string;
  backgroundAlt: string;
  surface: string;
  surfaceElevated: string;
  surfaceSunken: string;
  glass: string;
  glassBorder: string;
  border: string;
  borderStrong: string;
  divider: string;

  text: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;
  onAccent: string;
  onNavy: string;

  accent: string;
  accentStrong: string;
  accentSoft: string;
  accentBorder: string;
  navy: string;
  navyDeep: string;

  success: string;
  danger: string;
  warning: string;
  info: string;
  plum: string;
  teal: string;

  skeletonBase: string;
  skeletonHighlight: string;
  overlay: string;
  inputBg: string;

  heroGradient: [string, string, string];
  accentGradient: [string, string];
}

export interface Theme {
  dark: boolean;
  colors: ThemeColors;
  spacing: typeof spacing;
  radius: typeof radius;
  fonts: FontSet & { mono: string };
  motion: typeof motion;
  type: Record<TypeVariant, TextStyle>;
  shadow: (level: 1 | 2 | 3) => ViewStyle;
  tone: (key: ToneKey) => { fg: string; bg: string; border: string };
}

export type TypeVariant =
  | 'display'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'title'
  | 'body'
  | 'bodyStrong'
  | 'callout'
  | 'caption'
  | 'overline'
  | 'mono'
  | 'stat'
  | 'statSm';

const lightColors: ThemeColors = {
  background: palette.ivory,
  backgroundAlt: palette.ivoryDeep,
  surface: palette.white,
  surfaceElevated: palette.white,
  surfaceSunken: '#F1EEE7',
  glass: 'rgba(255,255,255,0.78)',
  glassBorder: 'rgba(11,21,40,0.08)',
  border: 'rgba(11,21,40,0.09)',
  borderStrong: 'rgba(11,21,40,0.16)',
  divider: 'rgba(11,21,40,0.07)',

  text: palette.ink900,
  textSecondary: palette.ink700,
  textTertiary: palette.ink500,
  textInverse: palette.white,
  onAccent: palette.navy950,
  onNavy: palette.parchment,

  accent: palette.gold600,
  accentStrong: palette.gold700,
  accentSoft: 'rgba(164,130,59,0.10)',
  accentBorder: 'rgba(164,130,59,0.32)',
  navy: palette.navy800,
  navyDeep: palette.navy900,

  success: palette.emerald,
  danger: palette.crimson,
  warning: palette.amber,
  info: palette.sapphire,
  plum: palette.plum,
  teal: palette.teal,

  skeletonBase: '#E9E5DC',
  skeletonHighlight: '#F7F4EE',
  overlay: 'rgba(5,10,22,0.45)',
  inputBg: palette.white,

  heroGradient: [palette.navy700, palette.navy800, palette.navy900],
  accentGradient: [palette.gold400, palette.gold600],
};

const darkColors: ThemeColors = {
  background: palette.navy950,
  backgroundAlt: palette.navy900,
  surface: palette.navy850,
  surfaceElevated: palette.navy800,
  surfaceSunken: '#070E1C',
  glass: 'rgba(12,23,42,0.72)',
  glassBorder: 'rgba(226,205,156,0.10)',
  border: 'rgba(142,163,198,0.14)',
  borderStrong: 'rgba(142,163,198,0.24)',
  divider: 'rgba(142,163,198,0.10)',

  text: palette.parchment,
  textSecondary: palette.navy300,
  textTertiary: '#6E7F9C',
  textInverse: palette.navy950,
  onAccent: palette.navy950,
  onNavy: palette.parchment,

  accent: palette.gold500,
  accentStrong: palette.gold400,
  accentSoft: 'rgba(194,161,90,0.12)',
  accentBorder: 'rgba(194,161,90,0.34)',
  navy: palette.navy700,
  navyDeep: palette.navy900,

  success: palette.emeraldLight,
  danger: palette.crimsonLight,
  warning: palette.amberLight,
  info: palette.sapphireLight,
  plum: palette.plumLight,
  teal: palette.tealLight,

  skeletonBase: '#111E34',
  skeletonHighlight: '#1A2A46',
  overlay: 'rgba(0,0,0,0.6)',
  inputBg: palette.navy850,

  heroGradient: [palette.navy700, palette.navy800, palette.navy900],
  accentGradient: [palette.gold400, palette.gold600],
};

function hexToRgba(hex: string, alpha: number) {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function withAlpha(color: string, alpha: number) {
  return color.startsWith('#') ? hexToRgba(color, alpha) : color;
}

function buildType(f: FontSet, c: ThemeColors, sys: boolean): Record<TypeVariant, TextStyle> {
  const w = (weight: TextStyle['fontWeight']) => (sys ? weight : undefined);
  return {
    display: { fontFamily: f.serif, fontSize: 31, lineHeight: 38, color: c.text, fontWeight: w('700'), letterSpacing: -0.3 },
    h1: { fontFamily: f.serif, fontSize: 26, lineHeight: 32, color: c.text, letterSpacing: -0.2, fontWeight: w('700') },
    h2: { fontFamily: f.serif, fontSize: 21, lineHeight: 27, color: c.text, fontWeight: w('700') },
    h3: { fontFamily: f.sansSemi, fontSize: 17, lineHeight: 23, color: c.text, fontWeight: w('600') },
    title: { fontFamily: f.sansSemi, fontSize: 15, lineHeight: 20, color: c.text, fontWeight: w('600') },
    body: { fontFamily: f.sans, fontSize: 14, lineHeight: 21, color: c.textSecondary },
    bodyStrong: { fontFamily: f.sansMedium, fontSize: 14, lineHeight: 21, color: c.text, fontWeight: w('500') },
    callout: { fontFamily: f.sansMedium, fontSize: 13, lineHeight: 18, color: c.textSecondary, fontWeight: w('500') },
    caption: { fontFamily: f.sans, fontSize: 12, lineHeight: 16, color: c.textTertiary },
    overline: {
      fontFamily: f.sansSemi,
      fontSize: 10.5,
      lineHeight: 14,
      letterSpacing: 1.4,
      textTransform: 'uppercase',
      color: c.textTertiary,
      fontWeight: w('700'),
    },
    mono: { fontFamily: fontFamilies.mono, fontSize: 12, lineHeight: 16, color: c.textSecondary },
    stat: { fontFamily: f.serif, fontSize: 24, lineHeight: 30, color: c.text, fontWeight: w('700') },
    statSm: { fontFamily: f.serifSemi, fontSize: 19, lineHeight: 24, color: c.text, fontWeight: w('600') },
  };
}

export function buildTheme(dark: boolean, fontsLoaded: boolean): Theme {
  const colors = dark ? darkColors : lightColors;
  const f: FontSet = fontsLoaded ? fontFamilies.loaded : fontFamilies.system;

  const shadow = (level: 1 | 2 | 3): ViewStyle => {
    const conf = {
      1: { h: 2, r: 6, o: dark ? 0.35 : 0.06, e: 2 },
      2: { h: 6, r: 14, o: dark ? 0.45 : 0.09, e: 5 },
      3: { h: 14, r: 28, o: dark ? 0.55 : 0.14, e: 10 },
    }[level];
    return Platform.select<ViewStyle>({
      ios: {
        shadowColor: dark ? '#000' : palette.navy900,
        shadowOffset: { width: 0, height: conf.h },
        shadowOpacity: conf.o,
        shadowRadius: conf.r,
      },
      default: { elevation: conf.e, shadowColor: dark ? '#000' : palette.navy900 },
    }) as ViewStyle;
  };

  const tone = (key: ToneKey) => {
    const map: Record<ToneKey, string> = {
      gold: colors.accent,
      navy: dark ? palette.navy300 : palette.navy600,
      success: colors.success,
      danger: colors.danger,
      warning: colors.warning,
      info: colors.info,
      plum: colors.plum,
      teal: colors.teal,
      neutral: colors.textTertiary,
    };
    const fg = map[key];
    return {
      fg,
      bg: withAlpha(fg, dark ? 0.14 : 0.1),
      border: withAlpha(fg, dark ? 0.32 : 0.26),
    };
  };

  return {
    dark,
    colors,
    spacing,
    radius,
    fonts: { ...f, mono: fontFamilies.mono },
    motion,
    type: buildType(f, colors, !fontsLoaded),
    shadow,
    tone,
  };
}
