// src/screens/GroupsScreen/GroupDetailScreen.js
// Schermata dettaglio gruppo con tabs: Chat, Ruota, Classifica

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { useGetGroupByIdQuery, useGetGroupMembersQuery } from '../../api/beviApi';
import { useSelector } from 'react-redux';

// Componenti tabs
import GroupChat from './components/GroupChat';
import GroupLeaderboard from './components/GroupLeaderboard';

// Placeholder per la Ruota (da implementare)
const GroupWheel = ({ groupId }) => (
  <View style={styles.wheelPlaceholder}>
    <Text style={styles.wheelEmoji}>🎡</Text>
    <Text style={styles.wheelTitle}>Ruota delle Sfide</Text>
    <Text style={styles.wheelSubtitle}>Presto disponibile!</Text>
  </View>
);

const TABS = [
  { id: 'chat', label: 'Chat', icon: 'chatbubbles-outline' },
  { id: 'wheel', label: 'Ruota', icon: 'color-wand-outline' },
  { id: 'leaderboard', label: 'Classifica', icon: 'trophy-outline' },
];

const TabButton = ({ tab, isActive, onPress }) => (
  <TouchableOpacity
    style={[styles.tabButton, isActive && styles.tabButtonActive]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Ionicons
      name={tab.icon}
      size={20}
      color={isActive ? colors.primary : colors.gray}
    />
    <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
      {tab.label}
    </Text>
  </TouchableOpacity>
);

const GroupDetailScreen = ({ route, navigation }) => {
  const { groupId, groupName } = route.params;
  const [activeTab, setActiveTab] = useState('chat');

  // Ottieni l'utente corrente
  const currentUser = useSelector((state) => state.auth.user);
  const currentUserId = currentUser?.id;

  // API hooks
  const { data: groupData, isLoading: groupLoading } = useGetGroupByIdQuery(groupId);
  const { data: membersData, isLoading: membersLoading } = useGetGroupMembersQuery(groupId);

  // Estrai dati gruppo e membri
  const group = groupData?.data || groupData;
  const members = membersData?.data?.members || membersData?.data || [];
  const memberCount = members.length;

  // Vai alle info del gruppo
  const handleGoToInfo = () => {
    navigation.navigate('GroupInfo', {
      groupId,
      groupName: group?.name || groupName,
    });
  };

  // Render contenuto tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'chat':
        return <GroupChat groupId={groupId} currentUserId={currentUserId} />;
      case 'wheel':
        return <GroupWheel groupId={groupId} />;
      case 'leaderboard':
        return <GroupLeaderboard groupId={groupId} currentUserId={currentUserId} />;
      default:
        return null;
    }
  };

  const isLoading = groupLoading && !group;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Caricamento gruppo...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>

        {/* Nome gruppo cliccabile → va alle info */}
        <TouchableOpacity 
          style={styles.headerInfo}
          onPress={handleGoToInfo}
          activeOpacity={0.7}
        >
          <Text style={styles.headerTitle} numberOfLines={1}>
            {group?.name || groupName}
          </Text>
          <View style={styles.headerSubtitleRow}>
            <Text style={styles.headerSubtitle}>
              {membersLoading ? '...' : memberCount} {memberCount === 1 ? 'membro' : 'membri'}
            </Text>
            <Ionicons name="chevron-forward" size={14} color={colors.textTertiary} />
          </View>
        </TouchableOpacity>

        {/* Spacer per bilanciare */}
        <View style={styles.headerSpacer} />
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {TABS.map((tab) => (
          <TabButton
            key={tab.id}
            tab={tab}
            isActive={activeTab === tab.id}
            onPress={() => setActiveTab(tab.id)}
          />
        ))}
      </View>

      {/* Tab Content */}
      <View style={styles.content}>
        {renderTabContent()}
      </View>
    </SafeAreaView>
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

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.white,
  },
  backButton: {
    padding: spacing.sm,
    marginRight: spacing.xs,
  },
  headerInfo: {
    flex: 1,
    paddingVertical: spacing.xs,
  },
  headerTitle: {
    ...typography.h3,
    fontSize: 17,
  },
  headerSubtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  headerSpacer: {
    width: 40,
  },

  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: colors.primary,
  },
  tabLabel: {
    ...typography.bodySmall,
    color: colors.gray,
    marginLeft: spacing.xs,
  },
  tabLabelActive: {
    color: colors.primary,
    fontWeight: '600',
  },

  // Content
  content: {
    flex: 1,
  },

  // Wheel Placeholder
  wheelPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  wheelEmoji: {
    fontSize: 80,
    marginBottom: spacing.lg,
  },
  wheelTitle: {
    ...typography.h2,
    marginBottom: spacing.sm,
  },
  wheelSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
});

export default GroupDetailScreen;