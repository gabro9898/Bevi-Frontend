// src/components/FiltersBar/FiltersBar.js
// Barra filtri per categoria e periodo

import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../theme';

// Categorie bevande (senza "Tutti" come richiesto da Apple)
const DRINK_CATEGORIES = [
  { id: 'WATER', label: 'Acqua', emoji: '💧' },
  { id: 'SOFT_DRINK', label: 'Bibite', emoji: '🥤' },
  { id: 'ENERGY_DRINK', label: 'Energy', emoji: '⚡' },
  { id: 'BEER', label: 'Birra', emoji: '🍺' },
  { id: 'WINE', label: 'Vino', emoji: '🍷' },
  { id: 'SPIRITS', label: 'Spirits', emoji: '🥃' },
];

// Filtri temporali
const TIME_FILTERS = [
  { id: 'today', label: 'Oggi', icon: 'today-outline', apiValue: 'today' },
  { id: '7d', label: 'Settimana', icon: 'calendar-outline', apiValue: '7d' },
  { id: '30d', label: 'Mese', icon: 'calendar', apiValue: '30d' },
];

/**
 * Tab singola categoria
 */
const CategoryTab = memo(({ category, isActive, onPress }) => (
  <TouchableOpacity 
    style={[styles.categoryTab, isActive && styles.categoryTabActive]}
    onPress={() => onPress(category.id)}
    activeOpacity={0.7}
  >
    <Text style={styles.categoryEmoji}>{category.emoji}</Text>
    <Text style={[styles.categoryLabel, isActive && styles.categoryLabelActive]}>
      {category.label}
    </Text>
  </TouchableOpacity>
));

/**
 * Tab singolo filtro temporale
 */
const TimeFilterTab = memo(({ filter, isActive, onPress }) => (
  <TouchableOpacity 
    style={[styles.timeFilter, isActive && styles.timeFilterActive]}
    onPress={() => onPress(filter.id)}
    activeOpacity={0.7}
  >
    <Ionicons 
      name={filter.icon} 
      size={16} 
      color={isActive ? colors.white : colors.gray} 
    />
    <Text style={[styles.timeFilterLabel, isActive && styles.timeFilterLabelActive]}>
      {filter.label}
    </Text>
  </TouchableOpacity>
));

/**
 * Componente FiltersBar
 */
const FiltersBar = ({
  selectedCategory,
  selectedPeriod,
  onCategoryChange,
  onPeriodChange,
}) => {
  return (
    <View style={styles.container}>
      {/* Categorie bevande */}
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
              isActive={selectedCategory === category.id}
              onPress={onCategoryChange}
            />
          ))}
        </ScrollView>
      </View>

      {/* Filtri temporali */}
      <View style={styles.timeFiltersContainer}>
        {TIME_FILTERS.map((filter) => (
          <TimeFilterTab
            key={filter.id}
            filter={filter}
            isActive={selectedPeriod === filter.id}
            onPress={onPeriodChange}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
  },
  
  // Categorie
  categoriesContainer: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  categoriesScroll: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  categoryTab: {
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.xs,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.veryLightGray || '#F5F5F5',
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
    fontSize: 11,
    color: colors.textSecondary,
  },
  categoryLabelActive: {
    color: colors.white,
    fontWeight: '600',
  },
  
  // Filtri temporali
  timeFiltersContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  timeFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.veryLightGray || '#F5F5F5',
  },
  timeFilterActive: {
    backgroundColor: colors.primary,
  },
  timeFilterLabel: {
    fontSize: 13,
    color: colors.gray,
    marginLeft: spacing.xs,
  },
  timeFilterLabelActive: {
    color: colors.white,
    fontWeight: '600',
  },
});

export default memo(FiltersBar);
export { DRINK_CATEGORIES, TIME_FILTERS };