/* classkoytay — RUET class routine · attendance · CT · syllabus
   Everything is stored on-device (localStorage). No account, no server. */
(() => {
  'use strict';
  const SY = window.SYLLABUS, R = window.RUET, PRESETS = window.ROUTINE_PRESETS;
  const KEY = 'classkoytay.v1';
  const DAY_MS = 864e5;
  const LEVELS = ['1-1', '1-2', '2-1', '2-2', '3-1', '3-2', '4-1', '4-2'];
  const PALETTE = ['#7c8cff', '#2ee6c5', '#f472b6', '#fbbf24', '#60a5fa', '#a78bfa', '#fb923c', '#34d399', '#f87171', '#22d3ee', '#e879f9', '#a3e635'];

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
    },
    notified: {},
    geoLog: [],
  });
  let state;
  try { state = Object.assign(defaults(), JSON.parse(localStorage.getItem(KEY) || 'null') || {}); } catch { state = defaults(); }
  state.settings = Object.assign(defaults().settings, state.settings);
  const save = () => {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { toast('Could not save — storage full?', '⚠'); }
    queueForServiceWorker(); scheduleCloud(); scheduleNativeAlerts();
  };
  const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* ignore */ } };
  const S = () => state.semesters[state.active];

  function newSemester({ level, label, section, startDate, weeks = 14 }) {
    const id = uid();
    state.semesters[id] = { id, level, label: label || `${level} Semester`, section: section || '', startDate, weeks, routine: { sat: [], sun: [], mon: [], tue: [], wed: [] }, records: {}, cts: [], offDays: [], custom: {} };
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
  function toast(msg, ic = '✓') {
    const el = document.createElement('div'); el.className = 'toast'; el.innerHTML = `<span class="ic">${ic}</span><span>${esc(msg)}</span>`;
    $('#toasts').append(el); setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 400); }, 2600);
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
    sh.addEventListener('touchstart', (e) => { if (sh.scrollTop <= 0) y0 = e.touches[0].clientY; }, { passive: true });
    sh.addEventListener('touchmove', (e) => { if (y0 == null) return; const dy = e.touches[0].clientY - y0; if (dy > 0) sh.style.transform = `translate(-50%, ${dy}px)`; }, { passive: true });
    sh.addEventListener('touchend', (e) => { if (y0 == null) return; const dy = e.changedTouches[0].clientY - y0; sh.style.transform = ''; y0 = null; if (dy > 110) closeSheet(); });
  })();

  /* ---------------- routing ---------------- */
  let route = 'today', routeArg = null;
  const ui = { routineMode: 'week', routineWeek: null, sylTab: null, sylQ: '', ctFilter: 'upcoming' };
  function go(to, arg = null) { route = to; routeArg = arg; location.hash = arg ? `${to}/${encodeURIComponent(arg)}` : to; }
  window.addEventListener('hashchange', () => { const [r, a] = location.hash.slice(1).split('/'); route = r || 'today'; routeArg = a ? decodeURIComponent(a) : null; render(); });

  function render() {
    applyTheme();
    if (!state.onboarded || !S()) { document.body.classList.add('has-onb'); $('#view').innerHTML = viewOnboarding(); return; }
    document.body.classList.remove('has-onb');
    renderTop();
    const views = { today: viewToday, routine: viewRoutine, attendance: viewAttendance, course: viewCourse, ct: viewCT, syllabus: viewSyllabus, syl: viewSyllabusCourse, settings: viewSettings };
    const fn = views[route] || viewToday;
    $('#view').innerHTML = `<div class="page">${fn(routeArg)}</div>`;
    const tabs = ['today', 'routine', 'attendance', 'ct', 'syllabus'];
    const map = { course: 'attendance', syl: 'syllabus', settings: null };
    const active = tabs.indexOf(route in map ? map[route] : route);
    $$('#tabbar button').forEach((b, i) => b.classList.toggle('on', i === active));
    $('#tabInk').style.opacity = active < 0 ? 0 : 1;
    if (active >= 0) $('#tabInk').style.transform = `translateX(${active * 100}%)`;
    requestAnimationFrame(() => { animateMeters(); if (route === 'settings') initMap(); });
    window.scrollTo({ top: 0 });
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
    $('#absentStrip').innerHTML = codes.length ? codes.map((c, i) => {
      const st = stats(c, sem);
      return `<button class="ab-chip" style="--i:${i};--c:${toneFor(st.marks)}" data-act="go" data-to="course" data-arg="${esc(c)}" title="${esc(courseInfo(c).title)}">
        <span class="ab-count">${st.Ae}</span><span><b class="mono">${esc(c)}</b><small>${Math.round(st.pct)}% · ${st.marks}/10</small></span></button>`;
    }).join('') : `<span class="small muted" style="padding:6px 2px">Add classes in Routine to start tracking absences.</span>`;
  }

  /* ---------------- Routine source (preset / shared link / blank) ---------------- */
  function defaultSource(level) {
    if (pendingImport && pendingImport.l === level) return 'shared';
    const p = presetsFor(level)[0]; return p ? `p:${p[0]}:C` : 'blank';
  }
  function routineSourceChips(level, selected, act) {
    const opts = [];
    if (pendingImport && pendingImport.l === level) opts.push(['shared', `🔗 Shared routine · ${level}${pendingImport.s ? ` · Sec ${pendingImport.s}` : ''}`, `${routineCount(pendingImport)} classes from a classmate's link`]);
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
          <span class="tag" style="font:700 14px 'Space Grotesk';padding:8px 10px">${esc(s.level)}</span>
          <span class="sp"><b>${esc(s.label)}${s.section ? ` · Sec ${esc(s.section)}` : ''}</b><br><span class="small muted">${weekLabel(s)} · ${codes.length} course${codes.length === 1 ? "" : "s"} · ${abs} absence${abs === 1 ? "" : "s"}</span></span>
          ${s.id === cur.id ? '<span class="tag good">current</span>' : '<span class="faint">›</span>'}</button>`;
      }).join('')}</div>
      <div class="acts"><button class="btn primary" data-act="new-sem">＋ New semester</button></div>`);
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
    const dots = `<div class="dots">${[0, 1, 2, 3].map((i) => `<i class="${i === onb.step ? 'on' : ''}"></i>`).join('')}</div>`;
    if (onb.step === 0) return `<div class="onb page">
      <div class="hero-mark"></div>
      <h1>Never lose a <em>mark</em> to attendance again.</h1>
      <p class="muted">classkoytay keeps your RUET routine, counts every absence against the syllabus rule (90% → 10 marks), reminds you of tomorrow's classes &amp; CTs, and can auto-mark you present when you walk into the EEE or CSE building.</p>
      ${dots}<button class="btn primary block" data-act="onb-next">Let's set up</button>
      ${CLOUD.configured ? `<button class="btn block" style="margin-top:10px" data-act="cloud-login">${GOOGLE_G} Continue with Google — restore my data</button>` : ''}</div>`;
    if (onb.step === 1) return `<div class="onb page"><h1>Which <em>semester</em>?</h1>
      <p class="muted">Courses come from the RUET EEE syllabus. You can add more semesters later.</p>
      <div class="big-choice">${LEVELS.map((l) => `<button class="chip ${onb.level === l ? 'on' : ''}" data-act="onb-level" data-v="${l}">${l}</button>`).join('')}</div>
      ${dots}<div class="row"><button class="btn" data-act="onb-back">Back</button><button class="btn primary sp" data-act="onb-next">Continue</button></div></div>`;
    if (onb.step === 2) {
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
    const cts = upcomingCTs(sem).slice(0, 3);
    const codes = scheduledCourses(sem);
    const risky = codes.map((c) => ({ c, s: stats(c, sem) })).filter((x) => x.s.Ae > 0 && x.s.left90 <= 1).sort((a, b) => a.s.left90 - b.s.left90);
    const totalA = codes.reduce((a, c) => a + stats(c, sem).Ae, 0);
    const avg = codes.length ? codes.reduce((a, c) => a + stats(c, sem).pct, 0) / codes.length : 100;
    const doneToday = todays.filter((i) => i.end <= t).length;
    const greeting = t.getHours() < 12 ? 'Good morning' : t.getHours() < 17 ? 'Good afternoon' : 'Good evening';
    const tr = trackerState();
    return `<div class="stagger">
      <section class="hero" style="--i:0">
        <div class="row"><span class="muted small">${fmtD(t)}</span><span class="sp"></span>
          <button class="track-pill ${tr.cls}" data-act="go" data-to="settings"><span class="d"></span>${tr.label}</button></div>
        <h1>${greeting} 👋</h1>
        <div class="muted small">${todays.length ? (isOff ? 'Marked as a holiday — no classes counted today.' : `${todays.length} class${todays.length > 1 ? 'es' : ''} today · ${doneToday} done`) : dayKeyOfDate(t) ? 'No classes today. Breathe.' : 'Weekend (Thu–Fri). Enjoy!'}</div>
        <div class="stats">
          <div class="stat"><b class="num">${Math.round(avg)}%</b><span>avg attendance</span></div>
          <div class="stat"><b class="num">${totalA}</b><span>absences total</span></div>
          <div class="stat"><b class="num">${cts.length ? daysUntil(cts[0].date) : '–'}</b><span>${cts.length ? `days to ${esc(cts[0].code)} CT` : 'no CT planned'}</span></div>
        </div>
      </section>
      ${weekOf(t, sem) > sem.weeks ? `<div class="card row" style="--i:1;margin-top:12px"><span style="font-size:28px">🎓</span><div class="sp"><b>${esc(sem.label)} is finished</b><div class="small muted">Start ${nextLevel(sem.level)} — this semester stays saved.</div></div><button class="btn primary sm" data-act="new-sem" data-v="${nextLevel(sem.level)}">Start ${nextLevel(sem.level)}</button></div>` : ''}
      ${risky.length ? `<div class="note warn" style="--i:1;margin-top:12px">⚠️ ${risky.map((r) => `<b>${esc(r.c)}</b> ${r.s.left90 < 0 ? `is below 90% (${r.s.finalMarks}/10 max now)` : r.s.left90 === 0 ? 'has <b>no</b> absences left for 10/10' : 'has only 1 absence left for 10/10'}`).join(' · ')}</div>` : ''}
      <h2 class="sec" style="--i:2">Today${dayKeyOfDate(t) && todays.length ? `<span class="sp"></span><button class="btn sm" data-act="toggle-off" data-iso="${iso(t)}">${isOff ? 'Undo holiday' : 'Mark holiday'}</button>` : ''}</h2>
      ${todays.length ? `<div class="timeline">${todays.map((i, n) => classCard(i, n + 3, t)).join('')}</div>` : `<div class="card empty" style="--i:3"><div class="big">☕</div><div>No classes scheduled today.</div></div>`}
      ${cts.length ? `<h2 class="sec" style="--i:6">Upcoming CTs<span class="sp"></span><button class="btn sm" data-act="go" data-to="ct">All</button></h2>${cts.map((c, n) => ctCard(c, n + 7)).join('')}` : ''}
      ${nextDay ? `<h2 class="sec" style="--i:9">Next class day · ${fmtD(nextDay)}</h2>
        <div class="card" style="--i:10">${nextList.map((i) => { const c = courseInfo(i.code); const ct = ctAt(i); return `<div class="row" style="padding:6px 0"><span class="mono small muted" style="width:62px">${fmt12(slotStart(i.slot))}</span><span style="width:8px;height:8px;border-radius:3px;background:${colorOf(i.code)}"></span><b class="mono small">${esc(i.code)}</b><span class="small muted" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(shortTitle(c.title))}</span><span class="sp"></span>${ct ? `<span class="tag ct">CT-${ct.num}</span>` : ''}<span class="small faint">${esc(i.slot.room || '')}</span></div>`; }).join('')}</div>` : ''}
    </div>`;
  }
  function classCard(i, n, t) {
    const sem = S(), c = courseInfo(i.code), s = statusOf(i, sem), rec = sem.records[i.key];
    const isNow = t >= i.start && t < i.end, done = i.end <= t;
    const ct = ctAt(i);
    const st = stats(i.code, sem);
    return `<div class="tl-item" style="--i:${n}">
      <div class="tl-time">${fmt12(slotStart(i.slot)).replace(' ', '<small>')}</small></div>
      <div class="cls ${isNow ? 'now' : ''} ${done ? 'done' : ''}" style="--cc:${colorOf(i.code)}">
        <div class="row"><span class="cls-code">${esc(i.code)}</span>${i.slot.span > 1 ? '<span class="tag info">Lab</span>' : ''}${ct ? `<span class="tag ct">CT-${ct.num}</span>` : ''}</div>
        <div class="cls-title">${esc(c.title)}</div>
        <div class="cls-meta"><span>🕘 ${fmt12(slotStart(i.slot))} – ${fmt12(slotEnd(i.slot))}</span>${i.slot.room ? `<span>📍 ${esc(i.slot.room)}</span>` : ''}${i.slot.teacher ? `<span>👤 ${esc(i.slot.teacher)}</span>` : ''}<span>${st.Ae} absent · ${st.left90 >= 0 ? `${st.left90} left` : 'below 90%'}</span></div>
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
    </div>${rec ? `<div class="small faint" style="margin-top:6px">${rec.src === 'gps' ? '📡 auto-marked by location' : '✋ marked manually'}</div>` : ''}`;
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
      cellsHtml += `<div class="rday ${isToday ? 'today' : ''}" style="grid-row:${dayIdx(d.key) + 2};grid-column:1${!tmpl ? ';cursor:pointer' : ''}" ${!tmpl ? `data-act="day-menu" data-iso="${iso(date)}"` : ''}>${d.short}${!tmpl ? `<small>${date.getDate()} ${MONTHS[date.getMonth()]}</small>` : ''}${off ? '<small>🏖 off</small>' : ''}</div>`;
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
        const ct = tmpl ? null : ctAt(inst);
        const c = courseInfo(s.code);
        cellsHtml += `<div class="rcell ${off ? 'offday' : ''}" style="grid-row:${row};grid-column:${c0}/${c1}">
          <button class="rslot" style="--cc:${colorOf(s.code)};--i:${k++}" data-act="${tmpl ? 'edit-slot' : 'inst'}" data-day="${d.key}" data-id="${s.id}" data-iso="${iso(date)}">
            <b>${esc(s.code)}</b><span class="t">${esc(shortTitle(c.title))}</span><span class="t">${esc([s.teacher, s.room].filter(Boolean).join(' · '))}</span>
            ${!tmpl && st !== 'OFF' ? `<span class="st ${st || (inst.end <= t ? 'U' : '')}">${st === 'P' ? '✓' : st === 'A' ? '✕' : st === 'C' ? '–' : ''}</span>` : ''}
            ${ct ? `<span class="tag ct ctb">CT-${ct.num}</span>` : ''}
          </button></div>`;
        void span;
      }
      for (let p = 1; p <= 9; p++) if (!covered.has(p)) cellsHtml += `<div class="rcell add ${tmpl ? '' : 'off'}" style="grid-row:${row};grid-column:${col(p)}" ${tmpl ? `data-act="add-slot" data-day="${d.key}" data-p="${p}"` : ''}>${tmpl ? '+' : ''}</div>`;
      cellsHtml += `<div class="rgap" style="grid-row:${row};grid-column:5"></div><div class="rgap" style="grid-row:${row};grid-column:9"></div>`;
    }
    const wStart = dateFor(w, 'sat', sem), wEnd = dateFor(w, 'wed', sem);
    return `<h1 class="page-title">Routine</h1><p class="page-sub">${esc(sem.label)} · 8:00 AM – 5:00 PM · Sat – Wed</p>
      <div class="seg" style="margin-bottom:12px"><button class="${!tmpl ? 'on' : ''}" data-act="rmode" data-v="week">📅 This week</button><button class="${tmpl ? 'on' : ''}" data-act="rmode" data-v="template">✏️ Edit routine</button></div>
      ${tmpl ? `<div class="note" style="margin-bottom:12px">Tap <b>+</b> on any box to put a course there. Tap a course to edit, change length (labs = 3 periods) or remove. This routine repeats for all ${sem.weeks} weeks.</div>` : `
      <div class="week-nav"><button class="icon-btn" data-act="rweek" data-d="-1" aria-label="Previous week"><svg viewBox="0 0 24 24"><path d="m15 18-6-6 6-6"/></svg></button>
        <div class="lbl">Week ${w}${w === curW && weekOf(t, sem) === w ? ' <span class="tag good">running</span>' : ''}<small>${fmtD(wStart)} – ${fmtD(wEnd)}</small></div>
        <button class="icon-btn" data-act="rweek" data-d="1" aria-label="Next week"><svg viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg></button></div>`}
      <div class="grid-scroll"><div class="rgrid">${head}${cellsHtml}</div></div>
      <div class="row wrap small muted" style="margin-top:10px;gap:14px">${tmpl ? '<span>Break 10:30–10:50 · Lunch 1:20–2:30 (striped columns)</span>' : '<span><span class="st P" style="display:inline-grid;width:14px;height:14px;border-radius:4px;color:#fff;font-size:9px">✓</span> present</span><span><span class="st A" style="display:inline-grid;width:14px;height:14px;border-radius:4px;color:#fff;font-size:9px">✕</span> absent</span><span>Tap a class to mark or add a CT · tap a day to mark holiday</span>'}</div>
      ${tmpl ? `<div class="row wrap" style="margin-top:16px"><button class="btn" data-act="share-routine">🔗 Share with section</button><button class="btn" data-act="import-preset">⤓ Import routine</button><button class="btn" data-act="add-custom-course">＋ Custom course</button><button class="btn danger" data-act="clear-routine">Clear routine</button></div>` : ''}`;
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
      <datalist id="tlist">${Object.entries(R.teachers).map(([k, v]) => `<option value="${k}">${esc(v)}</option>`).join('')}</datalist>
      <label class="f">Note (optional)</label><input class="in" id="fN" value="${esc(s.note)}" placeholder="e.g. alternate group">
      <div class="acts">${slot ? `<button class="btn danger" data-act="del-slot" data-day="${day}" data-id="${slot.id}">Remove</button>` : ''}<button class="btn primary" data-act="save-slot" data-day="${day}" data-id="${slot ? slot.id : ''}">Save</button></div>`);
  }
  function instSheet(day, id, isoDate) {
    const sem = S(), slot = sem.routine[day].find((x) => x.id === id); if (!slot) return;
    const date = parseISO(isoDate), inst = mkInst(sem, date, weekOf(date, sem), day, slot);
    const s = statusOf(inst, sem), rec = sem.records[inst.key], c = courseInfo(slot.code), ct = ctAt(inst);
    openSheet(`<div class="row"><span class="tag" style="color:${colorOf(slot.code)}">${esc(slot.code)}</span><span class="tag">Week ${inst.week}</span>${ct ? `<span class="tag ct">CT-${ct.num}</span>` : ''}</div>
      <h3 style="margin-top:10px">${esc(c.title)}</h3><p class="muted small">${fmtD(date)} · ${fmt12(slotStart(slot))} – ${fmt12(slotEnd(slot))}${slot.room ? ` · ${esc(slot.room)}` : ''}</p>
      ${s === 'OFF' ? '<div class="note">This day is marked as a holiday.</div>' : paButtons(inst, s, rec)}
      <div class="acts"><button class="btn" data-act="ct-new" data-code="${esc(slot.code)}" data-key="${inst.key}">${ct ? 'Edit CT' : '＋ Add CT here'}</button><button class="btn" data-act="go" data-to="course" data-arg="${esc(slot.code)}">Course stats</button></div>`);
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
      ${lab.length ? `<h2 class="sec" style="--i:6">Sessional / Lab</h2><div class="grid2">${lab.map((c, i) => card(c, i + 7)).join('')}</div>` : ''}</div>` : `<div class="card empty"><div class="big">🗓️</div><div>No classes in your routine yet.</div><button class="btn primary" style="margin-top:12px" data-act="go-template">Build routine</button></div>`}
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
    const cts = sem.cts.filter((x) => x.code === code).sort((a, b) => a.num - b.num);
    const ctm = ctMarks(code);
    return `<button class="btn sm" data-act="back" style="margin-top:6px">← Back</button>
      <h1 class="page-title" style="color:${colorOf(code)}">${esc(code)}</h1><p class="page-sub">${esc(c.title)} · ${c.credits ? `${esc(c.credits)} credits` : ''}</p>
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
      <h2 class="sec" style="--i:5">Class tests<span class="sp"></span><button class="btn sm" data-act="ct-new" data-code="${esc(code)}">＋ Add CT</button></h2>
      ${cts.length ? cts.map((x, i) => ctCard(x, 6 + i)).join('') + (ctm.count ? `<div class="card" style="--i:10"><div class="row"><span class="muted small">Best ${Math.min(3, ctm.count)} of ${ctm.count} (syllabus §15)</span><span class="sp"></span><span class="score">${ctm.scaled.toFixed(1)}<small class="muted" style="font-size:13px">/20</small></span></div></div>` : '') : `<div class="card empty" style="--i:6;padding:20px">No CTs added for this course.</div>`}
      <div class="row" style="margin-top:16px;--i:11"><button class="btn block" data-act="go" data-to="syl" data-arg="${esc(code)}">📖 Open syllabus for ${esc(code)}</button></div>
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

  /* ---------------- CTs ---------------- */
  const ctDate = (ct) => parseISO(ct.iso);
  function ctAt(inst) { return S().cts.find((c) => c.instKey === inst.key) || null; }
  function upcomingCTs(sem = S()) { const t = startOfDay(now()); return sem.cts.filter((c) => ctDate(c) >= t).map((c) => ({ ...c, date: ctDate(c) })).sort((a, b) => a.date - b.date || a.p - b.p); }
  function ctMarks(code) {
    const scored = S().cts.filter((c) => c.code === code && c.score !== '' && c.score != null).map((c) => (Number(c.score) / Number(c.outOf || 20)) * 20).sort((a, b) => b - a);
    const best = scored.slice(0, 3); return { count: scored.length, scaled: best.length ? best.reduce((a, b) => a + b, 0) / best.length : 0 };
  }
  function ctCard(c0, n) {
    const c = { ...c0, date: ctDate(c0) }, past = c.date < startOfDay(now()), du = daysUntil(c.date);
    const period = R.periods[(c.p || 1) - 1];
    return `<div class="card ct-card ${past ? 'past' : ''}" style="--i:${n};cursor:pointer" data-act="ct-edit" data-id="${c.id}">
      <div class="ct-date"><span>${MONTHS[c.date.getMonth()]}</span><b>${c.date.getDate()}</b><span>${WD[c.date.getDay()]}</span></div>
      <div><div class="row"><b class="mono" style="color:${colorOf(c.code)}">${esc(c.code)}</b><span class="tag ct">CT-${c.num}</span><span class="sp"></span>${past ? (c.score !== '' && c.score != null ? `<span class="score">${esc(c.score)}<small class="muted" style="font-size:12px">/${esc(c.outOf || 20)}</small></span>` : '<span class="tag warn">add score</span>') : `<span class="countdown">${du === 0 ? 'TODAY' : du === 1 ? 'Tomorrow' : `in ${du} days`}</span>`}</div>
      <div class="small muted" style="margin:2px 0 6px">${esc(shortTitle(courseInfo(c.code).title))} · Week ${weekOf(c.date)} · Period ${c.p} (${fmt12(period.start)})</div>
      ${c.topics && c.topics.length ? `<div class="chips">${c.topics.map((x) => `<span class="tag">${esc(x)}</span>`).join('')}</div>` : ''}
      ${c.note ? `<div class="small" style="margin-top:6px">${esc(c.note)}</div>` : ''}</div></div>`;
  }
  function viewCT() {
    const sem = S(), up = upcomingCTs(sem), t = startOfDay(now());
    const past = sem.cts.filter((c) => ctDate(c) < t).sort((a, b) => ctDate(b) - ctDate(a));
    const list = ui.ctFilter === 'upcoming' ? up : past;
    const codes = scheduledCourses(sem).filter((c) => !courseInfo(c).sessional);
    return `<h1 class="page-title">Class Tests</h1><p class="page-sub">CTs follow your routine — pick the course and week, then the exact class slot. Best 3 of 4 count (20 marks).</p>
      <div class="seg" style="margin-bottom:14px"><button class="${ui.ctFilter === 'upcoming' ? 'on' : ''}" data-act="ctf" data-v="upcoming">Upcoming (${up.length})</button><button class="${ui.ctFilter === 'past' ? 'on' : ''}" data-act="ctf" data-v="past">Done (${past.length})</button></div>
      <div class="stagger">${list.length ? list.map((c, i) => ctCard(c, i)).join('') : `<div class="card empty"><div class="big">📝</div><div>${ui.ctFilter === 'upcoming' ? 'No upcoming CTs. Tap ＋ when a teacher announces one.' : 'No finished CTs yet.'}</div></div>`}</div>
      ${codes.length ? `<h2 class="sec">CT marks so far</h2><div class="card">${codes.map((c) => { const m = ctMarks(c); return `<div class="row" style="padding:7px 0"><b class="mono small" style="color:${colorOf(c)};width:84px">${esc(c)}</b><div class="bar sp"><i data-v="${(m.scaled / 20) * 100}" style="--bc:${colorOf(c)}"></i></div><span class="num small" style="width:64px;text-align:right">${m.count ? `${m.scaled.toFixed(1)}/20` : '—'}</span></div>`; }).join('')}</div>` : ''}
      <button class="fab" data-act="ct-new" aria-label="Add CT"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg></button>`;
  }
  const ctDraft = {};
  function ctSheet({ id = null, code = null, key = null } = {}) {
    const sem = S();
    const existing = id ? sem.cts.find((c) => c.id === id) : key ? sem.cts.find((c) => c.instKey === key) : null;
    const codes = scheduledCourses(sem);
    if (!codes.length) { toast('Add classes to your routine first', '!'); return; }
    Object.assign(ctDraft, existing ? JSON.parse(JSON.stringify(existing)) : { id: null, code: code || codes.find((c) => !courseInfo(c).sessional) || codes[0], num: null, instKey: key, topics: [], note: '', score: '', outOf: 20 });
    if (!existing && key) { const [d] = key.split('|'); ctDraft.week = weekOf(parseISO(d)); }
    if (!ctDraft.week) ctDraft.week = ctDraft.iso ? weekOf(parseISO(ctDraft.iso)) : Math.min(Math.max(weekOf(now()), 1), sem.weeks);
    if (ctDraft.num == null) ctDraft.num = Math.min(4, sem.cts.filter((c) => c.code === ctDraft.code).length + 1);
    drawCtSheet();
  }
  function drawCtSheet() {
    const sem = S(), d = ctDraft, c = courseInfo(d.code), codes = scheduledCourses(sem);
    const slots = allInstances(sem, d.code).filter((i) => i.week === Number(d.week));
    const topics = (c.topics || []).filter((x) => x.t);
    const isPast = d.iso && parseISO(d.iso) < startOfDay(now());
    openSheet(`<h3>${d.id ? 'Edit CT' : 'New class test'}</h3><p class="muted small">CTs are taken in a regular class period of the routine.</p>
      <label class="f">Course</label><select class="in" data-ct="code">${codes.map((x) => `<option value="${esc(x)}" ${x === d.code ? 'selected' : ''}>${esc(x)} — ${esc(courseInfo(x).title)}</option>`).join('')}</select>
      <div class="grid2" style="grid-template-columns:1fr 1fr;gap:10px"><div><label class="f">CT number</label><select class="in" data-ct="num">${[1, 2, 3, 4].map((n) => `<option ${n === Number(d.num) ? 'selected' : ''}>${n}</option>`).join('')}</select></div>
      <div><label class="f">Week</label><select class="in" data-ct="week">${Array.from({ length: sem.weeks }, (_, i) => `<option value="${i + 1}" ${i + 1 === Number(d.week) ? 'selected' : ''}>Week ${i + 1}</option>`).join('')}</select></div></div>
      <label class="f">Which class? (from your routine)</label>
      <div class="chips">${slots.length ? slots.map((i) => `<button class="chip ${d.instKey === i.key ? 'on' : ''}" data-act="ct-slot" data-k="${i.key}">${fmtD(i.date)}<br><span class="small muted">Period ${i.slot.p} · ${fmt12(slotStart(i.slot))}</span></button>`).join('') : '<span class="small muted">This course has no class in that week.</span>'}</div>
      ${topics.length ? `<label class="f">Syllabus topics covered</label><div class="chips">${topics.map((x) => `<button class="chip ${d.topics.includes(x.t) ? 'on' : ''}" data-act="ct-topic" data-v="${esc(x.t)}">${esc(x.t)}</button>`).join('')}</div>` : ''}
      <label class="f">Notes</label><input class="in" data-ct="note" value="${esc(d.note)}" placeholder="e.g. Fourier series, closed book">
      ${isPast || d.id ? `<div class="grid2" style="grid-template-columns:1fr 1fr;gap:10px"><div><label class="f">Your score</label><input class="in" type="number" min="0" step="0.5" data-ct="score" value="${esc(d.score)}" placeholder="–"></div><div><label class="f">Out of</label><input class="in" type="number" min="1" data-ct="outOf" value="${esc(d.outOf || 20)}"></div></div>` : ''}
      <div class="acts">${d.id ? `<button class="btn danger" data-act="ct-del">Delete</button>` : ''}<button class="btn primary" data-act="ct-save">Save CT</button></div>`);
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
    return `<h1 class="page-title">Syllabus</h1><p class="page-sub">RUET EEE · 2024 syllabus. Tap any course for its full outline.</p>
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
    return `<button class="btn sm" data-act="back" style="margin-top:6px">← Back</button>
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

  /* ---------------- Settings ---------------- */
  function viewSettings() {
    const sem = S(), st = state.settings;
    const perm = NATIVE ? (nativeNotifOk ? 'granted' : 'default') : 'Notification' in window ? Notification.permission : 'unsupported';
    const tr = trackerState();
    return `<button class="btn sm" data-act="back" style="margin-top:6px">← Back</button><h1 class="page-title">Settings</h1><p class="page-sub">Semester, week, reminders and campus tracking.</p>
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
        <div class="row wrap" style="margin-top:12px"><button class="btn" data-act="new-sem">＋ New semester</button><button class="btn danger" data-act="del-sem">Delete this semester</button></div>
      </div>

      <h2 class="sec" style="--i:2">Reminders</h2>
      <div class="card" style="--i:3">
        <div class="set-row"><div class="t"><b>Notifications</b><span>${perm === 'granted' ? 'Allowed' : perm === 'denied' ? 'Blocked in browser settings' : perm === 'unsupported' ? 'Not supported in this browser' : 'Tap to allow'}</span></div><label class="switch"><input type="checkbox" id="notifyT" ${st.notify && perm === 'granted' ? 'checked' : ''}><span></span></label></div>
        <div class="set-row"><div class="t"><b>Tomorrow's summary at</b><span>Classes, labs &amp; CTs of the next day</span></div><input class="in" type="time" id="digestT" style="width:120px" value="${st.digestTime}"></div>
        <div class="set-row"><div class="t"><b>Before each class</b><span>minutes</span></div><select class="in" id="beforeT" style="width:100px">${[0, 5, 10, 15, 30].map((m) => `<option value="${m}" ${m === st.beforeMin ? 'selected' : ''}>${m ? m + ' min' : 'Off'}</option>`).join('')}</select></div>
        <div class="set-row"><div class="t"><b>CT morning alert</b><span>7:00 AM on CT day</span></div><label class="switch"><input type="checkbox" id="ctMorningT" ${st.ctMorning ? 'checked' : ''}><span></span></label></div>
        <div class="row wrap" style="margin-top:12px"><button class="btn" data-act="test-notif">Send test notification</button><button class="btn" data-act="export-ics">⤓ Add semester to phone calendar (.ics)</button></div>
        <p class="small muted" style="margin:10px 0 0">${NATIVE ? 'Reminders are scheduled on your phone for the next 10 days and refresh every time you open the app — they ring even when classkoytay is closed.' : 'Reminders fire while classkoytay is open or installed (Add to Home screen). For guaranteed alarms, get the Android app or import the .ics file into Google Calendar.'}</p>
      </div>

      <h2 class="sec" style="--i:4">Auto attendance by location</h2>
      <div class="card" style="--i:5">
        <div class="set-row"><div class="t"><b>Track me during class time</b><span>${tr.detail}</span></div><label class="switch"><input type="checkbox" id="trackT" ${st.tracking ? 'checked' : ''}><span></span></label></div>
        ${NATIVE && state.settings.tracking && nativeGeo && !nativeGeo.permission ? `<div class="note warn" style="margin-bottom:10px">Android needs location set to <b>“Allow all the time”</b> for background attendance. <button class="btn sm" data-act="geo-settings" style="margin-top:8px">Open app settings</button></div>` : ''}
        ${!NATIVE ? '<div class="note" style="margin-bottom:10px">📱 In the browser, tracking only works while this page is open. The <b>Android app</b> tracks in the background.</div>' : ''}
        <p class="small muted">Only the <b>EEE</b> and <b>CSE</b> buildings count — not the whole campus. If you are inside either building at any point during a class, that class is marked <b style="color:var(--good)">present</b>; if tracking was on for the whole class and you never entered, it is marked <b style="color:var(--bad)">absent</b>. Manual marks always win.</p>
        <div id="map" class="map"></div>
        ${st.fences.map((f, i) => `<div class="fence-row"><div><b>${esc(f.name)}</b><div class="small muted mono">${f.lat.toFixed(5)}, ${f.lng.toFixed(5)} · radius ${f.r} m</div><input type="range" min="15" max="120" value="${f.r}" data-act-input="fence-r" data-i="${i}" style="width:100%;accent-color:var(--accent)"></div>
          <button class="btn sm" data-act="fence-here" data-i="${i}">📍 I'm inside now</button></div>`).join('')}
        <div class="note warn" style="margin-top:10px">The building positions are approximate. Stand inside the EEE building and tap <b>“I'm inside now”</b>, then do the same in the CSE building — or drag the pins on the map. This makes auto-attendance accurate.</div>
        ${state.geoLog.length ? `<label class="f">Recent location events</label><div class="log">${state.geoLog.slice(-12).reverse().map((g) => `<div>${new Date(g.t).toLocaleString()} — ${g.inside ? `entered ${esc(g.fence)}` : 'left buildings'}</div>`).join('')}</div>` : ''}
      </div>

      <h2 class="sec" style="--i:6">Attendance counting</h2>
      <div class="card" style="--i:7">
        <div class="set-row"><div class="t"><b>Past classes I didn't mark</b><span>Most students only mark absences</span></div><select class="in" id="unmarkedT" style="width:150px">${[['present', 'Count present'], ['absent', 'Count absent'], ['ignore', 'Ignore']].map(([v, l]) => `<option value="${v}" ${st.unmarkedAs === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
        <div class="set-row"><div class="t"><b>Theme</b></div><div class="seg">${['auto', 'dark', 'light'].map((v) => `<button class="${st.theme === v ? 'on' : ''}" data-act="theme" data-v="${v}">${v}</button>`).join('')}</div></div>
      </div>

      <h2 class="sec" style="--i:8">Backup</h2>
      <div class="card row wrap" style="--i:9"><button class="btn" data-act="export-json">⤓ Export backup</button><label class="btn">⤒ Import backup<input type="file" accept="application/json" id="importF" hidden></label><button class="btn danger" data-act="reset-all">Reset app</button></div>
      <p class="small faint" style="text-align:center;margin-top:20px">classkoytay · made for RUET · data stays on your phone</p>
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
    return JSON.stringify({ v: 1, onboarded: state.onboarded, active: state.active, semesters: state.semesters, settings });
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
      <div class="card" style="margin-top:10px"><b>☁ Google account</b><div class="small muted">Saved ${new Date(remote.updatedAt).toLocaleString()} · ${sems.length} semester(s) · ${cnt(sems)} attendance marks</div></div>
      <div class="card"><b>📱 This device</b><div class="small muted">${Object.keys(state.semesters).length} semester(s) · ${cnt(Object.values(state.semesters))} attendance marks</div></div>
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
    if (!cloudUser) return `<h2 class="sec" style="--i:0">Account</h2><div class="card" style="--i:1"><div class="row"><span style="font-size:30px">☁️</span><div class="sp"><b>Back up with Google</b><div class="small muted">Sign in so your routine, attendance and CTs are saved to your Google account. New phone or reinstall — log in and everything comes back.</div></div></div>
      <button class="btn block" style="margin-top:12px;background:#fff;color:#1f1f1f;border-color:#dadce0" data-act="cloud-login">${GOOGLE_G} Sign in with Google</button></div>`;
    const when = state.syncedAt ? new Date(state.syncedAt).toLocaleString() : 'not yet';
    return `<h2 class="sec" style="--i:0">Account</h2><div class="card" style="--i:1"><div class="row">
        ${cloudUser.photo ? `<img src="${esc(cloudUser.photo)}" alt="" referrerpolicy="no-referrer" style="width:42px;height:42px;border-radius:50%">` : '<span style="font-size:30px">👤</span>'}
        <div class="sp"><b>${esc(cloudUser.name || 'Signed in')}</b><div class="small muted">${esc(cloudUser.email)}</div></div></div>
      <div class="row small" style="margin-top:10px"><span class="tag ${cloudState.err ? 'bad' : 'good'}">${cloudState.busy ? 'Syncing…' : cloudState.err ? 'Sync error' : '☁ Synced'}</span><span class="muted">${cloudState.err ? esc(cloudState.err) : 'Last saved ' + when}</span></div>
      <div class="row wrap" style="margin-top:12px"><button class="btn sm" data-act="cloud-sync">Sync now</button><button class="btn sm danger" data-act="cloud-logout">Sign out</button></div></div>`;
  }

  /* ---------------- Native Android: notifications + background geofence ---------------- */
  let nativeNotifOk = false, nativeGeo = null, nativeAlertTimer = null, fenceTimer = null, reconciling = false;
  function scheduleNativeAlerts() {
    if (!NATIVE) return; clearTimeout(nativeAlertTimer);
    nativeAlertTimer = setTimeout(() => { window.ckNative.schedule(state.settings.notify && nativeNotifOk && state.onboarded && S() ? plannedAlerts(10) : []).catch(() => {}); }, 1500);
  }
  async function nativeRefresh() { if (!NATIVE) return; try { nativeGeo = await window.ckNative.geoStatus(); } catch { nativeGeo = null; } nativeReconcile(); }
  async function nativeRequestBackground() {
    try { const p = await window.ckNative.requestBackground(); if (p.background !== 'granted') { toast('Choose “Allow all the time” for Location', '!'); window.ckNative.openSettings(); return false; } return true; }
    catch { window.ckNative.openSettings(); return false; }
  }
  async function nativeTrackStart() {
    const nn = window.ckNative;
    try {
      let p = await nn.geoPermissions();
      if (p.location !== 'granted') p = await nn.requestForeground();
      if (p.location !== 'granted') { toast('Location permission is needed', '!'); state.settings.tracking = false; save(); render(); return; }
      if (p.background !== 'granted') {
        openSheet(`<h3>One more step</h3><p class="muted">To count attendance while the app is closed, Android needs Location set to <b>“Allow all the time”</b>. classkoytay only checks whether you are inside the EEE or CSE building — your location is never uploaded.</p>
          <div class="acts"><button class="btn primary" data-act="geo-allow-bg">Continue</button></div>`, () => render());
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
      state.settings.tracking = true; save(); toast('Background attendance is on 📡', '✓');
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
      const list = instancesOn(day, sem).filter((i) => !sem.offDays.includes(i.iso) && statusOf(i, sem) !== 'C');
      if (!list.length) continue;
      const cts = list.map((i) => [i, ctAt(i)]).filter(([, c]) => c);
      const digestAt = atTime(addDays(day, -1), st.digestTime);
      const labs = list.filter((i) => i.slot.span > 1).length;
      const body = list.map((i) => `${fmt12(slotStart(i.slot))} ${i.code}${i.slot.span > 1 ? ' (lab)' : ''}${ctAt(i) ? ` ⚠ CT-${ctAt(i).num}` : ''}${i.slot.room ? ' · ' + i.slot.room : ''}`).join('\n');
      out.push({ id: `dg-${iso(day)}`, at: digestAt.getTime(), title: `Tomorrow · ${fmtD(day)}${cts.length ? ` · ${cts.length} CT!` : ''}`, body: `${list.length - labs} class${list.length - labs === 1 ? '' : 'es'}${labs ? ` + ${labs} lab${labs > 1 ? 's' : ''}` : ''} starting ${fmt12(slotStart(list[0].slot))}\n${body}`, tag: `dg-${iso(day)}` });
      for (const [i, c] of cts) if (st.ctMorning) out.push({ id: `ctm-${c.id}`, at: atTime(day, '07:00').getTime(), title: `CT today: ${i.code} (CT-${c.num})`, body: `${fmt12(slotStart(i.slot))}${i.slot.room ? ' · ' + i.slot.room : ''}${c.topics?.length ? '\nTopics: ' + c.topics.join(', ') : ''}`, tag: `ct-${c.id}` });
      if (st.beforeMin) for (const i of list) out.push({ id: `pre-${i.key}`, at: i.start.getTime() - st.beforeMin * 60000, title: `${i.code} in ${st.beforeMin} min${ctAt(i) ? ' — CT!' : ''}`, body: `${courseInfo(i.code).title}\n${fmt12(slotStart(i.slot))}${i.slot.room ? ' · ' + i.slot.room : ''}`, tag: `pre-${i.key}` });
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
      toast('Reminders on 🔔');
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
      const ct = ctAt(i), c = courseInfo(i.code);
      lines.push('BEGIN:VEVENT', `UID:${i.key.replace('|', '-')}@classkoytay`, `DTSTAMP:${icsDate(new Date())}`, `DTSTART;TZID=Asia/Dhaka:${icsDate(i.start)}`, `DTEND;TZID=Asia/Dhaka:${icsDate(i.end)}`,
        `SUMMARY:${fold(`${ct ? `CT-${ct.num} · ` : ''}${i.code} ${shortTitle(c.title)}`)}`, `LOCATION:${fold(i.slot.room || 'RUET')}`, `DESCRIPTION:${fold(`Week ${i.week} · ${i.slot.teacher || ''}${ct && ct.topics?.length ? '\nCT topics: ' + ct.topics.join(', ') : ''}`)}`,
        'BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${fold(i.code)}`, `TRIGGER:-PT${state.settings.beforeMin || 10}M`, 'END:VALARM');
      if (ct) lines.push('BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${fold(`Tomorrow CT-${ct.num}: ${i.code}`)}`, 'TRIGGER:-PT16H', 'END:VALARM');
      lines.push('END:VEVENT'); n++;
    }
    lines.push('END:VCALENDAR');
    download(`classkoytay-${sem.label.replace(/\W+/g, '-')}.ics`, lines.join('\r\n'), 'text/calendar');
    toast(`${n} classes exported`);
  }
  function download(name, text, type) { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); }

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
        state.onboarded = true; save(); ui.routineMode = filled ? 'week' : 'template'; go(filled ? 'today' : 'routine'); render(); toast('Welcome to classkoytay 🎉', '★'); break;
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
        if ($('#sheetWrap').classList.contains('open')) { instSheet(key, id, d); renderTop(); const y = scrollY; $('#view').innerHTML = `<div class="page" style="animation:none">${({ today: viewToday, routine: viewRoutine, course: viewCourse, attendance: viewAttendance })[route]?.(routeArg) || ''}</div>`; scrollTo(0, y); requestAnimationFrame(animateMeters); }
        else softRefresh();
        if (ns === 'A') { const st = stats(slot.code); toast(st.left90 < 0 ? `${slot.code}: below 90% → ${st.finalMarks}/10 max` : `${slot.code}: ${st.left90} absence${st.left90 === 1 ? '' : 's'} left for 10/10`, '✕'); }
        break;
      }
      case 'toggle-off': { const d = el.dataset.iso; const i = sem.offDays.indexOf(d); if (i >= 0) sem.offDays.splice(i, 1); else sem.offDays.push(d); save(); closeSheet(); softRefresh(); toast(i >= 0 ? 'Holiday removed' : 'Marked as holiday — classes not counted'); break; }
      case 'day-menu': { const d = el.dataset.iso, off = sem.offDays.includes(d); openSheet(`<h3>${fmtD(parseISO(d))}</h3><p class="muted small">Holidays, strikes or a cancelled day — none of that day's classes will count.</p><div class="acts"><button class="btn primary" data-act="toggle-off" data-iso="${d}">${off ? 'Undo holiday' : '🏖 Mark whole day off'}</button></div>`); break; }
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
      case 'ct-slot': ctDraft.instKey = el.dataset.k; $$('[data-act="ct-slot"]').forEach((b) => b.classList.toggle('on', b === el)); break;
      case 'ct-topic': { const v = el.dataset.v, i = ctDraft.topics.indexOf(v); if (i >= 0) ctDraft.topics.splice(i, 1); else ctDraft.topics.push(v); el.classList.toggle('on'); break; }
      case 'ct-save': {
        const d = ctDraft; if (!d.instKey) { toast('Pick the class slot of the CT', '!'); break; }
        const [dIso, slotId] = d.instKey.split('|'); const day = dayKeyOfDate(parseISO(dIso)); const slot = sem.routine[day].find((x) => x.id === slotId);
        const rec = { id: d.id || uid(), code: d.code, num: Number(d.num), instKey: d.instKey, iso: dIso, p: slot ? slot.p : 1, topics: d.topics, note: d.note || '', score: d.score ?? '', outOf: Number(d.outOf) || 20 };
        const other = sem.cts.find((c) => c.instKey === d.instKey && c.id !== rec.id); if (other) { toast(`That class already has ${other.code} CT-${other.num}`, '!'); break; }
        const i = sem.cts.findIndex((c) => c.id === rec.id); if (i >= 0) sem.cts[i] = rec; else sem.cts.push(rec);
        save(); closeSheet(); softRefresh(); toast(`CT-${rec.num} for ${rec.code} saved`, '📝'); break;
      }
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
    if (t.matches('[data-ct]')) { ctDraft[t.dataset.ct] = t.value; if (['code', 'week'].includes(t.dataset.ct)) { if (t.dataset.ct === 'code') { ctDraft.topics = []; ctDraft.num = Math.min(4, sem.cts.filter((c) => c.code === t.value && c.id !== ctDraft.id).length + 1); } ctDraft.instKey = null; drawCtSheet(); } return; }
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
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSheet(); });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') { if (state.settings.tracking && !NATIVE) requestWake(); onResume(); } });
  function onResume() { tick(); nativeRefresh(); if (cloudUser) cloudCheck(false); softRefresh(); }

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
    nn.notifyGranted().then((ok) => { nativeNotifOk = ok; if (ok && state.settings.notify) scheduleNativeAlerts(); });
    nn.onResume(onResume);
    nn.onNotificationTap((url) => { location.hash = url.replace(/^.*#/, ''); });
    nn.onBack(() => { if ($('#sheetWrap').classList.contains('open')) closeSheet(); else if (route !== 'today' && state.onboarded) go('today'); else nn.exitApp(); });
    nativeRefresh();
  }
  setInterval(tick, 20000); setTimeout(tick, 1500);

  // Debug hooks (handy for testing geofence without walking to campus)
  window.classkoytay = { state: () => state, simulateFix: (lat, lng, acc = 10) => handleFix({ lat, lng, acc, t: now().getTime() }), stats, plannedAlerts };
})();
