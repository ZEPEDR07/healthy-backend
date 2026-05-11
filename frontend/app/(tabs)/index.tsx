import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
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
  body_battery: number;
  stress_highest: number;
  stress_lowest: number;
  stress_avg: number;
  hrv: number;
  resting_hr: number;
  respiratory_rate: number;
};

type NutritionToday = {
  totals: { calories: number; protein_g: number; carbs_g: number; fat_g: number };
  items: any[];
};

function recoveryStatus(r: number) {
  if (r >= 67) return 'Pronto para ir longe';
  if (r >= 34) return 'Mantém o equilíbrio';
  return 'Precisa de descanso';
}

export default function Dashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [m, setM] = useState<Metrics | null>(null);
  const [nut, setNut] = useState<NutritionToday | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [d, n] = await Promise.all([
        apiGet<Metrics>('/metrics/today'),
        apiGet<NutritionToday>('/nutrition/today'),
      ]);
      setM(d);
      setNut(n);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = () => { setRefreshing(true); load(); };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loading}>
          <ActivityIndicator color={theme.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }
  if (!m) return null;

  const dateLabel = new Date(m.date + 'T00:00:00').toLocaleDateString('pt-PT', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
  const sleepH = Math.floor(m.sleep_hours);
  const sleepMin = Math.round((m.sleep_hours - sleepH) * 60);
  const initials = (user?.name || 'U').split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        testID="dashboard-scroll"
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl tintColor={theme.primary} refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* HEADER */}
        <View style={styles.topRow}>
          <View style={styles.syncPill} testID="sync-pill">
            <Ionicons name="checkmark-circle" size={14} color={theme.primary} />
            <Text style={styles.syncText}>Sincronizado</Text>
          </View>
          <TouchableOpacity testID="profile-shortcut" onPress={() => router.push('/(tabs)/profile')} style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
            {user?.premium_active && (
              <View style={styles.premiumDot}><Ionicons name="star" size={9} color="#000" /></View>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.dateLabel}>{dateLabel}</Text>

        {/* STATUS PILL */}
        <View style={styles.statusRow}>
          <View style={styles.statusPill}>
            <View style={[styles.statusIcon, { backgroundColor: theme.primary }]}>
              <Ionicons name="walk" size={14} color="#000" />
            </View>
            <Text style={styles.statusText}>{m.recovery >= 67 ? 'Ativo' : m.recovery >= 34 ? 'Estável' : 'Descansa'}</Text>
          </View>
          <View style={styles.devicePill}>
            <Ionicons name="bluetooth" size={12} color={theme.primary} />
            <Text style={styles.statusText}>{user?.devices?.length || 0} ligado{(user?.devices?.length || 0) === 1 ? '' : 's'}</Text>
          </View>
        </View>

        {/* 3-RING ROW */}
        <View style={styles.ringsCard} testID="rings-card">
          <View style={styles.ringCol}>
            <CircularRing
              value={m.strain} max={21} size={96} stroke={9}
              color={strainColor(m.strain)} unit=""
            />
            <Text style={styles.ringLabel}>Strain</Text>
          </View>
          <View style={styles.ringCol}>
            <CircularRing
              value={m.recovery} size={96} stroke={9}
              color={recoveryColor(m.recovery)} unit="%"
            />
            <Text style={styles.ringLabel}>Recovery</Text>
          </View>
          <View style={styles.ringCol}>
            <CircularRing
              value={m.sleep_score} size={96} stroke={9}
              color={theme.sleep} unit="%"
            />
            <Text style={styles.ringLabel}>Sono</Text>
          </View>
        </View>

        {/* COACHING */}
        <TouchableOpacity
          testID="coaching-card"
          style={styles.coachingCard}
          activeOpacity={0.85}
          onPress={() => router.push('/(tabs)/tips')}
        >
          <View style={styles.coachingHead}>
            <Text style={styles.coachingLabel}>COACHING</Text>
            {!user?.premium_active && (
              <View style={styles.lockBadge}>
                <Ionicons name="star" size={10} color={theme.premium} />
                <Text style={styles.lockText}>Premium</Text>
              </View>
            )}
          </View>
          <Text style={styles.coachingText}>
            {m.recovery >= 67
              ? `Tens ${m.recovery}% de recovery e ${m.sleep_hours}h de sono. Aproveita para um treino com strain alvo de 14-17.`
              : `Recovery a ${m.recovery}%. Prioriza sono mais cedo hoje e mantém o strain abaixo de ${Math.round(m.strain + 2)}.`
            }
          </Text>
        </TouchableOpacity>

        {/* STRESS & ENERGY */}
        <Text style={styles.sectionTitle}>Stress & Energia</Text>
        <View style={styles.stressCard} testID="stress-card">
          <View style={styles.stressHead}>
            <View style={styles.stressDot} />
            <Text style={styles.stressTitle}>Stress hoje</Text>
            <Text style={styles.stressUpdated}>Atualizado às {new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}</Text>
          </View>
          <View style={styles.stressStatsRow}>
            <View style={styles.stressStat}>
              <Text style={[styles.stressVal, { color: theme.stressRed }]}>{m.stress_highest}</Text>
              <Text style={styles.stressKey}>Máximo</Text>
            </View>
            <View style={styles.stressStat}>
              <Text style={[styles.stressVal, { color: theme.recovery }]}>{m.stress_lowest}</Text>
              <Text style={styles.stressKey}>Mínimo</Text>
            </View>
            <View style={styles.stressStat}>
              <Text style={[styles.stressVal, { color: theme.strain }]}>{m.stress_avg}</Text>
              <Text style={styles.stressKey}>Média</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <CircularRing
                value={m.stress} size={70} stroke={7}
                color={stressColor(m.stress)} unit=""
              />
              <Text style={[styles.stressKey, { marginTop: 4 }]}>
                {m.stress <= 33 ? 'Baixo' : m.stress <= 66 ? 'Médio' : 'Alto'}
              </Text>
            </View>
          </View>
        </View>

        {/* BODY BATTERY */}
        <View style={styles.batteryCard} testID="battery-card">
          <Ionicons name="flash" size={20} color={theme.battery} />
          <View style={styles.batteryBarBg}>
            <View style={[styles.batteryBarFill, { width: `${m.body_battery}%` }]} />
          </View>
          <Text style={styles.batteryPct}>{m.body_battery}%</Text>
        </View>

        {/* NUTRITION */}
        <View style={styles.nutHead}>
          <Text style={styles.sectionTitle}>Nutrição</Text>
          <TouchableOpacity testID="nutrition-add-btn" style={styles.addPill} onPress={() => router.push('/(tabs)/nutrition')}>
            <Ionicons name="add" size={16} color="#000" />
            <Text style={styles.addPillText}>Foto</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity testID="nutrition-summary-card" style={styles.nutCard} onPress={() => router.push('/(tabs)/nutrition')}>
          <View style={styles.nutCol}>
            <Text style={[styles.nutVal, { color: theme.recovery }]}>{nut?.totals.calories || 0}</Text>
            <Text style={styles.nutKey}>kcal</Text>
          </View>
          <View style={styles.nutCol}>
            <Text style={[styles.nutVal, { color: theme.primary }]}>{nut?.totals.protein_g || 0}g</Text>
            <Text style={styles.nutKey}>Proteína</Text>
          </View>
          <View style={styles.nutCol}>
            <Text style={[styles.nutVal, { color: theme.strain }]}>{nut?.totals.carbs_g || 0}g</Text>
            <Text style={styles.nutKey}>Carbs</Text>
          </View>
          <View style={styles.nutCol}>
            <Text style={[styles.nutVal, { color: theme.sleep }]}>{nut?.totals.fat_g || 0}g</Text>
            <Text style={styles.nutKey}>Gordura</Text>
          </View>
        </TouchableOpacity>

        {/* RECOVERY DETAILS */}
        <Text style={styles.sectionTitle}>Biologia</Text>
        <View style={styles.bioCard}>
          <BioRow label="HRV" value={`${m.hrv} ms`} color={theme.primary} icon="pulse" />
          <BioRow label="Resting HR" value={`${m.resting_hr} bpm`} color={theme.recovery} icon="heart" />
          <BioRow label="Respiração" value={`${m.respiratory_rate} rpm`} color={theme.sleep} icon="cloud" />
          <BioRow label="Sono total" value={`${sleepH}h ${sleepMin}m`} color={theme.strain} icon="moon" last />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function BioRow({ label, value, color, icon, last }: { label: string; value: string; color: string; icon: any; last?: boolean }) {
  return (
    <View style={[styles.bioRow, last && { borderBottomWidth: 0 }]}>
      <View style={[styles.bioIcon, { backgroundColor: color + '22' }]}>
        <Ionicons name={icon} size={16} color={color} />
      </View>
      <Text style={styles.bioLabel}>{label}</Text>
      <Text style={[styles.bioVal, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.bg },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: 18, paddingBottom: 40 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  syncPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: theme.primary + '22', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999,
    borderWidth: 1, borderColor: theme.primary + '55',
  },
  syncText: { color: theme.primary, fontSize: 12, fontWeight: '700' },
  avatar: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: theme.cardElevated,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.border,
  },
  avatarText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  premiumDot: { position: 'absolute', bottom: -2, right: -2, width: 16, height: 16, borderRadius: 8, backgroundColor: theme.premium, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: theme.bg },
  dateLabel: { color: '#fff', fontSize: 30, fontWeight: '800', marginTop: 14, letterSpacing: -0.5 },
  statusRow: { flexDirection: 'row', gap: 10, marginTop: 12, marginBottom: 14 },
  statusPill: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: theme.card, borderRadius: 999, paddingHorizontal: 6, paddingVertical: 6,
    borderWidth: 1, borderColor: theme.border,
  },
  statusIcon: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  statusText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  devicePill: {
    flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 10,
    backgroundColor: theme.card, borderRadius: 999, borderWidth: 1, borderColor: theme.border,
  },
  ringsCard: {
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
    backgroundColor: theme.card, borderRadius: 20, padding: 18, marginBottom: 12,
    borderWidth: 1, borderColor: theme.border,
  },
  ringCol: { alignItems: 'center' },
  ringLabel: { color: '#fff', fontSize: 14, fontWeight: '700', marginTop: 10 },
  coachingCard: { backgroundColor: theme.card, borderRadius: 16, padding: 18, borderWidth: 1, borderColor: theme.border, marginBottom: 18 },
  coachingHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  coachingLabel: { color: theme.textSecondary, fontSize: 11, fontWeight: '700', letterSpacing: 1.5 },
  lockBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, backgroundColor: theme.premium + '1A', borderRadius: 999, borderWidth: 1, borderColor: theme.premium + '55' },
  lockText: { color: theme.premium, fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },
  coachingText: { color: '#fff', fontSize: 16, fontWeight: '500', lineHeight: 22 },
  sectionTitle: { color: '#fff', fontSize: 20, fontWeight: '800', marginBottom: 12, marginTop: 4 },
  stressCard: { backgroundColor: theme.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: theme.border, marginBottom: 12 },
  stressHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  stressDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.recovery },
  stressTitle: { color: '#fff', fontSize: 15, fontWeight: '600' },
  stressUpdated: { color: theme.textTertiary, fontSize: 11, marginLeft: 'auto' },
  stressStatsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stressStat: { alignItems: 'flex-start' },
  stressVal: { fontSize: 24, fontWeight: '800' },
  stressKey: { color: theme.textSecondary, fontSize: 11, marginTop: 2 },
  batteryCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: theme.card, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: theme.border, marginBottom: 22,
  },
  batteryBarBg: { flex: 1, height: 14, backgroundColor: theme.cardElevated, borderRadius: 7, overflow: 'hidden' },
  batteryBarFill: { height: 14, backgroundColor: theme.battery, borderRadius: 7 },
  batteryPct: { color: '#fff', fontSize: 14, fontWeight: '700', minWidth: 42, textAlign: 'right' },
  nutHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  addPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: theme.primary, borderRadius: 999, marginBottom: 12 },
  addPillText: { color: '#000', fontSize: 12, fontWeight: '800' },
  nutCard: { flexDirection: 'row', backgroundColor: theme.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: theme.border, marginBottom: 22, justifyContent: 'space-between' },
  nutCol: { alignItems: 'center', flex: 1 },
  nutVal: { fontSize: 20, fontWeight: '800' },
  nutKey: { color: theme.textSecondary, fontSize: 11, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.8 },
  bioCard: { backgroundColor: theme.card, borderRadius: 16, borderWidth: 1, borderColor: theme.border, overflow: 'hidden' },
  bioRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12, borderBottomWidth: 1, borderBottomColor: theme.border },
  bioIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  bioLabel: { color: '#fff', fontSize: 14, fontWeight: '600', flex: 1 },
  bioVal: { fontSize: 15, fontWeight: '800' },
});
