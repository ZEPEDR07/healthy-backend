import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import CircularRing from '../../components/CircularRing';
import { apiGet } from '../../src/api';
import { useAuth } from '../../src/auth';
import { theme, recoveryColor, stressColor, strainColor } from '../../src/theme';

type Metrics = {
  date: string;
  recovery: number;
  strain: number;
  sleep_score: number;
  sleep_hours: number;
  sleep_stages: { deep: number; rem: number; light: number; awake: number };
  stress: number;
  hrv: number;
  resting_hr: number;
  respiratory_rate: number;
};

function statusText(score: number, type: 'recovery' | 'stress' | 'sleep') {
  if (type === 'recovery') {
    if (score >= 67) return 'Pronto para ir longe';
    if (score >= 34) return 'Mantém-te equilibrado';
    return 'O teu corpo precisa de descanso';
  }
  if (type === 'sleep') {
    if (score >= 85) return 'Excelente';
    if (score >= 70) return 'Bom';
    if (score >= 50) return 'Razoável';
    return 'Insuficiente';
  }
  if (score <= 33) return 'Calmo';
  if (score <= 66) return 'Moderado';
  return 'Elevado';
}

export default function Dashboard() {
  const { user } = useAuth();
  const [m, setM] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await apiGet<Metrics>('/metrics/today');
      setM(data);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loading}>
          <ActivityIndicator color={theme.recovery} size="large" />
        </View>
      </SafeAreaView>
    );
  }
  if (!m) return null;

  const sleepH = Math.floor(m.sleep_hours);
  const sleepMin = Math.round((m.sleep_hours - sleepH) * 60);
  const today = new Date(m.date + 'T00:00:00');
  const dateLabel = today.toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'short' });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        testID="dashboard-scroll"
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl tintColor={theme.recovery} refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greet}>Olá, {user?.name?.split(' ')[0] || 'atleta'}</Text>
            <Text style={styles.date}>{dateLabel}</Text>
          </View>
          <View style={styles.deviceBadge}>
            <Ionicons name="bluetooth" size={14} color={theme.recovery} />
            <Text style={styles.deviceText}>{user?.devices?.length || 0} ligado{(user?.devices?.length || 0) === 1 ? '' : 's'}</Text>
          </View>
        </View>

        <View testID="recovery-hero-card" style={styles.heroCard}>
          <Text style={styles.heroLabel}>RECOVERY</Text>
          <CircularRing
            value={m.recovery}
            color={recoveryColor(m.recovery)}
            size={220}
            stroke={16}
            unit="%"
            big
          />
          <Text style={[styles.heroStatus, { color: recoveryColor(m.recovery) }]}>
            {statusText(m.recovery, 'recovery')}
          </Text>
          <View style={styles.heroMeta}>
            <View style={styles.metaItem}>
              <Text style={styles.metaVal}>{m.hrv}</Text>
              <Text style={styles.metaLabel}>HRV (ms)</Text>
            </View>
            <View style={styles.metaDivider} />
            <View style={styles.metaItem}>
              <Text style={styles.metaVal}>{m.resting_hr}</Text>
              <Text style={styles.metaLabel}>RHR (bpm)</Text>
            </View>
            <View style={styles.metaDivider} />
            <View style={styles.metaItem}>
              <Text style={styles.metaVal}>{m.respiratory_rate}</Text>
              <Text style={styles.metaLabel}>Resp (rpm)</Text>
            </View>
          </View>
        </View>

        <View style={styles.grid}>
          <View testID="strain-card" style={[styles.smallCard, { borderColor: strainColor(m.strain) + '55' }]}>
            <View style={styles.cardHead}>
              <Ionicons name="flame" size={18} color={strainColor(m.strain)} />
              <Text style={styles.cardLabel}>STRAIN</Text>
            </View>
            <Text style={[styles.cardValue, { color: strainColor(m.strain) }]}>{m.strain.toFixed(1)}</Text>
            <Text style={styles.cardSub}>de 21.0</Text>
          </View>

          <View testID="sleep-card" style={[styles.smallCard, { borderColor: theme.sleep + '55' }]}>
            <View style={styles.cardHead}>
              <Ionicons name="moon" size={18} color={theme.sleep} />
              <Text style={styles.cardLabel}>SONO</Text>
            </View>
            <Text style={[styles.cardValue, { color: theme.sleep }]}>{m.sleep_score}</Text>
            <Text style={styles.cardSub}>{sleepH}h {sleepMin}m · {statusText(m.sleep_score, 'sleep')}</Text>
          </View>

          <View testID="stress-card" style={[styles.smallCard, styles.fullCard, { borderColor: stressColor(m.stress) + '55' }]}>
            <View style={styles.cardHead}>
              <Ionicons name="warning" size={18} color={stressColor(m.stress)} />
              <Text style={styles.cardLabel}>STRESS</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <Text style={[styles.cardValue, { color: stressColor(m.stress) }]}>{m.stress}<Text style={styles.cardValSmall}>/100</Text></Text>
              <Text style={[styles.cardSub, { color: stressColor(m.stress) }]}>{statusText(m.stress, 'stress')}</Text>
            </View>
          </View>
        </View>

        <View testID="sleep-stages-card" style={styles.detailCard}>
          <Text style={styles.detailTitle}>Fases do sono</Text>
          <View style={styles.stagesBar}>
            <View style={{ flex: m.sleep_stages.deep, backgroundColor: '#5E5CE6' }} />
            <View style={{ flex: m.sleep_stages.rem, backgroundColor: '#0A84FF' }} />
            <View style={{ flex: m.sleep_stages.light, backgroundColor: '#34C7AE' }} />
            <View style={{ flex: m.sleep_stages.awake, backgroundColor: '#FF9F0A' }} />
          </View>
          <View style={styles.legend}>
            <LegendDot color="#5E5CE6" label="Profundo" min={m.sleep_stages.deep} />
            <LegendDot color="#0A84FF" label="REM" min={m.sleep_stages.rem} />
            <LegendDot color="#34C7AE" label="Leve" min={m.sleep_stages.light} />
            <LegendDot color="#FF9F0A" label="Acordado" min={m.sleep_stages.awake} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function LegendDot({ color, label, min }: { color: string; label: string; min: number }) {
  const h = Math.floor(min / 60);
  const mm = min % 60;
  return (
    <View style={styles.legendItem}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <View>
        <Text style={styles.legendLabel}>{label}</Text>
        <Text style={styles.legendVal}>{h > 0 ? `${h}h ${mm}m` : `${mm}m`}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.bg },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  greet: { color: '#fff', fontSize: 24, fontWeight: '800' },
  date: { color: theme.textSecondary, fontSize: 13, marginTop: 2, textTransform: 'capitalize' },
  deviceBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: theme.card, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: theme.border },
  deviceText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  heroCard: {
    backgroundColor: theme.card, borderRadius: 20, padding: 24, alignItems: 'center',
    borderWidth: 1, borderColor: theme.border, marginBottom: 16,
  },
  heroLabel: { color: theme.textSecondary, fontSize: 12, letterSpacing: 1.5, fontWeight: '700', marginBottom: 12 },
  heroStatus: { fontSize: 15, fontWeight: '700', marginTop: 14 },
  heroMeta: { flexDirection: 'row', marginTop: 18, width: '100%', justifyContent: 'space-between' },
  metaItem: { flex: 1, alignItems: 'center' },
  metaVal: { color: '#fff', fontSize: 20, fontWeight: '800' },
  metaLabel: { color: theme.textSecondary, fontSize: 11, marginTop: 2, letterSpacing: 0.8 },
  metaDivider: { width: 1, backgroundColor: theme.border, marginHorizontal: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  smallCard: {
    flex: 1, minWidth: '47%', backgroundColor: theme.card, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: theme.border,
  },
  fullCard: { width: '100%', flexBasis: '100%' },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  cardLabel: { color: theme.textSecondary, fontSize: 11, fontWeight: '700', letterSpacing: 1.5 },
  cardValue: { color: '#fff', fontSize: 36, fontWeight: '900', letterSpacing: -1 },
  cardValSmall: { fontSize: 16, color: theme.textTertiary, fontWeight: '600' },
  cardSub: { color: theme.textSecondary, fontSize: 13, marginTop: 4 },
  detailCard: { backgroundColor: theme.card, borderRadius: 16, padding: 18, borderWidth: 1, borderColor: theme.border },
  detailTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 14 },
  stagesBar: { flexDirection: 'row', height: 16, borderRadius: 8, overflow: 'hidden', backgroundColor: theme.cardElevated },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 14 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 8, width: '46%' },
  dot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { color: theme.textSecondary, fontSize: 11, letterSpacing: 0.8 },
  legendVal: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
