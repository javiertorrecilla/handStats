import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import isotipo from "../../assets/isotipo.png";
import { checkIsMobileDevice } from "./deviceDetector";
import "./DeviceGuard.css";

export { checkIsMobileDevice };

/**
 * DeviceGuard Component
 * Prevents using HandStats on mobile phones, reserving access exclusively
 * to Tablets (iPad/Android) and Desktop/Laptops (PC/Mac).
 */
export function DeviceGuard({
  children,
  allowLandingPreview = true,
  onBackToLanding = null
}) {
  const { t } = useTranslation();
  const [isMobile, setIsMobile] = useState(checkIsMobileDevice);
  const [dimensions, setDimensions] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 1024,
    height: typeof window !== "undefined" ? window.innerHeight : 768
  });
  const [copied, setCopied] = useState(false);
  const [showLandingOverride, setShowLandingOverride] = useState(false);

  const handleResize = useCallback(() => {
    const mobileDetected = checkIsMobileDevice();
    setIsMobile(mobileDetected);
    setDimensions({
      width: window.innerWidth,
      height: window.innerHeight
    });
    // If resized to tablet/desktop size, reset landing override
    if (!mobileDetected) {
      setShowLandingOverride(false);
    }
  }, []);

  useEffect(() => {
    handleResize();
    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, [handleResize]);

  const handleCopyLink = () => {
    const url = window.location.href;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      });
    } else {
      // Fallback
      const textArea = document.createElement("textarea");
      textArea.value = url;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand("copy");
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      } catch (e) {
        console.error("Error al copiar enlace:", e);
      }
      document.body.removeChild(textArea);
    }
  };

  // If not on mobile, render children directly
  if (!isMobile) {
    return <>{children}</>;
  }

  // If mobile user explicitly chose to preview landing page
  if (showLandingOverride && allowLandingPreview) {
    return (
      <div className="dg-landing-wrapper">
        <aside className="dg-landing-mobile-banner" role="alert">
          <div className="dg-banner-content">
            <span className="dg-banner-icon">📱</span>
            <span className="dg-banner-text">
              {t(
                "device_guard.landing_mobile_banner",
                "HandStats está diseñado exclusivamente para Tablets y Ordenadores (PC / Mac). Para usar la plataforma, accede desde una tablet o PC."
              )}
            </span>
          </div>
          <button
            type="button"
            className="dg-banner-btn"
            onClick={() => setShowLandingOverride(false)}
          >
            {t("device_guard.btn_back_to_guard", "Ver compatibilidad")}
          </button>
        </aside>
        {children}
      </div>
    );
  }

  // Otherwise, render full DeviceGuard blocking screen
  return (
    <div className="dg-root-container">
      {/* Dynamic court watermark backdrop */}
      <div className="dg-court-background" aria-hidden="true">
        <svg viewBox="0 0 1200 600" className="dg-court-svg" preserveAspectRatio="none">
          <rect x="0" y="0" width="1200" height="600" fill="none" stroke="currentColor" strokeWidth="2" strokeOpacity="0.08" />
          <line x1="600" y1="0" x2="600" y2="600" stroke="currentColor" strokeWidth="2" strokeOpacity="0.12" />
          <circle cx="600" cy="300" r="120" fill="none" stroke="currentColor" strokeWidth="2" strokeOpacity="0.12" />
          <path d="M 0 190 L 110 190 A 110 110 0 0 1 110 410 L 0 410" fill="none" stroke="currentColor" strokeWidth="2" strokeOpacity="0.10" />
          <path d="M 1200 190 L 1090 190 A 110 110 0 0 0 1090 410 L 1200 410" fill="none" stroke="currentColor" strokeWidth="2" strokeOpacity="0.10" />
        </svg>
      </div>

      <main className="dg-card">
        {/* Brand Header */}
        <header className="dg-header">
          <div className="dg-brand-row">
            <img src={isotipo} alt="HandStats" className="dg-brand-logo" />
            <div className="dg-brand-info">
              <span className="dg-brand-name">HANDSTATS</span>
              <span className="dg-brand-tag">PRO MATCH SUITE</span>
            </div>
          </div>
          <div className="dg-status-badge">
            <span className="dg-badge-dot" />
            {t("device_guard.badge", "MÓVIL DETECTADO · DISPOSITIVO NO ADMITIDO")}
          </div>
        </header>

        {/* Hero Title */}
        <div className="dg-body-hero">
          <h1 className="dg-title">
            {t(
              "device_guard.title",
              "HandStats está disponible exclusivamente para Tablets y Ordenadores"
            )}
          </h1>
          <p className="dg-subtitle">
            {t(
              "device_guard.subtitle",
              "Nuestra plataforma profesional de toma de datos y análisis táctico de balonmano requiere una pantalla de Tablet (mínimo 768px de ancho) o un Ordenador para garantizar la precisión y ergonomía que exige la alta competición."
            )}
          </p>
        </div>

        {/* 3-Device Compatibility Matrix */}
        <section className="dg-devices-grid" aria-label="Dispositivos compatibles">
          {/* PC / Desktop */}
          <div className="dg-device-card dg-device-supported">
            <div className="dg-device-card-header">
              <div className="dg-device-icon-wrap dg-icon-desktop">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                  <line x1="12" y1="17" x2="12" y2="21" />
                </svg>
              </div>
              <span className="dg-device-pill dg-pill-success">
                ✓ {t("device_guard.device_desktop_status", "Compatible")}
              </span>
            </div>
            <h2 className="dg-device-name">
              {t("device_guard.device_desktop_title", "Ordenador (PC / Mac)")}
            </h2>
            <div className="dg-device-role">
              {t("device_guard.device_desktop_role", "Despacho, Vídeo & Análisis")}
            </div>
            <p className="dg-device-desc">
              {t(
                "device_guard.device_desktop_desc",
                "Suite completa de analítica táctica, modelos xG, comparativas históricas y dossiers PDF."
              )}
            </p>
          </div>

          {/* Tablet */}
          <div className="dg-device-card dg-device-supported dg-device-featured">
            <div className="dg-device-card-header">
              <div className="dg-device-icon-wrap dg-icon-tablet">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
                  <line x1="12" y1="18" x2="12.01" y2="18" />
                </svg>
              </div>
              <span className="dg-device-pill dg-pill-success">
                ✓ {t("device_guard.device_tablet_status", "Compatible")}
              </span>
            </div>
            <h2 className="dg-device-name">
              {t("device_guard.device_tablet_title", "Tablet (iPad / Android)")}
            </h2>
            <div className="dg-device-role">
              {t("device_guard.device_tablet_role", "Banquillo & Pie de Pista")}
            </div>
            <p className="dg-device-desc">
              {t(
                "device_guard.device_tablet_desc",
                "Toma de datos táctil ultra rápida a 2 toques, control de tiempos muertos y rotaciones en directo."
              )}
            </p>
          </div>

          {/* Smartphone */}
          <div className="dg-device-card dg-device-unsupported">
            <div className="dg-device-card-header">
              <div className="dg-device-icon-wrap dg-icon-mobile">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                  <line x1="12" y1="18" x2="12.01" y2="18" />
                  <line x1="3" y1="3" x2="21" y2="21" stroke="#ef4444" strokeWidth="2.5" />
                </svg>
              </div>
              <span className="dg-device-pill dg-pill-danger">
                ✕ {t("device_guard.device_mobile_status", "No Compatible")}
              </span>
            </div>
            <h2 className="dg-device-name">
              {t("device_guard.device_mobile_title", "Teléfono Móvil")}
            </h2>
            <div className="dg-device-role">
              {t("device_guard.device_mobile_role", "Superficie Reducida")}
            </div>
            <p className="dg-device-desc">
              {t(
                "device_guard.device_mobile_desc",
                "La pantalla de un móvil no permite registrar acciones ni consultar analíticas con la velocidad requerida."
              )}
            </p>
          </div>
        </section>

        {/* Technical Diagnostics */}
        <section className="dg-diagnostics" aria-label="Información técnica">
          <div className="dg-diagnostics-badge">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <span>
              {t("device_guard.detected_resolution", "Resolución actual:")}{" "}
              <strong>{dimensions.width} × {dimensions.height} px</strong> ·{" "}
              {t("device_guard.min_required", "Mínimo requerido: 768 px de ancho")}
            </span>
          </div>
          <p className="dg-diagnostics-hint">
            {t(
              "device_guard.desktop_hint",
              "Si estás en un PC o portátil, maximiza o amplía la ventana de tu navegador para continuar."
            )}
          </p>
        </section>

        {/* Action Buttons */}
        <footer className="dg-actions">
          <button
            type="button"
            className={`dg-btn-primary ${copied ? "dg-btn-copied" : ""}`}
            onClick={handleCopyLink}
          >
            <span className="dg-btn-icon">
              {copied ? (
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              )}
            </span>
            <span>
              {copied
                ? t("device_guard.btn_link_copied", "¡Enlace copiado al portapapeles!")
                : t("device_guard.btn_copy_link", "Copiar enlace para abrir en Tablet o PC")}
            </span>
          </button>

          {allowLandingPreview && (
            <button
              type="button"
              className="dg-btn-secondary"
              onClick={() => {
                if (onBackToLanding) {
                  onBackToLanding();
                }
                setShowLandingOverride(true);
              }}
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              <span>
                {t(
                  "device_guard.btn_view_landing",
                  "Ver presentación web (Landing informativa)"
                )}
              </span>
            </button>
          )}
        </footer>
      </main>
    </div>
  );
}

// Named alias DevideGuard for backward compatibility with user typo
export const DevideGuard = DeviceGuard;
export default DeviceGuard;
