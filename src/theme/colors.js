// src/theme/colors.js
// Palette colori ispirata ad Airbnb: pulita, moderna, con accenti

const colors = {
  // Colori primari
  primary: '#FF385C',        // Rosso/Rosa Airbnb - per azioni principali
  primaryLight: '#FF5A5F',
  primaryDark: '#E31C5F',
  
  // Colore speciale per il tasto "Bevi" (giallo come richiesto)
  bevi: '#FFB400',           // Giallo oro - tasto centrale
  beviLight: '#FFCC33',
  beviDark: '#E6A200',
  
  // Scala di grigi
  black: '#222222',
  darkGray: '#484848',
  gray: '#767676',
  lightGray: '#DDDDDD',
  veryLightGray: '#F7F7F7',
  white: '#FFFFFF',
  
  // Colori di stato
  success: '#00A699',        // Verde acqua
  warning: '#FFB400',
  error: '#FF385C',
  info: '#428BFF',
  
  // Colori per categorie bevande
  categories: {
    alcol: '#FF385C',        // Rosso
    analcolico: '#00A699',   // Verde acqua
    shot: '#FFB400',         // Giallo
    birra: '#F5A623',        // Arancione
    vino: '#8B0000',         // Bordeaux
    cocktail: '#FF69B4',     // Rosa
    altro: '#767676',        // Grigio
  },
  
  // Sfondi
  background: '#FFFFFF',
  backgroundSecondary: '#F7F7F7',
  card: '#FFFFFF',
  
  // Bordi
  border: '#EBEBEB',
  borderDark: '#DDDDDD',
  
  // Testo
  textPrimary: '#222222',
  textSecondary: '#484848',
  textTertiary: '#767676',
  textLight: '#FFFFFF',
  textMuted: '#B0B0B0',
  
  // Overlay
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
};

export default colors;