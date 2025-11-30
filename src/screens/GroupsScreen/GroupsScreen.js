// src/screens/GroupsScreen/GroupsScreen.js
// Schermata lista gruppi - Stile WhatsApp

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
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius, shadows } from '../../theme';
import { 
  useGetMyGroupsQuery, 
  useJoinGroupMutation,
  useCreateGroupMutation,
} from '../../api/beviApi';

// Formatta la data per l'ultimo messaggio (stile WhatsApp)
const formatLastMessageTime = (dateString) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    // Oggi - mostra ora
    return date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  } else if (diffDays === 1) {
    return 'Ieri';
  } else if (diffDays < 7) {
    // Questa settimana - mostra giorno
    const days = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
    return days[date.getDay()];
  } else {
    // Più vecchio - mostra data
    return date.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: '2-digit' });
  }
};

// Componente per il singolo gruppo - Stile WhatsApp
const GroupCard = ({ group, onPress, isLast }) => {
  const unreadCount = group.unreadCount || group.membership?.unreadCount || 0;
  const lastMessage = group.lastMessage || group.lastMessageText;
  const lastActivity = group.lastActivityAt || group.updatedAt;
  
  return (
    <TouchableOpacity 
      style={styles.groupCard} 
      onPress={onPress}
      activeOpacity={0.6}
    >
      {/* Avatar */}
      <View style={styles.groupAvatar}>
        <Text style={styles.groupEmoji}>{group.emoji || '👥'}</Text>
      </View>
      
      {/* Info centrale */}
      <View style={[styles.groupInfo, !isLast && styles.groupInfoBorder]}>
        <View style={styles.groupInfoTop}>
          <Text style={styles.groupName} numberOfLines={1}>{group.name}</Text>
          <Text style={[
            styles.groupTime,
            unreadCount > 0 && styles.groupTimeUnread
          ]}>
            {formatLastMessageTime(lastActivity)}
          </Text>
        </View>
        
        <View style={styles.groupInfoBottom}>
          <Text style={styles.groupLastMessage} numberOfLines={1}>
            {lastMessage || `${group.memberCount || group._count?.members || 0} membri`}
          </Text>
          
          {/* Badge messaggi non letti */}
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

// Modal per creare/unirsi a gruppo
const GroupModal = ({ visible, onClose, onCreateGroup, onJoinGroup }) => {
  const [mode, setMode] = useState('choose');
  const [groupName, setGroupName] = useState('');
  const [groupCode, setGroupCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = async () => {
    if (!groupName.trim()) {
      Alert.alert('Errore', 'Inserisci un nome per il gruppo');
      return;
    }
    setIsLoading(true);
    await onCreateGroup(groupName);
    setIsLoading(false);
    setGroupName('');
    setMode('choose');
    onClose();
  };

  const handleJoin = async () => {
    if (!groupCode.trim()) {
      Alert.alert('Errore', 'Inserisci il codice del gruppo');
      return;
    }
    setIsLoading(true);
    await onJoinGroup(groupCode);
    setIsLoading(false);
    setGroupCode('');
    setMode('choose');
    onClose();
  };

  const handleClose = () => {
    setMode('choose');
    setGroupName('');
    setGroupCode('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {mode === 'choose' && 'Nuovo Gruppo'}
              {mode === 'create' && 'Crea Gruppo'}
              {mode === 'join' && 'Unisciti'}
            </Text>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Contenuto */}
          {mode === 'choose' && (
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalOption}
                onPress={() => setMode('create')}
              >
                <View style={[styles.modalOptionIcon, { backgroundColor: colors.primary + '20' }]}>
                  <Ionicons name="add-circle" size={32} color={colors.primary} />
                </View>
                <Text style={styles.modalOptionTitle}>Crea Gruppo</Text>
                <Text style={styles.modalOptionDesc}>Crea un nuovo gruppo e invita amici</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.modalOption}
                onPress={() => setMode('join')}
              >
                <View style={[styles.modalOptionIcon, { backgroundColor: colors.bevi + '20' }]}>
                  <Ionicons name="enter" size={32} color={colors.bevi} />
                </View>
                <Text style={styles.modalOptionTitle}>Unisciti</Text>
                <Text style={styles.modalOptionDesc}>Entra in un gruppo con un codice</Text>
              </TouchableOpacity>
            </View>
          )}

          {mode === 'create' && (
            <View style={styles.modalForm}>
              <Text style={styles.inputLabel}>Nome del gruppo</Text>
              <TextInput
                style={styles.input}
                placeholder="Es. Amici del Bar"
                placeholderTextColor={colors.textMuted}
                value={groupName}
                onChangeText={setGroupName}
              />
              <TouchableOpacity 
                style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
                onPress={handleCreate}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.submitButtonText}>Crea Gruppo</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setMode('choose')}>
                <Text style={styles.backLink}>← Indietro</Text>
              </TouchableOpacity>
            </View>
          )}

          {mode === 'join' && (
            <View style={styles.modalForm}>
              <Text style={styles.inputLabel}>Codice del gruppo</Text>
              <TextInput
                style={styles.input}
                placeholder="Es. ABC123"
                placeholderTextColor={colors.textMuted}
                value={groupCode}
                onChangeText={setGroupCode}
                autoCapitalize="characters"
              />
              <TouchableOpacity 
                style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
                onPress={handleJoin}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.submitButtonText}>Unisciti</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setMode('choose')}>
                <Text style={styles.backLink}>← Indietro</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const GroupsScreen = () => {
  const navigation = useNavigation();
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Query e mutations
  const { data, isLoading, refetch } = useGetMyGroupsQuery();
  const [joinGroup] = useJoinGroupMutation();
  const [createGroup] = useCreateGroupMutation();

  // Estrai gruppi dalla risposta
  const groups = data?.data || data?.groups || (Array.isArray(data) ? data : []);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleCreateGroup = async (name) => {
    try {
      await createGroup({ name }).unwrap();
      Alert.alert('Successo', 'Gruppo creato!');
      refetch();
    } catch (error) {
      Alert.alert('Errore', error.data?.message || 'Impossibile creare il gruppo');
    }
  };

  const handleJoinGroup = async (code) => {
    try {
      await joinGroup(code).unwrap();
      Alert.alert('Successo', 'Sei entrato nel gruppo!');
      refetch();
    } catch (error) {
      Alert.alert('Errore', error.data?.message || 'Codice non valido');
    }
  };

  const handleGroupPress = (group) => {
    navigation.navigate('GroupDetail', { 
      groupId: group.id, 
      groupName: group.name 
    });
  };

  // Ordina gruppi per ultima attività (più recenti prima)
  const sortedGroups = Array.isArray(groups) 
    ? [...groups].sort((a, b) => {
        const dateA = new Date(a.lastActivityAt || a.updatedAt || 0);
        const dateB = new Date(b.lastActivityAt || b.updatedAt || 0);
        return dateB - dateA;
      })
    : [];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>I Miei Gruppi</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="add" size={24} color={colors.white} />
        </TouchableOpacity>
      </View>

      {/* Lista Gruppi */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={sortedGroups}
          keyExtractor={(item) => item.id?.toString()}
          renderItem={({ item, index }) => (
            <GroupCard 
              group={item} 
              onPress={() => handleGroupPress(item)}
              isLast={index === sortedGroups.length - 1}
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
              <Text style={styles.emptyEmoji}>👥</Text>
              <Text style={styles.emptyText}>Nessun gruppo</Text>
              <Text style={styles.emptySubtext}>
                Crea un gruppo o unisciti a uno esistente per sfidare i tuoi amici!
              </Text>
              <TouchableOpacity 
                style={styles.emptyButton}
                onPress={() => setModalVisible(true)}
              >
                <Ionicons name="add" size={20} color={colors.white} />
                <Text style={styles.emptyButtonText}>Nuovo Gruppo</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Modal */}
      <GroupModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onCreateGroup={handleCreateGroup}
        onJoinGroup={handleJoinGroup}
      />
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
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    ...typography.h1,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.small,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    flexGrow: 1,
  },
  
  // Group Card - Stile WhatsApp
  groupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingLeft: spacing.md,
    paddingVertical: spacing.sm,
  },
  groupAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.veryLightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupEmoji: {
    fontSize: 28,
  },
  groupInfo: {
    flex: 1,
    marginLeft: spacing.md,
    paddingRight: spacing.md,
    paddingVertical: spacing.sm,
  },
  groupInfoBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  groupInfoTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  groupName: {
    ...typography.body,
    fontWeight: '600',
    flex: 1,
    marginRight: spacing.sm,
  },
  groupTime: {
    ...typography.caption,
    color: colors.textTertiary,
    fontSize: 12,
  },
  groupTimeUnread: {
    color: colors.primary,
  },
  groupInfoBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  groupLastMessage: {
    ...typography.body,
    color: colors.textSecondary,
    fontSize: 14,
    flex: 1,
    marginRight: spacing.sm,
  },
  
  // Badge messaggi non letti
  unreadBadge: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadBadgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  
  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxl,
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
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    ...shadows.small,
  },
  emptyButtonText: {
    ...typography.button,
    color: colors.white,
    marginLeft: spacing.sm,
  },
  
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    minHeight: 300,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    ...typography.h2,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  modalOption: {
    alignItems: 'center',
    padding: spacing.lg,
    width: '45%',
  },
  modalOptionIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalOptionTitle: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  modalOptionDesc: {
    ...typography.caption,
    color: colors.textTertiary,
    textAlign: 'center',
  },
  modalForm: {
    paddingTop: spacing.md,
  },
  inputLabel: {
    ...typography.label,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.veryLightGray,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...typography.body,
    marginBottom: spacing.lg,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    ...shadows.small,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    ...typography.button,
    color: colors.white,
  },
  backLink: {
    ...typography.body,
    color: colors.primary,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});

export default GroupsScreen;