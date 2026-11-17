import { palette } from './tokens';

/**
 * Legacy static palette, kept for backward compatibility with any external
 * imports. New code should use `useTheme().colors`, which follows light/dark mode.
 */
export const colors = {
  background: palette.navy950,
  bgNavy: palette.navy900,
  surface: palette.navy850,
  card: palette.navy850,
  cardElevated: palette.navy800,
  headerBg: palette.navy950,

  border: 'rgba(142,163,198,0.14)',
  borderLight: palette.navy700,
  borderGlow: 'rgba(194,161,90,0.4)',

  primary: palette.gold500,
  primaryBlue: palette.sapphireLight,
  primaryBlueHover: palette.sapphire,
  primarySoft: palette.gold300,
  positiveGreen: palette.emeraldLight,
  negativeRed: palette.crimsonLight,
  skyBlue: palette.tealLight,
  purple: palette.plumLight,
  gold: palette.gold500,
  cyan: palette.tealLight,

  brass: palette.gold500,
  brassLight: palette.gold300,

  text: palette.parchment,
  textPrimary: palette.parchment,
  textMuted: palette.navy300,
  textSubtle: '#6E7F9C',
  textDark: palette.navy950,

  success: palette.emeraldLight,
  warning: palette.amberLight,
  error: palette.crimsonLight,
  info: palette.sapphireLight,

  conservative: palette.crimsonLight,
  moderate: palette.gold500,
  liberal: palette.sapphireLight,
};
