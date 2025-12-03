// src/screens/GroupsScreen/GroupInfoScreen.js
// Schermata info gruppo con membri, impostazioni e abbandona
// ✅ AGGIORNATO: Upload immagine gruppo su Cloudinary

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Switch,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { 
  useGetGroupByIdQuery,
  useGetGroupMembersQuery, 
  useLeaveGroupMutation,
  useUpdateGroupChallengeSettingsMutation,
  usePublishGroupLeaderboardMutation,
  useUploadGroupImageMutation,
} from '../../api/beviApi';
import { showImagePicker, formatFileSize } from '../../utils/imageUtils';

const ROLE_LABELS = {
  ADMIN: { label: 'Admin', color: colors.primary, icon: 'shield' },
  MODERATOR: { label: 'Mod', color: colors.warning, icon: 'star' },
  MEMBER: { label: 'Membro', color: colors.gray, icon: null },
};

const CHALLENGE_CATEGORIES = [
  { id: 'ALL', label: 'Tutte le bevande', icon: '🍹', description: 'Ogni bevanda conta' },
  { id: 'ALCOHOL', label: 'Solo Alcol', icon: '🍺', description: 'Birra, vino, cocktail' },
  { id: 'ENERGY', label: 'Solo Energy', icon: '⚡', description: 'Energy drink' },
  { id: 'SOFT_DRINK', label: 'Solo Bibite', icon: '🥤', description: 'Bibite gassate' },
  { id: 'WATER', label: 'Solo Acqua', icon: '💧', description: 'Acqua e simili' },
];

const LEADERBOARD_MODES = [
  { id: 'OPEN', label: 'Sempre visibile', icon: 'eye-outline', description: 'Tutti vedono la classifica in tempo reale' },
  { id: 'HIDDEN', label: 'Nascosta (mensile)', icon: 'eye-off-outline', description: 'Classifica rivelata a fine mese' },
];

// Componente singolo membro
const MemberItem = ({ member, isCurrentUser }) => {
  const user = member.user || member;
  const role = ROLE_LABELS[member.role] || ROLE_LABELS.MEMBER;

  return (
    <View style={[styles.memberItem, isCurrentUser && styles.memberItemMe]}>
      <View style={styles.avatarContainer}>
        {user.profilePhoto ? (
          <Image source={{ uri: user.profilePhoto }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person" size={24} color={colors.gray} />
          </View>
        )}
        {member.role === 'ADMIN' && (
          <View style={styles.adminBadge}>
            <Ionicons name="shield-checkmark" size={10} color={colors.white} />
          </View>
        )}
      </View>

      <View style={styles.memberInfo}>
        <View style={styles.nameRow}>
          <Text style={styles.memberName}>
            {user.nickname || user.username || 'Utente'}
          </Text>
          {isCurrentUser && <Text style={styles.youBadge}>Tu</Text>}
        </View>
        <Text style={styles.memberUsername}>@{user.username}</Text>
      </View>

      {member.role !== 'MEMBER' && (
        <View style={[styles.roleBadge, { backgroundColor: role.color + '20' }]}>
          <Text style={[styles.roleText, { color: role.color }]}>{role.label}</Text>
        </View>
      )}
    </View>
  );
};

// Componente impostazione toggle
const SettingToggle = ({ icon, label, description, value, onValueChange, disabled }) => (
  <View style={[styles.settingItem, disabled && styles.settingItemDisabled]}>
    <View style={styles.settingIcon}>
      <Ionicons name={icon} size={22} color={disabled ? colors.lightGray : colors.primary} />
    </View>
    <View style={styles.settingInfo}>
      <Text style={[styles.settingLabel, disabled && styles.settingLabelDisabled]}>{label}</Text>
      {description && (
        <Text style={styles.settingDescription}>{description}</Text>
      )}
    </View>
    <Switch
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      trackColor={{ false: colors.lightGray, true: colors.primary + '50' }}
      thumbColor={value ? colors.primary : colors.gray}
    />
  </View>
);

// Componente impostazione con azione
const SettingAction = ({ icon, label, description, value, onPress, disabled }) => (
  <TouchableOpacity 
    style={[styles.settingItem, disabled && styles.settingItemDisabled]}
    onPress={onPress}
    disabled={disabled}
    activeOpacity={0.7}
  >
    <View style={styles.settingIcon}>
      <Ionicons name={icon} size={22} color={disabled ? colors.lightGray : colors.primary} />
    </View>
    <View style={styles.settingInfo}>
      <Text style={[styles.settingLabel, disabled && styles.settingLabelDisabled]}>{label}</Text>
      {description && (
        <Text style={styles.settingDescription}>{description}</Text>
      )}
      {value && (
        <Text style={styles.settingValue}>{value}</Text>
      )}
    </View>
    <Ionicons name="chevron-forward" size={20} color={colors.gray} />
  </TouchableOpacity>
);

// Modal per selezionare categoria
const CategoryPickerModal = ({ visible, onClose, currentValue, onSelect }) => (
  <Modal visible={visible} animationType="slide" transparent>
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Categoria Challenge</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
        <Text style={styles.modalSubtitle}>
          Solo le bevute di questa categoria conteranno per la classifica
        </Text>
        <ScrollView style={styles.modalList}>
          {CHALLENGE_CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.modalOption,
                currentValue === cat.id && styles.modalOptionSelected
              ]}
              onPress={() => onSelect(cat.id)}
            >
              <Text style={styles.modalOptionIcon}>{cat.icon}</Text>
              <View style={styles.modalOptionInfo}>
                <Text style={[
                  styles.modalOptionLabel,
                  currentValue === cat.id && styles.modalOptionLabelSelected
                ]}>
                  {cat.label}
                </Text>
                <Text style={styles.modalOptionDesc}>{cat.description}</Text>
              </View>
              {currentValue === cat.id && (
                <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  </Modal>
);

// Modal per selezionare modalità classifica
const LeaderboardModeModal = ({ visible, onClose, currentValue, onSelect }) => (
  <Modal visible={visible} animationType="slide" transparent>
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Modalità Classifica</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
        <Text style={styles.modalSubtitle}>
          Come vuoi mostrare la classifica ai membri?
        </Text>
        <View style={styles.modalList}>
          {LEADERBOARD_MODES.map((mode) => (
            <TouchableOpacity
              key={mode.id}
              style={[
                styles.modalOption,
                currentValue === mode.id && styles.modalOptionSelected
              ]}
              onPress={() => onSelect(mode.id)}
            >
              <View style={styles.modalOptionIconContainer}>
                <Ionicons name={mode.icon} size={24} color={currentValue === mode.id ? colors.primary : colors.gray} />
              </View>
              <View style={styles.modalOptionInfo}>
                <Text style={[
                  styles.modalOptionLabel,
                  currentValue === mode.id && styles.modalOptionLabelSelected
                ]}>
                  {mode.label}
                </Text>
                <Text style={styles.modalOptionDesc}>{mode.description}</Text>
              </View>
              {currentValue === mode.id && (
                <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  </Modal>
);

const GroupInfoScreen = ({ route, navigation }) => {
  const { groupId, groupName } = route.params;
  
  // Stati per le impostazioni
  const [isMuted, setIsMuted] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showLeaderboardModal, setShowLeaderboardModal] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false); // ✅ NUOVO

  // API hooks
  const { data: groupData, isLoading: groupLoading, refetch: refetchGroup } = useGetGroupByIdQuery(groupId);
  const { data: membersData, isLoading: membersLoading } = useGetGroupMembersQuery(groupId);
  const [leaveGroup, { isLoading: isLeaving }] = useLeaveGroupMutation();
  const [updateChallengeSettings, { isLoading: isUpdating }] = useUpdateGroupChallengeSettingsMutation();
  const [publishLeaderboard, { isLoading: isPublishing }] = usePublishGroupLeaderboardMutation();
  const [uploadGroupImage] = useUploadGroupImageMutation(); // ✅ NUOVO

  // Estrai dati
  const group = groupData?.data?.group || groupData?.data || groupData;
  const members = membersData?.data?.members || membersData?.data || membersData || [];

  // Trova l'utente corrente nei membri
  const currentUserMember = members.find(m => m.isMe);
  const isAdmin = currentUserMember?.role === 'ADMIN';
  const isModOrAdmin = ['ADMIN', 'MODERATOR'].includes(currentUserMember?.role);

  // Ordina membri: Admin > Moderator > Membri
  const sortedMembers = [...members].sort((a, b) => {
    const roleOrder = { ADMIN: 0, MODERATOR: 1, MEMBER: 2 };
    return (roleOrder[a.role] || 2) - (roleOrder[b.role] || 2);
  });

  // ✅ NUOVO: Gestione upload immagine gruppo
  const handleChangeGroupImage = async () => {
    if (!isAdmin) {
      Alert.alert('Non autorizzato', 'Solo gli admin possono cambiare l\'immagine del gruppo');
      return;
    }

    console.log('🖼️ [1] Inizio cambio immagine gruppo...');
    console.log('🖼️ [1.1] Group ID:', groupId);
    
    try {
      // Mostra picker immagine (camera o galleria)
      const imageResult = await showImagePicker({
        title: 'Cambia immagine gruppo',
        message: 'Scegli da dove caricare la foto',
        allowsEditing: true,
        aspect: [1, 1], // Immagine quadrata
        quality: 0.8,
      });

      if (!imageResult) {
        console.log('🖼️ [2] Utente ha annullato');
        return;
      }

      console.log('📸 [2] Immagine selezionata:', {
        uri: imageResult.uri,
        size: formatFileSize(imageResult.size),
        hasBase64: !!imageResult.base64,
        base64Length: imageResult.base64?.length,
      });
      
      setIsUploadingImage(true);

      console.log('📤 [3] Invio richiesta uploadGroupImage...');
      
      // Upload su Cloudinary via endpoint /api/upload
      const result = await uploadGroupImage({
        groupId: groupId,
        image: imageResult.base64,
      }).unwrap();

      console.log('✅ [4] Risposta ricevuta:', JSON.stringify(result, null, 2));

      // Refetch per aggiornare l'immagine
      refetchGroup();

      Alert.alert('Successo! 📸', 'L\'immagine del gruppo è stata aggiornata');

    } catch (error) {
      console.error('❌ [ERROR] Errore upload immagine gruppo:', {
        message: error?.message,
        status: error?.status,
        data: error?.data,
        fullError: JSON.stringify(error, null, 2),
      });
      Alert.alert(
        'Errore',
        error?.data?.message || 'Impossibile aggiornare l\'immagine del gruppo'
      );
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Gestisci cambio categoria
  const handleCategoryChange = async (newCategory) => {
    setShowCategoryModal(false);
    
    if (newCategory === group?.challengeCategory) return;

    Alert.alert(
      'Cambia categoria',
      'Vuoi azzerare i punteggi della classifica?',
      [
        {
          text: 'No, mantieni',
          onPress: async () => {
            try {
              await updateChallengeSettings({
                groupId,
                challengeCategory: newCategory,
                resetScores: false
              }).unwrap();
              refetchGroup();
            } catch (error) {
              Alert.alert('Errore', error?.data?.message || 'Impossibile aggiornare');
            }
          }
        },
        {
          text: 'Sì, azzera',
          style: 'destructive',
          onPress: async () => {
            try {
              await updateChallengeSettings({
                groupId,
                challengeCategory: newCategory,
                resetScores: true
              }).unwrap();
              refetchGroup();
            } catch (error) {
              Alert.alert('Errore', error?.data?.message || 'Impossibile aggiornare');
            }
          }
        }
      ]
    );
  };

  // Gestisci cambio modalità classifica
  const handleLeaderboardModeChange = async (newMode) => {
    setShowLeaderboardModal(false);
    
    if (newMode === group?.leaderboardMode) return;

    try {
      await updateChallengeSettings({
        groupId,
        leaderboardMode: newMode
      }).unwrap();
      refetchGroup();
    } catch (error) {
      Alert.alert('Errore', error?.data?.message || 'Impossibile aggiornare');
    }
  };

  // Pubblica classifica
  const handlePublishLeaderboard = () => {
    Alert.alert(
      'Pubblica classifica',
      'Vuoi pubblicare la classifica mensile nella chat? I punteggi mensili verranno azzerati.',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Pubblica',
          onPress: async () => {
            try {
              await publishLeaderboard(groupId).unwrap();
              Alert.alert('Fatto!', 'Classifica pubblicata nella chat');
            } catch (error) {
              Alert.alert('Errore', error?.data?.message || 'Impossibile pubblicare');
            }
          }
        }
      ]
    );
  };

  // Gestisci abbandono gruppo
  const handleLeaveGroup = () => {
    Alert.alert(
      'Abbandona gruppo',
      `Sei sicuro di voler abbandonare "${group?.name || groupName}"?`,
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Abbandona',
          style: 'destructive',
          onPress: async () => {
            try {
              await leaveGroup(groupId).unwrap();
              navigation.navigate('MainTabs', { screen: 'Gruppi' });
            } catch (error) {
              Alert.alert('Errore', error?.data?.message || 'Impossibile abbandonare il gruppo');
            }
          },
        },
      ]
    );
  };

  // Helper per ottenere label categoria
  const getCategoryLabel = (categoryId) => {
    const cat = CHALLENGE_CATEGORIES.find(c => c.id === categoryId);
    return cat ? `${cat.icon} ${cat.label}` : categoryId;
  };

  // Helper per ottenere label modalità
  const getLeaderboardModeLabel = (modeId) => {
    const mode = LEADERBOARD_MODES.find(m => m.id === modeId);
    return mode ? mode.label : modeId;
  };

  const isLoading = groupLoading || membersLoading;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Caricamento...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Estrai immagine gruppo
  const groupImage = group?.image || group?.imageUrl;

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
        <Text style={styles.headerTitle}>Info Gruppo</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Info gruppo */}
        <View style={styles.groupHeader}>
          {/* ✅ AGGIORNATO: Avatar gruppo cliccabile per admin */}
          <View style={styles.groupAvatarContainer}>
            <TouchableOpacity 
              style={styles.groupAvatarLarge}
              onPress={isAdmin ? handleChangeGroupImage : undefined}
              disabled={!isAdmin || isUploadingImage}
              activeOpacity={isAdmin ? 0.8 : 1}
            >
              {isUploadingImage ? (
                <ActivityIndicator size="large" color={colors.primary} />
              ) : groupImage ? (
                <Image source={{ uri: groupImage }} style={styles.groupAvatarImage} />
              ) : (
                <Text style={styles.groupEmoji}>{group?.emoji || '👥'}</Text>
              )}
            </TouchableOpacity>
            
            {/* ✅ NUOVO: Pulsante modifica immagine (solo admin) */}
            {isAdmin && (
              <TouchableOpacity 
                style={[styles.editGroupImageButton, isUploadingImage && styles.editGroupImageButtonDisabled]}
                onPress={handleChangeGroupImage}
                disabled={isUploadingImage}
              >
                {isUploadingImage ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Ionicons name="camera" size={16} color={colors.white} />
                )}
              </TouchableOpacity>
            )}
          </View>
          
          <Text style={styles.groupName}>{group?.name || groupName}</Text>
          <Text style={styles.groupMeta}>
            Gruppo • {members.length} {members.length === 1 ? 'membro' : 'membri'}
          </Text>
          {group?.challengeCategory && group.challengeCategory !== 'ALL' && (
            <View style={styles.challengeBadge}>
              <Text style={styles.challengeBadgeText}>
                {getCategoryLabel(group.challengeCategory)}
              </Text>
            </View>
          )}
        </View>

        {/* Sezione Membri */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {members.length} {members.length === 1 ? 'Membro' : 'Membri'}
          </Text>
          {sortedMembers.map((member) => (
            <MemberItem
              key={member.id || member.oduserId}
              member={member}
              isCurrentUser={member.isMe}
            />
          ))}
        </View>

        {/* Sezione Challenge (solo admin) */}
        {isAdmin && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Impostazioni Challenge</Text>
            
            <SettingAction
              icon="trophy-outline"
              label="Categoria Challenge"
              description="Quali bevute contano per la classifica"
              value={getCategoryLabel(group?.challengeCategory || 'ALL')}
              onPress={() => setShowCategoryModal(true)}
            />

            <SettingAction
              icon="eye-outline"
              label="Modalità Classifica"
              description="Come viene mostrata la classifica"
              value={getLeaderboardModeLabel(group?.leaderboardMode || 'OPEN')}
              onPress={() => setShowLeaderboardModal(true)}
            />

            {group?.leaderboardMode === 'HIDDEN' && (
              <TouchableOpacity
                style={styles.publishButton}
                onPress={handlePublishLeaderboard}
                disabled={isPublishing}
              >
                {isPublishing ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <>
                    <Ionicons name="megaphone-outline" size={20} color={colors.white} />
                    <Text style={styles.publishButtonText}>Pubblica Classifica Mensile</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Sezione Impostazioni Personali */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferenze</Text>
          
          <SettingToggle
            icon="notifications-off-outline"
            label="Silenzia notifiche"
            description="Non ricevere notifiche da questo gruppo"
            value={isMuted}
            onValueChange={setIsMuted}
          />
        </View>

        {/* Pulsante Abbandona */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.leaveButton}
            onPress={handleLeaveGroup}
            disabled={isLeaving}
          >
            {isLeaving ? (
              <ActivityIndicator size="small" color={colors.error} />
            ) : (
              <>
                <Ionicons name="exit-outline" size={20} color={colors.error} />
                <Text style={styles.leaveButtonText}>Abbandona gruppo</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Modals */}
      <CategoryPickerModal
        visible={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        currentValue={group?.challengeCategory || 'ALL'}
        onSelect={handleCategoryChange}
      />

      <LeaderboardModeModal
        visible={showLeaderboardModal}
        onClose={() => setShowLeaderboardModal(false)}
        currentValue={group?.leaderboardMode || 'OPEN'}
        onSelect={handleLeaderboardModeChange}
      />

      {/* ✅ NUOVO: Overlay loading durante upload */}
      {isUploadingImage && (
        <View style={styles.uploadingOverlay}>
          <View style={styles.uploadingBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.uploadingText}>Aggiornamento immagine...</Text>
          </View>
        </View>
      )}
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
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.white,
  },
  backButton: {
    padding: spacing.sm,
  },
  headerTitle: {
    ...typography.h3,
  },
  headerSpacer: {
    width: 40,
  },

  // Group Header
  groupHeader: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  // ✅ NUOVO: Container per avatar gruppo
  groupAvatarContainer: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  groupAvatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.veryLightGray,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  // ✅ NUOVO: Immagine gruppo
  groupAvatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  groupEmoji: {
    fontSize: 40,
  },
  // ✅ NUOVO: Pulsante modifica immagine gruppo
  editGroupImageButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  editGroupImageButtonDisabled: {
    backgroundColor: colors.gray,
  },
  groupName: {
    ...typography.h2,
    marginBottom: spacing.xs,
  },
  groupMeta: {
    ...typography.body,
    color: colors.textSecondary,
  },
  challengeBadge: {
    marginTop: spacing.sm,
    backgroundColor: colors.primary + '15',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.round,
  },
  challengeBadgeText: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '600',
  },

  // Sections
  section: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  sectionTitle: {
    ...typography.caption,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },

  // Member Item
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.xs,
  },
  memberItemMe: {
    backgroundColor: colors.bevi + '10',
    borderWidth: 1,
    borderColor: colors.bevi,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.veryLightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  adminBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: colors.primary,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  memberInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberName: {
    ...typography.body,
    fontWeight: '600',
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
    overflow: 'hidden',
    fontSize: 10,
  },
  memberUsername: {
    ...typography.caption,
    color: colors.textTertiary,
  },
  roleBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  roleText: {
    ...typography.caption,
    fontWeight: '600',
  },

  // Settings
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.xs,
  },
  settingItemDisabled: {
    opacity: 0.6,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    ...typography.body,
    fontWeight: '500',
  },
  settingLabelDisabled: {
    color: colors.textTertiary,
  },
  settingDescription: {
    ...typography.caption,
    color: colors.textTertiary,
    marginTop: 2,
  },
  settingValue: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '600',
    marginTop: 2,
  },

  // Publish Button
  publishButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginTop: spacing.sm,
  },
  publishButtonText: {
    ...typography.body,
    color: colors.white,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },

  // Leave Button
  leaveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.error + '10',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.error + '30',
  },
  leaveButtonText: {
    ...typography.body,
    color: colors.error,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },

  bottomSpacer: {
    height: spacing.xxl,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    ...typography.h3,
  },
  modalSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  modalList: {
    padding: spacing.md,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.xs,
    backgroundColor: colors.veryLightGray,
  },
  modalOptionSelected: {
    backgroundColor: colors.primary + '15',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  modalOptionIcon: {
    fontSize: 28,
    marginRight: spacing.md,
  },
  modalOptionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  modalOptionInfo: {
    flex: 1,
  },
  modalOptionLabel: {
    ...typography.body,
    fontWeight: '600',
  },
  modalOptionLabelSelected: {
    color: colors.primary,
  },
  modalOptionDesc: {
    ...typography.caption,
    color: colors.textTertiary,
    marginTop: 2,
  },

  // ✅ NUOVO: Overlay upload
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingBox: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
  },
  uploadingText: {
    ...typography.body,
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
});

export default GroupInfoScreen;