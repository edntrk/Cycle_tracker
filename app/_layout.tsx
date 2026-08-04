import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState, useCallback } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { supabase } from '@/lib/supabase';
import AuthScreen from '@/components/AuthScreen';
import OnboardingScreen from '@/components/OnboardingScreen';
import MainTabs from '@/components/MainTabs';
import { LanguageProvider } from '@/lib/LanguageContext';

async function applyPendingProfile(session: any) {
  if (!session?.user?.email) return;
  const key = `pendingProfile:${session.user.email}`;
  const pending = await AsyncStorage.getItem(key);
  if (!pending) return;

  const profileData = JSON.parse(pending);
  await supabase.from('profiles').update(profileData).eq('id', session.user.id);
  await AsyncStorage.removeItem(key);
}

function RootContent() {
  const colorScheme = useColorScheme();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  const loadProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('full_name, onboarding_completed, last_period_start, avg_cycle_length, avg_period_length, health_conditions, email')
      .eq('id', userId)
      .single();
    setProfile(data);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        await applyPendingProfile(session);
        await loadProfile(session.user.id);
      }
      setSession(session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        await applyPendingProfile(session);
        await loadProfile(session.user.id);
      }
      setSession(session);
    });

    return () => listener.subscription.unsubscribe();
  }, [loadProfile]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#B39DDB" />
      </View>
    );
  }

  if (!session) {
    return <AuthScreen />;
  }

  if (profile === null) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#B39DDB" />
      </View>
    );
  }

  if (!profile.onboarding_completed) {
    return (
      <OnboardingScreen
        userId={session.user.id}
        onComplete={() => loadProfile(session.user.id)}
      />
    );
  }

  return <MainTabs userId={session.user.id} profile={profile} />;
}

export default function RootLayout() {
  return (
    <LanguageProvider>
      <RootContent />
    </LanguageProvider>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF5F7',
  },
});
