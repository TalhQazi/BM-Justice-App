import { FadeIn, FadeInDown, FadeInUp, FadeOut } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { motion } from '../../theme/tokens';

/**
 * Staggered slide-up entrance. Delay is capped so long lists never feel slow
 * and items beyond the first screen appear immediately.
 */
export function enterUp(index = 0, baseDelay = 0) {
  const step = Math.min(index, motion.maxStaggerItems);
  return FadeInDown.delay(baseDelay + step * motion.stagger)
    .duration(motion.slow)
    .springify()
    .damping(20)
    .stiffness(180);
}

export function enterFade(delay = 0) {
  return FadeIn.delay(delay).duration(motion.base);
}

export function enterFromBottom(delay = 0) {
  return FadeInUp.delay(delay).duration(motion.slow);
}

export const exitFade = FadeOut.duration(motion.fast);

export const haptic = {
  selection() {
    Haptics.selectionAsync().catch(() => {});
  },
  light() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  },
  success() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  },
  error() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
  },
};
