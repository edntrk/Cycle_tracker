export interface Article {
  id: string;
  emoji: string;
  titleEn: string;
  titleTr: string;
  bodyEn: string;
  bodyTr: string;
}

export const ARTICLES: Article[] = [
  {
    id: 'pcos',
    emoji: '🌙',
    titleEn: 'PCOS (Polycystic Ovary Syndrome)',
    titleTr: 'PCOS (Polikistik Over Sendromu)',
    bodyEn: 'PCOS is a hormonal condition that can cause irregular periods, excess androgen levels, and small cysts on the ovaries. Common signs include irregular or missed periods, acne, excess hair growth, and weight changes. It affects how the ovaries work and can impact fertility. PCOS is diagnosed by a doctor, usually through a combination of symptoms, blood tests, and sometimes ultrasound — it cannot be self-diagnosed from an app. If you notice a pattern of irregular cycles along with other symptoms, it is worth discussing with a gynecologist.',
    bodyTr: 'PCOS, düzensiz adet, yüksek androjen seviyeleri ve yumurtalıklarda küçük kistlere yol açabilen hormonal bir durumdur. Yaygın belirtiler arasında düzensiz veya kaçırılan adetler, sivilce, aşırı kıllanma ve kilo değişimleri sayılabilir. Yumurtalıkların çalışma şeklini etkiler ve doğurganlığı etkileyebilir. PCOS tanısı bir doktor tarafından, genelde semptomlar, kan tahlilleri ve bazen ultrason kombinasyonuyla konur — bir uygulama üzerinden kendi kendine tanı konulamaz. Düzensiz döngü paterni ile birlikte başka belirtiler de fark ediyorsan, bir kadın doğum uzmanıyla konuşmakta fayda var.',
  },
  {
    id: 'endometriosis',
    emoji: '🌸',
    titleEn: 'Endometriosis',
    titleTr: 'Endometriozis',
    bodyEn: 'Endometriosis occurs when tissue similar to the lining of the uterus grows outside it, which can cause significant pain, especially during periods. Common signs include severe menstrual cramps, pain during sex, heavy bleeding, and fatigue. It can take years to get diagnosed because symptoms overlap with other conditions. Diagnosis usually involves a specialist evaluation and sometimes imaging or a minor surgical procedure. If period pain is regularly affecting your daily life, that is worth raising with a doctor.',
    bodyTr: 'Endometriozis, rahim iç zarına benzeyen dokunun rahim dışında büyümesiyle oluşur ve özellikle adet döneminde ciddi ağrıya yol açabilir. Yaygın belirtiler arasında şiddetli adet krampları, cinsel ilişki sırasında ağrı, yoğun kanama ve yorgunluk sayılabilir. Semptomlar başka durumlarla örtüştüğü için tanı konması yıllar alabilir. Tanı genelde bir uzman değerlendirmesi ve bazen görüntüleme veya küçük bir cerrahi işlem gerektirir. Adet ağrısı düzenli olarak günlük hayatını etkiliyorsa, bunu bir doktorla konuşman iyi olur.',
  },
  {
    id: 'fibroids',
    emoji: '🔮',
    titleEn: 'Uterine Fibroids',
    titleTr: 'Rahim Miyomu',
    bodyEn: 'Fibroids are non-cancerous growths that develop in or around the uterus. Many people have them without any symptoms at all. When symptoms do occur, they can include heavy or prolonged periods, pelvic pressure, and frequent urination. Fibroids are usually diagnosed with a pelvic exam or ultrasound. Treatment options vary widely depending on size, location, and symptoms, so a gynecologist can help you understand what, if anything, is needed.',
    bodyTr: 'Miyomlar, rahim içinde veya çevresinde gelişen kanserli olmayan büyümelerdir. Birçok kişide hiçbir belirti göstermeden bulunur. Belirti gösterdiğinde yoğun veya uzun süren adetler, pelvik baskı hissi ve sık idrara çıkma görülebilir. Miyomlar genelde pelvik muayene veya ultrason ile tanı konur. Tedavi seçenekleri boyut, konum ve belirtilere göre büyük ölçüde değişir, bu yüzden bir kadın doğum uzmanı neye ihtiyaç olup olmadığını anlamana yardımcı olabilir.',
  },
  {
    id: 'birth_control',
    emoji: '💊',
    titleEn: 'Birth Control Methods, Explained',
    titleTr: 'Doğum Kontrol Yöntemleri Açıklaması',
    bodyEn: 'There are many types of birth control: hormonal methods (the pill, patch, ring, implant, hormonal IUD), non-hormonal methods (copper IUD, condoms, diaphragm), and permanent options. Hormonal methods can also help regulate cycles and reduce cramps for some people. Each method has different effectiveness rates, side effects, and suitability depending on your health history. This is a decision best made together with a doctor who knows your medical background — what works well for one person may not be the right fit for another.',
    bodyTr: 'Birçok doğum kontrol türü vardır: hormonal yöntemler (hap, bant, halka, implant, hormonlu spiral), hormonsuz yöntemler (bakırlı spiral, prezervatif, diyafram) ve kalıcı seçenekler. Hormonal yöntemler bazı kişilerde döngüyü düzenlemeye ve krampları azaltmaya da yardımcı olabilir. Her yöntemin etkinlik oranı, yan etkileri ve uygunluğu sağlık geçmişine göre değişir. Bu, sağlık geçmişini bilen bir doktorla birlikte verilmesi gereken bir karardır — birine iyi gelen yöntem bir başkasına uygun olmayabilir.',
  },
  {
    id: 'cycle_basics',
    emoji: '📅',
    titleEn: 'Menstrual Cycle Basics',
    titleTr: 'Adet Döngüsü Temelleri',
    bodyEn: 'A typical cycle runs 21-35 days and has four phases: menstrual (bleeding), follicular (the body preparing an egg), ovulation (egg release), and luteal (post-ovulation, pre-period). Cycle length can vary naturally due to stress, illness, travel, and other factors — a certain amount of variation is normal. Tracking over several months gives you the clearest picture of what is typical for your own body.',
    bodyTr: 'Tipik bir döngü 21-35 gün sürer ve dört fazdan oluşur: adet (kanama), foliküler (vücudun yumurta hazırlaması), ovülasyon (yumurta salınımı) ve luteal (ovülasyon sonrası, adet öncesi). Döngü uzunluğu stres, hastalık, seyahat ve diğer faktörlere bağlı olarak doğal şekilde değişebilir — belirli bir değişkenlik normaldir. Birkaç ay boyunca takip etmek, kendi vücudun için neyin tipik olduğu konusunda en net resmi verir.',
  },
  {
    id: 'pms_pmdd',
    emoji: '🌊',
    titleEn: 'PMS vs PMDD',
    titleTr: 'PMS ve PMDD Farkı',
    bodyEn: 'PMS (premenstrual syndrome) includes physical and emotional symptoms in the days before a period — mood swings, bloating, fatigue, irritability. PMDD (premenstrual dysphoric disorder) is a more severe form that can significantly disrupt daily life, relationships, and work, with more intense mood symptoms like depression or anxiety. PMDD is a diagnosable condition and there are effective treatments available. If premenstrual symptoms feel overwhelming rather than just uncomfortable, it is worth talking to a doctor.',
    bodyTr: 'PMS (adet öncesi sendrom), adet öncesi günlerde görülen fiziksel ve duygusal belirtileri içerir — ruh hali değişimleri, şişkinlik, yorgunluk, sinirlilik. PMDD (adet öncesi disforik bozukluk) ise günlük hayatı, ilişkileri ve işi ciddi şekilde bozabilen, depresyon veya kaygı gibi daha yoğun ruh hali belirtileri içeren daha şiddetli bir formdur. PMDD tanı konabilen bir durumdur ve etkili tedavi seçenekleri mevcuttur. Adet öncesi belirtiler sadece rahatsız edici değil, bunaltıcı hissettiriyorsa bir doktorla konuşmakta fayda var.',
  },
  {
    id: 'iron_periods',
    emoji: '🩸',
    titleEn: 'Iron, Fatigue, and Heavy Periods',
    titleTr: 'Demir, Yorgunluk ve Yoğun Adetler',
    bodyEn: 'Heavy periods can lead to iron deficiency over time, which often shows up as fatigue, dizziness, or shortness of breath. If your periods are consistently heavy (soaking through protection every hour or two, passing large clots), it is worth mentioning to a doctor — both to check iron levels and to explore why the bleeding is heavy in the first place.',
    bodyTr: 'Yoğun adetler zamanla demir eksikliğine yol açabilir, bu da genelde yorgunluk, baş dönmesi veya nefes darlığı olarak kendini gösterir. Adetlerin sürekli yoğun geçiyorsa (her saat/iki saatte bir koruma değiştirmen gerekiyorsa, büyük pıhtılar düşüyorsa), hem demir seviyeni kontrol ettirmek hem de kanamanın neden yoğun olduğunu araştırmak için bir doktora bahsetmekte fayda var.',
  },
];
