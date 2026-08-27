import React, { useState, useEffect } from "react";
import { KPICard } from "../common/KPICard";
import { GoalHeatmapGrid } from "../charts/TacticalHeatmapGrid";

export function GoalkeeperStatsView({ metrics, match, homeHeatmaps, awayHeatmaps, teamFilter = "home" }) {
  const [selectedGkNumber, setSelectedGkNumber] = useState("all");

  useEffect(() => {
    setSelectedGkNumber("all");
  }, [teamFilter]);

  if (!metrics) return null;

  const { overview, homeGoalkeeperStats, awayGoalkeeperStats } = metrics;
  const isHome = teamFilter === "home";
  const teamName = isHome ? overview.homeTeam : overview.awayTeam;
  const goalkeepers = isHome ? (homeGoalkeeperStats || []) : (awayGoalkeeperStats || []);

  const activeGk = selectedGkNumber !== "all"
    ? goalkeepers.find((gk) => String(gk.number) === String(selectedGkNumber))
    : null;

  const gkSaves = activeGk ? activeGk.goalkeeperSaves : (isHome ? overview.homeGKSaves : overview.awayGKSaves);
  const gkSavePct = activeGk ? activeGk.goalkeeperSavePct : (isHome ? overview.homeGKSavePct : overview.awayGKSavePct);
  const gkExpectedSaves = activeGk ? activeGk.expectedSaves : (isHome ? overview.homeGKExpectedSaves : overview.awayGKExpectedSaves);
  const goalsConceded = activeGk ? activeGk.goalsConceded : (isHome ? overview.awayGoals : overview.homeGoals);
  const diffSaves = Math.round((gkSaves - gkExpectedSaves) * 10) / 10;

  // Para porteros del equipo local, los tiros recibidos provienen del equipo visitante (isOpponent = true).
  // Para porteros del equipo visitante, los tiros recibidos provienen del equipo local (isOpponent = false).
  const opponentShotsFilter = isHome;

  return (
    <div className="hs-view-container" style={{ display: "flex", flexDirection: "column", gap: "var(--space-24)" }}>
      {/* SELECTOR DE PORTERO INDIVIDUAL */}
      <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "var(--space-8)", background: "var(--bg-surface)", padding: "var(--space-12) var(--space-16)", borderRadius: "var(--radius)", border: "1px solid var(--border-color)" }}>
        <span style={{ fontSize: "var(--text-xs)", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", marginRight: "var(--space-4)" }}>
          SELECCIONAR PORTERO:
        </span>
        <button
          type="button"
          className={`btn btn-sm ${selectedGkNumber === "all" ? "btn-primary" : "btn-ghost"}`}
          onClick={() => setSelectedGkNumber("all")}
        >
          Todos los Porteros ({teamName})
        </button>
        {goalkeepers.map((gk) => (
          <button
            key={gk.number}
            type="button"
            className={`btn btn-sm ${String(selectedGkNumber) === String(gk.number) ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setSelectedGkNumber(gk.number)}
          >
            #{gk.number} {gk.name} ({gk.goalkeeperSavePct}%)
          </button>
        ))}
      </div>

      {/* TARJETAS DE INDICADORES DE PORTERÍA */}
      <div className="hs-kpi-grid">
        <KPICard
          title={`PARADAS TOTALES — ${activeGk ? `#${activeGk.number} ${activeGk.name.toUpperCase()}` : teamName.toUpperCase()}`}
          value={gkSaves}
          subtitle={`% Paradas: ${gkSavePct}% (${activeGk ? `${gkSaves}/${activeGk.goalkeeperShotsFaced}` : "Global partido"})`}
        />
        <KPICard
          title="EXPECTED SAVES (xSaves)"
          value={gkExpectedSaves}
          subtitle="Paradas esperadas por dificultad de tiros"
        />
        <KPICard
          title="DIFERENCIA SAVES vs xSaves"
          value={diffSaves >= 0 ? `+${diffSaves}` : `${diffSaves}`}
          delta={diffSaves >= 0 ? "Rendimiento Sobresaliente" : "Por debajo de xSaves"}
          trend={diffSaves >= 0 ? "up" : "down"}
          subtitle="Aportación neta del portero"
        />
        <KPICard
          title="GOLES ENCAJADOS"
          value={goalsConceded}
          subtitle={`En el encuentro actual`}
        />
      </div>

      {/* TABLA DE RENDIMIENTO INDIVIDUAL DE PORTEROS */}
      <div className="hs-card">
        <h4 className="hs-card-title">RENDIMIENTO INDIVIDUAL DE PORTEROS — {teamName}</h4>
        <div className="hs-table-container">
          <table className="hs-data-table">
            <thead>
              <tr>
                <th>Dorsal & Nombre</th>
                <th>Tiros Recibidos</th>
                <th>Paradas</th>
                <th>% Efectividad</th>
                <th>Expected Saves (xSaves)</th>
                <th>Goles Encajados</th>
                <th>Rating</th>
              </tr>
            </thead>
            <tbody>
              {goalkeepers.length > 0 ? (
                goalkeepers.map((gk, idx) => {
                  const isSelected = String(selectedGkNumber) === String(gk.number);
                  return (
                    <tr
                      key={idx}
                      onClick={() => setSelectedGkNumber(gk.number)}
                      style={{
                        cursor: "pointer",
                        background: isSelected ? "rgba(16, 185, 129, 0.12)" : "transparent",
                        fontWeight: isSelected ? 800 : 400
                      }}
                    >
                      <td><strong>#{gk.number} - {gk.name} {isSelected ? "✓" : ""}</strong></td>
                      <td>{gk.goalkeeperShotsFaced}</td>
                      <td><strong>{gk.goalkeeperSaves}</strong></td>
                      <td>
                        <span className="hs-table-pct" style={{ color: gk.goalkeeperSavePct >= 33 ? "var(--color-primary)" : "var(--color-danger)" }}>
                          {gk.goalkeeperSavePct}%
                        </span>
                      </td>
                      <td>{gk.expectedSaves}</td>
                      <td>{gk.goalsConceded}</td>
                      <td><strong>{gk.rating}</strong></td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center", color: "var(--text-muted)" }}>
                    No hay estadísticas de portero registradas para este equipo.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* GRÁFICO EXCLUSIVO DE PORTERÍA DE LANZAMIENTOS RECIBIDOS Y PARADAS */}
      <div>
        <GoalHeatmapGrid
          events={match?.events || []}
          isOpponent={opponentShotsFilter}
          match={match}
          selectedGkNumber={selectedGkNumber}
          title={`MAPA DE CALOR DE LANZAMIENTOS RECIBIDOS Y RENDIMIENTO EN PORTERÍA — ${activeGk ? `#${activeGk.number} ${activeGk.name.toUpperCase()}` : teamName.toUpperCase()}`}
        />
      </div>
    </div>
  );
}
