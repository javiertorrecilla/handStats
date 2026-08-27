import React from "react";
import { HeatmapCourt } from "../charts/HeatmapCourt";

export function HeatmapsStatsView({ match, teamFilter = "home" }) {
  const events = match?.events || [];
  const isOpponent = teamFilter === "away";
  const teamName = isOpponent ? match?.away_team || "Visitante" : match?.home_team || "Local";

  return (
    <div className="hs-view-container">
      <HeatmapCourt
        events={events}
        isOpponent={isOpponent}
        match={match}
        title={`MAPA DE CALOR CONTINUO Y EFICIENCIA DE TIRO Y PORTERÍA — ${teamName.toUpperCase()}`}
      />
    </div>
  );
}
