import { useState } from "react";
import { useTranslation } from "react-i18next";
import logoCuadrado from "../../assets/logoCuadrado.png";
import LanguageSelector from "../common/LanguageSelector";

import LoginForm from "./LoginForm";
import RegisterUserForm from "./RegisterUserForm";

import "./AuthPage.css";

const IconSun = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

function AuthPage({
  login,
  register,
  loginWithGoogle,
  loginAsGuest,
  theme = "light",
  toggleTheme,
  onBackToLanding,
}) {
  const { t } = useTranslation();
  const [mode, setMode] = useState("login");

  return (
    <div className="auth-container">
      {onBackToLanding && (
        <button
          type="button"
          className="auth-back-to-landing"
          onClick={onBackToLanding}
          title={t("auth.back_to_landing")}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          <span>{t("auth.back_to_landing")}</span>
        </button>
      )}

      <div className="auth-top-actions">
        <LanguageSelector compact />
        <button
          type="button"
          className="auth-theme-toggle-top"
          onClick={toggleTheme}
          title={theme === "dark" ? t("common.switch_to_light") : t("common.switch_to_dark")}
        >
          {theme === "dark" ? <IconMoon /> : <IconSun />}
          <span>{theme === "dark" ? t("common.dark_mode") : t("common.light_mode")}</span>
        </button>
      </div>

      <div className="auth-card">
        <header className="auth-header">
          <img src={logoCuadrado} alt="HandStats — Analyze. Improve. Win." className="auth-brand-logo" />
        </header>

        <div className="auth-tabs" role="tablist" aria-label="Opciones de autenticación">
          <button
            role="tab"
            aria-selected={mode === "login"}
            aria-controls="panel-login"
            id="tab-login"
            className={mode === "login" ? "active" : ""}
            onClick={() => setMode("login")}
          >
            {t("auth.login_tab")}
          </button>

          <button
            role="tab"
            aria-selected={mode === "register"}
            aria-controls="panel-register"
            id="tab-register"
            className={mode === "register" ? "active" : ""}
            onClick={() => setMode("register")}
          >
            {t("auth.register_tab")}
          </button>
        </div>

        <div
          role="tabpanel"
          id="panel-login"
          aria-labelledby="tab-login"
          className="auth-panel"
          style={{ display: mode === "login" ? "block" : "none" }}
        >
          <LoginForm
            login={login}
            loginWithGoogle={loginWithGoogle}
            loginAsGuest={loginAsGuest}
          />
        </div>

        <div
          role="tabpanel"
          id="panel-register"
          aria-labelledby="tab-register"
          className="auth-panel"
          style={{ display: mode === "register" ? "block" : "none" }}
        >
          <RegisterUserForm
            register={register}
            onRegisterSuccess={() => setMode("login")}
          />
        </div>
      </div>
    </div>
  );
}

export default AuthPage;