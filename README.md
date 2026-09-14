🌸 Aya — Your Cycle & Health Companion

Aya is a bilingual mobile health companion for menstrual cycle tracking, symptom awareness, medication reminders, appointment management, and privacy-conscious partner sharing.

Built with React Native, Expo, TypeScript, Supabase, and Google Gemini, Aya combines everyday health tracking with conversational AI while keeping sensitive operations and API keys on the server.

Medical disclaimer: Aya provides educational wellness information only. It is not a substitute for professional medical advice, diagnosis, or treatment. Cycle and fertility predictions are estimates and should not be used as contraception.

✨ Highlights

Cycle tracking — Log periods, flow intensity, symptoms, moods, energy, sleep, and digestion.

Personalized dashboard — View the current cycle phase through a custom radial cycle dial, receive daily wellness insights, and log moods in one tap.

AI symptom conversation — Discuss symptoms through a multi-turn Gemini-powered chat that asks clarifying questions and provides non-diagnostic educational information.

Safety-aware guidance — Emergency-keyword detection directs users toward appropriate help, with one-tap nearby gynecologist search.

Appointments — Search by city, hospital, department, and doctor using Google Places; add notes and reminders and receive potential period-conflict warnings.

Medication reminders — Track dosage, frequency, and multiple reminder times, supported by an educational medication guide.

Partner Mode — Share only a high-level cycle summary, such as the current phase and estimated days until the next period. Detailed symptoms and private notes are never shared.

Weekly insights — Receive an AI-generated summary of recent logged patterns.

PDF export — Generate a formatted report containing cycle, symptom, appointment, and medication history.

Bilingual experience — Switch between English and Turkish throughout the app.

🛠 Tech Stack

Area

Technologies

Mobile

React Native, Expo SDK 54, Expo Router, TypeScript

Backend

Supabase Postgres, Auth, Storage, Row Level Security, Edge Functions

AI

Google Gemini through authenticated Supabase Edge Functions

Location

Google Places API (New)

Email

Resend SMTP

Notifications

expo-notifications

Calendar

react-native-calendars

Charts

react-native-gifted-charts, react-native-svg

Export

expo-print, expo-sharing

🏗 Architecture

app/
└── _layout.tsx             # Session-aware Auth → Onboarding → Main routing

components/                 # Screens, navigation, and reusable UI
lib/                        # Supabase client, prediction logic, translations,
                            # taxonomies, language context, and daily insights
supabase/functions/
├── analyze-symptoms/       # Multi-turn AI symptom conversation
├── weekly-insights/        # AI-generated weekly pattern summary
├── places-autocomplete/    # Server-side Google Places proxy
└── delete-account/         # Secure account deletion

Cycle prediction

Predictions use the user's average cycle length and most recently logged period start date:

next_period    = last_period_start + average_cycle_length
ovulation      = next_period - 14 days
fertile_window = ovulation - 5 days through ovulation + 1 day

These calculations provide estimates only; real cycles can vary.

Core database tables

profiles — User settings, cycle averages, onboarding state, tracking goal, health conditions, and notification preferences

cycle_entries — Daily flow intensity logs

symptom_entries — Mood, energy, sleep, physical, and digestion tags by date

symptom_analyses — Saved AI symptom-chat transcripts

weekly_insights — Cached AI-generated pattern summaries

medications — Medication name, dosage, frequency, and reminder times

appointments — Category, clinician, location, date, notes, and reminders

partner_links — Opt-in partner-sharing connections

All user-data tables are protected with Supabase Row Level Security policies.

🔐 Privacy & Security

Gemini and Google Places keys are stored in Supabase Edge Function secrets and are never shipped in the client bundle.

AI and Places Edge Functions require an authenticated user.

Partner Mode exposes only an intentionally limited cycle summary.

The Google Places key is restricted to the required API, with a billing budget alert configured.

Account deletion requires password re-authentication and uses a service-role Edge Function; the client never receives service-role privileges.

Account deletion requires a double confirmation to reduce accidental data loss.

🚀 Getting Started

Prerequisites

Node.js and npm

Expo Go or an iOS/Android simulator

A Supabase project

Installation

git clone https://github.com/edntrk/Cycle_tracker.git
cd Cycle_tracker
npm install

Create a .env file in the project root:

EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

Add the following secrets to the Supabase project rather than to the client .env file:

GEMINI_API_KEY
GOOGLE_PLACES_API_KEY
SUPABASE_SERVICE_ROLE_KEY

Start the development server:

npx expo start

Never commit .env files or service-role credentials. Supabase anon credentials are designed for client use, but all data access must still be protected by correctly tested Row Level Security policies.

📌 Project Status

Aya is under active development. Current work focuses on improving prediction transparency, user safety, accessibility, and the privacy of health data.

📄 License

This project is licensed under the MIT License.

👩‍💻 Author

Created by Elif Deniz Türkmen.
