// src/screens/GroupsScreen/GroupDetailScreen.js
// Schermata dettaglio gruppo con tabs: Chat, Ruota, Classifica
// ✅ AGGIORNATO: Condivisione con deep link + fallback web

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { 
  useGetGroupByIdQuery, 
  useGetGroupMembersQuery,
  useGetGroupInviteLinkQuery,
  useGetMeQuery,
} from '../../api/beviApi';
import { useSelector } from 'react-redux';
import { shareGroup } from '../../hooks/useDeepLinks';

// Componenti tabs
import GroupChat from './components/GroupChat';
import GroupLeaderboard from './components/GroupLeaderboard';
import GroupWheel from './components/GroupWheel';

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

  // ==================== FIX: Ottieni utente corrente ====================
  // Metodo 1: Da Redux store
  const authState = useSelector((state) => state.auth);
  const currentUserFromRedux = authState?.user;
  
  // Metodo 2: Da API (fallback se Redux è vuoto)
  const { data: meData } = useGetMeQuery(undefined, {
    skip: !!currentUserFromRedux?.id, // Salta se già abbiamo l'utente
  });
  
  // Estrai utente da API response
  const currentUserFromApi = meData?.data?.user || meData?.data || meData?.user || meData;
  
  // Usa quello disponibile
  const currentUser = currentUserFromRedux?.id ? currentUserFromRedux : currentUserFromApi;
  const currentUserId = currentUser?.id;

  // ==================== DEBUG LOGS ====================
  useEffect(() => {
    console.log('🔴🔴🔴 AUTH DEBUG 🔴🔴🔴');
    console.log('authState:', JSON.stringify(authState, null, 2));
    console.log('currentUserFromRedux:', currentUserFromRedux);
    console.log('currentUserFromApi:', currentUserFromApi);
    console.log('FINAL currentUserId:', currentUserId);
    console.log('🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴');
  }, [authState, currentUserFromRedux, currentUserFromApi, currentUserId]);

  // API hooks
  const { data: groupData, isLoading: groupLoading } = useGetGroupByIdQuery(groupId);
  const { data: membersData, isLoading: membersLoading } = useGetGroupMembersQuery(groupId);
  const { data: inviteData } = useGetGroupInviteLinkQuery(groupId);

  // Estrai dati gruppo e membri - ✅ FIX: groupData.data.group
  const group = groupData?.data?.group || groupData?.data || groupData;
  const members = membersData?.data?.members || membersData?.data || [];
  const memberCount = members.length;

  // ✅ NUOVO: Estrai immagine gruppo
  const groupImage = group?.image || group?.imageUrl;

  // Estrai codice invito
  const inviteCode = inviteData?.data?.inviteCode || group?.inviteCode;

  // Vai alle info del gruppo
  const handleGoToInfo = () => {
    navigation.navigate('GroupInfo', {
      groupId,
      groupName: group?.name || groupName,
    });
  };

  // ✅ AGGIORNATO: Condividi link invito con deep link
  const handleShare = async () => {
    if (!inviteCode) {
      Alert.alert('Errore', 'Impossibile ottenere il codice di invito');
      return;
    }

    const groupDisplayName = group?.name || groupName;
    await shareGroup(inviteCode, groupDisplayName, groupId);
  };

  // Render contenuto tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'chat':
        return <GroupChat groupId={groupId} currentUserId={currentUserId} />;
      case 'wheel':
        return <GroupWheel groupId={groupId} currentUserId={currentUserId} />;
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
      {/* Header - ✅ AGGIORNATO con immagine gruppo */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>

        {/* ✅ NUOVO: Avatar gruppo nell'header */}
        <TouchableOpacity 
          style={styles.headerContent}
          onPress={handleGoToInfo}
          activeOpacity={0.7}
        >
          <View style={styles.headerAvatar}>
            {groupImage ? (
              <Image 
                source={{ uri: groupImage }} 
                style={styles.headerAvatarImage} 
              />
            ) : (
              <Text style={styles.headerAvatarEmoji}>{group?.emoji || '👥'}</Text>
            )}
          </View>
          
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {group?.name || groupName}
            </Text>
            <View style={styles.headerSubtitleRow}>
              <Text style={styles.headerSubtitle}>
                {membersLoading ? '...' : memberCount} {memberCount === 1 ? 'membro' : 'membri'}
              </Text>
              <Ionicons name="chevron-forward" size={14} color={colors.textTertiary} />
            </View>
          </View>
        </TouchableOpacity>

        {/* Pulsante condividi */}
        <TouchableOpacity
          style={styles.shareButton}
          onPress={handleShare}
          activeOpacity={0.7}
        >
          <Ionicons name="person-add-outline" size={22} color={colors.primary} />
        </TouchableOpacity>
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

  // Header - ✅ AGGIORNATO
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.white,
  },
  backButton: {
    padding: spacing.sm,
    marginRight: spacing.xs,
  },
  // ✅ NUOVO: Container con avatar e info
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  // ✅ NUOVO: Avatar nell'header
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.veryLightGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
    overflow: 'hidden',
  },
  headerAvatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  headerAvatarEmoji: {
    fontSize: 20,
  },
  headerInfo: {
    flex: 1,
    paddingVertical: spacing.xs,
  },
  headerTitle: {
    ...typography.body,
    fontWeight: '600',
    fontSize: 16,
  },
  headerSubtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 12,
  },
  shareButton: {
    padding: spacing.sm,
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
});

export default GroupDetailScreen;