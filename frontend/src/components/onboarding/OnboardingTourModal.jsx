import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { tourTranslations } from "./onboardingData";
import "./OnboardingTourModal.css";

/* ==========================================================
   MINI VISUAL MOCKUPS FOR EACH STEP
   ========================================================== */

function MockupWelcome() {
  return (
    <div className="tour-mockup-frame mockup-welcome">
      <div className="mockup-court-bg">
        <div className="court-goal-area left"></div>
        <div className="court-center-circle"></div>
        <div className="court-free-throw left"></div>
        <div className="court-seven-meter left"></div>
      </div>
      <div className="mockup-floating-badge badge-top">
        <span className="pulsing-dot"></span>
        <span className="badge-text">LIVE · ASOBAL // EHF</span>
      </div>
      <div className="mockup-radar-card">
        <div className="radar-header">
          <span className="radar-title">#10 · D. DUJSHEBAEV</span>
          <span className="radar-val">+8.4 NPS</span>
        </div>
        <div className="radar-stat-bars">
          <div className="radar-bar-row">
            <span>xG Eficacia</span>
            <div className="stat-fill-track"><div className="stat-fill-bar" style={{ width: "88%" }}></div></div>
            <span className="stat-pct">88%</span>
          </div>
          <div className="radar-bar-row">
            <span>7m Provocados</span>
            <div className="stat-fill-track"><div className="stat-fill-bar" style={{ width: "75%", background: "var(--color-primary)" }}></div></div>
            <span className="stat-pct">3</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function MockupMatchSetup() {
  return (
    <div className="tour-mockup-frame mockup-setup">
      <div className="mockup-pdf-dropzone">
        <div className="mockup-pdf-icon-wrap">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
        </div>
        <div className="mockup-pdf-info">
          <span className="pdf-title">Acta_Oficial_RFEBM_Jornada14.pdf</span>
          <span className="pdf-status">100% Parseado · 32 Jugadores detectados</span>
        </div>
      </div>
      <div className="mockup-teams-preview">
        <div className="team-pill home">
          <span className="pill-dot"></span>
          <span className="pill-name">FC BARCELONA</span>
          <span className="pill-count">16 jug.</span>
        </div>
        <div className="pill-vs">VS</div>
        <div className="team-pill away">
          <span className="pill-dot away"></span>
          <span className="pill-name">BM FRAIKIN GRANOLLERS</span>
          <span className="pill-count">16 jug.</span>
        </div>
      </div>
    </div>
  );
}

function MockupLiveDesk() {
  return (
    <div className="tour-mockup-frame mockup-livedesk">
      <div className="mockup-step-pills">
        <div className="seq-pill active"><span className="seq-num">1</span> Jugador</div>
        <span className="seq-arrow">→</span>
        <div className="seq-pill active"><span className="seq-num">2</span> Acción</div>
        <span className="seq-arrow">→</span>
        <div className="seq-pill active"><span className="seq-num">3</span> Pista</div>
        <span className="seq-arrow">→</span>
        <div className="seq-pill active"><span className="seq-num">4</span> Portería</div>
      </div>
      <div className="mockup-desk-grid">
        <div className="mockup-court-zones">
          <div className="court-zone-tag">6m Pivote</div>
          <div className="court-zone-tag active">9m Lateral Izq.</div>
          <div className="court-zone-tag">Extremo Der.</div>
          <div className="court-zone-tag">7 Metros</div>
        </div>
        <div className="mockup-goal-matrix">
          <div className="goal-cell top-left hit">84%</div>
          <div className="goal-cell top-mid">45%</div>
          <div className="goal-cell top-right hit">92%</div>
          <div className="goal-cell mid-left">30%</div>
          <div className="goal-cell center">Parada</div>
          <div className="goal-cell mid-right">38%</div>
          <div className="goal-cell bot-left hit">78%</div>
          <div className="goal-cell bot-mid">18%</div>
          <div className="goal-cell bot-right hit">86%</div>
        </div>
      </div>
    </div>
  );
}

function MockupAnalytics() {
  return (
    <div className="tour-mockup-frame mockup-analytics">
      <div className="mockup-metric-cards">
        <div className="m-card xg">
          <span className="m-title">xG PROMEDIO</span>
          <span className="m-val">0.68</span>
          <span className="m-sub">+0.14 sobre media</span>
        </div>
        <div className="m-card xsaves">
          <span className="m-title">xSAVES PORTERO</span>
          <span className="m-val">42.8%</span>
          <span className="m-sub">+3.2 goles evitados</span>
        </div>
        <div className="m-card nps">
          <span className="m-title">NET PLAYER SCORE</span>
          <span className="m-val">+7.6</span>
          <span className="m-sub">Rendimiento Élite</span>
        </div>
      </div>
      <div className="mockup-heat-distrib">
        <div className="distrib-bar">
          <div className="distrib-seg goals" style={{ width: "55%" }}>55% Goles</div>
          <div className="distrib-seg saves" style={{ width: "30%" }}>30% Paradas</div>
          <div className="distrib-seg out" style={{ width: "15%" }}>15% Fuera</div>
        </div>
      </div>
    </div>
  );
}

function MockupTeams() {
  return (
    <div className="tour-mockup-frame mockup-teams">
      <div className="mockup-table">
        <div className="mockup-table-header">
          <span>DORSAL / NOMBRE</span>
          <span>POS.</span>
          <span>GOLES</span>
          <span>EFICACIA</span>
          <span>NPS</span>
        </div>
        <div className="mockup-table-row">
          <span className="row-name"><strong>#7</strong> · V. Rivera</span>
          <span className="pos-badge">EI</span>
          <span>6 / 7</span>
          <span className="eff-high">85.7%</span>
          <span className="nps-high">+6.8</span>
        </div>
        <div className="mockup-table-row">
          <span className="row-name"><strong>#18</strong> · L. Fabregas</span>
          <span className="pos-badge">PI</span>
          <span>5 / 5</span>
          <span className="eff-high">100%</span>
          <span className="nps-high">+7.2</span>
        </div>
        <div className="mockup-table-row">
          <span className="row-name"><strong>#12</strong> · G. Pérez de Vargas</span>
          <span className="pos-badge">PO</span>
          <span>14 paradas</span>
          <span className="eff-high">38.8%</span>
          <span className="nps-high">+8.1</span>
        </div>
      </div>
    </div>
  );
}

function MockupReports() {
  return (
    <div className="tour-mockup-frame mockup-reports">
      <div className="mockup-pdf-preview-sheet">
        <div className="pdf-sheet-header">
          <div className="pdf-logo-text">HANDTIX // DOSSIER OFICIAL</div>
          <div className="pdf-date-tag">MATCH REPORT · JORNADA 14</div>
        </div>
        <div className="pdf-sheet-body">
          <div className="pdf-chart-line">
            <div className="chart-step s1"></div>
            <div className="chart-step s2"></div>
            <div className="chart-step s3"></div>
            <div className="chart-step s4"></div>
            <div className="chart-step s5"></div>
          </div>
          <div className="pdf-tags-row">
            <span className="pdf-mini-tag">Hoja de Tiro</span>
            <span className="pdf-mini-tag">Mapa de Calor</span>
            <span className="pdf-mini-tag">Eficacia 7m</span>
            <span className="pdf-mini-tag">Informe Técnico</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function renderMockup(mockupType) {
  switch (mockupType) {
    case "welcome":
      return <MockupWelcome />;
    case "match_setup":
      return <MockupMatchSetup />;
    case "live_desk":
      return <MockupLiveDesk />;
    case "analytics":
      return <MockupAnalytics />;
    case "teams":
      return <MockupTeams />;
    case "reports":
      return <MockupReports />;
    default:
      return <MockupWelcome />;
  }
}

/* ==========================================================
   MAIN COMPONENT: OnboardingTourModal
   ========================================================== */

export default function OnboardingTourModal({
  isOpen,
  onClose,
  onOpenManual,
  initialStep = 0
}) {
  const { i18n } = useTranslation();
  const currentLang = (i18n.language || "es").slice(0, 2);
  const tData = tourTranslations[currentLang] || tourTranslations.es;

  const [currentStepIndex, setCurrentStepIndex] = useState(initialStep);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCurrentStepIndex(initialStep);
    }
  }, [isOpen, initialStep]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      if (e.key === "Escape") {
        handleFinish();
      } else if (e.key === "ArrowRight") {
        if (currentStepIndex < tData.steps.length - 1) {
          setCurrentStepIndex((prev) => prev + 1);
        }
      } else if (e.key === "ArrowLeft") {
        if (currentStepIndex > 0) {
          setCurrentStepIndex((prev) => prev - 1);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, currentStepIndex, tData.steps.length]);

  if (!isOpen) return null;

  const step = tData.steps[currentStepIndex] || tData.steps[0];
  const totalSteps = tData.steps.length;
  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex === totalSteps - 1;

  const handleFinish = () => {
    if (dontShowAgain) {
      try {
        localStorage.setItem("hs_onboarding_completed", "true");
      } catch (err) {
        console.error("No se pudo guardar la preferencia de onboarding:", err);
      }
    }
    if (onClose) onClose();
  };

  const handleSkip = () => {
    handleFinish();
  };

  const handleManualClick = () => {
    handleFinish();
    if (onOpenManual) onOpenManual();
  };

  return (
    <div className="onboarding-tour-backdrop" onClick={handleFinish}>
      <div
        className="onboarding-tour-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-step-title"
      >
        {/* Header Superior del Modal */}
        <div className="tour-modal-header">
          <div className="tour-badge-pill">
            <span className="tour-badge-dot"></span>
            <span>{tData.badge} · {step.category}</span>
          </div>

          <div className="tour-header-actions">
            <span className="tour-step-counter">
              {tData.stepOf.replace("{{current}}", currentStepIndex + 1).replace("{{total}}", totalSteps)}
            </span>
            <button
              type="button"
              className="tour-close-btn"
              onClick={handleFinish}
              title={tData.btnSkip}
              aria-label="Cerrar tour"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Barra de Progreso Superior */}
        <div className="tour-progress-bar-track">
          <div
            className="tour-progress-bar-fill"
            style={{ width: `${((currentStepIndex + 1) / totalSteps) * 100}%` }}
          ></div>
        </div>

        {/* Cuerpo del Modal: 2 Columnas (Info + Mockup) */}
        <div className="tour-modal-body">
          {/* Columna Izquierda: Información Detallada */}
          <div className="tour-content-col">
            <h2 id="tour-step-title" className="tour-step-title">
              {step.title}
            </h2>
            <p className="tour-step-subtitle">
              {step.subtitle}
            </p>
            <p className="tour-step-description">
              {step.description}
            </p>

            {/* Lista de Puntos Clave */}
            <div className="tour-highlights-box">
              {step.highlights.map((item, idx) => (
                <div key={idx} className="tour-highlight-item">
                  <div className="tour-check-icon">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <span>{item}</span>
                </div>
              ))}
            </div>

            {/* Caja de Consejo Pro */}
            {step.proTip && (
              <div className="tour-protip-box">
                <div className="tour-protip-badge">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="1" x2="12" y2="3" />
                    <line x1="12" y1="21" x2="12" y2="23" />
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                    <line x1="1" y1="12" x2="3" y2="12" />
                    <line x1="21" y1="12" x2="23" y2="12" />
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                    <circle cx="12" cy="12" r="5" />
                  </svg>
                  <span>{tData.proTipLabel}</span>
                </div>
                <p className="tour-protip-text">{step.proTip}</p>
              </div>
            )}
          </div>

          {/* Columna Derecha: Ilustración / Mockup Interactivo */}
          <div className="tour-visual-col">
            {renderMockup(step.mockupType)}
          </div>
        </div>

        {/* Footer del Modal con Navegación y Controles */}
        <div className="tour-modal-footer">
          <div className="tour-footer-left">
            <label className="tour-checkbox-label">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
              />
              <span>{tData.dontShowAgain}</span>
            </label>
          </div>

          <div className="tour-footer-center">
            <div className="tour-step-dots">
              {tData.steps.map((_, dotIdx) => (
                <button
                  key={dotIdx}
                  type="button"
                  className={`tour-step-dot ${dotIdx === currentStepIndex ? "active" : ""} ${dotIdx < currentStepIndex ? "passed" : ""}`}
                  onClick={() => setCurrentStepIndex(dotIdx)}
                  title={`Ir al paso ${dotIdx + 1}`}
                  aria-label={`Paso ${dotIdx + 1}`}
                />
              ))}
            </div>
          </div>

          <div className="tour-footer-right">
            {onOpenManual && (
              <button
                type="button"
                className="btn-tour-secondary tour-manual-btn"
                onClick={handleManualClick}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
                <span>{tData.btnOpenManual}</span>
              </button>
            )}

            {!isFirst && (
              <button
                type="button"
                className="btn-tour-secondary"
                onClick={() => setCurrentStepIndex((prev) => prev - 1)}
              >
                {tData.btnPrev}
              </button>
            )}

            {!isLast ? (
              <button
                type="button"
                className="btn-tour-primary"
                onClick={() => setCurrentStepIndex((prev) => prev + 1)}
              >
                <span>{tData.btnNext}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>
            ) : (
              <button
                type="button"
                className="btn-tour-primary finish"
                onClick={handleFinish}
              >
                <span>{tData.btnFinish}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
