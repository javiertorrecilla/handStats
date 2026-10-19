import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { checkIsMobileDevice } from "./deviceDetector.js";

describe("DeviceGuard - Detección de Dispositivos Móviles vs Tablets y PCs", () => {
  const originalWindow = globalThis.window;
  const originalNavigatorDesc = Object.getOwnPropertyDescriptor(globalThis, "navigator");

  afterEach(() => {
    globalThis.window = originalWindow;
    if (originalNavigatorDesc) {
      Object.defineProperty(globalThis, "navigator", originalNavigatorDesc);
    }
  });

  const mockEnvironment = ({ width, height, userAgent = "", platform = "MacIntel", maxTouchPoints = 0 }) => {
    globalThis.window = {
      innerWidth: width,
      innerHeight: height,
    };
    Object.defineProperty(globalThis, "navigator", {
      value: {
        userAgent,
        platform,
        maxTouchPoints,
      },
      configurable: true,
      writable: true,
    });
  };

  it("Debe bloquear iPhone en vertical (390 x 844)", () => {
    mockEnvironment({
      width: 390,
      height: 844,
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148",
      maxTouchPoints: 5,
    });
    assert.equal(checkIsMobileDevice(), true, "iPhone en vertical debe estar bloqueado");
  });

  it("Debe bloquear iPhone en horizontal (844 x 390)", () => {
    mockEnvironment({
      width: 844,
      height: 390,
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148",
      maxTouchPoints: 5,
    });
    assert.equal(checkIsMobileDevice(), true, "iPhone en horizontal debe estar bloqueado");
  });

  it("Debe bloquear Android Phone en vertical (412 x 915)", () => {
    mockEnvironment({
      width: 412,
      height: 915,
      userAgent: "Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
      maxTouchPoints: 5,
    });
    assert.equal(checkIsMobileDevice(), true, "Android phone en vertical debe estar bloqueado");
  });

  it("Debe bloquear Android Phone en horizontal (915 x 412)", () => {
    mockEnvironment({
      width: 915,
      height: 412,
      userAgent: "Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
      maxTouchPoints: 5,
    });
    assert.equal(checkIsMobileDevice(), true, "Android phone en horizontal debe estar bloqueado");
  });

  it("Debe PERMITIR iPad Mini en vertical (768 x 1024)", () => {
    mockEnvironment({
      width: 768,
      height: 1024,
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko)",
      platform: "MacIntel",
      maxTouchPoints: 5,
    });
    assert.equal(checkIsMobileDevice(), false, "iPad Mini en vertical debe estar PERMITIDO");
  });

  it("Debe PERMITIR iPad Mini en horizontal (1024 x 768)", () => {
    mockEnvironment({
      width: 1024,
      height: 768,
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko)",
      platform: "MacIntel",
      maxTouchPoints: 5,
    });
    assert.equal(checkIsMobileDevice(), false, "iPad Mini en horizontal debe estar PERMITIDO");
  });

  it("Debe PERMITIR iPad 10th Gen / Air en vertical (820 x 1180)", () => {
    mockEnvironment({
      width: 820,
      height: 1180,
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15",
      platform: "MacIntel",
      maxTouchPoints: 5,
    });
    assert.equal(checkIsMobileDevice(), false, "iPad 10th Gen en vertical debe estar PERMITIDO");
  });

  it("Debe PERMITIR iPad 10th Gen / Air en horizontal (1180 x 820)", () => {
    mockEnvironment({
      width: 1180,
      height: 820,
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15",
      platform: "MacIntel",
      maxTouchPoints: 5,
    });
    assert.equal(checkIsMobileDevice(), false, "iPad 10th Gen en horizontal debe estar PERMITIDO");
  });

  it("Debe PERMITIR Tablet Android en vertical (800 x 1280)", () => {
    mockEnvironment({
      width: 800,
      height: 1280,
      userAgent: "Mozilla/5.0 (Linux; Android 13; SM-X800) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
      maxTouchPoints: 5,
    });
    assert.equal(checkIsMobileDevice(), false, "Android Tablet en vertical debe estar PERMITIDA");
  });

  it("Debe PERMITIR Tablet Android en horizontal (1280 x 800)", () => {
    mockEnvironment({
      width: 1280,
      height: 800,
      userAgent: "Mozilla/5.0 (Linux; Android 13; SM-X800) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
      maxTouchPoints: 5,
    });
    assert.equal(checkIsMobileDevice(), false, "Android Tablet en horizontal debe estar PERMITIDA");
  });

  it("Debe PERMITIR PC / Mac de escritorio y portátil (1440 x 900 / 1920 x 1080)", () => {
    mockEnvironment({
      width: 1440,
      height: 900,
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      platform: "MacIntel",
      maxTouchPoints: 0,
    });
    assert.equal(checkIsMobileDevice(), false, "PC / Mac debe estar PERMITIDO");
  });

  it("Debe bloquear ventana estrecha de escritorio (< 768px)", () => {
    mockEnvironment({
      width: 600,
      height: 900,
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      platform: "Win32",
      maxTouchPoints: 0,
    });
    assert.equal(checkIsMobileDevice(), true, "Ventana estrecha en PC debe pedir ampliar ventana");
  });
});
