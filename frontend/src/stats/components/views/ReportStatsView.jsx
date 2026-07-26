import React from "react";
import { KPICard } from "../common/KPICard";
import { IconPrinter } from "../common/Icons";

export function ReportStatsView({ metrics, match }) {
  if (!metrics) return null;

  const { overview, homePlayerStats } = metrics;
  const dateStr = match?.date ? new Date(match.date).toLocaleDateString("es-ES") : "Hoy";

  return (
    <div className="hs-view-container hs-report-printable" style={{ display: "flex", flexDirection: "column", gap: "var(--space-24)" }}>
      <div className="hs-report-header" style={{ padding: "var(--space-24)", background: "var(--bg-surface)", border: "1px solid var(--border-color)", borderRadius: "var(--radius)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ fontSize: "var(--text-lg)", fontWeight: 800, margin: 0, color: "var(--text-primary)" }}>
              INFORME TÁCTICO EJECUTIVO — {overview.homeTeam} vs {overview.awayTeam}
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: "var(--text-xs)", margin: "var(--space-4) 0 0 0" }}>
              Fecha: {dateStr} | Resultado: {overview.homeGoals} - {overview.awayGoals} | HandStats Analytics
            </p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => window.print()}>
            <IconPrinter size={14} /> Imprimir / Guardar PDF
          </button>
        </div>
      </div>

      <div className="hs-kpi-grid">
        <KPICard title="MARCADOR FINAL" value={`${overview.homeGoals} - ${overview.awayGoals}`} subtitle={`${overview.homeTeam} vs ${overview.awayTeam}`} />
        <KPICard title="EFICIENCIA OFENSIVA" value={`${overview.homeOffEfficiency}%`} subtitle={`xG: ${overview.homeXG}`} />
        <KPICard title="EFICIENCIA DEFENSIVA" value={`${overview.homeDefEfficiency}%`} subtitle={`xGA: ${overview.awayXG}`} />
        <KPICard title="PORTERÍA (%)" value={`${overview.homeGKSavePct}%`} subtitle={`Paradas: ${overview.homeGKSaves}`} />
      </div>

      <div className="hs-card">
        <h4 className="hs-card-title">RESUMEN DE RENDIMIENTO DE PLANTILLA</h4>
        <div className="hs-table-container">
          <table className="hs-data-table">
            <thead>
              <tr>
                <th>Dorsal & Nombre</th>
                <th>Tiros</th>
                <th>Goles</th>
                <th>% Eficacia</th>
                <th>xG</th>
                <th>Pérdidas</th>
                <th>Robos</th>
                <th>Rating</th>
              </tr>
            </thead>
            <tbody>
              {homePlayerStats.map((p, idx) => (
                <tr key={idx}>
                  <td><strong>#{p.number} - {p.name}</strong></td>
                  <td>{p.shotsCount}</td>
                  <td>{p.goals}</td>
                  <td>{p.efficiency}%</td>
                  <td>{p.xg}</td>
                  <td>{p.turnovers}</td>
                  <td>{p.steals}</td>
                  <td><strong>{p.rating}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
