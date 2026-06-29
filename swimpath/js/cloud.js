/*
 * SwimPath — cloud sync & sharing (Firebase Firestore).
 *
 * Model: a "team" is one shared swimmer dataset stored at teams/{code}, where
 * {code} is a long random, unguessable string. Anyone who knows the code (via
 * an invite link) signs in anonymously and reads/writes the same document, with
 * real-time updates. No accounts to manage; the secret code is the capability.
 *
 * This module is optional. If firebase-config.js is blank, the app keeps
 * working with localStorage only and the sharing UI shows a setup hint.
 */
import { firebaseConfig } from './firebase-config.js';

const VERSION = '10.12.2';
const CDN = 'https://www.gstatic.com/firebasejs/' + VERSION;
const TEAM_KEY = 'swimpath:team';

let fs = null;          // firestore module namespace
let db = null;
let auth = null;
let teamCode = null;
let unsub = null;
let pushTimer = null;
let applyingRemote = false;
let status = 'init';

function configured() {
  return !!(firebaseConfig && firebaseConfig.apiKey && firebaseConfig.projectId);
}

function setStatus(s) {
  status = s;
  document.dispatchEvent(new CustomEvent('sp-cloud', { detail: { status: s, team: teamCode } }));
}

function genCode() {
  const a = new Uint8Array(16);
  (window.crypto || window.msCrypto).getRandomValues(a);
  return Array.from(a).map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
}

function app() { return window.SP && window.SP.app; }

async function init() {
  if (!configured()) { setStatus('not-configured'); return; }
  setStatus('connecting');
  try {
    const mods = await Promise.all([
      import(CDN + '/firebase-app.js'),
      import(CDN + '/firebase-auth.js'),
      import(CDN + '/firebase-firestore.js')
    ]);
    const appMod = mods[0], authMod = mods[1];
    fs = mods[2];
    const fbApp = appMod.initializeApp(firebaseConfig);
    auth = authMod.getAuth(fbApp);
    db = fs.getFirestore(fbApp);

    authMod.onAuthStateChanged(auth, function (user) {
      if (user) afterAuth();
    });
    await authMod.signInAnonymously(auth).catch(function (e) {
      console.error('SwimPath cloud: anonymous sign-in failed', e);
      setStatus('error:auth');
    });
  } catch (e) {
    console.error('SwimPath cloud: init failed', e);
    setStatus('error');
  }
}

function afterAuth() {
  const urlTeam = new URLSearchParams(location.search).get('team');
  const saved = localStorage.getItem(TEAM_KEY);
  if (urlTeam) {
    join(urlTeam)
      .then(function () { history.replaceState(null, '', location.pathname); })
      .catch(function () { setStatus('error:join'); });
  } else if (saved) {
    subscribe(saved);
  } else {
    setStatus('ready');
  }
}

function subscribe(code) {
  if (unsub) { unsub(); unsub = null; }
  teamCode = code;
  localStorage.setItem(TEAM_KEY, code);
  setStatus('connecting');
  unsub = fs.onSnapshot(fs.doc(db, 'teams', code), function (snap) {
    if (snap.metadata.hasPendingWrites) return; // ignore our own local echo
    const d = snap.data();
    if (d && d.state && app()) {
      applyingRemote = true;
      try { app().applyRemote(d.state); } finally { applyingRemote = false; }
    }
    setStatus('synced');
  }, function (err) {
    console.error('SwimPath cloud: snapshot error', err);
    setStatus('error:' + (err.code || 'snapshot'));
  });
}

async function createTeam() {
  const code = genCode();
  teamCode = code;
  localStorage.setItem(TEAM_KEY, code);
  await fs.setDoc(fs.doc(db, 'teams', code), {
    state: app().getState(),
    createdAt: fs.serverTimestamp(),
    updatedAt: fs.serverTimestamp()
  });
  subscribe(code);
  return code;
}

async function join(code) {
  code = (code || '').trim().toLowerCase();
  if (!code) throw new Error('empty');
  const ref = fs.doc(db, 'teams', code);
  const snap = await fs.getDoc(ref);
  if (!snap.exists()) throw new Error('not-found');
  subscribe(code);
  return true;
}

function leave() {
  if (unsub) { unsub(); unsub = null; }
  teamCode = null;
  localStorage.removeItem(TEAM_KEY);
  setStatus('ready');
}

function onPersist(state) {
  if (!teamCode || !db || applyingRemote) return;
  clearTimeout(pushTimer);
  setStatus('saving');
  pushTimer = setTimeout(function () {
    fs.setDoc(fs.doc(db, 'teams', teamCode),
      { state: state, updatedAt: fs.serverTimestamp() },
      { merge: true })
      .then(function () { setStatus('synced'); })
      .catch(function (e) { console.error('SwimPath cloud: write failed', e); setStatus('error:write'); });
  }, 700);
}

function shareLink() {
  return location.origin + location.pathname + '?team=' + (teamCode || '');
}

window.SP = window.SP || {};
window.SP.cloud = {
  configured: configured,
  getStatus: function () { return status; },
  getTeam: function () { return teamCode; },
  createTeam: createTeam,
  join: join,
  leave: leave,
  shareLink: shareLink,
  onPersist: onPersist
};

init();
