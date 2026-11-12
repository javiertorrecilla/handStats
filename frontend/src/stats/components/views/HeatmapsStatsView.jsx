import React from "react";
import { useTranslation } from "react-i18next";
import { HeatmapCourt } from "../charts/HeatmapCourt";
import { ConfigurableDashboardGrid } from "../common/ConfigurableDashboardGrid";
import {
  HEATMAPS_WIDGET_CATALOG,
  createDefaultLayout
} from "../../../services/dashboardLayoutService";

export function HeatmapsStatsView({ match, teamFilter = "home", sectionConfig }) {
  const { t } = useTranslation();
  const activeConfig = sectionConfig || createDefaultLayout().sections.heatmaps;
  const events = match?.events || [];
  const isOpponent = teamFilter === "away";
  const teamName = isOpponent ? match?.away_team || "Visitante" : match?.home_team || "Local";

  const renderWidget = (config) => {
    switch (config.id) {
      case "hm_combined_court":
        return (
          <HeatmapCourt
            events={events}
            isOpponent={isOpponent}
            match={match}
            title={t("heatmaps.title", {
              team: teamName.toUpperCase(),
              defaultValue: `MAPA DE CALOR CONTINUO Y EFICIENCIA DE TIRO Y PORTERÍA — ${teamName.toUpperCase()}`
            })}
          />
        );
      default:
        return null;
    }
  };

  return (
    <ConfigurableDashboardGrid
      widgets={activeConfig.widgets}
      catalog={HEATMAPS_WIDGET_CATALOG}
      density={activeConfig.density}
      renderWidget={renderWidget}
    />
  );
}
