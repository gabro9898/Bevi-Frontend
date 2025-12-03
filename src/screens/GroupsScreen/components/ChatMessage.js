// src/screens/GroupsScreen/components/ChatMessage.js
// ✅ NUOVO COMPONENTE - Messaggio singolo con avatar stile WhatsApp
// ✅ MANTIENE LOGICA ORIGINALE DRINK_LOG con log debug

import React, { memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../../theme';

// Colori per avatar senza foto (basati sul nome)
const AVATAR_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
  '#BB8FCE', '#85C1E9', '#F8B500', '#FF8C00',
];

// Genera colore consistente basato sul nome
const getAvatarColor = (name) => {
  if (!name) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

// Formatta l'orario
const formatTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
};

// ==================== AVATAR COMPONENT ====================
const MessageAvatar = memo(({ sender, size = 32 }) => {
  const name = sender?.nickname || sender?.username || '?';
  const initial = name.charAt(0).toUpperCase();
  const bgColor = getAvatarColor(name);

  if (sender?.profilePhoto) {
    return (
      <Image
        source={{ uri: sender.profilePhoto }}
        style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}
      />
    );
  }

  return (
    <View style={[
      styles.avatarPlaceholder,
      { width: size, height: size, borderRadius: size / 2, backgroundColor: bgColor }
    ]}>
      <Text style={[styles.avatarInitial, { fontSize: size * 0.45 }]}>{initial}</Text>
    </View>
  );
});

// ==================== MAIN COMPONENT ====================
const ChatMessage = memo(({
  message,
  isMe,
  isFirstInGroup = true,
  isLastInGroup = true,
  onLongPress,
  onPress,
}) => {
  const sender = message.sender;

  // ==================== MESSAGGIO DI SISTEMA ====================
  if (message.type === 'SYSTEM' || message.type === 'LEADERBOARD') {
    return (
      <View style={styles.systemContainer}>
        <View style={styles.systemBubble}>
          <Text style={styles.systemText}>{message.content || message.message}</Text>
        </View>
      </View>
    );
  }

  // ==================== MESSAGGIO DRINK_LOG (LOGICA ORIGINALE) ====================
  if (message.type === 'DRINK_LOG') {
    // 🔍 DEBUG - Vediamo cosa arriva (ORIGINALE)
    console.log('🍺 DRINK_LOG DEBUG:', JSON.stringify({
      id: message.id,
      imageUrl: message.imageUrl,
      drinkLog: message.drinkLog,
      content: message.content?.substring(0, 50),
    }, null, 2));
    
    // Estrai URL immagine da vari possibili campi (ORIGINALE)
    const drinkPhotoUrl = message.imageUrl || message.drinkLog?.photoUrl || message.metadata?.photoUrl;
    
    console.log('🖼️ drinkPhotoUrl finale:', drinkPhotoUrl);
    
    // Solo URL Cloudinary sono validi (i file:// locali non funzionano) (ORIGINALE)
    const isValidCloudinaryUrl = drinkPhotoUrl && drinkPhotoUrl.startsWith('https://res.cloudinary.com');

    return (
      <View style={styles.drinkLogContainer}>
        <View style={styles.drinkLogBubble}>
          {/* ✅ Immagine della bevuta (solo se URL Cloudinary valido) */}
          {isValidCloudinaryUrl && (
            <Image
              source={{ uri: drinkPhotoUrl }}
              style={styles.drinkLogImage}
              resizeMode="cover"
              onLoad={() => console.log('✅ Immagine caricata:', drinkPhotoUrl.substring(0, 50))}
              onError={(e) => console.log('❌ Errore caricamento immagine:', e.nativeEvent.error)}
            />
          )}
          <Text style={styles.drinkLogText}>{message.content || message.message}</Text>
        </View>
      </View>
    );
  }

  // ==================== MESSAGGIO WHEEL_RESULT (ORIGINALE) ====================
  if (message.type === 'WHEEL_RESULT') {
    return (
      <View style={styles.wheelResultContainer}>
        <View style={styles.wheelResultBubble}>
          <Text style={styles.wheelResultIcon}>🎡</Text>
          <Text style={styles.wheelResultText}>{message.content || message.message}</Text>
        </View>
      </View>
    );
  }

  // ==================== MESSAGGIO NORMALE CON AVATAR ====================
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

// ==================== STYLES ====================
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
  avatar: {
    backgroundColor: colors.veryLightGray,
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    color: colors.white,
    fontWeight: '600',
  },

  // Bubble base
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

  // Message time
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

  // System message (ORIGINALE)
  systemContainer: {
    alignItems: 'center',
    marginVertical: spacing.sm,
  },
  systemBubble: {
    backgroundColor: colors.veryLightGray,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    maxWidth: '85%',
  },
  systemText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },

  // Drink log (STILI ORIGINALI)
  drinkLogContainer: {
    alignItems: 'center',
    marginVertical: spacing.sm,
  },
  drinkLogBubble: {
    backgroundColor: colors.bevi + '15',
    borderWidth: 1,
    borderColor: colors.bevi + '30',
    borderRadius: borderRadius.lg,
    width: 280,
    overflow: 'hidden',
  },
  drinkLogImage: {
    width: 280,
    height: 200,
    backgroundColor: colors.veryLightGray,
  },
  drinkLogText: {
    ...typography.body,
    color: colors.textPrimary,
    fontSize: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },

  // Wheel result (STILI ORIGINALI)
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
});

export default ChatMessage;