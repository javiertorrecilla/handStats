/* ==========================================================
   HANDSTATS ANALYTICS — HEATMAP ENGINE
   Generador de densidad espacial continua para cancha y portería
   ========================================================== */

import { ZONE_COORDINATES, GOAL_GRID_ZONES } from "./types.js";

/**
 * Coordenadas de referencia en % (0-100) en la media pista de balonmano
 * (0,0 arriba izquierda en la línea de gol; 100,100 abajo derecha en la línea de centro).
 */
export const COURT_ZONE_DEFAULT_CENTERS = {
  "extremo izquierdo": { x: 8, y: 15 },
  "extremo derecho": { x: 92, y: 15 },
  "pivote 6m": { x: 50, y: 38 },
  "pivote": { x: 50, y: 38 },
  "penetración izquierda": { x: 32, y: 40 },
  "penetración derecha": { x: 68, y: 40 },
  "penetración": { x: 50, y: 40 },
  "7 metros": { x: 50, y: 55 },
  "7m": { x: 50, y: 55 },
  "9m lateral izquierdo": { x: 22, y: 72 },
  "9m central": { x: 50, y: 76 },
  "9m lateral derecho": { x: 78, y: 72 },
  "contraataque izquierdo": { x: 25, y: 55 },
  "contraataque central": { x: 50, y: 55 },
  "contraataque derecho": { x: 75, y: 55 },
  "contraataque 6m": { x: 50, y: 55 },
  "contraataque": { x: 50, y: 55 },
  "área de portería (sin posición)": { x: 50, y: 25 }
};

/**
 * Coordenadas de referencia en % (0-100) en el marco de la portería
 */
export const GOAL_ZONE_DEFAULT_CENTERS = {
  TL: { x: 25, y: 32 },
  TC: { x: 50, y: 32 },
  TR: { x: 75, y: 32 },
  ML: { x: 25, y: 58 },
  C:  { x: 50, y: 58 },
  MR: { x: 75, y: 58 },
  BL: { x: 25, y: 84 },
  BC: { x: 50, y: 84 },
  BR: { x: 75, y: 84 },
  TP: { x: 50, y: 14 },
  LP: { x: 10, y: 55 },
  RP: { x: 90, y: 55 },
  OA: { x: 50, y: 5 },
  OL: { x: 4, y: 50 },
  OR: { x: 96, y: 50 }
};

/**
 * Helper unificado y robusto para determinar si un evento pertenece al equipo visitante.
 */
export function isAwayEvent(e, match) {
  if (!e) return false;
  if (e.is_opponent_action === true || e.is_opponent_action === "true") return true;
  if (e.is_opponent === true || e.is_opponent === "true") return true;

  const teamUpper = (e.team || "").toString().toUpperCase().trim();
  if (teamUpper === "VISITANTE" || teamUpper === "AWAY" || teamUpper === "VISIT") return true;
  if (teamUpper === "LOCAL" || teamUpper === "HOME") return false;

  if (match?.away_team && e.team && e.team.toString().toLowerCase().trim() === match.away_team.toString().toLowerCase().trim()) return true;
  if (match?.home_team && e.team && e.team.toString().toLowerCase().trim() === match.home_team.toString().toLowerCase().trim()) return false;

  if (match?.away_players && Array.isArray(match.away_players)) {
    const pNum = e.player_number ?? e.shooter_number;
    if (pNum !== undefined && pNum !== null) {
      if (match.away_players.some((ap) => String(ap.number) === String(pNum))) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Función de hashing determinista / pseudo-aleatoria para dispersión controlada (margen de error).
 */
function pseudoJitter(seed, maxOffset = 3.5) {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  const y = Math.cos(seed * 26.3141 + 45.197) * 23421.6312;
  const jx = (x - Math.floor(x) - 0.5) * 2 * maxOffset;
  const jy = (y - Math.floor(y) - 0.5) * 2 * maxOffset;
  return { jx, jy };
}

function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return hash;
}

/**
 * Genera una clave única determinista para un evento.
 */
export function getEventDeterministicId(ev, idx = 0) {
  if (!ev) return `ev_${idx}`;
  if (ev.event_id) return String(ev.event_id);
  if (ev.id) return String(ev.id);
  if (ev._id) return String(ev._id);
  return `ev_${ev.match_time_seconds || 0}_${ev.player_number || ev.shooter_number || 0}_${ev.event_type || "action"}_${idx}`;
}

/**
 * Extrae o sintetiza la coordenada de cancha (0-100) de un evento con margen de error natural.
 */
export function getEventCourtCoordinate(ev, seedIndex = 0) {
  if (!ev) return { x: 50, y: 70 };

  const seed = (ev.event_id ? Math.abs(hashCode(String(ev.event_id))) : (ev.match_time_seconds || 0) * 100) + seedIndex;

  // 1. Si ya tiene coordenadas guardadas
  if (ev.court_coord && typeof ev.court_coord.x === "number" && typeof ev.court_coord.y === "number") {
    const { jx, jy } = pseudoJitter(seed, 1.2);
    return {
      x: Math.min(98, Math.max(2, ev.court_coord.x + jx)),
      y: Math.min(98, Math.max(2, ev.court_coord.y + jy))
    };
  }

  if (typeof ev.court_x === "number" && typeof ev.court_y === "number") {
    const { jx, jy } = pseudoJitter(seed, 1.2);
    return {
      x: Math.min(98, Math.max(2, ev.court_x + jx)),
      y: Math.min(98, Math.max(2, ev.court_y + jy))
    };
  }

  // 2. Fallback de zona
  const zoneStr = (ev.shot_zone || ev.court_zone || ev.shot_position || "").toLowerCase().trim();
  let baseCenter = { x: 50, y: 75 };

  for (const [key, center] of Object.entries(COURT_ZONE_DEFAULT_CENTERS)) {
    if (zoneStr.includes(key)) {
      baseCenter = center;
      break;
    }
  }

  // Si no hizo match directo, inferir por shot_type
  if (baseCenter.x === 50 && baseCenter.y === 75 && ev.shot_type) {
    const st = ev.shot_type.toLowerCase();
    if (st.includes("extremo")) baseCenter = { x: ev.target_zone?.includes("L") ? 8 : 92, y: 15 };
    else if (st.includes("pivote")) baseCenter = { x: 50, y: 38 };
    else if (st.includes("penetración")) baseCenter = { x: ev.target_zone?.includes("L") ? 32 : 68, y: 40 };
    else if (st.includes("7m") || st.includes("7 metros") || st.includes("penalti")) baseCenter = { x: 50, y: 55 };
    else if (st.includes("contraataque")) baseCenter = { x: 50, y: 55 };
  }

  const { jx, jy } = pseudoJitter(seed, 4.0);
  return {
    x: Math.min(96, Math.max(4, baseCenter.x + jx)),
    y: Math.min(96, Math.max(4, baseCenter.y + jy))
  };
}

/**
 * Extrae o sintetiza la coordenada de portería (0-100) de un evento con margen de error natural.
 */
export function getEventGoalCoordinate(ev, seedIndex = 0) {
  if (!ev) return { x: 50, y: 50 };

  const seed = (ev.event_id ? Math.abs(hashCode(String(ev.event_id))) : (ev.match_time_seconds || 0) * 100) + seedIndex + 17;

  // 1. Si ya tiene coordenadas guardadas
  if (ev.goal_coord && typeof ev.goal_coord.x === "number" && typeof ev.goal_coord.y === "number") {
    const { jx, jy } = pseudoJitter(seed, 1.2);
    return {
      x: Math.min(98, Math.max(2, ev.goal_coord.x + jx)),
      y: Math.min(98, Math.max(2, ev.goal_coord.y + jy))
    };
  }

  if (typeof ev.goal_x === "number" && typeof ev.goal_y === "number") {
    const { jx, jy } = pseudoJitter(seed, 1.2);
    return {
      x: Math.min(98, Math.max(2, ev.goal_x + jx)),
      y: Math.min(98, Math.max(2, ev.goal_y + jy))
    };
  }

  // 2. Fallback de zona de portería
  const zoneKey = (ev.goal_zone || ev.target_zone || "").toUpperCase().trim();
  let baseCenter = GOAL_ZONE_DEFAULT_CENTERS[zoneKey] || null;

  if (!baseCenter) {
    const zLower = (ev.goal_zone || ev.target_zone || "").toLowerCase();
    if (zLower.includes("sup. izq") || zLower.includes("superior izq") || zLower.includes("escuadra sup. izq")) baseCenter = GOAL_ZONE_DEFAULT_CENTERS.TL;
    else if (zLower.includes("sup. der") || zLower.includes("superior der") || zLower.includes("escuadra sup. der")) baseCenter = GOAL_ZONE_DEFAULT_CENTERS.TR;
    else if (zLower.includes("sup. cen") || zLower.includes("superior cen") || zLower.includes("arriba al centro")) baseCenter = GOAL_ZONE_DEFAULT_CENTERS.TC;
    else if (zLower.includes("med. izq") || zLower.includes("medio izq")) baseCenter = GOAL_ZONE_DEFAULT_CENTERS.ML;
    else if (zLower.includes("med. der") || zLower.includes("medio der")) baseCenter = GOAL_ZONE_DEFAULT_CENTERS.MR;
    else if (zLower.includes("centro")) baseCenter = GOAL_ZONE_DEFAULT_CENTERS.C;
    else if (zLower.includes("inf. izq") || zLower.includes("inferior izq") || zLower.includes("abajo a la izq")) baseCenter = GOAL_ZONE_DEFAULT_CENTERS.BL;
    else if (zLower.includes("inf. der") || zLower.includes("inferior der") || zLower.includes("abajo a la der")) baseCenter = GOAL_ZONE_DEFAULT_CENTERS.BR;
    else if (zLower.includes("inf. cen") || zLower.includes("inferior cen") || zLower.includes("abajo al centro")) baseCenter = GOAL_ZONE_DEFAULT_CENTERS.BC;
    else if (zLower.includes("larguero")) baseCenter = GOAL_ZONE_DEFAULT_CENTERS.TP;
    else if (zLower.includes("poste izq")) baseCenter = GOAL_ZONE_DEFAULT_CENTERS.LP;
    else if (zLower.includes("poste der")) baseCenter = GOAL_ZONE_DEFAULT_CENTERS.RP;
    else if (zLower.includes("fuera arr")) baseCenter = GOAL_ZONE_DEFAULT_CENTERS.OA;
    else if (zLower.includes("fuera izq")) baseCenter = GOAL_ZONE_DEFAULT_CENTERS.OL;
    else if (zLower.includes("fuera der")) baseCenter = GOAL_ZONE_DEFAULT_CENTERS.OR;
    else baseCenter = { x: 50, y: 50 };
  }

  const { jx, jy } = pseudoJitter(seed, 4.5);
  return {
    x: Math.min(96, Math.max(4, baseCenter.x + jx)),
    y: Math.min(96, Math.max(4, baseCenter.y + jy))
  };
}

/**
 * Genera el conjunto de puntos para el mapa de calor continuo de Cancha.
 */
export function generateContinuousCourtHeatmapData(events = [], options = {}) {
  const {
    metricType = "all_actions",
    isOpponent = null,
    match = null,
    selectedPlayer = "all",
    selectedGoalkeeper = "all"
  } = options;

  if (!events || events.length === 0) return [];

  const filtered = events.filter((ev) => {
    // 1. Filtro equipo (solo si se especifica isOpponent como boolean)
    if (typeof isOpponent === "boolean") {
      const isAway = isAwayEvent(ev, match);
      const opponentMatch = isOpponent ? isAway : !isAway;
      if (!opponentMatch) return false;
    }

    // 2. Filtro jugador
    if (selectedPlayer && selectedPlayer !== "all") {
      const pNum = ev.player_number ?? ev.shooter_number;
      if (String(pNum) !== String(selectedPlayer)) return false;
    }

    // 3. Filtro portero
    if (selectedGoalkeeper && selectedGoalkeeper !== "all") {
      if (ev.goalkeeper_number && String(ev.goalkeeper_number) !== String(selectedGoalkeeper)) {
        return false;
      }
    }

    // 4. Filtro por métrica
    if (metricType === "all_actions" || metricType === "all") {
      return true;
    }
    if (metricType === "all_shots" || metricType === "shots") {
      return ev.event_type === "shot";
    }
    if (metricType === "goals") {
      return ev.event_type === "shot" && ev.result === "Gol";
    }
    if (metricType === "saves") {
      return ev.event_type === "shot" && ev.result === "Parada";
    }
    if (metricType === "misses") {
      return ev.event_type === "shot" && (ev.result === "Poste" || ev.result === "Fuera" || ev.result === "Fallo" || ev.result === "Bloqueado");
    }
    if (metricType === "turnovers") {
      return ev.event_type === "turnover";
    }

    return true;
  });

  return filtered.map((ev, idx) => {
    const coord = getEventCourtCoordinate(ev, idx);
    const eventId = getEventDeterministicId(ev, idx);
    return {
      id: eventId,
      eventId: eventId,
      rawEvent: ev,
      x: coord.x,
      y: coord.y,
      weight: 1,
      result: ev.result,
      event_type: ev.event_type,
      shot_type: ev.shot_type,
      shot_zone: ev.shot_zone || ev.court_zone,
      goal_zone: ev.goal_zone || ev.target_zone,
      player_name: ev.player_name || ev.shooter_name,
      player_number: ev.player_number || ev.shooter_number,
      goalkeeper_name: ev.goalkeeper_name,
      goalkeeper_number: ev.goalkeeper_number,
      xg: ev.expected_goals || ev.xg || 0,
      match_time_seconds: ev.match_time_seconds || 0
    };
  });
}

/**
 * Genera el conjunto de puntos para el mapa de calor continuo de Portería.
 */
export function generateContinuousGoalHeatmapData(events = [], options = {}) {
  const {
    metricType = "all_actions",
    isOpponent = null,
    match = null,
    selectedPlayer = "all",
    selectedGoalkeeper = "all"
  } = options;

  if (!events || events.length === 0) return [];

  const filtered = events.filter((ev) => {
    if (ev.event_type !== "shot") return false;

    // 1. Filtro equipo (solo si se especifica isOpponent como boolean)
    if (typeof isOpponent === "boolean") {
      const isAway = isAwayEvent(ev, match);
      const opponentMatch = isOpponent ? isAway : !isAway;
      if (!opponentMatch) return false;
    }

    if (selectedPlayer && selectedPlayer !== "all") {
      const pNum = ev.player_number ?? ev.shooter_number;
      if (String(pNum) !== String(selectedPlayer)) return false;
    }

    if (selectedGoalkeeper && selectedGoalkeeper !== "all") {
      if (ev.goalkeeper_number && String(ev.goalkeeper_number) !== String(selectedGoalkeeper)) {
        return false;
      }
    }

    if (metricType === "goals") return ev.result === "Gol";
    if (metricType === "saves") return ev.result === "Parada";
    if (metricType === "misses") return ev.result === "Poste" || ev.result === "Fuera" || ev.result === "Fallo" || ev.result === "Bloqueado";
    if (metricType === "turnovers") return false;

    return true;
  });

  return filtered.map((ev, idx) => {
    const coord = getEventGoalCoordinate(ev, idx);
    const eventId = getEventDeterministicId(ev, idx);
    return {
      id: eventId,
      eventId: eventId,
      rawEvent: ev,
      x: coord.x,
      y: coord.y,
      weight: 1,
      result: ev.result,
      event_type: ev.event_type,
      shot_type: ev.shot_type,
      shot_zone: ev.shot_zone || ev.court_zone,
      goal_zone: ev.goal_zone || ev.target_zone,
      player_name: ev.player_name || ev.shooter_name,
      player_number: ev.player_number || ev.shooter_number,
      goalkeeper_name: ev.goalkeeper_name,
      goalkeeper_number: ev.goalkeeper_number,
      xg: ev.expected_goals || ev.xg || 0,
      xsaves: ev.expected_saves || ev.xsaves || 0,
      match_time_seconds: ev.match_time_seconds || 0
    };
  });
}

/**
 * Mapea eventos a zonas discretas (retrocompatibilidad).
 */
export function generateCourtHeatmap(events, metricType = "all_shots", isOpponent = false) {
  return generateContinuousCourtHeatmapData(events, { metricType, isOpponent });
}

/**
 * Genera la matriz de tiros/paradas por zona de portería (3x3 retrocompatibilidad).
 */
export function generateGoalGridMatrix(events, isOpponent = false) {
  if (!events) return {};

  const filteredShots = events.filter((e) => {
    const isAway = isAwayEvent(e);
    const opponentMatch = isOpponent ? isAway : !isAway;
    return opponentMatch && e.event_type === "shot" && (e.target_zone || e.goal_zone);
  });

  const grid = {};
  Object.keys(GOAL_GRID_ZONES).forEach((zoneId) => {
    grid[zoneId] = { shots: 0, goals: 0, stops: 0, misses: 0 };
  });

  filteredShots.forEach((s) => {
    const z = (s.target_zone || s.goal_zone || "").toUpperCase();
    if (grid[z]) {
      grid[z].shots += 1;
      if (s.result === "Gol") grid[z].goals += 1;
      else if (s.result === "Parada") grid[z].stops += 1;
      else grid[z].misses += 1;
    }
  });

  return grid;
}
