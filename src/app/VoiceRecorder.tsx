import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Animated,
} from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

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

  return (
    <View style={styles.container}>
      <Text style={styles.instruction}>
        {isRecording 
          ? 'Recording... Say "save this word: [word]"' 
          : isProcessing
          ? 'Processing your voice...'
          : 'Tap to start recording'}
      </Text>
      
      <Animated.View style={[
        styles.recordButtonContainer,
        { transform: [{ scale: pulseAnim }] }
      ]}>
        <TouchableOpacity
          style={[
            styles.recordButton,
            isRecording && styles.recordButtonActive,
            isProcessing && styles.recordButtonProcessing,
          ]}
          onPress={handleRecordPress}
          disabled={isProcessing}
        >
          <Text style={styles.recordButtonText}>
            {isRecording ? '🔴' : isProcessing ? '⏳' : '🎤'}
          </Text>
        </TouchableOpacity>
      </Animated.View>

      <Text style={styles.hint}>
        Example: "Save this word: endeavor"
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  instruction: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
    fontWeight: '500',
  },
  recordButtonContainer: {
    marginBottom: 15,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  recordButtonActive: {
    backgroundColor: '#E74C3C',
  },
  recordButtonProcessing: {
    backgroundColor: '#F39C12',
  },
  recordButtonText: {
    fontSize: 30,
  },
  hint: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
  },
});