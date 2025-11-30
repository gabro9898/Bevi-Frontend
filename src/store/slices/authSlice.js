// src/store/slices/authSlice.js
// Gestisce lo stato dell'autenticazione

import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    
    setCredentials: (state, action) => {
      const { user, token } = action.payload;
      state.user = user;
      state.token = token;
      state.isAuthenticated = true;
      state.isLoading = false;
      state.error = null;
    },
    
    setUser: (state, action) => {
      state.user = action.payload;
    },
    
    clearCredentials: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = null;
    },
    
    setAuthError: (state, action) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    
    clearAuthError: (state) => {
      state.error = null;
    },
  },
});

export const {
  setLoading,
  setCredentials,
  setUser,
  clearCredentials,
  setAuthError,
  clearAuthError,
} = authSlice.actions;

export const selectCurrentUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectAuthLoading = (state) => state.auth.isLoading;
export const selectAuthError = (state) => state.auth.error;

export default authSlice.reducer;