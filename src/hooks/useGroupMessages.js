// src/hooks/useGroupMessages.js
// ✅ Hook per gestione completa messaggi di gruppo
// Gestisce: API, WebSocket, merge, stato locale

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  useGetGroupMessagesQuery,
  useSendGroupMessageMutation,
  useDeleteGroupMessageMutation,
  useMarkMessagesAsReadMutation,
} from '../api/beviApi';
import { useGroupChat } from './useSocket';

/**
 * Hook per gestire i messaggi di un gruppo
 * @param {string} groupId - ID del gruppo
 * @param {string} currentUserId - ID dell'utente corrente
 * @returns {object} Stato e funzioni per gestire i messaggi
 */
export const useGroupMessages = (groupId, currentUserId) => {
  // ============ STATE ============
  const [localMessages, setLocalMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  // ============ REFS ============
  const hasMarkedAsRead = useRef(false);
  const previousGroupId = useRef(null);
  const lastServerDataRef = useRef(null);

  // ============ UTILS ============
  const normalizeId = useCallback((id) => {
    if (id === null || id === undefined) return '';
    return String(id);
  }, []);

  const myUserId = normalizeId(currentUserId);

  // ============ API QUERY ============
  const {
    data: messagesData,
    isLoading,
    isFetching,
    refetch,
  } = useGetGroupMessagesQuery(groupId, {
    skip: !groupId,
    refetchOnMountOrArgChange: true,
    refetchOnFocus: false,
    refetchOnReconnect: true,
  });

  const [sendMessageMutation, { isLoading: isSending }] = useSendGroupMessageMutation();
  const [deleteMessageMutation] = useDeleteGroupMessageMutation();
  const [markAsReadMutation] = useMarkMessagesAsReadMutation();

  // ============ PROCESS MESSAGES ============
  const processMessages = useCallback((messages) => {
    if (!messages || !Array.isArray(messages)) return [];

    return messages.map(msg => {
      const senderId = normalizeId(msg.sender?.id || msg.senderId);
      const isMe = senderId === myUserId;
      return { ...msg, isMe };
    });
  }, [myUserId, normalizeId]);

  // ============ WEBSOCKET CALLBACKS ============
  const handleNewMessage = useCallback((message) => {
    console.log('📩 [useGroupMessages] Nuovo messaggio:', message.id, '| Type:', message.type);

    setLocalMessages(prev => {
      const messageId = normalizeId(message.id);
      
      // Check duplicati
      const exists = prev.some(m => normalizeId(m.id) === messageId);
      if (exists) {
        console.log('   - Duplicato, ignoro');
        return prev;
      }

      const senderId = normalizeId(message.sender?.id || message.senderId);
      const isMe = senderId === myUserId;

      console.log('   - Aggiunto, isMe:', isMe);
      
      const updated = [...prev, { ...message, isMe }];
      updated.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      
      return updated;
    });

    return true; // Indica che il messaggio è stato aggiunto
  }, [myUserId, normalizeId]);

  const handleMessageDeleted = useCallback((data) => {
    const messageId = normalizeId(typeof data === 'string' ? data : data.messageId);
    console.log('🗑️ [useGroupMessages] Messaggio eliminato:', messageId);

    setLocalMessages(prev =>
      prev.map(m =>
        normalizeId(m.id) === messageId
          ? { ...m, isDeleted: true, content: 'Messaggio eliminato' }
          : m
      )
    );
  }, [normalizeId]);

  const handleUserTyping = useCallback((data) => {
    const typingUserId = normalizeId(data.userId);
    if (typingUserId === myUserId) return;

    setTypingUsers(prev => {
      if (data.isTyping) {
        const exists = prev.some(u => normalizeId(u.userId) === typingUserId);
        if (!exists) {
          return [...prev, { userId: data.userId, username: data.username }];
        }
        return prev;
      } else {
        return prev.filter(u => normalizeId(u.userId) !== typingUserId);
      }
    });

    // Auto-rimuovi dopo 3 secondi
    setTimeout(() => {
      setTypingUsers(prev => prev.filter(u => normalizeId(u.userId) !== typingUserId));
    }, 3000);
  }, [myUserId, normalizeId]);

  // ============ WEBSOCKET HOOK ============
  const { 
    sendTyping, 
    isConnected, 
    isJoined, 
    reconnect, 
    getStatus 
  } = useGroupChat(
    groupId,
    handleNewMessage,
    handleMessageDeleted,
    handleUserTyping
  );

  // ============ EFFECTS ============

  // Reset quando cambia gruppo
  useEffect(() => {
    if (previousGroupId.current !== groupId) {
      console.log('🔄 [useGroupMessages] Cambio gruppo:', previousGroupId.current, '->', groupId);
      setLocalMessages([]);
      setTypingUsers([]);
      setInitialLoadDone(false);
      hasMarkedAsRead.current = false;
      lastServerDataRef.current = null;
      previousGroupId.current = groupId;
    }
  }, [groupId]);

  // Carica e aggiorna messaggi
  useEffect(() => {
    if (isLoading || !messagesData) return;

    // Estrai messaggi dal server
    let serverMessages = null;
    if (messagesData?.data?.messages && Array.isArray(messagesData.data.messages)) {
      serverMessages = messagesData.data.messages;
    } else if (messagesData?.data && Array.isArray(messagesData.data)) {
      serverMessages = messagesData.data;
    } else if (messagesData?.messages && Array.isArray(messagesData.messages)) {
      serverMessages = messagesData.messages;
    } else if (Array.isArray(messagesData)) {
      serverMessages = messagesData;
    }

    if (!serverMessages) return;

    // Evita ri-processing degli stessi dati
    const serverDataKey = JSON.stringify(serverMessages.map(m => m.id).sort());
    if (lastServerDataRef.current === serverDataKey) return;
    lastServerDataRef.current = serverDataKey;

    console.log('⭐ [useGroupMessages] Caricamento messaggi:', serverMessages.length);

    const processed = processMessages(serverMessages);
    
    setLocalMessages(prev => {
      if (prev.length === 0 || !initialLoadDone) {
        return processed;
      }
      
      // Merge intelligente
      const serverIds = new Set(processed.map(m => normalizeId(m.id)));
      const localOnlyMessages = prev.filter(m => !serverIds.has(normalizeId(m.id)));
      
      const merged = [...processed, ...localOnlyMessages];
      merged.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      
      return merged;
    });

    if (!initialLoadDone) {
      setInitialLoadDone(true);
    }
  }, [messagesData, isLoading, initialLoadDone, processMessages, normalizeId]);

  // Mark as read
  useEffect(() => {
    if (localMessages.length > 0 && !hasMarkedAsRead.current && groupId) {
      hasMarkedAsRead.current = true;
      markAsReadMutation(groupId).catch(err => 
        console.log('[useGroupMessages] Errore mark as read:', err)
      );
    }
  }, [groupId, localMessages.length, markAsReadMutation]);

  // ============ ACTIONS ============
  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || isSending) return { success: false };

    try {
      console.log('📤 [useGroupMessages] Invio:', text);
      await sendMessageMutation({ groupId, message: text.trim() }).unwrap();
      return { success: true };
    } catch (error) {
      console.log('❌ [useGroupMessages] Errore invio:', error);
      return { success: false, error };
    }
  }, [groupId, isSending, sendMessageMutation]);

  const deleteMessage = useCallback(async (messageId) => {
    try {
      await deleteMessageMutation(messageId).unwrap();
      return { success: true };
    } catch (error) {
      console.log('❌ [useGroupMessages] Errore eliminazione:', error);
      return { success: false, error };
    }
  }, [deleteMessageMutation]);

  // ============ RETURN ============
  return {
    // Stato
    messages: localMessages,
    typingUsers,
    isLoading: isLoading && localMessages.length === 0,
    isFetching,
    isSending,
    initialLoadDone,
    
    // Connessione WebSocket
    isConnected,
    isJoined,
    
    // Azioni
    sendMessage,
    deleteMessage,
    sendTyping,
    reconnect,
    refetch,
    
    // Utils
    normalizeId,
    myUserId,
  };
};

export default useGroupMessages;