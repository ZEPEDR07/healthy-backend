import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Pressable, Platform } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../src/theme';
import { formatLongDate } from '../src/i18n';
import { t } from '../src/i18n';

type Props = {
  visible: boolean;
  onClose: () => void;
  selected: Date;
  onChange: (d: Date) => void;
};

export default function DatePickerSheet({ visible, onClose, selected, onChange }: Props) {
  const [tempDate, setTempDate] = React.useState<Date>(selected);

  React.useEffect(() => { setTempDate(selected); }, [selected, visible]);

  const apply = () => {
    onChange(tempDate);
    onClose();
  };

  const setDays = (offset: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    setTempDate(d);
  };

  // Web fallback: use a simple input[type=date]
  if (Platform.OS === 'web') {
    return (
      <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
        <Pressable style={styles.backdrop} onPress={onClose}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.handle} />
            <Text style={styles.title}>{t('common.confirm')}</Text>
            <View style={styles.quickRow}>
              <QuickBtn label={t('common.today')} onPress={() => setDays(0)} />
              <QuickBtn label={t('common.yesterday')} onPress={() => setDays(-1)} />
            </View>
            {/* @ts-ignore */}
            <input
              type="date"
              value={tempDate.toISOString().slice(0, 10)}
              onChange={(e: any) => setTempDate(new Date(e.target.value + 'T00:00:00'))}
              max={new Date().toISOString().slice(0, 10)}
              style={{
                background: theme.bg, color: '#fff', border: `1px solid ${theme.border}`,
                borderRadius: 12, padding: 14, fontSize: 16, marginBottom: 16, width: '100%',
              }}
            />
            <Text style={styles.preview}>{formatLongDate(tempDate, sameDay(tempDate, new Date()))}</Text>
            <View style={styles.btnRow}>
              <TouchableOpacity style={styles.cancel} onPress={onClose}>
                <Text style={styles.cancelText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.apply} onPress={apply}>
                <Text style={styles.applyText}>{t('common.confirm')}</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    );
  }

  const onPickerChange = (_: DateTimePickerEvent, d?: Date) => {
    if (d) setTempDate(d);
  };

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <Text style={styles.title}>{t('common.confirm')}</Text>
          <View style={styles.quickRow}>
            <QuickBtn label={t('common.today')} onPress={() => setDays(0)} />
            <QuickBtn label={t('common.yesterday')} onPress={() => setDays(-1)} />
          </View>
          <DateTimePicker
            value={tempDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            maximumDate={new Date()}
            onChange={onPickerChange}
            themeVariant="dark"
          />
          <Text style={styles.preview}>{formatLongDate(tempDate, sameDay(tempDate, new Date()))}</Text>
          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.cancel} onPress={onClose}>
              <Text style={styles.cancelText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.apply} onPress={apply}>
              <Text style={styles.applyText}>{t('common.confirm')}</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function QuickBtn({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.quickBtn} onPress={onPress}>
      <Text style={styles.quickText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: theme.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 32, borderTopWidth: 1, borderColor: theme.border },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: theme.border, alignSelf: 'center', marginBottom: 14 },
  title: { color: '#fff', fontSize: 18, fontWeight: '800', textAlign: 'center', marginBottom: 14 },
  quickRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  quickBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: theme.cardElevated, alignItems: 'center', borderWidth: 1, borderColor: theme.border },
  quickText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  preview: { color: theme.primary, fontSize: 14, fontWeight: '700', textAlign: 'center', marginTop: 12, marginBottom: 8 },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  cancel: { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: theme.border, alignItems: 'center' },
  cancelText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  apply: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: theme.primary, alignItems: 'center' },
  applyText: { color: '#000', fontSize: 15, fontWeight: '800' },
});
