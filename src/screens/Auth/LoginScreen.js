// src/screens/Auth/LoginScreen.js
// Schermata di login con Google Sign In

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { colors, typography, spacing, borderRadius, shadows } from '../../theme';
import { setCredentials } from '../../store/slices/authSlice';
import { saveTokens } from '../../api/apiClient';
import { useLoginMutation, useGoogleAuthMutation } from '../../api/beviApi';

// Necessario per chiudere il browser dopo il login
WebBrowser.maybeCompleteAuthSession();

// Google Client IDs
const GOOGLE_WEB_CLIENT_ID = '537432298054-mp7feimem9r1qrg6iqifbuortu3jr3bt.apps.googleusercontent.com';
const GOOGLE_IOS_CLIENT_ID = '537432298054-f1psq6ecan828mkt26qprau7vatf57j9.apps.googleusercontent.com';
const GOOGLE_ANDROID_CLIENT_ID = '537432298054-jqin4dj11fitbosk04a53pktntofqud3.apps.googleusercontent.com';

const LoginScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Mutations
  const [login, { isLoading }] = useLoginMutation();
  const [googleAuth] = useGoogleAuthMutation();

  // Configurazione Google Sign In - usa useIdTokenAuthRequest per ottenere idToken
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: GOOGLE_WEB_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
  });

  console.log('Redirect URI:', request?.redirectUri);

  // Gestisci la risposta di Google
  useEffect(() => {
    handleGoogleResponse();
  }, [response]);

  const handleGoogleResponse = async () => {
    console.log('Response type:', response?.type);
    console.log('Response params:', response?.params);
    console.log('Response authentication:', response?.authentication);
    
    if (response?.type === 'success') {
      setIsGoogleLoading(true);
      
      // Con useIdTokenAuthRequest, l'idToken può essere in diversi posti
      const idToken = response.params?.id_token || response.authentication?.idToken;
      
      console.log('idToken trovato:', idToken ? 'SÌ' : 'NO');
      
      if (idToken) {
        await handleGoogleLogin(idToken);
      } else {
        console.log('Full response:', JSON.stringify(response, null, 2));
        Alert.alert('Errore', 'Impossibile ottenere il token da Google');
        setIsGoogleLoading(false);
      }
    } else if (response?.type === 'error') {
      console.log('Google Auth Error:', response.error);
      Alert.alert('Errore', 'Errore durante il login con Google');
    }
  };

  // Login con email/password
  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Errore', 'Inserisci email e password');
      return;
    }

    try {
      const result = await login({ email, password }).unwrap();
      const data = result.data;
      await saveTokens(data.accessToken, data.refreshToken);
      dispatch(setCredentials({
        user: data.user,
        token: data.accessToken,
      }));
    } catch (error) {
      console.log('Errore login:', error);
      Alert.alert(
        'Errore di login',
        error.data?.message || 'Credenziali non valide'
      );
    }
  };

  // Login con Google usando idToken
  const handleGoogleLogin = async (idToken) => {
    try {
      console.log('Invio idToken al backend...');
      const result = await googleAuth({ idToken }).unwrap();
      const data = result.data;
      await saveTokens(data.accessToken, data.refreshToken);
      dispatch(setCredentials({
        user: data.user,
        token: data.accessToken,
      }));

      if (data.isNewUser) {
        console.log('Nuovo utente registrato con Google!');
      }
    } catch (error) {
      console.log('Errore Google login:', error);
      Alert.alert(
        'Errore',
        error.data?.message || 'Errore durante il login con Google'
      );
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Avvia il flusso Google Sign In
  const handleGooglePress = async () => {
    if (!request) {
      Alert.alert('Errore', 'Google Sign In non è pronto. Riprova.');
      return;
    }
    
    try {
      await promptAsync();
    } catch (error) {
      console.log('Errore promptAsync:', error);
      Alert.alert('Errore', 'Impossibile avviare il login con Google');
    }
  };

  const isAnyLoading = isLoading || isGoogleLoading;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.logo}>🍺 Bevi</Text>
            <Text style={styles.subtitle}>Accedi per continuare</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color={colors.gray} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor={colors.textMuted}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                editable={!isAnyLoading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color={colors.gray} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor={colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoComplete="password"
                editable={!isAnyLoading}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons 
                  name={showPassword ? 'eye-outline' : 'eye-off-outline'} 
                  size={20} 
                  color={colors.gray} 
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={styles.forgotPassword}
              onPress={() => navigation.navigate('ForgotPassword')}
              disabled={isAnyLoading}
            >
              <Text style={styles.forgotPasswordText}>Password dimenticata?</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.button, isAnyLoading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={isAnyLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.buttonText}>Accedi</Text>
              )}
            </TouchableOpacity>

            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>oppure</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity 
              style={[styles.googleButton, isAnyLoading && styles.buttonDisabled]}
              onPress={handleGooglePress}
              disabled={!request || isAnyLoading}
            >
              {isGoogleLoading ? (
                <ActivityIndicator color={colors.textPrimary} />
              ) : (
                <>
                  <Ionicons name="logo-google" size={20} color="#DB4437" style={styles.googleIcon} />
                  <Text style={styles.googleButtonText}>Continua con Google</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Non hai un account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')} disabled={isAnyLoading}>
              <Text style={styles.footerLink}>Registrati</Text>
            </TouchableOpacity>
          </View>
        </View>
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
  content: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  logo: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  form: {
    marginBottom: spacing.xl,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.veryLightGray,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    height: 56,
  },
  inputIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: spacing.lg,
  },
  forgotPasswordText: {
    ...typography.bodySmall,
    color: colors.primary,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.small,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    ...typography.button,
    color: colors.white,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.lightGray,
  },
  dividerText: {
    ...typography.bodySmall,
    color: colors.textMuted,
    marginHorizontal: spacing.md,
  },
  googleButton: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.lightGray,
    ...shadows.small,
  },
  googleIcon: {
    marginRight: spacing.sm,
  },
  googleButtonText: {
    ...typography.button,
    color: colors.textPrimary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  footerLink: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
});

export default LoginScreen;