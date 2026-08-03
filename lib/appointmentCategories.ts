export interface AppointmentCategory {
  id: string;
  emoji: string;
  labelEn: string;
  labelTr: string;
}

export const APPOINTMENT_CATEGORIES: AppointmentCategory[] = [
  { id: 'gynecology', emoji: '🌸', labelEn: 'Gynecology', labelTr: 'Kadın Doğum' },
  { id: 'general', emoji: '🩺', labelEn: 'General Checkup', labelTr: 'Genel Kontrol' },
  { id: 'dental', emoji: '🦷', labelEn: 'Dental', labelTr: 'Diş' },
  { id: 'dermatology', emoji: '🧴', labelEn: 'Dermatology', labelTr: 'Cildiye' },
  { id: 'lab', emoji: '🧪', labelEn: 'Lab / Blood Test', labelTr: 'Tahlil / Kan Testi' },
  { id: 'mental_health', emoji: '🧠', labelEn: 'Mental Health', labelTr: 'Ruh Sağlığı' },
  { id: 'other', emoji: '📌', labelEn: 'Other', labelTr: 'Diğer' },
];
