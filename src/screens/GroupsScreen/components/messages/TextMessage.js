// src/screens/GroupsScreen/components/messages/TextMessage.js
// ✅ Messaggi di testo normali con avatar

import React, { memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { colors, typography, spacing } from '../../../../theme';
import { MessageAvatar, getAvatarColor, formatTime } from './index';

const TextMessage = memo(({
  message,
  isMe,
  isFirstInGroup = true,
  isLastInGroup = true,
  onLongPress,
  onPress,
}) => {
  const sender = message.sender;
  const isDeleted = message.isDeleted;

  return (
    <View style={[
      styles.messageRow,
      isMe ? styles.messageRowMe : styles.messageRowOther
    ]}>
      {/* Avatar (solo per messaggi degli altri, primo del gruppo) */}
      {!isMe && (
        <View style={styles.avatarColumn}>
          {isFirstInGroup ? (
            <MessageAvatar sender={sender} size={32} />
          ) : (
            <View style={styles.avatarSpacer} />
          )}
        </View>
      )}

      {/* Bubble */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onPress}
        onLongPress={() => onLongPress?.(message)}
        delayLongPress={400}
        style={[
          styles.bubble,
          isMe ? styles.bubbleMe : styles.bubbleOther,
          isDeleted && styles.bubbleDeleted,
        ]}
      >
        {/* Nome mittente (solo per altri, primo del gruppo) */}
        {!isMe && isFirstInGroup && !isDeleted && (
          <Text style={[styles.senderName, { color: getAvatarColor(sender?.nickname || sender?.username) }]}>
            {sender?.nickname || sender?.username || 'Utente'}
          </Text>
        )}

        {/* Contenuto messaggio */}
        <Text style={[
          styles.messageText,
          isMe && styles.messageTextMe,
          isDeleted && styles.messageTextDeleted
        ]}>
          {isDeleted ? '🚫 Messaggio eliminato' : (message.content || message.message)}
        </Text>

        {/* Orario */}
        {!isDeleted && (
          <Text style={[styles.messageTime, isMe && styles.messageTimeMe]}>
            {formatTime(message.createdAt)}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
});

const styles = StyleSheet.create({
  // Row container
  messageRow: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  messageRowMe: {
    justifyContent: 'flex-end',
  },
  messageRowOther: {
    justifyContent: 'flex-start',
  },

  // Avatar
  avatarColumn: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 2,
  },
  avatarSpacer: {
    width: 32,
    height: 32,
  },

  // Bubble
  bubble: {
    maxWidth: '75%',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 2,
    borderRadius: 18,
  },
  bubbleMe: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: colors.white,
    borderBottomLeftRadius: 4,
  },
  bubbleDeleted: {
    backgroundColor: colors.veryLightGray,
  },

  // Sender name
  senderName: {
    ...typography.caption,
    fontWeight: '600',
    marginBottom: 1,
    fontSize: 12,
  },

  // Message text
  messageText: {
    ...typography.body,
    color: colors.textPrimary,
    fontSize: 15,
    lineHeight: 20,
  },
  messageTextMe: {
    color: colors.white,
  },
  messageTextDeleted: {
    color: colors.textTertiary,
    fontStyle: 'italic',
    fontSize: 13,
  },

  // Time
  messageTime: {
    ...typography.caption,
    color: colors.textTertiary,
    marginTop: 2,
    alignSelf: 'flex-end',
    fontSize: 10,
  },
  messageTimeMe: {
    color: 'rgba(255,255,255,0.7)',
  },
});

export default TextMessage;