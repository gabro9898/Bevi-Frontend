// src/screens/ProfileScreen/EditProfileScreen.js
// Schermata modifica profilo con eliminazione account

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../../theme';
import { selectCurrentUser, clearCredentials, setUser } from '../../store/slices/authSlice';
import { clearTokens } from '../../api/apiClient';
import { 
  useUpdateMyProfileMutation,
  useDeleteMyAccountMutation,
} from '../../api/beviApi';

const EditProfileScreen = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const currentUser = useSelector(selectCurrentUser);

  // Form state
  const [nickname, setNickname] = useState(currentUser?.nickname || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [gender, setGender] = useState(currentUser?.gender || 'not_specified');

  // Delete account modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [showDeletePassword, setShowDeletePassword] = useState(false);

  // Mutations
  const [updateProfile, { isLoading: isUpdating }] = useUpdateMyProfileMutation();
  const [deleteAccount, { isLoading: isDeleting }] = useDeleteMyAccountMutation();

  // Salva modifiche profilo
  const handleSaveProfile = async () => {
    if (!nickname.trim()) {
      Alert.alert('Errore', 'Il nickname non può essere vuoto');
      return;
    }

    try {
      const result = await updateProfile({
        nickname: nickname.trim(),
        bio: bio.trim(),
        gender,
      }).unwrap();

      // Aggiorna lo store locale
      dispatch(setUser({
        ...currentUser,
        nickname: nickname.trim(),
        bio: bio.trim(),
        gender,
      }));

      Alert.alert('Successo! ✅', 'Profilo aggiornato con successo');
      navigation.goBack();
    } catch (error) {
      console.error('Errore aggiornamento profilo:', error);
      Alert.alert('Errore', error?.data?.message || 'Impossibile aggiornare il profilo');
    }
  };

  // Elimina account
  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'ELIMINA IL MIO ACCOUNT') {
      Alert.alert('Errore', 'Scrivi esattamente: ELIMINA IL MIO ACCOUNT');
      return;
    }

    try {
      await deleteAccount({
        password: deletePassword || undefined,
        confirmation: deleteConfirmation,
      }).unwrap();

      // Logout
      await clearTokens();
      dispatch(clearCredentials());

      Alert.alert(
        'Account eliminato 😢',
        'Il tuo account è stato eliminato con successo. Ci mancherai!',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Errore eliminazione account:', error);
      Alert.alert('Errore', error?.data?.message || 'Impossibile eliminare l\'account');
    }
  };

  // Conferma eliminazione
  const confirmDeleteAccount = () => {
    Alert.alert(
      '⚠️ Attenzione!',
      'Stai per eliminare definitivamente il tuo account. Questa azione è irreversibile!\n\nTutti i tuoi dati, bevute, punti e progressi verranno persi.',
      [
        { text: 'Annulla', style: 'cancel' },
        { 
          text: 'Continua', 
          style: 'destructive',
          onPress: () => setShowDeleteModal(true)
        },
      ]
    );
  };

  const genderOptions = [
    { value: 'male', label: 'Uomo', icon: 'male' },
    { value: 'female', label: 'Donna', icon: 'female' },
    { value: 'other', label: 'Altro', icon: 'person' },
    { value: 'not_specified', label: 'Non specificato', icon: 'help-circle' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Modifica Profilo</Text>
          <TouchableOpacity 
            onPress={handleSaveProfile} 
            disabled={isUpdating}
            style={styles.saveButton}
          >
            {isUpdating ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text style={styles.saveButtonText}>Salva</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Nickname */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informazioni personali</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nickname</Text>
              <TextInput
                style={styles.input}
                value={nickname}
                onChangeText={setNickname}
                placeholder="Il tuo nickname"
                placeholderTextColor={colors.textMuted}
                maxLength={30}
              />
              <Text style={styles.inputHint}>{nickname.length}/30 caratteri</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Bio</Text>
              <TextInput
                style={[styles.input, styles.bioInput]}
                value={bio}
                onChangeText={setBio}
                placeholder="Scrivi qualcosa su di te..."
                placeholderTextColor={colors.textMuted}
                multiline
                maxLength={150}
              />
              <Text style={styles.inputHint}>{bio.length}/150 caratteri</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Genere</Text>
              <View style={styles.genderContainer}>
                {genderOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.genderOption,
                      gender === option.value && styles.genderOptionSelected,
                    ]}
                    onPress={() => setGender(option.value)}
                  >
                    <Ionicons 
                      name={option.icon} 
                      size={20} 
                      color={gender === option.value ? colors.white : colors.textSecondary} 
                    />
                    <Text style={[
                      styles.genderOptionText,
                      gender === option.value && styles.genderOptionTextSelected,
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Username e Email (non modificabili) */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informazioni account</Text>
            
            <View style={styles.readOnlyField}>
              <Text style={styles.readOnlyLabel}>Username</Text>
              <Text style={styles.readOnlyValue}>@{currentUser?.username}</Text>
            </View>

            <View style={styles.readOnlyField}>
              <Text style={styles.readOnlyLabel}>Email</Text>
              <Text style={styles.readOnlyValue}>{currentUser?.email}</Text>
            </View>
          </View>

          {/* Zona Pericolo */}
          <View style={[styles.section, styles.dangerSection]}>
            <Text style={styles.dangerSectionTitle}>⚠️ Zona Pericolo</Text>
            <Text style={styles.dangerDescription}>
              Le azioni in questa sezione sono irreversibili. Procedi con cautela.
            </Text>

            <TouchableOpacity 
              style={styles.deleteButton}
              onPress={confirmDeleteAccount}
            >
              <Ionicons name="trash-outline" size={20} color={colors.error} />
              <Text style={styles.deleteButtonText}>Elimina il mio account</Text>
            </TouchableOpacity>
          </View>

          {/* Spacer */}
          <View style={{ height: 50 }} />
        </ScrollView>

        {/* Modal eliminazione account */}
        <Modal
          visible={showDeleteModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowDeleteModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Ionicons name="warning" size={48} color={colors.error} />
                <Text style={styles.modalTitle}>Elimina Account</Text>
              </View>

              <Text style={styles.modalDescription}>
                Per confermare l'eliminazione del tuo account, scrivi esattamente:
              </Text>
              <Text style={styles.confirmationPhrase}>ELIMINA IL MIO ACCOUNT</Text>

              <TextInput
                style={styles.modalInput}
                value={deleteConfirmation}
                onChangeText={setDeleteConfirmation}
                placeholder="Scrivi qui la frase di conferma"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="characters"
              />

              {/* Password (opzionale, dipende dal tipo di account) */}
              <Text style={styles.modalInputLabel}>Password (se hai un account con password)</Text>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={styles.modalPasswordInput}
                  value={deletePassword}
                  onChangeText={setDeletePassword}
                  placeholder="La tua password"
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry={!showDeletePassword}
                />
                <TouchableOpacity 
                  onPress={() => setShowDeletePassword(!showDeletePassword)}
                  style={styles.passwordToggle}
                >
                  <Ionicons 
                    name={showDeletePassword ? 'eye-outline' : 'eye-off-outline'} 
                    size={20} 
                    color={colors.gray} 
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => {
                    setShowDeleteModal(false);
                    setDeleteConfirmation('');
                    setDeletePassword('');
                  }}
                >
                  <Text style={styles.modalCancelButtonText}>Annulla</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.modalDeleteButton,
                    deleteConfirmation !== 'ELIMINA IL MIO ACCOUNT' && styles.modalDeleteButtonDisabled,
                  ]}
                  onPress={handleDeleteAccount}
                  disabled={deleteConfirmation !== 'ELIMINA IL MIO ACCOUNT' || isDeleting}
                >
                  {isDeleting ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : (
                    <Text style={styles.modalDeleteButtonText}>Elimina definitivamente</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
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
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    ...typography.h3,
  },
  saveButton: {
    padding: spacing.xs,
  },
  saveButtonText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },

  // Content
  content: {
    flex: 1,
    padding: spacing.lg,
  },

  // Section
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.h4,
    marginBottom: spacing.md,
  },

  // Input
  inputGroup: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.veryLightGray,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...typography.body,
    color: colors.textPrimary,
  },
  bioInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  inputHint: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
    textAlign: 'right',
  },

  // Gender
  genderContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  genderOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  genderOptionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  genderOptionText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  genderOptionTextSelected: {
    color: colors.white,
  },

  // Read only
  readOnlyField: {
    backgroundColor: colors.veryLightGray,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  readOnlyLabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  readOnlyValue: {
    ...typography.body,
    color: colors.textSecondary,
  },

  // Danger section
  dangerSection: {
    backgroundColor: colors.error + '10',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.error + '30',
  },
  dangerSectionTitle: {
    ...typography.h4,
    color: colors.error,
    marginBottom: spacing.sm,
  },
  dangerDescription: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.error,
    backgroundColor: colors.white,
  },
  deleteButtonText: {
    ...typography.button,
    color: colors.error,
    marginLeft: spacing.sm,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.error,
    marginTop: spacing.md,
  },
  modalDescription: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  confirmationPhrase: {
    ...typography.body,
    fontWeight: 'bold',
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.lg,
    padding: spacing.sm,
    backgroundColor: colors.error + '10',
    borderRadius: borderRadius.sm,
  },
  modalInput: {
    backgroundColor: colors.veryLightGray,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...typography.body,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  modalInputLabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.veryLightGray,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
  },
  modalPasswordInput: {
    flex: 1,
    padding: spacing.md,
    ...typography.body,
    color: colors.textPrimary,
  },
  passwordToggle: {
    padding: spacing.md,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  modalCancelButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  modalCancelButtonText: {
    ...typography.button,
    color: colors.textSecondary,
  },
  modalDeleteButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.error,
    alignItems: 'center',
  },
  modalDeleteButtonDisabled: {
    backgroundColor: colors.gray,
  },
  modalDeleteButtonText: {
    ...typography.button,
    color: colors.white,
  },
});

export default EditProfileScreen;