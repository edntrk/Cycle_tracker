import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import * as Location from 'expo-location';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/lib/LanguageContext';
import { calculateCycleInfo } from '@/lib/cycleCalculations';

const EMERGENCY_KEYWORDS = [
  'fainted', 'fainting', 'unconscious', 'severe bleeding', 'soaking through',
  'bayıldım', 'bayılma', 'şuur', 'aşırı kanama', 'çok fazla kanama', 'yüksek ateş', 'high fever',
];

interface SymptomAnalysis {
  id: string;
  input_text: string;
  ai_response: string;
  was_flagged_emergency: boolean;
  created_at: string;
}

interface Profile {
  last_period_start: string;
  avg_cycle_length: number;
  avg_period_length: number;
}

const phaseNameEn: Record<string, string> = {
  menstrual: 'menstrual phase',
  follicular: 'follicular phase',
  ovulation: 'ovulation phase',
  luteal: 'luteal phase',
};

export default function SymptomsScreen({ userId, profile }: { userId: string; profile?: Profile }) {
  const { t, lang } = useLanguage();
  const [input, setInput] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [emergencyFlag, setEmergencyFlag] = useState(false);
  const [locating, setLocating] = useState(false);
  const [history, setHistory] = useState<SymptomAnalysis[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyOpen, setHistoryOpen] = useState(false);

  const loadHistory = useCallback(async () => {
    const { data } = await supabase
      .from('symptom_analyses')
      .select('id, input_text, ai_response, was_flagged_emergency, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);
    setHistory((data as SymptomAnalysis[]) || []);
    setHistoryLoading(false);
  }, [userId]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  function buildCycleContext(): string | undefined {
    if (!profile?.last_period_start) return undefined;
    const info = calculateCycleInfo(
      profile.last_period_start,
      profile.avg_cycle_length,
      profile.avg_period_length
    );
    const phaseName = phaseNameEn[info.phase];
    return `User is currently in the ${phaseName} of their cycle, ${info.daysUntilNextPeriod} day(s) until their next expected period.`;
  }

  async function handleAnalyze() {
    if (!input.trim()) {
      Alert.alert(t.error, t.emptyInput);
      return;
    }

    const lower = input.toLowerCase();
    const flagged = EMERGENCY_KEYWORDS.some((kw) => lower.includes(kw));
    setEmergencyFlag(flagged);
    setResult(null);
    setLoading(true);

    const { data, error } = await supabase.functions.invoke('analyze-symptoms', {
      body: { symptomDescription: input.trim(), cycleContext: buildCycleContext() },
    });

    setLoading(false);

    if (error || data?.error) {
      Alert.alert(t.error, error?.message || JSON.stringify(data?.error) || 'AI request failed');
      return;
    }

    setResult(data.result);

    await supabase.from('symptom_analyses').insert({
      user_id: userId,
      input_text: input.trim(),
      ai_response: data.result,
      was_flagged_emergency: flagged,
    });

    setInput('');
    loadHistory();
  }

  async function handleDeleteHistoryItem(id: string) {
    await supabase.from('symptom_analyses').delete().eq('id', id);
    setHistory((prev) => prev.filter((item) => item.id !== id));
  }

  async function handleFindDoctor() {
    setLocating(true);
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== 'granted') {
      setLocating(false);
      Alert.alert(t.error, t.locationPermissionMsg);
      return;
    }

    const location = await Location.getCurrentPositionAsync({});
    const { latitude, longitude } = location.coords;
    setLocating(false);

    const query = encodeURIComponent(lang === 'tr' ? 'kadın doğum uzmanı' : 'gynecologist');
    const url =
      Platform.OS === 'ios'
        ? `maps://?q=${query}&sll=${latitude},${longitude}`
        : `geo:${latitude},${longitude}?q=${query}`;

    const fallbackUrl = `https://www.google.com/maps/search/?api=1&query=${query}&center=${latitude},${longitude}`;

    const canOpen = await Linking.canOpenURL(url);
    Linking.openURL(canOpen ? url : fallbackUrl);
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>🩺 {t.symptomsTitle}</Text>
      <Text style={styles.subtitle}>{t.symptomsSubtitle}</Text>

      <TextInput
        style={styles.input}
        placeholder={t.symptomsPlaceholder}
        placeholderTextColor="#8B7AA8"
        value={input}
        onChangeText={setInput}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
      />

      <TouchableOpacity style={styles.button} onPress={handleAnalyze} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>{t.analyzeBtn}</Text>
        )}
      </TouchableOpacity>

      {emergencyFlag && (
        <View style={styles.emergencyBox}>
          <Text style={styles.emergencyText}>
            {lang === 'tr'
              ? '⚠️ Anlattıkların ciddi olabilir. Lütfen mümkün olan en kısa sürede bir doktora veya acil servise başvur.'
              : '⚠️ What you described may be serious. Please seek medical care or an emergency room as soon as possible.'}
          </Text>
        </View>
      )}

      {result && (
        <View style={styles.resultBox}>
          <Text style={styles.resultText}>{result}</Text>
        </View>
      )}

      {result && (
        <View style={styles.doctorSection}>
          <Text style={styles.doctorTitle}>{t.findDoctorTitle}</Text>
          <Text style={styles.doctorSubtitle}>{t.findDoctorSubtitle}</Text>
          <TouchableOpacity style={styles.doctorButton} onPress={handleFindDoctor} disabled={locating}>
            {locating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.doctorButtonText}>📍 {t.findDoctorBtn}</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      <Text style={styles.disclaimer}>{t.aiDisclaimer}</Text>

      <TouchableOpacity style={styles.historyToggle} onPress={() => setHistoryOpen(!historyOpen)}>
        <Text style={styles.historyToggleText}>
          {historyOpen ? '▼' : '▶'} {lang === 'tr' ? 'Geçmiş' : 'History'}
          {history.length > 0 ? ` (${history.length})` : ''}
        </Text>
      </TouchableOpacity>

      {historyOpen && (
        <View style={styles.historySection}>
          {historyLoading ? (
            <ActivityIndicator color="#B39DDB" style={{ marginTop: 12 }} />
          ) : history.length === 0 ? (
            <Text style={styles.emptyHistory}>
              {lang === 'tr' ? 'Henüz kayıt yok.' : 'No entries yet.'}
            </Text>
          ) : (
            history.map((item) => (
              <View key={item.id} style={styles.historyCard}>
                <View style={styles.historyCardHeader}>
                  <Text style={styles.historyDate}>{formatDate(item.created_at)}</Text>
                  <TouchableOpacity onPress={() => handleDeleteHistoryItem(item.id)}>
                    <Text style={styles.historyDelete}>{t.delete}</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.historyInput}>"{item.input_text}"</Text>
                <Text style={styles.historyResponse}>{item.ai_response}</Text>
                {item.was_flagged_emergency && (
                  <Text style={styles.historyFlag}>⚠️ {lang === 'tr' ? 'Acil olarak işaretlendi' : 'Flagged as urgent'}</Text>
                )}
              </View>
            ))
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FCEEF3' },
  content: { padding: 20, paddingTop: 70, paddingBottom: 60 },
  title: { fontSize: 24, fontWeight: '700', color: '#4A2C6D', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#6B5B85', marginBottom: 20 },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    borderWidth: 1.5,
    borderColor: '#E8A9C9',
    color: '#2D1B3D',
    minHeight: 100,
    marginBottom: 16,
  },
  button: { backgroundColor: '#8E5FBF', borderRadius: 12, padding: 16, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  emergencyBox: {
    backgroundColor: '#FDE2E2',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1.5,
    borderColor: '#E88989',
  },
  emergencyText: { color: '#A13A3A', fontWeight: '600', fontSize: 14 },
  resultBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginTop: 16,
    borderWidth: 1.5,
    borderColor: '#E8A9C9',
  },
  resultText: { color: '#2D1B3D', fontSize: 15, lineHeight: 22 },
  doctorSection: {
    marginTop: 16,
    backgroundColor: '#F3E9F7',
    borderRadius: 16,
    padding: 18,
  },
  doctorTitle: { fontSize: 15, fontWeight: '700', color: '#4A2C6D', marginBottom: 4 },
  doctorSubtitle: { fontSize: 13, color: '#6B5B85', marginBottom: 12 },
  doctorButton: {
    backgroundColor: '#4A2C6D',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  doctorButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  disclaimer: { fontSize: 12, color: '#8B7AA8', marginTop: 20, textAlign: 'center', fontStyle: 'italic' },
  historyToggle: {
    marginTop: 24,
    paddingVertical: 10,
  },
  historyToggleText: { fontSize: 15, fontWeight: '700', color: '#4A2C6D' },
  historySection: { marginTop: 8 },
  emptyHistory: { color: '#8B7AA8', fontSize: 13, fontStyle: 'italic' },
  historyCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F0D9E8',
  },
  historyCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  historyDate: { fontSize: 11, color: '#B08BC9' },
  historyDelete: { fontSize: 12, color: '#D46A9F', fontWeight: '600' },
  historyInput: { fontSize: 13, color: '#6B5B85', fontStyle: 'italic', marginBottom: 6 },
  historyResponse: { fontSize: 13, color: '#2D1B3D', lineHeight: 18 },
  historyFlag: { fontSize: 11, color: '#A13A3A', fontWeight: '600', marginTop: 6 },
});
