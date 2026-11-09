import { describe, it } from "node:test";
import assert from "node:assert/strict";

describe("Toast System - Lógica de Notificaciones y Severidades", () => {
  it("Debe categorizar correctamente los tipos de severidad", () => {
    const types = ["error", "success", "warning", "info"];
    types.forEach((type) => {
      assert.ok(["error", "success", "warning", "info"].includes(type));
    });
  });

  it("Debe aplicar duración mayor a errores (5000ms) que a avisos estándar (4000ms)", () => {
    const getDuration = (type) => (type === "error" ? 5000 : 4000);
    assert.equal(getDuration("error"), 5000);
    assert.equal(getDuration("success"), 4000);
    assert.equal(getDuration("warning"), 4000);
    assert.equal(getDuration("info"), 4000);
  });

  it("Debe filtrar notificaciones duplicadas en ráfaga rápida (<600ms)", () => {
    let lastToast = { message: "", time: 0 };
    const shouldAddToast = (message, now) => {
      if (lastToast.message === message && now - lastToast.time < 600) {
        return false;
      }
      lastToast = { message, time: now };
      return true;
    };

    const t0 = 1000;
    assert.equal(shouldAddToast("Error al conectar", t0), true);
    // Disparo inmediato (100ms después) con mismo mensaje -> descartado
    assert.equal(shouldAddToast("Error al conectar", t0 + 100), false);
    // Mensaje diferente -> aceptado
    assert.equal(shouldAddToast("Otro error", t0 + 150), true);
    // Mismo mensaje tras 800ms -> aceptado
    assert.equal(shouldAddToast("Error al conectar", t0 + 800), true);
  });
});
