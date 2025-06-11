import { registerRootComponent } from 'expo';
import { Amplify } from 'aws-amplify';
import { parseAmplifyConfig } from "aws-amplify/utils";
import outputs from './amplify_outputs.json';

import App from './App';

// Log environment variables for debugging
console.log('Environment variables loaded directly from process.env:', {
  AWS_REGION: process.env.EXPO_PUBLIC_AWS_REGION,
  STORAGE_BUCKET_NAME: process.env.EXPO_PUBLIC_STORAGE_BUCKET_NAME
});

// Configure Amplify with explicit REST API configuration
const amplifyConfig = {
  ...outputs,
  API: {
    REST: {
      'Transcription-Service': {
        endpoint: outputs.custom.API['Transcription-Service'].endpoint,
        region: outputs.custom.API['Transcription-Service'].region,
      }
    }
  }
};

Amplify.configure(amplifyConfig);

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
