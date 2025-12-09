// src/services/admob.js
// Configurazione Google AdMob per Bevi
// ⚠️ NON FUNZIONA CON EXPO GO - Richiede Development Build

import { Platform } from 'react-native';
import { TestIds } from 'react-native-google-mobile-ads';

// Flag per usare ID di test durante lo sviluppo
const USE_TEST_ADS = __DEV__; // true in sviluppo, false in produzione

// App IDs
export const APP_IDS = {
  ios: 'ca-app-pub-2321153105236925~2130948667',
  android: 'ca-app-pub-2321153105236925~3419979606',
};

// ID Unità Pubblicitarie di PRODUZIONE
const PRODUCTION_IDS = {
  BANNER: Platform.select({
    ios: 'ca-app-pub-2321153105236925/1826969988',
    android: 'ca-app-pub-2321153105236925/8380770040',
  }),
};

// ID di TEST (da usare durante lo sviluppo)
const TEST_IDS = {
  BANNER: TestIds.ADAPTIVE_BANNER,
};

// Esporta gli ID corretti in base all'ambiente
export const AD_UNIT_IDS = {
  BANNER: USE_TEST_ADS ? TEST_IDS.BANNER : PRODUCTION_IDS.BANNER,
};

export default {
  APP_IDS,
  AD_UNIT_IDS,
  USE_TEST_ADS,
};