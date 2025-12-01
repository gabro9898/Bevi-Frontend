// src/api/apiClient.js
// Client Axios configurato per comunicare con il backend Bevi

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ==================== CONFIGURAZIONE ====================

// URL base del backend
// IMPORTANTE: Cambia questo con l'IP del tuo computer!
// Per trovare il tuo IP: apri cmd e scrivi "ipconfig"
// Cerca "Indirizzo IPv4" (es. 192.168.1.100)

const BASE_URL = 'https://bevi-backend.onrender.com/api';
// Chiave per salvare il token in AsyncStorage
const TOKEN_KEY = '@bevi_auth_token';
const REFRESH_TOKEN_KEY = '@bevi_refresh_token';

// ==================== CREAZIONE CLIENT ====================

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ==================== INTERCEPTOR REQUEST ====================
// Aggiunge automaticamente il token a ogni richiesta

apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.log('Errore lettura token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ==================== INTERCEPTOR RESPONSE ====================
// Gestisce errori globali (es. token scaduto)

apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
        if (refreshToken) {
          const response = await axios.post(`${BASE_URL}/auth/refresh-token`, {
            refreshToken,
          });

          const { token, refreshToken: newRefreshToken } = response.data;

          await AsyncStorage.setItem(TOKEN_KEY, token);
          await AsyncStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);

          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        await AsyncStorage.removeItem(TOKEN_KEY);
        await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
        console.log('Token refresh fallito, utente deve rifare login');
      }
    }

    return Promise.reject(error);
  }
);

// ==================== HELPER FUNCTIONS ====================

export const saveTokens = async (token, refreshToken) => {
  try {
    await AsyncStorage.setItem(TOKEN_KEY, token);
    if (refreshToken) {
      await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
  } catch (error) {
    console.log('Errore salvataggio token:', error);
  }
};

export const clearTokens = async () => {
  try {
    await AsyncStorage.removeItem(TOKEN_KEY);
    await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch (error) {
    console.log('Errore rimozione token:', error);
  }
};

export const hasToken = async () => {
  try {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    return !!token;
  } catch (error) {
    return false;
  }
};

export const getToken = async () => {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch (error) {
    return null;
  }
};

export default apiClient;