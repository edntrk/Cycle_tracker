import { useState, useEffect, useCallback, useRef } from 'react';
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
  KeyboardAvoidingView,
} from 'react-native';
import * as Location from 'expo-location';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/lib/LanguageContext';
import { calculateCycleInfo } from '@/lib/cycleCalculations';
import { HEALTH_CONDITIONS } from '@/lib/healthConditions';

const EMERGENCY_KEYWORDS = [
  'fainted', 'fainting', 'unconscious', 'severe bleeding', 'soaking through',
  'bayıldım', 'bayılma', 'şuur', 'aşırı kanama', 'çok fazla kanama', 'yüksek ateş', 'high fever',
];

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

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
  health_conditions?: string[] | null;
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
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [emergencyFlag, setEmergencyFlag] = useState(false);
  const [locating, setLocating] = useState(false);
  const [history, setHistory] = useState<SymptomAnalysis[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [savedRowId, setSavedRowId] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

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
    const parts: string[] = [];

    if (profile?.last_period_start) {
      const info = calculateCycleInfo(
        profile.last_period_start,
        profile.avg_cycle_length,
        profile.avg_period_length
      );
      const phaseName = phaseNameEn[info.phase];
      parts.push(
        `User is currently in the ${phaseName} of their cycle, ${info.daysUntilNextPeriod} day(s) until their next expected period.`
      );
    }

    if (profile?.health_conditions && profile.health_conditions.length > 0) {
      const labels = profile.health_conditions
        .map((id) => HEALTH_CONDITIONS.find((c) => c.id === id)?.labelEn || id)
        .join(', ');
      parts.push(`User has disclosed the following diagnosed condition(s): ${labels}.`);
    }

    return parts.length > 0 ? parts.join(' ') : undefined;
  }

  async function saveOrUpdateTranscript(allMessages: ChatMessage[], flagged: boolean) {
    const firstUserMsg = allMessages.find((m) => m.role === 'user')?.text || '';
    const transcriptText = allMessages
      .map((m) => (m.role === 'user' ? `${lang === 'tr' ? 'Sen' : 'You'}: ${m.text}` : `AI: ${m.text}`))
      .join('\n\n');

    if (savedRowId) {
      await supabase
        .from('symptom_analyses')
        .update({ ai_response: transcriptText, was_flagged_emergency: flagged })
        .eq('id', savedRowId);
    } else {
      const { data } = await supabase
        .from('symptom_analyses')
        .insert({
          user_id: userId,
          input_text: firstUserMsg,
          ai_response: transcriptText,
          was_flagged_emergency: flagged,
        })
        .select('id')
        .single();
      if (data) setSavedRowId(data.id);
    }
    loadHistory();
  }

  async function handleSend() {
    if (!input.trim()) return;

    const lower = input.toLowerCase();
    const flagged = emergencyFlag || EMERGENCY_KEYWORDS.some((kw) => lower.includes(kw));
    setEmergencyFlag(flagged);

    const userMessage: ChatMessage = { role: 'user', text: input.trim() };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    const { data, error } = await supabase.functions.invoke('analyze-symptoms', {
      body: {
        messages: updatedMessages.map((m) => ({ role: m.role, text: m.text })),
        cycleContext: buildCycleContext(),
      },
    });

    setLoading(false);

    if (error || data?.error) {
      Alert.alert(t.error, error?.message || JSON.stringify(data?.error) || 'AI request failed');
      return;
    }

    const assistantMessage: ChatMessage = { role: 'assistant', text: data.result };
    const finalMessages = [...updatedMessages, assistantMessage];
    setMessages(finalMessages);

    await saveOrUpdateTranscript(finalMessages, flagged);

    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }

  function handleNewConversation() {
    setMessages([]);
    setEmergencyFlag(false);
    setSavedRowId(null);
    setInput('');
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

  const hasAssistantReply = messages.some((m) => m.role === 'assistant');

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#FCEEF3' }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={0}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>🩺 {t.symptomsTitle}</Text>
          {messages.length > 0 && (
            <TouchableOpacity onPress={handleNewConversation}>
              <Text style={styles.newChatText}>{lang === 'tr' ? '+ Yeni' : '+ New'}</Text>
            </TouchableOpacity>
          )}
        </View>

        {messages.length === 0 && (
          <Text style={styles.subtitle}>{t.symptomsSubtitle}</Text>
        )}

        <ScrollView
          ref={scrollRef}
          style={styles.chatArea}
          contentContainerStyle={styles.chatContent}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map((m, i) => (
            <View
              key={i}
              style={[styles.bubble, m.role === 'user' ? styles.userBubble : styles.aiBubble]}
            >
              <Text style={m.role === 'user' ? styles.userBubbleText : styles.aiBubbleText}>{m.text}</Text>
            </View>
          ))}

          {loading && (
            <View style={styles.typingBubble}>
              <View style={styles.typingDot} />
              <View style={[styles.typingDot, { opacity: 0.6 }]} />
              <View style={[styles.typingDot, { opacity: 0.3 }]} />
            </View>
          )}

          {emergencyFlag && (
            <View style={styles.emergencyBox}>
              <Text style={styles.emergencyText}>
                {lang === 'tr'
                  ? '⚠️ Anlattıkların ciddi olabilir. Lütfen mümkün olan en kısa sürede bir doktora veya acil servise başvur.'
                  : '⚠️ What you described may be serious. Please seek medical care or an emergency room as soon as possible.'}
              </Text>
            </View>
          )}

          {hasAssistantReply && (
            <View style={styles.doctorSection}>
              <Text style={styles.doctorTitle}>{t.findDoctorTitle}</Text>
              <TouchableOpacity style={styles.doctorButton} onPress={handleFindDoctor} disabled={locating}>
                {locating ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.doctorButtonText}>📍 {t.findDoctorBtn}</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {hasAssistantReply && <Text style={styles.disclaimer}>{t.aiDisclaimer}</Text>}

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
                <Text style={styles.emptyHistory}>{lang === 'tr' ? 'Henüz kayıt yok.' : 'No entries yet.'}</Text>
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

        <View style={styles.inputRow}>
          <TextInput
            style={styles.chatInput}
            placeholder={t.symptomsPlaceholder}
            placeholderTextColor="#8B7AA8"
            value={input}
            onChangeText={setInput}
            multiline
          />
          <TouchableOpacity style={styles.sendButton} onPress={handleSend} disabled={loading || !input.trim()}>
            <Text style={styles.sendButtonText}>➤</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FCEEF3', paddingTop: 60 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20 },
  title: { fontSize: 24, fontWeight: '700', color: '#4A2C6D' },
  newChatText: { fontSize: 13, color: '#8E5FBF', fontWeight: '700' },
  subtitle: { fontSize: 14, color: '#6B5B85', paddingHorizontal: 20, marginTop: 6, marginBottom: 10 },
  chatArea: { flex: 1 },
  chatContent: { padding: 20, paddingBottom: 20, flexGrow: 1, justifyContent: 'flex-end' },
  bubble: {
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
    maxWidth: '82%',
  },
  userBubble: {
    backgroundColor: '#8E5FBF',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 6,
    shadowColor: '#8E5FBF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  },
  aiBubble: {
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 6,
    shadowColor: '#4A2C6D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 1,
  },
  userBubbleText: { color: '#fff', fontSize: 14, lineHeight: 21 },
  aiBubbleText: { color: '#2D1B3D', fontSize: 14, lineHeight: 21 },
  typingBubble: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: 20,
    borderBottomLeftRadius: 6,
    paddingVertical: 14,
    paddingHorizontal: 18,
    marginBottom: 12,
    gap: 5,
    shadowColor: '#4A2C6D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 1,
  },
  typingDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#8E5FBF' },
  emergencyBox: {
    backgroundColor: '#FDE2E2',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#E88989',
  },
  emergencyText: { color: '#A13A3A', fontWeight: '600', fontSize: 13 },
  doctorSection: { backgroundColor: '#F3E9F7', borderRadius: 16, padding: 16, marginBottom: 10 },
  doctorTitle: { fontSize: 13, fontWeight: '700', color: '#4A2C6D', marginBottom: 10 },
  doctorButton: { backgroundColor: '#4A2C6D', borderRadius: 12, padding: 12, alignItems: 'center' },
  doctorButtonText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  disclaimer: { fontSize: 11, color: '#8B7AA8', marginBottom: 16, textAlign: 'center', fontStyle: 'italic' },
  historyToggle: { paddingVertical: 10 },
  historyToggleText: { fontSize: 14, fontWeight: '700', color: '#4A2C6D' },
  historySection: { marginTop: 4 },
  emptyHistory: { color: '#8B7AA8', fontSize: 13, fontStyle: 'italic' },
  historyCard: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#F0D9E8' },
  historyCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  historyDate: { fontSize: 11, color: '#B08BC9' },
  historyDelete: { fontSize: 12, color: '#D46A9F', fontWeight: '600' },
  historyInput: { fontSize: 13, color: '#6B5B85', fontStyle: 'italic', marginBottom: 6 },
  historyResponse: { fontSize: 12, color: '#2D1B3D', lineHeight: 18 },
  historyFlag: { fontSize: 11, color: '#A13A3A', fontWeight: '600', marginTop: 6 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F0D9E8',
    gap: 10,
  },
  chatInput: {
    flex: 1,
    backgroundColor: '#FCEEF3',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: '#2D1B3D',
    maxHeight: 100,
    borderWidth: 1.5,
    borderColor: '#E8A9C9',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8E5FBF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
