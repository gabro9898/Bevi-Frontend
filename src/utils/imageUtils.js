// src/utils/imageUtils.js
// Utility per gestione immagini - conversione base64, compressione, picker

import * as ImagePicker from 'expo-image-picker';
// ✅ FIX: Uso legacy API per Expo SDK 54+
import * as FileSystem from 'expo-file-system/legacy';
import { Alert, Platform } from 'react-native';

// ==================== CONFIGURAZIONE ====================

const IMAGE_CONFIG = {
  // Qualità compressione (0-1)
  quality: 0.7,
  // Dimensione massima in pixel
  maxWidth: 1200,
  maxHeight: 1200,
  // Dimensione massima file in bytes (10MB)
  maxFileSize: 10 * 1024 * 1024,
  // Formati accettati
  allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
};

// ==================== CONVERSIONE BASE64 ====================

/**
 * Converte un URI locale in stringa base64
 * @param {string} uri - URI dell'immagine locale
 * @returns {Promise<string>} - Stringa base64 con prefisso data:image
 */
export const uriToBase64 = async (uri) => {
  try {
    console.log('🔄 [uriToBase64] Inizio conversione:', uri);
    
    // Leggi il file come base64 (legacy API)
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    console.log('🔄 [uriToBase64] File letto, lunghezza base64 raw:', base64?.length);

    // Determina il tipo MIME dall'estensione
    const extension = uri.split('.').pop()?.toLowerCase() || 'jpg';
    const mimeType = getMimeType(extension);
    
    console.log('🔄 [uriToBase64] Estensione:', extension, '| MIME:', mimeType);

    // Restituisci con prefisso data:image
    const result = `data:${mimeType};base64,${base64}`;
    
    console.log('✅ [uriToBase64] Conversione completata, lunghezza totale:', result.length);
    
    return result;
  } catch (error) {
    console.error('❌ [uriToBase64] Errore conversione base64:', error);
    throw new Error('Impossibile convertire l\'immagine');
  }
};

/**
 * Ottiene il MIME type dall'estensione
 */
const getMimeType = (extension) => {
  const mimeTypes = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    gif: 'image/gif',
  };
  return mimeTypes[extension] || 'image/jpeg';
};

/**
 * Stima la dimensione del file da base64
 * @param {string} base64String - Stringa base64
 * @returns {number} - Dimensione approssimativa in bytes
 */
export const estimateBase64Size = (base64String) => {
  if (!base64String) return 0;
  
  // Rimuovi il prefisso data:image se presente
  const base64Data = base64String.replace(/^data:image\/\w+;base64,/, '');
  
  // La dimensione del file originale è circa 3/4 della lunghezza base64
  return Math.round((base64Data.length * 3) / 4);
};

/**
 * Formatta la dimensione in modo leggibile
 */
export const formatFileSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// ==================== IMAGE PICKER ====================

/**
 * Richiede i permessi per la fotocamera
 */
export const requestCameraPermission = async () => {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert(
      'Permesso negato',
      'Per scattare foto è necessario il permesso della fotocamera. Puoi abilitarlo nelle impostazioni.',
      [{ text: 'OK' }]
    );
    return false;
  }
  return true;
};

/**
 * Richiede i permessi per la galleria
 */
export const requestMediaLibraryPermission = async () => {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert(
      'Permesso negato',
      'Per selezionare foto dalla galleria è necessario il permesso. Puoi abilitarlo nelle impostazioni.',
      [{ text: 'OK' }]
    );
    return false;
  }
  return true;
};

/**
 * Apre la fotocamera per scattare una foto
 * @param {Object} options - Opzioni aggiuntive
 * @returns {Promise<{uri: string, base64: string} | null>}
 */
export const takePhoto = async (options = {}) => {
  try {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return null;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: options.allowsEditing ?? true,
      aspect: options.aspect ?? [1, 1],
      quality: options.quality ?? IMAGE_CONFIG.quality,
    });

    if (result.canceled || !result.assets?.[0]) {
      return null;
    }

    const asset = result.assets[0];
    
    // Converti in base64
    const base64 = await uriToBase64(asset.uri);
    
    // Verifica dimensione
    const size = estimateBase64Size(base64);
    if (size > IMAGE_CONFIG.maxFileSize) {
      Alert.alert(
        'Immagine troppo grande',
        `L'immagine è di ${formatFileSize(size)}. Il massimo è ${formatFileSize(IMAGE_CONFIG.maxFileSize)}.`,
        [{ text: 'OK' }]
      );
      return null;
    }

    return {
      uri: asset.uri,
      base64,
      width: asset.width,
      height: asset.height,
      size,
    };
  } catch (error) {
    console.error('Errore scatto foto:', error);
    Alert.alert('Errore', 'Impossibile scattare la foto');
    return null;
  }
};

/**
 * Apre la galleria per selezionare un'immagine
 * @param {Object} options - Opzioni aggiuntive
 * @returns {Promise<{uri: string, base64: string} | null>}
 */
export const pickImage = async (options = {}) => {
  try {
    const hasPermission = await requestMediaLibraryPermission();
    if (!hasPermission) return null;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: options.allowsEditing ?? true,
      aspect: options.aspect ?? [1, 1],
      quality: options.quality ?? IMAGE_CONFIG.quality,
    });

    if (result.canceled || !result.assets?.[0]) {
      return null;
    }

    const asset = result.assets[0];
    
    // Converti in base64
    const base64 = await uriToBase64(asset.uri);
    
    // Verifica dimensione
    const size = estimateBase64Size(base64);
    if (size > IMAGE_CONFIG.maxFileSize) {
      Alert.alert(
        'Immagine troppo grande',
        `L'immagine è di ${formatFileSize(size)}. Il massimo è ${formatFileSize(IMAGE_CONFIG.maxFileSize)}.`,
        [{ text: 'OK' }]
      );
      return null;
    }

    return {
      uri: asset.uri,
      base64,
      width: asset.width,
      height: asset.height,
      size,
    };
  } catch (error) {
    console.error('Errore selezione immagine:', error);
    Alert.alert('Errore', 'Impossibile selezionare l\'immagine');
    return null;
  }
};

/**
 * Mostra un action sheet per scegliere tra fotocamera e galleria
 * @param {Object} options - Opzioni aggiuntive
 * @returns {Promise<{uri: string, base64: string} | null>}
 */
export const showImagePicker = (options = {}) => {
  return new Promise((resolve) => {
    Alert.alert(
      options.title || 'Scegli immagine',
      options.message || 'Da dove vuoi caricare l\'immagine?',
      [
        {
          text: '📷 Fotocamera',
          onPress: async () => {
            const result = await takePhoto(options);
            resolve(result);
          },
        },
        {
          text: '🖼️ Galleria',
          onPress: async () => {
            const result = await pickImage(options);
            resolve(result);
          },
        },
        {
          text: 'Annulla',
          style: 'cancel',
          onPress: () => resolve(null),
        },
      ]
    );
  });
};

// ==================== VALIDAZIONE ====================

/**
 * Valida un'immagine base64
 * @param {string} base64 - Immagine in base64
 * @returns {{valid: boolean, error?: string}}
 */
export const validateImage = (base64) => {
  if (!base64) {
    return { valid: false, error: 'Nessuna immagine fornita' };
  }

  // Verifica formato
  if (!base64.startsWith('data:image/')) {
    return { valid: false, error: 'Formato immagine non valido' };
  }

  // Verifica tipo
  const mimeMatch = base64.match(/^data:(image\/\w+);base64,/);
  if (!mimeMatch) {
    return { valid: false, error: 'Formato base64 non valido' };
  }

  const mimeType = mimeMatch[1];
  if (!IMAGE_CONFIG.allowedTypes.includes(mimeType)) {
    return { valid: false, error: `Tipo ${mimeType} non supportato. Usa JPG, PNG o WebP.` };
  }

  // Verifica dimensione
  const size = estimateBase64Size(base64);
  if (size > IMAGE_CONFIG.maxFileSize) {
    return { 
      valid: false, 
      error: `Immagine troppo grande (${formatFileSize(size)}). Max: ${formatFileSize(IMAGE_CONFIG.maxFileSize)}` 
    };
  }

  return { valid: true };
};

// ==================== HOOK PERSONALIZZATO ====================

/**
 * Hook per gestire upload avatar
 * Uso: const { pickAvatar, isLoading, error } = useAvatarPicker();
 */
export const useImagePicker = () => {
  // Questo è un semplice wrapper, l'hook vero sarà nel componente
  return {
    takePhoto,
    pickImage,
    showImagePicker,
    validateImage,
    uriToBase64,
  };
};

export default {
  uriToBase64,
  estimateBase64Size,
  formatFileSize,
  takePhoto,
  pickImage,
  showImagePicker,
  validateImage,
  requestCameraPermission,
  requestMediaLibraryPermission,
  IMAGE_CONFIG,
};