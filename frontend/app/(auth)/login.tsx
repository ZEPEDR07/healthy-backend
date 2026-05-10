import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/auth';
import { theme } from '../../src/theme';

export default function Login() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Erro', 'Preenche email e palavra-passe.');
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), password);
      router.replace('/');
    } catch (e: any) {
      Alert.alert('Falha no login', e.message || 'Tenta novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <TouchableOpacity testID="login-back-btn" onPress={() => router.back()} style={styles.back}>
            <Ionicons name="chevron-back" size={26} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Bem-vindo de volta</Text>
          <Text style={styles.subtitle}>Entra para ver a tua recuperação de hoje.</Text>

          <Text style={styles.label}>Email</Text>
          <TextInput
            testID="login-email-input"
            value={email}
            onChangeText={setEmail}
            placeholder="tu@exemplo.com"
            placeholderTextColor={theme.textTertiary}
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
          />
          <Text style={styles.label}>Palavra-passe</Text>
          <TextInput
            testID="login-password-input"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor={theme.textTertiary}
            secureTextEntry
            style={styles.input}
          />

          <TouchableOpacity
            testID="login-submit-btn"
            style={[styles.primary, loading && { opacity: 0.6 }]}
            onPress={onSubmit}
            disabled={loading}
          >
            <Text style={styles.primaryText}>{loading ? 'A entrar...' : 'Entrar'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            testID="login-to-register-btn"
            onPress={() => router.replace('/(auth)/register')}
            style={{ marginTop: 18, alignItems: 'center' }}
          >
            <Text style={styles.linkText}>Ainda não tens conta? <Text style={{ color: '#fff', fontWeight: '700' }}>Regista-te</Text></Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.bg },
  scroll: { padding: 24, paddingTop: 8, paddingBottom: 32 },
  back: { width: 44, height: 44, alignItems: 'flex-start', justifyContent: 'center', marginBottom: 8 },
  title: { color: '#fff', fontSize: 32, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { color: theme.textSecondary, fontSize: 15, marginTop: 8, marginBottom: 28 },
  label: { color: theme.textSecondary, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.2, marginTop: 12, marginBottom: 8 },
  input: {
    backgroundColor: theme.card, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
    color: '#fff', borderWidth: 1, borderColor: theme.border, fontSize: 16,
  },
  primary: { backgroundColor: '#fff', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 24 },
  primaryText: { color: '#000', fontSize: 16, fontWeight: '700' },
  linkText: { color: theme.textSecondary, fontSize: 14 },
});
