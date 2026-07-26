import React from "react";
import { RadarChart } from "../charts/RadarChart";
import { HorizontalBarChart } from "../charts/HorizontalBarChart";

export function ComparativesStatsView({ metrics, teamFilter = "home" }) {
  if (!metrics) return null;

  const { overview } = metrics;

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
    { label: "Posesiones Totales (Nº Ataques)", homeValue: overview.homePossCount, awayValue: overview.awayPossCount, homeFormatter: (v) => `${v} pos`, awayFormatter: (v) => `${v} pos` },
    { label: "Promedio de Tiempo por Posesión", homeValue: overview.homeAvgPossDuration, awayValue: overview.awayAvgPossDuration, homeFormatter: (v) => `${v}s`, awayFormatter: (v) => `${v}s` },
    { label: "Paradas Portería (%)", homeValue: overview.homeGKSavePct, awayValue: overview.awayGKSavePct, homeFormatter: (v) => `${v}%`, awayFormatter: (v) => `${v}%` },
    { label: "Expected Saves (xSaves)", homeValue: overview.homeGKExpectedSaves, awayValue: overview.awayGKExpectedSaves },
    { label: "Pérdidas de Balón", homeValue: overview.homeTurnovers, awayValue: overview.awayTurnovers },
    { label: "Golpes Franco", homeValue: overview.homeFreeThrows, awayValue: overview.awayFreeThrows },
    { label: "Robos / Interceptaciones", homeValue: overview.homeSteals, awayValue: overview.awaySteals },
    { label: "Exclusiones (2 Min)", homeValue: overview.home2Min, awayValue: overview.away2Min }
  ];

  return (
    <div className="hs-view-container">
      <div className="hs-dual-chart-grid">
        <div className="hs-card">
          <h4 className="hs-card-title">PERFIL TÁCTICO RADAR DE AMBOS EQUIPOS</h4>
          <RadarChart homeValues={radarHome} awayValues={radarAway} homeTeam={overview.homeTeam} awayTeam={overview.awayTeam} />
        </div>

        <div className="hs-card">
          <h4 className="hs-card-title">COMPARATIVA CARA A CARA (POSESIONES, PROMEDIO DE TIEMPO Y EFICIENCIA)</h4>
          <HorizontalBarChart items={compItems} homeTeam={overview.homeTeam} awayTeam={overview.awayTeam} />
        </div>
      </div>
    </div>
  );
}
