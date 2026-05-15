import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { theme } from '../src/theme';

type Props = {
  value: number;
  max?: number;
  size?: number;
  stroke?: number;
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

  // Glow effect: slightly wider transparent ring behind the colored one
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        {/* Track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={theme.cardElevated}
          strokeWidth={stroke}
          fill="none"
        />
        {/* Glow layer */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={stroke + 4}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashOffset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          opacity={0.18}
        />
        {/* Main ring */}
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
        {unit ? <Text style={[styles.unit, { color }]}>{unit}</Text> : null}
        {label ? <Text style={styles.label}>{label}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  value: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  valueBig: { fontSize: 48 },
  unit: { fontSize: 10, marginTop: 1, textTransform: 'uppercase', letterSpacing: 1, opacity: 0.8 },
  label: { color: theme.textSecondary, fontSize: 10, marginTop: 3, textTransform: 'uppercase', letterSpacing: 1.2 },
});
