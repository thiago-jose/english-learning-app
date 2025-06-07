import { uploadData, remove } from 'aws-amplify/storage';
import { 
  TranscribeClient, 
  StartTranscriptionJobCommand, 
  GetTranscriptionJobCommand, 
  TranscriptionJobStatus,
  LanguageCode
} from '@aws-sdk/client-transcribe';
import { Amplify } from 'aws-amplify';

// Types
interface TranscriptionResult {
  text: string;
  jobName: string;
  audioFileName: string;
}

interface TranscribeOptions {
  languageCode?: LanguageCode;
  maxRetries?: number;
  pollingInterval?: number;
}

// Custom error types
class TranscribeError extends Error {
  constructor(message: string, public readonly originalError?: Error) {
    super(message);
    this.name = 'TranscribeError';
  }
}

class TranscriptionJobError extends TranscribeError {
  constructor(message: string, public readonly jobName: string, originalError?: Error) {
    super(message, originalError);
    this.name = 'TranscriptionJobError';
  }
}

class TranscribeService {
  private transcribeClient: TranscribeClient;
  private readonly defaultOptions: TranscribeOptions = {
    languageCode: LanguageCode.EN_US,
    maxRetries: 3,
    pollingInterval: 2000,
  };
  private readonly bucketName: string;
  private readonly region: string;

  constructor() {
    // Get configuration from environment variables
    this.bucketName = process.env.AWS_USER_FILES_S3_BUCKET || 'your-bucket-name';
    this.region = process.env.AWS_REGION || 'us-east-1';
    
    this.transcribeClient = new TranscribeClient({
      region: this.region,
    });
  }

  private async uploadAudioFile(audioUri: string): Promise<string> {
    try {
      const fileName = `audio-${Date.now()}.m4a`;
      const response = await fetch(audioUri);
      const blob = await response.blob();
      
      await uploadData({
        key: fileName,
        data: blob,
        options: {
          contentType: 'audio/m4a',
          bucket: this.bucketName,
        }
      });

      return fileName;
    } catch (error) {
      throw new TranscribeError('Failed to upload audio file', error as Error);
    }
  }

  private async startTranscriptionJob(fileName: string, options: TranscribeOptions): Promise<string> {
    try {
      const jobName = `transcription-${Date.now()}`;
      const startCommand = new StartTranscriptionJobCommand({
        TranscriptionJobName: jobName,
        LanguageCode: options.languageCode || LanguageCode.EN_US,
        Media: {
          MediaFileUri: `s3://${this.bucketName}/${fileName}`,
        },
        OutputBucketName: this.bucketName,
      });

      await this.transcribeClient.send(startCommand);
      return jobName;
    } catch (error) {
      throw new TranscriptionJobError('Failed to start transcription job', '', error as Error);
    }
  }

  private async waitForTranscriptionCompletion(jobName: string, options: TranscribeOptions): Promise<string> {
    let attempts = 0;
    const maxAttempts = options.maxRetries || this.defaultOptions.maxRetries!;

    while (attempts < maxAttempts) {
      try {
        const getCommand = new GetTranscriptionJobCommand({
          TranscriptionJobName: jobName,
        });

        const result = await this.transcribeClient.send(getCommand);
        const status = result.TranscriptionJob?.TranscriptionJobStatus;

        if (status === TranscriptionJobStatus.COMPLETED) {
          return result.TranscriptionJob?.Transcript?.TranscriptFileUri || '';
        } else if (status === TranscriptionJobStatus.FAILED) {
          throw new TranscriptionJobError('Transcription job failed', jobName);
        }

        await new Promise(resolve => 
          setTimeout(resolve, options.pollingInterval || this.defaultOptions.pollingInterval)
        );
        attempts++;
      } catch (error) {
        if (attempts === maxAttempts - 1) {
          throw new TranscriptionJobError('Failed to get transcription result', jobName, error as Error);
        }
        attempts++;
      }
    }

    throw new TranscriptionJobError('Transcription job timed out', jobName);
  }

  private async cleanupFiles(fileName: string, jobName: string): Promise<void> {
    try {
      await Promise.all([
        remove({
          key: fileName,
          options: { bucket: this.bucketName }
        }),
        remove({
          key: `${jobName}.json`,
          options: { bucket: this.bucketName }
        })
      ]);
    } catch (error) {
      console.warn('Failed to cleanup files:', error);
      // Don't throw here as this is a cleanup operation
    }
  }

  async transcribeAudio(audioUri: string, options: Partial<TranscribeOptions> = {}): Promise<TranscriptionResult> {
    const mergedOptions = { ...this.defaultOptions, ...options };
    let audioFileName = '';
    let jobName = '';

    try {
      // 1. Upload audio file
      audioFileName = await this.uploadAudioFile(audioUri);

      // 2. Start transcription job
      jobName = await this.startTranscriptionJob(audioFileName, mergedOptions);

      // 3. Wait for completion
      const transcription = await this.waitForTranscriptionCompletion(jobName, mergedOptions);

      return {
        text: transcription,
        jobName,
        audioFileName,
      };
    } catch (error) {
      // Cleanup on error
      if (audioFileName || jobName) {
        await this.cleanupFiles(audioFileName, jobName);
      }
      throw error;
    } finally {
      // Always cleanup
      if (audioFileName || jobName) {
        await this.cleanupFiles(audioFileName, jobName);
      }
    }
  }
}

export default new TranscribeService(); 