import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  applyActionCode,
  confirmPasswordReset,
  verifyPasswordResetCode,
} from "firebase/auth";

import { auth } from "../../firebase/firebase";
import { useAuth } from "../../context/AuthContext";
import { toast } from "../../context/ToastContext";
import logoCuadrado from "../../assets/logoCuadrado.png";
import LanguageSelector from "../common/LanguageSelector";
import {
  mapActionCodeErrorKey,
  parseAuthActionSearch,
  validateResetPasswordFields,
} from "./authActionUtils";
import "./AuthActionPage.css";

const IconSun = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
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
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

const IconEye = ({ visible }) =>
  visible ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );

function AuthActionPage({ theme = "light", toggleTheme, onOpenAppLogin }) {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, checkEmailVerified, sendVerificationEmail } = useAuth();

  const { mode, oobCode, lang } = useMemo(
    () => parseAuthActionSearch(location.search),
    [location.search]
  );

  const [status, setStatus] = useState("loading"); // loading | verify_success | reset_form | reset_success | recover_success | fallback_ready | error
  const [targetEmail, setTargetEmail] = useState("");
  const [errorText, setErrorText] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resendingVerif, setResendingVerif] = useState(false);

  const processedCodeRef = useRef("");

  useEffect(() => {
    if (lang && i18n.language?.slice(0, 2) !== lang) {
      i18n.changeLanguage(lang);
    }
  }, [lang, i18n]);

  useEffect(() => {
    const executionKey = `${mode}:${oobCode}`;
    if (!oobCode) {
      setStatus("fallback_ready");
      return;
    }

    if (processedCodeRef.current === executionKey) {
      return;
    }
    processedCodeRef.current = executionKey;

    let cancelled = false;

    const runAction = async () => {
      setStatus("loading");
      setErrorText("");

      try {
        if (mode === "verifyEmail") {
          await applyActionCode(auth, oobCode);
          if (auth.currentUser) {
            try {
              await checkEmailVerified();
            } catch (reloadErr) {
              console.warn("No se pudo recargar el usuario tras verificación:", reloadErr);
            }
          }
          if (!cancelled) {
            setStatus("verify_success");
            toast.success(
              t("auth_action.verify_success_title", "¡Correo verificado con éxito!")
            );
          }
        } else if (mode === "resetPassword") {
          const email = await verifyPasswordResetCode(auth, oobCode);
          if (!cancelled) {
            setTargetEmail(email || "");
            setStatus("reset_form");
          }
        } else if (mode === "recoverEmail") {
          await applyActionCode(auth, oobCode);
          if (!cancelled) {
            setStatus("recover_success");
          }
        } else {
          if (!cancelled) {
            setErrorText(t("auth_action.error_invalid", "El enlace no es válido o ha caducado."));
            setStatus("error");
          }
        }
      } catch (err) {
        console.error("Error procesando acción de Firebase:", err);
        if (!cancelled) {
          const errKey = mapActionCodeErrorKey(err?.code);
          const msg = t(errKey, "El enlace de seguridad ha caducado o ya ha sido utilizado.");
          setErrorText(msg);
          setStatus("error");
        }
      }
    };

    runAction();

    return () => {
      cancelled = true;
    };
  }, [mode, oobCode, checkEmailVerified, t]);

  const handleGoToApp = () => {
    if (user && auth.currentUser?.emailVerified) {
      navigate("/matches", { replace: true });
      return;
    }
    if (onOpenAppLogin) {
      onOpenAppLogin();
    }
    navigate("/", { replace: true });
  };

  const handleResendVerification = async () => {
    if (!auth.currentUser || resendingVerif) return;
    try {
      setResendingVerif(true);
      await sendVerificationEmail();
      toast.success(
        t("auth.resend_success", "Correo de verificación reenviado con éxito.")
      );
    } catch (err) {
      toast.error(err?.message || t("auth.resend_fail", "Error al reenviar el correo de verificación."));
    } finally {
      setResendingVerif(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setErrorText("");

    const validationKey = validateResetPasswordFields(password, confirmPassword);
    if (validationKey) {
      const msg = t(validationKey);
      setErrorText(msg);
      toast.warning(msg);
      return;
    }

    try {
      setSubmitting(true);
      await confirmPasswordReset(auth, oobCode, password);
      setStatus("reset_success");
      toast.success(
        t("auth_action.reset_success_title", "¡Contraseña actualizada correctamente!")
      );
    } catch (err) {
      console.error("Error al confirmar nueva contraseña:", err);
      const errKey = mapActionCodeErrorKey(err?.code);
      const msg = t(errKey, err?.message || "No se pudo restablecer la contraseña.");
      setErrorText(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-action-container">
      <div className="auth-action-top-actions">
        <LanguageSelector compact />
        {toggleTheme && (
          <button
            type="button"
            className="auth-action-theme-btn"
            onClick={toggleTheme}
            title={theme === "dark" ? t("common.switch_to_light") : t("common.switch_to_dark")}
          >
            {theme === "dark" ? <IconMoon /> : <IconSun />}
            <span>{theme === "dark" ? t("common.dark_mode") : t("common.light_mode")}</span>
          </button>
        )}
      </div>

      <main className="auth-action-card">
        <div className="auth-action-logo-wrap">
          <img src={logoCuadrado} alt="HandStats Pro" className="auth-action-logo" />
        </div>

        {status === "loading" && (
          <div role="status" aria-live="polite">
            <div className="auth-action-badge-col">
              <div className="auth-action-icon-circle loading">
                <div className="auth-action-spinner" />
              </div>
              <span className="auth-action-pill">
                {t("auth_action.processing_badge", "VALIDACIÓN EN CURSO")}
              </span>
            </div>
            <h1 className="auth-action-title">
              {mode === "verifyEmail"
                ? t("auth_action.verifying_title", "Verificando tu correo electrónico...")
                : t("auth_action.checking_link_title", "Validando enlace de seguridad...")}
            </h1>
            <p className="auth-action-desc">
              {t("auth_action.processing_desc", "Estamos comprobando tu token de seguridad de HandStats Pro. Solo llevará un instante.")}
            </p>
          </div>
        )}

        {(status === "verify_success" || status === "fallback_ready") && (
          <div role="status" aria-live="polite">
            <div className="auth-action-badge-col">
              <div className="auth-action-icon-circle success">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <span className="auth-action-pill success">
                {t("auth_action.verified_badge", "CUENTA VERIFICADA")}
              </span>
            </div>
            <h1 className="auth-action-title">
              {t("auth_action.verify_success_title", "¡Correo verificado con éxito!")}
            </h1>
            <p className="auth-action-desc">
              {t("auth_action.verify_success_desc", "Tu dirección de correo electrónico ha quedado confirmada. Ya tienes acceso completo a tu espacio táctico en HandStats Pro.")}
            </p>
            <div className="auth-action-actions">
              <button type="button" className="btn btn-primary w-100" onClick={handleGoToApp}>
                {user
                  ? t("auth_action.go_to_dashboard", "Acceder a HandStats Pro")
                  : t("auth.back_to_login", "Volver a Iniciar Sesión")}
              </button>
            </div>
          </div>
        )}

        {status === "reset_form" && (
          <div>
            <div className="auth-action-badge-col">
              <div className="auth-action-icon-circle security">
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <span className="auth-action-pill">
                {t("auth_action.reset_badge", "NUEVA CONTRASEÑA")}
              </span>
            </div>

            <h1 className="auth-action-title">
              {t("auth_action.reset_form_title", "Crea tu nueva contraseña")}
            </h1>
            <p className="auth-action-desc">
              {t("auth_action.reset_form_desc", "Elige una contraseña segura de al menos 6 caracteres para proteger tu cuenta.")}
            </p>

            {targetEmail && (
              <div className="auth-action-email-pill">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                <span>{targetEmail}</span>
              </div>
            )}

            <form className="auth-action-form" onSubmit={handleResetSubmit} noValidate>
              {errorText && (
                <div className="auth-action-error-box" role="alert">
                  <span>{errorText}</span>
                </div>
              )}

              <div className="auth-action-field">
                <label htmlFor="reset-new-password">
                  {t("auth_action.new_password_label", "Nueva contraseña")}
                </label>
                <div className="auth-action-input-wrap">
                  <input
                    id="reset-new-password"
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t("auth_action.new_password_placeholder", "Mínimo 6 caracteres")}
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    className="auth-action-eye-btn"
                    onClick={() => setShowPass((p) => !p)}
                    aria-label={t("auth.toggle_password", "Mostrar u ocultar contraseña")}
                  >
                    <IconEye visible={showPass} />
                  </button>
                </div>
              </div>

              <div className="auth-action-field">
                <label htmlFor="reset-confirm-password">
                  {t("auth_action.confirm_password_label", "Confirmar nueva contraseña")}
                </label>
                <div className="auth-action-input-wrap">
                  <input
                    id="reset-confirm-password"
                    type={showConfirmPass ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t("auth_action.confirm_password_placeholder", "Repite la contraseña")}
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    className="auth-action-eye-btn"
                    onClick={() => setShowConfirmPass((p) => !p)}
                    aria-label={t("auth.toggle_password", "Mostrar u ocultar contraseña")}
                  >
                    <IconEye visible={showConfirmPass} />
                  </button>
                </div>
              </div>

              <div className="auth-action-actions">
                <button type="submit" className="btn btn-primary w-100" disabled={submitting}>
                  {submitting
                    ? t("auth_action.saving_password", "Actualizando contraseña...")
                    : t("auth_action.save_password_btn", "Guardar nueva contraseña")}
                </button>
              </div>
            </form>
          </div>
        )}

        {status === "reset_success" && (
          <div role="status" aria-live="polite">
            <div className="auth-action-badge-col">
              <div className="auth-action-icon-circle success">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <span className="auth-action-pill success">
                {t("auth_action.reset_done_badge", "CONTRASEÑA ACTUALIZADA")}
              </span>
            </div>
            <h1 className="auth-action-title">
              {t("auth_action.reset_success_title", "¡Contraseña actualizada correctamente!")}
            </h1>
            <p className="auth-action-desc">
              {t("auth_action.reset_success_desc", "Ya puedes iniciar sesión en HandStats Pro con tu nueva contraseña.")}
            </p>
            <div className="auth-action-actions">
              <button type="button" className="btn btn-primary w-100" onClick={handleGoToApp}>
                {t("auth.back_to_login", "Volver a Iniciar Sesión")}
              </button>
            </div>
          </div>
        )}

        {status === "recover_success" && (
          <div role="status" aria-live="polite">
            <div className="auth-action-badge-col">
              <div className="auth-action-icon-circle success">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <span className="auth-action-pill success">
                {t("auth_action.verified_badge", "CUENTA RESTAURADA")}
              </span>
            </div>
            <h1 className="auth-action-title">
              {t("auth_action.recover_success_title", "Dirección de correo restaurada")}
            </h1>
            <p className="auth-action-desc">
              {t("auth_action.recover_success_desc", "Hemos revertido el cambio de correo y protegido el acceso a tu cuenta.")}
            </p>
            <div className="auth-action-actions">
              <button type="button" className="btn btn-primary w-100" onClick={handleGoToApp}>
                {t("auth.back_to_login", "Volver a Iniciar Sesión")}
              </button>
            </div>
          </div>
        )}

        {status === "error" && (
          <div role="alert">
            <div className="auth-action-badge-col">
              <div className="auth-action-icon-circle error">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              </div>
              <span className="auth-action-pill error">
                {t("auth_action.error_badge", "ENLACE NO VÁLIDO")}
              </span>
            </div>
            <h1 className="auth-action-title">
              {t("auth_action.error_title", "No se pudo completar la operación")}
            </h1>
            <p className="auth-action-desc">
              {errorText || t("auth_action.error_generic", "El enlace ha caducado o ya ha sido utilizado. Solicita uno nuevo.")}
            </p>
            <div className="auth-action-actions">
              {mode === "verifyEmail" && auth.currentUser && (
                <button
                  type="button"
                  className="btn btn-primary w-100"
                  onClick={handleResendVerification}
                  disabled={resendingVerif}
                >
                  {resendingVerif
                    ? t("auth.sending", "Enviando...")
                    : t("auth.resend_verification_btn", "Reenviar correo de verificación")}
                </button>
              )}
              <button type="button" className="btn btn-secondary w-100" onClick={handleGoToApp}>
                {user
                  ? t("auth_action.go_to_dashboard", "Acceder a HandStats Pro")
                  : t("auth.back_to_login", "Volver a Iniciar Sesión")}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default AuthActionPage;

