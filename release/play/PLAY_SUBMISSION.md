# Health Tracker — Google Play submission checklist

Developer account: **K9 / HemantKumar** (hemantkumar0601@gmail.com, ID 8319346030773739885).
**Blocked until** Google approves the identity document uploaded on 17 Nov 2026 and the
contact phone is verified.

## Ready
| Item | Where |
|---|---|
| Signed AAB, v1.3.0 (versionCode 4), package `com.healthtracker.app`, API 36 | `release/play/HealthTracker-1.3.0-play.aab` |
| Upload key | `~/keys/healthtracker-upload.jks` + `.properties` (owner-only) |
| Upload certificate | `~/keys/healthtracker-upload-cert.pem` (SHA-256 54:2F:5F:B6:…:08:A5) |
| Listing, graphics | `PLAY_LISTING.md`, `graphics/` |
| App content answers | `DATA_SAFETY.md` |
| Privacy policy page | `docs/privacy-policy.html` |
| In-app disclaimer + privacy link | Settings → Privacy & disclaimer |

**Back up** `~/keys/healthtracker-upload.jks` and `~/keys/healthtracker-upload.properties`
to a password manager or encrypted drive.

## Before uploading
1. ✅ **Done 17 Nov 2026** — privacy policy live at https://hemant0601.github.io/health_tracker/privacy-policy.html. (How it was set up: GitHub → Hemant0601/health_tracker → Settings → Pages →
   Source: *Deploy from a branch* → branch `play-store-prep` (or `main` after merging),
   folder `/docs` → Save. Check
   https://hemant0601.github.io/health_tracker/privacy-policy.html opens.)
2. **Package name:** `com.healthtracker.app` is not listed on Play today, but it is a generic
   name. If Play Console says it's already in use when you create the app, change
   `android.package` in `app.json` to `com.hemant.healthtracker`, then rebuild (below).
3. **App signing:** keep Google's generated app-signing key (default). The old sideload APKs
   were signed with Expo's public debug key, which must not be used for Play. People who
   sideloaded the app must **Export CSV → uninstall → install from Play → Import CSV** to
   keep their readings.

## In Play Console (after the account is reinstated)
1. **Create app** → `Health Tracker: Family Vitals`, English, App, Free.
2. **App integrity → App signing:** Google-generated key.
3. **App content:** fill every section from `DATA_SAFETY.md`.
4. **Main store listing:** paste from `PLAY_LISTING.md`, upload `graphics/`.
5. **Testing → Internal testing:** upload the AAB, add your Gmail as tester, install on
   your phone, check reminders still fire after a restart.
6. **Production → Create release** → same AAB → Send for review.

## Rebuilding
```
npx expo prebuild -p android --no-install
cd android && ANDROID_HOME=/opt/homebrew/share/android-commandlinetools ./gradlew bundleRelease -PhealthTracker.playRelease=true
```
Bump `version` and `android.versionCode` in `app.json` first. Without
`-PhealthTracker.playRelease=true` builds use the default (debug) signing for sideloading.
