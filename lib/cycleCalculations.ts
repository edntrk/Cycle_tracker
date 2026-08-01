export type CyclePhase = 'menstrual' | 'follicular' | 'ovulation' | 'luteal';

export interface CycleInfo {
  phase: CyclePhase;
  daysUntilNextPeriod: number;
  nextPeriodDate: Date;
  ovulationDate: Date;
  fertileWindowStart: Date;
  fertileWindowEnd: Date;
  isInFertileWindow: boolean;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function daysBetween(a: Date, b: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  // Normalize to midnight to avoid off-by-one from time-of-day differences
  const aMid = new Date(a.getFullYear(), a.getMonth(), a.getDate());
  const bMid = new Date(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((bMid.getTime() - aMid.getTime()) / msPerDay);
}

export function calculateCycleInfo(
  lastPeriodStart: string, // 'YYYY-MM-DD'
  avgCycleLength: number,
  avgPeriodLength: number,
  today: Date = new Date()
): CycleInfo {
  const lastStart = new Date(lastPeriodStart);

  // How many full cycles have passed since the last logged start,
  // so predictions stay accurate even if the user hasn't logged in a while.
  const daysSinceLastStart = daysBetween(lastStart, today);
  const cyclesPassed = Math.floor(daysSinceLastStart / avgCycleLength);
  const currentCycleStart = addDays(lastStart, cyclesPassed * avgCycleLength);

  const nextPeriodDate = addDays(currentCycleStart, avgCycleLength);
  const ovulationDate = addDays(nextPeriodDate, -14);
  const fertileWindowStart = addDays(ovulationDate, -5);
  const fertileWindowEnd = addDays(ovulationDate, 1);

  const dayInCycle = daysBetween(currentCycleStart, today); // 0-indexed
  const daysUntilNextPeriod = daysBetween(today, nextPeriodDate);

  let phase: CyclePhase;
  if (dayInCycle < avgPeriodLength) {
    phase = 'menstrual';
  } else if (today >= fertileWindowStart && today <= fertileWindowEnd) {
    phase = 'ovulation';
  } else if (dayInCycle < daysBetween(currentCycleStart, ovulationDate)) {
    phase = 'follicular';
  } else {
    phase = 'luteal';
  }

  const isInFertileWindow = today >= fertileWindowStart && today <= fertileWindowEnd;

  return {
    phase,
    daysUntilNextPeriod,
    nextPeriodDate,
    ovulationDate,
    fertileWindowStart,
    fertileWindowEnd,
    isInFertileWindow,
  };
}
