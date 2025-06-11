import { uploadData, getUrl } from 'aws-amplify/storage';
import { generateClient } from 'aws-amplify/data';
import { post } from 'aws-amplify/api';
import type { Schema } from '../../amplify/data/resource';

const client = generateClient<Schema>();

// Types
export interface TranscriptionResult {
  text: string;
  jobName: string;
  audioFileName: string;
}

interface TranscribeOptions {
  languageCode?: string;
  maxRetries?: number;
  pollingInterval?: number;
}

class TranscribeError extends Error {
  constructor(message: string, public originalError?: Error) {
    super(message);
    this.name = 'TranscribeError';
  }
}

export class TranscribeService {
  private readonly defaultOptions: TranscribeOptions = {
    languageCode: 'en-US',
    maxRetries: 15,
    pollingInterval: 2000,
  };

  private async uploadAudioFile(audioUri: string): Promise<string> {
    try {
      const fileName = `audio-files/audio-${Date.now()}.m4a`;
      const response = await fetch(audioUri);
      const blob = await response.blob();      
      
      await uploadData({
        path: fileName,
        data: blob,
        options: {
          contentType: 'audio/m4a'
        }
      });

      // it seems the uploadData may be async
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      return fileName;
    } catch (error) {
      throw new TranscribeError('Failed to upload audio file', error as Error);
    }
  }

  /* private async startTranscriptionJob(fileName: string, options: TranscribeOptions): Promise<string> {
    try {
      const jobName = `transcription-${Date.now()}`;      

      const response = await post({
        apiName: 'Transcription-Service',
        path: '/transcribe',
        options: {
          body: {
            action: "startTranscription",
            audioFileKey: fileName,
            jobName,
            languageCode: options.languageCode || 'en-US',
          },
        },
      });

      const responseData = await response.response as unknown as Response;
      const jsonData = await responseData.json();
      console.log('Transcription job response:', jsonData);
      
      if (!jsonData.jobName) {
        throw new TranscribeError('Failed to start transcription job');
      }

      return jsonData.jobName;
    } catch (error) {
      console.error('Start transcription job error:', error);
      throw new TranscribeError('Failed to start transcription job', error as Error);
    }
  } */

    private async startTranscriptionJob(fileName: string, options: TranscribeOptions): Promise<string> {
      try {
        const jobName = `transcription-${Date.now()}`;      
        const endpoint = 'https://iruqxtjjnh.execute-api.us-east-1.amazonaws.com/prod';
    
        const response = await fetch(`${endpoint}/transcribe`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: "startTranscription",
            audioFileKey: fileName,
            jobName,
            languageCode: options.languageCode || 'en-US',
          }),
        });
    
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
    
        const jsonData = await response.json();
        console.log('Transcription job response:', jsonData);
        
        if (!jsonData.jobName) {
          throw new TranscribeError('Failed to start transcription job');
        }
    
        return jsonData.jobName;
      } catch (error) {
        console.error('Start transcription job error:', error);
        throw new TranscribeError('Failed to start transcription job', error as Error);
      }
    }
/* 
  private async pollTranscriptionStatus(jobName: string, options: TranscribeOptions): Promise<string> {
    const maxAttempts = options.maxRetries || this.defaultOptions.maxRetries || 5;
    const interval = options.pollingInterval || this.defaultOptions.pollingInterval || 2000;
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        const response = await post({
          apiName: "Transcription-Service",
          path: "/transcribe",
          options: {
            body: {
              action: "getTranscriptionStatus",
              jobName
            },
          },
        });

        const responseData = await response.response as unknown as Response;
        const jsonData = await responseData.json();
        console.log('Status check response:', jsonData);
        
        if (jsonData.status === 'COMPLETED') {
          return jsonData.text;
        } else if (jsonData.status === 'FAILED') {
          throw new TranscribeError(`Transcription job failed: ${jsonData.error || 'Unknown error'}`);
        }

        attempts++;
        await new Promise(resolve => setTimeout(resolve, interval));
      } catch (error) {
        console.error('Status check error:', error);
        throw new TranscribeError('Failed to check transcription status', error as Error);
      }
    }

    throw new TranscribeError('Transcription job timed out');
  } */

  private async pollTranscriptionStatus(jobName: string, options: TranscribeOptions): Promise<string> {
    const maxAttempts = options.maxRetries || this.defaultOptions.maxRetries || 5;
    const interval = options.pollingInterval || this.defaultOptions.pollingInterval || 2000;
    let attempts = 0;
    const endpoint = 'https://iruqxtjjnh.execute-api.us-east-1.amazonaws.com/prod';
  
    while (attempts < maxAttempts) {
      try {
        const response = await fetch(`${endpoint}/transcribe`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: "getTranscriptionStatus", 
            jobName }),
        });
  
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
  
        const jsonData = await response.json();
        console.log('Status check response:', jsonData);
        
        if (jsonData.status === 'COMPLETED') {
          return jsonData.text;
        } else if (jsonData.status === 'FAILED') {
          throw new TranscribeError(`Transcription job failed: ${jsonData.error || 'Unknown error'}`);
        }
  
        attempts++;
        await new Promise(resolve => setTimeout(resolve, interval));
      } catch (error) {
        console.error('Status check error:', error);
        throw new TranscribeError('Failed to check transcription status', error as Error);
      }
    }
  
    throw new TranscribeError('Transcription job timed out');
  }

  async transcribeAudio(audioUri: string, options: Partial<TranscribeOptions> = {}): Promise<TranscriptionResult> {
    const mergedOptions = { ...this.defaultOptions, ...options };
    
    try {
      // Upload audio file
      const fileName = await this.uploadAudioFile(audioUri);
      console.log(`audio file name: ${fileName}`);
      
      // Start transcription job
      const jobName = await this.startTranscriptionJob(fileName, mergedOptions);
      console.log(`transcription job name: ${jobName}`);
      
      // Wait for completion and get result
      const text = await this.pollTranscriptionStatus(jobName, mergedOptions);
      console.log(`transcripted text: ${text}`);
      
      return {
        text,
        jobName,
        audioFileName: fileName
      };
    } catch (error) {
      console.error('Transcription error details:', error);
      if (error instanceof TranscribeError) {
        throw error;
      }
      throw new TranscribeError('Transcription failed', error as Error);
    }
  }
}

export default new TranscribeService(); 