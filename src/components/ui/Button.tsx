import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className = '',
}: ButtonProps) {
  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'bg-primary-500 active:bg-primary-600';
      case 'secondary':
        return 'bg-gray-500 active:bg-gray-600';
      case 'success':
        return 'bg-success-500 active:bg-success-600';
      case 'warning':
        return 'bg-warning-500 active:bg-warning-600';
      case 'danger':
        return 'bg-danger-500 active:bg-danger-600';
      default:
        return 'bg-primary-500 active:bg-primary-600';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-2';
      case 'md':
        return 'px-4 py-3';
      case 'lg':
        return 'px-6 py-4';
      default:
        return 'px-4 py-3';
    }
  };

  const getTextSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'text-sm';
      case 'md':
        return 'text-base';
      case 'lg':
        return 'text-lg';
      default:
        return 'text-base';
    }
  };

  return (
    <TouchableOpacity
      className={`
        ${getVariantClasses()}
        ${getSizeClasses()}
        rounded-lg
        items-center
        justify-center
        flex-row
        ${disabled || loading ? 'opacity-50' : 'opacity-100'}
        ${className}
      `}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading && (
        <ActivityIndicator 
          size="small" 
          color="white" 
          className="mr-2"
        />
      )}
      <Text className={`text-white font-semibold ${getTextSizeClasses()}`}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}