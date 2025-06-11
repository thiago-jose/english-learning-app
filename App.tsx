import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { Amplify } from 'aws-amplify';
import { withAuthenticator } from '@aws-amplify/ui-react-native';
import MainApp from './src/app/MainApp';
import './global.css';

function App() {
  return (
    <View className="flex-1 bg-white">
      <MainApp />
      <StatusBar style="auto" />
    </View>
  );
}

export default withAuthenticator(App);