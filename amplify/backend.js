/* import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';
import { transcriptionApi } from './functions/transcription-api/resource';
import { transcriptionFunction } from './functions/transcription-function/resource';
import { transcriptionApiGateway } from './functions/api/resource'; */
import { auth } from './auth/resource.js';
import { data } from './data/resource.js';
import { storage } from './storage/resource.js';
import { transcriptionApi } from './functions/transcription-api/resource.js';
import { transcriptionFunction } from './functions/transcription-function/resource.js';
import { createTranscriptionApi } from './functions/api/resource.js';

/**
 * @see https://docs.amplify.aws/react/build-a-backend/ to add storage, functions, and more
 */
export const backend = defineBackend({
    auth,
    data,
    storage,
    transcriptionApi,
    transcriptionFunction,
});
// Get references to the resources
/* const { transcriptionFunction: transcriptionLambda } = backend;
const { transcriptionApi: apiFunction } = backend;
const { storage: s3Storage } = backend; */
// Create REST API Gateway using the dedicated API resource
const api = transcriptionApiGateway(backend);
// Grant the transcription function permissions to access Transcribe and S3
/* transcriptionLambda.resources.lambda.addToRolePolicy(new PolicyStatement({
  effect: Effect.ALLOW,
  actions: [
    'transcribe:StartTranscriptionJob',
    'transcribe:GetTranscriptionJob',
    'transcribe:ListTranscriptionJobs',
  ],
  resources: ['*'],
}));

transcriptionLambda.resources.lambda.addToRolePolicy(new PolicyStatement({
  effect: Effect.ALLOW,
  actions: [
    's3:GetObject',
    's3:PutObject',
    's3:DeleteObject',
  ],
  resources: [
    `${s3Storage.resources.bucket.bucketArn}/*`,
  ],
}));

transcriptionLambda.resources.lambda.addToRolePolicy(new PolicyStatement({
  effect: Effect.ALLOW,
  actions: [
    's3:ListBucket',
  ],
  resources: [s3Storage.resources.bucket.bucketArn],
})); */
// Grant the API function permission to invoke the transcription function
/* apiFunction.resources.lambda.addToRolePolicy(new PolicyStatement({
  effect: Effect.ALLOW,
  actions: [
    'lambda:InvokeFunction',
  ],
  resources: [transcriptionLambda.resources.lambda.functionArn],
})); */
// Set environment variables
/* transcriptionLambda.addEnvironment('STORAGE_BUCKET_NAME', s3Storage.resources.bucket.bucketName);
apiFunction.addEnvironment('TRANSCRIPTION_FUNCTION_NAME', transcriptionLambda.resources.lambda.functionName);
 */
// Export the API URL for use in the frontend
/* backend.addOutput({
  custom: {
    transcriptionApiUrl: api.url,
    transcriptionApiId: api.restApiId,
  },
}); */
// Add any additional backend configuration here
const { cfnUserPool } = backend.auth.resources.cfnResources;
if (cfnUserPool) {
    cfnUserPool.policies = {
        passwordPolicy: {
            minimumLength: 8,
            requireLowercase: true,
            requireNumbers: true,
            requireSymbols: true,
            requireUppercase: true,
        },
    };
}
