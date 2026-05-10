import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { theme } from '../src/theme';

type Props = {
  value: number;       // current value
  max?: number;        // max value (default 100)
  size?: number;       // outer diameter
  stroke?: number;     // stroke width
  color: string;
  label?: string;
  unit?: string;
  big?: boolean;
};

export default function CircularRing({
  value,
  max = 100,
  size = 180,
  stroke = 14,
  color,
  label,
  unit,
  big,
}: Props) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(value, max));
  const progress = clamped / max;
  const dashOffset = circumference * (1 - progress);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={theme.cardElevated}
          strokeWidth={stroke}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashOffset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.center}>
        <Text style={[styles.value, big && styles.valueBig, { color }]}>
          {Number.isInteger(value) ? value : value.toFixed(1)}
        </Text>
        {unit ? <Text style={styles.unit}>{unit}</Text> : null}
        {label ? <Text style={styles.label}>{label}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  value: { color: '#fff', fontSize: 44, fontWeight: '800', letterSpacing: -1 },
  valueBig: { fontSize: 64 },
  unit: { color: theme.textSecondary, fontSize: 12, marginTop: 2, textTransform: 'uppercase', letterSpacing: 1 },
  label: { color: theme.textSecondary, fontSize: 11, marginTop: 4, textTransform: 'uppercase', letterSpacing: 1.2 },
});
