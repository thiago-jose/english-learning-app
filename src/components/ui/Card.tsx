import React from 'react';
import { View, ViewProps } from 'react-native';
import { styled } from 'nativewind';

const StyledView = styled(View);

interface CardProps extends ViewProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated';
}

export default function Card({ children, variant = 'default', ...props }: CardProps) {
  return (
    <StyledView
      {...props}
      className={`p-4 rounded-lg bg-white ${
        variant === 'elevated' ? 'shadow-lg' : 'border border-gray-200'
      }`}
    >
      {children}
    </StyledView>
  );
} 