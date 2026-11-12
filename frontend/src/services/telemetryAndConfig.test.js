import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  isFirebaseConfigValid,
  readFirebaseConfigFromEnv
} from "../firebase/firebase.js";
import { sanitizeAnalyticsParams } from "./analyticsService.js";
import { sanitizeErrorPayload, shouldThrottleError } from "./errorTrackingService.js";

function collectSourceFiles(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectSourceFiles(full));
    } else if (/\.(js|jsx|ts|tsx)$/.test(entry.name) && !entry.name.endsWith(".test.js")) {
      results.push(full);
    }
  }
  return results;
}

describe("Seguridad, Analytics y Seguimiento de Errores", () => {
  it("No existen claves de Firebase ni IDs de Analytics hardcodeados en frontend/src", () => {
    const srcDir = path.resolve(process.cwd(), "src");
    const files = collectSourceFiles(srcDir);
    assert.ok(files.length > 0);

    for (const filePath of files) {
      const text = fs.readFileSync(filePath, "utf-8");
      assert.equal(
        /AIzaSy[0-9A-Za-z_-]{20,}/.test(text),
        false,
        `${path.relative(srcDir, filePath)} no debe contener claves API de Firebase hardcodeadas`
      );
      assert.equal(
        /G-ND4ZTY5DGR/.test(text),
        false,
        `${path.relative(srcDir, filePath)} no debe contener measurementId hardcodeado`
      );
    }
  });

  it("readFirebaseConfigFromEnv carga configuración desde variables VITE_FIREBASE_*", () => {
    const emptyCfg = readFirebaseConfigFromEnv({});
    assert.equal(emptyCfg.apiKey, "");
    assert.equal(isFirebaseConfigValid(emptyCfg), false);

    const mockEnv = {
      VITE_FIREBASE_API_KEY: "test-key",
      VITE_FIREBASE_AUTH_DOMAIN: "demo.firebaseapp.com",
      VITE_FIREBASE_PROJECT_ID: "demo-project",
      VITE_FIREBASE_STORAGE_BUCKET: "demo.appspot.com",
      VITE_FIREBASE_MESSAGING_SENDER_ID: "123456",
      VITE_FIREBASE_APP_ID: "1:123456:web:abc",
      VITE_FIREBASE_MEASUREMENT_ID: "G-TEST123"
    };
    const validCfg = readFirebaseConfigFromEnv(mockEnv);
    assert.equal(validCfg.apiKey, "test-key");
    assert.equal(validCfg.measurementId, "G-TEST123");
    assert.equal(isFirebaseConfigValid(validCfg), true);
  });

  it("sanitizeAnalyticsParams limpia datos sensibles y limita longitudes para logEvent", () => {
    const sanitized = sanitizeAnalyticsParams({
      method: "email",
      password: "secret-password",
      token: "jwt-123",
      email: "coach@club.com",
      preset_id: "head_coach",
      modules_count: 8,
      is_guest: false
    });

    assert.equal(sanitized.method, "email");
    assert.equal(sanitized.preset_id, "head_coach");
    assert.equal(sanitized.modules_count, 8);
    assert.equal(sanitized.is_guest, false);
    assert.equal(sanitized.password, undefined);
    assert.equal(sanitized.token, undefined);
    assert.equal(sanitized.email, undefined);
  });

  it("sanitizeErrorPayload redacta tokens y shouldThrottleError evita bucles repetidos", () => {
    const err = new Error("Request failed with Bearer abc.def.ghi and password=mysecret");
    const payload = sanitizeErrorPayload(err, { source: "api_interceptor", fatal: false });

    assert.equal(payload.source, "api_interceptor");
    assert.equal(payload.level, "error");
    assert.ok(payload.message.includes("Bearer [REDACTED]"));
    assert.ok(payload.message.includes("password=[REDACTED]"));
    assert.equal(payload.message.includes("mysecret"), false);

    const baseTime = 100000;
    assert.equal(shouldThrottleError("boom-unique", "test_src", baseTime), false);
    assert.equal(shouldThrottleError("boom-unique", "test_src", baseTime + 500), true);
    assert.equal(shouldThrottleError("boom-unique", "test_src", baseTime + 6000), false);
  });
});

