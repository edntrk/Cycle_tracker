# 🌸 Aya — Your Cycle & Health Companion

A comprehensive React Native app for tracking menstrual cycles, understanding symptoms through AI conversation, managing appointments and medications, and sharing status with a partner — built with Expo, TypeScript, Supabase, and Google Gemini.

## Features

- **Authentication** — Email sign-up/sign-in with 8-digit email verification codes, plus a full "forgot password" flow (Supabase Auth + Resend SMTP)
- **Guided onboarding** — A multi-step, Flo-style onboarding flow that explains each question before asking it (goal, last period, cycle length, health conditions)
- **Home dashboard** — A custom radial "cycle dial" (moon-phase inspired) showing the current phase, a daily rotating wellness insight, a one-tap mood logger, and an AI-generated weekly pattern summary
- **Calendar** — Tap any day to log flow intensity and detailed symptom/mood tags (mood, energy, sleep, physical, digestion); shows a monthly summary, a "Cycle Score," and cycle-length trend charts
- **AI Symptom Chat** — A multi-turn conversation with Google Gemini that can ask clarifying follow-up questions before giving educational (non-diagnostic) information, with automatic emergency-keyword detection and one-tap nearby gynecologist search
- **Appointments** — Full appointment tracker with Google Places autocomplete (city → hospital → doctor, filtered by department and location), 18 medical department categories with auto-detection from the doctor's listed specialty, customizable reminders, notes, and automatic period-conflict warnings
- **Medications** — Reminders with multiple daily times, plus an educational medication guide
- **Partner Mode** — Invite a partner by email to see a high-level cycle status summary (phase + days until next period) — never detailed symptoms or notes
- **Settings** — Notification preferences, PDF data export (a formatted report of cycle/symptom/appointment/medication history), password change, account deletion (double-confirmed with password re-entry), and in-app privacy/terms text
- **Bilingual** — Full English/Turkish language toggle throughout the app

## Tech Stack

- **Framework:** React Native + Expo (SDK 54), TypeScript, Expo Router
- **Backend:** Supabase (Postgres, Auth, Row Level Security, Storage, Edge Functions)
- **AI:** Google Gemini (via Supabase Edge Functions, keeping API keys server-side)
- **Places data:** Google Places API (New) — autocomplete + place details
- **Email:** Resend (custom SMTP for auth emails)
- **Notifications:** expo-notifications
- **Calendar UI:** react-native-calendars
- **Charts:** react-native-gifted-charts + react-native-svg
- **PDF generation:** expo-print + expo-sharing

## Architecture

- `app/_layout.tsx` — Root navigation logic; routes users through Auth → Onboarding → Main app based on session and profile state
- `components/` — Screen-level components (AuthScreen, OnboardingScreen, HomeScreen, CalendarScreen, AppointmentsScreen, MedicationsScreen, SymptomsScreen, LearnScreen, PartnerScreen, ProfileScreen, SettingsScreen, MainTabs, CycleDial)
- `lib/` — Shared logic: Supabase client, cycle prediction algorithm, translations, language context, symptom/appointment/health-condition taxonomies, daily insights
- `supabase/functions/` — Edge Functions: `analyze-symptoms` (AI chat), `weekly-insights` (AI pattern summary), `places-autocomplete` (Google Places proxy), `delete-account` (secure account deletion)

### Cycle prediction algorithm

Predictions are derived from the user's average cycle length and last logged period start date:

```
next_period = last_period_start + avg_cycle_length
ovulation   = next_period - 14 days
fertile_window = ovulation - 5 days  to  ovulation + 1 day
```

### Database schema

Core tables in Supabase, all with Row Level Security enabled:

- `profiles` — user info, cycle averages, onboarding status, tracking goal, health conditions, notification preferences
- `cycle_entries` — daily flow intensity logs
- `symptom_entries` — mood/energy/sleep/physical/digestion tags per day
- `symptom_analyses` — saved AI symptom chat transcripts
- `weekly_insights` — cached AI-generated weekly pattern summaries
- `medications` — name, dosage, frequency, multiple reminder times
- `appointments` — category, hospital/doctor, date/time, location, notes, custom reminders
- `partner_links` — opt-in partner sharing connections

## Security Notes

- All AI and third-party API keys (Gemini, Google Places) live only in Supabase Edge Function secrets, never shipped in the client bundle
- Google Places API key is restricted to that API only, with a Cloud Billing budget alert configured
- Account deletion requires password re-authentication and calls a service-role Edge Function; the client never has delete privileges directly

## Getting Started

```bash
npm install
npx expo start
```

Requires a `.env` file with:
```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Plus these Supabase Edge Function secrets: `GEMINI_API_KEY`, `GOOGLE_PLACES_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
