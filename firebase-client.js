/* Style Saan Firebase client bootstrap. No private/service-account credentials belong here. */
window.StyleSaanFirebaseReady = (async () => {
  const config = window.StyleSaanFirebaseConfig;
  if (!config) throw new Error('Style Saan Firebase config was not loaded.');
  const [{ initializeApp, getApps }, { getAuth }, { getFirestore }, { getStorage }] = await Promise.all([
    import('https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js'),
    import('https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js'),
    import('https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js'),
    import('https://www.gstatic.com/firebasejs/12.1.0/firebase-storage.js')
  ]);
  const app = getApps().length ? getApps()[0] : initializeApp(config);
  window.StyleSaanFirebase = { app, auth: getAuth(app), db: getFirestore(app), storage: getStorage(app) };
  window.dispatchEvent(new CustomEvent('style-saan-firebase-ready'));
  return window.StyleSaanFirebase;
})().catch(err => { console.error('[Style Saan] Firebase bootstrap failed', err); throw err; });
