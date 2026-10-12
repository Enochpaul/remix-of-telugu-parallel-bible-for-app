# Build APK / AAB

Needs: Node 20+, Android Studio (JDK 17 + Android SDK). Windows: use `gradlew.bat` if `./gradlew` fails.

```sh
npm install
npm run android:init     # first time only
npm run apk              # debug APK  -> android/app/build/outputs/apk/debug/app-debug.apk
npm run aab              # release AAB -> android/app/build/outputs/bundle/release/app-release.aab
```

After any app change: just re-run `npm run apk` or `npm run aab`.

Signing for Play Store: Android Studio → Build → Generate Signed Bundle / APK (or add a signingConfig in android/app/build.gradle).
