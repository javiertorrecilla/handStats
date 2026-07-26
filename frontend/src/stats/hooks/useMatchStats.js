/* ==========================================================
   HANDSTATS ANALYTICS — USE MATCH STATS HOOK
   Hook reactivo memoizado para métricas en tiempo real
   ========================================================== */

import { useMemo } from "react";
import { calculateMatchMetrics } from "../engine/metricsEngine";
import { generateTacticalInsights } from "../engine/insightsEngine";
import { generateCourtHeatmap, generateGoalGridMatrix } from "../engine/heatmapEngine";

export function useMatchStats(match, activePossession, timeSeconds = 0) {
  const metrics = useMemo(() => {
    return calculateMatchMetrics(match, activePossession, timeSeconds);
  }, [match, activePossession, timeSeconds]);

  const insights = useMemo(() => {
    return generateTacticalInsights(metrics, match);
  }, [metrics, match]);

  const homeHeatmaps = useMemo(() => {
    if (!match?.events) return {};
    return {
      shots: generateCourtHeatmap(match.events, "shots", false),
      goals: generateCourtHeatmap(match.events, "goals", false),
      assists: generateCourtHeatmap(match.events, "assists", false),
      turnovers: generateCourtHeatmap(match.events, "turnovers", false),
      steals: generateCourtHeatmap(match.events, "steals", false),
      goalGrid: generateGoalGridMatrix(match.events, false)
    };
  }, [match?.events]);

  const awayHeatmaps = useMemo(() => {
    if (!match?.events) return {};
    return {
      shots: generateCourtHeatmap(match.events, "shots", true),
      goals: generateCourtHeatmap(match.events, "goals", true),
      assists: generateCourtHeatmap(match.events, "assists", true),
      turnovers: generateCourtHeatmap(match.events, "turnovers", true),
      steals: generateCourtHeatmap(match.events, "steals", true),
      goalGrid: generateGoalGridMatrix(match.events, true)
    };
  }, [match?.events]);

  return {
    metrics,
    insights,
    homeHeatmaps,
    awayHeatmaps,
    isReady: !!metrics
  };
}
