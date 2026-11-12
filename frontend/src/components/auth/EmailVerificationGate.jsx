import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import { toast } from "../../context/ToastContext";
import logoCuadrado from "../../assets/logoCuadrado.png";
import LanguageSelector from "../common/LanguageSelector";
import "./EmailVerificationGate.css";

const IconSun = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="12" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);

const IconMoon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

function EmailVerificationGate({ email, theme = "light", toggleTheme, onVerified }) {
  const { t } = useTranslation();
  const { sendVerificationEmail, checkEmailVerified, logout } = useAuth();

  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [message, setMessage] = useState(null); // { type: 'success' | 'warning' | 'error', text: '' }

  // Temporizador para el cooldown de reenvío
  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [cooldown]);

  const handleCheckVerification = async () => {
    setMessage(null);
    setChecking(true);

    try {
      const isVerified = await checkEmailVerified();
      if (isVerified) {
        const successMsg = t("auth.email_verified_success", "¡Correo verificado con éxito! Accediendo a tu panel...");
        setMessage({
          type: "success",
          text: successMsg,
        });
        toast.success(successMsg);
        if (onVerified) {
          setTimeout(onVerified, 800);
        }
      } else {
        const warnMsg = t("auth.not_verified_yet");
        setMessage({
          type: "warning",
          text: warnMsg,
        });
        toast.warning(warnMsg);
      }
    } catch (err) {
      console.error("Error comprobando estado de verificación:", err);
      const errText = err.message || t("auth.verification_check_error", "Error al verificar el estado del correo.");
      setMessage({
        type: "error",
        text: errText,
      });
      toast.error(errText);
    } finally {
      setChecking(false);
    }
  };

  const handleResendEmail = async () => {
    if (cooldown > 0 || resending) return;

    setMessage(null);
    setResending(true);

    try {
      await sendVerificationEmail();
      setCooldown(60);
      const successText = t("auth.resend_success");
      setMessage({
        type: "success",
        text: successText,
      });
      toast.success(successText);
    } catch (err) {
      console.error("Error reenviando verificación:", err);
      if (err.code === "auth/too-many-requests") {
        const rateText = t("auth.too_many_requests");
        setMessage({
          type: "error",
          text: rateText,
        });
        toast.error(rateText);
        setCooldown(120);
      } else {
        const failText = err.message || t("auth.resend_fail", "Error al reenviar el correo de verificación.");
        setMessage({
          type: "error",
          text: failText,
        });
        toast.error(failText);
      }
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="verify-gate-container">
      <div className="verify-gate-top-actions">
        <LanguageSelector compact />
        <button
          type="button"
          className="verify-gate-theme-toggle"
          onClick={toggleTheme}
          title={theme === "dark" ? t("common.switch_to_light") : t("common.switch_to_dark")}
        >
          {theme === "dark" ? <IconMoon /> : <IconSun />}
          <span>{theme === "dark" ? t("common.dark_mode") : t("common.light_mode")}</span>
        </button>
      </div>

      <div className="verify-gate-card">
        <header className="verify-gate-header">
          <img src={logoCuadrado} alt="Handtix — Analyze. Improve. Win." className="verify-gate-logo" />
        </header>

        <div className="verify-gate-badge-wrapper">
          <div className="verify-icon-pulse">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
          </div>
          <span className="verify-badge-pill">VALIDACIÓN PENDIENTE</span>
        </div>

        <h1 className="verify-gate-title">{t("auth.verify_email_title")}</h1>
        
        <p className="verify-gate-subtitle">
          {t("auth.verify_email_subtitle")}
        </p>

        <div className="verify-email-display-card">
          <div className="verify-email-info">
            <span className="verify-email-label">{t("auth.verify_email_sent_to")}</span>
            <span className="verify-email-address">{email}</span>
          </div>
          <span className="verify-status-chip">Pendiente</span>
        </div>

        <p className="verify-gate-instructions">
          {t("auth.verify_email_instructions")}
        </p>

        {message && (
          <div className={`auth-alert-box ${message.type}`} role="alert">
            {message.type === "success" && (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            )}
            {message.type === "warning" && (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            )}
            {message.type === "error" && (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            )}
            <span>{message.text}</span>
          </div>
        )}

        <div className="verify-gate-actions">
          <button
            type="button"
            className="btn btn-primary w-100 verify-primary-btn"
            onClick={handleCheckVerification}
            disabled={checking}
          >
            {checking ? (
              <span className="btn-with-spinner">
                <span className="spinner-mini" />
                {t("auth.checking_verification")}
              </span>
            ) : (
              t("auth.check_verification_btn")
            )}
          </button>

          <button
            type="button"
            className="btn btn-secondary w-100"
            onClick={handleResendEmail}
            disabled={cooldown > 0 || resending}
          >
            {resending ? (
              <span className="btn-with-spinner">
                <span className="spinner-mini" />
                {t("auth.sending_reset_link")}
              </span>
            ) : cooldown > 0 ? (
              t("auth.resend_cooldown", { seconds: cooldown })
            ) : (
              t("auth.resend_verification_btn")
            )}
          </button>
        </div>

        <div className="verify-tip-container">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <span>{t("auth.spam_tip")}</span>
        </div>

        <div className="verify-gate-footer">
          <button
            type="button"
            className="verify-logout-link"
            onClick={logout}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>{t("auth.logout_or_switch")}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default EmailVerificationGate;
