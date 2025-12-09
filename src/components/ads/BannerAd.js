// src/components/ads/BannerAd.js
// Componente Banner Pubblicitario riutilizzabile
// ✅ Funziona sia in Expo Go (placeholder) che in produzione (ads vere)

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Constants from 'expo-constants';

// Controlla se siamo in Expo Go
const isExpoGo = Constants.appOwnership === 'expo';

const BannerAd = ({ style }) => {
  const [AdComponent, setAdComponent] = useState(null);
  const [adLoaded, setAdLoaded] = useState(false);

  useEffect(() => {
    // Non caricare AdMob in Expo Go
    if (isExpoGo) return;

    // Carica AdMob in modo asincrono solo in production/dev build
    const loadAdMob = async () => {
      try {
        const { BannerAd: GoogleBannerAd, BannerAdSize } = await import('react-native-google-mobile-ads');
        const { AD_UNIT_IDS } = await import('../../services/admob');
        
        setAdComponent(() => (
          <GoogleBannerAd
            unitId={AD_UNIT_IDS.BANNER}
            size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
            requestOptions={{
              requestNonPersonalizedAdsOnly: true,
            }}
            onAdLoaded={() => {
              console.log('✅ Banner ad caricato');
              setAdLoaded(true);
            }}
            onAdFailedToLoad={(error) => {
              console.log('❌ Banner ad errore:', error);
              setAdLoaded(false);
            }}
          />
        ));
      } catch (error) {
        console.log('📢 AdMob non disponibile:', error.message);
      }
    };

    loadAdMob();
  }, []);

  // Se siamo in Expo Go o AdMob non è caricato, mostra placeholder
  if (isExpoGo || !AdComponent) {
    return (
      <View style={[styles.placeholder, style]}>
        <Text style={styles.placeholderText}>📢 AD (Test Mode)</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, style, !adLoaded && styles.hidden]}>
      {AdComponent}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  hidden: {
    height: 0,
    opacity: 0,
  },
  placeholder: {
    height: 50,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    borderRadius: 8,
  },
  placeholderText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default BannerAd;