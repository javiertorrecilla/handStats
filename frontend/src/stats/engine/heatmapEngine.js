/* ==========================================================
   HANDSTATS ANALYTICS — HEATMAP ENGINE
   Generador de densidad espacial para campo y portería
   ========================================================== */

import { ZONE_COORDINATES, GOAL_GRID_ZONES } from "./types";

/**
 * Mapea eventos del partido en una rejilla de densidad 2D para la cancha de balonmano.
 * @param {Array} events - Lista de eventos
 * @param {string} metricType - "shots" | "goals" | "assists" | "turnovers" | "steals" | "saves"
 * @param {boolean} isOpponent - Filtrar equipo local o visitante
 * @returns {Array<Object>} Puntos de calor con x, y, intensity
 */
export function generateCourtHeatmap(events, metricType = "shots", isOpponent = false) {
  if (!events || events.length === 0) return [];

  const filteredEvents = events.filter((e) => {
    const opponentMatch = isOpponent ? e.is_opponent_action : !e.is_opponent_action;
    if (!opponentMatch) return false;

    if (metricType === "shots") return e.event_type === "shot";
    if (metricType === "goals") return e.event_type === "shot" && e.result === "Gol";
    if (metricType === "assists") return e.event_type === "shot" && e.result === "Gol" && e.assist_position && e.assist_position !== "Ninguna";
    if (metricType === "turnovers") return e.event_type === "turnover";
    if (metricType === "steals") return e.event_type === "steal";
    if (metricType === "saves") return e.event_type === "shot" && e.result === "Parada";
    return true;
  });

  const zoneCounts = {};

  filteredEvents.forEach((ev) => {
    let zoneKey = "9m_cen";

    if (ev.event_type === "shot") {
      const type = (ev.shot_type || "").toLowerCase();
      if (type.includes("extremo")) {
        zoneKey = ev.target_zone?.includes("L") ? "6m_ext_izq" : "6m_ext_der";
      } else if (type.includes("pivote")) {
        zoneKey = "6m_pivote";
      } else if (type.includes("penetración")) {
        zoneKey = "6m_pen_izq";
      } else if (type.includes("7m")) {
        zoneKey = "7m";
      } else {
        zoneKey = ev.target_zone?.includes("L") ? "9m_izq" : ev.target_zone?.includes("R") ? "9m_der" : "9m_cen";
      }
    } else if (ev.event_type === "turnover" && ev.turnover_zone_row) {
      zoneKey = "9m_cen";
    }

    zoneCounts[zoneKey] = (zoneCounts[zoneKey] || 0) + 1;
  });

  const maxCount = Math.max(1, ...Object.values(zoneCounts));

  return Object.keys(zoneCounts).map((key) => {
    const coords = ZONE_COORDINATES[key] || { x: 50, y: 50, name: key };
    const count = zoneCounts[key];
    return {
      key,
      name: coords.name,
      x: coords.x,
      y: coords.y,
      count,
      intensity: Math.round((count / maxCount) * 100) / 100
    };
  });
}

/**
 * Genera la matriz de tiros/paradas por zona de portería (3x3).
 */
export function generateGoalGridMatrix(events, isOpponent = false) {
  if (!events) return {};

  const filteredShots = events.filter((e) => {
    const opponentMatch = isOpponent ? e.is_opponent_action : !e.is_opponent_action;
    return opponentMatch && e.event_type === "shot" && e.target_zone;
  });

  const grid = {};

  Object.keys(GOAL_GRID_ZONES).forEach((zoneId) => {
    grid[zoneId] = { shots: 0, goals: 0, stops: 0, misses: 0 };
  });

  filteredShots.forEach((s) => {
    const z = s.target_zone;
    if (grid[z]) {
      grid[z].shots += 1;
      if (s.result === "Gol") grid[z].goals += 1;
      else if (s.result === "Parada") grid[z].stops += 1;
      else grid[z].misses += 1;
    }
  });

  return grid;
}
