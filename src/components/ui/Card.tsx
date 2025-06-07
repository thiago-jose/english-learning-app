import React from 'react';
import { View, ViewProps } from 'react-native';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined';
  className?: string;
}

export default function Card({ 
  children, 
  variant = 'default', 
  className = '',
  ...props 
}: CardProps) {
  const getVariantClasses = () => {
    switch (variant) {
      case 'elevated':
        return 'bg-white shadow-lg shadow-black/10';
      case 'outlined':
        return 'bg-white border border-gray-200';
      default:
        return 'bg-white shadow-md shadow-black/5';
    }
  };

  return (
    <View 
      className={`
        ${getVariantClasses()}
        rounded-xl
        p-4
        ${className}
      `}
      {...props}
    >
      {children}
    </View>
  );
}