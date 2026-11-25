/* classkoytay bridge — bundled by esbuild into js/bridge.js
   window.ckCloud  : Google login (Firebase Auth) + Firestore sync (web + Android)
   window.ckNative : Android-only features (scheduled notifications, background geofence) */
import { Capacitor, registerPlugin } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { App } from '@capacitor/app';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, indexedDBLocalPersistence, browserLocalPersistence, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signInWithCredential, onAuthStateChanged, signOut as fbSignOut } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { firebaseConfig } from './firebase-config.js';

const isNative = Capacitor.isNativePlatform();

/* ---------------- Cloud (login + sync) ---------------- */
const configured = !!(firebaseConfig && firebaseConfig.apiKey);
let app = null, auth = null, db = null;
if (configured) {
  app = initializeApp(firebaseConfig);
  auth = isNative ? initializeAuth(app, { persistence: indexedDBLocalPersistence }) : (() => { const a = getAuth(app); a.setPersistence(browserLocalPersistence).catch(() => {}); return a; })();
  db = getFirestore(app);
  if (!isNative) getRedirectResult(auth).catch(() => {});
}

const userInfo = (u) => (u ? { uid: u.uid, name: u.displayName || '', email: u.email || '', photo: u.photoURL || '' } : null);

window.ckCloud = {
  configured,
  isNative,
  onUser(cb) { if (!auth) { cb(null); return () => {}; } return onAuthStateChanged(auth, (u) => cb(userInfo(u))); },
  current() { return auth ? userInfo(auth.currentUser) : null; },
  async signIn() {
    if (!auth) throw new Error('Cloud login is not configured yet');
    if (isNative) {
      const res = await FirebaseAuthentication.signInWithGoogle();
      const cred = GoogleAuthProvider.credential(res.credential?.idToken, res.credential?.accessToken);
      const r = await signInWithCredential(auth, cred);
      return userInfo(r.user);
    }
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try { const r = await signInWithPopup(auth, provider); return userInfo(r.user); }
    catch (e) {
      if (e && (e.code === 'auth/popup-blocked' || e.code === 'auth/operation-not-supported-in-this-environment')) { await signInWithRedirect(auth, provider); return null; }
      throw e;
    }
  },
  async signOut() { if (isNative) { try { await FirebaseAuthentication.signOut(); } catch { /* ignore */ } } if (auth) await fbSignOut(auth); },
  async pull() {
    const u = auth && auth.currentUser; if (!u) return null;
    const snap = await getDoc(doc(db, 'users', u.uid));
    if (!snap.exists()) return null;
    const d = snap.data();
    return { data: d.data ? JSON.parse(d.data) : null, updatedAt: d.updatedAt || 0 };
  },
  async push(state, updatedAt) {
    const u = auth && auth.currentUser; if (!u) return false;
    await setDoc(doc(db, 'users', u.uid), { data: JSON.stringify(state), updatedAt, savedAt: serverTimestamp(), app: 'classkoytay', v: 1 });
    return true;
  },
};

/* ---------------- Native (Android) ---------------- */
const Geofence = registerPlugin('Geofence');
const hashId = (s) => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0; return Math.abs(h % 2000000000) + 1; };

window.ckNative = !isNative ? null : {
  async notifyPermission() {
    let p = await LocalNotifications.checkPermissions();
    if (p.display !== 'granted') p = await LocalNotifications.requestPermissions();
    try { const ex = await LocalNotifications.checkExactNotificationSetting(); if (ex.exact_alarm !== 'granted') await LocalNotifications.changeExactNotificationSetting(); } catch { /* older Android */ }
    return p.display === 'granted';
  },
  async notifyGranted() { try { return (await LocalNotifications.checkPermissions()).display === 'granted'; } catch { return false; } },
  /** Replace all pending reminders with this list: [{id, at(ms), title, body}] */
  async schedule(alerts) {
    try {
      await LocalNotifications.createChannel({ id: 'classes', name: 'Classes & CTs', description: 'Tomorrow summary, before-class and CT reminders', importance: 4, vibration: true });
    } catch { /* exists */ }
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length) await LocalNotifications.cancel({ notifications: pending.notifications.map((n) => ({ id: n.id })) });
    const now = Date.now();
    const list = alerts.filter((a) => a.at > now + 5000).slice(0, 60).map((a) => ({
      id: hashId(a.id), title: a.title, body: a.body, largeBody: a.body, channelId: 'classes',
      schedule: { at: new Date(a.at), allowWhileIdle: true }, extra: { url: '#today' },
    }));
    if (list.length) await LocalNotifications.schedule({ notifications: list });
    return list.length;
  },
  async notifyNow(title, body) {
    await LocalNotifications.schedule({ notifications: [{ id: hashId('now' + Date.now()), title, body, channelId: 'classes', schedule: { at: new Date(Date.now() + 1000), allowWhileIdle: true } }] });
  },
  /* Geofence — Android wakes the app's receiver on enter/exit, even when the app is closed */
  async geoPermissions() { return Geofence.checkPermissions(); },
  async requestForeground() { return Geofence.requestPermissions({ permissions: ['location'] }); },
  async requestBackground() { return Geofence.requestPermissions({ permissions: ['background'] }); },
  async openSettings() { return Geofence.openAppSettings(); },
  async startGeofence(fences) { return Geofence.setFences({ fences: fences.map((f) => ({ id: f.id, name: f.name, lat: f.lat, lng: f.lng, r: Math.max(30, f.r) })) }); },
  async stopGeofence() { return Geofence.stop(); },
  async geoStatus() { return Geofence.getStatus(); },
  async geoEvents() { return (await Geofence.getEvents()).events || []; },
  onResume(cb) { App.addListener('resume', cb); },
  onBack(cb) { App.addListener('backButton', cb); },
  exitApp() { App.exitApp(); },
  onNotificationTap(cb) { LocalNotifications.addListener('localNotificationActionPerformed', (e) => cb(e.notification?.extra?.url || '#today')); },
};

window.dispatchEvent(new Event('ck-bridge-ready'));
