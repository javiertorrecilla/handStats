import * as Sentry from "@sentry/react";
import { trackEvent } from "./analyticsService.js";

const DEDUP_WINDOW_MS = 5000;
const recentFingerprints = new Map();
let initialized = false;
let sentryEnabled = false;
let currentUserRef = null;

function resolveApiBaseUrl() {
  const env = typeof import.meta !== "undefined" && import.meta.env ? import.meta.env : {};
  return env.VITE_API_BASE_URL || (env.DEV ? "http://localhost:8000" : "/api");
}

export function sanitizeErrorPayload(error, context = {}) {
  const errObj =
    error instanceof Error
      ? error
      : new Error(typeof error === "string" ? error : error?.message || "Unknown runtime error");

  const rawMessage = String(errObj.message || "Unknown error")
    .replace(/Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi, "Bearer [REDACTED]")
    .replace(/(password|token|secret)=[^&\s]+/gi, "$1=[REDACTED]")
    .slice(0, 600);

  const rawStack = String(errObj.stack || "").slice(0, 3500);

  return {
    name: String(errObj.name || "Error").slice(0, 120),
    message: rawMessage,
    stack: rawStack,
    component_stack: context.componentStack ? String(context.componentStack).slice(0, 2000) : undefined,
    source: String(context.source || "app").slice(0, 80),
    level: ["fatal", "error", "warning", "info"].includes(context.level) ? context.level : (context.fatal ? "fatal" : "error"),
    route:
      context.route ||
      (typeof window !== "undefined" ? `${window.location?.pathname || ""}${window.location?.search || ""}` : ""),
    user_id: currentUserRef && currentUserRef.role !== "guest"
      ? String(currentUserRef._id || currentUserRef.firebase_uid || currentUserRef.uid || "")
      : undefined,
    user_agent: typeof navigator !== "undefined" ? String(navigator.userAgent || "").slice(0, 240) : undefined,
    release: "handtix-frontend",
    timestamp: new Date().toISOString()
  };
}

export function shouldThrottleError(message, source, now = Date.now()) {
  const key = `${source || "app"}::${message || ""}`;
  const last = recentFingerprints.get(key) || 0;
  if (now - last < DEDUP_WINDOW_MS) {
    return true;
  }
  recentFingerprints.set(key, now);
  if (recentFingerprints.size > 100) {
    const oldestKey = recentFingerprints.keys().next().value;
    if (oldestKey) recentFingerprints.delete(oldestKey);
  }
  return false;
}

/**
 * Inicializa la monitorización global de errores:
 * - Sentry SDK (si VITE_SENTRY_DSN está configurado)
 * - Listeners globales de JavaScript (`error` y `unhandledrejection`)
 * - Pipeline de telemetría propio hacia `/api/telemetry/errors` y Firebase `exception`
 */
export function initErrorTracking() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;

  const env = typeof import.meta !== "undefined" && import.meta.env ? import.meta.env : {};
  const dsn = env.VITE_SENTRY_DSN;

  if (dsn) {
    try {
      Sentry.init({
        dsn,
        environment: env.MODE || "production",
        tracesSampleRate: 0.2,
        beforeSend(event) {
          if (event?.request?.headers?.Authorization) {
            delete event.request.headers.Authorization;
          }
          return event;
        }
      });
      sentryEnabled = true;
    } catch (initErr) {
      console.warn("[Handtix] No se pudo inicializar Sentry:", initErr);
    }
  }

  window.addEventListener("error", (event) => {
    const err = event?.error || new Error(event?.message || "Uncaught window error");
    captureError(err, {
      source: "window.onerror",
      fatal: false,
      contextExtra: event?.filename ? `${event.filename}:${event.lineno || 0}:${event.colno || 0}` : undefined
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event?.reason;
    const err = reason instanceof Error ? reason : new Error(String(reason || "Unhandled promise rejection"));
    captureError(err, {
      source: "window.unhandledrejection",
      fatal: false
    });
  });
}

export function setErrorTrackingUser(user) {
  currentUserRef = user || null;
  if (!sentryEnabled) return;
  try {
    if (user && user.role !== "guest") {
      Sentry.setUser({
        id: String(user._id || user.firebase_uid || user.uid || "")
      });
    } else {
      Sentry.setUser(null);
    }
  } catch {}
}

/**
 * Envía el error capturado a Sentry (si activo), Firebase Analytics (`exception`)
 * y al endpoint de telemetría del backend (`/telemetry/errors`).
 */
export function captureError(error, context = {}) {
  const payload = sanitizeErrorPayload(error, context);
  if (shouldThrottleError(payload.message, payload.source)) {
    return null;
  }

  if (typeof console !== "undefined" && typeof console.error === "function") {
    console.error(`[Handtix Telemetry:${payload.source}]`, error);
  }

  if (sentryEnabled) {
    try {
      Sentry.withScope((scope) => {
        scope.setTag("source", payload.source);
        if (payload.route) scope.setTag("route", payload.route);
        if (payload.component_stack) scope.setExtra("componentStack", payload.component_stack);
        Sentry.captureException(error instanceof Error ? error : new Error(payload.message));
      });
    } catch {}
  }

  trackEvent("exception", {
    description: `${payload.source}: ${payload.message}`.slice(0, 100),
    fatal: Boolean(context.fatal)
  });

  if (typeof window !== "undefined" && typeof fetch === "function") {
    try {
      const endpoint = `${resolveApiBaseUrl()}/telemetry/errors`;
      fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true
      }).catch(() => {});
    } catch {}
  }

  return payload;
}

export function isSentryEnabled() {
  return sentryEnabled;
}

