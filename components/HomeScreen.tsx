import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useLanguage } from '@/lib/LanguageContext';
import { supabase } from '@/lib/supabase';
import { calculateCycleInfo, CyclePhase } from '@/lib/cycleCalculations';

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

export default function HomeScreen({
  profile,
}: {
  profile: {
    full_name: string | null;
    last_period_start: string;
    avg_cycle_length: number;
    avg_period_length: number;
  };
}) {
  const { t } = useLanguage();

  const info = calculateCycleInfo(
    profile.last_period_start,
    profile.avg_cycle_length,
    profile.avg_period_length
  );

  const phaseLabel = {
    menstrual: t.phaseMenstrual,
    follicular: t.phaseFollicular,
    ovulation: t.phaseOvulation,
    luteal: t.phaseLuteal,
  }[info.phase];

  const formatDate = (d: Date) =>
    d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {profile.full_name && <Text style={styles.greeting}>👋 {profile.full_name}</Text>}

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

      <TouchableOpacity style={styles.signOutButton} onPress={() => supabase.auth.signOut()}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FCEEF3',
  },
  content: {
    padding: 20,
    paddingTop: 70,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '700',
    color: '#4A2C6D',
    marginBottom: 20,
  },
  phaseCard: {
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    marginBottom: 16,
  },
  phaseEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  phaseLabel: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 6,
  },
  statusText: {
    fontSize: 15,
    color: '#fff',
    opacity: 0.95,
    textAlign: 'center',
  },
  fertileBadge: {
    marginTop: 14,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  fertileBadgeText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  infoCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E8A9C9',
  },
  infoLabel: {
    fontSize: 13,
    color: '#8B7AA8',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 17,
    fontWeight: '700',
    color: '#4A2C6D',
  },
  signOutButton: {
    alignItems: 'center',
    padding: 12,
  },
  signOutText: {
    color: '#B08BC9',
    fontSize: 14,
  },
});
