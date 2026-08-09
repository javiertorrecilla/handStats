/* ==========================================================
   HANDSTATS ANALYTICS — TYPES & CONSTANTS
   Definiciones y constantes del motor estadístico
   ========================================================== */

export const SHOT_TYPES = {
  EXTERIOR: "exterior",
  PENETRACION: "penetración",
  EXTREMO: "extremo",
  PIVOTE: "pivote",
  CONTRAATAQUE: "contraataque",
  SIETE_METROS: "7 metros"
};

export const SHOT_RESULTS = {
  GOL: "Gol",
  PARADA: "Parada",
  POSTE: "Poste",
  FUERA: "Fuera",
  BLOQUEADO: "Bloqueado"
};

export const PLAY_PHASES = {
  POSICIONAL: "Posicional",
  PRIMERA_OLEADA: "1ª Oleada",
  SEGUNDA_OLEADA: "2ª Oleada",
  CONTRAATAQUE: "Contraataque"
};

export const NUMERICAL_SITUATIONS = {
  IGUALDAD: "Igualdad",
  SUPERIORIDAD: "Superioridad",
  INFERIORIDAD: "Inferioridad"
};

// Mapa de coordenadas aproximadas (x: 0-100%, y: 0-100%) para cada zona de lanzamiento en la cancha de balonmano
export const ZONE_COORDINATES = {
  // Tiros exteriores (9 metros)
  "9m_izq": { x: 25, y: 70, name: "9m Izquierdo", group: "9m" },
  "9m_cen": { x: 50, y: 75, name: "9m Central", group: "9m" },
  "9m_der": { x: 75, y: 70, name: "9m Derecho", group: "9m" },

  // Extremos (6 metros)
  "6m_ext_izq": { x: 10, y: 30, name: "Extremo Izquierdo", group: "Extremo" },
  "6m_ext_der": { x: 90, y: 30, name: "Extremo Derecho", group: "Extremo" },

  // 6 metros centro / Pivote
  "6m_pivote": { x: 50, y: 35, name: "6m Pivote / Centro", group: "6m" },
  "6m_pen_izq": { x: 30, y: 45, name: "6m Penetración Izq", group: "Penetración" },
  "6m_pen_der": { x: 70, y: 45, name: "6m Penetración Der", group: "Penetración" },

  // 7 metros
  "7m": { x: 50, y: 55, name: "7 Metros", group: "7m" }
};

// Definición de zonas de portería (3x3 interior + marco + fuera)
export const GOAL_GRID_ZONES = {
  TL: { label: "Sup. Izquierdo", row: 1, col: 1, type: "inside" },
  TC: { label: "Sup. Centro",    row: 1, col: 2, type: "inside" },
  TR: { label: "Sup. Derecho",   row: 1, col: 3, type: "inside" },
  ML: { label: "Med. Izquierdo", row: 2, col: 1, type: "inside" },
  C:  { label: "Centro",         row: 2, col: 2, type: "inside" },
  MR: { label: "Med. Derecho",   row: 2, col: 3, type: "inside" },
  BL: { label: "Inf. Izquierdo", row: 3, col: 1, type: "inside" },
  BC: { label: "Inf. Centro",    row: 3, col: 2, type: "inside" },
  BR: { label: "Inf. Derecho",   row: 3, col: 3, type: "inside" },

  TP: { label: "Larguero",       row: 0, col: 2, type: "post" },
  LP: { label: "Poste Izq.",     row: 2, col: 0, type: "post" },
  RP: { label: "Poste Der.",     row: 2, col: 4, type: "post" },

  OA: { label: "Fuera Arriba",   row: -1, col: 2, type: "outside" },
  OL: { label: "Fuera Izq.",     row: 2, col: -1, type: "outside" },
  OR: { label: "Fuera Der.",     row: 2, col: 5,  type: "outside" }
};

export const ACTION_CATEGORIES = {
  TODOS: "todos",
  GOLES: "goles",
  PARADAS: "paradas",
  FALLO_LANZAMIENTO: "fallo_lanzamiento",
  PERDIDAS: "perdidas",
  TIEMPO_MUERTO: "tiempo_muerto",
  GOLPE_FRANCO: "golpe_franco",
  SANCIONES: "sanciones"
};

export const ACTION_CATEGORY_LABELS = {
  todos: "TODOS",
  goles: "Goles",
  paradas: "Paradas",
  fallo_lanzamiento: "Fallo Lanzamiento",
  perdidas: "Pérdidas",
  tiempo_muerto: "Tiempo Muerto",
  golpe_franco: "Golpe Franco",
  sanciones: "Sanciones"
};

/**
 * Clasifica cualquier evento registrado en una de las 7 categorías oficiales:
 * - "goles"
 * - "paradas"
 * - "fallo_lanzamiento"
 * - "perdidas"
 * - "tiempo_muerto"
 * - "golpe_franco"
 * - "sanciones"
 */
export function getEventCategory(e) {
  if (!e) return "otros";

  const eventType = (e.event_type || "").toLowerCase();
  const result = (e.result || "").toLowerCase();
  const actionKey = (e.action_key || e.actionKey || "").toLowerCase();
  const sanctionType = (e.sanction_type || e.sanctionType || "").toLowerCase();

  // 0. Fin de Periodo / Partido (NO ES SANCIÓN NI ACCIÓN DISCIPLINARIA)
  if (
    eventType === "period_change" ||
    actionKey.includes("fin_") ||
    sanctionType.startsWith("fin") ||
    result.startsWith("fin")
  ) {
    return "periodo";
  }

  // 1. Tiempo Muerto
  if (
    eventType === "timeout" ||
    actionKey === "tiempo_muerto" ||
    sanctionType.includes("tiempo muerto")
  ) {
    return ACTION_CATEGORIES.TIEMPO_MUERTO;
  }

  // 2. Golpe Franco
  if (
    eventType === "free_throw" ||
    result === "golpe franco" ||
    actionKey === "golpe_franco"
  ) {
    return ACTION_CATEGORIES.GOLPE_FRANCO;
  }

  // 3. Sanciones (2 Minutos, Tarjeta Amarilla, Roja, Azul) - NUNCA FIN DE PERIODO
  if (
    eventType === "sanction" ||
    sanctionType.includes("2 min") ||
    sanctionType.includes("amarilla") ||
    sanctionType.includes("roja") ||
    sanctionType.includes("azul")
  ) {
    return ACTION_CATEGORIES.SANCIONES;
  }

  // 4. Goles
  if (result === "gol" || eventType === "gol") {
    return ACTION_CATEGORIES.GOLES;
  }

  // 5. Paradas
  if (result === "parada") {
    return ACTION_CATEGORIES.PARADAS;
  }

  // 6. Fallo Lanzamiento (Poste y Fuera)
  if (result === "poste" || result === "fuera") {
    return ACTION_CATEGORIES.FALLO_LANZAMIENTO;
  }

  // 7. Pérdidas
  if (
    eventType === "turnover" ||
    result === "pérdida" ||
    result === "perdida"
  ) {
    return ACTION_CATEGORIES.PERDIDAS;
  }

  return "otros";
}

/**
 * Formatea el nombre de la zona de origen del campo en español natural.
 * Ej: "9m lateral derecho", "pivote 6m", "extremo izquierdo"
 */
export function formatCourtZoneName(zoneStr) {
  if (!zoneStr) return "";

  const z = zoneStr.toLowerCase().trim();

  if (z.includes("9m lateral der") || z.includes("9m lat. der")) return "9m lateral derecho";
  if (z.includes("9m lateral izq") || z.includes("9m lat. izq")) return "9m lateral izquierdo";
  if (z.includes("9m central") || z.includes("9m cen")) return "9m central";

  if (z.includes("extremo der")) return "extremo derecho";
  if (z.includes("extremo izq")) return "extremo izquierdo";

  if (z.includes("pivote")) return "pivote 6m";
  if (z.includes("penetración") || z.includes("penetracion")) return "penetración 6m";
  if (z.includes("contraataque") || z.includes("1ª oleada")) return "contraataque 6m";
  if (z.includes("7 metros") || z.includes("7m")) return "7 metros";

  return zoneStr.toLowerCase();
}

/**
 * Formatea la zona de llegada a gol/portería en español natural sin abreviaturas.
 * Ej: "abajo a la izquierda", "arriba al centro", "larguero"
 */
export function formatGoalZoneName(zoneStr) {
  if (!zoneStr) return "";

  const z = zoneStr.toLowerCase().trim();

  // Escuadras / Arriba
  if (z.includes("escuadra sup. izq") || z.includes("sup. izq") || z === "tl" || z.includes("superior izq")) return "arriba a la izquierda";
  if (z.includes("escuadra sup. der") || z.includes("sup. der") || z === "tr" || z.includes("superior der")) return "arriba a la derecha";
  if (z.includes("superior cen") || z.includes("sup. cen") || z === "tc") return "arriba al centro";

  // Medio
  if (z.includes("medio izq") || z.includes("med. izq") || z === "ml") return "medio a la izquierda";
  if (z.includes("medio der") || z.includes("med. der") || z === "mr") return "medio a la derecha";
  if (z.includes("centro portería") || z.includes("centro porteria") || z === "c" || z === "centro") return "al centro";

  // Inferior / Abajo
  if (z.includes("inferior izq") || z.includes("inf. izq") || z === "bl") return "abajo a la izquierda";
  if (z.includes("inferior der") || z.includes("inf. der") || z === "br") return "abajo a la derecha";
  if (z.includes("inferior cen") || z.includes("inf. cen") || z === "bc") return "abajo al centro";

  // Postes / Larguero
  if (z.includes("larguero") || z === "tp") return "larguero";
  if (z.includes("poste izq") || z === "lp") return "poste izquierdo";
  if (z.includes("poste der") || z === "rp") return "poste derecho";

  // Fuera
  if (z.includes("fuera arr") || z === "oa") return "fuera arriba";
  if (z.includes("fuera izq") || z === "ol") return "fuera a la izquierda";
  if (z.includes("fuera der") || z === "or") return "fuera a la derecha";
  if (z.includes("fuera")) return "fuera";

  return zoneStr.toLowerCase();
}
