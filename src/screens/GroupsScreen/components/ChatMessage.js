// src/screens/GroupsScreen/components/ChatMessage.js
// ✅ VERSIONE 4.0 - Router per tipi di messaggio
// Sceglie il componente corretto in base al tipo

import React, { memo } from 'react';
import {
  TextMessage,
  SystemMessage,
  DrinkLogMessage,
  WheelResultMessage,
} from './messages';

const ChatMessage = memo(({
  message,
  isMe,
  isFirstInGroup = true,
  isLastInGroup = true,
  onLongPress,
  onPress,
}) => {
  // Router basato sul tipo di messaggio
  switch (message.type) {
    case 'SYSTEM':
    case 'LEADERBOARD':
      return <SystemMessage message={message} />;

    case 'DRINK_LOG':
      return <DrinkLogMessage message={message} />;

    case 'WHEEL_RESULT':
      return <WheelResultMessage message={message} />;

    case 'TEXT':
    default:
      return (
        <TextMessage
          message={message}
          isMe={isMe}
          isFirstInGroup={isFirstInGroup}
          isLastInGroup={isLastInGroup}
          onLongPress={onLongPress}
          onPress={onPress}
        />
      );
  }
});

export default ChatMessage;