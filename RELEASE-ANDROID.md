# Insightly — Android release (signed AAB + installable APK)

The Lovable sandbox has no JDK, Android SDK, keystore, or physical device, so the bundle
cannot be produced or device-tested here. Everything needed to produce it elsewhere is in
this repo. Two supported paths:

## 1. GitHub Actions (recommended, no local setup)

1. Create a keystore once on any machine with a JDK:

   ```bash
   keytool -genkey -v -keystore insightly.jks -keyalg RSA -keysize 2048 \
     -validity 10000 -alias insightly
   ```

   Keep `insightly.jks` and its passwords safe — Play Store updates require the same key.

2. Add repository secrets (Settings → Secrets and variables → Actions):

   | Secret | Value |
   | --- | --- |
   | `ANDROID_KEYSTORE_BASE64` | `base64 -w0 insightly.jks` output |
   | `ANDROID_KEYSTORE_PASSWORD` | store password |
   | `ANDROID_KEY_ALIAS` | `insightly` |
   | `ANDROID_KEY_PASSWORD` | key password |

3. Run the **Android Release (AAB + APK)** workflow (Actions tab → Run workflow), set the
   version name/code. Download the `insightly-android` artifact: it contains
   `app-release.aab` (Play Console upload) and `app-release.apk` (sideload install).

## 2. Local build

Requires JDK 21 and Android SDK (Android Studio).

```bash
bun install
bun run build            # web assets -> dist
npx cap add android      # only if android/app/src is missing
npx cap sync android

cat > key.properties <<'EOF'
storeFile=/absolute/path/insightly.jks
storePassword=...
keyAlias=insightly
keyPassword=...
EOF

cd android
./gradlew bundleRelease assembleRelease
```

Outputs:

- `android/app/build/outputs/bundle/release/app-release.aab`
- `android/app/build/outputs/apk/release/app-release.apk`

## 3. Verify on a real device

```bash
adb install -r android/app/build/outputs/apk/release/app-release.apk
adb logcat | grep -i -E "insightly|capacitor|chromium"
```

Smoke checklist on device: splash + onboarding, Google sign-in redirect back into the app,
Iris chat (streaming, voice, image upload), Notes create/edit/delete, Dashboard/streaks,
M-Pesa payment initiation, offline banner with airplane mode on.

To validate the AAB exactly as Play will deliver it, use bundletool:

```bash
bundletool build-apks --bundle=app-release.aab --output=insightly.apks \
  --ks=insightly.jks --ks-key-alias=insightly --mode=universal
bundletool install-apks --apks=insightly.apks
```

## Notes

- `applicationId` is `com.insightly.app`; bump `versionCode` on every Play upload.
- `android/app/build.gradle` already reads signing config from `key.properties` or the
  `android.injected.signing.*` Gradle properties used by the workflow.
