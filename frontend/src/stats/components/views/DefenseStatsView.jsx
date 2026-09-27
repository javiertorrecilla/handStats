import React from "react";
import { useTranslation } from "react-i18next";
import { KPICard } from "../common/KPICard";

export function DefenseStatsView({ metrics, teamFilter = "home" }) {
  const { t } = useTranslation();

  if (!metrics) return null;

  const { overview } = metrics;
  const isAway = teamFilter === "away";

  const targetTeam = isAway ? overview.awayTeam : overview.homeTeam;
  const twoMin = isAway ? overview.away2Min : overview.home2Min;
  const freeThrows = isAway ? overview.awayFreeThrows : overview.homeFreeThrows;
  const oppTurnovers = isAway ? overview.homeTurnovers : overview.awayTurnovers;
  const defEff = isAway ? overview.awayDefEfficiency : overview.homeDefEfficiency;

  return (
    <div className="hs-view-container">
      <div className="hs-kpi-grid">
        <KPICard
          title={t("defense.free_throws", "GOLPES FRANCO")}
          value={freeThrows}
          subtitle={t("defense.free_throws_sub", "Acciones de golpe franco registradas")}
        />
        <KPICard
          title={t("defense.two_min", "EXCLUSIONES (2 MIN)")}
          value={twoMin}
          subtitle={t("defense.two_min_sub", "Sanciones de 2 minutos recibidas")}
        />
        <KPICard
          title={t("defense.turnovers_forced", "PÉRDIDAS PROVOCADAS")}
          value={oppTurnovers}
          subtitle={t("defense.turnovers_forced_sub", "Pérdidas provocadas al rival")}
        />
        <KPICard
          title={t("defense.def_efficiency", "EFICIENCIA DEFENSIVA")}
          value={`${defEff}%`}
          subtitle={t("defense.def_eff_sub", "Ataques rivales frenados")}
        />
      </div>
    </div>
  );
}
