import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useLanguage } from '@/lib/LanguageContext';
import { ARTICLES } from '@/lib/articles';

export default function LearnScreen() {
  const { lang } = useLanguage();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>📖 {lang === 'tr' ? 'Öğren' : 'Learn'}</Text>
      <Text style={styles.subtitle}>
        {lang === 'tr'
          ? 'Adet sağlığı hakkında eğitici bilgi. Tanı için her zaman bir doktora danış.'
          : 'Educational information about period health. Always consult a doctor for diagnosis.'}
      </Text>

      {ARTICLES.map((article) => {
        const isOpen = expandedId === article.id;
        return (
          <TouchableOpacity
            key={article.id}
            style={styles.card}
            onPress={() => setExpandedId(isOpen ? null : article.id)}
            activeOpacity={0.85}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardEmoji}>{article.emoji}</Text>
              <Text style={styles.cardTitle}>{lang === 'tr' ? article.titleTr : article.titleEn}</Text>
              <Text style={styles.chevron}>{isOpen ? '▲' : '▼'}</Text>
            </View>
            {isOpen && (
              <Text style={styles.cardBody}>{lang === 'tr' ? article.bodyTr : article.bodyEn}</Text>
            )}
          </TouchableOpacity>
        );
      })}

      <Text style={styles.disclaimer}>
        {lang === 'tr'
          ? '⚠️ Bu içerik eğitim amaçlıdır, tıbbi tavsiye değildir.'
          : '⚠️ This content is educational, not medical advice.'}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FCEEF3' },
  content: { padding: 20, paddingTop: 70, paddingBottom: 60 },
  title: { fontSize: 24, fontWeight: '700', color: '#4A2C6D', marginBottom: 8 },
  subtitle: { fontSize: 13, color: '#6B5B85', marginBottom: 20 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#E8A9C9',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  cardEmoji: { fontSize: 22, marginRight: 10 },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: '#4A2C6D' },
  chevron: { fontSize: 12, color: '#B08BC9' },
  cardBody: { fontSize: 13, color: '#2D1B3D', lineHeight: 20, marginTop: 12 },
  disclaimer: { fontSize: 12, color: '#8B7AA8', marginTop: 12, textAlign: 'center', fontStyle: 'italic' },
});
