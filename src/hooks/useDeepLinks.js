// src/hooks/useDeepLinks.js
// Hook per gestire i deep links dell'app con auto-join ai gruppi
// ✅ Usa inviteCode per il join (più sicuro)

import { useEffect, useCallback } from 'react';
import { Linking, Alert, Share, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useJoinGroupMutation } from '../api/beviApi';

// URL base per i link condivisibili (GitHub Pages)
const SHARE_BASE_URL = 'https://gabro9898.github.io/bevi-docs/join.html';

// Funzione per parsare il deep link
const parseDeepLink = (url) => {
  if (!url) return null;

  try {
    console.log('🔗 Parsing URL:', url);
    
    // Gestisci link web (https://...join.html?code=ABC123)
    if (url.includes('join.html')) {
      const urlObj = new URL(url);
      const inviteCode = urlObj.searchParams.get('code');
      const groupName = urlObj.searchParams.get('name');
      const groupId = urlObj.searchParams.get('groupId'); // Per navigazione post-join
      
      if (inviteCode) {
        return { 
          route: 'join', 
          inviteCode, 
          groupName: groupName ? decodeURIComponent(groupName) : null,
          groupId,
        };
      }
      return null;
    }
    
    // Gestisci deep link (bevi://join/ABC123 o bevi://group/xxx)
    if (url.startsWith('bevi://')) {
      const path = url.replace('bevi://', '');
      const [pathPart, queryPart] = path.split('?');
      const [route, param] = pathPart.split('/');
      
      // Estrai parametri dalla query string
      let groupName = null;
      let groupId = null;
      if (queryPart) {
        const params = new URLSearchParams(queryPart);
        groupName = params.get('name');
        groupId = params.get('groupId');
      }
      
      console.log('🔗 Deep link parsed:', { route, param, groupName, groupId });
      
      if (route === 'join' && param) {
        return { route: 'join', inviteCode: param, groupName, groupId };
      }
      
      if (route === 'group' && param) {
        return { route: 'group', groupId: param };
      }
      
      return { route, param };
    }
    
    return null;
  } catch (error) {
    console.error('❌ Errore parsing deep link:', error);
    return null;
  }
};

// Hook principale
export const useDeepLinks = () => {
  const navigation = useNavigation();
  const [joinGroup] = useJoinGroupMutation();

  // Gestisce il deep link
  const handleDeepLink = useCallback(async (url) => {
    const parsed = parseDeepLink(url);
    
    if (!parsed) return;

    switch (parsed.route) {
      case 'join':
        // Auto-join al gruppo tramite inviteCode
        if (parsed.inviteCode) {
          console.log('🔗 Tentativo auto-join con codice:', parsed.inviteCode);
          
          try {
            const result = await joinGroup(parsed.inviteCode).unwrap();
            
            console.log('✅ Join riuscito:', result);
            
            // Estrai groupId dalla risposta
            const joinedGroupId = result?.data?.group?.id || result?.group?.id || parsed.groupId;
            const joinedGroupName = result?.data?.group?.name || result?.group?.name || parsed.groupName || 'Gruppo';
            
            Alert.alert(
              '🎉 Benvenuto!',
              `Ti sei unito a "${joinedGroupName}" con successo!`,
              [
                {
                  text: 'Vai al gruppo',
                  onPress: () => {
                    if (joinedGroupId) {
                      navigation.navigate('GroupDetail', { 
                        groupId: joinedGroupId,
                        groupName: joinedGroupName,
                        fromDeepLink: true 
                      });
                    } else {
                      // Se non abbiamo l'ID, vai alla lista gruppi
                      navigation.navigate('MainTabs', { screen: 'Gruppi' });
                    }
                  }
                }
              ]
            );
          } catch (error) {
            console.log('⚠️ Errore join:', error);
            
            // Se l'errore è "già membro", naviga al gruppo
            const errorMessage = error?.data?.message?.toLowerCase() || '';
            if (errorMessage.includes('già') || 
                errorMessage.includes('already') ||
                error?.status === 409) {
              Alert.alert(
                'Gruppo',
                'Sei già membro di questo gruppo!',
                [
                  {
                    text: 'Vai ai gruppi',
                    onPress: () => {
                      navigation.navigate('MainTabs', { screen: 'Gruppi' });
                    }
                  }
                ]
              );
            } else if (errorMessage.includes('non valido') || 
                       errorMessage.includes('invalid') ||
                       errorMessage.includes('not found')) {
              Alert.alert(
                'Codice non valido',
                'Il link di invito non è più valido o è scaduto.',
                [{ text: 'OK' }]
              );
            } else {
              Alert.alert(
                'Errore',
                error?.data?.message || 'Impossibile unirsi al gruppo. Riprova più tardi.',
                [{ text: 'OK' }]
              );
            }
          }
        }
        break;
      
      case 'group':
        // Navigazione diretta a un gruppo (per chi è già membro)
        if (parsed.groupId) {
          console.log('🔗 Navigazione a gruppo:', parsed.groupId);
          navigation.navigate('GroupDetail', { 
            groupId: parsed.groupId,
            fromDeepLink: true 
          });
        }
        break;
      
      default:
        console.log('🔗 Route non riconosciuta:', parsed.route);
    }
  }, [navigation, joinGroup]);

  useEffect(() => {
    // 1. Controlla se l'app è stata aperta tramite deep link
    const checkInitialUrl = async () => {
      try {
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl) {
          console.log('🔗 App aperta con deep link:', initialUrl);
          // Piccolo delay per assicurarsi che la navigazione sia pronta
          setTimeout(() => {
            handleDeepLink(initialUrl);
          }, 1000);
        }
      } catch (error) {
        console.error('❌ Errore getInitialURL:', error);
      }
    };

    checkInitialUrl();

    // 2. Ascolta i deep link mentre l'app è aperta
    const subscription = Linking.addEventListener('url', (event) => {
      console.log('🔗 Deep link ricevuto:', event.url);
      handleDeepLink(event.url);
    });

    return () => {
      subscription?.remove();
    };
  }, [handleDeepLink]);
};

// Funzione per generare un deep link diretto
export const generateGroupDeepLink = (inviteCode, groupName) => {
  const encodedName = encodeURIComponent(groupName || '');
  return `bevi://join/${inviteCode}?name=${encodedName}`;
};

// Funzione per generare un link condivisibile (con fallback web)
export const generateShareableGroupLink = (inviteCode, groupName, groupId) => {
  const encodedName = encodeURIComponent(groupName || 'Gruppo Bevi');
  
  // URL web che fa da smart redirect
  const webUrl = `${SHARE_BASE_URL}?code=${inviteCode}&name=${encodedName}${groupId ? `&groupId=${groupId}` : ''}`;
  
  return {
    url: webUrl,
    deepLink: generateGroupDeepLink(inviteCode, groupName),
    message: `🍻 Unisciti al gruppo "${groupName}" su Bevi!\n\n${webUrl}`,
    code: inviteCode,
  };
};

// Funzione per condividere un gruppo
export const shareGroup = async (inviteCode, groupName, groupId) => {
  if (!inviteCode) {
    Alert.alert('Errore', 'Impossibile ottenere il codice di invito');
    return false;
  }

  try {
    const { message, url } = generateShareableGroupLink(inviteCode, groupName, groupId);
    
    const result = await Share.share({
      message: message,
      url: Platform.OS === 'ios' ? url : undefined, // iOS supporta url separato
      title: `Unisciti a ${groupName} su Bevi!`,
    });
    
    if (result.action === Share.sharedAction) {
      console.log('✅ Gruppo condiviso con successo');
      return true;
    } else if (result.action === Share.dismissedAction) {
      console.log('ℹ️ Condivisione annullata');
      return false;
    }
  } catch (error) {
    console.error('❌ Errore condivisione:', error);
    Alert.alert('Errore', 'Impossibile condividere il gruppo');
    return false;
  }
};

export default useDeepLinks;