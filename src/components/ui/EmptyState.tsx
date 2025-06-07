import React from 'react';
import { View, Text } from 'react-native';

interface EmptyStateProps {
  title: string;
  subtitle?: string;
  icon?: string;
  className?: string;
}

export default function EmptyState({ 
  title, 
  subtitle, 
  icon = '📚',
  className = '' 
}: EmptyStateProps) {
  return (
    <View className={`items-center justify-center py-12 px-6 ${className}`}>
      <Text className="text-4xl mb-4">{icon}</Text>
      <Text className="text-lg font-semibold text-gray-700 text-center mb-2">
        {title}
      </Text>
      {subtitle && (
        <Text className="text-base text-gray-500 text-center leading-6">
          {subtitle}
        </Text>
      )}
    </View>
  );
}