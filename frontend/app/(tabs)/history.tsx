import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LineChart } from 'react-native-chart-kit';
import { apiGet } from '../../src/api';
import { theme } from '../../src/theme';

type DayItem = {
  date: string;
  recovery: number;
  strain: number;
  sleep_score: number;
  stress: number;
};

const RANGES = [
  { id: 7, label: '7D' },
  { id: 14, label: '14D' },
  { id: 30, label: '30D' },
];

const METRICS = [
  { id: 'recovery' as const, label: 'Recovery', color: theme.recovery },
  { id: 'sleep_score' as const, label: 'Sono', color: theme.sleep },
  { id: 'strain' as const, label: 'Strain', color: theme.strain },
  { id: 'stress' as const, label: 'Stress', color: theme.stressOrange },
];

export default function History() {
  const [days, setDays] = useState(7);
  const [metric, setMetric] = useState<typeof METRICS[number]>(METRICS[0]);
  const [items, setItems] = useState<DayItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiGet<{ items: DayItem[] }>(`/metrics/history?days=${days}`);
      setItems(res.items);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => { load(); }, [load]);

  const width = Dimensions.get('window').width - 40;
  const data = items.map((i) => Number(i[metric.id] as number));
  const labels = items.map((i, idx) => {
    if (days <= 7) {
      return new Date(i.date + 'T00:00:00').toLocaleDateString('pt-PT', { weekday: 'short' }).slice(0, 3);
    }
    return idx % Math.ceil(items.length / 6) === 0 ? new Date(i.date + 'T00:00:00').getDate().toString() : '';
  });

  const avg = data.length ? Math.round(data.reduce((a, b) => a + b, 0) / data.length) : 0;
  const max = data.length ? Math.max(...data) : 0;
  const min = data.length ? Math.min(...data) : 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Tendências</Text>
        <Text style={styles.subtitle}>Como tens evoluído ao longo do tempo</Text>

        <View style={styles.rangeRow}>
          {RANGES.map((r) => (
            <TouchableOpacity
              key={r.id}
              testID={`range-${r.id}`}
              style={[styles.rangeBtn, days === r.id && styles.rangeBtnActive]}
              onPress={() => setDays(r.id)}
            >
              <Text style={[styles.rangeText, days === r.id && { color: '#000' }]}>{r.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.metricRow}>
          {METRICS.map((mi) => (
            <TouchableOpacity
              key={mi.id}
              testID={`metric-${mi.id}`}
              style={[styles.metricChip, metric.id === mi.id && { backgroundColor: mi.color, borderColor: mi.color }]}
              onPress={() => setMetric(mi)}
            >
              <Text style={[styles.metricText, metric.id === mi.id && { color: '#000' }]}>{mi.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <ActivityIndicator color={theme.recovery} style={{ marginTop: 40 }} />
        ) : items.length > 0 ? (
          <View style={styles.chartCard}>
            <LineChart
              data={{ labels, datasets: [{ data: data.length ? data : [0], color: () => metric.color, strokeWidth: 3 }] }}
              width={width - 8}
              height={220}
              withInnerLines={false}
              withOuterLines={false}
              withDots
              withShadow={false}
              segments={4}
              fromZero={false}
              chartConfig={{
                backgroundColor: theme.card,
                backgroundGradientFrom: theme.card,
                backgroundGradientTo: theme.card,
                color: () => metric.color,
                labelColor: () => theme.textSecondary,
                propsForDots: { r: '4', strokeWidth: '2', stroke: metric.color, fill: theme.card },
                propsForBackgroundLines: { stroke: theme.border },
                decimalPlaces: metric.id === 'strain' ? 1 : 0,
              }}
              bezier
              style={{ borderRadius: 16, marginLeft: -8 }}
            />
          </View>
        ) : (
          <Text style={styles.empty}>Sem dados disponíveis</Text>
        )}

        <View style={styles.statsRow}>
          <StatBox label="Média" value={metric.id === 'strain' ? avg.toFixed(1) : String(avg)} color={metric.color} />
          <StatBox label="Máximo" value={metric.id === 'strain' ? max.toFixed(1) : String(max)} color={metric.color} />
          <StatBox label="Mínimo" value={metric.id === 'strain' ? min.toFixed(1) : String(min)} color={metric.color} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statVal, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.bg },
  scroll: { padding: 20, paddingBottom: 40 },
  title: { color: '#fff', fontSize: 28, fontWeight: '800' },
  subtitle: { color: theme.textSecondary, fontSize: 14, marginTop: 4, marginBottom: 18 },
  rangeRow: { flexDirection: 'row', backgroundColor: theme.card, padding: 4, borderRadius: 12, marginBottom: 14, borderWidth: 1, borderColor: theme.border },
  rangeBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  rangeBtnActive: { backgroundColor: '#fff' },
  rangeText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  metricRow: { flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  metricChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.card },
  metricText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  chartCard: { backgroundColor: theme.card, borderRadius: 16, padding: 12, borderWidth: 1, borderColor: theme.border },
  empty: { color: theme.textSecondary, textAlign: 'center', marginTop: 40 },
  statsRow: { flexDirection: 'row', gap: 12, marginTop: 18 },
  statBox: { flex: 1, backgroundColor: theme.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: theme.border, alignItems: 'center' },
  statLabel: { color: theme.textSecondary, fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase' },
  statVal: { color: '#fff', fontSize: 24, fontWeight: '800', marginTop: 6 },
});
