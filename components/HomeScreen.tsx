import { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useLanguage } from '@/lib/LanguageContext';
import { calculateCycleInfo, CyclePhase } from '@/lib/cycleCalculations';
import { schedulePeriodReminders } from '@/lib/periodReminders';

const phaseEmoji: Record<CyclePhase, string> = {
  menstrual: '🩸',
  follicular: '🌱',
  ovulation: '✨',
  luteal: '🌙',
};

const phaseColor: Record<CyclePhase, string> = {
  menstrual: '#D46A9F',
  follicular: '#7CB88F',
  ovulation: '#C9A227',
  luteal: '#8E5FBF',
};

function getGreeting(lang: 'en' | 'tr') {
  const hour = new Date().getHours();
  if (lang === 'tr') {
    if (hour < 12) return 'Günaydın';
    if (hour < 18) return 'İyi günler';
    return 'İyi akşamlar';
  }
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function HomeScreen({
  profile,
  onNavigate,
}: {
  profile: {
    full_name: string | null;
    last_period_start: string;
    avg_cycle_length: number;
    avg_period_length: number;
  };
  onNavigate?: (tab: string) => void;
}) {
  const { t, lang } = useLanguage();

  const info = calculateCycleInfo(
    profile.last_period_start,
    profile.avg_cycle_length,
    profile.avg_period_length
  );

  useEffect(() => {
    (async () => {
      const { status: existing } = await Notifications.getPermissionsAsync();
      let granted = existing === 'granted';
      if (!granted) {
        const { status } = await Notifications.requestPermissionsAsync();
        granted = status === 'granted';
      }
      if (granted) {
        await schedulePeriodReminders(
          profile.last_period_start,
          profile.avg_cycle_length,
          profile.avg_period_length,
          lang
        );
      }
    })();
  }, [profile.last_period_start, profile.avg_cycle_length, profile.avg_period_length, lang]);

  const phaseLabel = {
    menstrual: t.phaseMenstrual,
    follicular: t.phaseFollicular,
    ovulation: t.phaseOvulation,
    luteal: t.phaseLuteal,
  }[info.phase];

  const formatDate = (d: Date) =>
    d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

  const cycleProgress = Math.min(
    Math.max((profile.avg_cycle_length - info.daysUntilNextPeriod) / profile.avg_cycle_length, 0),
    1
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.greeting}>
        {getGreeting(lang)}{profile.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''} 👋
      </Text>

      <View style={[styles.phaseCard, { backgroundColor: phaseColor[info.phase] }]}>
        <Text style={styles.phaseEmoji}>{phaseEmoji[info.phase]}</Text>
        <Text style={styles.phaseLabel}>{phaseLabel}</Text>

        {info.daysUntilNextPeriod <= 0 ? (
          <Text style={styles.statusText}>{t.periodToday}</Text>
        ) : (
          <Text style={styles.statusText}>
            {info.daysUntilNextPeriod} {t.daysUntilPeriod}
          </Text>
        )}

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${cycleProgress * 100}%` }]} />
        </View>

        {info.isInFertileWindow && (
          <View style={styles.fertileBadge}>
            <Text style={styles.fertileBadgeText}>✨ {t.inFertileWindow}</Text>
          </View>
        )}
      </View>

      <View style={styles.infoRow}>
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>{t.nextPeriod}</Text>
          <Text style={styles.infoValue}>{formatDate(info.nextPeriodDate)}</Text>
        </View>
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>{t.ovulation}</Text>
          <Text style={styles.infoValue}>{formatDate(info.ovulationDate)}</Text>
        </View>
      </View>

      {onNavigate && (
        <>
          <View style={styles.quickRow}>
            <TouchableOpacity style={styles.quickCard} onPress={() => onNavigate('symptoms')}>
              <Text style={styles.quickEmoji}>🩺</Text>
              <Text style={styles.quickLabel}>{t.tabSymptoms}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickCard} onPress={() => onNavigate('meds')}>
              <Text style={styles.quickEmoji}>💊</Text>
              <Text style={styles.quickLabel}>{t.tabMeds}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.quickRow}>
            <TouchableOpacity style={styles.quickCard} onPress={() => onNavigate('appointments')}>
              <Text style={styles.quickEmoji}>🗓️</Text>
              <Text style={styles.quickLabel}>{t.tabAppointments}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickCard} onPress={() => onNavigate('learn')}>
              <Text style={styles.quickEmoji}>📖</Text>
              <Text style={styles.quickLabel}>{lang === 'tr' ? 'Öğren' : 'Learn'}</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FCEEF3' },
  content: { padding: 20, paddingTop: 70, paddingBottom: 40 },
  greeting: { fontSize: 22, fontWeight: '700', color: '#4A2C6D', marginBottom: 20 },
  phaseCard: {
    borderRadius: 28,
    padding: 28,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#4A2C6D',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
  },
  phaseEmoji: { fontSize: 48, marginBottom: 8 },
  phaseLabel: { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 6 },
  statusText: { fontSize: 15, color: '#fff', opacity: 0.95, textAlign: 'center', marginBottom: 14 },
  progressTrack: { width: '100%', height: 6, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#fff', borderRadius: 3 },
  fertileBadge: { marginTop: 14, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 20, paddingVertical: 6, paddingHorizontal: 14 },
  fertileBadgeText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  infoRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  infoCard: { flex: 1, backgroundColor: '#fff', borderRadius: 18, padding: 16, alignItems: 'center', borderWidth: 1.5, borderColor: '#E8A9C9' },
  infoLabel: { fontSize: 13, color: '#8B7AA8', marginBottom: 4 },
  infoValue: { fontSize: 17, fontWeight: '700', color: '#4A2C6D' },
  quickRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  quickCard: { flex: 1, backgroundColor: '#F3E9F7', borderRadius: 18, padding: 18, alignItems: 'center' },
  quickEmoji: { fontSize: 26, marginBottom: 6 },
  quickLabel: { fontSize: 13, fontWeight: '600', color: '#4A2C6D' },
});
