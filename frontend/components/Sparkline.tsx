import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

type Props = {
  data: number[];
  color: string;
  width?: number;
  height?: number;
  /** Optional label below the value (e.g. unit). */
  unit?: string;
  /** Whether to render the value at the tip. Default true. */
  showValue?: boolean;
  /** Force value formatting. */
  formatValue?: (n: number) => string;
};

/**
 * Mini sparkline with smooth bezier curve, soft gradient fill,
 * and end-point dot + value label at the tip in the metric color.
 */
export default function Sparkline({
  data,
  color,
  width = 96,
  height = 36,
  unit,
  showValue = true,
  formatValue,
}: Props) {
  if (!data || data.length === 0) {
    return <View style={[styles.wrap, { width: width + 50, height }]} />;
  }

  const PAD_X = 2;
  const PAD_Y = 4;
  const w = width;
  const h = height;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const stepX = (w - PAD_X * 2) / Math.max(data.length - 1, 1);

  const points = data.map((v, i) => {
    const x = PAD_X + stepX * i;
    const y = PAD_Y + (h - PAD_Y * 2) * (1 - (v - min) / range);
    return { x, y };
  });

  // Smooth Catmull-Rom → cubic bezier for natural look
  const buildPath = () => {
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i - 1] || points[i];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2] || p2;
      const c1x = p1.x + (p2.x - p0.x) / 6;
      const c1y = p1.y + (p2.y - p0.y) / 6;
      const c2x = p2.x - (p3.x - p1.x) / 6;
      const c2y = p2.y - (p3.y - p1.y) / 6;
      d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
    }
    return d;
  };
  const linePath = buildPath();
  const fillPath = `${linePath} L ${points[points.length - 1].x} ${h} L ${points[0].x} ${h} Z`;

  const last = points[points.length - 1];
  const lastValue = data[data.length - 1];
  const display = formatValue ? formatValue(lastValue) : `${Math.round(lastValue)}`;

  return (
    <View style={[styles.wrap, { width: width + 50 }]}>
      <Svg width={w} height={h}>
        <Defs>
          <LinearGradient id={`g-${color}`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={color} stopOpacity="0.32" />
            <Stop offset="1" stopColor={color} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Path d={fillPath} fill={`url(#g-${color})`} />
        <Path d={linePath} stroke={color} strokeWidth={1.8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <Circle cx={last.x} cy={last.y} r={2.6} fill={color} />
        <Circle cx={last.x} cy={last.y} r={4.5} fill={color} opacity={0.25} />
      </Svg>
      {showValue && (
        <View style={styles.valWrap}>
          <Text style={[styles.valText, { color }]} numberOfLines={1}>
            {display}
          </Text>
          {!!unit && <Text style={[styles.valUnit, { color }]} numberOfLines={1}>{unit}</Text>}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  valWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 1,
  },
  valText: {
    fontSize: 13,
    fontWeight: '800',
  },
  valUnit: {
    fontSize: 9,
    fontWeight: '700',
    opacity: 0.85,
  },
});
