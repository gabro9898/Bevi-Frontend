// src/utils/notifications.js
// Gestione notifiche push

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Configura come mostrare le notifiche quando l'app è in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Registra per le notifiche push e ottieni il token
 */
export async function registerForPushNotificationsAsync() {
  let token;

  // Le notifiche push non funzionano su simulatore
  if (!Device.isDevice) {
    console.log('Push notifications richiedono un dispositivo fisico');
    return null;
  }

  // Controlla/richiedi permessi
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Permesso notifiche non concesso');
    return null;
  }

  // Ottieni il token Expo
  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    
    token = (await Notifications.getExpoPushTokenAsync({
      projectId: projectId,
    })).data;
    
    console.log('Expo Push Token:', token);
  } catch (error) {
    console.error('Errore ottenimento token:', error);
    return null;
  }

  // Configurazione Android
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#7C3AED',
    });
  }

  return token;
}

/**
 * Listener per notifiche ricevute (app in foreground)
 */
export function addNotificationReceivedListener(callback) {
  return Notifications.addNotificationReceivedListener(callback);
}

/**
 * Listener per quando l'utente tocca la notifica
 */
export function addNotificationResponseReceivedListener(callback) {
  return Notifications.addNotificationResponseReceivedListener(callback);
}