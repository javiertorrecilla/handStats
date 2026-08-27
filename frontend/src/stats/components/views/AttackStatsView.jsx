import React from "react";
import { KPICard } from "../common/KPICard";
import { DonutChart } from "../charts/DonutChart";

export function AttackStatsView({ metrics, match, homeHeatmaps, awayHeatmaps, teamFilter = "home" }) {
  if (!metrics) return null;

  const { overview, attackBreakdownHome, attackBreakdownAway } = metrics;

  const isAway = teamFilter === "away";
  const targetTeam = isAway ? overview.awayTeam : overview.homeTeam;
  const attackBreakdown = isAway ? (attackBreakdownAway || {}) : (attackBreakdownHome || {});

  const goals = isAway ? overview.awayGoals : overview.homeGoals;
  const xg = isAway ? overview.awayXG : overview.homeXG;
  const turnovers = isAway ? overview.awayTurnovers : overview.homeTurnovers;

  const byType = attackBreakdown?.byType || {};

  const donutSegments = Object.keys(byType).map((key, idx) => {
    const colors = ["var(--color-primary)", "var(--color-info)", "var(--color-warning)", "var(--color-secondary)", "#8b5cf6"];
    return {
      label: key,
      value: byType[key].shots,
      color: colors[idx % colors.length]
    };
  });

  return (
    <div className="hs-view-container" style={{ display: "flex", flexDirection: "column", gap: "var(--space-24)" }}>
      {/* TARJETAS DE INDICADORES CLAVE EN ATAQUE */}
      <div className="hs-kpi-grid">
        <KPICard title={`LANZAMIENTOS TOTALES — ${targetTeam.toUpperCase()}`} value={attackBreakdown.totalShots || 0} subtitle={`Goles: ${goals}`} />
        <KPICard title="EFICIENCIA DE TIRO" value={`${attackBreakdown.totalShots > 0 ? Math.round((goals / attackBreakdown.totalShots) * 100) : 0}%`} subtitle="Efectividad en portería" />
        <KPICard title="EXPECTED GOALS (xG)" value={xg} subtitle="Goles esperados según tiros" />
        <KPICard title="PÉRDIDAS DE BALÓN" value={turnovers} subtitle="Balones cedidos" />
      </div>

      {/* GRÁFICOS Y TABLAS DE TIPO DE TIRO */}
      <div className="hs-dual-chart-grid">
        <div className="hs-card">
          <h4 className="hs-card-title">DISTRIBUCIÓN POR TIPO DE TIRO — {targetTeam}</h4>
          <DonutChart segments={donutSegments} centerLabel={`${goals}`} centerSub="GOLES" />
        </div>

        <div className="hs-card">
          <h4 className="hs-card-title">DESGLOSE DE EFICIENCIA POR TIPO DE TIRO</h4>
          <div className="hs-table-container">
            <table className="hs-data-table">
              <thead>
                <tr>
                  <th>Tipo de Tiro</th>
                  <th>Tiros</th>
                  <th>Goles</th>
                  <th>% Eficacia</th>
                  <th>xG</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(byType).length > 0 ? (
                  Object.keys(byType).map((type, i) => {
                    const item = byType[type];
                    const pct = item.shots > 0 ? Math.round((item.goals / item.shots) * 100) : 0;
                    return (
                      <tr key={i}>
                        <td><strong>{type}</strong></td>
                        <td>{item.shots}</td>
                        <td>{item.goals}</td>
                        <td>
                          <span className="hs-table-pct" style={{ color: pct >= 60 ? "var(--color-primary)" : "var(--text-primary)" }}>
                            {pct}%
                          </span>
                        </td>
                        <td>{Math.round(item.xg * 100) / 100}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="5" style={{ textAlign: "center", color: "var(--text-muted)" }}>
                      No hay suficientes lanzamientos registrados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
