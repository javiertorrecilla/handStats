/* ==========================================================
   HANDSTATS ANALYTICS — INSIGHTS ENGINE
   Motor de Inteligencia Táctica y Recomendaciones en tiempo real
   ========================================================== */

/**
 * Analiza el partido y genera conclusiones e indicaciones tácticas.
 * @param {Object} metrics - Objeto de métricas procesadas por metricsEngine
 * @param {Object} match - Objeto completo del partido
 * @returns {Array<Object>} Lista de insights tácticos clasificados por prioridad
 */
export function generateTacticalInsights(metrics, match) {
  if (!metrics || !match) return [];

  const insights = [];
  const events = match.events || [];
  const possessions = match.possessions || [];
  const overview = metrics.overview;

  // 1. Análisis de Eficiencia Ofensiva vs Defensiva
  if (overview.homeOffEfficiency < 40 && overview.homePossCount >= 5) {
    insights.push({
      id: "low_off_eff",
      type: "warning",
      priority: "high",
      title: "Baja Eficiencia Ofensiva",
      message: `El equipo local sólo está convirtiendo el ${overview.homeOffEfficiency}% de sus ataques en gol.`,
      recommendation: "Conviene pausar la velocidad de circulación y buscar opciones de mayor porcentaje (pivote o penetración)."
    });
  }

  if (overview.homeOffEfficiency > 65 && overview.homePossCount >= 5) {
    insights.push({
      id: "high_off_eff",
      type: "success",
      priority: "medium",
      title: "Gran Eficiencia Ofensiva",
      message: `Efectividad muy alta (${overview.homeOffEfficiency}%) en la finalización posicional y de transición.`,
      recommendation: "Mantener el ritmo rápido y la búsqueda de espacios creados por la primera línea."
    });
  }

  // 2. Análisis de Rendimiento de Portería
  if (overview.homeGKSavePct >= 40 && overview.homeGKSaves >= 3) {
    insights.push({
      id: "gk_wall",
      type: "success",
      priority: "high",
      title: "Portería Decisiva",
      message: `El portero lleva un ${overview.homeGKSavePct}% de paradas (${overview.homeGKSaves} paradas).`,
      recommendation: "Aprovechar las recuperaciones tras parada para montar contraataque directo."
    });
  } else if (overview.homeGKSavePct < 20 && (overview.awayGoals + overview.homeGKSaves) >= 6) {
    insights.push({
      id: "gk_struggle",
      type: "warning",
      priority: "high",
      title: "Dificultades en Portería",
      message: `El porcentaje de paradas es del ${overview.homeGKSavePct}%.`,
      recommendation: "Valorar cambio de portero o ajustar la cerradura del bloque defensivo central."
    });
  }

  // 3. Rachas de Pérdidas consecutivas
  const recentEvents = [...events].reverse().slice(0, 8);
  const recentTurnovers = recentEvents.filter((e) => !e.is_opponent_action && e.event_type === "turnover").length;

  if (recentTurnovers >= 3) {
    insights.push({
      id: "turnover_streak",
      type: "danger",
      priority: "critical",
      title: "Racha de Pérdidas de Balón",
      message: `Se han registrado ${recentTurnovers} pérdidas en los últimos eventos del equipo.`,
      recommendation: "⚠️ Solicitar tiempo muerto o ralentizar las entregas en primera línea para evitar contraataques rivales."
    });
  }

  // 4. Análisis de Jugadores Rivales Destacados (Peligro)
  metrics.awayPlayerStats.forEach((p) => {
    if (p.goals >= 4 && p.efficiency >= 70) {
      insights.push({
        id: `opp_danger_${p.number}`,
        type: "danger",
        priority: "high",
        title: `Peligro Rival: #${p.number} ${p.name}`,
        message: `Acumula ${p.goals} goles con un ${p.efficiency}% de efectividad en lanzamientos.`,
        recommendation: `Ajustar defensa mixta o basculación prioritaria sobre #${p.number}.`
      });
    }
  });

  // 5. Análisis de xG (Expected Goals vs Marcador Real)
  const xgDiff = Math.round((overview.homeGoals - overview.homeXG) * 100) / 100;
  if (xgDiff >= 2.0) {
    insights.push({
      id: "overperforming_xg",
      type: "info",
      priority: "medium",
      title: "Superando el xG Esperado",
      message: `El equipo ha marcado ${overview.homeGoals} goles cuando la calidad de tiros (xG) era de ${overview.homeXG}.`,
      recommendation: "Excepcional eficacia de los lanzadores, pero se deben generar opciones de tiro más claras."
    });
  } else if (xgDiff <= -2.0) {
    insights.push({
      id: "underperforming_xg",
      type: "warning",
      priority: "high",
      title: "Subrendimiento frente a xG",
      message: `Se han generado ${overview.homeXG} xG pero sólo se han convertido ${overview.homeGoals} goles.`,
      recommendation: "Las situaciones de gol son claras, falta precisión en el área de meta o finta final al portero."
    });
  }

  // 6. Análisis de Exclusiones de 2 Minutos
  if (overview.home2Min >= 3) {
    insights.push({
      id: "high_exclusions",
      type: "warning",
      priority: "medium",
      title: "Carga de Exclusiones",
      message: `Se han acumulado ${overview.home2Min} exclusiones de 2 minutos.`,
      recommendation: "Ajustar la contundencia en los desplazamientos laterales defensivos para evitar bloqueos a destiempo."
    });
  }

  return insights.sort((a, b) => {
    const pOrder = { critical: 1, high: 2, medium: 3, info: 4 };
    return (pOrder[a.priority] || 5) - (pOrder[b.priority] || 5);
  });
}
