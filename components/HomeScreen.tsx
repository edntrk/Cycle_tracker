import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import * as Notifications from 'expo-notifications';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/lib/LanguageContext';
import { calculateCycleInfo, CyclePhase } from '@/lib/cycleCalculations';
import { schedulePeriodReminders } from '@/lib/periodReminders';
import { getDailyInsight } from '@/lib/dailyInsights';
import { SYMPTOM_CATEGORIES } from '@/lib/symptomTags';
import CycleDial from './CycleDial';

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

const quickActions = [
  { id: 'symptoms', emoji: '🩺', labelEn: 'Symptoms', labelTr: 'Semptomlar' },
  { id: 'meds', emoji: '💊', labelEn: 'Meds', labelTr: 'İlaçlar' },
  { id: 'appointments', emoji: '🗓️', labelEn: 'Appts', labelTr: 'Randevu' },
  { id: 'learn', emoji: '📖', labelEn: 'Learn', labelTr: 'Öğren' },
];

const moodTags = SYMPTOM_CATEGORIES.find((c) => c.id === 'mood')!.tags;

function todayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function HomeScreen({
  profile,
  onNavigate,
  userId,
}: {
  profile: {
    full_name: string | null;
    last_period_start: string;
    avg_cycle_length: number;
    avg_period_length: number;
  };
  onNavigate?: (tab: string) => void;
  userId?: string;
}) {
  const { t, lang } = useLanguage();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [savingMood, setSavingMood] = useState(false);
  const [weeklyInsight, setWeeklyInsight] = useState<string | null>(null);
  const [loadingWeekly, setLoadingWeekly] = useState(false);
  const [weeklyExpanded, setWeeklyExpanded] = useState(false);

  const info = calculateCycleInfo(
    profile.last_period_start,
    profile.avg_cycle_length,
    profile.avg_period_length
  );

  const insight = getDailyInsight(info.phase, lang);

  const loadTodayMood = useCallback(async () => {
    if (!userId) return;
    const moodIds = moodTags.map((m) => m.id);
    const { data } = await supabase
      .from('symptom_entries')
      .select('symptom_type')
      .eq('user_id', userId)
      .eq('date', todayString())
      .in('symptom_type', moodIds);
    if (data && data.length > 0) setSelectedMood(data[0].symptom_type);
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    supabase
      .from('profiles')
      .select('avatar_url')
      .eq('id', userId)
      .single()
      .then(({ data }) => setAvatarUrl(data?.avatar_url || null));
    loadTodayMood();
    loadLatestWeeklyInsight();
  }, [userId, loadTodayMood, loadLatestWeeklyInsight]);

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

  const loadLatestWeeklyInsight = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase
      .from('weekly_insights')
      .select('content, generated_at')
      .eq('user_id', userId)
      .order('generated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      const hoursSince = (Date.now() - new Date(data.generated_at).getTime()) / 3600000;
      setWeeklyInsight(data.content);
      // Auto-refresh if the cached insight is more than 7 days old
      if (hoursSince > 24 * 7) {
        generateWeeklyInsight();
      }
    } else {
      generateWeeklyInsight();
    }
  }, [userId]);

  async function generateWeeklyInsight() {
    if (!userId) return;
    setLoadingWeekly(true);
    const { data, error } = await supabase.functions.invoke('weekly-insights', {
      body: { lang },
    });
    setLoadingWeekly(false);
    if (!error && data?.content) {
      setWeeklyInsight(data.content);
    }
  }

  async function handleSelectMood(moodId: string) {
    if (!userId || savingMood) return;
    setSavingMood(true);

    const moodIds = moodTags.map((m) => m.id);
    const isDeselecting = selectedMood === moodId;

    await supabase
      .from('symptom_entries')
      .delete()
      .eq('user_id', userId)
      .eq('date', todayString())
      .in('symptom_type', moodIds);

    if (!isDeselecting) {
      await supabase.from('symptom_entries').insert({
        user_id: userId,
        date: todayString(),
        symptom_type: moodId,
      });
    }

    setSelectedMood(isDeselecting ? null : moodId);
    setSavingMood(false);
  }

  const phaseLabel = {
    menstrual: t.phaseMenstrual,
    follicular: t.phaseFollicular,
    ovulation: t.phaseOvulation,
    luteal: t.phaseLuteal,
  }[info.phase];

  const formatDate = (d: Date) =>
    d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

  const todayLabel = new Date().toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const initials = profile.full_name
    ? profile.full_name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
    : '🌸';

  function goTo(dest: string) {
    setMenuOpen(false);
    onNavigate?.(dest);
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#FCEEF3' }}>
      <View style={styles.decorCircleTop} pointerEvents="none" />
      <View style={styles.decorCircleBottom} pointerEvents="none" />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              {getGreeting(lang)}{profile.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}
            </Text>
            <Text style={styles.dateLabel}>{todayLabel}</Text>
          </View>

          <TouchableOpacity onPress={() => setMenuOpen(!menuOpen)}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.dialSection}>
          <CycleDial
            size={168}
            avgCycleLength={profile.avg_cycle_length}
            avgPeriodLength={profile.avg_period_length}
            dayInCycle={info.dayInCycle}
            phase={info.phase}
            emoji={phaseEmoji[info.phase]}
          />

          <Text style={[styles.phaseLabel, { color: phaseColor[info.phase] }]}>{phaseLabel}</Text>

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

        <View style={styles.moodCard}>
          <Text style={styles.moodTitle}>
            {lang === 'tr' ? 'Bugün nasıl hissediyorsun?' : 'How are you feeling today?'}
          </Text>
          <View style={styles.moodRow}>
            {moodTags.map((mood) => {
              const active = selectedMood === mood.id;
              return (
                <TouchableOpacity
                  key={mood.id}
                  style={[styles.moodChip, active && styles.moodChipActive]}
                  onPress={() => handleSelectMood(mood.id)}
                  disabled={savingMood}
                >
                  <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                  <Text style={[styles.moodLabel, active && styles.moodLabelActive]}>
                    {lang === 'tr' ? mood.labelTr : mood.labelEn}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.insightCard}>
          <View style={styles.insightHeader}>
            <Image source={require('../assets/images/aya-mascot.png')} style={styles.insightMascot} resizeMode="contain" />
            <Text style={styles.insightBadge}>
              {lang === 'tr' ? 'Bugünün İçgörüsü' : "Today's Insight"}
            </Text>
          </View>
          <Text style={styles.insightText}>{insight}</Text>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>{t.nextPeriod}</Text>
            <Text style={styles.infoValue}>{formatDate(info.nextPeriodDate)}</Text>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>{t.ovulation}</Text>
            <Text style={styles.infoValue}>{formatDate(info.ovulationDate)}</Text>
          </View>
        </View>

        {onNavigate && (
          <View style={styles.quickRow}>
            {quickActions.map((action) => (
              <TouchableOpacity key={action.id} style={styles.quickChip} onPress={() => goTo(action.id)}>
                <Text style={styles.quickEmoji}>{action.emoji}</Text>
                <Text style={styles.quickLabel}>{lang === 'tr' ? action.labelTr : action.labelEn}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {menuOpen && (
        <>
          <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setMenuOpen(false)} />
          <View style={styles.dropdown}>
            <TouchableOpacity style={styles.dropdownItem} onPress={() => goTo('profile')}>
              <Text style={styles.dropdownIcon}>👤</Text>
              <Text style={styles.dropdownText}>{lang === 'tr' ? 'Profil' : 'Profile'}</Text>
            </TouchableOpacity>
            <View style={styles.dropdownDivider} />
            <TouchableOpacity style={styles.dropdownItem} onPress={() => goTo('partner')}>
              <Text style={styles.dropdownIcon}>💞</Text>
              <Text style={styles.dropdownText}>{lang === 'tr' ? 'Partner' : 'Partner'}</Text>
            </TouchableOpacity>
            <View style={styles.dropdownDivider} />
            <TouchableOpacity style={styles.dropdownItem} onPress={() => goTo('settings')}>
              <Text style={styles.dropdownIcon}>⚙️</Text>
              <Text style={styles.dropdownText}>{lang === 'tr' ? 'Ayarlar' : 'Settings'}</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  decorCircleTop: {
    position: 'absolute', top: -70, right: -50, width: 200, height: 200,
    borderRadius: 100, backgroundColor: 'rgba(142, 95, 191, 0.07)',
  },
  decorCircleBottom: {
    position: 'absolute', bottom: -90, left: -70, width: 240, height: 240,
    borderRadius: 120, backgroundColor: 'rgba(212, 106, 159, 0.06)',
  },
  content: { padding: 20, paddingTop: 60, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  greeting: { fontSize: 22, fontWeight: '800', color: '#3A2250', letterSpacing: -0.3 },
  dateLabel: { fontSize: 12, color: '#B08BC9', marginTop: 2, textTransform: 'capitalize' },
  avatarImage: { width: 42, height: 42, borderRadius: 21, borderWidth: 2, borderColor: '#fff' },
  avatarPlaceholder: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: '#F3E9F7',
    justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff',
  },
  avatarInitials: { fontSize: 14, fontWeight: '800', color: '#8E5FBF' },
  dialSection: { alignItems: 'center', marginTop: 8, marginBottom: 14 },
  phaseLabel: { fontSize: 18, fontWeight: '800', marginTop: 12, letterSpacing: -0.2 },
  statusText: { fontSize: 13, color: '#6B5B85', marginTop: 3, textAlign: 'center' },
  fertileBadge: { marginTop: 10, backgroundColor: '#F3E9F7', borderRadius: 20, paddingVertical: 5, paddingHorizontal: 12 },
  fertileBadgeText: { color: '#8E5FBF', fontWeight: '700', fontSize: 11 },
  moodCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#4A2C6D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  moodTitle: { fontSize: 13, fontWeight: '700', color: '#4A2C6D', marginBottom: 10 },
  moodRow: { flexDirection: 'row', justifyContent: 'space-between' },
  moodChip: { alignItems: 'center', flex: 1, paddingVertical: 8, borderRadius: 14 },
  moodChipActive: { backgroundColor: '#F3E9F7' },
  moodEmoji: { fontSize: 22, marginBottom: 3 },
  moodLabel: { fontSize: 9, color: '#8B7AA8', fontWeight: '600' },
  moodLabelActive: { color: '#4A2C6D' },
  insightCard: {
    backgroundColor: '#3A2250',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
  },
  insightHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  insightMascot: { width: 32, height: 32 },
  insightBadge: { fontSize: 11, fontWeight: '800', color: '#D4B8E8', textTransform: 'uppercase', letterSpacing: 0.5 },
  insightText: { fontSize: 13, color: '#F3E9F7', lineHeight: 20 },
  weeklyCard: {
    backgroundColor: '#F3E9F7',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
  },
  weeklyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  weeklyBadge: { fontSize: 12, fontWeight: '800', color: '#5A3A75', textTransform: 'uppercase', letterSpacing: 0.3 },
  weeklyChevron: { fontSize: 11, color: '#8E5FBF' },
  weeklyPreview: { fontSize: 12, color: '#6B5B85', marginTop: 6 },
  weeklyText: { fontSize: 13, color: '#3A2250', lineHeight: 20, marginTop: 10 },
  weeklyRefresh: { fontSize: 12, color: '#8E5FBF', fontWeight: '700' },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 14,
    marginBottom: 16,
    shadowColor: '#4A2C6D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  infoCard: { flex: 1, alignItems: 'center' },
  infoDivider: { width: 1, height: 32, backgroundColor: '#F0D9E8' },
  infoLabel: { fontSize: 10, color: '#B08BC9', marginBottom: 3, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '700' },
  infoValue: { fontSize: 16, fontWeight: '800', color: '#3A2250' },
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between' },
  quickChip: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3E9F7',
  },
  quickEmoji: { fontSize: 22, marginBottom: 5 },
  quickLabel: { fontSize: 11, fontWeight: '700', color: '#4A2C6D' },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: -1000 },
  dropdown: {
    position: 'absolute',
    top: 106,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 6,
    minWidth: 150,
    shadowColor: '#4A2C6D',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 8,
  },
  dropdownItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, gap: 10 },
  dropdownIcon: { fontSize: 16 },
  dropdownText: { fontSize: 14, fontWeight: '600', color: '#3A2250' },
  dropdownDivider: { height: 1, backgroundColor: '#F3E9F7', marginHorizontal: 8 },
});
