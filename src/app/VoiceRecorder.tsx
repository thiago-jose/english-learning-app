import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  Animated,
} from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import Card from '../components/ui/Card';

interface VoiceRecorderProps {
  onTranscription: (text: string) => void;
}

export default function VoiceRecorder({ onTranscription }: VoiceRecorderProps) {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [permissionResponse, requestPermission] = Audio.usePermissions();
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    if (isRecording) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [isRecording]);

  const startRecording = async () => {
    try {
      if (permissionResponse?.status !== 'granted') {
        console.log('Requesting permission..');
        await requestPermission();
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      console.log('Starting recording..');
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      setIsRecording(true);
      console.log('Recording started');
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    console.log('Stopping recording..');
    setIsRecording(false);
    setIsProcessing(true);

    await recording.stopAndUnloadAsync();
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
    });

    const uri = recording.getURI();
    setRecording(null);

    if (uri) {
      await processAudioFile(uri);
    }

    setIsProcessing(false);
  };

  const processAudioFile = async (uri: string) => {
    try {
      // For now, we'll simulate speech-to-text processing
      // In a real implementation, you would:
      // 1. Upload the audio file to S3
      // 2. Use AWS Transcribe to convert speech to text
      // 3. Get the transcription result
      
      console.log('Processing audio file:', uri);
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // For testing, we'll use a mock transcription
      // In production, replace this with actual AWS Transcribe integration
      const mockTranscriptions = [
        "save this word: endeavor",
        "save this word: perseverance", 
        "save this word: serendipity",
        "save this word: eloquent",
        "save this word: resilient"
      ];
      
      const randomTranscription = mockTranscriptions[
        Math.floor(Math.random() * mockTranscriptions.length)
      ];
      
      console.log('Mock transcription:', randomTranscription);
      onTranscription(randomTranscription);
      
    } catch (error) {
      console.error('Error processing audio:', error);
      Alert.alert('Error', 'Failed to process audio recording');
    }
  };

  const handleRecordPress = async () => {
    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  };

  const getStatusText = () => {
    if (isRecording) {
      return 'Recording... Say "save this word: [word]"';
    } else if (isProcessing) {
      return 'Processing your voice...';
    } else {
      return 'Tap to start recording';
    }
  };

  const getStatusColor = () => {
    if (isRecording) {
      return 'text-danger-600';
    } else if (isProcessing) {
      return 'text-warning-600';
    } else {
      return 'text-gray-700';
    }
  };

  return (
    <Card variant="elevated" className="items-center">
      <Text className={`text-base text-center mb-5 font-medium ${getStatusColor()}`}>
        {getStatusText()}
      </Text>
      
      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <TouchableOpacity
          className={`
            w-20 h-20 rounded-full items-center justify-center shadow-lg
            ${isRecording ? 'bg-danger-500' : isProcessing ? 'bg-warning-500' : 'bg-primary-500'}
          `}
          onPress={handleRecordPress}
          disabled={isProcessing}
        >
          <Text className="text-3xl">
            {isRecording ? '🔴' : isProcessing ? '⏳' : '🎤'}
          </Text>
        </TouchableOpacity>
      </Animated.View>

      <Text className="text-sm text-gray-500 italic text-center mt-4">
        Example: "Save this word: endeavor"
      </Text>
    </Card>
  );
}