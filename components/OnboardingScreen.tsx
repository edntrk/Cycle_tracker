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

export default function OnboardingScreen({
  userId,
  onComplete,
}: {
  userId: string;
  onComplete: () => void;
}) {
  const { t } = useLanguage();
  const [lastPeriodDate, setLastPeriodDate] = useState('');
  const [cycleLength, setCycleLength] = useState('28');
  const [periodLength, setPeriodLength] = useState('5');
  const [loading, setLoading] = useState(false);

  async function handleContinue() {
    // Basic validation: expects YYYY-MM-DD if provided
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
        <Text style={styles.title}>🌸 {t.onboardingTitle}</Text>
        <Text style={styles.subtitle}>{t.onboardingSubtitle}</Text>

        <Text style={styles.label}>{t.lastPeriodDate}</Text>
        <TextInput
          style={styles.input}
          placeholder="YYYY-MM-DD"
          placeholderTextColor="#8B7AA8"
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

        <TouchableOpacity style={styles.button} onPress={handleContinue} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>{t.continueBtn}</Text>
          )}
        </TouchableOpacity>
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#4A2C6D',
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 28,
    color: '#6B5B85',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A2C6D',
    marginBottom: 6,
    marginTop: 4,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    fontSize: 16,
    borderWidth: 1.5,
    borderColor: '#E8A9C9',
    color: '#2D1B3D',
  },
  hint: {
    fontSize: 13,
    color: '#8B7AA8',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  button: {
    backgroundColor: '#8E5FBF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
