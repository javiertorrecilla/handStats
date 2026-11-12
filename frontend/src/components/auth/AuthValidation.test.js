import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  mapActionCodeErrorKey,
  parseAuthActionSearch,
  validateResetPasswordFields,
} from "./authActionUtils.js";

/**
 * Lógica pura de validación y control de acceso por verificación de correo
 */
function shouldGateEmailVerification({ user, firebaseUser, isEmailVerified = false }) {
  if (!user) return false;
  const isGuest = user.role === "guest";
  if (isGuest) return false;

  const isGoogleUser = Boolean(
    firebaseUser?.providerData?.some((p) => p.providerId === "google.com")
  );
  if (isGoogleUser) return false;

  const isVerified = Boolean(firebaseUser?.emailVerified) || isEmailVerified;
  return !isVerified;
}

/**
 * Validador de formato de correo electrónico
 */
function isValidEmail(email) {
  if (!email || typeof email !== "string") return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.trim());
}

/**
 * Mapeo de errores de autenticación Firebase a mensajes traducidos
 */
function mapAuthError(code, customDict = {}) {
  const defaults = {
    "auth/user-not-found": "El usuario no existe.",
    "auth/wrong-password": "Contraseña incorrecta.",
    "auth/invalid-credential": "Correo o contraseña incorrectos.",
    "auth/invalid-email": "Correo o contraseña incorrectos.",
    "auth/email-already-in-use": "Ya existe una cuenta registrada con este correo electrónico.",
    "auth/weak-password": "La contraseña debe tener al menos 6 caracteres.",
    "auth/too-many-requests": "Demasiadas solicitudes. Por favor, espera unos minutos.",
  };

  const dict = { ...defaults, ...customDict };
  return dict[code] || "Error en la autenticación.";
}

describe("Auth - Validación de Correo y Puerta de Verificación (EmailVerificationGate)", () => {
  it("Debe permitir acceso directo a usuarios invitados sin requerir verificación", () => {
    const shouldGate = shouldGateEmailVerification({
      user: { role: "guest", displayName: "Invitado" },
      firebaseUser: null,
      isEmailVerified: false,
    });
    assert.equal(shouldGate, false);
  });

  it("Debe permitir acceso directo a usuarios autenticados con Google", () => {
    const shouldGate = shouldGateEmailVerification({
      user: { role: "coach", email: "coach@gmail.com" },
      firebaseUser: {
        email: "coach@gmail.com",
        emailVerified: true,
        providerData: [{ providerId: "google.com" }],
      },
      isEmailVerified: false,
    });
    assert.equal(shouldGate, false);
  });

  it("Debe BLOQUEAR a usuarios registrados con correo/contraseña que no han verificado su email", () => {
    const shouldGate = shouldGateEmailVerification({
      user: { role: "coach", email: "nuevo@clubbalonmano.es" },
      firebaseUser: {
        email: "nuevo@clubbalonmano.es",
        emailVerified: false,
        providerData: [{ providerId: "password" }],
      },
      isEmailVerified: false,
    });
    assert.equal(shouldGate, true);
  });

  it("Debe PERMITIR acceso una vez el usuario confirma el correo (emailVerified = true)", () => {
    const shouldGate = shouldGateEmailVerification({
      user: { role: "coach", email: "confirmado@clubbalonmano.es" },
      firebaseUser: {
        email: "confirmado@clubbalonmano.es",
        emailVerified: true,
        providerData: [{ providerId: "password" }],
      },
      isEmailVerified: false,
    });
    assert.equal(shouldGate, false);
  });

  it("Debe PERMITIR acceso inmediatamente tras reload cuando isEmailVerified es actualizado", () => {
    const shouldGate = shouldGateEmailVerification({
      user: { role: "coach", email: "confirmado@clubbalonmano.es" },
      firebaseUser: {
        email: "confirmado@clubbalonmano.es",
        emailVerified: false,
        providerData: [{ providerId: "password" }],
      },
      isEmailVerified: true,
    });
    assert.equal(shouldGate, false);
  });
});

describe("Auth - Validación de Formato de Email para Recuperación de Contraseña", () => {
  it("Debe validar correos con formato correcto", () => {
    assert.equal(isValidEmail("entrenador@balonmano.es"), true);
    assert.equal(isValidEmail("analista.tactico@club.cat"), true);
    assert.equal(isValidEmail("admin@handtix.pro"), true);
  });

  it("Debe rechazar correos vacíos, sin dominio o con formato erróneo", () => {
    assert.equal(isValidEmail(""), false);
    assert.equal(isValidEmail("   "), false);
    assert.equal(isValidEmail("entrenadorsinarroba.es"), false);
    assert.equal(isValidEmail("entrenador@sindominio"), false);
    assert.equal(isValidEmail(null), false);
    assert.equal(isValidEmail(undefined), false);
  });
});

describe("Auth - Mapeo de Códigos de Error de Recuperación y Registro", () => {
  it("Mapea auth/user-not-found a mensaje comprensible", () => {
    assert.equal(mapAuthError("auth/user-not-found"), "El usuario no existe.");
  });

  it("Mapea auth/too-many-requests a protección de rate limiting", () => {
    assert.equal(
      mapAuthError("auth/too-many-requests"),
      "Demasiadas solicitudes. Por favor, espera unos minutos."
    );
  });

  it("Mapea auth/email-already-in-use para evitar registros duplicados", () => {
    assert.equal(
      mapAuthError("auth/email-already-in-use"),
      "Ya existe una cuenta registrada con este correo electrónico."
    );
  });

  it("Mapea auth/weak-password para seguridad de contraseña", () => {
    assert.equal(
      mapAuthError("auth/weak-password"),
      "La contraseña debe tener al menos 6 caracteres."
    );
  });
});

describe("AuthActionPage (/auth/action) - Utilidades de enlaces e i18n", () => {
  it("Debe extraer mode, token/oobCode y lang válido desde la URL", () => {
    const parsedInd = parseAuthActionSearch("?mode=verifyEmail&token=TOK_INDEP_999&lang=es");
    assert.equal(parsedInd.mode, "verifyEmail");
    assert.equal(parsedInd.token, "TOK_INDEP_999");
    assert.equal(parsedInd.oobCode, "");
    assert.equal(parsedInd.lang, "es");

    const parsed = parseAuthActionSearch("?mode=resetPassword&oobCode=ABC_123&lang=de-DE");
    assert.equal(parsed.mode, "resetPassword");
    assert.equal(parsed.oobCode, "ABC_123");
    assert.equal(parsed.lang, "de");

    const invalidLang = parseAuthActionSearch("?mode=verifyEmail&oobCode=XYZ&lang=xx");
    assert.equal(invalidLang.lang, null);
  });

  it("Debe validar longitud mínima y coincidencia al restablecer contraseña", () => {
    assert.equal(validateResetPasswordFields("", "123456"), "auth.fill_all_fields");
    assert.equal(validateResetPasswordFields("12345", "12345"), "auth_action.password_min_length");
    assert.equal(validateResetPasswordFields("abc123", "abc124"), "auth_action.passwords_mismatch");
    assert.equal(validateResetPasswordFields("Handtix2026!", "Handtix2026!"), null);
  });

  it("Debe mapear códigos de error de Firebase Action Code", () => {
    assert.equal(mapActionCodeErrorKey("auth/expired-action-code"), "auth_action.error_expired");
    assert.equal(mapActionCodeErrorKey("auth/invalid-action-code"), "auth_action.error_invalid");
    assert.equal(mapActionCodeErrorKey("unknown"), "auth_action.error_generic");
  });

  it("Debe incluir las claves de auth_action en los 6 archivos locales de i18n", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const langs = ["es", "en", "de", "fr", "da", "pl"];
    const requiredKeys = [
      "verify_success_title",
      "reset_form_title",
      "save_password_btn",
      "reset_success_title",
      "error_expired",
      "passwords_mismatch",
    ];

    for (const lang of langs) {
      const p = path.resolve(process.cwd(), `src/i18n/locales/${lang}.json`);
      const data = JSON.parse(fs.readFileSync(p, "utf-8"));
      assert.ok(data.auth_action, `Falta auth_action en ${lang}.json`);
      for (const key of requiredKeys) {
        assert.ok(data.auth_action[key], `Falta auth_action.${key} en ${lang}.json`);
      }
    }
  });
});
