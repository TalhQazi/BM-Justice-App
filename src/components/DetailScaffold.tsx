import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, SearchX } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeProvider';
import { CONTENT_MAX_WIDTH, useResponsive } from '../theme/responsive';
import {
  AppText,
  Button,
  EmptyState,
  HEADER_BAR_HEIGHT,
  HeaderAction,
  ScreenHeader,
  SkeletonProfile,
  enterFade,
} from './ui';

interface DetailScaffoldProps {
  title?: string;
  loading: boolean;
  loadingLabel?: string;
  notFound?: boolean;
  notFoundTitle?: string;
  headerActions?: HeaderAction[];
  children?: React.ReactNode;
}

/**
 * Shared layout for profile & case-detail screens: frosted scroll-reveal
 * header, skeleton loading state, not-found state and responsive content.
 */
export function DetailScaffold({
  title,
  loading,
  loadingLabel,
  notFound,
  notFoundTitle = 'Record not found.',
  headerActions,
  children,
}: DetailScaffoldProps) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { gutter } = useResponsive();
  const scrollY = useSharedValue(0);

  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });

  const contentStyle = {
    paddingTop: insets.top + HEADER_BAR_HEIGHT + 8,
    paddingBottom: insets.bottom + 40,
    paddingHorizontal: gutter,
    width: '100%' as const,
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: 'center' as const,
  };

  return (
    <View style={[styles.root, { backgroundColor: t.colors.background }]}>
      <ScreenHeader
        title={title}
        scrollY={scrollY}
        revealAt={200}
        solid={loading || notFound}
        actions={loading || notFound ? [] : headerActions}
      />

      {loading ? (
        <Animated.ScrollView contentContainerStyle={contentStyle} scrollEnabled={false}>
          <SkeletonProfile />
          {loadingLabel ? (
            <AppText variant="caption" align="center" style={{ marginTop: 16 }}>
              {loadingLabel}
            </AppText>
          ) : null}
        </Animated.ScrollView>
      ) : notFound ? (
        <Animated.View entering={enterFade()} style={[styles.center, { paddingTop: insets.top + HEADER_BAR_HEIGHT }]}>
          <EmptyState
            icon={SearchX}
            title={notFoundTitle}
            message="The record may have been removed or is temporarily unavailable."
            action={<Button label="Return to Search" icon={ArrowLeft} variant="secondary" onPress={() => navigation.goBack()} />}
          />
        </Animated.View>
      ) : (
        <Animated.ScrollView
          onScroll={onScroll}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[contentStyle, { gap: 18 }]}
        >
          {children}
        </Animated.ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
});
