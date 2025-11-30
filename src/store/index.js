// src/store/index.js
// Configurazione centrale dello store Redux

import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';

import { beviApi } from '../api/beviApi';
import authReducer from './slices/authSlice';
import appReducer from './slices/appSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    app: appReducer,
    [beviApi.reducerPath]: beviApi.reducer,
  },
  
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }).concat(beviApi.middleware),
});

setupListeners(store.dispatch);