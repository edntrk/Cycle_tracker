import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import * as Notifications from 'expo-notifications';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/lib/LanguageContext';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

type FrequencyType = 'daily' | 'as_needed' | 'cycle_based';

interface Medication {
  id: string;
  name: string;
  dosage: string | null;
  frequency_type: FrequencyType;
  reminder_times: string[] | null;
  active: boolean;
}

async function ensureNotificationPermission(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

async function scheduleReminder(name: string, dosage: string | null, timeStr: string) {
  const [hour, minute] = timeStr.split(':').map(Number);
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `💊 ${name}`,
      body: dosage ? `${dosage}` : 'Time to take your medication',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}

export default function MedicationsScreen({ userId }: { userId: string }) {
  const { t } = useLanguage();
  const [meds, setMeds] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState<FrequencyType>('daily');
  const [time, setTime] = useState('09:00');

  const loadMeds = useCallback(async () => {
    const { data } = await supabase
      .from('medications')
      .select('id, name, dosage, frequency_type, reminder_times, active')
      .eq('user_id', userId)
      .eq('active', true)
      .order('created_at', { ascending: false });
    setMeds((data as Medication[]) || []);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    loadMeds();
  }, [loadMeds]);

  async function handleSave() {
    if (!name.trim()) return;

    const granted = await ensureNotificationPermission();
    if (!granted) {
      Alert.alert(t.notifPermissionTitle, t.notifPermissionMsg);
    }

    setSaving(true);
    const { error } = await supabase.from('medications').insert({
      user_id: userId,
      name: name.trim(),
      dosage: dosage.trim() || null,
      frequency_type: frequency,
      reminder_times: [time],
      active: true,
    });

    if (!error && granted) {
      await scheduleReminder(name.trim(), dosage.trim() || null, time);
    }

    setSaving(false);
    if (!error) {
      setName('');
      setDosage('');
      setFrequency('daily');
      setTime('09:00');
      setModalVisible(false);
      loadMeds();
    }
  }

  async function handleDelete(id: string) {
    await supabase.from('medications').update({ active: false }).eq('id', id);
    loadMeds();
  }

  const freqLabel = (f: FrequencyType) =>
    ({ daily: t.freqDaily, as_needed: t.freqAsNeeded, cycle_based: t.freqCycleBased }[f]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#B39DDB" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>💊 {t.tabMeds}</Text>

        {meds.length === 0 ? (
          <Text style={styles.emptyText}>{t.noMeds}</Text>
        ) : (
          meds.map((med) => (
            <View key={med.id} style={styles.medCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.medName}>{med.name}</Text>
                {med.dosage ? <Text style={styles.medDetail}>{med.dosage}</Text> : null}
                <Text style={styles.medDetail}>
                  {freqLabel(med.frequency_type)}
                  {med.reminder_times?.[0] ? ` · ${med.reminder_times[0]}` : ''}
                </Text>
              </View>
              <TouchableOpacity onPress={() => handleDelete(med.id)}>
                <Text style={styles.deleteText}>{t.delete}</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{t.addMedication}</Text>

            <TextInput
              style={styles.input}
              placeholder={t.medName}
              placeholderTextColor="#8B7AA8"
              value={name}
              onChangeText={setName}
            />
            <TextInput
              style={styles.input}
              placeholder={t.medDosage}
              placeholderTextColor="#8B7AA8"
              value={dosage}
              onChangeText={setDosage}
            />

            <Text style={styles.label}>{t.medFrequency}</Text>
            <View style={styles.freqRow}>
              {(['daily', 'as_needed', 'cycle_based'] as FrequencyType[]).map((f) => (
                <TouchableOpacity
                  key={f}
                  style={[styles.freqOption, frequency === f && styles.freqOptionActive]}
                  onPress={() => setFrequency(f)}
                >
                  <Text style={[styles.freqOptionText, frequency === f && styles.freqOptionTextActive]}>
                    {freqLabel(f)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>{t.medTime}</Text>
            <TextInput
              style={styles.input}
              placeholder="HH:MM"
              placeholderTextColor="#8B7AA8"
              value={time}
              onChangeText={setTime}
            />

            <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>{t.save}</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.closeButtonText}>{t.close}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FCEEF3' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FCEEF3' },
  content: { padding: 20, paddingTop: 70, paddingBottom: 100 },
  title: { fontSize: 24, fontWeight: '700', color: '#4A2C6D', marginBottom: 20 },
  emptyText: { color: '#8B7AA8', textAlign: 'center', marginTop: 40 },
  medCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#E8A9C9',
  },
  medName: { fontSize: 16, fontWeight: '700', color: '#4A2C6D' },
  medDetail: { fontSize: 13, color: '#8B7AA8', marginTop: 2 },
  deleteText: { color: '#D46A9F', fontSize: 13, fontWeight: '600' },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 100,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#8E5FBF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  fabText: { color: '#fff', fontSize: 28, fontWeight: '400', marginTop: -2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  sheetTitle: { fontSize: 17, fontWeight: '700', color: '#4A2C6D', textAlign: 'center', marginBottom: 20 },
  input: {
    backgroundColor: '#FCEEF3',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    fontSize: 16,
    borderWidth: 1.5,
    borderColor: '#E8A9C9',
    color: '#2D1B3D',
  },
  label: { fontSize: 13, fontWeight: '600', color: '#4A2C6D', marginBottom: 8, marginTop: 4 },
  freqRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  freqOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#FCEEF3',
    borderWidth: 1.5,
    borderColor: '#E8A9C9',
  },
  freqOptionActive: { backgroundColor: '#8E5FBF', borderColor: '#8E5FBF' },
  freqOptionText: { fontSize: 12, color: '#4A2C6D', fontWeight: '600' },
  freqOptionTextActive: { color: '#fff' },
  saveButton: { backgroundColor: '#8E5FBF', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  closeButton: { marginTop: 16, alignItems: 'center' },
  closeButtonText: { color: '#8B7AA8', fontSize: 15 },
});
