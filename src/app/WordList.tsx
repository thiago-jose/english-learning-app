import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';

interface Word {
  id: string;
  word: string;
  meaning: string;
  usageExample: string;
  pronunciation?: string;
  difficulty?: string;
  category?: string;
  nextReviewDate: string;
  reviewCount: number;
  correctCount: number;
  createdAt: string;
}

interface WordListProps {
  words: Word[];
  loading: boolean;
  onRefresh: () => void;
}

export default function WordList({ words, loading, onRefresh }: WordListProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getDifficultyVariant = (difficulty?: string): 'success' | 'warning' | 'danger' | 'default' => {
    switch (difficulty?.toLowerCase()) {
      case 'beginner':
        return 'success';
      case 'intermediate':
        return 'warning';
      case 'advanced':
        return 'danger';
      default:
        return 'default';
    }
  };

  const renderWordItem = ({ item }: { item: Word }) => (
    <TouchableOpacity activeOpacity={0.7} className="mb-3">
      <Card variant="elevated">
        {/* Word Header */}
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-xl font-bold text-gray-900">{item.word}</Text>
          {item.pronunciation && (
            <Text className="text-sm text-gray-500 italic">{item.pronunciation}</Text>
          )}
        </View>

        {/* Meaning and Example */}
        <View className="mb-3">
          <Text className="text-base text-gray-700 mb-1">{item.meaning}</Text>
          {item.usageExample && (
            <Text className="text-sm text-gray-500 italic">"{item.usageExample}"</Text>
          )}
        </View>

        {/* Tags and Stats */}
        <View className="flex-row flex-wrap gap-2 mb-2">
          {item.difficulty && (
            <Badge 
              text={item.difficulty}
              variant={getDifficultyVariant(item.difficulty)}
            />
          )}
          {item.category && (
            <Badge 
              text={item.category}
              variant="default"
            />
          )}
        </View>

        {/* Review Stats */}
        <View className="flex-row justify-between items-center">
          <View className="flex-row gap-4">
            <Text className="text-sm text-gray-500">
              Reviews: {item.reviewCount}
            </Text>
            <Text className="text-sm text-gray-500">
              Correct: {item.correctCount}
            </Text>
          </View>
          <Text className="text-sm text-gray-500">
            Next: {formatDate(item.nextReviewDate)}
          </Text>
        </View>
      </Card>
    </TouchableOpacity>
  );

  return (
    <FlatList
      data={words}
      renderItem={renderWordItem}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ padding: 16 }}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={onRefresh} />
      }
      ListEmptyComponent={
        <EmptyState
          title="No Words Yet"
          subtitle="Start adding words to build your vocabulary"
        />
      }
    />
  );
}