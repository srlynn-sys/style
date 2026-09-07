/* Style Saan Firebase client bootstrap. Uses Firebase's browser ESM CDN so no build step is required. */
import { initializeApp, getApps } from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-storage.js';

const config = window.StyleSaanFirebaseConfig;
if (!config) throw new Error('Style Saan Firebase config was not loaded.');
const app = getApps().length ? getApps()[0] : initializeApp(config);
window.StyleSaanFirebase = {
  app,
  auth: getAuth(app),
  db: getFirestore(app),
  storage: getStorage(app)
};
window.dispatchEvent(new CustomEvent('style-saan-firebase-ready'));
