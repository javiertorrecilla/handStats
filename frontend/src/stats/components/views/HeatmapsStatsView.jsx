import React from "react";
import { HeatmapCourt } from "../charts/HeatmapCourt";
import { generateCourtHeatmap } from "../../engine/heatmapEngine";

export function HeatmapsStatsView({ match, homeHeatmaps, awayHeatmaps, teamFilter = "home" }) {
  const events = match?.events || [];
  const isOpponent = teamFilter === "away";
  const teamName = isOpponent ? match?.away_team || "Visitante" : match?.home_team || "Local";

  const points = generateCourtHeatmap(events, "shots", isOpponent);
  const goalGrid = isOpponent ? awayHeatmaps?.goalGrid || {} : homeHeatmaps?.goalGrid || {};

  return (
    <div className="hs-view-container">
      <HeatmapCourt
        events={events}
        isOpponent={isOpponent}
        courtPoints={points}
        goalGrid={goalGrid}
        title={`CUADRÍCULA TÁCTICA DE FRECUENCIA Y EFICIENCIA DE TIRO — ${teamName.toUpperCase()}`}
      />
    </div>
  );
}
