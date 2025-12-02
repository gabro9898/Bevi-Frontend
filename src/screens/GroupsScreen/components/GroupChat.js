// src/screens/GroupsScreen/components/GroupChat.js
// ✅ VERSIONE CORRETTA - Fix race condition RTK Query vs WebSocket

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Alert,
  ActionSheetIOS,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, spacing, borderRadius } from '../../../theme';
import {
  useGetGroupMessagesQuery,
  useSendGroupMessageMutation,
  useDeleteGroupMessageMutation,
  useMarkMessagesAsReadMutation,
} from '../../../api/beviApi';
import { useGroupChat } from '../../../hooks/useSocket';

const GroupChat = ({ groupId, currentUserId }) => {
  // ============ STATE ============
  const [messageText, setMessageText] = useState('');
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const [localMessages, setLocalMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  
  // ============ REFS ============
  const flatListRef = useRef(null);
  const insets = useSafeAreaInsets();
  const hasMarkedAsRead = useRef(false);
  const typingTimeoutRef = useRef(null);
  const previousGroupId = useRef(null);

  // ============ DEBUG ============
  console.log('🔷 GroupChat RENDER | groupId:', groupId, '| messages:', localMessages.length);

  // ==================== NORMALIZZAZIONE ID ====================
  const normalizeId = useCallback((id) => {
    if (id === null || id === undefined) return '';
    return String(id);
  }, []);

  const myUserId = normalizeId(currentUserId);

  // ==================== API QUERY ====================
  const {
    data: messagesData,
    isLoading,
    isFetching,
    isSuccess,
    isError,
    error,
  } = useGetGroupMessagesQuery(groupId, {
    skip: !groupId,
    // ✅ FIX: Disabilita TUTTI i refetch automatici
    // I nuovi messaggi arrivano SOLO via WebSocket!
    refetchOnMountOrArgChange: false,
    refetchOnFocus: false,
    refetchOnReconnect: false,
  });

  const [sendMessage, { isLoading: isSending }] = useSendGroupMessageMutation();
  const [deleteMessage] = useDeleteGroupMessageMutation();
  const [markAsRead] = useMarkMessagesAsReadMutation();

  // ==================== PROCESSA MESSAGGI ====================
  const processMessages = useCallback((messages) => {
    if (!messages || !Array.isArray(messages)) return [];

    return messages.map(msg => {
      const senderId = normalizeId(msg.sender?.id || msg.senderId);
      const isMe = senderId === myUserId;
      return { ...msg, isMe };
    });
  }, [myUserId, normalizeId]);

  // ==================== WEBSOCKET CALLBACKS ====================

  /**
   * Handler per nuovo messaggio via WebSocket
   * ✅ FIX: Aggiunge al localMessages senza aspettare API
   */
  const handleNewMessage = useCallback((message) => {
    console.log('📩 WS: nuovo messaggio', message.id);

    setLocalMessages(prev => {
      const messageId = normalizeId(message.id);
      
      // Controlla duplicati
      const exists = prev.some(m => normalizeId(m.id) === messageId);
      if (exists) {
        console.log('   - Duplicato, ignoro');
        return prev;
      }

      // Calcola isMe
      const senderId = normalizeId(message.sender?.id || message.senderId);
      const isMe = senderId === myUserId;

      console.log('   - Aggiunto, isMe:', isMe);
      
      // Aggiungi e ordina per data
      const updated = [...prev, { ...message, isMe }];
      updated.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      
      return updated;
    });

    // Scrolla in fondo
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [myUserId, normalizeId]);

  /**
   * Handler per messaggio eliminato via WebSocket
   */
  const handleMessageDeleted = useCallback((data) => {
    const messageId = normalizeId(typeof data === 'string' ? data : data.messageId);
    console.log('🗑️ WS: messaggio eliminato:', messageId);

    setLocalMessages(prev =>
      prev.map(m =>
        normalizeId(m.id) === messageId
          ? { ...m, isDeleted: true, content: 'Messaggio eliminato' }
          : m
      )
    );
  }, [normalizeId]);

  /**
   * Handler per utente che scrive
   */
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

  // ==================== WEBSOCKET HOOK ====================
  const { sendTyping, isConnected, isJoined, reconnect, getStatus } = useGroupChat(
    groupId,
    handleNewMessage,
    handleMessageDeleted,
    handleUserTyping
  );

  // ==================== EFFETTI ====================

  /**
   * Reset quando cambia gruppo
   */
  useEffect(() => {
    if (previousGroupId.current !== groupId) {
      console.log('🔄 Cambio gruppo:', previousGroupId.current, '->', groupId);
      setLocalMessages([]);
      setTypingUsers([]);
      setInitialLoadDone(false);
      hasMarkedAsRead.current = false;
      previousGroupId.current = groupId;
    }
  }, [groupId]);

  /**
   * ⭐ CARICAMENTO INIZIALE dal server
   * ✅ FIX CRITICO: Carica SOLO UNA VOLTA, poi i messaggi arrivano via WebSocket
   */
  useEffect(() => {
    // Skip se già caricato
    if (initialLoadDone) {
      console.log('⏭️ Skip: caricamento iniziale già fatto');
      return;
    }

    // Skip se sta caricando
    if (isLoading) {
      console.log('⏳ Skip: ancora in loading');
      return;
    }

    // Skip se sta facendo refetch (NON sovrascrivere!)
    if (isFetching && localMessages.length > 0) {
      console.log('⏭️ Skip: isFetching ma ho già messaggi locali');
      return;
    }

    // Skip se non ci sono dati
    if (!messagesData) {
      console.log('⏭️ Skip: messagesData è null');
      return;
    }

    console.log('⭐ Caricamento iniziale messaggi...');

    // Estrai messaggi dalla risposta (supporta vari formati)
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

    if (!serverMessages) {
      console.log('❌ Formato messagesData non riconosciuto');
      return;
    }

    console.log('   📬 Messaggi dal server:', serverMessages.length);

    // Processa i messaggi
    const processed = processMessages(serverMessages);
    
    // Imposta i messaggi locali
    setLocalMessages(processed);
    setInitialLoadDone(true);

    console.log('   ✅ Caricamento iniziale completato:', processed.length, 'messaggi');

    // Scrolla in fondo
    if (processed.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 200);
    }
  }, [messagesData, isLoading, isFetching, initialLoadDone, processMessages, localMessages.length]);

  /**
   * Segna messaggi come letti
   */
  useEffect(() => {
    if (localMessages.length > 0 && !hasMarkedAsRead.current && groupId) {
      hasMarkedAsRead.current = true;
      console.log('📖 Segno messaggi come letti');
      markAsRead(groupId).catch(err => console.log('Errore mark as read:', err));
    }
  }, [groupId, localMessages.length, markAsRead]);

  /**
   * Gestione tastiera
   */
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onKeyboardShow = (e) => {
      const keyboardHeight = e.endCoordinates.height;
      const bottomInset = insets.bottom || 0;
      const offset = Platform.OS === 'ios' ? keyboardHeight - bottomInset : keyboardHeight;
      setKeyboardOffset(offset);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    };

    const onKeyboardHide = () => setKeyboardOffset(0);

    const showSub = Keyboard.addListener(showEvent, onKeyboardShow);
    const hideSub = Keyboard.addListener(hideEvent, onKeyboardHide);

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [insets.bottom]);

  /**
   * Cleanup typing timeout
   */
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  // ==================== HANDLERS ====================

  const dismissKeyboard = () => Keyboard.dismiss();

  const handleTextChange = (text) => {
    setMessageText(text);
    if (text.length > 0) {
      sendTyping(true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => sendTyping(false), 2000);
    } else {
      sendTyping(false);
    }
  };

  const handleSend = async () => {
    if (!messageText.trim() || isSending) return;

    const text = messageText.trim();
    setMessageText('');
    sendTyping(false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    try {
      console.log('📤 Invio messaggio:', text);
      await sendMessage({ groupId, message: text }).unwrap();
      // ✅ NON scrollare qui - il messaggio arriva via WebSocket e lo scroll è lì
    } catch (error) {
      console.log('❌ Errore invio:', error);
      setMessageText(text); // Ripristina il testo
      Alert.alert('Errore', 'Impossibile inviare il messaggio');
    }
  };

  const handleDelete = async (messageId) => {
    Alert.alert('Elimina messaggio', 'Sei sicuro?', [
      { text: 'Annulla', style: 'cancel' },
      {
        text: 'Elimina',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteMessage(messageId).unwrap();
            // ✅ L'aggiornamento arriva via WebSocket
          } catch (error) {
            Alert.alert('Errore', 'Impossibile eliminare');
          }
        },
      },
    ]);
  };

  const showMessageOptions = (message) => {
    const isMine = message.isMe === true;
    if (message.isDeleted || ['SYSTEM', 'DRINK_LOG', 'LEADERBOARD', 'WHEEL_RESULT'].includes(message.type)) return;

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: isMine ? ['Annulla', 'Copia', 'Elimina'] : ['Annulla', 'Copia'],
          destructiveButtonIndex: isMine ? 2 : undefined,
          cancelButtonIndex: 0,
        },
        (idx) => {
          if (idx === 1) Alert.alert('Copiato');
          if (idx === 2 && isMine) handleDelete(message.id);
        }
      );
    } else {
      const buttons = [
        { text: 'Annulla', style: 'cancel' },
        { text: 'Copia', onPress: () => Alert.alert('Copiato') },
      ];
      if (isMine) buttons.push({ text: 'Elimina', style: 'destructive', onPress: () => handleDelete(message.id) });
      Alert.alert('Opzioni', null, buttons);
    }
  };

  // ==================== FORMATTERS ====================

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Oggi';
    if (date.toDateString() === yesterday.toDateString()) return 'Ieri';
    return date.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
  };

  const groupMessagesByDate = useCallback(() => {
    const grouped = [];
    let currentDate = null;

    localMessages.forEach((msg) => {
      const msgDate = formatDate(msg.createdAt);
      if (msgDate !== currentDate) {
        grouped.push({ type: 'date', date: msgDate, id: `date-${msg.id}` });
        currentDate = msgDate;
      }
      grouped.push({ type: 'message', ...msg });
    });

    return grouped;
  }, [localMessages]);

  const groupedMessages = groupMessagesByDate();

  // ==================== RENDER ITEM ====================

  const renderItem = ({ item }) => {
    // Separatore data
    if (item.type === 'date') {
      return (
        <View style={styles.dateSeparator}>
          <Text style={styles.dateText}>{item.date}</Text>
        </View>
      );
    }

    // Messaggio di sistema
    if (item.type === 'SYSTEM' || item.type === 'LEADERBOARD') {
      return (
        <View style={styles.systemMessageContainer}>
          <View style={styles.systemMessageBubble}>
            <Text style={styles.systemMessageText}>{item.content || item.message}</Text>
          </View>
        </View>
      );
    }

    // Messaggio drink log
    if (item.type === 'DRINK_LOG') {
      return (
        <View style={styles.drinkLogContainer}>
          <View style={styles.drinkLogBubble}>
            <Text style={styles.drinkLogText}>{item.content || item.message}</Text>
          </View>
        </View>
      );
    }

    // Messaggio wheel result
    if (item.type === 'WHEEL_RESULT') {
      return (
        <View style={styles.wheelResultContainer}>
          <View style={styles.wheelResultBubble}>
            <Text style={styles.wheelResultIcon}>🎡</Text>
            <Text style={styles.wheelResultText}>{item.content || item.message}</Text>
          </View>
        </View>
      );
    }

    // Messaggio normale
    const isMe = item.isMe === true;

    return (
      <TouchableOpacity
        style={[styles.messageContainer, isMe && styles.messageContainerMe]}
        onPress={dismissKeyboard}
        onLongPress={() => showMessageOptions(item)}
        delayLongPress={400}
        activeOpacity={0.7}
      >
        <View style={[
          styles.messageBubble,
          isMe ? styles.messageBubbleMe : styles.messageBubbleOther,
          item.isDeleted && styles.messageBubbleDeleted
        ]}>
          {/* Nome mittente (solo per messaggi degli altri) */}
          {!isMe && !item.isDeleted && (
            <Text style={styles.senderName}>
              {item.sender?.nickname || item.sender?.username || 'Utente'}
            </Text>
          )}
          
          {/* Testo messaggio */}
          <Text style={[styles.messageText, item.isDeleted && styles.messageTextDeleted]}>
            {item.isDeleted ? '🚫 Messaggio eliminato' : (item.content || item.message)}
          </Text>
          
          {/* Orario */}
          {!item.isDeleted && (
            <Text style={[styles.messageTime, isMe && styles.messageTimeMe]}>
              {formatTime(item.createdAt)}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // ==================== RENDER PRINCIPALE ====================

  // Loading state
  if (isLoading && localMessages.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Caricamento chat...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Banner connessione */}
      {!isConnected && (
        <TouchableOpacity style={styles.connectionBanner} onPress={reconnect}>
          <Ionicons name="cloud-offline" size={14} color={colors.warning} />
          <Text style={styles.connectionText}>Connessione... Tocca per riprovare</Text>
        </TouchableOpacity>
      )}

      {/* Lista messaggi */}
      <FlatList
        ref={flatListRef}
        data={groupedMessages}
        keyExtractor={(item) => item.id?.toString() || `temp-${Math.random()}`}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.messagesList,
          { paddingBottom: keyboardOffset > 0 ? keyboardOffset + 60 : 70 }
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>💬</Text>
            <Text style={styles.emptyText}>Nessun messaggio</Text>
            <Text style={styles.emptySubtext}>Inizia la conversazione!</Text>
          </View>
        }
      />

      {/* Indicatore typing */}
      {typingUsers.length > 0 && (
        <View style={styles.typingContainer}>
          <Text style={styles.typingText}>
            {typingUsers.length === 1
              ? `${typingUsers[0].username} sta scrivendo...`
              : `${typingUsers.length} persone stanno scrivendo...`}
          </Text>
        </View>
      )}

      {/* Input messaggio */}
      <View style={[styles.inputContainer, { transform: [{ translateY: -keyboardOffset }] }]}>
        <TextInput
          style={styles.input}
          placeholder="Scrivi un messaggio..."
          placeholderTextColor={colors.textMuted}
          value={messageText}
          onChangeText={handleTextChange}
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!messageText.trim() || isSending) && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!messageText.trim() || isSending}
        >
          {isSending ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Ionicons name="send" size={18} color={colors.white} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ==================== STYLES ====================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  connectionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.warning + '20',
    paddingVertical: spacing.xs,
  },
  connectionText: {
    ...typography.caption,
    color: colors.warning,
    marginLeft: spacing.xs,
  },
  messagesList: {
    padding: spacing.md,
    paddingBottom: 70,
    flexGrow: 1,
  },
  typingContainer: {
    position: 'absolute',
    bottom: 60,
    left: spacing.md,
    right: spacing.md,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  typingText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  dateSeparator: {
    alignItems: 'center',
    marginVertical: spacing.sm,
  },
  dateText: {
    ...typography.caption,
    color: colors.textTertiary,
    backgroundColor: colors.veryLightGray,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.round,
    fontSize: 11,
  },
  systemMessageContainer: {
    alignItems: 'center',
    marginVertical: spacing.sm,
  },
  systemMessageBubble: {
    backgroundColor: colors.veryLightGray,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    maxWidth: '85%',
  },
  systemMessageText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  drinkLogContainer: {
    alignItems: 'center',
    marginVertical: spacing.xs,
  },
  drinkLogBubble: {
    backgroundColor: colors.bevi + '15',
    borderWidth: 1,
    borderColor: colors.bevi + '30',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    maxWidth: '85%',
  },
  drinkLogText: {
    ...typography.body,
    color: colors.textPrimary,
    fontSize: 14,
  },
  wheelResultContainer: {
    alignItems: 'center',
    marginVertical: spacing.sm,
  },
  wheelResultBubble: {
    backgroundColor: colors.primary + '15',
    borderWidth: 1,
    borderColor: colors.primary + '30',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    maxWidth: '85%',
    alignItems: 'center',
  },
  wheelResultIcon: {
    fontSize: 32,
    marginBottom: spacing.xs,
  },
  wheelResultText: {
    ...typography.body,
    color: colors.textPrimary,
    textAlign: 'center',
    fontSize: 14,
  },
  messageContainer: {
    marginBottom: spacing.xs,
    alignItems: 'flex-start',
  },
  messageContainerMe: {
    alignItems: 'flex-end',
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 2,
    borderRadius: 18,
  },
  messageBubbleOther: {
    backgroundColor: colors.white,
    borderBottomLeftRadius: 4,
  },
  messageBubbleMe: {
    backgroundColor: '#E5E5EA',
    borderBottomRightRadius: 4,
  },
  messageBubbleDeleted: {
    backgroundColor: colors.veryLightGray,
  },
  senderName: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 1,
    fontSize: 12,
  },
  messageText: {
    ...typography.body,
    color: colors.textPrimary,
    fontSize: 15,
    lineHeight: 20,
  },
  messageTextDeleted: {
    color: colors.textTertiary,
    fontStyle: 'italic',
    fontSize: 13,
  },
  messageTime: {
    ...typography.caption,
    color: colors.textTertiary,
    marginTop: 2,
    alignSelf: 'flex-end',
    fontSize: 10,
  },
  messageTimeMe: {
    color: colors.gray,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxl * 2,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyText: {
    ...typography.h3,
    color: colors.textSecondary,
  },
  emptySubtext: {
    ...typography.body,
    color: colors.textTertiary,
  },
  inputContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: spacing.sm,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    minHeight: 36,
    maxHeight: 100,
    backgroundColor: colors.veryLightGray,
    borderRadius: 18,
    paddingHorizontal: spacing.md,
    paddingVertical: Platform.OS === 'ios' ? spacing.sm : spacing.xs,
    marginRight: spacing.sm,
    ...typography.body,
    color: colors.textPrimary,
    fontSize: 15,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.lightGray,
  },
});

export default GroupChat;