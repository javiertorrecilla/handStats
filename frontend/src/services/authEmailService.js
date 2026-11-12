import api from "./api";

function buildServiceError(err, defaultMessage = "Error de comunicación con el servidor") {
  const detail = err?.response?.data?.detail;
  const code = typeof detail === "object" ? detail?.code : null;
  const message =
    (typeof detail === "object" ? detail?.message : detail) ||
    err?.message ||
    defaultMessage;

  const customErr = new Error(message);
  if (code) customErr.code = code;
  if (err?.response?.status) customErr.status = err.response.status;
  return customErr;
}

const authEmailService = {
  registerIndependent: async ({ name, email, password, lang = "es", origin }) => {
    try {
      const res = await api.post(
        "/auth/register",
        { name, email, password, lang, origin },
        { timeout: 15000 }
      );
      return res.data;
    } catch (err) {
      throw buildServiceError(err, "No se pudo completar el registro.");
    }
  },

  loginIndependent: async ({ email, password }) => {
    try {
      const res = await api.post(
        "/auth/login",
        { email, password },
        { timeout: 12000 }
      );
      return res.data;
    } catch (err) {
      throw buildServiceError(err, "Correo o contraseña incorrectos.");
    }
  },

  migrateLegacyAccount: async ({ email, password, firebase_id_token }) => {
    try {
      const res = await api.post(
        "/auth/migrate-legacy",
        { email, password, firebase_id_token },
        { timeout: 12000 }
      );
      return res.data;
    } catch (err) {
      throw buildServiceError(err, "No se pudo sincronizar la cuenta.");
    }
  },

  getMe: async (token) => {
    try {
      const res = await api.get("/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 10000,
      });
      return res.data?.user;
    } catch (err) {
      throw buildServiceError(err, "Sesión no válida.");
    }
  },

  sendVerificationEmail: async ({ token, name, lang = "es", origin }) => {
    try {
      const res = await api.post(
        "/auth/send-verification",
        { name, lang, origin },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          timeout: 15000,
        }
      );
      return res.data;
    } catch (err) {
      throw buildServiceError(err, "No se pudo enviar el correo de verificación.");
    }
  },

  confirmVerification: async (token) => {
    try {
      const res = await api.post(
        "/auth/confirm-verification",
        { token },
        { timeout: 12000 }
      );
      return res.data;
    } catch (err) {
      throw buildServiceError(err, "No se pudo verificar el correo.");
    }
  },

  sendPasswordResetEmail: async ({ email, lang = "es", origin }) => {
    try {
      const res = await api.post(
        "/auth/send-password-reset",
        { email, lang, origin },
        { timeout: 15000 }
      );
      return res.data;
    } catch (err) {
      throw buildServiceError(err, "No se pudo enviar el correo de recuperación.");
    }
  },

  verifyResetToken: async (token) => {
    try {
      const res = await api.get("/auth/verify-reset-token", {
        params: { token },
        timeout: 10000,
      });
      return res.data;
    } catch (err) {
      throw buildServiceError(err, "El enlace de recuperación no es válido o ha caducado.");
    }
  },

  confirmPasswordReset: async ({ token, new_password }) => {
    try {
      const res = await api.post(
        "/auth/confirm-password-reset",
        { token, new_password },
        { timeout: 12000 }
      );
      return res.data;
    } catch (err) {
      throw buildServiceError(err, "No se pudo actualizar la contraseña.");
    }
  },
};

export default authEmailService;
