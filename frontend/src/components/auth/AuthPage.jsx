import { useState } from "react";

import LoginForm from "./LoginForm";
import RegisterUserForm from "./RegisterUserForm";

import "./AuthPage.css";

const IconHandball = () => (
  <svg className="auth-logo-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2a14.5 14.5 0 0 0 0 22" />
    <path d="M12 2a14.5 14.5 0 0 1 0 22" />
    <path d="M2 12h20" />
  </svg>
);

function AuthPage({
  login,
  register,
  loginWithGoogle,
  loginAsGuest,
}) {
  const [mode, setMode] = useState("login");

  return (
    <div className="auth-container">
      <div className="auth-card">
        <header className="auth-header">
          <h1 className="auth-title">
            <IconHandball />
            <span>HandStats</span>
          </h1>
          <p className="auth-subtitle">
            Analizador de partidos de balonmano
          </p>
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
            Iniciar sesión
          </button>

          <button
            role="tab"
            aria-selected={mode === "register"}
            aria-controls="panel-register"
            id="tab-register"
            className={mode === "register" ? "active" : ""}
            onClick={() => setMode("register")}
          >
            Registrarse
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