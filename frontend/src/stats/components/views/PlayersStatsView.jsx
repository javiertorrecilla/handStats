import React, { useState } from "react";
import { MetricBadge } from "../common/MetricBadge";

export function PlayersStatsView({ metrics, teamFilter = "home" }) {
  if (!metrics) return null;

  const { homePlayerStats, awayPlayerStats, overview } = metrics;
  const isAway = teamFilter === "away";
  const players = isAway ? awayPlayerStats : homePlayerStats;
  const teamName = isAway ? overview.awayTeam : overview.homeTeam;

  const [sortField, setSortField] = useState("number");
  const [sortOrder, setSortOrder] = useState("asc");

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
      case "steals":
        aVal = Number(a.steals) || 0;
        bVal = Number(b.steals) || 0;
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
    { key: "number", label: "Dorsal" },
    { key: "name", label: "Nombre" },
    { key: "isGoalkeeper", label: "Rol" },
    { key: "shotsCount", label: "Tiros Campo" },
    { key: "goals", label: "Goles" },
    { key: "xg", label: "xG Campo" },
    { key: "goalkeeperShotsFaced", label: "Tiros Recibidos" },
    { key: "goalkeeperSaves", label: "Paradas" },
    { key: "goalkeeperXSaves", label: "xSaves" },
    { key: "turnovers", label: "Pérdidas" },
    { key: "steals", label: "Robos" },
    { key: "twoMins", label: "2 Min" },
    { key: "rating", label: "Rating" }
  ];

  return (
    <div className="hs-view-container">
      <div className="hs-card">
        <h4 className="hs-card-title">ESTADÍSTICAS INDIVIDUALES DE JUGADORES Y PORTEROS — {teamName}</h4>
        <p style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", margin: "var(--space-4) 0 var(--space-12) 0" }}>
          Haz clic en el título de cualquier columna para ordenarla de manera ascendente (▲) o descendente (▼).
        </p>

        <div className="hs-table-container">
          <table className="hs-data-table">
            <thead>
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    style={{ cursor: "pointer", userSelect: "none", whiteSpace: "nowrap" }}
                    title={`Haz clic para ordenar por ${col.label}`}
                  >
                    {col.label} {renderSortIndicator(col.key)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedPlayers.map((p, idx) => (
                <tr key={idx}>
                  <td><strong>#{p.number}</strong></td>
                  <td><strong>{p.name}</strong></td>
                  <td>
                    <span style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
                      {p.isGoalkeeper ? "Portero" : "Jugador"}
                    </span>
                  </td>

                  {/* TIROS DE CAMPO / GOLES (con % de eficacia integrado) / XG — JUGADORES DE CAMPO */}
                  <td>{p.isGoalkeeper ? <span style={{ color: "var(--text-muted)" }}>—</span> : p.shotsCount}</td>
                  <td>
                    {p.isGoalkeeper ? (
                      <span style={{ color: "var(--text-muted)" }}>—</span>
                    ) : (
                      <>
                        <strong>{p.goals}</strong>
                        {p.shotsCount > 0 && (
                          <span style={{ fontSize: "0.8em", color: "var(--text-muted)", marginLeft: "4px" }}>
                            ({p.efficiency}%)
                          </span>
                        )}
                      </>
                    )}
                  </td>
                  <td>{p.isGoalkeeper ? <span style={{ color: "var(--text-muted)" }}>—</span> : (p.shotsCount > 0 ? p.xg : "—")}</td>

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
                  <td>{p.steals}</td>
                  <td>{p.twoMins}</td>
                  <td>
                    <MetricBadge value={p.rating} variant={p.rating >= 7.5 ? "success" : p.rating >= 6.0 ? "info" : "warning"} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
