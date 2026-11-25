# classkoytay

An app for RUET students: your class routine, attendance marks, class tests (CTs) and syllabus in one place. It's an installable web app (PWA) with no build step, and all your data stays on your phone.

## What it does
- **Every semester (1-1 to 4-2)**: tap the semester name at the top to switch between semesters or start a new one (level, section, routine, running week). Each semester keeps its own routine, attendance and CTs, and old ones stay saved. The course picker shows that semester's syllabus courses, the 4th-year electives, and every other course for retakes. When week 14 ends, Today offers to start the next semester.
- **Share a routine**: in Routine → Edit routine, tap **Share with section** to send a link. A classmate who opens it gets the whole routine imported in one tap, so only one person in the section has to type it in each semester.
- **Routine**: a Sat–Wed grid with periods 1–9 (8:00 AM – 5:00 PM). You fill the boxes yourself each semester. A lab takes 3 periods. You can also import the 2024-series 2-2 routine for Section A, B or C, which matches the PDF effective 14 Nov 2026.
- **Week control**: you set which week is running and the Saturday it starts, and you can change it any time from the week chip.
- **Attendance**: mark each class Present, Absent or Off (not held), or mark a whole day as a holiday. Marks follow syllabus §14.2 (90% or more → 10, 85% → 9 … below 60% → 0) and are counted over the full 14 weeks. Each course also has a "what-if" table and a week-by-week history. The top strip shows how many classes you've missed in each course.
- **CTs**: choose a course and a week, then the exact routine slot, plus the syllabus topics. You get a reminder the day before and a 7 AM reminder on the day. The CT mark (out of 20) uses your best 3 of 4 scores.
- **Syllabus**: every course from the RUET EEE 2024 syllabus, with search, grouped by semester, plus electives and the marks breakdown.
- **Auto attendance by location**: during class time, if you enter the EEE (Academic Bldg-02) or CSE (Academic Bldg-01) building, the class is marked present. If tracking ran for the whole class and you never went in, it is marked absent. Being elsewhere on campus doesn't count. A manual mark always overrides an automatic one.
- **Reminders**: a summary of tomorrow's classes, labs and CTs at a time you choose, a reminder N minutes before each class, and an `.ics` calendar export with alarms built in.

## Run locally
```
python -m http.server 3020 --directory .
```
Then open http://localhost:3020

## Put it on your phone
Location, notifications and installing the app all need **HTTPS**. You can host this folder free on GitHub Pages, Netlify Drop or Cloudflare Pages. Then open the link in Chrome on Android, choose ⋮ → **Add to Home screen**, and allow Location and Notifications.

## Limits (web app)
- Location tracking only runs **while the app is open** (it keeps the screen awake during tracking). When the app is closed, nothing gets auto-marked. Tick those classes by hand.
- Notifications are reliable while the app is open, and when it's installed on Android (Chrome's periodic background sync). For alarms you can always count on, use **Settings → Add semester to phone calendar (.ics)**.
- The building positions come from OpenStreetMap. To make them exact, stand inside each building once and tap **"I'm inside now"**.
