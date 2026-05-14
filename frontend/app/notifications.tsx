import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { apiGet, apiPost } from '../src/api';
import { theme } from '../src/theme';
import { t } from '../src/i18n';

type Notif = {
  id: string;
  type: string;
  title: string;
  body: string;
  icon: string;
  color: string;
  created_at: string;
  read: boolean;
};

function colorFromKey(k: string) {
  const map: Record<string, string> = {
    primary: theme.primary,
    recovery: theme.recovery,
    sleep: theme.sleep,
    strain: theme.strain,
    stress: theme.stressOrange,
    premium: theme.premium,
  };
  return map[k] || theme.primary;
}

export default function Notifications() {
  const router = useRouter();
  const [items, setItems] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await apiGet<{ items: Notif[]; unread: number }>('/notifications');
      setItems(res.items);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const markRead = async (id: string) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    try { await apiPost('/notifications/read', { notification_id: id }); } catch {}
  };

  const markAll = async () => {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    try { await apiPost('/notifications/read', { mark_all: true }); } catch {}
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity testID="notif-back-btn" onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>{t('notifications.title')}</Text>
        <TouchableOpacity testID="notif-mark-all-btn" onPress={markAll} style={styles.iconBtn}>
          <Ionicons name="checkmark-done" size={20} color={theme.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {loading ? (
          <ActivityIndicator color={theme.primary} style={{ marginTop: 30 }} />
        ) : items.length === 0 ? (
          <View testID="notif-empty" style={styles.empty}>
            <Ionicons name="notifications-off-outline" size={48} color={theme.textTertiary} />
            <Text style={styles.emptyTitle}>{t('notifications.empty')}</Text>
            <Text style={styles.emptySub}>{t('notifications.emptySub')}</Text>
          </View>
        ) : (
          items.map((n) => {
            const c = colorFromKey(n.color);
            return (
              <TouchableOpacity
                key={n.id}
                testID={`notif-${n.id}`}
                style={[styles.notif, !n.read && styles.notifUnread]}
                onPress={() => markRead(n.id)}
                activeOpacity={0.8}
              >
                <View style={[styles.notifIcon, { backgroundColor: c + '22' }]}>
                  <Ionicons name={n.icon as any} size={20} color={c} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.notifHead}>
                    <Text style={styles.notifTitle}>{n.title}</Text>
                    {!n.read && <View style={[styles.unreadDot, { backgroundColor: c }]} />}
                  </View>
                  <Text style={styles.notifBody}>{n.body}</Text>
                  <Text style={styles.notifTime}>
                    {new Date(n.created_at).toLocaleString('pt-PT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}

        <TouchableOpacity
          testID="notif-preferences-btn"
          style={styles.prefsBtn}
          onPress={() => router.push('/settings/notifications')}
        >
          <Ionicons name="settings-outline" size={18} color="#fff" />
          <Text style={styles.prefsText}>{t('notifications.preferences')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingBottom: 8 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border },
  title: { color: '#fff', fontSize: 18, fontWeight: '800' },
  scroll: { padding: 16, paddingBottom: 32 },
  empty: { alignItems: 'center', marginTop: 60, paddingHorizontal: 24 },
  emptyTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginTop: 12 },
  emptySub: { color: theme.textSecondary, fontSize: 13, marginTop: 4, textAlign: 'center' },
  notif: { flexDirection: 'row', backgroundColor: theme.card, borderRadius: 14, padding: 14, gap: 12, marginBottom: 10, borderWidth: 1, borderColor: theme.border },
  notifUnread: { borderColor: theme.primary + '55' },
  notifIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  notifHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  notifTitle: { color: '#fff', fontSize: 14, fontWeight: '700', flex: 1 },
  notifBody: { color: theme.textSecondary, fontSize: 13, lineHeight: 18 },
  notifTime: { color: theme.textTertiary, fontSize: 11, marginTop: 6 },
  unreadDot: { width: 8, height: 8, borderRadius: 4 },
  prefsBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: theme.border, marginTop: 12 },
  prefsText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
