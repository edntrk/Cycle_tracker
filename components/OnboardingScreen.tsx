import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Image,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/lib/LanguageContext';
import { HEALTH_CONDITIONS } from '@/lib/healthConditions';
import AyaLogo from './AyaLogo';

const TOTAL_STEPS = 6;

const GOALS = [
  { id: 'track', emoji: '📅', color: '#8E5FBF', enKey: 'obGoalTrack' as const },
  { id: 'pregnancy', emoji: '🤰', color: '#D46A9F', enKey: 'obGoalPregnancy' as const },
  { id: 'avoid', emoji: '🚫', color: '#7CB88F', enKey: 'obGoalAvoid' as const },
  { id: 'symptoms', emoji: '🩺', color: '#5FA8D3', enKey: 'obGoalSymptoms' as const },
  { id: 'health', emoji: '💊', color: '#C9A227', enKey: 'obGoalHealth' as const },
];

export default function OnboardingScreen({
  userId,
  onComplete,
}: {
  userId: string;
  onComplete: () => void;
}) {
  const { t } = useLanguage();
  const [step, setStep] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const [goal, setGoal] = useState<string | null>(null);
  const [lastPeriodDate, setLastPeriodDate] = useState('');
  const [cycleLength, setCycleLength] = useState('28');
  const [periodLength, setPeriodLength] = useState('5');
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 280,
      useNativeDriver: true,
    }).start();
  }, [step]);

  function toggleCondition(id: string) {
    if (id === 'none') {
      setSelectedConditions(['none']);
      return;
    }
    setSelectedConditions((prev) => {
      const withoutNone = prev.filter((c) => c !== 'none');
      return withoutNone.includes(id) ? withoutNone.filter((c) => c !== id) : [...withoutNone, id];
    });
  }

  function goNext() {
    if (step === 2 && lastPeriodDate && !/^\d{4}-\d{2}-\d{2}$/.test(lastPeriodDate)) {
      Alert.alert(t.error, 'YYYY-MM-DD');
      return;
    }
    if (step < TOTAL_STEPS - 1) setStep(step + 1);
    else handleFinish();
  }

  function goBack() {
    if (step > 0) setStep(step - 1);
  }

  async function handleFinish() {
    setLoading(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        tracking_goal: goal,
        last_period_start: lastPeriodDate || null,
        avg_cycle_length: parseInt(cycleLength, 10) || 28,
        avg_period_length: parseInt(periodLength, 10) || 5,
        health_conditions: selectedConditions.filter((c) => c !== 'none'),
        onboarding_completed: true,
      })
      .eq('id', userId);
    setLoading(false);

    if (error) {
      Alert.alert(t.error, error.message);
    } else {
      onComplete();
    }
  }

  const progress = ((step + 1) / TOTAL_STEPS) * 100;

  function StepMascot() {
    return (
      <Image
        source={require('../assets/images/aya-mascot.png')}
        style={styles.mascotSmall}
        resizeMode="contain"
      />
    );
  }

  function renderStepContent() {
    switch (step) {
      case 0:
        return (
          <View style={styles.introWrap}>
            <Image source={require('../assets/images/aya-mascot.png')} style={styles.mascotLarge} resizeMode="contain" />
            <Text style={styles.title}>{t.obStep1Title}</Text>
            <Text style={styles.body}>{t.obStep1Body}</Text>
          </View>
        );

      case 1:
        return (
          <View>
            <Text style={styles.title}>{t.obGoalTitle}</Text>
            <Text style={styles.body}>{t.obGoalBody}</Text>
            <View style={styles.goalList}>
              {GOALS.map((g) => {
                const active = goal === g.id;
                return (
                  <TouchableOpacity
                    key={g.id}
                    style={[styles.goalOption, active && { borderColor: g.color, backgroundColor: `${g.color}14` }]}
                    onPress={() => setGoal(g.id)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.goalIconBadge, { backgroundColor: active ? g.color : `${g.color}22` }]}>
                      <Text style={styles.goalEmoji}>{g.emoji}</Text>
                    </View>
                    <Text style={[styles.goalText, active && { color: g.color, fontWeight: '800' }]}>{t[g.enKey]}</Text>
                    {active && <View style={[styles.goalCheck, { backgroundColor: g.color }]}><Text style={styles.goalCheckMark}>✓</Text></View>}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        );

      case 2:
        return (
          <View>
            <StepMascot />
            <View style={styles.stepIconBadge}><Text style={styles.stepIconText}>🩸</Text></View>
            <Text style={styles.title}>{t.obDateTitle}</Text>
            <Text style={styles.body}>{t.obDateBody}</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#C9B8D8"
              value={lastPeriodDate}
              onChangeText={setLastPeriodDate}
              keyboardType="numbers-and-punctuation"
            />
          </View>
        );

      case 3:
        return (
          <View>
            <StepMascot />
            <View style={styles.stepIconBadge}><Text style={styles.stepIconText}>🔄</Text></View>
            <Text style={styles.title}>{t.obLengthTitle}</Text>
            <Text style={styles.body}>{t.obLengthBody}</Text>
            <TextInput
              style={styles.input}
              value={cycleLength}
              onChangeText={setCycleLength}
              keyboardType="number-pad"
            />
          </View>
        );

      case 4:
        return (
          <View>
            <StepMascot />
            <View style={styles.stepIconBadge}><Text style={styles.stepIconText}>📆</Text></View>
            <Text style={styles.title}>{t.obPeriodLenTitle}</Text>
            <Text style={styles.body}>{t.obPeriodLenBody}</Text>
            <TextInput
              style={styles.input}
              value={periodLength}
              onChangeText={setPeriodLength}
              keyboardType="number-pad"
            />
          </View>
        );

      case 5:
        return (
          <View>
            <StepMascot />
            <View style={styles.stepIconBadge}><Text style={styles.stepIconText}>💜</Text></View>
            <Text style={styles.title}>{t.obConditionsTitle}</Text>
            <Text style={styles.body}>{t.obConditionsBody}</Text>
            <View style={styles.conditionsRow}>
              {HEALTH_CONDITIONS.map((cond) => {
                const active = selectedConditions.includes(cond.id);
                return (
                  <TouchableOpacity
                    key={cond.id}
                    style={[styles.conditionChip, active && styles.conditionChipActive]}
                    onPress={() => toggleCondition(cond.id)}
                  >
                    <Text style={[styles.conditionChipText, active && styles.conditionChipTextActive]}>
                      {cond.labelTr}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        );

      default:
        return null;
    }
  }

  const isLastStep = step === TOTAL_STEPS - 1;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.decorCircleTop} />
      <View style={styles.decorCircleBottom} />

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>

      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} keyboardShouldPersistTaps="handled">
        <Animated.View style={[styles.card, { opacity: fadeAnim }]}>{renderStepContent()}</Animated.View>
      </ScrollView>

      <View style={styles.footer}>
        {step > 0 && (
          <TouchableOpacity onPress={goBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>{t.obBack}</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.nextButton} onPress={goNext} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.nextButtonText}>{isLastStep ? t.obFinish : t.obNext}</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    paddingTop: 60,
    backgroundColor: '#FCEEF3',
    overflow: 'hidden',
  },
  decorCircleTop: {
    position: 'absolute',
    top: -80,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(142, 95, 191, 0.08)',
  },
  decorCircleBottom: {
    position: 'absolute',
    bottom: -100,
    left: -80,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(212, 106, 159, 0.07)',
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#F0D9E8',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 20,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#8E5FBF',
    borderRadius: 3,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 30,
    padding: 28,
    shadowColor: '#4A2C6D',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 6,
  },
  introWrap: { alignItems: 'center' },
  mascotLarge: { width: 140, height: 140, marginBottom: 8 },
  mascotSmall: { width: 56, height: 56, marginBottom: 10 },
  stepIconBadge: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#F3E9F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  stepIconText: { fontSize: 26 },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#3A2250',
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  body: {
    fontSize: 14,
    color: '#6B5B85',
    lineHeight: 21,
    marginBottom: 24,
  },
  input: {
    backgroundColor: '#FCEEF3',
    borderRadius: 16,
    padding: 17,
    fontSize: 18,
    borderWidth: 1.5,
    borderColor: '#F0D9E8',
    color: '#2D1B3D',
    fontWeight: '700',
  },
  goalList: { gap: 10 },
  goalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FCEEF3',
    borderRadius: 18,
    padding: 12,
    borderWidth: 1.5,
    borderColor: 'transparent',
    gap: 14,
  },
  goalIconBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalEmoji: { fontSize: 19 },
  goalText: { fontSize: 14, fontWeight: '600', color: '#4A2C6D', flex: 1 },
  goalCheck: { width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  goalCheckMark: { color: '#fff', fontSize: 12, fontWeight: '800' },
  conditionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  conditionChip: {
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: '#FCEEF3',
    borderWidth: 1.5,
    borderColor: '#F0D9E8',
  },
  conditionChipActive: { backgroundColor: '#8E5FBF', borderColor: '#8E5FBF' },
  conditionChipText: { fontSize: 12, color: '#4A2C6D', fontWeight: '600' },
  conditionChipTextActive: { color: '#fff' },
  footer: { flexDirection: 'row', gap: 12, marginTop: 16 },
  backButton: {
    paddingVertical: 16,
    paddingHorizontal: 22,
    borderRadius: 16,
    backgroundColor: '#fff',
  },
  backButtonText: { color: '#8E5FBF', fontSize: 15, fontWeight: '700' },
  nextButton: {
    flex: 1,
    backgroundColor: '#8E5FBF',
    borderRadius: 16,
    padding: 17,
    alignItems: 'center',
    shadowColor: '#8E5FBF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  nextButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
