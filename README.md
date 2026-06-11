# Health Tracker

A React Native (Expo) app to track health vitals for your whole family. Add members, log readings like blood pressure and blood sugar, and watch trends over time — all stored privately on your device.

## Features

- **Family members** — add the people you care for with relation, gender, date of birth, height, and an avatar color. Edit or remove them anytime.
- **6 vitals** — Blood Pressure (systolic/diastolic + pulse), Blood Sugar (fasting / post-meal / random), Heart Rate, SpO₂, Weight, and Body Temperature.
- **Smart status** — every reading is classified against standard medical reference ranges (e.g. AHA blood-pressure stages, ADA glucose ranges) and color-coded: Low / Normal / Elevated / High / Critical.
- **Live preview** — see the status of a reading as you type, before saving.
- **Trends** — per-vital history with an SVG trend chart (dual-line for BP), average / lowest / highest stats, and BMI (when height is set).
- **Home dashboard** — greeting, weekly reading count, out-of-range alerts, and recent activity across all members.
- **Offline-first** — everything is stored locally with AsyncStorage. No account, no server, no data leaves the phone.

## Tech Stack

| Layer | Choice |
| --- | --- |
| Framework | Expo SDK 56 · React Native 0.85 · React 19 · TypeScript (strict) |
| Navigation | React Navigation 7 (bottom tabs + native stack) |
| Storage | `@react-native-async-storage/async-storage` |
| Charts | Custom chart built on `react-native-svg` |
| Icons | `@expo/vector-icons` (Ionicons + MaterialCommunityIcons) |

## Project Structure

```
src/
  components/   Reusable UI (cards, chips, badges, trend chart, …)
  constants/    Vital definitions, reference ranges, profile options
  context/      AppContext — members + readings state, persistence
  navigation/   Root stack + bottom tabs, typed param lists
  screens/      Home, Members, MemberDetail, MemberForm, LogReading, VitalHistory
  storage/      AsyncStorage data layer
  theme/        Colors, spacing, radii, shadows
  types/        Member / Reading models
  utils/        Health-status evaluation, date helpers
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

### Build an installable app

```bash
npm install -g eas-cli
eas build --platform android   # produces an APK/AAB
eas build --platform ios
```

## Health Reference Ranges

| Vital | Normal | Flagged |
| --- | --- | --- |
| Blood Pressure | < 120/80 mmHg | Elevated 120–129 · High S1 130–139/80–89 · High S2 ≥ 140/90 · Crisis ≥ 180/120 |
| Blood Sugar (fasting) | 70–99 mg/dL | Prediabetic 100–125 · Diabetic ≥ 126 · Low < 70 |
| Blood Sugar (post-meal) | < 140 mg/dL | Prediabetic 140–199 · Diabetic ≥ 200 |
| Heart Rate | 60–100 bpm | Low < 60 · Elevated 101–120 · High > 120 |
| SpO₂ | 95–100% | Low 90–94 · Critical < 90 |
| Temperature | 36.1–37.2 °C | Mild fever ≥ 37.3 · Fever ≥ 38 · Critical ≥ 40 |
| Weight | — | Trend + BMI when height is set |

> **Disclaimer:** This app is for personal tracking only and is not a medical device. The status labels are informational and not a diagnosis — always consult a doctor for medical advice.
