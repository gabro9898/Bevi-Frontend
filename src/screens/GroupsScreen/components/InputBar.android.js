// src/screens/GroupsScreen/components/InputBar.android.js
// ✅ Android - Con debug e supporto tutti i dispositivi

import React, { useRef, useCallback, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, spacing } from '../../../theme';

// ==================== DEBUG ====================
const DEBUG = true;
const log = (tag, data) => {
  if (DEBUG) {
    console.log(`🤖 [Android-${tag}]`, typeof data === 'object' ? JSON.stringify(data) : data);
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
  
  const { height: screenHeight, width: screenWidth } = Dimensions.get('window');

  // ============ DEBUG: Log device info ============
  useEffect(() => {
    log('INIT', {
      screenHeight,
      screenWidth,
      bottomInset,
      topInset: insets.top,
      leftInset: insets.left,
      rightInset: insets.right,
    });

    const keyboardDidShow = Keyboard.addListener('keyboardDidShow', (e) => {
      log('KEYBOARD-SHOW', {
        keyboardHeight: e.endCoordinates.height,
      });
    });

    const keyboardDidHide = Keyboard.addListener('keyboardDidHide', () => {
      log('KEYBOARD-HIDE', {});
    });

    return () => {
      keyboardDidShow.remove();
      keyboardDidHide.remove();
    };
  }, [screenHeight, screenWidth, bottomInset, insets.top]);

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

  log('RENDER', { bottomInset });

  return (
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
  );
};

const styles = StyleSheet.create({
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
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: colors.veryLightGray,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingTop: 10,
    paddingBottom: 10,
    marginRight: spacing.sm,
    ...typography.body,
    color: colors.textPrimary,
    fontSize: 15,
    textAlignVertical: 'center',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.lightGray,
  },
});

export default InputBar;