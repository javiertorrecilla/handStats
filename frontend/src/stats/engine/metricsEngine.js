/* ==========================================================
   HANDSTATS ANALYTICS — METRICS ENGINE
   Motor de cálculo estadístico para análisis en tiempo real
   ========================================================== */

import { calculateShotXG } from "./xgModel";
import { getSettings } from "../../services/settingsService";
import { PlayerRatingCalculator } from "./playerRatingEngine";

/**
 * Calcula todas las métricas procesadas a partir de los datos del partido.
 * @param {Object} match - Objeto completo del partido
 * @param {Object} activePossession - Estado de posesión actual
 * @param {number} currentTimeSeconds - Tiempo transcurrido en segundos
 * @returns {Object} Módulo completo de métricas
 */
export function calculateMatchMetrics(match, activePossession, currentTimeSeconds = 0) {
  if (!match) return null;

  const events = match.events || [];
  const possessions = match.possessions || [];
  const homeTeam = match.home_team || "Local";
  const awayTeam = match.away_team || "Visitante";
  const homePlayers = match.home_players || [];
  const awayPlayers = match.away_players || [];

  // ---------------------------------------------------------
  // 1. CONTEOS Y MÉTRICAS DE ATAQUE (LOCAL vs VISITANTE)
  // ---------------------------------------------------------
  const homeEvents = events.filter((e) => !e.is_opponent_action);
  const awayEvents = events.filter((e) => e.is_opponent_action);

  const homeShots = homeEvents.filter((e) => e.event_type === "shot");
  const awayShots = awayEvents.filter((e) => e.event_type === "shot");

  const homeGoals = match.goals_home ?? homeShots.filter((e) => e.result === "Gol").length;
  const awayGoals = match.goals_away ?? awayShots.filter((e) => e.result === "Gol").length;

  const homePossessions = possessions.filter((p) => p.team === "LOCAL");
  const awayPossessions = possessions.filter((p) => p.team === "VISITANTE");

  // Conteo real y exacto de posesiones por equipo sin forzar mínimos ficticios
  let homePossCount = homePossessions.length;
  let awayPossCount = awayPossessions.length;

  if (possessions.length === 0) {
    homePossCount = activePossession?.team === "LOCAL" ? 1 : 0;
    awayPossCount = activePossession?.team === "VISITANTE" ? 1 : 0;
  } else {
    // Si hay una posesión activa que aún no se ha cerrado en el historial:
    if (activePossession?.team === "LOCAL" && !possessions.some(p => p.possession_number === activePossession?.possession_number)) {
      homePossCount += 1;
    } else if (activePossession?.team === "VISITANTE" && !possessions.some(p => p.possession_number === activePossession?.possession_number)) {
      awayPossCount += 1;
    }
  }

  // Eficiencia Ofensiva = (Goles / Posesiones) * 100
  const homeOffEfficiency = homePossCount > 0 ? Math.min(100, Math.round((homeGoals / homePossCount) * 100)) : 0;
  const awayOffEfficiency = awayPossCount > 0 ? Math.min(100, Math.round((awayGoals / awayPossCount) * 100)) : 0;

  // xG acumulado
  const homeXG = Math.round(homeShots.reduce((acc, e) => acc + calculateShotXG(e), 0) * 100) / 100;
  const awayXG = Math.round(awayShots.reduce((acc, e) => acc + calculateShotXG(e), 0) * 100) / 100;

  // Paradas recibidas / realizadas
  const awayStopsByGK = homeShots.filter((e) => e.result === "Parada").length;
  const homeStopsByGK = awayShots.filter((e) => e.result === "Parada").length;

  // Paradas de nuestra portería local (tiros rivales awayShots atajados por portero local)
  const homeGKShotsFaced = awayShots.filter((e) => e.result === "Gol" || e.result === "Parada");
  const homeGKSaves = homeStopsByGK;
  const homeGKSavePct = homeGKShotsFaced.length > 0 ? Math.round((homeGKSaves / homeGKShotsFaced.length) * 100) : 0;

  // Paradas de nuestra portería visitante (tiros locales homeShots atajados por portero visitante)
  const awayGKShotsFaced = homeShots.filter((e) => e.result === "Gol" || e.result === "Parada");
  const awayGKSaves = awayStopsByGK;
  const awayGKSavePct = awayGKShotsFaced.length > 0 ? Math.round((awayGKSaves / awayGKShotsFaced.length) * 100) : 0;

  // xSaves acumulado
  const homeGKExpectedSaves = Math.round(awayShots.reduce((acc, e) => acc + (1 - calculateShotXG(e)), 0) * 10) / 10;
  const awayGKExpectedSaves = Math.round(homeShots.reduce((acc, e) => acc + (1 - calculateShotXG(e)), 0) * 10) / 10;

  // Pérdidas y Robos
  const homeTurnovers = homeEvents.filter((e) => e.event_type === "turnover").length;
  const awayTurnovers = awayEvents.filter((e) => e.event_type === "turnover").length;
  const homeSteals = homeEvents.filter((e) => e.event_type === "steal").length;
  const awaySteals = awayEvents.filter((e) => e.event_type === "steal").length;

  // Sanciones y 2 minutos
  const homeSanctions = homeEvents.filter((e) => e.event_type === "sanction");
  const awaySanctions = awayEvents.filter((e) => e.event_type === "sanction");
  const home2Min = homeSanctions.filter((e) => e.sanction_type === "2 Minutos").length;
  const away2Min = awaySanctions.filter((e) => e.sanction_type === "2 Minutos").length;

  // Golpes Franco
  const homeFreeThrows = homeEvents.filter((e) => e.event_type === "free_throw").length;
  const awayFreeThrows = awayEvents.filter((e) => e.event_type === "free_throw").length;

  // ---------------------------------------------------------
  // 2. RITMO Y TIEMPO DE POSESIÓN
  // ---------------------------------------------------------
  const getPossessionDuration = (p) => {
    if (typeof p.duration === "number" && p.duration > 0) return p.duration;
    if (typeof p.duration_seconds === "number" && p.duration_seconds > 0) return p.duration_seconds;
    if (typeof p.end_time === "number" && typeof p.start_time === "number") {
      return Math.max(0, p.end_time - p.start_time);
    }
    return 0;
  };

  const homeTotalPossDuration = homePossessions.reduce((acc, p) => acc + getPossessionDuration(p), 0);
  const awayTotalPossDuration = awayPossessions.reduce((acc, p) => acc + getPossessionDuration(p), 0);

  const homeValidPossessions = homePossessions.filter((p) => getPossessionDuration(p) > 0);
  const awayValidPossessions = awayPossessions.filter((p) => getPossessionDuration(p) > 0);

  const homeAvgPossDuration = homeValidPossessions.length > 0
    ? Math.round(homeTotalPossDuration / homeValidPossessions.length)
    : (homePossCount > 0 ? Math.round(homeTotalPossDuration / homePossCount) : 0);

  const awayAvgPossDuration = awayValidPossessions.length > 0
    ? Math.round(awayTotalPossDuration / awayValidPossessions.length)
    : (awayPossCount > 0 ? Math.round(awayTotalPossDuration / awayPossCount) : 0);

  const totalMinutesPassed = Math.max(1, (currentTimeSeconds || 60) / 60);
  const totalPossCount = homePossCount + awayPossCount;
  const pacePerMin = Math.round((totalPossCount / totalMinutesPassed) * 10) / 10;

  // ---------------------------------------------------------
  // 3. DESGLOSE DE TIROS Y EFICIENCIA (DESGLOSADO)
  // ---------------------------------------------------------
  const attackBreakdownHome = calculateAttackBreakdown(homeShots);
  const attackBreakdownAway = calculateAttackBreakdown(awayShots);

  // ---------------------------------------------------------
  // 4. JUGADORES Y PORTEROS
  // ---------------------------------------------------------
  const homePlayerStats = calculatePlayerStatsList(homePlayers, homeEvents, awayShots, false, awayEvents);
  const awayPlayerStats = calculatePlayerStatsList(awayPlayers, awayEvents, homeShots, true, homeEvents);

  const homeGoalkeeperStats = calculateGoalkeeperStatsList(homePlayers, awayShots);
  const awayGoalkeeperStats = calculateGoalkeeperStatsList(awayPlayers, homeShots);

  // ---------------------------------------------------------
  // 5. CRONOLOGÍA DE MOMENTUM E INICIATIVA TÁCTICA
  // ---------------------------------------------------------
  const momentumTimeline = buildMomentumTimeline(events, currentTimeSeconds);
  const scoreTimeline = buildScoreTimeline(events, currentTimeSeconds);

  // Equipo dominante en los últimos 5 minutos
  const recentTimeline = momentumTimeline.slice(-5);
  const avgRecentMomentum = recentTimeline.length > 0
    ? recentTimeline.reduce((acc, p) => acc + p.momentum, 0) / recentTimeline.length
    : 0;

  const dominantTeam = avgRecentMomentum > 15 ? homeTeam : avgRecentMomentum < -15 ? awayTeam : "Equilibrado";
  const currentMomentumValue = momentumTimeline.length > 0 ? momentumTimeline[momentumTimeline.length - 1].momentum : 0;

  // Top Performers
  const topScorerHome = [...homePlayerStats].sort((a, b) => b.goals - a.goals)[0] || null;
  const topEfficientHome = [...homePlayerStats].filter(p => p.shotsCount >= 3).sort((a, b) => b.efficiency - a.efficiency)[0] || null;
  const worstEfficientHome = [...homePlayerStats].filter(p => p.shotsCount >= 3).sort((a, b) => a.efficiency - b.efficiency)[0] || null;

  return {
    overview: {
      homeTeam,
      awayTeam,
      homeGoals,
      awayGoals,
      homeOffEfficiency,
      awayOffEfficiency,
      homeXG,
      awayXG,
      homeDefEfficiency: 100 - awayOffEfficiency,
      awayDefEfficiency: 100 - homeOffEfficiency,
      homeGKSaves,
      homeGKSavePct,
      awayGKSaves,
      awayGKSavePct,
      homeGKExpectedSaves,
      awayGKExpectedSaves,
      homeTurnovers,
      awayTurnovers,
      homeSteals,
      awaySteals,
      home2Min,
      away2Min,
      homeFreeThrows,
      awayFreeThrows,
      homePossCount,
      awayPossCount,
      homeTotalPossDuration,
      awayTotalPossDuration,
      homeShotsCount: homeShots.length,
      awayShotsCount: awayShots.length,
      pacePerMin,
      homeAvgPossDuration,
      awayAvgPossDuration,
      dominantTeam,
      currentMomentumValue,
      topScorerHome,
      topEfficientHome,
      worstEfficientHome
    },
    momentumTimeline,
    scoreTimeline,
    attackBreakdownHome,
    attackBreakdownAway,
    homePlayerStats,
    awayPlayerStats,
    homeGoalkeeperStats,
    awayGoalkeeperStats
  };
}

/**
 * Genera el perfil de tiros y eficacia desglosado.
 */
function calculateAttackBreakdown(shots) {
  const byType = {};
  const byZone = {};
  const byPhase = {};
  const bySituation = {};

  shots.forEach((s) => {
    const type = s.shot_type || "Otros";
    const zone = s.target_zone || "Sin Zona";
    const phase = s.play_phase || "Posicional";
    const sit = s.numerical_situation || "Igualdad";
    const isGoal = s.result === "Gol";

    if (!byType[type]) byType[type] = { shots: 0, goals: 0, xg: 0 };
    byType[type].shots += 1;
    if (isGoal) byType[type].goals += 1;
    byType[type].xg += calculateShotXG(s);

    if (!byZone[zone]) byZone[zone] = { shots: 0, goals: 0 };
    byZone[zone].shots += 1;
    if (isGoal) byZone[zone].goals += 1;

    if (!byPhase[phase]) byPhase[phase] = { shots: 0, goals: 0 };
    byPhase[phase].shots += 1;
    if (isGoal) byPhase[phase].goals += 1;

    if (!bySituation[sit]) bySituation[sit] = { shots: 0, goals: 0 };
    bySituation[sit].shots += 1;
    if (isGoal) bySituation[sit].goals += 1;
  });

  return { byType, byZone, byPhase, bySituation, totalShots: shots.length };
}

/**
 * Verifica de forma exacta si un campo de evento (cadena o número) coincide con un jugador.
 * Evita que el dorsal 1 coincida erróneamente con "10 - Nombre", "11 - Nombre", etc.
 */
function matchesPlayer(fieldStr, fieldNum, player) {
  if (!player) return false;
  const pNum = String(player.number);
  const pName = player.name ? String(player.name).trim() : "";

  // 1. Coincidencia por número directo si está presente en el evento
  if (fieldNum !== undefined && fieldNum !== null && fieldNum !== 0 && fieldNum !== "0") {
    if (String(fieldNum) === pNum) return true;
  }

  // 2. Coincidencia por campo de texto
  if (!fieldStr || typeof fieldStr !== "string") return false;
  const str = fieldStr.trim();

  // Coincidencia por ID o dorsal exacto
  if (player._id && str === String(player._id)) return true;
  if (str === pNum) return true;
  if (pName && str === `${pNum} - ${pName}`) return true;

  // Coincidencia exacta de prefijo "DORSAL - " (asegura que "10 - ..." NO coincida con "1 - ")
  if (str.startsWith(`${pNum} - `)) return true;

  return false;
}

/**
 * Filtra y calcula únicamente los porteros configurados explícitamente en el equipo (is_goalkeeper === true).
 */
function calculateGoalkeeperStatsList(players, shotsFacedByTeam) {
  const settings = getSettings();
  const ratingCalc = new PlayerRatingCalculator(settings);

  const onTargetShots = shotsFacedByTeam.filter(
    (e) => e.event_type === "shot" && (e.result === "Gol" || e.result === "Parada")
  );

  const gks = players.filter(
    (p) => p.is_goalkeeper === true || p.is_goalkeeper === "true"
  );

  if (gks.length === 0) {
    return [];
  }

  return gks.map((gk) => {
    const gkNum = String(gk.number);

    let gkShotsFaced = onTargetShots.filter((e) => {
      if (e.goalkeeper_number !== undefined && e.goalkeeper_number !== null && e.goalkeeper_number !== 0 && e.goalkeeper_number !== "0") {
        return String(e.goalkeeper_number) === gkNum;
      }
      if (e.goalkeeper_id) {
        return matchesPlayer(e.goalkeeper_id, e.goalkeeper_number, gk);
      }
      if (gks.length === 1) return true;
      return false;
    });

    let gkSaves = gkShotsFaced.filter((e) => e.result === "Parada").length;

    const xSaves = Math.round(
      gkShotsFaced.reduce((acc, e) => acc + (1 - calculateShotXG(e)), 0) * 10
    ) / 10;

    const shotsFacedCount = gkShotsFaced.length;
    const savePct = shotsFacedCount > 0 ? Math.round((gkSaves / shotsFacedCount) * 100) : 0;
    const goalsConceded = shotsFacedCount - gkSaves;

    const ratingResult = ratingCalc.calculateRating(
      {
        gkShotsFaced
      },
      true
    );

    return {
      number: gk.number,
      name: gk.name,
      goalkeeperShotsFaced: shotsFacedCount,
      goalkeeperSaves: gkSaves,
      goalkeeperSavePct: savePct,
      expectedSaves: xSaves,
      goalsConceded,
      rating: ratingResult.rating,
      nps: ratingResult.nps
    };
  });
}

/**
 * Calcula métricas individuales por jugador.
 */
function calculatePlayerStatsList(players, teamEvents, opposingShots, isOpponent, opposingEvents = []) {
  const settings = getSettings();
  const ratingCalc = new PlayerRatingCalculator(settings);

  return players.map((player) => {
    const pNumber = String(player.number);
    const isGk = player.is_goalkeeper === true || player.is_goalkeeper === "true";

    const playerEvents = teamEvents.filter((e) => {
      return matchesPlayer(e.player_id, e.player_number, player);
    });

    const shots = isGk ? [] : playerEvents.filter((e) => e.event_type === "shot");
    const goals = isGk ? 0 : shots.filter((e) => e.result === "Gol").length;
    const stops = isGk ? 0 : shots.filter((e) => e.result === "Parada").length;
    const misses = isGk ? 0 : shots.filter((e) => e.result === "Fuera" || e.result === "Poste").length;
    const xg = isGk ? 0 : Math.round(shots.reduce((acc, e) => acc + calculateShotXG(e), 0) * 100) / 100;

    // Pérdidas segmentadas
    const turnoverEvents = playerEvents.filter((e) => e.event_type === "turnover");
    const badPass = turnoverEvents.filter((e) => e.end_reason === "Mal Pase").length;
    const double = turnoverEvents.filter((e) => e.end_reason === "Dobles" || e.end_reason === "Dobles / Pasos").length;
    const travel = turnoverEvents.filter((e) => e.end_reason === "Pasos").length;
    const passive = turnoverEvents.filter((e) => e.end_reason === "Pasivo").length;
    const offensiveFoul = turnoverEvents.filter((e) => e.end_reason === "Falta Ataque" || e.end_reason === "Falta en ataque").length;
    const turnovers = turnoverEvents.length;

    const steals = playerEvents.filter((e) => e.event_type === "steal").length;
    const sanctions = playerEvents.filter((e) => e.event_type === "sanction");
    const yellowCards = sanctions.filter((e) => e.sanction_type === "Tarjeta Amarilla").length;
    const twoMins = sanctions.filter((e) => e.sanction_type === "2 Minutos").length;
    const redCards = sanctions.filter((e) => e.sanction_type === "Tarjeta Roja" || e.sanction_type === "Tarjeta Azul").length;

    // Acciones defensivas y de provocación
    const freeThrowsDrawn = teamEvents.filter((e) => e.event_type === "free_throw" && matchesPlayer(e.player_id, e.player_number, player)).length;

    const offFoulsDrawn = opposingEvents.filter((e) => e.event_type === "turnover" && (e.end_reason === "Falta Ataque" || e.end_reason === "Falta en ataque") && matchesPlayer(e.defender_id, e.defender_number, player)).length;

    const penaltiesCommitted = opposingEvents.filter((e) => e.event_type === "sanction" && e.sanction_type === "7m Provocado" && matchesPlayer(e.player_id, e.player_number, player)).length;

    const drawn7mCount = teamEvents.filter((e) => e.event_type === "sanction" && e.sanction_type === "7m Provocado" && matchesPlayer(e.drawn_by_player, e.drawn_by_number, player)).length;

    const gkShots = isGk
      ? opposingShots.filter((e) => {
          if (e.goalkeeper_number !== undefined && e.goalkeeper_number !== null && e.goalkeeper_number !== 0 && e.goalkeeper_number !== "0") {
            return String(e.goalkeeper_number) === pNumber;
          }
          if (e.goalkeeper_id) {
            return matchesPlayer(e.goalkeeper_id, e.goalkeeper_number, player);
          }
          return true;
        })
      : [];

    const goalkeeperSaves = isGk
      ? gkShots.filter((e) => e.result === "Parada").length
      : 0;

    const goalkeeperShotsFaced = isGk
      ? gkShots.filter((e) => e.result === "Gol" || e.result === "Parada").length
      : 0;

    const goalkeeperSavePct = goalkeeperShotsFaced > 0 ? Math.round((goalkeeperSaves / goalkeeperShotsFaced) * 100) : 0;

    const goalkeeperXSaves = isGk
      ? Math.round(gkShots.reduce((acc, e) => acc + (1 - calculateShotXG(e)), 0) * 10) / 10
      : 0;

    const shotsCount = shots.length;
    const efficiency = shotsCount > 0 ? Math.round((goals / shotsCount) * 100) : 0;

    // Calcular Rating mediante PlayerRatingCalculator
    const ratingResult = ratingCalc.calculateRating(
      {
        shots,
        drawn7mCount,
        turnovers: {
          badPass,
          double,
          travel,
          passive,
          offensiveFoul
        },
        defense: {
          freeThrowsDrawn,
          offFoulsDrawn,
          penaltiesCommitted
        },
        gkShotsFaced: isGk ? gkShots : [],
        discipline: {
          yellowCards,
          twoMinSuspensions: twoMins,
          redCards
        }
      },
      isGk
    );

    return {
      number: player.number,
      name: player.name,
      isGoalkeeper: isGk,
      shotsCount,
      goals,
      stops,
      misses,
      xg,
      efficiency,
      turnovers,
      steals,
      twoMins,
      goalkeeperSaves,
      goalkeeperShotsFaced,
      goalkeeperSavePct,
      goalkeeperXSaves,
      rating: ratingResult.rating,
      nps: ratingResult.nps
    };
  });
}

/**
 * Algoritmo de flujo de Momentum en tiempo real (-100 a +100).
 */
function buildMomentumTimeline(events, totalSeconds) {
  let scoreLocal = 0;
  let scoreAway = 0;
  let momentumVal = 0;

  const points = [{ time: 0, local: 0, away: 0, momentum: 0 }];

  (events || []).forEach((ev) => {
    const time = ev.match_time_seconds || 0;
    let delta = 0;
    const isGoal = ev.event_type === "shot" && ev.result === "Gol";

    if (ev.event_type === "shot") {
      if (ev.result === "Gol") {
        if (ev.is_opponent_action) scoreAway += 1;
        else scoreLocal += 1;
        delta = ev.is_opponent_action ? -15 : 15;
      } else if (ev.result === "Parada") {
        delta = ev.is_opponent_action ? 10 : -10;
      } else {
        delta = ev.is_opponent_action ? 5 : -5;
      }
    } else if (ev.event_type === "turnover") {
      delta = ev.is_opponent_action ? 8 : -8;
    } else if (ev.event_type === "steal") {
      delta = ev.is_opponent_action ? -10 : 10;
    }

    momentumVal = Math.round((momentumVal * 0.7 + delta));
    momentumVal = Math.min(100, Math.max(-100, momentumVal));

    points.push({
      time,
      local: scoreLocal,
      away: scoreAway,
      momentum: momentumVal,
      isGoal,
      isOpponent: ev.is_opponent_action
    });
  });

  return points;
}

/**
 * Cronología de Evolución del Marcador únicamente para los goles anotados.
 */
function buildScoreTimeline(events, totalSeconds) {
  let scoreLocal = 0;
  let scoreAway = 0;

  const points = [{ time: 0, local: 0, away: 0, isGoal: false }];

  (events || []).forEach((ev) => {
    if (ev.event_type === "shot" && ev.result === "Gol") {
      const time = ev.match_time_seconds || 0;
      if (ev.is_opponent_action) {
        scoreAway += 1;
      } else {
        scoreLocal += 1;
      }

      points.push({
        time,
        local: scoreLocal,
        away: scoreAway,
        teamScored: ev.is_opponent_action ? "away" : "local",
        isGoal: true
      });
    }
  });

  const lastTime = points[points.length - 1].time;
  if (totalSeconds && totalSeconds > lastTime) {
    points.push({
      time: totalSeconds,
      local: scoreLocal,
      away: scoreAway,
      isGoal: false
    });
  }

  return points;
}
