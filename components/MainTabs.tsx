import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import HomeScreen from './HomeScreen';
import CalendarScreen from './CalendarScreen';
import AppointmentsScreen from './AppointmentsScreen';
import MedicationsScreen from './MedicationsScreen';
import SymptomsScreen from './SymptomsScreen';
import LearnScreen from './LearnScreen';
import ProfileScreen from './ProfileScreen';
import SettingsScreen from './SettingsScreen';
import { useLanguage } from '@/lib/LanguageContext';

type Tab = 'home' | 'calendar' | 'appointments' | 'meds' | 'symptoms' | 'learn' | 'profile' | 'settings';

export default function MainTabs({
  userId,
  profile,
}: {
  userId: string;
  profile: any;
}) {
  const { t } = useLanguage();
  const [tab, setTab] = useState<Tab>('home');

  return (
    <View style={{ flex: 1 }}>
      {tab === 'home' && (
        <HomeScreen profile={profile} userId={userId} onNavigate={(dest) => setTab(dest as Tab)} />
      )}
      {tab === 'calendar' && <CalendarScreen userId={userId} />}
      {tab === 'appointments' && <AppointmentsScreen userId={userId} />}
      {tab === 'meds' && <MedicationsScreen userId={userId} />}
      {tab === 'symptoms' && <SymptomsScreen userId={userId} profile={profile} />}
      {tab === 'learn' && <LearnScreen />}
      {tab === 'profile' && <ProfileScreen userId={userId} onNavigate={(dest) => setTab(dest as Tab)} />}
      {tab === 'settings' && <SettingsScreen userId={userId} onNavigate={(dest) => setTab(dest as Tab)} />}

      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tabItem} onPress={() => setTab('home')}>
          <Text style={[styles.tabIcon, tab === 'home' && styles.tabActive]}>🏠</Text>
          <Text style={[styles.tabLabel, tab === 'home' && styles.tabActive]}>{t.tabHome}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => setTab('calendar')}>
          <Text style={[styles.tabIcon, tab === 'calendar' && styles.tabActive]}>📅</Text>
          <Text style={[styles.tabLabel, tab === 'calendar' && styles.tabActive]}>{t.tabCalendar}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => setTab('appointments')}>
          <Text style={[styles.tabIcon, tab === 'appointments' && styles.tabActive]}>🗓️</Text>
          <Text style={[styles.tabLabel, tab === 'appointments' && styles.tabActive]}>{t.tabAppointments}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => setTab('meds')}>
          <Text style={[styles.tabIcon, tab === 'meds' && styles.tabActive]}>💊</Text>
          <Text style={[styles.tabLabel, tab === 'meds' && styles.tabActive]}>{t.tabMeds}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => setTab('symptoms')}>
          <Text style={[styles.tabIcon, tab === 'symptoms' && styles.tabActive]}>🩺</Text>
          <Text style={[styles.tabLabel, tab === 'symptoms' && styles.tabActive]}>{t.tabSymptoms}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F0D9E8',
    backgroundColor: '#fff',
    paddingBottom: 24,
    paddingTop: 8,
  },
  tabItem: { flex: 1, alignItems: 'center' },
  tabIcon: { fontSize: 20, opacity: 0.4 },
  tabLabel: { fontSize: 10, color: '#8B7AA8', opacity: 0.6, marginTop: 2 },
  tabActive: { opacity: 1 },
});
