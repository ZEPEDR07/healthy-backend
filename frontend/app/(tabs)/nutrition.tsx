import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
  Alert, Image, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { apiGet, apiPost, apiDelete } from '../../src/api';
import { useAuth } from '../../src/auth';
import { theme } from '../../src/theme';

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

const DAILY_GOAL_CALORIES = 2200;

export default function NutritionScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [logs, setLogs] = useState<FoodLog[]>([]);
  const [totals, setTotals] = useState({ calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 });
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await apiGet<{ items: FoodLog[]; totals: any }>('/nutrition/today');
      setLogs(res.items || []);
      setTotals(res.totals || { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 });
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
        if (!perm.granted) {
          Alert.alert('Permissão necessária', 'Permite acesso à câmara.');
          return;
        }
      } else {
        perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
          Alert.alert('Permissão necessária', 'Permite acesso à galeria.');
          return;
        }
      }
      const result = fromCamera
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            base64: true,
            quality: 0.6,
            allowsEditing: false,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            base64: true,
            quality: 0.6,
            allowsEditing: false,
          });
      if (result.canceled) return;
      const asset = result.assets?.[0];
      if (!asset?.base64) {
        Alert.alert('Erro', 'Não foi possível ler a imagem.');
        return;
      }
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
          Alert.alert('Erro', e.message || 'Falha na análise.');
        }
      } finally {
        setAnalyzing(false);
      }
    } catch (e: any) {
      Alert.alert('Erro', e.message || 'Falha ao escolher imagem.');
    }
  };

  const onAdd = () => {
    if (Platform.OS === 'web') {
      pickAndAnalyze(false);
      return;
    }
    Alert.alert('Adicionar refeição', 'Escolhe a origem da foto:', [
      { text: 'Câmara', onPress: () => pickAndAnalyze(true) },
      { text: 'Galeria', onPress: () => pickAndAnalyze(false) },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  const onDelete = (id: string) => {
    const doDelete = async () => {
      await apiDelete(`/nutrition/${id}`);
      load();
    };
    if (Platform.OS === 'web') {
      // eslint-disable-next-line no-alert
      if (typeof window !== 'undefined' && window.confirm('Apagar esta refeição?')) doDelete();
      return;
    }
    Alert.alert('Apagar', 'Apagar esta refeição?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Apagar', style: 'destructive', onPress: doDelete },
    ]);
  };

  const pct = Math.min(100, Math.round((totals.calories / DAILY_GOAL_CALORIES) * 100));

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Nutrição</Text>
            <Text style={styles.subtitle}>Fotografa, IA analisa, regista.</Text>
          </View>
          {!user?.premium_active && (
            <TouchableOpacity testID="nutrition-go-premium" onPress={() => router.push('/premium')} style={styles.proPill}>
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
            <View style={[styles.progressFill, { width: `${pct}%` }]} />
          </View>
          <View style={styles.macroRow}>
            <MacroBox label="Proteína" value={`${totals.protein_g}g`} color={theme.primary} />
            <MacroBox label="Carbs" value={`${totals.carbs_g}g`} color={theme.strain} />
            <MacroBox label="Gordura" value={`${totals.fat_g}g`} color={theme.sleep} />
          </View>
        </View>

        {/* ADD BUTTONS */}
        <View style={styles.addRow}>
          <TouchableOpacity testID="nutrition-camera-btn" style={[styles.addBtn, { flex: 1 }]} onPress={() => pickAndAnalyze(true)} disabled={analyzing}>
            <Ionicons name="camera" size={20} color="#000" />
            <Text style={styles.addBtnText}>Câmara</Text>
          </TouchableOpacity>
          <TouchableOpacity testID="nutrition-gallery-btn" style={[styles.addBtnGhost, { flex: 1 }]} onPress={() => pickAndAnalyze(false)} disabled={analyzing}>
            <Ionicons name="image" size={20} color="#fff" />
            <Text style={styles.addBtnGhostText}>Galeria</Text>
          </TouchableOpacity>
        </View>

        {analyzing && (
          <View testID="nutrition-analyzing" style={styles.analyzing}>
            <ActivityIndicator color={theme.primary} />
            <Text style={styles.analyzingText}>IA a analisar a tua refeição...</Text>
          </View>
        )}

        {/* LIST */}
        <Text style={styles.listTitle}>Refeições de hoje</Text>
        {loading ? (
          <ActivityIndicator color={theme.primary} style={{ marginTop: 20 }} />
        ) : logs.length === 0 ? (
          <View testID="nutrition-empty" style={styles.empty}>
            <Ionicons name="restaurant-outline" size={48} color={theme.textTertiary} />
            <Text style={styles.emptyTitle}>Sem refeições registadas</Text>
            <Text style={styles.emptySub}>Tira uma foto para começar</Text>
          </View>
        ) : (
          logs.map((log) => (
            <View key={log.id} testID={`food-${log.id}`} style={styles.foodCard}>
              {log.image_base64 ? (
                <Image source={{ uri: `data:image/jpeg;base64,${log.image_base64}` }} style={styles.foodImage} />
              ) : (
                <View style={[styles.foodImage, styles.foodImagePh]} />
              )}
              <View style={{ flex: 1, padding: 12 }}>
                <Text style={styles.foodSummary} numberOfLines={2}>{log.summary || (log.items[0]?.name ?? 'Refeição')}</Text>
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
    </SafeAreaView>
  );
}

function MacroBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.macroBox}>
      <Text style={[styles.macroVal, { color }]}>{value}</Text>
      <Text style={styles.macroLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.bg },
  scroll: { padding: 20, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  title: { color: '#fff', fontSize: 28, fontWeight: '800' },
  subtitle: { color: theme.textSecondary, fontSize: 14, marginTop: 4 },
  proPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: theme.premium, backgroundColor: theme.premium + '1A' },
  proPillText: { color: theme.premium, fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  summary: { backgroundColor: theme.card, borderRadius: 18, padding: 18, borderWidth: 1, borderColor: theme.border, marginBottom: 14 },
  summaryHead: { flexDirection: 'row', alignItems: 'baseline' },
  summaryKcal: { color: '#fff', fontSize: 36, fontWeight: '900', letterSpacing: -1 },
  summaryGoal: { color: theme.textSecondary, fontSize: 16, fontWeight: '600' },
  progressBg: { height: 10, backgroundColor: theme.cardElevated, borderRadius: 5, overflow: 'hidden', marginTop: 12 },
  progressFill: { height: 10, backgroundColor: theme.primary, borderRadius: 5 },
  macroRow: { flexDirection: 'row', marginTop: 16, gap: 8 },
  macroBox: { flex: 1, backgroundColor: theme.cardElevated, borderRadius: 12, padding: 12, alignItems: 'center' },
  macroVal: { fontSize: 18, fontWeight: '800' },
  macroLabel: { color: theme.textSecondary, fontSize: 11, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.8 },
  addRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: theme.primary, paddingVertical: 14, borderRadius: 14 },
  addBtnText: { color: '#000', fontSize: 15, fontWeight: '800' },
  addBtnGhost: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14, borderWidth: 1, borderColor: theme.border },
  addBtnGhostText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  analyzing: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, backgroundColor: theme.card, borderRadius: 12, borderWidth: 1, borderColor: theme.border, marginBottom: 12 },
  analyzingText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  listTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginTop: 8, marginBottom: 10 },
  foodCard: { flexDirection: 'row', backgroundColor: theme.card, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: theme.border, marginBottom: 10 },
  foodImage: { width: 90, height: 90 },
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
