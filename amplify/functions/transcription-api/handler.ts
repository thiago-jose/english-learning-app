import type { APIGatewayProxyHandler } from 'aws-lambda';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

const lambdaClient = new LambdaClient({ region: process.env.AWS_REGION });

export const handler: APIGatewayProxyHandler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { action } = body;

    if (!action) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Action is required' }),
      };
    }

    // Map API actions to Lambda function actions
    const actionMapping: Record<string, string> = {
      'startTranscription': 'start',
      'getTranscriptionStatus': 'status',
      'processTranscription': 'process',
    };

    const lambdaAction = actionMapping[action];
    if (!lambdaAction) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid action' }),
      };
    }

    // Prepare payload for Lambda function
    const lambdaPayload = {
      ...body,
      action: lambdaAction,
      userId: event.requestContext?.authorizer?.claims?.sub || 'anonymous',
    };

    // Invoke the transcription Lambda function
    const invokeCommand = new InvokeCommand({
      FunctionName: process.env.TRANSCRIPTION_FUNCTION_NAME,
      Payload: JSON.stringify(lambdaPayload),
    });

    const lambdaResponse = await lambdaClient.send(invokeCommand);
    
    if (!lambdaResponse.Payload) {
      throw new Error('No response from transcription function');
    }

    const responsePayload = JSON.parse(new TextDecoder().decode(lambdaResponse.Payload));

    // Handle Lambda function errors
    if (responsePayload.errorType) {
      console.error('Lambda function error:', responsePayload);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Transcription service error',
          message: responsePayload.errorMessage || 'Unknown error',
        }),
      };
    }

    // Transform Lambda response to API response format
    const apiResponse = transformLambdaResponseToApi(responsePayload, action);

    return {
      statusCode: apiResponse.success ? 200 : 400,
      headers,
      body: JSON.stringify(apiResponse),
    };

  } catch (error) {
    console.error('API Gateway error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
    };
  }
};

function transformLambdaResponseToApi(lambdaResponse: any, originalAction: string) {
  if (!lambdaResponse.success) {
    return {
      success: false,
      error: lambdaResponse.error || 'Operation failed',
    };
  }

  switch (originalAction) {
    case 'startTranscription':
      return {
        success: true,
        jobName: lambdaResponse.jobName,
        status: lambdaResponse.status,
        message: 'Transcription job started successfully',
      };

    case 'getTranscriptionStatus':
      return {
        success: true,
        jobName: lambdaResponse.jobName,
        status: lambdaResponse.status,
        transcriptionText: lambdaResponse.transcriptionText,
        transcriptFileUri: lambdaResponse.transcriptFileUri,
        creationTime: lambdaResponse.creationTime,
        completionTime: lambdaResponse.completionTime,
      };

    case 'processTranscription':
      return {
        success: true,
        jobName: lambdaResponse.jobName,
        status: lambdaResponse.status,
        transcriptionText: lambdaResponse.transcriptionText,
        message: 'Transcription processed successfully',
      };

    default:
      return lambdaResponse;
  }
}