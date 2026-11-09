import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import { toast } from "../../context/ToastContext";

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
  const [errorMsg, setErrorMsg] = useState(null);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    if (
      !form.name ||
      !form.email ||
      !form.password ||
      !form.confirmPassword
    ) {
      const msg = t("auth.fill_all_fields");
      setErrorMsg(msg);
      toast.warning(msg);
      return;
    }

    if (form.password.length < 6) {
      const msg = t("auth.weak_password");
      setErrorMsg(msg);
      toast.warning(msg);
      return;
    }

    if (form.password !== form.confirmPassword) {
      const msg = t("auth.passwords_dont_match");
      setErrorMsg(msg);
      toast.warning(msg);
      return;
    }

    try {
      setLoading(true);
      await register(form.email, form.password, form.name);
      toast.success(t("auth.register_success", "Cuenta creada correctamente."));
      if (onRegisterSuccess) {
        onRegisterSuccess();
      }
    } catch (error) {
      console.error(error);
      let userFriendlyMsg = error.message;
      switch (error.code) {
        case "auth/email-already-in-use":
          userFriendlyMsg = t("auth.email_already_in_use");
          break;
        case "auth/invalid-email":
          userFriendlyMsg = t("auth.invalid_credentials");
          break;
        case "auth/weak-password":
          userFriendlyMsg = t("auth.weak_password");
          break;
        default:
          userFriendlyMsg = error.message;
      }
      setErrorMsg(userFriendlyMsg);
      toast.error(userFriendlyMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="auth-form" noValidate>
      <h2>{t("auth.register_title")}</h2>

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