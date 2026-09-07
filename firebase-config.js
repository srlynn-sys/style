/* Style Saan Firebase client configuration.
 * This file contains the public Firebase Web App configuration only.
 * Never place Firebase service-account/private keys in the frontend repository.
 */
const STYLE_SAAN_FIREBASE_CONFIG = {
  apiKey: "AIzaSyA0YwXyOvsigKX5eYGKr06c1--w4gMl1uM",
  authDomain: "style-saan.firebaseapp.com",
  projectId: "style-saan",
  storageBucket: "style-saan.firebasestorage.app",
  messagingSenderId: "536354608655",
  appId: "1:536354608655:web:d00e2ecc592a703bc4b57a",
  measurementId: "G-8WNVFY7FZP"
};

window.StyleSaanFirebaseConfig = STYLE_SAAN_FIREBASE_CONFIG;
window.StyleSaanFirebaseReady = window.StyleSaanFirebaseReady || Promise.resolve(STYLE_SAAN_FIREBASE_CONFIG);
