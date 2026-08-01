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
    // On success, the auth listener in _layout.tsx picks up the new session automatically.
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
        <Text style={styles.title}>🌸 {t.enterCode}</Text>
        <Text style={styles.subtitle}>{t.codeInstructions} {email}</Text>

        <TextInput
          style={[styles.input, styles.codeInput]}
          placeholder="00000000"
          placeholderTextColor="#B8A8C8"
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
        <Text style={styles.title}>🌸 {t.appName}</Text>
        <Text style={styles.subtitle}>{isSignUp ? t.createAccount : t.signIn}</Text>

        {isSignUp && (
          <>
            <TextInput
              style={styles.input}
              placeholder={t.fullName}
              placeholderTextColor="#8B7AA8"
              value={fullName}
              onChangeText={setFullName}
            />
            <TextInput
              style={styles.input}
              placeholder={t.age}
              placeholderTextColor="#8B7AA8"
              value={age}
              onChangeText={setAge}
              keyboardType="number-pad"
            />
            <TextInput
              style={styles.input}
              placeholder={t.yearsSincePeriod}
              placeholderTextColor="#8B7AA8"
              value={yearsSincePeriod}
              onChangeText={setYearsSincePeriod}
              keyboardType="number-pad"
            />
            <TextInput
              style={styles.input}
              placeholder={t.phone}
              placeholderTextColor="#8B7AA8"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </>
        )}

        <TextInput
          style={styles.input}
          placeholder={t.email}
          placeholderTextColor="#8B7AA8"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder={t.password}
          placeholderTextColor="#8B7AA8"
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
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#4A2C6D',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    color: '#6B5B85',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    fontSize: 16,
    borderWidth: 1.5,
    borderColor: '#E8A9C9',
    color: '#2D1B3D',
  },
  codeInput: {
    textAlign: 'center',
    fontSize: 28,
    letterSpacing: 8,
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#8E5FBF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  switchText: {
    textAlign: 'center',
    marginTop: 16,
    color: '#6B5B85',
  },
});
