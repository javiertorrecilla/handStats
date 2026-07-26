/* ==========================================================
   HANDSTATS ANALYTICS — EXPECTED GOALS (xG) MODEL
   Modelo estadístico probabilístico de probabilidad de gol
   ========================================================== */

/**
 * Calcula el valor xG (Expected Goals) para un evento de tiro específico.
 * @param {Object} event - Objeto del evento de tiro
 * @returns {number} Valor entre 0.05 y 0.95
 */
export function calculateShotXG(event) {
  if (!event || event.event_type !== "shot") return 0;

  const shotType = (event.shot_type || "").toLowerCase();
  const phase = event.play_phase || "";
  const sit = event.numerical_situation || "Igualdad";
  const zone = event.target_zone || "";

  let baseProbability = 0.45; // Base promedio general

  // 1. Probabilidad base por tipo de tiro / fase
  if (shotType.includes("7m") || shotType.includes("7 metros") || event.sanction_type === "7m") {
    baseProbability = 0.75;
  } else if (phase.includes("1ª Oleada") || phase.includes("Contraataque") || shotType.includes("contra")) {
    baseProbability = 0.80;
  } else if (phase.includes("2ª Oleada")) {
    baseProbability = 0.68;
  } else if (shotType.includes("pivote")) {
    baseProbability = 0.72;
  } else if (shotType.includes("penetración") || shotType.includes("penetracion")) {
    baseProbability = 0.64;
  } else if (shotType.includes("extremo")) {
    baseProbability = 0.56;
  } else if (shotType.includes("exterior") || shotType.includes("9m")) {
    baseProbability = 0.34;
  }

  // 2. Modificador por situación numérica
  if (sit === "Superioridad") {
    baseProbability += 0.07;
  } else if (sit === "Inferioridad") {
    baseProbability -= 0.08;
  }

  // 3. Modificador por zona de destino en portería (si está registrada)
  if (zone === "TL" || zone === "TR" || zone === "BL" || zone === "BR") {
    baseProbability += 0.06;
  } else if (zone === "C" || zone === "BC" || zone === "TC") {
    baseProbability -= 0.06;
  }

  return Math.min(0.95, Math.max(0.05, Math.round(baseProbability * 100) / 100));
}

/**
 * Calcula los Expected Saves (xSaves) para un tiro a puerta.
 * xSaves = 1 - xG
 */
export function calculateShotXSaves(event) {
  const xg = calculateShotXG(event);
  return Math.round((1 - xg) * 100) / 100;
}
