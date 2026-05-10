import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/auth';
import { theme } from '../src/theme';

const DEVICES = [
  { id: 'apple_watch', label: 'Apple Watch', icon: 'watch' as const, sub: 'Series 6 ou superior' },
  { id: 'mi_band_8', label: 'Xiaomi Mi Band 8', icon: 'fitness' as const, sub: 'Smart Band 8 / 8 Pro' },
];

const GOALS = [
  { id: 'performance', label: 'Performance atlética' },
  { id: 'sleep', label: 'Melhorar sono' },
  { id: 'stress', label: 'Reduzir stress' },
  { id: 'general', label: 'Saúde geral' },
];

export default function Onboarding() {
  const router = useRouter();
  const { onboard, logout } = useAuth();
  const [step, setStep] = useState(0);
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  const [goal, setGoal] = useState<string>('performance');
  const [loading, setLoading] = useState(false);

  const toggleDevice = (id: string) => {
    setSelectedDevices((prev) => (prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]));
  };

  const finish = async () => {
    setLoading(true);
    try {
      await onboard(selectedDevices.length ? selectedDevices : ['apple_watch'], { goal });
      router.replace('/(tabs)');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${(step + 1) * 33.3}%` }]} />
        </View>
        <TouchableOpacity testID="onboarding-skip-btn" onPress={logout}>
          <Text style={styles.skip}>Sair</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {step === 0 && (
          <View testID="onboarding-step-1">
            <Text style={styles.eyebrow}>Passo 1 de 3</Text>
            <Text style={styles.title}>Liga os teus dispositivos</Text>
            <Text style={styles.subtitle}>Vamos sincronizar os teus dados de sono, batimento e atividade.</Text>

            {DEVICES.map((d) => {
              const active = selectedDevices.includes(d.id);
              return (
                <TouchableOpacity
                  key={d.id}
                  testID={`device-${d.id}`}
                  style={[styles.deviceCard, active && styles.deviceCardActive]}
                  onPress={() => toggleDevice(d.id)}
                >
                  <View style={[styles.deviceIcon, active && { backgroundColor: theme.recovery }]}>
                    <Ionicons name={d.icon} size={22} color={active ? '#000' : '#fff'} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.deviceLabel}>{d.label}</Text>
                    <Text style={styles.deviceSub}>{d.sub}</Text>
                  </View>
                  <Ionicons
                    name={active ? 'checkmark-circle' : 'ellipse-outline'}
                    size={26}
                    color={active ? theme.recovery : theme.textTertiary}
                  />
                </TouchableOpacity>
              );
            })}
            <Text style={styles.demoNote}>Os dados são simulados em demo. Liga apps reais em produção.</Text>
          </View>
        )}

        {step === 1 && (
          <View testID="onboarding-step-2">
            <Text style={styles.eyebrow}>Passo 2 de 3</Text>
            <Text style={styles.title}>Qual o teu objetivo?</Text>
            <Text style={styles.subtitle}>Vamos ajustar as dicas e métricas em destaque.</Text>
            {GOALS.map((g) => {
              const active = goal === g.id;
              return (
                <TouchableOpacity
                  key={g.id}
                  testID={`goal-${g.id}`}
                  style={[styles.goalCard, active && styles.goalCardActive]}
                  onPress={() => setGoal(g.id)}
                >
                  <Text style={[styles.goalLabel, active && { color: '#000' }]}>{g.label}</Text>
                  {active && <Ionicons name="checkmark" size={22} color="#000" />}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {step === 2 && (
          <View testID="onboarding-step-3">
            <Text style={styles.eyebrow}>Passo 3 de 3</Text>
            <Text style={styles.title}>Tudo pronto</Text>
            <Text style={styles.subtitle}>
              Os teus primeiros 30 dias de dados estão a ser gerados. Vê a tua recuperação, sono, esforço e stress no painel.
            </Text>
            <View style={styles.summary}>
              <Text style={styles.sumLabel}>Dispositivos</Text>
              <Text style={styles.sumVal}>
                {selectedDevices.length ? selectedDevices.map((d) => DEVICES.find((x) => x.id === d)?.label).join(', ') : 'Apple Watch'}
              </Text>
              <View style={styles.divider} />
              <Text style={styles.sumLabel}>Objetivo</Text>
              <Text style={styles.sumVal}>{GOALS.find((g) => g.id === goal)?.label}</Text>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        {step > 0 && (
          <TouchableOpacity
            testID="onboarding-back-btn"
            style={styles.secondaryBtn}
            onPress={() => setStep((s) => s - 1)}
          >
            <Text style={styles.secondaryText}>Voltar</Text>
          </TouchableOpacity>
        )}
        {step < 2 ? (
          <TouchableOpacity
            testID="onboarding-next-btn"
            style={[styles.primaryBtn, { flex: 1 }]}
            onPress={() => setStep((s) => s + 1)}
          >
            <Text style={styles.primaryText}>Continuar</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            testID="onboarding-finish-btn"
            style={[styles.primaryBtn, { flex: 1 }, loading && { opacity: 0.6 }]}
            onPress={finish}
            disabled={loading}
          >
            <Text style={styles.primaryText}>{loading ? 'A preparar...' : 'Entrar no painel'}</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.bg },
  header: { flexDirection: 'row', alignItems: 'center', padding: 24, paddingBottom: 8, gap: 16 },
  progressBar: { flex: 1, height: 4, backgroundColor: theme.cardElevated, borderRadius: 2 },
  progressFill: { height: 4, backgroundColor: theme.recovery, borderRadius: 2 },
  skip: { color: theme.textSecondary, fontSize: 14, fontWeight: '600' },
  scroll: { padding: 24, paddingTop: 16, paddingBottom: 16 },
  eyebrow: { color: theme.recovery, fontSize: 12, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' },
  title: { color: '#fff', fontSize: 32, fontWeight: '800', marginTop: 8, letterSpacing: -0.5 },
  subtitle: { color: theme.textSecondary, fontSize: 15, marginTop: 8, marginBottom: 24, lineHeight: 22 },
  deviceCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18,
    backgroundColor: theme.card, borderRadius: 16, borderWidth: 1, borderColor: theme.border, marginBottom: 12,
  },
  deviceCardActive: { borderColor: theme.recovery },
  deviceIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: theme.cardElevated, alignItems: 'center', justifyContent: 'center' },
  deviceLabel: { color: '#fff', fontSize: 16, fontWeight: '700' },
  deviceSub: { color: theme.textSecondary, fontSize: 13, marginTop: 2 },
  demoNote: { color: theme.textTertiary, fontSize: 12, marginTop: 12, textAlign: 'center' },
  goalCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 18, borderRadius: 16, borderWidth: 1, borderColor: theme.border,
    backgroundColor: theme.card, marginBottom: 12,
  },
  goalCardActive: { backgroundColor: theme.recovery, borderColor: theme.recovery },
  goalLabel: { color: '#fff', fontSize: 16, fontWeight: '600' },
  summary: { backgroundColor: theme.card, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: theme.border, marginTop: 12 },
  sumLabel: { color: theme.textSecondary, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.2 },
  sumVal: { color: '#fff', fontSize: 16, fontWeight: '600', marginTop: 4 },
  divider: { height: 1, backgroundColor: theme.border, marginVertical: 14 },
  footer: { flexDirection: 'row', padding: 24, gap: 12 },
  primaryBtn: { backgroundColor: '#fff', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  primaryText: { color: '#000', fontSize: 16, fontWeight: '700' },
  secondaryBtn: { paddingHorizontal: 22, paddingVertical: 16, borderRadius: 14, borderWidth: 1, borderColor: theme.border, alignItems: 'center' },
  secondaryText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
