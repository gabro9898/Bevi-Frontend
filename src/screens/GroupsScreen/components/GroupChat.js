// src/screens/GroupsScreen/components/GroupChat.js
// Componente chat del gruppo

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Platform,
  ActivityIndicator,
  Alert,
  ActionSheetIOS,
  Image,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, spacing, borderRadius } from '../../../theme';
import { 
  useGetGroupMessagesQuery, 
  useSendGroupMessageMutation,
  useDeleteGroupMessageMutation,
} from '../../../api/beviApi';

const GroupChat = ({ groupId, currentUserId }) => {
  const [messageText, setMessageText] = useState('');
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const flatListRef = useRef(null);
  const insets = useSafeAreaInsets();

  // API hooks
  const { 
    data: messagesData, 
    isLoading, 
    refetch 
  } = useGetGroupMessagesQuery(groupId, {
    pollingInterval: 5000,
  });

  const [sendMessage, { isLoading: isSending }] = useSendGroupMessageMutation();
  const [deleteMessage, { isLoading: isDeleting }] = useDeleteGroupMessageMutation();

  // Estrai messaggi
  const messages = messagesData?.data?.messages || messagesData?.data || [];

  // Gestione tastiera
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onKeyboardShow = (e) => {
      const keyboardHeight = e.endCoordinates.height;
      const bottomInset = insets.bottom || 0;
      const offset = Platform.OS === 'ios' 
        ? keyboardHeight - bottomInset 
        : keyboardHeight;
      
      setKeyboardOffset(offset);
      
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    };

    const onKeyboardHide = () => {
      setKeyboardOffset(0);
    };

    const showSubscription = Keyboard.addListener(showEvent, onKeyboardShow);
    const hideSubscription = Keyboard.addListener(hideEvent, onKeyboardHide);

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [insets.bottom]);

  // Scrolla in fondo quando arrivano nuovi messaggi
  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  // Chiudi tastiera
  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  // Invia messaggio
  const handleSend = async () => {
    if (!messageText.trim() || isSending) return;

    const text = messageText.trim();
    setMessageText('');

    try {
      await sendMessage({ groupId, message: text }).unwrap();
      refetch();
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.log('Errore invio messaggio:', error);
      setMessageText(text);
    }
  };

  // Elimina messaggio
  const handleDelete = async (messageId) => {
    Alert.alert(
      'Elimina messaggio',
      'Sei sicuro di voler eliminare questo messaggio?',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Elimina',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMessage(messageId).unwrap();
              refetch();
            } catch (error) {
              console.log('Errore eliminazione:', error);
              Alert.alert('Errore', error?.data?.message || 'Impossibile eliminare il messaggio');
            }
          },
        },
      ]
    );
  };

  // Copia messaggio
  const handleCopy = (text) => {
    Alert.alert('Copiato', 'Messaggio copiato negli appunti');
  };

  // Mostra opzioni messaggio (long press)
  const showMessageOptions = (message) => {
    const isMyMessage = message.sender?.id === currentUserId || message.senderId === currentUserId || message.isMe;
    
    if (message.isDeleted || message.type === 'SYSTEM' || message.type === 'DRINK_LOG' || message.type === 'LEADERBOARD' || message.type === 'WHEEL_RESULT') {
      return;
    }

    if (Platform.OS === 'ios') {
      const options = isMyMessage 
        ? ['Annulla', 'Copia', 'Elimina']
        : ['Annulla', 'Copia'];
      
      const destructiveIndex = isMyMessage ? 2 : undefined;

      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          destructiveButtonIndex: destructiveIndex,
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            handleCopy(message.content || message.message);
          } else if (buttonIndex === 2 && isMyMessage) {
            handleDelete(message.id);
          }
        }
      );
    } else {
      const buttons = [
        { text: 'Annulla', style: 'cancel' },
        { text: 'Copia', onPress: () => handleCopy(message.content || message.message) },
      ];
      
      if (isMyMessage) {
        buttons.push({ 
          text: 'Elimina', 
          style: 'destructive', 
          onPress: () => handleDelete(message.id) 
        });
      }

      Alert.alert('Opzioni messaggio', null, buttons);
    }
  };

  // Formatta la data
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Oggi';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Ieri';
    }
    return date.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
  };

  // Raggruppa messaggi per data
  const groupMessagesByDate = () => {
    const grouped = [];
    let currentDate = null;

    messages.forEach((msg) => {
      const msgDate = formatDate(msg.createdAt);
      if (msgDate !== currentDate) {
        grouped.push({ type: 'date', date: msgDate, id: `date-${msg.id}` });
        currentDate = msgDate;
      }
      grouped.push({ type: 'message', ...msg });
    });

    return grouped;
  };

  const groupedMessages = groupMessagesByDate();

  // Render messaggio di sistema
  const renderSystemMessage = (item) => {
    const isLeaderboard = item.type === 'LEADERBOARD' || item.content?.includes('CLASSIFICA');
    
    return (
      <TouchableWithoutFeedback onPress={dismissKeyboard}>
        <View style={styles.systemMessageContainer}>
          <View style={[
            styles.systemMessageBubble,
            isLeaderboard && styles.leaderboardMessageBubble
          ]}>
            {isLeaderboard && <Text style={styles.leaderboardIcon}>🏆</Text>}
            <Text style={[
              styles.systemMessageText,
              isLeaderboard && styles.leaderboardMessageText
            ]}>
              {item.content || item.message}
            </Text>
          </View>
        </View>
      </TouchableWithoutFeedback>
    );
  };

  // Render messaggio drink log
  const renderDrinkLogMessage = (item) => {
    return (
      <TouchableWithoutFeedback onPress={dismissKeyboard}>
        <View style={styles.drinkLogContainer}>
          <View style={styles.drinkLogBubble}>
            <View style={styles.drinkLogHeader}>
              {item.sender?.profilePhoto ? (
                <Image source={{ uri: item.sender.profilePhoto }} style={styles.drinkLogAvatar} />
              ) : (
                <View style={styles.drinkLogAvatarPlaceholder}>
                  <Ionicons name="person" size={12} color={colors.gray} />
                </View>
              )}
              <Text style={styles.drinkLogSender}>
                {item.sender?.nickname || item.sender?.username || 'Qualcuno'}
              </Text>
            </View>
            <Text style={styles.drinkLogText}>{item.content || item.message}</Text>
            <Text style={styles.drinkLogTime}>{formatTime(item.createdAt)}</Text>
          </View>
        </View>
      </TouchableWithoutFeedback>
    );
  };

  // Render messaggio wheel result
  const renderWheelResultMessage = (item) => {
    return (
      <TouchableWithoutFeedback onPress={dismissKeyboard}>
        <View style={styles.wheelResultContainer}>
          <View style={styles.wheelResultBubble}>
            <Text style={styles.wheelResultIcon}>🎡</Text>
            <Text style={styles.wheelResultText}>{item.content || item.message}</Text>
            <Text style={styles.wheelResultTime}>{formatTime(item.createdAt)}</Text>
          </View>
        </View>
      </TouchableWithoutFeedback>
    );
  };

  // Render singolo messaggio
  const renderItem = ({ item }) => {
    if (item.type === 'date') {
      return (
        <TouchableWithoutFeedback onPress={dismissKeyboard}>
          <View style={styles.dateSeparator}>
            <Text style={styles.dateText}>{item.date}</Text>
          </View>
        </TouchableWithoutFeedback>
      );
    }

    if (item.type === 'SYSTEM' || item.type === 'LEADERBOARD') {
      return renderSystemMessage(item);
    }

    if (item.type === 'DRINK_LOG') {
      return renderDrinkLogMessage(item);
    }

    if (item.type === 'WHEEL_RESULT') {
      return renderWheelResultMessage(item);
    }

    const isMe = item.sender?.id === currentUserId || item.senderId === currentUserId || item.isMe;

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
          {!isMe && !item.isDeleted && (
            <Text style={styles.senderName}>
              {item.sender?.nickname || item.sender?.username || 'Utente'}
            </Text>
          )}
          <Text style={[
            styles.messageText, 
            isMe && styles.messageTextMe,
            item.isDeleted && styles.messageTextDeleted
          ]}>
            {item.isDeleted ? '🚫 Messaggio eliminato' : (item.content || item.message)}
          </Text>
          {!item.isDeleted && (
            <Text style={[styles.messageTime, isMe && styles.messageTimeMe]}>
              {formatTime(item.createdAt)}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Caricamento chat...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Lista messaggi */}
      <FlatList
        ref={flatListRef}
        data={groupedMessages}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.messagesList,
          { paddingBottom: keyboardOffset > 0 ? keyboardOffset + 60 : 70 }
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        onScrollBeginDrag={dismissKeyboard}
        ListEmptyComponent={
          <TouchableWithoutFeedback onPress={dismissKeyboard}>
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>💬</Text>
              <Text style={styles.emptyText}>Nessun messaggio</Text>
              <Text style={styles.emptySubtext}>Inizia la conversazione!</Text>
            </View>
          </TouchableWithoutFeedback>
        }
      />

      {/* Input messaggio */}
      <View style={[
        styles.inputContainer,
        { transform: [{ translateY: -keyboardOffset }] }
      ]}>
        <TextInput
          style={styles.input}
          placeholder="Scrivi un messaggio..."
          placeholderTextColor={colors.textMuted}
          value={messageText}
          onChangeText={setMessageText}
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

  // Messages list
  messagesList: {
    padding: spacing.md,
    paddingBottom: 70,
    flexGrow: 1,
  },

  // Date separator
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

  // System Message
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
  leaderboardMessageBubble: {
    backgroundColor: colors.warning + '15',
    borderWidth: 1,
    borderColor: colors.warning + '30',
  },
  leaderboardIcon: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  leaderboardMessageText: {
    color: colors.textPrimary,
    fontStyle: 'normal',
    fontWeight: '500',
  },

  // Drink Log Message
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
  drinkLogHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  drinkLogAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: spacing.xs,
  },
  drinkLogAvatarPlaceholder: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.xs,
  },
  drinkLogSender: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.bevi,
  },
  drinkLogText: {
    ...typography.body,
    color: colors.textPrimary,
    fontSize: 14,
  },
  drinkLogTime: {
    ...typography.caption,
    color: colors.textTertiary,
    fontSize: 10,
    marginTop: spacing.xs,
    textAlign: 'right',
  },

  // Wheel Result Message
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
  wheelResultTime: {
    ...typography.caption,
    color: colors.textTertiary,
    fontSize: 10,
    marginTop: spacing.xs,
  },

  // Normal Message
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
  messageTextMe: {
    color: colors.textPrimary,
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

  // Empty
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

  // Input
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