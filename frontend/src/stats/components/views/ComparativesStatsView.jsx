import React from "react";
import { HorizontalBarChart } from "../charts/HorizontalBarChart";

export function ComparativesStatsView({ metrics }) {
  if (!metrics) return null;

  const { overview } = metrics;

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
    <div className="hs-view-container">
      <div className="hs-card">
        <h4 className="hs-card-title">COMPARATIVA CARA A CARA (POSESIONES, TIEMPO Y EFICIENCIA)</h4>
        <HorizontalBarChart items={compItems} homeTeam={overview.homeTeam} awayTeam={overview.awayTeam} />
      </div>
    </div>
  );
}
