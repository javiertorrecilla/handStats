import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { X as IconX } from "lucide-react";
import { MetricBadge, getRatingBadge } from "../common/MetricBadge";

export function PlayersStatsView({ metrics, teamFilter = "home" }) {
  const { t } = useTranslation();

  if (!metrics) return null;

  const { homePlayerStats, awayPlayerStats, overview } = metrics;
  const isAway = teamFilter === "away";
  const players = isAway ? awayPlayerStats : homePlayerStats;
  const teamName = isAway ? overview.awayTeam : overview.homeTeam;

  const [sortField, setSortField] = useState("number");
  const [sortOrder, setSortOrder] = useState("asc");
  const [selectedPlayerModal, setSelectedPlayerModal] = useState(null);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("asc"); // Always start with ASC when selecting a new column, exactly like Dorsales!
    }
  };

  const sortedPlayers = [...players].sort((a, b) => {
    let aVal, bVal;

    switch (sortField) {
      case "number":
        aVal = parseInt(a.number, 10) || 0;
        bVal = parseInt(b.number, 10) || 0;
        break;
      case "name":
        aVal = (a.name || "").toLowerCase();
        bVal = (b.name || "").toLowerCase();
        break;
      case "isGoalkeeper":
        aVal = a.isGoalkeeper ? 1 : 0;
        bVal = b.isGoalkeeper ? 1 : 0;
        break;
      case "minutesPlayed":
        aVal = Number(a.secondsPlayed) || 0;
        bVal = Number(b.secondsPlayed) || 0;
        break;
      case "shotsCount":
        aVal = Number(a.shotsCount) || 0;
        bVal = Number(b.shotsCount) || 0;
        break;
      case "goals":
        aVal = Number(a.goals) || 0;
        bVal = Number(b.goals) || 0;
        break;
      case "xg":
        aVal = parseFloat(a.xg) || 0;
        bVal = parseFloat(b.xg) || 0;
        break;
      case "goalkeeperShotsFaced":
        aVal = Number(a.goalkeeperShotsFaced) || 0;
        bVal = Number(b.goalkeeperShotsFaced) || 0;
        break;
      case "goalkeeperSaves":
        aVal = Number(a.goalkeeperSaves) || 0;
        bVal = Number(b.goalkeeperSaves) || 0;
        break;
      case "goalkeeperXSaves":
        aVal = parseFloat(a.goalkeeperXSaves) || 0;
        bVal = parseFloat(b.goalkeeperXSaves) || 0;
        break;
      case "turnovers":
        aVal = Number(a.turnovers) || 0;
        bVal = Number(b.turnovers) || 0;
        break;
      case "penalties7m":
        aVal = ((Number(a.drawn7mCount) || 0) * 0.8) - ((Number(a.penaltiesCommitted) || 0) * 0.9);
        bVal = ((Number(b.drawn7mCount) || 0) * 0.8) - ((Number(b.penaltiesCommitted) || 0) * 0.9);
        break;
      case "offensiveFouls":
        aVal = ((Number(a.offFoulsDrawn) || 0) * 0.6) - ((Number(a.offensiveFouls) || 0) * 0.8);
        bVal = ((Number(b.offFoulsDrawn) || 0) * 0.6) - ((Number(b.offensiveFouls) || 0) * 0.8);
        break;
      case "twoMins":
        aVal = Number(a.twoMins) || 0;
        bVal = Number(b.twoMins) || 0;
        break;
      case "rating":
        aVal = parseFloat(a.rating) || 0;
        bVal = parseFloat(b.rating) || 0;
        break;
      default:
        aVal = a[sortField] || 0;
        bVal = b[sortField] || 0;
    }

    if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
    if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;

    // Tiebreaker: sort secondary by number ascending if primary values are equal
    return (parseInt(a.number, 10) || 0) - (parseInt(b.number, 10) || 0);
  });

  const renderSortIndicator = (field) => {
    if (sortField !== field) return null;
    return <span style={{ marginLeft: "4px", opacity: 0.85 }}>{sortOrder === "asc" ? "▲" : "▼"}</span>;
  };

  const columns = [
    { key: "number", label: t("players_table.col_number", "Dorsal") },
    { key: "name", label: t("players_table.col_name", "Nombre") },
    { key: "isGoalkeeper", label: t("players_table.col_role", "Rol") },
    { key: "minutesPlayed", label: t("players_table.col_minutes", "Min") },
    { key: "shotsCount", label: t("players_table.col_shots", "Tiros Campo") },
    { key: "goals", label: t("players_table.col_goals", "Goles") },
    { key: "xg", label: t("players_table.col_xg", "xG Campo") },
    { key: "goalkeeperShotsFaced", label: t("players_table.col_shots_faced", "Tiros Recibidos") },
    { key: "goalkeeperSaves", label: t("players_table.col_saves", "Paradas") },
    { key: "goalkeeperXSaves", label: t("players_table.col_xsaves", "xSaves") },
    { key: "turnovers", label: t("players_table.col_turnovers", "Pérdidas") },
    { key: "penalties7m", label: t("players_table.col_7m", "7m (Prov/Com)") },
    { key: "offensiveFouls", label: t("players_table.col_off_fouls", "F. Atq (Prov/Com)") },
    { key: "twoMins", label: t("players_table.col_2min", "2 Min") },
    { key: "rating", label: t("players_table.col_rating", "Rating") }
  ];

  return (
    <div className="hs-view-container">
      <div className="hs-card">
        <h4 className="hs-card-title">{t("players_table.title", { team: teamName, defaultValue: `ESTADÍSTICAS INDIVIDUALES DE JUGADORES Y PORTEROS — ${teamName}` })}</h4>
        <p style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", margin: "var(--space-4) 0 var(--space-12) 0" }}>
          {t("players_table.subtitle", "Haz clic en el título de cualquier columna para ordenar o haz clic en cualquier jugador para ver su desglose detallado de rating.")}
        </p>

        <div className="hs-table-swipe-hint">
          <span>← {t("common.swipe_hint", "Desliza horizontalmente para ver todas las métricas")} →</span>
        </div>

        <div className="hs-table-container">
          <table className="hs-data-table">
            <thead>
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    style={{ cursor: "pointer", userSelect: "none", whiteSpace: "nowrap" }}
                    title={col.label}
                  >
                    {col.label} {renderSortIndicator(col.key)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedPlayers.map((p, idx) => (
                <tr
                  key={idx}
                  onClick={() => setSelectedPlayerModal(p)}
                  style={{ cursor: "pointer" }}
                  title={t("players_table.click_for_details", "Haz clic para ver desglose detallado de rating y acciones")}
                >
                  <td><strong>#{p.number}</strong></td>
                  <td><strong>{p.name}</strong></td>
                  <td>
                    <span style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
                      {p.isGoalkeeper ? t("players_table.role_gk", "Portero") : t("players_table.role_player", "Jugador")}
                    </span>
                  </td>

                  {/* TIEMPO JUGADO (MINUTOS) */}
                  <td>
                    <span style={{ fontFamily: "var(--font-mono, monospace)", fontWeight: 700, color: "var(--text-primary)" }}>
                      {p.minutesPlayedFormatted || (p.minutesPlayed ? `${Math.round(p.minutesPlayed)}'` : "0'")}
                    </span>
                  </td>

                  {/* TIROS DE CAMPO / GOLES (con % de eficacia integrado) / XG — JUGADORES Y PORTEROS QUE LANZAN */}
                  <td>{p.shotsCount > 0 ? p.shotsCount : "—"}</td>
                  <td>
                    {p.shotsCount > 0 || p.goals > 0 ? (
                      <>
                        <strong>{p.goals}</strong>
                        {p.shotsCount > 0 && (
                          <span style={{ fontSize: "0.8em", color: "var(--text-muted)", marginLeft: "4px" }}>
                            ({p.efficiency}%)
                          </span>
                        )}
                      </>
                    ) : (
                      <span style={{ color: "var(--text-muted)" }}>0</span>
                    )}
                  </td>
                  <td>{p.shotsCount > 0 ? p.xg : "—"}</td>

                  {/* TIROS RECIBIDOS / PARADAS (con % de eficacia integrado) / XSAVES — PORTEROS */}
                  <td>
                    {p.isGoalkeeper ? (
                      <strong>{p.goalkeeperShotsFaced}</strong>
                    ) : (
                      <span style={{ color: "var(--text-muted)" }}>—</span>
                    )}
                  </td>
                  <td>
                    {p.isGoalkeeper ? (
                      <>
                        <strong>{p.goalkeeperSaves}</strong>
                        {p.goalkeeperShotsFaced > 0 && (
                          <span style={{ fontSize: "0.8em", color: "var(--text-muted)", marginLeft: "4px" }}>
                            ({p.goalkeeperSavePct}%)
                          </span>
                        )}
                      </>
                    ) : (
                      <span style={{ color: "var(--text-muted)" }}>—</span>
                    )}
                  </td>
                  <td>
                    {p.isGoalkeeper ? (
                      <strong>{p.goalkeeperXSaves}</strong>
                    ) : (
                      <span style={{ color: "var(--text-muted)" }}>—</span>
                    )}
                  </td>

                  <td>{p.turnovers}</td>

                  {/* 7 METROS: PROVOCADOS / COMETIDOS */}
                  <td>
                    <span title={t("players_table.7m_tooltip", "7m Provocados (+0.80) / Cometidos (-0.90)")}>
                      <strong style={{ color: p.drawn7mCount > 0 ? "var(--color-primary, #44D878)" : "inherit" }}>
                        {p.drawn7mCount || 0}
                      </strong>
                      {" / "}
                      <span style={{ color: p.penaltiesCommitted > 0 ? "#ef4444" : "var(--text-muted)" }}>
                        {p.penaltiesCommitted || 0}
                      </span>
                    </span>
                  </td>

                  {/* FALTAS EN ATAQUE: PROVOCADAS / COMETIDAS */}
                  <td>
                    <span title={t("players_table.off_foul_tooltip", "Faltas en ataque Provocadas (+0.60) / Cometidas (-0.80)")}>
                      <strong style={{ color: p.offFoulsDrawn > 0 ? "var(--color-primary, #44D878)" : "inherit" }}>
                        {p.offFoulsDrawn || 0}
                      </strong>
                      {" / "}
                      <span style={{ color: p.offensiveFouls > 0 ? "#ef4444" : "var(--text-muted)" }}>
                        {p.offensiveFouls || 0}
                      </span>
                    </span>
                  </td>

                  <td>{p.twoMins}</td>
                  <td>
                    {(() => {
                      const badge = getRatingBadge(p.rating);
                      return <MetricBadge value={p.rating} variant={badge.variant} className={badge.className} />;
                    })()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DETALLADO DE JUGADOR: DESGLOSE DE RATING Y ACCIONES */}
      {selectedPlayerModal && (() => {
        const p = selectedPlayerModal;
        const badge = getRatingBadge(p.rating);
        const breakdown = p.ratingBreakdown || {};
        const npsVal = breakdown.nps !== undefined ? Number(breakdown.nps).toFixed(2) : "0.00";

        return (
          <div className="hs-player-modal-overlay" onClick={() => setSelectedPlayerModal(null)}>
            <div className="hs-player-modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="hs-player-modal-header">
                <div className="hs-player-modal-header-left">
                  <span className="hs-player-modal-num">#{p.number}</span>
                  <div>
                    <h3 className="hs-player-modal-title">{p.name}</h3>
                    <p className="hs-player-modal-subtitle">
                      {p.isGoalkeeper ? t("players_table.role_gk", "Portero") : t("players_table.role_player", "Jugador de Campo")} • {teamName}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="hs-player-modal-close-btn"
                  onClick={() => setSelectedPlayerModal(null)}
                  title={t("common.close", "Cerrar")}
                >
                  <IconX size={20} />
                </button>
              </div>

              <div className="hs-player-modal-body">
                {/* RATING & NPS SUMMARY */}
                <div className="hs-player-rating-summary">
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.5 }}>
                      {t("player_card.rating_title", "Rating Global (0 - 10)")}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}>
                      <MetricBadge value={p.rating} variant={badge.variant} className={badge.className} style={{ fontSize: "1.1rem", padding: "4px 12px" }} />
                      <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                        {t("player_card.base_rating_note", "Nota base 5.0 (neutra) + Transformación Sigmoide")}
                      </span>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.5 }}>
                      {t("player_card.nps_title", "NPS Puntos Netos")}
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 900, fontFamily: "var(--font-data)", color: Number(npsVal) >= 0 ? "#44D878" : "#ef4444", marginTop: 4 }}>
                      {Number(npsVal) > 0 ? `+${npsVal}` : npsVal}
                    </div>
                  </div>
                </div>

                {/* DESGLOSE ESPECÍFICO DE 7M Y FALTAS EN ATAQUE */}
                <div>
                  <h5 style={{ margin: "0 0 10px 0", fontSize: 12, fontWeight: 800, textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: 0.5 }}>
                    {t("player_card.roles_section", "7 Metros y Faltas en Ataque (Provocador vs Infractor)")}
                  </h5>
                  <div className="hs-player-stat-grid">
                    <div className="hs-player-stat-tile">
                      <span className="hs-player-stat-tile-label">7m Provocado (+0.80)</span>
                      <span className="hs-player-stat-tile-val">
                        <span>{p.drawn7mCount || 0}</span>
                        <span className="hs-stat-impact-pos">
                          {p.drawn7mCount > 0 ? `+${((p.drawn7mCount || 0) * 0.8).toFixed(2)}` : "0.00"}
                        </span>
                      </span>
                    </div>

                    <div className="hs-player-stat-tile">
                      <span className="hs-player-stat-tile-label">7m Cometido (-0.90)</span>
                      <span className="hs-player-stat-tile-val">
                        <span>{p.penaltiesCommitted || 0}</span>
                        <span className="hs-stat-impact-neg">
                          {p.penaltiesCommitted > 0 ? `-${((p.penaltiesCommitted || 0) * 0.9).toFixed(2)}` : "0.00"}
                        </span>
                      </span>
                    </div>

                    <div className="hs-player-stat-tile">
                      <span className="hs-player-stat-tile-label">Falta Ataque Provocada (+0.60)</span>
                      <span className="hs-player-stat-tile-val">
                        <span>{p.offFoulsDrawn || 0}</span>
                        <span className="hs-stat-impact-pos">
                          {p.offFoulsDrawn > 0 ? `+${((p.offFoulsDrawn || 0) * 0.6).toFixed(2)}` : "0.00"}
                        </span>
                      </span>
                    </div>

                    <div className="hs-player-stat-tile">
                      <span className="hs-player-stat-tile-label">Falta Ataque Cometida (-0.80)</span>
                      <span className="hs-player-stat-tile-val">
                        <span>{p.offensiveFouls || 0}</span>
                        <span className="hs-stat-impact-neg">
                          {p.offensiveFouls > 0 ? `-${((p.offensiveFouls || 0) * 0.8).toFixed(2)}` : "0.00"}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* RESTO DE ESTADÍSTICAS */}
                <div>
                  <h5 style={{ margin: "0 0 10px 0", fontSize: 12, fontWeight: 800, textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: 0.5 }}>
                    {t("player_card.general_stats", "Rendimiento General")}
                  </h5>
                  <div className="hs-player-stat-grid">
                    <div className="hs-player-stat-tile">
                      <span className="hs-player-stat-tile-label">Goles / Tiros</span>
                      <span className="hs-player-stat-tile-val">
                        {p.goals || 0} / {p.shotsCount || 0} ({p.efficiency || 0}%)
                      </span>
                    </div>

                    <div className="hs-player-stat-tile">
                      <span className="hs-player-stat-tile-label">xG Generado</span>
                      <span className="hs-player-stat-tile-val">{p.xg || "0.00"}</span>
                    </div>

                    <div className="hs-player-stat-tile">
                      <span className="hs-player-stat-tile-label">Pérdidas de balón</span>
                      <span className="hs-player-stat-tile-val">{p.turnovers || 0}</span>
                    </div>

                    <div className="hs-player-stat-tile">
                      <span className="hs-player-stat-tile-label">Exclusiones (2 Min)</span>
                      <span className="hs-player-stat-tile-val">{p.twoMins || 0}</span>
                    </div>

                    {p.isGoalkeeper && (
                      <>
                        <div className="hs-player-stat-tile">
                          <span className="hs-player-stat-tile-label">Paradas Portería</span>
                          <span className="hs-player-stat-tile-val">
                            {p.goalkeeperSaves || 0} / {p.goalkeeperShotsFaced || 0} ({p.goalkeeperSavePct || 0}%)
                          </span>
                        </div>
                        <div className="hs-player-stat-tile">
                          <span className="hs-player-stat-tile-label">xSaves Esperadas</span>
                          <span className="hs-player-stat-tile-val">{p.goalkeeperXSaves || "0.00"}</span>
                        </div>
                      </>
                    )}

                    <div className="hs-player-stat-tile">
                      <span className="hs-player-stat-tile-label">Tiempo en pista</span>
                      <span className="hs-player-stat-tile-val">{p.minutesPlayedFormatted || `${Math.round(p.minutesPlayed || 0)}'`}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

