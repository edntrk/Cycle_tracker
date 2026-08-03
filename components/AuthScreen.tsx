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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/lib/LanguageContext';

export default function AuthScreen() {
  const { lang, setLang, t } = useLanguage();
  const [step, setStep] = useState<'form' | 'verify'>('form');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('');
  const [yearsSincePeriod, setYearsSincePeriod] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  async function handleAuth() {
    if (!email || !password) {
      Alert.alert(t.missingInfo, t.missingInfoMsg);
      return;
    }
    setAuthLoading(true);

    if (isSignUp) {
      const pendingProfile = {
        full_name: fullName || null,
        age: age ? parseInt(age, 10) : null,
        years_since_first_period: yearsSincePeriod ? parseInt(yearsSincePeriod, 10) : null,
        phone: phone || null,
      };
      await AsyncStorage.setItem(`pendingProfile:${email}`, JSON.stringify(pendingProfile));

      const { error } = await supabase.auth.signUp({ email, password });
      setAuthLoading(false);
      if (error) {
        Alert.alert(t.error, error.message);
      } else {
        setStep('verify');
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setAuthLoading(false);
      if (error) {
        Alert.alert(t.error, error.message);
      }
    }
  }

  async function handleVerify() {
    if (code.length !== 8) return;
    setAuthLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: 'signup',
    });
    setAuthLoading(false);
    if (error) {
      Alert.alert(t.error, t.invalidCode);
    }
  }

  async function handleResend() {
    const { error } = await supabase.auth.resend({ type: 'signup', email });
    if (!error) {
      Alert.alert(t.success, t.codeSent);
    }
  }

  const LangSwitch = (
    <View style={styles.langSwitch}>
      <TouchableOpacity onPress={() => setLang('en')}>
        <Text style={[styles.langText, lang === 'en' && styles.langActive]}>EN</Text>
      </TouchableOpacity>
      <Text style={styles.langDivider}>/</Text>
      <TouchableOpacity onPress={() => setLang('tr')}>
        <Text style={[styles.langText, lang === 'tr' && styles.langActive]}>TR</Text>
      </TouchableOpacity>
    </View>
  );

  if (step === 'verify') {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {LangSwitch}
        <View style={styles.card}>
          <Text style={styles.emoji}>📩</Text>
          <Text style={styles.title}>{t.enterCode}</Text>
          <Text style={styles.subtitle}>{t.codeInstructions} {email}</Text>

          <TextInput
            style={[styles.input, styles.codeInput]}
            placeholder="00000000"
            placeholderTextColor="#C9B8D8"
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            maxLength={8}
          />

          <TouchableOpacity style={styles.button} onPress={handleVerify} disabled={authLoading}>
            {authLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>{t.verify}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={handleResend}>
            <Text style={styles.switchText}>{t.resendCode}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {LangSwitch}

      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} keyboardShouldPersistTaps="handled">
        <Text style={styles.brandEmoji}>🌸</Text>
        <Text style={styles.brandTitle}>{t.appName}</Text>

        <View style={styles.card}>
          <Text style={styles.subtitle}>{isSignUp ? t.createAccount : t.signIn}</Text>

          {isSignUp && (
            <>
              <TextInput
                style={styles.input}
                placeholder={t.fullName}
                placeholderTextColor="#B8A8C8"
                value={fullName}
                onChangeText={setFullName}
              />
              <TextInput
                style={styles.input}
                placeholder={t.age}
                placeholderTextColor="#B8A8C8"
                value={age}
                onChangeText={setAge}
                keyboardType="number-pad"
              />
              <TextInput
                style={styles.input}
                placeholder={t.yearsSincePeriod}
                placeholderTextColor="#B8A8C8"
                value={yearsSincePeriod}
                onChangeText={setYearsSincePeriod}
                keyboardType="number-pad"
              />
              <TextInput
                style={styles.input}
                placeholder={t.phone}
                placeholderTextColor="#B8A8C8"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </>
          )}

          <TextInput
            style={styles.input}
            placeholder={t.email}
            placeholderTextColor="#B8A8C8"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            style={styles.input}
            placeholder={t.password}
            placeholderTextColor="#B8A8C8"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity style={styles.button} onPress={handleAuth} disabled={authLoading}>
            {authLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>{isSignUp ? t.signUp : t.signIn}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)}>
            <Text style={styles.switchText}>
              {isSignUp ? t.haveAccount : t.noAccount}
            </Text>
          </TouchableOpacity>
        </View>
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
  langSwitch: {
    position: 'absolute',
    top: 60,
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
  },
  langText: {
    fontSize: 14,
    color: '#8B7AA8',
    fontWeight: '600',
    paddingHorizontal: 4,
  },
  langActive: {
    color: '#4A2C6D',
  },
  langDivider: {
    color: '#8B7AA8',
  },
  brandEmoji: {
    fontSize: 44,
    textAlign: 'center',
    marginBottom: 4,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 24,
    color: '#4A2C6D',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 28,
    padding: 24,
    shadowColor: '#4A2C6D',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  emoji: { fontSize: 40, textAlign: 'center', marginBottom: 4 },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
    color: '#4A2C6D',
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
    color: '#4A2C6D',
  },
  input: {
    backgroundColor: '#FCEEF3',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    fontSize: 16,
    borderWidth: 1.5,
    borderColor: '#F0D9E8',
    color: '#2D1B3D',
  },
  codeInput: {
    textAlign: 'center',
    fontSize: 26,
    letterSpacing: 6,
    fontWeight: '700',
  },
  button: {
    backgroundColor: '#8E5FBF',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#8E5FBF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 3,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  switchText: {
    textAlign: 'center',
    marginTop: 16,
    color: '#8B7AA8',
    fontSize: 13,
  },
});
