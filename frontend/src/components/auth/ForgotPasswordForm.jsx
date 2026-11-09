import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import { toast } from "../../context/ToastContext";

function ForgotPasswordForm({ onBackToLogin }) {
  const { t } = useTranslation();
  const { resetPassword } = useAuth();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      const msg = t("auth.fill_all_fields");
      setErrorMsg(msg);
      toast.warning(msg);
      return;
    }

    try {
      setLoading(true);
      await resetPassword(trimmedEmail);
      setSuccess(true);
      toast.success(t("auth.reset_email_sent_title"));
    } catch (err) {
      console.error("Error al restablecer contraseña:", err);
      let userFriendlyMsg = err.message || t("auth.create_error");
      switch (err.code) {
        case "auth/user-not-found":
          userFriendlyMsg = t("auth.email_not_found");
          break;
        case "auth/invalid-email":
          userFriendlyMsg = t("auth.invalid_credentials");
          break;
        case "auth/too-many-requests":
          userFriendlyMsg = t("auth.too_many_requests");
          break;
        default:
          userFriendlyMsg = err.message || t("auth.create_error");
      }
      setErrorMsg(userFriendlyMsg);
      toast.error(userFriendlyMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = () => {
    setSuccess(false);
    setErrorMsg(null);
  };

  return (
    <div className="forgot-password-container">
      {success ? (
        <div className="auth-status-card success" role="status" aria-live="polite">
          <div className="status-icon-circle success-circle">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>

          <h2 className="auth-title">{t("auth.reset_email_sent_title")}</h2>
          
          <p className="auth-description">
            {t("auth.reset_email_sent_desc", { email })}
          </p>

          <div className="auth-tip-box">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <span>{t("auth.spam_tip")}</span>
          </div>

          <div className="auth-action-buttons">
            <button
              type="button"
              className="btn btn-primary w-100"
              onClick={onBackToLogin}
            >
              {t("auth.back_to_login")}
            </button>

            <button
              type="button"
              className="btn btn-secondary w-100"
              onClick={handleResend}
            >
              {t("auth.resend_reset_link")}
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <div className="forgot-header-intro">
            <div className="status-icon-circle key-circle">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 2l-2 2m-1.5 1.5L16 7l-2 2m-2-2a5 5 0 1 0-7.07 7.07 5 5 0 0 0 7.07-7.07l6-6 3-3z" />
              </svg>
            </div>
            <h2>{t("auth.forgot_password_title")}</h2>
            <p className="auth-subtitle-text">
              {t("auth.forgot_password_desc")}
            </p>
          </div>

          {errorMsg && (
            <div className="auth-alert-box error" role="alert">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="forgot-email">{t("auth.email")}</label>
            <input
              id="forgot-email"
              className="input-field"
              type="email"
              placeholder={t("auth.email_placeholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
              required
              aria-required="true"
            />
          </div>

          <button
            className="btn btn-primary w-100"
            disabled={loading}
            type="submit"
          >
            {loading ? (
              <span className="btn-with-spinner">
                <span className="spinner-mini" />
                {t("auth.sending_reset_link")}
              </span>
            ) : (
              t("auth.send_reset_link")
            )}
          </button>

          <button
            type="button"
            className="btn btn-ghost w-100 auth-back-btn"
            onClick={onBackToLogin}
          >
            ← {t("auth.back_to_login")}
          </button>
        </form>
      )}
    </div>
  );
}

export default ForgotPasswordForm;
