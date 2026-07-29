import { useState } from "react";
import logoCuadrado from "../../assets/logoCuadrado.png";

import LoginForm from "./LoginForm";
import RegisterUserForm from "./RegisterUserForm";

import "./AuthPage.css";

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