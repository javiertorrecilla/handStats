import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import "./ToastContainer.css";

const ToastIcon = ({ type }) => {
  switch (type) {
    case "error":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      );
    case "success":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      );
    case "warning":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      );
    case "info":
    default:
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      );
  }
};

function ToastItem({ toast, onRemove }) {
  const { id, message, type = "info", title, duration = 4000 } = toast;
  const { t } = useTranslation();
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(100);
  const startTimeRef = useRef(Date.now());
  const remainingTimeRef = useRef(duration);
  const timerRef = useRef(null);

  useEffect(() => {
    if (isPaused) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    startTimeRef.current = Date.now();

    timerRef.current = setTimeout(() => {
      onRemove(id);
    }, remainingTimeRef.current);

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const timeLeft = Math.max(0, remainingTimeRef.current - elapsed);
      const percentage = (timeLeft / duration) * 100;
      setProgress(percentage);
    }, 40);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      clearInterval(interval);
    };
  }, [id, duration, isPaused, onRemove]);

  const handleMouseEnter = () => {
    setIsPaused(true);
    const elapsed = Date.now() - startTimeRef.current;
    remainingTimeRef.current = Math.max(0, remainingTimeRef.current - elapsed);
  };

  const handleMouseLeave = () => {
    setIsPaused(false);
  };

  const getDefaultTitle = () => {
    if (title) return title;
    switch (type) {
      case "error":
        return t("toast.error", "Error");
      case "success":
        return t("toast.success", "Completado");
      case "warning":
        return t("toast.warning", "Atención");
      case "info":
      default:
        return t("toast.info", "Información");
    }
  };

  return (
    <div
      className={`toast-card toast-${type}`}
      role={type === "error" || type === "warning" ? "alert" : "status"}
      aria-live={type === "error" ? "assertive" : "polite"}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="toast-content-wrapper">
        <div className={`toast-icon-badge badge-${type}`}>
          <ToastIcon type={type} />
        </div>

        <div className="toast-text-area">
          <strong className="toast-title">{getDefaultTitle()}</strong>
          <p className="toast-message">{message}</p>
        </div>

        <button
          type="button"
          className="toast-close-btn"
          onClick={() => onRemove(id)}
          aria-label={t("toast.close", "Cerrar notificación")}
          title={t("toast.close", "Cerrar")}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div className="toast-progress-track">
        <div
          className={`toast-progress-bar bar-${type}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

export default function ToastContainer({ toasts, onRemove }) {
  const { t } = useTranslation();
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="toast-viewport" aria-label={t("toast.system_notifications", "Notificaciones del sistema")}>
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}
