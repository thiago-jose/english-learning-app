import React from 'react';
import { View, Text } from 'react-native';

interface BadgeProps {
  text: string;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md';
  className?: string;
}

export default function Badge({ 
  text, 
  variant = 'default', 
  size = 'md',
  className = '' 
}: BadgeProps) {
  const getVariantClasses = () => {
    switch (variant) {
      case 'success':
        return 'bg-success-500';
      case 'warning':
        return 'bg-warning-500';
      case 'danger':
        return 'bg-danger-500';
      case 'info':
        return 'bg-primary-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-2 py-1';
      case 'md':
        return 'px-3 py-1.5';
      default:
        return 'px-3 py-1.5';
    }
  };

  const getTextSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'text-xs';
      case 'md':
        return 'text-sm';
      default:
        return 'text-sm';
    }
  };

  return (
    <View 
      className={`
        ${getVariantClasses()}
        ${getSizeClasses()}
        rounded-full
        ${className}
      `}
    >
      <Text className={`text-white font-medium ${getTextSizeClasses()} uppercase`}>
        {text}
      </Text>
    </View>
  );
}