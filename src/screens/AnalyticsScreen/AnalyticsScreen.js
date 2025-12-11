// src/screens/AnalyticsScreen/AnalyticsScreen.js
// Schermata statistiche con grafici
// ✅ FIX: SafeArea Android

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BarChart, PieChart } from 'react-native-gifted-charts';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { useGetMyAnalyticsQuery } from '../../api/beviApi';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - spacing.lg * 2 - spacing.md * 2;

// Periodi disponibili
const PERIODS = [
  { value: 7, label: '7G' },
  { value: 14, label: '14G' },
  { value: 30, label: '30G' },
  { value: 90, label: '90G' },
];

// Componente Card Statistica
const SummaryCard = ({ icon, label, value, subValue, color = colors.primary }) => (
  <View style={styles.summaryCard}>
    <View style={[styles.summaryIconContainer, { backgroundColor: color + '20' }]}>
      <Text style={styles.summaryIcon}>{icon}</Text>
    </View>
    <Text style={styles.summaryValue}>{value}</Text>
    <Text style={styles.summaryLabel}>{label}</Text>
    {subValue && <Text style={styles.summarySubValue}>{subValue}</Text>}
  </View>
);

// Componente Sezione
const Section = ({ title, subtitle, children }) => (
  <View style={styles.section}>
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
    </View>
    {children}
  </View>
);

// Componente Top Item
const TopItem = ({ rank, icon, name, count, percentage, color }) => (
  <View style={styles.topItem}>
    <View style={[styles.rankBadge, rank === 1 && styles.rankBadgeFirst]}>
      <Text style={[styles.rankText, rank === 1 && styles.rankTextFirst]}>
        {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`}
      </Text>
    </View>
    <View style={styles.topItemInfo}>
      <Text style={styles.topItemName} numberOfLines={1}>{icon} {name}</Text>
      <Text style={styles.topItemCount}>{count} bevute</Text>
    </View>
    <View style={styles.topItemRight}>
      <View style={styles.percentageBarContainer}>
        <View style={[styles.percentageBar, { width: `${Math.min(percentage, 100)}%`, backgroundColor: color || colors.primary }]} />
      </View>
      <Text style={styles.percentageText}>{percentage}%</Text>
    </View>
  </View>
);

const AnalyticsScreen = () => {
  const insets = useSafeAreaInsets();
  const [selectedPeriod, setSelectedPeriod] = useState(30);
  const [refreshing, setRefreshing] = useState(false);

  // API
  const { data: analyticsData, isLoading, refetch } = useGetMyAnalyticsQuery(selectedPeriod);

  const analytics = analyticsData?.data || analyticsData || {};

  // Pull to refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  // Prepara dati per grafico orario
  const hourlyData = (analytics.hourly?.distribution || [])
    .filter((_, i) => i >= 6 && i <= 23) // Mostra solo 6:00 - 23:00
    .map((item) => ({
      value: item.count,
      label: item.hour % 3 === 0 ? `${item.hour}` : '',
      frontColor: item.count > 0 ? colors.primary : colors.lightGray,
    }));

  // Prepara dati per grafico giornaliero
  const dailyData = (analytics.daily?.distribution || []).map((item, index) => ({
    value: item.count,
    label: item.shortLabel,
    frontColor: item.count > 0 ? colors.bevi : colors.lightGray,
  }));

  // Prepara dati per grafico categorie (PieChart)
  const categoryData = (analytics.categories || []).map((cat, index) => ({
    value: cat.count,
    color: cat.color || colors.primary,
    text: `${cat.percentage}%`,
    label: cat.label,
    icon: cat.icon,
  }));

  if (isLoading && !analyticsData) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Statistiche</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Caricamento statistiche...</Text>
        </View>
      </View>
    );
  }

  const summary = analytics.summary || {};
  const hasData = summary.totalDrinks > 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Statistiche</Text>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Selettore Periodo */}
        <View style={styles.periodSelector}>
          {PERIODS.map((period) => (
            <TouchableOpacity
              key={period.value}
              style={[
                styles.periodButton,
                selectedPeriod === period.value && styles.periodButtonActive,
              ]}
              onPress={() => setSelectedPeriod(period.value)}
            >
              <Text
                style={[
                  styles.periodButtonText,
                  selectedPeriod === period.value && styles.periodButtonTextActive,
                ]}
              >
                {period.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {!hasData ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📊</Text>
            <Text style={styles.emptyTitle}>Nessun dato</Text>
            <Text style={styles.emptySubtitle}>
              Registra le tue bevute per vedere le statistiche
            </Text>
          </View>
        ) : (
          <>
            {/* Cards Riepilogo */}
            <View style={styles.summaryContainer}>
              <SummaryCard
                icon="🍺"
                label="Bevute"
                value={summary.totalDrinks}
                color={colors.bevi}
              />
              <SummaryCard
                icon="⭐"
                label="Punti"
                value={summary.totalPoints}
                color={colors.primary}
              />
              <SummaryCard
                icon="📊"
                label="Media/giorno"
                value={summary.averageDrinksPerDay}
                color={colors.success}
              />
            </View>

            {/* Grafico Orario */}
            <Section
              title="🕐 Quando bevi di più"
              subtitle={
                analytics.hourly?.preferred
                  ? `Orario preferito: ${analytics.hourly.preferred.label}`
                  : null
              }
            >
              <View style={styles.chartContainer}>
                <BarChart
                  data={hourlyData}
                  width={CHART_WIDTH}
                  height={150}
                  barWidth={12}
                  spacing={8}
                  roundedTop
                  roundedBottom
                  hideRules
                  xAxisThickness={1}
                  yAxisThickness={0}
                  xAxisColor={colors.border}
                  yAxisTextStyle={{ color: colors.textTertiary, fontSize: 10 }}
                  xAxisLabelTextStyle={{ color: colors.textTertiary, fontSize: 10 }}
                  noOfSections={4}
                  maxValue={Math.max(...hourlyData.map((d) => d.value), 1) + 1}
                />
              </View>
            </Section>

            {/* Grafico Giornaliero */}
            <Section
              title="📅 Giorni della settimana"
              subtitle={
                analytics.daily?.preferred
                  ? `Giorno preferito: ${analytics.daily.preferred.label}`
                  : null
              }
            >
              <View style={styles.chartContainer}>
                <BarChart
                  data={dailyData}
                  width={CHART_WIDTH}
                  height={150}
                  barWidth={32}
                  spacing={16}
                  roundedTop
                  roundedBottom
                  hideRules
                  xAxisThickness={1}
                  yAxisThickness={0}
                  xAxisColor={colors.border}
                  yAxisTextStyle={{ color: colors.textTertiary, fontSize: 10 }}
                  xAxisLabelTextStyle={{ color: colors.textTertiary, fontSize: 11 }}
                  noOfSections={4}
                  maxValue={Math.max(...dailyData.map((d) => d.value), 1) + 1}
                />
              </View>
            </Section>

            {/* Grafico Categorie */}
            {categoryData.length > 0 && (
              <Section title="🍹 Categorie preferite">
                <View style={styles.pieChartContainer}>
                  <PieChart
                    data={categoryData}
                    donut
                    radius={80}
                    innerRadius={50}
                    centerLabelComponent={() => (
                      <View style={styles.pieCenter}>
                        <Text style={styles.pieCenterValue}>{summary.totalDrinks}</Text>
                        <Text style={styles.pieCenterLabel}>bevute</Text>
                      </View>
                    )}
                  />
                  <View style={styles.legendContainer}>
                    {categoryData.map((cat, index) => (
                      <View key={index} style={styles.legendItem}>
                        <View style={[styles.legendColor, { backgroundColor: cat.color }]} />
                        <Text style={styles.legendLabel}>
                          {cat.icon} {cat.label}
                        </Text>
                        <Text style={styles.legendValue}>{cat.text}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </Section>
            )}

            {/* Top Bevande */}
            {analytics.topDrinks?.length > 0 && (
              <Section title="🏆 Bevande più bevute">
                <View style={styles.topList}>
                  {analytics.topDrinks.map((item, index) => (
                    <TopItem
                      key={item.drink.id}
                      rank={item.rank}
                      icon=""
                      name={`${item.drink.brand} ${item.drink.name}`}
                      count={item.count}
                      percentage={item.percentage}
                      color={colors.primary}
                    />
                  ))}
                </View>
              </Section>
            )}

            {/* Top Brand */}
            {analytics.topBrands?.length > 0 && (
              <Section title="⭐ Brand preferiti">
                <View style={styles.topList}>
                  {analytics.topBrands.map((item, index) => (
                    <TopItem
                      key={item.brand}
                      rank={item.rank}
                      icon=""
                      name={item.brand}
                      count={item.count}
                      percentage={item.percentage}
                      color={colors.bevi}
                    />
                  ))}
                </View>
              </Section>
            )}

            {/* Volume totale */}
            <View style={styles.totalVolumeCard}>
              <Text style={styles.totalVolumeIcon}>🧊</Text>
              <Text style={styles.totalVolumeLabel}>Volume totale</Text>
              <Text style={styles.totalVolumeValue}>{summary.totalVolumeLiters} L</Text>
            </View>
          </>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },

  // Header (semplificato per tab)
  header: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.white,
  },
  headerTitle: {
    ...typography.h3,
  },

  // Period Selector
  periodSelector: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.sm,
  },
  periodButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.veryLightGray,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: colors.primary,
  },
  periodButtonText: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  periodButtonTextActive: {
    color: colors.white,
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    ...typography.h3,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  // Summary Cards
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  summaryCard: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    flex: 1,
    marginHorizontal: spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  summaryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  summaryIcon: {
    fontSize: 20,
  },
  summaryValue: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  summaryLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  summarySubValue: {
    ...typography.caption,
    color: colors.textTertiary,
  },

  // Sections
  section: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  sectionHeader: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h4,
  },
  sectionSubtitle: {
    ...typography.bodySmall,
    color: colors.primary,
    marginTop: spacing.xs,
  },

  // Charts
  chartContainer: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },

  // Pie Chart
  pieChartContainer: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  pieCenter: {
    alignItems: 'center',
  },
  pieCenterValue: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  pieCenterLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  legendContainer: {
    flex: 1,
    marginLeft: spacing.lg,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing.sm,
  },
  legendLabel: {
    ...typography.bodySmall,
    flex: 1,
  },
  legendValue: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.textSecondary,
  },

  // Top List
  topList: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  topItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.veryLightGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  rankBadgeFirst: {
    backgroundColor: colors.warning + '20',
  },
  rankText: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  rankTextFirst: {
    fontSize: 16,
  },
  topItemInfo: {
    flex: 1,
  },
  topItemName: {
    ...typography.body,
    fontWeight: '500',
  },
  topItemCount: {
    ...typography.caption,
    color: colors.textTertiary,
  },
  topItemRight: {
    alignItems: 'flex-end',
    width: 80,
  },
  percentageBarContainer: {
    width: 60,
    height: 6,
    backgroundColor: colors.veryLightGray,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  percentageBar: {
    height: '100%',
    borderRadius: 3,
  },
  percentageText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },

  // Total Volume Card
  totalVolumeCard: {
    alignItems: 'center',
    backgroundColor: colors.primary + '10',
    marginHorizontal: spacing.md,
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  totalVolumeIcon: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  totalVolumeLabel: {
    ...typography.body,
    color: colors.textSecondary,
  },
  totalVolumeValue: {
    ...typography.h1,
    color: colors.primary,
  },

  bottomSpacer: {
    height: spacing.xxl,
  },
});

export default AnalyticsScreen;