import React from "react";
import { KPICard } from "../common/KPICard";

export function DefenseStatsView({ metrics, teamFilter = "home" }) {
  if (!metrics) return null;

  const { overview } = metrics;
  const isAway = teamFilter === "away";

  const targetTeam = isAway ? overview.awayTeam : overview.homeTeam;
  const steals = isAway ? overview.awaySteals : overview.homeSteals;
  const twoMin = isAway ? overview.away2Min : overview.home2Min;
  const freeThrows = isAway ? overview.awayFreeThrows : overview.homeFreeThrows;
  const oppTurnovers = isAway ? overview.homeTurnovers : overview.awayTurnovers;
  const defEff = isAway ? overview.awayDefEfficiency : overview.homeDefEfficiency;

  return (
    <div className="hs-view-container">
      <div className="hs-kpi-grid mb-3">
        <KPICard title={`ROBOS / INTERCEPTACIONES — ${targetTeam.toUpperCase()}`} value={steals} subtitle="Balones recuperados en mano" />
        <KPICard title="GOLPES FRANCO" value={freeThrows} subtitle="Acciones de golpe franco registradas" />
        <KPICard title="EXCLUSIONES (2 MIN)" value={twoMin} subtitle="Sanciones de 2 minutos recibidas" />
        <KPICard title="EFICIENCIA DEFENSIVA" value={`${defEff}%`} subtitle="Ataques rivales frenados" />
      </div>

      <div className="hs-card">
        <h4 className="hs-card-title">RESUMEN DE ACTIVIDAD DEFENSIVA Y SANCIONES — {targetTeam}</h4>
        <div className="hs-table-container">
          <table className="hs-data-table">
            <thead>
              <tr>
                <th>Métrica Defensiva</th>
                <th>{overview.homeTeam} (Local)</th>
                <th>{overview.awayTeam} (Visitante)</th>
                <th>Diferencia Net</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Robos de Balón</td>
                <td><strong>{overview.homeSteals}</strong></td>
                <td><strong>{overview.awaySteals}</strong></td>
                <td>{overview.homeSteals - overview.awaySteals > 0 ? `+${overview.homeSteals - overview.awaySteals}` : overview.homeSteals - overview.awaySteals}</td>
              </tr>
              <tr>
                <td>Golpes Franco Cometidos / Registrados</td>
                <td><strong>{overview.homeFreeThrows}</strong></td>
                <td><strong>{overview.awayFreeThrows}</strong></td>
                <td>{overview.homeFreeThrows - overview.awayFreeThrows > 0 ? `+${overview.homeFreeThrows - overview.awayFreeThrows}` : overview.homeFreeThrows - overview.awayFreeThrows}</td>
              </tr>
              <tr>
                <td>Pérdidas Provocadas al Rival</td>
                <td><strong>{overview.awayTurnovers}</strong></td>
                <td><strong>{overview.homeTurnovers}</strong></td>
                <td>{overview.awayTurnovers - overview.homeTurnovers > 0 ? `+${overview.awayTurnovers - overview.homeTurnovers}` : overview.awayTurnovers - overview.homeTurnovers}</td>
              </tr>
              <tr>
                <td>Exclusiones Sufriendo (2 Min)</td>
                <td><strong>{overview.home2Min}</strong></td>
                <td><strong>{overview.away2Min}</strong></td>
                <td>{overview.home2Min - overview.away2Min}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
