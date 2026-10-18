import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { calculateMatchMetrics } from "../../stats/engine/metricsEngine";

const IconEye = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const IconChart = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);

const IconTrash = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

function getTeamBadgeText(name = "") {
  if (!name) return "HS";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].slice(0, 5).toUpperCase();
  }
  if (parts[0].length >= 3 && parts[0].length <= 6) {
    return parts[0].toUpperCase();
  }
  if (parts.length >= 2 && parts[0].length <= 2 && parts[1].length >= 3 && parts[1].length <= 6) {
    return parts[1].toUpperCase();
  }
  return parts.slice(0, 3).map((w) => w[0]).join("").toUpperCase();
}

/**
 * Calcula las 3 estadísticas más destacadas del encuentro para la comparativa inferior.
 */
function computeMatchHighlightStats(match, metrics, homeGoals, awayGoals, homeShotsCount, awayShotsCount) {
  const events = match.events || [];
  const homeEvents = events.filter((e) => !e.is_opponent_action);
  const awayEvents = events.filter((e) => e.is_opponent_action);

  if (!metrics || !metrics.overview || events.length === 0) {
    const homeEff = homeShotsCount > 0 ? Math.round((homeGoals / homeShotsCount) * 100) : 0;
    const awayEff = awayShotsCount > 0 ? Math.round((awayGoals / awayShotsCount) * 100) : 0;
    return [
      {
        key: "goals",
        label: "GOLES MARCADOS",
        homeVal: `${homeGoals}`,
        awayVal: `${awayGoals}`,
        better: homeGoals > awayGoals ? "home" : homeGoals < awayGoals ? "away" : "tie",
      },
      {
        key: "eff",
        label: "EFICACIA TIRO",
        homeVal: `${homeEff}%`,
        awayVal: `${awayEff}%`,
        better: homeEff > awayEff ? "home" : homeEff < awayEff ? "away" : "tie",
      },
      {
        key: "diff",
        label: "DIFERENCIAL GOLES",
        homeVal: `${homeGoals - awayGoals > 0 ? "+" : ""}${homeGoals - awayGoals}`,
        awayVal: `${awayGoals - homeGoals > 0 ? "+" : ""}${awayGoals - homeGoals}`,
        better: homeGoals > awayGoals ? "home" : homeGoals < awayGoals ? "away" : "tie",
      },
    ];
  }

  const { overview } = metrics;
  const candidates = [];

  // 1. Goles Esperados (xG)
  const homeXG = overview.homeXG ?? 0;
  const awayXG = overview.awayXG ?? 0;
  const xgDiff = Math.abs(homeXG - awayXG);
  candidates.push({
    key: "xg",
    label: "GOLES ESPERADOS (XG)",
    homeVal: `${homeXG.toFixed(1)}`,
    awayVal: `${awayXG.toFixed(1)}`,
    better: homeXG > awayXG ? "home" : homeXG < awayXG ? "away" : "tie",
    prominence: xgDiff * 3.8 + (homeXG > 0 || awayXG > 0 ? 15 : 0),
  });

  // 2. Paradas Portería
  const awayShotsOnTarget = awayEvents.filter(
    (e) => e.event_type === "shot" && (e.result === "Gol" || e.result === "Parada")
  ).length;
  const homeShotsOnTarget = homeEvents.filter(
    (e) => e.event_type === "shot" && (e.result === "Gol" || e.result === "Parada")
  ).length;

  const homeSaves = overview.homeGKSaves ?? 0;
  const awaySaves = overview.awayGKSaves ?? 0;
  const homeSavePct = overview.homeGKSavePct ?? 0;
  const awaySavePct = overview.awayGKSavePct ?? 0;

  const homeFaced = awayShotsOnTarget || (homeSaves + awayGoals) || homeSaves;
  const awayFaced = homeShotsOnTarget || (awaySaves + homeGoals) || awaySaves;

  const savePctDiff = Math.abs(homeSavePct - awaySavePct);
  candidates.push({
    key: "saves",
    label: "PARADAS PORTERÍA",
    homeVal: `${homeSavePct}% (${homeSaves}/${homeFaced})`,
    awayVal: `${awaySavePct}% (${awaySaves}/${awayFaced})`,
    better: homeSavePct > awaySavePct ? "home" : homeSavePct < awaySavePct ? "away" : "tie",
    prominence: savePctDiff * 2.8 + (homeSaves + awaySaves >= 6 ? 16 : 0),
  });

  // 3. Pérdidas de Balón (en pérdidas, MENOS pérdidas es MEJOR)
  const homeTo = overview.homeTurnovers ?? 0;
  const awayTo = overview.awayTurnovers ?? 0;
  const toDiff = Math.abs(homeTo - awayTo);
  candidates.push({
    key: "turnovers",
    label: "PÉRDIDAS DE BALÓN",
    homeVal: `${homeTo}`,
    awayVal: `${awayTo}`,
    better: homeTo < awayTo ? "home" : homeTo > awayTo ? "away" : "tie",
    prominence: toDiff * 4.2 + (homeTo + awayTo > 0 ? 14 : 0),
  });

  // 4. Contraataque / Transición
  const homeFbShots = homeEvents.filter((e) => {
    const st = (e.shot_type || "").toLowerCase();
    return st.includes("contraataque") || st.includes("1ª") || st.includes("oleada1") || st.includes("transicion");
  });
  const awayFbShots = awayEvents.filter((e) => {
    const st = (e.shot_type || "").toLowerCase();
    return st.includes("contraataque") || st.includes("1ª") || st.includes("oleada1") || st.includes("transicion");
  });
  const homeFbGoals = homeFbShots.filter((e) => e.result === "Gol").length;
  const awayFbGoals = awayFbShots.filter((e) => e.result === "Gol").length;

  if (homeFbShots.length > 0 || awayFbShots.length > 0) {
    const homeFbPct = homeFbShots.length > 0 ? Math.round((homeFbGoals / homeFbShots.length) * 100) : 0;
    const awayFbPct = awayFbShots.length > 0 ? Math.round((awayFbGoals / awayFbShots.length) * 100) : 0;
    candidates.push({
      key: "fastbreak",
      label: "CONTRAATAQUE",
      homeVal: `${homeFbGoals} (${homeFbPct}%)`,
      awayVal: `${awayFbGoals} (${awayFbPct}%)`,
      better: homeFbGoals > awayFbGoals ? "home" : homeFbGoals < awayFbGoals ? "away" : "tie",
      prominence: Math.abs(homeFbGoals - awayFbGoals) * 4.5 + (homeFbGoals + awayFbGoals >= 3 ? 12 : 0),
    });
  }

  // 5. Eficacia 7 Metros (Penaltis)
  const home7mShots = homeEvents.filter((e) => {
    const st = (e.shot_type || "").toLowerCase();
    return st.includes("7m") || st.includes("penalti");
  });
  const away7mShots = awayEvents.filter((e) => {
    const st = (e.shot_type || "").toLowerCase();
    return st.includes("7m") || st.includes("penalti");
  });
  const home7mGoals = home7mShots.filter((e) => e.result === "Gol").length;
  const away7mGoals = away7mShots.filter((e) => e.result === "Gol").length;

  if (home7mShots.length > 0 || away7mShots.length > 0) {
    const home7mPct = home7mShots.length > 0 ? Math.round((home7mGoals / home7mShots.length) * 100) : 0;
    const away7mPct = away7mShots.length > 0 ? Math.round((away7mGoals / away7mShots.length) * 100) : 0;
    candidates.push({
      key: "penalties",
      label: "EFICACIA 7 METROS",
      homeVal: `${home7mPct}% (${home7mGoals}/${home7mShots.length})`,
      awayVal: `${away7mPct}% (${away7mGoals}/${away7mShots.length})`,
      better: home7mPct > away7mPct ? "home" : home7mPct < away7mPct ? "away" : "tie",
      prominence: Math.abs(home7mGoals - away7mGoals) * 3.5 + (home7mShots.length + away7mShots.length >= 3 ? 10 : 0),
    });
  }

  // 6. Recuperaciones / Robos
  const homeSteals = overview.homeSteals ?? 0;
  const awaySteals = overview.awaySteals ?? 0;
  if (homeSteals > 0 || awaySteals > 0) {
    candidates.push({
      key: "steals",
      label: "RECUPERACIONES",
      homeVal: `${homeSteals}`,
      awayVal: `${awaySteals}`,
      better: homeSteals > awaySteals ? "home" : homeSteals < awaySteals ? "away" : "tie",
      prominence: Math.abs(homeSteals - awaySteals) * 3.8 + 8,
    });
  }

  // 7. Eficacia Ofensiva
  const homeOff = overview.homeOffEfficiency ?? 0;
  const awayOff = overview.awayOffEfficiency ?? 0;
  candidates.push({
    key: "off_eff",
    label: "EFICACIA OFENSIVA",
    homeVal: `${homeOff}%`,
    awayVal: `${awayOff}%`,
    better: homeOff > awayOff ? "home" : homeOff < awayOff ? "away" : "tie",
    prominence: Math.abs(homeOff - awayOff) * 1.5,
  });

  // Ordenar candidatos por prominencia descendente
  candidates.sort((a, b) => b.prominence - a.prominence);

  return candidates.slice(0, 3);
}

export default function MatchCard({
  match,
  loadMatch,
  onDelete,
  teamsLogoMap = {},
}) {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || "es";

  // Fecha formateada en mayúsculas estilo emisión deportiva (ej. 21 JUL 2026)
  const dateStr = useMemo(() => {
    if (!match.date) return "21 JUL 2026";
    const d = new Date(match.date);
    return d.toLocaleDateString(currentLang === "es" ? "es-ES" : "en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).toUpperCase();
  }, [match.date, currentLang]);

  // Resolución de logos de los equipos
  const homeTeamName = (match.home_team || "").trim();
  const awayTeamName = (match.away_team || "").trim();

  const homeLogo = match.home_logo ||
    match.home_team_logo ||
    match.home_team?.logo_url ||
    teamsLogoMap[homeTeamName.toLowerCase()] ||
    null;

  const awayLogo = match.away_logo ||
    match.away_team_logo ||
    match.away_team?.logo_url ||
    teamsLogoMap[awayTeamName.toLowerCase()] ||
    null;

  // Marcador y ganador
  const goalsHome = match.goals_home ?? 0;
  const goalsAway = match.goals_away ?? 0;

  const isHomeWinner = goalsHome > goalsAway;
  const isAwayWinner = goalsAway > goalsHome;
  const isDraw = goalsHome === goalsAway;

  // Cálculo de métricas del partido
  const metrics = useMemo(() => {
    return calculateMatchMetrics(match);
  }, [match]);

  // Eficacia de tiro de cada equipo
  const events = match.events || [];
  const homeEvents = events.filter((e) => !e.is_opponent_action);
  const awayEvents = events.filter((e) => e.is_opponent_action);

  const homeShots = homeEvents.filter((e) => e.event_type === "shot");
  const awayShots = awayEvents.filter((e) => e.event_type === "shot");

  const homeShotsCount = homeShots.length > 0 ? homeShots.length : (goalsHome > 0 ? Math.round(goalsHome / 0.65) : 0);
  const awayShotsCount = awayShots.length > 0 ? awayShots.length : (goalsAway > 0 ? Math.round(goalsAway / 0.55) : 0);

  const homeShotEff = homeShotsCount > 0 ? Math.round((goalsHome / homeShotsCount) * 100) : 0;
  const awayShotEff = awayShotsCount > 0 ? Math.round((goalsAway / awayShotsCount) * 100) : 0;

  // Top 3 estadísticas destacadas del encuentro
  const highlightStats = useMemo(() => {
    return computeMatchHighlightStats(match, metrics, goalsHome, goalsAway, homeShotsCount, awayShotsCount);
  }, [match, metrics, goalsHome, goalsAway, homeShotsCount, awayShotsCount]);

  return (
    <div
      className="match-card"
      onClick={() => loadMatch(match._id, "stats")}
    >
      {/* 1. BARRA SUPERIOR: FECHA Y BOTÓN ELIMINAR EN LA ESQUINA SUPERIOR DERECHA */}
      <div className="match-card-header-bar">
        <span className="match-card-header-date">{dateStr}</span>

        {onDelete && (
          <button
            type="button"
            className="btn-match-delete-top"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(match._id);
            }}
            title={t("common.delete", "Eliminar")}
          >
            <IconTrash />
          </button>
        )}
      </div>

      {/* 2. FILA PRINCIPAL: LOCAL vs VISITANTE, MARCADOR Y ACCIONES */}
      <div className="match-card-main-row">
        {/* EQUIPO LOCAL */}
        <div className="match-team-section home">
          <div className="match-team-logo-box">
            {homeLogo ? (
              <img src={homeLogo} alt={match.home_team} className="match-team-logo-img" />
            ) : (
              <span className="match-team-logo-text">{getTeamBadgeText(match.home_team)}</span>
            )}
          </div>

          <div className="match-team-info">
            <span className={`match-team-status-tag ${isHomeWinner ? "winner" : ""}`}>
              {isHomeWinner ? "GANADOR ✓" : isDraw ? "EMPATE" : "EQUIPO LOCAL"}
            </span>
            <h3 className={`match-team-name ${isHomeWinner ? "winner" : ""}`} title={match.home_team}>
              {match.home_team}
            </h3>
            <span className="match-team-eff">
              Eficacia lanzamiento: {homeShotEff}% ({goalsHome}/{homeShotsCount})
            </span>
          </div>
        </div>

        {/* MARCADOR CENTRAL */}
        <div className="match-card-score-container">
          <div className="match-card-score-box">
            <span className={`score-num ${isHomeWinner ? "winner" : ""}`}>
              {goalsHome}
            </span>
            <span className="score-colon">-</span>
            <span className={`score-num ${isAwayWinner ? "winner" : ""}`}>
              {goalsAway}
            </span>
          </div>
        </div>

        {/* EQUIPO VISITANTE */}
        <div className="match-team-section away">
          <div className="match-team-logo-box">
            {awayLogo ? (
              <img src={awayLogo} alt={match.away_team} className="match-team-logo-img" />
            ) : (
              <span className="match-team-logo-text">{getTeamBadgeText(match.away_team)}</span>
            )}
          </div>

          <div className="match-team-info">
            <span className={`match-team-status-tag ${isAwayWinner ? "winner" : ""}`}>
              {isAwayWinner ? "GANADOR ✓" : isDraw ? "EMPATE" : "EQUIPO VISITANTE"}
            </span>
            <h3 className={`match-team-name ${isAwayWinner ? "winner" : ""}`} title={match.away_team}>
              {match.away_team}
            </h3>
            <span className="match-team-eff">
              Eficacia lanzamiento: {awayShotEff}% ({goalsAway}/{awayShotsCount})
            </span>
          </div>
        </div>

        {/* BOTONES DE ACCIÓN: REGISTRO ENCIMA DE ESTADÍSTICAS */}
        <div className="match-card-actions-group">
          <button
            type="button"
            className="btn-match-view"
            onClick={(e) => {
              e.stopPropagation();
              loadMatch(match._id, "live");
            }}
            title={t("matches.control_desk", "Ver Registro")}
          >
            <IconEye />
            <span>Ver Registro</span>
          </button>

          <button
            type="button"
            className="btn-match-stats"
            onClick={(e) => {
              e.stopPropagation();
              loadMatch(match._id, "stats");
            }}
            title={t("matches.statistics", "Estadísticas")}
          >
            <IconChart />
            <span>Estadísticas</span>
          </button>
        </div>
      </div>

      {/* 3. BARRA INFERIOR: LAS 3 ESTADÍSTICAS MÁS DESTACADAS DEL ENCUENTRO Y ACTA */}
      <div className="match-card-bottom-row">
        <div className="match-card-highlights-row">
          {highlightStats.map((stat, sIdx) => (
            <div key={sIdx} className="match-highlight-item">
              <span className="match-highlight-label">{stat.label}:</span>
              <div className="match-highlight-vals">
                <span className={stat.better === "home" ? "val-better" : ""}>
                  {stat.homeVal}
                </span>
                <span className="match-highlight-vs">vs</span>
                <span className={stat.better === "away" ? "val-better" : ""}>
                  {stat.awayVal}
                </span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}