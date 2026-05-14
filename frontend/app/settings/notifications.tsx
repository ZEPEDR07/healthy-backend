import React from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/auth';
import { theme } from '../../src/theme';
import { t } from '../../src/i18n';

export default function NotifPrefs() {
  const router = useRouter();
  const { prefs, setPrefs } = useAuth();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity testID="prefs-back-btn" onPress={() => router.back()} style={styles.back}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>{t('notifications.title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          <Row
            label={t('notifications.enabled')}
            value={prefs.notifications_enabled}
            onChange={(v) => setPrefs({ notifications_enabled: v })}
            icon="notifications"
          />
          <Row
            label={t('notifications.dailyRecovery')}
            value={prefs.daily_recovery_reminder}
            onChange={(v) => setPrefs({ daily_recovery_reminder: v })}
            icon="pulse"
            disabled={!prefs.notifications_enabled}
          />
          <Row
            label={t('notifications.sleepReminder')}
            value={prefs.sleep_reminder}
            onChange={(v) => setPrefs({ sleep_reminder: v })}
            icon="moon"
            disabled={!prefs.notifications_enabled}
          />
          <Row
            label={t('notifications.workoutReminder')}
            value={prefs.workout_reminder}
            onChange={(v) => setPrefs({ workout_reminder: v })}
            icon="barbell"
            disabled={!prefs.notifications_enabled}
            last
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, value, onChange, icon, disabled, last }: { label: string; value: boolean; onChange: (v: boolean) => void; icon: any; disabled?: boolean; last?: boolean }) {
  return (
    <View style={[styles.row, last && { borderBottomWidth: 0 }]}>
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={18} color={disabled ? theme.textTertiary : theme.primary} />
      </View>
      <Text style={[styles.rowLabel, disabled && { color: theme.textTertiary }]}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        trackColor={{ false: theme.cardElevated, true: theme.primary }}
        thumbColor="#fff"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  back: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border },
  title: { color: '#fff', fontSize: 18, fontWeight: '800' },
  scroll: { padding: 16 },
  card: { backgroundColor: theme.card, borderRadius: 16, borderWidth: 1, borderColor: theme.border, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderBottomWidth: 1, borderBottomColor: theme.border },
  rowIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: theme.cardElevated, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { flex: 1, color: '#fff', fontSize: 14, fontWeight: '600' },
});
