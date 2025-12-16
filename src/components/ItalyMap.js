// src/components/ItalyMap/ItalyMap.js
// Mappa interattiva dell'Italia con regioni cliccabili e heatmap

import React, { memo, useMemo } from 'react';
import { View, StyleSheet, Dimensions, Text } from 'react-native';
import Svg, { Path, G } from 'react-native-svg';
import { colors } from '../theme';
import Italy from '@svg-maps/italy';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAP_WIDTH = SCREEN_WIDTH - 32;
const MAP_HEIGHT = MAP_WIDTH * 1.25;

// Colori per la heatmap
const HEATMAP_COLORS = {
  empty: (colors.gray || '#999999') + '40',
  veryLow: '#E3F2FD',
  low: '#90CAF9',
  medium: '#42A5F5',
  high: '#1976D2',
  veryHigh: '#0D47A1',
};

const SELECTED_COLOR = colors.primary || '#FF6B35';
const SELECTED_STROKE = colors.primary || '#FF6B35';

// ✅ CORRETTO: Mapping nomi regioni (ID libreria inglese -> nome backend italiano)
const REGION_NAME_MAP = {
  'abruzzo': 'Abruzzo',
  'aosta-valley': "Valle d'Aosta",
  'apulia': 'Puglia',
  'basilicata': 'Basilicata',
  'calabria': 'Calabria',
  'campania': 'Campania',
  'emilia-romagna': 'Emilia-Romagna',
  'friuli-venezia-giulia': 'Friuli-Venezia Giulia',
  'lazzio': 'Lazio',  // Nota: la libreria ha "lazzio" con doppia z
  'liguria': 'Liguria',
  'lombardy': 'Lombardia',
  'marche': 'Marche',
  'molise': 'Molise',
  'piedmont': 'Piemonte',
  'sardinia': 'Sardegna',
  'sicily': 'Sicilia',
  'trentino-south-tyrol': 'Trentino-Alto Adige',
  'tuscany': 'Toscana',
  'umbria': 'Umbria',
  'veneto': 'Veneto',
};

const getRegionColor = (value, maxValue) => {
  if (!value || value === 0) return HEATMAP_COLORS.empty;
  if (maxValue === 0) return HEATMAP_COLORS.empty;
  
  const ratio = value / maxValue;
  
  if (ratio <= 0.2) return HEATMAP_COLORS.veryLow;
  if (ratio <= 0.4) return HEATMAP_COLORS.low;
  if (ratio <= 0.6) return HEATMAP_COLORS.medium;
  if (ratio <= 0.8) return HEATMAP_COLORS.high;
  return HEATMAP_COLORS.veryHigh;
};

const Region = memo(({ region, isSelected, value, maxValue, onPress }) => {
  const fillColor = isSelected ? SELECTED_COLOR : getRegionColor(value, maxValue);
  const strokeColor = isSelected ? SELECTED_STROKE : (colors.white || '#FFFFFF');
  const strokeWidth = isSelected ? 3 : 1.5;
  
  return (
    <Path
      d={region.path}
      fill={fillColor}
      stroke={strokeColor}
      strokeWidth={strokeWidth}
      strokeLinejoin="round"
      onPress={() => onPress(region)}
    />
  );
});

const ItalyMap = ({ 
  data = [],
  selectedRegion,
  onRegionPress,
}) => {
  
  const maxValue = useMemo(() => {
    if (!data || data.length === 0) return 0;
    return Math.max(...data.map(d => d.total || 0));
  }, [data]);
  
  // ✅ Crea mappa: nome backend (lowercase) -> valore
  const regionValues = useMemo(() => {
    const map = {};
    if (data && data.length > 0) {
      data.forEach(item => {
        const regionKey = item.region?.toLowerCase();
        if (regionKey) {
          map[regionKey] = item.total || 0;
        }
      });
    }
    return map;
  }, [data]);
  
  // ✅ Trova il valore per una regione usando il mapping corretto
  const getValueForRegion = (region) => {
    // region.id è in inglese (es. "sardinia")
    // REGION_NAME_MAP[region.id] restituisce il nome italiano (es. "Sardegna")
    const backendName = REGION_NAME_MAP[region.id];
    // Cerca nel regionValues usando il nome italiano lowercase
    const key = backendName?.toLowerCase();
    return regionValues[key] || 0;
  };
  
  const handleRegionPress = (region) => {
    if (onRegionPress) {
      onRegionPress({
        ...region,
        name: REGION_NAME_MAP[region.id] || region.name, // Nome italiano per display
        backendName: REGION_NAME_MAP[region.id] || region.name,
      });
    }
  };
  
  return (
    <View style={styles.container}>
      <Svg
        width={MAP_WIDTH}
        height={MAP_HEIGHT}
        viewBox={Italy.viewBox}
        preserveAspectRatio="xMidYMid meet"
      >
        <G>
          {Italy.locations.map((region) => (
            <Region
              key={region.id}
              region={region}
              isSelected={selectedRegion === region.id}
              value={getValueForRegion(region)}
              maxValue={maxValue}
              onPress={handleRegionPress}
            />
          ))}
        </G>
      </Svg>
      
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: HEATMAP_COLORS.empty }]} />
          <View style={[styles.legendColor, { backgroundColor: HEATMAP_COLORS.veryLow }]} />
          <View style={[styles.legendColor, { backgroundColor: HEATMAP_COLORS.low }]} />
          <View style={[styles.legendColor, { backgroundColor: HEATMAP_COLORS.medium }]} />
          <View style={[styles.legendColor, { backgroundColor: HEATMAP_COLORS.high }]} />
          <View style={[styles.legendColor, { backgroundColor: HEATMAP_COLORS.veryHigh }]} />
        </View>
        <View style={styles.legendLabels}>
          <Text style={styles.legendText}>Meno</Text>
          <Text style={styles.legendText}>Più</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  legend: {
    marginTop: 16,
    alignItems: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    borderRadius: 4,
    overflow: 'hidden',
  },
  legendColor: {
    width: 32,
    height: 12,
  },
  legendLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 32 * 6,
    marginTop: 4,
  },
  legendText: {
    fontSize: 10,
    color: colors.textSecondary || '#666666',
  },
});

export default memo(ItalyMap);