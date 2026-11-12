import React from "react";
import { useTranslation } from "react-i18next";
import { KPICard } from "../common/KPICard";
import { ConfigurableDashboardGrid } from "../common/ConfigurableDashboardGrid";
import {
  DEFENSE_WIDGET_CATALOG,
  createDefaultLayout
} from "../../../services/dashboardLayoutService";

export function DefenseStatsView({ metrics, teamFilter = "home", sectionConfig }) {
  const { t } = useTranslation();

  if (!metrics) return null;

  const activeConfig = sectionConfig || createDefaultLayout().sections.defense;
  const { overview } = metrics;
  const isAway = teamFilter === "away";

  const twoMin = isAway ? overview.away2Min : overview.home2Min;
  const freeThrows = isAway ? overview.awayFreeThrows : overview.homeFreeThrows;
  const oppTurnovers = isAway ? overview.homeTurnovers : overview.awayTurnovers;
  const defEff = isAway ? overview.awayDefEfficiency : overview.homeDefEfficiency;
  const steals = isAway ? overview.awaySteals : overview.homeSteals;
  const defRebounds = isAway ? overview.awayDefRebounds : overview.homeDefRebounds;
  const yellowCards = isAway ? (overview.awayYellowCards || 0) : (overview.homeYellowCards || 0);
  const redCards = isAway ? (overview.awayRedCards || 0) : (overview.homeRedCards || 0);
  const blueCards = isAway ? (overview.awayBlueCards || 0) : (overview.homeBlueCards || 0);

  const renderWidget = (config) => {
    switch (config.id) {
      case "def_kpi_free_throws":
        return (
          <KPICard
            title={t("defense.free_throws", "GOLPES FRANCO")}
            value={freeThrows}
            subtitle={t("defense.free_throws_sub", "Acciones de golpe franco registradas")}
          />
        );
      case "def_kpi_two_min":
        return (
          <KPICard
            title={t("defense.two_min", "EXCLUSIONES (2 MIN)")}
            value={twoMin}
            subtitle={t("defense.two_min_sub", "Sanciones de 2 minutos recibidas")}
          />
        );
      case "def_kpi_turnovers_forced":
        return (
          <KPICard
            title={t("defense.turnovers_forced", "PÉRDIDAS PROVOCADAS")}
            value={oppTurnovers}
            subtitle={t("defense.turnovers_forced_sub", "Pérdidas provocadas al rival")}
          />
        );
      case "def_kpi_efficiency":
        return (
          <KPICard
            title={t("defense.def_efficiency", "EFICIENCIA DEFENSIVA")}
            value={`${defEff}%`}
            subtitle={t("defense.def_eff_sub", "Ataques rivales frenados")}
          />
        );
      case "def_kpi_steals":
        return (
          <KPICard
            title={t("customize.widgets.def_kpi_steals", "RECUPERACIONES")}
            value={steals || 0}
            subtitle={t("customize.widgets.def_kpi_steals_desc", "Recuperaciones limpias de balón en fase defensiva.")}
          />
        );
      case "def_kpi_rebounds":
        return (
          <KPICard
            title={t("customize.widgets.def_kpi_rebounds", "REBOTES DEFENSIVOS")}
            value={defRebounds || 0}
            subtitle={t("customize.widgets.def_kpi_rebounds_desc", "Rebotes asegurados tras parada o poste rival.")}
          />
        );
      case "def_kpi_cards":
        return (
          <KPICard
            title={t("customize.widgets.def_kpi_cards", "SANCIONES (AMARILLAS, ROJAS Y AZULES)")}
            value={`${yellowCards + redCards + blueCards}`}
            comparison={`${yellowCards} Am · ${redCards} Rj · ${blueCards} Az`}
            subtitle={t("customize.widgets.def_kpi_cards_desc", "Tarjetas amarillas, rojas y azules registradas en el partido.")}
          />
        );
      default:
        return null;
    }
  };

  return (
    <ConfigurableDashboardGrid
      widgets={activeConfig.widgets}
      catalog={DEFENSE_WIDGET_CATALOG}
      density={activeConfig.density}
      renderWidget={renderWidget}
    />
  );
}
