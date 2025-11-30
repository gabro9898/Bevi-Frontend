// src/navigation/RootNavigator.js
// Navigator principale: decide se mostrare Auth o Main

import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';

import AuthStack from './AuthStack';
import MainNavigator from './MainNavigator'; // Cambiato da MainTabs

import { 
  selectIsAuthenticated, 
  selectAuthLoading,
  setLoading,
  setCredentials,
  clearCredentials,
} from '../store/slices/authSlice';

import { colors } from '../theme';

const TOKEN_KEY = '@bevi_auth_token';

const LoadingScreen = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color={colors.primary} />
  </View>
);

const RootNavigator = () => {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isLoading = useSelector(selectAuthLoading);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem(TOKEN_KEY);
        console.log('Token trovato:', token ? 'SI' : 'NO');
        
        if (token) {
          // Token esiste, impostiamo l'utente come autenticato
          dispatch(setCredentials({
            user: null, // Verrà caricato dopo
            token: token,
          }));
        } else {
          dispatch(clearCredentials());
        }
      } catch (error) {
        console.log('Errore check auth:', error);
        dispatch(clearCredentials());
      } finally {
        dispatch(setLoading(false));
      }
    };

    checkAuth();
  }, [dispatch]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? (
        <MainNavigator />  
      ) : (
        <AuthStack />
      )}
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});

export default RootNavigator;