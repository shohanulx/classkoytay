# classkoytay

An app for RUET students: your class routine, attendance marks, class tests (CTs) and syllabus in one place. It runs as an **Android app** and as a website, and you can sign in with Google so your data is backed up.

**Get the Android app:** open [Releases](https://github.com/shohanulx/classkoytay/releases/latest) on your phone, download `classkoytay.apk` and open it. If Android asks, allow "Install unknown apps". **Web version:** https://shohanulx.github.io/classkoytay/

## What it does
- **Every semester (1-1 to 4-2)**: tap the semester name at the top to switch between semesters or start a new one (level, section, routine, running week). Each semester keeps its own routine, attendance and CTs, and old ones stay saved. The course picker shows that semester's syllabus courses, the 4th-year electives, and every other course for retakes. When week 14 ends, Today offers to start the next semester.
- **Share a routine**: in Routine → Edit routine, tap **Share with section** to send a link. A classmate who opens it gets the whole routine imported in one tap, so only one person in the section has to type it in each semester.
- **Routine**: a Sat–Wed grid with periods 1–9 (8:00 AM – 5:00 PM). You fill the boxes yourself each semester. A lab takes 3 periods. You can also import the 2024-series 2-2 routine for Section A, B or C, which matches the PDF effective 14 Nov 2026.
- **Week control**: you set which week is running and the Saturday it starts, and you can change it any time from the week chip.
- **Attendance**: mark each class Present, Absent or Off (not held), or mark a whole day as a holiday. Marks follow syllabus §14.2 (90% or more → 10, 85% → 9 … below 60% → 0) and are counted over the full 14 weeks. Each course also has a "what-if" table and a week-by-week history. The top strip shows how many classes you've missed in each course.
- **CTs**: choose a course and a week, then the exact routine slot, plus the syllabus topics. You get a reminder the day before and a 7 AM reminder on the day. The CT mark (out of 20) uses your best 3 of 4 scores.
- **Syllabus**: every course from the RUET EEE 2024 syllabus, with search, grouped by semester, plus electives and the marks breakdown.
- **Auto attendance by location**: during class time, if you enter the EEE (Academic Bldg-02) or CSE (Academic Bldg-01) building, the class is marked present. If tracking ran for the whole class and you never went in, it is marked absent. Being elsewhere on campus doesn't count. A manual mark always overrides an automatic one.
- **Google login + backup**: sign in from Settings, or with "Continue with Google" on the first screen. Your routine, attendance and CTs are saved to your Google account through Firebase, and each account can only read its own data. On a new phone, sign in and everything comes back. Your location is never uploaded.
- **Reminders**: a summary of tomorrow's classes, labs and CTs at a time you choose, a reminder N minutes before each class, and an `.ics` calendar export with alarms built in.

## Android app
- **Background attendance:** Android's own geofencing wakes the app when you enter or leave the EEE or CSE building, even when the app is closed or after a restart. Next time you open the app, it turns those events into present/absent marks. Set Location to **"Allow all the time"** when asked.
- **Reminders:** scheduled on the phone for the next 10 days and refreshed each time you open the app. They ring even when the app is closed.
- **Builds:** every push to `main` builds a signed APK with GitHub Actions (`.github/workflows/android.yml`) and publishes it as a Release. Signing uses the repo secrets `KEYSTORE_BASE64` and `KEYSTORE_PASSWORD`. The keystore itself is never committed. Keep the backup in `classkoytay-keys`, because every update must be signed with the same key.

## Develop
```
corepack pnpm install
node scripts/build-web.mjs                          # bundles src/bridge.js -> js/bridge.js, copies the web app to dist/
node node_modules/@capacitor/cli/bin/capacitor sync android
python -m http.server 3020                          # web version at http://localhost:3020
```

## Limits (web version)
- In the browser, location tracking only runs **while the page is open**. The Android app tracks in the background.
- Browser notifications only show while the page is open or installed. The Android app's reminders always ring.
- The building positions come from OpenStreetMap. To make them exact, stand inside each building once and tap **"I'm inside now"**.
