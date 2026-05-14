import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LineChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { apiGet } from '../../src/api';
import { useAuth } from '../../src/auth';
import { theme } from '../../src/theme';
import { t, formatDistance, distanceUnit } from '../../src/i18n';

type DayMetric = { date: string; recovery: number; strain: number; sleep_score: number; stress: number };
type DayActivity = { date: string; steps: number; km: number };

const RANGES = [
  { id: 7, label: '7D' },
  { id: 14, label: '14D' },
  { id: 30, label: '30D' },
];

export default function History() {
  const { prefs } = useAuth();
  const [days, setDays] = useState(7);
  const [metric, setMetric] = useState<'recovery' | 'sleep_score' | 'strain' | 'stress' | 'steps' | 'km'>('recovery');
  const [items, setItems] = useState<DayMetric[]>([]);
  const [activity, setActivity] = useState<DayActivity[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [mh, ah] = await Promise.all([
        apiGet<{ items: DayMetric[] }>(`/metrics/history?days=${days}`),
        apiGet<{ items: DayActivity[] }>(`/activity/history?days=${days}`).catch(() => ({ items: [] })),
      ]);
      setItems(mh.items);
      setActivity(ah.items);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => { load(); }, [load]);

  const width = Dimensions.get('window').width - 40;

  const METRICS = [
    { id: 'recovery' as const, label: t('home.recovery'), color: theme.recovery, source: 'm' as const },
    { id: 'sleep_score' as const, label: t('home.sleep'), color: theme.sleep, source: 'm' as const },
    { id: 'strain' as const, label: t('home.strain'), color: theme.strain, source: 'm' as const },
    { id: 'stress' as const, label: t('home.stressEnergy').split(' ')[0], color: theme.stressOrange, source: 'm' as const },
    { id: 'steps' as const, label: t('home.steps'), color: theme.primary, source: 'a' as const },
    { id: 'km' as const, label: t('trends.kmInsight'), color: theme.battery, source: 'a' as const },
  ];

  const current = METRICS.find((mi) => mi.id === metric) || METRICS[0];
  const data: number[] = current.source === 'm'
    ? items.map((i) => Number(i[metric as keyof DayMetric] as number))
    : activity.map((i) => Number(i[metric === 'km' ? 'km' : 'steps']));

  const labels: string[] = (current.source === 'm' ? items : activity).map((i, idx) => {
    if (days <= 7) {
      return new Date(i.date + 'T00:00:00').toLocaleDateString('pt-PT', { weekday: 'short' }).slice(0, 3);
    }
    return idx % Math.ceil((current.source === 'm' ? items : activity).length / 6) === 0
      ? new Date(i.date + 'T00:00:00').getDate().toString()
      : '';
  });

  // Insights — compare last half vs first half
  const half = Math.floor(data.length / 2);
  const firstAvg = half > 0 ? data.slice(0, half).reduce((a, b) => a + b, 0) / half : 0;
  const secondAvg = half > 0 ? data.slice(half).reduce((a, b) => a + b, 0) / (data.length - half) : 0;
  const diff = secondAvg - firstAvg;
  const trendKey = Math.abs(diff) < (metric === 'strain' ? 0.5 : metric === 'steps' ? 500 : 3)
    ? 'stable' : diff > 0 ? 'improving' : 'declining';

  const avg = data.length ? Math.round(data.reduce((a, b) => a + b, 0) / data.length * 10) / 10 : 0;
  const max = data.length ? Math.max(...data) : 0;
  const min = data.length ? Math.min(...data) : 0;

  // Pre-build insights list for ALL parameters
  const insights = METRICS.map((mi) => {
    const arr = mi.source === 'm'
      ? items.map((i) => Number(i[mi.id as keyof DayMetric] as number))
      : activity.map((i) => Number(i[mi.id === 'km' ? 'km' : 'steps']));
    if (!arr.length) return { ...mi, trend: 'stable' as const, diff: 0, sum: 0, avg: 0 };
    const h = Math.floor(arr.length / 2);
    const fa = h > 0 ? arr.slice(0, h).reduce((a, b) => a + b, 0) / h : 0;
    const sa = h > 0 ? arr.slice(h).reduce((a, b) => a + b, 0) / (arr.length - h) : 0;
    const d = sa - fa;
    const threshold = mi.id === 'strain' ? 0.5 : mi.id === 'steps' ? 500 : mi.id === 'km' ? 0.5 : 3;
    const tr: 'stable' | 'improving' | 'declining' = Math.abs(d) < threshold ? 'stable' : d > 0 ? 'improving' : 'declining';
    const sum = arr.reduce((a, b) => a + b, 0);
    const avgVal = arr.reduce((a, b) => a + b, 0) / arr.length;
    return { ...mi, trend: tr, diff: Math.round(Math.abs(d) * 10) / 10, sum, avg: avgVal };
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>{t('trends.title')}</Text>
        <Text style={styles.subtitle}>{t('trends.subtitle')}</Text>

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
              style={[styles.metricChip, metric === mi.id && { backgroundColor: mi.color, borderColor: mi.color }]}
              onPress={() => setMetric(mi.id)}
            >
              <Text style={[styles.metricText, metric === mi.id && { color: '#000' }]}>{mi.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <ActivityIndicator color={theme.primary} style={{ marginTop: 40 }} />
        ) : data.length > 0 ? (
          <View style={styles.chartCard}>
            <LineChart
              data={{ labels, datasets: [{ data: data.length ? data : [0], color: () => current.color, strokeWidth: 3 }] }}
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
                color: () => current.color,
                labelColor: () => theme.textSecondary,
                propsForDots: { r: '4', strokeWidth: '2', stroke: current.color, fill: theme.card },
                propsForBackgroundLines: { stroke: theme.border },
                decimalPlaces: metric === 'strain' ? 1 : metric === 'km' ? 2 : 0,
              }}
              bezier
              style={{ borderRadius: 16, marginLeft: -8 }}
            />
          </View>
        ) : (
          <Text style={styles.empty}>—</Text>
        )}

        <View style={styles.statsRow}>
          <StatBox label={t('home.avg')} value={metric === 'strain' ? avg.toFixed(1) : metric === 'km' ? formatDistance(avg, prefs.units) : String(Math.round(avg))} color={current.color} />
          <StatBox label={t('home.highest')} value={metric === 'strain' ? max.toFixed(1) : metric === 'km' ? formatDistance(max, prefs.units) : String(Math.round(max))} color={current.color} />
          <StatBox label={t('home.lowest')} value={metric === 'strain' ? min.toFixed(1) : metric === 'km' ? formatDistance(min, prefs.units) : String(Math.round(min))} color={current.color} />
        </View>

        {/* TEXT INSIGHTS — one per parameter */}
        <Text style={styles.sectionTitle}>{t('trends.insights')}</Text>
        <View style={styles.insightsCard}>
          {insights.map((ins, idx) => (
            <View key={ins.id} style={[styles.insightRow, idx === insights.length - 1 && { borderBottomWidth: 0 }]}>
              <View style={[styles.insightDot, { backgroundColor: ins.color }]} />
              <View style={{ flex: 1 }}>
                <View style={styles.insightHead}>
                  <Text style={styles.insightLabel}>{ins.label}</Text>
                  <View style={[styles.trendBadge, { borderColor: ins.color + '66' }]}>
                    <Ionicons
                      name={ins.trend === 'improving' ? 'trending-up' : ins.trend === 'declining' ? 'trending-down' : 'remove'}
                      size={12}
                      color={ins.color}
                    />
                    <Text style={[styles.trendText, { color: ins.color }]}>{t(`trends.${ins.trend}`)}</Text>
                  </View>
                </View>
                <Text style={styles.insightText}>
                  {ins.trend === 'stable'
                    ? t('trends.stableText')
                    : ins.trend === 'improving'
                      ? t('trends.improvingBy', { n: ins.diff })
                      : t('trends.decliningBy', { n: ins.diff })}
                  {ins.id === 'steps' && ` · ${t('trends.stepsTotal', { n: Math.round(ins.sum).toLocaleString() })}`}
                  {ins.id === 'km' && ` · ${t('trends.kmTotal', { n: ins.sum.toFixed(1) })}`}
                </Text>
              </View>
            </View>
          ))}
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
  metricChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.card },
  metricText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  chartCard: { backgroundColor: theme.card, borderRadius: 16, padding: 12, borderWidth: 1, borderColor: theme.border },
  empty: { color: theme.textSecondary, textAlign: 'center', marginTop: 40 },
  statsRow: { flexDirection: 'row', gap: 12, marginTop: 18, marginBottom: 6 },
  statBox: { flex: 1, backgroundColor: theme.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: theme.border, alignItems: 'center' },
  statLabel: { color: theme.textSecondary, fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase' },
  statVal: { color: '#fff', fontSize: 20, fontWeight: '800', marginTop: 6 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '800', marginTop: 22, marginBottom: 12 },
  insightsCard: { backgroundColor: theme.card, borderRadius: 16, borderWidth: 1, borderColor: theme.border, overflow: 'hidden' },
  insightRow: { flexDirection: 'row', padding: 14, gap: 12, borderBottomWidth: 1, borderBottomColor: theme.border },
  insightDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  insightHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  insightLabel: { color: '#fff', fontSize: 14, fontWeight: '700' },
  trendBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, borderWidth: 1 },
  trendText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  insightText: { color: theme.textSecondary, fontSize: 12, lineHeight: 18 },
});
