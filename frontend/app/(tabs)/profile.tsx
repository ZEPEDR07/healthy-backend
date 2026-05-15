import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/auth';
import { theme } from '../../src/theme';
import { t, formatHeight, formatWeight } from '../../src/i18n';

const DEVICE_LABELS: Record<string, string> = {
  apple_watch: 'Apple Watch',
  mi_band_7: 'Xiaomi Mi Band 7',
  mi_band_8: 'Xiaomi Mi Band 8',
  mi_band_9: 'Xiaomi Mi Band 9',
};

export default function Profile() {
  const router = useRouter();
  const { user, prefs, logout } = useAuth();

  const doLogout = async () => {
    await logout();
    router.replace('/welcome');
  };

  const confirmLogout = () => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(t('profile.logoutConfirm'))) doLogout();
      return;
    }
    Alert.alert(t('profile.logout'), t('profile.logoutConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('profile.logout'), style: 'destructive', onPress: doLogout },
    ]);
  };

  const initials = (user?.name || 'U').split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();
  const premiumActive = user?.premium_active;
  const isLifetime = user?.premium_status === 'lifetime';
  const trialEnd = user?.trial_end ? new Date(user.trial_end) : null;
  const daysLeft = trialEnd ? Math.max(0, Math.ceil((trialEnd.getTime() - Date.now()) / 86400000)) : 0;

  const langFlag = { pt: '🇵🇹', en: '🇬🇧', es: '🇪🇸', fr: '🇫🇷' }[prefs.language] || '🇵🇹';

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
                {isLifetime ? t('profile.premium') : `Trial · ${daysLeft}d`}
              </Text>
            </View>
          ) : (
            <TouchableOpacity testID="profile-upgrade-btn" style={styles.upgradePill} onPress={() => router.push('/premium')}>
              <Ionicons name="star-outline" size={12} color="#000" />
              <Text style={styles.upgradeText}>Premium</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* HEALTH DATA */}
        <Text style={styles.sectionLabel}>{t('profile.health')}</Text>
        <View style={styles.section}>
          <DataRow label={t('profile.age')} value={user?.age ? `${user.age}` : '—'} icon="calendar" />
          <DataRow label={t('profile.height')} value={formatHeight(user?.height_cm, prefs.units)} icon="resize" />
          <DataRow label={t('profile.weight')} value={formatWeight(user?.weight_kg, prefs.units)} icon="barbell" />
          <DataRow
            label={t('profile.gender')}
            value={user?.gender ? t(`profile.${user.gender}`) : '—'}
            icon="person"
          />
          <DataRow label={t('profile.goal')} value={user?.goal || '—'} icon="trophy" last />
        </View>

        {/* DEVICES */}
        <Text style={styles.sectionLabel}>{t('profile.devices')}</Text>
        <View style={styles.section}>
          {(user?.devices?.length ? user.devices : []).map((d) => (
            <View key={d} style={styles.row}>
              <View style={styles.rowIcon}>
                <Ionicons name={d.startsWith('mi_band') ? 'fitness' : 'watch'} size={18} color={theme.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowLabel}>{DEVICE_LABELS[d] || d}</Text>
                <Text style={styles.rowSub}>{t('profile.synced')}</Text>
              </View>
              <View style={styles.statusDot} />
            </View>
          ))}
          <TouchableOpacity testID="manage-devices" style={[styles.row, { borderBottomWidth: 0 }]} onPress={() => router.push('/settings/devices')}>
            <View style={styles.rowIcon}>
              <Ionicons name="add-circle" size={20} color={theme.primary} />
            </View>
            <Text style={[styles.rowLabel, { color: theme.primary }]}>{t('profile.addDevice')}</Text>
            <Ionicons name="chevron-forward" size={18} color={theme.textTertiary} />
          </TouchableOpacity>
        </View>

        {/* SETTINGS */}
        <Text style={styles.sectionLabel}>{t('profile.settings')}</Text>
        <View style={styles.section}>
          <SettingRow testID="settings-edit-profile" icon="person-circle-outline" label={t('profile.editProfile')} onPress={() => router.push('/settings/edit-profile')} />
          <SettingRow testID="settings-premium" icon="star" iconColor={theme.premium} label={t('profile.premium')} onPress={() => router.push('/premium')} />
          <SettingRow testID="settings-notifications" icon="notifications-outline" label={t('profile.notifications')} onPress={() => router.push('/settings/notifications')} />
          <SettingRow testID="settings-units" icon="speedometer-outline" label={t('profile.units')} hint={prefs.units === 'metric' ? 'cm · kg · km' : 'in · lb · mi'} onPress={() => router.push('/settings/units')} />
          <SettingRow testID="settings-language" icon="language-outline" label={t('profile.language')} hint={`${langFlag}`} onPress={() => router.push('/settings/language')} />
          <SettingRow testID="settings-help" icon="help-circle-outline" label={t('profile.help')} onPress={() => router.push('/settings/help')} last />
        </View>

        <TouchableOpacity testID="profile-logout-btn" style={styles.logoutBtn} onPress={confirmLogout}>
          <Ionicons name="log-out-outline" size={20} color={theme.stressRed} />
          <Text style={styles.logoutText}>{t('profile.logout')}</Text>
        </TouchableOpacity>

        <Text style={styles.version}>{t('profile.version')}</Text>
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

function SettingRow({ testID, icon, iconColor, label, hint, onPress, last }: { testID?: string; icon: any; iconColor?: string; label: string; hint?: string; onPress: () => void; last?: boolean }) {
  return (
    <TouchableOpacity testID={testID} style={[styles.row, last && { borderBottomWidth: 0 }]} activeOpacity={0.7} onPress={onPress}>
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={18} color={iconColor || '#fff'} />
      </View>
      <Text style={[styles.rowLabel, { flex: 1 }]}>{label}</Text>
      {hint && <Text style={styles.rowHint}>{hint}</Text>}
      <Ionicons name="chevron-forward" size={18} color={theme.textTertiary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.bg },
  scroll: { padding: 20, paddingBottom: 40 },
  headerCard: { alignItems: 'center', backgroundColor: theme.card, borderRadius: 20, padding: 22, borderWidth: 1, borderColor: theme.border, marginBottom: 22 },
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
  rowLabel: { color: '#fff', fontSize: 14, fontWeight: '600' },
  rowSub: { color: theme.textSecondary, fontSize: 12, marginTop: 2 },
  rowValue: { color: theme.primary, fontSize: 14, fontWeight: '700' },
  rowHint: { color: theme.textSecondary, fontSize: 13, marginRight: 6 },
  statusDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: theme.recovery },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, borderRadius: 14, borderWidth: 1, borderColor: theme.stressRed + '55' },
  logoutText: { color: theme.stressRed, fontSize: 15, fontWeight: '700' },
  version: { color: theme.textTertiary, fontSize: 12, textAlign: 'center', marginTop: 22 },
});
