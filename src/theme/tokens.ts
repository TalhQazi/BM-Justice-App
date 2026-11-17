import { Platform } from 'react-native';

/**
 * Benchmark Justice design tokens.
 * Raw values only — screens and components should consume the semantic theme
 * from `useTheme()` rather than importing these directly.
 */

export const palette = {
  navy950: '#050A16',
  navy900: '#08111F',
  navy850: '#0C172A',
  navy800: '#112038',
  navy700: '#1A2D4D',
  navy600: '#253D66',
  navy500: '#3A5788',
  navy400: '#5C78A8',
  navy300: '#8EA3C6',
  navy100: '#DCE3EF',

  gold700: '#8A6C2C',
  gold600: '#A4823B',
  gold500: '#C2A15A',
  gold400: '#D2B676',
  gold300: '#E2CD9C',
  gold100: '#F5EDD9',

  ivory: '#F7F5F0',
  ivoryDeep: '#EEEAE1',
  white: '#FFFFFF',

  ink900: '#0B1528',
  ink700: '#334058',
  ink500: '#5E6A80',
  ink400: '#8892A5',
  ink300: '#AEB6C5',

  parchment: '#F2EEE4',
  parchmentDim: '#C6C0B2',

  emerald: '#3E9E77',
  emeraldLight: '#5CC197',
  crimson: '#C0525A',
  crimsonLight: '#E07A80',
  amber: '#C98F32',
  amberLight: '#E3B064',
  sapphire: '#4E73B5',
  sapphireLight: '#7F9FDA',
  plum: '#8366B0',
  plumLight: '#A88CD6',
  teal: '#3F96AE',
  tealLight: '#6CC0D6',
} as const;

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 44,
} as const;

export const radius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  pill: 999,
} as const;

export const fontFamilies = {
  loaded: {
    serif: 'PlayfairDisplay_700Bold',
    serifSemi: 'PlayfairDisplay_600SemiBold',
    serifItalic: 'PlayfairDisplay_400Regular_Italic',
    sans: 'Inter_400Regular',
    sansMedium: 'Inter_500Medium',
    sansSemi: 'Inter_600SemiBold',
    sansBold: 'Inter_700Bold',
  },
  // Fallback when custom fonts fail to load — keeps the app usable.
  system: {
    serif: Platform.select({ ios: 'Georgia', default: 'serif' }) as string,
    serifSemi: Platform.select({ ios: 'Georgia', default: 'serif' }) as string,
    serifItalic: Platform.select({ ios: 'Georgia-Italic', default: 'serif' }) as string,
    sans: undefined as unknown as string,
    sansMedium: undefined as unknown as string,
    sansSemi: undefined as unknown as string,
    sansBold: undefined as unknown as string,
  },
  mono: Platform.select({ ios: 'Menlo', default: 'monospace' }) as string,
};

export type FontSet = typeof fontFamilies.loaded;

export const motion = {
  fast: 160,
  base: 260,
  slow: 420,
  stagger: 55,
  maxStaggerItems: 10,
  spring: { damping: 18, stiffness: 220, mass: 0.9 },
  springSoft: { damping: 22, stiffness: 160, mass: 1 },
  springPress: { damping: 20, stiffness: 420, mass: 0.6 },
} as const;
