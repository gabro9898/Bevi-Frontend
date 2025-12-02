// src/hooks/useSocket.js
// Hook per gestire facilmente i WebSocket nei componenti
// ✅ VERSIONE CORRETTA con gestione asincrona

import { useEffect, useRef, useCallback, useState } from 'react';
import socketService from '../services/socketService';

/**
 * Hook per connettersi automaticamente al WebSocket
 * Da usare una volta nell'app (es. App.js o dopo login)
 */
export const useSocketConnect = (isAuthenticated) => {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const handleConnect = async () => {
      if (isAuthenticated) {
        const connected = await socketService.connect();
        if (isMounted) {
          setIsConnected(connected);
        }
      } else {
        socketService.disconnect();
        if (isMounted) {
          setIsConnected(false);
        }
      }
    };

    handleConnect();

    // Listener per aggiornare lo stato quando cambia
    const updateConnectionStatus = () => {
      if (isMounted) {
        setIsConnected(socketService.isSocketConnected());
      }
    };

    socketService.on('connect', updateConnectionStatus);
    socketService.on('disconnect', updateConnectionStatus);

    return () => {
      isMounted = false;
      socketService.off('connect', updateConnectionStatus);
      socketService.off('disconnect', updateConnectionStatus);
    };
  }, [isAuthenticated]);

  return {
    isConnected,
    disconnect: () => socketService.disconnect(),
    getStatus: () => socketService.getStatus(),
  };
};

/**
 * Hook per gestire la chat di un gruppo con WebSocket
 * ✅ FIX CRITICO: Gestione asincrona corretta
 */
export const useGroupChat = (groupId, onNewMessage, onMessageDeleted, onUserTyping) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  
  // Refs per i callback - evitano re-render e mantengono sempre la versione aggiornata
  const handlersRef = useRef({ onNewMessage, onMessageDeleted, onUserTyping });
  const groupIdRef = useRef(groupId);

  // Aggiorna i riferimenti ai callback (senza causare re-render dell'effetto)
  useEffect(() => {
    handlersRef.current = { onNewMessage, onMessageDeleted, onUserTyping };
  }, [onNewMessage, onMessageDeleted, onUserTyping]);

  // Aggiorna ref del groupId
  useEffect(() => {
    groupIdRef.current = groupId;
  }, [groupId]);

  // ✅ EFFETTO PRINCIPALE: Setup WebSocket per il gruppo
  useEffect(() => {
    if (!groupId) {
      console.log('⚠️ useGroupChat: groupId mancante, skip');
      return;
    }

    let isMounted = true;
    console.log(`🎯 useGroupChat: Setup per gruppo ${groupId}`);

    // ==================== HANDLERS ====================
    
    // Handler per nuovo messaggio
    const handleNewMessage = (message) => {
      // Verifica che siamo ancora montati e nel gruppo corretto
      if (!isMounted) return;
      if (groupIdRef.current !== groupId) {
        console.log('⚠️ Messaggio per gruppo diverso, ignoro');
        return;
      }
      
      console.log('📩 useGroupChat: Nuovo messaggio ricevuto:', message.id);
      if (handlersRef.current.onNewMessage) {
        handlersRef.current.onNewMessage(message);
      }
    };

    // Handler per messaggio eliminato
    const handleMessageDeleted = (data) => {
      if (!isMounted) return;
      if (groupIdRef.current !== groupId) return;
      
      const messageId = typeof data === 'string' ? data : data.messageId;
      console.log('🗑️ useGroupChat: Messaggio eliminato:', messageId);
      if (handlersRef.current.onMessageDeleted) {
        handlersRef.current.onMessageDeleted(data);
      }
    };

    // Handler per utente che scrive
    const handleUserTyping = (data) => {
      if (!isMounted) return;
      if (groupIdRef.current !== groupId) return;
      
      if (handlersRef.current.onUserTyping) {
        handlersRef.current.onUserTyping(data);
      }
    };

    // Handler per utente entrato
    const handleUserJoined = (data) => {
      if (!isMounted) return;
      console.log(`👤 ${data.username} è entrato nel gruppo`);
    };

    // Handler per utente uscito
    const handleUserLeft = (data) => {
      if (!isMounted) return;
      console.log(`👤 ${data.username} ha lasciato il gruppo`);
    };

    // Handler per stato connessione
    const handleConnect = () => {
      if (isMounted) {
        console.log('🔌 useGroupChat: Socket connesso');
        setIsConnected(true);
      }
    };

    const handleDisconnect = () => {
      if (isMounted) {
        console.log('🔌 useGroupChat: Socket disconnesso');
        setIsConnected(false);
        setIsJoined(false);
      }
    };

    // ==================== SETUP ASINCRONO ====================
    
    const setup = async () => {
      try {
        // 1. PRIMA registra i listeners (così sono pronti quando arrivano messaggi)
        console.log('📝 useGroupChat: Registro listeners...');
        socketService.on('new_message', handleNewMessage);
        socketService.on('message_deleted', handleMessageDeleted);
        socketService.on('user_typing', handleUserTyping);
        socketService.on('user_joined', handleUserJoined);
        socketService.on('user_left', handleUserLeft);
        socketService.on('connect', handleConnect);
        socketService.on('disconnect', handleDisconnect);

        // 2. POI connetti (se non già connesso)
        console.log('🔌 useGroupChat: Connessione...');
        const connected = await socketService.connect();
        
        if (!isMounted) {
          console.log('⚠️ Component unmounted durante connessione');
          return;
        }
        
        if (!connected) {
          console.log('❌ useGroupChat: Connessione fallita');
          setIsConnected(false);
          return;
        }

        setIsConnected(true);
        console.log('✅ useGroupChat: Connesso');

        // 3. INFINE entra nel gruppo
        const joined = await socketService.joinGroup(groupId);
        
        if (!isMounted) {
          console.log('⚠️ Component unmounted durante join');
          return;
        }
        
        if (joined) {
          setIsJoined(true);
          console.log(`✅ useGroupChat: Entrato nel gruppo ${groupId}`);
        } else {
          console.log(`❌ useGroupChat: Join gruppo fallito`);
        }

      } catch (error) {
        console.error('❌ useGroupChat setup error:', error);
        if (isMounted) {
          setIsConnected(false);
          setIsJoined(false);
        }
      }
    };

    // ==================== CLEANUP ====================
    
    const cleanup = () => {
      console.log(`🧹 useGroupChat: Cleanup per gruppo ${groupId}`);
      
      // Rimuovi tutti i listeners
      socketService.off('new_message', handleNewMessage);
      socketService.off('message_deleted', handleMessageDeleted);
      socketService.off('user_typing', handleUserTyping);
      socketService.off('user_joined', handleUserJoined);
      socketService.off('user_left', handleUserLeft);
      socketService.off('connect', handleConnect);
      socketService.off('disconnect', handleDisconnect);
      
      // Esci dal gruppo
      socketService.leaveGroup(groupId);
      setIsJoined(false);
    };

    // Esegui setup
    setup();

    // Return cleanup
    return () => {
      isMounted = false;
      cleanup();
    };
  }, [groupId]); // ✅ Solo groupId come dipendenza!

  // ==================== FUNZIONI ESPORTATE ====================

  // Funzione per inviare "sta scrivendo"
  const sendTyping = useCallback((isTyping) => {
    if (groupIdRef.current) {
      socketService.sendTyping(groupIdRef.current, isTyping);
    }
  }, []);

  // Funzione per forzare riconnessione
  const reconnect = useCallback(async () => {
    console.log('🔄 useGroupChat: Riconnessione forzata...');
    const connected = await socketService.connect();
    if (connected && groupIdRef.current) {
      await socketService.joinGroup(groupIdRef.current);
    }
    return connected;
  }, []);

  // Funzione per ottenere lo stato (debug)
  const getStatus = useCallback(() => {
    return {
      ...socketService.getStatus(),
      hookState: { isConnected, isJoined, groupId: groupIdRef.current }
    };
  }, [isConnected, isJoined]);

  return {
    sendTyping,
    isConnected,
    isJoined,
    reconnect,
    getStatus,
  };
};

/**
 * Hook semplice per ascoltare eventi WebSocket generici
 */
export const useSocketEvent = (event, callback) => {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!event) return;

    const handler = (data) => {
      if (callbackRef.current) {
        callbackRef.current(data);
      }
    };

    socketService.on(event, handler);

    return () => {
      socketService.off(event, handler);
    };
  }, [event]);
};

export default useGroupChat;