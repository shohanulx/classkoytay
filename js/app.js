/* classkoytay — RUET class routine · attendance · CT · syllabus
   Everything is stored on-device (localStorage). No account, no server. */
(() => {
  'use strict';
  const SY = window.SYLLABUS, R = window.RUET, PRESETS = window.ROUTINE_PRESETS;
  const KEY = 'classkoytay.v1';
  const DAY_MS = 864e5;
  const LEVELS = ['1-1', '1-2', '2-1', '2-2', '3-1', '3-2', '4-1', '4-2'];
  const PALETTE = ['#4f6ef7', '#0f9f8f', '#d9546e', '#c98a12', '#2f8fd1', '#8a63d8', '#e0743a', '#2f9e6a', '#c94a4a', '#1aa3b8', '#b157c9', '#7a9a26'];
  const FAC = window.FACULTY || [];
  const DESIGS = ['Professor', 'Associate Professor', 'Assistant Professor', 'Lecturer'];
  const DEPT = 'Department of Electrical & Electronic Engineering', UNI = 'Rajshahi University of Engineering & Technology';

  /* ---------------- icons (stroke, 24px grid) ---------------- */
  const ICONS = {
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    pin: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6.5 6.5 0 0 1 3.5 6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    alert: '<path d="M12 3 2 20h20L12 3Z"/><path d="M12 10v4M12 17.5v.01"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7.5v.01"/>',
    cap: '<path d="m2 9 10-5 10 5-10 5L2 9Z"/><path d="M6 11v5c3 2.5 9 2.5 12 0v-5M22 9v5"/>',
    cloud: '<path d="M7 18a5 5 0 1 1 .9-9.9A6 6 0 0 1 19 10a4 4 0 0 1-1 8H7Z"/>',
    book: '<path d="M4 19.5V5a2 2 0 0 1 2-2h13v16H6.5A2.5 2.5 0 0 0 4 21.5v-2Z"/><path d="M19 17v4H6.5"/>',
    file: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9Z"/><path d="M14 3v6h6M8 13h8M8 17h5"/>',
    cover: '<rect x="4" y="2.5" width="16" height="19" rx="2"/><circle cx="12" cy="8" r="2.5"/><path d="M8 13.5h8M8 16.5h8M8 19h5"/>',
    calendar: '<rect x="3" y="4" width="18" height="17" rx="3"/><path d="M3 9h18M8 2v4M16 2v4"/>',
    share: '<path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7M16 6l-4-4-4 4M12 2v13"/>',
    download: '<path d="M12 3v12M7 10l5 5 5-5M4 21h16"/>',
    upload: '<path d="M12 21V9M7 14l5-5 5 5M4 3h16"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
    locate: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/><circle cx="12" cy="12" r="7"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16v4Z"/><path d="m13.5 6.5 4 4"/>',
    coffee: '<path d="M17 8h1a4 4 0 0 1 0 8h-1M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8Z"/><path d="M6 2v2M10 2v2M14 2v2"/>',
    flask: '<path d="M9 3h6M10 3v6L4.5 18.5A2 2 0 0 0 6.2 21.5h11.6a2 2 0 0 0 1.7-3L14 9V3"/><path d="M7 15h10"/>',
    layers: '<path d="m12 2 10 5-10 5L2 7l10-5Z"/><path d="m2 12 10 5 10-5M2 17l10 5 10-5"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
    chev: '<path d="m9 18 6-6-6-6"/>',
    back: '<path d="m15 18-6-6 6-6"/>',
    calc: '<rect x="5" y="2.5" width="14" height="19" rx="2"/><path d="M8 6.5h8M8 11h.01M12 11h.01M16 11h.01M8 14.5h.01M12 14.5h.01M16 14.5h.01M8 18h.01M12 18h4"/>',
    print: '<path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="7"/>',
    trash: '<path d="M3 6h18M8 6V4h8v2M6 6l1 15h10l1-15"/>',
  };
  const ic = (n, cls = 'i') => `<svg viewBox="0 0 24 24" class="${cls}">${ICONS[n] || ''}</svg>`;
  const LOGO = '<svg viewBox="0 0 64 64"><defs><linearGradient id="ckg2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3554e0"/><stop offset="1" stop-color="#1a2a86"/></linearGradient></defs><rect width="64" height="64" rx="16" fill="url(#ckg2)"/><path d="M38.16 15.09A18 18 0 1 1 25.84 15.09" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"/><path d="M24 32.5l5.5 5.5L40.5 27" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="25.84" cy="15.09" r="3.3" fill="#35d0a5"/></svg>';

  /* ---------------- utils ---------------- */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const pad = (n) => String(n).padStart(2, '0');
  const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parseISO = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const mins = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  const atTime = (date, t) => { const d = startOfDay(date); d.setMinutes(mins(t)); return d; };
  const fmt12 = (t) => { let [h, m] = t.split(':').map(Number); const ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12; return `${h}:${pad(m)} ${ap}`; };
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const fmtD = (d) => `${WD[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`;
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = () => Math.random().toString(36).slice(2, 9);
  const dayIdx = (key) => R.days.findIndex((d) => d.key === key);
  const dayKeyOfDate = (d) => (R.days.find((x) => x.js === d.getDay()) || {}).key || null;
  const saturdayOf = (d) => addDays(startOfDay(d), -((d.getDay() + 1) % 7));
  const now = () => new Date(window.__ckNow || Date.now());

  /* ---------------- state ---------------- */
  const defaults = () => ({
    v: 1,
    onboarded: false,
    active: null,
    semesters: {},
    settings: {
      notify: false, digestTime: '20:00', beforeMin: 10, ctMorning: true,
      tracking: false, unmarkedAs: 'present', theme: 'auto',
      fences: JSON.parse(JSON.stringify(R.fences)),
      customFaculty: [], facultyEdits: {},
    },
    profile: { name: '', roll: '', section: '', series: '' },
    covers: [],
    permAsked: false,
    notified: {},
    geoLog: [],
  });
  let state;
  try { state = Object.assign(defaults(), JSON.parse(localStorage.getItem(KEY) || 'null') || {}); } catch { state = defaults(); }
  function migrate() {
    state.settings = Object.assign(defaults().settings, state.settings);
    state.profile = Object.assign(defaults().profile, state.profile || {});
    if (!Array.isArray(state.covers)) state.covers = [];
    for (const s of Object.values(state.semesters || {})) { if (!Array.isArray(s.labtests)) s.labtests = []; if (!Array.isArray(s.cts)) s.cts = []; }
  }
  migrate();
  const save = () => {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { toast('Could not save — storage full?', '⚠'); }
    queueForServiceWorker(); scheduleCloud(); scheduleNativeAlerts();
  };
  const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* ignore */ } };
  const S = () => state.semesters[state.active];

  function newSemester({ level, label, section, startDate, weeks = 14 }) {
    const id = uid();
    state.semesters[id] = { id, level, label: label || `${level} Semester`, section: section || '', startDate, weeks, routine: { sat: [], sun: [], mon: [], tue: [], wed: [] }, records: {}, cts: [], labtests: [], offDays: [], custom: {} };
    state.active = id;
    return state.semesters[id];
  }
  function applyPreset(sem, presetKey, section) {
    const p = PRESETS[presetKey].sections[section];
    for (const d of R.days) {
      sem.routine[d.key] = (p[d.key] || []).map(([pn, span, code, teacher, room, note]) => ({ id: uid(), p: pn, span, code, teacher, room, note: note || '', kind: span > 1 ? 'lab' : 'class' }));
    }
    sem.section = section;
  }
  const presetsFor = (level) => Object.entries(PRESETS).filter(([, p]) => p.level === level);
  const nextLevel = (l) => LEVELS[Math.min(LEVELS.indexOf(l) + 1, LEVELS.length - 1)];
  const electivesFor = (level) => Object.entries(SY.electives).filter(([g]) => g.includes(`(${level})`));
  const semesterList = () => Object.values(state.semesters).sort((a, b) => LEVELS.indexOf(a.level) - LEVELS.indexOf(b.level) || a.startDate.localeCompare(b.startDate));

  /* Shareable routine: compact JSON → base64url, carried in the link's #import= hash */
  function encodeRoutine(sem) {
    const r = { v: 1, l: sem.level, s: sem.section || '', d: {} };
    for (const d of R.days) r.d[d.key] = sem.routine[d.key].map((x) => [x.p, x.span, x.code, x.teacher || '', x.room || '', x.note || '']);
    const cus = {}; for (const [k, v] of Object.entries(sem.custom || {})) cus[k] = [v.title, v.sessional ? 1 : 0];
    if (Object.keys(cus).length) r.c = cus;
    return btoa(unescape(encodeURIComponent(JSON.stringify(r)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function decodeRoutine(code) {
    try {
      const m = String(code).match(/import=([A-Za-z0-9_-]+)/); const raw = (m ? m[1] : String(code).trim()).replace(/-/g, '+').replace(/_/g, '/');
      const r = JSON.parse(decodeURIComponent(escape(atob(raw + '==='.slice((raw.length + 3) % 4)))));
      if (!r || !r.d || !LEVELS.includes(r.l)) return null;
      return r;
    } catch { return null; }
  }
  function applyShared(sem, r) {
    for (const d of R.days) sem.routine[d.key] = (r.d[d.key] || []).map(([p, span, code, teacher, room, note]) => ({ id: uid(), p, span, code, teacher, room, note, kind: span > 1 ? 'lab' : 'class' }));
    for (const [k, [title, ses]] of Object.entries(r.c || {})) if (!SY.courses[k]) sem.custom[k] = { code: k, title, topics: [], credits: '', contact: '', sessional: !!ses };
    if (r.s) sem.section = r.s;
  }
  const routineCount = (r) => Object.values(r.d || r.routine || {}).reduce((a, l) => a + l.length, 0);
  let pendingImport = null;

  /* ---------------- course helpers ---------------- */
  const courseInfo = (code, sem = S()) => SY.courses[code] || (sem && sem.custom[code]) || { code, title: code, topics: [], credits: '', contact: '', sessional: false };
  function semCourses(sem = S()) {
    if (!sem) return [];
    const list = [...(SY.plan[sem.level] || [])];
    for (const d of R.days) for (const s of sem.routine[d.key]) if (!list.includes(s.code)) list.push(s.code);
    for (const c of Object.keys(sem.custom || {})) if (!list.includes(c)) list.push(c);
    return list;
  }
  function scheduledCourses(sem = S()) {
    const set = []; for (const d of R.days) for (const s of sem.routine[d.key]) if (!set.includes(s.code)) set.push(s.code);
    const order = semCourses(sem); return set.sort((a, b) => order.indexOf(a) - order.indexOf(b));
  }
  const colorOf = (code, sem = S()) => { const i = semCourses(sem).indexOf(code); return PALETTE[(i < 0 ? [...code].reduce((a, c) => a + c.charCodeAt(0), 0) : i) % PALETTE.length]; };
  const shortTitle = (t) => t.replace(/Sessional$/, 'Lab').replace('Engineering Mathematics', 'Eng. Math').replace('Measurements and Instrumentation', 'Measurement & Instr.').replace('Circuits and Design', 'Circuits & Design');
  const slotStart = (s) => R.periods[s.p - 1].start;
  const slotEnd = (s) => R.periods[Math.min(9, s.p + s.span - 1) - 1].end;

  /* ---------------- faculty ---------------- */
  const normName = (n) => String(n || '').toLowerCase().replace(/\b(dr|mr|ms|mrs|prof|engr)\b\.?/g, ' ').replace(/[^a-z ]/g, ' ').split(/\s+/).filter((w) => w && !['md', 'mohammad', 'muhammad', 'mohammod'].includes(w));
  function facultyAll() {
    const edits = state.settings.facultyEdits || {};
    return [...FAC, ...(state.settings.customFaculty || []).map((f) => ({ ...f, custom: true }))].map((f) => (edits[f.name] ? { ...f, ...edits[f.name] } : f));
  }
  function findFaculty(name) {
    const t = normName(name); if (!t.length) return null;
    const all = facultyAll(), j = t.join(''), first = t[0], last = t[t.length - 1];
    return all.find((f) => normName(f.name).join('') === j)
      || all.find((f) => { const u = normName(f.name); return u.length > 1 && u[0] === first && u[u.length - 1] === last; })
      || all.find((f) => { const u = normName(f.name); return u.length > 1 && t.length > 1 && u[0] === first && u[u.length - 1].slice(0, 4) === last.slice(0, 4); }) || null;
  }
  function teacherFromInitials(ini) {
    const k = ini.trim(), custom = (state.settings.customFaculty || []).find((f) => f.ini && f.ini.toUpperCase() === k.toUpperCase());
    if (custom) return { ini: k, name: custom.name, fac: custom };
    const full = R.teachers[k] || R.teachers[k.toUpperCase()];
    const fac = findFaculty(full || k);
    return { ini: k, name: fac ? fac.name : full || k, fac };
  }
  const teachersOf = (txt) => String(txt || '').split(/[\/,&+]+/).map((x) => x.trim()).filter(Boolean).map(teacherFromInitials);
  const initialsOfName = (n) => { const t = normName(n); return ((t[0] || '?')[0] + (t.length > 1 ? t[t.length - 1][0] : '')).toUpperCase(); };
  const plainName = (n) => String(n || '').replace(/^(Mr|Ms|Mrs)\.\s*/, '');
  /** All teacher initials used for a course in the current semester's routine */
  function courseTeachers(code, sem = S()) {
    const seen = new Map();
    for (const d of R.days) for (const s of sem.routine[d.key]) if (s.code === code) for (const t of teachersOf(s.teacher)) if (!seen.has(t.name)) seen.set(t.name, t);
    return [...seen.values()];
  }

  /* ---------------- calendar / instances ---------------- */
  const semStart = (sem = S()) => parseISO(sem.startDate);
  function weekOf(date, sem = S()) { return Math.floor((startOfDay(date) - semStart(sem)) / (7 * DAY_MS)) + 1; }
  function dateFor(week, dayKey, sem = S()) { return addDays(semStart(sem), (week - 1) * 7 + dayIdx(dayKey)); }
  function instancesOn(date, sem = S()) {
    const key = dayKeyOfDate(date); if (!key || !sem) return [];
    const w = weekOf(date, sem); if (w < 1 || w > sem.weeks) return [];
    return sem.routine[key].slice().sort((a, b) => a.p - b.p).map((slot) => mkInst(sem, date, w, key, slot));
  }
  function mkInst(sem, date, week, day, slot) {
    const d = iso(date);
    return { key: `${d}|${slot.id}`, iso: d, date, week, day, slot, code: slot.code, start: atTime(date, slotStart(slot)), end: atTime(date, slotEnd(slot)) };
  }
  function allInstances(sem = S(), code = null) {
    const out = [];
    for (let w = 1; w <= sem.weeks; w++) for (const d of R.days) {
      const date = dateFor(w, d.key, sem);
      for (const slot of sem.routine[d.key]) if (!code || slot.code === code) out.push(mkInst(sem, date, w, d.key, slot));
    }
    return out.sort((a, b) => a.start - b.start);
  }
  function statusOf(inst, sem = S()) {
    if (sem.offDays.includes(inst.iso)) return 'OFF';
    const r = sem.records[inst.key]; return r ? r.s : null;
  }
  function setStatus(inst, s, src = 'manual', sem = S()) {
    if (!s) delete sem.records[inst.key];
    else sem.records[inst.key] = { s, src, t: Date.now() };
  }

  /* Attendance statistics — syllabus §14.2 */
  const marksFor = (pct) => (R.attendanceMarks.find((r) => pct >= r.min) || { marks: 0 }).marks;
  function maxAbsences(total, minPct) { let a = 0; while (a <= total && (total - a) * 100 >= minPct * total) a++; return a - 1; }
  function stats(code, sem = S(), t = now()) {
    const list = allInstances(sem, code);
    let P = 0, A = 0, U = 0, C = 0, total = 0, held = 0;
    for (const i of list) {
      const s = statusOf(i, sem);
      if (s === 'OFF' || s === 'C') { C++; continue; }
      total++;
      const past = i.end <= t;
      if (s === 'P') { P++; held++; } else if (s === 'A') { A++; held++; } else if (past) { U++; held++; }
    }
    const uas = state.settings.unmarkedAs;
    const Pe = P + (uas === 'present' ? U : 0), Ae = A + (uas === 'absent' ? U : 0);
    const counted = Pe + Ae;
    const pct = counted ? (Pe / counted) * 100 : 100;
    const finalBest = total ? ((total - Ae) / total) * 100 : 100;
    const allow90 = maxAbsences(total, 90);
    // Headline = whole-semester figure (what the syllabus marks are based on), assuming remaining classes are attended
    return { P, A, U, C, total, held, Pe, Ae, pct: finalBest, pctNow: pct, marks: marksFor(finalBest), finalBest, finalMarks: marksFor(finalBest), allow90, left90: allow90 - Ae, list, sessional: courseInfo(code, sem).sessional };
  }
  const toneFor = (m) => (m >= 10 ? 'var(--good)' : m >= 7 ? 'var(--warn)' : 'var(--bad)');

  /* ---------------- toasts, ripple, sheet ---------------- */
  function toast(msg, kind = '✓') {
    const bad = ['!', '⚠', '✕'].includes(kind), map = { '☁': 'cloud', '📍': 'pin', '📡': 'locate', '🔗': 'link', '🔔': 'bell', '📝': 'file', '🎓': 'cap', '★': 'check' };
    const el = document.createElement('div'); el.className = `toast ${bad ? 'bad' : kind === '✓' ? 'good' : ''}`;
    el.innerHTML = `<span class="ic">${ic(bad ? (kind === '✕' ? 'x' : 'alert') : map[kind] || 'check')}</span><span>${esc(msg)}</span>`;
    const box = $('#toasts'); while (box.children.length > 2) box.firstChild.remove();
    box.append(el); setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 350); }, 2600);
  }
  document.addEventListener('pointerdown', (e) => {
    const b = e.target.closest('.btn, .pa, .chip'); if (!b) return;
    const r = b.getBoundingClientRect(), s = Math.max(r.width, r.height);
    const sp = document.createElement('span'); sp.className = 'ripple';
    sp.style.cssText = `width:${s}px;height:${s}px;left:${e.clientX - r.left - s / 2}px;top:${e.clientY - r.top - s / 2}px`;
    b.style.position ||= 'relative'; b.append(sp); setTimeout(() => sp.remove(), 650);
  });
  let sheetOnClose = null;
  function openSheet(html, onClose) {
    $('#sheet').innerHTML = `<div class="grab"></div>${html}`; $('#sheet').scrollTop = 0;
    $('#sheetWrap').classList.add('open'); $('#sheetWrap').setAttribute('aria-hidden', 'false'); sheetOnClose = onClose || null;
  }
  function closeSheet() {
    $('#sheetWrap').classList.remove('open'); $('#sheetWrap').setAttribute('aria-hidden', 'true');
    const f = sheetOnClose; sheetOnClose = null; if (f) f();
  }
  // swipe-down to close
  (() => { let y0 = null; const sh = $('#sheet');
    sh.addEventListener('touchstart', (e) => { if (sh.scrollTop <= 0 && !e.target.closest('input,select,textarea,.map')) y0 = e.touches[0].clientY; }, { passive: true });
    sh.addEventListener('touchmove', (e) => { if (y0 == null) return; const dy = e.touches[0].clientY - y0; if (dy > 0) { sh.classList.add('dragging'); sh.style.transform = `translate(-50%, ${dy}px)`; } }, { passive: true });
    sh.addEventListener('touchend', (e) => { if (y0 == null) return; const dy = e.changedTouches[0].clientY - y0; sh.classList.remove('dragging'); sh.style.transform = ''; y0 = null; if (dy > 110) closeSheet(); });
  })();

  /* ---------------- routing ---------------- */
  let route = 'today', routeArg = null;
  const ui = { routineMode: 'week', routineWeek: null, sylTab: null, sylQ: '', ctFilter: 'upcoming', testsTab: 'ct', facQ: '' };
  function go(to, arg = null) { route = to; routeArg = arg; location.hash = arg ? `${to}/${encodeURIComponent(arg)}` : to; }
  window.addEventListener('hashchange', () => { const [r, a] = location.hash.slice(1).split('/'); route = r || 'today'; routeArg = a ? decodeURIComponent(a) : null; render(); });

  let lastView = '';
  function render(calm = false) {
    applyTheme();
    if (!state.onboarded || !S()) { document.body.classList.add('has-onb'); $('#view').innerHTML = viewOnboarding(); lastView = 'onb'; return; }
    document.body.classList.remove('has-onb');
    renderTop();
    const views = { today: viewToday, routine: viewRoutine, attendance: viewAttendance, course: viewCourse, ct: viewTests, syllabus: viewSyllabus, syl: viewSyllabusCourse, settings: viewSettings, more: viewMore, faculty: viewFaculty, cover: viewCover };
    const fn = views[route] || viewToday;
    const sig = `${route}|${routeArg}`; const same = calm || sig === lastView; lastView = sig;
    $('#view').innerHTML = `<div class="page ${same ? 'calm' : ''}">${fn(routeArg)}</div>`;
    const tabs = ['today', 'routine', 'attendance', 'ct', 'more'];
    const map = { course: 'attendance', syl: 'more', syllabus: 'more', faculty: 'more', cover: 'more', settings: 'more' };
    const active = tabs.indexOf(route in map ? map[route] : route);
    $$('#tabbar button').forEach((b, i) => b.classList.toggle('on', i === active));
    $('#tabInk').style.opacity = active < 0 ? 0 : 1;
    if (active >= 0) $('#tabInk').style.transform = `translateX(${active * 100}%)`;
    requestAnimationFrame(() => { animateMeters(); if (route === 'settings') initMap(); if (route === 'cover') coverMounted(); });
    if (!same) window.scrollTo({ top: 0 });
  }
  function animateMeters() {
    $$('.ring .fg').forEach((c) => { c.style.strokeDashoffset = 220 - (220 * Number(c.dataset.v)) / 100; });
    $$('.bar i[data-v]').forEach((b) => { b.style.width = `${b.dataset.v}%`; });
  }
  function applyTheme() { const t = state.settings.theme; if (t === 'auto') document.documentElement.removeAttribute('data-theme'); else document.documentElement.dataset.theme = t; }

  /* ---------------- top bar ---------------- */
  function weekLabel(sem = S()) {
    const w = weekOf(now(), sem);
    if (w < 1) return `Starts in ${Math.ceil((semStart(sem) - startOfDay(now())) / DAY_MS)}d`;
    if (w > sem.weeks) return 'Semester over';
    return `Week ${w}/${sem.weeks}`;
  }
  function renderTop() {
    const sem = S();
    $('#semLabel').textContent = `${sem.label}${sem.section ? ` · Sec ${sem.section}` : ''} · RUET`;
    $('#weekText').textContent = weekLabel(sem);
    const codes = scheduledCourses(sem);
    const html = codes.length ? codes.map((c, i) => {
      const st = stats(c, sem);
      return `<button class="ab-chip" style="--i:${i};--c:${toneFor(st.marks)}" data-act="go" data-to="course" data-arg="${esc(c)}" title="${esc(courseInfo(c).title)}">
        <span class="ab-count">${st.Ae}</span><span><b>${esc(c)}</b><small>${st.Ae === 1 ? '1 absence' : `${st.Ae} absences`} · ${st.marks}/10</small></span></button>`;
    }).join('') : `<span class="small muted" style="padding:6px 2px">Add classes in Routine to start tracking absences.</span>`;
    const strip = $('#absentStrip');
    if (strip.innerHTML !== html) strip.innerHTML = html;
    if (strip.classList.contains('first')) setTimeout(() => strip.classList.replace('first', 'calm'), 900);
  }
  window.addEventListener('scroll', () => { const tb = $('#topbar'); if (tb) tb.classList.toggle('scrolled', scrollY > 4); }, { passive: true });

  /* ---------------- Routine source (preset / shared link / blank) ---------------- */
  function defaultSource(level) {
    if (pendingImport && pendingImport.l === level) return 'shared';
    const p = presetsFor(level)[0]; return p ? `p:${p[0]}:C` : 'blank';
  }
  function routineSourceChips(level, selected, act) {
    const opts = [];
    if (pendingImport && pendingImport.l === level) opts.push(['shared', `Shared routine · ${level}${pendingImport.s ? ` · Sec ${pendingImport.s}` : ''}`, `${routineCount(pendingImport)} classes from a classmate's link`]);
    for (const [key, p] of presetsFor(level)) for (const sec of Object.keys(p.sections)) opts.push([`p:${key}:${sec}`, `Import ${p.label.split(' (')[0]} · Section ${sec}`, `Official routine${p.label.includes('(') ? ' ' + p.label.slice(p.label.indexOf('(')) : ''}, editable`]);
    opts.push(['blank', 'Start with an empty routine', 'Tap any box to put a course in it']);
    return `<div class="chips" style="flex-direction:column">${opts.map(([v, t, s]) => `<button class="chip ${selected === v ? 'on' : ''}" data-act="${act}" data-v="${v}"><b>${esc(t)}</b><br><span class="small muted">${esc(s)}</span></button>`).join('')}</div>
      <label class="f">Got a routine link from a classmate?</label><input class="in" id="pasteLink" placeholder="Paste the classkoytay link here" autocomplete="off">`;
  }
  function applySource(sem, src) {
    if (src === 'shared' && pendingImport) { applyShared(sem, pendingImport); pendingImport = null; return true; }
    if (src && src.startsWith('p:')) { const [, key, sec] = src.split(':'); if (PRESETS[key]) { applyPreset(sem, key, sec); return true; } }
    return false;
  }

  /* ---------------- Semesters ---------------- */
  const ns = {};
  function newSemSheet(level) {
    const cur = S();
    Object.assign(ns, { level: level || (cur ? nextLevel(cur.level) : '1-1'), section: cur ? cur.section : '', weekNo: 1, sat: iso(saturdayOf(dayKeyOfDate(now()) ? now() : addDays(now(), 2))) });
    ns.source = defaultSource(ns.level);
    drawNewSem();
  }
  function drawNewSem() {
    const start = addDays(parseISO(ns.sat), -(ns.weekNo - 1) * 7);
    const exists = semesterList().find((s) => s.level === ns.level);
    openSheet(`<h3>New semester</h3><p class="muted small">Each semester keeps its own routine, attendance and CTs. Old semesters stay saved — switch back any time.</p>
      <label class="f">Level</label><div class="big-choice">${LEVELS.map((l) => `<button class="chip ${ns.level === l ? 'on' : ''}" data-act="ns-level" data-v="${l}">${l}</button>`).join('')}</div>
      ${exists ? `<p class="small" style="color:var(--warn);margin:8px 0 0">You already have “${esc(exists.label)}”. Creating another is fine (e.g. a retake).</p>` : ''}
      <label class="f">Section</label><div class="seg">${['', 'A', 'B', 'C'].map((s) => `<button class="${ns.section === s ? 'on' : ''}" data-act="ns-sec" data-v="${s}">${s || 'None'}</button>`).join('')}</div>
      <label class="f">Routine</label>${routineSourceChips(ns.level, ns.source, 'ns-src')}
      <label class="f">Running week</label><div class="stepper"><button data-act="ns-week" data-d="-1">−</button><div class="val">${ns.weekNo}</div><button data-act="ns-week" data-d="1">+</button></div>
      <label class="f">Week ${ns.weekNo} starts on (Saturday)</label><input class="in" type="date" id="nsSat" value="${ns.sat}">
      <p class="small muted" style="margin-top:10px">→ Week 1 = ${fmtD(start)} · Week 14 ends ${fmtD(addDays(start, 13 * 7 + 4))}</p>
      <div class="acts"><button class="btn primary" data-act="ns-create">Create ${ns.level} semester</button></div>`);
  }
  function semSheet() {
    const cur = S();
    openSheet(`<h3>Your semesters</h3><p class="muted small">Tap one to switch. Attendance, CTs and routine are kept separately for each.</p>
      <div style="display:flex;flex-direction:column;gap:8px;margin-top:12px">${semesterList().map((s) => {
        const codes = scheduledCourses(s); const abs = codes.reduce((a, c) => a + stats(c, s).Ae, 0);
        return `<button class="card row" style="text-align:left;margin:0;${s.id === cur.id ? 'border-color:var(--accent)' : ''}" data-act="sem-switch" data-id="${s.id}">
          <span class="tag" style="font:600 14px var(--sans);padding:8px 10px">${esc(s.level)}</span>
          <span class="sp"><b>${esc(s.label)}${s.section ? ` · Sec ${esc(s.section)}` : ''}</b><br><span class="small muted">${weekLabel(s)} · ${codes.length} course${codes.length === 1 ? "" : "s"} · ${abs} absence${abs === 1 ? "" : "s"}</span></span>
          ${s.id === cur.id ? '<span class="tag good">current</span>' : '<span class="faint">›</span>'}</button>`;
      }).join('')}</div>
      <div class="acts"><button class="btn primary" data-act="new-sem">${ic('plus')} New semester</button></div>`);
  }
  function shareRoutine() {
    const sem = S();
    if (!routineCount(sem)) { toast('Your routine is empty — add classes first', '!'); return; }
    const url = `${location.origin}${location.pathname}#import=${encodeRoutine(sem)}`;
    const text = `classkoytay routine · ${sem.level}${sem.section ? ' Sec ' + sem.section : ''} — open to import`;
    if (navigator.share) navigator.share({ title: 'classkoytay routine', text, url }).catch(() => {});
    else navigator.clipboard?.writeText(url).then(() => toast('Routine link copied — send it to your section', '🔗'), () => prompt('Copy this link', url));
  }
  function importSheet(r) {
    const cur = S(), same = cur && cur.level === r.l;
    openSheet(`<h3>Import shared routine</h3><p class="muted small">${esc(r.l)}${r.s ? ` · Section ${esc(r.s)}` : ''} · ${routineCount(r)} classes</p>
      <div class="card" style="margin-top:10px">${R.days.map((d) => `<div class="row small" style="padding:4px 0"><b style="width:40px">${d.short}</b><span class="muted">${(r.d[d.key] || []).map((x) => esc(x[2])).join(' · ') || '—'}</span></div>`).join('')}</div>
      <div class="acts">${same ? `<button class="btn" data-act="imp-replace">Replace ${esc(cur.label)}</button>` : ''}<button class="btn primary" data-act="imp-new">New ${esc(r.l)} semester</button></div>`);
  }

  /* ---------------- Onboarding ---------------- */
  const onb = { step: 0, level: '2-2', preset: null, weekNo: null, weekSat: null };
  function viewOnboarding() {
    const t = now(), curSat = saturdayOf(t);
    if (onb.weekNo == null) { onb.weekNo = 1; onb.weekSat = iso(curSat); }
    if (pendingImport && !onb._imp) { onb._imp = 1; onb.level = pendingImport.l; onb.preset = 'shared'; }
    if (onb.preset == null) onb.preset = defaultSource(onb.level);
    const dots = `<div class="dots">${[0, 1, 2, 3, 4].map((i) => `<i class="${i === onb.step ? 'on' : ''}"></i>`).join('')}</div>`;
    if (onb.step === 0) return `<div class="onb page">
      <div class="hero-mark">${LOGO}</div>
      <h1>Your semester, <em>in order</em>.</h1>
      <p class="muted">Routine, attendance marks under the syllabus rule (90% → 10/10), class tests and lab tests, the full EEE syllabus, faculty directory and lab-report covers — for every semester from 1-1 to 4-2.</p>
      ${dots}<button class="btn primary block" data-act="onb-next">Get started</button>
      ${CLOUD.configured ? `<button class="btn block" style="margin-top:10px" data-act="cloud-login">${GOOGLE_G} Continue with Google — restore my data</button>` : ''}</div>`;
    if (onb.step === 1) return `<div class="onb page"><h1>Two quick <em>permissions</em></h1>
      <p class="muted">So reminders ring on time and attendance can mark itself when you walk into class.</p>
      ${permCards()}
      ${dots}<div class="row"><button class="btn" data-act="onb-back">Back</button><button class="btn primary sp" data-act="onb-next">Continue</button></div></div>`;
    if (onb.step === 2) return `<div class="onb page"><h1>Which <em>semester</em>?</h1>
      <p class="muted">Courses come from the RUET EEE syllabus. You can add more semesters later.</p>
      <div class="big-choice">${LEVELS.map((l) => `<button class="chip ${onb.level === l ? 'on' : ''}" data-act="onb-level" data-v="${l}">${l}</button>`).join('')}</div>
      ${dots}<div class="row"><button class="btn" data-act="onb-back">Back</button><button class="btn primary sp" data-act="onb-next">Continue</button></div></div>`;
    if (onb.step === 3) {
      return `<div class="onb page"><h1>Your <em>routine</em></h1>
      <p class="muted">RUET routines change every semester, so you fill the 8 AM – 5 PM boxes yourself — or use a routine a classmate shared with you.</p>
      ${routineSourceChips(onb.level, onb.preset, 'onb-preset')}
      ${dots}<div class="row"><button class="btn" data-act="onb-back">Back</button><button class="btn primary sp" data-act="onb-next">Continue</button></div></div>`;
    }
    const startPreview = addDays(parseISO(onb.weekSat), -(onb.weekNo - 1) * 7);
    return `<div class="onb page"><h1>Which <em>week</em> is running?</h1>
      <p class="muted">A RUET semester runs 14 weeks (Sat–Wed). Tell the app the week number and the Saturday it starts. You can change this any time by tapping the week chip.</p>
      <label class="f">Week number</label>
      <div class="stepper"><button data-act="onb-week" data-d="-1">−</button><div class="val">${onb.weekNo}</div><button data-act="onb-week" data-d="1">+</button></div>
      <label class="f">That week starts on (Saturday)</label>
      <input class="in" type="date" id="onbSat" value="${onb.weekSat}">
      <p class="small muted" style="margin-top:10px">→ Week 1 = <b>${fmtD(startPreview)}</b>, Week 14 ends <b>${fmtD(addDays(startPreview, 13 * 7 + 4))}</b></p>
      ${dots}<div class="row"><button class="btn" data-act="onb-back">Back</button><button class="btn primary sp" data-act="onb-finish">Start using classkoytay</button></div></div>`;
  }

  /* ---------------- Today ---------------- */
  function viewToday() {
    const sem = S(), t = now();
    const todays = instancesOn(t, sem);
    let nextDay = null, nextList = [];
    for (let i = 1; i <= 7; i++) { const d = addDays(t, i); const l = instancesOn(d, sem).filter((x) => !sem.offDays.includes(x.iso)); if (l.length) { nextDay = d; nextList = l; break; } }
    const isOff = sem.offDays.includes(iso(t));
    const tests = upcomingTests(sem).slice(0, 4);
    const codes = scheduledCourses(sem);
    const risky = codes.map((c) => ({ c, s: stats(c, sem) })).filter((x) => x.s.Ae > 0 && x.s.left90 <= 1).sort((a, b) => a.s.left90 - b.s.left90);
    const totalA = codes.reduce((a, c) => a + stats(c, sem).Ae, 0);
    const avg = codes.length ? codes.reduce((a, c) => a + stats(c, sem).pct, 0) / codes.length : 100;
    const doneToday = todays.filter((i) => i.end <= t).length;
    const greeting = t.getHours() < 12 ? 'Good morning' : t.getHours() < 17 ? 'Good afternoon' : 'Good evening';
    const first = (state.profile.name || (cloudUser && cloudUser.name) || '').trim().split(/\s+/)[0];
    const tr = trackerState();
    const nt = tests[0];
    return `<div class="stagger">
      <section class="hero" style="--i:0">
        <div class="row"><span class="muted small">${fmtD(t)} · ${esc(weekLabel(sem))}</span><span class="sp"></span>
          <button class="track-pill ${tr.cls}" data-act="go" data-to="settings"><span class="d"></span>${tr.label}</button></div>
        <h1>${greeting}${first ? `, ${esc(first)}` : ''}</h1>
        <div class="muted small">${todays.length ? (isOff ? 'Marked as a holiday — no classes counted today.' : `${todays.length} class${todays.length > 1 ? 'es' : ''} today · ${doneToday} done`) : dayKeyOfDate(t) ? 'No classes today.' : 'Weekend (Thu–Fri).'}</div>
        <div class="stats">
          <div class="stat"><b>${Math.round(avg)}%</b><span>avg attendance</span></div>
          <div class="stat"><b>${totalA}</b><span>absences</span></div>
          <div class="stat"><b>${nt ? (daysUntil(nt.date) === 0 ? 'Today' : `${daysUntil(nt.date)}d`) : '–'}</b><span>${nt ? `to ${esc(nt.code)} ${nt.kind === 'ct' ? `CT-${nt.num}` : 'lab test'}` : 'no test planned'}</span></div>
        </div>
      </section>
      ${weekOf(t, sem) > sem.weeks ? `<div class="card row" style="--i:1;margin-top:12px"><span class="tile" style="all:unset"><span class="ti" style="width:38px;height:38px;border-radius:11px;display:grid;place-items:center;background:var(--accent-soft);color:var(--accent)">${ic('cap', '')}</span></span><div class="sp"><b>${esc(sem.label)} is finished</b><div class="small muted">Start ${nextLevel(sem.level)} — this semester stays saved.</div></div><button class="btn primary sm" data-act="new-sem" data-v="${nextLevel(sem.level)}">Start ${nextLevel(sem.level)}</button></div>` : ''}
      ${risky.length ? `<div class="note warn" style="--i:1;margin-top:12px">${ic('alert')} ${risky.map((r) => `<b>${esc(r.c)}</b> ${r.s.left90 < 0 ? `is below 90% (${r.s.finalMarks}/10 max now)` : r.s.left90 === 0 ? 'has <b>no</b> absences left for 10/10' : 'has only 1 absence left for 10/10'}`).join(' · ')}</div>` : ''}
      <h2 class="sec" style="--i:2">Today${dayKeyOfDate(t) && todays.length ? `<span class="sp"></span><button class="btn sm" data-act="toggle-off" data-iso="${iso(t)}">${isOff ? 'Undo holiday' : 'Mark holiday'}</button>` : ''}</h2>
      ${todays.length ? `<div class="timeline">${todays.map((i, n) => classCard(i, n + 3, t)).join('')}</div>` : `<div class="card empty" style="--i:3"><div class="big">${ic('coffee', '')}</div><div>No classes scheduled today.</div></div>`}
      ${tests.length ? `<h2 class="sec" style="--i:6">Upcoming tests<span class="sp"></span><button class="btn sm" data-act="go" data-to="ct">All tests</button></h2>${tests.map((c, n) => testCard(c, n + 7)).join('')}` : ''}
      ${nextDay ? `<h2 class="sec" style="--i:9">Next class day · ${fmtD(nextDay)}</h2>
        <div class="card" style="--i:10;padding:4px 16px">${nextList.map((i) => { const c = courseInfo(i.code); const ct = ctAt(i), lt = labAt(i); return `<div class="nrow" style="--cc:${colorOf(i.code)}"><span class="tm">${fmt12(slotStart(i.slot))}</span><span class="bar-c"></span><span class="mid"><b class="mono">${esc(i.code)}</b>${ct ? ` <span class="tag ct">CT-${ct.num}</span>` : ''}${lt ? ` <span class="tag ct">${esc(labLabel(lt))}</span>` : ''}<span class="tt">${esc(c.title)}</span></span><span class="rm">${esc(i.slot.room || '')}</span></div>`; }).join('')}</div>` : ''}
      ${courseSummary(sem, 11)}
    </div>`;
  }
  /** Course code → full name list, so nobody has to remember what "EEE 2213" means */
  function courseSummary(sem, n = 0) {
    const list = scheduledCourses(sem).length ? scheduledCourses(sem) : SY.plan[sem.level] || [];
    if (!list.length) return '';
    const th = list.filter((c) => !courseInfo(c, sem).sessional).length;
    return `<h2 class="sec" style="--i:${n}">${esc(sem.level)} courses<span class="sp"></span><span class="small faint" style="text-transform:none;letter-spacing:0">${th} theory · ${list.length - th} sessional</span></h2>
      <div class="card clist" style="--i:${n + 1};padding:0">${list.map((c) => { const ci = courseInfo(c, sem); const tch = courseTeachers(c, sem).map((x) => plainName(x.name)).join(', ');
        return `<button class="ci" style="--cc:${colorOf(c, sem)}" data-act="go" data-to="course" data-arg="${esc(c)}"><span class="bar-c"></span><span class="cc">${esc(c)}</span><span><div class="ct">${esc(ci.title)}</div><div class="cs">${ci.credits ? `${esc(ci.credits)} cr · ` : ''}${ci.sessional ? 'Sessional' : 'Theory'}${tch ? ` · ${esc(tch)}` : ''}</div></span>${ic('chev')}</button>`; }).join('')}</div>`;
  }
  function classCard(i, n, t) {
    const sem = S(), c = courseInfo(i.code), s = statusOf(i, sem), rec = sem.records[i.key];
    const isNow = t >= i.start && t < i.end, done = i.end <= t;
    const ct = ctAt(i), lt = labAt(i);
    const st = stats(i.code, sem);
    const tch = teachersOf(i.slot.teacher).map((x) => plainName(x.name)).join(', ');
    return `<div class="tl-item" style="--i:${n}">
      <div class="tl-time">${fmt12(slotStart(i.slot)).replace(' ', '<small>')}</small></div>
      <div class="cls ${isNow ? 'now' : ''} ${done ? 'done' : ''}" style="--cc:${colorOf(i.code)}">
        <div class="row"><span class="cls-code">${esc(i.code)}</span>${i.slot.span > 1 ? '<span class="tag lab">Lab</span>' : ''}${ct ? `<span class="tag ct">CT-${ct.num}</span>` : ''}${lt ? `<span class="tag ct">${esc(labLabel(lt))}</span>` : ''}</div>
        <div class="cls-title">${esc(c.title)}</div>
        <div class="cls-meta"><span>${ic('clock')}${fmt12(slotStart(i.slot))} – ${fmt12(slotEnd(i.slot))}</span>${i.slot.room ? `<span>${ic('pin')}${esc(i.slot.room)}</span>` : ''}${tch ? `<span>${ic('user')}${esc(tch)}</span>` : ''}<span>${st.Ae} absent · ${st.left90 >= 0 ? `${st.left90} left for 10/10` : 'below 90%'}</span></div>
        ${i.slot.note ? `<div class="small faint" style="margin-top:4px">${esc(i.slot.note)}</div>` : ''}
        ${s === 'OFF' ? '<div class="small muted" style="margin-top:10px">Holiday — not counted</div>' : paButtons(i, s, rec)}
      </div></div>`;
  }
  function paButtons(i, s, rec) {
    const check = '<svg viewBox="0 0 24 24"><path d="m5 12 5 5 9-10"/></svg>', x = '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>';
    return `<div class="cls-actions">
      <button class="pa p ${s === 'P' ? 'on' : ''}" data-act="mark" data-k="${i.key}" data-s="P">${check}Present</button>
      <button class="pa a ${s === 'A' ? 'on' : ''}" data-act="mark" data-k="${i.key}" data-s="A">${x}Absent</button>
      <button class="pa c ${s === 'C' ? 'on' : ''}" data-act="mark" data-k="${i.key}" data-s="C" title="Class not held">Off</button>
    </div>${rec ? `<div class="small faint" style="margin-top:7px;display:flex;align-items:center;gap:5px">${rec.src === 'gps' ? `${ic('locate')} Auto-marked by location` : `${ic('check')} Marked manually`}</div>` : ''}`;
  }
  const daysUntil = (d) => Math.max(0, Math.round((startOfDay(d) - startOfDay(now())) / DAY_MS));

  /* ---------------- Routine ---------------- */
  function viewRoutine() {
    const sem = S(), t = now();
    const curW = Math.min(Math.max(weekOf(t, sem), 1), sem.weeks);
    if (ui.routineWeek == null) ui.routineWeek = curW;
    const w = ui.routineWeek, tmpl = ui.routineMode === 'template';
    const headers = R.periods.map((p) => `<div class="rh"><b>${p.n}</b>${fmt12(p.start).replace(' ', '')}</div>`);
    const head = ['<div class="rh" style="left:0;z-index:3;position:sticky;background:var(--card-solid)"></div>', headers[0], headers[1], headers[2], '<div class="rh"></div>', headers[3], headers[4], headers[5], '<div class="rh"></div>', headers[6], headers[7], headers[8]].join('');
    let cellsHtml = '', k = 0;
    for (const d of R.days) {
      const date = dateFor(w, d.key, sem);
      const isToday = !tmpl && iso(date) === iso(t);
      const off = !tmpl && sem.offDays.includes(iso(date));
      cellsHtml += `<div class="rday ${isToday ? 'today' : ''}" style="grid-row:${dayIdx(d.key) + 2};grid-column:1${!tmpl ? ';cursor:pointer' : ''}" ${!tmpl ? `data-act="day-menu" data-iso="${iso(date)}"` : ''}>${d.short}${!tmpl ? `<small>${date.getDate()} ${MONTHS[date.getMonth()]}</small>` : ''}${off ? '<small>off</small>' : ''}</div>`;
      const slots = sem.routine[d.key];
      const covered = new Set();
      for (const s of slots) for (let p = s.p; p < s.p + s.span; p++) covered.add(p);
      const col = (p) => p + 1 + (p > 3 ? 1 : 0) + (p > 6 ? 1 : 0); // grid column
      const row = dayIdx(d.key) + 2;
      for (const s of slots) {
        let span = s.span;
        // grid columns: account for break gaps inside a span
        const c0 = col(s.p), c1 = col(s.p + s.span - 1) + 1;
        const inst = mkInst(sem, date, w, d.key, s);
        const st = tmpl ? null : statusOf(inst, sem);
        const ct = tmpl ? null : ctAt(inst), lt = tmpl ? null : labAt(inst);
        const c = courseInfo(s.code);
        cellsHtml += `<div class="rcell ${off ? 'offday' : ''}" style="grid-row:${row};grid-column:${c0}/${c1}">
          <button class="rslot" style="--cc:${colorOf(s.code)};--i:${k++}" data-act="${tmpl ? 'edit-slot' : 'inst'}" data-day="${d.key}" data-id="${s.id}" data-iso="${iso(date)}">
            <b>${esc(s.code)}</b><span class="t">${esc(shortTitle(c.title))}</span><span class="t">${esc([s.teacher, s.room].filter(Boolean).join(' · '))}</span>
            ${!tmpl && st !== 'OFF' ? `<span class="st ${st || (inst.end <= t ? 'U' : '')}">${st === 'P' ? '✓' : st === 'A' ? '✕' : st === 'C' ? '–' : ''}</span>` : ''}
            ${ct ? `<span class="tag ct ctb">CT-${ct.num}</span>` : ''}${lt ? `<span class="tag ct ctb">${esc(labLabel(lt))}</span>` : ''}
          </button></div>`;
        void span;
      }
      for (let p = 1; p <= 9; p++) if (!covered.has(p)) cellsHtml += `<div class="rcell add ${tmpl ? '' : 'off'}" style="grid-row:${row};grid-column:${col(p)}" ${tmpl ? `data-act="add-slot" data-day="${d.key}" data-p="${p}"` : ''}>${tmpl ? '+' : ''}</div>`;
      cellsHtml += `<div class="rgap" style="grid-row:${row};grid-column:5"></div><div class="rgap" style="grid-row:${row};grid-column:9"></div>`;
    }
    const wStart = dateFor(w, 'sat', sem), wEnd = dateFor(w, 'wed', sem);
    return `<h1 class="page-title">Routine</h1><p class="page-sub">${esc(sem.label)} · 8:00 AM – 5:00 PM · Sat – Wed</p>
      <div class="seg" style="margin-bottom:12px"><button class="${!tmpl ? 'on' : ''}" data-act="rmode" data-v="week">This week</button><button class="${tmpl ? 'on' : ''}" data-act="rmode" data-v="template">Edit routine</button></div>
      ${tmpl ? `<div class="note" style="margin-bottom:12px">Tap <b>+</b> on any box to put a course there. Tap a course to edit, change length (labs = 3 periods) or remove. This routine repeats for all ${sem.weeks} weeks.</div>` : `
      <div class="week-nav"><button class="icon-btn" data-act="rweek" data-d="-1" aria-label="Previous week"><svg viewBox="0 0 24 24"><path d="m15 18-6-6 6-6"/></svg></button>
        <div class="lbl">Week ${w}${w === curW && weekOf(t, sem) === w ? ' <span class="tag good">running</span>' : ''}<small>${fmtD(wStart)} – ${fmtD(wEnd)}</small></div>
        <button class="icon-btn" data-act="rweek" data-d="1" aria-label="Next week"><svg viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg></button></div>`}
      <div class="grid-scroll"><div class="rgrid">${head}${cellsHtml}</div></div>
      <div class="row wrap small muted" style="margin-top:10px;gap:14px">${tmpl ? '<span>Break 10:30–10:50 · Lunch 1:20–2:30 (striped columns)</span>' : '<span><span class="legend st P">✓</span> present</span><span><span class="legend st A">✕</span> absent</span><span>Tap a class to mark it or add a CT / lab test · tap a day to mark a holiday</span>'}</div>
      ${tmpl ? `<div class="row wrap" style="margin-top:16px"><button class="btn" data-act="share-routine">${ic('link')} Share with section</button><button class="btn" data-act="import-preset">${ic('download')} Import routine</button><button class="btn" data-act="add-custom-course">${ic('plus')} Custom course</button><button class="btn danger" data-act="clear-routine">Clear routine</button></div>` : ''}`;
  }
  function coursePickerOptions(sem, selected) {
    const opt = (c) => `<option value="${esc(c)}" ${c === selected ? 'selected' : ''}>${esc(c)} — ${esc(courseInfo(c, sem).title)}</option>`;
    const plan = SY.plan[sem.level] || [], used = new Set(plan), groups = [];
    groups.push([`${sem.level} courses`, plan]);
    for (const [g, l] of electivesFor(sem.level)) { groups.push([g, l]); l.forEach((c) => used.add(c)); }
    const custom = Object.keys(sem.custom || {}); custom.forEach((c) => used.add(c));
    if (custom.length) groups.push(['Custom', custom]);
    groups.push(['Other semesters (retake / backlog)', Object.keys(SY.courses).filter((c) => !used.has(c))]);
    return groups.filter(([, l]) => l.length).map(([g, l]) => `<optgroup label="${esc(g)}">${l.map(opt).join('')}</optgroup>`).join('');
  }
  function slotSheet(day, p, slot = null) {
    const sem = S(), courses = semCourses(sem);
    const s = slot || { code: courses[0], p: Number(p), span: 1, teacher: '', room: '', note: '' };
    const dayName = R.days[dayIdx(day)].name;
    openSheet(`<h3>${slot ? 'Edit class' : 'Add class'}</h3><p class="muted small">${dayName} · starts period ${s.p} (${fmt12(R.periods[s.p - 1].start)})</p>
      <label class="f">Course</label>
      <select class="in" id="fCode">${coursePickerOptions(sem, s.code)}</select>
      <label class="f">Start period</label>
      <select class="in" id="fP">${R.periods.map((x) => `<option value="${x.n}" ${x.n === s.p ? 'selected' : ''}>Period ${x.n} · ${fmt12(x.start)}</option>`).join('')}</select>
      <label class="f">Length</label>
      <div class="seg" id="fSpan">${[1, 2, 3].map((n) => `<button class="${n === s.span ? 'on' : ''}" data-act="pick-span" data-v="${n}">${n} period${n > 1 ? 's' : ''}${n === 3 ? ' (lab)' : ''}</button>`).join('')}</div>
      <div class="grid2" style="grid-template-columns:1fr 1fr;gap:10px"><div><label class="f">Teacher</label><input class="in" id="fT" value="${esc(s.teacher)}" placeholder="e.g. SHR" list="tlist"></div>
      <div><label class="f">Room</label><input class="in" id="fR" value="${esc(s.room)}" placeholder="e.g. R-401"></div></div>
      <datalist id="tlist">${[...Object.entries(R.teachers), ...(state.settings.customFaculty || []).filter((f) => f.ini).map((f) => [f.ini, f.name])].map(([k, v]) => `<option value="${k}">${esc(v)}</option>`).join('')}</datalist>
      <label class="f">Note (optional)</label><input class="in" id="fN" value="${esc(s.note)}" placeholder="e.g. alternate group">
      <div class="acts">${slot ? `<button class="btn danger" data-act="del-slot" data-day="${day}" data-id="${slot.id}">Remove</button>` : ''}<button class="btn primary" data-act="save-slot" data-day="${day}" data-id="${slot ? slot.id : ''}">Save</button></div>`);
  }
  function instSheet(day, id, isoDate) {
    const sem = S(), slot = sem.routine[day].find((x) => x.id === id); if (!slot) return;
    const date = parseISO(isoDate), inst = mkInst(sem, date, weekOf(date, sem), day, slot);
    const s = statusOf(inst, sem), rec = sem.records[inst.key], c = courseInfo(slot.code), ct = ctAt(inst), lt = labAt(inst);
    const tch = teachersOf(slot.teacher).map((x) => `${plainName(x.name)}${x.fac && x.fac.desig ? ` (${x.fac.desig})` : ''}`).join(', ');
    const testBtn = c.sessional
      ? `<button class="btn" data-act="lt-new" data-code="${esc(slot.code)}" data-key="${inst.key}">${lt ? 'Edit lab test' : `${ic('plus')} Lab test here`}</button>`
      : `<button class="btn" data-act="ct-new" data-code="${esc(slot.code)}" data-key="${inst.key}">${ct ? 'Edit CT' : `${ic('plus')} CT here`}</button>`;
    openSheet(`<div class="row"><span class="tag mono" style="color:${colorOf(slot.code)}">${esc(slot.code)}</span><span class="tag">Week ${inst.week}</span>${ct ? `<span class="tag ct">CT-${ct.num}</span>` : ''}${lt ? `<span class="tag ct">${esc(labLabel(lt))}</span>` : ''}</div>
      <h3 style="margin-top:10px">${esc(c.title)}</h3><p class="muted small">${fmtD(date)} · ${fmt12(slotStart(slot))} – ${fmt12(slotEnd(slot))}${slot.room ? ` · ${esc(slot.room)}` : ''}${tch ? `<br>${esc(tch)}` : ''}</p>
      ${s === 'OFF' ? '<div class="note">This day is marked as a holiday.</div>' : paButtons(inst, s, rec)}
      <div class="acts">${testBtn}<button class="btn" data-act="go" data-to="course" data-arg="${esc(slot.code)}">Course details</button></div>`);
  }

  /* ---------------- Attendance ---------------- */
  function ring(pct, color, label, sub) {
    return `<div class="ring"><svg viewBox="0 0 84 84"><circle class="bgc" cx="42" cy="42" r="35"/><circle class="fg" cx="42" cy="42" r="35" style="--rc:${color}" data-v="${Math.max(0, Math.min(100, pct))}"/></svg><div class="lbl"><div><b>${label}</b><small>${sub}</small></div></div></div>`;
  }
  function viewAttendance() {
    const sem = S(), codes = scheduledCourses(sem);
    const theory = codes.filter((c) => !courseInfo(c).sessional), lab = codes.filter((c) => courseInfo(c).sessional);
    const card = (c, n) => {
      const st = stats(c, sem), col = toneFor(st.marks);
      return `<div class="card att-card" style="--i:${n}" data-act="go" data-to="course" data-arg="${esc(c)}">
        ${ring(st.pct, col, `${Math.round(st.pct)}%`, `${st.total - st.Ae}/${st.total}`)}
        <div><div class="row"><b class="mono" style="color:${colorOf(c)}">${esc(c)}</b><span class="sp"></span><span class="marks" style="color:${col}">${st.marks}<small>/10</small></span></div>
          <div class="small" style="margin:2px 0 8px;font-weight:700">${esc(shortTitle(courseInfo(c).title))}</div>
          <div class="bar" style="--bc:${col}"><i data-v="${st.total ? ((st.held) / st.total) * 100 : 0}"></i></div>
          <div class="row small muted" style="margin-top:6px"><span><b style="color:var(--bad)">${st.Ae}</b> absent</span><span>·</span><span>${st.left90 >= 0 ? `<b>${st.left90}</b> more allowed for 10/10` : `<b style="color:var(--bad)">${-st.left90}</b> over the 90% line`}</span>${st.U && state.settings.unmarkedAs === 'ignore' ? `<span class="tag warn">${st.U} unmarked</span>` : ''}</div>
        </div></div>`;
    };
    const t = codes.length;
    return `<h1 class="page-title">Attendance</h1><p class="page-sub">Marks out of 10 per course, calculated with RUET syllabus §14.2 over ${sem.weeks} weeks.</p>
      ${t ? `<div class="stagger">${theory.length ? `<h2 class="sec" style="--i:0">Theory</h2><div class="grid2">${theory.map((c, i) => card(c, i + 1)).join('')}</div>` : ''}
      ${lab.length ? `<h2 class="sec" style="--i:6">Sessional / Lab</h2><div class="grid2">${lab.map((c, i) => card(c, i + 7)).join('')}</div>` : ''}</div>` : `<div class="card empty"><div class="big">${ic('calendar', '')}</div><div>No classes in your routine yet.</div><button class="btn primary" style="margin-top:12px" data-act="go-template">Build routine</button></div>`}
      ${rulesCard()}`;
  }
  function rulesCard(hitPct = null) {
    const rows = R.attendanceMarks.map((r, i, a) => { const hi = i === 0 ? '100' : `< ${a[i - 1].min}`; const lab = r.min === 0 ? 'Less than 60%' : i === 0 ? '90% and above' : `${r.min}% to ${hi.replace('< ', 'less than ')}%`; const hit = hitPct != null && marksFor(hitPct) === r.marks; return `<tr class="${hit ? 'hit' : ''}"><td>${lab}</td><td class="num">${r.marks}</td></tr>`; }).join('');
    return `<h2 class="sec">Syllabus rule</h2><div class="card"><table class="ruletable"><tr><th>Attendance</th><th>Marks</th></tr>${rows}</table>
      <p class="small muted" style="margin:12px 0 0">• Below <b>50%</b> → not allowed to sit the semester final (§14.3).<br>• Below <b>75%</b> in any course → no scholarship/stipend next session.<br>• Each class block (a 3-period lab = 1 class) counts once. Cancelled classes &amp; holidays are not counted.</p></div>`;
  }
  function viewCourse(code) {
    const sem = S(); if (!code) return viewAttendance();
    const c = courseInfo(code), st = stats(code, sem), col = toneFor(st.marks), t = now();
    const curW = weekOf(t, sem);
    const byWeek = Array.from({ length: sem.weeks }, (_, i) => st.list.filter((x) => x.week === i + 1));
    const maxPer = Math.max(1, ...byWeek.map((x) => x.length));
    const hist = `<div class="hist" style="grid-template-columns:repeat(${sem.weeks},1fr)">${byWeek.map((l, wi) => `<div class="w">${Array.from({ length: maxPer }, (_, j) => { const i = l[j]; if (!i) return '<div class="dot" style="visibility:hidden"></div>'; const s = statusOf(i, sem) || (i.end <= t ? 'U' : 'F'); return `<button class="dot ${s} ${wi + 1 === curW ? 'cur' : ''}" title="${fmtD(i.date)} ${slotStart(i.slot)}" data-act="inst" data-day="${i.day}" data-id="${i.slot.id}" data-iso="${i.iso}">${s === 'P' ? '✓' : s === 'A' ? '✕' : ''}</button>`; }).join('')}<span>${wi + 1}</span></div>`).join('')}</div>`;
    return `<button class="btn sm ghost" data-act="back" style="margin-top:6px;padding-left:4px">${ic('back')} Back</button>
      <div class="row" style="margin-top:14px"><span class="tag mono" style="color:${colorOf(code)}">${esc(code)}</span>${c.sessional ? '<span class="tag lab">Sessional</span>' : '<span class="tag">Theory</span>'}${c.credits ? `<span class="tag">${esc(c.credits)} credits</span>` : ''}</div><h1 class="page-title">${esc(c.title)}</h1><p class="page-sub">${esc(sem.label)}</p>
      <div class="stagger">
      <div class="card" style="--i:0"><div class="row" style="gap:16px">${ring(st.pct, col, `${st.pct.toFixed(st.pct % 1 ? 1 : 0)}%`, `of ${st.total}`)}
        <div class="sp"><div class="muted small">Attendance marks (14-week)</div><div class="marks" style="color:${col};font-size:42px">${st.marks}<small>/10</small></div>
        <div class="small muted">Assumes you attend the rest. So far: <b style="color:var(--text)">${Math.round(st.pctNow)}%</b> (${st.Pe}/${st.Pe + st.Ae} held)</div></div></div>
        <div class="kv"><div><b style="color:var(--good)">${st.Pe}</b><span>present</span></div><div><b style="color:var(--bad)">${st.Ae}</b><span>absent</span></div><div><b>${st.total}</b><span>classes in 14 wk</span></div><div><b style="color:${st.left90 < 0 ? 'var(--bad)' : 'var(--accent-2)'}">${Math.max(0, st.left90)}</b><span>can still miss</span></div></div>
        <div style="margin-top:14px"><div class="row small muted"><span>Absences used for 10/10</span><span class="sp"></span><span class="num">${st.Ae} / ${st.allow90}</span></div>
        <div class="bar" style="--bc:${st.left90 < 0 ? 'var(--bad)' : st.left90 <= 1 ? 'var(--warn)' : 'var(--good)'};margin-top:6px"><i data-v="${st.allow90 ? Math.min(100, (st.Ae / st.allow90) * 100) : st.Ae ? 100 : 0}"></i></div></div>
        ${st.U ? `<p class="small muted" style="margin:10px 0 0">${st.U} past class${st.U > 1 ? 'es are' : ' is'} unmarked — counted as <b>${state.settings.unmarkedAs}</b> (change in Settings).</p>` : ''}
      </div>
      <h2 class="sec" style="--i:1">Week by week <span class="sp"></span><span class="small faint" style="text-transform:none;letter-spacing:0">tap a dot to mark</span></h2>
      <div class="card" style="--i:2">${hist}</div>
      <h2 class="sec" style="--i:3">What-if</h2>
      <div class="card" style="--i:4">${whatIf(st)}</div>
      ${c.sessional ? `<h2 class="sec" style="--i:5">Lab tests &amp; quizzes<span class="sp"></span><button class="btn sm" data-act="lt-new" data-code="${esc(code)}">${ic('plus')} Add</button></h2>${labPanel(code, 6)}`
        : `<h2 class="sec" style="--i:5">Class tests<span class="sp"></span><span class="small faint" style="text-transform:none;letter-spacing:0">best 3 of 4</span></h2>${ctPanel(code, 6)}`}
      ${teacherCards(code, 8)}
      <div class="row" style="margin-top:16px;--i:11"><button class="btn block" data-act="go" data-to="syl" data-arg="${esc(code)}">${ic('book')} Syllabus outline for ${esc(code)}</button></div>
      </div>`;
  }
  function whatIf(st) {
    const rows = [];
    for (let extra = 0; extra <= Math.max(4, st.left90 + 3); extra++) {
      const A = st.Ae + extra; const pct = st.total ? ((st.total - A) / st.total) * 100 : 100; const m = marksFor(pct);
      rows.push(`<tr class="${extra === 0 ? 'hit' : ''}"><td>${extra === 0 ? 'Miss no more' : `Miss ${extra} more`}</td><td class="num">${pct.toFixed(1)}%</td><td class="num" style="color:${toneFor(m)}">${m}/10</td></tr>`);
      if (m === 0) break;
    }
    return `<table class="ruletable"><tr><th>If you…</th><th>Final %</th><th>Marks</th></tr>${rows.join('')}</table>`;
  }

  /* ---------------- Tests: class tests (CT) + lab tests ---------------- */
  const ctDate = (ct) => parseISO(ct.iso);
  function ctAt(inst) { return S().cts.find((c) => c.instKey === inst.key) || null; }
  function labAt(inst) { return (S().labtests || []).find((c) => c.instKey === inst.key) || null; }
  const labLabel = (lt) => `${lt.type || 'Lab test'}${lt.num ? ` ${lt.num}` : ''}`;
  const LAB_TYPES = ['Lab test', 'Quiz', 'Lab final', 'Viva', 'Report'];
  const hasScore = (x) => x.score !== '' && x.score != null && !isNaN(Number(x.score));
  const theoryCourses = (sem = S()) => { const l = scheduledCourses(sem).filter((c) => !courseInfo(c, sem).sessional); return l.length ? l : (SY.plan[sem.level] || []).filter((c) => !courseInfo(c, sem).sessional); };
  const labCourses = (sem = S()) => { const l = scheduledCourses(sem).filter((c) => courseInfo(c, sem).sessional); return l.length ? l : (SY.plan[sem.level] || []).filter((c) => courseInfo(c, sem).sessional); };
  function upcomingTests(sem = S()) {
    const t = startOfDay(now());
    return [...sem.cts.filter((c) => c.iso).map((c) => ({ ...c, kind: 'ct' })), ...(sem.labtests || []).filter((c) => c.iso).map((c) => ({ ...c, kind: 'lab' }))]
      .map((c) => ({ ...c, date: parseISO(c.iso) })).filter((c) => c.date >= t && !c.absent && !hasScore(c)).sort((a, b) => a.date - b.date || (a.p || 0) - (b.p || 0));
  }
  const upcomingCTs = (sem = S()) => upcomingTests(sem).filter((x) => x.kind === 'ct');
  function testsOn(isoDay, sem = S()) {
    return [...sem.cts.filter((c) => c.iso === isoDay).map((c) => ({ ...c, kind: 'ct' })), ...(sem.labtests || []).filter((c) => c.iso === isoDay).map((c) => ({ ...c, kind: 'lab' }))];
  }
  /** CT result for one course: syllabus §14.1 — best 3 of 4 class tests, 20 marks. Absent = 0. */
  function ctResult(code, sem = S()) {
    const vals = [1, 2, 3, 4].map((n) => {
      const c = sem.cts.find((x) => x.code === code && Number(x.num) === n);
      if (!c) return { n, c: null, state: 'none' };
      if (c.absent) return { n, c, state: 'abs', v: 0 };
      if (hasScore(c)) return { n, c, state: 'done', v: (Number(c.score) / Number(c.outOf || 20)) * 20 };
      return { n, c, state: c.iso ? 'sched' : 'none' };
    });
    const got = vals.filter((x) => x.v != null), sorted = [...got].sort((a, b) => b.v - a.v || a.n - b.n);
    const best = sorted.slice(0, 3), dropped = sorted.slice(3);
    const avg = best.length ? best.reduce((a, x) => a + x.v, 0) / best.length : 0;
    return { vals, taken: got.length, best, dropped, avg, final: got.length >= 4 };
  }
  function ctMarks(code) { const r = ctResult(code); return { count: r.taken, scaled: r.avg }; }
  const f2 = (v) => (Math.round(v * 100) / 100).toString();
  function ctPanel(code, n = 0) {
    const r = ctResult(code), dropN = r.final ? r.dropped.map((x) => x.n) : [];
    const box = (x) => {
      const c = x.c, d = c && c.iso ? parseISO(c.iso) : null;
      const cls = { done: 'done', abs: 'abs', sched: 'sched', none: 'empty-box' }[x.state];
      const v = x.state === 'done' ? `${f2(Number(c.score))}<small>/${esc(c.outOf || 20)}</small>` : x.state === 'abs' ? 'Absent' : x.state === 'sched' ? `${d.getDate()} ${MONTHS[d.getMonth()]}` : ic('plus');
      const sub = x.state === 'sched' ? (daysUntil(d) === 0 ? 'today' : d < startOfDay(now()) ? 'add marks' : `in ${daysUntil(d)}d`) : x.state === 'none' ? 'add' : d ? `${d.getDate()} ${MONTHS[d.getMonth()]}` : '';
      return `<button class="ctbox ${cls} ${dropN.includes(x.n) ? 'drop' : ''}" data-act="ct-box" data-code="${esc(code)}" data-n="${x.n}"><span class="n">CT-${x.n}</span><span class="v">${v}</span><span class="s">${sub}</span></button>`;
    };
    return `<div class="card" style="--i:${n}"><div class="ctgrid" style="margin-top:0">${r.vals.map(box).join('')}</div>
      <div class="ct-foot"><div><div class="small muted">${r.final ? 'Final CT marks · best 3 of 4' : r.taken ? `Average so far · ${r.taken} of 4 done` : 'No CT marks yet'}</div>
        <div class="res" style="color:${r.final ? 'var(--accent)' : 'var(--text)'}">${r.taken ? f2(r.avg) : '–'}<small> / 20</small></div></div><span class="sp"></span>
        <button class="btn sm ${r.final ? 'primary' : ''}" data-act="ct-calc" data-code="${esc(code)}">${ic('calc')} ${r.final ? 'Calculate average' : 'Breakdown'}</button></div></div>`;
  }
  function ctCalcSheet(code) {
    const r = ctResult(code), c = courseInfo(code);
    const used = new Set(r.best.map((x) => x.n));
    const rows = r.vals.map((x) => `<tr class="${x.v != null && !used.has(x.n) && r.final ? 'drop' : x.v != null && used.has(x.n) ? 'hit' : ''}"><td>CT-${x.n}</td><td>${x.state === 'done' ? `${f2(Number(x.c.score))} / ${esc(x.c.outOf || 20)}` : x.state === 'abs' ? 'Absent' : x.state === 'sched' ? 'Not taken yet' : '—'}</td><td class="num">${x.v != null ? f2(x.v) : '—'}</td><td>${x.v == null ? '' : used.has(x.n) ? (r.final ? 'counted' : 'so far') : 'dropped'}</td></tr>`).join('');
    const formula = r.best.length ? `(${r.best.map((x) => f2(x.v)).join(' + ')}) ÷ ${r.best.length} = <b>${f2(r.avg)}</b>` : '';
    const need = !r.final && r.taken === 3 ? (() => { const s = [...r.best].sort((a, b) => a.v - b.v); return `<p class="small muted" style="margin:10px 0 0">CT-4 will replace your lowest (${f2(s[0].v)}/20) only if you score more than that.</p>`; })() : '';
    openSheet(`<h3>${r.final ? 'CT average' : 'CT breakdown'}</h3><p class="muted small"><span class="mono">${esc(code)}</span> · ${esc(c.title)}</p>
      <div class="card" style="margin-top:12px;padding:6px 8px"><table class="ruletable"><tr><th>CT</th><th>Marks</th><th>Out of 20</th><th></th></tr>${rows}</table></div>
      <div class="card" style="margin-top:10px"><div class="small muted">${r.final ? 'Best 3 of 4 (syllabus §14.1, class tests = 20 marks)' : `${r.taken} of 4 CTs done — the final average appears after all 4`}</div>
        <div class="row" style="margin-top:6px;align-items:baseline"><span class="marks" style="font-size:40px;color:${r.final ? 'var(--accent)' : 'var(--text)'}">${r.taken ? f2(r.avg) : '–'}<small> / 20</small></span></div>
        ${formula ? `<div class="small muted num" style="margin-top:8px">${formula}</div>` : ''}${need}
        <p class="small faint" style="margin:10px 0 0">An absent CT counts as 0. Marks given out of something other than 20 are scaled to 20 first.</p></div>
      <div class="acts"><button class="btn primary" data-act="close-sheet">Done</button></div>`);
  }
  function labPanel(code, n = 0) {
    const list = (S().labtests || []).filter((x) => x.code === code).sort((a, b) => (a.iso || '9').localeCompare(b.iso || '9'));
    if (!list.length) return `<div class="card empty" style="--i:${n};padding:20px"><div class="small">No lab tests yet. Add one as soon as it's announced — you'll get a reminder the evening before.</div></div>`;
    const scored = list.filter(hasScore), tot = scored.reduce((a, x) => a + Number(x.score), 0), out = scored.reduce((a, x) => a + Number(x.outOf || 0), 0);
    return `<div class="card" style="--i:${n};padding:6px 16px">${list.map((x) => { const d = x.iso ? parseISO(x.iso) : null; const past = d && d < startOfDay(now());
      return `<div class="lt-row" data-act="lt-edit" data-id="${x.id}"><div><b>${esc(labLabel(x))}</b><div class="small muted">${d ? fmtD(d) : 'No date'}${x.p ? ` · ${fmt12(R.periods[x.p - 1].start)}` : ''}${x.note ? ` · ${esc(x.note)}` : ''}</div></div>
        <div>${x.absent ? '<span class="tag bad">Absent</span>' : hasScore(x) ? `<span class="score">${f2(Number(x.score))}<small>/${esc(x.outOf || '')}</small></span>` : past ? '<span class="tag warn">add marks</span>' : d ? `<span class="countdown">${daysUntil(d) === 0 ? 'Today' : `in ${daysUntil(d)}d`}</span>` : ''}</div></div>`; }).join('')}
      ${scored.length ? `<div class="ct-foot"><span class="small muted">Total of marked tests</span><span class="sp"></span><span class="score">${f2(tot)}<small>/${f2(out)}</small></span></div>` : ''}</div>`;
  }
  function testCard(c0, n) {
    const c = { ...c0, date: parseISO(c0.iso) }, past = c.date < startOfDay(now()), du = daysUntil(c.date), lab = c.kind === 'lab';
    const period = c.p ? R.periods[c.p - 1] : null;
    const res = c.absent ? '<span class="tag bad">Absent</span>' : hasScore(c) ? `<span class="score">${f2(Number(c.score))}<small>/${esc(c.outOf || 20)}</small></span>` : past ? '<span class="tag warn">add marks</span>' : `<span class="countdown">${du === 0 ? 'Today' : du === 1 ? 'Tomorrow' : `in ${du} days`}</span>`;
    return `<div class="card ct-card ${past ? 'past' : ''}" style="--i:${n}" data-act="${lab ? 'lt-edit' : 'ct-edit'}" data-id="${c.id}">
      <div class="ct-date ${lab ? 'lab' : ''}"><span>${MONTHS[c.date.getMonth()]}</span><b>${c.date.getDate()}</b><span>${WD[c.date.getDay()]}</span></div>
      <div><div class="row"><b class="mono small" style="color:${colorOf(c.code)}">${esc(c.code)}</b><span class="tag ${lab ? 'lab' : 'ct'}">${lab ? esc(labLabel(c)) : `CT-${c.num}`}</span><span class="sp"></span>${res}</div>
      <div class="small muted" style="margin:3px 0 4px">${esc(shortTitle(courseInfo(c.code).title))} · Week ${weekOf(c.date)}${period ? ` · ${fmt12(period.start)}` : ''}</div>
      ${c.topics && c.topics.length ? `<div class="chips">${c.topics.map((x) => `<span class="tag">${esc(x)}</span>`).join('')}</div>` : ''}
      ${c.note ? `<div class="small" style="margin-top:4px">${esc(c.note)}</div>` : ''}</div></div>`;
  }
  const ctCard = (c, n) => testCard({ ...c, kind: 'ct' }, n);
  function viewTests() {
    const sem = S(), tab = ui.testsTab;
    const up = upcomingTests(sem).filter((x) => (tab === 'ct' ? x.kind === 'ct' : x.kind === 'lab'));
    const courses = tab === 'ct' ? theoryCourses(sem) : labCourses(sem);
    const head = (c, n) => `<div class="ctc-head" style="--cc:${colorOf(c)};--i:${n};margin:22px 2px 8px"><span class="cc">${esc(c)}</span><span class="tt sp">${esc(courseInfo(c).title)}</span>${tab === 'lab' ? `<button class="btn sm" data-act="lt-new" data-code="${esc(c)}">${ic('plus')}</button>` : ''}</div>`;
    return `<h1 class="page-title">Tests</h1><p class="page-sub">${tab === 'ct' ? 'Four class tests per theory course — the best 3 count for 20 marks. Tap a box to schedule a CT, enter marks or mark yourself absent.' : 'Lab tests, quizzes, lab finals and vivas for your sessional courses. Add one when it is announced.'}</p>
      <div class="seg" style="margin-bottom:6px"><button class="${tab === 'ct' ? 'on' : ''}" data-act="ttab" data-v="ct">Class tests</button><button class="${tab === 'lab' ? 'on' : ''}" data-act="ttab" data-v="lab">Lab tests</button></div>
      <div class="stagger">
      ${up.length ? `<h2 class="sec" style="--i:0">Coming up</h2>${up.map((c, i) => testCard(c, i + 1)).join('')}` : ''}
      ${courses.length ? courses.map((c, i) => head(c, i * 2 + 3) + (tab === 'ct' ? ctPanel(c, i * 2 + 4) : labPanel(c, i * 2 + 4))).join('') : `<div class="card empty" style="--i:1;margin-top:14px"><div class="big">${ic('file', '')}</div><div>No ${tab === 'ct' ? 'theory' : 'sessional'} courses in this semester yet.</div></div>`}
      </div><div style="height:64px"></div>
      <button class="fab" data-act="${tab === 'ct' ? 'ct-new' : 'lt-new'}" aria-label="Add">${ic('plus', '')}</button>`;
  }

  /* CT editor */
  const ctDraft = {};
  function ctSheet({ id = null, code = null, key = null, num = null } = {}) {
    const sem = S();
    const existing = id ? sem.cts.find((c) => c.id === id) : key ? sem.cts.find((c) => c.instKey === key) : code && num ? sem.cts.find((c) => c.code === code && Number(c.num) === Number(num)) : null;
    const codes = theoryCourses(sem);
    if (!codes.length) { toast('No theory courses in this semester yet', '!'); return; }
    for (const k of Object.keys(ctDraft)) if (!k.startsWith('_')) delete ctDraft[k];
    Object.assign(ctDraft, existing ? JSON.parse(JSON.stringify(existing)) : { id: null, code: code && codes.includes(code) ? code : code || codes[0], num, instKey: key, iso: null, topics: [], note: '', score: '', outOf: 20, absent: false });
    ctDraft.res = ctDraft.absent ? 'abs' : hasScore(ctDraft) ? 'marks' : 'none';
    if (!existing && key) ctDraft.week = weekOf(parseISO(key.split('|')[0]));
    if (!ctDraft.week) ctDraft.week = ctDraft.iso ? weekOf(parseISO(ctDraft.iso)) : Math.min(Math.max(weekOf(now()), 1), sem.weeks);
    if (ctDraft.num == null) { const taken = sem.cts.filter((c) => c.code === ctDraft.code).map((c) => Number(c.num)); ctDraft.num = [1, 2, 3, 4].find((n) => !taken.includes(n)) || 4; }
    drawCtSheet();
  }
  function drawCtSheet() {
    const sem = S(), d = ctDraft, c = courseInfo(d.code), codes = theoryCourses(sem);
    if (!codes.includes(d.code)) codes.unshift(d.code);
    const slots = allInstances(sem, d.code).filter((i) => i.week === Number(d.week));
    const topics = (c.topics || []).filter((x) => x.t);
    openSheet(`<h3>${d.id ? `Edit CT-${d.num}` : 'Class test'}</h3><p class="muted small">Schedule it from your routine, and add your marks after the test.</p>
      <label class="f">Course</label><select class="in" data-ct="code">${codes.map((x) => `<option value="${esc(x)}" ${x === d.code ? 'selected' : ''}>${esc(x)} — ${esc(courseInfo(x).title)}</option>`).join('')}</select>
      <label class="f">CT number</label><div class="seg">${[1, 2, 3, 4].map((n) => `<button class="${n === Number(d.num) ? 'on' : ''}" data-act="ct-num" data-v="${n}">CT-${n}</button>`).join('')}</div>
      <label class="f">When</label>
      <div class="row" style="gap:8px"><select class="in" data-ct="week" style="flex:1">${Array.from({ length: sem.weeks }, (_, i) => `<option value="${i + 1}" ${i + 1 === Number(d.week) ? 'selected' : ''}>Week ${i + 1}</option>`).join('')}</select></div>
      <div class="chips" style="margin-top:8px"><button class="chip ${!d.instKey ? 'on' : ''}" data-act="ct-slot" data-k="">No date</button>${slots.map((i) => `<button class="chip ${d.instKey === i.key ? 'on' : ''}" data-act="ct-slot" data-k="${i.key}">${fmtD(i.date)}<br><span class="small muted">${fmt12(slotStart(i.slot))}</span></button>`).join('')}</div>
      ${!slots.length ? '<p class="small muted" style="margin:6px 0 0">This course has no class in that week of your routine.</p>' : ''}
      <label class="f">Result</label><div class="seg">${[['none', 'Not taken yet'], ['marks', 'Got marks'], ['abs', 'Absent']].map(([v, l]) => `<button class="${d.res === v ? 'on' : ''}" data-act="ct-res" data-v="${v}">${l}</button>`).join('')}</div>
      ${d.res === 'marks' ? `<div class="grid2" style="grid-template-columns:1fr 1fr;gap:10px"><div><label class="f">Your marks</label><input class="in" type="number" inputmode="decimal" min="0" step="0.5" data-ct="score" value="${esc(d.score)}" placeholder="e.g. 17"></div><div><label class="f">Out of</label><input class="in" type="number" inputmode="decimal" min="1" data-ct="outOf" value="${esc(d.outOf || 20)}"></div></div>` : ''}
      ${d.res === 'abs' ? '<p class="small muted" style="margin:8px 0 0">An absent CT counts as 0 — if it is your lowest, it is the one dropped from the best 3.</p>' : ''}
      ${topics.length ? `<label class="f">Syllabus topics</label><div class="chips">${topics.map((x) => `<button class="chip ${d.topics.includes(x.t) ? 'on' : ''}" data-act="ct-topic" data-v="${esc(x.t)}">${esc(x.t)}</button>`).join('')}</div>` : ''}
      <label class="f">Notes</label><input class="in" data-ct="note" value="${esc(d.note)}" placeholder="e.g. Fourier series, closed book">
      <div class="acts">${d.id ? `<button class="btn danger" data-act="ct-del">Delete</button>` : ''}<button class="btn primary" data-act="ct-save">Save</button></div>`);
  }
  function saveCt() {
    const sem = S(), d = ctDraft;
    if (d.res === 'marks') { const v = Number(d.score), o = Number(d.outOf) || 20; if (d.score === '' || isNaN(v)) { toast('Enter your marks', '!'); return false; } if (v < 0 || v > o) { toast(`Marks must be between 0 and ${o}`, '!'); return false; } }
    if (!d.instKey && d.res === 'none' && !d.id) { toast('Pick the class of the CT, or add your marks', '!'); return false; }
    const dup = sem.cts.find((c) => c.code === d.code && Number(c.num) === Number(d.num) && c.id !== d.id);
    if (dup) { toast(`${d.code} already has CT-${d.num} — tap its box to edit`, '!'); return false; }
    let iso = null, p = null;
    if (d.instKey) { const [dIso, slotId] = d.instKey.split('|'); const slot = sem.routine[dayKeyOfDate(parseISO(dIso))]?.find((x) => x.id === slotId); iso = dIso; p = slot ? slot.p : null;
      const other = sem.cts.find((c) => c.instKey === d.instKey && c.id !== d.id); if (other) { toast(`That class already has ${other.code} CT-${other.num}`, '!'); return false; } }
    const rec = { id: d.id || uid(), code: d.code, num: Number(d.num), instKey: d.instKey || null, iso, p, topics: d.topics || [], note: d.note || '', score: d.res === 'marks' ? Number(d.score) : '', outOf: Number(d.outOf) || 20, absent: d.res === 'abs' };
    const i = sem.cts.findIndex((c) => c.id === rec.id); if (i >= 0) sem.cts[i] = rec; else sem.cts.push(rec);
    save(); closeSheet(); softRefresh();
    const r = ctResult(rec.code);
    toast(r.final ? `${rec.code}: all 4 CTs done — average ${f2(r.avg)}/20` : `CT-${rec.num} for ${rec.code} saved`, '📝');
    return true;
  }

  /* Lab test editor */
  const ltDraft = {};
  function ltSheet({ id = null, code = null, key = null } = {}) {
    const sem = S(), list = sem.labtests || (sem.labtests = []);
    const existing = id ? list.find((c) => c.id === id) : key ? list.find((c) => c.instKey === key) : null;
    const codes = labCourses(sem);
    if (!codes.length && !code) { toast('No sessional courses in this semester yet', '!'); return; }
    for (const k of Object.keys(ltDraft)) delete ltDraft[k];
    Object.assign(ltDraft, existing ? JSON.parse(JSON.stringify(existing)) : { id: null, code: code || codes[0], type: 'Lab test', num: '', instKey: key, iso: null, note: '', score: '', outOf: '', absent: false });
    ltDraft.res = ltDraft.absent ? 'abs' : hasScore(ltDraft) ? 'marks' : 'none';
    ltDraft.week = ltDraft.instKey ? weekOf(parseISO(ltDraft.instKey.split('|')[0])) : ltDraft.iso ? weekOf(parseISO(ltDraft.iso)) : Math.min(Math.max(weekOf(now()), 1), sem.weeks);
    ltDraft.custom = !!(ltDraft.iso && !ltDraft.instKey);
    drawLtSheet();
  }
  function drawLtSheet() {
    const sem = S(), d = ltDraft, codes = labCourses(sem);
    if (!codes.includes(d.code)) codes.unshift(d.code);
    const slots = allInstances(sem, d.code).filter((i) => i.week === Number(d.week));
    openSheet(`<h3>${d.id ? 'Edit lab test' : 'Lab test'}</h3><p class="muted small">Add it when it's announced — you'll get a reminder the evening before and on the morning of the test.</p>
      <label class="f">Sessional course</label><select class="in" data-lt="code">${codes.map((x) => `<option value="${esc(x)}" ${x === d.code ? 'selected' : ''}>${esc(x)} — ${esc(courseInfo(x).title)}</option>`).join('')}</select>
      <label class="f">Type</label><div class="chips">${LAB_TYPES.map((t) => `<button class="chip ${d.type === t ? 'on' : ''}" data-act="lt-type" data-v="${t}">${t}</button>`).join('')}</div>
      <label class="f">Number (optional)</label><select class="in" data-lt="num"><option value="">—</option>${[1, 2, 3, 4, 5].map((n) => `<option ${String(d.num) === String(n) ? 'selected' : ''}>${n}</option>`).join('')}</select>
      <label class="f">When</label>
      <div class="seg"><button class="${!d.custom ? 'on' : ''}" data-act="lt-mode" data-v="slot">From routine</button><button class="${d.custom ? 'on' : ''}" data-act="lt-mode" data-v="date">Pick a date</button></div>
      ${d.custom ? `<input class="in" type="date" data-lt="iso" style="margin-top:8px" value="${esc(d.iso || iso(now()))}">` : `
      <select class="in" data-lt="week" style="margin-top:8px">${Array.from({ length: sem.weeks }, (_, i) => `<option value="${i + 1}" ${i + 1 === Number(d.week) ? 'selected' : ''}>Week ${i + 1}</option>`).join('')}</select>
      <div class="chips" style="margin-top:8px">${slots.length ? slots.map((i) => `<button class="chip ${d.instKey === i.key ? 'on' : ''}" data-act="lt-slot" data-k="${i.key}">${fmtD(i.date)}<br><span class="small muted">${fmt12(slotStart(i.slot))} – ${fmt12(slotEnd(i.slot))}</span></button>`).join('') : '<span class="small muted">No lab of this course in that week — pick a date instead.</span>'}</div>`}
      <label class="f">Result</label><div class="seg">${[['none', 'Not taken yet'], ['marks', 'Got marks'], ['abs', 'Absent']].map(([v, l]) => `<button class="${d.res === v ? 'on' : ''}" data-act="lt-res" data-v="${v}">${l}</button>`).join('')}</div>
      ${d.res === 'marks' ? `<div class="grid2" style="grid-template-columns:1fr 1fr;gap:10px"><div><label class="f">Your marks</label><input class="in" type="number" inputmode="decimal" min="0" step="0.5" data-lt="score" value="${esc(d.score)}"></div><div><label class="f">Out of</label><input class="in" type="number" inputmode="decimal" min="1" data-lt="outOf" value="${esc(d.outOf)}" placeholder="e.g. 10"></div></div>` : ''}
      <label class="f">Notes</label><input class="in" data-lt="note" value="${esc(d.note)}" placeholder="e.g. Experiments 1–5, bring lab copy">
      <div class="acts">${d.id ? `<button class="btn danger" data-act="lt-del">Delete</button>` : ''}<button class="btn primary" data-act="lt-save">Save</button></div>`);
  }
  function saveLt() {
    const sem = S(), d = ltDraft, list = sem.labtests;
    if (d.res === 'marks') { const v = Number(d.score); if (d.score === '' || isNaN(v) || v < 0) { toast('Enter your marks', '!'); return false; } if (d.outOf !== '' && v > Number(d.outOf)) { toast('Marks are more than the total', '!'); return false; } }
    let iso = null, p = null, instKey = null;
    if (d.custom) iso = d.iso || null;
    else if (d.instKey) { const [dIso, slotId] = d.instKey.split('|'); const slot = sem.routine[dayKeyOfDate(parseISO(dIso))]?.find((x) => x.id === slotId); iso = dIso; p = slot ? slot.p : null; instKey = d.instKey; }
    if (!iso && d.res === 'none') { toast('Pick when the lab test is', '!'); return false; }
    const rec = { id: d.id || uid(), code: d.code, type: d.type || 'Lab test', num: d.num ? Number(d.num) : '', instKey, iso, p, note: d.note || '', score: d.res === 'marks' ? Number(d.score) : '', outOf: d.outOf === '' ? '' : Number(d.outOf), absent: d.res === 'abs' };
    const i = list.findIndex((c) => c.id === rec.id); if (i >= 0) list[i] = rec; else list.push(rec);
    save(); closeSheet(); softRefresh(); toast(`${labLabel(rec)} for ${rec.code} saved`, '📝');
    return true;
  }

  /* Teachers of a course (course page) */
  function teacherCards(code, n = 0) {
    const list = courseTeachers(code); if (!list.length) return '';
    return `<h2 class="sec" style="--i:${n}">Teachers</h2><div class="card" style="--i:${n + 1};padding:4px 16px">${list.map((t) => facRow(t.fac || { name: t.name, desig: '' }, t.ini)).join('')}</div>`;
  }

  /* ---------------- Syllabus ---------------- */
  function viewSyllabus() {
    const sem = S();
    if (!ui.sylTab) ui.sylTab = sem.level;
    const tabs = [...LEVELS, 'Electives'];
    const q = ui.sylQ.trim().toLowerCase();
    let codes;
    if (q) codes = Object.keys(SY.courses).filter((k) => { const c = SY.courses[k]; return (k + ' ' + c.title + ' ' + c.topics.map((t) => t.t + ' ' + t.c).join(' ')).toLowerCase().includes(q); });
    else codes = ui.sylTab === 'Electives' ? null : SY.plan[ui.sylTab] || [];
    const card = (k, i) => { const c = SY.courses[k]; const prev = c.topics.map((t) => t.t || t.c).join(' · '); return `<div class="card course-card" style="--i:${i};--cc:${colorOf(k)}" data-act="go" data-to="syl" data-arg="${esc(k)}">
      <div class="row"><span class="code">${esc(k)}</span><span class="sp"></span>${c.sessional ? '<span class="tag info">Sessional</span>' : '<span class="tag">Theory</span>'}<span class="tag">${esc(c.credits)} cr</span></div>
      <div class="title">${hl(c.title, q)}</div><div class="preview">${hl(prev, q)}</div></div>`; };
    let body;
    if (codes) body = codes.length ? `<div class="grid2 stagger">${codes.map(card).join('')}</div>` : `<div class="card empty">Nothing matches “${esc(ui.sylQ)}”.</div>`;
    else body = Object.entries(SY.electives).map(([g, list], gi) => `<h2 class="sec">${esc(g)}</h2><div class="grid2 stagger">${list.map((k, i) => card(k, i + gi)).join('')}</div>`).join('');
    return `<button class="btn sm ghost" data-act="go" data-to="more" style="margin-top:6px;padding-left:4px">${ic('back')} More</button><h1 class="page-title">Syllabus</h1><p class="page-sub">RUET EEE · 2024 syllabus. Tap any course for its full outline.</p>
      <div class="search"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><input class="in" id="sylQ" placeholder="Search course, code or topic (e.g. Laplace, FPGA)" value="${esc(ui.sylQ)}" autocomplete="off"></div>
      ${q ? `<p class="small muted">${codes.length} result${codes.length === 1 ? '' : 's'}</p>` : `<div class="seg" style="margin-bottom:14px">${tabs.map((t) => `<button class="${ui.sylTab === t ? 'on' : ''}" data-act="syltab" data-v="${t}">${t}${t === sem.level ? ' •' : ''}</button>`).join('')}</div>`}
      <div id="sylBody">${body}</div>
      ${!q ? marksDistCard() : ''}`;
  }
  const hl = (text, q) => { const e = esc(text); if (!q) return e; const i = e.toLowerCase().indexOf(esc(q)); return i < 0 ? e : `${e.slice(0, i)}<mark>${e.slice(i, i + esc(q).length)}</mark>${e.slice(i + esc(q).length)}`; };
  function marksDistCard() {
    const th = [['Class participation & attendance', 10], ['Class tests (best 3 of 4)', 20], ['Assignment / project / viva / presentation', 10], ['Semester final (3 hours)', 60]];
    const se = [['Class participation & attendance', 10], ['Quizzes', 20], ['Lab performance, report, lab final, viva', 45], ['Board viva (compulsory)', 25]];
    const blk = (title, rows) => `<div class="card"><b>${title}</b><div class="dist" style="margin-top:10px">${rows.map(([l, v]) => `<div class="r"><span class="small">${l}</span><b class="num small">${v}</b><div class="bar"><i data-v="${v}"></i></div></div>`).join('')}</div></div>`;
    return `<h2 class="sec">Marks distribution (§14.1)</h2><div class="grid2">${blk('Theory course', th)}${blk('Sessional course', se)}</div><p class="small muted" style="margin-top:8px">Pass requirement for theory: at least 15 of 60 in the semester final.</p>`;
  }
  function viewSyllabusCourse(code) {
    const c = SY.courses[code] || courseInfo(code); if (!c) return viewSyllabus();
    const sem = S(), inSem = scheduledCourses(sem).includes(code);
    const pair = code.replace(/(\d{3})(\d)$/, (m, a, b) => a + (Number(b) % 2 ? Number(b) + 1 : Number(b) - 1));
    const related = SY.courses[pair] ? pair : null;
    const topics = c.topics.length ? c.topics : [{ t: '', c: 'No details listed.' }];
    const st = inSem ? stats(code, sem) : null;
    return `<button class="btn sm ghost" data-act="back" style="margin-top:6px;padding-left:4px">${ic('back')} Back</button>
      <div class="stagger" style="--cc:${colorOf(code)}">
      <div style="--i:0"><div class="row" style="margin-top:12px"><span class="tag" style="color:${colorOf(code)}">${esc(code)}</span>${c.sessional ? '<span class="tag info">Sessional</span>' : '<span class="tag">Theory</span>'}</div>
      <h1 class="page-title">${esc(c.title)}</h1>
      <p class="page-sub">Contact ${esc(c.contact)} hrs/week · ${esc(c.credits)} credits${Object.entries(SY.plan).filter(([, l]) => l.includes(code)).map(([k]) => ` · ${k} semester`).join('')}</p></div>
      ${st ? `<div class="card row" style="--i:1;cursor:pointer" data-act="go" data-to="course" data-arg="${esc(code)}">${ring(st.pct, toneFor(st.marks), `${Math.round(st.pct)}%`, 'attend')}<div class="sp"><b>Your attendance</b><div class="small muted">${st.Ae} absent · ${st.marks}/10 marks · ${Math.max(0, st.left90)} more misses allowed</div></div><span class="faint">›</span></div>` : ''}
      <h2 class="sec" style="--i:2">Course outline · ${topics.length} part${topics.length > 1 ? 's' : ''}<span class="sp"></span><button class="btn sm" data-act="acc-all">Expand all</button></h2>
      <div style="--i:3">${topics.map((t, i) => `<details class="acc" ${topics.length === 1 ? 'open' : ''}><summary><span class="n">${i + 1}</span><span>${esc(t.t || (c.sessional ? 'Lab content' : 'Content'))}</span><svg class="chev" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg></summary><div class="body"><ul>${splitItems(t.c).map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div></details>`).join('')}</div>
      ${related ? `<div class="card row" style="--i:4;margin-top:14px;cursor:pointer" data-act="go" data-to="syl" data-arg="${esc(related)}"><span class="tag">${esc(related)}</span><b class="sp">${esc(SY.courses[related].title)}</b><span class="faint">›</span></div>` : ''}
      <div style="--i:5">${marksDistCard()}</div></div>`;
  }
  function splitItems(s) {
    // split by commas/semicolons that are outside parentheses, keep it readable
    const out = []; let depth = 0, cur = '';
    for (const ch of s) { if (ch === '(') depth++; if (ch === ')') depth--; if ((ch === ',' || ch === ';') && depth <= 0) { if (cur.trim()) out.push(cur.trim()); cur = ''; } else cur += ch; }
    if (cur.trim()) out.push(cur.trim().replace(/\.$/, ''));
    return out.length > 1 ? out : [s];
  }

  /* ---------------- More hub ---------------- */
  function viewMore() {
    const sem = S();
    const tiles = [
      ['go:syllabus', 'book', 'Syllabus', 'Every EEE course, 1-1 to 4-2, with full outlines'],
      ['go:faculty', 'users', 'Faculty', 'Names, designations, fields and emails'],
      ['go:cover', 'cover', 'Lab report cover', 'RUET cover page as a PDF in seconds'],
      ['act:sem-sheet', 'layers', 'Semesters', `${Object.keys(state.semesters).length} saved · switch or start next`],
      ['go:settings', 'settings', 'Settings', 'Reminders, location, account, backup'],
      ['act:export-ics', 'calendar', 'Phone calendar', 'Export this semester as .ics'],
    ];
    return `<h1 class="page-title">More</h1><p class="page-sub">${esc(sem.label)}${sem.section ? ` · Section ${esc(sem.section)}` : ''} · RUET EEE</p>
      <div class="tiles stagger">${tiles.map(([to, icn, t, d], i) => { const [k, v] = to.split(':'); return `<button class="tile" style="--i:${i}" ${k === 'go' ? `data-act="go" data-to="${v}"` : `data-act="${v}"`}><span class="ti">${ic(icn, '')}</span><b>${t}</b><span>${d}</span></button>`; }).join('')}</div>
      <h2 class="sec">Your details</h2>${profileCard()}`;
  }
  function profileCard() {
    const p = state.profile, sem = S();
    return `<div class="card"><p class="small muted" style="margin:0 0 4px">Used on lab report covers — type them once.</p>
      <label class="f">Full name</label><input class="in" data-prof="name" value="${esc(p.name)}" placeholder="e.g. Shohanul Islam" autocomplete="name">
      <div class="grid2" style="grid-template-columns:1fr 1fr;gap:10px"><div><label class="f">Roll</label><input class="in" data-prof="roll" inputmode="numeric" value="${esc(p.roll)}" placeholder="e.g. 2401001"></div>
      <div><label class="f">Section</label><input class="in" data-prof="section" value="${esc(p.section || sem.section || '')}" placeholder="A / B / C"></div></div></div>`;
  }

  /* ---------------- Faculty directory ---------------- */
  const avatarColor = (name) => PALETTE[[...String(name)].reduce((a, c) => a + c.charCodeAt(0), 0) % PALETTE.length];
  function facRow(f, ini = '', codes = null) {
    return `<button class="fac" data-act="fac-open" data-name="${esc(f.name)}"><span class="avatar" style="--ac:${avatarColor(f.name)}">${esc(initialsOfName(f.name))}</span>
      <span style="min-width:0"><div class="nm">${esc(f.name)}</div><div class="ds">${esc(f.desig || 'Designation not listed')}${f.dept ? ` · ${esc(f.dept)}` : ''}${f.leave ? ' · <span style="color:var(--warn)">on leave</span>' : ''}</div>${f.field ? `<div class="fd">${esc(f.field)}</div>` : ''}${codes ? `<div class="fd mono">${esc(codes)}</div>` : ''}</span>
      ${ini ? `<span class="tag mono">${esc(ini)}</span>` : ic('chev')}</button>`;
  }
  function myTeachers(sem = S()) {
    const m = new Map();
    for (const d of R.days) for (const s of sem.routine[d.key]) for (const t of teachersOf(s.teacher)) {
      if (!m.has(t.name)) m.set(t.name, { t, codes: new Set() }); m.get(t.name).codes.add(s.code);
    }
    return [...m.values()];
  }
  function viewFaculty() {
    const q = ui.facQ.trim().toLowerCase(), all = facultyAll();
    const match = (f) => !q || `${f.name} ${f.desig} ${f.field} ${f.email || ''} ${f.ini || ''} ${f.dept || ''}`.toLowerCase().includes(q);
    const mine = myTeachers().filter(({ t }) => match(t.fac || { name: t.name }));
    const groups = [...DESIGS, ''].map((d) => [d, all.filter((f) => (d ? f.desig === d : !DESIGS.includes(f.desig)) && match(f))]).filter(([, l]) => l.length);
    const count = groups.reduce((a, [, l]) => a + l.length, 0);
    return `<button class="btn sm ghost" data-act="back" style="margin-top:6px;padding-left:4px">${ic('back')} Back</button>
      <h1 class="page-title">Faculty</h1><p class="page-sub">Department of EEE, RUET · from the 2024 syllabus · ${all.length} teachers</p>
      <div class="search">${ic('search', '')}<input class="in" id="facQ" placeholder="Search name, designation, field or initials" value="${esc(ui.facQ)}" autocomplete="off"></div>
      <div class="stagger">
      ${mine.length ? `<h2 class="sec" style="--i:0">Teaching you in ${esc(S().level)}</h2><div class="card" style="--i:1;padding:2px 16px">${mine.map(({ t, codes }) => facRow(t.fac || { name: t.name, desig: '' }, t.ini, [...codes].join(' · '))).join('')}</div>` : ''}
      ${groups.map(([d, l], gi) => `<h2 class="sec" style="--i:${gi * 2 + 2}">${esc(d || 'Other')}<span class="sp"></span><span class="faint" style="letter-spacing:0">${l.length}</span></h2><div class="card" style="--i:${gi * 2 + 3};padding:2px 16px">${l.map((f) => facRow(f)).join('')}</div>`).join('')}
      ${!count && !mine.length ? `<div class="card empty">Nobody matches “${esc(ui.facQ)}”.</div>` : ''}
      <div class="row" style="margin-top:16px"><button class="btn block" data-act="fac-add">${ic('plus')} Add a teacher</button></div>
      <p class="small faint" style="margin-top:10px">Teachers marked “on leave” were on leave when the syllabus was printed. Tap anyone to see details or fix a designation.</p></div>`;
  }
  function facSheet(name) {
    const f = facultyAll().find((x) => x.name === name); if (!f) return;
    const teaches = myTeachers().find(({ t }) => t.name === f.name);
    openSheet(`<div class="row"><span class="avatar" style="--ac:${avatarColor(f.name)};width:52px;height:52px;font-size:17px">${esc(initialsOfName(f.name))}</span><div class="sp"><h3 style="margin:0">${esc(f.name)}</h3><div class="muted small">${esc(f.desig || 'Designation not listed')}${f.dept ? ` · ${esc(f.dept)}` : ' · EEE, RUET'}</div></div></div>
      <div class="card" style="margin-top:14px">
        ${f.field ? `<div class="set-row"><div class="t"><span>Field</span><b>${esc(f.field)}</b></div></div>` : ''}
        ${f.degrees ? `<div class="set-row"><div class="t"><span>Education</span><b style="font-weight:500">${esc(f.degrees)}</b></div></div>` : ''}
        ${f.email ? `<div class="set-row"><div class="t"><span>Email</span><b style="font-weight:500;word-break:break-all">${esc(f.email)}</b></div><a class="btn sm" href="mailto:${esc(f.email)}">${ic('mail')} Email</a></div>` : ''}
        ${teaches ? `<div class="set-row"><div class="t"><span>Teaches you</span><b class="mono">${esc([...teaches.codes].join(' · '))} (${esc(teaches.t.ini)})</b></div></div>` : ''}
        ${f.leave ? '<div class="set-row"><div class="t"><b style="color:var(--warn)">On leave (as of the 2024 syllabus)</b></div></div>' : ''}
        <div class="set-row"><div class="t"><b>Designation</b><span>Fix it if it has changed</span></div><select class="in" id="facDesig" data-name="${esc(f.name)}" style="width:190px">${['', ...DESIGS].map((d) => `<option value="${d}" ${d === (f.desig || '') ? 'selected' : ''}>${d || 'Not listed'}</option>`).join('')}</select></div>
      </div>
      <div class="acts">${f.custom ? `<button class="btn danger" data-act="fac-del" data-name="${esc(f.name)}">Remove</button>` : ''}<button class="btn" data-act="cover-with" data-name="${esc(f.name)}">${ic('cover')} Cover page</button><button class="btn primary" data-act="close-sheet">Done</button></div>`);
  }
  function facAddSheet() {
    openSheet(`<h3>Add a teacher</h3><p class="muted small">For teachers not in the syllabus list (new faculty, other departments). Initials let the routine show their full name.</p>
      <label class="f">Full name</label><input class="in" id="faName" placeholder="e.g. Md. Rakibul Islam">
      <label class="f">Designation</label><select class="in" id="faDesig">${DESIGS.map((d) => `<option>${d}</option>`).join('')}<option value="">Not sure</option></select>
      <div class="grid2" style="grid-template-columns:1fr 1fr;gap:10px"><div><label class="f">Initials in routine</label><input class="in" id="faIni" placeholder="e.g. RI"></div><div><label class="f">Department</label><input class="in" id="faDept" placeholder="EEE"></div></div>
      <label class="f">Email (optional)</label><input class="in" id="faEmail" type="email">
      <div class="acts"><button class="btn primary" data-act="fac-save">Add</button></div>`);
  }

  /* ---------------- Lab report cover page (RUET format) ---------------- */
  const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const longDate = (s) => { if (!s) return ''; const d = parseISO(s); return `${pad(d.getDate())} ${MONTHS_LONG[d.getMonth()]} ${d.getFullYear()}`; };
  const coverDraft = {};
  let jspdfP = null, logoP = null, metricsDoc = null;
  const loadJsPDF = () => jspdfP || (jspdfP = new Promise((res, rej) => {
    if (window.jspdf) return res(window.jspdf);
    const s = document.createElement('script'); s.src = 'js/vendor/jspdf.umd.min.js'; s.onload = () => res(window.jspdf); s.onerror = () => { jspdfP = null; rej(new Error('Could not load the PDF engine')); }; document.head.append(s);
  }));
  const loadLogo = () => logoP || (logoP = fetch('img/ruet-logo.png').then((r) => r.blob()).then((b) => new Promise((res) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.readAsDataURL(b); })).catch((e) => { logoP = null; throw e; }));
  function labSessions(code, sem = S()) { return allInstances(sem, code).filter((i) => !sem.offDays.includes(i.iso) && statusOf(i, sem) !== 'C'); }
  function coverCourses(sem = S()) {
    const labs = labCourses(sem), used = new Set(labs);
    const otherLabs = Object.keys(SY.courses).filter((k) => SY.courses[k].sessional && !used.has(k));
    const theory = semCourses(sem).filter((c) => !courseInfo(c, sem).sessional);
    return [[`${sem.level} sessional`, labs], ['Theory (for assignments)', theory], ['Other sessional courses', otherLabs]].filter(([, l]) => l.length);
  }
  function coverInit(code = null, keepTeacher = null) {
    const sem = S(), groups = coverCourses(sem);
    const c = code || coverDraft.code || (groups[0] && groups[0][1][0]) || 'EEE 2214';
    const hist = state.covers.filter((x) => x.code === c), last = hist[hist.length - 1];
    const sess = labSessions(c, sem), end = addDays(startOfDay(now()), 1);
    const past = sess.filter((i) => i.start < end), lastSess = past[past.length - 1];
    const nextSess = lastSess ? sess.find((i) => i.start > lastSess.end) : null;
    const routineT = courseTeachers(c, sem).map((t) => (t.fac ? t.fac.name : t.name));
    Object.assign(coverDraft, {
      code: c, title: coverDraft.title || 'LAB Report',
      expNo: last ? Number(last.expNo) + 1 : Math.max(1, new Set(past.map((i) => i.week)).size), expName: '',
      teachers: keepTeacher ? [keepTeacher] : last && last.teachers && last.teachers.length ? last.teachers.slice() : routineT.slice(0, 1).length ? routineT.slice(0, 1) : [''],
      dateExp: lastSess ? lastSess.iso : iso(now()),
      dateSub: nextSess ? nextSess.iso : iso(addDays(lastSess ? lastSess.date : now(), 7)),
    });
  }
  function teacherOptions(selected, code) {
    const sem = S(), all = facultyAll(), routineT = courseTeachers(code, sem);
    const opt = (n, label) => `<option value="${esc(n)}" ${n === selected ? 'selected' : ''}>${esc(label || n)}</option>`;
    const rt = routineT.map((t) => t.fac ? t.fac.name : t.name);
    let html = rt.length ? `<optgroup label="Teaches ${esc(code)} (your routine)">${rt.map((n) => opt(n)).join('')}</optgroup>` : '';
    for (const d of [...DESIGS, '']) { const l = all.filter((f) => (d ? f.desig === d : !DESIGS.includes(f.desig)) && !rt.includes(f.name)); if (l.length) html += `<optgroup label="${esc(d || 'Other')}">${l.map((f) => opt(f.name)).join('')}</optgroup>`; }
    if (selected && !all.find((f) => f.name === selected) && !rt.includes(selected)) html = opt(selected) + html;
    return `<option value="">— Choose teacher —</option>${html}`;
  }
  function viewCover() {
    const sem = S(), d = coverDraft, p = state.profile;
    if (!d.code) coverInit();
    const hist = state.covers.filter((x) => x.code === d.code);
    const names = [...new Set(hist.map((x) => x.expName).filter(Boolean))];
    const sess = labSessions(d.code, sem).filter((i) => i.start < addDays(startOfDay(now()), 8)).slice(-6);
    const recent = state.covers.slice(-5).reverse();
    return `<button class="btn sm ghost" data-act="back" style="margin-top:6px;padding-left:4px">${ic('back')} Back</button>
      <h1 class="page-title">Lab report cover</h1><p class="page-sub">RUET EEE format. Pick the course, teacher and dates — only your name, roll and the experiment name are typed.</p>
      <div class="cover-layout"><div class="stagger">
        <div class="card" style="--i:0">
          <div class="seg">${['LAB Report', 'Assignment', 'Project Report'].map((t) => `<button class="${d.title === t ? 'on' : ''}" data-act="cv-title" data-v="${t}">${t}</button>`).join('')}</div>
          <label class="f">Course</label><select class="in" data-cv="code">${coverCourses(sem).map(([g, l]) => `<optgroup label="${esc(g)}">${l.map((c) => `<option value="${esc(c)}" ${c === d.code ? 'selected' : ''}>${esc(c)} — ${esc(courseInfo(c, sem).title)}</option>`).join('')}</optgroup>`).join('')}</select>
          <div class="row" style="gap:14px;align-items:flex-end"><div><label class="f">${d.title === 'LAB Report' ? 'Experiment No.' : 'No.'}</label><div class="stepper"><button data-act="cv-no" data-d="-1">−</button><div class="val" style="font-size:28px;min-width:44px">${pad(d.expNo)}</div><button data-act="cv-no" data-d="1">+</button></div></div></div>
          <label class="f">${d.title === 'LAB Report' ? 'Experiment name' : 'Topic'}</label><textarea class="in" data-cv="expName" rows="2" placeholder="e.g. Study of the characteristics of a DC shunt generator" style="resize:vertical">${esc(d.expName)}</textarea>
          ${names.length ? `<div class="chips" style="margin-top:8px">${names.slice(-4).map((n) => `<button class="chip small" data-act="cv-name" data-v="${esc(n)}">${esc(n.length > 42 ? n.slice(0, 40) + '…' : n)}</button>`).join('')}</div>` : ''}
        </div>
        <div class="card" style="--i:1"><b>Submitted to</b>
          ${d.teachers.map((t, i) => `<label class="f">Teacher${d.teachers.length > 1 ? ` ${i + 1}` : ''}${t ? ` · ${esc((facultyAll().find((f) => f.name === t) || {}).desig || 'designation not listed')}` : ''}</label><div class="row" style="gap:8px"><select class="in" data-cvt="${i}" style="flex:1">${teacherOptions(t, d.code)}</select>${i > 0 ? `<button class="icon-btn" data-act="cv-trem" data-i="${i}" aria-label="Remove">${ic('x', '')}</button>` : ''}</div>`).join('')}
          ${d.teachers.length < 2 ? `<button class="btn sm ghost" data-act="cv-tadd" style="margin-top:8px;padding-left:2px">${ic('plus')} Second teacher</button>` : ''}
        </div>
        <div class="card" style="--i:2"><b>Submitted by</b>
          <label class="f">Name</label><input class="in" data-prof="name" value="${esc(p.name)}" placeholder="Your full name" autocomplete="name">
          <div class="grid2" style="grid-template-columns:1fr 1fr;gap:10px"><div><label class="f">Roll</label><input class="in" data-prof="roll" inputmode="numeric" value="${esc(p.roll)}" placeholder="e.g. 2401001"></div><div><label class="f">Section</label><input class="in" data-prof="section" value="${esc(p.section || sem.section || '')}" placeholder="A / B / C"></div></div>
        </div>
        <div class="card" style="--i:3"><b>Dates</b>
          <label class="f">Date of experiment</label>
          ${sess.length ? `<div class="chips" style="margin-bottom:8px">${sess.map((i) => `<button class="chip ${d.dateExp === i.iso ? 'on' : ''}" data-act="cv-exp" data-v="${i.iso}">${fmtD(i.date)}</button>`).join('')}</div>` : ''}
          <input class="in" type="date" data-cv="dateExp" value="${esc(d.dateExp)}">
          <label class="f">Date of submission</label><input class="in" type="date" data-cv="dateSub" value="${esc(d.dateSub)}">
          <div class="chips" style="margin-top:8px">${[['Next lab', nextLabAfter(d.code, d.dateExp)], ['+7 days', iso(addDays(parseISO(d.dateExp || iso(now())), 7))], ['Today', iso(now())]].filter(([, v]) => v).map(([l, v]) => `<button class="chip ${d.dateSub === v ? 'on' : ''}" data-act="cv-sub" data-v="${v}">${l} · ${fmtD(parseISO(v))}</button>`).join('')}</div>
        </div>
        ${recent.length ? `<h2 class="sec" style="--i:4">Recent covers</h2><div class="card" style="--i:5;padding:4px 16px">${recent.map((x) => `<button class="lt-row" style="width:100%;text-align:left" data-act="cv-load" data-t="${x.t}"><div><b class="mono small">${esc(x.code)} · Exp ${pad(x.expNo)}</b><div class="small muted" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:62vw">${esc(x.expName || x.title)}</div></div>${ic('chev')}</button>`).join('')}</div>` : ''}
      </div>
      <div class="preview-col"><div class="a4-frame"><div class="a4" id="a4"><div class="a4-inner" id="a4i"></div><div class="a4-skel" id="a4skel">Preparing preview…</div></div></div>
        <div class="row" style="margin-top:12px"><button class="btn primary sp" data-act="cv-pdf">${ic('download')} ${NATIVE ? 'Save / share PDF' : 'Download PDF'}</button></div>
        <p class="small faint" style="margin-top:8px;text-align:center">A4 · Times New Roman · matches the RUET EEE lab report cover</p></div></div>`;
  }
  function nextLabAfter(code, isoDay) {
    if (!isoDay) return null; const d = parseISO(isoDay);
    const n = labSessions(code).find((i) => i.date > d); return n ? n.iso : null;
  }
  /** Layout of the cover in PDF points (A4 595.28 × 841.89), mirroring the RUET EEE sample. */
  function coverOps(doc) {
    const d = coverDraft, p = state.profile, sem = S(), c = courseInfo(d.code, sem), ops = [];
    const W = 595.28, dy = 22, L = 77, COL = 185, VAL = 199, MAXV = 520 - VAL;
    const font = (bold, size) => { doc.setFont('times', bold ? 'bold' : 'normal'); doc.setFontSize(size); };
    const text = (t, x, y, size, bold = false, align = 'left') => ops.push({ k: 't', t, x, y, size, bold, align });
    const wrap = (t, w, size, bold = false) => { font(bold, size); return doc.splitTextToSize(String(t || ''), w); };
    ops.push({ k: 'img', x: (W - 121) / 2, y: 52 + dy, w: 121, h: 147.8 });
    text('Department of Electrical & Electronic Engineering', W / 2, 223 + dy, 14, false, 'center');
    text('Rajshahi University of Engineering & Technology', W / 2, 250 + dy, 17, false, 'center');
    font(true, 15); const tw = doc.getTextWidth(d.title);
    text(d.title, W / 2, 300 + dy, 15, true, 'center'); ops.push({ k: 'r', x: W / 2 - tw / 2, y: 302.5 + dy, w: tw, h: 0.9 });
    let y = 328 + dy;
    const field = (label, value, bold = false) => { const lines = wrap(value, MAXV, 12, bold); text(label, L, y, 12); text(':', COL, y, 12); lines.forEach((ln, i) => text(ln, VAL, y + i * 14.5, 12, bold)); return lines.length; };
    field('Course Code', d.code, true); y += 27;
    const tl = field('Course Title', c.title, true); y += 27 + (tl - 1) * 14.5 + 24;
    if (d.title === 'LAB Report') { field('Experiment No.', pad(d.expNo)); y += 26; const el = field('Experiment Name', d.expName || ' '); y += Math.max(2, el) * 14.5 + 36; }
    else { field('No.', pad(d.expNo)); y += 26; const el = field('Topic', d.expName || ' '); y += Math.max(2, el) * 14.5 + 36; }
    // Submitted by / to
    const top = y; text('Submitted By:', L, y, 12, true);
    const VX = 326, RX = 432, RW = 196;
    text('Submitted To:', VX + 6, y, 12, true);
    const by = [['Name', p.name], ['Roll', p.roll], ['Section', p.section || sem.section || '']];
    let ly = y + 26;
    for (const [k, v] of by) { const lines = wrap(v, VX - 138 - 10, 12); text(k, L, ly, 12); text(':', 123, ly, 12); lines.forEach((ln, i) => text(ln, 138, ly + i * 14.5, 12)); ly += 25.5 + (lines.length - 1) * 14.5; }
    let ry = y + 26;
    const right = (t, gap = 0) => { const lines = wrap(t, RW, 12); lines.forEach((ln, i) => text(ln, RX, ry + i * 14, 12, false, 'center')); ry += lines.length * 14 + 11 + gap; };
    for (const name of d.teachers.filter(Boolean)) { const f = facultyAll().find((x) => x.name === name) || {}; right(plainName(name)); if (f.desig) right(f.desig); }
    if (!d.teachers.filter(Boolean).length) right(' ');
    const fdept = (facultyAll().find((x) => x.name === d.teachers[0]) || {}).dept;
    right(fdept && fdept !== 'EEE' ? `Department of ${fdept}` : DEPT, -4); right(UNI);
    const bottom = Math.max(ly, ry) - 6;
    ops.push({ k: 'r', x: VX, y: top - 16, w: 0.9, h: bottom - top + 12 });
    y = bottom + 40;
    text('Date of Experiment', L, y, 12); text(':', COL, y, 12); text(longDate(d.dateExp), VAL, y, 12); y += 26;
    text('Date of Submission', L, y, 12); text(':', COL, y, 12); text(longDate(d.dateSub), VAL, y, 12);
    return ops;
  }
  let coverTimer = null;
  function updateCoverPreview() {
    const host = $('#a4i'), box = $('#a4'); if (!host || !box || !window.jspdf) return;
    if (!metricsDoc) metricsDoc = new window.jspdf.jsPDF({ unit: 'pt', format: 'a4' });
    const ops = coverOps(metricsDoc);
    host.innerHTML = ops.map((o) => {
      if (o.k === 'img') return `<img src="img/ruet-logo.png" alt="" style="left:${o.x}px;top:${o.y}px;width:${o.w}px;height:${o.h}px">`;
      if (o.k === 'r') return `<i style="left:${o.x}px;top:${o.y}px;width:${o.w}px;height:${o.h}px"></i>`;
      return `<span style="left:${o.x}px;top:${(o.y - o.size * 0.86).toFixed(2)}px;font-size:${o.size}px;font-weight:${o.bold ? 700 : 400};${o.align === 'center' ? 'transform:translateX(-50%);' : ''}">${esc(o.t)}</span>`;
    }).join('');
    host.style.transform = `scale(${box.clientWidth / 595.28})`;
    const sk = $('#a4skel'); if (sk) sk.remove();
  }
  const queueCoverPreview = () => { clearTimeout(coverTimer); coverTimer = setTimeout(updateCoverPreview, 50); };
  function coverMounted() {
    loadJsPDF().then(updateCoverPreview).catch(() => { const sk = $('#a4skel'); if (sk) sk.textContent = 'Preview needs the PDF engine — reload the page.'; });
  }
  window.addEventListener('resize', () => { if (route === 'cover') queueCoverPreview(); });
  async function buildCoverDoc() {
    const d = coverDraft, p = state.profile;
    const [{ jsPDF }, logo] = await Promise.all([loadJsPDF(), loadLogo()]);
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    doc.setProperties({ title: `${d.code} ${d.title} ${pad(d.expNo)}`, author: p.name, creator: 'classkoytay' });
    for (const o of coverOps(doc)) {
      if (o.k === 'img') doc.addImage(logo, 'PNG', o.x, o.y, o.w, o.h, 'ruet', 'FAST');
      else if (o.k === 'r') { doc.setFillColor(0, 0, 0); doc.rect(o.x, o.y, o.w, o.h, 'F'); }
      else { doc.setFont('times', o.bold ? 'bold' : 'normal'); doc.setFontSize(o.size); doc.text(o.t, o.x, o.y, { align: o.align }); }
    }
    return doc;
  }
  async function coverPDF() {
    const d = coverDraft, p = state.profile;
    if (!p.name.trim() || !p.roll.trim()) { toast('Add your name and roll first', '!'); $('[data-prof="name"]')?.focus(); return; }
    if (!d.teachers.filter(Boolean).length) { toast('Choose the teacher', '!'); return; }
    try {
      const doc = await buildCoverDoc();
      const name = `${d.code.replace(/\s+/g, '')}_${d.title === 'LAB Report' ? 'Exp' : d.title.split(' ')[0]}${pad(d.expNo)}_${p.roll.trim() || 'cover'}.pdf`;
      state.covers = state.covers.filter((x) => !(x.code === d.code && Number(x.expNo) === Number(d.expNo) && x.title === d.title));
      state.covers.push({ t: Date.now(), code: d.code, title: d.title, expNo: d.expNo, expName: d.expName, teachers: d.teachers.filter(Boolean), dateExp: d.dateExp, dateSub: d.dateSub });
      state.covers = state.covers.slice(-60); save();
      if (NATIVE) { await window.ckNative.shareFile(name, doc.output('datauristring').split(',')[1], 'Lab report cover'); }
      else { doc.save(name); toast(`${name} downloaded`); }
    } catch (e) { toast('Could not make the PDF: ' + ((e && e.message) || e), '!'); }
  }

  /* ---------------- Settings ---------------- */
  function viewSettings() {
    const sem = S(), st = state.settings;
    const perm = NATIVE ? (nativeNotifOk ? 'granted' : 'default') : 'Notification' in window ? Notification.permission : 'unsupported';
    const tr = trackerState();
    return `<button class="btn sm ghost" data-act="back" style="margin-top:6px;padding-left:4px">${ic('back')} Back</button><h1 class="page-title">Settings</h1><p class="page-sub">Semester, week, reminders and campus tracking.</p>
      <div class="stagger">
      ${accountCard()}
      <h2 class="sec" style="--i:0">Semester</h2>
      <div class="card" style="--i:1">
        <div class="set-row"><div class="t"><b>${esc(sem.label)}</b><span>Week 1 started ${fmtD(semStart(sem))} · ${sem.weeks} weeks</span></div><button class="btn sm" data-act="week-sheet">Change week</button></div>
        <div class="set-row"><div class="t"><b>Switch semester</b><span>${Object.keys(state.semesters).length} saved · each keeps its own routine, attendance and CTs</span></div><button class="btn sm" data-act="sem-sheet">Semesters</button></div>
        <div class="set-row"><div class="t"><b>Level</b><span>Decides which syllabus courses are offered</span></div><select class="in" style="width:96px" id="semLevel">${LEVELS.map((l) => `<option ${l === sem.level ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
        <div class="set-row"><div class="t"><b>Section</b></div><select class="in" style="width:96px" id="semSec">${['', 'A', 'B', 'C'].map((x) => `<option value="${x}" ${x === (sem.section || '') ? 'selected' : ''}>${x || 'None'}</option>`).join('')}</select></div>
        <div class="set-row"><div class="t"><b>Rename</b></div><input class="in" style="width:180px" id="semName" value="${esc(sem.label)}"></div>
        <div class="set-row"><div class="t"><b>Weeks in semester</b><span>RUET standard is 14</span></div><input class="in" type="number" min="1" max="20" style="width:80px" id="semWeeks" value="${sem.weeks}"></div>
        <div class="row wrap" style="margin-top:12px"><button class="btn" data-act="new-sem">${ic('plus')} New semester</button><button class="btn danger" data-act="del-sem">Delete this semester</button></div>
      </div>

      <h2 class="sec" style="--i:2">Reminders</h2>
      <div class="card" style="--i:3">
        <div class="set-row"><div class="t"><b>Notifications</b><span>${perm === 'granted' ? 'Allowed' : perm === 'denied' ? 'Blocked in browser settings' : perm === 'unsupported' ? 'Not supported in this browser' : 'Tap to allow'}</span></div><label class="switch"><input type="checkbox" id="notifyT" ${st.notify && perm === 'granted' ? 'checked' : ''}><span></span></label></div>
        <div class="set-row"><div class="t"><b>Tomorrow's summary at</b><span>Classes, labs &amp; CTs of the next day</span></div><input class="in" type="time" id="digestT" style="width:120px" value="${st.digestTime}"></div>
        <div class="set-row"><div class="t"><b>Before each class</b><span>minutes</span></div><select class="in" id="beforeT" style="width:100px">${[0, 5, 10, 15, 30].map((m) => `<option value="${m}" ${m === st.beforeMin ? 'selected' : ''}>${m ? m + ' min' : 'Off'}</option>`).join('')}</select></div>
        <div class="set-row"><div class="t"><b>CT morning alert</b><span>7:00 AM on CT day</span></div><label class="switch"><input type="checkbox" id="ctMorningT" ${st.ctMorning ? 'checked' : ''}><span></span></label></div>
        <div class="row wrap" style="margin-top:12px"><button class="btn" data-act="test-notif">Send test notification</button><button class="btn" data-act="export-ics">${ic('calendar')} Add to phone calendar (.ics)</button></div>
        <p class="small muted" style="margin:10px 0 0">${NATIVE ? 'Reminders are scheduled on your phone for the next 10 days and refresh every time you open the app — they ring even when classkoytay is closed.' : 'Reminders fire while classkoytay is open or installed (Add to Home screen). For guaranteed alarms, get the Android app or import the .ics file into Google Calendar.'}</p>
      </div>

      <h2 class="sec" style="--i:4">Auto attendance by location</h2>
      <div class="card" style="--i:5">
        <div class="set-row"><div class="t"><b>Track me during class time</b><span>${tr.detail}</span></div><label class="switch"><input type="checkbox" id="trackT" ${st.tracking ? 'checked' : ''}><span></span></label></div>
        ${NATIVE && state.settings.tracking && nativeGeo && !nativeGeo.permission ? `<div class="note warn" style="margin-bottom:10px">Android needs location set to <b>“Allow all the time”</b> for background attendance. <button class="btn sm" data-act="geo-settings" style="margin-top:8px">Open app settings</button></div>` : ''}
        ${!NATIVE ? '<div class="note" style="margin-bottom:10px">In the browser, tracking only works while this page is open. The <b>Android app</b> tracks in the background.</div>' : ''}
        <p class="small muted">Only the <b>EEE</b> and <b>CSE</b> buildings count — not the whole campus. If you are inside either building at any point during a class, that class is marked <b style="color:var(--good)">present</b>; if tracking was on for the whole class and you never entered, it is marked <b style="color:var(--bad)">absent</b>. Manual marks always win.</p>
        <div id="map" class="map"></div>
        ${st.fences.map((f, i) => `<div class="fence-row"><div><b>${esc(f.name)}</b><div class="small muted mono">${f.lat.toFixed(5)}, ${f.lng.toFixed(5)} · radius ${f.r} m</div><input type="range" min="15" max="120" value="${f.r}" data-act-input="fence-r" data-i="${i}" style="width:100%;accent-color:var(--accent)"></div>
          <button class="btn sm" data-act="fence-here" data-i="${i}">${ic('locate')} I'm inside now</button></div>`).join('')}
        <div class="note warn" style="margin-top:10px">The building positions are approximate. Stand inside the EEE building and tap <b>“I'm inside now”</b>, then do the same in the CSE building — or drag the pins on the map. This makes auto-attendance accurate.</div>
        ${state.geoLog.length ? `<label class="f">Recent location events</label><div class="log">${state.geoLog.slice(-12).reverse().map((g) => `<div>${new Date(g.t).toLocaleString()} — ${g.inside ? `entered ${esc(g.fence)}` : 'left buildings'}</div>`).join('')}</div>` : ''}
      </div>

      <h2 class="sec" style="--i:6">Attendance counting</h2>
      <div class="card" style="--i:7">
        <div class="set-row"><div class="t"><b>Past classes I didn't mark</b><span>Most students only mark absences</span></div><select class="in" id="unmarkedT" style="width:150px">${[['present', 'Count present'], ['absent', 'Count absent'], ['ignore', 'Ignore']].map(([v, l]) => `<option value="${v}" ${st.unmarkedAs === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
        <div class="set-row"><div class="t"><b>Theme</b></div><div class="seg">${['auto', 'dark', 'light'].map((v) => `<button class="${st.theme === v ? 'on' : ''}" data-act="theme" data-v="${v}">${v}</button>`).join('')}</div></div>
      </div>

      <h2 class="sec" style="--i:8">Backup</h2>
      <div class="card row wrap" style="--i:9"><button class="btn" data-act="export-json">${ic('download')} Export backup</button><label class="btn">${ic('upload')} Import backup<input type="file" accept="application/json" id="importF" hidden></label><button class="btn danger" data-act="reset-all">Reset app</button></div>
      <p class="small faint" style="text-align:center;margin-top:20px">classkoytay · made for RUET students${cloudUser ? ' · backed up to your Google account' : ' · data stays on this device'}</p>
      </div>`;
  }
  function weekSheet() {
    const sem = S(), w = Math.max(1, Math.min(weekOf(now(), sem), sem.weeks));
    const sat = dateFor(w, 'sat', sem);
    ctDraft._w = w; ctDraft._sat = iso(sat);
    drawWeekSheet();
  }
  function drawWeekSheet() {
    const w = ctDraft._w, sat = ctDraft._sat, start = addDays(parseISO(sat), -(w - 1) * 7);
    openSheet(`<h3>Which week is running?</h3><p class="muted small">RUET has no fixed calendar — set it yourself whenever classes shift.</p>
      <label class="f">Week number</label><div class="stepper"><button data-act="wk" data-d="-1">−</button><div class="val">${w}</div><button data-act="wk" data-d="1">+</button></div>
      <label class="f">Week ${w} starts on (Saturday)</label><input class="in" type="date" id="wkSat" value="${sat}">
      <p class="small muted" style="margin-top:10px">→ Week 1 = ${fmtD(start)} · Week ${S().weeks} ends ${fmtD(addDays(start, (S().weeks - 1) * 7 + 4))}</p>
      <div class="acts"><button class="btn primary" data-act="wk-save">Save</button></div>`);
  }

  /* ---------------- Map (Leaflet) ---------------- */
  let map = null, mapLayers = [], meMarker = null;
  function initMap() {
    const el = $('#map'); if (!el) return;
    if (!window.L) { el.innerHTML = '<div class="empty small">Map needs an internet connection.</div>'; return; }
    if (map) { map.remove(); map = null; }
    map = L.map(el, { zoomControl: true, attributionControl: true }).setView([R.campus.lat, R.campus.lng], 17);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 20, maxNativeZoom: 19, attribution: '© OpenStreetMap' }).addTo(map);
    drawFences();
    if (lastFix) placeMe(lastFix);
  }
  function drawFences() {
    if (!map) return; mapLayers.forEach((l) => l.remove()); mapLayers = [];
    const cols = ['#7c8cff', '#2ee6c5'];
    state.settings.fences.forEach((f, i) => {
      const circle = L.circle([f.lat, f.lng], { radius: f.r, color: cols[i % 2], weight: 2, fillOpacity: 0.18 }).addTo(map);
      const m = L.marker([f.lat, f.lng], { draggable: true, title: f.name }).addTo(map).bindTooltip(f.name, { permanent: true, direction: 'top', offset: [-14, -14] });
      m.on('drag', (e) => circle.setLatLng(e.target.getLatLng()));
      m.on('dragend', (e) => { const p = e.target.getLatLng(); f.lat = p.lat; f.lng = p.lng; save(); fencesChanged(); toast(`${f.name} moved`); render(); });
      mapLayers.push(circle, m);
    });
  }
  function placeMe(fix) {
    if (!map || !window.L) return;
    const ll = [fix.lat, fix.lng];
    if (!meMarker || !map.hasLayer(meMarker)) meMarker = L.marker(ll, { icon: L.divIcon({ className: '', html: '<div class="me-dot"></div>', iconSize: [16, 16] }) }).addTo(map);
    else meMarker.setLatLng(ll);
  }

  /* ---------------- Geofence tracking ---------------- */
  let watchId = null, lastFix = null, insideFence = null, wakeLock = null;
  const sessionSeen = JSON.parse(sessionStorage.getItem('ck.seen') || '{}'); // instKey -> {from,to,inside}
  const dist = (a, b) => { const R0 = 6371000, t = Math.PI / 180; const dLa = (b.lat - a.lat) * t, dLo = (b.lng - a.lng) * t; const h = Math.sin(dLa / 2) ** 2 + Math.cos(a.lat * t) * Math.cos(b.lat * t) * Math.sin(dLo / 2) ** 2; return 2 * R0 * Math.asin(Math.sqrt(h)); };
  function fenceFor(fix) { for (const f of state.settings.fences) { const d = dist(fix, f); if (d - Math.min(fix.acc || 0, 25) <= f.r) return f; } return null; }
  function trackerState() {
    if (!state.settings.tracking) return { cls: '', label: 'Tracking off', detail: 'Off — attendance only by manual ticks' };
    if (NATIVE) {
      const g = nativeGeo;
      if (!g) return { cls: 'on', label: 'Tracking', detail: 'Starting…' };
      if (!g.permission) return { cls: '', label: 'Needs permission', detail: 'Location must be set to “Allow all the time”' };
      if (!g.active) return { cls: '', label: 'Paused', detail: 'Background tracking is not running — toggle it off and on' };
      const f = state.settings.fences.find((x) => x.id === g.inside);
      return f ? { cls: 'on in', label: `In ${f.name.replace(' Building', '')}`, detail: `Inside the ${f.name} · works in the background` } : { cls: 'on', label: 'Tracking', detail: 'Background tracking on — works even when the app is closed' };
    }
    if (!('geolocation' in navigator)) return { cls: '', label: 'No GPS', detail: 'This device has no location support' };
    if (!lastFix) return { cls: 'on', label: 'Locating…', detail: 'Waiting for a GPS fix (keep the app open)' };
    if (insideFence) return { cls: 'on in', label: `In ${insideFence.name.replace(' Building', '')}`, detail: `You are inside the ${insideFence.name}` };
    return { cls: 'on', label: 'Tracking', detail: `Outside EEE/CSE buildings · ±${Math.round(lastFix.acc)} m` };
  }
  function startTracking() {
    if (!('geolocation' in navigator)) { toast('Location not supported here', '!'); return; }
    if (watchId != null) return;
    watchId = navigator.geolocation.watchPosition(onFix, (err) => { toast(err.code === 1 ? 'Location permission denied' : 'Location unavailable', '!'); if (err.code === 1) { state.settings.tracking = false; save(); stopTracking(); render(); } }, { enableHighAccuracy: true, maximumAge: 15000, timeout: 30000 });
    requestWake();
  }
  function stopTracking() { if (watchId != null) navigator.geolocation.clearWatch(watchId); watchId = null; lastFix = null; insideFence = null; if (wakeLock) wakeLock.release().catch(() => {}); wakeLock = null; }
  async function requestWake() { try { if ('wakeLock' in navigator && document.visibilityState === 'visible' && !wakeLock) { wakeLock = await navigator.wakeLock.request('screen'); wakeLock.addEventListener('release', () => { wakeLock = null; }); } } catch { /* optional */ } }
  function onFix(pos) {
    const fix = { lat: pos.coords.latitude, lng: pos.coords.longitude, acc: pos.coords.accuracy, t: pos.timestamp || Date.now() };
    handleFix(fix);
  }
  function handleFix(fix) {
    lastFix = fix; placeMe(fix);
    const f = fenceFor(fix), was = insideFence;
    insideFence = f;
    if ((was && was.id) !== (f && f.id)) { state.geoLog.push({ t: fix.t, fence: f ? f.name : '', inside: !!f }); state.geoLog = state.geoLog.slice(-60); if (f) toast(`Entered ${f.name}`, '📍'); }
    evaluateAttendance(fix);
    save(); softRefresh();
  }
  function evaluateAttendance(fix) {
    const sem = S(); if (!sem) return;
    const t = new Date(fix.t);
    for (const i of instancesOn(t, sem)) {
      const winStart = i.start.getTime() - 10 * 60000, winEnd = i.end.getTime();
      if (fix.t < winStart || fix.t > winEnd) continue;
      const seen = sessionSeen[i.key] || (sessionSeen[i.key] = { from: fix.t, to: fix.t, inside: false });
      seen.to = fix.t; if (insideFence) seen.inside = true;
      const rec = sem.records[i.key];
      if (insideFence && (!rec || rec.src === 'gps') && statusOf(i, sem) !== 'OFF') { if (!rec || rec.s !== 'P') { setStatus(i, 'P', 'gps', sem); toast(`${i.code} marked present`, '✓'); } }
    }
    sessionStorage.setItem('ck.seen', JSON.stringify(sessionSeen));
  }
  function closeOutClasses() {
    // after a class ends: if we were tracking from its start to its end and never saw you inside → absent (gps)
    const sem = S(); if (!sem || !state.settings.tracking) return;
    const t = now().getTime();
    for (const i of instancesOn(now(), sem)) {
      if (t < i.end.getTime()) continue;
      const seen = sessionSeen[i.key]; const rec = sem.records[i.key];
      if (!seen || seen.inside || rec || statusOf(i, sem) === 'OFF') continue;
      const covered = seen.from <= i.start.getTime() + 15 * 60000 && seen.to >= i.end.getTime() - 15 * 60000;
      if (covered) { setStatus(i, 'A', 'gps', sem); toast(`${i.code}: not in EEE/CSE — marked absent`, '✕'); save(); }
    }
  }

  /* ---------------- Cloud: Google login + sync ---------------- */
  const CLOUD = window.ckCloud || { configured: false, onUser: (cb) => cb(null) };
  const NATIVE = !!window.ckNative;
  const GOOGLE_G = '<svg viewBox="0 0 48 48" style="width:18px;height:18px;stroke:none"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>';
  let cloudUser = null, pushTimer = null, pendingRemote = null;
  const cloudState = { busy: false, err: null };
  const strHash = (s) => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return String(h >>> 0) + ':' + s.length; };
  // Only this is synced. Device-only bits (tracking on/off, tracking periods, notification log) stay local.
  function syncPayload() {
    const { tracking, trackPeriods, ...settings } = state.settings; void tracking; void trackPeriods;
    return JSON.stringify({ v: 1, onboarded: state.onboarded, active: state.active, semesters: state.semesters, settings, profile: state.profile, covers: state.covers });
  }
  const hasLocalData = () => state.onboarded && Object.keys(state.semesters).length > 0;
  function scheduleCloud() { if (!cloudUser) return; clearTimeout(pushTimer); pushTimer = setTimeout(() => pushCloud(false), 2500); }
  async function pushCloud(force) {
    if (!cloudUser || pendingRemote) return;
    const p = syncPayload(), h = strHash(p);
    if (!force && h === state.syncedHash) return;
    try {
      cloudState.busy = true; const at = Date.now();
      await CLOUD.push(JSON.parse(p), at);
      state.syncedAt = at; state.syncedHash = h; cloudState.err = null; persist();
    } catch (e) { cloudState.err = (e && e.message) || 'Sync failed'; }
    cloudState.busy = false;
    if (route === 'settings' && !$('#sheetWrap').classList.contains('open')) softRefresh();
  }
  function adoptRemote(remote) {
    if (!remote || !remote.data) return;
    const d = remote.data, keepTracking = state.settings.tracking, keepPeriods = state.settings.trackPeriods;
    state.onboarded = !!d.onboarded; state.semesters = d.semesters || {};
    state.active = d.active && state.semesters[d.active] ? d.active : Object.keys(state.semesters)[0] || null;
    state.settings = Object.assign(defaults().settings, d.settings || {}, { tracking: keepTracking, trackPeriods: keepPeriods });
    if (d.profile) state.profile = d.profile; if (Array.isArray(d.covers)) state.covers = d.covers; migrate();
    state.syncedAt = remote.updatedAt; state.syncedHash = strHash(syncPayload()); pendingRemote = null;
    ui.routineWeek = null; ui.sylTab = null; persist(); scheduleNativeAlerts();
    if (!state.onboarded || !S()) state.onboarded = false;
    render();
  }
  async function cloudCheck(manual) {
    if (!cloudUser) return;
    try {
      cloudState.busy = true; if (manual) softRefresh();
      const remote = await CLOUD.pull();
      const localH = strHash(syncPayload());
      if (!remote || !remote.data) {
        if (hasLocalData()) await pushCloud(true);
        cloudState.busy = false; if (manual) toast('Backed up to Google', '☁'); if (!$('#sheetWrap').classList.contains('open')) softRefresh(); return;
      }
      const remoteH = strHash(JSON.stringify(remote.data));
      const remoteChanged = remote.updatedAt > (state.syncedAt || 0), localChanged = localH !== state.syncedHash;
      if (remoteH === localH) { state.syncedAt = remote.updatedAt; state.syncedHash = localH; persist(); }
      else if (!hasLocalData() || (remoteChanged && !localChanged)) { adoptRemote(remote); toast(`Welcome back${cloudUser.name ? ', ' + cloudUser.name.split(' ')[0] : ''} — data restored`, '☁'); }
      else if (!remoteChanged && localChanged) await pushCloud(true);
      else { pendingRemote = remote; conflictSheet(remote); }
      cloudState.err = null;
      if (manual) toast('Synced', '☁');
    } catch (e) { cloudState.err = (e && e.message) || 'Sync failed'; if (manual) toast('Sync failed — check internet', '!'); }
    cloudState.busy = false;
    if (!$('#sheetWrap').classList.contains('open')) softRefresh();
  }
  function conflictSheet(remote) {
    const d = remote.data || {}, sems = Object.values(d.semesters || {});
    const cnt = (list) => list.reduce((a, x) => a + Object.keys(x.records || {}).length, 0);
    openSheet(`<h3>Which data should we keep?</h3><p class="muted small">Your Google account and this device both have classkoytay data, and they are different.</p>
      <div class="card" style="margin-top:10px"><b>Google account</b><div class="small muted">Saved ${new Date(remote.updatedAt).toLocaleString()} · ${sems.length} semester(s) · ${cnt(sems)} attendance marks</div></div>
      <div class="card"><b>This device</b><div class="small muted">${Object.keys(state.semesters).length} semester(s) · ${cnt(Object.values(state.semesters))} attendance marks</div></div>
      <div class="acts"><button class="btn" data-act="sync-use-local">Keep this device</button><button class="btn primary" data-act="sync-use-cloud">Use Google data</button></div>`, () => { pendingRemote = null; });
  }
  async function cloudLogin() {
    if (!CLOUD.configured) { toast('Login is not set up yet', '!'); return; }
    try { cloudState.busy = true; const u = await CLOUD.signIn(); if (u) toast(`Signed in as ${u.email}`, '✓'); }
    catch (e) { const m = String((e && (e.code || e.message)) || ''); if (!/cancel|closed-by-user|12501/i.test(m)) toast('Sign-in failed: ' + m.replace('auth/', ''), '!'); }
    cloudState.busy = false;
  }
  function accountCard() {
    if (!CLOUD.configured) return '';
    if (!cloudUser) return `<h2 class="sec" style="--i:0">Account</h2><div class="card" style="--i:1"><div class="row perm" style="display:flex"><span class="pi">${ic('cloud', '')}</span><div class="sp"><b>Back up with Google</b><div class="small muted">Sign in so your routine, attendance and CTs are saved to your Google account. New phone or reinstall — log in and everything comes back.</div></div></div>
      <button class="btn block" style="margin-top:12px;background:#fff;color:#1f1f1f;border-color:#dadce0" data-act="cloud-login">${GOOGLE_G} Sign in with Google</button></div>`;
    const when = state.syncedAt ? new Date(state.syncedAt).toLocaleString() : 'not yet';
    return `<h2 class="sec" style="--i:0">Account</h2><div class="card" style="--i:1"><div class="row">
        ${cloudUser.photo ? `<img src="${esc(cloudUser.photo)}" alt="" referrerpolicy="no-referrer" style="width:42px;height:42px;border-radius:50%">` : `<span class="avatar">${ic('user', '')}</span>`}
        <div class="sp"><b>${esc(cloudUser.name || 'Signed in')}</b><div class="small muted">${esc(cloudUser.email)}</div></div></div>
      <div class="row small" style="margin-top:10px"><span class="tag ${cloudState.err ? 'bad' : 'good'}">${cloudState.busy ? 'Syncing…' : cloudState.err ? 'Sync error' : 'Synced'}</span><span class="muted">${cloudState.err ? esc(cloudState.err) : 'Last saved ' + when}</span></div>
      <div class="row wrap" style="margin-top:12px"><button class="btn sm" data-act="cloud-sync">Sync now</button><button class="btn sm danger" data-act="cloud-logout">Sign out</button></div></div>`;
  }

  /* ---------------- Native Android: notifications + background geofence ---------------- */
  let nativeNotifOk = false, nativeGeo = null, nativeAlertTimer = null, fenceTimer = null, reconciling = false;
  function scheduleNativeAlerts() {
    if (!NATIVE) return; clearTimeout(nativeAlertTimer);
    nativeAlertTimer = setTimeout(() => { window.ckNative.schedule(state.settings.notify && nativeNotifOk && state.onboarded && S() ? plannedAlerts(10) : []).catch(() => {}); }, 1500);
  }
  async function nativeRefresh() { if (!NATIVE) return; try { nativeGeo = await window.ckNative.geoStatus(); } catch { nativeGeo = null; } nativeReconcile(); }
  let awaitingBg = false;
  async function nativeRequestBackground() {
    try { const p = await window.ckNative.requestBackground(); if (p.background !== 'granted') { toast('Choose “Allow all the time” for Location', '!'); awaitingBg = true; window.ckNative.openSettings(); return false; } return true; }
    catch { awaitingBg = true; window.ckNative.openSettings(); return false; }
  }
  // Back from Android settings after choosing "Allow all the time" → finish switching on background tracking
  async function resumeBackgroundGrant() {
    if (!NATIVE || !awaitingBg) return; awaitingBg = false;
    try { const p = await window.ckNative.geoPermissions(); if (p.background === 'granted') await nativeTrackFinish(); else render(true); } catch { /* ignore */ }
  }
  function permStatus() {
    const notif = NATIVE ? nativeNotifOk && state.settings.notify : 'Notification' in window && Notification.permission === 'granted' && state.settings.notify;
    const loc = state.settings.tracking && (NATIVE ? !!(nativeGeo && nativeGeo.permission) : true);
    return { notif, loc };
  }
  function permCards() {
    const p = permStatus();
    return `<div class="card perm ${p.notif ? 'ok' : ''}"><span class="pi">${ic(p.notif ? 'check' : 'bell', '')}</span><div><b>Notifications</b><div class="small muted">Tomorrow's classes, labs, CTs and lab tests, the evening before and right before class.</div></div>${p.notif ? '<span class="tag good">On</span>' : '<button class="btn sm primary" data-act="perm-notif">Allow</button>'}</div>
      <div class="card perm ${p.loc ? 'ok' : ''}"><span class="pi">${ic(p.loc ? 'check' : 'pin', '')}</span><div><b>Location · ${NATIVE ? '“Allow all the time”' : 'while open'}</b><div class="small muted">Only checks whether you are inside the EEE or CSE building during class. Never uploaded.</div></div>${p.loc ? '<span class="tag good">On</span>' : '<button class="btn sm primary" data-act="perm-loc">Allow</button>'}</div>`;
  }
  /** First time the Android app opens: ask for notifications, then location → "Allow all the time". */
  async function firstLaunchPermissions() {
    if (!NATIVE || state.permAsked) return;
    state.permAsked = true; persist();
    if (!(nativeNotifOk && state.settings.notify)) {
      try { const ok = await window.ckNative.notifyPermission(); nativeNotifOk = ok; state.settings.notify = ok; save(); } catch { /* ignore */ }
    }
    if (!(state.settings.tracking && nativeGeo && nativeGeo.permission)) await nativeTrackStart();
    render(true);
  }
  async function nativeTrackStart() {
    const nn = window.ckNative;
    try {
      let p = await nn.geoPermissions();
      if (p.location !== 'granted') p = await nn.requestForeground();
      if (p.location !== 'granted') { toast('Location permission is needed', '!'); state.settings.tracking = false; save(); render(); return; }
      if (p.background !== 'granted') {
        openSheet(`<div class="perm" style="margin-top:6px"><span class="pi">${ic('pin', '')}</span><div><h3 style="margin:0">Allow location all the time</h3></div></div>
          <p class="muted">To count attendance while the app is closed, Android needs Location set to <b>“Allow all the time”</b>. On the next screen tap <b>Permissions → Location → Allow all the time</b>, then come back.</p>
          <p class="small muted">classkoytay only checks whether you are inside the EEE or CSE building during class. Your location is never uploaded.</p>
          <div class="acts"><button class="btn" data-act="close-sheet">Not now</button><button class="btn primary" data-act="geo-allow-bg">Continue</button></div>`, () => render(true));
        return;
      }
      await nativeTrackFinish();
    } catch (e) { toast('Could not start tracking: ' + ((e && e.message) || e), '!'); }
  }
  async function nativeTrackFinish() {
    try {
      const r = await window.ckNative.startGeofence(state.settings.fences);
      const per = state.settings.trackPeriods || (state.settings.trackPeriods = []);
      if (!per.length || per[per.length - 1].to) per.push({ from: r.armedAt, to: null });
      state.settings.tracking = true; save(); toast('Background attendance is on', '📡');
    } catch (e) { state.settings.tracking = false; save(); toast(/permission/i.test((e && e.message) || '') ? 'Needs “Allow all the time” location' : 'Could not start tracking', '!'); }
    await nativeRefresh(); render();
  }
  async function nativeTrackStop() {
    try { await window.ckNative.stopGeofence(); } catch { /* ignore */ }
    const per = state.settings.trackPeriods || []; if (per.length && !per[per.length - 1].to) per[per.length - 1].to = Date.now();
    state.settings.tracking = false; save(); await nativeRefresh(); render();
  }
  function fencesChanged() {
    if (!NATIVE || !state.settings.tracking) return; clearTimeout(fenceTimer);
    fenceTimer = setTimeout(() => window.ckNative.startGeofence(state.settings.fences).then(nativeRefresh).catch(() => {}), 1200);
  }
  // Turn the building enter/exit log (recorded by Android even while the app was closed) into attendance
  async function nativeReconcile() {
    if (!NATIVE || reconciling || !state.onboarded || !S()) return;
    const per = state.settings.trackPeriods || []; if (!per.length) return;
    reconciling = true;
    try {
      const events = (await window.ckNative.geoEvents()).sort((a, b) => a.t - b.t);
      const nowMs = now().getTime(), ivals = []; let openAt = null;
      for (const e of events) {
        if (e.id === '_system') { if ((e.type === 'boot' || e.type === 'stopped') && openAt != null) { ivals.push([openAt, e.t]); openAt = null; } continue; }
        if (e.type === 'enter' && openAt == null) openAt = e.t;
        else if (e.type === 'exit' && openAt != null) { ivals.push([openAt, e.t]); openAt = null; }
      }
      if (openAt != null) ivals.push([openAt, nowMs]);
      const covered = (a, b) => per.some((x) => x.from <= a && (x.to == null || x.to >= b));
      const sem = S(), first = Math.min(...per.map((x) => x.from));
      let nP = 0, nA = 0;
      for (const i of allInstances(sem)) {
        const ws = i.start.getTime() - 10 * 60000, we = i.end.getTime();
        if (we < first || ws > nowMs) continue;
        const rec = sem.records[i.key];
        if ((rec && rec.src !== 'gps') || statusOf(i, sem) === 'OFF') continue;
        const inside = ivals.some(([a, b]) => a <= we && b >= ws);
        if (inside) { if (!rec || rec.s !== 'P') { setStatus(i, 'P', 'gps', sem); nP++; } }
        else if (we <= nowMs && covered(ws, we) && !rec) { setStatus(i, 'A', 'gps', sem); nA++; }
      }
      if (nP || nA) { save(); toast(`Auto attendance: ${nP ? nP + ' present' : ''}${nP && nA ? ', ' : ''}${nA ? nA + ' absent' : ''}`, '📡'); softRefresh(); }
    } catch { /* ignore */ }
    reconciling = false;
  }

  /* ---------------- Notifications ---------------- */
  let swReg = null;
  function plannedAlerts(horizonDays = 8) {
    const sem = S(); if (!sem) return [];
    const st = state.settings, out = [], t0 = startOfDay(now());
    for (let k = 0; k <= horizonDays; k++) {
      const day = addDays(t0, k);
      const dIso = iso(day);
      const list = instancesOn(day, sem).filter((i) => !sem.offDays.includes(i.iso) && statusOf(i, sem) !== 'C');
      const tests = testsOn(dIso, sem).filter((x) => !x.absent && !hasScore(x));
      if (!list.length && !tests.length) continue;
      const tName = (x) => (x.kind === 'ct' ? `CT-${x.num}` : labLabel(x));
      const testOf = (i) => tests.find((x) => x.instKey === i.key);
      const digestAt = atTime(addDays(day, -1), st.digestTime);
      const labs = list.filter((i) => i.slot.span > 1).length;
      const lines = list.map((i) => { const x = testOf(i); return `${fmt12(slotStart(i.slot))} ${i.code}${i.slot.span > 1 ? ' (lab)' : ''}${x ? ` ⚠ ${tName(x)}` : ''}${i.slot.room ? ' · ' + i.slot.room : ''}`; });
      for (const x of tests.filter((x) => !x.instKey || !list.some((i) => i.key === x.instKey))) lines.push(`⚠ ${x.code} ${tName(x)}`);
      const head = list.length ? `${list.length - labs} class${list.length - labs === 1 ? '' : 'es'}${labs ? ` + ${labs} lab${labs > 1 ? 's' : ''}` : ''} starting ${fmt12(slotStart(list[0].slot))}` : `${tests.length} test${tests.length > 1 ? 's' : ''}`;
      out.push({ id: `dg-${dIso}`, at: digestAt.getTime(), title: `Tomorrow · ${fmtD(day)}${tests.length ? ` · ${tests.length} test${tests.length > 1 ? 's' : ''}!` : ''}`, body: `${head}\n${lines.join('\n')}`, tag: `dg-${dIso}` });
      if (st.ctMorning) for (const x of tests) {
        const i = list.find((y) => y.key === x.instKey);
        out.push({ id: `tm-${x.id}`, at: atTime(day, '07:00').getTime(), title: `${x.kind === 'ct' ? 'CT' : tName(x)} today: ${x.code}${x.kind === 'ct' ? ` (CT-${x.num})` : ''}`, body: `${courseInfo(x.code).title}${i ? `\n${fmt12(slotStart(i.slot))}${i.slot.room ? ' · ' + i.slot.room : ''}` : ''}${x.topics?.length ? '\nTopics: ' + x.topics.join(', ') : ''}${x.note ? '\n' + x.note : ''}`, tag: `t-${x.id}` });
      }
      if (st.beforeMin) for (const i of list) { const x = testOf(i); out.push({ id: `pre-${i.key}`, at: i.start.getTime() - st.beforeMin * 60000, title: `${i.code} in ${st.beforeMin} min${x ? ` — ${tName(x)}!` : ''}`, body: `${courseInfo(i.code).title}\n${fmt12(slotStart(i.slot))}${i.slot.room ? ' · ' + i.slot.room : ''}`, tag: `pre-${i.key}` }); }
    }
    return out.sort((a, b) => a.at - b.at);
  }
  async function showNotif(a) {
    const opts = { body: a.body, tag: a.tag, icon: 'icons/icon-192.png', badge: 'icons/icon-192.png', data: { url: './#today' } };
    try { if (swReg) await swReg.showNotification(a.title, opts); else new Notification(a.title, opts); } catch { /* ignore */ }
  }
  function notifyTick() {
    if (NATIVE) return; // Android schedules real notifications instead
    if (!state.settings.notify || !('Notification' in window) || Notification.permission !== 'granted') return;
    const t = now().getTime();
    for (const a of plannedAlerts(2)) {
      if (a.at <= t && a.at > t - 20 * 60000 && !state.notified[a.id]) { state.notified[a.id] = t; showNotif(a); }
    }
    for (const k in state.notified) if (state.notified[k] < t - 10 * DAY_MS) delete state.notified[k];
    save();
  }
  // Share the upcoming alerts with the service worker (periodic background sync on installed Android PWAs)
  function queueForServiceWorker() {
    if (!('indexedDB' in window) || !state.onboarded) return;
    try {
      const req = indexedDB.open('classkoytay', 1);
      req.onupgradeneeded = () => req.result.createObjectStore('kv');
      req.onsuccess = () => { const db = req.result; const tx = db.transaction('kv', 'readwrite'); tx.objectStore('kv').put({ enabled: !!state.settings.notify, alerts: plannedAlerts(8), notified: state.notified }, 'queue'); tx.oncomplete = () => db.close(); };
    } catch { /* ignore */ }
  }
  async function enableNotifications(on) {
    if (NATIVE) {
      if (!on) { state.settings.notify = false; save(); await window.ckNative.schedule([]); render(); return; }
      const ok = await window.ckNative.notifyPermission(); nativeNotifOk = ok;
      state.settings.notify = ok; save(); toast(ok ? 'Reminders on — they ring even when the app is closed' : 'Notification permission not granted', ok ? '🔔' : '!'); render(); return;
    }
    if (!on) { state.settings.notify = false; save(); return; }
    if (!('Notification' in window)) { toast('Notifications not supported in this browser', '!'); return render(); }
    const p = await Notification.requestPermission();
    state.settings.notify = p === 'granted'; save();
    if (p === 'granted') {
      toast('Reminders on', '🔔');
      try { if (swReg && 'periodicSync' in swReg) await swReg.periodicSync.register('ck-check', { minInterval: 15 * 60000 }); } catch { /* needs installed PWA */ }
    } else toast('Permission not granted', '!');
    render();
  }

  /* ---------------- ICS export ---------------- */
  function icsDate(d) { return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`; }
  function exportICS() {
    const sem = S(), t = startOfDay(now()), lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//classkoytay//RUET//EN', 'CALSCALE:GREGORIAN', 'X-WR-CALNAME:classkoytay', 'X-WR-TIMEZONE:Asia/Dhaka',
      'BEGIN:VTIMEZONE', 'TZID:Asia/Dhaka', 'BEGIN:STANDARD', 'DTSTART:19700101T000000', 'TZOFFSETFROM:+0600', 'TZOFFSETTO:+0600', 'END:STANDARD', 'END:VTIMEZONE'];
    const fold = (s) => s.replace(/[,;\\]/g, (m) => '\\' + m).replace(/\n/g, '\\n');
    let n = 0;
    for (const i of allInstances(sem)) {
      if (i.date < t || sem.offDays.includes(i.iso)) continue;
      const ct = ctAt(i), lt = labAt(i), c = courseInfo(i.code);
      lines.push('BEGIN:VEVENT', `UID:${i.key.replace('|', '-')}@classkoytay`, `DTSTAMP:${icsDate(new Date())}`, `DTSTART;TZID=Asia/Dhaka:${icsDate(i.start)}`, `DTEND;TZID=Asia/Dhaka:${icsDate(i.end)}`,
        `SUMMARY:${fold(`${ct ? `CT-${ct.num} · ` : ''}${lt ? `${labLabel(lt)} · ` : ''}${i.code} ${shortTitle(c.title)}`)}`, `LOCATION:${fold(i.slot.room || 'RUET')}`, `DESCRIPTION:${fold(`Week ${i.week} · ${i.slot.teacher || ''}${ct && ct.topics?.length ? '\nCT topics: ' + ct.topics.join(', ') : ''}`)}`,
        'BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${fold(i.code)}`, `TRIGGER:-PT${state.settings.beforeMin || 10}M`, 'END:VALARM');
      if (ct) lines.push('BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${fold(`Tomorrow CT-${ct.num}: ${i.code}`)}`, 'TRIGGER:-PT16H', 'END:VALARM');
      lines.push('END:VEVENT'); n++;
    }
    lines.push('END:VCALENDAR');
    download(`classkoytay-${sem.label.replace(/\W+/g, '-')}.ics`, lines.join('\r\n'), 'text/calendar');
    toast(`${n} classes exported`);
  }
  function download(name, text, type) {
    if (NATIVE) { window.ckNative.shareFile(name, btoa(unescape(encodeURIComponent(text))), name).catch((e) => toast('Could not save: ' + ((e && e.message) || e), '!')); return; }
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); }

  /* ---------------- events ---------------- */
  function softRefresh() { if ($('#sheetWrap').classList.contains('open')) { renderTop(); return; } const y = window.scrollY; render(); window.scrollTo({ top: y }); }
  document.addEventListener('click', async (e) => {
    const el = e.target.closest('[data-act]'); if (!el) return;
    const a = el.dataset.act, sem = S();
    switch (a) {
      case 'go': e.preventDefault(); if ($('#sheetWrap').classList.contains('open')) closeSheet(); go(el.dataset.to, el.dataset.arg || null); break;
      case 'back': history.length > 1 ? history.back() : go('today'); break;
      case 'close-sheet': closeSheet(); break;
      case 'onb-next': onb.step++; render(); break;
      case 'onb-back': onb.step--; render(); break;
      case 'onb-level': onb.level = el.dataset.v; onb.preset = defaultSource(onb.level); render(); break;
      case 'onb-preset': onb.preset = el.dataset.v; render(); break;
      case 'onb-week': onb.weekSat = $('#onbSat').value || onb.weekSat; onb.weekNo = Math.max(1, Math.min(20, onb.weekNo + Number(el.dataset.d))); render(); break;
      case 'onb-finish': {
        const sat = $('#onbSat').value || onb.weekSat; const satD = saturdayOf(parseISO(sat));
        const start = addDays(satD, -(onb.weekNo - 1) * 7);
        const s = newSemester({ level: onb.level, label: `${onb.level} Semester`, startDate: iso(start) });
        const filled = applySource(s, onb.preset);
        state.onboarded = true; save(); ui.routineMode = filled ? 'week' : 'template'; go(filled ? 'today' : 'routine'); render(); toast('Welcome to classkoytay', '★'); break;
      }
      case 'sem-sheet': semSheet(); break;
      case 'cloud-login': cloudLogin(); break;
      case 'cloud-logout': if (confirm('Sign out? Your data stays on this device.')) { await CLOUD.signOut(); toast('Signed out'); } break;
      case 'cloud-sync': await cloudCheck(true); break;
      case 'sync-use-cloud': { const r = pendingRemote; sheetOnClose = null; closeSheet(); adoptRemote(r); toast('Loaded your data from Google', '☁'); break; }
      case 'sync-use-local': sheetOnClose = null; pendingRemote = null; closeSheet(); await pushCloud(true); toast('Saved this device to Google', '☁'); break;
      case 'geo-settings': window.ckNative.openSettings(); break;
      case 'geo-allow-bg': { sheetOnClose = null; closeSheet(); const ok = await nativeRequestBackground(); if (ok) await nativeTrackFinish(); break; }
      case 'sem-switch': state.active = el.dataset.id; ui.routineWeek = null; ui.sylTab = null; save(); closeSheet(); render(); toast(`Switched to ${S().label}`); break;
      case 'ns-level': ns.level = el.dataset.v; ns.source = defaultSource(ns.level); drawNewSem(); break;
      case 'ns-sec': ns.section = el.dataset.v; drawNewSem(); break;
      case 'ns-src': ns.source = el.dataset.v; drawNewSem(); break;
      case 'ns-week': ns.sat = $('#nsSat').value || ns.sat; ns.weekNo = Math.max(1, Math.min(20, ns.weekNo + Number(el.dataset.d))); drawNewSem(); break;
      case 'ns-create': {
        const satD = saturdayOf(parseISO($('#nsSat').value || ns.sat));
        const s = newSemester({ level: ns.level, section: ns.section, startDate: iso(addDays(satD, -(ns.weekNo - 1) * 7)) });
        if (ns.section) s.label = `${ns.level} Semester`;
        const filled = applySource(s, ns.source); if (ns.section && !s.section) s.section = ns.section;
        save(); closeSheet(); ui.routineWeek = null; ui.sylTab = null; ui.routineMode = filled ? 'week' : 'template'; go(filled ? 'today' : 'routine'); render();
        toast(filled ? `${s.label} ready` : `${s.label} created — fill the routine`, '🎓'); break;
      }
      case 'share-routine': shareRoutine(); break;
      case 'imp-replace': { const r = pendingImport; if (!r) break; const ok = sem.routine && confirm(`Replace the weekly routine of ${sem.label}?`); if (ok) { applyShared(sem, r); pendingImport = null; save(); closeSheet(); ui.routineMode = 'week'; go('routine'); render(); toast('Routine imported', '🔗'); } break; }
      case 'imp-new': { const r = pendingImport; if (!r) break; closeSheet(); newSemSheet(r.l); ns.section = r.s || ns.section; ns.source = 'shared'; drawNewSem(); break; }
      case 'mark': {
        const [d, id] = el.dataset.k.split('|'); const date = parseISO(d); const key = dayKeyOfDate(date); const slot = sem.routine[key].find((x) => x.id === id);
        const inst = mkInst(sem, date, weekOf(date), key, slot); const cur = statusOf(inst);
        const ns = cur === el.dataset.s ? null : el.dataset.s;
        setStatus(inst, ns); save();
        if (navigator.vibrate) navigator.vibrate(ns === 'A' ? [20, 40, 20] : 15);
        if ($('#sheetWrap').classList.contains('open')) { instSheet(key, id, d); renderTop(); const y = scrollY; $('#view').innerHTML = `<div class="page calm">${({ today: viewToday, routine: viewRoutine, course: viewCourse, attendance: viewAttendance })[route]?.(routeArg) || ''}</div>`; scrollTo(0, y); requestAnimationFrame(animateMeters); }
        else softRefresh();
        if (ns === 'A') { const st = stats(slot.code); toast(st.left90 < 0 ? `${slot.code}: below 90% → ${st.finalMarks}/10 max` : `${slot.code}: ${st.left90} absence${st.left90 === 1 ? '' : 's'} left for 10/10`, '✕'); }
        break;
      }
      case 'toggle-off': { const d = el.dataset.iso; const i = sem.offDays.indexOf(d); if (i >= 0) sem.offDays.splice(i, 1); else sem.offDays.push(d); save(); closeSheet(); softRefresh(); toast(i >= 0 ? 'Holiday removed' : 'Marked as holiday — classes not counted'); break; }
      case 'day-menu': { const d = el.dataset.iso, off = sem.offDays.includes(d); openSheet(`<h3>${fmtD(parseISO(d))}</h3><p class="muted small">Holidays, strikes or a cancelled day — none of that day's classes will count.</p><div class="acts"><button class="btn primary" data-act="toggle-off" data-iso="${d}">${off ? 'Undo holiday' : 'Mark whole day off'}</button></div>`); break; }
      case 'rmode': ui.routineMode = el.dataset.v; render(); break;
      case 'go-template': ui.routineMode = 'template'; go('routine'); break;
      case 'rweek': ui.routineWeek = Math.max(1, Math.min(sem.weeks, ui.routineWeek + Number(el.dataset.d))); softRefresh(); break;
      case 'add-slot': slotSheet(el.dataset.day, el.dataset.p); break;
      case 'edit-slot': slotSheet(el.dataset.day, null, sem.routine[el.dataset.day].find((x) => x.id === el.dataset.id)); break;
      case 'inst': instSheet(el.dataset.day, el.dataset.id, el.dataset.iso); break;
      case 'pick-span': $$('#fSpan button').forEach((b) => b.classList.toggle('on', b === el)); break;
      case 'save-slot': {
        const day = el.dataset.day, p = Number($('#fP').value), span = Number($('#fSpan .on')?.dataset.v || 1);
        if (p + span - 1 > 9) { toast('Goes past 5 PM — shorten it', '!'); break; }
        const clash = sem.routine[day].find((x) => x.id !== el.dataset.id && x.p < p + span && p < x.p + x.span);
        if (clash) { toast(`Overlaps ${clash.code} — move or remove it first`, '!'); break; }
        const data = { p, span, code: $('#fCode').value, teacher: $('#fT').value.trim(), room: $('#fR').value.trim(), note: $('#fN').value.trim(), kind: span > 1 ? 'lab' : 'class' };
        if (el.dataset.id) Object.assign(sem.routine[day].find((x) => x.id === el.dataset.id), data); else sem.routine[day].push({ id: uid(), ...data });
        save(); closeSheet(); softRefresh(); toast('Routine saved'); break;
      }
      case 'del-slot': sem.routine[el.dataset.day] = sem.routine[el.dataset.day].filter((x) => x.id !== el.dataset.id); save(); closeSheet(); softRefresh(); toast('Removed'); break;
      case 'import-preset': openSheet(`<h3>Import routine</h3><p class="muted small">Replaces the current weekly routine of ${esc(sem.label)}. Attendance already marked for removed classes is kept but hidden.</p>${routineSourceChips(sem.level, null, 'do-import').replace(/<button class="chip[^"]*" data-act="do-import" data-v="blank">[\s\S]*?<\/button>/, '')}`); break;
      case 'do-import': if (applySource(sem, el.dataset.v)) { save(); closeSheet(); softRefresh(); toast('Routine imported'); } break;
      case 'clear-routine': if (confirm('Remove every class from this weekly routine?')) { for (const d of R.days) sem.routine[d.key] = []; save(); softRefresh(); } break;
      case 'add-custom-course': openSheet(`<h3>Custom course</h3><p class="muted small">For courses not in the EEE syllabus (e.g. retake or another department).</p><label class="f">Code</label><input class="in" id="ccCode" placeholder="e.g. CSE 2101"><label class="f">Title</label><input class="in" id="ccTitle" placeholder="Course title"><label class="row small" style="margin-top:12px"><input type="checkbox" id="ccLab"> Sessional / lab</label><div class="acts"><button class="btn primary" data-act="save-custom">Add</button></div>`); break;
      case 'save-custom': { const code = $('#ccCode').value.trim().replace(/\s+/g, ' '); if (!code) break; sem.custom[code] = { code, title: $('#ccTitle').value.trim() || code, topics: [], credits: '', contact: '', sessional: $('#ccLab').checked }; save(); closeSheet(); toast(`${code} added — now put it in a box`); break; }
      case 'ct-new': ctSheet({ code: el.dataset.code || null, key: el.dataset.key || null }); break;
      case 'ct-edit': ctSheet({ id: el.dataset.id }); break;
      case 'ct-slot': ctDraft.instKey = el.dataset.k || null; $$('[data-act="ct-slot"]').forEach((b) => b.classList.toggle('on', b === el)); break;
      case 'ct-box': ctSheet({ code: el.dataset.code, num: Number(el.dataset.n) }); break;
      case 'ct-num': ctDraft.num = Number(el.dataset.v); drawCtSheet(); break;
      case 'ct-res': ctDraft.res = el.dataset.v; drawCtSheet(); break;
      case 'ct-calc': ctCalcSheet(el.dataset.code); break;
      case 'ttab': ui.testsTab = el.dataset.v; lastView = ''; render(); break;
      case 'lt-new': ltSheet({ code: el.dataset.code || null, key: el.dataset.key || null }); break;
      case 'lt-edit': ltSheet({ id: el.dataset.id }); break;
      case 'lt-type': ltDraft.type = el.dataset.v; $$('[data-act="lt-type"]').forEach((b) => b.classList.toggle('on', b === el)); break;
      case 'lt-mode': ltDraft.custom = el.dataset.v === 'date'; if (ltDraft.custom && !ltDraft.iso) ltDraft.iso = iso(now()); drawLtSheet(); break;
      case 'lt-slot': ltDraft.instKey = el.dataset.k; $$('[data-act="lt-slot"]').forEach((b) => b.classList.toggle('on', b === el)); break;
      case 'lt-res': ltDraft.res = el.dataset.v; drawLtSheet(); break;
      case 'lt-save': saveLt(); break;
      case 'lt-del': sem.labtests = sem.labtests.filter((c) => c.id !== ltDraft.id); save(); closeSheet(); softRefresh(); toast('Lab test removed'); break;
      case 'perm-notif': await enableNotifications(true); break;
      case 'perm-loc': if (NATIVE) await nativeTrackStart(); else { state.settings.tracking = true; save(); startTracking(); toast('Location on — keep classkoytay open during class', '📡'); render(true); } break;
      case 'fac-open': facSheet(el.dataset.name); break;
      case 'fac-add': facAddSheet(); break;
      case 'fac-save': { const name = $('#faName').value.trim(); if (!name) { toast('Enter a name', '!'); break; } (state.settings.customFaculty ||= []).push({ name, desig: $('#faDesig').value, ini: $('#faIni').value.trim().toUpperCase(), dept: $('#faDept').value.trim(), email: $('#faEmail').value.trim(), field: '', degrees: '' }); save(); closeSheet(); softRefresh(); toast(`${name} added`); break; }
      case 'fac-del': state.settings.customFaculty = (state.settings.customFaculty || []).filter((f) => f.name !== el.dataset.name); save(); closeSheet(); softRefresh(); toast('Removed'); break;
      case 'cover-with': closeSheet(); if (!coverDraft.code) coverInit(); coverDraft.teachers = [el.dataset.name]; go('cover'); break;
      case 'cv-title': coverDraft.title = el.dataset.v; render(true); queueCoverPreview(); break;
      case 'cv-no': coverDraft.expNo = Math.max(1, Math.min(30, Number(coverDraft.expNo) + Number(el.dataset.d))); el.parentElement.querySelector('.val').textContent = pad(coverDraft.expNo); queueCoverPreview(); break;
      case 'cv-name': coverDraft.expName = el.dataset.v; $('[data-cv="expName"]').value = el.dataset.v; queueCoverPreview(); break;
      case 'cv-tadd': coverDraft.teachers.push(''); render(true); queueCoverPreview(); break;
      case 'cv-trem': coverDraft.teachers.splice(Number(el.dataset.i), 1); render(true); queueCoverPreview(); break;
      case 'cv-exp': coverDraft.dateExp = el.dataset.v; coverDraft.dateSub = nextLabAfter(coverDraft.code, el.dataset.v) || iso(addDays(parseISO(el.dataset.v), 7)); render(true); queueCoverPreview(); break;
      case 'cv-sub': coverDraft.dateSub = el.dataset.v; render(true); queueCoverPreview(); break;
      case 'cv-load': { const x = state.covers.find((c) => String(c.t) === el.dataset.t); if (x) { Object.assign(coverDraft, JSON.parse(JSON.stringify(x))); if (!coverDraft.teachers.length) coverDraft.teachers = ['']; render(true); queueCoverPreview(); scrollTo({ top: 0, behavior: 'smooth' }); } break; }
      case 'cv-pdf': { el.disabled = true; await coverPDF(); el.disabled = false; break; }
      case 'ct-topic': { const v = el.dataset.v, i = ctDraft.topics.indexOf(v); if (i >= 0) ctDraft.topics.splice(i, 1); else ctDraft.topics.push(v); el.classList.toggle('on'); break; }
      case 'ct-save': saveCt(); break;
      case 'ct-del': sem.cts = sem.cts.filter((c) => c.id !== ctDraft.id); save(); closeSheet(); softRefresh(); toast('CT deleted'); break;
      case 'ctf': ui.ctFilter = el.dataset.v; softRefresh(); break;
      case 'syltab': ui.sylTab = el.dataset.v; softRefresh(); break;
      case 'acc-all': { const all = $$('.acc'); const open = !all.every((d) => d.open); all.forEach((d) => (d.open = open)); el.textContent = open ? 'Collapse all' : 'Expand all'; break; }
      case 'week-sheet': weekSheet(); break;
      case 'wk': ctDraft._sat = $('#wkSat').value || ctDraft._sat; ctDraft._w = Math.max(1, Math.min(S().weeks, ctDraft._w + Number(el.dataset.d))); drawWeekSheet(); break;
      case 'wk-save': { const sat = saturdayOf(parseISO($('#wkSat').value || ctDraft._sat)); sem.startDate = iso(addDays(sat, -(ctDraft._w - 1) * 7)); ui.routineWeek = null; save(); closeSheet(); softRefresh(); toast(`Week ${ctDraft._w} starts ${fmtD(sat)}`); break; }
      case 'new-sem': newSemSheet(el.dataset.v || null); break;
      case 'del-sem': if (Object.keys(state.semesters).length < 2) { toast('Create another semester first', '!'); break; } if (confirm(`Delete ${sem.label} with all its attendance and CTs?`)) { delete state.semesters[sem.id]; state.active = Object.keys(state.semesters)[0]; save(); render(); } break;
      case 'test-notif': if (NATIVE) { if (!nativeNotifOk) await enableNotifications(true); if (nativeNotifOk) { const a = plannedAlerts(7).find((x) => x.id.startsWith('dg-')); await window.ckNative.notifyNow(a ? a.title : 'classkoytay', a ? a.body : 'Notifications are working 🎉'); toast('Test sent'); } break; } if (!('Notification' in window) || Notification.permission !== 'granted') { await enableNotifications(true); } if (Notification.permission === 'granted') { const a = plannedAlerts(7).find((x) => x.id.startsWith('dg-')); showNotif(a || { title: 'classkoytay', body: 'Notifications are working 🎉', tag: 'test' }); } break;
      case 'export-ics': exportICS(); break;
      case 'fence-here': {
        const f = state.settings.fences[Number(el.dataset.i)];
        if (!('geolocation' in navigator)) { toast('Location not supported', '!'); break; }
        el.textContent = 'Locating…';
        navigator.geolocation.getCurrentPosition((p) => { f.lat = p.coords.latitude; f.lng = p.coords.longitude; save(); fencesChanged(); toast(`${f.name} set (±${Math.round(p.coords.accuracy)} m)`, '📍'); render(); }, () => { toast('Could not get location', '!'); render(); }, { enableHighAccuracy: true, timeout: 20000 });
        break;
      }
      case 'theme': state.settings.theme = el.dataset.v; save(); render(); break;
      case 'export-json': download(`classkoytay-backup-${iso(now())}.json`, JSON.stringify(state, null, 1), 'application/json'); break;
      case 'reset-all': if (confirm('Erase everything in classkoytay on this device?')) { localStorage.removeItem(KEY); location.hash = ''; location.reload(); } break;
    }
  });
  document.addEventListener('change', (e) => {
    const t = e.target, sem = S();
    if (t.matches('[data-ct]')) { ctDraft[t.dataset.ct] = t.value; if (['code', 'week'].includes(t.dataset.ct)) { if (t.dataset.ct === 'code') { ctDraft.topics = []; const taken = sem.cts.filter((c) => c.code === t.value && c.id !== ctDraft.id).map((c) => Number(c.num)); ctDraft.num = [1, 2, 3, 4].find((n) => !taken.includes(n)) || 4; } ctDraft.instKey = null; drawCtSheet(); } return; }
    if (t.matches('[data-lt]')) { ltDraft[t.dataset.lt] = t.value; if (['code', 'week'].includes(t.dataset.lt)) { ltDraft.instKey = null; drawLtSheet(); } return; }
    if (t.matches('[data-cv]')) { const k = t.dataset.cv; if (k === 'code') { coverInit(t.value); render(true); } else { coverDraft[k] = t.value; if (k === 'dateExp') { coverDraft.dateSub = nextLabAfter(coverDraft.code, t.value) || iso(addDays(parseISO(t.value), 7)); render(true); } } queueCoverPreview(); return; }
    if (t.matches('[data-cvt]')) { coverDraft.teachers[Number(t.dataset.cvt)] = t.value; render(true); queueCoverPreview(); return; }
    if (t.matches('[data-prof]')) { state.profile[t.dataset.prof] = t.value.trim(); save(); return; }
    if (t.id === 'facDesig') { const edits = state.settings.facultyEdits || (state.settings.facultyEdits = {}); const cf = (state.settings.customFaculty || []).find((f) => f.name === t.dataset.name); if (cf) cf.desig = t.value; else edits[t.dataset.name] = { ...(edits[t.dataset.name] || {}), desig: t.value }; save(); softRefresh(); toast('Designation updated'); return; }
    switch (t.id) {
      case 'onbSat': onb.weekSat = t.value; render(); break;
      case 'wkSat': ctDraft._sat = t.value; drawWeekSheet(); break;
      case 'semSwitch': state.active = t.value; ui.routineWeek = null; ui.sylTab = null; save(); render(); break;
      case 'semLevel': sem.level = t.value; ui.sylTab = null; save(); render(); break;
      case 'semSec': sem.section = t.value; save(); renderTop(); break;
      case 'pasteLink': {
        const r = decodeRoutine(t.value); if (!r) { toast('That is not a classkoytay routine link', '!'); break; }
        pendingImport = r; toast(`Routine for ${r.l}${r.s ? ' Sec ' + r.s : ''} found`, '🔗');
        if (!state.onboarded || !S()) { onb.level = r.l; onb.preset = 'shared'; render(); }
        else if ($('#nsSat')) { ns.level = r.l; ns.source = 'shared'; if (r.s) ns.section = r.s; drawNewSem(); }
        else importSheet(r);
        break;
      }
      case 'semName': sem.label = t.value.trim() || sem.label; save(); renderTop(); break;
      case 'semWeeks': sem.weeks = Math.max(1, Math.min(20, Number(t.value) || 14)); save(); render(); break;
      case 'notifyT': enableNotifications(t.checked); break;
      case 'digestT': state.settings.digestTime = t.value || '20:00'; save(); break;
      case 'beforeT': state.settings.beforeMin = Number(t.value); save(); break;
      case 'ctMorningT': state.settings.ctMorning = t.checked; save(); break;
      case 'unmarkedT': state.settings.unmarkedAs = t.value; save(); renderTop(); break;
      case 'trackT':
        if (NATIVE) { if (t.checked) nativeTrackStart(); else nativeTrackStop(); break; }
        state.settings.tracking = t.checked; save(); if (t.checked) { startTracking(); toast('Tracking on — keep classkoytay open during class', '📡'); } else stopTracking(); render(); break;
      case 'importF': { const f = t.files[0]; if (!f) break; f.text().then((txt) => { try { const d = JSON.parse(txt); if (!d.semesters) throw 0; state = Object.assign(defaults(), d); save(); toast('Backup restored'); render(); } catch { toast('Not a classkoytay backup', '!'); } }); break; }
    }
  });
  document.addEventListener('input', (e) => {
    const t = e.target;
    if (t.id === 'sylQ') { ui.sylQ = t.value; const pos = t.selectionStart; clearTimeout(t._d); t._d = setTimeout(() => { render(); const n = $('#sylQ'); n.focus(); n.setSelectionRange(pos, pos); }, 180); }
    if (t.dataset.actInput === 'fence-r') { const f = state.settings.fences[Number(t.dataset.i)]; f.r = Number(t.value); t.previousElementSibling.textContent = `${f.lat.toFixed(5)}, ${f.lng.toFixed(5)} · radius ${f.r} m`; clearTimeout(t._d); t._d = setTimeout(() => { save(); drawFences(); fencesChanged(); }, 400); }
    if (t.matches('[data-ct]')) ctDraft[t.dataset.ct] = t.value;
    if (t.matches('[data-lt]')) ltDraft[t.dataset.lt] = t.value;
    if (t.matches('[data-cv]') && t.tagName !== 'SELECT' && t.type !== 'date') { coverDraft[t.dataset.cv] = t.value; queueCoverPreview(); }
    if (t.matches('[data-prof]')) { state.profile[t.dataset.prof] = t.value; persist(); queueCoverPreview(); }
    if (t.id === 'facQ') { ui.facQ = t.value; const pos = t.selectionStart; clearTimeout(t._d); t._d = setTimeout(() => { render(true); const n = $('#facQ'); n.focus(); n.setSelectionRange(pos, pos); }, 180); }
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSheet(); });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') { if (state.settings.tracking && !NATIVE) requestWake(); onResume(); } });
  function onResume() { tick(); nativeRefresh().then(resumeBackgroundGrant); if (cloudUser) cloudCheck(false); softRefresh(); }

  /* ---------------- clock ---------------- */
  let lastMinute = -1;
  function tick() {
    if (!state.onboarded || !S()) return;
    notifyTick(); if (!NATIVE) closeOutClasses(); else nativeReconcile();
    const m = Math.floor(now().getTime() / 60000);
    if (m !== lastMinute) { lastMinute = m; if (route === 'today' && !$('#sheetWrap').classList.contains('open')) softRefresh(); else renderTop(); }
  }

  /* ---------------- boot ---------------- */
  if (!NATIVE && 'serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('sw.js').then((r) => { swReg = r; }).catch(() => {});
    navigator.serviceWorker.addEventListener?.('message', () => {});
  }
  function takeImportFromHash() {
    if (!location.hash.startsWith('#import=')) return false;
    const r = decodeRoutine(location.hash); history.replaceState(null, '', location.pathname + '#today'); route = 'today'; routeArg = null;
    if (!r) { toast('Routine link is broken', '!'); return false; }
    pendingImport = r; if (state.onboarded && S()) { render(); importSheet(r); } else render();
    return true;
  }
  window.addEventListener('hashchange', takeImportFromHash);
  const h = location.hash.slice(1).split('/'); route = h[0] || 'today'; routeArg = h[1] ? decodeURIComponent(h[1]) : null;
  if (!takeImportFromHash()) render();
  if (state.settings.tracking && state.onboarded && !NATIVE) startTracking();
  CLOUD.onUser((u) => { const was = cloudUser && cloudUser.uid; cloudUser = u; if (u && u.uid !== was) cloudCheck(false); else if (!u) render(); else renderTop(); });
  if (NATIVE) {
    const nn = window.ckNative;
    const notifReady = nn.notifyGranted().then((ok) => { nativeNotifOk = ok; if (ok && state.settings.notify) scheduleNativeAlerts(); });
    nn.onResume(onResume);
    nn.onNotificationTap((url) => { location.hash = url.replace(/^.*#/, ''); });
    nn.onBack(() => { if ($('#sheetWrap').classList.contains('open')) closeSheet(); else if (!state.onboarded && onb.step > 0) { onb.step--; render(); } else if (route !== 'today' && state.onboarded) go('today'); else nn.exitApp(); });
    Promise.all([notifReady, nativeRefresh()]).then(() => setTimeout(firstLaunchPermissions, 700)).catch(() => {});
  }
  setInterval(tick, 20000); setTimeout(tick, 1500);

  // Debug hooks (handy for testing geofence without walking to campus)
  window.classkoytay = { state: () => state, simulateFix: (lat, lng, acc = 10) => handleFix({ lat, lng, acc, t: now().getTime() }), stats, plannedAlerts, buildCoverDoc, ctResult };
})();
