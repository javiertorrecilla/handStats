import React from "react";
import { InsightAlert } from "../common/InsightAlert";
import { KPICard } from "../common/KPICard";

export function TrendsStatsView({ metrics, match, teamFilter = "home" }) {
  if (!metrics) return null;

  const { overview } = metrics;
  const isAway = teamFilter === "away";
  const targetTeam = isAway ? overview.awayTeam : overview.homeTeam;

  const events = match?.events || [];
  const possessions = match?.possessions || [];

  // Filtrar posesiones del equipo seleccionado
  const teamPossessions = possessions.filter((p) => {
    return isAway ? p.is_opponent_action : !p.is_opponent_action;
  });

  // Filtrar eventos del equipo seleccionado
  const teamEvents = events.filter((e) => {
    return isAway ? e.is_opponent_action : !e.is_opponent_action;
  });

  // 1. Calcular Eficiencia de los Últimos 5 Ataques del equipo seleccionado
  const recentPoss = teamPossessions.slice(-5);
  const recentGoals = recentPoss.filter((p) => p.end_reason === "Gol" || p.result === "Gol").length;
  const recentEff = recentPoss.length > 0 ? Math.round((recentGoals / recentPoss.length) * 100) : 0;

  // 2. Calcular Rendimiento de los Últimos 10 Minutos del equipo seleccionado
  const maxTime = events.length > 0 ? events[events.length - 1].match_time_seconds || 0 : 0;
  const tenMinsAgo = Math.max(0, maxTime - 600);
  const last10MinTeamEvents = teamEvents.filter((e) => (e.match_time_seconds || 0) >= tenMinsAgo);
  const last10MinGoals = last10MinTeamEvents.filter((e) => e.event_type === "shot" && e.result === "Gol").length;
  const last10MinShots = last10MinTeamEvents.filter((e) => e.event_type === "shot").length;
  const last10MinEff = last10MinShots > 0 ? Math.round((last10MinGoals / last10MinShots) * 100) : 0;

  // 3. Métricas específicas del equipo seleccionado para el motor de tendencias
  const teamOffEff = isAway ? overview.awayOffEfficiency : overview.homeOffEfficiency;
  const teamDefEff = isAway ? overview.awayDefEfficiency : overview.homeDefEfficiency;
  const teamGoals = isAway ? overview.awayGoals : overview.homeGoals;
  const teamXG = isAway ? overview.awayXG : overview.homeXG;
  const teamGKSaves = isAway ? overview.awayGKSaves : overview.homeGKSaves;
  const teamGKSavePct = isAway ? overview.awayGKSavePct : overview.homeGKSavePct;
  const teamTurnovers = isAway ? overview.awayTurnovers : overview.homeTurnovers;
  const team2Min = isAway ? overview.away2Min : overview.home2Min;

  // 4. Generación dinámica de alertas e insights tácticos específicos para el equipo seleccionado
  const teamInsights = [];

  // A) Eficiencia Ofensiva del Equipo
  if (teamOffEff < 42 && teamPossessions.length >= 4) {
    teamInsights.push({
      id: "team_low_off_eff",
      type: "warning",
      priority: "high",
      title: `Baja Eficiencia Ofensiva de ${targetTeam}`,
      message: `${targetTeam} registra un ${teamOffEff}% de eficacia ofensiva (${teamGoals} goles en ${teamPossessions.length} ataques).`,
      recommendation: "Pausar la circulación rápida y estructurar jugadas de mayor efectividad hacia pivote o penetración."
    });
  } else if (teamOffEff >= 60 && teamPossessions.length >= 4) {
    teamInsights.push({
      id: "team_high_off_eff",
      type: "success",
      priority: "medium",
      title: `Gran Eficiencia Ofensiva de ${targetTeam}`,
      message: `${targetTeam} mantiene un elevado ${teamOffEff}% de eficacia ofensiva en sus ataques posicionales.`,
      recommendation: "Mantener el ritmo de circulación y explotar las fijaciones en la primera línea."
    });
  }

  // B) Rendimiento de Portería del Equipo
  if (teamGKSavePct >= 35 && teamGKSaves >= 2) {
    teamInsights.push({
      id: "team_gk_wall",
      type: "success",
      priority: "high",
      title: `Portería Decisiva de ${targetTeam}`,
      message: `La portería de ${targetTeam} alcanza un ${teamGKSavePct}% de paradas acumuladas (${teamGKSaves} paradas).`,
      recommendation: "Armar la transición y el contraataque directo tras cada parada defensiva."
    });
  } else if (teamGKSavePct < 22 && (teamGoals + teamGKSaves) >= 5) {
    teamInsights.push({
      id: "team_gk_struggle",
      type: "warning",
      priority: "high",
      title: `Dificultades en Portería de ${targetTeam}`,
      message: `El porcentaje de paradas de ${targetTeam} se sitúa en el ${teamGKSavePct}%.`,
      recommendation: "Ajustar la basculación en el bloque defensivo central o valorar refresco en portería."
    });
  }

  // C) Rachas de Pérdidas Recientes del Equipo
  const recentTeamTurnovers = teamEvents.slice(-8).filter((e) => e.event_type === "turnover").length;
  if (recentTeamTurnovers >= 2) {
    teamInsights.push({
      id: "team_turnover_streak",
      type: "danger",
      priority: "critical",
      title: `Racha de Pérdidas de Balón de ${targetTeam}`,
      message: `Se han registrado ${recentTeamTurnovers} pérdidas en las últimas acciones de ${targetTeam}.`,
      recommendation: "⚠️ Solicitar pausa táctica o asegurar los pases en la primera línea para no conceder contraataques."
    });
  }

  // D) Rendimiento vs Expected Goals (xG) del Equipo
  const xgDiff = Math.round((teamGoals - teamXG) * 100) / 100;
  if (xgDiff >= 1.5) {
    teamInsights.push({
      id: "team_overperforming_xg",
      type: "info",
      priority: "medium",
      title: `Alta Conversión por Encima de xG — ${targetTeam}`,
      message: `${targetTeam} acumula ${teamGoals} goles frente a una calidad de tiro de ${teamXG} xG (+${xgDiff}).`,
      recommendation: "Alta precisión de lanzadores, mantener la generación de tiros cómodos."
    });
  } else if (xgDiff <= -1.5) {
    teamInsights.push({
      id: "team_underperforming_xg",
      type: "warning",
      priority: "high",
      title: `Oportunidades Erradas (Subrendimiento xG) — ${targetTeam}`,
      message: `${targetTeam} ha generado ${teamXG} xG pero sólo ha convertido ${teamGoals} goles (${xgDiff}).`,
      recommendation: "Revisar la finta final y el ángulo de tiro frente a la salida del portero rival."
    });
  }

  // E) Sanciones y Exclusiones del Equipo
  if (team2Min >= 2) {
    teamInsights.push({
      id: "team_high_exclusions",
      type: "warning",
      priority: "medium",
      title: `Carga de Exclusiones de ${targetTeam}`,
      message: `${targetTeam} acumula ${team2Min} exclusiones de 2 minutos en el partido.`,
      recommendation: "Medir los contactos tardíos y mejorar el escalonamiento de la línea defensiva."
    });
  }

  // Ordenar insights por prioridad
  teamInsights.sort((a, b) => {
    const pOrder = { critical: 1, high: 2, medium: 3, info: 4 };
    return (pOrder[a.priority] || 5) - (pOrder[b.priority] || 5);
  });

  return (
    <div className="hs-view-container" style={{ display: "flex", flexDirection: "column", gap: "var(--space-24)" }}>
      {/* KPIS DE TENDENCIAS ESPECÍFICAS DEL EQUIPO SELECCIONADO */}
      <div className="hs-kpi-grid">
        <KPICard
          title={`EFICIENCIA ÚLTIMOS 5 ATAQUES — ${targetTeam.toUpperCase()}`}
          value={`${recentEff}%`}
          subtitle={`${recentGoals} goles en los últimos 5 ataques`}
        />
        <KPICard
          title={`GOLES ÚLTIMOS 10 MINUTOS — ${targetTeam.toUpperCase()}`}
          value={last10MinGoals}
          subtitle={`Efectividad tramo final: ${last10MinEff}% (${last10MinGoals}/${last10MinShots})`}
        />
        <KPICard
          title={`PÉRDIDAS ACUMULADAS — ${targetTeam.toUpperCase()}`}
          value={teamTurnovers}
          subtitle={`Promedio general de pérdidas: ${teamTurnovers}`}
        />
      </div>

      {/* MOTOR DE INTELIGENCIA TÁCTICA Y ALERTAS EXCLUSIVAS DEL EQUIPO SELECCIONADO */}
      <div className="hs-card">
        <h4 className="hs-card-title">
          ALERTAS TÁCTICAS Y MOTOR DE TENDENCIAS — {targetTeam.toUpperCase()}
        </h4>
        <div className="hs-insights-grid" style={{ marginTop: "var(--space-12)" }}>
          {teamInsights.length > 0 ? (
            teamInsights.map((ins) => <InsightAlert key={ins.id} insight={ins} />)
          ) : (
            <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "var(--space-20)" }}>
              No se han detectado anomalías o tendencias críticas en la actuación de {targetTeam}.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
