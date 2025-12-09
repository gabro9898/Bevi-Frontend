// src/screens/ProfileScreen/LegalScreen.js
// Schermata con link a Privacy Policy e Terms of Service

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Linking,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { colors, typography, spacing, borderRadius } from '../../theme';

// URL dei documenti legali (GitHub Pages)
const LEGAL_URLS = {
  privacyPolicy: 'https://gabro9898.github.io/bevi-docs/privacy-policy.html',
  termsOfService: 'https://gabro9898.github.io/bevi-docs/terms-of-service.html',
};

const LegalButton = ({ icon, title, subtitle, onPress }) => (
  <TouchableOpacity style={styles.legalButton} onPress={onPress} activeOpacity={0.7}>
    <View style={styles.legalButtonLeft}>
      <View style={styles.legalIconContainer}>
        <Ionicons name={icon} size={24} color={colors.primary} />
      </View>
      <View style={styles.legalTextContainer}>
        <Text style={styles.legalButtonTitle}>{title}</Text>
        <Text style={styles.legalButtonSubtitle}>{subtitle}</Text>
      </View>
    </View>
    <Ionicons name="open-outline" size={20} color={colors.gray} />
  </TouchableOpacity>
);

const LegalScreen = () => {
  const navigation = useNavigation();

  // Apre un URL nel browser in-app
  const openUrl = async (url, title) => {
    try {
      // Usa WebBrowser per aprire in-app (migliore UX)
      await WebBrowser.openBrowserAsync(url, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
        controlsColor: colors.primary,
        toolbarColor: colors.white,
      });
    } catch (error) {
      console.error('Errore apertura URL:', error);
      
      // Fallback: apri nel browser esterno
      try {
        const supported = await Linking.canOpenURL(url);
        if (supported) {
          await Linking.openURL(url);
        } else {
          Alert.alert('Errore', `Impossibile aprire: ${url}`);
        }
      } catch (linkError) {
        Alert.alert('Errore', 'Impossibile aprire il link');
      }
    }
  };

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
        <Text style={styles.headerTitle}>Privacy e Termini</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Intro */}
        <View style={styles.introSection}>
          <Ionicons name="shield-checkmark" size={48} color={colors.primary} />
          <Text style={styles.introTitle}>La tua privacy è importante</Text>
          <Text style={styles.introText}>
            Leggi i nostri documenti per capire come trattiamo i tuoi dati e quali sono i termini di utilizzo dell'app.
          </Text>
        </View>

        {/* Buttons */}
        <View style={styles.buttonsSection}>
          <LegalButton
            icon="document-text-outline"
            title="Privacy Policy"
            subtitle="Come raccogliamo e utilizziamo i tuoi dati"
            onPress={() => openUrl(LEGAL_URLS.privacyPolicy, 'Privacy Policy')}
          />
          
          <LegalButton
            icon="newspaper-outline"
            title="Termini di Servizio"
            subtitle="Regole e condizioni di utilizzo dell'app"
            onPress={() => openUrl(LEGAL_URLS.termsOfService, 'Termini di Servizio')}
          />
        </View>

        {/* Info aggiuntive */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Hai domande?</Text>
          <Text style={styles.infoText}>
            Se hai domande sulla privacy o sui termini di servizio, contattaci all'indirizzo:
          </Text>
          <TouchableOpacity 
            style={styles.emailButton}
            onPress={() => Linking.openURL('mailto:support@bevi-app.com')}
          >
            <Ionicons name="mail-outline" size={20} color={colors.primary} />
            <Text style={styles.emailText}>support@bevi-app.com</Text>
          </TouchableOpacity>
        </View>

        {/* Versione */}
        <Text style={styles.version}>Bevi App v1.0.0</Text>
        <Text style={styles.lastUpdate}>Ultimo aggiornamento: Dicembre 2025</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  headerRight: {
    width: 40,
  },
  
  // Content
  content: {
    flex: 1,
  },
  
  // Intro Section
  introSection: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  introTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  introText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  
  // Buttons Section
  buttonsSection: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  legalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  legalButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  legalIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  legalTextContainer: {
    flex: 1,
  },
  legalButtonTitle: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  legalButtonSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  
  // Info Section
  infoSection: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    backgroundColor: colors.veryLightGray,
    marginHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  infoTitle: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  infoText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  emailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  emailText: {
    ...typography.body,
    color: colors.primary,
    marginLeft: spacing.sm,
    fontWeight: '500',
  },
  
  // Footer
  version: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  lastUpdate: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },
});

export default LegalScreen;