import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
  Alert, Image, Platform, Modal, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { apiGet, apiPost, apiDelete } from '../../src/api';
import { useAuth } from '../../src/auth';
import { theme } from '../../src/theme';
import { t } from '../../src/i18n';

type FoodItem = { name: string; calories: number; protein_g: number; carbs_g: number; fat_g: number };
type FoodLog = {
  id: string;
  date: string;
  image_base64: string;
  items: FoodItem[];
  totals: { calories: number; protein_g: number; carbs_g: number; fat_g: number };
  summary: string;
  created_at: string;
};
type NutritionHistory = {
  calories: number[];
  protein_g: number[];
  carbs_g: number[];
  fat_g: number[];
};

const DAILY_GOAL_CALORIES = 2200;

// ── Mini sparkline ───────────────────────────────────────────────────────────
function MiniSparkline({ data, color, width = 80, height = 32 }: { data: number[]; color: string; width?: number; height?: number }) {
  if (!data || data.length === 0) return <View style={{ width, height }} />;

  const PAD = 3;
  const w = width - PAD * 2;
  const h = height - PAD * 2;
  const max = Math.max(...data, 1);
  const stepX = w / Math.max(data.length - 1, 1);

  const points = data.map((v, i) => ({
    x: PAD + stepX * i,
    y: PAD + h * (1 - v / max),
  }));

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
  }

  const fillD = `${d} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;
  const gradId = `grad-${color.replace('#', '')}`;

  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={color} stopOpacity="0.35" />
          <Stop offset="1" stopColor={color} stopOpacity="0" />
        </LinearGradient>
      </Defs>
      <Path d={fillD} fill={`url(#${gradId})`} />
      <Path d={d} stroke={color} strokeWidth={1.8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ── Manual entry modal ───────────────────────────────────────────────────────
function ManualEntryModal({
  visible,
  onClose,
  onSave,
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (entry: { summary: string; calories: number; protein_g: number; carbs_g: number; fat_g: number }) => void;
}) {
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');

  const reset = () => { setName(''); setCalories(''); setProtein(''); setCarbs(''); setFat(''); };

  const save = () => {
    if (!name.trim()) { Alert.alert('Erro', 'Escreve o nome da refeição.'); return; }
    if (!calories) { Alert.alert('Erro', 'Adiciona as calorias.'); return; }
    onSave({
      summary: name.trim(),
      calories: parseInt(calories) || 0,
      protein_g: parseInt(protein) || 0,
      carbs_g: parseInt(carbs) || 0,
      fat_g: parseInt(fat) || 0,
    });
    reset();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={modal.overlay}>
        <View style={modal.box}>
          <View style={modal.handle} />
          <Text style={modal.title}>Adicionar manualmente</Text>

          <Text style={modal.label}>Nome da refeição</Text>
          <TextInput style={modal.input} value={name} onChangeText={setName} placeholder="ex: Frango com arroz" placeholderTextColor={theme.textTertiary} />

          <Text style={modal.label}>Calorias (kcal)</Text>
          <TextInput style={modal.input} value={calories} onChangeText={setCalories} keyboardType="number-pad" placeholder="ex: 450" placeholderTextColor={theme.textTertiary} />

          <View style={modal.row3}>
            <View style={{ flex: 1, marginRight: 6 }}>
              <Text style={modal.label}>Proteína (g)</Text>
              <TextInput style={modal.input} value={protein} onChangeText={setProtein} keyboardType="number-pad" placeholder="0" placeholderTextColor={theme.textTertiary} />
            </View>
            <View style={{ flex: 1, marginHorizontal: 3 }}>
              <Text style={modal.label}>Carbs (g)</Text>
              <TextInput style={modal.input} value={carbs} onChangeText={setCarbs} keyboardType="number-pad" placeholder="0" placeholderTextColor={theme.textTertiary} />
            </View>
            <View style={{ flex: 1, marginLeft: 6 }}>
              <Text style={modal.label}>Gordura (g)</Text>
              <TextInput style={modal.input} value={fat} onChangeText={setFat} keyboardType="number-pad" placeholder="0" placeholderTextColor={theme.textTertiary} />
            </View>
          </View>

          <View style={modal.btns}>
            <TouchableOpacity style={modal.cancel} onPress={() => { reset(); onClose(); }}>
              <Text style={modal.cancelText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={modal.save} onPress={save}>
              <Text style={modal.saveText}>Guardar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── Main screen ──────────────────────────────────────────────────────────────
export default function NutritionScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [logs, setLogs] = useState<FoodLog[]>([]);
  const [totals, setTotals] = useState({ calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 });
  const [history, setHistory] = useState<NutritionHistory>({ calories: [], protein_g: [], carbs_g: [], fat_g: [] });
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [showManual, setShowManual] = useState(false);

  const load = useCallback(async () => {
    try {
      const [today, hist] = await Promise.all([
        apiGet<{ items: FoodLog[]; totals: any }>('/nutrition/today'),
        apiGet<NutritionHistory>('/nutrition/history?days=7').catch(() => ({ calories: [], protein_g: [], carbs_g: [], fat_g: [] })),
      ]);
      setLogs(today.items || []);
      setTotals(today.totals || { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 });
      setHistory(hist);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const pickAndAnalyze = async (fromCamera: boolean) => {
    try {
      let perm;
      if (fromCamera) {
        perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) { Alert.alert('Permissão necessária', 'Permite acesso à câmara.'); return; }
      } else {
        perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) { Alert.alert('Permissão necessária', 'Permite acesso à galeria.'); return; }
      }
      const result = fromCamera
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, base64: true, quality: 0.6 })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, base64: true, quality: 0.6 });

      if (result.canceled) return;
      const asset = result.assets?.[0];
      if (!asset?.base64) { Alert.alert('Erro', 'Não foi possível ler a imagem.'); return; }

      setAnalyzing(true);
      try {
        const log = await apiPost<FoodLog>('/nutrition/analyze', { image_base64: asset.base64 });
        setLogs((prev) => [log, ...prev]);
        setTotals((prev) => ({
          calories: prev.calories + log.totals.calories,
          protein_g: prev.protein_g + log.totals.protein_g,
          carbs_g: prev.carbs_g + log.totals.carbs_g,
          fat_g: prev.fat_g + log.totals.fat_g,
        }));
      } catch (e: any) {
        if (String(e.message).includes('Premium')) {
          Alert.alert('Limite atingido', e.message, [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Ver Premium', onPress: () => router.push('/premium') },
          ]);
        } else {
          Alert.alert('Erro', e.message || 'Falha na análise. Tenta adicionar manualmente.');
        }
      } finally {
        setAnalyzing(false);
      }
    } catch (e: any) {
      Alert.alert('Erro', e.message || 'Falha ao escolher imagem.');
    }
  };

  const saveManual = async (entry: { summary: string; calories: number; protein_g: number; carbs_g: number; fat_g: number }) => {
    try {
      const log = await apiPost<FoodLog>('/nutrition/manual', entry);
      setLogs((prev) => [log, ...prev]);
      setTotals((prev) => ({
        calories: prev.calories + entry.calories,
        protein_g: prev.protein_g + entry.protein_g,
        carbs_g: prev.carbs_g + entry.carbs_g,
        fat_g: prev.fat_g + entry.fat_g,
      }));
    } catch {
      // Fallback: add locally if endpoint doesn't exist yet
      const fakeLog: FoodLog = {
        id: `manual-${Date.now()}`,
        date: new Date().toISOString().slice(0, 10),
        image_base64: '',
        items: [{ name: entry.summary, calories: entry.calories, protein_g: entry.protein_g, carbs_g: entry.carbs_g, fat_g: entry.fat_g }],
        totals: { calories: entry.calories, protein_g: entry.protein_g, carbs_g: entry.carbs_g, fat_g: entry.fat_g },
        summary: entry.summary,
        created_at: new Date().toISOString(),
      };
      setLogs((prev) => [fakeLog, ...prev]);
      setTotals((prev) => ({
        calories: prev.calories + entry.calories,
        protein_g: prev.protein_g + entry.protein_g,
        carbs_g: prev.carbs_g + entry.carbs_g,
        fat_g: prev.fat_g + entry.fat_g,
      }));
    }
  };

  const onAdd = () => {
    if (Platform.OS === 'web') { pickAndAnalyze(false); return; }
    Alert.alert('Adicionar refeição', 'Escolhe a forma:', [
      { text: 'Câmara (IA)', onPress: () => pickAndAnalyze(true) },
      { text: 'Galeria (IA)', onPress: () => pickAndAnalyze(false) },
      { text: 'Manual', onPress: () => setShowManual(true) },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  const onDelete = (id: string) => {
    const doDelete = async () => {
      try { await apiDelete(`/nutrition/${id}`); } catch {}
      setLogs(prev => prev.filter(l => l.id !== id));
      load();
    };
    Alert.alert('Apagar', 'Apagar esta refeição?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Apagar', style: 'destructive', onPress: doDelete },
    ]);
  };

  const pct = Math.min(100, Math.round((totals.calories / DAILY_GOAL_CALORIES) * 100));

  // Ensure sparklines always have data (fill with 0 if empty)
  const sparkCalories = history.calories.length > 0 ? history.calories : [0, 0, 0, 0, 0, 0, 0];
  const sparkProtein = history.protein_g.length > 0 ? history.protein_g : [0, 0, 0, 0, 0, 0, 0];
  const sparkCarbs = history.carbs_g.length > 0 ? history.carbs_g : [0, 0, 0, 0, 0, 0, 0];
  const sparkFat = history.fat_g.length > 0 ? history.fat_g : [0, 0, 0, 0, 0, 0, 0];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Nutrição</Text>
            <Text style={styles.subtitle}>Fotografa, IA analisa, ou regista manualmente.</Text>
          </View>
          {!user?.premium_active && (
            <TouchableOpacity onPress={() => router.push('/premium')} style={styles.proPill}>
              <Ionicons name="star" size={12} color={theme.premium} />
              <Text style={styles.proPillText}>PRO</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* SUMMARY CARD */}
        <View style={styles.summary}>
          <View style={styles.summaryHead}>
            <Text style={styles.summaryKcal}>{totals.calories}</Text>
            <Text style={styles.summaryGoal}> / {DAILY_GOAL_CALORIES} kcal</Text>
          </View>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${pct}%` as any }]} />
          </View>

          {/* MACRO BOXES WITH SPARKLINES */}
          <View style={styles.macroRow}>
            <MacroBox
              label="Proteína"
              value={`${totals.protein_g}g`}
              color={theme.primary}
              sparkData={sparkProtein}
            />
            <MacroBox
              label="Carbs"
              value={`${totals.carbs_g}g`}
              color={theme.strain}
              sparkData={sparkCarbs}
            />
            <MacroBox
              label="Gordura"
              value={`${totals.fat_g}g`}
              color={theme.sleep}
              sparkData={sparkFat}
            />
          </View>

          {/* CALORIES SPARKLINE */}
          <View style={styles.calSparkRow}>
            <Text style={styles.calSparkLabel}>7 dias</Text>
            <MiniSparkline data={sparkCalories} color={theme.recovery} width={160} height={28} />
            <Text style={[styles.calSparkVal, { color: theme.recovery }]}>
              {sparkCalories[sparkCalories.length - 1]} kcal
            </Text>
          </View>
        </View>

        {/* ADD BUTTONS */}
        <View style={styles.addRow}>
          <TouchableOpacity style={[styles.addBtn, { flex: 2 }]} onPress={onAdd} disabled={analyzing}>
            <Ionicons name="camera" size={20} color="#000" />
            <Text style={styles.addBtnText}>Adicionar refeição</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.addBtnGhost, { flex: 1 }]} onPress={() => setShowManual(true)} disabled={analyzing}>
            <Ionicons name="pencil" size={18} color="#fff" />
            <Text style={styles.addBtnGhostText}>Manual</Text>
          </TouchableOpacity>
        </View>

        {analyzing && (
          <View style={styles.analyzing}>
            <ActivityIndicator color={theme.primary} />
            <Text style={styles.analyzingText}>IA a analisar a tua refeição...</Text>
          </View>
        )}

        {/* LIST */}
        <Text style={styles.listTitle}>Refeições de hoje</Text>
        {loading ? (
          <ActivityIndicator color={theme.primary} style={{ marginTop: 20 }} />
        ) : logs.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="restaurant-outline" size={48} color={theme.textTertiary} />
            <Text style={styles.emptyTitle}>Sem refeições registadas</Text>
            <Text style={styles.emptySub}>Tira uma foto ou adiciona manualmente</Text>
          </View>
        ) : (
          logs.map((log) => (
            <View key={log.id} style={styles.foodCard}>
              {log.image_base64 ? (
                <Image source={{ uri: `data:image/jpeg;base64,${log.image_base64}` }} style={styles.foodImage} />
              ) : (
                <View style={[styles.foodImage, styles.foodImagePh]}>
                  <Ionicons name="restaurant" size={24} color={theme.textTertiary} />
                </View>
              )}
              <View style={{ flex: 1, padding: 12 }}>
                <Text style={styles.foodSummary} numberOfLines={2}>{log.summary || log.items[0]?.name || 'Refeição'}</Text>
                <View style={styles.foodMacros}>
                  <Text style={styles.foodKcal}>{log.totals.calories} kcal</Text>
                  <Text style={styles.foodMacro}>P {log.totals.protein_g}g</Text>
                  <Text style={styles.foodMacro}>C {log.totals.carbs_g}g</Text>
                  <Text style={styles.foodMacro}>G {log.totals.fat_g}g</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => onDelete(log.id)} style={styles.deleteBtn}>
                <Ionicons name="trash-outline" size={18} color={theme.stressRed} />
              </TouchableOpacity>
            </View>
          ))
        )}

        {!user?.premium_active && (
          <Text style={styles.freeNote}>Versão gratuita: 3 fotos por dia. Premium = ilimitado.</Text>
        )}
      </ScrollView>

      <ManualEntryModal
        visible={showManual}
        onClose={() => setShowManual(false)}
        onSave={saveManual}
      />
    </SafeAreaView>
  );
}

function MacroBox({ label, value, color, sparkData }: { label: string; value: string; color: string; sparkData: number[] }) {
  return (
    <View style={styles.macroBox}>
      <Text style={[styles.macroVal, { color }]}>{value}</Text>
      <MiniSparkline data={sparkData} color={color} width={72} height={24} />
      <Text style={styles.macroLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.bg },
  scroll: { padding: 20, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  title: { color: '#fff', fontSize: 28, fontWeight: '800' },
  subtitle: { color: theme.textSecondary, fontSize: 13, marginTop: 4 },
  proPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: theme.premium, backgroundColor: theme.premium + '1A' },
  proPillText: { color: theme.premium, fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  summary: { backgroundColor: theme.card, borderRadius: 18, padding: 18, borderWidth: 1, borderColor: theme.border, marginBottom: 14 },
  summaryHead: { flexDirection: 'row', alignItems: 'baseline' },
  summaryKcal: { color: '#fff', fontSize: 36, fontWeight: '900', letterSpacing: -1 },
  summaryGoal: { color: theme.textSecondary, fontSize: 16, fontWeight: '600' },
  progressBg: { height: 10, backgroundColor: theme.cardElevated, borderRadius: 5, overflow: 'hidden', marginTop: 12 },
  progressFill: { height: 10, backgroundColor: theme.primary, borderRadius: 5 },
  macroRow: { flexDirection: 'row', marginTop: 16, gap: 8 },
  macroBox: { flex: 1, backgroundColor: theme.cardElevated, borderRadius: 12, padding: 10, alignItems: 'center', gap: 4 },
  macroVal: { fontSize: 16, fontWeight: '800' },
  macroLabel: { color: theme.textSecondary, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.8 },
  calSparkRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: theme.border },
  calSparkLabel: { color: theme.textTertiary, fontSize: 11, fontWeight: '600' },
  calSparkVal: { fontSize: 12, fontWeight: '800' },
  addRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: theme.primary, paddingVertical: 14, borderRadius: 14 },
  addBtnText: { color: '#000', fontSize: 15, fontWeight: '800' },
  addBtnGhost: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14, borderWidth: 1, borderColor: theme.border },
  addBtnGhostText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  analyzing: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, backgroundColor: theme.card, borderRadius: 12, borderWidth: 1, borderColor: theme.border, marginBottom: 12 },
  analyzingText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  listTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginTop: 8, marginBottom: 10 },
  foodCard: { flexDirection: 'row', backgroundColor: theme.card, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: theme.border, marginBottom: 10 },
  foodImage: { width: 90, height: 90, alignItems: 'center', justifyContent: 'center' },
  foodImagePh: { backgroundColor: theme.cardElevated },
  foodSummary: { color: '#fff', fontSize: 14, fontWeight: '600', marginBottom: 6 },
  foodMacros: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  foodKcal: { color: theme.recovery, fontSize: 13, fontWeight: '800' },
  foodMacro: { color: theme.textSecondary, fontSize: 12, fontWeight: '600' },
  deleteBtn: { padding: 12, justifyContent: 'center' },
  empty: { alignItems: 'center', marginTop: 30, padding: 20 },
  emptyTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginTop: 12 },
  emptySub: { color: theme.textSecondary, fontSize: 13, marginTop: 4 },
  freeNote: { color: theme.textTertiary, fontSize: 12, textAlign: 'center', marginTop: 18 },
});

const modal = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  box: { backgroundColor: theme.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: theme.border, alignSelf: 'center', marginBottom: 20 },
  title: { color: '#fff', fontSize: 20, fontWeight: '800', marginBottom: 16 },
  label: { color: theme.textSecondary, fontSize: 11, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: theme.cardElevated, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: '#fff', borderWidth: 1, borderColor: theme.border, fontSize: 15 },
  row3: { flexDirection: 'row' },
  btns: { flexDirection: 'row', gap: 12, marginTop: 20 },
  cancel: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: theme.border, alignItems: 'center' },
  cancelText: { color: theme.textSecondary, fontSize: 15, fontWeight: '700' },
  save: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: theme.primary, alignItems: 'center' },
  saveText: { color: '#000', fontSize: 15, fontWeight: '800' },
});
