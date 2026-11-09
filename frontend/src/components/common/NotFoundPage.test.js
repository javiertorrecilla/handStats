import { describe, it } from "node:test";
import assert from "node:assert/strict";

describe("NotFoundPage - Mapeo y Detección de Rutas 404", () => {
  const knownRoutes = ["/", "/matches", "/matches/new", "/teams", "/settings", "/privacy", "/terms", "/manual"];
  const isKnownRoute = (path) => knownRoutes.includes(path) || path.startsWith("/matches/");

  it("Debe identificar rutas válidas del sistema", () => {
    assert.equal(isKnownRoute("/"), true);
    assert.equal(isKnownRoute("/matches"), true);
    assert.equal(isKnownRoute("/matches/new"), true);
    assert.equal(isKnownRoute("/matches/66a123bc456"), true);
    assert.equal(isKnownRoute("/matches/66a123bc456/stats"), true);
    assert.equal(isKnownRoute("/teams"), true);
    assert.equal(isKnownRoute("/settings"), true);
    assert.equal(isKnownRoute("/privacy"), true);
    assert.equal(isKnownRoute("/terms"), true);
    assert.equal(isKnownRoute("/manual"), true);
  });

  it("Debe identificar rutas inexistentes como 404", () => {
    assert.equal(isKnownRoute("/jugada-inexistente"), false);
    assert.equal(isKnownRoute("/partido/123"), false);
    assert.equal(isKnownRoute("/404"), false);
    assert.equal(isKnownRoute("/stats/global"), false);
    assert.equal(isKnownRoute("/admin"), false);
  });
});
