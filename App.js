// App.js
// Entry point dell'applicazione Bevi

import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { Provider } from 'react-redux';
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
      <StatusBar barStyle="dark-content" />
      <RootNavigator />
    </Provider>
  );
}