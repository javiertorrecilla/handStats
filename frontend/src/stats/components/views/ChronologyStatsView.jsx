import React, { useState } from "react";

export function ChronologyStatsView({ match }) {
  const [filterType, setFilterType] = useState("all");
  const events = match?.events || [];

  const formatMinSec = (sec = 0) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const filteredEvents = events.filter((e) => {
    if (filterType === "goals") return e.event_type === "shot" && e.result === "Gol";
    if (filterType === "shots") return e.event_type === "shot";
    if (filterType === "turnovers") return e.event_type === "turnover";
    if (filterType === "sanctions") return e.event_type === "sanction";
    return true;
  });

  return (
    <div className="hs-view-container">
      <div className="hs-tab-subfilter mb-3">
        <button className={`btn btn-sm ${filterType === "all" ? "btn-primary" : "btn-ghost"}`} onClick={() => setFilterType("all")}>Todos ({events.length})</button>
        <button className={`btn btn-sm ${filterType === "goals" ? "btn-primary" : "btn-ghost"}`} onClick={() => setFilterType("goals")}>Goles</button>
        <button className={`btn btn-sm ${filterType === "shots" ? "btn-primary" : "btn-ghost"}`} onClick={() => setFilterType("shots")}>Lanzamientos</button>
        <button className={`btn btn-sm ${filterType === "turnovers" ? "btn-primary" : "btn-ghost"}`} onClick={() => setFilterType("turnovers")}>Pérdidas</button>
        <button className={`btn btn-sm ${filterType === "sanctions" ? "btn-primary" : "btn-ghost"}`} onClick={() => setFilterType("sanctions")}>Sanciones</button>
      </div>

      <div className="hs-card">
        <h4 className="hs-card-title">TIMELINE CRONOLÓGICO COMPLETO DEL PARTIDO</h4>
        <div className="hs-timeline-list">
          {filteredEvents.length > 0 ? (
            [...filteredEvents].reverse().map((ev, idx) => {
              const teamName = ev.is_opponent_action ? match.away_team : match.home_team;
              const isGoal = ev.result === "Gol";
              const isSave = ev.result === "Parada";

              return (
                <div key={idx} className={`hs-timeline-item ${ev.is_opponent_action ? "away-item" : "home-item"}`}>
                  <span className="hs-timeline-time">{formatMinSec(ev.match_time_seconds)}</span>
                  <span className="hs-timeline-team">{teamName}</span>
                  <span className="hs-timeline-player">{ev.player_id || "Equipo"}</span>
                  <span className="hs-timeline-desc">
                    {ev.event_type === "shot" ? (
                      <>
                        <strong>{ev.result?.toUpperCase()}</strong> ({ev.shot_type || "Tiro"})
                        {ev.goalkeeper_name && (
                          <span style={{ marginLeft: 6, color: "var(--text-muted)", fontSize: "0.9em" }}>
                            vs Portero #{ev.goalkeeper_number} {ev.goalkeeper_name}
                          </span>
                        )}
                      </>
                    ) : ev.event_type === "turnover" ? (
                      `Pérdida de balón (${ev.end_reason || "Acción"})`
                    ) : ev.event_type === "sanction" ? (
                      `Sanción disciplinaria: ${ev.sanction_type}`
                    ) : (
                      ev.event_type
                    )}
                  </span>
                </div>
              );
            })
          ) : (
            <div style={{ textAlign: "center", color: "var(--text-muted)", padding: 20 }}>No se encontraron eventos coincidentes con el filtro.</div>
          )}
        </div>
      </div>
    </div>
  );
}
