import React, { useState } from "react";
import { useMatchStats } from "./hooks/useMatchStats";
import { StatsDashboardView } from "./components/views/StatsDashboardView";
import { AttackStatsView } from "./components/views/AttackStatsView";
import { DefenseStatsView } from "./components/views/DefenseStatsView";
import { GoalkeeperStatsView } from "./components/views/GoalkeeperStatsView";
import { PlayersStatsView } from "./components/views/PlayersStatsView";
import { ChronologyStatsView } from "./components/views/ChronologyStatsView";
import { TrendsStatsView } from "./components/views/TrendsStatsView";
import { ReportStatsView } from "./components/views/ReportStatsView";
import {
  IconDashboard,
  IconTarget,
  IconShield,
  IconGlove,
  IconUsers,
  IconClock,
  IconTrendingUp,
  IconFileText
} from "./components/common/Icons";
import "./MatchStatsModule.css";

export default function MatchStatsModule({ match, activePossession, timeSeconds, matchesList: matchesListProp }) {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [teamFilter, setTeamFilter] = useState("home"); // "home" | "away"

  const { metrics, insights, homeHeatmaps, awayHeatmaps, isReady } = useMatchStats(
    match,
    activePossession,
    timeSeconds
  );

  // Cargar lista de partidos global (de props o localStorage) para acumulados de equipo
  let matchesList = matchesListProp || [];
  if (!Array.isArray(matchesList) || matchesList.length === 0) {
    try {
      const saved = localStorage.getItem("handstats_matches");
      if (saved) matchesList = JSON.parse(saved);
    } catch (e) {}
  }
  if (match && (!Array.isArray(matchesList) || !matchesList.some((m) => (m._id || m.id) === (match._id || match.id)))) {
    matchesList = Array.isArray(matchesList) ? [...matchesList, match] : [match];
  }

  if (!isReady || !match) {
    return (
      <div className="hs-card" style={{ textAlign: "center", padding: "var(--space-48)" }}>
        <div className="spinner" style={{ margin: "0 auto var(--space-16) auto" }}></div>
        <h3>Calculando analíticas del partido...</h3>
      </div>
    );
  }

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: <IconDashboard size={15} />, view: <StatsDashboardView metrics={metrics} insights={insights} teamFilter={teamFilter} matchesList={matchesList} /> },
    { id: "attack", label: "Ataque & xG", icon: <IconTarget size={15} />, view: <AttackStatsView metrics={metrics} match={match} homeHeatmaps={homeHeatmaps} awayHeatmaps={awayHeatmaps} teamFilter={teamFilter} /> },
    { id: "defense", label: "Defensa", icon: <IconShield size={15} />, view: <DefenseStatsView metrics={metrics} teamFilter={teamFilter} /> },
    { id: "goalkeeper", label: "Portería", icon: <IconGlove size={15} />, view: <GoalkeeperStatsView metrics={metrics} match={match} homeHeatmaps={homeHeatmaps} awayHeatmaps={awayHeatmaps} teamFilter={teamFilter} /> },
    { id: "players", label: "Jugadores", icon: <IconUsers size={15} />, view: <PlayersStatsView metrics={metrics} teamFilter={teamFilter} /> },
    { id: "chronology", label: "Cronología", icon: <IconClock size={15} />, view: <ChronologyStatsView match={match} teamFilter={teamFilter} /> },
    { id: "trends", label: "Tendencias", icon: <IconTrendingUp size={15} />, view: <TrendsStatsView metrics={metrics} insights={insights} match={match} teamFilter={teamFilter} /> },
    { id: "report", label: "Informe", icon: <IconFileText size={15} />, view: <ReportStatsView metrics={metrics} insights={insights} match={match} teamFilter={teamFilter} /> }
  ];

  const currentTab = tabs.find((t) => t.id === activeTab) || tabs[0];

  return (
    <div className="hs-stats-module">
      {/* PANEL DESTACADO DE DOS BOTONES DE EQUIPO */}
      <div className="hs-team-switcher-header">
        <div className="hs-team-switcher-label">
          <span> -- SELECCIONAR EQUIPO PARA VER ESTADÍSTICAS: --</span>
        </div>

        <div className="hs-team-switcher-buttons">
          <button
            type="button"
            className={`hs-team-btn home-team ${teamFilter === "home" ? "selected" : ""}`}
            onClick={() => setTeamFilter("home")}
          >
            <span className="team-name">{match.home_team}</span>
            <span className="team-role-tag">LOCAL</span>
            <span className="team-goals-badge">{metrics.overview.homeGoals} Goles</span>
          </button>

          <div className="team-vs-divider">VS</div>

          <button
            type="button"
            className={`hs-team-btn away-team ${teamFilter === "away" ? "selected" : ""}`}
            onClick={() => setTeamFilter("away")}
          >
            <span className="team-name">{match.away_team}</span>
            <span className="team-role-tag">VISITANTE</span>
            <span className="team-goals-badge">{metrics.overview.awayGoals} Goles</span>
          </button>
        </div>
      </div>

      {/* NAVEGACIÓN DE PESTAÑAS DEL CENTRO DE INTELIGENCIA */}
      <nav className="hs-stats-tabs" aria-label="Navegación de módulos estadísticos">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`hs-tab-btn ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* VISTA ACTIVA */}
      <div className="hs-stats-content">
        {currentTab.view}
      </div>
    </div>
  );
}
