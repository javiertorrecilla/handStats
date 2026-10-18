/**
 * playerRatingEngine.js
 * Módulo para el cálculo de la nota individual de jugadores (Rating 0.0 - 10.0) en HandStats.
 * 
 * Basado en:
 * - Impacto Neto del Jugador (Net Performance Score - NPS)
 * - Probabilidad esperada de gol (xG) y parada (xSaves)
 * - Acciones defensivas (Golpe Franco, Falta en ataque provocada, 7m cometido)
 * - Pérdidas segmentadas (Mal Pase, Dobles, Pasos, Pasivo, Falta en ataque)
 * - Disciplina (Tarjeta Amarilla, 2 Minutos 1ª/2ª, Roja por acumulación 3ª, Roja directa, Tarjeta Azul)
 * - Normalización Logística (Sigmoide) centrada en 5.0 para partidos neutros
 */

import { calculateShotXG } from "./xgModel.js";
import { RATING_WEIGHTS, DEFAULT_RATING_CONFIG } from "./ratingWeights.js";

export { RATING_WEIGHTS, DEFAULT_RATING_CONFIG };

export class PlayerRatingCalculator {
  constructor(customConfig = {}) {
    this.config = { ...RATING_WEIGHTS, ...customConfig };
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
   * @param {Object} data.discipline - Sanciones { yellowCards, twoMinSuspensions, redCardsAccumulation, thirdTwoMin, directRedCards, redCards, blueCards }
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
      penaltiesCommittedImpact: 0,
      offFoulsDrawnImpact: 0,
      offensiveFoulsImpact: 0,
    };

    // 1. LANZAMIENTOS DE ATAQUE
    if (!isGoalkeeper) {
      const shots = data.shots || [];
      shots.forEach((shot) => {
        const xG = typeof shot.xg === "number" ? shot.xg : calculateShotXG(shot);
        if (shot.result === "Gol") {
          const val = (cfg.w_goal_base ?? 0.50) + (cfg.w_goal_xg ?? 1.00) * (1 - xG);
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
    breakdown.offensiveFoulsImpact -= offFoulPen;

    // 4. ACCIONES DEFENSIVAS
    const def = data.defense || {};
    const freeThrowsVal = (def.freeThrowsDrawn || 0) * cfg.w_def_free_throw;
    const offFoulsDrawnVal = (def.offFoulsDrawn || 0) * cfg.w_def_drawn_off_foul;
    const penaltiesCommittedPen = (def.penaltiesCommitted || 0) * cfg.w_def_committed_7m;

    posNPS += freeThrowsVal + offFoulsDrawnVal;
    negNPS += penaltiesCommittedPen;
    breakdown.defenseImpact += (freeThrowsVal + offFoulsDrawnVal - penaltiesCommittedPen);
    breakdown.penaltiesCommittedImpact -= penaltiesCommittedPen;
    breakdown.offFoulsDrawnImpact += offFoulsDrawnVal;

    // 5. ACTUACIÓN DE PORTERÍA
    if (isGoalkeeper || (data.gkShotsFaced && data.gkShotsFaced.length > 0)) {
      const gkShots = data.gkShotsFaced || [];
      gkShots.forEach((shot) => {
        const xG = typeof shot.xg === "number" ? shot.xg : calculateShotXG(shot);
        if (shot.result === "Parada") {
          const val = (cfg.w_gk_save_base ?? 0.25) + (cfg.w_gk_save_xg ?? 1.20) * xG;
          posNPS += val;
          breakdown.gkImpact += val;
        } else if (shot.result === "Gol") {
          const pen = (cfg.w_gk_conceded_base ?? 0.20) + (cfg.w_gk_conceded_xg ?? 0.80) * (1 - xG);
          negNPS += pen;
          breakdown.gkImpact -= pen;
        }
      });
    }

    // 6. DISCIPLINA Y SANCIONES
    const disc = data.discipline || {};
    const yellowCount = disc.yellowCards || 0;

    // Distinción de exclusiones:
    // 1ª y 2ª exclusión: w_two_min (-0.90) cada una.
    // 3ª exclusión (roja por acumulación): w_red_card_accumulation (-1.40). Ya incluye la 3ª exclusión.
    let twoMinNormal = 0;
    let twoMinAccum = 0;

    if (disc.redCardsAccumulation !== undefined || disc.thirdTwoMin !== undefined) {
      twoMinNormal = disc.twoMinSuspensions || 0;
      twoMinAccum = (disc.redCardsAccumulation || 0) + (disc.thirdTwoMin || 0);
    } else {
      const rawTwoMins = disc.twoMinSuspensions || 0;
      twoMinNormal = Math.min(2, rawTwoMins);
      twoMinAccum = Math.max(0, rawTwoMins - 2);
    }

    const directRedCount = disc.directRedCards !== undefined
      ? disc.directRedCards
      : (disc.redCards || 0);

    const blueCount = disc.blueCards || 0;

    const yellowPen = yellowCount * cfg.w_yellow_card;
    const twoMinPen = twoMinNormal * cfg.w_two_min;
    const redAccumPen = twoMinAccum * cfg.w_red_card_accumulation;
    const directRedPen = directRedCount * (cfg.w_red_card_direct ?? cfg.w_red_card ?? 2.50);
    const bluePen = blueCount * cfg.w_blue_card;

    const totalDiscPen = yellowPen + twoMinPen + redAccumPen + directRedPen + bluePen;
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
      yellowCount + twoMinNormal + twoMinAccum + directRedCount + blueCount;

    if (totalActions === 0) {
      return {
        nps: 0,
        rating: cfg.neutralRating,
        breakdown: {
          shotsImpact: 0,
          drawn7mImpact: 0,
          turnoversImpact: 0,
          defenseImpact: 0,
          gkImpact: 0,
          disciplineImpact: 0,
          penaltiesCommittedImpact: 0,
          offFoulsDrawnImpact: 0,
          offensiveFoulsImpact: 0,
        }
      };
    }

    const rawRating = 10 / (1 + Math.exp(-cfg.sigmoidK * nps));
    const finalRating = Math.min(10.0, Math.max(0.0, Math.round(rawRating * 10) / 10));

    return {
      nps: Math.round(nps * 100) / 100,
      rating: finalRating,
      breakdown: {
        shotsImpact: Math.round(breakdown.shotsImpact * 100) / 100,
        drawn7mImpact: Math.round(breakdown.drawn7mImpact * 100) / 100,
        turnoversImpact: Math.round(breakdown.turnoversImpact * 100) / 100,
        defenseImpact: Math.round(breakdown.defenseImpact * 100) / 100,
        gkImpact: Math.round(breakdown.gkImpact * 100) / 100,
        disciplineImpact: Math.round(breakdown.disciplineImpact * 100) / 100,
        penaltiesCommittedImpact: Math.round(breakdown.penaltiesCommittedImpact * 100) / 100,
        offFoulsDrawnImpact: Math.round(breakdown.offFoulsDrawnImpact * 100) / 100,
        offensiveFoulsImpact: Math.round(breakdown.offensiveFoulsImpact * 100) / 100,
      }
    };
  }
}
