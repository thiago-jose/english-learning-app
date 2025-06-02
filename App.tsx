import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { Amplify } from 'aws-amplify';
import { withAuthenticator } from '@aws-amplify/ui-react-native';
import amplifyconfig from './amplifyconfiguration.json';
import MainApp from './src/components/MainApp';

Amplify.configure(amplifyconfig);

function App() {
  return (
    <View style={styles.container}>
      <MainApp />
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});

export default withAuthenticator(App);