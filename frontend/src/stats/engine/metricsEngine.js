/* ==========================================================
   HANDSTATS ANALYTICS — METRICS ENGINE
   Motor de cálculo estadístico para análisis en tiempo real
   ========================================================== */

import { calculateShotXG } from "./xgModel";

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

  const homePossCount = Math.max(1, homePossessions.length || (activePossession?.team === "LOCAL" ? 1 : 0));
  const awayPossCount = Math.max(1, awayPossessions.length || (activePossession?.team === "VISITANTE" ? 1 : 0));

  // Eficiencia Ofensiva = (Goles / Posesiones) * 100
  const homeOffEfficiency = Math.min(100, Math.round((homeGoals / homePossCount) * 100));
  const awayOffEfficiency = Math.min(100, Math.round((awayGoals / awayPossCount) * 100));

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

  // Expected Saves (xSaves)
  const homeGKExpectedSaves = Math.round(awayShots.reduce((acc, e) => acc + (1 - calculateShotXG(e)), 0) * 10) / 10;
  const awayGKExpectedSaves = Math.round(homeShots.reduce((acc, e) => acc + (1 - calculateShotXG(e)), 0) * 10) / 10;

  // Pérdidas y Recuperaciones
  const homeTurnovers = homeEvents.filter((e) => e.event_type === "turnover").length;
  const awayTurnovers = awayEvents.filter((e) => e.event_type === "turnover").length;

  const homeSteals = homeEvents.filter((e) => e.event_type === "steal").length;
  const awaySteals = awayEvents.filter((e) => e.event_type === "steal").length;

  // Exclusiones y Sanciones
  const homeSanctions = homeEvents.filter((e) => e.event_type === "sanction");
  const awaySanctions = awayEvents.filter((e) => e.event_type === "sanction");

  const home2Min = homeSanctions.filter((e) => e.sanction_type === "2 Minutos").length;
  const away2Min = awaySanctions.filter((e) => e.sanction_type === "2 Minutos").length;

  // Golpes Franco
  const homeFreeThrows = homeEvents.filter((e) => {
    const t = (e.event_type || "").toLowerCase();
    return t === "free_throw" || t.includes("golpe") || t.includes("franco");
  }).length;

  const awayFreeThrows = awayEvents.filter((e) => {
    const t = (e.event_type || "").toLowerCase();
    return t === "free_throw" || t.includes("golpe") || t.includes("franco");
  }).length;

  // Ritmo de partido
  const durationMins = Math.max(0.5, (currentTimeSeconds || 1) / 60);
  const totalPossessions = possessions.length;
  const pacePerMin = Math.round((totalPossessions / durationMins) * 10) / 10;

  // Tiempos de posesión
  const homeTotalPossDuration = homePossessions.reduce((acc, p) => acc + (p.duration || 0), 0);
  const awayTotalPossDuration = awayPossessions.reduce((acc, p) => acc + (p.duration || 0), 0);

  const homeAvgPossDuration = homePossessions.length > 0
    ? Math.round(homeTotalPossDuration / homePossessions.length)
    : 0;

  const awayAvgPossDuration = awayPossessions.length > 0
    ? Math.round(awayTotalPossDuration / awayPossessions.length)
    : 0;

  // ---------------------------------------------------------
  // 2. MOMENTUM FLOW & SCORE EVOLUTION
  // ---------------------------------------------------------
  const momentumTimeline = buildMomentumTimeline(events, currentTimeSeconds);
  const currentMomentumValue = momentumTimeline.length > 0 ? momentumTimeline[momentumTimeline.length - 1].value : 0;
  const dominantTeam = currentMomentumValue > 15 ? homeTeam : currentMomentumValue < -15 ? awayTeam : "Partido Igualado";

  // ---------------------------------------------------------
  // 3. DESGLOSE DE TIROS Y EFICIENCIA POR TIPO / ZONA / FASE
  // ---------------------------------------------------------
  const attackBreakdownHome = calculateAttackBreakdown(homeShots);
  const attackBreakdownAway = calculateAttackBreakdown(awayShots);

  // ---------------------------------------------------------
  // 4. ESTADÍSTICAS INDIVIDUALES DE JUGADORES Y PORTEROS
  // ---------------------------------------------------------
  const homePlayerStats = calculatePlayerStatsList(homePlayers, homeEvents, awayShots, false);
  const awayPlayerStats = calculatePlayerStatsList(awayPlayers, awayEvents, homeShots, true);

  // Porteros obtienen métricas estrictamente según configuración del equipo
  const homeGoalkeeperStats = calculateGoalkeeperStatsList(homePlayers, awayShots);
  const awayGoalkeeperStats = calculateGoalkeeperStatsList(awayPlayers, homeShots);

  // Jugadores destacados
  const topScorerHome = [...homePlayerStats].filter(p => !p.isGoalkeeper).sort((a, b) => b.goals - a.goals)[0];
  const topEfficientHome = [...homePlayerStats].filter(p => !p.isGoalkeeper && p.shotsCount >= 2).sort((a, b) => b.efficiency - a.efficiency)[0];
  const worstEfficientHome = [...homePlayerStats].filter(p => !p.isGoalkeeper && p.shotsCount >= 3).sort((a, b) => a.efficiency - b.efficiency)[0];

  return {
    overview: {
      homeTeam,
      awayTeam,
      homeGoals,
      awayGoals,
      homeXG,
      awayXG,
      homeOffEfficiency,
      awayOffEfficiency,
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
 * Filtra y calcula únicamente los porteros configurados explícitamente en el equipo (is_goalkeeper === true).
 */
function calculateGoalkeeperStatsList(players, shotsFacedByTeam) {
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
      if (e.goalkeeper_number !== undefined && e.goalkeeper_number !== null && e.goalkeeper_number !== 0) {
        return String(e.goalkeeper_number) === gkNum;
      }
      return true;
    });

    let gkSaves = gkShotsFaced.filter((e) => e.result === "Parada").length;

    const xSaves = Math.round(
      gkShotsFaced.reduce((acc, e) => acc + (1 - calculateShotXG(e)), 0) * 10
    ) / 10;

    const shotsFacedCount = gkShotsFaced.length;
    const savePct = shotsFacedCount > 0 ? Math.round((gkSaves / shotsFacedCount) * 100) : 0;
    const goalsConceded = shotsFacedCount - gkSaves;

    let rating = 6.0 + gkSaves * 0.6 + (gkSaves - xSaves) * 0.8 - goalsConceded * 0.2;
    rating = Math.min(10.0, Math.max(1.0, Math.round(rating * 10) / 10));

    return {
      number: gk.number,
      name: gk.name,
      isGoalkeeper: true,
      goalkeeperShotsFaced: shotsFacedCount,
      goalkeeperSaves: gkSaves,
      goalkeeperSavePct: savePct,
      expectedSaves: xSaves,
      goalsConceded,
      rating
    };
  });
}

/**
 * Calcula métricas individuales por jugador.
 */
function calculatePlayerStatsList(players, teamEvents, opposingShots, isOpponent) {
  return players.map((player) => {
    const pNumber = String(player.number);
    const pName = player.name;

    const isGk = player.is_goalkeeper === true || player.is_goalkeeper === "true";

    const playerEvents = teamEvents.filter((e) => {
      if (!e.player_id) return false;
      return e.player_id.includes(`${pNumber} -`) || e.player_id === `${pNumber} - ${pName}`;
    });

    const shots = isGk ? [] : playerEvents.filter((e) => e.event_type === "shot");
    const goals = isGk ? 0 : shots.filter((e) => e.result === "Gol").length;
    const stops = isGk ? 0 : shots.filter((e) => e.result === "Parada").length;
    const misses = isGk ? 0 : shots.filter((e) => e.result === "Fuera" || e.result === "Poste").length;
    const xg = isGk ? 0 : Math.round(shots.reduce((acc, e) => acc + calculateShotXG(e), 0) * 100) / 100;

    const turnovers = playerEvents.filter((e) => e.event_type === "turnover").length;
    const steals = playerEvents.filter((e) => e.event_type === "steal").length;
    const sanctions = playerEvents.filter((e) => e.event_type === "sanction");
    const twoMins = sanctions.filter((e) => e.sanction_type === "2 Minutos").length;

    const gkShots = isGk
      ? opposingShots.filter((e) => {
          if (e.goalkeeper_number !== undefined && e.goalkeeper_number !== null && e.goalkeeper_number !== 0) {
            return String(e.goalkeeper_number) === pNumber;
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

    let rating = 6.0 + goals * 0.4 + steals * 0.5 - turnovers * 0.4 - twoMins * 0.3;
    if (isGk) {
      rating = 6.0 + goalkeeperSaves * 0.6 + (goalkeeperSaves - goalkeeperXSaves) * 0.8 - (goalkeeperShotsFaced - goalkeeperSaves) * 0.2;
    }
    rating = Math.min(10.0, Math.max(1.0, Math.round(rating * 10) / 10));

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
      rating
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

  events.forEach((ev) => {
    const time = ev.match_time_seconds || 0;
    let delta = 0;

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
      momentum: momentumVal
    });
  });

  if (totalSeconds > 0 && points[points.length - 1].time !== totalSeconds) {
    points.push({
      time: totalSeconds,
      local: scoreLocal,
      away: scoreAway,
      momentum: momentumVal
    });
  }

  return points;
}
