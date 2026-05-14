import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import CircularRing from '../../components/CircularRing';
import StatusSheet from '../../components/StatusSheet';
import DatePickerSheet from '../../components/DatePickerSheet';
import Sparkline from '../../components/Sparkline';
import { apiGet } from '../../src/api';
import { useAuth } from '../../src/auth';
import { theme, recoveryColor, stressColor, strainColor } from '../../src/theme';
import { t, formatLongDate, formatDistance, distanceUnit } from '../../src/i18n';

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

type Activity = {
  date: string;
  steps: number;
  km: number;
  floors: number;
  active_minutes: number;
  calories: number;
};

type NutritionToday = {
  totals: { calories: number; protein_g: number; carbs_g: number; fat_g: number };
};

type NutritionHistory = {
  calories: number[];
  protein_g: number[];
  carbs_g: number[];
  fat_g: number[];
  dates: string[];
};

function statusColor(s: string) {
  if (s === 'ativo') return theme.recovery;
  if (s === 'doente') return theme.stressOrange;
  if (s === 'aleijado') return theme.stressRed;
  return theme.sleep;
}
function statusIcon(s: string) {
  if (s === 'ativo') return 'pulse';
  if (s === 'doente') return 'thermometer';
  if (s === 'aleijado') return 'bandage';
  return 'airplane';
}

function ymd(d: Date) {
  return d.toISOString().slice(0, 10);
}
function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export default function Dashboard() {
  const router = useRouter();
  const { user, prefs, status } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [m, setM] = useState<Metrics | null>(null);
  const [activity, setActivity] = useState<Activity | null>(null);
  const [nut, setNut] = useState<NutritionToday | null>(null);
  const [nutHist, setNutHist] = useState<NutritionHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);

  const isToday = useMemo(() => sameDay(selectedDate, new Date()), [selectedDate]);

  const load = useCallback(async (date: Date) => {
    try {
      const dStr = ymd(date);
      const isTodayLocal = sameDay(date, new Date());
      const [metricsRes, activityRes, nutRes, nutHistRes] = await Promise.all([
        isTodayLocal
          ? apiGet<Metrics>('/metrics/today')
          : apiGet<Metrics>(`/metrics/date/${dStr}`).catch(() => null),
        isTodayLocal
          ? apiGet<Activity>('/activity/today')
          : apiGet<Activity>(`/activity/date/${dStr}`).catch(() => null),
        apiGet<NutritionToday>('/nutrition/today').catch(() => null),
        apiGet<NutritionHistory>('/nutrition/history?days=7').catch(() => null),
      ]);
      setM(metricsRes as Metrics | null);
      setActivity(activityRes as Activity | null);
      setNut(nutRes);
      setNutHist(nutHistRes);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(selectedDate); }, [selectedDate, load]);

  const onRefresh = () => { setRefreshing(true); load(selectedDate); };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loading}>
          <ActivityIndicator color={theme.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }
  if (!m) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.loading}>
          <Text style={{ color: theme.textSecondary }}>{t('common.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const initials = (user?.name || 'U').split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();
  const dateLabel = formatLongDate(selectedDate, isToday);

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
            <Text style={styles.syncText}>{t('home.synced')}</Text>
          </View>
          <View style={styles.topRightRow}>
            <TouchableOpacity
              testID="notifications-btn"
              onPress={() => router.push('/notifications')}
              style={styles.iconBtn}
            >
              <Ionicons name="notifications-outline" size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              testID="profile-shortcut"
              onPress={() => router.push('/(tabs)/profile')}
              style={styles.avatar}
            >
              <Text style={styles.avatarText}>{initials}</Text>
              {user?.premium_active && (
                <View style={styles.premiumDot}><Ionicons name="star" size={9} color="#000" /></View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* DATE — CLICKABLE */}
        <TouchableOpacity testID="date-btn" onPress={() => setDateOpen(true)} style={styles.dateBtn}>
          <Text style={styles.dateLabel}>{dateLabel}</Text>
          <Ionicons name="chevron-down" size={20} color={theme.textSecondary} />
        </TouchableOpacity>

        {/* STATUS + DEVICES */}
        <View style={styles.statusRow}>
          <TouchableOpacity testID="status-btn" style={styles.statusPill} onPress={() => setStatusOpen(true)}>
            <View style={[styles.statusIcon, { backgroundColor: statusColor(status) }]}>
              <Ionicons name={statusIcon(status) as any} size={14} color="#000" />
            </View>
            <Text style={styles.statusText}>{t(`status.${status}`)}</Text>
            <Ionicons name="chevron-down" size={14} color={theme.textSecondary} />
          </TouchableOpacity>
          <View style={styles.devicePill}>
            <Ionicons name="bluetooth" size={12} color={theme.primary} />
            <Text style={styles.statusText}>
              {user?.devices?.length || 0}{' '}
              {(user?.devices?.length || 0) === 1 ? t('home.connected') : t('home.connectedPlural')}
            </Text>
          </View>
        </View>

        {/* 3-RING ROW */}
        <View style={styles.ringsCard} testID="rings-card">
          <View style={styles.ringCol}>
            <CircularRing value={m.strain} max={21} size={94} stroke={9} color={strainColor(m.strain)} unit="" />
            <Text style={styles.ringLabel}>{t('home.strain')}</Text>
          </View>
          <View style={styles.ringCol}>
            <CircularRing value={m.recovery} size={94} stroke={9} color={recoveryColor(m.recovery)} unit="%" />
            <Text style={styles.ringLabel}>{t('home.recovery')}</Text>
          </View>
          <View style={styles.ringCol}>
            <CircularRing value={m.sleep_score} size={94} stroke={9} color={theme.sleep} unit="%" />
            <Text style={styles.ringLabel}>{t('home.sleep')}</Text>
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
            <Text style={styles.coachingLabel}>{t('home.coaching')}</Text>
            {!user?.premium_active && (
              <View style={styles.lockBadge}>
                <Ionicons name="star" size={10} color={theme.premium} />
                <Text style={styles.lockText}>Premium</Text>
              </View>
            )}
          </View>
          <Text style={styles.coachingText}>
            {m.recovery >= 67
              ? `${m.recovery}% recovery · ${m.sleep_hours}h sleep · ${t('home.ready')}`
              : `${m.recovery}% recovery · ${t('home.rest')}`}
          </Text>
        </TouchableOpacity>

        {/* ACTIVITY (steps + km) */}
        {activity && (
          <>
            <Text style={styles.sectionTitle}>{t('home.activity')}</Text>
            <View style={styles.activityCard} testID="activity-card">
              <View style={styles.actCol}>
                <Ionicons name="walk" size={20} color={theme.recovery} />
                <Text style={styles.actVal}>{activity.steps.toLocaleString()}</Text>
                <Text style={styles.actKey}>{t('home.steps')}</Text>
              </View>
              <View style={styles.actDivider} />
              <View style={styles.actCol}>
                <Ionicons name="map" size={20} color={theme.primary} />
                <Text style={styles.actVal}>{formatDistance(activity.km, prefs.units)}</Text>
                <Text style={styles.actKey}>{distanceUnit(prefs.units)}</Text>
              </View>
              <View style={styles.actDivider} />
              <View style={styles.actCol}>
                <Ionicons name="flame" size={20} color={theme.strain} />
                <Text style={styles.actVal}>{activity.calories}</Text>
                <Text style={styles.actKey}>{t('home.kcal')}</Text>
              </View>
              <View style={styles.actDivider} />
              <View style={styles.actCol}>
                <Ionicons name="time" size={20} color={theme.sleep} />
                <Text style={styles.actVal}>{activity.active_minutes}m</Text>
                <Text style={styles.actKey}>{t('home.activeMin')}</Text>
              </View>
            </View>
          </>
        )}

        {/* STRESS & ENERGY */}
        <Text style={styles.sectionTitle}>{t('home.stressEnergy')}</Text>
        <View style={styles.stressCard} testID="stress-card">
          <View style={styles.stressHead}>
            <View style={styles.stressDot} />
            <Text style={styles.stressTitle}>{t('home.stressToday')}</Text>
          </View>
          <View style={styles.stressStatsRow}>
            <View style={styles.stressStat}>
              <Text style={[styles.stressVal, { color: theme.stressRed }]}>{m.stress_highest}</Text>
              <Text style={styles.stressKey}>{t('home.highest')}</Text>
            </View>
            <View style={styles.stressStat}>
              <Text style={[styles.stressVal, { color: theme.recovery }]}>{m.stress_lowest}</Text>
              <Text style={styles.stressKey}>{t('home.lowest')}</Text>
            </View>
            <View style={styles.stressStat}>
              <Text style={[styles.stressVal, { color: theme.strain }]}>{m.stress_avg}</Text>
              <Text style={styles.stressKey}>{t('home.avg')}</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <CircularRing value={m.stress} size={62} stroke={6} color={stressColor(m.stress)} unit="" />
              <Text style={[styles.stressKey, { marginTop: 4 }]}>
                {m.stress <= 33 ? t('home.stressLow') : m.stress <= 66 ? t('home.stressMed') : t('home.stressHigh')}
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
          <Text style={styles.sectionTitle}>{t('home.nutrition')}</Text>
          <TouchableOpacity testID="nutrition-add-btn" style={styles.addPill} onPress={() => router.push('/(tabs)/nutrition')}>
            <Ionicons name="add" size={16} color="#000" />
            <Text style={styles.addPillText}>{t('home.photo')}</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity testID="nutrition-summary-card" style={styles.nutCardV2} activeOpacity={0.85} onPress={() => router.push('/(tabs)/nutrition')}>
          <NutRow
            label={t('home.kcal').toUpperCase()}
            value={nut?.totals.calories || 0}
            unit=""
            color={theme.recovery}
            data={nutHist?.calories || []}
            icon="flame"
          />
          <View style={styles.nutDivider} />
          <NutRow
            label={t('home.protein').toUpperCase()}
            value={nut?.totals.protein_g || 0}
            unit="g"
            color={theme.primary}
            data={nutHist?.protein_g || []}
            icon="barbell"
          />
          <View style={styles.nutDivider} />
          <NutRow
            label={t('home.carbs').toUpperCase()}
            value={nut?.totals.carbs_g || 0}
            unit="g"
            color={theme.strain}
            data={nutHist?.carbs_g || []}
            icon="leaf"
          />
          <View style={styles.nutDivider} />
          <NutRow
            label={t('home.fat').toUpperCase()}
            value={nut?.totals.fat_g || 0}
            unit="g"
            color={theme.sleep}
            data={nutHist?.fat_g || []}
            icon="water"
            last
          />
        </TouchableOpacity>

        {/* BIOLOGY */}
        <Text style={styles.sectionTitle}>{t('home.biology')}</Text>
        <View style={styles.bioCard}>
          <BioRow label={t('home.hrv')} value={`${m.hrv} ms`} color={theme.primary} icon="pulse" />
          <BioRow label={t('home.rhr')} value={`${m.resting_hr} bpm`} color={theme.recovery} icon="heart" />
          <BioRow label={t('home.respiration')} value={`${m.respiratory_rate} rpm`} color={theme.sleep} icon="cloud" />
          <BioRow
            label={t('home.sleepTotal')}
            value={`${Math.floor(m.sleep_hours)}h ${Math.round((m.sleep_hours - Math.floor(m.sleep_hours)) * 60)}m`}
            color={theme.strain} icon="moon" last
          />
        </View>
      </ScrollView>

      <StatusSheet visible={statusOpen} onClose={() => setStatusOpen(false)} />
      <DatePickerSheet
        visible={dateOpen}
        onClose={() => setDateOpen(false)}
        selected={selectedDate}
        onChange={setSelectedDate}
      />
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

function NutRow({
  label, value, unit, color, data, icon,
}: { label: string; value: number; unit: string; color: string; data: number[]; icon: any; last?: boolean }) {
  return (
    <View style={styles.nutRow}>
      <View style={styles.nutLeft}>
        <View style={[styles.nutIcon, { backgroundColor: color + '22' }]}>
          <Ionicons name={icon} size={14} color={color} />
        </View>
        <View>
          <Text style={styles.nutLabel}>{label}</Text>
          <Text style={styles.nutSubtle}>7d</Text>
        </View>
      </View>
      <View style={styles.nutRight}>
        <Sparkline
          data={data && data.length ? data : [value, value, value, value, value, value, value]}
          color={color}
          width={86}
          height={30}
          unit={unit}
          formatValue={() => `${value}`}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.bg },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: 18, paddingBottom: 40 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  syncPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: theme.primary + '22', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: theme.primary + '55' },
  syncText: { color: theme.primary, fontSize: 12, fontWeight: '700' },
  topRightRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.border },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.cardElevated, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.border },
  avatarText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  premiumDot: { position: 'absolute', bottom: -2, right: -2, width: 16, height: 16, borderRadius: 8, backgroundColor: theme.premium, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: theme.bg },
  dateBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14, paddingVertical: 4 },
  dateLabel: { color: '#fff', fontSize: 24, fontWeight: '800', letterSpacing: -0.5, textTransform: 'capitalize' },
  statusRow: { flexDirection: 'row', gap: 10, marginTop: 12, marginBottom: 14 },
  statusPill: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: theme.card, borderRadius: 999, paddingHorizontal: 6, paddingVertical: 6, borderWidth: 1, borderColor: theme.border },
  statusIcon: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  statusText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  devicePill: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: theme.card, borderRadius: 999, borderWidth: 1, borderColor: theme.border },
  ringsCard: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', backgroundColor: theme.card, borderRadius: 20, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: theme.border },
  ringCol: { alignItems: 'center' },
  ringLabel: { color: '#fff', fontSize: 14, fontWeight: '700', marginTop: 10 },
  coachingCard: { backgroundColor: theme.card, borderRadius: 16, padding: 18, borderWidth: 1, borderColor: theme.border, marginBottom: 18 },
  coachingHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  coachingLabel: { color: theme.textSecondary, fontSize: 11, fontWeight: '700', letterSpacing: 1.5 },
  lockBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, backgroundColor: theme.premium + '1A', borderRadius: 999, borderWidth: 1, borderColor: theme.premium + '55' },
  lockText: { color: theme.premium, fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },
  coachingText: { color: '#fff', fontSize: 15, fontWeight: '500', lineHeight: 22 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '800', marginBottom: 12, marginTop: 4 },
  activityCard: { flexDirection: 'row', backgroundColor: theme.card, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: theme.border, marginBottom: 22, alignItems: 'center' },
  actCol: { flex: 1, alignItems: 'center' },
  actDivider: { width: 1, height: 36, backgroundColor: theme.border },
  actVal: { color: '#fff', fontSize: 16, fontWeight: '800', marginTop: 6 },
  actKey: { color: theme.textSecondary, fontSize: 10, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.6 },
  stressCard: { backgroundColor: theme.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: theme.border, marginBottom: 12 },
  stressHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  stressDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.recovery },
  stressTitle: { color: '#fff', fontSize: 15, fontWeight: '600' },
  stressStatsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stressStat: { alignItems: 'flex-start' },
  stressVal: { fontSize: 22, fontWeight: '800' },
  stressKey: { color: theme.textSecondary, fontSize: 11, marginTop: 2 },
  batteryCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: theme.card, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: theme.border, marginBottom: 22 },
  batteryBarBg: { flex: 1, height: 14, backgroundColor: theme.cardElevated, borderRadius: 7, overflow: 'hidden' },
  batteryBarFill: { height: 14, backgroundColor: theme.battery, borderRadius: 7 },
  batteryPct: { color: '#fff', fontSize: 14, fontWeight: '700', minWidth: 42, textAlign: 'right' },
  nutHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  addPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: theme.primary, borderRadius: 999, marginBottom: 12 },
  addPillText: { color: '#000', fontSize: 12, fontWeight: '800' },
  nutCard: { flexDirection: 'row', backgroundColor: theme.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: theme.border, marginBottom: 22, justifyContent: 'space-between' },
  nutCardV2: { backgroundColor: theme.card, borderRadius: 16, paddingVertical: 4, paddingHorizontal: 14, borderWidth: 1, borderColor: theme.border, marginBottom: 22 },
  nutRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
  nutLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  nutRight: { flexShrink: 0 },
  nutIcon: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  nutLabel: { color: '#fff', fontSize: 12, fontWeight: '800', letterSpacing: 0.8 },
  nutSubtle: { color: theme.textTertiary, fontSize: 9, fontWeight: '600', marginTop: 1, letterSpacing: 0.5 },
  nutDivider: { height: 1, backgroundColor: theme.border, marginHorizontal: -14 },
  nutCol: { alignItems: 'center', flex: 1 },
  nutVal: { fontSize: 20, fontWeight: '800' },
  nutKey: { color: theme.textSecondary, fontSize: 11, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.8 },
  bioCard: { backgroundColor: theme.card, borderRadius: 16, borderWidth: 1, borderColor: theme.border, overflow: 'hidden' },
  bioRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12, borderBottomWidth: 1, borderBottomColor: theme.border },
  bioIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  bioLabel: { color: '#fff', fontSize: 14, fontWeight: '600', flex: 1 },
  bioVal: { fontSize: 15, fontWeight: '800' },
});
