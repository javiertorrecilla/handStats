import React from "react";
import { TacticalHeatmapGrid } from "./TacticalHeatmapGrid";

/**
 * Visualización combinada de mapa de cancha (tiros de equipo) y marco 3x3 de portería con filtro por portero.
 */
export function HeatmapCourt({
  events = [],
  gkEvents = null,
  selectedGkNumber = "all",
  title = "MAPA DE DENSIDAD ESPACIAL Y EFICIENCIA"
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-20)" }}>
      <TacticalHeatmapGrid
        events={events}
        gkEvents={gkEvents}
        selectedGkNumber={selectedGkNumber}
        title={title}
      />
    </div>
  );
}
