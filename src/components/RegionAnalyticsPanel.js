// src/components/RegionAnalyticsPanel/RegionAnalyticsPanel.js
// Panel con statistiche dettagliate della regione selezionata

import React, { memo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../theme';

/**
 * Card singola statistica
 */
const StatCard = memo(({ icon, label, value, unit, color }) => (
  <View style={styles.statCard}>
    <View style={[styles.statIconContainer, { backgroundColor: color + '20' }]}>
      <Ionicons name={icon} size={20} color={color} />
    </View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
    {unit && <Text style={styles.statUnit}>{unit}</Text>}
  </View>
));

/**
 * Barra percentuale per breakdown categorie
 */
const CategoryBar = memo(({ category, percentage, count, color }) => (
  <View style={styles.categoryBarContainer}>
    <View style={styles.categoryBarHeader}>
      <Text style={styles.categoryBarLabel}>{category}</Text>
      <Text style={styles.categoryBarValue}>{count} ({percentage}%)</Text>
    </View>
    <View style={styles.categoryBarBg}>
      <View 
        style={[
          styles.categoryBarFill, 
          { width: `${percentage}%`, backgroundColor: color }
        ]} 
      />
    </View>
  </View>
));

/**
 * Componente principale RegionAnalyticsPanel
 */
const RegionAnalyticsPanel = ({
  region,          // { id, name, backendName }
  data,            // Dati dal backend { total, categories: { BEER: { count, percentage }, ... } }
  isLoading,
  error,
  period,
}) => {
  
  // Se nessuna regione selezionata
  if (!region) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Ionicons name="map-outline" size={48} color={colors.gray} />
          <Text style={styles.emptyTitle}>Seleziona una regione</Text>
          <Text style={styles.emptySubtitle}>
            Tocca una regione sulla mappa per vedere le statistiche
          </Text>
        </View>
      </View>
    );
  }
  
  // Loading state
  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.regionName}>{region.name}</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Caricamento dati...</Text>
        </View>
      </View>
    );
  }
  
  // Error state
  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.regionName}>{region.name}</Text>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
          <Text style={styles.errorText}>Errore nel caricamento</Text>
          <Text style={styles.errorSubtext}>Riprova più tardi</Text>
        </View>
      </View>
    );
  }
  
  // Nessun dato
  if (!data || data.total === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.regionName}>{region.name}</Text>
          <Text style={styles.periodLabel}>
            {period === 'today' ? 'Oggi' : period === '7d' ? 'Ultimi 7 giorni' : 'Ultimi 30 giorni'}
          </Text>
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>📊</Text>
          <Text style={styles.emptyTitle}>Nessun dato</Text>
          <Text style={styles.emptySubtitle}>
            Non ci sono registrazioni in {region.name} per questo periodo
          </Text>
        </View>
      </View>
    );
  }
  
  // Prepara i dati delle categorie
  const categories = data.categories || {};
  const categoryList = Object.entries(categories)
    .map(([key, value]) => ({
      id: key,
      label: getCategoryLabel(key),
      count: value.count || 0,
      percentage: value.percentage || 0,
      color: getCategoryColor(key),
    }))
    .filter(c => c.count > 0)
    .sort((a, b) => b.count - a.count);
  
  // Trova più e meno bevuto
  const mostDrunk = categoryList[0];
  const leastDrunk = categoryList[categoryList.length - 1];
  
  return (
    <View style={styles.container}>
      {/* Header regione */}
      <View style={styles.header}>
        <Text style={styles.regionName}>{region.name}</Text>
        <Text style={styles.periodLabel}>
          {period === 'today' ? 'Oggi' : period === '7d' ? 'Ultimi 7 giorni' : 'Ultimi 30 giorni'}
        </Text>
      </View>
      
      {/* Stats principali */}
      <View style={styles.statsRow}>
        <StatCard 
          icon="stats-chart" 
          label="Totale" 
          value={data.total} 
          unit="registrazioni"
          color={colors.primary}
        />
        <StatCard 
          icon="trending-up" 
          label="Più bevuto" 
          value={mostDrunk?.label || '-'} 
          color="#4CAF50"
        />
        <StatCard 
          icon="trending-down" 
          label="Meno bevuto" 
          value={leastDrunk?.label || '-'} 
          color="#FF9800"
        />
      </View>
      
      {/* Breakdown categorie */}
      {categoryList.length > 0 && (
        <View style={styles.breakdownContainer}>
          <Text style={styles.breakdownTitle}>Dettaglio per categoria</Text>
          {categoryList.map((cat) => (
            <CategoryBar
              key={cat.id}
              category={cat.label}
              percentage={cat.percentage}
              count={cat.count}
              color={cat.color}
            />
          ))}
        </View>
      )}
    </View>
  );
};

/**
 * Helper: Ottieni label categoria
 */
const getCategoryLabel = (category) => {
  const labels = {
    'BEER': 'Birra',
    'WINE': 'Vino',
    'SPIRITS': 'Superalcolici',
    'ENERGY_DRINK': 'Energy Drink',
    'SOFT_DRINK': 'Bibite',
    'WATER': 'Acqua',
    'OTHER': 'Altro',
  };
  return labels[category] || category;
};

/**
 * Helper: Ottieni colore categoria
 */
const getCategoryColor = (category) => {
  const categoryColors = {
    'BEER': '#FFA726',
    'WINE': '#AB47BC',
    'SPIRITS': '#EF5350',
    'ENERGY_DRINK': '#66BB6A',
    'SOFT_DRINK': '#42A5F5',
    'WATER': '#29B6F6',
    'OTHER': '#78909C',
  };
  return categoryColors[category] || colors.primary;
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    minHeight: 300,
    ...shadows.medium,
  },
  
  // Header
  header: {
    marginBottom: spacing.lg,
  },
  regionName: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  periodLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  
  // Stats row
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.sm,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  statUnit: {
    fontSize: 10,
    color: colors.textTertiary,
  },
  
  // Breakdown
  breakdownContainer: {
    marginTop: spacing.md,
  },
  breakdownTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  categoryBarContainer: {
    marginBottom: spacing.md,
  },
  categoryBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  categoryBarLabel: {
    fontSize: 13,
    color: colors.textPrimary,
  },
  categoryBarValue: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  categoryBarBg: {
    height: 8,
    backgroundColor: colors.veryLightGray || '#F0F0F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  categoryBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  
  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textTertiary,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  
  // Loading
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  
  // Error
  errorContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.error,
    marginTop: spacing.md,
  },
  errorSubtext: {
    fontSize: 13,
    color: colors.textSecondary,
  },
});

export default memo(RegionAnalyticsPanel);