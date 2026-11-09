import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import ToastContainer from "../components/common/ToastContainer";

const ToastContext = createContext(null);

let toastIdCounter = 0;

/**
 * Disparador global que funciona tanto dentro como fuera de componentes React
 */
export const toast = {
  show: (message, type = "info", options = {}) => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("hs-toast", {
          detail: {
            id: `toast-${Date.now()}-${++toastIdCounter}`,
            message,
            type,
            title: options.title,
            duration: options.duration || (type === "error" ? 5000 : 4000),
          },
        })
      );
    }
  },
  error: (message, options = {}) => {
    toast.show(message, "error", options);
  },
  success: (message, options = {}) => {
    toast.show(message, "success", options);
  },
  warning: (message, options = {}) => {
    toast.show(message, "warning", options);
  },
  info: (message, options = {}) => {
    toast.show(message, "info", options);
  },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const lastToastRef = useRef({ message: "", time: 0 });

  const addToast = useCallback((toastData) => {
    // Evitar notificaciones duplicadas idénticas en ráfaga (< 600ms)
    const now = Date.now();
    if (
      lastToastRef.current.message === toastData.message &&
      now - lastToastRef.current.time < 600
    ) {
      return;
    }
    lastToastRef.current = { message: toastData.message, time: now };

    setToasts((prev) => [...prev, toastData]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setToasts([]);
  }, []);

  // Escuchar eventos globales "hs-toast"
  useEffect(() => {
    const handleCustomToast = (event) => {
      if (event.detail) {
        addToast(event.detail);
      }
    };

    window.addEventListener("hs-toast", handleCustomToast);
    return () => {
      window.removeEventListener("hs-toast", handleCustomToast);
    };
  }, [addToast]);

  // Interceptar window.alert nativo para que NUNCA más salte un pop-up bloqueante
  useEffect(() => {
    const originalAlert = window.alert;
    window.alert = (message) => {
      const msgStr = typeof message === "object" ? JSON.stringify(message) : String(message);
      toast.warning(msgStr);
    };

    return () => {
      window.alert = originalAlert;
    };
  }, []);

  return (
    <ToastContext.Provider
      value={{
        toasts,
        addToast,
        removeToast,
        clearAll,
        toast,
      }}
    >
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    // Si se usa fuera del provider, devolvemos el objeto toast global para total resiliencia
    return toast;
  }
  return {
    ...toast,
    toasts: context.toasts,
    removeToast: context.removeToast,
    clearAll: context.clearAll,
  };
}
