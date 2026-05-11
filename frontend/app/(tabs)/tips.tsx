import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { apiGet, apiPost } from '../../src/api';
import { theme } from '../../src/theme';
import { useAuth } from '../../src/auth';

type Tip = {
  id?: string;
  title: string;
  tip: string;
  focus: string;
  premium?: boolean;
  created_at: string;
};

  const FOCUS = [
  { id: 'general', label: 'Geral', icon: 'sparkles' as const, color: theme.primary },
  { id: 'recovery', label: 'Recovery', icon: 'pulse' as const, color: theme.recovery },
  { id: 'sleep', label: 'Sono', icon: 'moon' as const, color: theme.sleep },
  { id: 'strain', label: 'Strain', icon: 'flame' as const, color: theme.strain },
  { id: 'stress', label: 'Stress', icon: 'warning' as const, color: theme.stressOrange },
  { id: 'nutrition', label: 'Nutrição', icon: 'restaurant' as const, color: theme.recovery },
];

function focusColor(f: string) {
  return FOCUS.find((x) => x.id === f)?.color || theme.white;
}
function focusIcon(f: string) {
  return FOCUS.find((x) => x.id === f)?.icon || 'sparkles';
}
function focusLabel(f: string) {
  return FOCUS.find((x) => x.id === f)?.label || 'Geral';
}

export default function Tips() {
  const router = useRouter();
  const { user } = useAuth();
  const [tips, setTips] = useState<Tip[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await apiGet<{ items: Tip[] }>('/tips/list');
      setTips(res.items);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const generate = async (focus: string) => {
    setGenerating(focus);
    try {
      const t = await apiPost<Tip & { premium?: boolean }>('/tips/generate', { focus });
      setTips((prev) => [t, ...prev]);
    } catch (e: any) {
      Alert.alert('Erro', e.message || 'Falha ao gerar dica.');
    } finally {
      setGenerating(null);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.title}>Coach IA</Text>
            <Text style={styles.subtitle}>Dicas personalizadas com base nos teus dados</Text>
          </View>
          {!user?.premium_active && (
            <TouchableOpacity testID="tips-upgrade-btn" style={styles.proPill} onPress={() => router.push('/premium')}>
              <Ionicons name="star" size={12} color={theme.premium} />
              <Text style={styles.proPillText}>PRO</Text>
            </TouchableOpacity>
          )}
        </View>

        {!user?.premium_active && (
          <TouchableOpacity testID="tips-upgrade-banner" style={styles.banner} onPress={() => router.push('/premium')}>
            <Ionicons name="lock-closed" size={16} color={theme.premium} />
            <Text style={styles.bannerText}>Dicas premium são mais longas e personalizadas. Trial 15 dias grátis.</Text>
            <Ionicons name="chevron-forward" size={16} color={theme.premium} />
          </TouchableOpacity>
        )}

        <Text style={styles.sectionLabel}>Gerar dica</Text>
        <View style={styles.chips}>
          {FOCUS.map((f) => (
            <TouchableOpacity
              key={f.id}
              testID={`generate-tip-${f.id}`}
              style={[styles.chip, generating === f.id && { opacity: 0.6 }]}
              onPress={() => generate(f.id)}
              disabled={generating !== null}
            >
              {generating === f.id ? (
                <ActivityIndicator color={f.color} size="small" />
              ) : (
                <Ionicons name={f.icon} size={16} color={f.color} />
              )}
              <Text style={styles.chipText}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <ActivityIndicator color={theme.recovery} style={{ marginTop: 30 }} />
        ) : tips.length === 0 ? (
          <View testID="tips-empty" style={styles.empty}>
            <Ionicons name="sparkles-outline" size={48} color={theme.textTertiary} />
            <Text style={styles.emptyTitle}>Sem dicas ainda</Text>
            <Text style={styles.emptySub}>Toca num botão acima para receber a tua primeira dica IA</Text>
          </View>
        ) : (
          tips.map((t, idx) => (
            <View key={t.id || idx} testID={`tip-card-${idx}`} style={styles.tipCard}>
              <View style={styles.tipHead}>
                <View style={[styles.tipBadge, { backgroundColor: focusColor(t.focus) + '22', borderColor: focusColor(t.focus) }]}>
                  <Ionicons name={focusIcon(t.focus) as any} size={12} color={focusColor(t.focus)} />
                  <Text style={[styles.tipBadgeText, { color: focusColor(t.focus) }]}>{focusLabel(t.focus)}</Text>
                </View>
                <Text style={styles.tipTime}>
                  {new Date(t.created_at).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })}
                </Text>
              </View>
              <Text style={styles.tipTitle}>{t.title}</Text>
              <Text style={styles.tipText}>{t.tip}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.bg },
  scroll: { padding: 20, paddingBottom: 40 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 },
  title: { color: '#fff', fontSize: 28, fontWeight: '800' },
  subtitle: { color: theme.textSecondary, fontSize: 14, marginTop: 4 },
  proPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: theme.premium, backgroundColor: theme.premium + '1A' },
  proPillText: { color: theme.premium, fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  banner: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, backgroundColor: theme.premium + '1A', borderRadius: 12, borderWidth: 1, borderColor: theme.premium + '55', marginBottom: 18 },
  bannerText: { color: '#fff', fontSize: 13, fontWeight: '600', flex: 1 },
  premiumChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 999, borderWidth: 1, borderColor: theme.premium + '66', backgroundColor: theme.premium + '1A', marginLeft: 8 },
  premiumChipText: { color: theme.premium, fontSize: 9, fontWeight: '800' },
  sectionLabel: { color: theme.textSecondary, fontSize: 11, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 22 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 10,
    backgroundColor: theme.card, borderRadius: 999, borderWidth: 1, borderColor: theme.border,
  },
  chipText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  empty: { alignItems: 'center', marginTop: 60, paddingHorizontal: 24 },
  emptyTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginTop: 16 },
  emptySub: { color: theme.textSecondary, fontSize: 14, marginTop: 6, textAlign: 'center' },
  tipCard: { backgroundColor: theme.card, borderRadius: 16, padding: 18, borderWidth: 1, borderColor: theme.border, marginBottom: 12 },
  tipHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  tipBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, borderWidth: 1 },
  tipBadgeText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
  tipTime: { color: theme.textTertiary, fontSize: 12 },
  tipTitle: { color: '#fff', fontSize: 18, fontWeight: '800', marginBottom: 6, letterSpacing: -0.3 },
  tipText: { color: theme.textSecondary, fontSize: 15, lineHeight: 22 },
});
