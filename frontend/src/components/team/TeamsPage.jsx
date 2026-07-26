import { useState, useEffect, useMemo } from "react";
import userService from "../../services/userService";
import { calculateTeamCumulativeStats } from "../../stats/engine/teamCumulativeEngine";
import { KPICard } from "../../stats/components/common/KPICard";
import { MetricBadge } from "../../stats/components/common/MetricBadge";
import { HeatmapCourt } from "../../stats/components/charts/HeatmapCourt";
import {
  IconBarChart,
  IconUsers,
  IconClock
} from "../../stats/components/common/Icons";
import "./TeamsPage.css";

const IconTeams = () => (
  <svg className="page-header-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ marginRight: 8, width: 22, height: 22, display: "inline-block", verticalAlign: "middle" }}>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const IconShieldSvg = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ width: 40, height: 40, color: "var(--text-muted)", display: "block", margin: "0 auto 12px" }}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const IconTrash = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ width: 16, height: 16 }}>
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const IconHandball = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ width: 64, height: 64, color: "var(--text-muted)", marginBottom: 16 }}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2a14.5 14.5 0 0 0 0 22" />
    <path d="M12 2a14.5 14.5 0 0 1 0 22" />
    <path d="M2 12h20" />
  </svg>
);

const IconSave = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ marginRight: 6, width: 16, height: 16, verticalAlign: "middle", display: "inline-block" }}>
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline points="17 21 17 13 7 13 7 21" />
    <polyline points="7 3 7 8 15 8" />
  </svg>
);

const IconPlus = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ marginRight: 6, width: 16, height: 16, verticalAlign: "middle", display: "inline-block" }}>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

export default function TeamsPage({ user, matchesList = [] }) {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Estado para el panel derecho
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [rightPanelTab, setRightPanelTab] = useState("stats"); // "stats" | "roster"
  const [selectedTeamGkNumber, setSelectedTeamGkNumber] = useState("all");
  const [editName, setEditName] = useState("");
  const [editPlayers, setEditPlayers] = useState([]);

  // Formulario nuevo jugador
  const [newPlayerName, setNewPlayerName] = useState("");
  const [newPlayerNumber, setNewPlayerNumber] = useState("");

  const loadTeams = async () => {
    if (!user?._id) return;
    setLoading(true);
    try {
      const savedTeams = await userService.getSavedTeams(user._id);
      setTeams(savedTeams || []);
    } catch (err) {
      console.error("Error al cargar equipos:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeams();
  }, [user]);

  // Al seleccionar un equipo de la lista
  const handleSelectTeam = (team) => {
    setIsCreating(false);
    setSelectedTeam(team);
    setSelectedTeamGkNumber("all");
    setRightPanelTab("stats");
    setEditName(team.name);
    setEditPlayers([...(team.players || [])]);
    setNewPlayerName("");
    setNewPlayerNumber("");
  };

  // Al hacer clic en crear equipo
  const handleStartCreate = () => {
    setSelectedTeam(null);
    setIsCreating(true);
    setSelectedTeamGkNumber("all");
    setRightPanelTab("roster");
    setEditName("");
    setEditPlayers([]);
    setNewPlayerName("");
    setNewPlayerNumber("");
  };

  // Añadir jugador a la lista temporal
  const handleAddPlayer = (e) => {
    e.preventDefault();
    if (!newPlayerName.trim() || newPlayerNumber === "") return;

    const numberVal = parseInt(newPlayerNumber, 10);
    if (editPlayers.some((p) => p.number === numberVal)) {
      alert("Ya existe un jugador con ese dorsal.");
      return;
    }

    const isGk = [1, 12, 16].includes(numberVal);

    setEditPlayers((prev) => [
      ...prev,
      { name: newPlayerName.trim(), number: numberVal, is_goalkeeper: isGk },
    ]);
    setNewPlayerName("");
    setNewPlayerNumber("");
  };

  const handleToggleGoalkeeper = (index) => {
    setEditPlayers((prev) =>
      prev.map((p, i) =>
        i === index ? { ...p, is_goalkeeper: !p.is_goalkeeper } : p
      )
    );
  };

  const handleRemovePlayer = (index) => {
    setEditPlayers((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveTeam = async (e) => {
    e.preventDefault();
    if (!editName.trim()) {
      alert("El nombre del equipo no puede estar vacío.");
      return;
    }

    try {
      if (isCreating) {
        if (teams.some((t) => t.name.toLowerCase() === editName.trim().toLowerCase())) {
          alert("Ya existe un equipo con este nombre.");
          return;
        }
        await userService.saveTeam(user._id, {
          name: editName.trim(),
          players: editPlayers,
        });
        alert("Equipo creado correctamente.");
      } else if (selectedTeam) {
        await userService.updateSavedTeam(user._id, selectedTeam.name, {
          name: editName.trim(),
          players: editPlayers,
        });
        alert("Equipo actualizado correctamente.");
      }
      setSelectedTeam(null);
      setIsCreating(false);
      loadTeams();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || "Error al guardar el equipo.");
    }
  };

  const handleDeleteTeam = async (teamName) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar el equipo "${teamName}"?`)) return;

    try {
      await userService.deleteSavedTeam(user._id, teamName);
      if (selectedTeam?.name === teamName) {
        setSelectedTeam(null);
      }
      loadTeams();
      alert("Equipo eliminado correctamente.");
    } catch (err) {
      console.error(err);
      alert("Error al eliminar el equipo.");
    }
  };

  // CÁLCULO DE ESTADÍSTICAS ACUMULADAS DEL EQUIPO
  const cumulativeStats = useMemo(() => {
    if (!selectedTeam?.name) return null;
    return calculateTeamCumulativeStats(selectedTeam.name, matchesList);
  }, [selectedTeam?.name, matchesList]);

  const filteredTeams = teams.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Porteros del equipo para el filtro
  const teamGoalkeepers = useMemo(() => {
    if (!cumulativeStats?.playerStats) return [];
    return cumulativeStats.playerStats.filter((p) => p.is_goalkeeper === true);
  }, [cumulativeStats]);

  const activeTeamGk = selectedTeamGkNumber !== "all"
    ? teamGoalkeepers.find((gk) => String(gk.number) === String(selectedTeamGkNumber))
    : null;

  return (
    <div className="teams-page">
      <div className="teams-header">
        <div>
          <h2 style={{ display: "flex", alignItems: "center" }}>
            <IconTeams />
            <span>Gestión & Inteligencia de Equipos</span>
          </h2>
          <p className="teams-subtitle">
            Estadísticas acumuladas de la temporada y gestión de plantillas de jugadores.
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleStartCreate} style={{ display: "inline-flex", alignItems: "center" }}>
          <IconPlus />
          <span>Nuevo Equipo</span>
        </button>
      </div>

      <div className="teams-layout">
        {/* COLUMNA IZQUIERDA: LISTADO DE EQUIPOS */}
        <div className="teams-list-column">
          <div className="search-box">
            <input
              type="text"
              className="input-field"
              placeholder="Buscar equipo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="teams-loading">Cargando equipos...</div>
          ) : filteredTeams.length === 0 ? (
            <div className="teams-empty-state">
              <IconShieldSvg />
              <p>No se encontraron equipos.</p>
            </div>
          ) : (
            <div className="teams-grid">
              {filteredTeams.map((team, idx) => (
                <div
                  key={idx}
                  className={`team-card ${selectedTeam?.name === team.name ? "active" : ""}`}
                  onClick={() => handleSelectTeam(team)}
                >
                  <div className="team-card-info">
                    <h3>{team.name}</h3>
                    <span>{team.players?.length || 0} Jugadores</span>
                  </div>
                  <button
                    className="btn-delete-team"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteTeam(team.name);
                    }}
                    title="Eliminar equipo"
                  >
                    <IconTrash />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* COLUMNA DERECHA: DASHBOARD DE RENDIMIENTO O EDITOR DE PLANTILLA */}
        <div className="teams-editor-column">
          {selectedTeam && !isCreating ? (
            <div className="team-editor-card">
              {/* NAVEGACIÓN ENTRE DASHBOARD DE EQUIPO Y PLANTILLA */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-24)", borderBottom: "1px solid var(--border-color)", paddingBottom: "var(--space-16)" }}>
                <div>
                  <h3 style={{ margin: 0 }}>{selectedTeam.name}</h3>
                  <span style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
                    {cumulativeStats?.totalMatches || 0} partidos analizados en HandStats
                  </span>
                </div>

                <div style={{ display: "flex", gap: "var(--space-4)", background: "var(--bg-inset)", padding: "4px", borderRadius: "var(--radius)", border: "1px solid var(--border-color)" }}>
                  <button
                    type="button"
                    className={`btn btn-sm ${rightPanelTab === "stats" ? "btn-primary" : "btn-ghost"}`}
                    onClick={() => setRightPanelTab("stats")}
                  >
                    <IconBarChart size={14} /> Dashboard Global
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${rightPanelTab === "roster" ? "btn-primary" : "btn-ghost"}`}
                    onClick={() => setRightPanelTab("roster")}
                  >
                    <IconUsers size={14} /> Plantilla ({editPlayers.length})
                  </button>
                </div>
              </div>

              {/* VISTA 1: DASHBOARD GLOBAL DE RENDIMIENTO DEL EQUIPO */}
              {rightPanelTab === "stats" && cumulativeStats && (
                <div className="team-stats-dashboard" style={{ display: "flex", flexDirection: "column", gap: "var(--space-32)" }}>
                  {/* KPIS DE TEMPORADA */}
                  <div className="hs-kpi-grid">
                    <KPICard
                      title="PARTIDOS Y RÉCORD"
                      value={`${cumulativeStats.wins}V - ${cumulativeStats.draws}E - ${cumulativeStats.losses}D`}
                      subtitle={`Total partidos: ${cumulativeStats.totalMatches}`}
                    />
                    <KPICard
                      title="GOLES A FAVOR / EN CONTRA"
                      value={`${cumulativeStats.goalsFor} - ${cumulativeStats.goalsAgainst}`}
                      subtitle={`Promedios: ${cumulativeStats.avgGoalsFor} / ${cumulativeStats.avgGoalsAgainst}`}
                    />
                    <KPICard
                      title="xG Y xGA ACUMULADO"
                      value={`${cumulativeStats.totalXG} / ${cumulativeStats.totalXGA}`}
                      subtitle={`Prom. xG: ${cumulativeStats.avgXG} por partido`}
                    />
                    <KPICard
                      title="EFICACIA LANZAMIENTO"
                      value={`${cumulativeStats.shotEfficiency}%`}
                      subtitle={`Goles: ${cumulativeStats.goalsFor} / ${cumulativeStats.totalShots} tiros`}
                    />
                    <KPICard
                      title={activeTeamGk ? `PORTERÍA (#${activeTeamGk.number} ${activeTeamGk.name.toUpperCase()})` : "PORTERÍA (% PARADAS TEMPORADA)"}
                      value={activeTeamGk ? `${activeTeamGk.savePct}%` : `${cumulativeStats.savePct}%`}
                      subtitle={activeTeamGk ? `${activeTeamGk.saves} paradas en ${activeTeamGk.shotsFaced} tiros` : `Paradas: ${cumulativeStats.totalSaves} / ${cumulativeStats.totalShotsFaced}`}
                    />
                    <KPICard
                      title="PÉRDIDAS POR PARTIDO"
                      value={cumulativeStats.avgTurnovers}
                      subtitle={`Total pérdidas: ${cumulativeStats.totalTurnovers}`}
                    />
                  </div>

                  {/* HISTORIAL DE PARTIDOS DEL EQUIPO */}
                  <div className="hs-card">
                    <h4 className="hs-card-title"><IconClock size={15} /> HISTORIAL DE PARTIDOS Y RESULTADOS DEL EQUIPO</h4>
                    {cumulativeStats.matchHistory.length === 0 ? (
                      <p style={{ color: "var(--text-muted)", fontSize: "var(--text-xs)", margin: 0 }}>
                        No hay partidos registrados aún con este equipo.
                      </p>
                    ) : (
                      <div className="hs-table-container">
                        <table className="hs-data-table">
                          <thead>
                            <tr>
                              <th>Fecha</th>
                              <th>Rival</th>
                              <th>Condición</th>
                              <th>Resultado Final</th>
                              <th>xG Favor</th>
                              <th>xG Rival</th>
                              <th>Estado</th>
                            </tr>
                          </thead>
                          <tbody>
                            {cumulativeStats.matchHistory.map((m, idx) => (
                              <tr key={idx}>
                                <td>{m.date ? new Date(m.date).toLocaleDateString("es-ES") : "—"}</td>
                                <td><strong>{m.opponent}</strong></td>
                                <td>{m.isHome ? "Casa (Local)" : "Fuera (Visitante)"}</td>
                                <td><strong>{m.goalsFor} - {m.goalsAgainst}</strong></td>
                                <td>{m.xg}</td>
                                <td>{m.xga}</td>
                                <td>
                                  <MetricBadge
                                    value={m.result === "W" ? "VICTORIA" : m.result === "D" ? "EMPATE" : "DERROTA"}
                                    variant={m.result === "W" ? "success" : m.result === "D" ? "warning" : "danger"}
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* ESTADÍSTICAS ACUMULADAS DE LA PLANTILLA EN LA TEMPORADA */}
                  <div className="hs-card">
                    <h4 className="hs-card-title"><IconUsers size={15} /> RENDIMIENTO ACUMULADO DE LA PLANTILLA EN LA TEMPORADA</h4>
                    {cumulativeStats.playerStats.length === 0 ? (
                      <p style={{ color: "var(--text-muted)", fontSize: "var(--text-xs)", margin: 0 }}>
                        No hay estadísticas de jugadores acumuladas todavía.
                      </p>
                    ) : (
                      <div className="hs-table-container">
                        <table className="hs-data-table">
                          <thead>
                            <tr>
                              <th>Dorsal</th>
                              <th>Jugador</th>
                              <th>PJ</th>
                              <th>Tiros</th>
                              <th>Goles</th>
                              <th>% Eficacia</th>
                              <th>xG Acumulado</th>
                              <th>Pérdidas</th>
                              <th>Robos</th>
                              <th>Rating Medio</th>
                            </tr>
                          </thead>
                          <tbody>
                            {cumulativeStats.playerStats.map((p, idx) => (
                              <tr key={idx}>
                                <td><strong>#{p.number}</strong></td>
                                <td>{p.name} {p.is_goalkeeper ? "(PO)" : ""}</td>
                                <td>{p.matchesPlayed}</td>
                                <td>{p.shotsCount}</td>
                                <td><strong>{p.goals}</strong></td>
                                <td>
                                  <MetricBadge value={`${p.efficiency}%`} variant={p.efficiency >= 60 ? "success" : p.efficiency >= 40 ? "info" : "danger"} />
                                </td>
                                <td>{p.xg}</td>
                                <td>{p.turnovers}</td>
                                <td>{p.steals}</td>
                                <td>
                                  <MetricBadge value={p.avgRating} variant={p.avgRating >= 7.5 ? "success" : p.avgRating >= 6.0 ? "info" : "warning"} />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* MAPA ACUMULADO DE LANZAMIENTOS Y PARADAS DE PORTERÍA EN LA TEMPORADA CON FILTRO DE PORTERO */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-12)" }}>
                    {teamGoalkeepers.length > 0 && (
                      <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "var(--space-8)", background: "var(--bg-surface)", padding: "var(--space-12) var(--space-16)", borderRadius: "var(--radius)", border: "1px solid var(--border-color)" }}>
                        <span style={{ fontSize: "var(--text-xs)", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", marginRight: "var(--space-4)" }}>
                          FILTRAR PARADAS DE PORTERÍA DE LA TEMPORADA:
                        </span>
                        <button
                          type="button"
                          className={`btn btn-sm ${selectedTeamGkNumber === "all" ? "btn-primary" : "btn-ghost"}`}
                          onClick={() => setSelectedTeamGkNumber("all")}
                        >
                          Todos los Porteros del Equipo
                        </button>
                        {teamGoalkeepers.map((gk) => (
                          <button
                            key={gk.number}
                            type="button"
                            className={`btn btn-sm ${String(selectedTeamGkNumber) === String(gk.number) ? "btn-primary" : "btn-ghost"}`}
                            onClick={() => setSelectedTeamGkNumber(gk.number)}
                          >
                            #{gk.number} {gk.name} ({gk.savePct}%)
                          </button>
                        ))}
                      </div>
                    )}

                    <HeatmapCourt
                      events={cumulativeStats.allTeamShotsEvents || []}
                      gkEvents={cumulativeStats.allTeamGkShotsFaced || []}
                      selectedGkNumber={selectedTeamGkNumber}
                      title={`MAPA ACUMULADO DE LANZAMIENTOS Y PARADAS DE PORTERÍA DE LA TEMPORADA — ${activeTeamGk ? `#${activeTeamGk.number} ${activeTeamGk.name.toUpperCase()}` : selectedTeam.name.toUpperCase()}`}
                    />
                  </div>
                </div>
              )}

              {/* VISTA 2: EDICIÓN DE PLANTILLA */}
              {rightPanelTab === "roster" && (
                <form onSubmit={handleSaveTeam} className="team-editor-form">
                  <div className="form-group">
                    <label htmlFor="team-name">Nombre del Equipo</label>
                    <input
                      id="team-name"
                      type="text"
                      className="input-field"
                      placeholder="Ej. BM Málaga"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="team-roster-section">
                    <h4>Jugadores ({editPlayers.length})</h4>

                    {editPlayers.length === 0 ? (
                      <p className="no-players-text">
                        No hay jugadores en la plantilla. ¡Añade el primero abajo!
                      </p>
                    ) : (
                      <div className="roster-table">
                        <div className="roster-header">
                          <span className="col-num">#</span>
                          <span className="col-name" style={{ width: "50%" }}>Nombre</span>
                          <span className="col-role" style={{ width: "30%", textAlign: "center" }}>Rol</span>
                          <span className="col-action"></span>
                        </div>
                        <div className="roster-rows">
                          {editPlayers.map((player, index) => {
                            const isGk = player.is_goalkeeper === true || player.is_goalkeeper === "true";
                            return (
                              <div key={index} className="roster-row">
                                <span className="col-num">{player.number}</span>
                                <span className="col-name" style={{ width: "50%" }}>{player.name}</span>
                                <span
                                  className="col-role"
                                  style={{
                                    width: "30%",
                                    textAlign: "center",
                                    cursor: "pointer",
                                    userSelect: "none"
                                  }}
                                  onClick={() => handleToggleGoalkeeper(index)}
                                  title="Haz clic para cambiar rol"
                                >
                                  {isGk ? "Portero" : "Jugador"}
                                </span>
                                <button
                                  type="button"
                                  className="btn-remove-player"
                                  onClick={() => handleRemovePlayer(index)}
                                  title="Eliminar de la plantilla"
                                >
                                  ✕
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* FORMULARIO AGREGAR JUGADOR */}
                    <div className="add-player-form-inline">
                      <input
                        type="number"
                        className="input-field player-num-input"
                        placeholder="Dorsal"
                        min="0"
                        max="99"
                        value={newPlayerNumber}
                        onChange={(e) => setNewPlayerNumber(e.target.value)}
                      />
                      <input
                        type="text"
                        className="input-field player-name-input"
                        placeholder="Nombre del jugador"
                        value={newPlayerName}
                        onChange={(e) => setNewPlayerName(e.target.value)}
                      />
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={handleAddPlayer}
                      >
                        Añadir
                      </button>
                    </div>
                  </div>

                  <div className="editor-actions">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        setSelectedTeam(null);
                        setIsCreating(false);
                      }}
                    >
                      Cancelar
                    </button>
                    <button type="submit" className="btn btn-primary" style={{ display: "inline-flex", alignItems: "center" }}>
                      <IconSave />
                      <span>Guardar Equipo</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : isCreating ? (
            <div className="team-editor-card">
              <h3 style={{ display: "flex", alignItems: "center" }}>
                <IconPlus /><span>Crear Nuevo Equipo</span>
              </h3>

              <form onSubmit={handleSaveTeam} className="team-editor-form">
                <div className="form-group">
                  <label htmlFor="team-name-create">Nombre del Equipo</label>
                  <input
                    id="team-name-create"
                    type="text"
                    className="input-field"
                    placeholder="Ej. BM Málaga"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                  />
                </div>

                <div className="team-roster-section">
                  <h4>Jugadores ({editPlayers.length})</h4>

                  {editPlayers.length === 0 ? (
                    <p className="no-players-text">
                      No hay jugadores en la plantilla. ¡Añade el primero abajo!
                    </p>
                  ) : (
                    <div className="roster-table">
                      <div className="roster-header">
                        <span className="col-num">#</span>
                        <span className="col-name" style={{ width: "50%" }}>Nombre</span>
                        <span className="col-role" style={{ width: "30%", textAlign: "center" }}>Rol</span>
                        <span className="col-action"></span>
                      </div>
                      <div className="roster-rows">
                        {editPlayers.map((player, index) => {
                          const isGk = player.is_goalkeeper === true || player.is_goalkeeper === "true";
                          return (
                            <div key={index} className="roster-row">
                              <span className="col-num">{player.number}</span>
                              <span className="col-name" style={{ width: "50%" }}>{player.name}</span>
                              <span
                                className="col-role"
                                style={{
                                  width: "30%",
                                  textAlign: "center",
                                  cursor: "pointer",
                                  userSelect: "none"
                                }}
                                onClick={() => handleToggleGoalkeeper(index)}
                                title="Haz clic para cambiar rol"
                              >
                                {isGk ? "Portero" : "Jugador"}
                              </span>
                              <button
                                type="button"
                                className="btn-remove-player"
                                onClick={() => handleRemovePlayer(index)}
                                title="Eliminar de la plantilla"
                              >
                                ✕
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* FORMULARIO AGREGAR JUGADOR */}
                  <div className="add-player-form-inline">
                    <input
                      type="number"
                      className="input-field player-num-input"
                      placeholder="Dorsal"
                      min="0"
                      max="99"
                      value={newPlayerNumber}
                      onChange={(e) => setNewPlayerNumber(e.target.value)}
                    />
                    <input
                      type="text"
                      className="input-field player-name-input"
                      placeholder="Nombre del jugador"
                      value={newPlayerName}
                      onChange={(e) => setNewPlayerName(e.target.value)}
                    />
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={handleAddPlayer}
                    >
                      Añadir
                    </button>
                  </div>
                </div>

                <div className="editor-actions">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setSelectedTeam(null);
                      setIsCreating(false);
                    }}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ display: "inline-flex", alignItems: "center" }}>
                    <IconSave />
                    <span>Guardar Equipo</span>
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="editor-placeholder">
              <IconHandball />
              <h3>Gestión de Equipos & Dashboard Global</h3>
              <p>Selecciona un equipo de la lista para ver su Dashboard de Rendimiento Acumulado o editar su plantilla.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
