import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { generateClient } from 'aws-amplify/data';
import { getCurrentUser } from 'aws-amplify/auth';
import type { Schema } from '../../amplify/data/resource';
import WordService from '../services/WordService';
import VoiceRecorder from './VoiceRecorder';
import WordList from './WordList';

const client = generateClient<Schema>();

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

export default function MainApp() {
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      const user = await getCurrentUser();
      setCurrentUser(user);
      await loadWords();
    } catch (error) {
      console.error('Error initializing app:', error);
    }
  };

  const loadWords = async () => {
    try {
      setLoading(true);
      const { data } = await client.models.Word.list();
      setWords(data as Word[]);
    } catch (error) {
      console.error('Error loading words:', error);
      Alert.alert('Error', 'Failed to load words');
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceInput = async (transcribedText: string) => {
    try {
      setLoading(true);
      
      // Process the transcribed text
      const wordData = await WordService.processSpeechInput(
        transcribedText,
        currentUser?.userId || 'anonymous'
      );
      
      if (wordData) {
        // Save to database
        const { data } = await client.models.Word.create({
          word: wordData.word,
          meaning: wordData.meaning,
          usageExample: wordData.usageExample,
          pronunciation: wordData.pronunciation,
          difficulty: wordData.difficulty as any,
          category: wordData.category,
          nextReviewDate: wordData.nextReviewDate,
          reviewCount: 0,
          correctCount: 0,
          createdAt: new Date().toISOString(),
          userId: currentUser?.userId || 'anonymous',
        });

        if (data) {
          setWords(prev => [data as Word, ...prev]);
          Alert.alert('Success', `Word "${wordData.word}" saved successfully!`);
        }
      }
    } catch (error) {
      console.error('Error processing voice input:', error);
      Alert.alert('Error', 'Failed to process voice input');
    } finally {
      setLoading(false);
    }
  };

  const handleTestHardcodedWord = async () => {
    try {
      setLoading(true);
      
      // Test with a hardcoded word
      const testInput = "save this word: endeavor";
      await handleVoiceInput(testInput);
    } catch (error) {
      console.error('Error testing hardcoded word:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>English Learning App</Text>
        <Text style={styles.subtitle}>
          {currentUser ? `Welcome, ${currentUser.username}` : 'Welcome!'}
        </Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Voice Input</Text>
          <VoiceRecorder onTranscription={handleVoiceInput} />
          
          <TouchableOpacity 
            style={styles.testButton}
            onPress={handleTestHardcodedWord}
            disabled={loading}
          >
            <Text style={styles.testButtonText}>
              Test with Hardcoded Word
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            My Words ({words.length})
          </Text>
          <WordList words={words} loading={loading} onRefresh={loadWords} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#4A90E2',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: 'white',
    opacity: 0.9,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  testButton: {
    backgroundColor: '#50C878',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  testButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});