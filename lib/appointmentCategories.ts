export interface AppointmentCategory {
  id: string;
  emoji: string;
  color: string;
  labelEn: string;
  labelTr: string;
}

export const APPOINTMENT_CATEGORIES: AppointmentCategory[] = [
  { id: 'gynecology', emoji: '🌸', color: '#D46A9F', labelEn: 'Gynecology & Obstetrics', labelTr: 'Kadın Doğum' },
  { id: 'general', emoji: '🩺', color: '#7CB88F', labelEn: 'General Checkup', labelTr: 'Genel Kontrol' },
  { id: 'internal_medicine', emoji: '💊', color: '#5FA8D3', labelEn: 'Internal Medicine', labelTr: 'Dahiliye (İç Hastalıkları)' },
  { id: 'general_surgery', emoji: '🔪', color: '#B08BC9', labelEn: 'General Surgery', labelTr: 'Genel Cerrahi' },
  { id: 'dental', emoji: '🦷', color: '#5FA8D3', labelEn: 'Dental', labelTr: 'Diş Hekimliği' },
  { id: 'dermatology', emoji: '🧴', color: '#C9A227', labelEn: 'Dermatology', labelTr: 'Deri ve Zührevi Hastalıklar (Cildiye)' },
  { id: 'lab', emoji: '🧪', color: '#8E5FBF', labelEn: 'Lab / Blood Test', labelTr: 'Tahlil / Kan Testi' },
  { id: 'radiology', emoji: '📷', color: '#8B7AA8', labelEn: 'Radiology / Imaging', labelTr: 'Radyoloji / Görüntüleme' },
  { id: 'mental_health', emoji: '🧠', color: '#E88989', labelEn: 'Psychiatry', labelTr: 'Psikiyatri' },
  { id: 'psychology', emoji: '💬', color: '#E8A9C9', labelEn: 'Psychology', labelTr: 'Psikoloji' },
  { id: 'cardiology', emoji: '❤️', color: '#D46A6A', labelEn: 'Cardiology', labelTr: 'Kardiyoloji' },
  { id: 'cardiovascular_surgery', emoji: '🫀', color: '#C25656', labelEn: 'Cardiovascular Surgery', labelTr: 'Kalp ve Damar Cerrahisi' },
  { id: 'orthopedics', emoji: '🦴', color: '#B08BC9', labelEn: 'Orthopedics & Traumatology', labelTr: 'Ortopedi ve Travmatoloji' },
  { id: 'ophthalmology', emoji: '👁️', color: '#5FA8D3', labelEn: 'Ophthalmology', labelTr: 'Göz Hastalıkları' },
  { id: 'ent', emoji: '👂', color: '#C9A227', labelEn: 'ENT (Ear, Nose, Throat)', labelTr: 'KBB (Kulak Burun Boğaz)' },
  { id: 'pediatrics', emoji: '🧸', color: '#7CB88F', labelEn: 'Pediatrics', labelTr: 'Çocuk Sağlığı ve Hastalıkları' },
  { id: 'pediatric_surgery', emoji: '🧸', color: '#6AA86A', labelEn: 'Pediatric Surgery', labelTr: 'Çocuk Cerrahisi' },
  { id: 'nutrition', emoji: '🥗', color: '#8FB88F', labelEn: 'Nutrition / Dietitian', labelTr: 'Beslenme ve Diyet' },
  { id: 'physiotherapy', emoji: '🏃', color: '#D48A6A', labelEn: 'Physical Therapy & Rehabilitation', labelTr: 'Fizik Tedavi ve Rehabilitasyon' },
  { id: 'urology', emoji: '🩹', color: '#8E5FBF', labelEn: 'Urology', labelTr: 'Üroloji' },
  { id: 'neurology', emoji: '🧠', color: '#B08BC9', labelEn: 'Neurology', labelTr: 'Nöroloji' },
  { id: 'neurosurgery', emoji: '🧠', color: '#9B6FA8', labelEn: 'Neurosurgery', labelTr: 'Beyin ve Sinir Cerrahisi' },
  { id: 'endocrinology', emoji: '⚗️', color: '#C9A227', labelEn: 'Endocrinology (Metabolism & Diabetes)', labelTr: 'Endokrinoloji (Metabolizma ve Diyabet)' },
  { id: 'gastroenterology', emoji: '🫃', color: '#D4A76A', labelEn: 'Gastroenterology', labelTr: 'Gastroenteroloji' },
  { id: 'nephrology', emoji: '🫘', color: '#6AA8A8', labelEn: 'Nephrology', labelTr: 'Nefroloji' },
  { id: 'pulmonology', emoji: '🫁', color: '#6A9CD4', labelEn: 'Pulmonology (Chest Diseases)', labelTr: 'Göğüs Hastalıkları' },
  { id: 'rheumatology', emoji: '🦵', color: '#B08B6A', labelEn: 'Rheumatology', labelTr: 'Romatoloji' },
  { id: 'hematology', emoji: '🩸', color: '#C25656', labelEn: 'Hematology', labelTr: 'Hematoloji' },
  { id: 'oncology', emoji: '🎗️', color: '#8E5FBF', labelEn: 'Oncology', labelTr: 'Onkoloji' },
  { id: 'infectious_diseases', emoji: '🦠', color: '#6A9C6A', labelEn: 'Infectious Diseases', labelTr: 'Enfeksiyon Hastalıkları' },
  { id: 'allergy_immunology', emoji: '🤧', color: '#D4A76A', labelEn: 'Allergy & Immunology', labelTr: 'Alerji ve İmmünoloji' },
  { id: 'plastic_surgery', emoji: '✨', color: '#D48AB0', labelEn: 'Plastic Surgery', labelTr: 'Plastik ve Rekonstrüktif Cerrahi' },
  { id: 'ivf', emoji: '👶', color: '#E8A9C9', labelEn: 'IVF / Fertility', labelTr: 'Tüp Bebek / Üreme Sağlığı' },
  { id: 'family_medicine', emoji: '👨‍👩‍👧', color: '#7CA8B8', labelEn: 'Family Medicine', labelTr: 'Aile Hekimliği' },
  { id: 'emergency', emoji: '🚑', color: '#D46A6A', labelEn: 'Emergency', labelTr: 'Acil Servis' },
  { id: 'other', emoji: '📌', color: '#B08BC9', labelEn: 'Other', labelTr: 'Diğer' },
];
