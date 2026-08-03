import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useLanguage } from '@/lib/LanguageContext';

interface DrugInfo {
  name: string;
  category: string;
  usedFor: string;
  howItWorks: string;
  notes: string;
}

const content: Record<'en' | 'tr', DrugInfo[]> = {
  en: [
    {
      name: 'Ibuprofen (e.g. Advil, Nurofen)',
      category: 'NSAID pain reliever',
      usedFor: 'Cramps, headaches, lower back pain during your period.',
      howItWorks: 'Reduces prostaglandins, the chemicals that cause uterine cramping.',
      notes: 'Usually taken with food. Follow the dose on the package label or ask a pharmacist — do not exceed the recommended daily amount.',
    },
    {
      name: 'Naproxen (e.g. Aleve)',
      category: 'NSAID pain reliever',
      usedFor: 'Period cramps, longer-lasting pain relief than ibuprofen.',
      howItWorks: 'Also reduces prostaglandins; effects last longer per dose.',
      notes: 'Take with food. Check the label for correct dosing and spacing between doses.',
    },
    {
      name: 'Paracetamol / Acetaminophen (e.g. Tylenol, Panadol)',
      category: 'Pain reliever',
      usedFor: 'Mild to moderate cramps and headaches.',
      howItWorks: 'Works differently from NSAIDs; gentler on the stomach.',
      notes: 'Good option if NSAIDs upset your stomach. Never exceed the daily maximum on the label.',
    },
    {
      name: 'Combined hormonal birth control (the pill)',
      category: 'Hormonal contraceptive',
      usedFor: 'Preventing pregnancy; often also used to regulate cycles and reduce cramps/flow.',
      howItWorks: 'Contains estrogen and progestin to prevent ovulation.',
      notes: 'Requires a prescription. Effects, side effects, and suitability vary by person — a doctor evaluates your health history first.',
    },
    {
      name: 'Iron supplements',
      category: 'Mineral supplement',
      usedFor: 'Replacing iron lost through heavy periods; helps with fatigue from low iron.',
      howItWorks: 'Restores iron stores used to make red blood cells.',
      notes: 'Best taken as advised by a doctor after a blood test confirms low iron — too much iron can be harmful.',
    },
  ],
  tr: [
    {
      name: 'İbuprofen (örn. Advil, Nurofen, Dolorex)',
      category: 'NSAID ağrı kesici',
      usedFor: 'Kramp, baş ağrısı, adet döneminde bel ağrısı.',
      howItWorks: 'Rahim kasılmalarına neden olan prostaglandinleri azaltır.',
      notes: 'Genelde yemekle birlikte alınır. Kutu üzerindeki dozu takip et veya eczacına danış — günlük önerilen miktarı aşma.',
    },
    {
      name: 'Naproksen (örn. Apranax)',
      category: 'NSAID ağrı kesici',
      usedFor: 'Adet krampları, ibuprofenden daha uzun süreli ağrı kesme.',
      howItWorks: 'Prostaglandinleri azaltır; etkisi doz başına daha uzun sürer.',
      notes: 'Yemekle birlikte al. Doğru doz ve aralıklar için etikete bak.',
    },
    {
      name: 'Parasetamol (örn. Tylenol, Parol)',
      category: 'Ağrı kesici',
      usedFor: 'Hafif-orta şiddette kramp ve baş ağrısı.',
      howItWorks: "NSAID'lerden farklı çalışır, mideye daha nazik.",
      notes: "NSAID'ler mideni bozuyorsa iyi bir alternatif. Etikettteki günlük maksimum miktarı asla aşma.",
    },
    {
      name: 'Kombine hormonal doğum kontrol hapı',
      category: 'Hormonal doğum kontrol yöntemi',
      usedFor: 'Gebeliği önleme; genelde döngüyü düzenlemek ve kramp/akıntıyı azaltmak için de kullanılır.',
      howItWorks: 'Ovülasyonu önlemek için östrojen ve progestin içerir.',
      notes: 'Reçete gerektirir. Etkileri ve yan etkileri kişiden kişiye değişir — doktor önce sağlık geçmişini değerlendirir.',
    },
    {
      name: 'Demir takviyeleri',
      category: 'Mineral takviyesi',
      usedFor: 'Yoğun adet kanamasıyla kaybedilen demiri yerine koyma; düşük demire bağlı yorgunluğa yardımcı olur.',
      howItWorks: 'Kırmızı kan hücresi üretiminde kullanılan demir depolarını yeniler.',
      notes: 'Kan tahlili düşük demir gösterdikten sonra doktor önerisiyle alınması en iyisidir — fazla demir zararlı olabilir.',
    },
  ],
};

export default function MedicationInfoScreen({ onClose }: { onClose: () => void }) {
  const { lang } = useLanguage();
  const drugs = content[lang];

  return (
    <View style={styles.overlay}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>
          {lang === 'tr' ? '📚 İlaç Rehberi' : '📚 Medication Guide'}
        </Text>
        <Text style={styles.subtitle}>
          {lang === 'tr'
            ? 'Adet döneminde sık kullanılan ilaçlar hakkında genel bilgi. Kişisel doz önerisi değildir.'
            : 'General information about medications commonly used during periods. Not personalized dosing advice.'}
        </Text>

        {drugs.map((drug) => (
          <View key={drug.name} style={styles.card}>
            <Text style={styles.drugName}>{drug.name}</Text>
            <Text style={styles.category}>{drug.category}</Text>

            <Text style={styles.label}>{lang === 'tr' ? 'Ne için kullanılır' : 'Used for'}</Text>
            <Text style={styles.text}>{drug.usedFor}</Text>

            <Text style={styles.label}>{lang === 'tr' ? 'Nasıl çalışır' : 'How it works'}</Text>
            <Text style={styles.text}>{drug.howItWorks}</Text>

            <Text style={styles.label}>{lang === 'tr' ? 'Not' : 'Note'}</Text>
            <Text style={styles.text}>{drug.notes}</Text>
          </View>
        ))}

        <Text style={styles.disclaimer}>
          {lang === 'tr'
            ? '⚠️ Bu bilgiler eğitim amaçlıdır, tıbbi tavsiye değildir. İlaç kullanmadan önce eczacına veya doktoruna danış.'
            : '⚠️ This information is educational, not medical advice. Consult a pharmacist or doctor before taking any medication.'}
        </Text>

        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>{lang === 'tr' ? 'Kapat' : 'Close'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: '#FCEEF3', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10 },
  container: { flex: 1 },
  content: { padding: 20, paddingTop: 70, paddingBottom: 60 },
  title: { fontSize: 22, fontWeight: '700', color: '#4A2C6D', marginBottom: 6 },
  subtitle: { fontSize: 13, color: '#6B5B85', marginBottom: 20 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: '#E8A9C9',
  },
  drugName: { fontSize: 16, fontWeight: '700', color: '#4A2C6D' },
  category: { fontSize: 12, color: '#8E5FBF', fontWeight: '600', marginBottom: 10 },
  label: { fontSize: 12, fontWeight: '700', color: '#6B5B85', marginTop: 8 },
  text: { fontSize: 13, color: '#2D1B3D', lineHeight: 19, marginTop: 2 },
  disclaimer: { fontSize: 12, color: '#8B7AA8', marginTop: 12, textAlign: 'center', fontStyle: 'italic' },
  closeButton: { marginTop: 20, backgroundColor: '#8E5FBF', borderRadius: 12, padding: 14, alignItems: 'center' },
  closeButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
