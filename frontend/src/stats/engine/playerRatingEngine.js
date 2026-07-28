/**
 * playerRatingEngine.js
 * Módulo para el cálculo de la nota individual de jugadores (Rating 0.0 - 10.0) en HandStats.
 * 
 * Basado en:
 * - Impacto Neto del Jugador (Net Performance Score - NPS)
 * - Probabilidad esperada de gol (xG) y parada (xSaves)
 * - Acciones defensivas (Golpe Franco, Falta en ataque provocada, 7m cometido)
 * - Pérdidas segmentadas (Mal Pase, Dobles, Pasos, Pasivo, Falta en ataque)
 * - Disciplina (Tarjeta Amarilla, 2 Minutos, Tarjeta Roja)
 * - Normalización Logística (Sigmoide) centrada en 5.0 para partidos neutros
 */

import { calculateShotXG } from "./xgModel";

export const DEFAULT_RATING_CONFIG = {
  // Parámetros de Escala y Normalización
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
};

export class PlayerRatingCalculator {
  constructor(customConfig = {}) {
    this.config = { ...DEFAULT_RATING_CONFIG, ...customConfig };
  }

  /**
   * Calcula el Rating individual (0.0 - 10.0) a partir de los datos acumulados del jugador.
   * 
   * @param {Object} data
   * @param {Array} data.shots - Lanzamientos de ataque [{ result: "Gol"|"Parada"|"Fuera"|"Poste", xg: 0.45 }]
   * @param {number} data.drawn7mCount - Veces que ha provocado penalti de 7m en ataque
   * @param {Object} data.turnovers - Pérdidas { badPass, double, travel, passive, offensiveFoul }
   * @param {Object} data.defense - Acciones defensivas { freeThrowsDrawn, offFoulsDrawn, penaltiesCommitted }
   * @param {Array} data.gkShotsFaced - Lanzamientos recibidos en portería [{ result: "Gol"|"Parada", xg: 0.45 }]
   * @param {Object} data.discipline - Sanciones { yellowCards, twoMinSuspensions, redCards }
   * @param {boolean} isGoalkeeper - Si actúa como portero principal
   * @returns {Object} { nps, rating, breakdown }
   */
  calculateRating(data = {}, isGoalkeeper = false) {
    const cfg = this.config;
    let posNPS = 0;
    let negNPS = 0;

    const breakdown = {
      shotsImpact: 0,
      drawn7mImpact: 0,
      turnoversImpact: 0,
      defenseImpact: 0,
      gkImpact: 0,
      disciplineImpact: 0,
    };

    // 1. LANZAMIENTOS DE ATAQUE
    if (!isGoalkeeper) {
      const shots = data.shots || [];
      shots.forEach((shot) => {
        const xG = typeof shot.xg === "number" ? shot.xg : calculateShotXG(shot);
        if (shot.result === "Gol") {
          const val = cfg.w_goal * (1 - xG);
          posNPS += val;
          breakdown.shotsImpact += val;
        } else if (shot.result === "Parada") {
          const pen = cfg.w_miss_saved * xG;
          negNPS += pen;
          breakdown.shotsImpact -= pen;
        } else {
          // Fuera / Poste
          const pen = cfg.w_miss_off * xG;
          negNPS += pen;
          breakdown.shotsImpact -= pen;
        }
      });
    }

    // 2. PROVOCAR 7M EN ATAQUE
    const drawn7m = data.drawn7mCount || 0;
    if (drawn7m > 0) {
      const val = cfg.w_drawn_7m * drawn7m;
      posNPS += val;
      breakdown.drawn7mImpact += val;
    }

    // 3. PÉRDIDAS DE BALÓN SEGMENTADAS
    const t = data.turnovers || {};
    const badPassPen = (t.badPass || 0) * cfg.w_turnover_bad_pass;
    const doublePen = (t.double || 0) * cfg.w_turnover_double;
    const travelPen = (t.travel || 0) * cfg.w_turnover_travel;
    const passivePen = (t.passive || 0) * cfg.w_turnover_passive;
    const offFoulPen = (t.offensiveFoul || 0) * cfg.w_turnover_offensive_foul;

    const totalTurnoverPen = badPassPen + doublePen + travelPen + passivePen + offFoulPen;
    negNPS += totalTurnoverPen;
    breakdown.turnoversImpact -= totalTurnoverPen;

    // 4. ACCIONES DEFENSIVAS
    const def = data.defense || {};
    const freeThrowsVal = (def.freeThrowsDrawn || 0) * cfg.w_def_free_throw;
    const offFoulsDrawnVal = (def.offFoulsDrawn || 0) * cfg.w_def_drawn_off_foul;
    const penaltiesCommittedPen = (def.penaltiesCommitted || 0) * cfg.w_def_committed_7m;

    posNPS += freeThrowsVal + offFoulsDrawnVal;
    negNPS += penaltiesCommittedPen;
    breakdown.defenseImpact += (freeThrowsVal + offFoulsDrawnVal - penaltiesCommittedPen);

    // 5. ACTUACIÓN DE PORTERÍA
    if (isGoalkeeper || (data.gkShotsFaced && data.gkShotsFaced.length > 0)) {
      const gkShots = data.gkShotsFaced || [];
      gkShots.forEach((shot) => {
        const xG = typeof shot.xg === "number" ? shot.xg : calculateShotXG(shot);
        if (shot.result === "Parada") {
          const val = cfg.w_gk_save * xG;
          posNPS += val;
          breakdown.gkImpact += val;
        } else if (shot.result === "Gol") {
          const pen = cfg.w_gk_conceded * (1 - xG);
          negNPS += pen;
          breakdown.gkImpact -= pen;
        }
      });
    }

    // 6. DISCIPLINA Y SANCIÓNES
    const disc = data.discipline || {};
    const yellowPen = (disc.yellowCards || 0) * cfg.w_yellow_card;
    const twoMinPen = (disc.twoMinSuspensions || 0) * cfg.w_two_min;
    const redPen = (disc.redCards || 0) * cfg.w_red_card;

    const totalDiscPen = yellowPen + twoMinPen + redPen;
    negNPS += totalDiscPen;
    breakdown.disciplineImpact -= totalDiscPen;

    // 7. CÁLCULO DEL NPS Y NORMALIZACIÓN LOGÍSTICA (SIGMOIDE)
    const nps = posNPS - negNPS;

    // Si el jugador no ha participado en ninguna acción decisiva, retorna 5.0 por defecto
    const totalActions =
      (data.shots?.length || 0) +
      drawn7m +
      (t.badPass || 0) + (t.double || 0) + (t.travel || 0) + (t.passive || 0) + (t.offensiveFoul || 0) +
      (def.freeThrowsDrawn || 0) + (def.offFoulsDrawn || 0) + (def.penaltiesCommitted || 0) +
      (data.gkShotsFaced?.length || 0) +
      (disc.yellowCards || 0) + (disc.twoMinSuspensions || 0) + (disc.redCards || 0);

    if (totalActions === 0) {
      return {
        nps: 0,
        rating: cfg.neutralRating,
        breakdown
      };
    }

    const rawRating = 10 / (1 + Math.exp(-cfg.sigmoidK * nps));
    const finalRating = Math.min(10.0, Math.max(0.0, Math.round(rawRating * 10) / 10));

    return {
      nps: Math.round(nps * 100) / 100,
      rating: finalRating,
      breakdown
    };
  }
}
