const SUPPORTED_LANGS = new Set(["es", "en", "de", "fr", "da", "pl"]);

/**
 * Extrae y normaliza los parámetros de acción desde el query string de la URL.
 */
export function parseAuthActionSearch(searchString) {
  const params = new URLSearchParams(searchString || "");
  const rawLang = (params.get("lang") || "").trim().toLowerCase().slice(0, 2);

  return {
    mode: (params.get("mode") || "").trim(),
    token: (params.get("token") || "").trim(),
    oobCode: (params.get("oobCode") || "").trim(),
    continueUrl: (params.get("continueUrl") || "").trim(),
    lang: SUPPORTED_LANGS.has(rawLang) ? rawLang : null,
  };
}

/**
 * Valida las contraseñas introducidas al restablecer el acceso.
 * Devuelve la clave de error i18n o null si es válida.
 */
export function validateResetPasswordFields(password, confirmPassword) {
  if (!password || !confirmPassword) {
    return "auth.fill_all_fields";
  }
  if (password.length < 6) {
    return "auth_action.password_min_length";
  }
  if (password !== confirmPassword) {
    return "auth_action.passwords_mismatch";
  }
  return null;
}

/**
 * Traduce códigos de error de Firebase Action Code a claves comprensibles.
 */
export function mapActionCodeErrorKey(errorCode) {
  switch (errorCode) {
    case "auth/expired-action-code":
      return "auth_action.error_expired";
    case "auth/invalid-action-code":
      return "auth_action.error_invalid";
    case "auth/user-disabled":
      return "auth_action.error_user_disabled";
    case "auth/user-not-found":
      return "auth.email_not_found";
    case "auth/weak-password":
      return "auth.weak_password";
    default:
      return "auth_action.error_generic";
  }
}

