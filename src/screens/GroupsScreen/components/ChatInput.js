// src/screens/GroupsScreen/components/ChatInput.js
// ✅ NUOVO COMPONENTE - Input bar ottimizzata per iOS e Android
// Tastiera sempre sopra, tasto invio sempre visibile

import React, { useState, useRef, useCallback, memo } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../../theme';

const ChatInput = memo(({
  onSend,
  onTyping,
  isSending = false,
  placeholder = 'Scrivi un messaggio...',
  maxLength = 1000,
}) => {
  const [text, setText] = useState('');
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Gestione testo
  const handleTextChange = useCallback((newText) => {
    setText(newText);

    // Notifica typing
    if (onTyping) {
      if (newText.length > 0) {
        onTyping(true);
        
        // Reset timeout
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        typingTimeoutRef.current = setTimeout(() => {
          onTyping(false);
        }, 2000);
      } else {
        onTyping(false);
      }
    }
  }, [onTyping]);

  // Invio messaggio
  const handleSend = useCallback(() => {
    const trimmedText = text.trim();
    if (!trimmedText || isSending) return;

    // Invia
    onSend(trimmedText);

    // Pulisci input
    setText('');

    // Stop typing
    if (onTyping) {
      onTyping(false);
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  }, [text, isSending, onSend, onTyping]);

  const canSend = text.trim().length > 0 && !isSending;

  return (
    <View style={styles.container}>
      <View style={styles.inputRow}>
        {/* Input field */}
        <View style={styles.inputWrapper}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder={placeholder}
            placeholderTextColor={colors.textMuted}
            value={text}
            onChangeText={handleTextChange}
            multiline
            maxLength={maxLength}
            textAlignVertical="center"
            blurOnSubmit={false}
            returnKeyType="default"
          />
        </View>

        {/* Send button */}
        <TouchableOpacity
          style={[
            styles.sendButton,
            canSend ? styles.sendButtonActive : styles.sendButtonDisabled
          ]}
          onPress={handleSend}
          disabled={!canSend}
          activeOpacity={0.7}
        >
          {isSending ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Ionicons
              name="send"
              size={18}
              color={canSend ? colors.white : colors.gray}
            />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: colors.veryLightGray,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    marginRight: spacing.sm,
    minHeight: 40,
    maxHeight: 100,
    justifyContent: 'center',
  },
  input: {
    fontSize: 16,
    color: colors.textPrimary,
    lineHeight: 20,
    padding: 0,
    margin: 0,
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonActive: {
    backgroundColor: colors.primary,
  },
  sendButtonDisabled: {
    backgroundColor: colors.lightGray,
  },
});

export default ChatInput;