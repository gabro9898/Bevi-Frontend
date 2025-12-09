// src/utils/initAds.js
// Inizializzazione Google Mobile Ads SDK
// ✅ Funziona sia in Expo Go che in produzione

import Constants from 'expo-constants';

const isExpoGo = Constants.appOwnership === 'expo';

let isInitialized = false;

export const initializeAds = async () => {
  // Skip se siamo in Expo Go
  if (isExpoGo) {
    console.log('📢 AdMob: Skip inizializzazione (Expo Go)');
    return;
  }

  if (isInitialized) {
    console.log('📢 AdMob già inizializzato');
    return;
  }

  try {
    console.log('📢 Inizializzazione AdMob...');
    
    const mobileAds = (await import('react-native-google-mobile-ads')).default;
    const adapterStatuses = await mobileAds().initialize();
    
    console.log('✅ AdMob inizializzato:', adapterStatuses);
    isInitialized = true;
    
    return adapterStatuses;
  } catch (error) {
    console.error('❌ Errore inizializzazione AdMob:', error);
  }
};

export default initializeAds;