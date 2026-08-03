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

export default function OnboardingScreen({
  userId,
  onComplete,
}: {
  userId: string;
  onComplete: () => void;
}) {
  const { t, lang } = useLanguage();
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

  async function handleContinue() {
    if (lastPeriodDate && !/^\d{4}-\d{2}-\d{2}$/.test(lastPeriodDate)) {
      Alert.alert(t.error, 'YYYY-MM-DD');
      return;
    }

    setLoading(true);
    const { error } = await supabase
      .from('profiles')
      .update({
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

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} keyboardShouldPersistTaps="handled">
        <Text style={styles.brandEmoji}>🌸</Text>

        <View style={styles.card}>
          <Text style={styles.title}>{t.onboardingTitle}</Text>
          <Text style={styles.subtitle}>{t.onboardingSubtitle}</Text>

          <Text style={styles.label}>{t.lastPeriodDate}</Text>
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#B8A8C8"
            value={lastPeriodDate}
            onChangeText={setLastPeriodDate}
            keyboardType="numbers-and-punctuation"
          />

          <Text style={styles.label}>{t.cycleLength}</Text>
          <TextInput
            style={styles.input}
            value={cycleLength}
            onChangeText={setCycleLength}
            keyboardType="number-pad"
          />

          <Text style={styles.label}>{t.periodLength}</Text>
          <TextInput
            style={styles.input}
            value={periodLength}
            onChangeText={setPeriodLength}
            keyboardType="number-pad"
          />

          <Text style={styles.hint}>{t.notSure}</Text>

          <Text style={styles.label}>
            {lang === 'tr'
              ? 'Tanı konmuş bir sağlık durumun var mı? (opsiyonel)'
              : 'Do you have any diagnosed health conditions? (optional)'}
          </Text>
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
                    {lang === 'tr' ? cond.labelTr : cond.labelEn}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={styles.conditionHint}>
            {lang === 'tr'
              ? 'Bu bilgi, semptom analizinde sana daha uygun bilgi vermemize yardımcı olur. İstediğin zaman profilinden değiştirebilirsin.'
              : 'This helps us give you more relevant information during symptom analysis. You can change it anytime from your profile.'}
          </Text>

          <TouchableOpacity style={styles.button} onPress={handleContinue} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>{t.continueBtn}</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#FCEEF3',
  },
  brandEmoji: {
    fontSize: 44,
    textAlign: 'center',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 28,
    padding: 24,
    shadowColor: '#4A2C6D',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  title: {
    fontSize: 21,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
    color: '#4A2C6D',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    color: '#6B5B85',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4A2C6D',
    marginBottom: 6,
    marginTop: 4,
  },
  input: {
    backgroundColor: '#FCEEF3',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    fontSize: 16,
    borderWidth: 1.5,
    borderColor: '#F0D9E8',
    color: '#2D1B3D',
  },
  hint: {
    fontSize: 12,
    color: '#8B7AA8',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  conditionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
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
  conditionHint: { fontSize: 11, color: '#B08BC9', fontStyle: 'italic', marginBottom: 20 },
  button: {
    backgroundColor: '#8E5FBF',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 4,
    shadowColor: '#8E5FBF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 3,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
