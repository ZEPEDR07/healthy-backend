import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/auth';
import { theme } from '../../src/theme';
import { t } from '../../src/i18n';

export default function LanguageScreen() {
  const router = useRouter();
  const { prefs, setPrefs } = useAuth();

  const opts: { id: 'pt' | 'en' | 'es' | 'fr'; flag: string }[] = [
    { id: 'pt', flag: '🇵🇹' },
    { id: 'en', flag: '🇬🇧' },
    { id: 'es', flag: '🇪🇸' },
    { id: 'fr', flag: '🇫🇷' },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity testID="lang-back-btn" onPress={() => router.back()} style={styles.back}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>{t('language.title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {opts.map((o) => {
          const active = prefs.language === o.id;
          return (
            <TouchableOpacity
              key={o.id}
              testID={`lang-${o.id}`}
              style={[styles.opt, active && styles.optActive]}
              onPress={async () => { await setPrefs({ language: o.id }); router.replace('/(tabs)'); }}
            >
              <Text style={styles.flag}>{o.flag}</Text>
              <Text style={styles.optLabel}>{t(`language.${o.id}`)}</Text>
              {active && <Ionicons name="checkmark-circle" size={22} color={theme.primary} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  back: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border },
  title: { color: '#fff', fontSize: 18, fontWeight: '800' },
  scroll: { padding: 16 },
  opt: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: theme.card, padding: 16, borderRadius: 14, borderWidth: 1, borderColor: theme.border, marginBottom: 10 },
  optActive: { borderColor: theme.primary },
  flag: { fontSize: 22 },
  optLabel: { color: '#fff', fontSize: 15, fontWeight: '700', flex: 1 },
});
