// src/screens/ProfileScreen/ProfileScreen.js
// Schermata profilo utente con statistiche reali
// ✅ AGGIORNATO: Rimosso pulsante Analytics (ora nella tab bar)

import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../../theme';
import { clearCredentials, selectCurrentUser, setUser } from '../../store/slices/authSlice';
import { clearTokens } from '../../api/apiClient';
import { 
  useGetMeQuery, 
  useGetMyDrinkStatsQuery,
  useUploadAvatarMutation,
} from '../../api/beviApi';
import { showImagePicker, formatFileSize } from '../../utils/imageUtils';

const StatCard = ({ icon, value, label, color }) => (
  <View style={styles.statCard}>
    <View style={[styles.statIconContainer, { backgroundColor: color + '20' }]}>
      <Ionicons name={icon} size={24} color={color} />
    </View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const MenuButton = ({ icon, label, onPress, color = colors.textPrimary, rightIcon = "chevron-forward" }) => (
  <TouchableOpacity style={styles.menuButton} onPress={onPress} activeOpacity={0.7}>
    <View style={styles.menuButtonLeft}>
      <Ionicons name={icon} size={22} color={color} />
      <Text style={[styles.menuButtonLabel, { color }]}>{label}</Text>
    </View>
    <Ionicons name={rightIcon} size={20} color={colors.gray} />
  </TouchableOpacity>
);

const ProfileScreen = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const currentUser = useSelector(selectCurrentUser);
  
  // Stati per upload avatar
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  
  // Query per il profilo (chiama /auth/me)
  const { 
    data: meData, 
    isLoading: meLoading,
    refetch: refetchMe,
    error: meError
  } = useGetMeQuery();
  
  // Query per le statistiche
  const { 
    data: statsData, 
    isLoading: statsLoading,
    refetch: refetchStats 
  } = useGetMyDrinkStatsQuery();

  // Mutation per avatar
  const [uploadAvatar] = useUploadAvatarMutation();

  const [refreshing, setRefreshing] = React.useState(false);

  // Estrai i dati dalla risposta (il backend wrappa in data)
  const userData = meData?.data?.user || meData?.data || meData?.user || meData || {};
  const stats = statsData?.data || statsData || {};

  // Aggiorna lo store con i dati utente
  useEffect(() => {
    if (userData && userData.id) {
      dispatch(setUser(userData));
    }
  }, [userData, dispatch]);

  // Usa i dati dallo store se disponibili, altrimenti dalla query
  const user = currentUser || userData;

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchMe(), refetchStats()]);
    setRefreshing(false);
  }, []);

  const handleLogout = async () => {
    await clearTokens();
    dispatch(clearCredentials());
  };

  // Menu per cambiare avatar
  const handleChangeAvatar = async () => {
    try {
      // Mostra picker immagine (camera o galleria)
      const imageResult = await showImagePicker({
        title: 'Cambia foto profilo',
        message: 'Scegli da dove caricare la foto',
        allowsEditing: true,
        aspect: [1, 1], // Avatar quadrato
        quality: 0.8,
      });

      if (!imageResult) {
        // Utente ha annullato
        return;
      }

      console.log('📸 Immagine selezionata:', formatFileSize(imageResult.size));
      
      setIsUploadingAvatar(true);

      // Upload su Cloudinary via endpoint /api/upload
      const result = await uploadAvatar({
        userId: user.id,
        image: imageResult.base64,
      }).unwrap();

      console.log('✅ Avatar aggiornato:', result);

      // Aggiorna lo store locale con il nuovo URL
      const newProfilePhoto = result?.data?.url || result?.data?.profilePhoto || result?.url;
      if (newProfilePhoto) {
        dispatch(setUser({
          ...user,
          profilePhoto: newProfilePhoto,
        }));
      }

      // Refetch per sicurezza
      refetchMe();

      Alert.alert('Successo! 📸', 'La tua foto profilo è stata aggiornata');

    } catch (error) {
      console.error('Errore upload avatar:', error);
      Alert.alert(
        'Errore',
        error?.data?.message || 'Impossibile aggiornare la foto profilo'
      );
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const isLoading = meLoading || statsLoading;

  if (isLoading && !user?.username) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Caricamento profilo...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Header Profilo */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            {/* Avatar con loading */}
            <TouchableOpacity 
              style={styles.avatar}
              onPress={handleChangeAvatar}
              disabled={isUploadingAvatar}
              activeOpacity={0.8}
            >
              {isUploadingAvatar ? (
                <ActivityIndicator size="large" color={colors.primary} />
              ) : user?.profilePhoto ? (
                <Image source={{ uri: user.profilePhoto }} style={styles.avatarImage} />
              ) : (
                <Ionicons name="person" size={48} color={colors.gray} />
              )}
            </TouchableOpacity>
            
            {/* Pulsante modifica avatar */}
            <TouchableOpacity 
              style={[styles.editAvatarButton, isUploadingAvatar && styles.editAvatarButtonDisabled]}
              onPress={handleChangeAvatar}
              disabled={isUploadingAvatar}
            >
              {isUploadingAvatar ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Ionicons name="camera" size={16} color={colors.white} />
              )}
            </TouchableOpacity>
          </View>
          
          <Text style={styles.username}>{user?.nickname || user?.username || 'Utente'}</Text>
          <Text style={styles.usernameSmall}>@{user?.username || ''}</Text>
          <Text style={styles.email}>{user?.email || ''}</Text>
          
          {user?.bio && <Text style={styles.bio}>{user.bio}</Text>}
          
          {/* Livello */}
          <View style={styles.levelBadge}>
            <Ionicons name="star" size={16} color={colors.bevi} />
            <Text style={styles.levelText}>Livello {user?.level || 1}</Text>
          </View>
        </View>

        {/* Statistiche */}
        <View style={styles.statsContainer}>
          <StatCard 
            icon="beer-outline" 
            value={stats?.periods?.allTime?.count || user?.stats?.alcohol?.totalDrinks || 0} 
            label="Bevute"
            color={colors.bevi}
          />
          <StatCard 
            icon="trophy-outline" 
            value={user?.totalPoints || 0} 
            label="Punti"
            color={colors.primary}
          />
          <StatCard 
            icon="flame-outline" 
            value={user?.currentStreak || 0} 
            label="Streak"
            color={colors.warning}
          />
        </View>

        {/* Statistiche dettagliate */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Riepilogo veloce</Text>
          <View style={styles.detailedStats}>
            <View style={styles.detailedStatRow}>
              <Text style={styles.detailedStatLabel}>Bevute oggi</Text>
              <Text style={styles.detailedStatValue}>{stats?.periods?.today?.count || 0}</Text>
            </View>
            <View style={styles.detailedStatRow}>
              <Text style={styles.detailedStatLabel}>Bevute questa settimana</Text>
              <Text style={styles.detailedStatValue}>{stats?.periods?.thisWeek?.count || 0}</Text>
            </View>
            <View style={styles.detailedStatRow}>
              <Text style={styles.detailedStatLabel}>Punti questo mese</Text>
              <Text style={styles.detailedStatValue}>{stats?.periods?.thisMonth?.points || 0}</Text>
            </View>
            <View style={styles.detailedStatRow}>
              <Text style={styles.detailedStatLabel}>Streak più lungo</Text>
              <Text style={styles.detailedStatValue}>{user?.longestStreak || 0} giorni</Text>
            </View>
          </View>
        </View>

        {/* Menu */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Impostazioni</Text>
          
          <View style={styles.menuContainer}>
            <MenuButton 
              icon="person-outline" 
              label="Modifica Profilo" 
              onPress={() => navigation.navigate('EditProfile')} 
            />
            <MenuButton 
              icon="notifications-outline" 
              label="Notifiche" 
              onPress={() => {}}
            />
            <MenuButton 
              icon="shield-checkmark-outline" 
              label="Privacy e Termini" 
              onPress={() => navigation.navigate('Legal')}
            />
            <MenuButton 
              icon="help-circle-outline" 
              label="Aiuto" 
              onPress={() => {}}
            />
          </View>
        </View>

        {/* Logout */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={22} color={colors.error} />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Versione */}
        <Text style={styles.version}>Bevi App v1.0.0</Text>
      </ScrollView>

      {/* Overlay loading durante upload */}
      {isUploadingAvatar && (
        <View style={styles.uploadingOverlay}>
          <View style={styles.uploadingBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.uploadingText}>Aggiornamento foto...</Text>
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
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.veryLightGray,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.white,
  },
  editAvatarButtonDisabled: {
    backgroundColor: colors.gray,
  },
  username: {
    ...typography.h2,
    marginBottom: 2,
  },
  usernameSmall: {
    ...typography.bodySmall,
    color: colors.textTertiary,
    marginBottom: spacing.xs,
  },
  email: {
    ...typography.bodySmall,
    color: colors.textTertiary,
  },
  bio: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bevi + '20',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.round,
    marginTop: spacing.md,
  },
  levelText: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.bevi,
    marginLeft: spacing.xs,
  },
  
  // Stats
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  statCard: {
    alignItems: 'center',
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statValue: {
    ...typography.number,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textTertiary,
  },
  
  // Sections
  section: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionTitle: {
    ...typography.h4,
    marginBottom: spacing.md,
  },
  
  // Detailed Stats
  detailedStats: {
    backgroundColor: colors.veryLightGray,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  detailedStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailedStatLabel: {
    ...typography.body,
    color: colors.textSecondary,
  },
  detailedStatValue: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  
  // Menu
  menuContainer: {
    backgroundColor: colors.veryLightGray,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  menuButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuButtonLabel: {
    ...typography.body,
    marginLeft: spacing.md,
  },
  
  // Logout
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.error,
  },
  logoutText: {
    ...typography.button,
    color: colors.error,
    marginLeft: spacing.sm,
  },
  
  // Version
  version: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },

  // Overlay upload
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
    ...shadows.large,
  },
  uploadingText: {
    ...typography.body,
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
});

export default ProfileScreen;