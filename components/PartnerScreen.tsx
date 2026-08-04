import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/lib/LanguageContext';
import { calculateCycleInfo, CyclePhase } from '@/lib/cycleCalculations';

const phaseEmoji: Record<CyclePhase, string> = {
  menstrual: '🩸',
  follicular: '🌱',
  ovulation: '✨',
  luteal: '🌙',
};

interface OutgoingLink {
  id: string;
  partner_email: string;
  status: string;
}

interface IncomingInvite {
  id: string;
  user_id: string;
  status: string;
}

export default function PartnerScreen({
  userId,
  userEmail,
  onNavigate,
}: {
  userId: string;
  userEmail: string;
  onNavigate?: (tab: string) => void;
}) {
  const { t, lang } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [sending, setSending] = useState(false);

  const [outgoingLink, setOutgoingLink] = useState<OutgoingLink | null>(null);
  const [incomingInvites, setIncomingInvites] = useState<IncomingInvite[]>([]);
  const [partnerCycleInfo, setPartnerCycleInfo] = useState<{
    fullName: string | null;
    phase: CyclePhase;
    daysUntilNextPeriod: number;
    isInFertileWindow: boolean;
  } | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);

    const { data: outgoing } = await supabase
      .from('partner_links')
      .select('id, partner_email, status')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    setOutgoingLink(outgoing || null);

    const { data: incoming } = await supabase
      .from('partner_links')
      .select('id, user_id, status')
      .eq('partner_email', userEmail);
    setIncomingInvites((incoming || []).filter((i) => i.status !== 'revoked'));

    const activeIncoming = (incoming || []).find((i) => i.status === 'active');
    if (activeIncoming) {
      const { data: partnerProfile } = await supabase
        .from('profiles')
        .select('full_name, last_period_start, avg_cycle_length, avg_period_length')
        .eq('id', activeIncoming.user_id)
        .single();

      if (partnerProfile?.last_period_start) {
        const info = calculateCycleInfo(
          partnerProfile.last_period_start,
          partnerProfile.avg_cycle_length,
          partnerProfile.avg_period_length
        );
        setPartnerCycleInfo({
          fullName: partnerProfile.full_name,
          phase: info.phase,
          daysUntilNextPeriod: info.daysUntilNextPeriod,
          isInFertileWindow: info.isInFertileWindow,
        });
      }
    } else {
      setPartnerCycleInfo(null);
    }

    setLoading(false);
  }, [userId, userEmail]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleSendInvite() {
    if (!inviteEmail.trim() || !inviteEmail.includes('@')) {
      Alert.alert(t.error, lang === 'tr' ? 'Geçerli bir email gir.' : 'Enter a valid email.');
      return;
    }

    setSending(true);
    const { error } = await supabase.from('partner_links').insert({
      user_id: userId,
      partner_email: inviteEmail.trim().toLowerCase(),
      status: 'pending',
    });
    setSending(false);

    if (error) {
      Alert.alert(t.error, error.message);
    } else {
      setInviteEmail('');
      Alert.alert(t.success, t.inviteSent);
      loadData();
    }
  }

  async function handleRevoke() {
    if (!outgoingLink) return;
    await supabase.from('partner_links').update({ status: 'revoked' }).eq('id', outgoingLink.id);
    loadData();
  }

  async function handleAcceptInvite(inviteId: string) {
    await supabase.from('partner_links').update({ status: 'active' }).eq('id', inviteId);
    loadData();
  }

  async function handleDeclineInvite(inviteId: string) {
    await supabase.from('partner_links').update({ status: 'revoked' }).eq('id', inviteId);
    loadData();
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#B39DDB" />
      </View>
    );
  }

  const phaseLabelMap = {
    menstrual: t.phaseMenstrual,
    follicular: t.phaseFollicular,
    ovulation: t.phaseOvulation,
    luteal: t.phaseLuteal,
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {onNavigate && (
        <TouchableOpacity onPress={() => onNavigate('home')} style={styles.backRow}>
          <Text style={styles.backText}>{lang === 'tr' ? '‹ Geri' : '‹ Back'}</Text>
        </TouchableOpacity>
      )}

      <Text style={styles.title}>💞 {t.partnerModeTitle}</Text>

      {incomingInvites.filter((i) => i.status === 'pending').length > 0 && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t.incomingInviteTitle}</Text>
          {incomingInvites
            .filter((i) => i.status === 'pending')
            .map((invite) => (
              <View key={invite.id} style={styles.inviteRow}>
                <Text style={styles.inviteText}>{t.incomingInviteFrom}</Text>
                <View style={styles.inviteActions}>
                  <TouchableOpacity style={styles.acceptBtn} onPress={() => handleAcceptInvite(invite.id)}>
                    <Text style={styles.acceptBtnText}>{t.acceptInvite}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.declineBtn} onPress={() => handleDeclineInvite(invite.id)}>
                    <Text style={styles.declineBtnText}>{t.declineInvite}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
        </View>
      )}

      {partnerCycleInfo && (
        <View style={[styles.card, styles.partnerViewCard]}>
          <Text style={styles.sectionTitle}>{t.partnerViewTitle}</Text>
          <View style={styles.partnerStatusRow}>
            <Text style={styles.partnerEmoji}>{phaseEmoji[partnerCycleInfo.phase]}</Text>
            <View>
              <Text style={styles.partnerPhase}>{phaseLabelMap[partnerCycleInfo.phase]}</Text>
              <Text style={styles.partnerDetail}>
                {partnerCycleInfo.daysUntilNextPeriod <= 0
                  ? t.periodToday
                  : `${partnerCycleInfo.daysUntilNextPeriod} ${t.daysUntilPeriod}`}
              </Text>
              {partnerCycleInfo.isInFertileWindow && (
                <Text style={styles.partnerFertile}>✨ {t.inFertileWindow}</Text>
              )}
            </View>
          </View>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>{t.partnerModeTitle}</Text>
        <Text style={styles.subtitle}>{t.partnerModeSubtitle}</Text>

        {outgoingLink && outgoingLink.status !== 'revoked' ? (
          <View style={styles.linkStatus}>
            <Text style={styles.linkStatusText}>
              {outgoingLink.status === 'active' ? t.activePartner : t.pendingInvite} {outgoingLink.partner_email}
            </Text>
            <TouchableOpacity onPress={handleRevoke}>
              <Text style={styles.revokeText}>{t.revokeAccess}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <TextInput
              style={styles.input}
              placeholder={t.invitePartnerPlaceholder}
              placeholderTextColor="#B8A8C8"
              value={inviteEmail}
              onChangeText={setInviteEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <TouchableOpacity style={styles.primaryButton} onPress={handleSendInvite} disabled={sending}>
              {sending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>{t.sendInvite}</Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </View>

      {!partnerCycleInfo && incomingInvites.filter((i) => i.status === 'pending').length === 0 && !outgoingLink && (
        <Text style={styles.emptyText}>{t.noActivePartnerLink}</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FCEEF3' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FCEEF3' },
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
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#3A2250', marginBottom: 8 },
  subtitle: { fontSize: 12, color: '#8B7AA8', marginBottom: 16, lineHeight: 17 },
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
    shadowColor: '#8E5FBF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 3,
  },
  primaryButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  linkStatus: {
    backgroundColor: '#F3E9F7',
    borderRadius: 14,
    padding: 14,
  },
  linkStatusText: { fontSize: 13, color: '#4A2C6D', fontWeight: '600', marginBottom: 8 },
  revokeText: { color: '#D46A9F', fontSize: 12, fontWeight: '700' },
  inviteRow: { backgroundColor: '#F3E9F7', borderRadius: 14, padding: 14 },
  inviteText: { fontSize: 13, color: '#4A2C6D', marginBottom: 10 },
  inviteActions: { flexDirection: 'row', gap: 10 },
  acceptBtn: { backgroundColor: '#8E5FBF', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 16 },
  acceptBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  declineBtn: { backgroundColor: '#fff', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 16, borderWidth: 1, borderColor: '#E8A9C9' },
  declineBtnText: { color: '#8B7AA8', fontSize: 12, fontWeight: '700' },
  partnerViewCard: { backgroundColor: '#3A2250' },
  partnerStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  partnerEmoji: { fontSize: 36 },
  partnerPhase: { fontSize: 16, fontWeight: '800', color: '#fff' },
  partnerDetail: { fontSize: 12, color: '#D4B8E8', marginTop: 2 },
  partnerFertile: { fontSize: 11, color: '#D4B8E8', marginTop: 4, fontWeight: '700' },
  emptyText: { color: '#B08BC9', fontSize: 13, textAlign: 'center', marginTop: 20, fontStyle: 'italic' },
});
