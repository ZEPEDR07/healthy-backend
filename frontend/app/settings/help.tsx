import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { theme } from '../../src/theme';
import { t } from '../../src/i18n';

const FAQ = [
  {
    q: 'Como adiciono um dispositivo à minha conta?',
    a: 'Vai a Perfil → Dispositivos → Adicionar dispositivo. Podes pesquisar por marca ou modelo. Após adicionar, o sistema tenta ligar via Bluetooth.',
  },
  {
    q: 'Os meus dados são reais ou simulados?',
    a: 'Por enquanto os dados de recovery, sono e strain são gerados automaticamente com base no teu perfil. As fotos de nutrição são analisadas por IA em tempo real.',
  },
  {
    q: 'Como funciona a análise de nutrição por foto?',
    a: 'Tira uma foto da tua refeição no separador Nutrição. A IA identifica os alimentos e estima as calorias, proteínas, hidratos e gorduras. Podes adicionar uma nota para mais contexto.',
  },
  {
    q: 'O que é o Recovery Score?',
    a: 'O Recovery Score (0-100%) indica a tua capacidade de esforço para o dia. Acima de 67% estás pronto para treinar forte. Entre 34-66% mantém um esforço moderado. Abaixo de 34% descansa.',
  },
  {
    q: 'O que é o Strain Score?',
    a: 'O Strain mede o esforço cardiovascular do dia numa escala de 0 a 21. Valores acima de 14 representam treinos intensos. O ideal é equilibrar o strain com o teu recovery.',
  },
  {
    q: 'Como mudo as unidades para Imperial (lbs, ft, miles)?',
    a: 'Vai a Perfil → Definições → Unidades e activa o modo Imperial. A altura, peso e distâncias passam a mostrar em polegadas, libras e milhas.',
  },
  {
    q: 'Como mudo o idioma da app?',
    a: 'Vai a Perfil → Definições → Idioma. Podes escolher entre Português, English, Español e Français. A app reinicia para aplicar a mudança.',
  },
  {
    q: 'Como altero o meu perfil e objetivos?',
    a: 'Vai a Perfil → Definições → Editar perfil. Podes alterar o nome, idade, género, altura, peso e objetivo de saúde.',
  },
  {
    q: 'Posso usar a app sem um smartwatch?',
    a: 'Sim! Podes usar todas as funcionalidades manualmente. A análise de nutrição por foto, as dicas de coaching e o histórico de tendências funcionam sem dispositivo ligado.',
  },
  {
    q: 'O que é o Body Battery?',
    a: 'O Body Battery (0-100%) representa a tua energia disponível. É calculado com base no sono, stress e atividade. Um body battery alto significa que tens energia para o dia.',
  },
  {
    q: 'Como funcionam as notificações?',
    a: 'Vai a Perfil → Definições → Notificações para activar lembretes de recovery diário, sono e treino. As notificações são enviadas nos horários configurados.',
  },
  {
    q: 'Os meus dados ficam privados?',
    a: 'Os teus dados ficam guardados de forma segura na nossa base de dados. Nunca partilhamos dados pessoais com terceiros. Podes apagar a tua conta a qualquer momento.',
  },
  {
    q: 'Como contacto o suporte?',
    a: 'Para problemas não cobertos aqui, envia um email para support@healthy-app.com. Respondemos em 24-48 horas úteis.',
  },
];

export default function HelpScreen() {
  const router = useRouter();
  const [open, setOpen] = useState<number | null>(null);

  const toggle = (idx: number) => setOpen(open === idx ? null : idx);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>{t('profile.help')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.intro}>
          Encontra respostas às perguntas mais comuns. Clica numa pergunta para ver a resposta.
        </Text>

        <View style={styles.card}>
          {FAQ.map((item, idx) => (
            <View key={idx} style={[styles.item, idx === FAQ.length - 1 && { borderBottomWidth: 0 }]}>
              <TouchableOpacity style={styles.question} onPress={() => toggle(idx)} activeOpacity={0.7}>
                <Text style={styles.questionText}>{item.q}</Text>
                <Ionicons
                  name={open === idx ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={open === idx ? theme.primary : theme.textSecondary}
                />
              </TouchableOpacity>
              {open === idx && (
                <Text style={styles.answer}>{item.a}</Text>
              )}
            </View>
          ))}
        </View>

        <View style={styles.contactCard}>
          <Ionicons name="mail-outline" size={22} color={theme.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.contactTitle}>Ainda tens dúvidas?</Text>
            <Text style={styles.contactSub}>support@healthy-app.com</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  back: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border },
  title: { color: '#fff', fontSize: 18, fontWeight: '800' },
  scroll: { padding: 16, paddingBottom: 40 },
  intro: { color: theme.textSecondary, fontSize: 14, lineHeight: 20, marginBottom: 20 },
  card: { backgroundColor: theme.card, borderRadius: 16, borderWidth: 1, borderColor: theme.border, overflow: 'hidden', marginBottom: 20 },
  item: { borderBottomWidth: 1, borderBottomColor: theme.border },
  question: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, gap: 12 },
  questionText: { color: '#fff', fontSize: 14, fontWeight: '600', flex: 1, lineHeight: 20 },
  answer: { color: theme.textSecondary, fontSize: 13, lineHeight: 20, paddingHorizontal: 16, paddingBottom: 16 },
  contactCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, backgroundColor: theme.card, borderRadius: 16, borderWidth: 1, borderColor: theme.primary + '33' },
  contactTitle: { color: '#fff', fontSize: 14, fontWeight: '700' },
  contactSub: { color: theme.primary, fontSize: 13, marginTop: 2 },
});
