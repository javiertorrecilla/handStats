import React from "react";
import { TacticalHeatmapGrid } from "./TacticalHeatmapGrid";

/**
 * Visualización combinada de mapa de calor continuo de media pista y portería.
 */
export function HeatmapCourt({
  events = [],
  gkEvents = null,
  isOpponent = false,
  match = null,
  selectedGkNumber = "all",
  selectedPlayerNumber = "all",
  title = "MAPA DE DENSIDAD ESPACIAL Y EFECTIVIDAD EN PISTA Y PORTERÍA"
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-20)" }}>
      <TacticalHeatmapGrid
        events={events}
        gkEvents={gkEvents}
        isOpponent={isOpponent}
        match={match}
        selectedGkNumber={selectedGkNumber}
        selectedPlayerNumber={selectedPlayerNumber}
        title={title}
      />
    </div>
  );
}
