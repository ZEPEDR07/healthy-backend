import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/auth';
import { theme } from '../../src/theme';
import { t } from '../../src/i18n';

const GOALS = ['performance', 'sleep', 'stress', 'weight', 'general'];
const GENDERS = ['male', 'female', 'other'];

export default function EditProfile() {
  const router = useRouter();
  const { user, updateProfile, prefs } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [age, setAge] = useState(user?.age?.toString() || '');
  const [gender, setGender] = useState(user?.gender || 'male');
  const [height, setHeight] = useState(user?.height_cm?.toString() || '');
  const [weight, setWeight] = useState(user?.weight_kg?.toString() || '');
  const [goal, setGoal] = useState(user?.goal || 'performance');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      let heightCm = height ? parseFloat(height) : undefined;
      let weightKg = weight ? parseFloat(weight) : undefined;
      // Convert imperial → metric for storage
      if (prefs.units === 'imperial') {
        if (heightCm != null) heightCm = Math.round(heightCm * 2.54);
        if (weightKg != null) weightKg = Math.round(weightKg / 2.20462 * 10) / 10;
      }
      await updateProfile({
        name: name.trim() || undefined,
        age: age ? parseInt(age) : undefined,
        gender,
        height_cm: heightCm,
        weight_kg: weightKg,
        goal,
      });
      Alert.alert(t('editProfile.saved'));
      router.back();
    } catch (e: any) {
      Alert.alert('Erro', e.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  // Display height/weight in the user's chosen unit (input expects same unit)
  const heightLabel = prefs.units === 'imperial' ? 'in' : 'cm';
  const weightLabel = prefs.units === 'imperial' ? 'lb' : 'kg';

  // Pre-populate inputs in imperial if user chose imperial
  React.useEffect(() => {
    if (prefs.units === 'imperial') {
      if (user?.height_cm) setHeight(Math.round(user.height_cm / 2.54).toString());
      if (user?.weight_kg) setWeight(Math.round(user.weight_kg * 2.20462).toString());
    } else {
      if (user?.height_cm) setHeight(user.height_cm.toString());
      if (user?.weight_kg) setWeight(user.weight_kg.toString());
    }
  }, [prefs.units, user]);

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity testID="edit-back-btn" onPress={() => router.back()} style={styles.back}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>{t('editProfile.title')}</Text>
          <TouchableOpacity testID="edit-save-btn" onPress={save} disabled={saving} style={styles.saveBtn}>
            <Text style={styles.saveText}>{saving ? '...' : t('common.save')}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>{t('editProfile.name')}</Text>
          <TextInput testID="edit-name" style={styles.input} value={name} onChangeText={setName} placeholderTextColor={theme.textTertiary} />

          <Text style={styles.label}>{t('profile.age')}</Text>
          <TextInput testID="edit-age" style={styles.input} value={age} onChangeText={setAge} keyboardType="number-pad" placeholderTextColor={theme.textTertiary} />

          <Text style={styles.label}>{t('profile.gender')}</Text>
          <View style={styles.row3}>
            {GENDERS.map((g) => (
              <TouchableOpacity
                key={g}
                testID={`edit-gender-${g}`}
                style={[styles.chip, gender === g && styles.chipActive]}
                onPress={() => setGender(g)}
              >
                <Text style={[styles.chipText, gender === g && { color: '#000' }]}>{t(`profile.${g}`)}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.row2}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.label}>{t('profile.height')} ({heightLabel})</Text>
              <TextInput testID="edit-height" style={styles.input} value={height} onChangeText={setHeight} keyboardType="decimal-pad" placeholderTextColor={theme.textTertiary} />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.label}>{t('profile.weight')} ({weightLabel})</Text>
              <TextInput testID="edit-weight" style={styles.input} value={weight} onChangeText={setWeight} keyboardType="decimal-pad" placeholderTextColor={theme.textTertiary} />
            </View>
          </View>

          <Text style={styles.label}>{t('profile.goal')}</Text>
          {GOALS.map((g) => (
            <TouchableOpacity
              key={g}
              testID={`edit-goal-${g}`}
              style={[styles.goalRow, goal === g && styles.goalActive]}
              onPress={() => setGoal(g)}
            >
              <Text style={[styles.goalText, goal === g && { color: '#000' }]}>
                {g === 'performance' ? 'Performance' : g === 'sleep' ? 'Sleep' : g === 'stress' ? 'Stress' : g === 'weight' ? 'Weight' : 'General'}
              </Text>
              {goal === g && <Ionicons name="checkmark" size={22} color="#000" />}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  back: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border },
  title: { color: '#fff', fontSize: 18, fontWeight: '800' },
  saveBtn: { paddingHorizontal: 14, paddingVertical: 10, backgroundColor: theme.primary, borderRadius: 10 },
  saveText: { color: '#000', fontSize: 13, fontWeight: '800' },
  scroll: { padding: 16, paddingBottom: 32 },
  label: { color: theme.textSecondary, fontSize: 12, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 8, marginTop: 14 },
  input: { backgroundColor: theme.card, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: '#fff', borderWidth: 1, borderColor: theme.border, fontSize: 15 },
  row2: { flexDirection: 'row' },
  row3: { flexDirection: 'row', gap: 8 },
  chip: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.card },
  chipActive: { backgroundColor: theme.primary, borderColor: theme.primary },
  chipText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  goalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: theme.card, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: theme.border, marginBottom: 8 },
  goalActive: { backgroundColor: theme.primary, borderColor: theme.primary },
  goalText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
