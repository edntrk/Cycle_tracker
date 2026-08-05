import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import HomeScreen from './HomeScreen';
import CalendarScreen from './CalendarScreen';
import AppointmentsScreen from './AppointmentsScreen';
import MedicationsScreen from './MedicationsScreen';
import SymptomsScreen from './SymptomsScreen';
import LearnScreen from './LearnScreen';
import ProfileScreen from './ProfileScreen';
import SettingsScreen from './SettingsScreen';
import PartnerScreen from './PartnerScreen';
import { useLanguage } from '@/lib/LanguageContext';

type Tab = 'home' | 'calendar' | 'appointments' | 'meds' | 'symptoms' | 'learn' | 'profile' | 'settings' | 'partner';

export default function MainTabs({
  userId,
  profile,
}: {
  userId: string;
  profile: any;
}) {
  const { t } = useLanguage();
  const [tab, setTab] = useState<Tab>('home');
  const [showWelcome, setShowWelcome] = useState(true);

  if (showWelcome) {
    return (
      <TouchableOpacity
        style={styles.welcomeOverlay}
        activeOpacity={1}
        onPress={() => setShowWelcome(false)}
      >
        <Image
          source={require('../assets/images/aya-mascot.png')}
          style={styles.welcomeMascot}
          resizeMode="contain"
        />
        <Text style={styles.welcomeGreeting}>
          {t.appName === 'Aya' ? 'Merhaba! 👋' : 'Hi there! 👋'}
        </Text>
        <Text style={styles.welcomeSubtitle}>
          {t.appName === 'Aya' ? 'Bugün de yanındayım.' : "I'm here with you today."}
        </Text>
        <Text style={styles.welcomeTapHint}>
          {t.appName === 'Aya' ? 'Devam etmek için dokun' : 'Tap to continue'}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {tab === 'home' && (
        <HomeScreen profile={profile} userId={userId} onNavigate={(dest) => setTab(dest as Tab)} />
      )}
      {tab === 'calendar' && <CalendarScreen userId={userId} />}
      {tab === 'appointments' && <AppointmentsScreen userId={userId} profile={profile} />}
      {tab === 'meds' && <MedicationsScreen userId={userId} />}
      {tab === 'symptoms' && <SymptomsScreen userId={userId} profile={profile} />}
      {tab === 'learn' && <LearnScreen />}
      {tab === 'profile' && <ProfileScreen userId={userId} onNavigate={(dest) => setTab(dest as Tab)} />}
      {tab === 'settings' && <SettingsScreen userId={userId} onNavigate={(dest) => setTab(dest as Tab)} />}
      {tab === 'partner' && <PartnerScreen userId={userId} userEmail={profile.email} onNavigate={(dest) => setTab(dest as Tab)} />}

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
  welcomeOverlay: {
    flex: 1,
    backgroundColor: '#FCEEF3',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  welcomeMascot: { width: 240, height: 240, marginBottom: 8 },
  welcomeGreeting: { fontSize: 26, fontWeight: '800', color: '#3A2250', marginBottom: 6 },
  welcomeSubtitle: { fontSize: 15, color: '#6B5B85', marginBottom: 40 },
  welcomeTapHint: { fontSize: 12, color: '#B08BC9', fontWeight: '600' },
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
