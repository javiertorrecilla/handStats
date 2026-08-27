import React from "react";
import { KPICard } from "../common/KPICard";

export function DefenseStatsView({ metrics, teamFilter = "home" }) {
  if (!metrics) return null;

  const { overview } = metrics;
  const isAway = teamFilter === "away";

  const targetTeam = isAway ? overview.awayTeam : overview.homeTeam;
  const twoMin = isAway ? overview.away2Min : overview.home2Min;
  const freeThrows = isAway ? overview.awayFreeThrows : overview.homeFreeThrows;
  const oppTurnovers = isAway ? overview.homeTurnovers : overview.awayTurnovers;
  const defEff = isAway ? overview.awayDefEfficiency : overview.homeDefEfficiency;

  return (
    <div className="hs-view-container">
      <div className="hs-kpi-grid">
        <KPICard title="GOLPES FRANCO" value={freeThrows} subtitle="Acciones de golpe franco registradas" />
        <KPICard title="EXCLUSIONES (2 MIN)" value={twoMin} subtitle="Sanciones de 2 minutos recibidas" />
        <KPICard title="PÉRDIDAS PROVOCADAS" value={oppTurnovers} subtitle="Pérdidas provocadas al rival" />
        <KPICard title="EFICIENCIA DEFENSIVA" value={`${defEff}%`} subtitle="Ataques rivales frenados" />
      </div>
    </div>
  );
}
