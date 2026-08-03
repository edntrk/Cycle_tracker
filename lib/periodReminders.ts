import * as Notifications from 'expo-notifications';
import { calculateCycleInfo } from './cycleCalculations';

const REMINDER_IDS_KEY = 'period-reminder-ids';

async function cancelPreviousReminders() {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const toCancel = scheduled.filter((n) => n.content.data?.type === 'period-reminder');
  await Promise.all(toCancel.map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)));
}

export async function schedulePeriodReminders(
  lastPeriodStart: string,
  avgCycleLength: number,
  avgPeriodLength: number,
  lang: 'en' | 'tr'
) {
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') return;

  await cancelPreviousReminders();

  const info = calculateCycleInfo(lastPeriodStart, avgCycleLength, avgPeriodLength);
  const now = new Date();

  const messages = {
    en: {
      soonTitle: '🌸 Your period is coming up',
      soonBody: (days: number) => `Your period may start in ${days} day${days > 1 ? 's' : ''}.`,
      lateTitle: '🌸 Period check-in',
      lateBody: "Your period hasn't been logged yet. If it's late, that's okay — just log it when it starts.",
    },
    tr: {
      soonTitle: '🌸 Adetin yaklaşıyor',
      soonBody: (days: number) => `Adetin ${days} gün içinde başlayabilir.`,
      lateTitle: '🌸 Adet kontrolü',
      lateBody: 'Adetin henüz kaydedilmedi. Gecikmiş olabilir — başladığında kaydetmen yeterli.',
    },
  }[lang];

  // Reminder 2 days before predicted start (only if that moment is still in the future)
  const twoDaysBefore = new Date(info.nextPeriodDate);
  twoDaysBefore.setDate(twoDaysBefore.getDate() - 2);
  twoDaysBefore.setHours(10, 0, 0, 0);

  if (twoDaysBefore > now) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: messages.soonTitle,
        body: messages.soonBody(2),
        data: { type: 'period-reminder' },
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: twoDaysBefore },
    });
  }

  // Reminder 1 day before
  const oneDayBefore = new Date(info.nextPeriodDate);
  oneDayBefore.setDate(oneDayBefore.getDate() - 1);
  oneDayBefore.setHours(10, 0, 0, 0);

  if (oneDayBefore > now) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: messages.soonTitle,
        body: messages.soonBody(1),
        data: { type: 'period-reminder' },
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: oneDayBefore },
    });
  }

  // "Late" check-in, 2 days after the predicted date, only if still in the future relative to now
  const twoDaysAfter = new Date(info.nextPeriodDate);
  twoDaysAfter.setDate(twoDaysAfter.getDate() + 2);
  twoDaysAfter.setHours(10, 0, 0, 0);

  if (twoDaysAfter > now) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: messages.lateTitle,
        body: messages.lateBody,
        data: { type: 'period-reminder' },
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: twoDaysAfter },
    });
  }
}
