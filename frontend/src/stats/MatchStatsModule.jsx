import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useLocation } from "react-router-dom";
import { useMatchStats } from "./hooks/useMatchStats";
import { useDashboardLayout } from "./hooks/useDashboardLayout";
import { StatsDashboardView } from "./components/views/StatsDashboardView";
import { AttackStatsView } from "./components/views/AttackStatsView";
import { DefenseStatsView } from "./components/views/DefenseStatsView";
import { HeatmapsStatsView } from "./components/views/HeatmapsStatsView";
import { GoalkeeperStatsView } from "./components/views/GoalkeeperStatsView";
import { PlayersStatsView } from "./components/views/PlayersStatsView";
import { ChronologyStatsView } from "./components/views/ChronologyStatsView";
import { ReportStatsView } from "./components/views/ReportStatsView";
import {
  IconDashboard,
  IconTarget,
  IconShield,
  IconFlame,
  IconGlove,
  IconUsers,
  IconClock,
  IconFileText,
  IconSliders
} from "./components/common/Icons";
import "./MatchStatsModule.css";

export default function MatchStatsModule({ match, activePossession, timeSeconds, matchesList: matchesListProp }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { layout } = useDashboardLayout();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [teamFilter, setTeamFilter] = useState("home"); // "home" | "away"

  const handleOpenCustomizer = useCallback(() => {
    const returnPath = encodeURIComponent(`${location.pathname || ""}`);
    const targetSec = activeTab === "report" ? "dashboard" : activeTab || "dashboard";
    navigate(`/customize?section=${encodeURIComponent(targetSec)}&returnTo=${returnPath}`);
  }, [navigate, location.pathname, activeTab]);

  const { metrics, insights, homeHeatmaps, awayHeatmaps, isReady } = useMatchStats(
    match,
    activePossession,
    timeSeconds
  );

  // Cargar lista de partidos global (de props o localStorage) para acumulados de equipo
  const matchesList = useMemo(() => {
    let base = Array.isArray(matchesListProp) ? matchesListProp : [];
    if (base.length === 0) {
      try {
        const saved =
          localStorage.getItem("handtix_matches") ||
          localStorage.getItem("handstats_matches");
        if (saved) base = JSON.parse(saved);
      } catch {
        base = [];
      }
    }
    if (match && (!Array.isArray(base) || !base.some((m) => (m._id || m.id) === (match._id || match.id)))) {
      return Array.isArray(base) ? [...base, match] : [match];
    }
    return base;
  }, [matchesListProp, match]);

  const tabsById = useMemo(() => {
    if (!isReady || !match) return {};
    const sections = layout?.sections || {};
    return {
      dashboard: {
        id: "dashboard",
        label: t("dashboard.tab_dashboard"),
        icon: <IconDashboard size={15} />,
        view: (
          <StatsDashboardView
            metrics={metrics}
            insights={insights}
            teamFilter={teamFilter}
            matchesList={matchesList}
            dashboardConfig={sections.dashboard || layout?.matchDashboard}
            onOpenCustomizer={handleOpenCustomizer}
          />
        )
      },
      attack: {
        id: "attack",
        label: t("dashboard.tab_attack"),
        icon: <IconTarget size={15} />,
        view: <AttackStatsView metrics={metrics} match={match} homeHeatmaps={homeHeatmaps} awayHeatmaps={awayHeatmaps} teamFilter={teamFilter} sectionConfig={sections.attack} />
      },
      defense: {
        id: "defense",
        label: t("dashboard.tab_defense"),
        icon: <IconShield size={15} />,
        view: <DefenseStatsView metrics={metrics} teamFilter={teamFilter} sectionConfig={sections.defense} />
      },
      heatmaps: {
        id: "heatmaps",
        label: t("dashboard.tab_heatmaps"),
        icon: <IconFlame size={15} />,
        view: <HeatmapsStatsView match={match} metrics={metrics} teamFilter={teamFilter} sectionConfig={sections.heatmaps} />
      },
      goalkeeper: {
        id: "goalkeeper",
        label: t("dashboard.tab_goalkeeper"),
        icon: <IconGlove size={15} />,
        view: <GoalkeeperStatsView metrics={metrics} match={match} homeHeatmaps={homeHeatmaps} awayHeatmaps={awayHeatmaps} teamFilter={teamFilter} sectionConfig={sections.goalkeeper} />
      },
      players: {
        id: "players",
        label: t("dashboard.tab_players"),
        icon: <IconUsers size={15} />,
        view: <PlayersStatsView metrics={metrics} teamFilter={teamFilter} sectionConfig={sections.players} />
      },
      chronology: {
        id: "chronology",
        label: t("dashboard.tab_chronology"),
        icon: <IconClock size={15} />,
        view: <ChronologyStatsView match={match} teamFilter={teamFilter} sectionConfig={sections.chronology} />
      },
      report: {
        id: "report",
        label: t("dashboard.tab_report"),
        icon: <IconFileText size={15} />,
        view: <ReportStatsView metrics={metrics} match={match} />
      }
    };
  }, [isReady, match, metrics, insights, homeHeatmaps, awayHeatmaps, teamFilter, matchesList, layout, handleOpenCustomizer, t]);

  const tabs = useMemo(() => {
    const tabPrefs = layout?.matchTabs || layout?.matchDashboard?.tabs;
    if (Array.isArray(tabPrefs) && tabPrefs.length > 0) {
      const configured = tabPrefs
        .filter((tp) => tp.id !== "report" && tp.visible !== false && tabsById[tp.id])
        .map((tp) => tabsById[tp.id]);
      if (configured.length > 0) {
        return tabsById.report ? [...configured, tabsById.report] : configured;
      }
    }
    return Object.values(tabsById);
  }, [layout?.matchTabs, layout?.matchDashboard?.tabs, tabsById]);

  useEffect(() => {
    if (tabs.length > 0 && !tabs.some((tItem) => tItem.id === activeTab)) {
      setActiveTab(tabs[0].id);
    }
  }, [tabs, activeTab]);

  if (!isReady || !match) {
    return (
      <div className="hs-card" style={{ textAlign: "center", padding: "var(--space-48)" }}>
        <div className="spinner" style={{ margin: "0 auto var(--space-16) auto" }}></div>
        <h3>{t("common.loading")}</h3>
      </div>
    );
  }

  const currentTab = tabs.find((tItem) => tItem.id === activeTab) || tabs[0];

  return (
    <div className="hs-stats-module">
      {/* PANEL DESTACADO DE DOS BOTONES DE EQUIPO */}
      <div className="hs-team-switcher-header">
        <div className="hs-stats-toolbar-row">
          <div className="hs-team-switcher-label">
            <span>{t("dashboard.select_team_banner")}</span>
          </div>
          <button
            type="button"
            className="hs-customize-quick-btn"
            onClick={handleOpenCustomizer}
            title={t("customize.open_customizer_tooltip", "Elige qué estadísticas ver, su orden y tamaño")}
          >
            <IconSliders size={14} />
            <span>{t("customize.open_customizer_btn", "Personalizar Dashboard")}</span>
          </button>
        </div>

        <div className="hs-team-switcher-buttons">
          <button
            type="button"
            className={`hs-team-btn home-team ${teamFilter === "home" ? "selected" : ""}`}
            onClick={() => setTeamFilter("home")}
          >
            <span className="team-name">{match.home_team}</span>
            <span className="team-role-tag">{t("common.home").toUpperCase()}</span>
            <span className="team-goals-badge">{metrics.overview.homeGoals} {t("common.goals")}</span>
          </button>

          <div className="team-vs-divider">{t("common.vs")}</div>

          <button
            type="button"
            className={`hs-team-btn away-team ${teamFilter === "away" ? "selected" : ""}`}
            onClick={() => setTeamFilter("away")}
          >
            <span className="team-name">{match.away_team}</span>
            <span className="team-role-tag">{t("common.away").toUpperCase()}</span>
            <span className="team-goals-badge">{metrics.overview.awayGoals} {t("common.goals")}</span>
          </button>
        </div>
      </div>

      {/* NAVEGACIÓN DE TODAS LAS PESTAÑAS */}
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
