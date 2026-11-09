import { describe, it } from "node:test";
import assert from "node:assert/strict";

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
    assert.equal(isValidEmail("admin@handstats.pro"), true);
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
