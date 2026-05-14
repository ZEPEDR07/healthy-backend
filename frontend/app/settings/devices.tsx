import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Alert,
  TextInput, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/auth';
import { theme } from '../../src/theme';
import { t } from '../../src/i18n';
import { apiGet } from '../../src/api';

type Device = { id: string; brand: string; label: string; sub: string; category: string; icon: string };
type Category = { id: string; label_pt: string; label_en: string; label_es: string; label_fr: string; icon: string };
type Catalog = { categories: Category[]; devices: Device[]; by_category: Record<string, Device[]> };

// Fallback if backend not reachable
const FALLBACK_CATALOG: Catalog = {
  categories: [
    { id: 'smartwatch', label_pt: 'Relógios inteligentes', label_en: 'Smartwatches', label_es: 'Relojes', label_fr: 'Montres', icon: 'watch' },
    { id: 'fitness_band', label_pt: 'Pulseiras fitness', label_en: 'Fitness bands', label_es: 'Pulseras', label_fr: 'Bracelets', icon: 'fitness' },
  ],
  devices: [
    { id: 'apple_watch', brand: 'Apple', label: 'Apple Watch', sub: 'Series 6+', category: 'smartwatch', icon: 'watch' },
    { id: 'mi_band_7', brand: 'Xiaomi', label: 'Mi Smart Band 7', sub: '', category: 'fitness_band', icon: 'fitness' },
    { id: 'mi_band_8', brand: 'Xiaomi', label: 'Mi Smart Band 8', sub: '', category: 'fitness_band', icon: 'fitness' },
    { id: 'mi_band_9', brand: 'Xiaomi', label: 'Mi Smart Band 9', sub: '', category: 'fitness_band', icon: 'fitness' },
  ],
  by_category: {},
};

function categoryLabel(c: Category, lang: string) {
  if (lang === 'en') return c.label_en;
  if (lang === 'es') return c.label_es;
  if (lang === 'fr') return c.label_fr;
  return c.label_pt;
}

export default function Devices() {
  const router = useRouter();
  const { user, prefs, addDevice, removeDevice } = useAuth();
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeCat, setActiveCat] = useState<string>('smartwatch');
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const c = await apiGet<Catalog>('/devices/catalog');
        setCatalog(c);
        if (c?.categories?.length) setActiveCat(c.categories[0].id);
      } catch {
        setCatalog(FALLBACK_CATALOG);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const owned = user?.devices || [];
  const lang = prefs?.language || 'pt';

  const visibleDevices = useMemo(() => {
    if (!catalog) return [];
    const q = query.trim().toLowerCase();
    if (q) {
      return catalog.devices.filter((d) =>
        d.label.toLowerCase().includes(q) ||
        d.brand.toLowerCase().includes(q) ||
        d.sub.toLowerCase().includes(q),
      );
    }
    return catalog.devices.filter((d) => d.category === activeCat);
  }, [catalog, activeCat, query]);

  const ownedDevices = useMemo(() => {
    if (!catalog) return [];
    return catalog.devices.filter((d) => owned.includes(d.id));
  }, [catalog, owned]);

  const confirmRemove = (id: string, label: string) => {
    const doIt = async () => {
      setBusy(id);
      try { await removeDevice(id); } catch (e: any) { Alert.alert('Erro', e.message); }
      finally { setBusy(null); }
    };
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(`${t('profile.removeDevice')} ${label}?`)) doIt();
      return;
    }
    Alert.alert(t('profile.removeDevice'), label, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.confirm'), style: 'destructive', onPress: doIt },
    ]);
  };

  const onAdd = async (id: string) => {
    setBusy(id);
    try { await addDevice(id); } catch (e: any) { Alert.alert('Erro', e.message); }
    finally { setBusy(null); }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity testID="devices-back-btn" onPress={() => router.back()} style={styles.back}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>{t('profile.devices')}</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* SEARCH */}
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={16} color={theme.textSecondary} />
        <TextInput
          testID="devices-search"
          value={query}
          onChangeText={setQuery}
          placeholder={lang === 'en' ? 'Search brand or model…' : lang === 'es' ? 'Marca o modelo…' : lang === 'fr' ? 'Marque ou modèle…' : 'Marca ou modelo…'}
          placeholderTextColor={theme.textTertiary}
          style={styles.searchInput}
          autoCorrect={false}
          autoCapitalize="none"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Ionicons name="close-circle" size={16} color={theme.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* CATEGORY CHIPS — hidden when searching */}
      {query.length === 0 && catalog && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          {catalog.categories.map((c) => {
            const active = c.id === activeCat;
            return (
              <TouchableOpacity
                key={c.id}
                testID={`cat-${c.id}`}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setActiveCat(c.id)}
              >
                <Ionicons name={c.icon as any} size={14} color={active ? '#000' : '#fff'} />
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {categoryLabel(c, lang)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      <ScrollView contentContainerStyle={styles.scroll}>
        {loading ? (
          <View style={{ paddingTop: 40, alignItems: 'center' }}>
            <ActivityIndicator color={theme.primary} />
          </View>
        ) : (
          <>
            {/* CONNECTED */}
            {ownedDevices.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>
                  {lang === 'en' ? 'Connected' : lang === 'es' ? 'Conectados' : lang === 'fr' ? 'Connectés' : 'Ligados'}
                  {`  ·  ${ownedDevices.length}`}
                </Text>
                <View style={styles.card}>
                  {ownedDevices.map((d, idx) => (
                    <DeviceRow
                      key={d.id}
                      d={d}
                      isOwned
                      last={idx === ownedDevices.length - 1}
                      busy={busy === d.id}
                      onAction={() => confirmRemove(d.id, d.label)}
                    />
                  ))}
                </View>
              </>
            )}

            {/* AVAILABLE */}
            <Text style={styles.sectionLabel}>
              {query.length
                ? (lang === 'en' ? 'Results' : lang === 'es' ? 'Resultados' : lang === 'fr' ? 'Résultats' : 'Resultados')
                : (lang === 'en' ? 'Available' : lang === 'es' ? 'Disponibles' : lang === 'fr' ? 'Disponibles' : 'Disponíveis')
              }
              {`  ·  ${visibleDevices.filter((d) => !owned.includes(d.id)).length}`}
            </Text>
            <View style={styles.card}>
              {visibleDevices.filter((d) => !owned.includes(d.id)).map((d, idx, arr) => (
                <DeviceRow
                  key={d.id}
                  d={d}
                  isOwned={false}
                  last={idx === arr.length - 1}
                  busy={busy === d.id}
                  onAction={() => onAdd(d.id)}
                />
              ))}
              {visibleDevices.filter((d) => !owned.includes(d.id)).length === 0 && (
                <View style={styles.emptyRow}>
                  <Text style={styles.emptyText}>
                    {lang === 'en' ? 'No matches' : lang === 'es' ? 'Sin resultados' : lang === 'fr' ? 'Aucun résultat' : 'Sem resultados'}
                  </Text>
                </View>
              )}
            </View>

            <Text style={styles.footnote}>
              {lang === 'en'
                ? 'Sync is currently simulated — real-time integrations coming in the next update.'
                : lang === 'es'
                ? 'La sincronización está simulada — integraciones reales en la próxima actualización.'
                : lang === 'fr'
                ? 'La synchronisation est simulée — intégrations réelles à venir.'
                : 'Sincronização atualmente simulada — integrações reais na próxima atualização.'}
            </Text>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function DeviceRow({
  d, isOwned, last, busy, onAction,
}: { d: Device; isOwned: boolean; last: boolean; busy: boolean; onAction: () => void }) {
  return (
    <View style={[styles.row, last && { borderBottomWidth: 0 }]}>
      <View style={[styles.rowIcon, isOwned && { backgroundColor: theme.primary + '22' }]}>
        <Ionicons name={d.icon as any} size={20} color={isOwned ? theme.primary : '#fff'} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{d.label}</Text>
        <Text style={styles.rowSub}>{d.brand}{d.sub ? ` · ${d.sub}` : ''}</Text>
      </View>
      {busy ? (
        <View style={styles.busyBtn}>
          <ActivityIndicator color={isOwned ? theme.stressRed : theme.primary} size="small" />
        </View>
      ) : isOwned ? (
        <TouchableOpacity testID={`remove-${d.id}`} style={styles.removeBtn} onPress={onAction}>
          <Ionicons name="trash-outline" size={16} color={theme.stressRed} />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity testID={`add-${d.id}`} style={styles.addBtn} onPress={onAction}>
          <Ionicons name="add" size={18} color="#000" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  back: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border },
  title: { color: '#fff', fontSize: 18, fontWeight: '800' },
  searchWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: theme.card, borderRadius: 12, borderWidth: 1, borderColor: theme.border, marginBottom: 10 },
  searchInput: { flex: 1, color: '#fff', fontSize: 14, padding: 0 },
  chipsRow: { paddingHorizontal: 16, gap: 8, paddingVertical: 4, marginBottom: 6 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: theme.card, borderRadius: 999, borderWidth: 1, borderColor: theme.border, marginRight: 8 },
  chipActive: { backgroundColor: theme.primary, borderColor: theme.primary },
  chipText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  chipTextActive: { color: '#000' },
  scroll: { padding: 16 },
  sectionLabel: { color: theme.textSecondary, fontSize: 11, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10, marginLeft: 4, marginTop: 8 },
  card: { backgroundColor: theme.card, borderRadius: 16, borderWidth: 1, borderColor: theme.border, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderBottomWidth: 1, borderBottomColor: theme.border },
  rowIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: theme.cardElevated, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { color: '#fff', fontSize: 14, fontWeight: '700' },
  rowSub: { color: theme.textSecondary, fontSize: 12, marginTop: 2 },
  addBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.primary, alignItems: 'center', justifyContent: 'center' },
  removeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.stressRed + '22', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.stressRed + '55' },
  busyBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  emptyRow: { padding: 20, alignItems: 'center' },
  emptyText: { color: theme.textSecondary, fontSize: 13 },
  footnote: { color: theme.textTertiary, fontSize: 11, marginTop: 18, textAlign: 'center', paddingHorizontal: 18, lineHeight: 16 },
});
