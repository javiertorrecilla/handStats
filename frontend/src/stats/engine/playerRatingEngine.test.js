import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  PlayerRatingCalculator,
  RATING_WEIGHTS,
  DEFAULT_RATING_CONFIG
} from "./playerRatingEngine.js";
import { calculateMatchMetrics } from "./metricsEngine.js";

describe("PlayerRatingCalculator - Casos de Verificación de Pesos", () => {
  const calc = new PlayerRatingCalculator();

  it("Gol con xG 0.2 → +1.30", () => {
    const res = calc.calculateRating({
      shots: [{ result: "Gol", xg: 0.2 }]
    });
    assert.equal(res.nps, 1.30);
    assert.equal(res.breakdown.shotsImpact, 1.30);
  });

  it("Gol con xG 0.9 → +0.60", () => {
    const res = calc.calculateRating({
      shots: [{ result: "Gol", xg: 0.9 }]
    });
    assert.equal(res.nps, 0.60);
    assert.equal(res.breakdown.shotsImpact, 0.60);
  });

  it("Gol de 7m con xG 0.75 → +0.75", () => {
    const res = calc.calculateRating({
      shots: [{ result: "Gol", xg: 0.75 }]
    });
    assert.equal(res.nps, 0.75);
    assert.equal(res.breakdown.shotsImpact, 0.75);
  });

  it("Parada con xG 0.8 → +1.21", () => {
    const res = calc.calculateRating(
      {
        gkShotsFaced: [{ result: "Parada", xg: 0.8 }]
      },
      true
    );
    assert.equal(res.nps, 1.21);
    assert.equal(res.breakdown.gkImpact, 1.21);
  });

  it("Gol encajado con xG 0.2 → -0.84", () => {
    const res = calc.calculateRating(
      {
        gkShotsFaced: [{ result: "Gol", xg: 0.2 }]
      },
      true
    );
    assert.equal(res.nps, -0.84);
    assert.equal(res.breakdown.gkImpact, -0.84);
  });

  it("Gol encajado con xG 0.9 → -0.28", () => {
    const res = calc.calculateRating(
      {
        gkShotsFaced: [{ result: "Gol", xg: 0.9 }]
      },
      true
    );
    assert.equal(res.nps, -0.28);
    assert.equal(res.breakdown.gkImpact, -0.28);
  });

  it("Tiro parado por el portero con xG 0.8 → -0.80", () => {
    const res = calc.calculateRating({
      shots: [{ result: "Parada", xg: 0.8 }]
    });
    assert.equal(res.nps, -0.80);
    assert.equal(res.breakdown.shotsImpact, -0.80);
  });

  it("Tiro fuera con xG 0.5 → -0.60", () => {
    const res = calc.calculateRating({
      shots: [{ result: "Fuera", xg: 0.5 }]
    });
    assert.equal(res.nps, -0.60);
    assert.equal(res.breakdown.shotsImpact, -0.60);
  });

  it("1ª exclusión → -0.90", () => {
    const res = calc.calculateRating({
      discipline: { twoMinSuspensions: 1 }
    });
    assert.equal(res.nps, -0.90);
    assert.equal(res.breakdown.disciplineImpact, -0.90);
  });

  it("1ª y 2ª exclusión → -0.90 cada una (-1.80 total)", () => {
    const res = calc.calculateRating({
      discipline: { twoMinSuspensions: 2 }
    });
    assert.equal(res.nps, -1.80);
    assert.equal(res.breakdown.disciplineImpact, -1.80);
  });

  it("3ª exclusión del mismo jugador en aislamiento → -1.40 en total (sin sumar exclusión normal)", () => {
    const res = calc.calculateRating({
      discipline: { redCardsAccumulation: 1 }
    });
    assert.equal(res.nps, -1.40);
    assert.equal(res.breakdown.disciplineImpact, -1.40);
  });

  it("3ª exclusión con contador total acumulado (3 exclusiones) → -3.20 (-0.90 - 0.90 - 1.40)", () => {
    const res = calc.calculateRating({
      discipline: { twoMinSuspensions: 3 }
    });
    assert.equal(res.nps, -3.20);
    assert.equal(res.breakdown.disciplineImpact, -3.20);
  });

  it("Roja directa → -2.50, sin suma de otras sanciones", () => {
    const res = calc.calculateRating({
      discipline: { directRedCards: 1 }
    });
    assert.equal(res.nps, -2.50);
    assert.equal(res.breakdown.disciplineImpact, -2.50);
  });

  it("Tarjeta azul (roja con informe) → -3.00, sin suma de otras sanciones", () => {
    const res = calc.calculateRating({
      discipline: { blueCards: 1 }
    });
    assert.equal(res.nps, -3.00);
    assert.equal(res.breakdown.disciplineImpact, -3.00);
  });

  it("Tarjeta amarilla → -0.30", () => {
    const res = calc.calculateRating({
      discipline: { yellowCards: 1 }
    });
    assert.equal(res.nps, -0.30);
    assert.equal(res.breakdown.disciplineImpact, -0.30);
  });

  it("Jerarquía de severidad disciplinaria: amarilla (-0.30) < exclusión (-0.90) < acumulación (-1.40) < roja (-2.50) < azul (-3.00)", () => {
    assert.ok(RATING_WEIGHTS.w_yellow_card < RATING_WEIGHTS.w_two_min);
    assert.ok(RATING_WEIGHTS.w_two_min < RATING_WEIGHTS.w_red_card_accumulation);
    assert.ok(RATING_WEIGHTS.w_red_card_accumulation < RATING_WEIGHTS.w_red_card_direct);
    assert.ok(RATING_WEIGHTS.w_red_card_direct < RATING_WEIGHTS.w_blue_card);
  });

  it("Acciones favorables y pérdidas", () => {
    // Provocar 7m: +0.80
    assert.equal(calc.calculateRating({ drawn7mCount: 1 }).nps, 0.80);
    // Falta en ataque provocada: +0.60
    assert.equal(calc.calculateRating({ defense: { offFoulsDrawn: 1 } }).nps, 0.60);
    // Golpe franco forzado: +0.20
    assert.equal(calc.calculateRating({ defense: { freeThrowsDrawn: 1 } }).nps, 0.20);
    // Cometer 7m: -0.90
    assert.equal(calc.calculateRating({ defense: { penaltiesCommitted: 1 } }).nps, -0.90);
    // Pérdidas:
    assert.equal(calc.calculateRating({ turnovers: { offensiveFoul: 1 } }).nps, -0.80);
    assert.equal(calc.calculateRating({ turnovers: { badPass: 1 } }).nps, -1.00);
    assert.equal(calc.calculateRating({ turnovers: { passive: 1 } }).nps, -0.50);
    assert.equal(calc.calculateRating({ turnovers: { travel: 1 } }).nps, -0.80);
    assert.equal(calc.calculateRating({ turnovers: { double: 1 } }).nps, -0.80);
  });

  it("Jugador sin acciones decisivas mantiene nota neutra 5.0 y NPS 0", () => {
    const res = calc.calculateRating({});
    assert.equal(res.rating, 5.0);
    assert.equal(res.nps, 0);
  });
});

describe("metricsEngine - Integración de métricas y sanciones de partido", () => {
  it("Diferenciación de 1ª, 2ª y 3ª exclusión y roja directa en partido simulado", () => {
    const match = {
      home_team: "Local",
      away_team: "Visitante",
      home_players: [
        { number: 1, name: "Portero", is_goalkeeper: true },
        { number: 7, name: "Extremo", is_goalkeeper: false },
        { number: 9, name: "Lateral", is_goalkeeper: false },
        { number: 10, name: "Central", is_goalkeeper: false }
      ],
      away_players: [],
      events: [
        // Jugador 7: 1ª exclusión
        {
          event_type: "sanction",
          sanction_type: "2 Minutos",
          player_number: 7,
          match_time_seconds: 300,
          team: "LOCAL",
          is_opponent_action: false
        },
        // Jugador 9: 3 exclusiones (1ª, 2ª y 3ª) + evento explícito de Tarjeta Roja por acumulación
        {
          event_type: "sanction",
          sanction_type: "2 Minutos",
          player_number: 9,
          match_time_seconds: 400,
          team: "LOCAL",
          is_opponent_action: false
        },
        {
          event_type: "sanction",
          sanction_type: "2 Minutos",
          player_number: 9,
          match_time_seconds: 1200,
          team: "LOCAL",
          is_opponent_action: false
        },
        {
          event_type: "sanction",
          sanction_type: "2 Minutos",
          player_number: 9,
          match_time_seconds: 2000,
          team: "LOCAL",
          is_opponent_action: false
        },
        {
          event_type: "sanction",
          sanction_type: "Tarjeta Roja",
          player_number: 9,
          match_time_seconds: 2001,
          team: "LOCAL",
          is_opponent_action: false
        },
        // Jugador 10: Roja directa
        {
          event_type: "sanction",
          sanction_type: "Tarjeta Roja",
          player_number: 10,
          match_time_seconds: 800,
          team: "LOCAL",
          is_opponent_action: false
        }
      ]
    };

    const metrics = calculateMatchMetrics(match, null, 3600);
    const p7 = metrics.homePlayerStats.find((p) => p.number === 7);
    const p9 = metrics.homePlayerStats.find((p) => p.number === 9);
    const p10 = metrics.homePlayerStats.find((p) => p.number === 10);

    // Jugador 7: 1 exclusión -> NPS -0.90
    assert.equal(p7.twoMins, 1);
    assert.equal(p7.nps, -0.90);

    // Jugador 9: 3 exclusiones -> 2 normales (-1.80) + 1 por acumulación (-1.40) = -3.20.
    // La Tarjeta Roja registrada tras la 3ª exclusión no suma duplicado de roja directa.
    assert.equal(p9.twoMins, 3);
    assert.equal(p9.redCardsAccumulation, 1);
    assert.equal(p9.directRedCards, 0);
    assert.equal(p9.nps, -3.20);

    // Jugador 10: Roja directa -> -2.50
    assert.equal(p10.twoMins, 0);
    assert.equal(p10.directRedCards, 1);
    assert.equal(p10.nps, -2.50);
  });
});

describe("Registro extremo a extremo: 7 Metros y Faltas en ataque (committed_by y provoked_by)", () => {
  const baseMatch = {
    home_team: "Local",
    away_team: "Visitante",
    home_players: [
      { number: 7, name: "Atacante Local", is_goalkeeper: false },
      { number: 10, name: "Defensor Local", is_goalkeeper: false }
    ],
    away_players: [
      { number: 3, name: "Defensor Visitante", is_goalkeeper: false },
      { number: 9, name: "Atacante Visitante", is_goalkeeper: false }
    ],
    events: []
  };

  it("7m con autor y provocador: +0.80 provocador (ataque) y -0.90 infractor (defensa)", () => {
    const match = {
      ...baseMatch,
      events: [
        {
          event_type: "sanction",
          sanction_type: "7m Provocado",
          action_key: "penalti_7m",
          committed_by: { number: 3, name: "Defensor Visitante", team: "VISITANTE" },
          provoked_by: { number: 7, name: "Atacante Local", team: "LOCAL" },
          team: "LOCAL",
          is_opponent_action: false
        }
      ]
    };
    const metrics = calculateMatchMetrics(match, null, 3600);
    const p7 = metrics.homePlayerStats.find((p) => p.number === 7);
    const p3 = metrics.awayPlayerStats.find((p) => p.number === 3);

    assert.equal(p7.drawn7mCount, 1);
    assert.equal(p7.penaltiesCommitted, 0);
    assert.equal(p7.nps, 0.80);
    assert.equal(p7.ratingBreakdown.drawn7mImpact, 0.80);

    assert.equal(p3.drawn7mCount, 0);
    assert.equal(p3.penaltiesCommitted, 1);
    assert.equal(p3.nps, -0.90);
    assert.equal(p3.ratingBreakdown.penaltiesCommittedImpact, -0.90);
  });

  it("7m con solo provocador (+0.80) y 7m con solo infractor (-0.90)", () => {
    const match = {
      ...baseMatch,
      events: [
        // Solo provocador
        {
          event_type: "sanction",
          sanction_type: "7m Provocado",
          action_key: "penalti_7m",
          committed_by: null,
          provoked_by: { number: 7, name: "Atacante Local", team: "LOCAL" },
          team: "LOCAL",
          is_opponent_action: false
        },
        // Solo infractor
        {
          event_type: "sanction",
          sanction_type: "7m Provocado",
          action_key: "penalti_7m",
          committed_by: { number: 3, name: "Defensor Visitante", team: "VISITANTE" },
          provoked_by: null,
          team: "LOCAL",
          is_opponent_action: false
        }
      ]
    };
    const metrics = calculateMatchMetrics(match, null, 3600);
    const p7 = metrics.homePlayerStats.find((p) => p.number === 7);
    const p3 = metrics.awayPlayerStats.find((p) => p.number === 3);

    assert.equal(p7.drawn7mCount, 1);
    assert.equal(p7.nps, 0.80);

    assert.equal(p3.penaltiesCommitted, 1);
    assert.equal(p3.nps, -0.90);
  });

  it("Falta en ataque con autor y provocador: -0.80 infractor (ataque) y +0.60 provocador (defensa)", () => {
    const match = {
      ...baseMatch,
      events: [
        {
          event_type: "turnover",
          end_reason: "Falta en ataque",
          action_key: "falta_ataque",
          committed_by: { number: 7, name: "Atacante Local", team: "LOCAL" },
          provoked_by: { number: 3, name: "Defensor Visitante", team: "VISITANTE" },
          team: "LOCAL",
          is_opponent_action: false
        }
      ]
    };
    const metrics = calculateMatchMetrics(match, null, 3600);
    const p7 = metrics.homePlayerStats.find((p) => p.number === 7);
    const p3 = metrics.awayPlayerStats.find((p) => p.number === 3);

    assert.equal(p7.offensiveFouls, 1);
    assert.equal(p7.offFoulsDrawn, 0);
    assert.equal(p7.nps, -0.80);
    assert.equal(p7.ratingBreakdown.offensiveFoulsImpact, -0.80);

    assert.equal(p3.offensiveFouls, 0);
    assert.equal(p3.offFoulsDrawn, 1);
    assert.equal(p3.nps, 0.60);
    assert.equal(p3.ratingBreakdown.offFoulsDrawnImpact, 0.60);
  });

  it("Falta en ataque con solo autor (-0.80) y con solo provocador (+0.60)", () => {
    const match = {
      ...baseMatch,
      events: [
        // Solo autor
        {
          event_type: "turnover",
          end_reason: "Falta en ataque",
          committed_by: { number: 7, name: "Atacante Local", team: "LOCAL" },
          provoked_by: null,
          team: "LOCAL",
          is_opponent_action: false
        },
        // Solo provocador
        {
          event_type: "turnover",
          end_reason: "Falta en ataque",
          committed_by: null,
          provoked_by: { number: 3, name: "Defensor Visitante", team: "VISITANTE" },
          team: "LOCAL",
          is_opponent_action: false
        }
      ]
    };
    const metrics = calculateMatchMetrics(match, null, 3600);
    const p7 = metrics.homePlayerStats.find((p) => p.number === 7);
    const p3 = metrics.awayPlayerStats.find((p) => p.number === 3);

    assert.equal(p7.offensiveFouls, 1);
    assert.equal(p7.nps, -0.80);

    assert.equal(p3.offFoulsDrawn, 1);
    assert.equal(p3.nps, 0.60);
  });

  it("Protección de consistencia: mismo jugador en ambos roles no duplica ni distorsiona", () => {
    const match = {
      ...baseMatch,
      events: [
        {
          event_type: "sanction",
          sanction_type: "7m Provocado",
          committed_by: { number: 7, name: "Atacante Local" },
          provoked_by: { number: 7, name: "Atacante Local" },
          team: "LOCAL",
          is_opponent_action: false
        }
      ]
    };
    const metrics = calculateMatchMetrics(match, null, 3600);
    const p7 = metrics.homePlayerStats.find((p) => p.number === 7);

    // No debe asignarse a ambos roles al mismo tiempo
    assert.ok(p7.drawn7mCount === 0 || p7.penaltiesCommitted === 0);
  });

  it("Compatibilidad con eventos legados sin committed_by / provoked_by", () => {
    const match = {
      ...baseMatch,
      events: [
        // Evento legado 7m
        {
          event_type: "sanction",
          sanction_type: "7m Provocado",
          player_id: "3 - Defensor",
          player_number: 3,
          drawn_by_player: "7 - Atacante",
          drawn_by_number: 7,
          team: "LOCAL",
          is_opponent_action: false
        },
        // Evento legado falta en ataque
        {
          event_type: "turnover",
          end_reason: "Falta en ataque",
          player_id: "7 - Atacante",
          player_number: 7,
          defender_id: "3 - Defensor",
          defender_number: 3,
          team: "LOCAL",
          is_opponent_action: false
        }
      ]
    };
    const metrics = calculateMatchMetrics(match, null, 3600);
    const p7 = metrics.homePlayerStats.find((p) => p.number === 7);
    const p3 = metrics.awayPlayerStats.find((p) => p.number === 3);

    assert.equal(p7.drawn7mCount, 1);
    assert.equal(p7.offensiveFouls, 1);

    assert.equal(p3.penaltiesCommitted, 1);
    assert.equal(p3.offFoulsDrawn, 1);
  });

  it("Recálculo instantáneo tras actualizar un evento existente", () => {
    // 1. Partido inicial con 7m sin asignar
    const match = {
      ...baseMatch,
      events: [
        {
          event_id: "evt-1",
          event_type: "sanction",
          sanction_type: "7m Provocado",
          action_key: "penalti_7m",
          committed_by: null,
          provoked_by: null,
          team: "LOCAL",
          is_opponent_action: false
        }
      ]
    };

    let metrics = calculateMatchMetrics(match, null, 3600);
    let p7 = metrics.homePlayerStats.find((p) => p.number === 7);
    let p3 = metrics.awayPlayerStats.find((p) => p.number === 3);

    assert.equal(p7.drawn7mCount, 0);
    assert.equal(p3.penaltiesCommitted, 0);

    // 2. Se actualiza el evento asignando #7 y #3
    match.events = [
      {
        ...match.events[0],
        committed_by: { number: 3, name: "Defensor Visitante", team: "VISITANTE" },
        provoked_by: { number: 7, name: "Atacante Local", team: "LOCAL" }
      }
    ];

    metrics = calculateMatchMetrics(match, null, 3600);
    p7 = metrics.homePlayerStats.find((p) => p.number === 7);
    p3 = metrics.awayPlayerStats.find((p) => p.number === 3);

    assert.equal(p7.drawn7mCount, 1);
    assert.equal(p7.nps, 0.80);
    assert.equal(p3.penaltiesCommitted, 1);
    assert.equal(p3.nps, -0.90);
  });
});
