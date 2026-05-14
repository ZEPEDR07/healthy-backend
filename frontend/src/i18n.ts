import { I18n } from 'i18n-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';

const translations = {
  pt: {
    common: {
      today: 'Hoje',
      yesterday: 'Ontem',
      cancel: 'Cancelar',
      save: 'Guardar',
      delete: 'Apagar',
      confirm: 'Confirmar',
      back: 'Voltar',
      next: 'Continuar',
      finish: 'Terminar',
      loading: 'A carregar...',
      retry: 'Tentar de novo',
      yes: 'Sim',
      no: 'Não',
    },
    tabs: {
      home: 'Hoje',
      nutrition: 'Nutrição',
      history: 'Tendências',
      tips: 'Coach',
      profile: 'Perfil',
    },
    status: {
      ativo: 'Ativo',
      doente: 'Doente',
      aleijado: 'Aleijado',
      ferias: 'De férias',
      title: 'Como te sentes hoje?',
      subtitle: 'Vamos ajustar as recomendações ao teu estado',
    },
    home: {
      strain: 'Strain',
      recovery: 'Recovery',
      sleep: 'Sono',
      coaching: 'COACHING',
      stressEnergy: 'Stress & Energia',
      stressToday: 'Stress hoje',
      highest: 'Máximo',
      lowest: 'Mínimo',
      avg: 'Média',
      stressLow: 'Baixo',
      stressMed: 'Médio',
      stressHigh: 'Alto',
      activity: 'Atividade',
      steps: 'Passos',
      km: 'km',
      floors: 'Andares',
      activeMin: 'Min ativos',
      nutrition: 'Nutrição',
      photo: 'Foto',
      kcal: 'kcal',
      protein: 'Proteína',
      carbs: 'Carbs',
      fat: 'Gordura',
      biology: 'Biologia',
      hrv: 'HRV',
      rhr: 'Resting HR',
      respiration: 'Respiração',
      sleepTotal: 'Sono total',
      synced: 'Sincronizado',
      connected: 'ligado',
      connectedPlural: 'ligados',
      ready: 'Pronto para ir longe',
      balanced: 'Mantém o equilíbrio',
      rest: 'Precisa de descanso',
    },
    trends: {
      title: 'Tendências',
      subtitle: 'Como tens evoluído ao longo do tempo',
      insights: 'Análise',
      recoveryInsight: 'Recovery',
      sleepInsight: 'Sono',
      strainInsight: 'Strain',
      stressInsight: 'Stress',
      stepsInsight: 'Passos',
      kmInsight: 'Distância',
      stable: 'estável',
      improving: 'a melhorar',
      declining: 'a descer',
      improvingBy: 'Subiu {{n}} pontos vs semana anterior',
      decliningBy: 'Desceu {{n}} pontos vs semana anterior',
      stableText: 'Mantém-se estável',
      kmTotal: '{{n}} km esta semana',
      stepsTotal: '{{n}} passos esta semana',
    },
    profile: {
      profile: 'Perfil',
      health: 'Dados de saúde',
      age: 'Idade',
      height: 'Altura',
      weight: 'Peso',
      gender: 'Género',
      goal: 'Objetivo',
      male: 'Masculino',
      female: 'Feminino',
      other: 'Outro',
      devices: 'Dispositivos',
      addDevice: 'Adicionar dispositivo',
      removeDevice: 'Remover dispositivo',
      settings: 'Definições',
      editProfile: 'Editar perfil',
      notifications: 'Notificações',
      units: 'Unidades',
      language: 'Idioma',
      premium: 'Pulse Premium',
      help: 'Ajuda & Suporte',
      logout: 'Terminar sessão',
      logoutConfirm: 'Tens a certeza?',
      version: 'Pulse · v1.2 · Recovery OS',
      synced: 'Sincronizado',
    },
    units: {
      metric: 'Métrico (cm, kg, km)',
      imperial: 'Imperial (in, lb, mi)',
      title: 'Unidades de medida',
    },
    language: {
      title: 'Idioma',
      pt: 'Português',
      en: 'English',
      es: 'Español',
      fr: 'Français',
    },
    notifications: {
      title: 'Notificações',
      empty: 'Sem notificações',
      emptySub: 'Quando algo importante acontecer, aparece aqui',
      markAllRead: 'Marcar todas como lidas',
      preferences: 'Preferências',
      enabled: 'Ativadas',
      dailyRecovery: 'Recovery diário',
      sleepReminder: 'Lembrete de sono',
      workoutReminder: 'Lembrete de treino',
    },
    editProfile: {
      title: 'Editar perfil',
      name: 'Nome',
      saved: 'Perfil atualizado',
    },
    months: {
      january: 'janeiro', february: 'fevereiro', march: 'março', april: 'abril',
      may: 'maio', june: 'junho', july: 'julho', august: 'agosto',
      september: 'setembro', october: 'outubro', november: 'novembro', december: 'dezembro',
    },
    weekdays: {
      sunday: 'domingo', monday: 'segunda-feira', tuesday: 'terça-feira',
      wednesday: 'quarta-feira', thursday: 'quinta-feira', friday: 'sexta-feira', saturday: 'sábado',
    },
    dateFormat: {
      dayOf: '{{day}} de {{month}} de {{year}}',
      today: 'Hoje, {{day}} de {{month}}',
    },
  },
  en: {
    common: { today: 'Today', yesterday: 'Yesterday', cancel: 'Cancel', save: 'Save', delete: 'Delete', confirm: 'Confirm', back: 'Back', next: 'Continue', finish: 'Finish', loading: 'Loading...', retry: 'Try again', yes: 'Yes', no: 'No' },
    tabs: { home: 'Today', nutrition: 'Nutrition', history: 'Trends', tips: 'Coach', profile: 'Profile' },
    status: { ativo: 'Active', doente: 'Sick', aleijado: 'Injured', ferias: 'On vacation', title: 'How do you feel today?', subtitle: 'We will adjust recommendations to your state' },
    home: { strain: 'Strain', recovery: 'Recovery', sleep: 'Sleep', coaching: 'COACHING', stressEnergy: 'Stress & Energy', stressToday: 'Stress today', highest: 'Highest', lowest: 'Lowest', avg: 'Average', stressLow: 'Low', stressMed: 'Medium', stressHigh: 'High', activity: 'Activity', steps: 'Steps', km: 'km', floors: 'Floors', activeMin: 'Active min', nutrition: 'Nutrition', photo: 'Photo', kcal: 'kcal', protein: 'Protein', carbs: 'Carbs', fat: 'Fat', biology: 'Biology', hrv: 'HRV', rhr: 'Resting HR', respiration: 'Respiration', sleepTotal: 'Total sleep', synced: 'Synced', connected: 'connected', connectedPlural: 'connected', ready: 'Ready to push', balanced: 'Keep the balance', rest: 'Needs rest' },
    trends: { title: 'Trends', subtitle: 'How you have evolved over time', insights: 'Insights', recoveryInsight: 'Recovery', sleepInsight: 'Sleep', strainInsight: 'Strain', stressInsight: 'Stress', stepsInsight: 'Steps', kmInsight: 'Distance', stable: 'stable', improving: 'improving', declining: 'declining', improvingBy: 'Up {{n}} points vs last week', decliningBy: 'Down {{n}} points vs last week', stableText: 'Holding steady', kmTotal: '{{n}} km this week', stepsTotal: '{{n}} steps this week' },
    profile: { profile: 'Profile', health: 'Health data', age: 'Age', height: 'Height', weight: 'Weight', gender: 'Gender', goal: 'Goal', male: 'Male', female: 'Female', other: 'Other', devices: 'Devices', addDevice: 'Add device', removeDevice: 'Remove device', settings: 'Settings', editProfile: 'Edit profile', notifications: 'Notifications', units: 'Units', language: 'Language', premium: 'Pulse Premium', help: 'Help & Support', logout: 'Sign out', logoutConfirm: 'Are you sure?', version: 'Pulse · v1.2 · Recovery OS', synced: 'Synced' },
    units: { metric: 'Metric (cm, kg, km)', imperial: 'Imperial (in, lb, mi)', title: 'Measurement units' },
    language: { title: 'Language', pt: 'Português', en: 'English', es: 'Español', fr: 'Français' },
    notifications: { title: 'Notifications', empty: 'No notifications', emptySub: 'When something important happens, it appears here', markAllRead: 'Mark all as read', preferences: 'Preferences', enabled: 'Enabled', dailyRecovery: 'Daily recovery', sleepReminder: 'Sleep reminder', workoutReminder: 'Workout reminder' },
    editProfile: { title: 'Edit profile', name: 'Name', saved: 'Profile updated' },
    months: { january: 'January', february: 'February', march: 'March', april: 'April', may: 'May', june: 'June', july: 'July', august: 'August', september: 'September', october: 'October', november: 'November', december: 'December' },
    weekdays: { sunday: 'Sunday', monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday', thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday' },
    dateFormat: { dayOf: '{{month}} {{day}}, {{year}}', today: 'Today, {{month}} {{day}}' },
  },
  es: {
    common: { today: 'Hoy', yesterday: 'Ayer', cancel: 'Cancelar', save: 'Guardar', delete: 'Eliminar', confirm: 'Confirmar', back: 'Atrás', next: 'Continuar', finish: 'Terminar', loading: 'Cargando...', retry: 'Reintentar', yes: 'Sí', no: 'No' },
    tabs: { home: 'Hoy', nutrition: 'Nutrición', history: 'Tendencias', tips: 'Coach', profile: 'Perfil' },
    status: { ativo: 'Activo', doente: 'Enfermo', aleijado: 'Lesionado', ferias: 'De vacaciones', title: '¿Cómo te sientes hoy?', subtitle: 'Ajustaremos las recomendaciones a tu estado' },
    home: { strain: 'Strain', recovery: 'Recovery', sleep: 'Sueño', coaching: 'COACHING', stressEnergy: 'Estrés y Energía', stressToday: 'Estrés hoy', highest: 'Máximo', lowest: 'Mínimo', avg: 'Promedio', stressLow: 'Bajo', stressMed: 'Medio', stressHigh: 'Alto', activity: 'Actividad', steps: 'Pasos', km: 'km', floors: 'Pisos', activeMin: 'Min activos', nutrition: 'Nutrición', photo: 'Foto', kcal: 'kcal', protein: 'Proteína', carbs: 'Carbs', fat: 'Grasa', biology: 'Biología', hrv: 'HRV', rhr: 'FC reposo', respiration: 'Respiración', sleepTotal: 'Sueño total', synced: 'Sincronizado', connected: 'conectado', connectedPlural: 'conectados', ready: 'Listo para ir lejos', balanced: 'Mantén el equilibrio', rest: 'Necesitas descanso' },
    trends: { title: 'Tendencias', subtitle: 'Tu evolución en el tiempo', insights: 'Análisis', recoveryInsight: 'Recovery', sleepInsight: 'Sueño', strainInsight: 'Strain', stressInsight: 'Estrés', stepsInsight: 'Pasos', kmInsight: 'Distancia', stable: 'estable', improving: 'mejorando', declining: 'bajando', improvingBy: 'Subió {{n}} puntos vs semana anterior', decliningBy: 'Bajó {{n}} puntos vs semana anterior', stableText: 'Se mantiene estable', kmTotal: '{{n}} km esta semana', stepsTotal: '{{n}} pasos esta semana' },
    profile: { profile: 'Perfil', health: 'Datos de salud', age: 'Edad', height: 'Altura', weight: 'Peso', gender: 'Género', goal: 'Objetivo', male: 'Masculino', female: 'Femenino', other: 'Otro', devices: 'Dispositivos', addDevice: 'Agregar dispositivo', removeDevice: 'Quitar dispositivo', settings: 'Ajustes', editProfile: 'Editar perfil', notifications: 'Notificaciones', units: 'Unidades', language: 'Idioma', premium: 'Pulse Premium', help: 'Ayuda y Soporte', logout: 'Cerrar sesión', logoutConfirm: '¿Estás seguro?', version: 'Pulse · v1.2 · Recovery OS', synced: 'Sincronizado' },
    units: { metric: 'Métrico (cm, kg, km)', imperial: 'Imperial (in, lb, mi)', title: 'Unidades de medida' },
    language: { title: 'Idioma', pt: 'Português', en: 'English', es: 'Español', fr: 'Français' },
    notifications: { title: 'Notificaciones', empty: 'Sin notificaciones', emptySub: 'Cuando algo importante pase, aparecerá aquí', markAllRead: 'Marcar todas leídas', preferences: 'Preferencias', enabled: 'Activadas', dailyRecovery: 'Recovery diario', sleepReminder: 'Recordatorio de sueño', workoutReminder: 'Recordatorio de entrenamiento' },
    editProfile: { title: 'Editar perfil', name: 'Nombre', saved: 'Perfil actualizado' },
    months: { january: 'enero', february: 'febrero', march: 'marzo', april: 'abril', may: 'mayo', june: 'junio', july: 'julio', august: 'agosto', september: 'septiembre', october: 'octubre', november: 'noviembre', december: 'diciembre' },
    weekdays: { sunday: 'domingo', monday: 'lunes', tuesday: 'martes', wednesday: 'miércoles', thursday: 'jueves', friday: 'viernes', saturday: 'sábado' },
    dateFormat: { dayOf: '{{day}} de {{month}} de {{year}}', today: 'Hoy, {{day}} de {{month}}' },
  },
  fr: {
    common: { today: 'Aujourd\'hui', yesterday: 'Hier', cancel: 'Annuler', save: 'Enregistrer', delete: 'Supprimer', confirm: 'Confirmer', back: 'Retour', next: 'Continuer', finish: 'Terminer', loading: 'Chargement...', retry: 'Réessayer', yes: 'Oui', no: 'Non' },
    tabs: { home: 'Aujourd\'hui', nutrition: 'Nutrition', history: 'Tendances', tips: 'Coach', profile: 'Profil' },
    status: { ativo: 'Actif', doente: 'Malade', aleijado: 'Blessé', ferias: 'En vacances', title: 'Comment te sens-tu aujourd\'hui?', subtitle: 'Nous ajusterons les recommandations à ton état' },
    home: { strain: 'Strain', recovery: 'Recovery', sleep: 'Sommeil', coaching: 'COACHING', stressEnergy: 'Stress & Énergie', stressToday: 'Stress aujourd\'hui', highest: 'Maximum', lowest: 'Minimum', avg: 'Moyenne', stressLow: 'Bas', stressMed: 'Moyen', stressHigh: 'Élevé', activity: 'Activité', steps: 'Pas', km: 'km', floors: 'Étages', activeMin: 'Min actives', nutrition: 'Nutrition', photo: 'Photo', kcal: 'kcal', protein: 'Protéine', carbs: 'Glucides', fat: 'Graisse', biology: 'Biologie', hrv: 'HRV', rhr: 'FC repos', respiration: 'Respiration', sleepTotal: 'Sommeil total', synced: 'Synchronisé', connected: 'connecté', connectedPlural: 'connectés', ready: 'Prêt à aller loin', balanced: 'Garde l\'équilibre', rest: 'Besoin de repos' },
    trends: { title: 'Tendances', subtitle: 'Ton évolution dans le temps', insights: 'Analyse', recoveryInsight: 'Recovery', sleepInsight: 'Sommeil', strainInsight: 'Strain', stressInsight: 'Stress', stepsInsight: 'Pas', kmInsight: 'Distance', stable: 'stable', improving: 'en hausse', declining: 'en baisse', improvingBy: '+{{n}} points vs semaine dernière', decliningBy: '-{{n}} points vs semaine dernière', stableText: 'Reste stable', kmTotal: '{{n}} km cette semaine', stepsTotal: '{{n}} pas cette semaine' },
    profile: { profile: 'Profil', health: 'Données santé', age: 'Âge', height: 'Taille', weight: 'Poids', gender: 'Genre', goal: 'Objectif', male: 'Masculin', female: 'Féminin', other: 'Autre', devices: 'Appareils', addDevice: 'Ajouter un appareil', removeDevice: 'Retirer un appareil', settings: 'Paramètres', editProfile: 'Modifier le profil', notifications: 'Notifications', units: 'Unités', language: 'Langue', premium: 'Pulse Premium', help: 'Aide & Support', logout: 'Déconnexion', logoutConfirm: 'Es-tu sûr?', version: 'Pulse · v1.2 · Recovery OS', synced: 'Synchronisé' },
    units: { metric: 'Métrique (cm, kg, km)', imperial: 'Impérial (in, lb, mi)', title: 'Unités de mesure' },
    language: { title: 'Langue', pt: 'Português', en: 'English', es: 'Español', fr: 'Français' },
    notifications: { title: 'Notifications', empty: 'Aucune notification', emptySub: 'Quand quelque chose d\'important arrive, ça apparaît ici', markAllRead: 'Tout marquer comme lu', preferences: 'Préférences', enabled: 'Activées', dailyRecovery: 'Recovery quotidien', sleepReminder: 'Rappel de sommeil', workoutReminder: 'Rappel d\'entraînement' },
    editProfile: { title: 'Modifier le profil', name: 'Nom', saved: 'Profil mis à jour' },
    months: { january: 'janvier', february: 'février', march: 'mars', april: 'avril', may: 'mai', june: 'juin', july: 'juillet', august: 'août', september: 'septembre', october: 'octobre', november: 'novembre', december: 'décembre' },
    weekdays: { sunday: 'dimanche', monday: 'lundi', tuesday: 'mardi', wednesday: 'mercredi', thursday: 'jeudi', friday: 'vendredi', saturday: 'samedi' },
    dateFormat: { dayOf: '{{day}} {{month}} {{year}}', today: 'Aujourd\'hui, {{day}} {{month}}' },
  },
};

export const i18n = new I18n(translations);
i18n.enableFallback = true;
i18n.defaultLocale = 'pt';
i18n.locale = 'pt';

const STORAGE_KEY = 'app_language';

export async function initLanguage() {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored && ['pt', 'en', 'es', 'fr'].includes(stored)) {
      i18n.locale = stored;
      return stored;
    }
    const deviceLocale = (Localization.getLocales?.()[0]?.languageCode || 'pt').toLowerCase();
    const lang = ['pt', 'en', 'es', 'fr'].includes(deviceLocale) ? deviceLocale : 'pt';
    i18n.locale = lang;
    return lang;
  } catch {
    return 'pt';
  }
}

export async function setLanguage(lang: 'pt' | 'en' | 'es' | 'fr') {
  i18n.locale = lang;
  await AsyncStorage.setItem(STORAGE_KEY, lang);
}

export function t(key: string, options?: any) {
  return i18n.t(key, options);
}

// ============ FORMATTERS ============
const MONTH_KEYS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
const WEEKDAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export function formatLongDate(date: Date, isToday = false) {
  const day = date.getDate();
  const monthName = t(`months.${MONTH_KEYS[date.getMonth()]}`);
  const year = date.getFullYear();
  if (isToday) {
    return t('dateFormat.today', { day, month: monthName });
  }
  return t('dateFormat.dayOf', { day, month: monthName, year });
}

export function formatWeekdayShort(date: Date) {
  const k = WEEKDAY_KEYS[date.getDay()];
  return t(`weekdays.${k}`).slice(0, 3);
}

export function formatWeekdayLong(date: Date) {
  const k = WEEKDAY_KEYS[date.getDay()];
  return t(`weekdays.${k}`);
}

// ============ UNIT CONVERSIONS ============
export type UnitSystem = 'metric' | 'imperial';

export function formatHeight(cm: number | undefined | null, system: UnitSystem) {
  if (cm == null) return '—';
  if (system === 'imperial') {
    const totalInches = cm / 2.54;
    const ft = Math.floor(totalInches / 12);
    const inch = Math.round(totalInches - ft * 12);
    return `${ft}' ${inch}"`;
  }
  return `${cm} cm`;
}

export function formatWeight(kg: number | undefined | null, system: UnitSystem) {
  if (kg == null) return '—';
  if (system === 'imperial') {
    return `${Math.round(kg * 2.20462)} lb`;
  }
  return `${kg} kg`;
}

export function formatDistance(km: number | undefined | null, system: UnitSystem) {
  if (km == null) return '—';
  if (system === 'imperial') {
    return `${(km * 0.621371).toFixed(2)} mi`;
  }
  return `${km.toFixed(2)} km`;
}

export function distanceUnit(system: UnitSystem) {
  return system === 'imperial' ? 'mi' : 'km';
}
