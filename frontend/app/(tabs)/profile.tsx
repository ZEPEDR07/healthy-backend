import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/auth';
import { theme } from '../../src/theme';

const DEVICE_LABELS: Record<string, string> = {
  apple_watch: 'Apple Watch',
  mi_band_7: 'Xiaomi Mi Band 7',
  mi_band_8: 'Xiaomi Mi Band 8',
  mi_band_9: 'Xiaomi Mi Band 9',
};

const GOAL_LABELS: Record<string, string> = {
  performance: 'Performance atlética',
  sleep: 'Melhorar sono',
  stress: 'Reduzir stress',
  weight: 'Gestão de peso',
  general: 'Saúde geral',
};

export default function Profile() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const doLogout = async () => {
    await logout();
    router.replace('/welcome');
  };

  const confirmLogout = () => {
    if (Platform.OS === 'web') {
      const ok = typeof window !== 'undefined' && window.confirm('Tens a certeza que queres sair?');
      if (ok) doLogout();
      return;
    }
    Alert.alert('Sair', 'Tens a certeza?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: doLogout },
    ]);
  };

  const initials = (user?.name || 'U').split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();
  const premiumActive = user?.premium_active;
  const isLifetime = user?.premium_status === 'lifetime';
  const trialEnd = user?.trial_end ? new Date(user.trial_end) : null;
  const daysLeft = trialEnd ? Math.max(0, Math.ceil((trialEnd.getTime() - Date.now()) / 86400000)) : 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.headerCard}>
          <View style={styles.avatarBig}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text testID="profile-name" style={styles.name}>{user?.name || 'Atleta'}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          {premiumActive ? (
            <View style={styles.memberPill}>
              <Ionicons name="star" size={12} color={theme.premium} />
              <Text style={styles.memberText}>
                {isLifetime ? 'Premium vitalício' : `Trial · ${daysLeft}d`}
              </Text>
            </View>
          ) : (
            <TouchableOpacity testID="profile-upgrade-btn" style={styles.upgradePill} onPress={() => router.push('/premium')}>
              <Ionicons name="star-outline" size={12} color="#000" />
              <Text style={styles.upgradeText}>Upgrade Premium</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* HEALTH PROFILE */}
        <Text style={styles.sectionLabel}>Dados de saúde</Text>
        <View style={styles.section}>
          <DataRow label="Idade" value={user?.age ? `${user.age}` : '—'} icon="calendar" />
          <DataRow label="Altura" value={user?.height_cm ? `${user.height_cm} cm` : '—'} icon="resize" />
          <DataRow label="Peso" value={user?.weight_kg ? `${user.weight_kg} kg` : '—'} icon="barbell" />
          <DataRow
            label="Género"
            value={user?.gender === 'male' ? 'Masculino' : user?.gender === 'female' ? 'Feminino' : user?.gender || '—'}
            icon="person"
          />
          <DataRow label="Objetivo" value={user?.goal ? (GOAL_LABELS[user.goal] || user.goal) : '—'} icon="trophy" last />
        </View>

        {/* DEVICES */}
        <Text style={styles.sectionLabel}>Dispositivos ligados</Text>
        <View style={styles.section}>
          {(user?.devices?.length ? user.devices : ['apple_watch']).map((d, idx, arr) => (
            <View key={d} style={[styles.row, idx === arr.length - 1 && { borderBottomWidth: 0 }]}>
              <View style={styles.rowIcon}>
                <Ionicons name={d.startsWith('mi_band') ? 'fitness' : 'watch'} size={18} color={theme.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowLabel}>{DEVICE_LABELS[d] || d}</Text>
                <Text style={styles.rowSub}>Sincronizado · {new Date().toLocaleDateString('pt-PT')}</Text>
              </View>
              <View style={styles.statusDot} />
            </View>
          ))}
        </View>

        {/* SETTINGS */}
        <Text style={styles.sectionLabel}>Definições</Text>
        <View style={styles.section}>
          <TouchableOpacity testID="profile-premium-row" onPress={() => router.push('/premium')} style={styles.row}>
            <View style={[styles.rowIcon, { backgroundColor: theme.premium + '22' }]}>
              <Ionicons name="star" size={18} color={theme.premium} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>Pulse Premium</Text>
              <Text style={styles.rowSub}>Gerir subscrição e códigos</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.textTertiary} />
          </TouchableOpacity>
          <SettingRow icon="notifications-outline" label="Notificações" sub="Lembretes e alertas" />
          <SettingRow icon="lock-closed-outline" label="Privacidade" sub="Dados e permissões" />
          <SettingRow icon="speedometer-outline" label="Unidades" sub="Métrico" />
          <SettingRow icon="help-circle-outline" label="Ajuda & Suporte" sub="FAQ e contacto" last />
        </View>

        <TouchableOpacity testID="profile-logout-btn" style={styles.logoutBtn} onPress={confirmLogout}>
          <Ionicons name="log-out-outline" size={20} color={theme.stressRed} />
          <Text style={styles.logoutText}>Terminar sessão</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Pulse · v1.1 · Recovery OS</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function DataRow({ label, value, icon, last }: { label: string; value: string; icon: any; last?: boolean }) {
  return (
    <View style={[styles.row, last && { borderBottomWidth: 0 }]}>
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={18} color={theme.primary} />
      </View>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

function SettingRow({ icon, label, sub, last }: { icon: any; label: string; sub: string; last?: boolean }) {
  return (
    <TouchableOpacity style={[styles.row, last && { borderBottomWidth: 0 }]} activeOpacity={0.7}>
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={18} color={theme.text} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowSub}>{sub}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={theme.textTertiary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.bg },
  scroll: { padding: 20, paddingBottom: 40 },
  headerCard: {
    alignItems: 'center', backgroundColor: theme.card, borderRadius: 20, padding: 22,
    borderWidth: 1, borderColor: theme.border, marginBottom: 22,
  },
  avatarBig: { width: 80, height: 80, borderRadius: 40, backgroundColor: theme.cardElevated, alignItems: 'center', justifyContent: 'center', marginBottom: 12, borderWidth: 2, borderColor: theme.primary },
  avatarText: { color: '#fff', fontSize: 26, fontWeight: '800' },
  name: { color: '#fff', fontSize: 22, fontWeight: '800' },
  email: { color: theme.textSecondary, fontSize: 14, marginTop: 2 },
  memberPill: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: theme.premium + '22', borderRadius: 999, borderWidth: 1, borderColor: theme.premium + '66' },
  memberText: { color: theme.premium, fontSize: 12, fontWeight: '800' },
  upgradePill: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: theme.primary, borderRadius: 999 },
  upgradeText: { color: '#000', fontSize: 12, fontWeight: '800' },
  sectionLabel: { color: theme.textSecondary, fontSize: 11, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10, marginLeft: 4 },
  section: { backgroundColor: theme.card, borderRadius: 16, borderWidth: 1, borderColor: theme.border, marginBottom: 22, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderBottomWidth: 1, borderBottomColor: theme.border },
  rowIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: theme.cardElevated, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { color: '#fff', fontSize: 14, fontWeight: '600', flex: 1 },
  rowSub: { color: theme.textSecondary, fontSize: 12, marginTop: 2 },
  rowValue: { color: theme.primary, fontSize: 14, fontWeight: '700' },
  statusDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: theme.recovery },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, borderRadius: 14, borderWidth: 1, borderColor: theme.stressRed + '55' },
  logoutText: { color: theme.stressRed, fontSize: 15, fontWeight: '700' },
  version: { color: theme.textTertiary, fontSize: 12, textAlign: 'center', marginTop: 22 },
});
