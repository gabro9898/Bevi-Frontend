// src/screens/GroupsScreen/components/messages/WheelResultMessage.js
// ✅ Risultati ruota della fortuna 🎡
// ✅ FIX: option è un oggetto, usa .label

import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../../../../theme';
import { MessageAvatar, formatTime } from './index';

const WheelResultMessage = memo(({ message }) => {
  const sender = message.sender;
  const wheelResult = message.wheelResult;
  
  // Estrai info dalla ruota
  const spinnerName = wheelResult?.spinner?.nickname || wheelResult?.spinner?.username || 'Qualcuno';
  const targetName = wheelResult?.target?.nickname || wheelResult?.target?.username;
  
  // ✅ FIX: option può essere un oggetto {label, icon, color}, estrai label
  const optionObj = wheelResult?.option;
  const optionLabel = typeof optionObj === 'string' ? optionObj : optionObj?.label;

  // Debug per vedere la struttura
  console.log('🎡 WheelResultMessage:', {
    id: message.id,
    optionObj: typeof optionObj,
    optionLabel,
  });

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* Icona ruota */}
        <View style={styles.iconContainer}>
          <Text style={styles.wheelIcon}>🎡</Text>
        </View>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Ruota della Fortuna!</Text>
          <Text style={styles.timestamp}>{formatTime(message.createdAt)}</Text>
        </View>

        {/* Risultato */}
        <View style={styles.resultContainer}>
          {optionLabel && (
            <View style={styles.optionBubble}>
              <Text style={styles.optionText}>{optionLabel}</Text>
            </View>
          )}
        </View>

        {/* Chi ha girato per chi */}
        {targetName && (
          <View style={styles.playersContainer}>
            <View style={styles.player}>
              <MessageAvatar sender={wheelResult?.spinner} size={24} />
              <Text style={styles.playerName}>{spinnerName}</Text>
            </View>
            <Text style={styles.arrow}>→</Text>
            <View style={styles.player}>
              <MessageAvatar sender={wheelResult?.target} size={24} />
              <Text style={styles.playerName}>{targetName}</Text>
            </View>
          </View>
        )}

        {/* Messaggio completo */}
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
    maxWidth: 300,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.primary + '20',
  },

  // Icon
  iconContainer: {
    alignItems: 'center',
    paddingTop: spacing.md,
  },
  wheelIcon: {
    fontSize: 48,
  },

  // Header
  header: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  title: {
    ...typography.h3,
    color: colors.primary,
    fontWeight: '700',
  },
  timestamp: {
    ...typography.caption,
    color: colors.textTertiary,
    fontSize: 11,
  },

  // Result
  resultContainer: {
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  optionBubble: {
    backgroundColor: colors.primary + '15',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  optionText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Players
  playersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    marginTop: spacing.xs,
  },
  player: {
    alignItems: 'center',
    marginHorizontal: spacing.sm,
  },
  playerName: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
    fontSize: 11,
  },
  arrow: {
    fontSize: 20,
    color: colors.primary,
  },

  // Message
  messageText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    fontSize: 12,
  },
});

export default WheelResultMessage;