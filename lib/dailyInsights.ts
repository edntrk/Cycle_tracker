import { CyclePhase } from './cycleCalculations';

const insights: Record<CyclePhase, { en: string[]; tr: string[] }> = {
  menstrual: {
    en: [
      "Your body is doing important work. Rest when you can — it's not laziness, it's biology.",
      'Iron-rich foods (spinach, lentils, red meat) can help offset what your body is losing right now.',
      'Light movement like walking or gentle yoga can actually ease cramps for some people.',
      "It's okay to say no to plans today. Low energy during this phase is completely normal.",
    ],
    tr: [
      'Vücudun önemli bir iş yapıyor. Yapabildiğinde dinlen — bu tembellik değil, biyoloji.',
      'Demirden zengin besinler (ıspanak, mercimek, kırmızı et) şu an kaybettiklerini dengelemeye yardımcı olabilir.',
      'Yürüyüş veya hafif yoga gibi düşük tempolu hareketler bazı kişilerde krampları hafifletebilir.',
      'Bugün planlara hayır demek sorun değil. Bu fazda düşük enerji tamamen normal.',
    ],
  },
  follicular: {
    en: [
      'Energy tends to rise in this phase — a good window for starting new projects or workouts.',
      'Estrogen is climbing, which for many people means better mood and sharper focus.',
      'This can be a great time to plan the harder or more demanding parts of your week.',
      'Your body may respond well to higher-intensity exercise right now.',
    ],
    tr: [
      'Bu fazda enerji genelde artar — yeni projelere veya antrenmanlara başlamak için iyi bir dönem.',
      'Östrojen yükseliyor, bu da birçok kişide daha iyi ruh hali ve daha net odaklanma anlamına gelir.',
      'Haftanın daha zor veya yoğun kısımlarını planlamak için iyi bir zaman olabilir.',
      'Vücudun şu an daha yüksek tempolu egzersizlere iyi yanıt verebilir.',
    ],
  },
  ovulation: {
    en: [
      "You're in your fertile window. If you're tracking for pregnancy or avoiding it, this is the key window to know.",
      'Some people notice increased energy and confidence around ovulation.',
      'Mild one-sided pelvic twinges around this time are common and usually harmless.',
      'Cervical mucus often becomes clearer and stretchier during this phase — a natural fertility sign.',
    ],
    tr: [
      'Fertil pencerendesin. Gebelik takibi yapıyorsan (istiyor ya da önlemek istiyor olsan da), bilmen gereken kilit dönem bu.',
      'Bazı kişiler ovülasyon civarında artan enerji ve özgüven fark eder.',
      'Bu dönemde tek taraflı hafif pelvik sancılar yaygındır ve genelde zararsızdır.',
      'Bu fazda servikal mukus genelde daha berrak ve esnek hale gelir — doğal bir doğurganlık işareti.',
    ],
  },
  luteal: {
    en: [
      'PMS symptoms are common in this phase — bloating, mood shifts, and food cravings are your body, not a flaw.',
      'Magnesium-rich foods (dark chocolate, nuts, bananas) may help with mood and cramps some people get before their period.',
      "If you're more sensitive or irritable right now, that's a hormonal pattern, not a character trait.",
      'Sleep quality can dip in this phase for some — a wind-down routine may help.',
    ],
    tr: [
      'Bu fazda PMS belirtileri yaygındır — şişkinlik, ruh hali değişimleri ve yeme isteği bir kusur değil, vücudunun tepkisi.',
      'Magnezyumdan zengin besinler (bitter çikolata, kuruyemiş, muz) bazı kişilerde adet öncesi ruh hali ve krampa yardımcı olabilir.',
      'Şu an daha hassas veya sinirliysen, bu bir karakter özelliği değil, hormonal bir patern.',
      'Bu fazda uyku kalitesi bazı kişilerde düşebilir — sakinleştirici bir akşam rutini yardımcı olabilir.',
    ],
  },
};

export function getDailyInsight(phase: CyclePhase, lang: 'en' | 'tr'): string {
  const list = insights[phase][lang];
  // Deterministic "random" pick based on the day, so it stays the same all day but changes daily.
  const dayIndex = Math.floor(Date.now() / 86400000);
  return list[dayIndex % list.length];
}
