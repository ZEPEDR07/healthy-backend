import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Alert,
  TextInput, ActivityIndicator, Linking,
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

const FALLBACK_DEVICES: Device[] = [
  { id: 'apple_watch_se', brand: 'Apple', label: 'Apple Watch SE', sub: '1ª/2ª geração', category: 'smartwatch', icon: 'watch' },
  { id: 'apple_watch_series', brand: 'Apple', label: 'Apple Watch Series 6–10', sub: 'Series 6 a 10', category: 'smartwatch', icon: 'watch' },
  { id: 'apple_watch_ultra', brand: 'Apple', label: 'Apple Watch Ultra', sub: 'Ultra 1 / Ultra 2', category: 'smartwatch', icon: 'watch' },
  { id: 'mi_band_7', brand: 'Xiaomi', label: 'Mi Smart Band 7', sub: 'Mi Band 7 / 7 Pro', category: 'fitness_band', icon: 'fitness' },
  { id: 'mi_band_8', brand: 'Xiaomi', label: 'Mi Smart Band 8', sub: 'Mi Band 8 / 8 Pro', category: 'fitness_band', icon: 'fitness' },
  { id: 'mi_band_9', brand: 'Xiaomi', label: 'Mi Smart Band 9', sub: 'Mi Band 9 / 9 Pro', category: 'fitness_band', icon: 'fitness' },
  { id: 'redmi_smart_band', brand: 'Xiaomi', label: 'Redmi Smart Band', sub: '2 / Pro', category: 'fitness_band', icon: 'fitness' },
  { id: 'samsung_galaxy_watch', brand: 'Samsung', label: 'Galaxy Watch 4/5/6/7', sub: 'Wear OS', category: 'smartwatch', icon: 'watch' },
  { id: 'samsung_galaxy_watch_ultra', brand: 'Samsung', label: 'Galaxy Watch Ultra', sub: 'Top de gama', category: 'smartwatch', icon: 'watch' },
  { id: 'samsung_galaxy_fit', brand: 'Samsung', label: 'Galaxy Fit 3', sub: 'Pulseira fitness', category: 'fitness_band', icon: 'fitness' },
  { id: 'garmin_fenix', brand: 'Garmin', label: 'Garmin Fenix', sub: 'Fenix 6 / 7 / 8', category: 'smartwatch', icon: 'watch' },
  { id: 'garmin_forerunner', brand: 'Garmin', label: 'Garmin Forerunner', sub: '55 / 165 / 265 / 965', category: 'smartwatch', icon: 'watch' },
  { id: 'garmin_venu', brand: 'Garmin', label: 'Garmin Venu', sub: 'Venu 2 / 3 / Sq', category: 'smartwatch', icon: 'watch' },
  { id: 'fitbit_sense', brand: 'Fitbit', label: 'Fitbit Sense', sub: 'Sense / Sense 2', category: 'smartwatch', icon: 'watch' },
  { id: 'fitbit_versa', brand: 'Fitbit', label: 'Fitbit Versa', sub: 'Versa 3 / 4', category: 'smartwatch', icon: 'watch' },
  { id: 'fitbit_charge', brand: 'Fitbit', label: 'Fitbit Charge', sub: 'Charge 5 / 6', category: 'fitness_band', icon: 'fitness' },
  { id: 'polar_vantage', brand: 'Polar', label: 'Polar Vantage', sub: 'V2 / V3', category: 'smartwatch', icon: 'watch' },
  { id: 'polar_ignite', brand: 'Polar', label: 'Polar Ignite', sub: 'Ignite 2 / 3', category: 'smartwatch', icon: 'watch' },
  { id: 'huawei_watch_gt', brand: 'Huawei', label: 'Huawei Watch GT', sub: 'GT 3 / 4 / 5', category: 'smartwatch', icon: 'watch' },
  { id: 'huawei_band', brand: 'Huawei', label: 'Huawei Band', sub: 'Band 8 / 9 / 10', category: 'fitness_band', icon: 'fitness' },
  { id: 'amazfit_gtr', brand: 'Amazfit', label: 'Amazfit GTR', sub: 'GTR 4 / Mini', category: 'smartwatch', icon: 'watch' },
  { id: 'amazfit_gts', brand: 'Amazfit', label: 'Amazfit GTS', sub: 'GTS 4 / Mini', category: 'smartwatch', icon: 'watch' },
  { id: 'coros_pace', brand: 'Coros', label: 'Coros Pace', sub: 'Pace 2 / 3', category: 'smartwatch', icon: 'watch' },
  { id: 'coros_apex', brand: 'Coros', label: 'Coros Apex', sub: 'Apex 2 / Pro', category: 'smartwatch', icon: 'watch' },
  { id: 'whoop_4', brand: 'Whoop', label: 'Whoop 4.0', sub: 'Banda sem ecrã', category: 'fitness_band', icon: 'fitness' },
  { id: 'google_pixel_watch', brand: 'Google', label: 'Pixel Watch', sub: 'Pixel Watch 2 / 3', category: 'smartwatch', icon: 'watch' },
];

// Brand icons mapping
const BRAND_ICONS: Record<string, string> = {
  Apple: 'logo-apple',
  Xiaomi: 'phone-portrait',
  Samsung: 'phone-portrait',
  Garmin: 'compass',
  Fitbit: 'fitness',
  Polar: 'pulse',
  Huawei: 'phone-portrait',
  Amazfit: 'watch',
  Coros: 'watch',
  Whoop: 'body',
  Google: 'logo-google',
};

// Bluetooth app deep links per brand
const BRAND_BT_LINKS: Record<string, { label: string; android?: string; ios?: string; fallback: string }> = {
  Apple: { label: 'Apple Health', fallback: 'https://www.apple.com/health/' },
  Xiaomi: { label: 'Zepp Life / Mi Fitness', android: 'market://details?id=com.xiaomi.hm.health', ios: 'https://apps.apple.com/app/mi-fitness/id1637647573', fallback: 'https://play.google.com/store/apps/details?id=com.xiaomi.hm.health' },
  Samsung: { label: 'Samsung Health', android: 'market://details?id=com.sec.android.app.shealth', ios: 'https://apps.apple.com/app/samsung-health/id1224204661', fallback: 'https://play.google.com/store/apps/details?id=com.sec.android.app.shealth' },
  Garmin: { label: 'Garmin Connect', android: 'market://details?id=com.garmin.android.apps.connectmobile', ios: 'https://apps.apple.com/app/garmin-connect/id583446403', fallback: 'https://connect.garmin.com' },
  Fitbit: { label: 'Fitbit', android: 'market://details?id=com.fitbit.FitbitMobile', ios: 'https://apps.apple.com/app/fitbit/id462638897', fallback: 'https://www.fitbit.com/global/us/home' },
  Polar: { label: 'Polar Flow', android: 'market://details?id=fi.polar.polarflow', ios: 'https://apps.apple.com/app/polar-flow/id717172678', fallback: 'https://flow.polar.com' },
  Huawei: { label: 'Huawei Health', android: 'market://details?id=com.huawei.health', fallback: 'https://consumer.huawei.com/en/mobileservices/health/' },
  Amazfit: { label: 'Zepp', android: 'market://details?id=com.huami.watch.hmwatchmanager', ios: 'https://apps.apple.com/app/zepp/id1367229257', fallback: 'https://www.zepp.com' },
  Coros: { label: 'COROS', android: 'market://details?id=com.coros.pace', ios: 'https://apps.apple.com/app/coros/id1388435764', fallback: 'https://www.coros.com' },
  Whoop: { label: 'WHOOP', android: 'market://details?id=com.whoop.android', ios: 'https://apps.apple.com/app/whoop/id933944179', fallback: 'https://www.whoop.com' },
  Google: { label: 'Google Fit / Pixel Watch', android: 'market://details?id=com.google.android.apps.fitness', fallback: 'https://www.google.com/fit/' },
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
  const [expandedBrand, setExpandedBrand] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const c = await apiGet<Catalog>('/devices/catalog');
        setCatalog(c);
        if (c?.categories?.length) setActiveCat(c.categories[0].id);
      } catch {
        setCatalog({
          categories: [
            { id: 'smartwatch', label_pt: 'Relógios', label_en: 'Smartwatches', label_es: 'Relojes', label_fr: 'Montres', icon: 'watch' },
            { id: 'fitness_band', label_pt: 'Pulseiras', label_en: 'Fitness bands', label_es: 'Pulseras', label_fr: 'Bracelets', icon: 'fitness' },
          ],
          devices: FALLBACK_DEVICES,
          by_category: {},
        });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const owned = user?.devices || [];
  const lang = prefs?.language || 'pt';

  const allDevices = catalog?.devices || FALLBACK_DEVICES;

  // Group by brand for the current category (or search results)
  const brandGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? allDevices.filter(d =>
          d.label.toLowerCase().includes(q) ||
          d.brand.toLowerCase().includes(q) ||
          d.sub.toLowerCase().includes(q)
        )
      : allDevices.filter(d => d.category === activeCat);

    const groups: Record<string, Device[]> = {};
    filtered.forEach(d => {
      if (!groups[d.brand]) groups[d.brand] = [];
      groups[d.brand].push(d);
    });
    return groups;
  }, [allDevices, activeCat, query]);

  const ownedDevices = useMemo(() =>
    allDevices.filter(d => owned.includes(d.id)),
    [allDevices, owned]
  );

  const openBluetooth = (brand: string) => {
    const info = BRAND_BT_LINKS[brand];
    if (!info) {
      Alert.alert(
        lang === 'en' ? 'Connect via Bluetooth' : 'Ligar via Bluetooth',
        lang === 'en'
          ? 'Open your device\'s companion app and connect via Bluetooth in your phone settings.'
          : 'Abre a app oficial do dispositivo e liga via Bluetooth nas definições do telemóvel.',
      );
      return;
    }

    const msg = lang === 'en'
      ? `To sync data, open the ${info.label} app and connect your device via Bluetooth.\n\nWant to open the app store to install it?`
      : `Para sincronizar dados, abre a app ${info.label} e liga o dispositivo via Bluetooth.\n\nQueres abrir a loja para instalar?`;

    Alert.alert(
      lang === 'en' ? `Connect ${brand}` : `Ligar ${brand}`,
      msg,
      [
        { text: lang === 'en' ? 'Cancel' : 'Cancelar', style: 'cancel' },
        {
          text: lang === 'en' ? 'Open App Store' : 'Abrir Loja',
          onPress: async () => {
            const url = Platform.OS === 'ios'
              ? (info.ios || info.fallback)
              : (info.android || info.fallback);
            const canOpen = await Linking.canOpenURL(url);
            Linking.openURL(canOpen ? url : info.fallback);
          },
        },
      ]
    );
  };

  const confirmRemove = (id: string, label: string) => {
    const doIt = async () => {
      setBusy(id);
      try { await removeDevice(id); } catch (e: any) { Alert.alert('Erro', e.message); }
      finally { setBusy(null); }
    };
    Alert.alert(t('profile.removeDevice'), label, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.confirm'), style: 'destructive', onPress: doIt },
    ]);
  };

  const onAdd = async (device: Device) => {
    setBusy(device.id);
    try {
      await addDevice(device.id);
      // After adding, prompt to connect via Bluetooth
      openBluetooth(device.brand);
    } catch (e: any) {
      Alert.alert('Erro', e.message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>{t('profile.devices')}</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* SEARCH */}
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={16} color={theme.textSecondary} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={lang === 'en' ? 'Search brand or model…' : 'Marca ou modelo…'}
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

      {/* CATEGORY CHIPS */}
      {query.length === 0 && catalog && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
          {catalog.categories.map((c) => {
            const active = c.id === activeCat;
            return (
              <TouchableOpacity
                key={c.id}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => { setActiveCat(c.id); setExpandedBrand(null); }}
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
          <ActivityIndicator color={theme.primary} style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* CONNECTED DEVICES */}
            {ownedDevices.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>
                  {lang === 'en' ? 'Connected' : lang === 'es' ? 'Conectados' : 'Ligados'} · {ownedDevices.length}
                </Text>
                <View style={styles.card}>
                  {ownedDevices.map((d, idx) => (
                    <View key={d.id} style={[styles.row, idx === ownedDevices.length - 1 && { borderBottomWidth: 0 }]}>
                      <View style={[styles.rowIcon, { backgroundColor: theme.primary + '22' }]}>
                        <Ionicons name={d.icon as any} size={20} color={theme.primary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.rowLabel}>{d.label}</Text>
                        <Text style={styles.rowSub}>{d.brand}{d.sub ? ` · ${d.sub}` : ''}</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.btBtn}
                        onPress={() => openBluetooth(d.brand)}
                      >
                        <Ionicons name="bluetooth" size={14} color={theme.primary} />
                      </TouchableOpacity>
                      {busy === d.id ? (
                        <ActivityIndicator size="small" color={theme.stressRed} style={{ marginLeft: 8 }} />
                      ) : (
                        <TouchableOpacity style={styles.removeBtn} onPress={() => confirmRemove(d.id, d.label)}>
                          <Ionicons name="trash-outline" size={16} color={theme.stressRed} />
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                </View>
              </>
            )}

            {/* BRANDS LIST */}
            <Text style={styles.sectionLabel}>
              {lang === 'en' ? 'Available' : 'Disponíveis'}
            </Text>

            {Object.entries(brandGroups).map(([brand, devices]) => {
              const isExpanded = expandedBrand === brand;
              const availableDevices = devices.filter(d => !owned.includes(d.id));
              if (availableDevices.length === 0) return null;

              return (
                <View key={brand} style={[styles.card, { marginBottom: 10 }]}>
                  {/* Brand header — clickable */}
                  <TouchableOpacity
                    style={styles.brandRow}
                    onPress={() => setExpandedBrand(isExpanded ? null : brand)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.brandIcon}>
                      <Ionicons
                        name={(BRAND_ICONS[brand] || 'watch') as any}
                        size={20}
                        color={theme.primary}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.brandName}>{brand}</Text>
                      <Text style={styles.brandSub}>{availableDevices.length} {lang === 'en' ? 'models' : 'modelos'}</Text>
                    </View>
                    <Ionicons
                      name={isExpanded ? 'chevron-up' : 'chevron-down'}
                      size={18}
                      color={theme.textSecondary}
                    />
                  </TouchableOpacity>

                  {/* Expanded device list */}
                  {isExpanded && availableDevices.map((d, idx) => (
                    <View
                      key={d.id}
                      style={[
                        styles.deviceRow,
                        idx === availableDevices.length - 1 && { borderBottomWidth: 0 },
                      ]}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={styles.rowLabel}>{d.label}</Text>
                        {!!d.sub && <Text style={styles.rowSub}>{d.sub}</Text>}
                      </View>
                      {busy === d.id ? (
                        <ActivityIndicator size="small" color={theme.primary} />
                      ) : (
                        <TouchableOpacity style={styles.addBtn} onPress={() => onAdd(d)}>
                          <Ionicons name="add" size={18} color="#000" />
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                </View>
              );
            })}

            <Text style={styles.footnote}>
              {lang === 'en'
                ? 'After adding a device, connect it via its official app using Bluetooth.'
                : 'Após adicionar um dispositivo, liga-o via Bluetooth através da app oficial da marca.'}
            </Text>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
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
  scroll: { padding: 16, paddingBottom: 40 },
  sectionLabel: { color: theme.textSecondary, fontSize: 11, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10, marginLeft: 4, marginTop: 8 },
  card: { backgroundColor: theme.card, borderRadius: 16, borderWidth: 1, borderColor: theme.border, overflow: 'hidden', marginBottom: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderBottomWidth: 1, borderBottomColor: theme.border },
  rowIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: theme.cardElevated, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { color: '#fff', fontSize: 14, fontWeight: '700' },
  rowSub: { color: theme.textSecondary, fontSize: 12, marginTop: 2 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  brandIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: theme.primary + '18', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.primary + '33' },
  brandName: { color: '#fff', fontSize: 16, fontWeight: '800' },
  brandSub: { color: theme.textSecondary, fontSize: 12, marginTop: 2 },
  deviceRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 16, borderTopWidth: 1, borderTopColor: theme.border, borderBottomWidth: 1, borderBottomColor: theme.border },
  addBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: theme.primary, alignItems: 'center', justifyContent: 'center' },
  removeBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: theme.stressRed + '22', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.stressRed + '55' },
  btBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: theme.primary + '18', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.primary + '33', marginRight: 6 },
  footnote: { color: theme.textTertiary, fontSize: 11, marginTop: 18, textAlign: 'center', paddingHorizontal: 18, lineHeight: 16 },
});
