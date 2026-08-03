export interface SymptomTag {
  id: string;
  emoji: string;
  labelEn: string;
  labelTr: string;
}

export interface SymptomCategory {
  id: string;
  labelEn: string;
  labelTr: string;
  tags: SymptomTag[];
}

export const SYMPTOM_CATEGORIES: SymptomCategory[] = [
  {
    id: 'mood',
    labelEn: 'Mood',
    labelTr: 'Ruh Hali',
    tags: [
      { id: 'happy', emoji: '😊', labelEn: 'Happy', labelTr: 'Mutlu' },
      { id: 'sad', emoji: '😢', labelEn: 'Sad', labelTr: 'Üzgün' },
      { id: 'anxious', emoji: '😰', labelEn: 'Anxious', labelTr: 'Kaygılı' },
      { id: 'irritable', emoji: '😤', labelEn: 'Irritable', labelTr: 'Sinirli' },
      { id: 'calm', emoji: '😌', labelEn: 'Calm', labelTr: 'Sakin' },
    ],
  },
  {
    id: 'energy',
    labelEn: 'Energy',
    labelTr: 'Enerji',
    tags: [
      { id: 'energetic', emoji: '⚡', labelEn: 'Energetic', labelTr: 'Enerjik' },
      { id: 'tired', emoji: '😴', labelEn: 'Tired', labelTr: 'Yorgun' },
      { id: 'exhausted', emoji: '🥱', labelEn: 'Exhausted', labelTr: 'Bitkin' },
    ],
  },
  {
    id: 'sleep',
    labelEn: 'Sleep',
    labelTr: 'Uyku',
    tags: [
      { id: 'good_sleep', emoji: '😴', labelEn: 'Slept well', labelTr: 'İyi uyudum' },
      { id: 'poor_sleep', emoji: '🌙', labelEn: 'Poor sleep', labelTr: 'Kötü uyudum' },
      { id: 'insomnia', emoji: '👁️', labelEn: 'Insomnia', labelTr: 'Uykusuzluk' },
    ],
  },
  {
    id: 'physical',
    labelEn: 'Physical',
    labelTr: 'Fiziksel',
    tags: [
      { id: 'cramps', emoji: '🤕', labelEn: 'Cramps', labelTr: 'Kramp' },
      { id: 'headache', emoji: '🤯', labelEn: 'Headache', labelTr: 'Baş ağrısı' },
      { id: 'bloating', emoji: '🎈', labelEn: 'Bloating', labelTr: 'Şişkinlik' },
      { id: 'backache', emoji: '🦴', labelEn: 'Backache', labelTr: 'Bel ağrısı' },
      { id: 'tender_breasts', emoji: '💔', labelEn: 'Tender breasts', labelTr: 'Göğüs hassasiyeti' },
      { id: 'nausea', emoji: '🤢', labelEn: 'Nausea', labelTr: 'Bulantı' },
      { id: 'acne', emoji: '🔴', labelEn: 'Acne', labelTr: 'Sivilce' },
    ],
  },
  {
    id: 'digestion',
    labelEn: 'Digestion',
    labelTr: 'Sindirim',
    tags: [
      { id: 'constipation', emoji: '🚫', labelEn: 'Constipation', labelTr: 'Kabızlık' },
      { id: 'diarrhea', emoji: '💧', labelEn: 'Diarrhea', labelTr: 'İshal' },
      { id: 'appetite_up', emoji: '🍽️', labelEn: 'Increased appetite', labelTr: 'İştah artışı' },
    ],
  },
];

export function allTags(): SymptomTag[] {
  return SYMPTOM_CATEGORIES.flatMap((c) => c.tags);
}
