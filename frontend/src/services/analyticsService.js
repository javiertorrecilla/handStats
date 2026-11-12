import {
  logEvent as firebaseLogEvent,
  setUserId as firebaseSetUserId,
  setUserProperties as firebaseSetUserProperties
} from "firebase/analytics";
import { analyticsReadyPromise, getAnalyticsInstance } from "../firebase/firebase.js";

const BLOCKED_PARAM_KEYS = new Set(["password", "token", "secret", "email", "authorization", "apikey", "api_key"]);

export function sanitizeAnalyticsParams(params = {}) {
  if (!params || typeof params !== "object") return {};
  const cleaned = {};
  Object.entries(params).forEach(([key, val]) => {
    if (!key || BLOCKED_PARAM_KEYS.has(key.toLowerCase())) return;
    if (val === undefined || val === null) return;
    if (typeof val === "string") {
      cleaned[key] = val.slice(0, 100);
    } else if (typeof val === "number" && Number.isFinite(val)) {
      cleaned[key] = val;
    } else if (typeof val === "boolean") {
      cleaned[key] = val;
    } else {
      cleaned[key] = String(val).slice(0, 100);
    }
  });
  return cleaned;
}

async function resolveAnalytics() {
  const existing = getAnalyticsInstance();
  if (existing) return existing;
  try {
    return await analyticsReadyPromise;
  } catch {
    return null;
  }
}

/**
 * Registra un evento personalizado en Firebase Analytics (`logEvent`).
 * Seguro en entornos sin Analytics (bloqueadores, Node tests o sin medición).
 */
export function trackEvent(eventName, params = {}) {
  if (!eventName || typeof eventName !== "string") return false;
  if (typeof window === "undefined") return false;

  const safeParams = sanitizeAnalyticsParams(params);
  resolveAnalytics()
    .then((analyticsInstance) => {
      if (!analyticsInstance) return;
      firebaseLogEvent(analyticsInstance, eventName, safeParams);
    })
    .catch(() => {});

  return true;
}

/**
 * Registra la navegación entre vistas/rutas de la aplicación SPA.
 */
export function trackPageView(pathname, pageTitle) {
  if (!pathname) return false;
  return trackEvent("page_view", {
    page_path: pathname,
    page_title: pageTitle || (typeof document !== "undefined" ? document.title : "Handtix")
  });
}

/**
 * Asocia propiedades no sensibles de sesión/rol al usuario de Analytics.
 */
export function setAnalyticsUser(user) {
  if (typeof window === "undefined") return;
  const uid = user && user.role !== "guest" ? String(user._id || user.firebase_uid || user.uid || "") : "";
  const role = user?.role || (user ? "authenticated" : "anonymous");

  resolveAnalytics()
    .then((analyticsInstance) => {
      if (!analyticsInstance) return;
      firebaseSetUserId(analyticsInstance, uid || null);
      firebaseSetUserProperties(analyticsInstance, {
        user_role: role
      });
    })
    .catch(() => {});
}

