// src/api/beviApi.js
// RTK Query API - Tutti gli endpoints del backend Bevi
// ✅ VERSIONE CON UPLOAD CLOUDINARY

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// URL base del backend (deve corrispondere a apiClient.js)
const BASE_URL = 'https://bevi-backend.onrender.com/api';
const TOKEN_KEY = '@bevi_auth_token';

// ==================== CONFIGURAZIONE BASE ====================

const baseQuery = fetchBaseQuery({
  baseUrl: BASE_URL,
  prepareHeaders: async (headers) => {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
    } catch (error) {
      console.log('Errore lettura token:', error);
    }
    return headers;
  },
});

// ==================== API DEFINITION ====================

export const beviApi = createApi({
  reducerPath: 'beviApi',
  baseQuery,
  
  tagTypes: [
    'User',
    'Leaderboard',
    'Drinks',
    'DrinkLogs',
    'Groups',
    'Messages',
    'Conversations',
    'Notifications',
    'Achievements',
    'Wheel',
    'Analytics',
    'Cooldown',
  ],

  // ✅ FIX: Disabilita refetch automatico globale per i messaggi
  // I messaggi arrivano via WebSocket, non serve polling
  refetchOnFocus: false,
  refetchOnReconnect: false,

  endpoints: (builder) => ({
    
    // ==================== AUTH ====================
    
    register: builder.mutation({
      query: (credentials) => ({
        url: '/auth/register',
        method: 'POST',
        body: credentials,
      }),
    }),

    login: builder.mutation({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
    }),

    getMe: builder.query({
      query: () => '/auth/me',
      providesTags: ['User'],
    }),

    logout: builder.mutation({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
      invalidatesTags: ['User'],
    }),

    forgotPassword: builder.mutation({
      query: (email) => ({
        url: '/auth/forgot-password',
        method: 'POST',
        body: { email },
      }),
    }),

    resetPassword: builder.mutation({
      query: ({ code, newPassword }) => ({
        url: '/auth/reset-password',
        method: 'POST',
        body: { code, newPassword },
      }),
    }),

    changePassword: builder.mutation({
      query: ({ currentPassword, newPassword }) => ({
        url: '/auth/change-password',
        method: 'POST',
        body: { currentPassword, newPassword },
      }),
    }),

    // ==================== USER ====================

    getMyProfile: builder.query({
      query: () => '/users/profile',
      providesTags: ['User'],
    }),

    updateMyProfile: builder.mutation({
      query: (profileData) => ({
        url: '/users/profile',
        method: 'PUT',
        body: profileData,
      }),
      invalidatesTags: ['User'],
    }),

    getMySettings: builder.query({
      query: () => '/users/settings',
      providesTags: ['User'],
    }),

    updateMySettings: builder.mutation({
      query: (settings) => ({
        url: '/users/settings',
        method: 'PUT',
        body: settings,
      }),
      invalidatesTags: ['User'],
    }),

    searchUsers: builder.query({
      query: (searchQuery) => `/users/search?q=${encodeURIComponent(searchQuery)}`,
    }),

    getUserById: builder.query({
      query: (userId) => `/users/${userId}`,
    }),

    getUserStats: builder.query({
      query: (userId) => `/users/${userId}/stats`,
    }),

    // ==================== UPLOAD IMMAGINI (CLOUDINARY) ====================
    // Usa endpoint generico: POST /api/upload con type: "profile" | "group" | "drink"

    // Upload avatar profilo
    uploadAvatar: builder.mutation({
      query: ({ userId, image }) => ({
        url: '/upload',
        method: 'POST',
        body: { 
          image, 
          type: 'profile',
          targetId: userId,
        },
      }),
      invalidatesTags: ['User'],
    }),

    // Upload immagine gruppo
    uploadGroupImage: builder.mutation({
      query: ({ groupId, image }) => ({
        url: '/upload',
        method: 'POST',
        body: { 
          image, 
          type: 'group',
          targetId: groupId,
        },
      }),
      invalidatesTags: ['Groups'],
    }),

    // Upload immagine bevuta (pre-upload separato)
    uploadDrinkImage: builder.mutation({
      query: ({ image }) => ({
        url: '/upload/drink-image',
        method: 'POST',
        body: { image },
      }),
    }),

    // Elimina immagine bevuta
    deleteDrinkImage: builder.mutation({
      query: (publicId) => ({
        url: `/upload/drink-image/${encodeURIComponent(publicId)}`,
        method: 'DELETE',
      }),
    }),

    // ==================== LEADERBOARD ====================

    getLeaderboardCategories: builder.query({
      query: () => '/leaderboard/categories',
    }),

    getGlobalLeaderboard: builder.query({
      query: () => '/leaderboard/global',
      providesTags: ['Leaderboard'],
    }),

    getDailyLeaderboard: builder.query({
      query: () => '/leaderboard/daily',
      providesTags: ['Leaderboard'],
    }),

    getWeeklyLeaderboard: builder.query({
      query: () => '/leaderboard/weekly',
      providesTags: ['Leaderboard'],
    }),

    getMonthlyLeaderboard: builder.query({
      query: () => '/leaderboard/monthly',
      providesTags: ['Leaderboard'],
    }),

    getCategoryLeaderboard: builder.query({
      query: ({ category, period = 'daily' }) => `/leaderboard/category/${category}?period=${period}`,
      providesTags: ['Leaderboard'],
    }),

    getTopDrinkers: builder.query({
      query: () => '/leaderboard/top-drinkers',
      providesTags: ['Leaderboard'],
    }),

    getStreakLeaderboard: builder.query({
      query: () => '/leaderboard/streaks',
      providesTags: ['Leaderboard'],
    }),

    // ==================== DRINKS ====================

    getAllDrinks: builder.query({
      query: () => '/drinks?limit=200',
      providesTags: ['Drinks'],
    }),

    searchDrinks: builder.query({
      query: (searchQuery) => `/drinks/search?q=${encodeURIComponent(searchQuery)}`,
      providesTags: ['Drinks'],
    }),

    getDrinkCategories: builder.query({
      query: () => '/drinks/categories',
    }),

    getPopularDrinks: builder.query({
      query: () => '/drinks/popular',
      providesTags: ['Drinks'],
    }),

    getDrinksByCategory: builder.query({
      query: (category) => `/drinks/category/${category}`,
      providesTags: ['Drinks'],
    }),

    getDrinkById: builder.query({
      query: (id) => `/drinks/${id}`,
    }),

    // ==================== DRINK LOGS ====================

    // ✅ AGGIORNATO: Ora supporta campo "image" per upload diretto
    createDrinkLog: builder.mutation({
      query: (drinkLogData) => ({
        url: '/drink-logs',
        method: 'POST',
        body: drinkLogData,
        // drinkLogData può contenere:
        // - drinkId: string (obbligatorio)
        // - image: string (base64, opzionale - verrà uploadato su Cloudinary)
        // - photoUrl + photoPublicId: se l'immagine è già stata uploadata
      }),
      invalidatesTags: ['DrinkLogs', 'Leaderboard', 'User', 'Analytics', 'Cooldown'],
    }),

    getMyDrinkLogs: builder.query({
      query: () => '/drink-logs',
      providesTags: ['DrinkLogs'],
    }),

    getTodayDrinkLogs: builder.query({
      query: () => '/drink-logs/today',
      providesTags: ['DrinkLogs'],
    }),

    getMyDrinkStats: builder.query({
      query: () => '/drink-logs/stats',
      providesTags: ['DrinkLogs'],
    }),

    getCooldownStatus: builder.query({
      query: () => '/drink-logs/cooldown',
      providesTags: ['Cooldown'],
    }),

    deleteDrinkLog: builder.mutation({
      query: (id) => ({
        url: `/drink-logs/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['DrinkLogs', 'Leaderboard', 'Analytics', 'Cooldown'],
    }),

    // ==================== GROUPS ====================

    createGroup: builder.mutation({
      query: (groupData) => ({
        url: '/groups',
        method: 'POST',
        body: groupData,
      }),
      invalidatesTags: ['Groups'],
    }),

    getMyGroups: builder.query({
      query: () => '/groups',
      providesTags: ['Groups'],
    }),

    getPublicGroups: builder.query({
      query: () => '/groups/public',
    }),

    joinGroup: builder.mutation({
      query: (inviteCode) => ({
        url: '/groups/join',
        method: 'POST',
        body: { inviteCode },
      }),
      invalidatesTags: ['Groups'],
    }),

    getGroupById: builder.query({
      query: (id) => `/groups/${id}`,
      providesTags: (result, error, id) => [{ type: 'Groups', id }],
    }),

    updateGroup: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/groups/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Groups'],
    }),

    deleteGroup: builder.mutation({
      query: (id) => ({
        url: `/groups/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Groups'],
    }),

    getGroupMembers: builder.query({
      query: (id) => `/groups/${id}/members`,
      providesTags: (result, error, id) => [{ type: 'Groups', id }],
    }),

    getGroupLeaderboard: builder.query({
      query: (id) => `/groups/${id}/leaderboard`,
      providesTags: ['Leaderboard'],
    }),

    leaveGroup: builder.mutation({
      query: (id) => ({
        url: `/groups/${id}/leave`,
        method: 'POST',
      }),
      invalidatesTags: ['Groups'],
    }),

    getGroupInviteLink: builder.query({
      query: (id) => `/groups/${id}/invite`,
    }),

    updateGroupChallengeSettings: builder.mutation({
      query: ({ groupId, challengeCategory, leaderboardMode, resetScores }) => ({
        url: `/groups/${groupId}/challenge-settings`,
        method: 'PUT',
        body: { challengeCategory, leaderboardMode, resetScores },
      }),
      invalidatesTags: (result, error, { groupId }) => [
        { type: 'Groups', id: groupId },
        { type: 'GroupLeaderboard', id: groupId },
      ],
    }),

    publishGroupLeaderboard: builder.mutation({
      query: (groupId) => ({
        url: `/groups/${groupId}/publish-leaderboard`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, groupId) => [
        { type: 'Messages', id: groupId },
        { type: 'GroupLeaderboard', id: groupId },
      ],
    }),

    // ==================== MESSAGES ====================

    getGroupMessages: builder.query({
      query: (groupId) => `/messages/group/${groupId}`,
      providesTags: (result, error, groupId) => [{ type: 'Messages', id: groupId }],
      // ✅ FIX: Disabilita refetch automatico per i messaggi
      // I nuovi messaggi arrivano via WebSocket!
      keepUnusedDataFor: 300, // Mantieni in cache per 5 minuti
    }),

    sendGroupMessage: builder.mutation({
      query: ({ groupId, message }) => ({
        url: `/messages/group/${groupId}`,
        method: 'POST',
        body: { content: message },
      }),
      // ✅ FIX CRITICO: RIMOSSO invalidatesTags!
      // Prima c'era: invalidatesTags: (result, error, { groupId }) => [{ type: 'Messages', id: groupId }],
      // Questo causava un refetch che sovrascriveva i messaggi WebSocket!
      // I messaggi arrivano via WebSocket, non serve invalidare la cache.
    }),

    deleteGroupMessage: builder.mutation({
      query: (messageId) => ({
        url: `/messages/${messageId}`,
        method: 'DELETE',
      }),
      // ✅ FIX: Anche qui rimuoviamo invalidatesTags
      // L'eliminazione viene notificata via WebSocket
    }),

    markMessagesAsRead: builder.mutation({
      query: (groupId) => ({
        url: `/messages/group/${groupId}/read`,
        method: 'PUT',
      }),
      invalidatesTags: ['Groups'],
    }),

    // ==================== CONVERSATIONS ====================

    getMyConversations: builder.query({
      query: () => '/conversations',
      providesTags: ['Conversations'],
    }),

    getTotalUnread: builder.query({
      query: () => '/conversations/unread-total',
    }),

    getConversationMessages: builder.query({
      query: (id) => `/conversations/${id}/messages`,
      providesTags: (result, error, id) => [{ type: 'Conversations', id }],
    }),

    sendConversationMessage: builder.mutation({
      query: ({ id, message }) => ({
        url: `/conversations/${id}/messages`,
        method: 'POST',
        body: { message },
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Conversations', id }],
    }),

    // ==================== NOTIFICATIONS ====================

    getMyNotifications: builder.query({
      query: () => '/notifications',
      providesTags: ['Notifications'],
    }),

    getUnreadNotificationCount: builder.query({
      query: () => '/notifications/unread-count',
      providesTags: ['Notifications'],
    }),

    markAllNotificationsAsRead: builder.mutation({
      query: () => ({
        url: '/notifications/read-all',
        method: 'PUT',
      }),
      invalidatesTags: ['Notifications'],
    }),

    // ==================== ACHIEVEMENTS ====================

    getAllAchievements: builder.query({
      query: () => '/achievements',
    }),

    getMyAchievements: builder.query({
      query: () => '/achievements/my',
      providesTags: ['Achievements'],
    }),

    getMyAchievementProgress: builder.query({
      query: () => '/achievements/progress',
      providesTags: ['Achievements'],
    }),

    // ==================== WHEEL ====================

    getWheelOptions: builder.query({
      query: (groupId) => `/wheel/group/${groupId}/options`,
      providesTags: ['Wheel'],
    }),

    spinWheel: builder.mutation({
      query: (groupId) => ({
        url: `/wheel/group/${groupId}/spin`,
        method: 'POST',
      }),
      invalidatesTags: ['Wheel'],
    }),

    getPendingChallenges: builder.query({
      query: (groupId) => `/wheel/group/${groupId}/pending`,
      providesTags: ['Wheel'],
    }),

    completeChallenge: builder.mutation({
      query: (resultId) => ({
        url: `/wheel/result/${resultId}/complete`,
        method: 'POST',
      }),
      invalidatesTags: ['Wheel'],
    }),

    // ==================== ANALYTICS ====================

    getMyAnalytics: builder.query({
      query: (period = 30) => `/analytics/my?period=${period}`,
      providesTags: ['Analytics'],
    }),

    getAnalyticsComparison: builder.query({
      query: () => '/analytics/compare',
      providesTags: ['Analytics'],
    }),

    // ==================== PUSH NOTIFICATIONS ====================

    registerPushToken: builder.mutation({
      query: (expoPushToken) => ({
        url: '/push/register',
        method: 'POST',
        body: { expoPushToken },
      }),
    }),

    unregisterPushToken: builder.mutation({
      query: () => ({
        url: '/push/unregister',
        method: 'DELETE',
      }),
    }),

    sendTestNotification: builder.mutation({
      query: () => ({
        url: '/push/test',
        method: 'POST',
      }),
    }),

  }),
});

// ==================== EXPORT HOOKS ====================

export const {
  // Auth
  useRegisterMutation,
  useLoginMutation,
  useGetMeQuery,
  useLogoutMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useChangePasswordMutation,
  
  // User
  useGetMyProfileQuery,
  useUpdateMyProfileMutation,
  useGetMySettingsQuery,
  useUpdateMySettingsMutation,
  useSearchUsersQuery,
  useGetUserByIdQuery,
  useGetUserStatsQuery,

  // Upload Immagini
  useUploadAvatarMutation,
  useUploadGroupImageMutation,
  useUploadDrinkImageMutation,
  useDeleteDrinkImageMutation,
  
  // Leaderboard
  useGetLeaderboardCategoriesQuery,
  useGetGlobalLeaderboardQuery,
  useGetDailyLeaderboardQuery,
  useGetWeeklyLeaderboardQuery,
  useGetMonthlyLeaderboardQuery,
  useGetCategoryLeaderboardQuery,
  useGetTopDrinkersQuery,
  useGetStreakLeaderboardQuery,
  
  // Drinks
  useGetAllDrinksQuery,
  useSearchDrinksQuery,
  useGetDrinkCategoriesQuery,
  useGetPopularDrinksQuery,
  useGetDrinksByCategoryQuery,
  useGetDrinkByIdQuery,
  
  // Drink Logs
  useCreateDrinkLogMutation,
  useGetMyDrinkLogsQuery,
  useGetTodayDrinkLogsQuery,
  useGetMyDrinkStatsQuery,
  useGetCooldownStatusQuery,
  useDeleteDrinkLogMutation,
  
  // Groups
  useCreateGroupMutation,
  useGetMyGroupsQuery,
  useGetPublicGroupsQuery,
  useJoinGroupMutation,
  useGetGroupByIdQuery,
  useUpdateGroupMutation,
  useDeleteGroupMutation,
  useGetGroupMembersQuery,
  useGetGroupLeaderboardQuery,
  useLeaveGroupMutation,
  useGetGroupInviteLinkQuery,
  useUpdateGroupChallengeSettingsMutation,
  usePublishGroupLeaderboardMutation,
  
  // Messages
  useGetGroupMessagesQuery,
  useSendGroupMessageMutation,
  useDeleteGroupMessageMutation,
  useMarkMessagesAsReadMutation,

  // Conversations
  useGetMyConversationsQuery,
  useGetTotalUnreadQuery,
  useGetConversationMessagesQuery,
  useSendConversationMessageMutation,
  
  // Notifications
  useGetMyNotificationsQuery,
  useGetUnreadNotificationCountQuery,
  useMarkAllNotificationsAsReadMutation,
  
  // Achievements
  useGetAllAchievementsQuery,
  useGetMyAchievementsQuery,
  useGetMyAchievementProgressQuery,
  
  // Wheel
  useGetWheelOptionsQuery,
  useSpinWheelMutation,
  useGetPendingChallengesQuery,
  useCompleteChallengeMutation,

  // Analytics
  useGetMyAnalyticsQuery,
  useGetAnalyticsComparisonQuery,

  // Push
  useRegisterPushTokenMutation,
  useUnregisterPushTokenMutation,
  useSendTestNotificationMutation,
  
} = beviApi;

// ==================== RESET CACHE FUNCTION ====================
// Chiama questa funzione al logout per pulire tutta la cache
export const resetApiCache = () => beviApi.util.resetApiState();