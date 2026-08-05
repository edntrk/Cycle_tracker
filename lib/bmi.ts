export interface BmiResult {
  value: number;
  categoryEn: string;
  categoryTr: string;
}

export function calculateBmi(heightCm: number, weightKg: number): BmiResult | null {
  if (!heightCm || !weightKg || heightCm <= 0 || weightKg <= 0) return null;

  const heightM = heightCm / 100;
  const value = weightKg / (heightM * heightM);
  const rounded = Math.round(value * 10) / 10;

  let categoryEn: string;
  let categoryTr: string;

  if (rounded < 18.5) {
    categoryEn = 'Underweight';
    categoryTr = 'Zayıf';
  } else if (rounded < 25) {
    categoryEn = 'Normal range';
    categoryTr = 'Normal aralık';
  } else if (rounded < 30) {
    categoryEn = 'Overweight';
    categoryTr = 'Fazla kilolu';
  } else {
    categoryEn = 'Obese range';
    categoryTr = 'Obez aralık';
  }

  return { value: rounded, categoryEn, categoryTr };
}
