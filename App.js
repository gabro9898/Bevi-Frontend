// App.js
// ✅ Con react-native-keyboard-controller per gestione tastiera robusta

import React, { useEffect } from 'react';
import { StatusBar, Platform } from 'react-native';
import { Provider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { store } from './src/store';
import RootNavigator from './src/navigation/RootNavigator';
import { initializeAds } from './src/utils/initAds';

export default function App() {
  
  // Inizializza AdMob all'avvio dell'app
  useEffect(() => {
    initializeAds();
  }, []);

  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <KeyboardProvider>
          <StatusBar 
            barStyle="dark-content" 
            backgroundColor="transparent"
            translucent={Platform.OS === 'android'}
          />
          <RootNavigator />
        </KeyboardProvider>
      </SafeAreaProvider>
    </Provider>
  );
}