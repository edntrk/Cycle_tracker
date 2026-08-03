import { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ActivityIndicator, ScrollView, Dimensions } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { BarChart } from 'react-native-gifted-charts';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/lib/LanguageContext';
import { SYMPTOM_CATEGORIES } from '@/lib/symptomTags';

type FlowIntensity = 'none' | 'light' | 'medium' | 'heavy';

const flowColors: Record<FlowIntensity, string> = {
  none: '#E0E0E0',
  light: '#F5B8CE',
  medium: '#E8729F',
  heavy: '#C2185B',
};

function computeCycleLengths(entries: Record<string, FlowIntensity>) {
  const loggedDates = Object.keys(entries)
    .filter((d) => entries[d] !== 'none')
    .sort();

  const starts: string[] = [];
  let prevDate: Date | null = null;
  for (const dateStr of loggedDates) {
    const date = new Date(dateStr);
    if (!prevDate || (date.getTime() - prevDate.getTime()) / 86400000 > 1) {
      starts.push(dateStr);
    }
    prevDate = date;
  }

  if (starts.length < 2) return { lengths: [] as number[], starts };

  const lengths: number[] = [];
  for (let i = 1; i < starts.length; i++) {
    const diff = (new Date(starts[i]).getTime() - new Date(starts[i - 1]).getTime()) / 86400000;
    lengths.push(diff);
  }

  return { lengths, starts };
}

export default function CalendarScreen({ userId }: { userId: string }) {
  const { t, lang } = useLanguage();
  const [entries, setEntries] = useState<Record<string, FlowIntensity>>({});
  const [symptomDays, setSymptomDays] = useState<Record<string, string[]>>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tagsExpanded, setTagsExpanded] = useState(false);
  const [statsExpanded, setStatsExpanded] = useState(false);

  const loadEntries = useCallback(async () => {
    const [{ data: cycleData }, { data: symptomData }] = await Promise.all([
      supabase.from('cycle_entries').select('date, flow_intensity').eq('user_id', userId),
      supabase.from('symptom_entries').select('date, symptom_type').eq('user_id', userId),
    ]);

    const map: Record<string, FlowIntensity> = {};
    (cycleData || []).forEach((row) => {
      map[row.date] = row.flow_intensity as FlowIntensity;
    });
    setEntries(map);

    const symptomMap: Record<string, string[]> = {};
    (symptomData || []).forEach((row) => {
      if (!symptomMap[row.date]) symptomMap[row.date] = [];
      symptomMap[row.date].push(row.symptom_type);
    });
    setSymptomDays(symptomMap);

    setLoading(false);
  }, [userId]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const { lengths } = useMemo(() => computeCycleLengths(entries), [entries]);

  const stats = useMemo(() => {
    if (lengths.length === 0) return null;
    const avg = Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length);
    const shortest = Math.min(...lengths);
    const longest = Math.max(...lengths);
    return { avg, shortest, longest, cyclesLogged: lengths.length };
  }, [lengths]);

  const chartData = useMemo(() => {
    const recent = lengths.slice(-6);
    return recent.map((len, i) => ({
      value: len,
      label: `${lang === 'tr' ? 'D' : 'C'}${i + 1}`,
      frontColor: '#8E5FBF',
    }));
  }, [lengths, lang]);

  function openDay(dateString: string) {
    setSelectedDate(dateString);
    setSelectedTags(symptomDays[dateString] || []);
    setTagsExpanded(false);
  }

  function toggleTag(tagId: string) {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId]
    );
  }

  async function handleSelectFlow(intensity: FlowIntensity) {
    if (!selectedDate) return;

    if (intensity === 'none') {
      await supabase.from('cycle_entries').delete().eq('user_id', userId).eq('date', selectedDate);
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
  }

  async function handleSaveAndClose() {
    if (!selectedDate) return;
    setSaving(true);

    await supabase.from('symptom_entries').delete().eq('user_id', userId).eq('date', selectedDate);

    if (selectedTags.length > 0) {
      await supabase.from('symptom_entries').insert(
        selectedTags.map((tagId) => ({
          user_id: userId,
          date: selectedDate,
          symptom_type: tagId,
        }))
      );
    }

    setSymptomDays((prev) => ({ ...prev, [selectedDate]: selectedTags }));
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
  Object.keys(symptomDays).forEach((date) => {
    if (symptomDays[date]?.length && !markedDates[date]) {
      markedDates[date] = {
        customStyles: {
          container: { borderWidth: 2, borderColor: '#8E5FBF', borderRadius: 8 },
          text: { color: '#4A2C6D', fontWeight: '600' },
        },
      };
    }
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
        text: { color: markedDates[selectedDate]?.customStyles?.container?.backgroundColor ? '#fff' : '#4A2C6D', fontWeight: '700' },
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
      {stats && (
        <TouchableOpacity style={styles.statsCard} onPress={() => setStatsExpanded(!statsExpanded)} activeOpacity={0.8}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.avg}</Text>
              <Text style={styles.statLabel}>{lang === 'tr' ? 'Ortalama gün' : 'Avg days'}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.shortest}</Text>
              <Text style={styles.statLabel}>{lang === 'tr' ? 'En kısa' : 'Shortest'}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.longest}</Text>
              <Text style={styles.statLabel}>{lang === 'tr' ? 'En uzun' : 'Longest'}</Text>
            </View>
          </View>

          <Text style={styles.expandHint}>
            {statsExpanded ? '▲' : '▼'} {lang === 'tr' ? 'Trend grafiği' : 'Trend chart'}
          </Text>

          {statsExpanded && chartData.length > 0 && (
            <View style={styles.chartWrapper}>
              <BarChart
                data={chartData}
                barWidth={28}
                spacing={20}
                roundedTop
                roundedBottom
                hideRules
                xAxisThickness={1}
                yAxisThickness={0}
                xAxisColor="#E8A9C9"
                yAxisTextStyle={{ color: '#8B7AA8', fontSize: 10 }}
                xAxisLabelTextStyle={{ color: '#8B7AA8', fontSize: 10 }}
                noOfSections={4}
                width={Dimensions.get('window').width - 100}
                height={140}
              />
            </View>
          )}
        </TouchableOpacity>
      )}

      <Calendar
        markingType="custom"
        markedDates={markedDates}
        onDayPress={(day: DateData) => openDay(day.dateString)}
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
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.sheetTitle}>
                {t.logFlowFor} {selectedDate}
              </Text>

              <View style={styles.flowRow}>
                {(['none', 'light', 'medium', 'heavy'] as FlowIntensity[]).map((intensity) => {
                  const isActive = (entries[selectedDate!] || 'none') === intensity;
                  return (
                    <TouchableOpacity
                      key={intensity}
                      style={[
                        styles.flowOption,
                        { backgroundColor: flowColors[intensity] },
                        isActive && styles.flowOptionSelected,
                      ]}
                      onPress={() => handleSelectFlow(intensity)}
                    >
                      <Text style={[styles.flowOptionText, intensity === 'none' && { color: '#333' }]}>
                        {t[`flow${intensity.charAt(0).toUpperCase()}${intensity.slice(1)}` as 'flowNone']}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity style={styles.tagsToggle} onPress={() => setTagsExpanded(!tagsExpanded)}>
                <Text style={styles.tagsToggleText}>
                  {tagsExpanded ? '▼' : '▶'} {lang === 'tr' ? 'Semptom / Ruh Hali Ekle' : 'Add Symptoms / Mood'}
                  {selectedTags.length > 0 ? ` (${selectedTags.length})` : ''}
                </Text>
              </TouchableOpacity>

              {tagsExpanded && (
                <View style={styles.tagsContainer}>
                  {SYMPTOM_CATEGORIES.map((cat) => (
                    <View key={cat.id} style={styles.categoryBlock}>
                      <Text style={styles.categoryLabel}>{lang === 'tr' ? cat.labelTr : cat.labelEn}</Text>
                      <View style={styles.tagsRow}>
                        {cat.tags.map((tag) => {
                          const active = selectedTags.includes(tag.id);
                          return (
                            <TouchableOpacity
                              key={tag.id}
                              style={[styles.tagChip, active && styles.tagChipActive]}
                              onPress={() => toggleTag(tag.id)}
                            >
                              <Text style={[styles.tagChipText, active && styles.tagChipTextActive]}>
                                {tag.emoji} {lang === 'tr' ? tag.labelTr : tag.labelEn}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  ))}
                </View>
              )}

              <TouchableOpacity style={styles.saveButton} onPress={handleSaveAndClose} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>{t.save}</Text>}
              </TouchableOpacity>

              <TouchableOpacity style={styles.closeButton} onPress={() => setSelectedDate(null)}>
                <Text style={styles.closeButtonText}>{t.close}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FCEEF3', paddingTop: 60 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FCEEF3' },
  statsCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    marginHorizontal: 12,
    marginBottom: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    borderColor: '#E8A9C9',
  },
  statsRow: { flexDirection: 'row' },
  statItem: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: '#F0D9E8' },
  statValue: { fontSize: 20, fontWeight: '700', color: '#4A2C6D' },
  statLabel: { fontSize: 11, color: '#8B7AA8', marginTop: 2 },
  expandHint: { textAlign: 'center', fontSize: 11, color: '#B08BC9', marginTop: 10 },
  chartWrapper: { marginTop: 12, alignItems: 'center' },
  calendar: { borderRadius: 16, marginHorizontal: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, maxHeight: '85%' },
  sheetTitle: { fontSize: 17, fontWeight: '700', color: '#4A2C6D', textAlign: 'center', marginBottom: 20 },
  flowRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  flowOption: { flex: 1, paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  flowOptionSelected: { borderWidth: 3, borderColor: '#4A2C6D' },
  flowOptionText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  tagsToggle: { paddingVertical: 14 },
  tagsToggleText: { fontSize: 14, fontWeight: '700', color: '#4A2C6D' },
  tagsContainer: { marginBottom: 8 },
  categoryBlock: { marginBottom: 14 },
  categoryLabel: { fontSize: 12, fontWeight: '700', color: '#8B7AA8', marginBottom: 8, textTransform: 'uppercase' },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#FCEEF3',
    borderWidth: 1.5,
    borderColor: '#E8A9C9',
  },
  tagChipActive: { backgroundColor: '#8E5FBF', borderColor: '#8E5FBF' },
  tagChipText: { fontSize: 13, color: '#4A2C6D', fontWeight: '600' },
  tagChipTextActive: { color: '#fff' },
  saveButton: { backgroundColor: '#8E5FBF', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 12 },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  closeButton: { marginTop: 16, alignItems: 'center' },
  closeButtonText: { color: '#8B7AA8', fontSize: 15 },
});
