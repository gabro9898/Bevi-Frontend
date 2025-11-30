// src/screens/GroupsScreen/components/GroupLeaderboard.js
// Classifica del gruppo

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../../theme';
import { useGetGroupLeaderboardQuery } from '../../../api/beviApi';

const MEDALS = ['🥇', '🥈', '🥉'];

const CHALLENGE_LABELS = {
  'ALL': 'Tutte le bevande',
  'ALCOHOL': '🍺 Solo Alcol',
  'ENERGY': '⚡ Solo Energy',
  'SOFT_DRINK': '🥤 Solo Bibite',
  'WATER': '💧 Solo Acqua',
};

const GroupLeaderboard = ({ groupId, currentUserId }) => {
  const { data, isLoading, error } = useGetGroupLeaderboardQuery(groupId);

  // Estrai dati
  const leaderboardData = data?.data || data;
  const leaderboard = leaderboardData?.leaderboard || [];
  const isHidden = leaderboardData?.hidden === true;
  const challengeCategory = leaderboardData?.challengeCategory || 'ALL';
  const myPosition = leaderboardData?.myPosition;

  // Render singolo item classifica
  const renderItem = ({ item, index }) => {
    const isTopThree = index < 3;
    const isMe = item.isMe || item.user?.id === currentUserId;

    return (
      <View style={[
        styles.leaderboardItem,
        isTopThree && styles.leaderboardItemTop,
        isMe && styles.leaderboardItemMe
      ]}>
        {/* Posizione */}
        <View style={styles.rankContainer}>
          {isTopThree ? (
            <Text style={styles.medal}>{MEDALS[index]}</Text>
          ) : (
            <Text style={styles.rank}>{item.rank}</Text>
          )}
        </View>

        {/* Avatar */}
        <View style={styles.avatarContainer}>
          {item.user?.profilePhoto ? (
            <Image source={{ uri: item.user.profilePhoto }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={20} color={colors.gray} />
            </View>
          )}
        </View>

        {/* Info */}
        <View style={styles.userInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.userName} numberOfLines={1}>
              {item.user?.nickname || item.user?.username || 'Utente'}
            </Text>
            {isMe && <Text style={styles.youBadge}>Tu</Text>}
          </View>
          <Text style={styles.userLevel}>Livello {item.user?.level || 1}</Text>
        </View>

        {/* Punteggio */}
        <View style={styles.scoreContainer}>
          <Text style={[styles.score, isTopThree && styles.scoreTop]}>
            {item.score || 0}
          </Text>
          <Text style={styles.scoreLabel}>punti</Text>
        </View>
      </View>
    );
  };

  // Loading
  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Caricamento classifica...</Text>
      </View>
    );
  }

  // Classifica nascosta
  if (isHidden) {
    return (
      <View style={styles.container}>
        <View style={styles.hiddenContainer}>
          <Ionicons name="eye-off" size={64} color={colors.lightGray} />
          <Text style={styles.hiddenTitle}>Classifica Nascosta</Text>
          <Text style={styles.hiddenText}>
            La classifica verrà rivelata a fine mese nella chat del gruppo.
          </Text>
          {myPosition && (
            <View style={styles.myScoreCard}>
              <Text style={styles.myScoreLabel}>Il tuo punteggio</Text>
              <Text style={styles.myScoreValue}>{myPosition.score || 0} punti</Text>
            </View>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header con info challenge */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerEmoji}>🏆</Text>
          <Text style={styles.headerTitle}>Classifica</Text>
        </View>
        {challengeCategory !== 'ALL' && (
          <View style={styles.challengeBadge}>
            <Text style={styles.challengeBadgeText}>
              {CHALLENGE_LABELS[challengeCategory] || challengeCategory}
            </Text>
          </View>
        )}
      </View>

      {/* Lista */}
      <FlatList
        data={leaderboard}
        keyExtractor={(item) => item.user?.id || item.rank?.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🏆</Text>
            <Text style={styles.emptyText}>Nessun punteggio</Text>
            <Text style={styles.emptySubtext}>
              Iniziate a bere per vedere la classifica!
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },

  // Header
  header: {
    backgroundColor: colors.white,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerEmoji: {
    fontSize: 24,
    marginRight: spacing.sm,
  },
  headerTitle: {
    ...typography.h3,
  },
  challengeBadge: {
    alignSelf: 'center',
    marginTop: spacing.sm,
    backgroundColor: colors.primary + '15',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.round,
  },
  challengeBadgeText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },

  // Hidden state
  hiddenContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  hiddenTitle: {
    ...typography.h2,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  hiddenText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  myScoreCard: {
    marginTop: spacing.xl,
    backgroundColor: colors.primary + '15',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  myScoreLabel: {
    ...typography.caption,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  myScoreValue: {
    ...typography.h1,
    color: colors.primary,
  },

  // List
  listContent: {
    padding: spacing.md,
  },

  // Leaderboard Item
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
  },
  leaderboardItemTop: {
    borderWidth: 1,
    borderColor: colors.warning + '50',
    backgroundColor: colors.warning + '05',
  },
  leaderboardItemMe: {
    backgroundColor: colors.bevi + '10',
    borderWidth: 1,
    borderColor: colors.bevi,
  },

  // Rank
  rankContainer: {
    width: 32,
    alignItems: 'center',
  },
  medal: {
    fontSize: 24,
  },
  rank: {
    ...typography.body,
    fontWeight: '700',
    color: colors.textSecondary,
  },

  // Avatar
  avatarContainer: {
    marginLeft: spacing.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.veryLightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // User Info
  userInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    ...typography.body,
    fontWeight: '600',
    flex: 1,
  },
  youBadge: {
    ...typography.caption,
    color: colors.white,
    backgroundColor: colors.bevi,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    marginLeft: spacing.sm,
    fontWeight: '600',
    fontSize: 10,
  },
  userLevel: {
    ...typography.caption,
    color: colors.textTertiary,
  },

  // Score
  scoreContainer: {
    alignItems: 'flex-end',
  },
  score: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  scoreTop: {
    color: colors.warning,
  },
  scoreLabel: {
    ...typography.caption,
    color: colors.textTertiary,
  },

  // Empty
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl * 2,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  emptyText: {
    ...typography.h3,
    color: colors.textSecondary,
  },
  emptySubtext: {
    ...typography.body,
    color: colors.textTertiary,
    marginTop: spacing.xs,
  },
});

export default GroupLeaderboard;