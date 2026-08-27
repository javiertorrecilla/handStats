import { useState, useEffect, useMemo, useRef } from "react";

const IconUploadCloud = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
    <path d="M12 12v9" />
    <path d="m16 16-4-4-4 4" />
  </svg>
);
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
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ width: 44, height: 44, color: "var(--brand-primary)", marginBottom: 8 }}>
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

const IconArrowLeft = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ width: 18, height: 18, transition: "transform 0.2s ease" }}>
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

export default function TeamsPage({ user, matchesList = [] }) {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Estado para el equipo seleccionado / creación
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [rightPanelTab, setRightPanelTab] = useState("stats"); // "stats" | "roster"
  const [playerTableFilter, setPlayerTableFilter] = useState("all"); // "all" | "field" | "goalkeepers"
  const [playerSortConfig, setPlayerSortConfig] = useState({ key: "number", direction: "asc" });
  const [selectedTeamGkNumber, setSelectedTeamGkNumber] = useState("all");
  const [editName, setEditName] = useState("");
  const [editLogoUrl, setEditLogoUrl] = useState("");
  const [editPlayers, setEditPlayers] = useState([]);

  // Estado y Ref para la zona Drag & Drop del escudo del equipo
  const [isDraggingLogo, setIsDraggingLogo] = useState(false);
  const logoInputRef = useRef(null);

  const processLogoFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Por favor, selecciona un archivo de imagen válido (PNG, JPG, SVG, WebP).");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setEditLogoUrl(e.target.result);
    };
    reader.readAsDataURL(file);
  };

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
    setPlayerTableFilter("all");
    setRightPanelTab("stats");
    setEditName(team.name);
    setEditLogoUrl(team.logo_url || "");
    setEditPlayers([...(team.players || [])]);
    setNewPlayerName("");
    setNewPlayerNumber("");
  };

  // Volver al catálogo de equipos
  const handleBackToList = () => {
    setSelectedTeam(null);
    setIsCreating(false);
  };

  // Al hacer clic en crear equipo
  const handleStartCreate = () => {
    setSelectedTeam(null);
    setIsCreating(true);
    setSelectedTeamGkNumber("all");
    setPlayerTableFilter("all");
    setRightPanelTab("roster");
    setEditName("");
    setEditLogoUrl("");
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
          logo_url: editLogoUrl || null,
          players: editPlayers,
        });
        alert("Equipo creado correctamente.");
        setSelectedTeam(null);
        setIsCreating(false);
      } else if (selectedTeam) {
        await userService.updateSavedTeam(user._id, selectedTeam.name, {
          name: editName.trim(),
          logo_url: editLogoUrl || null,
          players: editPlayers,
        });
        alert("Equipo y escudo actualizados correctamente.");
        setSelectedTeam((prev) => ({
          ...prev,
          name: editName.trim(),
          logo_url: editLogoUrl || null,
          players: editPlayers,
        }));
        setRightPanelTab("stats");
      }
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

  // CÁLCULO DE ESTADÍSTICAS ACUMULADAS DEL EQUIPO SELECCIONADO
  const cumulativeStats = useMemo(() => {
    if (!selectedTeam?.name) return null;
    return calculateTeamCumulativeStats(selectedTeam.name, matchesList);
  }, [selectedTeam?.name, matchesList]);

  // ORDENACIÓN Y FILTRADO DE LA TABLA DE JUGADORES (POR DEFECTO POR DORSAL/NÚMERO)
  const handlePlayerSort = (key) => {
    setPlayerSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { key, direction: key === "number" || key === "name" || key === "role" ? "asc" : "desc" };
    });
  };

  const renderSortIndicator = (key) => {
    if (playerSortConfig.key !== key) {
      return <span style={{ opacity: 0.35, marginLeft: "4px", fontSize: "0.7rem" }}>↕</span>;
    }
    return (
      <span style={{ marginLeft: "4px", fontSize: "0.72rem", color: "var(--brand-primary)" }}>
        {playerSortConfig.direction === "asc" ? "▲" : "▼"}
      </span>
    );
  };

  const sortedPlayerStats = useMemo(() => {
    if (!cumulativeStats?.playerStats) return [];

    const filtered = cumulativeStats.playerStats.filter((p) => {
      const isGk = p.is_goalkeeper === true || p.is_goalkeeper === "true";
      if (playerTableFilter === "field") return !isGk;
      if (playerTableFilter === "goalkeepers") return isGk;
      return true;
    });

    return [...filtered].sort((a, b) => {
      let aVal, bVal;

      switch (playerSortConfig.key) {
        case "number":
          aVal = Number(a.number) || 0;
          bVal = Number(b.number) || 0;
          break;
        case "name":
          aVal = (a.name || "").toString().toLowerCase();
          bVal = (b.name || "").toString().toLowerCase();
          return playerSortConfig.direction === "asc"
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        case "role":
          aVal = (a.is_goalkeeper === true || a.is_goalkeeper === "true") ? 1 : 0;
          bVal = (b.is_goalkeeper === true || b.is_goalkeeper === "true") ? 1 : 0;
          break;
        case "matchesPlayed":
          aVal = Number(a.matchesPlayed) || 0;
          bVal = Number(b.matchesPlayed) || 0;
          break;
        case "shotsCount":
          aVal = Number(a.shotsCount) || 0;
          bVal = Number(b.shotsCount) || 0;
          break;
        case "goals":
          aVal = Number(a.goals) || 0;
          bVal = Number(b.goals) || 0;
          break;
        case "efficiency":
          aVal = Number(a.efficiency) || 0;
          bVal = Number(b.efficiency) || 0;
          break;
        case "xg":
          aVal = parseFloat(a.xg) || 0;
          bVal = parseFloat(b.xg) || 0;
          break;
        case "turnovers":
          aVal = Number(a.turnovers) || 0;
          bVal = Number(b.turnovers) || 0;
          break;
        case "saves":
          aVal = Number(a.saves) || 0;
          bVal = Number(b.saves) || 0;
          break;
        case "shotsFaced":
          aVal = Number(a.shotsFaced) || 0;
          bVal = Number(b.shotsFaced) || 0;
          break;
        case "savePct":
          aVal = Number(a.savePct) || 0;
          bVal = Number(b.savePct) || 0;
          break;
        case "goalkeeperXSaves":
          aVal = parseFloat(a.goalkeeperXSaves) || 0;
          bVal = parseFloat(b.goalkeeperXSaves) || 0;
          break;
        case "avgRating":
          aVal = parseFloat(a.avgRating) || 0;
          bVal = parseFloat(b.avgRating) || 0;
          break;
        default:
          aVal = Number(a[playerSortConfig.key]) || 0;
          bVal = Number(b[playerSortConfig.key]) || 0;
      }

      if (aVal < bVal) return playerSortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return playerSortConfig.direction === "asc" ? 1 : -1;

      // Tiebreaker: dorsal / number ascending
      return (Number(a.number) || 0) - (Number(b.number) || 0);
    });
  }, [cumulativeStats, playerTableFilter, playerSortConfig]);

  const filteredTeams = teams.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Porteros del equipo para el filtro de mapas
  const teamGoalkeepers = useMemo(() => {
    if (!cumulativeStats?.playerStats) return [];
    return cumulativeStats.playerStats.filter((p) => p.is_goalkeeper === true);
  }, [cumulativeStats]);

  const activeTeamGk = selectedTeamGkNumber !== "all"
    ? teamGoalkeepers.find((gk) => String(gk.number) === String(selectedTeamGkNumber))
    : null;

  return (
    <div className="teams-page">
      {/* VISTA 1: CATÁLOGO / LISTADO PRINCIPAL DE EQUIPOS */}
      {!selectedTeam && !isCreating ? (
        <div>
          <div className="teams-header">
            <div>
              <h2 style={{ display: "flex", alignItems: "center" }}>
                <IconTeams />
                <span>Gestión y Estadísticas de Equipos</span>
              </h2>
              <p className="teams-subtitle">
                Selecciona un equipo para ver su Dashboard de Rendimiento Acumulado a pantalla completa o gestionar su plantilla.
              </p>
            </div>
            <button className="btn btn-primary" onClick={handleStartCreate} style={{ display: "inline-flex", alignItems: "center" }}>
              <IconPlus />
              <span>Nuevo Equipo</span>
            </button>
          </div>

          <div style={{ marginBottom: "var(--space-20)", maxWidth: "420px" }}>
            <input
              type="text"
              className="input-field"
              placeholder="Buscar equipo por nombre..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="teams-loading">Cargando equipos...</div>
          ) : filteredTeams.length === 0 ? (
            <div className="teams-empty-state">
              <IconShieldSvg />
              <p style={{ fontSize: "var(--text-sm)", margin: "8px 0" }}>No se encontraron equipos creados.</p>
              <button className="btn btn-primary btn-sm" onClick={handleStartCreate} style={{ marginTop: "12px" }}>
                <IconPlus /> Crear el Primer Equipo
              </button>
            </div>
          ) : (
            <div className="teams-gallery-grid">
              {filteredTeams.map((team, idx) => {
                const teamMatchesCount = matchesList.filter((m) => {
                  const h = (m.home_team || "").trim().toLowerCase();
                  const a = (m.away_team || "").trim().toLowerCase();
                  const name = team.name.trim().toLowerCase();
                  return h === name || a === name;
                }).length;

                return (
                  <div
                    key={idx}
                    className="teams-gallery-card"
                    onClick={() => handleSelectTeam(team)}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        {team.logo_url ? (
                          <div style={{ width: 44, height: 44, borderRadius: 8, background: "rgba(0, 0, 0, 0.3)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0, border: "1px solid var(--border-color)" }}>
                            <img src={team.logo_url} alt={team.name} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                          </div>
                        ) : (
                          <IconHandball />
                        )}
                        <div>
                          <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 800 }}>{team.name}</h3>
                          <span style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
                            {team.players?.length || 0} Jugadores en plantilla
                          </span>
                        </div>
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

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "var(--space-12)", borderTop: "1px solid var(--border-color)", gap: "8px" }}>
                      <span style={{ fontSize: "var(--text-xs)", color: "var(--brand-primary)", fontWeight: 700 }}>
                        {teamMatchesCount} Partidos
                      </span>
                      <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>

                        <button className="btn btn-sm btn-ghost" style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--brand-primary)" }}>
                          Ver →
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* VISTA 2: DASHBOARD DE RENDIMIENTO O EDITOR DE PLANTILLA (A PANTALLA COMPLETA) */
        <div className="team-editor-card" style={{ width: "100%" }}>
          {/* BARRA SUPERIOR HERO DE NAVEGACIÓN Y ACCIÓN */}
          <div className="team-detail-hero">
            <div className="team-hero-info">
              <button
                type="button"
                className="btn-icon-back"
                onClick={handleBackToList}
                title="Volver a Equipos"
              >
                <IconArrowLeft />
              </button>
              <div
                className="team-hero-badge"
                onClick={() => setRightPanelTab("roster")}
                title="Haz clic para editar el escudo y datos del equipo"
                style={{ overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
              >
                {editLogoUrl ? (
                  <img src={editLogoUrl} alt={editName} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                ) : isCreating ? (
                  "+"
                ) : (
                  (selectedTeam?.name || "E").charAt(0).toUpperCase()
                )}
              </div>
              <div className="team-hero-title-group">
                <h3>{isCreating ? "Crear Nuevo Equipo" : selectedTeam.name}</h3>
                {!isCreating && (
                  <div className="team-hero-stats-pill">
                    <span>{cumulativeStats?.totalMatches || 0} Partidos Analizados</span>
                    {cumulativeStats && (
                      <span>• {cumulativeStats.wins}V - {cumulativeStats.draws}E - {cumulativeStats.losses}D</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {!isCreating && (
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
            )}
          </div>

          {/* SUB-VISTA 1: DASHBOARD GLOBAL DE RENDIMIENTO A PANTALLA COMPLETA */}
          {selectedTeam && !isCreating && rightPanelTab === "stats" && cumulativeStats && (
            <div className="team-stats-dashboard" style={{ display: "flex", flexDirection: "column", gap: "var(--space-32)" }}>
              {/* TARJETAS KPI DE RENDIMIENTO ACUMULADO */}
              <div className="hs-grid hs-grid-4">
                <KPICard title="PARTIDOS JUGADOS" value={cumulativeStats.totalMatches} subtitle={`${cumulativeStats.wins}V - ${cumulativeStats.draws}E - ${cumulativeStats.losses}D`} />
                <KPICard title="GOLES A FAVOR / CONTRA" value={`${cumulativeStats.goalsFor} / ${cumulativeStats.goalsAgainst}`} subtitle={`Media: ${cumulativeStats.avgGoalsFor} - ${cumulativeStats.avgGoalsAgainst}`} />
                <KPICard title="xG Y xGA ACUMULADO" value={`${cumulativeStats.totalXG} vs ${cumulativeStats.totalXGA}`} subtitle={`Dif: ${(cumulativeStats.totalXG - cumulativeStats.totalXGA).toFixed(2)}`} />
                <KPICard title="EFICACIA OFENSIVA" value={`${cumulativeStats.avgOffEfficiency}%`} subtitle={`Eficacia tiro: ${cumulativeStats.shotEfficiency}%`} />
                <KPICard title="PARADAS Y EFICACIA PORTERÍA" value={`${cumulativeStats.totalSaves}/${cumulativeStats.totalShotsFaced}`} subtitle={`${cumulativeStats.savePct}% Paradas`} />
                <KPICard title="PÉRDIDAS TOTALES" value={cumulativeStats.totalTurnovers} subtitle={`Media: ${cumulativeStats.avgTurnovers} por partido`} />
                <KPICard title="DURACIÓN MEDIA POSESIÓN" value={`${cumulativeStats.avgPossessionDuration}s`} subtitle={`Media: ${cumulativeStats.avgPossessionsPerMatch} pos. / partido`} />
                <KPICard title="EFICACIA DEFENSIVA" value={`${cumulativeStats.avgDefEfficiency}%`} subtitle="Basada en goles encajados/posesión" />
              </div>

              {/* ESTADÍSTICAS ACUMULADAS DE LA PLANTILLA EN LA TEMPORADA */}
              <div className="hs-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-12)", flexWrap: "wrap", gap: "8px" }}>
                  <h4 className="hs-card-title" style={{ margin: 0 }}>
                    <IconUsers size={15} /> RENDIMIENTO ACUMULADO DE LA PLANTILLA
                  </h4>
                  <div style={{ display: "flex", gap: "4px", background: "var(--bg-inset)", padding: "3px", borderRadius: "var(--radius)", border: "1px solid var(--border-color)" }}>
                    <button
                      type="button"
                      className={`btn btn-sm ${playerTableFilter === "all" ? "btn-primary" : "btn-ghost"}`}
                      onClick={() => setPlayerTableFilter("all")}
                      style={{ fontSize: "0.72rem", padding: "3px 8px" }}
                    >
                      Resumen ({cumulativeStats.playerStats.length})
                    </button>
                    <button
                      type="button"
                      className={`btn btn-sm ${playerTableFilter === "field" ? "btn-primary" : "btn-ghost"}`}
                      onClick={() => setPlayerTableFilter("field")}
                      style={{ fontSize: "0.72rem", padding: "3px 8px" }}
                    >
                      Jugadores Campo ({cumulativeStats.playerStats.filter(p => !p.is_goalkeeper).length})
                    </button>
                    <button
                      type="button"
                      className={`btn btn-sm ${playerTableFilter === "goalkeepers" ? "btn-primary" : "btn-ghost"}`}
                      onClick={() => setPlayerTableFilter("goalkeepers")}
                      style={{ fontSize: "0.72rem", padding: "3px 8px" }}
                    >
                      Porteros ({cumulativeStats.playerStats.filter(p => p.is_goalkeeper === true || p.is_goalkeeper === "true").length})
                    </button>
                  </div>
                </div>

                {cumulativeStats.playerStats.length === 0 ? (
                  <p style={{ color: "var(--text-muted)", fontSize: "var(--text-xs)", margin: 0 }}>
                    No hay estadísticas de jugadores acumuladas todavía.
                  </p>
                ) : (
                  <div className="hs-table-container" style={{ overflowX: "hidden" }}>
                    <table className="hs-data-table hs-table-compact" style={{ width: "100%", tableLayout: "auto" }}>
                      <thead>
                        {playerTableFilter === "field" ? (
                          <tr>
                            <th onClick={() => handlePlayerSort("number")} style={{ textAlign: "center", padding: "8px 4px", cursor: "pointer", userSelect: "none" }} title="Ordenar por número">#{renderSortIndicator("number")}</th>
                            <th onClick={() => handlePlayerSort("name")} style={{ padding: "8px 6px", cursor: "pointer", userSelect: "none" }} title="Ordenar por jugador">Jugador{renderSortIndicator("name")}</th>
                            <th onClick={() => handlePlayerSort("matchesPlayed")} style={{ textAlign: "center", padding: "8px 4px", cursor: "pointer", userSelect: "none" }} title="Ordenar por partidos jugados">PJ{renderSortIndicator("matchesPlayed")}</th>
                            <th onClick={() => handlePlayerSort("shotsCount")} style={{ textAlign: "center", padding: "8px 4px", cursor: "pointer", userSelect: "none" }} title="Ordenar por tiros a campo">Tiros Campo{renderSortIndicator("shotsCount")}</th>
                            <th onClick={() => handlePlayerSort("goals")} style={{ textAlign: "center", padding: "8px 4px", cursor: "pointer", userSelect: "none" }} title="Ordenar por goles">Goles{renderSortIndicator("goals")}</th>
                            <th onClick={() => handlePlayerSort("efficiency")} style={{ textAlign: "center", padding: "8px 4px", cursor: "pointer", userSelect: "none" }} title="Ordenar por eficacia">% Efic.{renderSortIndicator("efficiency")}</th>
                            <th onClick={() => handlePlayerSort("xg")} style={{ textAlign: "center", padding: "8px 4px", cursor: "pointer", userSelect: "none" }} title="Ordenar por xG">xG{renderSortIndicator("xg")}</th>
                            <th onClick={() => handlePlayerSort("turnovers")} style={{ textAlign: "center", padding: "8px 4px", cursor: "pointer", userSelect: "none" }} title="Ordenar por pérdidas">Pérdidas{renderSortIndicator("turnovers")}</th>
                            <th onClick={() => handlePlayerSort("avgRating")} style={{ textAlign: "center", padding: "8px 4px", cursor: "pointer", userSelect: "none" }} title="Ordenar por rating">Rating{renderSortIndicator("avgRating")}</th>
                          </tr>
                        ) : playerTableFilter === "goalkeepers" ? (
                          <tr>
                            <th onClick={() => handlePlayerSort("number")} style={{ textAlign: "center", padding: "8px 4px", cursor: "pointer", userSelect: "none" }} title="Ordenar por número">#{renderSortIndicator("number")}</th>
                            <th onClick={() => handlePlayerSort("name")} style={{ padding: "8px 6px", cursor: "pointer", userSelect: "none" }} title="Ordenar por portero">Portero{renderSortIndicator("name")}</th>
                            <th onClick={() => handlePlayerSort("matchesPlayed")} style={{ textAlign: "center", padding: "8px 4px", cursor: "pointer", userSelect: "none" }} title="Ordenar por partidos jugados">PJ{renderSortIndicator("matchesPlayed")}</th>
                            <th onClick={() => handlePlayerSort("saves")} style={{ textAlign: "center", padding: "8px 4px", cursor: "pointer", userSelect: "none" }} title="Ordenar por paradas">Paradas / Rec.{renderSortIndicator("saves")}</th>
                            <th onClick={() => handlePlayerSort("savePct")} style={{ textAlign: "center", padding: "8px 4px", cursor: "pointer", userSelect: "none" }} title="Ordenar por % de paradas">% Paradas{renderSortIndicator("savePct")}</th>
                            <th onClick={() => handlePlayerSort("goalkeeperXSaves")} style={{ textAlign: "center", padding: "8px 4px", cursor: "pointer", userSelect: "none" }} title="Ordenar por xSaves">xSaves{renderSortIndicator("goalkeeperXSaves")}</th>
                            <th onClick={() => handlePlayerSort("goals")} style={{ textAlign: "center", padding: "8px 4px", cursor: "pointer", userSelect: "none" }} title="Ordenar por goles">Goles{renderSortIndicator("goals")}</th>
                            <th onClick={() => handlePlayerSort("avgRating")} style={{ textAlign: "center", padding: "8px 4px", cursor: "pointer", userSelect: "none" }} title="Ordenar por rating">Rating{renderSortIndicator("avgRating")}</th>
                          </tr>
                        ) : (
                          <tr>
                            <th onClick={() => handlePlayerSort("number")} style={{ textAlign: "center", padding: "8px 4px", cursor: "pointer", userSelect: "none" }} title="Ordenar por número">#{renderSortIndicator("number")}</th>
                            <th onClick={() => handlePlayerSort("name")} style={{ padding: "8px 6px", cursor: "pointer", userSelect: "none" }} title="Ordenar por jugador">Jugador{renderSortIndicator("name")}</th>
                            <th onClick={() => handlePlayerSort("role")} style={{ textAlign: "center", padding: "8px 4px", cursor: "pointer", userSelect: "none" }} title="Ordenar por rol">Rol{renderSortIndicator("role")}</th>
                            <th onClick={() => handlePlayerSort("matchesPlayed")} style={{ textAlign: "center", padding: "8px 4px", cursor: "pointer", userSelect: "none" }} title="Ordenar por partidos jugados">PJ{renderSortIndicator("matchesPlayed")}</th>
                            <th onClick={() => handlePlayerSort("goals")} style={{ textAlign: "center", padding: "8px 4px", cursor: "pointer", userSelect: "none" }} title="Ordenar por goles">Goles / Tiros{renderSortIndicator("goals")}</th>
                            <th onClick={() => handlePlayerSort("efficiency")} style={{ textAlign: "center", padding: "8px 4px", cursor: "pointer", userSelect: "none" }} title="Ordenar por eficacia">% Efic.{renderSortIndicator("efficiency")}</th>
                            <th onClick={() => handlePlayerSort("saves")} style={{ textAlign: "center", padding: "8px 4px", cursor: "pointer", userSelect: "none" }} title="Ordenar por paradas">Paradas{renderSortIndicator("saves")}</th>
                            <th onClick={() => handlePlayerSort("savePct")} style={{ textAlign: "center", padding: "8px 4px", cursor: "pointer", userSelect: "none" }} title="Ordenar por % de paradas">% Par.{renderSortIndicator("savePct")}</th>
                            <th onClick={() => handlePlayerSort("avgRating")} style={{ textAlign: "center", padding: "8px 4px", cursor: "pointer", userSelect: "none" }} title="Ordenar por rating">Rating{renderSortIndicator("avgRating")}</th>
                          </tr>
                        )}
                      </thead>
                      <tbody>
                        {sortedPlayerStats.map((p, idx) => {
                          const isGk = p.is_goalkeeper === true || p.is_goalkeeper === "true";
                          return (
                            <tr key={idx} style={{ background: isGk ? "rgba(16, 185, 129, 0.04)" : "transparent" }}>
                              <td style={{ textAlign: "center", padding: "6px 4px" }}><strong>#{p.number}</strong></td>
                              <td style={{ padding: "6px 6px", whiteSpace: "nowrap" }}>
                                <strong>{p.name}</strong>
                              </td>

                              {playerTableFilter === "field" ? (
                                <>
                                  <td style={{ textAlign: "center", padding: "6px 4px" }}>{p.matchesPlayed}</td>
                                  <td style={{ textAlign: "center", padding: "6px 4px" }}>{p.shotsCount}</td>
                                  <td style={{ textAlign: "center", padding: "6px 4px" }}><strong>{p.goals}</strong></td>
                                  <td style={{ textAlign: "center", padding: "6px 4px" }}>
                                    {p.shotsCount > 0 ? (
                                      <MetricBadge value={`${p.efficiency}%`} variant={p.efficiency >= 60 ? "success" : p.efficiency >= 40 ? "info" : "danger"} />
                                    ) : (
                                      <span style={{ color: "var(--text-muted)" }}>—</span>
                                    )}
                                  </td>
                                  <td style={{ textAlign: "center", padding: "6px 4px" }}>{p.shotsCount > 0 ? p.xg : "—"}</td>
                                  <td style={{ textAlign: "center", padding: "6px 4px" }}>{p.turnovers}</td>
                                  <td style={{ textAlign: "center", padding: "6px 4px" }}>
                                    <MetricBadge value={p.avgRating} variant={p.avgRating >= 7.5 ? "success" : p.avgRating >= 6.0 ? "info" : "warning"} />
                                  </td>
                                </>
                              ) : playerTableFilter === "goalkeepers" ? (
                                <>
                                  <td style={{ textAlign: "center", padding: "6px 4px" }}>{p.matchesPlayed}</td>
                                  <td style={{ textAlign: "center", padding: "6px 4px" }}><strong>{p.saves}/{p.shotsFaced}</strong></td>
                                  <td style={{ textAlign: "center", padding: "6px 4px" }}>
                                    {p.shotsFaced > 0 ? (
                                      <MetricBadge value={`${p.savePct}%`} variant={p.savePct >= 33 ? "success" : p.savePct >= 25 ? "info" : "danger"} />
                                    ) : (
                                      <span style={{ color: "var(--text-muted)" }}>—</span>
                                    )}
                                  </td>
                                  <td style={{ textAlign: "center", padding: "6px 4px" }}>{p.shotsFaced > 0 ? p.goalkeeperXSaves : "—"}</td>
                                  <td style={{ textAlign: "center", padding: "6px 4px" }}>{p.goals > 0 ? <strong>{p.goals}</strong> : "0"}</td>
                                  <td style={{ textAlign: "center", padding: "6px 4px" }}>
                                    <MetricBadge value={p.avgRating} variant={p.avgRating >= 7.5 ? "success" : p.avgRating >= 6.0 ? "info" : "warning"} />
                                  </td>
                                </>
                              ) : (
                                <>
                                  <td style={{ textAlign: "center", padding: "6px 4px" }}>
                                    <span
                                      style={{
                                        fontSize: "0.68rem",
                                        fontWeight: 800,
                                        padding: "1px 6px",
                                        borderRadius: "var(--radius-full)",
                                        background: isGk ? "var(--color-primary-subtle)" : "var(--bg-inset)",
                                        color: isGk ? "var(--brand-primary)" : "var(--text-muted)",
                                        border: `1px solid ${isGk ? "rgba(16, 185, 129, 0.25)" : "var(--border-color)"}`
                                      }}
                                    >
                                      {isGk ? "Portero" : "Jugador"}
                                    </span>
                                  </td>
                                  <td style={{ textAlign: "center", padding: "6px 4px" }}>{p.matchesPlayed}</td>
                                  <td style={{ textAlign: "center", padding: "6px 4px" }}>
                                    {p.shotsCount > 0 || p.goals > 0 ? <strong>{p.goals}/{p.shotsCount}</strong> : <span style={{ color: "var(--text-muted)" }}>—</span>}
                                  </td>
                                  <td style={{ textAlign: "center", padding: "6px 4px" }}>
                                    {p.shotsCount > 0 ? (
                                      <MetricBadge value={`${p.efficiency}%`} variant={p.efficiency >= 60 ? "success" : p.efficiency >= 40 ? "info" : "danger"} />
                                    ) : (
                                      <span style={{ color: "var(--text-muted)" }}>—</span>
                                    )}
                                  </td>
                                  <td style={{ textAlign: "center", padding: "6px 4px" }}>
                                    {isGk ? <strong>{p.saves}/{p.shotsFaced}</strong> : <span style={{ color: "var(--text-muted)" }}>—</span>}
                                  </td>
                                  <td style={{ textAlign: "center", padding: "6px 4px" }}>
                                    {isGk && p.shotsFaced > 0 ? (
                                      <MetricBadge value={`${p.savePct}%`} variant={p.savePct >= 33 ? "success" : p.savePct >= 25 ? "info" : "danger"} />
                                    ) : (
                                      <span style={{ color: "var(--text-muted)" }}>—</span>
                                    )}
                                  </td>
                                  <td style={{ textAlign: "center", padding: "6px 4px" }}>
                                    <MetricBadge value={p.avgRating} variant={p.avgRating >= 7.5 ? "success" : p.avgRating >= 6.0 ? "info" : "warning"} />
                                  </td>
                                </>
                              )}
                            </tr>
                          );
                        })}
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

          {/* SUB-VISTA 2: EDICIÓN DE PLANTILLA A PANTALLA COMPLETA */}
          {(isCreating || rightPanelTab === "roster") && (
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

              <div className="form-group" style={{ marginBottom: "24px" }}>
                <label className="form-label" style={{ display: "block", marginBottom: "8px", fontWeight: 700, fontSize: "var(--text-xs)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Escudo del Equipo (Foto / Imagen):
                </label>

                <div
                  className={`pdf-dropzone ${isDraggingLogo ? "dragging" : ""} ${editLogoUrl ? "success" : ""}`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDraggingLogo(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDraggingLogo(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDraggingLogo(false);
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      processLogoFile(e.dataTransfer.files[0]);
                    }
                  }}
                  onClick={() => logoInputRef.current?.click()}
                  style={{ minHeight: "86px" }}
                >
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    className="pdf-input-hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        processLogoFile(e.target.files[0]);
                      }
                    }}
                  />

                  {editLogoUrl ? (
                    <div className="pdf-status-idle" style={{ justifyContent: "space-between", width: "100%" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                        <div style={{ width: 52, height: 52, borderRadius: 10, background: "rgba(0,0,0,0.3)", border: "1px solid var(--brand-primary)", padding: 4, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
                          <img src={editLogoUrl} alt="Escudo preview" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: "var(--text-sm)", color: "var(--brand-primary)", display: "flex", alignItems: "center", gap: "6px" }}>
                            ✓ Escudo asignado correctamente
                          </div>
                          <span style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
                            Haz clic para cambiar la imagen o arrastra un nuevo archivo
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="btn btn-sm btn-ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditLogoUrl("");
                        }}
                        style={{ color: "var(--color-danger)", fontSize: "11px", fontWeight: 700 }}
                      >
                        Quitar Foto
                      </button>
                    </div>
                  ) : (
                    <div className="pdf-status-idle">
                      <div className="pdf-upload-icon-container">
                        <IconUploadCloud />
                      </div>
                      <div className="pdf-dropzone-text">
                        <p style={{ margin: 0, fontWeight: 700, fontSize: "var(--text-sm)", color: "var(--text-primary)" }}>
                          Arrastra aquí la foto o escudo del equipo, o <span style={{ color: "var(--brand-primary)", textDecoration: "underline" }}>examina tus archivos</span>
                        </p>
                        <span style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", marginTop: "2px", display: "block" }}>
                          Admite cualquier formato de imagen (PNG, JPG, SVG, WebP). También se extraerá automáticamente al subir un acta PDF.
                        </span>
                      </div>
                    </div>
                  )}
                </div>
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
                            <span className="col-num">#{player.number}</span>
                            <span className="col-name" style={{ width: "50%" }}>{player.name}</span>
                            <span className="col-role" style={{ width: "30%", textAlign: "center" }}>
                              <button
                                type="button"
                                className={`role-badge-btn ${isGk ? "gk" : "field"}`}
                                onClick={() => handleToggleGoalkeeper(index)}
                              >
                                {isGk ? "Portero" : "Jugador"}
                              </button>
                            </span>
                            <span className="col-action">
                              <button
                                type="button"
                                className="btn-remove-player"
                                onClick={() => handleRemovePlayer(index)}
                                title="Eliminar"
                              >
                                &times;
                              </button>
                            </span>
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
                  onClick={handleBackToList}
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
      )}
    </div>
  );
}
