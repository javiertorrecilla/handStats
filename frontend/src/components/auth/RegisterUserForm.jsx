import { useState } from "react";
import { useAuth } from "../../context/AuthContext";

function RegisterUserForm({ onRegisterSuccess }) {
  const { register } = useAuth();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !form.name ||
      !form.email ||
      !form.password ||
      !form.confirmPassword
    ) {
      return alert("Completa todos los campos.");
    }

    if (form.password !== form.confirmPassword) {
      return alert("Las contraseñas no coinciden.");
    }

    try {
      setLoading(true);
      await register(form.email, form.password, form.name);
      if (onRegisterSuccess) {
        onRegisterSuccess();
      }
    } catch (error) {
      console.error(error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <h2>Crear cuenta</h2>

      <div className="form-group">
        <label htmlFor="register-name">Nombre completo</label>
        <input
          id="register-name"
          className="input-field"
          type="text"
          name="name"
          placeholder="Nombre Apellido"
          value={form.name}
          onChange={handleChange}
          required
          aria-required="true"
        />
      </div>

      <div className="form-group">
        <label htmlFor="register-email">Correo electrónico</label>
        <input
          id="register-email"
          className="input-field"
          type="email"
          name="email"
          placeholder="ejemplo@correo.com"
          value={form.email}
          onChange={handleChange}
          required
          aria-required="true"
        />
      </div>

      <div className="form-group">
        <label htmlFor="register-password">Contraseña</label>
        <input
          id="register-password"
          className="input-field"
          type="password"
          name="password"
          placeholder="Mínimo 6 caracteres"
          value={form.password}
          onChange={handleChange}
          required
          aria-required="true"
        />
      </div>

      <div className="form-group">
        <label htmlFor="register-confirmPassword">Repetir contraseña</label>
        <input
          id="register-confirmPassword"
          className="input-field"
          type="password"
          name="confirmPassword"
          placeholder="Repite la contraseña"
          value={form.confirmPassword}
          onChange={handleChange}
          required
          aria-required="true"
        />
      </div>

      <button
        className="btn btn-primary w-100"
        disabled={loading}
        type="submit"
      >
        {loading ? "Creando cuenta..." : "Crear cuenta"}
      </button>
    </form>
  );
}

export default RegisterUserForm;