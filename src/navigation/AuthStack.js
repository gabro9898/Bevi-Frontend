// src/navigation/AuthStack.js
// Stack Navigator per le schermate di autenticazione

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from '../screens/Auth/LoginScreen';
import RegisterScreen from '../screens/Auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/Auth/ForgotPasswordScreen';

import { colors } from '../theme';

const Stack = createNativeStackNavigator();

const AuthStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen 
        name="Login" 
        component={LoginScreen} 
      />

      <Stack.Screen 
        name="Register" 
        component={RegisterScreen} 
      />

      <Stack.Screen 
        name="ForgotPassword" 
        component={ForgotPasswordScreen} 
      />
    </Stack.Navigator>
  );
};

export default AuthStack;