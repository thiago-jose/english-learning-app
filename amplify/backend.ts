import { PolicyStatement, Effect } from "aws-cdk-lib/aws-iam";
import { RestApi, LambdaIntegration, Cors } from 'aws-cdk-lib/aws-apigateway';
import { defineBackend } from '@aws-amplify/backend';
import { Stack } from "aws-cdk-lib";
import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';
import { transcriptionApi } from './functions/transcription-api/resource';
import { transcriptionFunction } from './functions/transcription-function/resource';

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

// create a new API stack
const apiStack = backend.createStack("api-stack");

// create a new REST API
const myRestApi = new RestApi(apiStack, "RestApi", {
  restApiName: "Transcription-Service",
  description: 'API for audio transcription using AWS Transcribe',
  deploy: true,  
  defaultCorsPreflightOptions: {
    allowOrigins: Cors.ALL_ORIGINS, // Restrict this to domains you trust
    allowMethods: Cors.ALL_METHODS, // Specify only the methods you need to allow
    allowHeaders: Cors.DEFAULT_HEADERS, // Specify only the headers you need to allow
    /* allowHeaders: [
      'Content-Type',
      'X-Amz-Date', 
      'Authorization',
      'X-Api-Key',
      'X-Amz-Security-Token',
      'X-Amz-User-Agent'
    ], */
  },
});

// Do the Lambda integration here in backend.ts
const transcribeIntegration = new LambdaIntegration(backend.transcriptionApi.resources.lambda);

const transcribeResource = myRestApi.root.addResource('transcribe');
transcribeResource.addMethod('POST', transcribeIntegration);

// Get references to the resources
const { transcriptionFunction: transcriptionLambda } = backend;
const { transcriptionApi: apiFunction } = backend;
const { storage: s3Storage } = backend;

// Grant the transcription function permissions to access Transcribe and S3
transcriptionLambda.resources.lambda.addToRolePolicy(new PolicyStatement({
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
}));

// Grant the API function permission to invoke the transcription function
apiFunction.resources.lambda.addToRolePolicy(new PolicyStatement({
  effect: Effect.ALLOW,
  actions: [
    'lambda:InvokeFunction',
  ],
  resources: [transcriptionLambda.resources.lambda.functionArn],
}));

// Set environment variables
transcriptionLambda.addEnvironment('STORAGE_BUCKET_NAME', s3Storage.resources.bucket.bucketName);
apiFunction.addEnvironment('TRANSCRIPTION_FUNCTION_NAME', transcriptionLambda.resources.lambda.functionName);

// Export the API URL for use in the frontend
backend.addOutput({
  custom: {
    API: {
      [myRestApi.restApiName]: {
        endpoint: myRestApi.url,
        region: Stack.of(myRestApi).region,
        apiName: myRestApi.restApiName,
      },
    }
  },
});

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