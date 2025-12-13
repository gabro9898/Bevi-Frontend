// src/screens/GeneralScreen/GeneralScreen.js
// Schermata principale con classifiche
// ✅ FIX: Loading infinito risolto + rotellina che non si blocca

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  StatusBar,
  ScrollView,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../../theme';
import { 
  useGetDailyLeaderboardQuery,
  useGetWeeklyLeaderboardQuery,
  useGetMonthlyLeaderboardQuery,
  useGetCategoryLeaderboardQuery,
  useGetUnreadNotificationCountQuery,
} from '../../api/beviApi';
import NotificationsModal from '../../components/NotificationsModal';

// Categorie per il filtro temporale
const TIME_FILTERS = [
  { id: 'daily', label: 'Oggi', icon: 'today-outline' },
  { id: 'weekly', label: 'Settimana', icon: 'calendar-outline' },
  { id: 'monthly', label: 'Mese', icon: 'calendar' },
];

// Categorie bevande (mappate alle categorie del backend)
const DRINK_CATEGORIES = [
  { id: 'all', label: 'Tutti', emoji: '🍹', backendCategory: null },
  { id: 'alcohol', label: 'Alcol', emoji: '🍺', backendCategory: 'ALCOHOL' },
  { id: 'energy', label: 'Energy', emoji: '⚡', backendCategory: 'ENERGY_DRINK' },
  { id: 'soft', label: 'Bibite', emoji: '🥤', backendCategory: 'SOFT_DRINK' },
  { id: 'water', label: 'Acqua', emoji: '💧', backendCategory: 'WATER' },
];

// Componente per la singola categoria
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

// Componente per il filtro temporale
const TimeFilter = ({ filter, isActive, onPress }) => (
  <TouchableOpacity 
    style={[styles.timeFilter, isActive && styles.timeFilterActive]}
    onPress={onPress}
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
);

// Componente per il singolo utente in classifica
const LeaderboardItem = ({ item, index, showSeparator }) => {
  const isTopThree = (item.rank || index + 1) <= 3;
  const medals = ['🥇', '🥈', '🥉'];
  
  const user = item.user || {};
  const score = item.score || 0;
  const rank = item.rank || index + 1;
  
  return (
    <>
      {showSeparator && (
        <View style={styles.separatorContainer}>
          <View style={styles.separatorLine} />
          <Text style={styles.separatorText}>• • •</Text>
          <View style={styles.separatorLine} />
        </View>
      )}
      <View style={[
        styles.leaderboardItem, 
        isTopThree && styles.leaderboardItemTop,
        item.isMe && styles.leaderboardItemMe
      ]}>
        <View style={styles.positionContainer}>
          {isTopThree ? (
            <Text style={styles.medal}>{medals[rank - 1]}</Text>
          ) : (
            <Text style={styles.position}>{rank}</Text>
          )}
        </View>
        
        <View style={[styles.avatar, isTopThree && styles.avatarTop]}>
          {user.profilePhoto ? (
            <Image source={{ uri: user.profilePhoto }} style={styles.avatarImage} />
          ) : (
            <Ionicons name="person" size={24} color={colors.gray} />
          )}
        </View>
        
        <View style={styles.userInfo}>
          <View style={styles.usernameRow}>
            <Text style={styles.username}>{user.nickname || user.username || 'Utente'}</Text>
            {item.isMe && <Text style={styles.youBadge}>Tu</Text>}
          </View>
          <Text style={styles.drinks}>@{user.username} • Liv. {user.level || 1}</Text>
        </View>
        
        <View style={styles.scoreContainer}>
          <Text style={[styles.score, isTopThree && styles.scoreTop]}>
            {score}
          </Text>
          <Text style={styles.scoreLabel}>punti</Text>
        </View>
      </View>
    </>
  );
};

// Componente principale
const GeneralScreen = () => {
  const insets = useSafeAreaInsets();
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeTimeFilter, setActiveTimeFilter] = useState('daily');
  const [notificationsModalVisible, setNotificationsModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // ✅ FIX: Traccia se abbiamo già fatto il primo caricamento
  const hasLoadedOnce = useRef(false);

  // Query conteggio notifiche non lette
  const { data: unreadData } = useGetUnreadNotificationCountQuery(undefined, {
    pollingInterval: 30000,
  });
  const unreadCount = unreadData?.data?.unreadCount || 0;

  // Trova la categoria backend corrispondente
  const selectedCategory = DRINK_CATEGORIES.find(c => c.id === activeCategory);
  const backendCategory = selectedCategory?.backendCategory;

  // Query per le classifiche globali
  const { 
    data: dailyData, 
    isLoading: dailyLoading,
    isFetching: dailyFetching,
    refetch: refetchDaily 
  } = useGetDailyLeaderboardQuery(undefined, {
    skip: activeCategory !== 'all' || activeTimeFilter !== 'daily'
  });
  
  const { 
    data: weeklyData, 
    isLoading: weeklyLoading,
    isFetching: weeklyFetching,
    refetch: refetchWeekly 
  } = useGetWeeklyLeaderboardQuery(undefined, {
    skip: activeCategory !== 'all' || activeTimeFilter !== 'weekly'
  });
  
  const { 
    data: monthlyData, 
    isLoading: monthlyLoading,
    isFetching: monthlyFetching,
    refetch: refetchMonthly 
  } = useGetMonthlyLeaderboardQuery(undefined, {
    skip: activeCategory !== 'all' || activeTimeFilter !== 'monthly'
  });

  // Query per classifica per categoria
  const {
    data: categoryData,
    isLoading: categoryLoading,
    isFetching: categoryFetching,
    refetch: refetchCategory
  } = useGetCategoryLeaderboardQuery(
    { category: backendCategory, period: activeTimeFilter },
    { skip: !backendCategory }
  );

  // Seleziona i dati in base ai filtri attivi
  const getCurrentData = () => {
    if (backendCategory) {
      return {
        leaderboard: categoryData?.data?.leaderboard || [],
        myPosition: categoryData?.data?.myPosition
      };
    }
    
    let rawData;
    switch (activeTimeFilter) {
      case 'daily':
        rawData = dailyData;
        break;
      case 'weekly':
        rawData = weeklyData;
        break;
      case 'monthly':
        rawData = monthlyData;
        break;
      default:
        rawData = dailyData;
    }
    
    return {
      leaderboard: rawData?.data?.leaderboard || [],
      myPosition: rawData?.data?.myPosition
    };
  };

  // ✅ FIX: isLoading = primo caricamento, isFetching = include refetch
  const getLoadingState = () => {
    if (backendCategory) {
      return { isLoading: categoryLoading, isFetching: categoryFetching };
    }
    
    switch (activeTimeFilter) {
      case 'daily': 
        return { isLoading: dailyLoading, isFetching: dailyFetching };
      case 'weekly': 
        return { isLoading: weeklyLoading, isFetching: weeklyFetching };
      case 'monthly': 
        return { isLoading: monthlyLoading, isFetching: monthlyFetching };
      default: 
        return { isLoading: false, isFetching: false };
    }
  };

  const { isLoading, isFetching } = getLoadingState();
  const { leaderboard, myPosition } = getCurrentData();

  // ✅ FIX: Marca come caricato quando abbiamo dati
  useEffect(() => {
    if (leaderboard.length > 0) {
      hasLoadedOnce.current = true;
    }
  }, [leaderboard.length]);

  // ✅ FIX: Mostra loader SOLO al primissimo caricamento in assoluto
  // Dopo il primo caricamento, mai più mostrare il loader a schermo intero
  const showLoading = isLoading && !hasLoadedOnce.current && leaderboard.length === 0;

  // Prepara i dati da mostrare
  const getDisplayData = () => {
    const top7 = leaderboard.slice(0, 7);
    const amInTop7 = top7.some(item => item.isMe);
    
    if (amInTop7 || !myPosition) {
      return { displayList: top7, showMyPosition: false };
    }
    
    const myEntry = leaderboard.find(item => item.isMe);
    
    if (myEntry) {
      return { displayList: top7, showMyPosition: true, myEntry };
    }
    
    if (myPosition && myPosition.rank > 7) {
      return { 
        displayList: top7, 
        showMyPosition: true, 
        myEntry: {
          rank: myPosition.rank,
          score: myPosition.score,
          isMe: true,
          user: null
        }
      };
    }
    
    return { displayList: top7, showMyPosition: false };
  };

  const { displayList, showMyPosition, myEntry } = getDisplayData();

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (backendCategory) {
        await refetchCategory();
      } else {
        switch (activeTimeFilter) {
          case 'daily':
            await refetchDaily();
            break;
          case 'weekly':
            await refetchWeekly();
            break;
          case 'monthly':
            await refetchMonthly();
            break;
        }
      }
    } catch (error) {
      console.log('Errore refresh classifica:', error);
    } finally {
      setRefreshing(false);
    }
  }, [backendCategory, activeTimeFilter, refetchCategory, refetchDaily, refetchWeekly, refetchMonthly]);

  // Prepara i dati per la FlatList
  const listData = showMyPosition && myEntry 
    ? [...displayList, { ...myEntry, showSeparator: true }]
    : displayList;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Classifica</Text>
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
              isActive={activeCategory === category.id}
              onPress={() => setActiveCategory(category.id)}
            />
          ))}
        </ScrollView>
      </View>

      {/* Filtri temporali */}
      <View style={styles.timeFiltersContainer}>
        {TIME_FILTERS.map((filter) => (
          <TimeFilter
            key={filter.id}
            filter={filter}
            isActive={activeTimeFilter === filter.id}
            onPress={() => setActiveTimeFilter(filter.id)}
          />
        ))}
      </View>

      {/* Classifica */}
      {showLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Caricamento classifica...</Text>
        </View>
      ) : (
        <FlatList
          data={listData}
          keyExtractor={(item, index) => item.user?.id?.toString() || `pos-${item.rank || index}`}
          renderItem={({ item, index }) => (
            <LeaderboardItem 
              item={item} 
              index={index} 
              showSeparator={item.showSeparator}
            />
          )}
          contentContainerStyle={[
            styles.leaderboardList,
            listData.length === 0 && styles.emptyListContent
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing || (isFetching && !isLoading)}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>🏆</Text>
              <Text style={styles.emptyText}>Nessun dato disponibile</Text>
              <Text style={styles.emptySubtext}>
                {backendCategory 
                  ? `Nessuno ha ancora bevuto ${selectedCategory?.label.toLowerCase()} in questo periodo!`
                  : 'Inizia a registrare bevute per vedere la classifica!'
                }
              </Text>
            </View>
          }
        />
      )}

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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  title: {
    ...typography.h1,
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
    backgroundColor: colors.veryLightGray,
  },
  categoryTabActive: {
    backgroundColor: colors.primary,
  },
  categoryEmoji: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  categoryLabel: {
    ...typography.caption,
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
    borderRadius: borderRadius.round,
    backgroundColor: colors.veryLightGray,
  },
  timeFilterActive: {
    backgroundColor: colors.primary,
  },
  timeFilterLabel: {
    ...typography.bodySmall,
    color: colors.gray,
    marginLeft: spacing.xs,
  },
  timeFilterLabelActive: {
    color: colors.white,
    fontWeight: '600',
  },
  
  // Loading
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
  
  // Classifica
  leaderboardList: {
    padding: spacing.md,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: borderRadius.lg,
    ...shadows.small,
  },
  leaderboardItemTop: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.bevi,
  },
  leaderboardItemMe: {
    backgroundColor: colors.bevi + '15',
    borderColor: colors.bevi,
    borderWidth: 2,
  },
  positionContainer: {
    width: 32,
    alignItems: 'center',
  },
  position: {
    ...typography.body,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  medal: {
    fontSize: 24,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.veryLightGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: spacing.md,
  },
  avatarTop: {
    borderWidth: 2,
    borderColor: colors.bevi,
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  userInfo: {
    flex: 1,
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  username: {
    ...typography.body,
    fontWeight: '600',
  },
  youBadge: {
    ...typography.caption,
    color: colors.white,
    backgroundColor: colors.bevi,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    marginLeft: spacing.sm,
    fontWeight: '600',
    overflow: 'hidden',
  },
  drinks: {
    ...typography.caption,
    color: colors.textTertiary,
  },
  scoreContainer: {
    alignItems: 'flex-end',
  },
  score: {
    ...typography.number,
    color: colors.textPrimary,
  },
  scoreTop: {
    color: colors.primary,
  },
  scoreLabel: {
    ...typography.caption,
    color: colors.textTertiary,
  },

  // Separatore
  separatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  separatorText: {
    ...typography.caption,
    color: colors.textTertiary,
    marginHorizontal: spacing.md,
  },
  
  // Empty state
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  emptyText: {
    ...typography.h3,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  emptySubtext: {
    ...typography.body,
    color: colors.textTertiary,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
});

export default GeneralScreen;