// src/screens/GeneralScreen/GeneralScreen.js
// ✅ NUOVA VERSIONE: Mappa Italia + Analytics (sostituisce classifica)


import React, { useState, useCallback, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  StatusBar,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../theme';


// Componenti
import ItalyMap from '../../components/ItalyMap';
import FiltersBar, { DRINK_CATEGORIES } from '../../components/FiltersBar';
import RegionAnalyticsPanel from '../../components/RegionAnalyticsPanel';
import NotificationsModal from '../../components/NotificationsModal';
// API
import { 
  useGetRegionStatsQuery,
  useGetUnreadNotificationCountQuery,
} from '../../api/beviApi';


/**
 * Schermata Generale con Mappa Italia
 */
const GeneralScreen = () => {
  const insets = useSafeAreaInsets();
  
  // Stati
  const [selectedCategory, setSelectedCategory] = useState('WATER'); // Default: Acqua
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [selectedRegion, setSelectedRegion] = useState(null); // { id, name, backendName }
  const [notificationsModalVisible, setNotificationsModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Query conteggio notifiche non lette
  const { data: unreadData } = useGetUnreadNotificationCountQuery(undefined, {
    pollingInterval: 30000,
  });
  const unreadCount = unreadData?.data?.unreadCount || 0;

  // Query statistiche regioni
  const { 
    data: regionStatsData, 
    isLoading: isLoadingStats,
    isFetching: isFetchingStats,
    error: statsError,
    refetch: refetchStats 
  } = useGetRegionStatsQuery({
    period: selectedPeriod,
    category: selectedCategory,
  });

  // Estrai dati per la mappa
  const mapData = useMemo(() => {
    if (!regionStatsData?.data?.regions) return [];
    return regionStatsData.data.regions;
  }, [regionStatsData]);

  // Dati della regione selezionata
  const selectedRegionData = useMemo(() => {
    if (!selectedRegion || !mapData.length) return null;
    
    const found = mapData.find(
      r => r.region?.toLowerCase() === selectedRegion.backendName?.toLowerCase()
    );
    
    return found || null;
  }, [selectedRegion, mapData]);

  // Handler cambio categoria
  const handleCategoryChange = useCallback((categoryId) => {
    setSelectedCategory(categoryId);
  }, []);

  // Handler cambio periodo
  const handlePeriodChange = useCallback((periodId) => {
    setSelectedPeriod(periodId);
  }, []);

  // Handler click regione
  const handleRegionPress = useCallback((region) => {
    // Se clicco sulla stessa regione, deseleziona
    if (selectedRegion?.id === region.id) {
      setSelectedRegion(null);
    } else {
      setSelectedRegion(region);
    }
  }, [selectedRegion]);

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetchStats();
    } catch (error) {
      console.log('Errore refresh:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refetchStats]);

  // Ottieni label categoria corrente
  const currentCategoryLabel = DRINK_CATEGORIES.find(c => c.id === selectedCategory)?.label || '';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Italia</Text>
          <Text style={styles.subtitle}>Mappa consumi {currentCategoryLabel}</Text>
        </View>
        <TouchableOpacity 
          style={styles.notificationButton}
          onPress={() => setNotificationsModalVisible(true)}
        >
          <Ionicons name="notifications-outline" size={24} color={colors.textPrimary} />
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Filtri */}
      <FiltersBar
        selectedCategory={selectedCategory}
        selectedPeriod={selectedPeriod}
        onCategoryChange={handleCategoryChange}
        onPeriodChange={handlePeriodChange}
      />

      {/* Contenuto scrollabile */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing || isFetchingStats}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Mappa */}
        {isLoadingStats && !mapData.length ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Caricamento mappa...</Text>
          </View>
        ) : statsError ? (
          <View style={styles.errorContainer}>
            <Ionicons name="cloud-offline-outline" size={48} color={colors.error} />
            <Text style={styles.errorText}>Impossibile caricare i dati</Text>
            <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
              <Text style={styles.retryButtonText}>Riprova</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ItalyMap
            data={mapData}
            selectedRegion={selectedRegion?.id}
            onRegionPress={handleRegionPress}
          />
        )}

        {/* Info selezione */}
        {selectedRegion && (
          <TouchableOpacity 
            style={styles.selectedRegionBanner}
            onPress={() => setSelectedRegion(null)}
          >
            <Ionicons name="location" size={16} color={colors.primary} />
            <Text style={styles.selectedRegionText}>
              {selectedRegion.name}
            </Text>
            <Ionicons name="close-circle" size={18} color={colors.gray} />
          </TouchableOpacity>
        )}

        {/* Panel Analytics */}
        <RegionAnalyticsPanel
          region={selectedRegion}
          data={selectedRegionData}
          isLoading={isFetchingStats && selectedRegion}
          error={statsError}
          period={selectedPeriod}
        />
      </ScrollView>

      {/* Modal Notifiche */}
      <NotificationsModal 
        visible={notificationsModalVisible}
        onClose={() => setNotificationsModalVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  notificationButton: {
    padding: spacing.sm,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: colors.error,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '700',
  },
  
  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  
  // Loading
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 80,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  
  // Error
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 80,
  },
  errorText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  retryButton: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
  },
  retryButtonText: {
    color: colors.white,
    fontWeight: '600',
  },
  
  // Selected region banner
  selectedRegionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary + '15',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  selectedRegionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    flex: 1,
  },
});

export default GeneralScreen;