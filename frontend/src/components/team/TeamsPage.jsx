import { useState, useEffect } from "react";
import userService from "../../services/userService";
import "./TeamsPage.css";

const IconTeams = () => (
  <svg className="page-header-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ marginRight: 8, width: 22, height: 22, display: "inline-block", verticalAlign: "middle" }}>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const IconShield = () => (
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

const IconEdit = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ marginRight: 8, width: 18, height: 18, verticalAlign: "middle", display: "inline-block" }}>
    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
  </svg>
);

export default function TeamsPage({ user }) {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Estado para la edición / creación
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
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

  // Al seleccionar un equipo para editar
  const handleSelectTeam = (team) => {
    setIsCreating(false);
    setSelectedTeam(team);
    setEditName(team.name);
    setEditPlayers([...(team.players || [])]);
    setNewPlayerName("");
    setNewPlayerNumber("");
  };

  // Al hacer clic en crear equipo
  const handleStartCreate = () => {
    setSelectedTeam(null);
    setIsCreating(true);
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
    // Evitar dorsales duplicados en el mismo equipo temporal
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

  // Eliminar jugador de la lista temporal
  const handleRemovePlayer = (index) => {
    setEditPlayers((prev) => prev.filter((_, i) => i !== index));
  };

  // Guardar cambios (crear o actualizar)
  const handleSaveTeam = async (e) => {
    e.preventDefault();
    if (!editName.trim()) {
      alert("El nombre del equipo no puede estar vacío.");
      return;
    }

    try {
      if (isCreating) {
        // Comprobar si ya existe uno con ese nombre
        if (
          teams.some(
            (t) => t.name.toLowerCase() === editName.trim().toLowerCase()
          )
        ) {
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
      // Limpiar y recargar
      setSelectedTeam(null);
      setIsCreating(false);
      loadTeams();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || "Error al guardar el equipo.");
    }
  };

  // Eliminar equipo
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

  // Equipos filtrados por búsqueda
  const filteredTeams = teams.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="teams-page">
      <div className="teams-header">
        <div>
          <h2 style={{ display: "flex", alignItems: "center" }}>
            <IconTeams />
            <span>Gestión de Equipos</span>
          </h2>
          <p className="teams-subtitle">
            Crea y edita tus plantillas de jugadores para usarlas rápidamente en tus partidos.
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleStartCreate} style={{ display: "inline-flex", alignItems: "center" }}>
          <IconPlus />
          <span>Nuevo Equipo</span>
        </button>
      </div>

      <div className="teams-layout">
        {/* COLUMNA IZQUIERDA: LISTADO */}
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
              <IconShield />
              <p>No se encontraron equipos.</p>
            </div>
          ) : (
            <div className="teams-grid">
              {filteredTeams.map((team, idx) => (
                <div
                  key={idx}
                  className={`team-card ${
                    selectedTeam?.name === team.name ? "active" : ""
                  }`}
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

        {/* COLUMNA DERECHA: EDITOR / DETALLE */}
        <div className="teams-editor-column">
          {selectedTeam || isCreating ? (
            <div className="team-editor-card">
              <h3 style={{ display: "flex", alignItems: "center" }}>
                {isCreating ? <><IconPlus /><span>Crear Nuevo Equipo</span></> : <><IconEdit /><span>Editar Equipo</span></>}
              </h3>

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
            </div>
          ) : (
            <div className="editor-placeholder">
              <IconHandball />
              <h3>Gestión de Plantillas</h3>
              <p>Selecciona un equipo de la lista o crea uno nuevo para empezar a editar sus jugadores.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
