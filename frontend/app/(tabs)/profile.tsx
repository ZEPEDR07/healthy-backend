import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/auth';
import { theme } from '../../src/theme';

const DEVICE_LABELS: Record<string, string> = {
  apple_watch: 'Apple Watch',
  mi_band_8: 'Xiaomi Mi Band 8',
};

export default function Profile() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const confirmLogout = () => {
    Alert.alert('Sair', 'Tens a certeza?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/welcome');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.headerCard}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1768036479485-6127b351b0c5?crop=entropy&cs=srgb&fm=jpg&w=200&q=80' }}
            style={styles.avatar}
          />
          <Text testID="profile-name" style={styles.name}>{user?.name || 'Atleta'}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          <View style={styles.memberPill}>
            <Ionicons name="star" size={12} color={theme.recovery} />
            <Text style={styles.memberText}>Pulse · Membro</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Dispositivos ligados</Text>
        <View style={styles.section}>
          {(user?.devices?.length ? user.devices : ['apple_watch']).map((d) => (
            <View key={d} style={styles.row}>
              <View style={styles.rowIcon}>
                <Ionicons name={d === 'mi_band_8' ? 'fitness' : 'watch'} size={20} color={theme.recovery} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowLabel}>{DEVICE_LABELS[d] || d}</Text>
                <Text style={styles.rowSub}>Sincronizado · {new Date().toLocaleDateString('pt-PT')}</Text>
              </View>
              <View style={styles.statusDot} />
            </View>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Definições</Text>
        <View style={styles.section}>
          <SettingRow icon="notifications-outline" label="Notificações" sub="Lembretes e alertas" />
          <SettingRow icon="lock-closed-outline" label="Privacidade" sub="Dados e permissões" />
          <SettingRow icon="speedometer-outline" label="Unidades" sub="Métrico" />
          <SettingRow icon="help-circle-outline" label="Ajuda & Suporte" sub="FAQ e contacto" last />
        </View>

        <TouchableOpacity testID="profile-logout-btn" style={styles.logoutBtn} onPress={confirmLogout}>
          <Ionicons name="log-out-outline" size={20} color={theme.stressRed} />
          <Text style={styles.logoutText}>Terminar sessão</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Pulse · v1.0 · Recovery OS</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingRow({ icon, label, sub, last }: { icon: any; label: string; sub: string; last?: boolean }) {
  return (
    <TouchableOpacity style={[styles.row, last && { borderBottomWidth: 0 }]} activeOpacity={0.7}>
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={20} color={theme.text} />
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
    alignItems: 'center', backgroundColor: theme.card, borderRadius: 20, padding: 24,
    borderWidth: 1, borderColor: theme.border, marginBottom: 22,
  },
  avatar: { width: 88, height: 88, borderRadius: 44, marginBottom: 12, borderWidth: 2, borderColor: theme.recovery },
  name: { color: '#fff', fontSize: 22, fontWeight: '800' },
  email: { color: theme.textSecondary, fontSize: 14, marginTop: 2 },
  memberPill: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: theme.recovery + '22', borderRadius: 999, borderWidth: 1, borderColor: theme.recovery + '66' },
  memberText: { color: theme.recovery, fontSize: 12, fontWeight: '700' },
  sectionLabel: { color: theme.textSecondary, fontSize: 11, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10, marginLeft: 4 },
  section: { backgroundColor: theme.card, borderRadius: 16, borderWidth: 1, borderColor: theme.border, marginBottom: 22, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderBottomWidth: 1, borderBottomColor: theme.border },
  rowIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: theme.cardElevated, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { color: '#fff', fontSize: 15, fontWeight: '600' },
  rowSub: { color: theme.textSecondary, fontSize: 12, marginTop: 2 },
  statusDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: theme.recovery },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    padding: 16, borderRadius: 14, borderWidth: 1, borderColor: theme.stressRed + '55',
  },
  logoutText: { color: theme.stressRed, fontSize: 15, fontWeight: '700' },
  version: { color: theme.textTertiary, fontSize: 12, textAlign: 'center', marginTop: 22 },
});
