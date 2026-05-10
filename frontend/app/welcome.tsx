import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../src/theme';

export default function Welcome() {
  const router = useRouter();
  return (
    <ImageBackground
      source={{ uri: 'https://images.unsplash.com/photo-1637974013743-82656f7c3f49?crop=entropy&cs=srgb&fm=jpg&w=900&q=80' }}
      style={styles.bg}
      resizeMode="cover"
    >
      <View style={styles.overlay} />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.top}>
          <Text style={styles.brandTag}>PULSE · RECOVERY OS</Text>
        </View>
        <View style={styles.bottom}>
          <Text testID="welcome-title" style={styles.title}>O teu corpo,{"\n"}em código.</Text>
          <Text style={styles.subtitle}>
            Recovery, sono, esforço e stress dos teus dispositivos — num único painel.
          </Text>
          <TouchableOpacity
            testID="welcome-register-btn"
            style={styles.primary}
            onPress={() => router.push('/(auth)/register')}
          >
            <Text style={styles.primaryText}>Começar agora</Text>
          </TouchableOpacity>
          <TouchableOpacity
            testID="welcome-login-btn"
            style={styles.secondary}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={styles.secondaryText}>Já tenho conta</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#000' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(8,8,10,0.72)' },
  safe: { flex: 1, padding: 24, justifyContent: 'space-between' },
  top: { paddingTop: 8 },
  brandTag: { color: theme.recovery, fontSize: 12, letterSpacing: 2, fontWeight: '700' },
  bottom: { paddingBottom: 12 },
  title: { color: '#fff', fontSize: 44, fontWeight: '900', letterSpacing: -1, lineHeight: 48 },
  subtitle: { color: theme.textSecondary, fontSize: 16, marginTop: 16, marginBottom: 32, lineHeight: 22 },
  primary: { backgroundColor: '#fff', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginBottom: 12 },
  primaryText: { color: '#000', fontSize: 16, fontWeight: '700' },
  secondary: { borderRadius: 14, paddingVertical: 16, alignItems: 'center', borderWidth: 1, borderColor: theme.border },
  secondaryText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
