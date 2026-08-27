import React, { useState } from "react";
import { getEventCategory, ACTION_CATEGORIES, formatCourtZoneName, formatGoalZoneName } from "../../engine/types";

export function ChronologyStatsView({ match }) {
  const [filterType, setFilterType] = useState(ACTION_CATEGORIES.TODOS);
  const events = match?.events || [];

  const formatMinSec = (sec = 0) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const categories = events.map(e => ({
    event: e,
    cat: getEventCategory(e)
  }));

  const countFor = (cat) => categories.filter(c => c.cat === cat).length;

  const goalsCount = countFor(ACTION_CATEGORIES.GOLES);
  const savesCount = countFor(ACTION_CATEGORIES.PARADAS);
  const missedCount = countFor(ACTION_CATEGORIES.FALLO_LANZAMIENTO);
  const turnoversCount = countFor(ACTION_CATEGORIES.PERDIDAS);
  const timeoutsCount = countFor(ACTION_CATEGORIES.TIEMPO_MUERTO);
  const freeThrowsCount = countFor(ACTION_CATEGORIES.GOLPE_FRANCO);
  const sanctionsCount = countFor(ACTION_CATEGORIES.SANCIONES);

  const filteredEvents = categories.filter(({ cat }) => {
    if (filterType === ACTION_CATEGORIES.TODOS) return true;
    return cat === filterType;
  });

  return (
    <div className="hs-view-container">
      <div className="hs-tab-subfilter mb-3" style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <button
          className={`btn btn-sm ${filterType === ACTION_CATEGORIES.TODOS ? "btn-primary" : "btn-ghost"}`}
          onClick={() => setFilterType(ACTION_CATEGORIES.TODOS)}
        >
          Todos ({events.length})
        </button>

        <button
          className={`btn btn-sm ${filterType === ACTION_CATEGORIES.GOLES ? "btn-primary" : "btn-ghost"}`}
          onClick={() => setFilterType(ACTION_CATEGORIES.GOLES)}
        >
          Goles ({goalsCount})
        </button>

        <button
          className={`btn btn-sm ${filterType === ACTION_CATEGORIES.PARADAS ? "btn-primary" : "btn-ghost"}`}
          onClick={() => setFilterType(ACTION_CATEGORIES.PARADAS)}
        >
          Paradas ({savesCount})
        </button>

        <button
          className={`btn btn-sm ${filterType === ACTION_CATEGORIES.FALLO_LANZAMIENTO ? "btn-primary" : "btn-ghost"}`}
          onClick={() => setFilterType(ACTION_CATEGORIES.FALLO_LANZAMIENTO)}
        >
          Fallo Lanzamiento ({missedCount})
        </button>

        <button
          className={`btn btn-sm ${filterType === ACTION_CATEGORIES.PERDIDAS ? "btn-primary" : "btn-ghost"}`}
          onClick={() => setFilterType(ACTION_CATEGORIES.PERDIDAS)}
        >
          Pérdidas ({turnoversCount})
        </button>

        <button
          className={`btn btn-sm ${filterType === ACTION_CATEGORIES.TIEMPO_MUERTO ? "btn-primary" : "btn-ghost"}`}
          onClick={() => setFilterType(ACTION_CATEGORIES.TIEMPO_MUERTO)}
        >
          Tiempo Muerto ({timeoutsCount})
        </button>

        <button
          className={`btn btn-sm ${filterType === ACTION_CATEGORIES.GOLPE_FRANCO ? "btn-primary" : "btn-ghost"}`}
          onClick={() => setFilterType(ACTION_CATEGORIES.GOLPE_FRANCO)}
        >
          Golpe Franco ({freeThrowsCount})
        </button>

        <button
          className={`btn btn-sm ${filterType === ACTION_CATEGORIES.SANCIONES ? "btn-primary" : "btn-ghost"}`}
          onClick={() => setFilterType(ACTION_CATEGORIES.SANCIONES)}
        >
          Sanciones ({sanctionsCount})
        </button>
      </div>

      <div className="hs-card">
        <h4 className="hs-card-title">TIMELINE CRONOLÓGICO COMPLETO DEL PARTIDO</h4>
        <div className="hs-timeline-list">
          {filteredEvents.length > 0 ? (
            [...filteredEvents].reverse().map(({ event: ev, cat }, idx) => {
              const teamName = ev.is_opponent_action ? match.away_team : match.home_team;
              const fromZoneRaw = ev.shot_zone || ev.court_zone || ev.shot_position || "";
              const toZoneRaw = ev.goal_zone || ev.target_zone || "";
              const formattedFrom = formatCourtZoneName(fromZoneRaw);
              const formattedTo = formatGoalZoneName(toZoneRaw);
              const trajectory = (formattedFrom && formattedTo) ? `${formattedFrom} -> ${formattedTo}` : (formattedFrom || formattedTo || "");

              return (
                <div key={idx} className={`hs-timeline-item ${ev.is_opponent_action ? "away-item" : "home-item"}`}>
                  <span className="hs-timeline-time">{formatMinSec(ev.match_time_seconds)}</span>
                  <span className="hs-timeline-team">{teamName}</span>
                  <span className="hs-timeline-player">{ev.player_name ? `#${ev.player_number || ''} ${ev.player_name}` : ev.player_id || "Equipo"}</span>
                  <span className="hs-timeline-desc">
                    {cat === ACTION_CATEGORIES.GOLES && (
                      <>
                        <strong>GOL</strong> {trajectory ? <span style={{ color: "var(--text-secondary)", fontWeight: "500", marginLeft: 4 }}>({trajectory})</span> : `(${ev.shot_type || "Tiro"})`}
                        {ev.goalkeeper_name && (
                          <span style={{ marginLeft: 6, color: "var(--text-muted)", fontSize: "0.9em" }}>
                            vs POR #{ev.goalkeeper_number} {ev.goalkeeper_name}
                          </span>
                        )}
                      </>
                    )}
                    {cat === ACTION_CATEGORIES.PARADAS && (
                      <>
                        <strong>PARADA</strong> {trajectory ? <span style={{ color: "var(--text-secondary)", fontWeight: "500", marginLeft: 4 }}>({trajectory})</span> : `(${ev.shot_type || "Tiro"})`}
                        {ev.goalkeeper_name && (
                          <span style={{ marginLeft: 6, color: "var(--text-muted)", fontSize: "0.9em" }}>
                            POR #{ev.goalkeeper_number} {ev.goalkeeper_name}
                          </span>
                        )}
                      </>
                    )}
                    {cat === ACTION_CATEGORIES.FALLO_LANZAMIENTO && (
                      <>
                        <strong>{(ev.result || "FALLO").toUpperCase()}</strong> {trajectory ? <span style={{ color: "var(--text-secondary)", fontWeight: "500", marginLeft: 4 }}>({trajectory})</span> : `(${ev.shot_type || "Tiro"})`}
                      </>
                    )}
                    {cat === ACTION_CATEGORIES.PERDIDAS && (
                      `Pérdida de balón (${ev.turnover_type || ev.end_reason || "Acción"})`
                    )}
                    {cat === ACTION_CATEGORIES.TIEMPO_MUERTO && (
                      "Tiempo Muerto solicitado"
                    )}
                    {cat === ACTION_CATEGORIES.GOLPE_FRANCO && (
                      "Golpe Franco cometido"
                    )}
                    {cat === ACTION_CATEGORIES.SANCIONES && (
                      `Sanción disciplinaria: ${ev.sanction_type || "Sanción"}`
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
