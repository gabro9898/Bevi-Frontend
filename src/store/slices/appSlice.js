// src/store/slices/appSlice.js
// Gestisce lo stato globale dell'app

import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  theme: 'light',
  language: 'it',
  isOnline: true,
  isFirstLaunch: true,
  currentLeaderboardCategory: 'global',
  currentLeaderboardPeriod: 'daily',
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setTheme: (state, action) => {
      state.theme = action.payload;
    },
    
    setLanguage: (state, action) => {
      state.language = action.payload;
    },
    
    setOnlineStatus: (state, action) => {
      state.isOnline = action.payload;
    },
    
    setFirstLaunchComplete: (state) => {
      state.isFirstLaunch = false;
    },
    
    setLeaderboardCategory: (state, action) => {
      state.currentLeaderboardCategory = action.payload;
    },
    
    setLeaderboardPeriod: (state, action) => {
      state.currentLeaderboardPeriod = action.payload;
    },
  },
});

export const {
  setTheme,
  setLanguage,
  setOnlineStatus,
  setFirstLaunchComplete,
  setLeaderboardCategory,
  setLeaderboardPeriod,
} = appSlice.actions;

export const selectTheme = (state) => state.app.theme;
export const selectLanguage = (state) => state.app.language;
export const selectIsOnline = (state) => state.app.isOnline;
export const selectIsFirstLaunch = (state) => state.app.isFirstLaunch;
export const selectLeaderboardCategory = (state) => state.app.currentLeaderboardCategory;
export const selectLeaderboardPeriod = (state) => state.app.currentLeaderboardPeriod;

export default appSlice.reducer;