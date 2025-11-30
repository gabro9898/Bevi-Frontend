// src/screens/GroupsScreen/components/GroupWheel.js
// Ruota delle Sfide con animazione

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Modal,
  ActivityIndicator,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { G, Path, Text as SvgText } from 'react-native-svg';
import { colors, typography, spacing, borderRadius, shadows } from '../../../theme';
import {
  useGetWheelOptionsQuery,
  useSpinWheelMutation,
  useGetPendingChallengesQuery,
  useCompleteChallengeMutation,
} from '../../../api/beviApi';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const WHEEL_SIZE = SCREEN_WIDTH * 0.85;
const WHEEL_RADIUS = WHEEL_SIZE / 2;

// Colori per i segmenti della ruota
const SEGMENT_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
  '#BB8FCE', '#85C1E9', '#F8B500', '#FF8C00',
  '#00CED1', '#FF69B4', '#32CD32', '#FFD700',
];

const GroupWheel = ({ groupId, currentUserId }) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState(null);
  const [showPending, setShowPending] = useState(false);
  
  const spinValue = useRef(new Animated.Value(0)).current;
  const currentRotation = useRef(0);

  // API hooks
  const { data: optionsData, isLoading: optionsLoading } = useGetWheelOptionsQuery(groupId);
  const { data: pendingData, refetch: refetchPending } = useGetPendingChallengesQuery(groupId);
  const [spinWheel, { isLoading: spinLoading }] = useSpinWheelMutation();
  const [completeChallenge] = useCompleteChallengeMutation();

  // Estrai opzioni
  const standardOptions = optionsData?.data?.standardOptions || [];
  const customOptions = optionsData?.data?.customOptions || [];
  const allOptions = [...customOptions, ...standardOptions];
  
  // Limita a 16 opzioni per la visualizzazione
  const wheelOptions = allOptions.slice(0, 16);
  
  // Sfide in sospeso
  const pendingChallenges = pendingData?.data || [];

  // Gira la ruota!
  const handleSpin = async () => {
    if (isSpinning || spinLoading || wheelOptions.length === 0) return;

    setIsSpinning(true);

    try {
      // Chiama API
      const response = await spinWheel(groupId).unwrap();
      const spinResult = response.data?.result || response.result;

      if (!spinResult) {
        throw new Error('Risultato non valido');
      }

      // Trova l'indice dell'opzione vincente
      const winningIndex = wheelOptions.findIndex(
        opt => opt.id === spinResult.option?.id
      );
      
      // Calcola rotazione
      const segmentAngle = 360 / wheelOptions.length;
      const targetAngle = winningIndex >= 0 
        ? (360 - (winningIndex * segmentAngle) - segmentAngle / 2)
        : Math.random() * 360;
      
      // Giri completi + angolo finale
      const spins = 5 + Math.random() * 3; // 5-8 giri
      const finalRotation = currentRotation.current + (spins * 360) + targetAngle;

      // Animazione
      Animated.timing(spinValue, {
        toValue: finalRotation,
        duration: 4000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        currentRotation.current = finalRotation % 360;
        setIsSpinning(false);
        setResult(spinResult);
        setShowResult(true);
        refetchPending();
      });

    } catch (error) {
      console.log('Errore spin:', error);
      setIsSpinning(false);
      Alert.alert('Errore', error?.data?.message || 'Impossibile girare la ruota');
    }
  };

  // Completa sfida
  const handleComplete = async (resultId) => {
    try {
      await completeChallenge(resultId).unwrap();
      Alert.alert('Fatto! 🎉', 'Sfida completata!');
      refetchPending();
    } catch (error) {
      Alert.alert('Errore', error?.data?.message || 'Impossibile completare la sfida');
    }
  };

  // Rotazione animata
  const spin = spinValue.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  // Crea i segmenti della ruota
  const createWheelSegments = () => {
    if (wheelOptions.length === 0) return null;

    const segmentAngle = 360 / wheelOptions.length;
    const segments = [];

    wheelOptions.forEach((option, index) => {
      const startAngle = index * segmentAngle;
      const endAngle = startAngle + segmentAngle;
      const color = option.color || SEGMENT_COLORS[index % SEGMENT_COLORS.length];

      // Calcola coordinate per il path
      const startRad = (startAngle - 90) * (Math.PI / 180);
      const endRad = (endAngle - 90) * (Math.PI / 180);

      const x1 = WHEEL_RADIUS + WHEEL_RADIUS * Math.cos(startRad);
      const y1 = WHEEL_RADIUS + WHEEL_RADIUS * Math.sin(startRad);
      const x2 = WHEEL_RADIUS + WHEEL_RADIUS * Math.cos(endRad);
      const y2 = WHEEL_RADIUS + WHEEL_RADIUS * Math.sin(endRad);

      const largeArcFlag = segmentAngle > 180 ? 1 : 0;

      const pathData = `
        M ${WHEEL_RADIUS} ${WHEEL_RADIUS}
        L ${x1} ${y1}
        A ${WHEEL_RADIUS} ${WHEEL_RADIUS} 0 ${largeArcFlag} 1 ${x2} ${y2}
        Z
      `;

      // Posizione testo (centro del segmento)
      const textAngle = startAngle + segmentAngle / 2;
      const textRad = (textAngle - 90) * (Math.PI / 180);
      const textRadius = WHEEL_RADIUS * 0.65;
      const textX = WHEEL_RADIUS + textRadius * Math.cos(textRad);
      const textY = WHEEL_RADIUS + textRadius * Math.sin(textRad);

      segments.push(
        <G key={index}>
          <Path d={pathData} fill={color} stroke={colors.white} strokeWidth={2} />
          <SvgText
            x={textX}
            y={textY}
            fill={colors.white}
            fontSize={wheelOptions.length > 12 ? 18 : 24}
            fontWeight="bold"
            textAnchor="middle"
            alignmentBaseline="middle"
            transform={`rotate(${textAngle}, ${textX}, ${textY})`}
          >
            {option.icon || '🎯'}
          </SvgText>
        </G>
      );
    });

    return segments;
  };

  if (optionsLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Caricamento ruota...</Text>
      </View>
    );
  }

  if (wheelOptions.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyEmoji}>🎡</Text>
        <Text style={styles.emptyText}>Nessuna opzione</Text>
        <Text style={styles.emptySubtext}>
          La ruota non ha opzioni configurate
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header con sfide in sospeso */}
      {pendingChallenges.length > 0 && (
        <TouchableOpacity 
          style={styles.pendingBanner}
          onPress={() => setShowPending(true)}
        >
          <Ionicons name="warning" size={20} color={colors.warning} />
          <Text style={styles.pendingText}>
            {pendingChallenges.length} {pendingChallenges.length === 1 ? 'sfida' : 'sfide'} in sospeso
          </Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      )}

      {/* Ruota */}
      <View style={styles.wheelContainer}>
        {/* Indicatore */}
        <View style={styles.indicator}>
          <Ionicons name="caret-down" size={40} color={colors.primary} />
        </View>

        {/* Ruota animata */}
        <Animated.View style={[styles.wheel, { transform: [{ rotate: spin }] }]}>
          <Svg width={WHEEL_SIZE} height={WHEEL_SIZE}>
            {createWheelSegments()}
          </Svg>
        </Animated.View>

        {/* Centro ruota */}
        <View style={styles.wheelCenter}>
          <Text style={styles.wheelCenterText}>🎡</Text>
        </View>
      </View>

      {/* Pulsante Gira */}
      <TouchableOpacity
        style={[styles.spinButton, (isSpinning || spinLoading) && styles.spinButtonDisabled]}
        onPress={handleSpin}
        disabled={isSpinning || spinLoading}
        activeOpacity={0.8}
      >
        {isSpinning || spinLoading ? (
          <ActivityIndicator color={colors.white} size="small" />
        ) : (
          <>
            <Ionicons name="play" size={24} color={colors.white} />
            <Text style={styles.spinButtonText}>GIRA!</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Legenda */}
      <View style={styles.legend}>
        <Text style={styles.legendTitle}>Opzioni: {wheelOptions.length}</Text>
      </View>

      {/* Modal Risultato */}
      <Modal
        visible={showResult}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowResult(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.resultModal}>
            {result && (
              <>
                <Text style={styles.resultIcon}>
                  {result.option?.icon || '🎯'}
                </Text>
                <Text style={styles.resultTitle}>
                  {result.option?.label || 'Risultato'}
                </Text>
                {result.option?.description && (
                  <Text style={styles.resultDescription}>
                    {result.option.description}
                  </Text>
                )}
                
                {/* Target */}
                {result.target && (
                  <View style={styles.resultTarget}>
                    <Ionicons name="person" size={16} color={colors.primary} />
                    <Text style={styles.resultTargetText}>
                      Tocca a: {result.target.nickname || result.target.username}
                    </Text>
                  </View>
                )}

                {/* Punti */}
                {result.pointsChange !== 0 && (
                  <View style={[
                    styles.resultPoints,
                    result.pointsChange > 0 ? styles.resultPointsBonus : styles.resultPointsMalus
                  ]}>
                    <Text style={styles.resultPointsText}>
                      {result.pointsChange > 0 ? '+' : ''}{result.pointsChange} punti
                    </Text>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.resultButton}
                  onPress={() => setShowResult(false)}
                >
                  <Text style={styles.resultButtonText}>OK!</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Modal Sfide in Sospeso */}
      <Modal
        visible={showPending}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPending(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.pendingModal}>
            <View style={styles.pendingHeader}>
              <Text style={styles.pendingTitle}>Sfide in Sospeso</Text>
              <TouchableOpacity onPress={() => setShowPending(false)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {pendingChallenges.map((challenge) => (
              <View key={challenge.id} style={styles.pendingItem}>
                <View style={styles.pendingItemInfo}>
                  <Text style={styles.pendingItemIcon}>
                    {challenge.wheelOption?.icon || '🎯'}
                  </Text>
                  <View style={styles.pendingItemText}>
                    <Text style={styles.pendingItemLabel}>
                      {challenge.description}
                    </Text>
                    <Text style={styles.pendingItemSpinner}>
                      {challenge.spinner?.nickname || challenge.spinner?.username}
                      {challenge.targetUser && ` → ${challenge.targetUser.nickname || challenge.targetUser.username}`}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.completeButton}
                  onPress={() => handleComplete(challenge.id)}
                >
                  <Ionicons name="checkmark" size={20} color={colors.white} />
                </TouchableOpacity>
              </View>
            ))}

            {pendingChallenges.length === 0 && (
              <Text style={styles.noPendingText}>
                Nessuna sfida in sospeso! 🎉
              </Text>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    paddingTop: spacing.md,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  emptyText: {
    ...typography.h3,
    color: colors.textSecondary,
  },
  emptySubtext: {
    ...typography.body,
    color: colors.textTertiary,
    textAlign: 'center',
  },

  // Pending banner
  pendingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning + '20',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  pendingText: {
    ...typography.body,
    color: colors.textPrimary,
    flex: 1,
    marginLeft: spacing.sm,
  },

  // Wheel
  wheelContainer: {
    width: WHEEL_SIZE,
    height: WHEEL_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  wheel: {
    width: WHEEL_SIZE,
    height: WHEEL_SIZE,
  },
  indicator: {
    position: 'absolute',
    top: -15,
    zIndex: 10,
  },
  wheelCenter: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.medium,
  },
  wheelCenterText: {
    fontSize: 28,
  },

  // Spin button
  spinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.round,
    ...shadows.medium,
  },
  spinButtonDisabled: {
    backgroundColor: colors.gray,
  },
  spinButtonText: {
    ...typography.h3,
    color: colors.white,
    marginLeft: spacing.sm,
  },

  // Legend
  legend: {
    marginTop: spacing.lg,
    padding: spacing.sm,
  },
  legendTitle: {
    ...typography.caption,
    color: colors.textTertiary,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultModal: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    width: '85%',
    alignItems: 'center',
  },
  resultIcon: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  resultTitle: {
    ...typography.h2,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  resultDescription: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  resultTarget: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '15',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  resultTargetText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
  resultPoints: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  resultPointsBonus: {
    backgroundColor: colors.success + '20',
  },
  resultPointsMalus: {
    backgroundColor: colors.error + '20',
  },
  resultPointsText: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  resultButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
  },
  resultButtonText: {
    ...typography.button,
    color: colors.white,
  },

  // Pending Modal
  pendingModal: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    width: '100%',
    maxHeight: '70%',
    position: 'absolute',
    bottom: 0,
  },
  pendingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  pendingTitle: {
    ...typography.h2,
  },
  pendingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.veryLightGray,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  pendingItemInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pendingItemIcon: {
    fontSize: 32,
    marginRight: spacing.md,
  },
  pendingItemText: {
    flex: 1,
  },
  pendingItemLabel: {
    ...typography.body,
    fontWeight: '600',
  },
  pendingItemSpinner: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  completeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noPendingText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
});

export default GroupWheel;