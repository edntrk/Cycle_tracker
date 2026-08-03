export interface HealthCondition {
  id: string;
  labelEn: string;
  labelTr: string;
}

export const HEALTH_CONDITIONS: HealthCondition[] = [
  { id: 'pcos', labelEn: 'PCOS', labelTr: 'PCOS (Polikistik Over Sendromu)' },
  { id: 'endometriosis', labelEn: 'Endometriosis', labelTr: 'Endometriozis' },
  { id: 'fibroids', labelEn: 'Uterine fibroids', labelTr: 'Rahim miyomu' },
  { id: 'thyroid', labelEn: 'Thyroid condition', labelTr: 'Tiroid rahatsızlığı' },
  { id: 'irregular_cycles', labelEn: 'Irregular cycles (diagnosed)', labelTr: 'Düzensiz döngü (tanı konmuş)' },
  { id: 'none', labelEn: 'None of these', labelTr: 'Hiçbiri' },
];
