/* ==========================================================
   HANDSTATS ANALYTICS — SETTINGS SERVICE
   Gestor de parámetros configurables para xG, xSaves, alertas, ritmo y rating
   Con soporte de autocalibración empírica por tiros, paradas y modificador zonal de portería 3x3
   ========================================================== */

export const DEFAULT_SETTINGS = {
  // Modo de calibración empírica automática (activado por defecto al alcanzar 500 tiros)
  autoEmpiricalMode: true,

  // 1. xGoals (Expected Goals)
  xg7m: 0.75,
  xgCounter: 0.80,
  xgPivot: 0.72,
  xgPenetration: 0.64,
  xgWing: 0.56,
  xg9m: 0.34,
  xgEmptyNet: 0.40,
  xgSuperiorityBonus: 0.07,
  xgInferiorityPenalty: 0.08,

  // 2. xSaves (Expected Saves)
  xSavesBaseFactor: 1.0,

  // 3. Umbrales de Alertas
  thresholdLowOffEff: 42,
  thresholdHighOffEff: 60,
  thresholdGkWallPct: 35,
  thresholdGkStrugglePct: 22,
  thresholdTurnoverStreak: 2,
  thresholdExclusions: 2,

  // 4. Ritmo de Juegos y Análisis de Posesiones
  fastPossessionSecs: 20,
  slowPossessionSecs: 40,
  targetPossessionsPerMatch: 50,

  // 5. Acciones y Valoraciones para Rating (Modelo xG + NPS + Normalización Logística centrada en 5.0)
  sigmoidK: 0.35,
  neutralRating: 5.0,

  // Pesos de Lanzamientos de Ataque
  w_goal: 1.50,
  w_miss_saved: 1.20,
  w_miss_off: 1.40,

  // Pesos de Acciones Favorables en Ataque
  w_drawn_7m: 1.10,

  // Pesos de Pérdidas de Balón
  w_turnover_bad_pass: 1.00,
  w_turnover_double: 0.80,
  w_turnover_travel: 0.80,
  w_turnover_passive: 0.90,
  w_turnover_offensive_foul: 1.10,

  // Pesos de Acciones Defensivas
  w_def_free_throw: 0.30,
  w_def_drawn_off_foul: 1.10,
  w_def_committed_7m: 1.10,

  // Pesos de Portería
  w_gk_save: 1.50,
  w_gk_conceded: 1.00,

  // Pesos Disciplinarios
  w_yellow_card: 0.40,
  w_two_min: 1.20,
  w_red_card: 2.50,

  // Campos legacy para retrocompatibilidad
  ratingBase: 5.0,
  ratingGoalValue: 0.4,
  ratingStealValue: 0.5,
  ratingTurnoverPenalty: 0.4,
  rating2MinPenalty: 0.3,
  ratingGkSaveValue: 0.6,
  ratingGkXSaveValue: 0.8,
  ratingGkConcededPenalty: 0.2
};

const STORAGE_KEY = "handstats_settings";

export const getSettings = () => {
  try {
    if (typeof localStorage === "undefined") return { ...DEFAULT_SETTINGS };
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(saved);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch (e) {
    console.error("Error al cargar ajustes de parámetros:", e);
    return { ...DEFAULT_SETTINGS };
  }
};

export const saveSettings = (newSettings) => {
  try {
    const merged = { ...DEFAULT_SETTINGS, ...newSettings };
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    }
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("handstats_settings_updated"));
    }
    return merged;
  } catch (e) {
    console.error("Error al guardar ajustes de parámetros:", e);
    return getSettings();
  }
};

export const resetSettings = () => {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
    }
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("handstats_settings_updated"));
    }
    return { ...DEFAULT_SETTINGS };
  } catch (e) {
    console.error("Error al restablecer ajustes:", e);
    return { ...DEFAULT_SETTINGS };
  }
};

/**
 * Normaliza cualquier formato de zona de portería (código ID 'TL', descripciones de texto o coordenadas)
 * a uno de los 9 cuadrantes 3x3 de portería: TL, TC, TR, ML, C, MR, BL, BC, BR.
 * @param {Object|string} evOrZone - Evento de tiro o cadena de zona
 * @returns {string|null} Código de zona 3x3 normalizado o null si no aplica
 */
export function normalizeGoalZoneKey(evOrZone) {
  if (!evOrZone) return null;

  let raw = "";
  let coord = null;

  if (typeof evOrZone === "string") {
    raw = evOrZone.trim();
  } else if (typeof evOrZone === "object") {
    raw = String(evOrZone.target_zone_id || evOrZone.target_zone || evOrZone.goal_zone || "").trim();
    if (evOrZone.goal_x !== undefined && evOrZone.goal_x !== null && evOrZone.goal_y !== undefined && evOrZone.goal_y !== null) {
      coord = { x: Number(evOrZone.goal_x), y: Number(evOrZone.goal_y) };
    } else if (evOrZone.goal_coord && typeof evOrZone.goal_coord.x === "number") {
      coord = { x: Number(evOrZone.goal_coord.x), y: Number(evOrZone.goal_coord.y) };
    }
  }

  const valid9Zones = ["TL", "TC", "TR", "ML", "C", "MR", "BL", "BC", "BR"];
  const upper = raw.toUpperCase();

  // 1. Si ya es una de las 9 zonas
  if (valid9Zones.includes(upper)) {
    return upper;
  }

  // 2. Mapeo de códigos exteriores/postes hacia la zona más cercana
  if (upper === "TP" || upper === "OA") {
    if (coord && coord.x < 38) return "TL";
    if (coord && coord.x > 62) return "TR";
    return "TC";
  }
  if (upper === "LP" || upper === "OL") {
    if (coord && coord.y < 45) return "TL";
    if (coord && coord.y >= 75) return "BL";
    return "ML";
  }
  if (upper === "RP" || upper === "OR") {
    if (coord && coord.y < 45) return "TR";
    if (coord && coord.y >= 75) return "BR";
    return "MR";
  }

  // 3. Si hay coordenadas numéricas (goal_x, goal_y en escala 0-100)
  if (coord && !isNaN(coord.x) && !isNaN(coord.y)) {
    const isLeft = coord.x < 38;
    const isRight = coord.x > 62;
    if (coord.y <= 45) {
      return isLeft ? "TL" : isRight ? "TR" : "TC";
    }
    if (coord.y < 75) {
      return isLeft ? "ML" : isRight ? "MR" : "C";
    }
    return isLeft ? "BL" : isRight ? "BR" : "BC";
  }

  // 4. Reconocimiento semántico por texto
  const lower = raw.toLowerCase();

  const isLeft = lower.includes("izq") || lower.includes("left");
  const isRight = lower.includes("der") || lower.includes("right");
  const isCenter = lower.includes("cen") || lower.includes("centro") || lower.includes("center");

  // Superior / Escuadras
  if (lower.includes("sup") || lower.includes("escuadra") || lower.includes("arriba") || lower.includes("top") || lower.includes("high")) {
    if (isLeft) return "TL";
    if (isRight) return "TR";
    return "TC";
  }

  // Inferior / Raso / Abajo
  if (lower.includes("inf") || lower.includes("raso") || lower.includes("abajo") || lower.includes("bot") || lower.includes("low")) {
    if (isLeft) return "BL";
    if (isRight) return "BR";
    return "BC";
  }

  // Medio
  if (lower.includes("med") || lower.includes("mid")) {
    if (isLeft) return "ML";
    if (isRight) return "MR";
    return "C";
  }

  // Postes y larguero por texto
  if (lower.includes("larguero") || lower.includes("crossbar")) return "TC";
  if (lower.includes("poste izq") || lower.includes("left post")) return "ML";
  if (lower.includes("poste der") || lower.includes("right post")) return "MR";
  if (lower.includes("fuera arr")) return "TC";
  if (lower.includes("fuera izq")) return "ML";
  if (lower.includes("fuera der")) return "MR";

  if (isCenter || lower === "c" || lower.includes("centro")) {
    return "C";
  }

  return null;
}

/**
 * Calcula la calibración empírica basada en el volumen de lanzamientos, paradas y modificador zonal de portería 3x3.
 * Requisito: >= 500 tiros para activación inicial.
 * Recalibrado automático proporcional cada vez que el volumen de tiros crece un +25% respecto a la recarga anterior.
 * Secuencia de hitos: 500 -> 625 -> 782 -> 977 -> 1221 -> 1526...
 * Fórmula xSaves: xSaves(z) = (1 - xG) + ModificadorZonaXSaves(z)
 * donde ModificadorZonaXSaves(z) = TasaParadasReal(z) - TasaParadasGlobalPortería
 */
export function calculateUserEmpiricalXG(matchesList = []) {
  let totalShots = 0;
  let totalShotsWithZone = 0;
  let totalGoalsWithZone = 0;

  const counts = {
    "7m": { name: "Penalti 7m", shots: 0, goals: 0 },
    counter: { name: "Contraataque / 1ª Oleada", shots: 0, goals: 0 },
    pivot: { name: "Pivote (6m)", shots: 0, goals: 0 },
    penetration: { name: "Penetración (6m)", shots: 0, goals: 0 },
    wing: { name: "Extremo (6m)", shots: 0, goals: 0 },
    "9m": { name: "Primera Línea / 9m", shots: 0, goals: 0 },
    emptyNet: { name: "Portería Vacía", shots: 0, goals: 0 },
  };

  const zoneCounts = {
    TL: { name: "Superior Izquierda", shots: 0, goals: 0 },
    TC: { name: "Superior Centro", shots: 0, goals: 0 },
    TR: { name: "Superior Derecha", shots: 0, goals: 0 },
    ML: { name: "Media Izquierda", shots: 0, goals: 0 },
    C: { name: "Centro", shots: 0, goals: 0 },
    MR: { name: "Media Derecha", shots: 0, goals: 0 },
    BL: { name: "Inferior Izquierda", shots: 0, goals: 0 },
    BC: { name: "Inferior Centro", shots: 0, goals: 0 },
    BR: { name: "Inferior Derecha", shots: 0, goals: 0 },
  };

  (matchesList || []).forEach((m) => {
    const events = m.events || [];
    events.forEach((ev) => {
      if (ev.event_type === "shot") {
        totalShots += 1;
        const type = (ev.shot_type || "").toLowerCase();
        const phase = (ev.play_phase || "").toLowerCase();
        const isGoal = ev.result === "Gol";

        let category = "9m";
        const rawZone = (ev.shot_zone || ev.court_zone || "").toLowerCase();
        const rawSit = (ev.numerical_situation || ev.tactical_situation || "").toLowerCase();
        const rawDefSit = (ev.defending_situation || "").toLowerCase();
        const isEmptyNet = Boolean(
          ev.is_empty_net ||
          ev.empty_net_goal ||
          type.includes("portería vacía") ||
          type.includes("porteria vacia") ||
          type.includes("empty_net") ||
          type.includes("p. vacía") ||
          type.includes("p. vacia") ||
          phase.includes("portería vacía") ||
          phase.includes("porteria vacia") ||
          rawZone.includes("portería vacía") ||
          rawZone.includes("porteria vacia") ||
          rawSit.includes("portería vacía") ||
          rawSit.includes("porteria vacia") ||
          rawDefSit.includes("portería vacía") ||
          rawDefSit.includes("porteria vacia")
        );

        if (isEmptyNet) {
          category = "emptyNet";
        } else if (type.includes("7m") || type.includes("7 metros") || ev.sanction_type === "7m") {
          category = "7m";
        } else if (phase.includes("1ª oleada") || phase.includes("contraataque") || type.includes("contra")) {
          category = "counter";
        } else if (type.includes("pivote")) {
          category = "pivot";
        } else if (type.includes("penetración") || type.includes("penetracion")) {
          category = "penetration";
        } else if (type.includes("extremo")) {
          category = "wing";
        } else if (type.includes("exterior") || type.includes("9m")) {
          category = "9m";
        }

        counts[category].shots += 1;
        if (isGoal) counts[category].goals += 1;

        // Normalización unificada de zona de destino en portería
        const goalZoneKey = normalizeGoalZoneKey(ev);
        if (goalZoneKey && zoneCounts[goalZoneKey]) {
          totalShotsWithZone += 1;
          zoneCounts[goalZoneKey].shots += 1;
          if (isGoal) {
            totalGoalsWithZone += 1;
            zoneCounts[goalZoneKey].goals += 1;
          }
        }
      }
    });
  });

  const globalZoneGoalRate = totalShotsWithZone > 0 ? totalGoalsWithZone / totalShotsWithZone : 0.60;
  const globalZoneSaveRate = 1 - globalZoneGoalRate;

  // 1. Modificadores por zona 3x3 de xG
  const zoneModifiers = {};
  Object.keys(zoneCounts).forEach((zKey) => {
    const zData = zoneCounts[zKey];
    if (zData.shots > 0) {
      const zGoalRate = zData.goals / zData.shots;
      zoneModifiers[zKey] = Math.round((zGoalRate - globalZoneGoalRate) * 100) / 100;
    } else {
      zoneModifiers[zKey] = 0.0;
    }
  });

  // 2. Modificadores por zona 3x3 de xSaves: ModificadorZonaXSaves(z) = TasaParadasReal(z) - TasaParadasGlobalPortería
  const zoneXSavesModifiers = {};
  const zoneXSaves = {};

  Object.keys(zoneCounts).forEach((zKey) => {
    const zData = zoneCounts[zKey];
    const zSaveRate = zData.shots > 0 ? (zData.shots - zData.goals) / zData.shots : globalZoneSaveRate;
    const modXSaves = Math.round((zSaveRate - globalZoneSaveRate) * 100) / 100;
    zoneXSavesModifiers[zKey] = modXSaves;

    // xSaves = (1 - xG_zona) = (1 - (globalZoneGoalRate + zoneModifiers[zKey]))
    const xgZone = Math.min(0.95, Math.max(0.05, globalZoneGoalRate + (zoneModifiers[zKey] || 0)));
    const calcXSaves = (1 - xgZone) + modXSaves;
    zoneXSaves[zKey] = Math.min(0.95, Math.max(0.05, Math.round(calcXSaves * 100) / 100));
  });

  const isEligible = totalShots >= 500;

  // Próximo punto de control de recarga (+25% respecto a la recarga previa): 500, 625, 782, 977, 1221...
  let nextCheckpoint = 500;
  if (isEligible) {
    const k = Math.floor(Math.log(totalShots / 500) / Math.log(1.25));
    nextCheckpoint = Math.ceil(500 * Math.pow(1.25, k + 1));
  }
  const shotsUntilNextRecalc = Math.max(0, nextCheckpoint - totalShots);

  const empiricalWeights = {
    xg7m: counts["7m"].shots > 0 ? Math.round((counts["7m"].goals / counts["7m"].shots) * 100) / 100 : 0.75,
    xgCounter: counts.counter.shots > 0 ? Math.round((counts.counter.goals / counts.counter.shots) * 100) / 100 : 0.80,
    xgPivot: counts.pivot.shots > 0 ? Math.round((counts.pivot.goals / counts.pivot.shots) * 100) / 100 : 0.72,
    xgPenetration: counts.penetration.shots > 0 ? Math.round((counts.penetration.goals / counts.penetration.shots) * 100) / 100 : 0.64,
    xgWing: counts.wing.shots > 0 ? Math.round((counts.wing.goals / counts.wing.shots) * 100) / 100 : 0.56,
    xg9m: counts["9m"].shots > 0 ? Math.round((counts["9m"].goals / counts["9m"].shots) * 100) / 100 : 0.34,
    xgEmptyNet: counts.emptyNet?.shots > 0 ? Math.round((counts.emptyNet.goals / counts.emptyNet.shots) * 100) / 100 : 0.40,
  };

  return {
    totalShots,
    totalShotsWithZone,
    isEligible,
    nextCheckpoint,
    shotsUntilNextRecalc,
    counts,
    zoneCounts,
    globalZoneGoalRate,
    globalZoneSaveRate,
    zoneModifiers,
    zoneXSavesModifiers,
    zoneXSaves,
    empiricalWeights,
  };
}
