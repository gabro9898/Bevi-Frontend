import { memo } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '../../../../theme';

// ==================== COSTANTI ====================

export const AVATAR_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
  '#BB8FCE', '#85C1E9', '#F8B500', '#FF8C00',
];

// ==================== UTILITIES ====================

/**
 * Genera colore consistente basato sul nome
 */
export const getAvatarColor = (name) => {
  if (!name) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

/**
 * Formatta l'orario
 */
export const formatTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
};

/**
 * Verifica se è un URL Cloudinary valido
 */
export const isValidCloudinaryUrl = (url) => {
  return url && url.startsWith('https://res.cloudinary.com');
};

// ==================== COMPONENTI CONDIVISI ====================

/**
 * Avatar componente riutilizzabile
 */
export const MessageAvatar = memo(({ sender, size = 32 }) => {
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

// ==================== STYLES CONDIVISI ====================

export const styles = StyleSheet.create({
  // Avatar
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
});

// ==================== EXPORTS ====================

export { default as TextMessage } from './TextMessage';
export { default as SystemMessage } from './SystemMessage';
export { default as DrinkLogMessage } from './DrinkLogMessage';
export { default as WheelResultMessage } from './WheelResultMessage';