import React, { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  Home,
  RotateCcw,
  PlusCircle,
  Users,
  Settings as SettingsIcon,
  Zap,
  Flame,
  AlertOctagon,
  Activity,
  Sun,
  Moon,
  Trophy,
  Target
} from "lucide-react";
import isotipo from "../../assets/isotipo.png";
import LanguageSelector from "./LanguageSelector";
import "./NotFoundPage.css";

/**
 * Página 404 temática de Balonmano & Sports Analytics para HandStats.
 * Diseño centrado, impactante y conciso con un 404 gigante en el medio,
 * balón de balonmano interactivo con resina y animaciones de bote/tiro,
 * y tira compacta de estadísticas de balonmano.
 */
export default function NotFoundPage({ user, theme, toggleTheme, onGoHome }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  // Minijuego interactivo de lanzamiento a portería
  const [shotState, setShotState] = useState("idle"); // 'idle' | 'shooting' | 'goal'
  const [goalsScored, setGoalsScored] = useState(0);

  const handleShoot = () => {
    if (shotState === "shooting") return;
    setShotState("shooting");

    setTimeout(() => {
      setShotState("goal");
      setGoalsScored((prev) => prev + 1);
    }, 750);
  };

  const handleResetShot = () => {
    setShotState("idle");
  };

  const handleBack = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate(user ? "/matches" : "/");
    }
  };

  const currentPath = location.pathname || "/ruta-desconocida";

  return (
    <div className="not-found-container" data-theme={theme || "dark"}>
      {/* Resplandor ambiental de estadio y líneas tácticas de balonmano */}
      <div className="not-found-ambient-glow" aria-hidden="true" />
      <div className="not-found-court-bg" aria-hidden="true">
        <svg viewBox="0 0 1000 600" className="court-svg" preserveAspectRatio="none">
          <rect x="20" y="20" width="960" height="560" className="court-line court-boundary" />
          <line x1="500" y1="20" x2="500" y2="580" className="court-line court-center" />
          <circle cx="500" cy="300" r="70" className="court-line court-circle" />

          {/* Área 6m y 9m izquierda */}
          <path d="M 20 180 A 120 120 0 0 1 140 300 A 120 120 0 0 1 20 420" className="court-line court-6m" />
          <path
            d="M 20 120 A 180 180 0 0 1 200 300 A 180 180 0 0 1 20 480"
            className="court-line court-9m"
            strokeDasharray="10, 10"
          />
          <line x1="160" y1="290" x2="160" y2="310" className="court-line court-7m" />

          {/* Área 6m y 9m derecha */}
          <path d="M 980 180 A 120 120 0 0 0 860 300 A 120 120 0 0 0 980 420" className="court-line court-6m" />
          <path
            d="M 980 120 A 180 180 0 0 0 800 300 A 180 180 0 0 0 980 480"
            className="court-line court-9m"
            strokeDasharray="10, 10"
          />
          <line x1="840" y1="290" x2="840" y2="310" className="court-line court-7m" />
        </svg>
      </div>

      {/* Header compacto */}
      <header className="not-found-header">
        <div className="not-found-brand" onClick={() => navigate(user ? "/matches" : "/")}>
          <img src={isotipo} alt="HandStats" className="not-found-logo" />
          <span className="not-found-brand-text">HANDSTATS</span>
          <span className="not-found-pill-badge">
            <span className="pulse-dot" />
            {t("not_found.badge_var", "VAR · JUGADA REVISADA")}
          </span>
        </div>

        <div className="not-found-header-actions">
          <LanguageSelector />
          {toggleTheme && (
            <button
              type="button"
              className="not-found-theme-btn"
              onClick={toggleTheme}
              title={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
            </button>
          )}
        </div>
      </header>

      {/* CENTRO: 404 GIGANTE CON DETALLES DE BALONMANO */}
      <main className="not-found-centerpiece">
        {/* Marcador táctico superior en píldora */}
        <div className="match-clock-badge">
          <span className="clock-icon">⏱</span>
          <span className="clock-time">59:59</span>
          <span className="clock-divider">·</span>
          <span className="clock-phase">{t("not_found.scoreboard_timeout", "2º T · TIEMPO MUERTO")}</span>
          <span className="clock-divider">·</span>
          <span className="clock-infraction">BALÓN FUERA DE BANDA</span>
        </div>

        {/* 404 GIGANTE EN EL MEDIO */}
        <div className="giant-404-hero">
          {/* Dígito 4 Izquierdo */}
          <span className="digit-four left-four">4</span>

          {/* El 0 central integrado con el balón de balonmano animado */}
          <div
            className={`center-ball-portal ${shotState}`}
            onClick={handleShoot}
            title="¡Haz clic en el balón de balonmano para chutar a portería!"
          >
            {/* Anillo de órbita y marcas de pista */}
            <div className="ball-orbit-ring" />

            {/* Balón de balonmano oficial con textura de paneles y resina */}
            <div className="handball-ball">
              <svg viewBox="0 0 100 100" className="ball-svg">
                <circle cx="50" cy="50" r="46" className="ball-base" />
                <path d="M 50 15 L 75 32 L 65 62 L 35 62 L 25 32 Z" className="ball-panel-center" />
                <path
                  d="M 50 15 L 50 4 M 75 32 L 92 28 M 65 62 L 82 78 M 35 62 L 18 78 M 25 32 L 8 28"
                  className="ball-seams"
                />
                <circle cx="50" cy="50" r="14" className="ball-core" />
                {/* Manchas de resina de agarre características del balonmano */}
                <circle cx="34" cy="38" r="4" className="ball-resin" />
                <circle cx="68" cy="48" r="5" className="ball-resin" />
                <circle cx="48" cy="72" r="3.5" className="ball-resin" />
              </svg>
              <div className="ball-shadow" />
            </div>

            {/* Red / Escuadra de portería holográfica cuando marcas gol */}
            {shotState === "goal" && (
              <div className="goal-hit-flash">
                <Trophy size={22} className="trophy-sparkle" />
                <span className="goal-flash-text">¡GOLAZO!</span>
              </div>
            )}
          </div>

          {/* Dígito 4 Derecho */}
          <span className="digit-four right-four">4</span>
        </div>

        {/* Título de infracción y explicación */}
        <div className="not-found-copy">
          <h1 className="not-found-title">
            ¡FALTA EN ATAQUE! <span className="title-accent">POSESIÓN PERDIDA</span>
          </h1>
          <p className="not-found-desc">
            El balón ha salido fuera del 40x20m reglamentario. La jugada solicitada en{" "}
            <code>{currentPath}</code> no figura en la pizarra táctica de HandStats.
          </p>
        </div>

        {/* ACCIONES PRINCIPALES DE NAVEGACIÓN */}
        <nav className="compact-actions-row">
          <button
            type="button"
            className="btn btn-primary btn-action-main"
            onClick={() => {
              if (user) {
                navigate("/matches");
              } else if (onGoHome) {
                onGoHome();
              } else {
                navigate("/");
              }
            }}
          >
            <Home size={18} />
            {user
              ? t("not_found.btn_back_matches", "Volver al banquillo (Mis Partidos)")
              : t("not_found.btn_go_home", "Ir al Inicio (HandStats)")}
          </button>

          {user && (
            <button
              type="button"
              className="btn btn-secondary btn-action-sub"
              onClick={() => navigate("/matches/new")}
            >
              <PlusCircle size={17} />
              {t("not_found.btn_create_match", "Crear Nuevo Partido")}
            </button>
          )}

          <button
            type="button"
            className="btn btn-outline btn-action-back"
            onClick={handleBack}
          >
            <ArrowLeft size={17} />
            {t("not_found.btn_previous_play", "Pista Anterior (Volver)")}
          </button>
        </nav>

        {/* Atajos tácticos directos */}
        {user && (
          <div className="quick-tactical-shortcuts">
            <span className="shortcuts-label">Atajos:</span>
            <Link to="/matches" className="shortcut-pill">
              <Trophy size={13} /> Mis Partidos
            </Link>
            <Link to="/teams" className="shortcut-pill">
              <Users size={13} /> Equipos
            </Link>
            <Link to="/settings" className="shortcut-pill">
              <SettingsIcon size={13} /> Configuración
            </Link>
          </div>
        )}
      </main>

      {/* Footer minimalista */}
      <footer className="not-found-footer">
        HANDSTATS SPORTS ANALYTICS · ERROR 404 // BALL OUT OF BOUNDS
      </footer>
    </div>
  );
}
