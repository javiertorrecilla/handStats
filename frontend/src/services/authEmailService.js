import api from "./api";

function extractBackendError(err) {
  const status = err?.response?.status;
  const detail = err?.response?.data?.detail;
  const code = typeof detail === "object" ? detail?.code : null;
  const message =
    (typeof detail === "object" ? detail?.message : detail) ||
    err?.message ||
    "Error de comunicación con el servicio de correo";

  return { status, code, message };
}

const authEmailService = {
  /**
   * Solicita al backend el envío del correo personalizado de verificación vía Resend.
   * Devuelve { handled: true } si fue enviado o ya verificado, o { handled: false }
   * cuando se requiere fallback al proveedor nativo de Firebase.
   */
  sendCustomVerificationEmail: async ({ idToken, name, lang = "es", origin }) => {
    try {
      const res = await api.post(
        "/auth/send-verification",
        { name, lang, origin },
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
          timeout: 12000,
        }
      );

      const data = res?.data || {};
      if (data.sent || data.already_verified) {
        return { handled: true, ...data };
      }

      return { handled: false, fallbackRequired: true, ...data };
    } catch (err) {
      const { status, code, message } = extractBackendError(err);
      if (status === 429 || code === "auth/too-many-requests") {
        const rateErr = new Error(message);
        rateErr.code = "auth/too-many-requests";
        throw rateErr;
      }
      return { handled: false, fallbackRequired: true, reason: message };
    }
  },

  /**
   * Solicita al backend el envío del correo personalizado de recuperación vía Resend.
   * Propaga errores de validación/rate-limit y delega a fallback solo si el
   * servicio backend no está configurado o no responde.
   */
  sendCustomPasswordResetEmail: async ({ email, lang = "es", origin }) => {
    try {
      const res = await api.post(
        "/auth/send-password-reset",
        { email, lang, origin },
        { timeout: 12000 }
      );

      const data = res?.data || {};
      if (data.sent) {
        return { handled: true, ...data };
      }

      return { handled: false, fallbackRequired: true, ...data };
    } catch (err) {
      const { status, code, message } = extractBackendError(err);
      if (status === 400 || status === 404 || status === 429) {
        const clientErr = new Error(message);
        if (code) clientErr.code = code;
        throw clientErr;
      }
      return { handled: false, fallbackRequired: true, reason: message };
    }
  },
};

export default authEmailService;

