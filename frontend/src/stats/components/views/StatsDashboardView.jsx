import React from "react";
import { KPICard } from "../common/KPICard";
import { MomentumChart } from "../charts/MomentumChart";
import { EvolutionChart } from "../charts/EvolutionChart";
import { HorizontalBarChart } from "../charts/HorizontalBarChart";
import { calculateTeamCumulativeStats } from "../../engine/teamCumulativeEngine";

export function StatsDashboardView({ metrics, teamFilter = "home", matchesList = [] }) {
  if (!metrics) return null;

  const { overview, momentumTimeline, scoreTimeline } = metrics;
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

  // Diferencias (por arriba o por abajo del global)
  const diffOff = offEff - globalOffEff;
  const diffDef = defEff - globalDefEff;
  const diffPoss = Math.round((possCount - globalPossCount) * 10) / 10;
  const diffPossDur = Math.round(avgPossDuration - globalPossDuration);
  const diffFree = Math.round((freeThrows - globalFreeThrows) * 10) / 10;
  const diffSave = gkSavePct - globalSavePct;
  const diffTurnovers = Math.round((turnovers - globalTurnovers) * 10) / 10;
  const diffXSaves = Math.round((gkSaves - gkXSave) * 10) / 10;

  // Datos para gráficos de comparativa directa entre ambos equipos
  const radarHome = [
    overview.homeOffEfficiency,
    overview.homeDefEfficiency,
    overview.homeGKSavePct,
    Math.min(100, Math.round(overview.homeXG * 4)),
    Math.min(100, Math.round(overview.pacePerMin * 30))
  ];

  const radarAway = [
    overview.awayOffEfficiency,
    overview.awayDefEfficiency,
    overview.awayGKSavePct,
    Math.min(100, Math.round(overview.awayXG * 4)),
    Math.min(100, Math.round(overview.pacePerMin * 30))
  ];

  const compItems = [
    { label: "Goles Anotados", homeValue: overview.homeGoals, awayValue: overview.awayGoals },
    { label: "Expected Goals (xG)", homeValue: overview.homeXG, awayValue: overview.awayXG },
    { label: "Eficiencia Ofensiva (%)", homeValue: overview.homeOffEfficiency, awayValue: overview.awayOffEfficiency, homeFormatter: (v) => `${v}%`, awayFormatter: (v) => `${v}%` },
    { label: "Eficiencia Defensiva (%)", homeValue: overview.homeDefEfficiency, awayValue: overview.awayDefEfficiency, homeFormatter: (v) => `${v}%`, awayFormatter: (v) => `${v}%` },
    { label: "Posesiones Totales (Nº Ataques)", homeValue: overview.homePossCount, awayValue: overview.awayPossCount, homeFormatter: (v) => `${v} pos`, awayFormatter: (v) => `${v} pos` },
    { label: "Promedio de Tiempo por Posesión", homeValue: overview.homeAvgPossDuration, awayValue: overview.awayAvgPossDuration, homeFormatter: (v) => `${v}s`, awayFormatter: (v) => `${v}s` },
    { label: "Paradas Portería (%)", homeValue: overview.homeGKSavePct, awayValue: overview.awayGKSavePct, homeFormatter: (v) => `${v}%`, awayFormatter: (v) => `${v}%` },
    { label: "Expected Saves (xSaves)", homeValue: overview.homeGKExpectedSaves, awayValue: overview.awayGKExpectedSaves },
    { label: "Pérdidas de Balón", homeValue: overview.homeTurnovers, awayValue: overview.awayTurnovers },
    { label: "Rebotes Ofensivos", homeValue: overview.homeOffRebounds, awayValue: overview.awayOffRebounds },
    { label: "Rebotes Defensivos", homeValue: overview.homeDefRebounds, awayValue: overview.awayDefRebounds },
    { label: "Golpes Franco", homeValue: overview.homeFreeThrows, awayValue: overview.awayFreeThrows },
    { label: "Exclusiones (2 Min)", homeValue: overview.home2Min, awayValue: overview.away2Min }
  ];

  return (
    <div className="hs-view-container" style={{ display: "flex", flexDirection: "column", gap: "var(--space-24)" }}>
      {/* GRID DE KPIS EXECUTIVE — COMPARATIVA CON EL GLOBAL DEL EQUIPO */}
      <div className="hs-kpi-grid">
        <KPICard
          title={`EFICIENCIA OFENSIVA — ${targetTeam}`}
          value={`${offEff}%`}
          delta={diffOff >= 0 ? `+${diffOff}% vs Global` : `${diffOff}% vs Global`}
          trend={diffOff >= 0 ? "up" : "down"}
          comparison={`Promedio Global: ${globalOffEff}%`}
          subtitle={`${goalsVal} goles en ${possCount} ataques`}
        />

        <KPICard
          title={`EXPECTED GOALS (xG) — ${targetTeam}`}
          value={xgVal}
          delta={goalsVal >= xgVal ? `+${Math.round((goalsVal - xgVal) * 10) / 10} vs xG` : `${Math.round((goalsVal - xgVal) * 10) / 10} vs xG`}
          trend={goalsVal >= xgVal ? "up" : "down"}
          comparison={`Goles Reales: ${goalsVal}`}
          subtitle="Calidad de tiros generados"
        />

        <KPICard
          title={`POSESIONES TOTALES — ${targetTeam}`}
          value={`${possCount}`}
          unit=" posesiones"
          delta={diffPoss >= 0 ? `+${diffPoss} vs Global` : `${diffPoss} vs Global`}
          trend={diffPoss >= 0 ? "up" : "down"}
          comparison={`Promedio Global: ${globalPossCount} pos/partido`}
          subtitle="Ataques iniciados en el partido"
        />

        <KPICard
          title={`PROMEDIO TIEMPO POSESIÓN — ${targetTeam}`}
          value={`${avgPossDuration}s`}
          delta={diffPossDur >= 0 ? `+${diffPossDur}s vs Global` : `${diffPossDur}s vs Global`}
          trend={diffPossDur >= 0 ? "up" : "down"}
          comparison={`Promedio Global: ${globalPossDuration}s / ataque`}
          subtitle="Duración media por cada posesión"
        />

        <KPICard
          title={`GOLPES FRANCO — ${targetTeam}`}
          value={`${freeThrows}`}
          delta={diffFree >= 0 ? `+${diffFree} vs Global` : `${diffFree} vs Global`}
          trend={diffFree >= 0 ? "up" : "down"}
          comparison={`Promedio Global: ${globalFreeThrows} / partido`}
          subtitle="Acciones de golpe franco"
        />

        <KPICard
          title={`EFICIENCIA DEFENSIVA — ${targetTeam}`}
          value={`${defEff}%`}
          delta={diffDef >= 0 ? `+${diffDef}% vs Global` : `${diffDef}% vs Global`}
          trend={diffDef >= 0 ? "up" : "down"}
          comparison={`Promedio Global: ${globalDefEff}%`}
          subtitle="Ataques rivales frenados"
        />

        <KPICard
          title={`PARADAS PORTERÍA — ${targetTeam}`}
          value={`${gkSavePct}%`}
          delta={diffSave >= 0 ? `+${diffSave}% vs Global` : `${diffSave}% vs Global`}
          trend={diffSave >= 0 ? "up" : "down"}
          comparison={`Promedio Global: ${globalSavePct}%`}
          subtitle={`${gkSaves} paradas en el encuentro`}
        />

        <KPICard
          title={`EXPECTED SAVES (xSaves) — ${targetTeam}`}
          value={gkXSave}
          delta={diffXSaves >= 0 ? `+${diffXSaves} vs xSaves` : `${diffXSaves} vs xSaves`}
          trend={diffXSaves >= 0 ? "up" : "down"}
          comparison={`Paradas Reales: ${gkSaves}`}
          subtitle="Paradas esperadas por dificultad de tiros"
        />

        <KPICard
          title={`PÉRDIDAS — ${targetTeam}`}
          value={`${turnovers}`}
          delta={diffTurnovers <= 0 ? `${diffTurnovers} vs Global` : `+${diffTurnovers} vs Global`}
          trend={diffTurnovers <= 0 ? "up" : "down"}
          comparison={`Promedio Global: ${globalTurnovers} / partido`}
        />
      </div>

      {/* CHARTS PRINCIPALES DE MOMENTUM Y EVOLUCIÓN */}
      <div className="hs-dual-chart-grid">
        <div className="hs-card">
          <h4 className="hs-card-title">MOMENTUM DEL PARTIDO</h4>
          <MomentumChart data={momentumTimeline} homeTeam={overview.homeTeam} awayTeam={overview.awayTeam} />
        </div>

        <div className="hs-card">
          <h4 className="hs-card-title">EVOLUCIÓN DE MARCADOR</h4>
          <EvolutionChart data={scoreTimeline || momentumTimeline} homeTeam={overview.homeTeam} awayTeam={overview.awayTeam} />
        </div>
      </div>

      {/* BLOQUE DE COMPARATIVA CARA A CARA */}
      <div className="hs-card">
        <h4 className="hs-card-title">COMPARATIVA CARA A CARA (POSESIONES, TIEMPO Y EFICIENCIA)</h4>
        <HorizontalBarChart items={compItems} homeTeam={overview.homeTeam} awayTeam={overview.awayTeam} />
      </div>
    </div>
  );
}
