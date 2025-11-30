// src/hooks/usePushNotifications.js
// Hook per gestire le notifiche push

import { useEffect, useRef, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { 
  registerForPushNotificationsAsync,
  addNotificationReceivedListener,
  addNotificationResponseReceivedListener,
} from '../utils/notifications';
import { useRegisterPushTokenMutation } from '../api/beviApi';

export function usePushNotifications() {
  const navigation = useNavigation();
  const [expoPushToken, setExpoPushToken] = useState(null);
  const [notification, setNotification] = useState(null);
  const notificationListener = useRef();
  const responseListener = useRef();

  const [registerToken] = useRegisterPushTokenMutation();

  useEffect(() => {
    // Registra per le notifiche
    registerForPushNotificationsAsync().then(async (token) => {
      if (token) {
        setExpoPushToken(token);
        
        // Invia token al backend
        try {
          await registerToken(token).unwrap();
          console.log('✅ Token push registrato sul backend');
        } catch (error) {
          console.log('⚠️ Errore registrazione token (backend):', error?.data?.message || error);
        }
      } else {
        console.log('⚠️ Nessun token push ottenuto (normale su simulatore/dev)');
      }
    }).catch(error => {
      console.log('⚠️ Push notifications non disponibili:', error.message);
    });

    // Listener: notifica ricevuta (app aperta)
    notificationListener.current = addNotificationReceivedListener((notification) => {
      console.log('📬 Notifica ricevuta:', notification);
      setNotification(notification);
    });

    // Listener: utente tocca la notifica
    responseListener.current = addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      console.log('👆 Notifica toccata:', data);

      // Naviga in base al tipo di notifica
      handleNotificationNavigation(data, navigation);
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  return { expoPushToken, notification };
}

/**
 * Gestisce la navigazione quando l'utente tocca una notifica
 */
function handleNotificationNavigation(data, navigation) {
  if (!data?.type) return;

  switch (data.type) {
    case 'group_message':
    case 'wheel_spin':
    case 'group_drink':
      if (data.groupId) {
        navigation.navigate('GroupDetail', { groupId: data.groupId });
      }
      break;
    
    case 'ranking_overtake':
      navigation.navigate('MainTabs', { screen: 'Generale' });
      break;
    
    default:
      break;
  }
}