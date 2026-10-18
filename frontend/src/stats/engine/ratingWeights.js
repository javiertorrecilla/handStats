/**
 * ratingWeights.js
 * Configuración centralizada de pesos para el cálculo del Rating (0.0 - 10.0)
 * y el Net Performance Score (NPS) en HandStats.
 */

export const RATING_WEIGHTS = {
  // Parámetros de Escala y Normalización (Invariables)
  sigmoidK: 0.35,
  neutralRating: 5.0,

  // Ataque (+)
  // Gol anotado: +0.50 + 1.00 × (1 - xG)
  w_goal_base: 0.50,
  w_goal_xg: 1.00,
  // Provocar 7m: +0.80
  w_drawn_7m: 0.80,

  // Defensa (+)
  // Falta en ataque provocada al rival: +0.60
  w_def_drawn_off_foul: 0.60,
  // Golpe franco forzado / corte de ataque: +0.20
  w_def_free_throw: 0.20,

  // Portero (+)
  // Parada: +0.25 + 1.20 × xG
  w_gk_save_base: 0.25,
  w_gk_save_xg: 1.20,

  // Ataque (-)
  // Tiro fallado al poste o fuera: -1.20 × xG
  w_miss_off: 1.20,
  // Tiro detenido por el portero: -1.00 × xG
  w_miss_saved: 1.00,

  // Pérdidas (-)
  // Falta en ataque cometida: -0.80
  w_turnover_offensive_foul: 0.80,
  // Mal pase: -1.00
  w_turnover_bad_pass: 1.00,
  // Pasivo: -0.50
  w_turnover_passive: 0.50,
  // Pasos: -0.80
  w_turnover_travel: 0.80,
  // Dobles: -0.80
  w_turnover_double: 0.80,

  // Defensa (-)
  // Cometer 7m: -0.90
  w_def_committed_7m: 0.90,

  // Disciplina (-)
  // Tarjeta amarilla: -0.30
  w_yellow_card: 0.30,
  // Exclusión de 2 min (1ª y 2ª del jugador): -0.90
  w_two_min: 0.90,
  // Roja por acumulación (3ª exclusión de 2 min del mismo jugador): -1.40
  w_red_card_accumulation: 1.40,
  // Roja directa: -2.50
  w_red_card_direct: 2.50,
  // Azul (roja con informe): -3.00
  w_blue_card: 3.00,

  // Portero (-)
  // Gol encajado: -(0.20 + 0.80 × (1 - xG))
  w_gk_conceded_base: 0.20,
  w_gk_conceded_xg: 0.80,

  // Compatibilidad legacy
  w_goal: 1.00,
  w_red_card: 2.50,
  w_gk_save: 1.20,
  w_gk_conceded: 0.80,
};

export const DEFAULT_RATING_CONFIG = { ...RATING_WEIGHTS };
