// src/theme/typography.js
// Stili tipografici consistenti per tutta l'app

import { StyleSheet } from 'react-native';
import colors from './colors';

const typography = StyleSheet.create({
  // Titoli
  h1: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  h4: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  
  // Corpo testo
  body: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.textPrimary,
    lineHeight: 24,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
    lineHeight: 20,
  },
  bodyTiny: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.textTertiary,
    lineHeight: 16,
  },
  
  // Label e caption
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.textTertiary,
  },
  
  // Bottoni
  button: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  buttonSmall: {
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Link
  link: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  
  // Numeri (per classifiche, punteggi)
  number: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  numberLarge: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  numberSmall: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
});

export default typography;