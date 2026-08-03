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
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/lib/LanguageContext';

export default function ProfileScreen({ userId }: { userId: string }) {
  const { t, lang, setLang } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('');
  const [yearsSincePeriod, setYearsSincePeriod] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('full_name, age, years_since_first_period, phone, email, avatar_url')
        .eq('id', userId)
        .single();

      if (data) {
        setFullName(data.full_name || '');
        setAge(data.age ? String(data.age) : '');
        setYearsSincePeriod(data.years_since_first_period ? String(data.years_since_first_period) : '');
        setPhone(data.phone || '');
        setEmail(data.email || '');
        setAvatarUrl(data.avatar_url || null);
      }
      setLoading(false);
    })();
  }, [userId]);

  async function handlePickAvatar() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t.error, lang === 'tr' ? 'Fotoğraf erişimi gerekli.' : 'Photo library access is required.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (result.canceled) return;

    setUploadingAvatar(true);

    try {
      const asset = result.assets[0];
      if (!asset.base64) throw new Error('No image data');

      const fileExt = 'jpg';
      const filePath = `${userId}/avatar.${fileExt}`;
      const arrayBuffer = Uint8Array.from(atob(asset.base64), (c) => c.charCodeAt(0));

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, arrayBuffer, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const newUrl = `${publicUrlData.publicUrl}?t=${Date.now()}`;

      await supabase.from('profiles').update({ avatar_url: newUrl }).eq('id', userId);
      setAvatarUrl(newUrl);
    } catch (err: any) {
      Alert.alert(t.error, err.message || 'Upload failed');
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName || null,
        age: age ? parseInt(age, 10) : null,
        years_since_first_period: yearsSincePeriod ? parseInt(yearsSincePeriod, 10) : null,
        phone: phone || null,
      })
      .eq('id', userId);
    setSaving(false);

    if (error) {
      Alert.alert(t.error, error.message);
    } else {
      Alert.alert(t.success, t.savedMsg);
    }
  }

  function handleSignOut() {
    Alert.alert(t.signOut, t.signOutConfirm, [
      { text: t.cancel, style: 'cancel' },
      { text: t.signOut, style: 'destructive', onPress: () => supabase.auth.signOut() },
    ]);
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#B39DDB" />
      </View>
    );
  }

  const initials = fullName
    ? fullName.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
    : '🌸';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>👤 {t.profileTitle}</Text>

      <TouchableOpacity style={styles.avatarWrapper} onPress={handlePickAvatar} disabled={uploadingAvatar}>
        {uploadingAvatar ? (
          <View style={styles.avatarPlaceholder}>
            <ActivityIndicator color="#8E5FBF" />
          </View>
        ) : avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitials}>{initials}</Text>
          </View>
        )}
        <View style={styles.avatarEditBadge}>
          <Text style={styles.avatarEditText}>✎</Text>
        </View>
      </TouchableOpacity>

      <View style={styles.langSwitch}>
        <TouchableOpacity onPress={() => setLang('en')}>
          <Text style={[styles.langText, lang === 'en' && styles.langActive]}>EN</Text>
        </TouchableOpacity>
        <Text style={styles.langDivider}>/</Text>
        <TouchableOpacity onPress={() => setLang('tr')}>
          <Text style={[styles.langText, lang === 'tr' && styles.langActive]}>TR</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>{t.email}</Text>
      <TextInput style={[styles.input, styles.inputDisabled]} value={email} editable={false} />

      <Text style={styles.label}>{t.fullName}</Text>
      <TextInput style={styles.input} value={fullName} onChangeText={setFullName} placeholderTextColor="#8B7AA8" />

      <Text style={styles.label}>{t.age}</Text>
      <TextInput
        style={styles.input}
        value={age}
        onChangeText={setAge}
        keyboardType="number-pad"
        placeholderTextColor="#8B7AA8"
      />

      <Text style={styles.label}>{t.yearsSincePeriod}</Text>
      <TextInput
        style={styles.input}
        value={yearsSincePeriod}
        onChangeText={setYearsSincePeriod}
        keyboardType="number-pad"
        placeholderTextColor="#8B7AA8"
      />

      <Text style={styles.label}>{t.phone}</Text>
      <TextInput
        style={styles.input}
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        placeholderTextColor="#8B7AA8"
      />

      <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>{t.saveChanges}</Text>}
      </TouchableOpacity>

      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutText}>{t.signOut}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FCEEF3' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FCEEF3' },
  content: { padding: 20, paddingTop: 60, paddingBottom: 60 },
  title: { fontSize: 24, fontWeight: '700', color: '#4A2C6D', marginBottom: 20, textAlign: 'center' },
  avatarWrapper: { alignSelf: 'center', marginBottom: 20 },
  avatarImage: { width: 96, height: 96, borderRadius: 48, borderWidth: 3, borderColor: '#fff' },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#F3E9F7',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  avatarInitials: { fontSize: 30, fontWeight: '700', color: '#8E5FBF' },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#8E5FBF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FCEEF3',
  },
  avatarEditText: { color: '#fff', fontSize: 13 },
  langSwitch: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, alignSelf: 'center' },
  langText: { fontSize: 14, color: '#8B7AA8', fontWeight: '600', paddingHorizontal: 4 },
  langActive: { color: '#4A2C6D' },
  langDivider: { color: '#8B7AA8' },
  label: { fontSize: 13, fontWeight: '600', color: '#4A2C6D', marginBottom: 6, marginTop: 4 },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    fontSize: 16,
    borderWidth: 1.5,
    borderColor: '#E8A9C9',
    color: '#2D1B3D',
  },
  inputDisabled: { opacity: 0.6 },
  saveButton: { backgroundColor: '#8E5FBF', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  signOutButton: { alignItems: 'center', padding: 16, marginTop: 12 },
  signOutText: { color: '#D46A9F', fontSize: 15, fontWeight: '600' },
});
