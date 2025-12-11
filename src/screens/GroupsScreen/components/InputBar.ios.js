// src/screens/GroupsScreen/components/InputBar.ios.js
// ✅ iOS - Reanimated useAnimatedKeyboard (ultra fluido, no rimbalzo)

import React, { useRef, useCallback } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useAnimatedKeyboard,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { colors, typography, spacing } from '../../../theme';

// ==================== DEBUG ====================
const DEBUG = false; // Disabilitato per performance
const log = (tag, data) => {
  if (DEBUG) {
    console.log(`🍎 [iOS-${tag}]`, typeof data === 'object' ? JSON.stringify(data) : data);
  }
};

const InputBar = ({
  value,
  onChangeText,
  onSend,
  isSending,
  onFocus,
  onBlur,
}) => {
  const insets = useSafeAreaInsets();
  const inputRef = useRef(null);
  const bottomInset = insets.bottom || 0;

  // ✅ Reanimated keyboard - sincronizzato 1:1 con la tastiera
  const keyboard = useAnimatedKeyboard();

  // ✅ Animated style con interpolazione smooth
  const animatedStyle = useAnimatedStyle(() => {
    // Interpolazione: quando keyboard.height è sotto bottomInset, translateY = 0
    // Quando keyboard.height è sopra bottomInset, translateY = -(height - bottomInset)
    const translateY = interpolate(
      keyboard.height.value,
      [0, bottomInset, bottomInset + 1, 500],
      [0, 0, -1, -(500 - bottomInset)],
      Extrapolation.CLAMP
    );
    
    return {
      transform: [{ translateY }],
    };
  });

  const handleFocus = useCallback(() => {
    log('INPUT-FOCUS', { bottomInset });
    onFocus?.();
  }, [onFocus, bottomInset]);

  const handleBlur = useCallback(() => {
    log('INPUT-BLUR', {});
    onBlur?.();
  }, [onBlur]);

  const handleSend = useCallback(() => {
    if (!value?.trim() || isSending) return;
    log('SEND', `Invio: "${value.trim()}"`);
    onSend();
  }, [value, isSending, onSend]);

  const canSend = value?.trim() && !isSending;

  return (
    <Animated.View style={[styles.animatedContainer, animatedStyle]}>
      <View style={[styles.container, { paddingBottom: bottomInset }]}>
        <View style={styles.inputRow}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="Scrivi un messaggio..."
            placeholderTextColor={colors.textMuted}
            value={value}
            onChangeText={onChangeText}
            onFocus={handleFocus}
            onBlur={handleBlur}
            multiline
            maxLength={1000}
            returnKeyType="send"
            blurOnSubmit={false}
            onSubmitEditing={handleSend}
            enablesReturnKeyAutomatically={true}
          />
          <TouchableOpacity
            style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!canSend}
            activeOpacity={0.7}
          >
            {isSending ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Ionicons name="send" size={18} color={colors.white} />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  animatedContainer: {
    // Posizione in basso
  },
  container: {
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  input: {
    flex: 1,
    minHeight: 36,
    maxHeight: 100,
    backgroundColor: colors.veryLightGray,
    borderRadius: 18,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
    ...typography.body,
    color: colors.textPrimary,
    fontSize: 15,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  sendButtonDisabled: {
    backgroundColor: colors.lightGray,
  },
});

export default InputBar;