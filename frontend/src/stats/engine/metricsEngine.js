/* ==========================================================
   HANDSTATS ANALYTICS — METRICS ENGINE
   Motor de cálculo estadístico para análisis en tiempo real
   ========================================================== */

import { calculateShotXG } from "./xgModel.js";
import { getSettings } from "../../services/settingsService.js";
import { PlayerRatingCalculator } from "./playerRatingEngine.js";

/**
 * Helper unificado para determinar si una acción/tiro es a portería vacía.
 */
export function isEmptyNetEvent(e) {
  if (!e) return false;

  // 1. Flags booleanos o string
  if (
    e.is_empty_net === true ||
    e.is_empty_net === "true" ||
    e.is_empty_net === 1 ||
    e.is_empty_net === "1" ||
    e.empty_net_goal === true ||
    e.empty_net_goal === "true" ||
    e.empty_net_goal === 1 ||
    e.empty_net_goal === "1"
  ) {
    return true;
  }

  // 2. Comprobación en shot_type
  const type = String(e.shot_type || "").toLowerCase().trim();
  if (
    type === "portería vacía" ||
    type === "porteria vacia" ||
    type === "porteria_vacia" ||
    type === "empty_net" ||
    type.includes("porteria vacia") ||
    type.includes("portería vacía") ||
    type.includes("empty_net") ||
    type.includes("p. vacía") ||
    type.includes("p. vacia")
  ) {
    return true;
  }

  // 3. Situación táctica o numérica
  const sit = String(e.numerical_situation || e.tactical_situation || "").toLowerCase().trim();
  if (
    sit === "porteria_vacia" ||
    sit === "empty_net" ||
    sit.includes("porteria vacia") ||
    sit.includes("portería vacía") ||
    sit.includes("empty_net")
  ) {
    return true;
  }

  // 4. Defending situation
  const defSit = String(e.defending_situation || "").toLowerCase().trim();
  if (
    defSit === "porteria_vacia" ||
    defSit === "empty_net" ||
    defSit.includes("porteria vacia") ||
    defSit.includes("portería vacía") ||
    defSit.includes("empty_net") ||
    defSit.includes("sin portero")
  ) {
    return true;
  }

  // 5. Action key
  const actionKey = String(e.action_key || "").toLowerCase().trim();
  if (actionKey.includes("porteria_vacia") || actionKey.includes("empty_net")) {
    return true;
  }

  // 6. Description
  const desc = String(e.description || "").toLowerCase().trim();
  if (desc.includes("portería vacía") || desc.includes("porteria vacia") || desc.includes("empty net")) {
    return true;
  }

  // 7. Si es un lanzamiento o gol y el portero bajo palos es explícitamente null o 0
  if (
    (e.event_type === "shot" || e.result === "Gol") &&
    (e.goalkeeper_number === null || e.goalkeeper_number === 0 || e.goalkeeper_number === "0")
  ) {
    return true;
  }

  return false;
}

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

  // Paradas de nuestra portería local (tiros rivales awayShots atajados por portero local, excluyendo tiros a portería vacía)
  const homeGKShotsFaced = awayShots.filter((e) => (e.result === "Gol" || e.result === "Parada") && !isEmptyNetEvent(e));
  const homeGKSaves = homeStopsByGK;
  const homeGKSavePct = homeGKShotsFaced.length > 0 ? Math.round((homeGKSaves / homeGKShotsFaced.length) * 100) : 0;

  // Paradas de nuestra portería visitante (tiros locales homeShots atajados por portero visitante, excluyendo tiros a portería vacía)
  const awayGKShotsFaced = homeShots.filter((e) => (e.result === "Gol" || e.result === "Parada") && !isEmptyNetEvent(e));
  const awayGKSaves = awayStopsByGK;
  const awayGKSavePct = awayGKShotsFaced.length > 0 ? Math.round((awayGKSaves / awayGKShotsFaced.length) * 100) : 0;

  // xSaves acumulado (solo ante tiros recibidos en portería con portero)
  const homeGKExpectedSaves = Math.round(awayShots.filter((e) => !isEmptyNetEvent(e)).reduce((acc, e) => acc + (1 - calculateShotXG(e)), 0) * 10) / 10;
  const awayGKExpectedSaves = Math.round(homeShots.filter((e) => !isEmptyNetEvent(e)).reduce((acc, e) => acc + (1 - calculateShotXG(e)), 0) * 10) / 10;

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

  // Rebotes (Ofensivos, Defensivos y Totales)
  const isOffRebound = (e) => e.rebound === "attack" || e.rebound === "offensive" || e.rebound_type === "offensive";
  const isDefRebound = (e) => e.rebound === "defense" || e.rebound === "defensive" || e.rebound_type === "defensive";

  const homeOffRebounds = homeShots.filter(isOffRebound).length + homeEvents.filter((e) => e.event_type === "rebound" && isOffRebound(e)).length;
  const awayOffRebounds = awayShots.filter(isOffRebound).length + awayEvents.filter((e) => e.event_type === "rebound" && isOffRebound(e)).length;

  const homeDefRebounds = awayShots.filter(isDefRebound).length + homeEvents.filter((e) => e.event_type === "rebound" && isDefRebound(e)).length;
  const awayDefRebounds = homeShots.filter(isDefRebound).length + awayEvents.filter((e) => e.event_type === "rebound" && isDefRebound(e)).length;

  const homeTotalRebounds = homeOffRebounds + homeDefRebounds;
  const awayTotalRebounds = awayOffRebounds + awayDefRebounds;

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
  const totalDurationSeconds = currentTimeSeconds > 0
    ? currentTimeSeconds
    : (events.length > 0 ? Math.max(...events.map((e) => Number(e.match_time_seconds) || 0), 0) : 3600);

  const homePlayerStats = calculatePlayerStatsList(homePlayers, homeEvents, awayShots, false, awayEvents, totalDurationSeconds, events);
  const awayPlayerStats = calculatePlayerStatsList(awayPlayers, awayEvents, homeShots, true, homeEvents, totalDurationSeconds, events);

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
      homeOffRebounds,
      awayOffRebounds,
      homeDefRebounds,
      awayDefRebounds,
      homeTotalRebounds,
      awayTotalRebounds,
      homeRebounds: homeTotalRebounds,
      awayRebounds: awayTotalRebounds,
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
    tacticalSituations: calculateMatchTacticalSituations(match),
    homePlayerStats,
    awayPlayerStats,
    homeGoalkeeperStats,
    awayGoalkeeperStats
  };
}

/**
 * Clasifica y calcula las métricas por Situación Numérica y Táctica (7vs6, 6vs6 sin portero, etc.)
 */
export function calculateMatchTacticalSituations(match) {
  const events = match?.events || [];
  const homeEvents = events.filter((e) => !e.is_opponent_action);
  const awayEvents = events.filter((e) => e.is_opponent_action);

  const classifySituation = (ev) => {
    if (isEmptyNetEvent(ev)) {
      return "emptyNet";
    }

    const sit = String(ev.numerical_situation || ev.situation || ev.tactical_situation || "").toLowerCase();
    if (sit.includes("7vs6") || sit.includes("7v6") || sit.includes("7 contra 6") || sit.includes("7-6") || ev.tactical_situation === "7vs6") {
      return "sevenVsSix";
    }
    if (sit.includes("6vs6 sin portero") || sit.includes("6v6 sin portero") || sit.includes("6vs6_sin_portero") || sit.includes("6v6_sin_portero") || sit.includes("sin portero") || ev.tactical_situation === "6vs6_sin_portero") {
      return "sixVsSixNoGk";
    }
    if (sit.includes("superior") || sit.includes("+1") || sit.includes("+2")) return "superiority";
    if (sit.includes("inferior") || sit.includes("-1") || sit.includes("-2")) return "inferiority";

    // Correlación con exclusiones de 2 min
    if (ev.match_time_seconds !== undefined && ev.match_time_seconds !== null) {
      const eventTime = Number(ev.match_time_seconds);
      let homeExcl = 0;
      let awayExcl = 0;
      events.forEach((otherEv) => {
        const isSanction = otherEv.event_type === "sanction";
        const sType = String(otherEv.sanction_type || "").toLowerCase();
        const is2Min = sType.includes("2 min") || sType.includes("exclusion") || sType.includes("2min") || sType.includes("dos minutos");
        if (isSanction && is2Min) {
          const start = Number(otherEv.match_time_seconds) || 0;
          const end = start + 120;
          if (eventTime >= start && eventTime < end) {
            const evIsAway = otherEv.team === "VISITANTE" || otherEv.is_opponent_action === true || otherEv.is_opponent_action === "true";
            if (evIsAway) awayExcl += 1;
            else homeExcl += 1;
          }
        }
      });
      const isAway = ev.team === "VISITANTE" || ev.is_opponent_action === true || ev.is_opponent_action === "true";
      if (isAway) {
        if (awayExcl > homeExcl) return "inferiority";
        if (awayExcl < homeExcl) return "superiority";
      } else {
        if (homeExcl > awayExcl) return "inferiority";
        if (homeExcl < awayExcl) return "superiority";
      }
    }
    return "equality";
  };

  const calculateForTeam = (teamEvents, opposingEvents, isHomeTeam = true) => {
    const data = {
      equality: { key: "equality", label: "Igualdad (6vs6)", shots: 0, goals: 0, sevenMeters: 0, turnovers: 0, emptyNetGoalsConceded: 0, xg: 0 },
      superiority: { key: "superiority", label: "Superioridad", shots: 0, goals: 0, sevenMeters: 0, turnovers: 0, emptyNetGoalsConceded: 0, xg: 0 },
      inferiority: { key: "inferiority", label: "Inferioridad", shots: 0, goals: 0, sevenMeters: 0, turnovers: 0, emptyNetGoalsConceded: 0, xg: 0 },
      sevenVsSix: { key: "sevenVsSix", label: "7 vs 6 (PJ)", shots: 0, goals: 0, sevenMeters: 0, turnovers: 0, emptyNetGoalsConceded: 0, xg: 0 },
      sixVsSixNoGk: { key: "sixVsSixNoGk", label: "6 vs 6 Sin Portero", shots: 0, goals: 0, sevenMeters: 0, turnovers: 0, emptyNetGoalsConceded: 0, xg: 0 },
      emptyNet: { key: "emptyNet", label: "Portería Vacía", shots: 0, goals: 0, sevenMeters: 0, turnovers: 0, emptyNetGoalsConceded: 0, xg: 0 }
    };

    teamEvents.forEach((ev) => {
      const type = String(ev.shot_type || "").toLowerCase();
      const sitKey = classifySituation(ev);
      const target = data[sitKey] || data.equality;

      if (ev.event_type === "shot") {
        target.shots += 1;
        if (ev.result === "Gol") target.goals += 1;
        target.xg = (target.xg || 0) + calculateShotXG(ev);
        if (type.includes("7m") || type.includes("7 metros") || type.includes("penalti")) {
          target.sevenMeters += 1;
        }
      } else if (ev.event_type === "turnover") {
        target.turnovers += 1;
      } else if (ev.event_type === "free_throw" && (ev.is_7m || ev.penalty)) {
        target.sevenMeters += 1;
      }
    });

    opposingEvents.forEach((oppEv) => {
      const isGoal = oppEv.event_type === "shot" && oppEv.result === "Gol";
      const isEmptyNet = Boolean(isEmptyNetEvent(oppEv));
      if (isGoal && isEmptyNet) {
        const defSit = String(oppEv.defending_situation || "").toLowerCase();
        if (defSit.includes("7vs6") || defSit.includes("7v6") || defSit.includes("7-6")) {
          data.sevenVsSix.emptyNetGoalsConceded += 1;
        } else if (defSit.includes("6vs6") || defSit.includes("sin portero")) {
          data.sixVsSixNoGk.emptyNetGoalsConceded += 1;
        } else if (defSit.includes("porteria vacia") || defSit.includes("portería vacía") || defSit.includes("vacia") || defSit.includes("vacía")) {
          data.emptyNet.emptyNetGoalsConceded += 1;
        } else {
          const eventTime = Number(oppEv.match_time_seconds) || 0;
          let teamExcl = 0;
          events.forEach((otherEv) => {
            const isSanction = otherEv.event_type === "sanction";
            const sType = String(otherEv.sanction_type || "").toLowerCase();
            const is2Min = sType.includes("2 min") || sType.includes("exclusion") || sType.includes("2min") || sType.includes("dos minutos");
            if (isSanction && is2Min) {
              const start = Number(otherEv.match_time_seconds) || 0;
              const end = start + 120;
              if (eventTime >= start && eventTime < end) {
                const sanctionIsOpponent = otherEv.team === "VISITANTE" || otherEv.is_opponent_action === true || otherEv.is_opponent_action === "true";
                const isOurTeamSanction = isHomeTeam ? !sanctionIsOpponent : sanctionIsOpponent;
                if (isOurTeamSanction) teamExcl += 1;
              }
            }
          });
          if (teamExcl === 0) {
            data.sevenVsSix.emptyNetGoalsConceded += 1;
          } else if (teamExcl === 1) {
            data.sixVsSixNoGk.emptyNetGoalsConceded += 1;
          } else {
            data.inferiority.emptyNetGoalsConceded += 1;
          }
        }
      }
    });

    const totalAttacks =
      data.equality.shots + data.equality.turnovers +
      data.superiority.shots + data.superiority.turnovers +
      data.inferiority.shots + data.inferiority.turnovers +
      data.sevenVsSix.shots + data.sevenVsSix.turnovers +
      data.sixVsSixNoGk.shots + data.sixVsSixNoGk.turnovers +
      data.emptyNet.shots + data.emptyNet.turnovers;

    const grandTotal = Math.max(1, totalAttacks);

    const enrich = (item) => {
      const attacks = item.shots + item.turnovers;
      return {
        ...item,
        goalPct: item.shots > 0 ? Math.round((item.goals / item.shots) * 100) : 0,
        attackPct: Math.round((attacks / grandTotal) * 100),
        totalAttacks: attacks,
        netBalance: item.goals - item.emptyNetGoalsConceded,
        xg: Math.round((item.xg || 0) * 100) / 100
      };
    };

    return {
      equality: enrich(data.equality),
      superiority: enrich(data.superiority),
      inferiority: enrich(data.inferiority),
      sevenVsSix: enrich(data.sevenVsSix),
      sixVsSixNoGk: enrich(data.sixVsSixNoGk),
      emptyNet: enrich(data.emptyNet)
    };
  };

  return {
    home: calculateForTeam(homeEvents, awayEvents, true),
    away: calculateForTeam(awayEvents, homeEvents, false)
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
    const rawSit = String(s.numerical_situation || s.tactical_situation || "Igualdad").toLowerCase();
    let sit = "Igualdad";
    if (isEmptyNetEvent(s)) {
      sit = "Portería Vacía";
    } else if (rawSit.includes("7vs6") || rawSit.includes("7v6") || rawSit.includes("7 contra 6")) {
      sit = "7vs6";
    } else if (rawSit.includes("6vs6 sin portero") || rawSit.includes("6v6 sin portero") || rawSit.includes("sin portero")) {
      sit = "6vs6 sin portero";
    } else if (rawSit.includes("superior")) {
      sit = "Superioridad";
    } else if (rawSit.includes("inferior")) {
      sit = "Inferioridad";
    }
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
    (e) =>
      e.event_type === "shot" &&
      (e.result === "Gol" || e.result === "Parada") &&
      !isEmptyNetEvent(e)
  );

  const gks = players.filter((p) => isPlayerGk(p, players));

  if (gks.length === 0) {
    return [];
  }

  return gks.map((gk) => {
    const gkNum = String(gk.number);

    let gkShotsFaced = onTargetShots.filter((e) => {
      if (isEmptyNetEvent(e)) {
        return false;
      }
      if (e.goalkeeper_number !== undefined && e.goalkeeper_number !== null && e.goalkeeper_number !== 0 && e.goalkeeper_number !== "0") {
        return String(e.goalkeeper_number) === gkNum;
      }
      if (e.goalkeeper_id) {
        return matchesPlayer(e.goalkeeper_id, e.goalkeeper_number, gk);
      }
      // Si solo hay un portero, pero el tiro no tiene asignado portero explícitamente (es nulo/0 o a puerta vacía), NO pertenece al portero
      if (gks.length === 1 && e.goalkeeper_number !== null && e.goalkeeper_number !== 0 && e.goalkeeper_number !== "0") {
        return true;
      }
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
 * Helper para verificar si un jugador es portero.
 */
export function isPlayerGk(p, teamRoster = []) {
  if (!p) return false;
  const posUpper = String(p.position || "").toUpperCase().trim();
  if (
    posUpper === "PORTERO" ||
    posUpper === "POR" ||
    posUpper.includes("PORTER") ||
    posUpper.includes("GOALKEEPER") ||
    p.is_goalkeeper === true ||
    p.is_goalkeeper === "true" ||
    p.isGoalkeeper === true
  ) {
    return true;
  }
  const anyExplicit = (teamRoster || []).some(
    (x) => {
      if (!x) return false;
      const xp = String(x.position || "").toUpperCase().trim();
      return xp === "PORTERO" || xp === "POR" || xp.includes("PORTER") || xp.includes("GOALKEEPER") || x.is_goalkeeper === true || x.is_goalkeeper === "true" || x.isGoalkeeper === true;
    }
  );
  if (!anyExplicit) {
    return [1, 12, 16].includes(Number(p.number));
  }
  return false;
}

/**
 * Formatea un número de segundos en MM:SS.
 */
export function formatMinutesSeconds(totalSeconds = 0) {
  const s = Math.max(0, Math.round(totalSeconds));
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

/**
 * Calcula los segundos jugados por un jugador en un partido a partir del historial de sustituciones y titulares.
 * @param {Object} player - Objeto del jugador (número, is_starter, minutes_played, etc.)
 * @param {Array} matchEvents - Historial de eventos del partido
 * @param {boolean} isOpponent - Si el jugador pertenece al equipo visitante
 * @param {number} currentTimeSeconds - Segundo actual o duración total del partido
 * @param {Array} initialRoster - Plantilla con estados iniciales de titularidad
 * @returns {number} Segundos jugados
 */
export function calculatePlayerPlayingSeconds(
  player,
  matchEvents = [],
  isOpponent = false,
  currentTimeSeconds = 0,
  initialRoster = []
) {
  if (!player) return 0;

  // 1. Si el jugador tiene minutos asignados manualmente (en player.minutes_played)
  if (
    player.minutes_played !== undefined &&
    player.minutes_played !== null &&
    !isNaN(player.minutes_played)
  ) {
    return Math.round(Number(player.minutes_played) * 60);
  }

  const pNum = Number(player.number);
  const totalSecsLimit = Math.max(0, currentTimeSeconds);

  // 2. Filtrar eventos de sustitución de este equipo
  const subEvents = (matchEvents || []).filter((e) => {
    const isSub =
      e.event_type === "substitution" ||
      e.event_type === "cambio" ||
      e.category === "cambios" ||
      e.category === "cambio" ||
      e.action_key === "cambio" ||
      e.action_key === "substitution";
    const evIsOpp =
      e.is_opponent_action === true ||
      e.is_opponent_action === "true" ||
      e.team === "VISITANTE";
    return isSub && (isOpponent ? evIsOpp : !evIsOpp);
  }).sort(
    (a, b) => (Number(a.match_time_seconds) || 0) - (Number(b.match_time_seconds) || 0)
  );

  const initialEntry = (initialRoster || []).find((p) => Number(p.number) === pNum);
  const onCourtIntervals = [];

  // 3. Si no hay eventos de sustitución registrados en el partido para este equipo:
  if (subEvents.length === 0) {
    // Si nunca ha habido cambios, la titularidad actual en pista define con total fidelidad quién está jugando
    const isCurrentlyOnCourt = initialEntry?.is_starter !== undefined
      ? Boolean(initialEntry.is_starter)
      : (player.is_starter !== undefined
        ? Boolean(player.is_starter)
        : Boolean(initialEntry?.initial_starter ?? player.initial_starter));

    if (isCurrentlyOnCourt) {
      onCourtIntervals.push({ start: 0, end: totalSecsLimit });
    } else {
      // Si un suplente tuvo acciones de juego registradas en pista (lanzamientos, pérdidas, paradas):
      const playerActionTimes = (matchEvents || [])
        .filter(
          (e) =>
            (isOpponent
              ? e.is_opponent_action || e.team === "VISITANTE"
              : !e.is_opponent_action && e.team !== "VISITANTE") &&
            e.event_type !== "sanction" &&
            (Number(e.player_number ?? e.player_id ?? e.shooter_number) === pNum ||
              Number(e.goalkeeper_number ?? e.goalkeeper_id) === pNum)
        )
        .map((e) => Number(e.match_time_seconds) || 0);

      if (playerActionTimes.length > 0 && totalSecsLimit > 0) {
        const minTime = Math.min(...playerActionTimes);
        const maxTime = Math.max(...playerActionTimes);
        onCourtIntervals.push({
          start: Math.max(0, minTime - 60),
          end: Math.min(totalSecsLimit, maxTime + 60)
        });
      }
    }
  } else {
    // 4. Si hay sustituciones: determinar si empezó en pista en t = 0 (wasStarter)
    let wasStarter = false;

    const firstSubForPlayer = subEvents.find(
      (e) =>
        Number(e.player_in_number ?? e.player_in_id) === pNum ||
        Number(e.player_out_number ?? e.player_out_id) === pNum
    );

    if (firstSubForPlayer) {
      // Empíricamente demostrado por el primer cambio:
      // Si su primer cambio es salir, estaba en pista desde t=0.
      // Si su primer cambio es entrar, estaba en el banquillo.
      const isFirstSubOut = Number(firstSubForPlayer.player_out_number ?? firstSubForPlayer.player_out_id) === pNum;
      wasStarter = isFirstSubOut;
    } else {
      // El jugador NUNCA fue sustituido en el partido.
      // Si su estado en la plantilla es titular (en pista), ha jugado ininterrumpidamente desde el inicio.
      // Si su estado en la plantilla es suplente (banquillo), ha estado en el banquillo.
      if (initialEntry?.is_starter !== undefined) {
        wasStarter = Boolean(initialEntry.is_starter);
      } else if (player.is_starter !== undefined) {
        wasStarter = Boolean(player.is_starter);
      } else if (initialEntry?.initial_starter !== undefined) {
        wasStarter = Boolean(initialEntry.initial_starter);
      } else if (player.initial_starter !== undefined) {
        wasStarter = Boolean(player.initial_starter);
      } else {
        const pIsGk = isPlayerGk(player, initialRoster);
        if (pIsGk) {
          const opposingShots = (matchEvents || []).filter((e) => {
            const evIsOpp =
              e.is_opponent_action === true ||
              e.is_opponent_action === "true" ||
              e.team === "VISITANTE";
            const isAgainstOurGoal = isOpponent ? !evIsOpp : evIsOpp;
            return isAgainstOurGoal && e.event_type === "shot" && !isEmptyNetEvent(e);
          });

          const shotsFacedByThisGk = opposingShots.filter((e) => {
            return Number(e.goalkeeper_number ?? e.goalkeeper_id) === pNum;
          }).length;

          const otherGksInRoster = (initialRoster || []).filter(
            (p) => isPlayerGk(p, initialRoster) && Number(p.number) !== pNum
          );

          const anyOtherGkFacedMore = otherGksInRoster.some((ogk) => {
            const ogkShots = opposingShots.filter((e) => {
              return Number(e.goalkeeper_number ?? e.goalkeeper_id) === Number(ogk.number);
            }).length;
            return ogkShots > shotsFacedByThisGk;
          });

          if (shotsFacedByThisGk > 0 && !anyOtherGkFacedMore) {
            wasStarter = true;
          } else if (anyOtherGkFacedMore) {
            wasStarter = false;
          } else {
            const starterGkCandidate = (initialRoster || []).find((p) => isPlayerGk(p, initialRoster) && p.is_starter);
            const firstGk = starterGkCandidate || (initialRoster || []).find((p) => isPlayerGk(p, initialRoster));
            wasStarter = firstGk ? Number(firstGk.number) === pNum : false;
          }
        } else {
          const hasActions = (matchEvents || []).some((e) => {
            const evIsOpp =
              e.is_opponent_action === true ||
              e.is_opponent_action === "true" ||
              e.team === "VISITANTE";
            const isOurTeam = isOpponent ? evIsOpp : !evIsOpp;
            return isOurTeam && e.event_type !== "sanction" && Number(e.player_number ?? e.player_id ?? e.shooter_number) === pNum;
          });

          const fieldPlayers = (initialRoster || []).filter((p) => !isPlayerGk(p, initialRoster));
          const starterFieldCandidates = fieldPlayers.slice(0, 6);
          wasStarter = hasActions || starterFieldCandidates.some((p) => Number(p.number) === pNum);
        }
      }
    }

    // 5. Recorrer eventos de sustitución y construir intervalos en pista
    let onCourt = wasStarter;
    let stintStart = onCourt ? 0 : null;

    for (const ev of subEvents) {
      const evTime = Math.min(
        totalSecsLimit,
        Math.max(0, Number(ev.match_time_seconds) || 0)
      );
      const inNum = Number(ev.player_in_number ?? ev.player_in_id);
      const outNum = Number(ev.player_out_number ?? ev.player_out_id);

      if (outNum === pNum) {
        if (onCourt && stintStart !== null) {
          onCourtIntervals.push({ start: stintStart, end: evTime });
        } else if (!onCourt && onCourtIntervals.length === 0 && stintStart === null) {
          // Auto-corrección: Si sale del campo pero constaba como suplente, significa que estuvo desde t=0
          onCourtIntervals.push({ start: 0, end: evTime });
        }
        onCourt = false;
        stintStart = null;
      } else if (inNum === pNum) {
        if (!onCourt) {
          onCourt = true;
          stintStart = evTime;
        }
      }
    }

    if (onCourt && stintStart !== null) {
      onCourtIntervals.push({ start: stintStart, end: totalSecsLimit });
    }
  }

  // 6. Obtener intervalos de exclusión disciplinaria del jugador (2 Minutos y Tarjeta Roja/Azul)
  const EXCLUSION_DURATION = 120; // 120 segundos reglamentarios

  const playerSanctions = (matchEvents || []).filter((e) => {
    const isSanction =
      e.event_type === "sanction" ||
      e.category === "sanciones" ||
      e.category === "sancion";
    if (!isSanction) return false;

    const evIsOpp =
      e.is_opponent_action === true ||
      e.is_opponent_action === "true" ||
      e.team === "VISITANTE";
    if (isOpponent ? !evIsOpp : evIsOpp) return false;

    const evPNum = Number(e.player_number ?? e.player_id ?? e.shooter_number ?? e.player?.number);
    return evPNum === pNum;
  });

  const rawExclusions = [];

  for (const s of playerSanctions) {
    const sType = String(s.sanction_type || s.action_key || s.sanctionType || "").toLowerCase().trim();
    const sTime = Math.max(0, Number(s.match_time_seconds) || 0);

    const is2Min =
      sType.includes("2 min") ||
      sType.includes("exclusion") ||
      sType.includes("exclusión") ||
      sType.includes("2min") ||
      sType.includes("dos minutos");

    const isRedOrBlue =
      sType.includes("roja") ||
      sType.includes("red") ||
      sType.includes("azul") ||
      sType.includes("blue") ||
      sType.includes("descalific") ||
      sType.includes("expulsi");

    if (is2Min) {
      rawExclusions.push({
        start: sTime,
        end: sTime + EXCLUSION_DURATION
      });
    } else if (isRedOrBlue) {
      rawExclusions.push({
        start: sTime,
        end: Math.max(sTime, totalSecsLimit)
      });
    }
  }

  // Fusionar exclusiones solapadas o consecutivas
  rawExclusions.sort((a, b) => a.start - b.start);
  const mergedExclusions = [];
  for (const item of rawExclusions) {
    if (mergedExclusions.length === 0) {
      mergedExclusions.push({ ...item });
    } else {
      const last = mergedExclusions[mergedExclusions.length - 1];
      if (item.start < last.end) {
        if (item.start === last.start && (item.end - item.start === EXCLUSION_DURATION) && (last.end - last.start === EXCLUSION_DURATION)) {
          last.end += EXCLUSION_DURATION;
        } else {
          last.end = Math.max(last.end, item.end);
        }
      } else {
        mergedExclusions.push({ ...item });
      }
    }
  }

  // 7. Calcular tiempo efectivo jugado deduciendo los periodos en los que el jugador estuvo excluido
  let totalPlayed = 0;

  for (const cInt of onCourtIntervals) {
    const start = Math.max(0, cInt.start);
    const end = Math.min(totalSecsLimit, cInt.end);
    if (end <= start) continue;

    let intDuration = end - start;

    for (const excl of mergedExclusions) {
      const overlapStart = Math.max(start, excl.start);
      const overlapEnd = Math.min(end, excl.end);
      if (overlapEnd > overlapStart) {
        intDuration -= (overlapEnd - overlapStart);
      }
    }

    totalPlayed += Math.max(0, intDuration);
  }

  return Math.min(totalSecsLimit, Math.max(0, totalPlayed));
}

/**
 * Calcula métricas individuales por jugador.
 */
function calculatePlayerStatsList(
  players,
  teamEvents,
  opposingShots,
  isOpponent,
  opposingEvents = [],
  totalDurationSeconds = 0,
  allMatchEvents = []
) {
  const settings = getSettings();
  const ratingCalc = new PlayerRatingCalculator(settings);

  return players.map((player) => {
    const pNumber = String(player.number);
    const isGk = isPlayerGk(player, players);

    // Cálculo de tiempo jugado
    const secondsPlayed = calculatePlayerPlayingSeconds(
      player,
      allMatchEvents,
      isOpponent,
      totalDurationSeconds,
      players
    );
    const minutesPlayed = Math.round((secondsPlayed / 60) * 10) / 10;
    const minutesPlayedFormatted = formatMinutesSeconds(secondsPlayed);

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

    const gksInTeam = (players || []).filter((p) => isPlayerGk(p, players));

    const gkShots = isGk
      ? opposingShots.filter((e) => {
          if (isEmptyNetEvent(e)) {
            return false;
          }
          if (e.goalkeeper_number !== undefined && e.goalkeeper_number !== null && e.goalkeeper_number !== 0 && e.goalkeeper_number !== "0") {
            return String(e.goalkeeper_number) === pNumber;
          }
          if (e.goalkeeper_id) {
            return matchesPlayer(e.goalkeeper_id, e.goalkeeper_number, player);
          }
          // Si solo hay un portero en la plantilla y el tiro no tiene asignado portero explícitamente (es nulo/0 o a puerta vacía), NO pertenece al portero
          if (gksInTeam.length === 1 && e.goalkeeper_number !== null && e.goalkeeper_number !== 0 && e.goalkeeper_number !== "0") {
            return true;
          }
          return false;
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
      secondsPlayed,
      minutesPlayed,
      minutesPlayedFormatted,
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
