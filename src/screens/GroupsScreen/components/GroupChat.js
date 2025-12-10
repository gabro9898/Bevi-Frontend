// src/screens/GroupsScreen/components/GroupChat.js
// ✅ VERSIONE 4.8 - Fix safe area Android per input bar

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
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
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, spacing, borderRadius } from '../../../theme';

// Hook e componenti
import { useGroupMessages } from '../../../hooks/useGroupMessages';
import ChatMessage from './ChatMessage';

// ==================== COSTANTI ====================

// Altezza barra input + margine per vedere l'ultimo messaggio
const INPUT_BAR_HEIGHT = 40;

// ==================== SUB-COMPONENTS ====================

const DateSeparator = ({ date }) => (
  <View style={styles.dateSeparator}>
    <Text style={styles.dateText}>{date}</Text>
  </View>
);

const ScrollToBottomButton = ({ visible, onPress, unreadCount }) => {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: visible ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [visible, opacity]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.scrollToBottomContainer, { opacity }]}>
      <TouchableOpacity style={styles.scrollToBottomButton} onPress={onPress} activeOpacity={0.8}>
        {unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadBadgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
          </View>
        )}
        <Ionicons name="chevron-down" size={24} color={colors.primary} />
      </TouchableOpacity>
    </Animated.View>
  );
};

const TypingIndicator = ({ users }) => {
  if (users.length === 0) return null;

  return (
    <View style={styles.typingContainer}>
      <Text style={styles.typingText}>
        {users.length === 1
          ? `${users[0].username} sta scrivendo...`
          : `${users.length} persone stanno scrivendo...`}
      </Text>
    </View>
  );
};

// ==================== MAIN COMPONENT ====================

const GroupChat = ({ groupId, currentUserId }) => {
  // ============ HOOK MESSAGGI ============
  const {
    messages,
    typingUsers,
    isLoading,
    isSending,
    isConnected,
    sendMessage,
    deleteMessage,
    sendTyping,
    reconnect,
    normalizeId,
  } = useGroupMessages(groupId, currentUserId);

  // ============ LOCAL STATE (solo UI) ============
  const [messageText, setMessageText] = useState('');
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [unreadInView, setUnreadInView] = useState(0);
  const [iosKeyboardHeight, setIosKeyboardHeight] = useState(0);
  const [isReady, setIsReady] = useState(false);

  // ============ REFS ============
  const flatListRef = useRef(null);
  const inputRef = useRef(null);
  const insets = useSafeAreaInsets();
  const typingTimeoutRef = useRef(null);
  const isNearBottom = useRef(true);
  const prevMessagesLength = useRef(0);
  const hasScrolledToEnd = useRef(false);
  const scrollTimeoutRef = useRef(null);
  const lastContentHeight = useRef(0);

  // ============ EFFECTS ============

  // Reset quando cambia gruppo
  useEffect(() => {
    hasScrolledToEnd.current = false;
    prevMessagesLength.current = 0;
    lastContentHeight.current = 0;
    setIsReady(false);
    
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = null;
    }
  }, [groupId]);

  // Keyboard listener SOLO per iOS
  useEffect(() => {
    if (Platform.OS !== 'ios') return;

    const onKeyboardWillShow = (e) => {
      const keyboardHeight = e.endCoordinates.height;
      const offset = keyboardHeight - (insets.bottom || 0);
      setIosKeyboardHeight(offset);
      
      setTimeout(() => {
        if (isNearBottom.current) {
          flatListRef.current?.scrollToEnd({ animated: true });
        }
      }, 100);
    };

    const onKeyboardWillHide = () => {
      setIosKeyboardHeight(0);
    };

    const showSub = Keyboard.addListener('keyboardWillShow', onKeyboardWillShow);
    const hideSub = Keyboard.addListener('keyboardWillHide', onKeyboardWillHide);

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [insets.bottom]);

  // Auto-scroll quando arrivano nuovi messaggi (solo dopo il primo scroll)
  useEffect(() => {
    if (messages.length > prevMessagesLength.current && hasScrolledToEnd.current) {
      const newMessagesCount = messages.length - prevMessagesLength.current;
      
      if (isNearBottom.current) {
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      } else {
        const lastMessages = messages.slice(-newMessagesCount);
        const othersMessages = lastMessages.filter(m => !m.isMe);
        if (othersMessages.length > 0) {
          setUnreadInView(count => count + othersMessages.length);
        }
      }
    }
    prevMessagesLength.current = messages.length;
  }, [messages.length]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, []);

  // ============ HANDLERS ============

  // Scroll con debounce - aspetta che il contenuto si stabilizzi
  const handleContentSizeChange = useCallback((contentWidth, contentHeight) => {
    if (hasScrolledToEnd.current) {
      return;
    }

    if (messages.length === 0 || contentHeight === 0) {
      return;
    }

    lastContentHeight.current = contentHeight;

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = setTimeout(() => {
      if (!hasScrolledToEnd.current && flatListRef.current) {
        flatListRef.current.scrollToEnd({ animated: false });
        hasScrolledToEnd.current = true;
        
        setTimeout(() => {
          setIsReady(true);
        }, 50);
      }
    }, 300);
  }, [messages.length]);

  const dismissKeyboard = useCallback(() => {
    Keyboard.dismiss();
  }, []);

  const handleTextChange = useCallback((text) => {
    setMessageText(text);
    if (text.length > 0) {
      sendTyping(true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => sendTyping(false), 2000);
    } else {
      sendTyping(false);
    }
  }, [sendTyping]);

  const handleSend = useCallback(async () => {
    const text = messageText.trim();
    if (!text || isSending) return;

    const textToSend = text;
    
    sendTyping(false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    Keyboard.dismiss();
    setMessageText('');

    const result = await sendMessage(textToSend);
    
    if (!result.success) {
      setMessageText(textToSend);
      Alert.alert('Errore', 'Impossibile inviare il messaggio');
    } else {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 150);
    }
  }, [messageText, isSending, sendMessage, sendTyping]);

  const handleDelete = useCallback(async (messageId) => {
    Alert.alert('Elimina messaggio', 'Sei sicuro?', [
      { text: 'Annulla', style: 'cancel' },
      {
        text: 'Elimina',
        style: 'destructive',
        onPress: async () => {
          const result = await deleteMessage(messageId);
          if (!result.success) {
            Alert.alert('Errore', 'Impossibile eliminare');
          }
        },
      },
    ]);
  }, [deleteMessage]);

  const showMessageOptions = useCallback((message) => {
    const isMine = message.isMe === true;
    if (message.isDeleted || ['SYSTEM', 'DRINK_LOG', 'LEADERBOARD', 'WHEEL_RESULT'].includes(message.type)) return;

    Keyboard.dismiss();

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
  }, [handleDelete]);

  const handleScroll = useCallback((event) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const distanceFromBottom = contentSize.height - contentOffset.y - layoutMeasurement.height;

    const wasNearBottom = isNearBottom.current;
    isNearBottom.current = distanceFromBottom < 100;

    setShowScrollButton(distanceFromBottom > 300);

    if (!wasNearBottom && isNearBottom.current) {
      setUnreadInView(0);
    }
  }, []);

  const scrollToBottom = useCallback(() => {
    flatListRef.current?.scrollToEnd({ animated: true });
    setUnreadInView(0);
  }, []);

  // ============ FORMATTERS ============

  const formatDate = useCallback((dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Oggi';
    if (date.toDateString() === yesterday.toDateString()) return 'Ieri';
    return date.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
  }, []);

  // ============ GROUPED MESSAGES ============

  const groupedMessages = useMemo(() => {
    const grouped = [];
    let currentDate = null;

    messages.forEach((msg, index) => {
      const msgDate = formatDate(msg.createdAt);
      
      if (msgDate !== currentDate) {
        grouped.push({ type: 'date', date: msgDate, id: `date-${msg.id}` });
        currentDate = msgDate;
      }

      const prevMsg = messages[index - 1];
      const nextMsg = messages[index + 1];
      
      const isSpecialType = ['SYSTEM', 'DRINK_LOG', 'LEADERBOARD', 'WHEEL_RESULT'].includes(msg.type);
      
      const prevSameSender = prevMsg && 
        normalizeId(prevMsg.sender?.id || prevMsg.senderId) === normalizeId(msg.sender?.id || msg.senderId) &&
        formatDate(prevMsg.createdAt) === msgDate &&
        !['SYSTEM', 'DRINK_LOG', 'LEADERBOARD', 'WHEEL_RESULT'].includes(prevMsg.type) &&
        !isSpecialType;
      
      const nextSameSender = nextMsg &&
        normalizeId(nextMsg.sender?.id || nextMsg.senderId) === normalizeId(msg.sender?.id || msg.senderId) &&
        formatDate(nextMsg.createdAt) === msgDate &&
        !['SYSTEM', 'DRINK_LOG', 'LEADERBOARD', 'WHEEL_RESULT'].includes(nextMsg.type) &&
        !isSpecialType;

      grouped.push({
        type: 'message',
        ...msg,
        isFirstInGroup: !prevSameSender,
        isLastInGroup: !nextSameSender,
      });
    });

    return grouped;
  }, [messages, normalizeId, formatDate]);

  // ============ RENDER ============

  const renderItem = useCallback(({ item }) => {
    if (item.type === 'date') {
      return <DateSeparator date={item.date} />;
    }

    return (
      <ChatMessage
        message={item}
        isMe={item.isMe}
        isFirstInGroup={item.isFirstInGroup}
        isLastInGroup={item.isLastInGroup}
        onLongPress={showMessageOptions}
        onPress={dismissKeyboard}
      />
    );
  }, [showMessageOptions, dismissKeyboard]);

  const keyExtractor = useCallback((item) => item.id?.toString() || `temp-${Math.random()}`, []);

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Caricamento chat...</Text>
      </View>
    );
  }

  // ============ CALCOLI LAYOUT ============
  
  const isIOS = Platform.OS === 'ios';
  
  // ✅ FIX: Considera safe area per entrambe le piattaforme
  const bottomInset = insets.bottom || 0;
  
  // Altezza del footer per scrollToEnd
  const listFooterHeight = isIOS 
    ? (iosKeyboardHeight > 0 ? iosKeyboardHeight + INPUT_BAR_HEIGHT : INPUT_BAR_HEIGHT + bottomInset)
    : INPUT_BAR_HEIGHT + bottomInset + spacing.sm;
  
  // ✅ FIX: Android usa insets.bottom per stare sopra la navigation bar
  const inputBottomPosition = isIOS ? iosKeyboardHeight : bottomInset;
  
  const inputBottomPadding = isIOS
    ? (iosKeyboardHeight > 0 ? spacing.xs : spacing.xs)
    : spacing.sm;

  return (
    <View style={styles.container}>
      {/* Banner connessione */}
      {!isConnected && (
        <TouchableOpacity style={styles.connectionBanner} onPress={reconnect}>
          <Ionicons name="cloud-offline" size={14} color={colors.warning} />
          <Text style={styles.connectionText}>Connessione... Tocca per riprovare</Text>
        </TouchableOpacity>
      )}

      {/* Lista messaggi - nascosta finché non è pronta */}
      <FlatList
        ref={flatListRef}
        data={groupedMessages}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        onContentSizeChange={handleContentSizeChange}
        contentContainerStyle={styles.messagesList}
        ListFooterComponent={<View style={{ height: listFooterHeight }} />}
        style={{ opacity: isReady ? 1 : 0 }}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>💬</Text>
            <Text style={styles.emptyText}>Nessun messaggio</Text>
            <Text style={styles.emptySubtext}>Inizia la conversazione!</Text>
          </View>
        }
      />

      {/* Loading mentre la chat si prepara */}
      {!isReady && groupedMessages.length > 0 && (
        <View style={styles.preparingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      )}

      {/* Typing indicator */}
      <TypingIndicator users={typingUsers} />

      {/* Scroll to bottom */}
      <ScrollToBottomButton
        visible={showScrollButton}
        onPress={scrollToBottom}
        unreadCount={unreadInView}
      />

      {/* Input bar */}
      <View style={[
        styles.inputContainer, 
        { 
          bottom: inputBottomPosition,
          paddingBottom: inputBottomPadding,
        }
      ]}>
        <TextInput
          ref={inputRef}
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
          activeOpacity={0.7}
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
    flexGrow: 1,
  },
  preparingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  typingContainer: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: INPUT_BAR_HEIGHT + 5,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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
  scrollToBottomContainer: {
    position: 'absolute',
    right: spacing.md,
    bottom: INPUT_BAR_HEIGHT + 10,
  },
  scrollToBottomButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  unreadBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  unreadBadgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '700',
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
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
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
    marginBottom: Platform.OS === 'ios' ? 2 : 0,
  },
  sendButtonDisabled: {
    backgroundColor: colors.lightGray,
  },
});

export default GroupChat;