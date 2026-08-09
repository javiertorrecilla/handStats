import { calculateMatchMetrics } from "./metricsEngine";
import { generateGoalGridMatrix, generateCourtHeatmap } from "./heatmapEngine";

/**
 * Helper robusto para determinar si un evento pertenece a un equipo dado en un partido.
 */
export function isEventOfTeam(ev, teamNameLower, isHomeMatchTeam, match) {
  if (!ev) return false;

  const homeName = (match?.home_team || "").trim().toLowerCase();
  const awayName = (match?.away_team || "").trim().toLowerCase();

  // 1. Si el evento indica explícitamente el nombre del equipo
  if (ev.team) {
    const evTeamLower = ev.team.trim().toLowerCase();
    if (evTeamLower === teamNameLower) return true;
    if (evTeamLower === "local" && isHomeMatchTeam) return true;
    if (evTeamLower === "visitante" && !isHomeMatchTeam) return true;
    if (evTeamLower === "away" && !isHomeMatchTeam) return true;
    if (evTeamLower === "home" && isHomeMatchTeam) return true;
    if (evTeamLower === homeName && isHomeMatchTeam) return true;
    if (evTeamLower === awayName && !isHomeMatchTeam) return true;
  }

  // 2. Si el evento indica flag de oponente (boolean o string)
  const isOpponentFlag = ev.is_opponent_action === true || ev.is_opponent_action === "true" || ev.is_opponent === true || ev.is_opponent === "true";

  if (isHomeMatchTeam) {
    return !isOpponentFlag;
  } else {
    return isOpponentFlag;
  }
}

/**
 * Computes cumulative team statistics across all played matches for a specific team.
 */
export function calculateTeamCumulativeStats(teamName, matchesList = []) {
  if (!teamName || !Array.isArray(matchesList)) {
    return null;
  }

  const teamNameLower = teamName.trim().toLowerCase();

  // 1. Filter all matches involving this team
  const teamMatches = matchesList.filter((m) => {
    const h = (m.home_team || "").trim().toLowerCase();
    const a = (m.away_team || "").trim().toLowerCase();
    return h === teamNameLower || a === teamNameLower;
  });

  if (teamMatches.length === 0) {
    return {
      totalMatches: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDiff: 0,
      avgGoalsFor: 0,
      avgGoalsAgainst: 0,
      totalXG: 0,
      totalXGA: 0,
      avgXG: 0,
      avgXGA: 0,
      totalShots: 0,
      shotEfficiency: 0,
      avgOffEfficiency: 50,
      avgDefEfficiency: 50,
      totalSaves: 0,
      totalShotsFaced: 0,
      savePct: 0,
      totalTurnovers: 0,
      avgTurnovers: 0,
      totalSteals: 0,
      avgSteals: 0,
      totalSanctions: 0,
      totalFreeThrows: 0,
      avgFreeThrows: 0,
      totalPossessionsCount: 0,
      avgPossessionsPerMatch: 0,
      avgPossessionDuration: 0,
      avgPace: 0.8,
      playerStats: [],
      matchHistory: [],
      shotPhases: { posicional: 0, oleada1: 0, oleada2: 0, penalti: 0 },
      goalGrid: {},
      courtHeatmap: [],
      allTeamShotsEvents: [],
      allTeamGkShotsFaced: []
    };
  }

  let wins = 0;
  let draws = 0;
  let losses = 0;
  let goalsFor = 0;
  let goalsAgainst = 0;
  let totalXG = 0;
  let totalXGA = 0;
  let totalShots = 0;
  let totalGoals = 0;
  let totalSaves = 0;
  let totalShotsFaced = 0;
  let totalTurnovers = 0;
  let totalSteals = 0;
  let totalSanctions = 0;
  let totalFreeThrows = 0;
  let totalPossessionsCount = 0;
  let sumPossessionDurations = 0;
  let sumPace = 0;

  const playerStatsMap = {};
  const matchHistory = [];
  const allTeamShotsEvents = [];
  const allTeamGkShotsFaced = [];
  const shotPhases = { posicional: 0, oleada1: 0, oleada2: 0, penalti: 0 };

  teamMatches.forEach((m) => {
    const isHome = (m.home_team || "").trim().toLowerCase() === teamNameLower;
    const teamGoals = isHome ? (m.goals_home || 0) : (m.goals_away || 0);
    const oppGoals = isHome ? (m.goals_away || 0) : (m.goals_home || 0);
    const oppTeamName = isHome ? m.away_team : m.home_team;

    goalsFor += teamGoals;
    goalsAgainst += oppGoals;

    if (teamGoals > oppGoals) wins++;
    else if (teamGoals === oppGoals) draws++;
    else losses++;

    // Calculate match metrics using metricsEngine
    const mMetrics = calculateMatchMetrics(m);
    if (!mMetrics || !mMetrics.overview) return;

    const teamXG = isHome ? parseFloat(mMetrics.overview.homeXG) : parseFloat(mMetrics.overview.awayXG);
    const oppXG = isHome ? parseFloat(mMetrics.overview.awayXG) : parseFloat(mMetrics.overview.homeXG);

    totalXG += isNaN(teamXG) ? 0 : teamXG;
    totalXGA += isNaN(oppXG) ? 0 : oppXG;

    const freeThrows = isHome ? (mMetrics.overview.homeFreeThrows || 0) : (mMetrics.overview.awayFreeThrows || 0);
    totalFreeThrows += freeThrows;

    const possCount = isHome ? (mMetrics.overview.homePossCount || 0) : (mMetrics.overview.awayPossCount || 0);
    const avgPossDuration = isHome ? (mMetrics.overview.homeAvgPossDuration || 0) : (mMetrics.overview.awayAvgPossDuration || 0);
    totalPossessionsCount += possCount;
    sumPossessionDurations += avgPossDuration;

    if (mMetrics.overview.pacePerMin) {
      sumPace += mMetrics.overview.pacePerMin;
    }

    // Collect team events con filtrado robusto para tiros de ataque y tiros recibidos en portería
    if (m.events && Array.isArray(m.events)) {
      m.events.forEach((ev) => {
        const isTeamEvent = isEventOfTeam(ev, teamNameLower, isHome, m);
        if (isTeamEvent) {
          if (ev.event_type === "shot") {
            allTeamShotsEvents.push(ev);
            totalShots++;
            if (ev.result === "Gol") totalGoals++;

            // Phase distribution
            const shotType = (ev.shot_type || "").toLowerCase();
            if (shotType.includes("7m") || shotType.includes("penalti")) shotPhases.penalti++;
            else if (shotType.includes("contraataque") || shotType.includes("1ª")) shotPhases.oleada1++;
            else if (shotType.includes("2ª")) shotPhases.oleada2++;
            else shotPhases.posicional++;
          } else if (ev.event_type === "turnover") {
            totalTurnovers++;
          } else if (ev.event_type === "steal") {
            totalSteals++;
          } else if (ev.event_type === "sanction") {
            totalSanctions++;
          }
        } else {
          // Eventos del rival (tiros recibidos en portería por el equipo)
          if (ev.event_type === "shot") {
            allTeamGkShotsFaced.push(ev);
          }
        }
      });
    }

    // Player stats from metrics
    const pList = isHome ? mMetrics.homePlayerStats : mMetrics.awayPlayerStats;
    const gkList = isHome ? mMetrics.homeGoalkeeperStats : mMetrics.awayGoalkeeperStats;

    if (pList && Array.isArray(pList)) {
      pList.forEach((p) => {
        const key = `${p.number}_${p.name}`;
        const isGk = p.isGoalkeeper === true || p.is_goalkeeper === true || p.is_goalkeeper === "true";
        if (!playerStatsMap[key]) {
          playerStatsMap[key] = {
            number: p.number,
            name: p.name,
            matchesPlayed: 0,
            shotsCount: 0,
            goals: 0,
            xg: 0,
            turnovers: 0,
            steals: 0,
            sanctions: 0,
            saves: 0,
            shotsFaced: 0,
            goalkeeperXSaves: 0,
            ratings: [],
            is_goalkeeper: isGk
          };
        }

        playerStatsMap[key].matchesPlayed += 1;
        playerStatsMap[key].shotsCount += p.shotsCount || 0;
        playerStatsMap[key].goals += p.goals || 0;
        playerStatsMap[key].xg += parseFloat(p.xg) || 0;
        playerStatsMap[key].turnovers += p.turnovers || 0;
        playerStatsMap[key].steals += p.steals || 0;
        playerStatsMap[key].sanctions += p.sanctions || 0;
        if (isGk) playerStatsMap[key].is_goalkeeper = true;
        if (p.rating) playerStatsMap[key].ratings.push(p.rating);
      });
    }

    if (gkList && Array.isArray(gkList)) {
      gkList.forEach((gk) => {
        const key = `${gk.number}_${gk.name}`;
        const saves = gk.goalkeeperSaves ?? gk.saves ?? 0;
        const faced = gk.goalkeeperShotsFaced ?? gk.shotsFaced ?? 0;
        const xSaves = parseFloat(gk.goalkeeperXSaves ?? gk.expectedSaves ?? 0) || 0;

        if (playerStatsMap[key]) {
          playerStatsMap[key].saves += saves;
          playerStatsMap[key].shotsFaced += faced;
          playerStatsMap[key].goalkeeperXSaves += xSaves;
          playerStatsMap[key].is_goalkeeper = true;
        } else {
          playerStatsMap[key] = {
            number: gk.number,
            name: gk.name,
            matchesPlayed: 1,
            shotsCount: gk.shotsCount || 0,
            goals: gk.goals || 0,
            xg: parseFloat(gk.xg) || 0,
            turnovers: gk.turnovers || 0,
            steals: gk.steals || 0,
            sanctions: gk.sanctions || 0,
            saves,
            shotsFaced: faced,
            goalkeeperXSaves: xSaves,
            ratings: gk.rating ? [gk.rating] : [],
            is_goalkeeper: true
          };
        }

        totalSaves += saves;
        totalShotsFaced += faced;
      });
    }

    matchHistory.push({
      id: m._id,
      date: m.date,
      opponent: oppTeamName,
      isHome,
      goalsFor: teamGoals,
      goalsAgainst: oppGoals,
      result: teamGoals > oppGoals ? "W" : teamGoals === oppGoals ? "D" : "L",
      xg: (isNaN(teamXG) ? 0 : teamXG).toFixed(2),
      xga: (isNaN(oppXG) ? 0 : oppXG).toFixed(2)
    });
  });

  const totalMatches = teamMatches.length;

  const playerStats = Object.values(playerStatsMap).map((p) => {
    const eff = p.shotsCount > 0 ? Math.round((p.goals / p.shotsCount) * 100) : 0;
    const gkSavePct = p.shotsFaced > 0 ? Math.round((p.saves / p.shotsFaced) * 100) : 0;
    const avgRating = p.ratings.length > 0
      ? (p.ratings.reduce((a, b) => a + b, 0) / p.ratings.length).toFixed(1)
      : "7.0";

    return {
      ...p,
      efficiency: eff,
      savePct: gkSavePct,
      goalkeeperXSaves: Math.round(p.goalkeeperXSaves * 10) / 10,
      avgRating: parseFloat(avgRating),
      xg: p.xg.toFixed(2)
    };
  }).sort((a, b) => (b.goals + b.saves) - (a.goals + a.saves));

  const goalGrid = generateGoalGridMatrix(allTeamShotsEvents, false);
  const courtHeatmap = generateCourtHeatmap(allTeamShotsEvents, "shots", false);

  const shotEfficiency = totalShots > 0 ? Math.round((goalsFor / totalShots) * 100) : 0;
  const savePct = totalShotsFaced > 0 ? Math.round((totalSaves / totalShotsFaced) * 100) : 0;

  const avgOffEfficiency = totalPossessionsCount > 0 ? Math.round((goalsFor / totalPossessionsCount) * 100) : shotEfficiency;
  const avgDefEfficiency = totalPossessionsCount > 0 ? Math.min(100, Math.max(0, Math.round(100 - (goalsAgainst / totalPossessionsCount) * 100))) : 50;

  return {
    totalMatches,
    wins,
    draws,
    losses,
    goalsFor,
    goalsAgainst,
    goalDiff: goalsFor - goalsAgainst,
    avgGoalsFor: (goalsFor / totalMatches).toFixed(1),
    avgGoalsAgainst: (goalsAgainst / totalMatches).toFixed(1),
    totalXG: totalXG.toFixed(2),
    totalXGA: totalXGA.toFixed(2),
    avgXG: (totalXG / totalMatches).toFixed(2),
    avgXGA: (totalXGA / totalMatches).toFixed(2),
    totalShots,
    shotEfficiency,
    avgOffEfficiency,
    avgDefEfficiency,
    totalSaves,
    totalShotsFaced,
    savePct,
    totalTurnovers,
    avgTurnovers: (totalTurnovers / totalMatches).toFixed(1),
    totalSteals,
    avgSteals: (totalSteals / totalMatches).toFixed(1),
    totalSanctions,
    totalFreeThrows,
    avgFreeThrows: (totalFreeThrows / totalMatches).toFixed(1),
    totalPossessionsCount,
    avgPossessionsPerMatch: (totalPossessionsCount / totalMatches).toFixed(1),
    avgPossessionDuration: (sumPossessionDurations / totalMatches).toFixed(0),
    avgPace: (sumPace / totalMatches).toFixed(2),
    playerStats,
    matchHistory,
    shotPhases,
    goalGrid,
    courtHeatmap,
    allTeamShotsEvents,
    allTeamGkShotsFaced
  };
}
