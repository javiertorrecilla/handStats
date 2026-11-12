import React from "react";
import { useTranslation } from "react-i18next";
import { KPICard } from "../common/KPICard";
import { MetricBadge, getRatingBadge } from "../common/MetricBadge";
import { InsightAlert } from "../common/InsightAlert";
import { ConfigurableDashboardGrid } from "../common/ConfigurableDashboardGrid";
import { MomentumChart } from "../charts/MomentumChart";
import { EvolutionChart } from "../charts/EvolutionChart";
import { HorizontalBarChart } from "../charts/HorizontalBarChart";
import { calculateTeamCumulativeStats } from "../../engine/teamCumulativeEngine";
import {
  MATCH_WIDGET_CATALOG,
  createDefaultLayout
} from "../../../services/dashboardLayoutService";

export function StatsDashboardView({
  metrics,
  insights = [],
  teamFilter = "home",
  matchesList = [],
  dashboardConfig,
  onOpenCustomizer
}) {
  const { t } = useTranslation();

  if (!metrics) return null;

  const activeConfig = dashboardConfig || createDefaultLayout().matchDashboard;
  const {
    overview,
    momentumTimeline,
    scoreTimeline,
    homePlayerStats,
    awayPlayerStats
  } = metrics;

  const isAway = teamFilter === "away";
  const targetTeam = isAway ? overview.awayTeam : overview.homeTeam;

  // Acumulados globales del equipo para la comparativa histórica
  const cumulative = calculateTeamCumulativeStats(targetTeam, matchesList);
  const hasHistory = cumulative && cumulative.totalMatches > 0;

  // Promedios globales de referencia del equipo
  const globalOffEff = hasHistory ? cumulative.avgOffEfficiency : (isAway ? overview.awayOffEfficiency : overview.homeOffEfficiency);
  const globalDefEff = hasHistory ? cumulative.avgDefEfficiency : (isAway ? overview.awayDefEfficiency : overview.homeDefEfficiency);
  const globalPossCount = hasHistory ? parseFloat(cumulative.avgPossessionsPerMatch) : (isAway ? overview.awayPossCount : overview.homePossCount);
  const globalPossDuration = hasHistory ? parseFloat(cumulative.avgPossessionDuration) : (isAway ? overview.awayAvgPossDuration : overview.homeAvgPossDuration);
  const globalFreeThrows = hasHistory ? parseFloat(cumulative.avgFreeThrows) : (isAway ? overview.awayFreeThrows : overview.homeFreeThrows);
  const globalSavePct = hasHistory ? cumulative.savePct : (isAway ? overview.awayGKSavePct : overview.homeGKSavePct);
  const globalTurnovers = hasHistory ? parseFloat(cumulative.avgTurnovers) : (isAway ? overview.awayTurnovers : overview.homeTurnovers);

  // Valores del partido actual
  const offEff = isAway ? overview.awayOffEfficiency : overview.homeOffEfficiency;
  const xgVal = isAway ? overview.awayXG : overview.homeXG;
  const goalsVal = isAway ? overview.awayGoals : overview.homeGoals;
  const possCount = isAway ? overview.awayPossCount : overview.homePossCount;
  const avgPossDuration = isAway ? overview.awayAvgPossDuration : overview.homeAvgPossDuration;
  const freeThrows = isAway ? overview.awayFreeThrows : overview.homeFreeThrows;
  const defEff = isAway ? overview.awayDefEfficiency : overview.homeDefEfficiency;
  const gkSavePct = isAway ? overview.awayGKSavePct : overview.homeGKSavePct;
  const gkSaves = isAway ? overview.awayGKSaves : overview.homeGKSaves;
  const gkXSave = isAway ? overview.awayGKExpectedSaves : overview.homeGKExpectedSaves;
  const turnovers = isAway ? overview.awayTurnovers : overview.homeTurnovers;
  const steals = isAway ? overview.awaySteals : overview.homeSteals;
  const offRebounds = isAway ? overview.awayOffRebounds : overview.homeOffRebounds;
  const defRebounds = isAway ? overview.awayDefRebounds : overview.homeDefRebounds;
  const twoMinCount = isAway ? overview.away2Min : overview.home2Min;
  const yellowCards = isAway ? (overview.awayYellowCards || 0) : (overview.homeYellowCards || 0);
  const redCards = isAway ? (overview.awayRedCards || 0) : (overview.homeRedCards || 0);
  const blueCards = isAway ? (overview.awayBlueCards || 0) : (overview.homeBlueCards || 0);

  // Diferencias (por arriba o por abajo del global)
  const diffOff = offEff - globalOffEff;
  const diffDef = defEff - globalDefEff;
  const diffPoss = Math.round((possCount - globalPossCount) * 10) / 10;
  const diffPossDur = Math.round(avgPossDuration - globalPossDuration);
  const diffFree = Math.round((freeThrows - globalFreeThrows) * 10) / 10;
  const diffSave = gkSavePct - globalSavePct;
  const diffTurnovers = Math.round((turnovers - globalTurnovers) * 10) / 10;
  const diffXSaves = Math.round((gkSaves - gkXSave) * 10) / 10;

  const vsGlobal = t("dashboard.kpis.vs_global", "vs Global");
  const vsXG = t("dashboard.kpis.vs_xg", "vs xG");
  const vsXSaves = t("dashboard.kpis.vs_xsaves", "vs xSaves");

  const compItems = [
    { label: t("dashboard.charts.metric_goals"), homeValue: overview.homeGoals, awayValue: overview.awayGoals },
    { label: t("dashboard.charts.metric_xg"), homeValue: overview.homeXG, awayValue: overview.awayXG },
    { label: t("dashboard.charts.metric_off_eff"), homeValue: overview.homeOffEfficiency, awayValue: overview.awayOffEfficiency, homeFormatter: (v) => `${v}%`, awayFormatter: (v) => `${v}%` },
    { label: t("dashboard.charts.metric_def_eff"), homeValue: overview.homeDefEfficiency, awayValue: overview.awayDefEfficiency, homeFormatter: (v) => `${v}%`, awayFormatter: (v) => `${v}%` },
    { label: t("dashboard.charts.metric_possessions"), homeValue: overview.homePossCount, awayValue: overview.awayPossCount, homeFormatter: (v) => `${v} pos`, awayFormatter: (v) => `${v} pos` },
    { label: t("dashboard.charts.metric_poss_time"), homeValue: overview.homeAvgPossDuration, awayValue: overview.awayAvgPossDuration, homeFormatter: (v) => `${v}s`, awayFormatter: (v) => `${v}s` },
    { label: t("dashboard.charts.metric_saves_pct"), homeValue: overview.homeGKSavePct, awayValue: overview.awayGKSavePct, homeFormatter: (v) => `${v}%`, awayFormatter: (v) => `${v}%` },
    { label: t("dashboard.charts.metric_xsaves"), homeValue: overview.homeGKExpectedSaves, awayValue: overview.awayGKExpectedSaves },
    { label: t("dashboard.charts.metric_turnovers"), homeValue: overview.homeTurnovers, awayValue: overview.awayTurnovers },
    { label: t("dashboard.charts.metric_off_rebounds"), homeValue: overview.homeOffRebounds, awayValue: overview.awayOffRebounds },
    { label: t("dashboard.charts.metric_def_rebounds"), homeValue: overview.homeDefRebounds, awayValue: overview.awayDefRebounds },
    { label: t("dashboard.charts.metric_free_throws"), homeValue: overview.homeFreeThrows, awayValue: overview.awayFreeThrows },
    { label: t("dashboard.charts.metric_2min"), homeValue: overview.home2Min, awayValue: overview.away2Min }
  ];

  const targetPlayers = (isAway ? awayPlayerStats : homePlayerStats) || [];
  const topPlayers = [...targetPlayers]
    .sort((a, b) => (parseFloat(b.rating) || 0) - (parseFloat(a.rating) || 0))
    .slice(0, 5);

  const renderWidget = (config) => {
    switch (config.id) {
      case "kpi_off_eff":
        return (
          <KPICard
            title={t("dashboard.kpis.off_eff_title", { team: targetTeam, defaultValue: `EFICIENCIA OFENSIVA — ${targetTeam}` })}
            value={`${offEff}%`}
            delta={diffOff >= 0 ? `+${diffOff}% ${vsGlobal}` : `${diffOff}% ${vsGlobal}`}
            trend={diffOff >= 0 ? "up" : "down"}
            comparison={t("dashboard.kpis.off_eff_comp", { val: globalOffEff, defaultValue: `Promedio Global: ${globalOffEff}%` })}
            subtitle={t("dashboard.kpis.off_eff_sub", { goals: goalsVal, attacks: possCount, defaultValue: `${goalsVal} goles en ${possCount} ataques` })}
          />
        );

      case "kpi_xg":
        return (
          <KPICard
            title={t("dashboard.kpis.xg_title", { team: targetTeam, defaultValue: `EXPECTED GOALS (xG) — ${targetTeam}` })}
            value={xgVal}
            delta={goalsVal >= xgVal ? `+${Math.round((goalsVal - xgVal) * 10) / 10} ${vsXG}` : `${Math.round((goalsVal - xgVal) * 10) / 10} ${vsXG}`}
            trend={goalsVal >= xgVal ? "up" : "down"}
            comparison={t("dashboard.kpis.xg_comp", { val: goalsVal, defaultValue: `Goles Reales: ${goalsVal}` })}
            subtitle={t("dashboard.kpis.xg_sub", "Calidad de tiros generados")}
          />
        );

      case "kpi_possessions":
        return (
          <KPICard
            title={t("dashboard.kpis.poss_title", { team: targetTeam, defaultValue: `POSESIONES TOTALES — ${targetTeam}` })}
            value={`${possCount}`}
            unit={t("dashboard.kpis.poss_unit", " posesiones")}
            delta={diffPoss >= 0 ? `+${diffPoss} ${vsGlobal}` : `${diffPoss} ${vsGlobal}`}
            trend={diffPoss >= 0 ? "up" : "down"}
            comparison={t("dashboard.kpis.poss_comp", { val: globalPossCount, defaultValue: `Promedio Global: ${globalPossCount} pos/partido` })}
            subtitle={t("dashboard.kpis.poss_sub", "Ataques iniciados en el partido")}
          />
        );

      case "kpi_poss_time":
        return (
          <KPICard
            title={t("dashboard.kpis.poss_time_title", { team: targetTeam, defaultValue: `PROMEDIO TIEMPO POSESIÓN — ${targetTeam}` })}
            value={`${avgPossDuration}s`}
            delta={diffPossDur >= 0 ? `+${diffPossDur}s ${vsGlobal}` : `${diffPossDur}s ${vsGlobal}`}
            trend={diffPossDur >= 0 ? "up" : "down"}
            comparison={t("dashboard.kpis.poss_time_comp", { val: globalPossDuration, defaultValue: `Promedio Global: ${globalPossDuration}s / ataque` })}
            subtitle={t("dashboard.kpis.poss_time_sub", "Duración media por cada posesión")}
          />
        );

      case "kpi_free_throws":
        return (
          <KPICard
            title={t("dashboard.kpis.free_throws_title", { team: targetTeam, defaultValue: `GOLPES FRANCO — ${targetTeam}` })}
            value={`${freeThrows}`}
            delta={diffFree >= 0 ? `+${diffFree} ${vsGlobal}` : `${diffFree} ${vsGlobal}`}
            trend={diffFree >= 0 ? "up" : "down"}
            comparison={t("dashboard.kpis.free_throws_comp", { val: globalFreeThrows, defaultValue: `Promedio Global: ${globalFreeThrows} / partido` })}
            subtitle={t("dashboard.kpis.free_throws_sub", "Acciones de golpe franco")}
          />
        );

      case "kpi_def_eff":
        return (
          <KPICard
            title={t("dashboard.kpis.def_eff_title", { team: targetTeam, defaultValue: `EFICIENCIA DEFENSIVA — ${targetTeam}` })}
            value={`${defEff}%`}
            delta={diffDef >= 0 ? `+${diffDef}% ${vsGlobal}` : `${diffDef}% ${vsGlobal}`}
            trend={diffDef >= 0 ? "up" : "down"}
            comparison={t("dashboard.kpis.def_eff_comp", { val: globalDefEff, defaultValue: `Promedio Global: ${globalDefEff}%` })}
            subtitle={t("dashboard.kpis.def_eff_sub", "Ataques rivales frenados")}
          />
        );

      case "kpi_saves":
        return (
          <KPICard
            title={t("dashboard.kpis.saves_title", { team: targetTeam, defaultValue: `PARADAS PORTERÍA — ${targetTeam}` })}
            value={`${gkSavePct}%`}
            delta={diffSave >= 0 ? `+${diffSave}% ${vsGlobal}` : `${diffSave}% ${vsGlobal}`}
            trend={diffSave >= 0 ? "up" : "down"}
            comparison={t("dashboard.kpis.saves_comp", { val: globalSavePct, defaultValue: `Promedio Global: ${globalSavePct}%` })}
            subtitle={t("dashboard.kpis.saves_sub", { count: gkSaves, defaultValue: `${gkSaves} paradas en el encuentro` })}
          />
        );

      case "kpi_xsaves":
        return (
          <KPICard
            title={t("dashboard.kpis.xsaves_title", { team: targetTeam, defaultValue: `EXPECTED SAVES (xSaves) — ${targetTeam}` })}
            value={gkXSave}
            delta={diffXSaves >= 0 ? `+${diffXSaves} ${vsXSaves}` : `${diffXSaves} ${vsXSaves}`}
            trend={diffXSaves >= 0 ? "up" : "down"}
            comparison={t("dashboard.kpis.xsaves_comp", { val: gkSaves, defaultValue: `Paradas Reales: ${gkSaves}` })}
            subtitle={t("dashboard.kpis.xsaves_sub", "Paradas esperadas por dificultad de tiros")}
          />
        );

      case "kpi_turnovers":
        return (
          <KPICard
            title={t("dashboard.kpis.turnovers_title", { team: targetTeam, defaultValue: `PÉRDIDAS — ${targetTeam}` })}
            value={`${turnovers}`}
            delta={diffTurnovers <= 0 ? `${diffTurnovers} ${vsGlobal}` : `+${diffTurnovers} ${vsGlobal}`}
            trend={diffTurnovers <= 0 ? "up" : "down"}
            comparison={t("dashboard.kpis.turnovers_comp", { val: globalTurnovers, defaultValue: `Promedio Global: ${globalTurnovers} / partido` })}
          />
        );

      case "kpi_off_rebounds":
        return (
          <KPICard
            title={t("customize.widgets.kpi_off_rebounds", "REBOTES OFENSIVOS")}
            value={`${offRebounds || 0}`}
            subtitle={t("customize.widgets.kpi_off_rebounds_desc", "Segundas oportunidades capturadas tras lanzamiento ofensivo.")}
          />
        );

      case "kpi_def_rebounds":
        return (
          <KPICard
            title={t("customize.widgets.kpi_def_rebounds", "REBOTES DEFENSIVOS")}
            value={`${defRebounds || 0}`}
            subtitle={t("customize.widgets.kpi_def_rebounds_desc", "Rebotes asegurados en defensa tras parada o lanzamiento rival.")}
          />
        );

      case "kpi_steals":
        return (
          <KPICard
            title={t("customize.widgets.kpi_steals", "RECUPERACIONES")}
            value={`${steals || 0}`}
            subtitle={t("customize.widgets.kpi_steals_desc", "Balones recuperados en fase defensiva.")}
          />
        );

      case "kpi_discipline":
        return (
          <KPICard
            title={t("customize.widgets.kpi_discipline", "EXCLUSIONES (2 MIN)")}
            value={`${twoMinCount || 0}`}
            trend={twoMinCount <= 3 ? "up" : "down"}
            subtitle={t("customize.widgets.kpi_discipline_desc", "Exclusiones de 2 minutos recibidas por el equipo.")}
          />
        );

      case "kpi_cards":
        return (
          <KPICard
            title={t("customize.widgets.kpi_cards", "SANCIONES (AMARILLAS, ROJAS Y AZULES)")}
            value={`${yellowCards + redCards + blueCards}`}
            comparison={`${yellowCards} Am · ${redCards} Rj · ${blueCards} Az`}
            subtitle={t("customize.widgets.kpi_cards_desc", "Tarjetas amarillas, rojas y azules mostradas al equipo.")}
          />
        );

      case "chart_momentum":
        return (
          <div className="hs-card">
            <h4 className="hs-card-title">{t("dashboard.charts.momentum_title", "MOMENTUM DEL PARTIDO")}</h4>
            <MomentumChart data={momentumTimeline} homeTeam={overview.homeTeam} awayTeam={overview.awayTeam} />
          </div>
        );

      case "chart_evolution":
        return (
          <div className="hs-card">
            <h4 className="hs-card-title">{t("dashboard.charts.evolution_title", "EVOLUCIÓN DE MARCADOR")}</h4>
            <EvolutionChart data={scoreTimeline || momentumTimeline} homeTeam={overview.homeTeam} awayTeam={overview.awayTeam} />
          </div>
        );

      case "chart_h2h":
        return (
          <div className="hs-card">
            <h4 className="hs-card-title">{t("dashboard.charts.h2h_title", "COMPARATIVA CARA A CARA (POSESIONES, TIEMPO Y EFICIENCIA)")}</h4>
            <HorizontalBarChart items={compItems} homeTeam={overview.homeTeam} awayTeam={overview.awayTeam} />
          </div>
        );

      case "block_insights":
        return (
          <div className="hs-card">
            <h4 className="hs-card-title">{t("customize.widgets.block_insights", "ALERTAS E INSIGHTS TÁCTICOS")}</h4>
            {Array.isArray(insights) && insights.length > 0 ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "var(--space-10)" }}>
                {insights.map((ins, i) => (
                  <InsightAlert key={ins.id || i} insight={ins} />
                ))}
              </div>
            ) : (
              <div className="hs-chart-placeholder">
                {t("customize.no_insights_yet", "No se han detectado alertas tácticas activas con los eventos actuales.")}
              </div>
            )}
          </div>
        );

      case "block_top_players":
        return (
          <div className="hs-card">
            <h4 className="hs-card-title">
              {t("customize.widgets.block_top_players", { team: targetTeam, defaultValue: `TOP JUGADORES POR RATING — ${targetTeam}` })}
            </h4>
            {topPlayers.length > 0 ? (
              <div className="hs-mini-players-list">
                {topPlayers.map((p, idx) => {
                  const badge = getRatingBadge(p.rating);
                  return (
                    <div key={`${p.number}_${idx}`} className="hs-mini-player-row">
                      <div className="hs-mini-player-left">
                        <span className="hs-mini-player-num">#{p.number}</span>
                        <span className="hs-mini-player-name">{p.name}</span>
                      </div>
                      <div className="hs-mini-player-stats">
                        {p.isGoalkeeper ? (
                          <span>{p.goalkeeperSaves || 0}/{p.goalkeeperShotsFaced || 0} par.</span>
                        ) : (
                          <span>{p.goals || 0}/{p.shotsCount || 0} g.</span>
                        )}
                        <MetricBadge value={p.rating} variant={badge.variant} className={badge.className} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="hs-chart-placeholder">
                {t("customize.no_players_yet", "Todavía no hay actuaciones individuales registradas.")}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <ConfigurableDashboardGrid
      widgets={activeConfig.widgets}
      catalog={MATCH_WIDGET_CATALOG}
      organization={activeConfig.organization}
      density={activeConfig.density}
      renderWidget={renderWidget}
      emptyState={(
        <div className="hs-card" style={{ textAlign: "center", padding: "var(--space-32)" }}>
          <p style={{ color: "var(--text-muted)", marginBottom: "var(--space-12)" }}>
            {t("customize.empty_dashboard_msg", "Has ocultado todas las estadísticas de este dashboard.")}
          </p>
          {onOpenCustomizer && (
            <button type="button" className="btn btn-primary btn-sm" onClick={onOpenCustomizer}>
              {t("customize.open_customizer_btn", "Personalizar Dashboard")}
            </button>
          )}
        </div>
      )}
    />
  );
}
