import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../src/theme';
import { useAuth, StatusType } from '../src/auth';
import { t } from '../src/i18n';

const OPTIONS: { id: StatusType; icon: any; color: string }[] = [
  { id: 'ativo', icon: 'pulse', color: theme.recovery },
  { id: 'doente', icon: 'thermometer', color: theme.stressOrange },
  { id: 'aleijado', icon: 'bandage', color: theme.stressRed },
  { id: 'ferias', icon: 'airplane', color: theme.sleep },
];

export default function StatusSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { status, setStatus } = useAuth();

  const pick = async (s: StatusType) => {
    await setStatus(s);
    onClose();
  };

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <Text style={styles.title}>{t('status.title')}</Text>
          <Text style={styles.subtitle}>{t('status.subtitle')}</Text>
          <View style={styles.grid}>
            {OPTIONS.map((o) => {
              const active = status === o.id;
              return (
                <TouchableOpacity
                  key={o.id}
                  testID={`status-${o.id}`}
                  style={[styles.option, active && { borderColor: o.color, backgroundColor: o.color + '1A' }]}
                  onPress={() => pick(o.id)}
                >
                  <View style={[styles.iconCircle, { backgroundColor: o.color + '33' }]}>
                    <Ionicons name={o.icon} size={22} color={o.color} />
                  </View>
                  <Text style={styles.optLabel}>{t(`status.${o.id}`)}</Text>
                  {active && <Ionicons name="checkmark-circle" size={18} color={o.color} style={{ position: 'absolute', top: 10, right: 10 }} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: theme.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 32, borderTopWidth: 1, borderColor: theme.border },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: theme.border, alignSelf: 'center', marginBottom: 14 },
  title: { color: '#fff', fontSize: 20, fontWeight: '800', textAlign: 'center' },
  subtitle: { color: theme.textSecondary, fontSize: 13, textAlign: 'center', marginTop: 6, marginBottom: 22 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between' },
  option: { width: '48%', backgroundColor: theme.bg, padding: 16, borderRadius: 14, borderWidth: 1, borderColor: theme.border, alignItems: 'flex-start' },
  iconCircle: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  optLabel: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
