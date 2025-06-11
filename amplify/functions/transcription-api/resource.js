import { defineFunction } from '@aws-amplify/backend';
export const transcriptionApi = defineFunction({
    name: 'transcription-api',
    entry: './handler.ts',
    /* environment: {
      TRANSCRIPTION_FUNCTION_NAME: process.env.TRANSCRIPTION_FUNCTION_NAME || '',
    }, */
});
