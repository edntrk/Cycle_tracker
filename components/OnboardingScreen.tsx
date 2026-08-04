import { useState } from 'react';
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
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/lib/LanguageContext';
import { HEALTH_CONDITIONS } from '@/lib/healthConditions';

const TOTAL_STEPS = 6;

const GOALS = [
  { id: 'track', emoji: '📅', enKey: 'obGoalTrack' as const },
  { id: 'pregnancy', emoji: '🤰', enKey: 'obGoalPregnancy' as const },
  { id: 'avoid', emoji: '🚫', enKey: 'obGoalAvoid' as const },
  { id: 'symptoms', emoji: '🩺', enKey: 'obGoalSymptoms' as const },
  { id: 'health', emoji: '💊', enKey: 'obGoalHealth' as const },
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

  const [goal, setGoal] = useState<string | null>(null);
  const [lastPeriodDate, setLastPeriodDate] = useState('');
  const [cycleLength, setCycleLength] = useState('28');
  const [periodLength, setPeriodLength] = useState('5');
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

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

  function renderStepContent() {
    switch (step) {
      case 0:
        return (
          <View style={styles.introWrap}>
            <Text style={styles.introEmoji}>🌸</Text>
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
                    style={[styles.goalOption, active && styles.goalOptionActive]}
                    onPress={() => setGoal(g.id)}
                  >
                    <Text style={styles.goalEmoji}>{g.emoji}</Text>
                    <Text style={[styles.goalText, active && styles.goalTextActive]}>{t[g.enKey]}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        );

      case 2:
        return (
          <View>
            <Text style={styles.title}>{t.obDateTitle}</Text>
            <Text style={styles.body}>{t.obDateBody}</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#B8A8C8"
              value={lastPeriodDate}
              onChangeText={setLastPeriodDate}
              keyboardType="numbers-and-punctuation"
            />
          </View>
        );

      case 3:
        return (
          <View>
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
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>

      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>{renderStepContent()}</View>
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
    borderRadius: 28,
    padding: 26,
    shadowColor: '#4A2C6D',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  introWrap: { alignItems: 'center' },
  introEmoji: { fontSize: 52, marginBottom: 16 },
  title: {
    fontSize: 21,
    fontWeight: '800',
    color: '#3A2250',
    marginBottom: 10,
    textAlign: 'center',
  },
  body: {
    fontSize: 14,
    color: '#6B5B85',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 22,
  },
  input: {
    backgroundColor: '#FCEEF3',
    borderRadius: 14,
    padding: 16,
    fontSize: 17,
    borderWidth: 1.5,
    borderColor: '#F0D9E8',
    color: '#2D1B3D',
    textAlign: 'center',
    fontWeight: '700',
  },
  goalList: { gap: 10 },
  goalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FCEEF3',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#F0D9E8',
    gap: 12,
  },
  goalOptionActive: { backgroundColor: '#8E5FBF', borderColor: '#8E5FBF' },
  goalEmoji: { fontSize: 20 },
  goalText: { fontSize: 14, fontWeight: '600', color: '#4A2C6D', flex: 1 },
  goalTextActive: { color: '#fff' },
  conditionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  conditionChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
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
    paddingHorizontal: 20,
    borderRadius: 14,
    backgroundColor: '#F3E9F7',
  },
  backButtonText: { color: '#8E5FBF', fontSize: 15, fontWeight: '700' },
  nextButton: {
    flex: 1,
    backgroundColor: '#8E5FBF',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#8E5FBF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 3,
  },
  nextButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
