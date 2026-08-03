import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Switch,
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/lib/LanguageContext';

const APP_VERSION = '1.0.0';

const PRIVACY_TEXT_EN = `We store your account info, cycle logs, symptoms, medications, and appointments in a secure database (Supabase). Your data is only used to power the app's features - predictions, reminders, and AI symptom analysis. We do not sell your data to third parties. You can export or permanently delete your data at any time from this Settings screen.`;
const PRIVACY_TEXT_TR = `Hesap bilgilerini, döngü kayıtlarını, semptomlarını, ilaçlarını ve randevularını güvenli bir veritabanında (Supabase) saklıyoruz. Verilerin sadece uygulamanın özelliklerini (tahminler, hatırlatmalar, AI semptom analizi) çalıştırmak için kullanılıyor. Verilerini üçüncü taraflara satmıyoruz. Bu Ayarlar ekranından istediğin zaman verilerini dışa aktarabilir veya kalıcı olarak silebilirsin.`;

const TERMS_TEXT_EN = `This app provides educational information about menstrual cycles and general wellness. It does not provide medical diagnoses and is not a substitute for professional medical advice. Always consult a qualified healthcare provider for medical concerns. By using this app, you agree to use it for personal, non-commercial purposes.`;
const TERMS_TEXT_TR = `Bu uygulama, adet döngüsü ve genel sağlık hakkında eğitici bilgi sunar. Tıbbi tanı koymaz ve profesyonel tıbbi tavsiyenin yerini tutmaz. Sağlıkla ilgili endişelerin için her zaman yetkili bir sağlık uzmanına danış. Bu uygulamayı kullanarak, onu kişisel ve ticari olmayan amaçlarla kullanmayı kabul etmiş olursun.`;

export default function SettingsScreen({
  userId,
  onNavigate,
}: {
  userId: string;
  onNavigate?: (tab: string) => void;
}) {
  const { t, lang } = useLanguage();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);

  const [notifPeriod, setNotifPeriod] = useState(true);
  const [notifMeds, setNotifMeds] = useState(true);
  const [notifAppointments, setNotifAppointments] = useState(true);
  const [loadingPrefs, setLoadingPrefs] = useState(true);

  const [exporting, setExporting] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('notif_period, notif_meds, notif_appointments')
        .eq('id', userId)
        .single();
      if (data) {
        setNotifPeriod(data.notif_period ?? true);
        setNotifMeds(data.notif_meds ?? true);
        setNotifAppointments(data.notif_appointments ?? true);
      }
      setLoadingPrefs(false);
    })();
  }, [userId]);

  async function updateNotifPref(key: 'notif_period' | 'notif_meds' | 'notif_appointments', value: boolean) {
    if (key === 'notif_period') setNotifPeriod(value);
    if (key === 'notif_meds') setNotifMeds(value);
    if (key === 'notif_appointments') setNotifAppointments(value);
    await supabase.from('profiles').update({ [key]: value }).eq('id', userId);
  }

  async function handleChangePassword() {
    if (newPassword.length < 6) {
      Alert.alert(t.error, lang === 'tr' ? 'Şifre en az 6 karakter olmalı.' : 'Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert(t.error, lang === 'tr' ? 'Şifreler eşleşmiyor.' : 'Passwords do not match.');
      return;
    }

    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setChangingPassword(false);

    if (error) {
      Alert.alert(t.error, error.message);
    } else {
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert(t.success, lang === 'tr' ? 'Şifren güncellendi.' : 'Your password has been updated.');
    }
  }

  async function handleExportData() {
    setExporting(true);
    try {
      const [profile, cycleEntries, symptomEntries, appointments, medications, symptomAnalyses] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase.from('cycle_entries').select('*').eq('user_id', userId),
        supabase.from('symptom_entries').select('*').eq('user_id', userId),
        supabase.from('appointments').select('*').eq('user_id', userId),
        supabase.from('medications').select('*').eq('user_id', userId),
        supabase.from('symptom_analyses').select('*').eq('user_id', userId),
      ]);

      const exportData = {
        exported_at: new Date().toISOString(),
        profile: profile.data,
        cycle_entries: cycleEntries.data,
        symptom_entries: symptomEntries.data,
        appointments: appointments.data,
        medications: medications.data,
        symptom_analyses: symptomAnalyses.data,
      };

      const fileUri = FileSystem.documentDirectory + 'cycle-tracker-data.json';
      await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(exportData, null, 2));

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri, { mimeType: 'application/json' });
      } else {
        Alert.alert(t.success, t.exportSuccess);
      }
    } catch (err: any) {
      Alert.alert(t.error, err.message || 'Export failed');
    } finally {
      setExporting(false);
    }
  }

  function confirmDeleteAccount() {
    Alert.alert(
      lang === 'tr' ? 'Hesabı Sil' : 'Delete Account',
      lang === 'tr'
        ? 'Bu işlem geri alınamaz. Tüm verilerin kalıcı olarak silinecek. Emin misin?'
        : 'This cannot be undone. All your data will be permanently deleted. Are you sure?',
      [
        { text: t.cancel, style: 'cancel' },
        {
          text: lang === 'tr' ? 'Devam Et' : 'Continue',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              lang === 'tr' ? 'Son Onay' : 'Final Confirmation',
              lang === 'tr'
                ? 'Devam etmek için şifreni gir ve "Onayla ve Kalıcı Olarak Sil" butonuna bas.'
                : 'Enter your password below and tap "Confirm & Permanently Delete" to proceed.'
            );
          },
        },
      ]
    );
  }

  async function handleDeleteAccount() {
    if (!deletePassword) {
      Alert.alert(t.error, lang === 'tr' ? 'Şifreni gir.' : 'Enter your password.');
      return;
    }

    setDeleting(true);

    const { data: userData } = await supabase.auth.getUser();
    const email = userData?.user?.email;

    if (!email) {
      setDeleting(false);
      Alert.alert(t.error, lang === 'tr' ? 'Kullanıcı bulunamadı.' : 'User not found.');
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password: deletePassword });
    if (signInError) {
      setDeleting(false);
      Alert.alert(t.error, lang === 'tr' ? 'Şifre yanlış.' : 'Incorrect password.');
      return;
    }

    const { error: fnError } = await supabase.functions.invoke('delete-account', {});
    setDeleting(false);

    if (fnError) {
      Alert.alert(t.error, fnError.message || 'Failed to delete account');
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {onNavigate && (
        <TouchableOpacity onPress={() => onNavigate('home')} style={styles.backRow}>
          <Text style={styles.backText}>{lang === 'tr' ? '‹ Geri' : '‹ Back'}</Text>
        </TouchableOpacity>
      )}

      <Text style={styles.title}>⚙️ {lang === 'tr' ? 'Ayarlar' : 'Settings'}</Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>{t.notifPrefsTitle}</Text>

        {loadingPrefs ? (
          <ActivityIndicator color="#8E5FBF" style={{ marginVertical: 8 }} />
        ) : (
          <>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>{t.notifPeriod}</Text>
              <Switch
                value={notifPeriod}
                onValueChange={(v) => updateNotifPref('notif_period', v)}
                trackColor={{ false: '#E8D5E8', true: '#8E5FBF' }}
                thumbColor="#fff"
              />
            </View>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>{t.notifMeds}</Text>
              <Switch
                value={notifMeds}
                onValueChange={(v) => updateNotifPref('notif_meds', v)}
                trackColor={{ false: '#E8D5E8', true: '#8E5FBF' }}
                thumbColor="#fff"
              />
            </View>
            <View style={[styles.switchRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.switchLabel}>{t.notifAppointments}</Text>
              <Switch
                value={notifAppointments}
                onValueChange={(v) => updateNotifPref('notif_appointments', v)}
                trackColor={{ false: '#E8D5E8', true: '#8E5FBF' }}
                thumbColor="#fff"
              />
            </View>
          </>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>{t.dataExportTitle}</Text>
        <Text style={styles.dangerSubtitle}>{t.dataExportSubtitle}</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={handleExportData} disabled={exporting}>
          {exporting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>📤 {t.exportBtn}</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>{lang === 'tr' ? 'Şifreni Değiştir' : 'Change Password'}</Text>
        <TextInput
          style={styles.input}
          placeholder={lang === 'tr' ? 'Yeni şifre' : 'New password'}
          placeholderTextColor="#B8A8C8"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
        />
        <TextInput
          style={styles.input}
          placeholder={lang === 'tr' ? 'Yeni şifre (tekrar)' : 'New password (again)'}
          placeholderTextColor="#B8A8C8"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />
        <TouchableOpacity style={styles.primaryButton} onPress={handleChangePassword} disabled={changingPassword}>
          {changingPassword ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>{lang === 'tr' ? 'Şifreyi Güncelle' : 'Update Password'}</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>{t.aboutTitle}</Text>

        <View style={styles.aboutRow}>
          <Text style={styles.aboutLabel}>{t.appVersion}</Text>
          <Text style={styles.aboutValue}>{APP_VERSION}</Text>
        </View>

        <TouchableOpacity style={styles.aboutLink} onPress={() => setPrivacyOpen(!privacyOpen)}>
          <Text style={styles.aboutLinkText}>{privacyOpen ? '▼' : '▶'} {t.privacyPolicy}</Text>
        </TouchableOpacity>
        {privacyOpen && (
          <Text style={styles.legalText}>{lang === 'tr' ? PRIVACY_TEXT_TR : PRIVACY_TEXT_EN}</Text>
        )}

        <TouchableOpacity style={styles.aboutLink} onPress={() => setTermsOpen(!termsOpen)}>
          <Text style={styles.aboutLinkText}>{termsOpen ? '▼' : '▶'} {t.termsOfService}</Text>
        </TouchableOpacity>
        {termsOpen && (
          <Text style={styles.legalText}>{lang === 'tr' ? TERMS_TEXT_TR : TERMS_TEXT_EN}</Text>
        )}
      </View>

      <View style={[styles.card, styles.dangerCard]}>
        <Text style={styles.dangerTitle}>{lang === 'tr' ? 'Hesabı Sil' : 'Delete Account'}</Text>
        <Text style={styles.dangerSubtitle}>
          {lang === 'tr'
            ? 'Bu işlem geri alınamaz. Devam etmeden önce şifreni gir.'
            : 'This action is irreversible. Enter your password to continue.'}
        </Text>

        <TextInput
          style={styles.input}
          placeholder={t.password}
          placeholderTextColor="#B8A8C8"
          value={deletePassword}
          onChangeText={setDeletePassword}
          secureTextEntry
        />

        <TouchableOpacity style={styles.warnButton} onPress={confirmDeleteAccount}>
          <Text style={styles.warnButtonText}>{lang === 'tr' ? 'Hesabımı Sil' : 'Delete My Account'}</Text>
        </TouchableOpacity>

        {deleting && <ActivityIndicator color="#D46A9F" style={{ marginTop: 12 }} />}

        {deletePassword.length > 0 && (
          <TouchableOpacity style={styles.warnButtonSecondary} onPress={handleDeleteAccount} disabled={deleting}>
            <Text style={styles.warnButtonSecondaryText}>
              {lang === 'tr' ? 'Onayla ve Kalıcı Olarak Sil' : 'Confirm & Permanently Delete'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FCEEF3' },
  content: { padding: 20, paddingTop: 60, paddingBottom: 60 },
  backRow: { marginBottom: 12 },
  backText: { color: '#8E5FBF', fontWeight: '700', fontSize: 15 },
  title: { fontSize: 24, fontWeight: '800', color: '#3A2250', marginBottom: 20 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 22,
    padding: 22,
    marginBottom: 16,
    shadowColor: '#4A2C6D',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#3A2250', marginBottom: 14 },
  switchRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3E9F7',
  },
  switchLabel: { fontSize: 14, color: '#4A2C6D', fontWeight: '600' },
  input: {
    backgroundColor: '#FCEEF3',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    fontSize: 15,
    borderWidth: 1.5,
    borderColor: '#F0D9E8',
    color: '#2D1B3D',
  },
  primaryButton: {
    backgroundColor: '#8E5FBF',
    borderRadius: 14,
    padding: 15,
    alignItems: 'center',
    marginTop: 4,
    shadowColor: '#8E5FBF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 3,
  },
  primaryButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  aboutRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  aboutLabel: { fontSize: 13, color: '#8B7AA8' },
  aboutValue: { fontSize: 13, color: '#4A2C6D', fontWeight: '700' },
  aboutLink: { paddingVertical: 10 },
  aboutLinkText: { fontSize: 14, fontWeight: '700', color: '#4A2C6D' },
  legalText: { fontSize: 12, color: '#6B5B85', lineHeight: 18, paddingBottom: 8 },
  dangerCard: { borderWidth: 1.5, borderColor: '#F3D0D0' },
  dangerTitle: { fontSize: 15, fontWeight: '800', color: '#A13A3A', marginBottom: 6 },
  dangerSubtitle: { fontSize: 12, color: '#8B7AA8', marginBottom: 14, lineHeight: 17 },
  warnButton: { backgroundColor: '#FDE2E2', borderRadius: 14, padding: 14, alignItems: 'center', marginTop: 4 },
  warnButtonText: { color: '#A13A3A', fontSize: 14, fontWeight: '700' },
  warnButtonSecondary: { marginTop: 10, alignItems: 'center', padding: 10 },
  warnButtonSecondaryText: { color: '#D46A9F', fontSize: 13, fontWeight: '700' },
});
