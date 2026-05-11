import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/auth';
import { theme } from '../src/theme';

const FEATURES = [
  { icon: 'sparkles' as const, title: 'Coach IA ilimitado', sub: 'Dicas longas, multi-passo, semanais' },
  { icon: 'restaurant' as const, title: 'Fotos de comida ilimitadas', sub: 'Análise IA de macros sem limite' },
  { icon: 'stats-chart' as const, title: 'Histórico estendido', sub: '12 meses de dados acessíveis' },
  { icon: 'flask' as const, title: 'Relatórios Biology', sub: 'Tendências HRV, RHR, performance' },
  { icon: 'pulse' as const, title: 'Métricas avançadas', sub: 'Strain por sessão, HR zones detalhadas' },
];

export default function Premium() {
  const router = useRouter();
  const { user, loading, startTrial, redeemCode } = useAuth();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState<'trial' | 'redeem' | null>(null);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: theme.textSecondary }}>A carregar...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const onStartTrial = async () => {
    setBusy('trial');
    try {
      await startTrial();
      Alert.alert('Trial ativado!', '15 dias de premium gratuitos. Sem cartão.');
      router.back();
    } catch (e: any) {
      Alert.alert('Erro', e.message || 'Falha ao iniciar trial.');
    } finally {
      setBusy(null);
    }
  };

  const onRedeem = async () => {
    if (!code.trim()) {
      Alert.alert('Erro', 'Insere um código.');
      return;
    }
    setBusy('redeem');
    try {
      await redeemCode(code.trim());
      Alert.alert('🎉 Sucesso!', 'Premium vitalício desbloqueado.');
      router.back();
    } catch (e: any) {
      Alert.alert('Código inválido', e.message || 'Verifica o código e tenta novamente.');
    } finally {
      setBusy(null);
    }
  };

  const trialEnd = user?.trial_end ? new Date(user.trial_end) : null;
  const daysLeft = trialEnd ? Math.max(0, Math.ceil((trialEnd.getTime() - Date.now()) / 86400000)) : 0;

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.headRow}>
            <TouchableOpacity testID="premium-close-btn" onPress={() => router.back()} style={styles.closeBtn}>
              <Ionicons name="close" size={26} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headTag}>PULSE PREMIUM</Text>
            <View style={{ width: 26 }} />
          </View>

          <View style={styles.hero}>
            <View style={styles.heroIcon}>
              <Ionicons name="star" size={28} color={theme.premium} />
            </View>
            <Text style={styles.heroTitle}>Desbloqueia o teu potencial</Text>
            <Text style={styles.heroSub}>Coach IA completo, nutrição ilimitada e relatórios profundos.</Text>
          </View>

          {/* CURRENT STATUS */}
          {user?.premium_active ? (
            <View style={styles.statusActive}>
              <Ionicons name="checkmark-circle" size={22} color={theme.recovery} />
              <View style={{ flex: 1 }}>
                <Text style={styles.statusActiveTitle}>
                  {user.premium_status === 'lifetime' ? 'Premium vitalício ativo' : `Trial ativo · ${daysLeft} dias`}
                </Text>
                <Text style={styles.statusActiveSub}>
                  {user.premium_status === 'lifetime' ? 'Acesso para sempre' : 'Aproveita tudo enquanto durar'}
                </Text>
              </View>
            </View>
          ) : null}

          {/* FEATURES */}
          <View style={styles.features}>
            {FEATURES.map((f) => (
              <View key={f.title} style={styles.featureRow}>
                <View style={styles.featureIcon}>
                  <Ionicons name={f.icon} size={18} color={theme.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.featureTitle}>{f.title}</Text>
                  <Text style={styles.featureSub}>{f.sub}</Text>
                </View>
                <Ionicons name="checkmark" size={20} color={theme.recovery} />
              </View>
            ))}
          </View>

          {/* TRIAL CTA */}
          {!user?.premium_active && (
            <TouchableOpacity
              testID="premium-trial-btn"
              style={[styles.trialBtn, busy === 'trial' && { opacity: 0.6 }]}
              onPress={onStartTrial}
              disabled={busy !== null}
            >
              <Text style={styles.trialBtnText}>{busy === 'trial' ? 'A ativar...' : 'Iniciar trial de 15 dias'}</Text>
              <Text style={styles.trialBtnSub}>Sem cartão de crédito · Cancela quando quiseres</Text>
            </TouchableOpacity>
          )}

          {/* CODE */}
          <Text style={styles.codeLabel}>Tens um código promocional?</Text>
          <View style={styles.codeRow}>
            <TextInput
              testID="premium-code-input"
              style={styles.codeInput}
              value={code}
              onChangeText={(t) => setCode(t.toUpperCase())}
              placeholder="EX: HEALTHY"
              placeholderTextColor={theme.textTertiary}
              autoCapitalize="characters"
              autoCorrect={false}
            />
            <TouchableOpacity
              testID="premium-redeem-btn"
              style={[styles.redeemBtn, busy === 'redeem' && { opacity: 0.6 }]}
              onPress={onRedeem}
              disabled={busy !== null}
            >
              <Text style={styles.redeemBtnText}>Resgatar</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.legal}>
            Os trials ativados são vinculados à conta. Códigos de parceiros (ex: HEALTHY) concedem premium vitalício.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.bg },
  scroll: { padding: 20, paddingBottom: 40 },
  headRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border },
  headTag: { color: theme.premium, fontSize: 12, fontWeight: '800', letterSpacing: 2 },
  hero: { alignItems: 'center', marginBottom: 20 },
  heroIcon: { width: 64, height: 64, borderRadius: 16, backgroundColor: theme.premium + '1A', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.premium + '55', marginBottom: 14 },
  heroTitle: { color: '#fff', fontSize: 26, fontWeight: '800', letterSpacing: -0.5, textAlign: 'center' },
  heroSub: { color: theme.textSecondary, fontSize: 14, marginTop: 8, textAlign: 'center', lineHeight: 20 },
  statusActive: { flexDirection: 'row', gap: 12, alignItems: 'center', padding: 14, backgroundColor: theme.recovery + '1A', borderRadius: 14, borderWidth: 1, borderColor: theme.recovery + '55', marginBottom: 18 },
  statusActiveTitle: { color: '#fff', fontSize: 14, fontWeight: '700' },
  statusActiveSub: { color: theme.textSecondary, fontSize: 12, marginTop: 2 },
  features: { backgroundColor: theme.card, borderRadius: 16, padding: 6, borderWidth: 1, borderColor: theme.border, marginBottom: 22 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14 },
  featureIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: theme.primary + '22', alignItems: 'center', justifyContent: 'center' },
  featureTitle: { color: '#fff', fontSize: 14, fontWeight: '700' },
  featureSub: { color: theme.textSecondary, fontSize: 12, marginTop: 2 },
  trialBtn: { backgroundColor: theme.primary, borderRadius: 14, padding: 18, alignItems: 'center', marginBottom: 22 },
  trialBtnText: { color: '#000', fontSize: 17, fontWeight: '800' },
  trialBtnSub: { color: '#00000099', fontSize: 12, fontWeight: '600', marginTop: 4 },
  codeLabel: { color: theme.textSecondary, fontSize: 12, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 10 },
  codeRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  codeInput: { flex: 1, backgroundColor: theme.card, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, color: '#fff', borderWidth: 1, borderColor: theme.border, fontSize: 16, letterSpacing: 2, fontWeight: '700' },
  redeemBtn: { paddingHorizontal: 20, paddingVertical: 14, borderRadius: 12, backgroundColor: theme.premium, alignItems: 'center', justifyContent: 'center' },
  redeemBtnText: { color: '#000', fontSize: 14, fontWeight: '800' },
  legal: { color: theme.textTertiary, fontSize: 11, textAlign: 'center', lineHeight: 16 },
});
