import React from 'react';
import { Text as RNText, TextProps } from 'react-native';
import { styled } from 'nativewind';

const StyledText = styled(RNText);

interface CustomTextProps extends TextProps {
  variant?: 'h1' | 'h2' | 'h3' | 'body' | 'caption';
}

export default function Text({ variant = 'body', ...props }: CustomTextProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'h1':
        return 'text-3xl font-bold';
      case 'h2':
        return 'text-2xl font-semibold';
      case 'h3':
        return 'text-xl font-medium';
      case 'body':
        return 'text-base';
      case 'caption':
        return 'text-sm text-gray-500';
      default:
        return 'text-base';
    }
  };

  return <StyledText {...props} className={getVariantStyles()} />;
} 