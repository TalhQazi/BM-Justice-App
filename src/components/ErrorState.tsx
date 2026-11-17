import React, { useEffect } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { CloudOff, RefreshCw, SearchX, Timer } from 'lucide-react-native';
import { ApiError, errorMessage } from '../services/http';
import { Button, EmptyState } from './ui';

/** Plain-language copy for any data-loading failure (no technical details). */
export function friendlyError(error: unknown) {
  if (error instanceof ApiError && error.status === 404) {
    return { title: 'Not found', message: 'This record isn’t available right now.', icon: SearchX, retry: false };
  }
  if (error instanceof ApiError && error.status === 429) {
    return { title: 'Almost there', message: 'This is taking a little longer than usual. Please try again in a moment.', icon: Timer, retry: true };
  }
  if (error instanceof ApiError && error.status === 0) {
    return { title: 'You’re offline', message: 'Check your internet connection and try again.', icon: CloudOff, retry: true };
  }
  return { title: 'Couldn’t load this right now', message: 'Please try again in a moment.', icon: CloudOff, retry: true };
}

/** Friendly error state with retry. Technical details are logged for developers only. */
export function ErrorState({
  error,
  onRetry,
  style,
}: {
  error: unknown;
  onRetry?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  useEffect(() => {
    if (__DEV__ && error) console.warn('[data]', errorMessage(error));
  }, [error]);

  const f = friendlyError(error);
  return (
    <EmptyState
      icon={f.icon}
      title={f.title}
      message={f.message}
      action={
        onRetry && f.retry ? <Button label="Try again" icon={RefreshCw} variant="secondary" size="sm" onPress={onRetry} /> : undefined
      }
      style={style}
    />
  );
}
