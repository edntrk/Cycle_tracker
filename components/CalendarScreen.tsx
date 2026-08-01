import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/lib/LanguageContext';

type FlowIntensity = 'none' | 'light' | 'medium' | 'heavy';

const flowColors: Record<FlowIntensity, string> = {
  none: '#E0E0E0',
  light: '#F5B8CE',
  medium: '#E8729F',
  heavy: '#C2185B',
};

export default function CalendarScreen({ userId }: { userId: string }) {
  const { t } = useLanguage();
  const [entries, setEntries] = useState<Record<string, FlowIntensity>>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadEntries = useCallback(async () => {
    const { data } = await supabase
      .from('cycle_entries')
      .select('date, flow_intensity')
      .eq('user_id', userId);

    const map: Record<string, FlowIntensity> = {};
    (data || []).forEach((row) => {
      map[row.date] = row.flow_intensity as FlowIntensity;
    });
    setEntries(map);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  async function handleSelectFlow(intensity: FlowIntensity) {
    if (!selectedDate) return;
    setSaving(true);

    if (intensity === 'none') {
      await supabase
        .from('cycle_entries')
        .delete()
        .eq('user_id', userId)
        .eq('date', selectedDate);
      setEntries((prev) => {
        const next = { ...prev };
        delete next[selectedDate];
        return next;
      });
    } else {
      await supabase
        .from('cycle_entries')
        .upsert(
          { user_id: userId, date: selectedDate, flow_intensity: intensity },
          { onConflict: 'user_id,date' }
        );
      setEntries((prev) => ({ ...prev, [selectedDate]: intensity }));
    }

    setSaving(false);
    setSelectedDate(null);
  }

  const markedDates: Record<string, any> = {};
  Object.entries(entries).forEach(([date, intensity]) => {
    markedDates[date] = {
      customStyles: {
        container: { backgroundColor: flowColors[intensity], borderRadius: 8 },
        text: { color: intensity === 'none' ? '#333' : '#fff', fontWeight: '600' },
      },
    };
  });
  if (selectedDate) {
    markedDates[selectedDate] = {
      ...(markedDates[selectedDate] || {}),
      customStyles: {
        container: {
          backgroundColor: markedDates[selectedDate]?.customStyles?.container?.backgroundColor || '#fff',
          borderRadius: 8,
          borderWidth: 2,
          borderColor: '#8E5FBF',
        },
        text: { color: markedDates[selectedDate] ? '#fff' : '#4A2C6D', fontWeight: '700' },
      },
    };
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#B39DDB" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Calendar
        markingType="custom"
        markedDates={markedDates}
        onDayPress={(day: DateData) => setSelectedDate(day.dateString)}
        theme={{
          backgroundColor: '#FCEEF3',
          calendarBackground: '#FCEEF3',
          textSectionTitleColor: '#8B7AA8',
          selectedDayBackgroundColor: '#8E5FBF',
          todayTextColor: '#8E5FBF',
          dayTextColor: '#2D1B3D',
          arrowColor: '#8E5FBF',
          monthTextColor: '#4A2C6D',
          textMonthFontWeight: '700',
          textMonthFontSize: 18,
        }}
        style={styles.calendar}
      />

      <Modal visible={!!selectedDate} transparent animationType="slide" onRequestClose={() => setSelectedDate(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>
              {t.logFlowFor} {selectedDate}
            </Text>

            <View style={styles.flowRow}>
              {(['none', 'light', 'medium', 'heavy'] as FlowIntensity[]).map((intensity) => (
                <TouchableOpacity
                  key={intensity}
                  style={[styles.flowOption, { backgroundColor: flowColors[intensity] }]}
                  onPress={() => handleSelectFlow(intensity)}
                  disabled={saving}
                >
                  <Text style={[styles.flowOptionText, intensity === 'none' && { color: '#333' }]}>
                    {t[`flow${intensity.charAt(0).toUpperCase()}${intensity.slice(1)}` as 'flowNone']}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {saving && <ActivityIndicator color="#8E5FBF" style={{ marginTop: 12 }} />}

            <TouchableOpacity style={styles.closeButton} onPress={() => setSelectedDate(null)}>
              <Text style={styles.closeButtonText}>{t.close}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FCEEF3',
    paddingTop: 60,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FCEEF3',
  },
  calendar: {
    borderRadius: 16,
    marginHorizontal: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#4A2C6D',
    textAlign: 'center',
    marginBottom: 20,
  },
  flowRow: {
    flexDirection: 'row',
    gap: 10,
  },
  flowOption: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  flowOptionText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  closeButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#8B7AA8',
    fontSize: 15,
  },
});
