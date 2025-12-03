// src/screens/GroupsScreen/components/messages/DrinkLogMessage.js
// ✅ Messaggi bevute con foto Cloudinary 🍺
// ✅ FIX: drinkCategory è un oggetto, usa .label

import React, { memo, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../../../theme';
import { isValidCloudinaryUrl, MessageAvatar, formatTime } from './index';

const DrinkLogMessage = memo(({ message }) => {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  // Estrai URL immagine da vari possibili campi
  const drinkPhotoUrl = message.imageUrl || message.drinkLog?.photoUrl || message.metadata?.photoUrl;
  
  // Info bevuta
  const drinkName = message.drinkLog?.drink?.name || 'Bevanda';
  const drinkBrand = message.drinkLog?.drink?.brand;
  
  // ✅ FIX: category è un oggetto {label, icon, color}, estrai label
  const categoryObj = message.drinkLog?.drink?.category;
  const categoryLabel = typeof categoryObj === 'string' ? categoryObj : categoryObj?.label;
  
  const pointsEarned = message.drinkLog?.pointsEarned || 0;
  const sender = message.sender;
  const senderName = sender?.nickname || sender?.username || 'Qualcuno';

  // Solo URL Cloudinary sono validi
  const hasValidImage = isValidCloudinaryUrl(drinkPhotoUrl);

  // Debug
  console.log('🍺 DrinkLogMessage:', {
    id: message.id,
    hasValidImage,
    drinkPhotoUrl: drinkPhotoUrl?.substring(0, 50),
  });

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* Header con avatar e nome */}
        <View style={styles.header}>
          <MessageAvatar sender={sender} size={28} />
          <View style={styles.headerText}>
            <Text style={styles.senderName}>{senderName}</Text>
            <Text style={styles.timestamp}>{formatTime(message.createdAt)}</Text>
          </View>
          <View style={styles.pointsBadge}>
            <Text style={styles.pointsText}>+{pointsEarned}</Text>
            <Ionicons name="star" size={12} color={colors.warning} />
          </View>
        </View>

        {/* Immagine bevuta */}
        {hasValidImage && (
          <View style={styles.imageContainer}>
            {imageLoading && (
              <View style={styles.imagePlaceholder}>
                <ActivityIndicator color={colors.primary} />
              </View>
            )}
            {!imageError ? (
              <Image
                source={{ uri: drinkPhotoUrl }}
                style={[styles.image, imageLoading && styles.imageHidden]}
                resizeMode="cover"
                onLoadStart={() => setImageLoading(true)}
                onLoadEnd={() => setImageLoading(false)}
                onError={() => {
                  setImageError(true);
                  setImageLoading(false);
                  console.log('❌ Errore caricamento immagine drink');
                }}
              />
            ) : (
              <View style={styles.imageErrorContainer}>
                <Ionicons name="image-outline" size={40} color={colors.textTertiary} />
                <Text style={styles.imageErrorText}>Immagine non disponibile</Text>
              </View>
            )}
          </View>
        )}

        {/* Info bevanda */}
        <View style={styles.drinkInfo}>
          <Text style={styles.drinkEmoji}>🍺</Text>
          <View style={styles.drinkDetails}>
            <Text style={styles.drinkName}>{drinkName}</Text>
            {drinkBrand && (
              <Text style={styles.drinkBrand}>{drinkBrand}</Text>
            )}
          </View>
          {categoryLabel && (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{categoryLabel}</Text>
            </View>
          )}
        </View>

        {/* Messaggio */}
        <Text style={styles.messageText}>
          {message.content || message.message}
        </Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    width: '100%',
    maxWidth: 320,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.bevi + '20',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.veryLightGray,
  },
  headerText: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  senderName: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textPrimary,
    fontSize: 14,
  },
  timestamp: {
    ...typography.caption,
    color: colors.textTertiary,
    fontSize: 11,
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.round,
  },
  pointsText: {
    ...typography.caption,
    color: colors.warning,
    fontWeight: '700',
    marginRight: 2,
  },

  // Immagine
  imageContainer: {
    width: '100%',
    height: 200,
    backgroundColor: colors.veryLightGray,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageHidden: {
    opacity: 0,
  },
  imagePlaceholder: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageErrorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageErrorText: {
    ...typography.caption,
    color: colors.textTertiary,
    marginTop: spacing.xs,
  },

  // Drink info
  drinkInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    backgroundColor: colors.bevi + '08',
  },
  drinkEmoji: {
    fontSize: 24,
  },
  drinkDetails: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  drinkName: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textPrimary,
    fontSize: 14,
  },
  drinkBrand: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 12,
  },
  categoryBadge: {
    backgroundColor: colors.bevi + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  categoryText: {
    ...typography.caption,
    color: colors.bevi,
    fontSize: 10,
    fontWeight: '600',
  },

  // Message
  messageText: {
    ...typography.body,
    color: colors.textSecondary,
    fontSize: 13,
    padding: spacing.sm,
    paddingTop: 0,
  },
});

export default DrinkLogMessage;