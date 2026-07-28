/* ==========================================================
   HANDSTATS ANALYTICS — EXPECTED GOALS (xG) & SAVES (xSaves) MODEL
   Modelo estadístico probabilístico de probabilidad de gol y paradas
   Con soporte para autocalibración empírica por zonas 3x3 (+25% volumen)
   Fórmula xSaves = (1 - xG) + ModificadorZonaXSaves(z)
   ========================================================== */

import { getSettings } from "../../services/settingsService";

/**
 * Calcula el valor xG (Expected Goals) para un evento de tiro específico.
 * @param {Object} event - Objeto del evento de tiro
 * @param {Object} empiricalOverride - Objeto con pesos y modificadores empíricos de zona (opcional)
 * @returns {number} Valor entre 0.05 y 0.95
 */
export function calculateShotXG(event, empiricalOverride = null) {
  if (!event || event.event_type !== "shot") return 0;

  const settings = getSettings();
  const shotType = (event.shot_type || "").toLowerCase();
  const phase = (event.play_phase || "").toLowerCase();
  const sit = event.numerical_situation || "Igualdad";
  const zone = event.target_zone || "";

  // Determinar probabilidades a usar (empíricas si están activas o configuradas)
  const activeWeights = (settings.autoEmpiricalMode && empiricalOverride?.empiricalWeights)
    ? empiricalOverride.empiricalWeights
    : settings;

  let baseProbability = 0.45; // Base promedio general

  // 1. Probabilidad base por tipo de tiro / fase según configuración o autocalibración
  if (shotType.includes("7m") || shotType.includes("7 metros") || event.sanction_type === "7m") {
    baseProbability = activeWeights.xg7m;
  } else if (phase.includes("1ª oleada") || phase.includes("contraataque") || shotType.includes("contra")) {
    baseProbability = activeWeights.xgCounter;
  } else if (phase.includes("2ª oleada")) {
    baseProbability = activeWeights.xgCounter * 0.85;
  } else if (shotType.includes("pivote")) {
    baseProbability = activeWeights.xgPivot;
  } else if (shotType.includes("penetración") || shotType.includes("penetracion")) {
    baseProbability = activeWeights.xgPenetration;
  } else if (shotType.includes("extremo")) {
    baseProbability = activeWeights.xgWing;
  } else if (shotType.includes("exterior") || shotType.includes("9m")) {
    baseProbability = activeWeights.xg9m;
  }

  // 2. Modificador por situación numérica según configuración
  if (sit === "Superioridad") {
    baseProbability += settings.xgSuperiorityBonus;
  } else if (sit === "Inferioridad") {
    baseProbability -= settings.xgInferiorityPenalty;
  }

  // 3. Modificador por zona de destino en portería (calculado automáticamente según datos reales)
  if (zone) {
    if (settings.autoEmpiricalMode && empiricalOverride?.zoneModifiers && empiricalOverride.zoneModifiers[zone] !== undefined) {
      baseProbability += empiricalOverride.zoneModifiers[zone];
    } else if (zone === "TL" || zone === "TR" || zone === "BL" || zone === "BR") {
      baseProbability += 0.06;
    } else if (zone === "C" || zone === "BC" || zone === "TC") {
      baseProbability -= 0.06;
    }
  }

  return Math.min(0.95, Math.max(0.05, Math.round(baseProbability * 100) / 100));
}

/**
 * Calcula los Expected Saves (xSaves) para un tiro a puerta.
 * xSaves = (1 - xG) + ModificadorZonaXSaves(z)
 */
export function calculateShotXSaves(event, empiricalOverride = null) {
  if (!event || event.event_type !== "shot") return 0;
  const settings = getSettings();
  const zone = event.target_zone || "";
  const xg = calculateShotXG(event, empiricalOverride);

  let rawXSaves = (1 - xg) * settings.xSavesBaseFactor;

  // Si la calibración empírica está activa y existe un modificador por zona 3x3 para la portería:
  if (zone && settings.autoEmpiricalMode && empiricalOverride?.zoneXSavesModifiers && empiricalOverride.zoneXSavesModifiers[zone] !== undefined) {
    rawXSaves = (1 - xg) + empiricalOverride.zoneXSavesModifiers[zone];
  }

  return Math.min(0.95, Math.max(0.05, Math.round(rawXSaves * 100) / 100));
}
