// src/screens/Auth/LoginScreen.js
// Schermata di login con Google Sign In (nativo su Android, expo-auth-session su iOS) e Apple Sign In

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
import * as AppleAuthentication from 'expo-apple-authentication';
import * as WebBrowser from 'expo-web-browser';
import { colors, typography, spacing, borderRadius, shadows } from '../../theme';
import { setCredentials } from '../../store/slices/authSlice';
import { saveTokens } from '../../api/apiClient';
import { useLoginMutation, useGoogleAuthMutation, useAppleAuthMutation } from '../../api/beviApi';

// iOS: expo-auth-session
import * as Google from 'expo-auth-session/providers/google';

// Android: @react-native-google-signin/google-signin
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

// Necessario per chiudere il browser dopo il login (iOS)
WebBrowser.maybeCompleteAuthSession();

// Google Client IDs - SEPARATI PER PIATTAFORMA
// iOS usa il progetto "Bevi APP" (537432298054)
// Android usa il progetto Firebase "bevi-35193" (980915796532)
const GOOGLE_WEB_CLIENT_ID_IOS = '537432298054-mp7feimem9r1qrg6iqifbuortu3jr3bt.apps.googleusercontent.com';
const GOOGLE_WEB_CLIENT_ID_ANDROID = '980915796532-3dapiiv6c32ahrs2id55m343gd50buiv.apps.googleusercontent.com';
const GOOGLE_IOS_CLIENT_ID = '537432298054-f1psq6ecan828mkt26qprau7vatf57j9.apps.googleusercontent.com';
const GOOGLE_ANDROID_CLIENT_ID = '980915796532-er3gjca2ojkkkuajlam7d8qs46r7ri4d.apps.googleusercontent.com';


const LoginScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isAppleLoading, setIsAppleLoading] = useState(false);
  const [isAppleAvailable, setIsAppleAvailable] = useState(false);
  const [isGoogleReady, setIsGoogleReady] = useState(false);

  // Mutations
  const [login, { isLoading }] = useLoginMutation();
  const [googleAuth] = useGoogleAuthMutation();
  const [appleAuth] = useAppleAuthMutation();

  // ============ iOS: expo-auth-session ============
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: GOOGLE_WEB_CLIENT_ID_IOS,
    iosClientId: GOOGLE_IOS_CLIENT_ID,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
  });

  // ============ Android: Configura Google Sign In nativo ============
  useEffect(() => {
    if (Platform.OS === 'android') {
      GoogleSignin.configure({
        webClientId: GOOGLE_WEB_CLIENT_ID_ANDROID,
        offlineAccess: true,
      });
      setIsGoogleReady(true);
      console.log('Google Sign In configurato per Android (nativo)');
    }
  }, []);

  // iOS: imposta isGoogleReady quando la request è pronta
  useEffect(() => {
    if (Platform.OS === 'ios' && request) {
      setIsGoogleReady(true);
    }
  }, [request]);

  // Verifica disponibilità Apple Sign In
  useEffect(() => {
    const checkAppleAvailability = async () => {
      const isAvailable = await AppleAuthentication.isAvailableAsync();
      setIsAppleAvailable(isAvailable);
    };
    checkAppleAvailability();
  }, []);

  // ============ iOS: Gestisci la risposta di Google ============
  useEffect(() => {
    if (Platform.OS === 'ios') {
      handleIOSGoogleResponse();
    }
  }, [response]);

  const handleIOSGoogleResponse = async () => {
    if (response?.type === 'success') {
      setIsGoogleLoading(true);
      
      const idToken = 
        response.params?.id_token ||
        response.authentication?.idToken ||
        response.params?.idToken ||
        response.authentication?.accessToken;
      
      if (idToken) {
        await handleGoogleLogin(idToken);
      } else {
        Alert.alert('Errore', 'Token non trovato nella risposta Google');
        setIsGoogleLoading(false);
      }
    } else if (response?.type === 'error') {
      console.log('Google Auth Error (iOS):', response.error);
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

  // Invia idToken al backend (usato sia da iOS che Android)
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

  // ============ Google Sign In Handler (Platform-specific) ============
  const handleGooglePress = async () => {
    if (Platform.OS === 'android') {
      await handleAndroidGoogleSignIn();
    } else {
      await handleIOSGoogleSignIn();
    }
  };

  // ============ Android: usa @react-native-google-signin (nativo) ============
  const handleAndroidGoogleSignIn = async () => {
    setIsGoogleLoading(true);

    try {
      // Verifica Play Services
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

      // Sign in
      const signInResult = await GoogleSignin.signIn();
      
      console.log('Google Sign In result (Android):', JSON.stringify(signInResult, null, 2));

      // Estrai idToken - la struttura può variare tra versioni
      const idToken = signInResult.data?.idToken || signInResult.idToken;

      if (!idToken) {
        console.error('idToken non trovato nella risposta:', signInResult);
        Alert.alert('Errore', 'Token non trovato. Riprova.');
        setIsGoogleLoading(false);
        return;
      }

      console.log('idToken ottenuto, lunghezza:', idToken.length);

      // Invia al backend
      await handleGoogleLogin(idToken);

    } catch (error) {
      console.error('Errore Google Sign In (Android):', error);
      
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log('Login Google annullato dall\'utente');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        Alert.alert('Attendere', 'Login già in corso...');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert('Errore', 'Google Play Services non disponibile');
      } else {
        Alert.alert('Errore', error.message || 'Errore durante il login con Google');
      }
      setIsGoogleLoading(false);
    }
  };

  // ============ iOS: usa expo-auth-session ============
  const handleIOSGoogleSignIn = async () => {
    if (!request) {
      Alert.alert('Errore', 'Google Sign In non è pronto. Riprova.');
      return;
    }
    
    try {
      await promptAsync();
    } catch (error) {
      console.log('Errore promptAsync (iOS):', error);
      Alert.alert('Errore', 'Impossibile avviare il login con Google');
    }
  };

  // Login con Apple
  const handleAppleLogin = async () => {
    setIsAppleLoading(true);
    
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      console.log('Apple credential ricevute');

      // Invia al backend
      const result = await appleAuth({
        identityToken: credential.identityToken,
        authorizationCode: credential.authorizationCode,
        fullName: credential.fullName,
      }).unwrap();

      const data = result.data;
      await saveTokens(data.accessToken, data.refreshToken);
      dispatch(setCredentials({
        user: data.user,
        token: data.accessToken,
      }));

      if (data.isNewUser) {
        console.log('Nuovo utente registrato con Apple!');
      }
    } catch (error) {
      if (error.code === 'ERR_REQUEST_CANCELED') {
        console.log('Apple Sign In annullato dall\'utente');
      } else {
        console.log('Errore Apple login:', error);
        Alert.alert(
          'Errore',
          error.data?.message || 'Errore durante il login con Apple'
        );
      }
    } finally {
      setIsAppleLoading(false);
    }
  };

  const isAnyLoading = isLoading || isGoogleLoading || isAppleLoading;

  // Per iOS usa request, per Android usa isGoogleReady
  const isGoogleDisabled = Platform.OS === 'ios' ? !request : !isGoogleReady;

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

            {/* Google Sign In */}
            <TouchableOpacity 
              style={[styles.socialButton, styles.googleButton, isAnyLoading && styles.buttonDisabled]}
              onPress={handleGooglePress}
              disabled={isGoogleDisabled || isAnyLoading}
            >
              {isGoogleLoading ? (
                <ActivityIndicator color={colors.textPrimary} />
              ) : (
                <>
                  <Ionicons name="logo-google" size={20} color="#DB4437" style={styles.socialIcon} />
                  <Text style={styles.googleButtonText}>Continua con Google</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Apple Sign In - Solo su iOS */}
            {Platform.OS === 'ios' && isAppleAvailable && (
              <TouchableOpacity 
                style={[styles.socialButton, styles.appleButton, isAnyLoading && styles.buttonDisabled]}
                onPress={handleAppleLogin}
                disabled={isAnyLoading}
              >
                {isAppleLoading ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <>
                    <Ionicons name="logo-apple" size={20} color={colors.white} style={styles.socialIcon} />
                    <Text style={styles.appleButtonText}>Continua con Apple</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
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
  socialButton: {
    flexDirection: 'row',
    borderRadius: borderRadius.md,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
    ...shadows.small,
  },
  googleButton: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  appleButton: {
    backgroundColor: '#000000',
  },
  socialIcon: {
    marginRight: spacing.sm,
  },
  googleButtonText: {
    ...typography.button,
    color: colors.textPrimary,
  },
  appleButtonText: {
    ...typography.button,
    color: colors.white,
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