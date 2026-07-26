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
