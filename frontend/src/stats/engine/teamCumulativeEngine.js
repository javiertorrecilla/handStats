import {
  calculateMatchMetrics,
  isEmptyNetEvent,
  matchesPlayer,
  matchesPlayerRef,
  formatMinutesSeconds
} from "./metricsEngine";
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
  let totalOffRebounds = 0;
  let totalDefRebounds = 0;
  let totalRebounds = 0;
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

    const offReb = isHome ? (mMetrics.overview.homeOffRebounds || 0) : (mMetrics.overview.awayOffRebounds || 0);
    const defReb = isHome ? (mMetrics.overview.homeDefRebounds || 0) : (mMetrics.overview.awayDefRebounds || 0);
    const totReb = isHome ? (mMetrics.overview.homeTotalRebounds || 0) : (mMetrics.overview.awayTotalRebounds || 0);
    totalOffRebounds += offReb;
    totalDefRebounds += defReb;
    totalRebounds += totReb;

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
          allTeamShotsEvents.push(ev);
          if (ev.event_type === "shot") {
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
          // Eventos del rival (tiros recibidos en portería por el equipo, excluyendo portería vacía)
          if (ev.event_type === "shot" && !isEmptyNetEvent(ev)) {
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
        const matchGk = (gkList || []).find(
          (gk) =>
            String(gk.number) === String(p.number) ||
            (gk.name && p.name && gk.name.trim().toLowerCase() === p.name.trim().toLowerCase())
        );
        const isGk = p.isGoalkeeper === true || p.is_goalkeeper === true || p.is_goalkeeper === "true" || Boolean(matchGk);

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
            drawn7mCount: 0,
            penaltiesCommitted: 0,
            offensiveFouls: 0,
            offFoulsDrawn: 0,
            twoMins: 0,
            yellowCards: 0,
            redCards: 0,
            blueCards: 0,
            secondsPlayed: 0,
            ratings: [],
            is_goalkeeper: isGk,
            matches: [],
            allShots: [],
            allGkShotsFaced: []
          };
        }

        const matchSaves = matchGk?.goalkeeperSaves ?? (p.goalkeeperSaves ?? p.saves ?? 0);
        const matchFaced = matchGk?.goalkeeperShotsFaced ?? (p.goalkeeperShotsFaced ?? p.shotsFaced ?? 0);
        const matchSavePct = matchFaced > 0 ? Math.round((matchSaves / matchFaced) * 100) : (matchGk?.goalkeeperSavePct ?? p.goalkeeperSavePct ?? 0);
        const matchXSaves = parseFloat(matchGk?.goalkeeperXSaves ?? p.goalkeeperXSaves ?? 0) || 0;

        // Player specific shots and events in this match
        const playerMatchShots = [];
        const playerMatchGkShotsFaced = [];
        const playerMatchTurnovers = [];
        const playerMatchSanctions = [];

        (m.events || []).forEach((ev, evIdx) => {
          const isTeamEv = isEventOfTeam(ev, teamNameLower, isHome, m);

          if (isTeamEv) {
            const isPlayerAction =
              matchesPlayer(ev.player_id, ev.player_number, p) ||
              (ev.shooter && matchesPlayerRef(ev.shooter, p)) ||
              (ev.player_name && p.name && ev.player_name.trim().toLowerCase() === p.name.trim().toLowerCase());

            if (ev.event_type === "shot" && isPlayerAction) {
              const shotId = ev.id || ev.event_id || ev._id || `ev_${m._id || m.id || "m"}_${ev.match_time_seconds || 0}_${evIdx}_shot`;
              playerMatchShots.push({
                ...ev,
                id: shotId,
                event_id: shotId,
                matchId: m._id || m.id,
                matchDate: m.date,
                opponent: oppTeamName,
                timeFormatted: formatMinutesSeconds(ev.match_time_seconds || 0)
              });
            } else if (ev.event_type === "turnover" && (isPlayerAction || (ev.committed_by && matchesPlayerRef(ev.committed_by, p)))) {
              playerMatchTurnovers.push({
                ...ev,
                timeFormatted: formatMinutesSeconds(ev.match_time_seconds || 0)
              });
            } else if (ev.event_type === "sanction" && isPlayerAction) {
              playerMatchSanctions.push({
                ...ev,
                timeFormatted: formatMinutesSeconds(ev.match_time_seconds || 0)
              });
            }
          }

          if (isGk && !isTeamEv && ev.event_type === "shot" && !isEmptyNetEvent(ev)) {
            let isGkTarget = false;
            if (ev.goalkeeper_number !== undefined && ev.goalkeeper_number !== null && ev.goalkeeper_number !== 0 && ev.goalkeeper_number !== "0") {
              isGkTarget = String(ev.goalkeeper_number) === String(p.number);
            } else if (ev.goalkeeper_id) {
              isGkTarget = matchesPlayer(ev.goalkeeper_id, ev.goalkeeper_number, p);
            } else if (gkList && gkList.length === 1 && ev.goalkeeper_number !== null && ev.goalkeeper_number !== 0 && ev.goalkeeper_number !== "0") {
              isGkTarget = true;
            }
            if (isGkTarget) {
              const gkShotId = ev.id || ev.event_id || ev._id || `ev_${m._id || m.id || "m"}_${ev.match_time_seconds || 0}_${evIdx}_gkshot`;
              playerMatchGkShotsFaced.push({
                ...ev,
                id: gkShotId,
                event_id: gkShotId,
                matchId: m._id || m.id,
                matchDate: m.date,
                opponent: oppTeamName,
                timeFormatted: formatMinutesSeconds(ev.match_time_seconds || 0)
              });
            }
          }
        });

        const playedInMatch =
          (p.secondsPlayed > 0) ||
          (p.shotsCount > 0) ||
          (p.turnovers > 0) ||
          (p.steals > 0) ||
          (p.twoMins > 0) ||
          (p.drawn7mCount > 0) ||
          (p.penaltiesCommitted > 0) ||
          (matchSaves > 0) ||
          (matchFaced > 0);

        playerStatsMap[key].matchesPlayed += 1;
        playerStatsMap[key].shotsCount += p.shotsCount || 0;
        playerStatsMap[key].goals += p.goals || 0;
        playerStatsMap[key].xg += parseFloat(p.xg) || 0;
        playerStatsMap[key].turnovers += p.turnovers || 0;
        playerStatsMap[key].steals += p.steals || 0;
        playerStatsMap[key].sanctions += p.sanctions || 0;
        playerStatsMap[key].drawn7mCount = (playerStatsMap[key].drawn7mCount || 0) + (p.drawn7mCount || 0);
        playerStatsMap[key].penaltiesCommitted = (playerStatsMap[key].penaltiesCommitted || 0) + (p.penaltiesCommitted || 0);
        playerStatsMap[key].offensiveFouls = (playerStatsMap[key].offensiveFouls || 0) + (p.offensiveFouls || 0);
        playerStatsMap[key].offFoulsDrawn = (playerStatsMap[key].offFoulsDrawn || 0) + (p.offFoulsDrawn || 0);
        playerStatsMap[key].twoMins = (playerStatsMap[key].twoMins || 0) + (p.twoMins || 0);
        playerStatsMap[key].yellowCards = (playerStatsMap[key].yellowCards || 0) + (p.yellowCards || 0);
        playerStatsMap[key].redCards = (playerStatsMap[key].redCards || 0) + (p.redCards || 0);
        playerStatsMap[key].blueCards = (playerStatsMap[key].blueCards || 0) + (p.blueCards || 0);
        playerStatsMap[key].secondsPlayed = (playerStatsMap[key].secondsPlayed || 0) + (p.secondsPlayed || 0);

        if (isGk) {
          playerStatsMap[key].is_goalkeeper = true;
          playerStatsMap[key].saves += matchSaves;
          playerStatsMap[key].shotsFaced += matchFaced;
          playerStatsMap[key].goalkeeperXSaves += matchXSaves;
          playerStatsMap[key].allGkShotsFaced.push(...playerMatchGkShotsFaced);
        }

        if (p.rating) playerStatsMap[key].ratings.push(p.rating);
        playerStatsMap[key].allShots.push(...playerMatchShots);

        playerStatsMap[key].matches.push({
          matchId: m._id || m.id,
          date: m.date,
          opponent: oppTeamName,
          isHome,
          teamGoals,
          oppGoals,
          score: `${teamGoals} - ${oppGoals}`,
          result: teamGoals > oppGoals ? "W" : teamGoals === oppGoals ? "D" : "L",
          played: playedInMatch,
          secondsPlayed: p.secondsPlayed || 0,
          minutesPlayed: p.minutesPlayed || 0,
          minutesPlayedFormatted: p.minutesPlayedFormatted || formatMinutesSeconds(p.secondsPlayed || 0),
          shotsCount: p.shotsCount || 0,
          goals: p.goals || 0,
          stops: p.stops || 0,
          misses: p.misses || 0,
          efficiency: p.efficiency || 0,
          xg: parseFloat(p.xg) || 0,
          turnovers: p.turnovers || 0,
          steals: p.steals || 0,
          drawn7mCount: p.drawn7mCount || 0,
          penaltiesCommitted: p.penaltiesCommitted || 0,
          offensiveFouls: p.offensiveFouls || 0,
          offFoulsDrawn: p.offFoulsDrawn || 0,
          twoMins: p.twoMins || 0,
          yellowCards: p.yellowCards || 0,
          redCards: p.redCards || 0,
          blueCards: p.blueCards || 0,
          saves: matchSaves,
          shotsFaced: matchFaced,
          savePct: matchSavePct,
          goalkeeperXSaves: matchXSaves,
          rating: parseFloat(p.rating) || 7.0,
          ratingBreakdown: p.ratingBreakdown || {},
          shots: playerMatchShots,
          gkShotsFaced: playerMatchGkShotsFaced,
          turnoversList: playerMatchTurnovers,
          sanctionsList: playerMatchSanctions
        });
      });
    }

    if (gkList && Array.isArray(gkList)) {
      gkList.forEach((gk) => {
        const key = `${gk.number}_${gk.name}`;
        const saves = gk.goalkeeperSaves ?? gk.saves ?? 0;
        const faced = gk.goalkeeperShotsFaced ?? gk.shotsFaced ?? 0;
        const xSaves = parseFloat(gk.goalkeeperXSaves ?? gk.expectedSaves ?? 0) || 0;

        totalSaves += saves;
        totalShotsFaced += faced;

        if (!playerStatsMap[key]) {
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
            drawn7mCount: 0,
            penaltiesCommitted: 0,
            offensiveFouls: 0,
            offFoulsDrawn: 0,
            twoMins: 0,
            yellowCards: 0,
            redCards: 0,
            blueCards: 0,
            secondsPlayed: 0,
            ratings: gk.rating ? [gk.rating] : [],
            is_goalkeeper: true,
            matches: [
              {
                matchId: m._id || m.id,
                date: m.date,
                opponent: oppTeamName,
                isHome,
                teamGoals,
                oppGoals,
                score: `${teamGoals} - ${oppGoals}`,
                result: teamGoals > oppGoals ? "W" : teamGoals === oppGoals ? "D" : "L",
                played: saves > 0 || faced > 0,
                secondsPlayed: 0,
                minutesPlayed: 0,
                minutesPlayedFormatted: "0'",
                shotsCount: gk.shotsCount || 0,
                goals: gk.goals || 0,
                stops: 0,
                misses: 0,
                efficiency: 0,
                xg: parseFloat(gk.xg) || 0,
                turnovers: gk.turnovers || 0,
                steals: gk.steals || 0,
                drawn7mCount: 0,
                penaltiesCommitted: 0,
                offensiveFouls: 0,
                offFoulsDrawn: 0,
                twoMins: 0,
                yellowCards: 0,
                redCards: 0,
                blueCards: 0,
                saves,
                shotsFaced: faced,
                savePct: faced > 0 ? Math.round((saves / faced) * 100) : 0,
                goalkeeperXSaves: xSaves,
                rating: parseFloat(gk.rating) || 7.0,
                ratingBreakdown: {},
                shots: [],
                gkShotsFaced: [],
                turnoversList: [],
                sanctionsList: []
              }
            ],
            allShots: [],
            allGkShotsFaced: []
          };
        }
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

    const sortedMatches = [...p.matches].sort((a, b) => {
      const timeA = a.date ? new Date(a.date).getTime() : 0;
      const timeB = b.date ? new Date(b.date).getTime() : 0;
      return timeB - timeA;
    });

    const playedMatchesCount = sortedMatches.filter((m) => m.played).length;
    const effectiveMatchesCount = playedMatchesCount > 0 ? playedMatchesCount : sortedMatches.length;

    // Shot phases breakdown
    const shotPhases = { posicional: 0, oleada1: 0, oleada2: 0, penalti: 0 };
    (p.allShots || []).forEach((s) => {
      const st = (s.shot_type || "").toLowerCase();
      if (st.includes("7m") || st.includes("penalti")) shotPhases.penalti++;
      else if (st.includes("contraataque") || st.includes("1ª")) shotPhases.oleada1++;
      else if (st.includes("2ª")) shotPhases.oleada2++;
      else shotPhases.posicional++;
    });

    // Shot zones breakdown
    const shotZones = { wing: 0, backcourt: 0, pivot: 0, sevenM: 0, fastbreak: 0, other: 0 };
    (p.allShots || []).forEach((s) => {
      const sz = (s.shot_zone || s.zone || "").toLowerCase();
      const st = (s.shot_type || "").toLowerCase();
      if (st.includes("7m") || sz.includes("7m")) shotZones.sevenM++;
      else if (st.includes("contraataque") || sz.includes("contraataque")) shotZones.fastbreak++;
      else if (sz.includes("extremo") || sz.includes("wing")) shotZones.wing++;
      else if (sz.includes("pivote") || sz.includes("pivot")) shotZones.pivot++;
      else if (sz.includes("9m") || sz.includes("primera") || sz.includes("backcourt")) shotZones.backcourt++;
      else shotZones.other++;
    });

    // Goal zones distribution for the player
    const goalZones = {
      TL: 0, TC: 0, TR: 0,
      ML: 0, MC: 0, MR: 0,
      BL: 0, BC: 0, BR: 0,
      OUT: 0, POST: 0
    };
    (p.allShots || []).forEach((s) => {
      if (s.result === "Fuera") goalZones.OUT++;
      else if (s.result === "Poste") goalZones.POST++;
      else {
        const gz = (s.goal_zone || s.target_zone || "").toUpperCase();
        if (goalZones[gz] !== undefined) goalZones[gz]++;
      }
    });

    const totalSecs = p.secondsPlayed || 0;
    const avgSecsPerMatch = effectiveMatchesCount > 0 ? Math.round(totalSecs / effectiveMatchesCount) : 0;

    return {
      ...p,
      matchesPlayed: effectiveMatchesCount,
      totalMatchesInSquad: sortedMatches.length,
      efficiency: eff,
      savePct: gkSavePct,
      goalkeeperXSaves: Math.round(p.goalkeeperXSaves * 10) / 10,
      avgRating: parseFloat(avgRating),
      bestRating: p.ratings.length > 0 ? Math.max(...p.ratings).toFixed(1) : "—",
      worstRating: p.ratings.length > 0 ? Math.min(...p.ratings).toFixed(1) : "—",
      xg: p.xg.toFixed(2),
      avgGoals: effectiveMatchesCount > 0 ? (p.goals / effectiveMatchesCount).toFixed(1) : "0.0",
      avgShots: effectiveMatchesCount > 0 ? (p.shotsCount / effectiveMatchesCount).toFixed(1) : "0.0",
      avgTurnovers: effectiveMatchesCount > 0 ? (p.turnovers / effectiveMatchesCount).toFixed(1) : "0.0",
      avgSaves: effectiveMatchesCount > 0 ? (p.saves / effectiveMatchesCount).toFixed(1) : "0.0",
      totalMinutesPlayed: Math.round(totalSecs / 60),
      totalMinutesFormatted: formatMinutesSeconds(totalSecs),
      avgMinutesPlayedFormatted: formatMinutesSeconds(avgSecsPerMatch),
      matches: sortedMatches,
      shotPhases,
      shotZones,
      goalZones
    };
  }).sort((a, b) => (Number(a.number) || 0) - (Number(b.number) || 0));

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
    totalRebounds,
    avgRebounds: (totalRebounds / totalMatches).toFixed(1),
    totalOffRebounds,
    totalDefRebounds,
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
