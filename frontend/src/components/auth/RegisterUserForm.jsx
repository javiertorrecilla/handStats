import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";

function RegisterUserForm({ onRegisterSuccess }) {
  const { t } = useTranslation();
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
      return alert(t("auth.fill_all_fields"));
    }

    if (form.password !== form.confirmPassword) {
      return alert(t("auth.passwords_dont_match"));
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
      <h2>{t("auth.register_title")}</h2>

      <div className="form-group">
        <label htmlFor="register-name">{t("auth.full_name")}</label>
        <input
          id="register-name"
          className="input-field"
          type="text"
          name="name"
          placeholder={t("auth.full_name_placeholder")}
          value={form.name}
          onChange={handleChange}
          required
          aria-required="true"
        />
      </div>

      <div className="form-group">
        <label htmlFor="register-email">{t("auth.email")}</label>
        <input
          id="register-email"
          className="input-field"
          type="email"
          name="email"
          placeholder={t("auth.email_placeholder")}
          value={form.email}
          onChange={handleChange}
          required
          aria-required="true"
        />
      </div>

      <div className="form-group">
        <label htmlFor="register-password">{t("auth.password")}</label>
        <input
          id="register-password"
          className="input-field"
          type="password"
          name="password"
          placeholder={t("auth.password_hint")}
          value={form.password}
          onChange={handleChange}
          required
          aria-required="true"
        />
      </div>

      <div className="form-group">
        <label htmlFor="register-confirmPassword">{t("auth.confirm_password")}</label>
        <input
          id="register-confirmPassword"
          className="input-field"
          type="password"
          name="confirmPassword"
          placeholder={t("auth.confirm_password_placeholder")}
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
        {loading ? t("auth.registering") : t("auth.register_btn")}
      </button>
    </form>
  );
}

export default RegisterUserForm;