// src/screens/GroupsScreen/components/GroupChat.js
// ✅ VERSIONE PULITA - InputBar platform-specific separato

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
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
import InputBar from './InputBar'; // ✅ Auto-seleziona .ios.js o .android.js

// ==================== COSTANTI ====================
const INPUT_BAR_HEIGHT = 56;
const isIOS = Platform.OS === 'ios';

// ==================== DEBUG ====================
const DEBUG = true;
const log = (tag, data) => {
  if (DEBUG) {
    console.log(`📱 [${tag}]`, typeof data === 'object' ? JSON.stringify(data) : data);
  }
};

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
  }, [visible]);

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
  // ============ SAFE AREA ============
  const insets = useSafeAreaInsets();
  const bottomInset = insets.bottom || 0;

  // ============ DEBUG: Log platform info ============
  useEffect(() => {
    log('INIT', {
      platform: Platform.OS,
      bottomInset,
      inputBarHeight: INPUT_BAR_HEIGHT,
    });
  }, [bottomInset]);

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

  // ============ LOCAL STATE ============
  const [messageText, setMessageText] = useState('');
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [unreadInView, setUnreadInView] = useState(0);
  const [isReady, setIsReady] = useState(false);

  // ============ REFS ============
  const flatListRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const isNearBottom = useRef(true);
  const prevMessagesLength = useRef(0);
  const hasScrolledToEnd = useRef(false);
  const scrollTimeoutRef = useRef(null);

  // ============ RESET ON GROUP CHANGE ============
  useEffect(() => {
    hasScrolledToEnd.current = false;
    prevMessagesLength.current = 0;
    setIsReady(false);
    
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
  }, [groupId]);

  // ============ AUTO-SCROLL NEW MESSAGES ============
  useEffect(() => {
    if (messages.length > prevMessagesLength.current && hasScrolledToEnd.current) {
      const newCount = messages.length - prevMessagesLength.current;
      
      if (isNearBottom.current) {
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      } else {
        const lastMsgs = messages.slice(-newCount);
        const othersMsgs = lastMsgs.filter(m => !m.isMe);
        if (othersMsgs.length > 0) {
          setUnreadInView(c => c + othersMsgs.length);
        }
      }
    }
    prevMessagesLength.current = messages.length;
  }, [messages.length]);

  // ============ CLEANUP ============
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, []);

  // ============ HANDLERS ============

  const handleContentSizeChange = useCallback((w, h) => {
    if (hasScrolledToEnd.current) return;
    if (messages.length === 0 || h === 0) return;

    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);

    scrollTimeoutRef.current = setTimeout(() => {
      if (!hasScrolledToEnd.current && flatListRef.current) {
        flatListRef.current.scrollToEnd({ animated: false });
        hasScrolledToEnd.current = true;
        setTimeout(() => setIsReady(true), 50);
      }
    }, 300);
  }, [messages.length]);

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

  const handleInputFocus = useCallback(() => {
    log('INPUT', 'Focus');
    // Auto-scroll to bottom quando si apre la tastiera
    setTimeout(() => {
      if (isNearBottom.current) {
        flatListRef.current?.scrollToEnd({ animated: true });
      }
    }, 300);
  }, []);

  const handleInputBlur = useCallback(() => {
    log('INPUT', 'Blur');
  }, []);

  const handleSend = useCallback(async () => {
    const text = messageText.trim();
    if (!text || isSending) return;

    log('SEND', `Invio: "${text}"`);

    const textToSend = text;
    sendTyping(false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    setMessageText('');

    const result = await sendMessage(textToSend);

    if (!result.success) {
      setMessageText(textToSend);
      Alert.alert('Errore', 'Impossibile inviare il messaggio');
      log('SEND', 'Errore invio');
    } else {
      log('SEND', 'Successo');
      Keyboard.dismiss();
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
          if (!result.success) Alert.alert('Errore', 'Impossibile eliminare');
        },
      },
    ]);
  }, [deleteMessage]);

  const showMessageOptions = useCallback((message) => {
    const isMine = message.isMe === true;
    if (message.isDeleted || ['SYSTEM', 'DRINK_LOG', 'LEADERBOARD', 'WHEEL_RESULT'].includes(message.type)) return;

    Keyboard.dismiss();

    if (isIOS) {
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
    const distFromBottom = contentSize.height - contentOffset.y - layoutMeasurement.height;

    const wasNear = isNearBottom.current;
    isNearBottom.current = distFromBottom < 100;
    setShowScrollButton(distFromBottom > 300);

    if (!wasNear && isNearBottom.current) setUnreadInView(0);
  }, []);

  const scrollToBottom = useCallback(() => {
    flatListRef.current?.scrollToEnd({ animated: true });
    setUnreadInView(0);
  }, []);

  const dismissKeyboard = useCallback(() => {
    Keyboard.dismiss();
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
      const isSpecial = ['SYSTEM', 'DRINK_LOG', 'LEADERBOARD', 'WHEEL_RESULT'].includes(msg.type);
      
      const prevSame = prevMsg && 
        normalizeId(prevMsg.sender?.id || prevMsg.senderId) === normalizeId(msg.sender?.id || msg.senderId) &&
        formatDate(prevMsg.createdAt) === msgDate &&
        !['SYSTEM', 'DRINK_LOG', 'LEADERBOARD', 'WHEEL_RESULT'].includes(prevMsg.type) && !isSpecial;
      
      const nextSame = nextMsg &&
        normalizeId(nextMsg.sender?.id || nextMsg.senderId) === normalizeId(msg.sender?.id || msg.senderId) &&
        formatDate(nextMsg.createdAt) === msgDate &&
        !['SYSTEM', 'DRINK_LOG', 'LEADERBOARD', 'WHEEL_RESULT'].includes(nextMsg.type) && !isSpecial;

      grouped.push({
        type: 'message',
        ...msg,
        isFirstInGroup: !prevSame,
        isLastInGroup: !nextSame,
      });
    });

    return grouped;
  }, [messages, normalizeId, formatDate]);

  // ============ RENDER ITEM ============

  const renderItem = useCallback(({ item }) => {
    if (item.type === 'date') return <DateSeparator date={item.date} />;

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

  // ============ LOADING ============

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Caricamento chat...</Text>
      </View>
    );
  }

  // ============ RENDER ============

  return (
    <View style={styles.container}>
      {/* Connection banner */}
      {!isConnected && (
        <TouchableOpacity style={styles.connectionBanner} onPress={reconnect}>
          <Ionicons name="cloud-offline" size={14} color={colors.warning} />
          <Text style={styles.connectionText}>Connessione... Tocca per riprovare</Text>
        </TouchableOpacity>
      )}

      {/* Messages list */}
      <FlatList
        ref={flatListRef}
        data={groupedMessages}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        onContentSizeChange={handleContentSizeChange}
        contentContainerStyle={[
          styles.messagesList,
          { paddingBottom: INPUT_BAR_HEIGHT + bottomInset + spacing.md }
        ]}
        style={[styles.flatList, { opacity: isReady ? 1 : 0 }]}
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

      {/* Preparing overlay */}
      {!isReady && groupedMessages.length > 0 && (
        <View style={styles.preparingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      )}

      {/* Typing indicator */}
      {typingUsers.length > 0 && (
        <View style={styles.typingWrapper}>
          <TypingIndicator users={typingUsers} />
        </View>
      )}

      {/* Scroll to bottom */}
      <ScrollToBottomButton
        visible={showScrollButton}
        onPress={scrollToBottom}
        unreadCount={unreadInView}
      />

      {/* ✅ INPUT BAR - Platform specific */}
      <InputBar
        value={messageText}
        onChangeText={handleTextChange}
        onSend={handleSend}
        isSending={isSending}
        onFocus={handleInputFocus}
        onBlur={handleInputBlur}
      />
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
  flatList: {
    flex: 1,
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
  typingWrapper: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xs,
  },
  typingContainer: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    alignSelf: 'flex-start',
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
    bottom: INPUT_BAR_HEIGHT + spacing.lg,
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
});

export default GroupChat;
