import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
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
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';

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

interface TranscriptionResult {
  text: string;
  jobName: string;
  audioFileName: string;
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

  const handleVoiceInput = async (result: TranscriptionResult) => {
    setLoading(true);
    try {
      // Process the transcribed text
      const wordData = await WordService.processSpeechInput(
        result.text,
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
          Alert.alert('Success', `Word "${data.word}" saved successfully!`);
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
      const testInput = "save this word: endeavor";
      await handleVoiceInput({
        text: testInput,
        jobName: 'test-job',
        audioFileName: 'test-audio.m4a'
      });
    } catch (error) {
      console.error('Error testing hardcoded word:', error);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-primary-500 px-5 py-6">
        <Text className="text-2xl font-bold text-white text-center mb-1">
          English Learning App
        </Text>
        <Text className="text-base text-primary-100 text-center">
          {currentUser ? `Welcome, ${currentUser.username}` : 'Welcome!'}
        </Text>
      </View>

      <ScrollView className="flex-1 px-5 py-5">
        {/* Voice Input Section */}
        <View className="mb-8">
          <Text className="text-xl font-bold text-gray-800 mb-4">
            Voice Input
          </Text>
          <VoiceRecorder onTranscription={handleVoiceInput} />
          
          <Button
            title="Test with Hardcoded Word"
            onPress={handleTestHardcodedWord}
            variant="success"
            disabled={loading}
            loading={loading}
            className="mt-3"
          />
        </View>

        {/* Words Section */}
        <View className="mb-8">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-xl font-bold text-gray-800">
              My Words
            </Text>
            <View className="bg-primary-100 px-3 py-1 rounded-full">
              <Text className="text-primary-700 font-semibold text-sm">
                {words.length}
              </Text>
            </View>
          </View>
          
          {loading && words.length === 0 ? (
            <LoadingSpinner className="py-8" />
          ) : (
            <WordList words={words} loading={loading} onRefresh={loadWords} />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}