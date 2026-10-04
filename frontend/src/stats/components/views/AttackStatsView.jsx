import React from "react";
import { useTranslation } from "react-i18next";
import { KPICard } from "../common/KPICard";
import { DonutChart } from "../charts/DonutChart";

export function AttackStatsView({ metrics, match, homeHeatmaps, awayHeatmaps, teamFilter = "home" }) {
  const { t } = useTranslation();

  if (!metrics) return null;

  const { overview, attackBreakdownHome, attackBreakdownAway } = metrics;

  const isAway = teamFilter === "away";
  const targetTeam = isAway ? overview.awayTeam : overview.homeTeam;
  const attackBreakdown = isAway ? (attackBreakdownAway || {}) : (attackBreakdownHome || {});

  const goals = isAway ? overview.awayGoals : overview.homeGoals;
  const xg = isAway ? overview.awayXG : overview.homeXG;
  const turnovers = isAway ? overview.awayTurnovers : overview.homeTurnovers;

  const byType = attackBreakdown?.byType || {};

  const donutSegments = Object.keys(byType).map((key, idx) => {
    const colors = ["var(--color-primary)", "var(--color-info)", "var(--color-warning)", "var(--color-secondary)", "#8b5cf6"];
    return {
      label: key,
      value: byType[key].shots,
      color: colors[idx % colors.length]
    };
  });

  return (
    <div className="hs-view-container" style={{ display: "flex", flexDirection: "column", gap: "var(--space-24)" }}>
      {/* TARJETAS DE INDICADORES CLAVE EN ATAQUE */}
      <div className="hs-kpi-grid">
        <KPICard
          title={t("attack.total_shots", { team: targetTeam.toUpperCase(), defaultValue: `LANZAMIENTOS TOTALES — ${targetTeam.toUpperCase()}` })}
          value={attackBreakdown.totalShots || 0}
          subtitle={t("attack.goals_count", { goals, defaultValue: `Goles: ${goals}` })}
        />
        <KPICard
          title={t("attack.shot_efficiency", "EFICIENCIA DE TIRO")}
          value={`${attackBreakdown.totalShots > 0 ? Math.round((goals / attackBreakdown.totalShots) * 100) : 0}%`}
          subtitle={t("attack.shot_eff_sub", "Efectividad en portería")}
        />
        <KPICard
          title={t("attack.xg_title", "EXPECTED GOALS (xG)")}
          value={xg}
          subtitle={t("attack.xg_sub", "Goles esperados según tiros")}
        />
        <KPICard
          title={t("attack.turnovers_title", "PÉRDIDAS DE BALÓN")}
          value={turnovers}
          subtitle={t("attack.turnovers_sub", "Balones cedidos")}
        />
      </div>

      {/* GRÁFICOS Y TABLAS DE TIPO DE TIRO */}
      <div className="hs-dual-chart-grid">
        <div className="hs-card">
          <h4 className="hs-card-title">{t("attack.dist_by_type", { team: targetTeam, defaultValue: `DISTRIBUCIÓN POR TIPO DE TIRO — ${targetTeam}` })}</h4>
          <DonutChart segments={donutSegments} centerLabel={`${goals}`} centerSub={t("attack.goals_center", "GOLES")} />
        </div>

        <div className="hs-card">
          <h4 className="hs-card-title">{t("attack.eff_by_type", "DESGLOSE DE EFICIENCIA POR TIPO DE TIRO")}</h4>
          <div className="hs-table-container">
            <table className="hs-data-table">
              <thead>
                <tr>
                  <th>{t("attack.col_type", "Tipo de Tiro")}</th>
                  <th>{t("attack.col_shots", "Tiros")}</th>
                  <th>{t("attack.col_goals", "Goles")}</th>
                  <th>{t("attack.col_eff", "% Eficacia")}</th>
                  <th>{t("attack.col_xg", "xG")}</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(byType).length > 0 ? (
                  Object.keys(byType).map((type, i) => {
                    const item = byType[type];
                    const pct = item.shots > 0 ? Math.round((item.goals / item.shots) * 100) : 0;
                    return (
                      <tr key={i}>
                        <td><strong>{type}</strong></td>
                        <td>{item.shots}</td>
                        <td>{item.goals}</td>
                        <td>
                          <span className="hs-table-pct" style={{ color: pct >= 60 ? "var(--color-primary)" : "var(--text-primary)" }}>
                            {pct}%
                          </span>
                        </td>
                        <td>{Math.round(item.xg * 100) / 100}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="5" style={{ textAlign: "center", color: "var(--text-muted)" }}>
                      {t("attack.not_enough_shots", "No hay suficientes lanzamientos registrados.")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* DESGLOSE POR SITUACIÓN NUMÉRICA Y TÁCTICA (7vs6 / 6vs6 Sin Portero) */}
      {metrics.tacticalSituations && (
        <div className="hs-card">
          <h4 className="hs-card-title">{t("attack.eff_by_situation", { team: targetTeam, defaultValue: `DESGLOSE POR SITUACIÓN NUMÉRICA Y TÁCTICA — ${targetTeam.toUpperCase()}` })}</h4>
          <div className="hs-table-container">
            <table className="hs-data-table">
              <thead>
                <tr>
                  <th>{t("attack.col_situation", "Situación Táctica")}</th>
                  <th>{t("attack.col_shots", "Tiros")}</th>
                  <th>{t("attack.col_goals", "Goles")}</th>
                  <th>{t("attack.col_eff", "% Eficacia")}</th>
                  <th>{t("attack.turnovers", "Pérdidas")}</th>
                  <th>{t("empty_net_conceded", "Goles P.V. Recibidos")}</th>
                  <th>{t("net_balance", "Balance (+/-)")}</th>
                  <th>{t("report.pct_attack", "% Ataque")}</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const tacData = isAway ? metrics.tacticalSituations.away : metrics.tacticalSituations.home;
                  if (!tacData) return null;
                  const list = [
                    { key: "equality", label: "Igualdad Numérica (6vs6 con portero)", tag: "6vs6", color: "#12843A", item: tacData.equality },
                    { key: "superiority", label: "Superioridad Numérica (+1 o más)", tag: "SUPERIORIDAD", color: "#2563EB", item: tacData.superiority },
                    { key: "inferiority", label: "Inferioridad Numérica (-1 o más)", tag: "INFERIORIDAD", color: "#DC2626", item: tacData.inferiority },
                    { key: "sevenVsSix", label: "Ataque 7 vs 6 (Portero Jugador)", tag: "7vs6 (PJ)", color: "#7C3AED", item: tacData.sevenVsSix },
                    { key: "sixVsSixNoGk", label: "6 vs 6 Sin Portero (Con Exclusión)", tag: "6vs6 S/P", color: "#EA580C", item: tacData.sixVsSixNoGk },
                    { key: "emptyNet", label: "Portería Vacía", tag: "P. VACÍA", color: "#D97706", item: tacData.emptyNet }
                  ];

                  return list.map(({ key, label, tag, color, item }) => {
                    if (!item) return null;
                    const balance = item.netBalance ?? (item.goals - (item.emptyNetGoalsConceded || 0));
                    return (
                      <tr key={key}>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <strong>{label}</strong>
                            <span style={{ fontSize: "8.5px", fontWeight: "800", color, background: `${color}15`, padding: "1px 5px", borderRadius: "3px" }}>
                              {tag}
                            </span>
                          </div>
                        </td>
                        <td>{item.shots}</td>
                        <td>{item.goals}</td>
                        <td>
                          <span className="hs-table-pct" style={{ color: item.goalPct >= 60 ? "var(--color-primary)" : "var(--text-primary)" }}>
                            {item.goalPct}%
                          </span>
                        </td>
                        <td>{item.turnovers}</td>
                        <td style={{ color: item.emptyNetGoalsConceded > 0 ? "#DC2626" : "inherit" }}>
                          {item.emptyNetGoalsConceded}
                        </td>
                        <td>
                          <strong style={{ color: balance > 0 ? "#12843A" : balance < 0 ? "#DC2626" : "#6B7280" }}>
                            {balance > 0 ? `+${balance}` : balance}
                          </strong>
                        </td>
                        <td>{item.attackPct}%</td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
