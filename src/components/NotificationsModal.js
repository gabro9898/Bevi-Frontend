// src/components/NotificationsModal.js
// Modal per visualizzare le notifiche in-app

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, spacing, borderRadius, shadows } from '../theme';
import {
  useGetMyNotificationsQuery,
  useMarkAllNotificationsAsReadMutation,
} from '../api/beviApi';

// Icone per tipo di notifica
const NOTIFICATION_ICONS = {
  GROUP_INVITE: { name: 'people', color: colors.primary },
  MENTION: { name: 'at', color: colors.info },
  ACHIEVEMENT: { name: 'trophy', color: colors.warning },
  CHALLENGE_UPDATE: { name: 'flag', color: colors.success },
  WHEEL_RESULT: { name: 'color-filter', color: colors.secondary },
  DRINK_REACTION: { name: 'beer', color: colors.bevi },
  SYSTEM: { name: 'information-circle', color: colors.gray },
};

// Formatta la data relativa
const formatRelativeTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Ora';
  if (diffMins < 60) return `${diffMins}m fa`;
  if (diffHours < 24) return `${diffHours}h fa`;
  if (diffDays < 7) return `${diffDays}g fa`;
  
  return date.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
};

// Singola notifica
const NotificationItem = ({ notification }) => {
  const iconConfig = NOTIFICATION_ICONS[notification.type] || NOTIFICATION_ICONS.SYSTEM;
  
  return (
    <TouchableOpacity 
      style={[
        styles.notificationItem,
        !notification.isRead && styles.notificationUnread
      ]}
      activeOpacity={0.7}
    >
      {/* Icona */}
      <View style={[styles.iconContainer, { backgroundColor: iconConfig.color + '20' }]}>
        <Ionicons name={iconConfig.name} size={20} color={iconConfig.color} />
      </View>
      
      {/* Contenuto */}
      <View style={styles.contentContainer}>
        <Text style={styles.notificationTitle} numberOfLines={1}>
          {notification.title}
        </Text>
        <Text style={styles.notificationBody} numberOfLines={2}>
          {notification.body}
        </Text>
        <Text style={styles.notificationTime}>
          {formatRelativeTime(notification.createdAt)}
        </Text>
      </View>
      
      {/* Indicatore non letto */}
      {!notification.isRead && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );
};

// Componente principale
const NotificationsModal = ({ visible, onClose }) => {
  const insets = useSafeAreaInsets();
  
  const { 
    data, 
    isLoading, 
    refetch,
    isFetching 
  } = useGetMyNotificationsQuery(undefined, {
    skip: !visible, // Carica solo quando il modal è visibile
  });
  
  const [markAllAsRead] = useMarkAllNotificationsAsReadMutation();
  
  const notifications = data?.data?.notifications || [];
  const unreadCount = data?.data?.unreadCount || 0;
  
  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead().unwrap();
    } catch (error) {
      console.error('Errore mark all read:', error);
    }
  };
  
  const handleClose = () => {
    // Segna tutto come letto quando chiudi
    if (unreadCount > 0) {
      markAllAsRead();
    }
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Notifiche</Text>
            
            <View style={styles.headerActions}>
              {unreadCount > 0 && (
                <TouchableOpacity 
                  style={styles.markReadButton}
                  onPress={handleMarkAllRead}
                >
                  <Text style={styles.markReadText}>Segna tutte lette</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={handleClose}
              >
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Lista notifiche */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Caricamento...</Text>
            </View>
          ) : (
            <FlatList
              data={notifications}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <NotificationItem notification={item} />}
              contentContainerStyle={styles.listContent}
              refreshControl={
                <RefreshControl
                  refreshing={isFetching && !isLoading}
                  onRefresh={refetch}
                  colors={[colors.primary]}
                  tintColor={colors.primary}
                />
              }
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name="notifications-off-outline" size={64} color={colors.gray} />
                  <Text style={styles.emptyTitle}>Nessuna notifica</Text>
                  <Text style={styles.emptySubtitle}>
                    Le tue notifiche appariranno qui
                  </Text>
                </View>
              }
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
    marginTop: 50,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    ...shadows.large,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    ...typography.h2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  markReadButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  markReadText: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '600',
  },
  closeButton: {
    padding: spacing.xs,
  },
  
  // Lista
  listContent: {
    padding: spacing.md,
    flexGrow: 1,
  },
  
  // Notifica
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.white,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: borderRadius.lg,
    ...shadows.small,
  },
  notificationUnread: {
    backgroundColor: colors.primary + '08',
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  contentContainer: {
    flex: 1,
  },
  notificationTitle: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: 2,
  },
  notificationBody: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  notificationTime: {
    ...typography.caption,
    color: colors.textTertiary,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginLeft: spacing.sm,
    marginTop: spacing.xs,
  },
  
  // Loading
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
  
  // Empty
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxl * 2,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  emptySubtitle: {
    ...typography.body,
    color: colors.textTertiary,
    marginTop: spacing.xs,
  },
});

export default NotificationsModal;