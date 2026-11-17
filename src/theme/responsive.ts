import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const CONTENT_MAX_WIDTH = 720;
export const TAB_BAR_HEIGHT = 64;

/** Responsive layout helpers shared across screens. */
export function useResponsive() {
  const { width, height, fontScale } = useWindowDimensions();
  const isCompact = width < 360;
  const isTablet = width >= 768;
  const gutter = isCompact ? 14 : isTablet ? 28 : 18;
  const contentWidth = Math.min(width, CONTENT_MAX_WIDTH) - gutter * 2;
  return {
    width,
    height,
    fontScale,
    isCompact,
    isTablet,
    gutter,
    contentWidth,
    /** Column count for stat / card grids. */
    gridColumns: isTablet ? 3 : 2,
  };
}

/** Bottom padding that keeps scroll content clear of the floating tab bar. */
export function useTabBarSpace() {
  const insets = useSafeAreaInsets();
  return TAB_BAR_HEIGHT + Math.max(insets.bottom, 12) + 28;
}
