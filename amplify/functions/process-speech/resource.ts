import { defineFunction } from '@aws-amplify/backend';

export const processSpeech = defineFunction({
  name: 'process-speech',
  entry: './handler.ts',
  environment: {
    BEDROCK_REGION: 'us-east-1',
  },
  runtime: 20,
  timeoutSeconds: 30,
});