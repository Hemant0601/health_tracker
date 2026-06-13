# Health Tracker

A React Native (Expo) app to track health vitals for your whole family. Add members, log readings like blood pressure and blood sugar, and watch trends over time — all stored privately on your device.

## Features

- **Family members** — add the people you care for with relation, gender, date of birth, height, and an avatar color. Edit or remove them anytime.
- **6 vitals** — Blood Pressure (systolic/diastolic + pulse), Blood Sugar (fasting / post-meal / random), Heart Rate, SpO₂, Weight, and Body Temperature.
- **Smart status** — every reading is classified against standard medical reference ranges (ESC/ESH blood-pressure grades, ADA glucose ranges) and color-coded: Low / Normal / Elevated / High / Critical.
- **Live preview** — see the status of a reading as you type, before saving.
- **Trends** — per-vital history with an SVG trend chart (dual-line for BP), average / lowest / highest stats (computed per component for BP), and BMI (when height is set).
- **Edit & delete** — tap any reading in a vital's history to correct it, or delete it.
- **Daily reminders** — schedule per-member, per-vital local notifications (e.g. "BP check for Dad, daily at 8:00 AM"). Works offline, no push server.
- **CSV export & import** — share one member's history, or all members in a single file (patient details + every reading). The same file can be imported on another phone, merging members and skipping duplicates — so families can pool readings or hand data to a doctor.
- **Home dashboard** — greeting, weekly reading count, out-of-range alerts, and recent activity across all members.
- **Offline-first** — everything is stored locally with AsyncStorage. No account, no server, no data leaves the phone.

## Tech Stack

| Layer | Choice |
| --- | --- |
| Framework | Expo SDK 56 · React Native 0.85 · React 19 · TypeScript (strict) |
| Navigation | React Navigation 7 (bottom tabs + native stack) |
| Storage | `@react-native-async-storage/async-storage` |
| Charts | Custom chart built on `react-native-svg` |
| Reminders | `expo-notifications` (local scheduled notifications) |
| Export / Import | `expo-file-system` · `expo-sharing` · `expo-document-picker` |
| Icons | `@expo/vector-icons` (Ionicons + MaterialCommunityIcons) |

## Project Structure

```
src/
  components/   Reusable UI (cards, chips, badges, trend chart, …)
  constants/    Vital definitions, reference ranges, profile options
  context/      AppContext — members + readings + import, persistence
  hooks/        useDataTransfer — CSV export & import flow
  navigation/   Root stack + bottom tabs, typed param lists
  screens/      Home, Members, MemberDetail, MemberForm, LogReading,
                VitalHistory, Reminders
  storage/      AsyncStorage data layer
  theme/        Colors, spacing, radii, shadows
  types/        Member / Reading / Reminder models
  utils/        Health-status evaluation, dates, CSV export/import, notifications
scripts/
  make-icons.js Regenerates the app icon set (no image deps)
```

## Getting Started

```bash
npm install
npx expo start
```

Then either:

- **Phone** — install [Expo Go](https://expo.dev/go) (Android/iOS) and scan the QR code from the terminal.
- **Emulator** — press `a` for Android emulator or `i` for iOS simulator.

### Build an installable APK

**Option A — locally** (needs JDK 17 and the Android SDK; no account required):

```bash
npx expo prebuild --platform android
cd android && ./gradlew :app:assembleRelease
# → android/app/build/outputs/apk/release/app-release.apk
```

Note: the React Native Gradle plugin compiles with a JDK 17 toolchain — have JDK 17 installed even if your default JDK is newer.

**Option B — EAS cloud build** (free Expo account, no local Android SDK):

```bash
npm install -g eas-cli
eas login
eas build --platform android --profile preview   # produces an APK
```

The `preview` profile in `eas.json` is configured to output an APK (the default `production` profile builds an AAB for Play Store submission).

## Health Reference Ranges

| Vital | Normal | Flagged |
| --- | --- | --- |
| Blood Pressure | up to 129/84 mmHg (Optimal < 120/80) | High–normal 130–139/85–89 · High Grade 1 ≥ 140/90 · Grade 2 ≥ 160/100 · Crisis ≥ 180/120 · Low < 90/60 |
| Blood Sugar (fasting) | 70–99 mg/dL | Prediabetic 100–125 · Diabetic ≥ 126 · Low < 70 |
| Blood Sugar (post-meal) | < 140 mg/dL | Prediabetic 140–199 · Diabetic ≥ 200 |
| Heart Rate | 60–100 bpm | Low < 60 · Elevated 101–120 · High > 120 |
| SpO₂ | 95–100% | Low 90–94 · Critical < 90 |
| Temperature | 36.1–37.2 °C | Mild fever ≥ 37.3 · Fever ≥ 38 · Critical ≥ 40 |
| Weight | — | Trend + BMI when height is set |

> **Disclaimer:** This app is for personal tracking only and is not a medical device. The status labels are informational and not a diagnosis — always consult a doctor for medical advice.
