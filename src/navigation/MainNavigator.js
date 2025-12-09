// src/navigation/MainNavigator.js
// Stack Navigator principale che contiene i tabs e le schermate di dettaglio

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Tabs principali
import MainTabs from './MainTabs';

// Schermate di dettaglio
import GroupDetailScreen from '../screens/GroupsScreen/GroupDetailScreen';
import GroupInfoScreen from '../screens/GroupsScreen/GroupInfoScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen/AnalyticsScreen';
import EditProfileScreen from '../screens/ProfileScreen/EditProfileScreen';
import LegalScreen from '../screens/ProfileScreen/LegalScreen'; // ← NUOVO

// Push Notifications
import { usePushNotifications } from '../hooks/usePushNotifications';

const Stack = createNativeStackNavigator();

const MainNavigator = () => {
  // Inizializza le notifiche push (registra token e listener)
  usePushNotifications();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      {/* Tab principali */}
      <Stack.Screen 
        name="MainTabs" 
        component={MainTabs} 
      />

      {/* Dettaglio Gruppo */}
      <Stack.Screen 
        name="GroupDetail" 
        component={GroupDetailScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />

      {/* Info Gruppo */}
      <Stack.Screen 
        name="GroupInfo" 
        component={GroupInfoScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />

      {/* Analytics */}
      <Stack.Screen 
        name="Analytics" 
        component={AnalyticsScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />

      {/* Modifica Profilo */}
      <Stack.Screen 
        name="EditProfile" 
        component={EditProfileScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />

      {/* Privacy e Termini */}
      <Stack.Screen 
        name="Legal" 
        component={LegalScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
    </Stack.Navigator>
  );
};

export default MainNavigator;