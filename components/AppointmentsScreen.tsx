import { useState, useEffect, useCallback, useMemo } from 'react';
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
  Linking,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Notifications from 'expo-notifications';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/lib/LanguageContext';
import { APPOINTMENT_CATEGORIES } from '@/lib/appointmentCategories';

interface Appointment {
  id: string;
  category: string;
  hospital_name: string | null;
  doctor_name: string | null;
  appointment_date: string;
  appointment_time: string | null;
  location_address: string | null;
  notes: string | null;
  reminder_days_before: number[] | null;
}

async function ensureNotificationPermission(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

async function scheduleApptReminders(appt: {
  hospital_name: string | null;
  doctor_name: string | null;
  appointment_date: string;
  appointment_time: string | null;
  reminders: { days?: number; hours?: number }[];
}) {
  const [year, month, day] = appt.appointment_date.split('-').map(Number);
  const [hh, mm] = (appt.appointment_time || '09:00').split(':').map(Number);
  const apptDateTime = new Date(year, month - 1, day, hh, mm);

  const title = `📅 ${appt.hospital_name || appt.doctor_name || 'Appointment'}`;
  const body = appt.doctor_name ? `Dr. ${appt.doctor_name}` : 'Upcoming appointment';

  for (const r of appt.reminders) {
    const triggerDate = new Date(apptDateTime);
    if (r.days) triggerDate.setDate(triggerDate.getDate() - r.days);
    if (r.hours) triggerDate.setHours(triggerDate.getHours() - r.hours);

    if (triggerDate > new Date()) {
      await Notifications.scheduleNotificationAsync({
        content: { title, body },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: triggerDate },
      });
    }
  }
}

function formatDateInput(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function formatTimeInput(d: Date) {
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

export default function AppointmentsScreen({ userId }: { userId: string }) {
  const { t, lang } = useLanguage();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<'upcoming' | 'past'>('upcoming');
  const [notesModalAppt, setNotesModalAppt] = useState<Appointment | null>(null);
  const [notesDraft, setNotesDraft] = useState('');

  const [category, setCategory] = useState('gynecology');
  const [hospital, setHospital] = useState('');
  const [doctor, setDoctor] = useState('');
  const [dateObj, setDateObj] = useState(new Date());
  const [timeObj, setTimeObj] = useState(() => {
    const d = new Date();
    d.setHours(10, 0, 0, 0);
    return d;
  });
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [reminderDay, setReminderDay] = useState(true);
  const [reminderWeek, setReminderWeek] = useState(false);
  const [reminderHour, setReminderHour] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const loadAppointments = useCallback(async () => {
    const { data } = await supabase
      .from('appointments')
      .select('*')
      .eq('user_id', userId)
      .order('appointment_date', { ascending: true });
    setAppointments((data as Appointment[]) || []);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  const { upcoming, past } = useMemo(() => {
    const todayStr = formatDateInput(new Date());
    const upcoming: Appointment[] = [];
    const past: Appointment[] = [];
    appointments.forEach((a) => {
      if (a.appointment_date >= todayStr) upcoming.push(a);
      else past.push(a);
    });
    past.sort((a, b) => (a.appointment_date < b.appointment_date ? 1 : -1));
    return { upcoming, past };
  }, [appointments]);

  async function handleSave() {
    const reminders: { days?: number; hours?: number }[] = [];
    if (reminderWeek) reminders.push({ days: 7 });
    if (reminderDay) reminders.push({ days: 1 });
    if (reminderHour) reminders.push({ hours: 1 });

    const granted = await ensureNotificationPermission();
    if (!granted) {
      Alert.alert(t.notifPermissionTitle, t.notifPermissionMsg);
    }

    setSaving(true);
    const { error } = await supabase.from('appointments').insert({
      user_id: userId,
      category,
      hospital_name: hospital.trim() || null,
      doctor_name: doctor.trim() || null,
      appointment_date: formatDateInput(dateObj),
      appointment_time: formatTimeInput(timeObj),
      location_address: location.trim() || null,
      notes: notes.trim() || null,
      reminder_days_before: reminders.map((r) => r.days || 0),
    });

    if (!error && granted) {
      await scheduleApptReminders({
        hospital_name: hospital.trim() || null,
        doctor_name: doctor.trim() || null,
        appointment_date: formatDateInput(dateObj),
        appointment_time: formatTimeInput(timeObj),
        reminders,
      });
    }

    setSaving(false);
    if (!error) {
      setCategory('gynecology');
      setHospital('');
      setDoctor('');
      setDateObj(new Date());
      const t2 = new Date();
      t2.setHours(10, 0, 0, 0);
      setTimeObj(t2);
      setLocation('');
      setNotes('');
      setReminderDay(true);
      setReminderWeek(false);
      setReminderHour(false);
      setModalVisible(false);
      loadAppointments();
    }
  }

  async function handleDelete(id: string) {
    await supabase.from('appointments').delete().eq('id', id);
    loadAppointments();
  }

  async function handleOpenMaps(appt: Appointment) {
    const query = encodeURIComponent(appt.location_address || appt.hospital_name || '');
    if (!query) return;
    const url = Platform.OS === 'ios' ? `maps://?q=${query}` : `geo:0,0?q=${query}`;
    const fallback = `https://www.google.com/maps/search/?api=1&query=${query}`;
    const canOpen = await Linking.canOpenURL(url);
    Linking.openURL(canOpen ? url : fallback);
  }

  function openNotesModal(appt: Appointment) {
    setNotesModalAppt(appt);
    setNotesDraft(appt.notes || '');
  }

  async function saveNotes() {
    if (!notesModalAppt) return;
    await supabase.from('appointments').update({ notes: notesDraft }).eq('id', notesModalAppt.id);
    setAppointments((prev) =>
      prev.map((a) => (a.id === notesModalAppt.id ? { ...a, notes: notesDraft } : a))
    );
    setNotesModalAppt(null);
  }

  function categoryInfo(id: string) {
    return APPOINTMENT_CATEGORIES.find((c) => c.id === id) || APPOINTMENT_CATEGORIES[APPOINTMENT_CATEGORIES.length - 1];
  }

  function renderAppointment(appt: Appointment) {
    const cat = categoryInfo(appt.category);
    return (
      <View key={appt.id} style={styles.apptCard}>
        <View style={styles.apptHeader}>
          <Text style={styles.apptCategory}>{cat.emoji} {lang === 'tr' ? cat.labelTr : cat.labelEn}</Text>
          <TouchableOpacity onPress={() => handleDelete(appt.id)}>
            <Text style={styles.deleteText}>{t.delete}</Text>
          </TouchableOpacity>
        </View>

        {appt.hospital_name && <Text style={styles.apptTitle}>{appt.hospital_name}</Text>}
        {appt.doctor_name && <Text style={styles.apptDetail}>{lang === 'tr' ? 'Dr.' : 'Dr.'} {appt.doctor_name}</Text>}
        <Text style={styles.apptDetail}>
          📅 {appt.appointment_date} {appt.appointment_time ? `· ${appt.appointment_time}` : ''}
        </Text>

        <View style={styles.apptActions}>
          {(appt.location_address || appt.hospital_name) && (
            <TouchableOpacity style={styles.apptActionBtn} onPress={() => handleOpenMaps(appt)}>
              <Text style={styles.apptActionText}>📍 {t.openMaps}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.apptActionBtn} onPress={() => openNotesModal(appt)}>
            <Text style={styles.apptActionText}>📝 {t.editNotes}</Text>
          </TouchableOpacity>
        </View>

        {appt.notes ? <Text style={styles.apptNotes}>{appt.notes}</Text> : null}
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#B39DDB" />
      </View>
    );
  }

  const list = activeSection === 'upcoming' ? upcoming : past;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>📅 {t.tabAppointments}</Text>

        <View style={styles.sectionToggle}>
          <TouchableOpacity
            style={[styles.sectionBtn, activeSection === 'upcoming' && styles.sectionBtnActive]}
            onPress={() => setActiveSection('upcoming')}
          >
            <Text style={[styles.sectionBtnText, activeSection === 'upcoming' && styles.sectionBtnTextActive]}>
              {t.upcomingAppointments} ({upcoming.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sectionBtn, activeSection === 'past' && styles.sectionBtnActive]}
            onPress={() => setActiveSection('past')}
          >
            <Text style={[styles.sectionBtnText, activeSection === 'past' && styles.sectionBtnTextActive]}>
              {t.pastAppointments} ({past.length})
            </Text>
          </TouchableOpacity>
        </View>

        {list.length === 0 ? (
          <Text style={styles.emptyText}>{t.noAppointments}</Text>
        ) : (
          list.map(renderAppointment)
        )}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Add appointment modal */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.sheet}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.sheetTitle}>{t.addAppointment}</Text>

              <Text style={styles.label}>{t.apptCategory}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                {APPOINTMENT_CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.categoryChip, category === cat.id && styles.categoryChipActive]}
                    onPress={() => setCategory(cat.id)}
                  >
                    <Text style={[styles.categoryChipText, category === cat.id && styles.categoryChipTextActive]}>
                      {cat.emoji} {lang === 'tr' ? cat.labelTr : cat.labelEn}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TextInput
                style={styles.input}
                placeholder={t.apptHospital}
                placeholderTextColor="#8B7AA8"
                value={hospital}
                onChangeText={setHospital}
              />
              <TextInput
                style={styles.input}
                placeholder={t.apptDoctor}
                placeholderTextColor="#8B7AA8"
                value={doctor}
                onChangeText={setDoctor}
              />

              <Text style={styles.label}>{t.apptDate}</Text>
              <TouchableOpacity style={styles.pickerButton} onPress={() => setShowDatePicker(!showDatePicker)}>
                <Text style={styles.pickerButtonText}>{formatDateInput(dateObj)}</Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={dateObj}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(e, selected) => {
                    if (Platform.OS === 'android') setShowDatePicker(false);
                    if (selected) setDateObj(selected);
                  }}
                  style={Platform.OS === 'ios' ? styles.iosPicker : undefined}
                  themeVariant="light"
                />
              )}

              <Text style={styles.label}>{t.apptTime}</Text>
              <TouchableOpacity style={styles.pickerButton} onPress={() => setShowTimePicker(!showTimePicker)}>
                <Text style={styles.pickerButtonText}>{formatTimeInput(timeObj)}</Text>
              </TouchableOpacity>
              {showTimePicker && (
                <DateTimePicker
                  value={timeObj}
                  mode="time"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(e, selected) => {
                    if (Platform.OS === 'android') setShowTimePicker(false);
                    if (selected) setTimeObj(selected);
                  }}
                  style={Platform.OS === 'ios' ? styles.iosPicker : undefined}
                  themeVariant="light"
                />
              )}

              <TextInput
                style={styles.input}
                placeholder={t.apptLocation}
                placeholderTextColor="#8B7AA8"
                value={location}
                onChangeText={setLocation}
              />

              <TextInput
                style={[styles.input, styles.notesInput]}
                placeholder={t.apptNotesPlaceholder}
                placeholderTextColor="#8B7AA8"
                value={notes}
                onChangeText={setNotes}
                multiline
              />

              <Text style={styles.label}>{t.apptReminder}</Text>
              <View style={styles.reminderRow}>
                <TouchableOpacity
                  style={[styles.reminderChip, reminderWeek && styles.reminderChipActive]}
                  onPress={() => setReminderWeek(!reminderWeek)}
                >
                  <Text style={[styles.reminderChipText, reminderWeek && styles.reminderChipTextActive]}>
                    {t.apptReminderWeek}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.reminderChip, reminderDay && styles.reminderChipActive]}
                  onPress={() => setReminderDay(!reminderDay)}
                >
                  <Text style={[styles.reminderChipText, reminderDay && styles.reminderChipTextActive]}>
                    {t.apptReminderDay}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.reminderChip, reminderHour && styles.reminderChipActive]}
                  onPress={() => setReminderHour(!reminderHour)}
                >
                  <Text style={[styles.reminderChipText, reminderHour && styles.reminderChipTextActive]}>
                    {t.apptReminderHour}
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>{t.save}</Text>}
              </TouchableOpacity>

              <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
                <Text style={styles.closeButtonText}>{t.close}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Notes edit modal */}
      <Modal visible={!!notesModalAppt} transparent animationType="slide" onRequestClose={() => setNotesModalAppt(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{t.apptNotes}</Text>
            <TextInput
              style={[styles.input, styles.notesInput, { minHeight: 140 }]}
              placeholder={t.apptNotesPlaceholder}
              placeholderTextColor="#8B7AA8"
              value={notesDraft}
              onChangeText={setNotesDraft}
              multiline
              textAlignVertical="top"
            />
            <TouchableOpacity style={styles.saveButton} onPress={saveNotes}>
              <Text style={styles.saveButtonText}>{t.save}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeButton} onPress={() => setNotesModalAppt(null)}>
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
  title: { fontSize: 24, fontWeight: '700', color: '#4A2C6D', marginBottom: 16 },
  sectionToggle: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 14, padding: 4, marginBottom: 18, borderWidth: 1.5, borderColor: '#E8A9C9' },
  sectionBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  sectionBtnActive: { backgroundColor: '#8E5FBF' },
  sectionBtnText: { fontSize: 13, fontWeight: '700', color: '#4A2C6D' },
  sectionBtnTextActive: { color: '#fff' },
  emptyText: { color: '#8B7AA8', textAlign: 'center', marginTop: 40 },
  apptCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1.5, borderColor: '#E8A9C9' },
  apptHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  apptCategory: { fontSize: 12, fontWeight: '700', color: '#8E5FBF' },
  deleteText: { color: '#D46A9F', fontSize: 12, fontWeight: '600' },
  apptTitle: { fontSize: 16, fontWeight: '700', color: '#4A2C6D' },
  apptDetail: { fontSize: 13, color: '#6B5B85', marginTop: 2 },
  apptActions: { flexDirection: 'row', gap: 10, marginTop: 10 },
  apptActionBtn: { backgroundColor: '#F3E9F7', borderRadius: 10, paddingVertical: 6, paddingHorizontal: 10 },
  apptActionText: { fontSize: 12, color: '#4A2C6D', fontWeight: '600' },
  apptNotes: { fontSize: 12, color: '#2D1B3D', marginTop: 10, backgroundColor: '#FCEEF3', borderRadius: 10, padding: 10, lineHeight: 17 },
  fab: {
    position: 'absolute', right: 20, bottom: 100, width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#8E5FBF', justifyContent: 'center', alignItems: 'center', elevation: 4,
  },
  fabText: { color: '#fff', fontSize: 28, fontWeight: '400', marginTop: -2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, maxHeight: '88%' },
  sheetTitle: { fontSize: 17, fontWeight: '700', color: '#4A2C6D', textAlign: 'center', marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', color: '#4A2C6D', marginBottom: 8, marginTop: 4 },
  categoryChip: {
    paddingVertical: 8, paddingHorizontal: 12, borderRadius: 18, backgroundColor: '#FCEEF3',
    borderWidth: 1.5, borderColor: '#E8A9C9', marginRight: 8,
  },
  categoryChipActive: { backgroundColor: '#8E5FBF', borderColor: '#8E5FBF' },
  categoryChipText: { fontSize: 12, color: '#4A2C6D', fontWeight: '600' },
  categoryChipTextActive: { color: '#fff' },
  input: {
    backgroundColor: '#FCEEF3', borderRadius: 12, padding: 14, marginBottom: 12, fontSize: 16,
    borderWidth: 1.5, borderColor: '#E8A9C9', color: '#2D1B3D',
  },
  notesInput: { minHeight: 80, textAlignVertical: 'top' },
  pickerButton: {
    backgroundColor: '#FCEEF3', borderRadius: 12, padding: 14, borderWidth: 1.5,
    borderColor: '#E8A9C9', alignItems: 'center', marginBottom: 12,
  },
  pickerButtonText: { fontSize: 16, fontWeight: '700', color: '#4A2C6D' },
  iosPicker: { height: 150, marginBottom: 8 },
  reminderRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  reminderChip: {
    paddingVertical: 8, paddingHorizontal: 12, borderRadius: 18, backgroundColor: '#FCEEF3',
    borderWidth: 1.5, borderColor: '#E8A9C9',
  },
  reminderChipActive: { backgroundColor: '#8E5FBF', borderColor: '#8E5FBF' },
  reminderChipText: { fontSize: 12, color: '#4A2C6D', fontWeight: '600' },
  reminderChipTextActive: { color: '#fff' },
  saveButton: { backgroundColor: '#8E5FBF', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 12 },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  closeButton: { marginTop: 16, alignItems: 'center' },
  closeButtonText: { color: '#8B7AA8', fontSize: 15 },
});
