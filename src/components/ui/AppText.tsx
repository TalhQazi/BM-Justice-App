import React from 'react';
import { Text, TextProps, TextStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import type { TypeVariant } from '../../theme/themes';

export interface AppTextProps extends TextProps {
  variant?: TypeVariant;
  color?: string;
  align?: TextStyle['textAlign'];
  children?: React.ReactNode;
}

/** Typography primitive — every piece of text in the app goes through this. */
export function AppText({ variant = 'body', color, align, style, ...rest }: AppTextProps) {
  const theme = useTheme();
  return (
    <Text
      maxFontSizeMultiplier={1.4}
      {...rest}
      style={[theme.type[variant], color ? { color } : null, align ? { textAlign: align } : null, style]}
    />
  );
}
