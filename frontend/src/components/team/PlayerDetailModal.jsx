import React, { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { MetricBadge } from "../../stats/components/common/MetricBadge";
import { HeatmapCourt } from "../../stats/components/charts/HeatmapCourt";
import {
  IconBarChart,
  IconUsers,
  IconClock,
  IconTarget,
  IconShield,
  IconFlame,
  IconCheck,
  IconXMark,
  IconTrendingUp,
  IconFilter
} from "../../stats/components/common/Icons";
import "./PlayerDetailModal.css";

const IconCalendar = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const IconChevronDown = ({ style = {} }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={style}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const IconChevronUp = ({ style = {} }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={style}>
    <polyline points="18 15 12 9 6 15" />
  </svg>
);

const IconClose = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

function getRatingBadgeTier(rating) {
  const val = parseFloat(rating);
  if (isNaN(val) || val < 5.0) return { variant: "danger", className: "badge-rating-tier-danger" };
  if (val < 6.0) return { variant: "orange", className: "badge-rating-tier-orange" };
  if (val < 7.0) return { variant: "amber", className: "badge-rating-tier-amber" };
  if (val < 8.0) return { variant: "lime", className: "badge-rating-tier-lime" };
  if (val < 9.0) return { variant: "success", className: "badge-rating-tier-success" };
  return { variant: "mvp", className: "badge-rating-tier-mvp" };
}

function getShotEffBadgeTier(efficiency) {
  const val = Number(efficiency);
  if (isNaN(val) || val < 50.5) return { variant: "danger", className: "badge-shot-tier-danger" };
  if (val <= 57.5) return { variant: "warning", className: "badge-shot-tier-orange" };
  if (val <= 64.5) return { variant: "warning", className: "badge-shot-tier-amber" };
  if (val <= 75.5) return { variant: "accent", className: "badge-shot-tier-light-green" };
  return { variant: "success", className: "badge-shot-tier-success" };
}

function getGkSavePctBadgeTier(savePct) {
  const val = Number(savePct);
  if (isNaN(val) || val < 25) return { variant: "danger", className: "badge-save-tier-danger" };
  if (val < 35) return { variant: "warning", className: "badge-save-tier-warning" };
  if (val < 40) return { variant: "accent", className: "badge-save-tier-accent" };
  return { variant: "success", className: "badge-save-tier-success" };
}

export default function PlayerDetailModal({ player, team, onClose }) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("general"); // "general" | "matches" | "court"
  const [expandedMatches, setExpandedMatches] = useState({});
  const [matchFilter, setMatchFilter] = useState("all"); // "all" | "W" | "D" | "L"
  const [matchSort, setMatchSort] = useState("recent"); // "recent" | "rating" | "goals" | "saves"

  // Cerrar modal al pulsar Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!player) return null;

  const isGk = player.is_goalkeeper === true || player.is_goalkeeper === "true";
  const matches = player.matches || [];

  const toggleExpandMatch = (matchId) => {
    setExpandedMatches((prev) => ({
      ...prev,
      [matchId]: !prev[matchId]
    }));
  };

  // Filtrado y ordenación de partidos
  const filteredMatches = useMemo(() => {
    let list = matches;
    if (matchFilter !== "all") {
      list = list.filter((m) => m.result === matchFilter);
    }

    return [...list].sort((a, b) => {
      if (matchSort === "rating") {
        return (parseFloat(b.rating) || 0) - (parseFloat(a.rating) || 0);
      }
      if (matchSort === "goals") {
        return (Number(b.goals) || 0) - (Number(a.goals) || 0);
      }
      if (matchSort === "saves") {
        return (Number(b.saves) || 0) - (Number(a.saves) || 0);
      }
      // Por defecto: Más recientes primero
      const timeA = a.date ? new Date(a.date).getTime() : 0;
      const timeB = b.date ? new Date(b.date).getTime() : 0;
      return timeB - timeA;
    });
  }, [matches, matchFilter, matchSort]);

  // Balance general de partidos del jugador
  const matchBalance = useMemo(() => {
    const wins = matches.filter((m) => m.result === "W").length;
    const draws = matches.filter((m) => m.result === "D").length;
    const losses = matches.filter((m) => m.result === "L").length;
    const total = matches.length;
    const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;
    return { wins, draws, losses, total, winRate };
  }, [matches]);

  const ratingBadge = getRatingBadgeTier(player.avgRating);
  const shotEffBadge = getShotEffBadgeTier(player.efficiency);
  const gkSaveBadge = getGkSavePctBadgeTier(player.savePct);

  // Fases de lanzamiento
  const totalShots = player.shotsCount || 0;
  const phases = player.shotPhases || { posicional: 0, oleada1: 0, oleada2: 0, penalti: 0 };
  const phaseList = [
    { key: "posicional", label: t("report.phase_positional", "Ataque Posicional"), count: phases.posicional },
    { key: "oleada1", label: t("report.phase_fb_first", "Contraataque (1ª Oleada)"), count: phases.oleada1 },
    { key: "oleada2", label: t("report.phase_fb_second", "Contraataque (2ª Oleada)"), count: phases.oleada2 },
    { key: "penalti", label: t("report.zone_7m", "7 Metros / Penalti"), count: phases.penalti }
  ];

  // Zonas de tiro
  const zones = player.shotZones || { wing: 0, backcourt: 0, pivot: 0, sevenM: 0, fastbreak: 0, other: 0 };
  const zoneList = [
    { label: t("report.zone_wing", "Extremo"), count: zones.wing },
    { label: t("report.zone_backcourt", "Primera Línea (9m)"), count: zones.backcourt },
    { label: t("report.zone_pivot", "Pivote"), count: zones.pivot },
    { label: t("report.zone_7m", "7 Metros"), count: zones.sevenM },
    { label: t("report.zone_fastbreak", "Contraataque"), count: zones.fastbreak }
  ];

  return (
    <div className="hs-pdetail-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="hs-pdetail-card" onClick={(e) => e.stopPropagation()}>
        {/* CABECERA DE LA FICHA DEL JUGADOR */}
        <div className="hs-pdetail-header">
          <div className="hs-pdetail-header-left">
            <div className="hs-pdetail-dorsal-badge">#{player.number}</div>
            <div className="hs-pdetail-title-group">
              <h2 className="hs-pdetail-name">
                {player.name}
              </h2>
              <div className="hs-pdetail-meta-row">
                <span className={`hs-pdetail-role-pill ${isGk ? "role-gk" : "role-field"}`}>
                  {isGk ? <IconShield size={12} /> : <IconUsers size={12} />}
                  {isGk ? t("players_table.role_gk", "Portero") : t("players_table.role_player", "Jugador de Campo")}
                </span>
                <span className="hs-pdetail-team-tag">
                  {team?.logo_url && (
                    <img src={team.logo_url} alt={team.name} className="hs-pdetail-team-badge-mini" />
                  )}
                  <span>{team?.name || t("common.team", "Equipo")}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="hs-pdetail-header-right">
            <div className="hs-pdetail-quick-stats">
              <div className="hs-pdetail-quick-stat-item">
                <span className="hs-pdetail-quick-stat-label">PJ</span>
                <span className="hs-pdetail-quick-stat-val">{player.matchesPlayed}</span>
              </div>
              <div style={{ width: 1, height: 22, background: "var(--border-color, #1d3b2e)" }} />
              {isGk ? (
                <>
                  <div className="hs-pdetail-quick-stat-item">
                    <span className="hs-pdetail-quick-stat-label">% Paradas</span>
                    <span className="hs-pdetail-quick-stat-val" style={{ color: "#10B981" }}>{player.savePct}%</span>
                  </div>
                  <div style={{ width: 1, height: 22, background: "var(--border-color, #1d3b2e)" }} />
                  <div className="hs-pdetail-quick-stat-item">
                    <span className="hs-pdetail-quick-stat-label">Paradas</span>
                    <span className="hs-pdetail-quick-stat-val">{player.saves}/{player.shotsFaced}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="hs-pdetail-quick-stat-item">
                    <span className="hs-pdetail-quick-stat-label">% Eficacia</span>
                    <span className="hs-pdetail-quick-stat-val" style={{ color: "var(--brand-primary, #44D878)" }}>{player.efficiency}%</span>
                  </div>
                  <div style={{ width: 1, height: 22, background: "var(--border-color, #1d3b2e)" }} />
                  <div className="hs-pdetail-quick-stat-item">
                    <span className="hs-pdetail-quick-stat-label">Goles / Tiros</span>
                    <span className="hs-pdetail-quick-stat-val">{player.goals}/{player.shotsCount}</span>
                  </div>
                </>
              )}
              <div style={{ width: 1, height: 22, background: "var(--border-color, #1d3b2e)" }} />
              <div className="hs-pdetail-quick-stat-item">
                <span className="hs-pdetail-quick-stat-label">Rating</span>
                <MetricBadge value={player.avgRating} variant={ratingBadge.variant} className={ratingBadge.className} style={{ fontSize: "0.85rem", padding: "1px 8px" }} />
              </div>
            </div>

            <button
              type="button"
              className="hs-pdetail-close-btn"
              onClick={onClose}
              title={t("common.close", "Cerrar (Esc)")}
            >
              <IconClose />
            </button>
          </div>
        </div>

        {/* NAVEGACIÓN POR PESTAÑAS DENTRO DE LA FICHA */}
        <div className="hs-pdetail-nav-tabs">
          <button
            type="button"
            className={`hs-pdetail-tab-btn ${activeTab === "general" ? "active" : ""}`}
            onClick={() => setActiveTab("general")}
          >
            <IconBarChart size={15} />
            <span>{t("player_card.general_tab", "Resumen General")}</span>
          </button>

          <button
            type="button"
            className={`hs-pdetail-tab-btn ${activeTab === "matches" ? "active" : ""}`}
            onClick={() => setActiveTab("matches")}
          >
            <IconCalendar />
            <span>{t("player_card.matches_tab", "Partidos Jugados")}</span>
            <span className="hs-pdetail-tab-count">{matches.length}</span>
          </button>

          <button
            type="button"
            className={`hs-pdetail-tab-btn ${activeTab === "court" ? "active" : ""}`}
            onClick={() => setActiveTab("court")}
          >
            <IconTarget size={15} />
            <span>{isGk ? t("player_card.court_tab_gk", "Mapa de Lanzamientos y Portería") : t("player_card.court_tab_field", "Mapa de Lanzamientos")}</span>
          </button>
        </div>

        {/* CONTENIDO PRINCIPAL SCROLLEABLE */}
        <div className="hs-pdetail-body">
          {/* =================================================================
              PESTAÑA 1: RESUMEN GENERAL DE LA TEMPORADA
              ================================================================= */}
          {activeTab === "general" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              {/* TARJETAS KPI PRINCIPALES */}
              <div className="hs-pdetail-kpi-grid">
                {isGk ? (
                  <>
                    {/* 1. PARTIDOS JUGADOS */}
                    <div className="hs-pdetail-kpi-card">
                      <span className="hs-pdetail-kpi-title">
                        <span>{t("teams.kpis.matches_played", "Partidos Jugados")}</span>
                        <IconUsers size={14} />
                      </span>
                      <span className="hs-pdetail-kpi-val">{player.matchesPlayed}</span>
                      <span className="hs-pdetail-kpi-sub">
                        Minutos: <strong>{player.totalMinutesFormatted || "0'"}</strong> • Media: <strong>{player.avgMinutesPlayedFormatted || "0'"}</strong>/partido
                      </span>
                    </div>

                    {/* 2. GOLES / TIROS CAMPO */}
                    <div className="hs-pdetail-kpi-card">
                      <span className="hs-pdetail-kpi-title">
                        <span>{t("player_card.goals_shots_field", "Goles / Tiros Campo")}</span>
                        <IconTarget size={14} />
                      </span>
                      <span className="hs-pdetail-kpi-val">
                        {player.goals} / {player.shotsCount}
                        <MetricBadge value={`${player.efficiency}%`} variant={shotEffBadge.variant} className={shotEffBadge.className} style={{ fontSize: "0.78rem", marginLeft: "auto" }} />
                      </span>
                      <span className="hs-pdetail-kpi-sub">
                        Media: <strong>{player.avgGoals || "0.0"}</strong> goles y <strong>{player.avgShots || "0.0"}</strong> tiros por partido
                      </span>
                    </div>

                    {/* 3. xG CAMPO */}
                    <div className="hs-pdetail-kpi-card">
                      <span className="hs-pdetail-kpi-title">
                        <span>{t("player_card.xg_field", "xG Campo")}</span>
                        <IconTrendingUp size={14} />
                      </span>
                      <span className="hs-pdetail-kpi-val">{player.xg || "0.00"}</span>
                      <span className="hs-pdetail-kpi-sub">
                        {(() => {
                          const diff = (player.goals - parseFloat(player.xg || 0)).toFixed(2);
                          const isPositive = Number(diff) >= 0;
                          return (
                            <span style={{ color: isPositive ? "#10B981" : "#EF4444" }}>
                              {isPositive ? `+${diff}` : diff} diferencial vs goles esperados
                            </span>
                          );
                        })()}
                      </span>
                    </div>

                    {/* 4. RATING */}
                    <div className="hs-pdetail-kpi-card">
                      <span className="hs-pdetail-kpi-title">
                        <span>{t("players_table.col_rating", "Rating Promedio")}</span>
                        <IconFlame size={14} />
                      </span>
                      <span className="hs-pdetail-kpi-val">
                        {player.avgRating}
                        <MetricBadge value={player.avgRating} variant={ratingBadge.variant} className={ratingBadge.className} style={{ fontSize: "0.78rem", marginLeft: "auto" }} />
                      </span>
                      <span className="hs-pdetail-kpi-sub">
                        Mejor partido: <strong>{player.bestRating || "—"}</strong> • Peor: <strong>{player.worstRating || "—"}</strong>
                      </span>
                    </div>

                    {/* 5. PARADAS */}
                    <div className="hs-pdetail-kpi-card" style={{ borderColor: "rgba(16, 185, 129, 0.4)" }}>
                      <span className="hs-pdetail-kpi-title" style={{ color: "#10B981" }}>
                        <span>{t("players_table.col_saves", "Paradas")}</span>
                        <IconShield size={14} />
                      </span>
                      <span className="hs-pdetail-kpi-val">
                        {player.saves} / {player.shotsFaced}
                        <MetricBadge value={`${player.savePct}%`} variant={gkSaveBadge.variant} className={gkSaveBadge.className} style={{ fontSize: "0.78rem", marginLeft: "auto" }} />
                      </span>
                      <span className="hs-pdetail-kpi-sub">
                        Media: <strong>{player.avgSaves || "0.0"}</strong> paradas por partido
                      </span>
                    </div>

                    {/* 6. XSAVES */}
                    <div className="hs-pdetail-kpi-card" style={{ borderColor: "rgba(16, 185, 129, 0.4)" }}>
                      <span className="hs-pdetail-kpi-title" style={{ color: "#10B981" }}>
                        <span>{t("players_table.col_xsaves", "xSaves")}</span>
                        <IconShield size={14} />
                      </span>
                      <span className="hs-pdetail-kpi-val">{player.goalkeeperXSaves || "0.0"}</span>
                      <span className="hs-pdetail-kpi-sub">
                        {(() => {
                          const diff = (player.saves - (player.goalkeeperXSaves || 0)).toFixed(1);
                          const isPositive = Number(diff) >= 0;
                          return (
                            <span style={{ color: isPositive ? "#10B981" : "#EF4444" }}>
                              {isPositive ? `+${diff}` : diff} paradas sobre la expectativa técnica
                            </span>
                          );
                        })()}
                      </span>
                    </div>

                    {/* 7. PÉRDIDAS */}
                    <div className="hs-pdetail-kpi-card">
                      <span className="hs-pdetail-kpi-title">
                        <span>{t("players_table.col_turnovers", "Pérdidas")}</span>
                        <IconXMark size={14} />
                      </span>
                      <span className="hs-pdetail-kpi-val">{player.turnovers}</span>
                      <span className="hs-pdetail-kpi-sub">
                        Media: <strong>{player.avgTurnovers || "0.0"}</strong> pérdidas por partido
                      </span>
                    </div>

                    {/* 8. DISCIPLINA Y SANCIONES */}
                    <div className="hs-pdetail-kpi-card">
                      <span className="hs-pdetail-kpi-title">
                        <span>{t("report.discipline_title", "Disciplina y Sanciones")}</span>
                        <IconClock size={14} />
                      </span>
                      <span className="hs-pdetail-kpi-val">
                        {player.twoMins || 0} <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 700 }}>exclusiones</span>
                      </span>
                      <span className="hs-pdetail-kpi-sub">
                        {player.yellowCards || 0} Amarillas • {player.redCards || 0} Rojas • {player.blueCards || 0} Azules
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="hs-pdetail-kpi-card">
                      <span className="hs-pdetail-kpi-title">
                        <span>{t("teams.kpis.matches_played", "Partidos Jugados")}</span>
                        <IconUsers size={14} />
                      </span>
                      <span className="hs-pdetail-kpi-val">{player.matchesPlayed}</span>
                      <span className="hs-pdetail-kpi-sub">
                        Minutos: <strong>{player.totalMinutesFormatted || "0'"}</strong> • Media: <strong>{player.avgMinutesPlayedFormatted || "0'"}</strong>/partido
                      </span>
                    </div>

                    <div className="hs-pdetail-kpi-card">
                      <span className="hs-pdetail-kpi-title">
                        <span>{t("players_table.col_goals", "Goles")} / {t("players_table.col_shots", "Tiros")}</span>
                        <IconTarget size={14} />
                      </span>
                      <span className="hs-pdetail-kpi-val">
                        {player.goals} / {player.shotsCount}
                        <MetricBadge value={`${player.efficiency}%`} variant={shotEffBadge.variant} className={shotEffBadge.className} style={{ fontSize: "0.78rem", marginLeft: "auto" }} />
                      </span>
                      <span className="hs-pdetail-kpi-sub">
                        Media: <strong>{player.avgGoals || "0.0"}</strong> goles y <strong>{player.avgShots || "0.0"}</strong> tiros por partido
                      </span>
                    </div>

                    <div className="hs-pdetail-kpi-card">
                      <span className="hs-pdetail-kpi-title">
                        <span>{t("players_table.col_xg", "xG Acumulado")}</span>
                        <IconTrendingUp size={14} />
                      </span>
                      <span className="hs-pdetail-kpi-val">{player.xg || "0.00"}</span>
                      <span className="hs-pdetail-kpi-sub">
                        {(() => {
                          const diff = (player.goals - parseFloat(player.xg || 0)).toFixed(2);
                          const isPositive = Number(diff) >= 0;
                          return (
                            <span style={{ color: isPositive ? "#10B981" : "#EF4444" }}>
                              {isPositive ? `+${diff}` : diff} diferencial vs goles esperados
                            </span>
                          );
                        })()}
                      </span>
                    </div>

                    <div className="hs-pdetail-kpi-card">
                      <span className="hs-pdetail-kpi-title">
                        <span>{t("players_table.col_rating", "Rating Promedio")}</span>
                        <IconFlame size={14} />
                      </span>
                      <span className="hs-pdetail-kpi-val">
                        {player.avgRating}
                        <MetricBadge value={player.avgRating} variant={ratingBadge.variant} className={ratingBadge.className} style={{ fontSize: "0.78rem", marginLeft: "auto" }} />
                      </span>
                      <span className="hs-pdetail-kpi-sub">
                        Mejor partido: <strong>{player.bestRating || "—"}</strong> • Peor: <strong>{player.worstRating || "—"}</strong>
                      </span>
                    </div>

                    <div className="hs-pdetail-kpi-card">
                      <span className="hs-pdetail-kpi-title">
                        <span>{t("players_table.col_turnovers", "Pérdidas de Balón")}</span>
                        <IconXMark size={14} />
                      </span>
                      <span className="hs-pdetail-kpi-val">{player.turnovers}</span>
                      <span className="hs-pdetail-kpi-sub">
                        Media: <strong>{player.avgTurnovers || "0.0"}</strong> pérdidas por partido
                      </span>
                    </div>

                    <div className="hs-pdetail-kpi-card">
                      <span className="hs-pdetail-kpi-title">
                        <span>7 Metros (Prov. / Com.)</span>
                        <IconTarget size={14} />
                      </span>
                      <span className="hs-pdetail-kpi-val">
                        <span style={{ color: player.drawn7mCount > 0 ? "var(--brand-primary, #44D878)" : "inherit" }}>
                          {player.drawn7mCount || 0}
                        </span>
                        <span style={{ color: "var(--text-muted)", fontSize: "1.1rem" }}>/</span>
                        <span style={{ color: player.penaltiesCommitted > 0 ? "#EF4444" : "inherit" }}>
                          {player.penaltiesCommitted || 0}
                        </span>
                      </span>
                      <span className="hs-pdetail-kpi-sub">
                        +{((player.drawn7mCount || 0) * 0.8).toFixed(1)} pts favor / -{((player.penaltiesCommitted || 0) * 0.9).toFixed(1)} contra
                      </span>
                    </div>

                    <div className="hs-pdetail-kpi-card">
                      <span className="hs-pdetail-kpi-title">
                        <span>Faltas Ataque (Prov. / Com.)</span>
                        <IconShield size={14} />
                      </span>
                      <span className="hs-pdetail-kpi-val">
                        <span style={{ color: player.offFoulsDrawn > 0 ? "var(--brand-primary, #44D878)" : "inherit" }}>
                          {player.offFoulsDrawn || 0}
                        </span>
                        <span style={{ color: "var(--text-muted)", fontSize: "1.1rem" }}>/</span>
                        <span style={{ color: player.offensiveFouls > 0 ? "#EF4444" : "inherit" }}>
                          {player.offensiveFouls || 0}
                        </span>
                      </span>
                      <span className="hs-pdetail-kpi-sub">
                        +{((player.offFoulsDrawn || 0) * 0.6).toFixed(1)} pts defensa / -{((player.offensiveFouls || 0) * 0.8).toFixed(1)} ataque
                      </span>
                    </div>

                    <div className="hs-pdetail-kpi-card">
                      <span className="hs-pdetail-kpi-title">
                        <span>{t("report.discipline_title", "Disciplina y Sanciones")}</span>
                        <IconClock size={14} />
                      </span>
                      <span className="hs-pdetail-kpi-val">
                        {player.twoMins || 0} <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 700 }}>exclusiones</span>
                      </span>
                      <span className="hs-pdetail-kpi-sub">
                        {player.yellowCards || 0} Amarillas • {player.redCards || 0} Rojas • {player.blueCards || 0} Azules
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* DESGLOSE DE FASES DE LANZAMIENTO Y ZONAS (SOLO JUGADORES DE CAMPO) */}
              {!isGk && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
                  {/* Fases de lanzamiento */}
                  <div className="hs-pdetail-phases-box">
                    <h4 className="hs-pdetail-section-title">
                      <IconTarget size={15} />
                      {t("report.phases_title", "Fases de Juego")} ({totalShots} {t("common.shots", "tiros")})
                    </h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {phaseList.map((ph) => {
                        const pct = totalShots > 0 ? Math.round((ph.count / totalShots) * 100) : 0;
                        return (
                          <div key={ph.key} className="hs-pdetail-phase-row">
                            <div className="hs-pdetail-phase-info">
                              <span>{ph.label}</span>
                              <span><strong>{ph.count}</strong> ({pct}%)</span>
                            </div>
                            <div className="hs-pdetail-phase-bar-track">
                              <div className="hs-pdetail-phase-bar-fill" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Zonas de lanzamiento */}
                  <div className="hs-pdetail-phases-box">
                    <h4 className="hs-pdetail-section-title">
                      <IconTarget size={15} />
                      {t("report.shot_zones_title", "Zonas de Lanzamiento")}
                    </h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {zoneList.map((z, idx) => {
                        const pct = totalShots > 0 ? Math.round((z.count / totalShots) * 100) : 0;
                        return (
                          <div key={idx} className="hs-pdetail-phase-row">
                            <div className="hs-pdetail-phase-info">
                              <span>{z.label}</span>
                              <span><strong>{z.count}</strong> ({pct}%)</span>
                            </div>
                            <div className="hs-pdetail-phase-bar-track">
                              <div className="hs-pdetail-phase-bar-fill" style={{ width: `${pct}%`, background: "#60A5FA" }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* =================================================================
              PESTAÑA 2: DETALLE EXTENSO DE CADA PARTIDO JUGADO
              ================================================================= */}
          {activeTab === "matches" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              {/* BARRA SUPERIOR DE FILTROS Y ORDEN */}
              <div className="hs-pdetail-matches-controls">
                <div className="hs-pdetail-filters-group">
                  <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", marginRight: 4 }}>
                    {t("common.filter", "Filtrar")}:
                  </span>
                  <button
                    type="button"
                    className={`hs-pdetail-filter-pill ${matchFilter === "all" ? "active" : ""}`}
                    onClick={() => setMatchFilter("all")}
                  >
                    {t("common.all", "Todos")} ({matchBalance.total})
                  </button>
                  <button
                    type="button"
                    className={`hs-pdetail-filter-pill ${matchFilter === "W" ? "active" : ""}`}
                    onClick={() => setMatchFilter("W")}
                    style={{ color: matchFilter === "W" ? "#10B981" : undefined }}
                  >
                    {t("common.wins", "Victorias")} ({matchBalance.wins})
                  </button>
                  <button
                    type="button"
                    className={`hs-pdetail-filter-pill ${matchFilter === "D" ? "active" : ""}`}
                    onClick={() => setMatchFilter("D")}
                    style={{ color: matchFilter === "D" ? "#F59E0B" : undefined }}
                  >
                    {t("common.draws", "Empates")} ({matchBalance.draws})
                  </button>
                  <button
                    type="button"
                    className={`hs-pdetail-filter-pill ${matchFilter === "L" ? "active" : ""}`}
                    onClick={() => setMatchFilter("L")}
                    style={{ color: matchFilter === "L" ? "#EF4444" : undefined }}
                  >
                    {t("common.losses", "Derrotas")} ({matchBalance.losses})
                  </button>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase" }}>
                    {t("common.sort", "Ordenar")}:
                  </span>
                  <select
                    className="hs-pdetail-sort-select"
                    value={matchSort}
                    onChange={(e) => setMatchSort(e.target.value)}
                  >
                    <option value="recent">Fecha (Más recientes primero)</option>
                    <option value="rating">Mejor Rating</option>
                    <option value="goals">Más Goles</option>
                    {isGk && <option value="saves">Más Paradas</option>}
                  </select>
                </div>
              </div>

              {/* LISTA DE PARTIDOS JUGADOS */}
              {filteredMatches.length === 0 ? (
                <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-muted)" }}>
                  <p style={{ margin: 0, fontSize: "0.9rem" }}>
                    {t("teams.no_matches_found", "No se encontraron partidos registrados con los filtros seleccionados.")}
                  </p>
                </div>
              ) : (
                <div className="hs-pdetail-matches-list">
                  {filteredMatches.map((m, idx) => {
                    const isExpanded = Boolean(expandedMatches[m.matchId || idx]);
                    const mRatingBadge = getRatingBadgeTier(m.rating);
                    const mShotBadge = getShotEffBadgeTier(m.efficiency);
                    const mGkBadge = getGkSavePctBadgeTier(m.savePct);

                    return (
                      <div key={m.matchId || idx} className={`hs-pdetail-match-card outcome-${m.result}`}>
                        {/* FILA DE RESUMEN DEL PARTIDO (CLICK PARA EXPANDIR) */}
                        <div
                          className="hs-pdetail-match-summary-row"
                          onClick={() => toggleExpandMatch(m.matchId || idx)}
                        >
                          <div className="hs-pdetail-match-left">
                            <div className={`hs-pdetail-outcome-badge outcome-${m.result}`}>
                              {m.result}
                            </div>
                            <div className="hs-pdetail-match-teams-info">
                              <span className="hs-pdetail-match-opp-title">
                                {m.isHome ? "vs" : "@"} {m.opponent || t("common.opponent", "Rival")}
                                <span className="hs-pdetail-match-venue-pill">
                                  {m.isHome ? t("common.home", "Local") : t("common.away", "Visitante")}
                                </span>
                              </span>
                              <span className="hs-pdetail-match-date">
                                {m.date ? new Date(m.date).toLocaleDateString() : t("common.no_date", "Sin fecha")}
                              </span>
                            </div>
                            <span className="hs-pdetail-match-score">
                              {m.score || `${m.teamGoals} - ${m.oppGoals}`}
                            </span>
                          </div>

                          <div className="hs-pdetail-match-center-stats">
                            <div className="hs-pdetail-match-stat-chip">
                              <span className="hs-pdetail-chip-label">{t("players_table.col_minutes", "Minutos")}</span>
                              <span className="hs-pdetail-chip-val">{m.minutesPlayedFormatted || "0'"}</span>
                            </div>

                            {isGk ? (
                              <>
                                <div className="hs-pdetail-match-stat-chip">
                                  <span className="hs-pdetail-chip-label">{t("players_table.col_saves", "Paradas")}</span>
                                  <span className="hs-pdetail-chip-val">{m.saves}/{m.shotsFaced}</span>
                                </div>
                                <div className="hs-pdetail-match-stat-chip">
                                  <span className="hs-pdetail-chip-label">% Paradas</span>
                                  <MetricBadge value={`${m.savePct}%`} variant={mGkBadge.variant} className={mGkBadge.className} style={{ fontSize: "0.72rem", padding: "1px 6px" }} />
                                </div>
                                <div className="hs-pdetail-match-stat-chip">
                                  <span className="hs-pdetail-chip-label">xSaves</span>
                                  <span className="hs-pdetail-chip-val">{m.goalkeeperXSaves}</span>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="hs-pdetail-match-stat-chip">
                                  <span className="hs-pdetail-chip-label">{t("players_table.col_goals", "Goles")}</span>
                                  <span className="hs-pdetail-chip-val">{m.goals}/{m.shotsCount}</span>
                                </div>
                                <div className="hs-pdetail-match-stat-chip">
                                  <span className="hs-pdetail-chip-label">% Eficacia</span>
                                  {m.shotsCount > 0 ? (
                                    <MetricBadge value={`${m.efficiency}%`} variant={mShotBadge.variant} className={mShotBadge.className} style={{ fontSize: "0.72rem", padding: "1px 6px" }} />
                                  ) : (
                                    <span style={{ color: "var(--text-muted)" }}>—</span>
                                  )}
                                </div>
                                <div className="hs-pdetail-match-stat-chip">
                                  <span className="hs-pdetail-chip-label">xG</span>
                                  <span className="hs-pdetail-chip-val">{m.xg}</span>
                                </div>
                              </>
                            )}

                            <div className="hs-pdetail-match-stat-chip">
                              <span className="hs-pdetail-chip-label">{t("players_table.col_turnovers", "Pérdidas")}</span>
                              <span className="hs-pdetail-chip-val">{m.turnovers}</span>
                            </div>
                          </div>

                          <div className="hs-pdetail-match-right">
                            <div className="hs-pdetail-match-stat-chip">
                              <span className="hs-pdetail-chip-label">Rating</span>
                              <MetricBadge value={m.rating} variant={mRatingBadge.variant} className={mRatingBadge.className} style={{ fontSize: "0.82rem", padding: "2px 8px" }} />
                            </div>

                            <button
                              type="button"
                              className="hs-pdetail-expand-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleExpandMatch(m.matchId || idx);
                              }}
                            >
                              <span>{isExpanded ? t("common.hide", "Ocultar") : t("common.details", "Detalles")}</span>
                              {isExpanded ? <IconChevronUp /> : <IconChevronDown />}
                            </button>
                          </div>
                        </div>

                        {/* PANEL EXPANDIDO CON DETALLE EXTENSO DE ACCIONES Y LANZAMIENTOS */}
                        {isExpanded && (
                          <div className="hs-pdetail-match-expanded-panel">
                            {/* TILES DETALLADOS DEL PARTIDO */}
                            <div className="hs-pdetail-expanded-grid">
                              <div className="hs-pdetail-expanded-tile">
                                <span className="hs-pdetail-tile-title">7m Provocados</span>
                                <span className="hs-pdetail-tile-number" style={{ color: m.drawn7mCount > 0 ? "#10B981" : "inherit" }}>
                                  {m.drawn7mCount || 0}
                                </span>
                              </div>
                              <div className="hs-pdetail-expanded-tile">
                                <span className="hs-pdetail-tile-title">7m Cometidos</span>
                                <span className="hs-pdetail-tile-number" style={{ color: m.penaltiesCommitted > 0 ? "#EF4444" : "inherit" }}>
                                  {m.penaltiesCommitted || 0}
                                </span>
                              </div>
                              <div className="hs-pdetail-expanded-tile">
                                <span className="hs-pdetail-tile-title">Faltas Ataque Prov.</span>
                                <span className="hs-pdetail-tile-number" style={{ color: m.offFoulsDrawn > 0 ? "#10B981" : "inherit" }}>
                                  {m.offFoulsDrawn || 0}
                                </span>
                              </div>
                              <div className="hs-pdetail-expanded-tile">
                                <span className="hs-pdetail-tile-title">Faltas Ataque Com.</span>
                                <span className="hs-pdetail-tile-number" style={{ color: m.offensiveFouls > 0 ? "#EF4444" : "inherit" }}>
                                  {m.offensiveFouls || 0}
                                </span>
                              </div>
                              <div className="hs-pdetail-expanded-tile">
                                <span className="hs-pdetail-tile-title">Exclusiones 2 Min</span>
                                <span className="hs-pdetail-tile-number">
                                  {m.twoMins || 0}
                                </span>
                              </div>
                              <div className="hs-pdetail-expanded-tile">
                                <span className="hs-pdetail-tile-title">Tarjetas (A/R/Az)</span>
                                <span className="hs-pdetail-tile-number">
                                  {m.yellowCards || 0} / {m.redCards || 0} / {m.blueCards || 0}
                                </span>
                              </div>
                            </div>

                            {/* TABLA DE LANZAMIENTOS INDIVIDUALES DE ESTE PARTIDO */}
                            <div className="hs-pdetail-events-section">
                              <span className="hs-pdetail-events-title">
                                {isGk ? "Lanzamientos de Portería en este Partido" : "Lanzamientos Realizados en este Partido"}
                              </span>

                              {(() => {
                                const shotsList = isGk ? (m.gkShotsFaced || []) : (m.shots || []);
                                if (shotsList.length === 0) {
                                  return (
                                    <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--text-muted)" }}>
                                      {t("player_card.no_shots_in_match", "No se registraron tiros directos de este jugador en este encuentro.")}
                                    </p>
                                  );
                                }

                                return (
                                  <div style={{ overflowX: "auto" }}>
                                    <table className="hs-pdetail-events-table">
                                      <thead>
                                        <tr>
                                          <th>Minuto</th>
                                          <th>{isGk ? "Lanzador / Equipo" : "Tipo de Tiro"}</th>
                                          <th>Zona</th>
                                          <th>Resultado</th>
                                          <th style={{ textAlign: "right" }}>xG</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {shotsList.map((s, sIdx) => {
                                          const res = s.result || "Gol";
                                          let resClass = "res-gol";
                                          if (res === "Parada") resClass = "res-parada";
                                          else if (res === "Fuera") resClass = "res-fuera";
                                          else if (res === "Poste") resClass = "res-poste";

                                          return (
                                            <tr key={sIdx}>
                                              <td><strong>{s.timeFormatted || `${Math.floor((s.match_time_seconds || 0) / 60)}'`}</strong></td>
                                              <td>{isGk ? (s.player_name || (s.player_number ? `#${s.player_number}` : "Rival")) : (s.shot_type || "Posicional")}</td>
                                              <td>{s.shot_zone || s.zone || "6m / Campo"}</td>
                                              <td>
                                                <span className={`hs-pdetail-result-badge ${resClass}`}>
                                                  {res}
                                                </span>
                                              </td>
                                              <td style={{ textAlign: "right", fontFamily: "var(--font-data, monospace)", fontWeight: 700 }}>
                                                {s.xg !== undefined ? Number(s.xg).toFixed(2) : "—"}
                                              </td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                  </div>
                                );
                              })()}
                            </div>

                            {/* PÉRDIDAS Y SANCIONES EN ESTE PARTIDO */}
                            {((m.turnoversList && m.turnoversList.length > 0) || (m.sanctionsList && m.sanctionsList.length > 0)) && (
                              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "12px" }}>
                                {m.turnoversList && m.turnoversList.length > 0 && (
                                  <div className="hs-pdetail-events-section">
                                    <span className="hs-pdetail-events-title">Pérdidas de Balón ({m.turnoversList.length})</span>
                                    <ul style={{ margin: 0, paddingLeft: 16, fontSize: "0.75rem", color: "var(--text-secondary, #cbd5e1)" }}>
                                      {m.turnoversList.map((to, toIdx) => (
                                        <li key={toIdx} style={{ marginBottom: 3 }}>
                                          <strong>{to.timeFormatted || "—"}</strong>: {to.end_reason || to.reason || "Pérdida de posesión"}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {m.sanctionsList && m.sanctionsList.length > 0 && (
                                  <div className="hs-pdetail-events-section">
                                    <span className="hs-pdetail-events-title">Sanciones Disciplinarias ({m.sanctionsList.length})</span>
                                    <ul style={{ margin: 0, paddingLeft: 16, fontSize: "0.75rem", color: "var(--text-secondary, #cbd5e1)" }}>
                                      {m.sanctionsList.map((sn, snIdx) => (
                                        <li key={snIdx} style={{ marginBottom: 3 }}>
                                          <strong>{sn.timeFormatted || "—"}</strong>: {sn.sanction_type || sn.action_key || "Sanción"}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* =================================================================
              PESTAÑA 3: MAPA DE LANZAMIENTOS Y PORTERÍA DEL JUGADOR
              ================================================================= */}
          {activeTab === "court" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  {isGk
                    ? `Visualización espacial de los ${player.shotsFaced || 0} lanzamientos recibidos por el portero en la temporada (origen en pista e impacto en portería).`
                    : `Visualización espacial de los ${player.shotsCount || 0} lanzamientos realizados por el jugador en la temporada (origen en pista e impacto en portería).`
                  }
                </span>
              </div>

              <HeatmapCourt
                events={isGk ? (player.allGkShotsFaced || []) : (player.allShots || [])}
                gkEvents={isGk ? (player.allGkShotsFaced || []) : null}
                isPreFiltered={true}
                isOpponent={null}
                selectedPlayerNumber="all"
                selectedGkNumber="all"
                title={`${isGk ? "PARADAS EN PORTERÍA Y TIROS RECIBIDOS" : "LANZAMIENTOS EN PISTA Y PORTERÍA"} — #${player.number} ${player.name.toUpperCase()}`}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

