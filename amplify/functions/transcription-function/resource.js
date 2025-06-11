import { defineFunction } from '@aws-amplify/backend';
export const transcriptionFunction = defineFunction({
    name: 'transcription-function',
    entry: './handler.ts',
    timeoutSeconds: 300, // 5 minutes timeout for processing
    memoryMB: 512,
});
