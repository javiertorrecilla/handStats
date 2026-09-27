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
 * Formatea el nombre de la zona de origen del campo en el idioma activo.
 * Soporta cadenas originales en español, inglés, francés, danés, alemán y polaco, así como abreviaturas.
 */
export function formatCourtZoneName(zoneStr, t) {
  if (!zoneStr) return "";

  const z = zoneStr.toLowerCase().trim();

  // 9M Lateral Derecho
  if (
    z.includes("9m lateral der") ||
    z.includes("9m lat. der") ||
    z.includes("9m lat der") ||
    z.includes("right back") ||
    z.includes("rückraum rechts") ||
    z.includes("ruckraum rechts") ||
    z.includes("højre back") ||
    z.includes("hojre back") ||
    z.includes("arriere droit") ||
    z.includes("arrière droit") ||
    z.includes("prawe rozegranie")
  ) {
    return t ? t("mesa_control.court_zones.right_back_9m") : "9m lateral derecho";
  }

  // 9M Lateral Izquierdo
  if (
    z.includes("9m lateral izq") ||
    z.includes("9m lat. izq") ||
    z.includes("9m lat izq") ||
    z.includes("left back") ||
    z.includes("rückraum links") ||
    z.includes("ruckraum links") ||
    z.includes("venstre back") ||
    z.includes("arriere gauche") ||
    z.includes("arrière gauche") ||
    z.includes("lewe rozegranie")
  ) {
    return t ? t("mesa_control.court_zones.left_back_9m") : "9m lateral izquierdo";
  }

  // 9M Central
  if (
    z.includes("9m central") ||
    z.includes("9m cen") ||
    z.includes("center back") ||
    z.includes("centre back") ||
    z.includes("rückraum mitte") ||
    z.includes("ruckraum mitte") ||
    z.includes("demi-centre") ||
    z.includes("playmaker") ||
    z.includes("środek rozegrania") ||
    z.includes("srodek rozegrania")
  ) {
    return t ? t("mesa_control.court_zones.center_back_9m") : "9m central";
  }

  // Extremo Derecho
  if (
    z.includes("extremo der") ||
    z.includes("right wing") ||
    z.includes("rechtsaußen") ||
    z.includes("rechtsaussen") ||
    z.includes("højre fløj") ||
    z.includes("hojre floj") ||
    z.includes("ailier droit") ||
    z.includes("prawe skrzydło") ||
    z.includes("prawe skrzydlo")
  ) {
    return t ? t("mesa_control.court_zones.right_wing") : "extremo derecho";
  }

  // Extremo Izquierdo
  if (
    z.includes("extremo izq") ||
    z.includes("left wing") ||
    z.includes("linksaußen") ||
    z.includes("linksaussen") ||
    z.includes("venstre fløj") ||
    z.includes("venstre floj") ||
    z.includes("ailier gauche") ||
    z.includes("lewe skrzydło") ||
    z.includes("lewe skrzydlo")
  ) {
    return t ? t("mesa_control.court_zones.left_wing") : "extremo izquierdo";
  }

  // Pivote 6M
  if (
    z.includes("pivote") ||
    z.includes("pivot") ||
    z.includes("kreisläufer") ||
    z.includes("kreislaufer") ||
    z.includes("streghold") ||
    z.includes("kołowy") ||
    z.includes("kolowy")
  ) {
    return t ? t("mesa_control.court_zones.pivot_6m") : "pivote 6m";
  }

  // Penetración
  if (
    z.includes("penetración") ||
    z.includes("penetracion") ||
    z.includes("breakthrough") ||
    z.includes("durchbruch")
  ) {
    if (z.includes("izq") || z.includes("left") || z.includes("links") || z.includes("gauche") || z.includes("venstre") || z.includes("lewa")) {
      return t ? t("mesa_control.court_zones.penetration_left", "Penetración Izquierda") : "penetración izquierda";
    }
    if (z.includes("der") || z.includes("right") || z.includes("rechts") || z.includes("droite") || z.includes("højre") || z.includes("hojre") || z.includes("prawa")) {
      return t ? t("mesa_control.court_zones.penetration_right", "Penetración Derecha") : "penetración derecha";
    }
    return t ? t("mesa_control.court_zones.penetration_6m") : "penetración 6m";
  }

  // Contraataque / Transición rápida
  if (
    z.includes("contraataque") ||
    z.includes("1ª oleada") ||
    z.includes("1a oleada") ||
    z.includes("fast break") ||
    z.includes("fastbreak") ||
    z.includes("contre-attaque") ||
    z.includes("tempogegenstoß") ||
    z.includes("tempogegenstoss") ||
    z.includes("kontratak")
  ) {
    if (z.includes("izq") || z.includes("left") || z.includes("links") || z.includes("gauche") || z.includes("venstre") || z.includes("lewa")) {
      return t ? t("mesa_control.court_zones.fastbreak_left", "Contraataque Izquierdo") : "contraataque izquierdo";
    }
    if (z.includes("der") || z.includes("right") || z.includes("rechts") || z.includes("droite") || z.includes("højre") || z.includes("hojre") || z.includes("prawa")) {
      return t ? t("mesa_control.court_zones.fastbreak_right", "Contraataque Derecho") : "contraataque derecho";
    }
    return t ? t("mesa_control.court_zones.fastbreak_center") : "contraataque 6m";
  }

  // 7 Metros
  if (
    z.includes("7 metros") ||
    z.includes("7metros") ||
    z.includes("7 metros") ||
    z.includes("7m") ||
    z.includes("penalty") ||
    z.includes("strafwurf") ||
    z.includes("karny")
  ) {
    return t ? t("mesa_control.court_zones.penalty_7m") : "7 metros";
  }

  // Área de portería (sin posición)
  if (
    z.includes("área de portería") ||
    z.includes("area de porteria") ||
    z.includes("goal area") ||
    z.includes("torraum") ||
    z.includes("målfelt") ||
    z.includes("malfelt") ||
    z.includes("pole bramkowe")
  ) {
    return t ? t("mesa_control.court_zones.d_zone", "Área de Portería (Sin Posición)") : "área de portería";
  }

  return zoneStr.toLowerCase();
}

/**
 * Formatea la zona de llegada a gol/portería en el idioma activo.
 * Soporta abreviaturas (TL, TR, ML, etc.) y cadenas en cualquiera de los 6 idiomas.
 */
export function formatGoalZoneName(zoneStr, t) {
  if (!zoneStr) return "";

  const z = zoneStr.toLowerCase().trim();

  // Escuadras / Arriba Izquierda
  if (
    z === "tl" ||
    z.includes("escuadra sup. izq") ||
    z.includes("sup. izq") ||
    z.includes("superior izq") ||
    z.includes("top left") ||
    z.includes("haut gauche") ||
    z.includes("øverst til venstre") ||
    z.includes("overst til venstre") ||
    z.includes("oben links") ||
    z.includes("góra lewa") ||
    z.includes("gora lewa")
  ) {
    return t ? t("mesa_control.goal_zones.top_left") : "arriba a la izquierda";
  }

  // Escuadras / Arriba Derecha
  if (
    z === "tr" ||
    z.includes("escuadra sup. der") ||
    z.includes("sup. der") ||
    z.includes("superior der") ||
    z.includes("top right") ||
    z.includes("haut droit") ||
    z.includes("øverst til højre") ||
    z.includes("overst til hojre") ||
    z.includes("oben rechts") ||
    z.includes("góra prawa") ||
    z.includes("gora prawa")
  ) {
    return t ? t("mesa_control.goal_zones.top_right") : "arriba a la derecha";
  }

  // Superior Centro
  if (
    z === "tc" ||
    z.includes("superior cen") ||
    z.includes("sup. cen") ||
    z.includes("superior centro") ||
    z.includes("top center") ||
    z.includes("haut centre") ||
    z.includes("øverst i midten") ||
    z.includes("overst i midten") ||
    z.includes("oben mitte") ||
    z.includes("góra środek") ||
    z.includes("gora srodek")
  ) {
    return t ? t("mesa_control.goal_zones.top_center") : "arriba al centro";
  }

  // Medio Izquierda
  if (
    z === "ml" ||
    z.includes("medio izq") ||
    z.includes("med. izq") ||
    z.includes("mid left") ||
    z.includes("middle left") ||
    z.includes("milieu gauche") ||
    z.includes("midt til venstre") ||
    z.includes("mitte links") ||
    z.includes("środek lewa") ||
    z.includes("srodek lewa")
  ) {
    return t ? t("mesa_control.goal_zones.mid_left") : "medio a la izquierda";
  }

  // Medio Derecha
  if (
    z === "mr" ||
    z.includes("medio der") ||
    z.includes("med. der") ||
    z.includes("mid right") ||
    z.includes("middle right") ||
    z.includes("milieu droit") ||
    z.includes("midt til højre") ||
    z.includes("midt til hojre") ||
    z.includes("mitte rechts") ||
    z.includes("środek prawa") ||
    z.includes("srodek prawa")
  ) {
    return t ? t("mesa_control.goal_zones.mid_right") : "medio a la derecha";
  }

  // Centro Portería
  if (
    z === "c" ||
    z === "centro" ||
    z === "center" ||
    z === "centre" ||
    z === "mitte" ||
    z === "midten" ||
    z === "środek" ||
    z === "srodek" ||
    z.includes("centro portería") ||
    z.includes("centro porteria")
  ) {
    return t ? t("mesa_control.goal_zones.center") : "al centro";
  }

  // Inferior Izquierda
  if (
    z === "bl" ||
    z.includes("inferior izq") ||
    z.includes("inf. izq") ||
    z.includes("bottom left") ||
    z.includes("bas gauche") ||
    z.includes("nederst til venstre") ||
    z.includes("unten links") ||
    z.includes("dół lewa") ||
    z.includes("dol lewa")
  ) {
    return t ? t("mesa_control.goal_zones.bottom_left") : "abajo a la izquierda";
  }

  // Inferior Derecha
  if (
    z === "br" ||
    z.includes("inferior der") ||
    z.includes("inf. der") ||
    z.includes("bottom right") ||
    z.includes("bas droit") ||
    z.includes("nederst til højre") ||
    z.includes("nederst til hojre") ||
    z.includes("unten rechts") ||
    z.includes("dół prawa") ||
    z.includes("dol prawa")
  ) {
    return t ? t("mesa_control.goal_zones.bottom_right") : "abajo a la derecha";
  }

  // Inferior Centro
  if (
    z === "bc" ||
    z.includes("inferior cen") ||
    z.includes("inf. cen") ||
    z.includes("inferior centro") ||
    z.includes("bottom center") ||
    z.includes("bas centre") ||
    z.includes("nederst i midten") ||
    z.includes("unten mitte") ||
    z.includes("dół środek") ||
    z.includes("dol srodek")
  ) {
    return t ? t("mesa_control.goal_zones.bottom_center") : "abajo al centro";
  }

  // Postes / Larguero
  if (
    z === "tp" ||
    z.includes("larguero") ||
    z.includes("crossbar") ||
    z.includes("latte") ||
    z.includes("overligger") ||
    z.includes("poprzeczka")
  ) {
    return t ? t("mesa_control.goal_zones.crossbar") : "larguero";
  }

  if (
    z === "lp" ||
    z.includes("poste izq") ||
    z.includes("left post") ||
    z.includes("poteau gauche") ||
    z.includes("pfosten links") ||
    z.includes("venstre stolpe") ||
    z.includes("lewy słupek") ||
    z.includes("lewy slupek")
  ) {
    return t ? t("mesa_control.goal_zones.left_post") : "poste izquierdo";
  }

  if (
    z === "rp" ||
    z.includes("poste der") ||
    z.includes("right post") ||
    z.includes("poteau droit") ||
    z.includes("pfosten rechts") ||
    z.includes("højre stolpe") ||
    z.includes("hojre stolpe") ||
    z.includes("prawy słupek") ||
    z.includes("prawy slupek")
  ) {
    return t ? t("mesa_control.goal_zones.right_post") : "poste derecho";
  }

  // Fuera
  if (
    z === "oa" ||
    z.includes("fuera arr") ||
    z.includes("high out") ||
    z.includes("au dessus") ||
    z.includes("au-dessus") ||
    z.includes("over målet") ||
    z.includes("over malet") ||
    z.includes("drüber") ||
    z.includes("druber") ||
    z.includes("nad bramką") ||
    z.includes("nad bramka")
  ) {
    return t ? t("mesa_control.goal_zones.high_out") : "fuera arriba";
  }

  if (
    z === "ol" ||
    z.includes("fuera izq") ||
    z.includes("wide left") ||
    z.includes("à côté à gauche") ||
    z.includes("a cote a gauche") ||
    z.includes("forbi til venstre") ||
    z.includes("links vorbei") ||
    z.includes("obok lewego")
  ) {
    return t ? t("mesa_control.goal_zones.wide_left") : "fuera a la izquierda";
  }

  if (
    z === "or" ||
    z.includes("fuera der") ||
    z.includes("wide right") ||
    z.includes("à côté à droite") ||
    z.includes("a cote a droite") ||
    z.includes("forbi til højre") ||
    z.includes("forbi til hojre") ||
    z.includes("rechts vorbei") ||
    z.includes("obok prawego")
  ) {
    return t ? t("mesa_control.goal_zones.wide_right") : "fuera a la derecha";
  }

  if (
    z.includes("fuera") ||
    z.includes("out") ||
    z.includes("dehors") ||
    z.includes("forbi") ||
    z.includes("vorbei") ||
    z.includes("obok")
  ) {
    return t ? t("mesa_control.action_fuera") : "fuera";
  }

  return zoneStr.toLowerCase();
}
