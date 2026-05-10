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

export default function Register() {
  const router = useRouter();
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!name || !email || !password) {
      Alert.alert('Erro', 'Preenche todos os campos.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Erro', 'Palavra-passe com pelo menos 6 caracteres.');
      return;
    }
    setLoading(true);
    try {
      await register(email.trim(), password, name.trim());
      router.replace('/');
    } catch (e: any) {
      Alert.alert('Erro no registo', e.message || 'Tenta novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <TouchableOpacity testID="register-back-btn" onPress={() => router.back()} style={styles.back}>
            <Ionicons name="chevron-back" size={26} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Cria a tua conta</Text>
          <Text style={styles.subtitle}>30 segundos. Sem cartão de crédito.</Text>

          <Text style={styles.label}>Nome</Text>
          <TextInput
            testID="register-name-input"
            value={name} onChangeText={setName}
            placeholder="O teu nome" placeholderTextColor={theme.textTertiary}
            style={styles.input}
          />
          <Text style={styles.label}>Email</Text>
          <TextInput
            testID="register-email-input"
            value={email} onChangeText={setEmail}
            placeholder="tu@exemplo.com" placeholderTextColor={theme.textTertiary}
            autoCapitalize="none" keyboardType="email-address" style={styles.input}
          />
          <Text style={styles.label}>Palavra-passe</Text>
          <TextInput
            testID="register-password-input"
            value={password} onChangeText={setPassword}
            placeholder="Mín. 6 caracteres" placeholderTextColor={theme.textTertiary}
            secureTextEntry style={styles.input}
          />

          <TouchableOpacity
            testID="register-submit-btn"
            style={[styles.primary, loading && { opacity: 0.6 }]}
            onPress={onSubmit} disabled={loading}
          >
            <Text style={styles.primaryText}>{loading ? 'A criar...' : 'Criar conta'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            testID="register-to-login-btn"
            onPress={() => router.replace('/(auth)/login')}
            style={{ marginTop: 18, alignItems: 'center' }}
          >
            <Text style={styles.linkText}>Já tens conta? <Text style={{ color: '#fff', fontWeight: '700' }}>Entrar</Text></Text>
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
