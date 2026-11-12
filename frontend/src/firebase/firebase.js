import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported as isAnalyticsSupported } from "firebase/analytics";
import { getAuth } from "firebase/auth";

export function readFirebaseConfigFromEnv(env = import.meta.env || {}) {
  return {
    apiKey: env.VITE_FIREBASE_API_KEY || "",
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || "",
    projectId: env.VITE_FIREBASE_PROJECT_ID || "",
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || "",
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
    appId: env.VITE_FIREBASE_APP_ID || "",
    measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || ""
  };
}

export function isFirebaseConfigValid(config) {
  return Boolean(config && config.apiKey && config.projectId && config.appId);
}

const firebaseConfig = readFirebaseConfigFromEnv();
export const isFirebaseConfigured = isFirebaseConfigValid(firebaseConfig);

let app = null;
let auth = null;
let analytics = null;

if (isFirebaseConfigured) {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);

  if (typeof window !== "undefined" && firebaseConfig.measurementId) {
    try {
      analytics = getAnalytics(app);
    } catch {
      analytics = null;
    }
  }
} else if (typeof console !== "undefined") {
  console.warn(
    "[Handtix] Variables VITE_FIREBASE_* no configuradas. Auth de Google y Firebase Analytics permanecerán inactivos."
  );
}

export const analyticsReadyPromise =
  app && typeof window !== "undefined" && firebaseConfig.measurementId
    ? isAnalyticsSupported()
        .then((supported) => {
          if (supported && !analytics) {
            analytics = getAnalytics(app);
          }
          return analytics;
        })
        .catch(() => null)
    : Promise.resolve(null);

export function getAnalyticsInstance() {
  return analytics;
}

export { auth, analytics };
export default app;
