import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';

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

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'beginner':
        return '#50C878';
      case 'intermediate':
        return '#F39C12';
      case 'advanced':
        return '#E74C3C';
      default:
        return '#95A5A6';
    }
  };

  const renderWordItem = ({ item }: { item: Word }) => (
    <TouchableOpacity style={styles.wordCard}>
      <View style={styles.wordHeader}>
        <Text style={styles.wordText}>{item.word}</Text>
        <View style={[
          styles.difficultyBadge,
          { backgroundColor: getDifficultyColor(item.difficulty) }
        ]}>
          <Text style={styles.difficultyText}>
            {item.difficulty || 'N/A'}
          </Text>
        </View>
      </View>
      
      <Text style={styles.meaningText}>{item.meaning}</Text>
      
      <View style={styles.exampleContainer}>
        <Text style={styles.exampleLabel}>Example:</Text>
        <Text style={styles.exampleText}>{item.usageExample}</Text>
      </View>
      
      {item.pronunciation && (
        <Text style={styles.pronunciationText}>
          🔊 {item.pronunciation}
        </Text>
      )}
      
      <View style={styles.wordFooter}>
        <Text style={styles.metaText}>
          Added: {formatDate(item.createdAt)}
        </Text>
        <Text style={styles.metaText}>
          Reviews: {item.reviewCount}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (words.length === 0 && !loading) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No words saved yet</Text>
        <Text style={styles.emptySubtext}>
          Use voice recording to add your first word!
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={words}
      renderItem={renderWordItem}
      keyExtractor={(item) => item.id}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.listContainer}
    />
  );
}

const styles = StyleSheet.create({
  listContainer: {
    paddingBottom: 20,
  },
  wordCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  wordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  wordText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    flex: 1,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  meaningText: {
    fontSize: 16,
    color: '#34495E',
    marginBottom: 12,
    lineHeight: 22,
  },
  exampleContainer: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  exampleLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7F8C8D',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  exampleText: {
    fontSize: 14,
    color: '#2C3E50',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  pronunciationText: {
    fontSize: 14,
    color: '#8E44AD',
    marginBottom: 8,
    fontWeight: '500',
  },
  wordFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#ECF0F1',
    paddingTop: 8,
  },
  metaText: {
    fontSize: 12,
    color: '#95A5A6',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#7F8C8D',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#95A5A6',
    textAlign: 'center',
  },
});