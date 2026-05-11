import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/auth';
import { theme } from '../src/theme';

const DEVICES = [
  { id: 'apple_watch', label: 'Apple Watch', icon: 'watch', sub: 'Series 6 ou superior' },
  { id: 'mi_band_7', label: 'Xiaomi Mi Band 7', icon: 'fitness', sub: 'Mi Smart Band 7 / 7 Pro' },
  { id: 'mi_band_8', label: 'Xiaomi Mi Band 8', icon: 'fitness', sub: 'Mi Smart Band 8 / 8 Pro' },
  { id: 'mi_band_9', label: 'Xiaomi Mi Band 9', icon: 'fitness', sub: 'Mi Smart Band 9 / 9 Pro' },
];

const GOALS = [
  { id: 'performance', label: 'Performance atlética' },
  { id: 'sleep', label: 'Melhorar sono' },
  { id: 'stress', label: 'Reduzir stress' },
  { id: 'weight', label: 'Gestão de peso' },
  { id: 'general', label: 'Saúde geral' },
];

const GENDERS = [
  { id: 'male', label: 'Masculino' },
  { id: 'female', label: 'Feminino' },
  { id: 'other', label: 'Outro' },
];

export default function Onboarding() {
  const router = useRouter();
  const { onboard, logout } = useAuth();
  const [step, setStep] = useState(0);
  const [devices, setDevices] = useState<string[]>([]);
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('male');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [goal, setGoal] = useState<string>('performance');
  const [loading, setLoading] = useState(false);

  const totalSteps = 4;

  const toggleDevice = (id: string) => {
    setDevices((prev) => (prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]));
  };

  const canNext = () => {
    if (step === 0) return true;
    if (step === 1) return !!age && !!height && !!weight;
    return true;
  };

  const finish = async () => {
    setLoading(true);
    try {
      await onboard({
        devices: devices.length ? devices : ['apple_watch'],
        age: age ? parseInt(age) : undefined,
        gender,
        height_cm: height ? parseInt(height) : undefined,
        weight_kg: weight ? parseFloat(weight) : undefined,
        goal,
      });
      router.replace('/(tabs)');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.header}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${((step + 1) / totalSteps) * 100}%` }]} />
          </View>
          <TouchableOpacity testID="onboarding-skip-btn" onPress={logout}>
            <Text style={styles.skip}>Sair</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {step === 0 && (
            <View testID="onboarding-step-1">
              <Text style={styles.eyebrow}>Passo 1 de {totalSteps}</Text>
              <Text style={styles.title}>Liga os teus dispositivos</Text>
              <Text style={styles.subtitle}>Apple Watch e qualquer Mi Band 7, 8 ou 9.</Text>
              {DEVICES.map((d) => {
                const active = devices.includes(d.id);
                return (
                  <TouchableOpacity
                    key={d.id}
                    testID={`device-${d.id}`}
                    style={[styles.deviceCard, active && styles.deviceCardActive]}
                    onPress={() => toggleDevice(d.id)}
                  >
                    <View style={[styles.deviceIcon, active && { backgroundColor: theme.primary }]}>
                      <Ionicons name={d.icon as any} size={20} color={active ? '#000' : '#fff'} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.deviceLabel}>{d.label}</Text>
                      <Text style={styles.deviceSub}>{d.sub}</Text>
                    </View>
                    <Ionicons
                      name={active ? 'checkmark-circle' : 'ellipse-outline'}
                      size={24}
                      color={active ? theme.primary : theme.textTertiary}
                    />
                  </TouchableOpacity>
                );
              })}
              <Text style={styles.demoNote}>Demo: dados simulados realistas. Em produção liga apps reais.</Text>
            </View>
          )}

          {step === 1 && (
            <View testID="onboarding-step-2">
              <Text style={styles.eyebrow}>Passo 2 de {totalSteps}</Text>
              <Text style={styles.title}>Conta-nos sobre ti</Text>
              <Text style={styles.subtitle}>Personalizamos cálculos e dicas com estes dados.</Text>

              <Text style={styles.label}>Idade</Text>
              <TextInput
                testID="onboarding-age-input"
                style={styles.input} keyboardType="number-pad"
                value={age} onChangeText={setAge} placeholder="25" placeholderTextColor={theme.textTertiary}
              />

              <Text style={styles.label}>Género</Text>
              <View style={styles.genderRow}>
                {GENDERS.map((g) => (
                  <TouchableOpacity
                    key={g.id}
                    testID={`gender-${g.id}`}
                    style={[styles.genderChip, gender === g.id && styles.genderChipActive]}
                    onPress={() => setGender(g.id)}
                  >
                    <Text style={[styles.genderText, gender === g.id && { color: '#000' }]}>{g.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.row2}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.label}>Altura (cm)</Text>
                  <TextInput
                    testID="onboarding-height-input"
                    style={styles.input} keyboardType="number-pad"
                    value={height} onChangeText={setHeight} placeholder="175" placeholderTextColor={theme.textTertiary}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.label}>Peso (kg)</Text>
                  <TextInput
                    testID="onboarding-weight-input"
                    style={styles.input} keyboardType="decimal-pad"
                    value={weight} onChangeText={setWeight} placeholder="70" placeholderTextColor={theme.textTertiary}
                  />
                </View>
              </View>
            </View>
          )}

          {step === 2 && (
            <View testID="onboarding-step-3">
              <Text style={styles.eyebrow}>Passo 3 de {totalSteps}</Text>
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

          {step === 3 && (
            <View testID="onboarding-step-4">
              <Text style={styles.eyebrow}>Passo 4 de {totalSteps}</Text>
              <Text style={styles.title}>Tudo pronto</Text>
              <Text style={styles.subtitle}>
                A semear 30 dias de dados. Vê recovery, sono, esforço, stress e nutrição num só ecrã.
              </Text>
              <View style={styles.summary}>
                <Text style={styles.sumLabel}>Dispositivos</Text>
                <Text style={styles.sumVal}>
                  {devices.length ? devices.map((d) => DEVICES.find((x) => x.id === d)?.label).join(', ') : 'Apple Watch'}
                </Text>
                <View style={styles.divider} />
                <Text style={styles.sumLabel}>Perfil</Text>
                <Text style={styles.sumVal}>{age || '--'} anos · {height || '--'}cm · {weight || '--'}kg</Text>
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
          {step < totalSteps - 1 ? (
            <TouchableOpacity
              testID="onboarding-next-btn"
              style={[styles.primaryBtn, { flex: 1 }, !canNext() && { opacity: 0.5 }]}
              onPress={() => canNext() && setStep((s) => s + 1)}
              disabled={!canNext()}
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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.bg },
  header: { flexDirection: 'row', alignItems: 'center', padding: 24, paddingBottom: 8, gap: 16 },
  progressBar: { flex: 1, height: 4, backgroundColor: theme.cardElevated, borderRadius: 2 },
  progressFill: { height: 4, backgroundColor: theme.primary, borderRadius: 2 },
  skip: { color: theme.textSecondary, fontSize: 14, fontWeight: '600' },
  scroll: { padding: 24, paddingTop: 16, paddingBottom: 16 },
  eyebrow: { color: theme.primary, fontSize: 12, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' },
  title: { color: '#fff', fontSize: 32, fontWeight: '800', marginTop: 8, letterSpacing: -0.5 },
  subtitle: { color: theme.textSecondary, fontSize: 15, marginTop: 8, marginBottom: 24, lineHeight: 22 },
  label: { color: theme.textSecondary, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.2, marginTop: 12, marginBottom: 8 },
  input: { backgroundColor: theme.card, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, color: '#fff', borderWidth: 1, borderColor: theme.border, fontSize: 16 },
  row2: { flexDirection: 'row' },
  genderRow: { flexDirection: 'row', gap: 8 },
  genderChip: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.card },
  genderChipActive: { backgroundColor: theme.primary, borderColor: theme.primary },
  genderText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  deviceCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, backgroundColor: theme.card, borderRadius: 16, borderWidth: 1, borderColor: theme.border, marginBottom: 10 },
  deviceCardActive: { borderColor: theme.primary },
  deviceIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: theme.cardElevated, alignItems: 'center', justifyContent: 'center' },
  deviceLabel: { color: '#fff', fontSize: 15, fontWeight: '700' },
  deviceSub: { color: theme.textSecondary, fontSize: 12, marginTop: 2 },
  demoNote: { color: theme.textTertiary, fontSize: 12, marginTop: 12, textAlign: 'center' },
  goalCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.card, marginBottom: 10 },
  goalCardActive: { backgroundColor: theme.primary, borderColor: theme.primary },
  goalLabel: { color: '#fff', fontSize: 16, fontWeight: '600' },
  summary: { backgroundColor: theme.card, borderRadius: 16, padding: 18, borderWidth: 1, borderColor: theme.border, marginTop: 12 },
  sumLabel: { color: theme.textSecondary, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.2 },
  sumVal: { color: '#fff', fontSize: 16, fontWeight: '600', marginTop: 4 },
  divider: { height: 1, backgroundColor: theme.border, marginVertical: 12 },
  footer: { flexDirection: 'row', padding: 24, gap: 12 },
  primaryBtn: { backgroundColor: theme.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  primaryText: { color: '#000', fontSize: 16, fontWeight: '800' },
  secondaryBtn: { paddingHorizontal: 22, paddingVertical: 16, borderRadius: 14, borderWidth: 1, borderColor: theme.border, alignItems: 'center' },
  secondaryText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
