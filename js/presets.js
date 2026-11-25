/* RUET constants + routine presets.
   Routine preset transcribed from "Class Routine: 2024 Series, Dept. of EEE, RUET — effective 14/11/2026".
   Day keys: sat sun mon tue wed. Each entry: [period, span, courseCode, teacher, room, note?] */
window.RUET = {
  days: [
    { key: 'sat', name: 'Saturday', short: 'Sat', js: 6 },
    { key: 'sun', name: 'Sunday', short: 'Sun', js: 0 },
    { key: 'mon', name: 'Monday', short: 'Mon', js: 1 },
    { key: 'tue', name: 'Tuesday', short: 'Tue', js: 2 },
    { key: 'wed', name: 'Wednesday', short: 'Wed', js: 3 },
  ],
  periods: [
    { n: 1, start: '08:00', end: '08:50' },
    { n: 2, start: '08:50', end: '09:40' },
    { n: 3, start: '09:40', end: '10:30' },
    { n: 4, start: '10:50', end: '11:40' },
    { n: 5, start: '11:40', end: '12:30' },
    { n: 6, start: '12:30', end: '13:20' },
    { n: 7, start: '14:30', end: '15:20' },
    { n: 8, start: '15:20', end: '16:10' },
    { n: 9, start: '16:10', end: '17:00' },
  ],
  // Breaks shown between periods in the grid
  breaks: { 3: 'Break 10:30–10:50', 6: 'Lunch 1:20–2:30' },
  // Syllabus §14.2 — attendance → marks (out of 10)
  attendanceMarks: [
    { min: 90, marks: 10 }, { min: 85, marks: 9 }, { min: 80, marks: 8 }, { min: 75, marks: 7 },
    { min: 70, marks: 6 }, { min: 65, marks: 5 }, { min: 60, marks: 4 }, { min: 0, marks: 0 },
  ],
  teachers: {
    RIS: 'Md. Rafiqul Islam Sheikh', ABM: 'Md. Abdul Malek', MSR: 'Md. Sohel Rana', SHR: 'Sunjidah Hossain',
    AK: 'Abdul Khaleque', TSJ: 'Tasnim Sarker Joyeeta', SH: 'Md. Samiul Habib', SAH: 'Sakib Hossen',
    GKM: 'G.K.M. Hasanuzzaman', MRA: 'Md. Roisul Ajom Ruku', KT: 'Kusum Tara', RI: 'Md. Rakibul Islam',
    KNS: 'Kamrun Nahar Shushama', MI: 'Mominul Islam', RAR: 'Md. Ruhul Amin Ratul', MZH: 'Md. Zakir Hossain',
  },
  // From OpenStreetMap: EEE dept = Academic Building-02, CSE = Academic Building-01.
  // Fine-tune in Settings (stand inside the building and tap "I'm inside now", or drag the pin).
  campus: { lat: 24.3645, lng: 88.6292 },
  fences: [
    { id: 'eee', name: 'EEE Building', lat: 24.36494, lng: 88.62993, r: 30 },
    { id: 'cse', name: 'CSE Building', lat: 24.36443, lng: 88.62988, r: 30 },
  ],
};

window.ROUTINE_PRESETS = {
  '2024-2-2': {
    label: '2024 Series · 2-2 (effective 14 Nov 2026)',
    level: '2-2',
    sections: {
      A: {
        sat: [[1, 1, 'EEE 2201', 'SH/GKM', 'ETE 304'], [2, 1, 'EEE 2207', 'RIS/RAR', 'ETE 304'], [3, 1, 'EEE 2211', 'AK', 'ETE 304'], [7, 3, 'EEE 2208', 'KNS', 'Machine (East)']],
        sun: [[1, 1, 'EEE 2207', 'RIS/RAR', 'ETE 304'], [2, 1, 'EEE 2213', 'SHR', 'ETE 304'], [3, 1, 'EEE 2211', 'AK', 'ETE 304'], [7, 3, 'EEE 2212', 'MSR', 'Measurement Lab']],
        mon: [[1, 3, 'EEE 2214', 'SHR', 'Computer Lab 2'], [7, 1, 'Math 2201', 'MI', 'R-110'], [8, 1, 'EEE 2211', 'AK', 'R-110'], [9, 1, 'EEE 2213', 'SHR', 'R-110']],
        tue: [[4, 3, 'EEE 2214', 'SHR', 'Computer Lab 2'], [7, 1, 'EEE 2213', 'SHR', 'R-401'], [8, 1, 'Math 2201', 'MZH', 'R-401'], [9, 1, 'EEE 2201', 'SH/GKM', 'R-401']],
        wed: [[1, 3, 'EEE 2212', 'MSR', 'Measurement Lab'], [4, 3, 'EEE 2208', 'KNS', "24' A"], [7, 1, 'EEE 2201', 'SH/GKM', 'R-110'], [8, 1, 'Math 2201', 'MZH', 'R-110'], [9, 1, 'EEE 2207', 'RIS/RAR', 'R-110']],
      },
      B: {
        sat: [[1, 3, 'EEE 2208', 'TSJ', 'Machine (East)'], [4, 1, 'EEE 2207', 'RAR', 'ETE 304'], [5, 1, 'EEE 2201', 'GKM', 'ETE 304'], [6, 1, 'EEE 2211', 'AK/KT', 'ETE 304'], [7, 3, 'EEE 2212', 'ABM', 'Measurement Lab']],
        sun: [[4, 3, 'EEE 2208', 'TSJ', 'Machine (East)'], [7, 1, 'EEE 2207', 'RAR', 'R-406'], [8, 1, 'EEE 2201', 'GKM', 'R-406'], [9, 1, 'EEE 2213', 'RI', 'R-406']],
        mon: [[1, 3, 'EEE 2212', 'ABM', 'Measurement Lab'], [4, 3, 'EEE 2214', 'RI', 'Computer Lab 2'], [7, 1, 'EEE 2213', 'RI', 'R-111'], [8, 1, 'Math 2201', 'MI', 'R-111'], [9, 1, 'EEE 2211', 'AK/KT', 'R-111']],
        tue: [[7, 1, 'Math 2201', 'MZH', 'R-406'], [8, 1, 'EEE 2201', 'GKM', 'R-406'], [9, 1, 'EEE 2207', 'RAR', 'R-406']],
        wed: [[4, 3, 'EEE 2214', 'RI', 'Computer Lab 1'], [7, 1, 'Math 2201', 'MZH', 'R-111'], [8, 1, 'EEE 2213', 'RI', 'R-111'], [9, 1, 'EEE 2211', 'AK/KT', 'R-111']],
      },
      C: {
        sat: [[1, 3, 'EEE 2212', 'SAH', 'Measurement Lab'], [7, 1, 'EEE 2211', 'KT', 'R-401'], [8, 1, 'EEE 2207', 'RIS', 'R-401'], [9, 1, 'EEE 2213', 'SHR/RI', 'R-401']],
        sun: [[4, 1, 'EEE 2201', 'SH', 'R-401'], [5, 1, 'EEE 2207', 'RIS', 'R-406'], [6, 1, 'EEE 2213', 'SHR/RI', 'R-406']],
        mon: [[4, 3, 'EEE 2214', 'MRA', 'IOT Lab', 'Other half: EEE 2208 · RIS · Machine (West)'], [7, 1, 'EEE 2207', 'RIS', 'R-301'], [8, 1, 'EEE 2213', 'SHR/RI', 'R-301'], [9, 1, 'Math 2201', 'MI', 'R-301']],
        tue: [[1, 1, 'Math 2201', 'MZH', 'ETE 304'], [2, 1, 'EEE 2211', 'KT', 'ETE 304'], [3, 1, 'EEE 2201', 'SH', 'ETE 304'], [4, 3, 'EEE 2208', 'RIS', 'Machine (West)']],
        wed: [[1, 3, 'EEE 2214', 'MRA', 'IOT Lab'], [4, 1, 'EEE 2201', 'SH', 'R-401'], [5, 1, 'Math 2201', 'MZH', 'R-401'], [6, 1, 'EEE 2211', 'KT', 'R-401'], [7, 3, 'EEE 2212', 'SAH', 'Measurement Lab']],
      },
    },
  },
};
