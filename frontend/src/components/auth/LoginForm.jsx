import { useState } from "react";

function LoginForm({
  login,
  loginWithGoogle,
  loginAsGuest,
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      return alert("Completa todos los campos.");
    }

    try {
      setLoading(true);
      await login(email, password);
    } catch (error) {
      console.error(error);
      switch (error.code) {
        case "auth/invalid-credential":
          alert("Correo o contraseña incorrectos.");
          break;
        case "auth/user-not-found":
          alert("El usuario no existe.");
          break;
        case "auth/wrong-password":
          alert("Contraseña incorrecta.");
          break;
        default:
          alert(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <form className="auth-form" onSubmit={handleLogin}>
        <div className="form-group">
          <label htmlFor="login-email">Correo electrónico</label>
          <input
            id="login-email"
            className="input-field"
            type="email"
            placeholder="ejemplo@correo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            aria-required="true"
          />
        </div>

        <div className="form-group">
          <label htmlFor="login-password">Contraseña</label>
          <input
            id="login-password"
            className="input-field"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            aria-required="true"
          />
        </div>

        <button
          className="btn btn-primary w-100"
          disabled={loading}
          type="submit"
        >
          {loading ? "Entrando..." : "Iniciar sesión"}
        </button>
      </form>

      <div className="auth-divider">
        <span>o</span>
      </div>

      <button
        className="google-btn"
        onClick={loginWithGoogle}
        type="button"
        aria-label="Iniciar sesión con Google"
      >
        <svg
          className="google-icon"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            fill="#4285F4"
            d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.53-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-8.83z"
          />
          <path
            fill="#34A853"
            d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.11 0-5.74-2.11-6.68-4.96H1.21v3.15C3.18 21.88 7.31 24 12 24z"
          />
          <path
            fill="#FBBC05"
            d="M5.32 14.24A7.16 7.16 0 0 1 4.91 12c0-.79.13-1.57.38-2.31V6.54H1.21A11.94 11.94 0 0 0 0 12c0 1.92.45 3.74 1.21 5.46l4.11-3.22z"
          />
          <path
            fill="#EA4335"
            d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.18 2.12 1.21 5.36l4.11 3.22c.94-2.85 3.57-4.96 6.68-4.96z"
          />
        </svg>
        <span>Continuar con Google</span>
      </button>

      <button
        className="btn btn-secondary w-100"
        style={{ marginTop: 12 }}
        onClick={loginAsGuest}
        type="button"
      >
        Entrar como invitado
      </button>
    </>
  );
}

export default LoginForm;