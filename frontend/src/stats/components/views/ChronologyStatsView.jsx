import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { getEventCategory, ACTION_CATEGORIES, formatCourtZoneName, formatGoalZoneName } from "../../engine/types";
import { isEmptyNetEvent } from "../../engine/metricsEngine";

export function ChronologyStatsView({ match }) {
  const { t } = useTranslation();
  const [filterType, setFilterType] = useState(ACTION_CATEGORIES.TODOS);
  const events = match?.events || [];

  const formatMinSec = (sec = 0) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const isSubstitution = (e) => {
    return (
      e.event_type === "substitution" ||
      e.event_type === "cambio" ||
      e.category === "cambios" ||
      e.category === "cambio" ||
      e.action_key === "cambio" ||
      e.action_key === "substitution" ||
      getEventCategory(e) === ACTION_CATEGORIES.CAMBIOS
    );
  };

  // Excluir sustituciones del timeline cronológico e historial
  const displayableEvents = events.filter(e => !isSubstitution(e));

  const categories = displayableEvents.map(e => ({
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
          {t("chronology.tab_all", "Todos")} ({displayableEvents.length})
        </button>

        <button
          className={`btn btn-sm ${filterType === ACTION_CATEGORIES.GOLES ? "btn-primary" : "btn-ghost"}`}
          onClick={() => setFilterType(ACTION_CATEGORIES.GOLES)}
        >
          {t("chronology.tab_goals", "Goles")} ({goalsCount})
        </button>

        <button
          className={`btn btn-sm ${filterType === ACTION_CATEGORIES.PARADAS ? "btn-primary" : "btn-ghost"}`}
          onClick={() => setFilterType(ACTION_CATEGORIES.PARADAS)}
        >
          {t("chronology.tab_saves", "Paradas")} ({savesCount})
        </button>

        <button
          className={`btn btn-sm ${filterType === ACTION_CATEGORIES.FALLO_LANZAMIENTO ? "btn-primary" : "btn-ghost"}`}
          onClick={() => setFilterType(ACTION_CATEGORIES.FALLO_LANZAMIENTO)}
        >
          {t("chronology.tab_misses", "Fallo Lanzamiento")} ({missedCount})
        </button>

        <button
          className={`btn btn-sm ${filterType === ACTION_CATEGORIES.PERDIDAS ? "btn-primary" : "btn-ghost"}`}
          onClick={() => setFilterType(ACTION_CATEGORIES.PERDIDAS)}
        >
          {t("chronology.tab_turnovers", "Pérdidas")} ({turnoversCount})
        </button>

        <button
          className={`btn btn-sm ${filterType === ACTION_CATEGORIES.TIEMPO_MUERTO ? "btn-primary" : "btn-ghost"}`}
          onClick={() => setFilterType(ACTION_CATEGORIES.TIEMPO_MUERTO)}
        >
          {t("chronology.tab_timeouts", "Tiempo Muerto")} ({timeoutsCount})
        </button>

        <button
          className={`btn btn-sm ${filterType === ACTION_CATEGORIES.GOLPE_FRANCO ? "btn-primary" : "btn-ghost"}`}
          onClick={() => setFilterType(ACTION_CATEGORIES.GOLPE_FRANCO)}
        >
          {t("chronology.tab_free_throws", "Golpe Franco")} ({freeThrowsCount})
        </button>

        <button
          className={`btn btn-sm ${filterType === ACTION_CATEGORIES.SANCIONES ? "btn-primary" : "btn-ghost"}`}
          onClick={() => setFilterType(ACTION_CATEGORIES.SANCIONES)}
        >
          {t("chronology.tab_sanctions", "Sanciones")} ({sanctionsCount})
        </button>
      </div>

      <div className="hs-card">
        <h4 className="hs-card-title">{t("chronology.timeline_title", "TIMELINE CRONOLÓGICO COMPLETO DEL PARTIDO")}</h4>
        <div className="hs-timeline-list">
          {filteredEvents.length > 0 ? (
            [...filteredEvents].reverse().map(({ event: ev, cat }, idx) => {
              const teamName = ev.is_opponent_action ? match.away_team : match.home_team;
              const fromZoneRaw = ev.shot_zone || ev.court_zone || ev.shot_position || "";
              const toZoneRaw = ev.goal_zone || ev.target_zone || "";
              const formattedFrom = formatCourtZoneName(fromZoneRaw, t);
              const formattedTo = formatGoalZoneName(toZoneRaw, t);
              const trajectory = (formattedFrom && formattedTo) ? `${formattedFrom} -> ${formattedTo}` : (formattedFrom || formattedTo || "");

              return (
                <div key={idx} className={`hs-timeline-item ${ev.is_opponent_action ? "away-item" : "home-item"}`}>
                  <span className="hs-timeline-time">{formatMinSec(ev.match_time_seconds)}</span>
                  <span className="hs-timeline-team">{teamName}</span>
                  <span className="hs-timeline-player">{ev.player_name ? `#${ev.player_number || ''} ${ev.player_name}` : ev.player_id || "Equipo"}</span>
                  <span className="hs-timeline-desc">
                    {cat === ACTION_CATEGORIES.GOLES && (
                      <>
                        <strong>{t("chronology.action_gol", "GOL")}</strong> {trajectory ? <span style={{ color: "var(--text-secondary)", fontWeight: "500", marginLeft: 4 }}>({trajectory})</span> : `(${ev.shot_type || "Tiro"})`}
                        {isEmptyNetEvent(ev) ? (
                          <span className="hs-pos-badge" style={{ marginLeft: 6, fontSize: "0.8em", background: "rgba(245, 158, 11, 0.15)", color: "#f59e0b", border: "1px solid rgba(245, 158, 11, 0.3)", padding: "1px 6px", borderRadius: "3px", fontWeight: "700" }}>
                            🥅 {t("action_gol_porteria_vacia_detail", "Gol a portería vacía")}
                          </span>
                        ) : ev.goalkeeper_name ? (
                          <span style={{ marginLeft: 6, color: "var(--text-muted)", fontSize: "0.9em" }}>
                            vs POR #{ev.goalkeeper_number} {ev.goalkeeper_name}
                          </span>
                        ) : null}
                      </>
                    )}
                    {cat === ACTION_CATEGORIES.PARADAS && (
                      <>
                        <strong>{t("chronology.action_parada", "PARADA")}</strong> {trajectory ? <span style={{ color: "var(--text-secondary)", fontWeight: "500", marginLeft: 4 }}>({trajectory})</span> : `(${ev.shot_type || "Tiro"})`}
                        {ev.goalkeeper_name && (
                          <span style={{ marginLeft: 6, color: "var(--text-muted)", fontSize: "0.9em" }}>
                            POR #{ev.goalkeeper_number} {ev.goalkeeper_name}
                          </span>
                        )}
                      </>
                    )}
                    {cat === ACTION_CATEGORIES.FALLO_LANZAMIENTO && (
                      <>
                        <strong>{(ev.result || t("chronology.action_fallo", "FALLO")).toUpperCase()}</strong> {trajectory ? <span style={{ color: "var(--text-secondary)", fontWeight: "500", marginLeft: 4 }}>({trajectory})</span> : `(${ev.shot_type || "Tiro"})`}
                      </>
                    )}
                    {cat === ACTION_CATEGORIES.PERDIDAS && (
                      t("chronology.turnover_desc", { type: ev.turnover_type || ev.end_reason || "Acción", defaultValue: `Pérdida de balón (${ev.turnover_type || ev.end_reason || "Acción"})` })
                    )}
                    {cat === ACTION_CATEGORIES.TIEMPO_MUERTO && (
                      t("chronology.timeout_desc", "Tiempo Muerto solicitado")
                    )}
                    {cat === ACTION_CATEGORIES.GOLPE_FRANCO && (
                      t("chronology.free_throw_desc", "Golpe Franco cometido")
                    )}
                    {cat === ACTION_CATEGORIES.SANCIONES && (
                      t("chronology.sanction_desc", { type: ev.sanction_type || "Sanción", defaultValue: `Sanción disciplinaria: ${ev.sanction_type || "Sanción"}` })
                    )}
                  </span>
                </div>
              );
            })
          ) : (
            <div style={{ textAlign: "center", color: "var(--text-muted)", padding: 20 }}>
              {t("chronology.no_events", "No se encontraron eventos coincidentes con el filtro.")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
