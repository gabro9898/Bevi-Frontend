// src/navigation/MainTabs.js
// Bottom Tab Navigator con le 5 schermate principali

import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import GeneralScreen from '../screens/GeneralScreen/GeneralScreen';
import GroupsScreen from '../screens/GroupsScreen/GroupsScreen';
import BeviScreen from '../screens/BeviScreen/BeviScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen/AnalyticsScreen';
import ProfileScreen from '../screens/ProfileScreen/ProfileScreen';

import { colors, shadows } from '../theme';

const Tab = createBottomTabNavigator();

const BeviTabButton = ({ focused }) => {
  return (
    <View style={styles.beviButtonContainer}>
      <View style={[styles.beviButton, focused && styles.beviButtonFocused]}>
        <Ionicons 
          name="add" 
          size={32} 
          color={colors.white} 
        />
      </View>
    </View>
  );
};

const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.gray,
        tabBarLabelStyle: styles.tabBarLabel,
        headerShown: false,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tab.Screen
        name="Generale"
        component={GeneralScreen}
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons 
              name={focused ? 'trophy' : 'trophy-outline'} 
              size={size} 
              color={color} 
            />
          ),
        }}
      />

      <Tab.Screen
        name="Gruppi"
        component={GroupsScreen}
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons 
              name={focused ? 'people' : 'people-outline'} 
              size={size} 
              color={color} 
            />
          ),
        }}
      />

      <Tab.Screen
        name="Bevi"
        component={BeviScreen}
        options={{
          tabBarIcon: ({ focused }) => <BeviTabButton focused={focused} />,
          tabBarLabel: () => null,
        }}
      />

      <Tab.Screen
        name="Statistiche"
        component={AnalyticsScreen}
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons 
              name={focused ? 'bar-chart' : 'bar-chart-outline'} 
              size={size} 
              color={color} 
            />
          ),
        }}
      />

      <Tab.Screen
        name="Profilo"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons 
              name={focused ? 'person' : 'person-outline'} 
              size={size} 
              color={color} 
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    height: Platform.OS === 'ios' ? 88 : 60,
    paddingBottom: Platform.OS === 'ios' ? 28 : 8,
    paddingTop: 8,
    ...shadows.small,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  beviButtonContainer: {
    position: 'absolute',
    top: -20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  beviButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.bevi,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.medium,
  },
  beviButtonFocused: {
    backgroundColor: colors.beviDark,
    transform: [{ scale: 1.05 }],
  },
});

export default MainTabs;