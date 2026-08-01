# 🌸 Cycle Tracker

A React Native mobile app for tracking menstrual cycles, predicting periods and ovulation, and managing medication reminders — built with Expo, TypeScript, and Supabase.

## Features

- **Authentication** — Email sign-up/sign-in with 8-digit email verification codes (via Supabase Auth + Resend SMTP)
- **Onboarding** — Collects cycle history to generate accurate predictions from day one
- **Home dashboard** — Shows current cycle phase (menstrual, follicular, ovulation, luteal), days until next period, and fertile window status
- **Calendar** — Tap any day to log flow intensity (none/light/medium/heavy); color-coded monthly view
- **Medication reminders** — Add medications/vitamins with custom schedules and get local push notifications at the right time
- **Bilingual** — Full English/Turkish language toggle throughout the app

## Tech Stack

- **Framework:** React Native + Expo (SDK 54), TypeScript, Expo Router
- **Backend:** Supabase (Postgres, Auth, Row Level Security)
- **Email:** Resend (custom SMTP for auth emails)
- **Notifications:** expo-notifications
- **Calendar UI:** react-native-calendars

## Architecture

- `app/_layout.tsx` — Root navigation logic; routes users through Auth → Onboarding → Main app based on session and profile state
- `components/` — Screen-level components (AuthScreen, OnboardingScreen, HomeScreen, CalendarScreen, MedicationsScreen, MainTabs)
- `lib/` — Shared logic: Supabase client, cycle prediction algorithm, translations, language context

### Cycle prediction algorithm

Predictions are derived from the user's average cycle length and last logged period start date:
### Database schema

Four core tables in Supabase, all with Row Level Security enabled so users can only access their own data:

- `profiles` — user info, cycle averages, onboarding status
- `cycle_entries` — daily flow intensity logs
- `symptom_entries` — optional symptom tracking (planned)
- `medications` — medication name, dosage, frequency, reminder times

## Status

This is an active work-in-progress MVP. Planned next steps include symptom logging in the calendar flow, a profile/settings screen, and push notifications for upcoming periods.

## Getting Started

```bash
npm install
npx expo start
```

Requires a `.env` file with:
