// src/screens/MessagesScreen/MessagesScreen.js
// Schermata lista conversazioni

import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../../theme';
import { useGetMyConversationsQuery, useGetTotalUnreadQuery } from '../../api/beviApi';

// Formatta tempo
const formatTime = (date) => {
  if (!date) return '';
  const now = new Date();
  const msgDate = new Date(date);
  const diffMs = now - msgDate;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Ora';
  if (diffMins < 60) return `${diffMins} min`;
  if (diffHours < 24) return `${diffHours} ore`;
  if (diffDays < 7) return `${diffDays} g`;
  return msgDate.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
};

// Componente singola conversazione
const ConversationItem = ({ conversation, onPress }) => {
  const hasUnread = conversation.unreadCount > 0;
  const otherUser = conversation.otherUser || conversation.participants?.[0] || {};
  
  return (
    <TouchableOpacity 
      style={styles.conversationItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Avatar */}
      <View style={styles.avatarContainer}>
        <View style={styles.avatar}>
          {otherUser.avatar ? (
            <Image source={{ uri: otherUser.avatar }} style={styles.avatarImage} />
          ) : (
            <Ionicons name="person" size={24} color={colors.gray} />
          )}
        </View>
        {otherUser.isOnline && <View style={styles.onlineIndicator} />}
      </View>

      {/* Info conversazione */}
      <View style={styles.conversationInfo}>
        <View style={styles.conversationHeader}>
          <Text style={[styles.userName, hasUnread && styles.userNameUnread]}>
            {otherUser.username || 'Utente'}
          </Text>
          <Text style={styles.time}>
            {formatTime(conversation.lastMessage?.createdAt || conversation.updatedAt)}
          </Text>
        </View>
        
        <View style={styles.conversationPreview}>
          <Text 
            style={[styles.lastMessage, hasUnread && styles.lastMessageUnread]}
            numberOfLines={1}
          >
            {conversation.lastMessage?.content || 'Nessun messaggio'}
          </Text>
          
          {hasUnread && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadCount}>
                {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

// Tabs per filtrare
const TabSelector = ({ activeTab, onTabChange }) => (
  <View style={styles.tabContainer}>
    <TouchableOpacity 
      style={[styles.tab, activeTab === 'all' && styles.tabActive]}
      onPress={() => onTabChange('all')}
    >
      <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>
        Tutti
      </Text>
    </TouchableOpacity>
    
    <TouchableOpacity 
      style={[styles.tab, activeTab === 'unread' && styles.tabActive]}
      onPress={() => onTabChange('unread')}
    >
      <Text style={[styles.tabText, activeTab === 'unread' && styles.tabTextActive]}>
        Non letti
      </Text>
    </TouchableOpacity>
    
    <TouchableOpacity 
      style={[styles.tab, activeTab === 'groups' && styles.tabActive]}
      onPress={() => onTabChange('groups')}
    >
      <Text style={[styles.tabText, activeTab === 'groups' && styles.tabTextActive]}>
        Gruppi
      </Text>
    </TouchableOpacity>
  </View>
);

const MessagesScreen = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  // API hooks
  const { 
    data: conversationsData, 
    isLoading, 
    refetch 
  } = useGetMyConversationsQuery();
  
  const { data: unreadData } = useGetTotalUnreadQuery();

  // Estrai le conversazioni dalla risposta wrappata
const conversations = conversationsData?.data?.conversations || conversationsData?.data || conversationsData?.conversations || [];

  const totalUnread = unreadData?.total || unreadData || 0;

  // Filtra conversazioni
  const filteredConversations = conversations.filter(conv => {
    if (activeTab === 'unread') return conv.unreadCount > 0;
    if (activeTab === 'groups') return conv.isGroup;
    return true;
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleConversationPress = (conversation) => {
    // TODO: Navigare alla chat
    console.log('Apri conversazione:', conversation);
  };

  const handleNewMessage = () => {
    // TODO: Aprire modal per nuova conversazione
    console.log('Nuova conversazione');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Messaggi</Text>
          {totalUnread > 0 && (
            <Text style={styles.subtitle}>{totalUnread} non letti</Text>
          )}
        </View>
        <TouchableOpacity style={styles.newButton} onPress={handleNewMessage}>
          <Ionicons name="create-outline" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <TabSelector activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Lista conversazioni */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredConversations}
          keyExtractor={(item) => item.id?.toString()}
          renderItem={({ item }) => (
            <ConversationItem 
              conversation={item} 
              onPress={() => handleConversationPress(item)}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={64} color={colors.lightGray} />
              <Text style={styles.emptyText}>
                {activeTab === 'unread' 
                  ? 'Nessun messaggio non letto'
                  : activeTab === 'groups'
                  ? 'Nessuna chat di gruppo'
                  : 'Nessuna conversazione'
                }
              </Text>
              <Text style={styles.emptySubtext}>
                Inizia a chattare con i tuoi amici!
              </Text>
            </View>
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  title: {
    ...typography.h1,
  },
  subtitle: {
    ...typography.caption,
    color: colors.primary,
  },
  newButton: {
    padding: spacing.sm,
  },

  // Tabs
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    marginRight: spacing.sm,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabText: {
    ...typography.body,
    color: colors.textTertiary,
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // List
  listContent: {
    flexGrow: 1,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 80,
  },

  // Conversation Item
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.veryLightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.white,
  },
  conversationInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  userName: {
    ...typography.body,
    fontWeight: '500',
  },
  userNameUnread: {
    fontWeight: '700',
  },
  time: {
    ...typography.caption,
    color: colors.textTertiary,
  },
  conversationPreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    ...typography.bodySmall,
    color: colors.textTertiary,
    flex: 1,
    marginRight: spacing.sm,
  },
  lastMessageUnread: {
    color: colors.textPrimary,
    fontWeight: '500',
  },
  unreadBadge: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
  },
  unreadCount: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '700',
  },

  // Empty state
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    ...typography.h3,
    color: colors.textSecondary,
    marginTop: spacing.lg,
  },
  emptySubtext: {
    ...typography.body,
    color: colors.textTertiary,
    marginTop: spacing.sm,
  },
});

export default MessagesScreen;