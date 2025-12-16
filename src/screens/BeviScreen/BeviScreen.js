// src/screens/BeviScreen/BeviScreen.js
// Schermata per registrare una bevuta con foto
// ✅ AGGIORNATO: Upload foto su Cloudinary + Banner Ads + GEOLOCALIZZAZIONE

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
  Image,
  ScrollView,
  TextInput,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location'; // ✅ NUOVO
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius, shadows } from '../../theme';
import { 
  useCreateDrinkLogMutation, 
  useGetAllDrinksQuery,
  useGetCooldownStatusQuery,
  useGetMyDrinkStatsQuery,
} from '../../api/beviApi';
import { uriToBase64, formatFileSize, estimateBase64Size } from '../../utils/imageUtils';
import BannerAd from '../../components/ads/BannerAd';

// Categorie disponibili
const DRINK_CATEGORIES = [
  { id: 'ALL', label: 'Tutti', emoji: '🍹' },
  { id: 'BEER', label: 'Birra', emoji: '🍺' },
  { id: 'WINE', label: 'Vino', emoji: '🍷' },
  { id: 'SPIRITS', label: 'Alcolici', emoji: '🍸' },
  { id: 'SOFT_DRINK', label: 'Bibite', emoji: '🥤' },
  { id: 'ENERGY_DRINK', label: 'Energy', emoji: '⚡' },
  { id: 'WATER', label: 'Acqua', emoji: '💧' },
];

// Funzione per ottenere emoji dalla categoria
const getCategoryEmoji = (category) => {
  const found = DRINK_CATEGORIES.find(c => c.id === category);
  return found?.emoji || '🍹';
};

// Componente Tab Categoria
const CategoryTab = ({ category, isActive, onPress }) => (
  <TouchableOpacity 
    style={[styles.categoryTab, isActive && styles.categoryTabActive]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Text style={styles.categoryEmoji}>{category.emoji}</Text>
    <Text style={[styles.categoryLabel, isActive && styles.categoryLabelActive]}>
      {category.label}
    </Text>
  </TouchableOpacity>
);

// Componente singola bevanda
const DrinkItem = ({ item, onSelect, isFavorite }) => (
  <TouchableOpacity 
    style={[styles.drinkOption, isFavorite && styles.drinkOptionFavorite]}
    onPress={() => onSelect(item)}
    activeOpacity={0.7}
  >
    {isFavorite && (
      <View style={styles.favoriteIcon}>
        <Ionicons name="star" size={12} color={colors.bevi} />
      </View>
    )}
    <Text style={styles.drinkEmoji}>{getCategoryEmoji(item.category)}</Text>
    <Text style={styles.drinkName} numberOfLines={2}>{item.name}</Text>
    <Text style={styles.drinkBrand} numberOfLines={1}>{item.brand}</Text>
    <View style={styles.drinkPointsBadge}>
      <Text style={styles.drinkPoints}>+{item.basePoints}</Text>
    </View>
  </TouchableOpacity>
);

// Componente selezione bevanda
const DrinkSelector = ({ visible, onClose, onSelect, drinks, topDrinks, isLoading }) => {
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredDrinks = drinks.filter(drink => {
    const matchesCategory = activeCategory === 'ALL' || drink.category === activeCategory;
    const matchesSearch = searchQuery === '' || 
      drink.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      drink.brand.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleClose = () => {
    setActiveCategory('ALL');
    setSearchQuery('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Cosa stai bevendo?</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={colors.gray} />
            <TextInput
              style={styles.searchInput}
              placeholder="Cerca bevanda..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery !== '' && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={colors.gray} />
              </TouchableOpacity>
            )}
          </View>

          {isLoading ? (
            <View style={styles.modalLoading}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.modalLoadingText}>Caricamento bevande...</Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              {topDrinks.length > 0 && searchQuery === '' && activeCategory === 'ALL' && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="star" size={18} color={colors.bevi} />
                    <Text style={styles.sectionTitle}>Le tue preferite</Text>
                  </View>
                  <View style={styles.drinksGrid}>
                    {topDrinks.map((item) => (
                      <DrinkItem 
                        key={`fav-${item.id}`} 
                        item={item} 
                        onSelect={onSelect}
                        isFavorite={true}
                      />
                    ))}
                  </View>
                </View>
              )}

              <View style={styles.categoriesContainer}>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.categoriesScroll}
                >
                  {DRINK_CATEGORIES.map((category) => (
                    <CategoryTab
                      key={category.id}
                      category={category}
                      isActive={activeCategory === category.id}
                      onPress={() => setActiveCategory(category.id)}
                    />
                  ))}
                </ScrollView>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  {activeCategory === 'ALL' ? 'Tutte le bevande' : DRINK_CATEGORIES.find(c => c.id === activeCategory)?.label}
                  {' '}({filteredDrinks.length})
                </Text>
                <View style={styles.drinksGrid}>
                  {filteredDrinks.map((item) => (
                    <DrinkItem 
                      key={item.id} 
                      item={item} 
                      onSelect={onSelect}
                      isFavorite={false}
                    />
                  ))}
                </View>
                {filteredDrinks.length === 0 && (
                  <View style={styles.emptyDrinks}>
                    <Text style={styles.emptyDrinksText}>Nessuna bevanda trovata</Text>
                  </View>
                )}
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

const BeviScreen = () => {
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraOpen, setCameraOpen] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [photoBase64, setPhotoBase64] = useState(null);
  const [isConverting, setIsConverting] = useState(false);
  const [drinkSelectorVisible, setDrinkSelectorVisible] = useState(false);
  const [facing, setFacing] = useState('back');
  const [localCooldown, setLocalCooldown] = useState(0);
  
  // ✅ NUOVO: Stato per la posizione
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState('idle'); // idle | loading | success | error
  
  const cameraRef = useRef(null);
  const timerRef = useRef(null);

  // API hooks
  const [createDrinkLog, { isLoading: isSubmitting }] = useCreateDrinkLogMutation();
  const { data: drinksResponse, isLoading: drinksLoading } = useGetAllDrinksQuery();
  const { data: cooldownResponse, refetch: refetchCooldown } = useGetCooldownStatusQuery();
  const { data: statsResponse } = useGetMyDrinkStatsQuery();

  const drinks = drinksResponse?.data?.drinks || [];
  
  const extractTopDrinks = () => {
    const topDrinksData = statsResponse?.data?.topDrinks || [];
    const result = [];
    for (const item of topDrinksData) {
      if (!item.drink) continue;
      const fullDrink = drinks.find(d => 
        d.name === item.drink.name && d.brand === item.drink.brand
      );
      if (fullDrink) result.push(fullDrink);
      if (result.length >= 6) break;
    }
    return result;
  };

  const topDrinks = extractTopDrinks();

  const cooldownData = cooldownResponse?.data || cooldownResponse || {};
  const serverCanDrink = cooldownData?.canDrink !== false;
  const serverWaitTime = cooldownData?.waitTime || 0;
  const canDrink = serverCanDrink && localCooldown <= 0;

  // ✅ NUOVO: Funzione per ottenere la posizione
  const getCurrentLocation = async () => {
    try {
      setLocationStatus('loading');
      
      // Chiedi permesso
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        console.log('📍 Permesso posizione negato');
        setLocationStatus('error');
        return null;
      }
      
      // Ottieni posizione
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced, // Buon compromesso velocità/precisione
      });
      
      console.log('📍 Posizione ottenuta:', {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      
      setCurrentLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      setLocationStatus('success');
      
      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    } catch (error) {
      console.log('📍 Errore posizione:', error.message);
      setLocationStatus('error');
      return null;
    }
  };

  // ✅ NUOVO: Richiedi posizione quando lo schermo è in focus
  useFocusEffect(
    useCallback(() => {
      refetchCooldown();
      // Ottieni posizione in background (non blocca l'UI)
      getCurrentLocation();
    }, [refetchCooldown])
  );

  useEffect(() => {
    if (serverWaitTime > 0) {
      setLocalCooldown(serverWaitTime);
    } else if (serverCanDrink) {
      setLocalCooldown(0);
    }
  }, [serverWaitTime, serverCanDrink]);

  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    if (localCooldown > 0) {
      timerRef.current = setInterval(() => {
        setLocalCooldown(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            refetchCooldown();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [localCooldown > 0]);

  const formatCooldown = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        setIsConverting(true);
        
        console.log('📸 [1] Inizio scatto foto...');
        
        const photoData = await cameraRef.current.takePictureAsync({
          quality: 0.7,
          base64: false,
        });
        
        console.log('📸 [2] Foto scattata:', {
          uri: photoData.uri,
          width: photoData.width,
          height: photoData.height,
        });
        
        console.log('📸 [3] Inizio conversione base64...');
        const base64Image = await uriToBase64(photoData.uri);
        
        console.log('📸 [4] Conversione completata:', {
          lunghezzaBase64: base64Image?.length || 0,
        });
        
        const imageSize = estimateBase64Size(base64Image);
        console.log('📸 [5] Dimensione stimata:', formatFileSize(imageSize));
        
        if (imageSize > 10 * 1024 * 1024) {
          console.log('❌ [6] Immagine troppo grande!');
          Alert.alert(
            'Immagine troppo grande',
            'L\'immagine è troppo grande. Riprova con una qualità inferiore.',
            [{ text: 'OK' }]
          );
          setIsConverting(false);
          return;
        }
        
        // ✅ Aggiorna posizione prima di aprire il selettore
        if (!currentLocation) {
          await getCurrentLocation();
        }
        
        setPhoto(photoData);
        setPhotoBase64(base64Image);
        setCameraOpen(false);
        setDrinkSelectorVisible(true);
        
      } catch (error) {
        console.log('❌ Errore foto:', error);
        Alert.alert('Errore', 'Impossibile scattare la foto');
      } finally {
        setIsConverting(false);
      }
    }
  };

  // ✅ AGGIORNATO: Invia anche la posizione
  const handleDrinkSelect = async (drink) => {
    console.log('🍺 [1] Bevanda selezionata:', {
      id: drink.id,
      name: drink.name,
      brand: drink.brand,
    });
    
    if (!drink.id) {
      Alert.alert('Errore', 'Bevanda non valida');
      return;
    }
    
    setDrinkSelectorVisible(false);
    
    try {
      const drinkLogData = {
        drinkId: drink.id,
      };
      
      // ✅ NUOVO: Aggiungi la posizione se disponibile
      if (currentLocation) {
        drinkLogData.latitude = currentLocation.latitude;
        drinkLogData.longitude = currentLocation.longitude;
        console.log('📍 [2] Aggiungo posizione:', currentLocation);
      } else {
        console.log('📍 [2] Posizione non disponibile');
      }
      
      if (photoBase64) {
        drinkLogData.image = photoBase64;
        console.log('🍺 [3] Aggiungo immagine alla richiesta');
      }
      
      console.log('📤 [4] Invio richiesta createDrinkLog...', {
        drinkId: drinkLogData.drinkId,
        hasImage: !!drinkLogData.image,
        hasLocation: !!currentLocation,
      });
      
      const result = await createDrinkLog(drinkLogData).unwrap();
      
      console.log('✅ [5] Risposta ricevuta:', JSON.stringify(result, null, 2));
      
      const data = result?.data || result;
      const location = data?.drinkLog?.location;
      
      // ✅ Messaggio con località se disponibile
      let alertMessage = `Hai registrato: ${drink.name}\n+${data?.drinkLog?.pointsEarned || drink.basePoints} punti!`;
      if (location?.city || location?.region) {
        alertMessage += `\n📍 ${location.city || location.region}`;
      }
      
      Alert.alert('🎉 Bevuta registrata!', alertMessage, [{ 
        text: 'OK', 
        onPress: () => {
          setPhoto(null);
          setPhotoBase64(null);
          refetchCooldown();
        }
      }]);
    } catch (error) {
      console.log('❌ [ERROR] Errore registrazione:', error);
      Alert.alert(
        'Errore', 
        error?.data?.message || 'Impossibile registrare la bevuta'
      );
      setPhoto(null);
      setPhotoBase64(null);
    }
  };

  const handleReset = () => {
    setPhoto(null);
    setPhotoBase64(null);
    setCameraOpen(false);
  };

  // ✅ AGGIORNATO: Ottieni posizione anche per quick add
  const handleQuickAdd = async () => {
    setPhoto(null);
    setPhotoBase64(null);
    
    // Aggiorna posizione se non disponibile
    if (!currentLocation) {
      await getCurrentLocation();
    }
    
    setDrinkSelectorVisible(true);
  };

  if (!permission) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Ionicons name="camera-outline" size={64} color={colors.gray} />
          <Text style={styles.permissionTitle}>Permesso Camera</Text>
          <Text style={styles.permissionText}>
            Per registrare le tue bevute, abbiamo bisogno di accedere alla fotocamera.
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Consenti Accesso</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (cameraOpen) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView 
          ref={cameraRef}
          style={styles.camera}
          facing={facing}
        >
          <SafeAreaView style={styles.cameraOverlay}>
            <View style={styles.cameraHeader}>
              <TouchableOpacity 
                style={styles.cameraButton}
                onPress={() => setCameraOpen(false)}
              >
                <Ionicons name="close" size={28} color={colors.white} />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.cameraButton}
                onPress={() => setFacing(facing === 'back' ? 'front' : 'back')}
              >
                <Ionicons name="camera-reverse" size={28} color={colors.white} />
              </TouchableOpacity>
            </View>

            <View style={styles.cameraFooter}>
              <TouchableOpacity 
                style={[styles.captureButton, isConverting && styles.captureButtonDisabled]}
                onPress={takePicture}
                disabled={isConverting}
              >
                {isConverting ? (
                  <ActivityIndicator size="large" color={colors.primary} />
                ) : (
                  <View style={styles.captureButtonInner} />
                )}
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </CameraView>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Registra Bevuta</Text>
      </View>

      <View style={styles.content}>
        {photo ? (
          <View style={styles.photoPreview}>
            <Image source={{ uri: photo.uri }} style={styles.photoImage} />
            
            {photoBase64 && (
              <View style={styles.imageSizeInfo}>
                <Ionicons name="cloud-upload-outline" size={14} color={colors.success} />
                <Text style={styles.imageSizeText}>
                  Pronta per upload ({formatFileSize(estimateBase64Size(photoBase64))})
                </Text>
              </View>
            )}
            
            <TouchableOpacity style={styles.retakeButton} onPress={handleReset}>
              <Ionicons name="refresh" size={20} color={colors.white} />
              <Text style={styles.retakeText}>Scatta di nuovo</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.bannerContainer}>
              <BannerAd />
            </View>

            <TouchableOpacity 
              style={[
                styles.mainButton,
                !canDrink && styles.mainButtonDisabled
              ]}
              onPress={() => canDrink && setCameraOpen(true)}
              activeOpacity={0.8}
              disabled={!canDrink}
            >
              <Ionicons 
                name="camera" 
                size={64} 
                color={canDrink ? colors.white : colors.gray} 
              />
              <Text style={[
                styles.mainButtonText,
                !canDrink && styles.mainButtonTextDisabled
              ]}>
                {canDrink ? 'Scatta una foto' : 'Attendi...'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.quickAddButton}
              onPress={handleQuickAdd}
              disabled={!canDrink}
            >
              <Ionicons name="add-circle-outline" size={24} color={canDrink ? colors.primary : colors.gray} />
              <Text style={[styles.quickAddText, !canDrink && { color: colors.gray }]}>
                Aggiungi senza foto
              </Text>
            </TouchableOpacity>

            <Text style={styles.description}>
              Scatta una foto alla tua bevanda per registrarla e guadagnare punti!
            </Text>

            {/* ✅ NUOVO: Mostra stato posizione */}
            <View style={styles.infoBox}>
              <Ionicons 
                name={canDrink ? "checkmark-circle" : "time-outline"} 
                size={20} 
                color={canDrink ? colors.success : colors.warning} 
              />
              <Text style={styles.infoText}>
                {canDrink 
                  ? 'Puoi registrare una bevuta!' 
                  : `Prossima bevuta tra ${formatCooldown(localCooldown)}`
                }
              </Text>
            </View>
            
            {/* ✅ NUOVO: Indicatore posizione */}
            <View style={[styles.infoBox, { marginTop: spacing.sm }]}>
              <Ionicons 
                name={locationStatus === 'success' ? "location" : locationStatus === 'loading' ? "locate" : "location-outline"} 
                size={16} 
                color={locationStatus === 'success' ? colors.success : locationStatus === 'error' ? colors.warning : colors.gray} 
              />
              <Text style={[styles.infoText, { fontSize: 12 }]}>
                {locationStatus === 'success' && '📍 Posizione attiva'}
                {locationStatus === 'loading' && 'Ottenendo posizione...'}
                {locationStatus === 'error' && 'Posizione non disponibile'}
                {locationStatus === 'idle' && 'Posizione non richiesta'}
              </Text>
            </View>
          </>
        )}
      </View>

      <DrinkSelector
        visible={drinkSelectorVisible}
        onClose={() => {
          setDrinkSelectorVisible(false);
          setPhoto(null);
          setPhotoBase64(null);
        }}
        onSelect={handleDrinkSelect}
        drinks={drinks}
        topDrinks={topDrinks}
        isLoading={drinksLoading}
      />

      {(isSubmitting || isConverting) && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.white} />
          <Text style={styles.loadingText}>
            {isConverting ? 'Elaborazione foto...' : 
             photoBase64 ? 'Upload e registrazione...' : 'Registrazione in corso...'}
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    ...typography.h2,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  bannerContainer: {
    width: '100%',
    marginBottom: spacing.lg,
  },
  mainButton: {
    width: 180,
    height: 180,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.bevi,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    ...shadows.large,
  },
  mainButtonDisabled: {
    backgroundColor: colors.lightGray,
  },
  mainButtonText: {
    ...typography.button,
    color: colors.white,
    marginTop: spacing.sm,
  },
  mainButtonTextDisabled: {
    color: colors.gray,
  },
  quickAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    marginBottom: spacing.lg,
  },
  quickAddText: {
    ...typography.body,
    color: colors.primary,
    marginLeft: spacing.xs,
  },
  description: {
    ...typography.body,
    textAlign: 'center',
    color: colors.textSecondary,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.veryLightGray,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  infoText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  permissionTitle: {
    ...typography.h3,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  permissionText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  permissionButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  permissionButtonText: {
    ...typography.button,
    color: colors.white,
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    justifyContent: 'space-between',
  },
  cameraHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.lg,
    paddingTop: spacing.xxl,
  },
  cameraButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraFooter: {
    alignItems: 'center',
    paddingBottom: spacing.xxl,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonDisabled: {
    opacity: 0.7,
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.white,
  },
  photoPreview: {
    alignItems: 'center',
  },
  photoImage: {
    width: 250,
    height: 250,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
  },
  imageSizeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success + '15',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
  },
  imageSizeText: {
    ...typography.caption,
    color: colors.success,
    marginLeft: spacing.xs,
  },
  retakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  retakeText: {
    ...typography.bodySmall,
    color: colors.white,
    marginLeft: spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingTop: spacing.lg,
    maxHeight: '90%',
    minHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  modalTitle: {
    ...typography.h2,
  },
  closeButton: {
    padding: spacing.sm,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.veryLightGray,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    ...typography.body,
    color: colors.textPrimary,
  },
  categoriesContainer: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: spacing.md,
  },
  categoriesScroll: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  categoryTab: {
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.xs,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.veryLightGray,
    minWidth: 70,
  },
  categoryTabActive: {
    backgroundColor: colors.primary,
  },
  categoryEmoji: {
    fontSize: 20,
    marginBottom: 2,
  },
  categoryLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  categoryLabelActive: {
    color: colors.white,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    ...typography.h4,
    marginLeft: spacing.xs,
  },
  drinksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
  },
  drinkOption: {
    width: '31%',
    alignItems: 'center',
    padding: spacing.sm,
    margin: '1%',
    backgroundColor: colors.veryLightGray,
    borderRadius: borderRadius.lg,
    minHeight: 110,
    position: 'relative',
  },
  drinkOptionFavorite: {
    borderWidth: 2,
    borderColor: colors.bevi,
    backgroundColor: colors.bevi + '10',
  },
  favoriteIcon: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: colors.white,
    borderRadius: 10,
    padding: 2,
  },
  drinkEmoji: {
    fontSize: 28,
    marginBottom: spacing.xs,
  },
  drinkName: {
    ...typography.caption,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 2,
  },
  drinkBrand: {
    ...typography.caption,
    color: colors.textTertiary,
    textAlign: 'center',
    fontSize: 10,
  },
  drinkPointsBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    marginTop: spacing.xs,
  },
  drinkPoints: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '700',
    fontSize: 10,
  },
  modalLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  modalLoadingText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  emptyDrinks: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyDrinksText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
    color: colors.white,
    marginTop: spacing.md,
  },
});

export default BeviScreen;