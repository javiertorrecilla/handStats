import { useState, useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";

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

const IconArrowRight = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ width: 14, height: 14 }}>
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const IconSearch = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const IconEdit = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
  </svg>
);

const IconX = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const IconCheck = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const IconInfoCircle = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

const IconChevronDown = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const IconUpload = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ display: "inline-block", verticalAlign: "middle" }}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

function getTeamBadgeText(name = "") {
  if (!name) return "HS";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].slice(0, 5).toUpperCase();
  }
  if (parts[0].length >= 3 && parts[0].length <= 6) {
    return parts[0].toUpperCase();
  }
  if (parts.length >= 2 && parts[0].length <= 2 && parts[1].length >= 3 && parts[1].length <= 6) {
    return parts[1].toUpperCase();
  }
  return parts.slice(0, 3).map((w) => w[0]).join("").toUpperCase();
}

/**
 * Escala técnica para el porcentaje de paradas de porteros en balonmano:
 * - Menos de 25% (< 25): Rojo (danger)
 * - Entre 25% y 34.9% [25, 35): Ámbar/Naranja (warning)
 * - Entre 35% y 39.9% [35, 40): Verde Lima Claro #A3E635 / #65A30D (accent)
 * - 40% o más (>= 40): Verde principal HandStats #44D878 / #15803D (success)
 */
function getGkSavePctBadge(savePct) {
  const val = Number(savePct);
  if (isNaN(val) || val < 25) {
    return { variant: "danger", className: "badge-save-tier-danger" };
  }
  if (val < 35) {
    return { variant: "warning", className: "badge-save-tier-warning" };
  }
  if (val < 40) {
    return { variant: "accent", className: "badge-save-tier-accent" };
  }
  return { variant: "success", className: "badge-save-tier-success" };
}

/**
 * Escala técnica para el porcentaje de lanzamientos / eficacia de tiro en balonmano:
 * - Menos de 50% (< 50%): Rojo
 * - 51% – 57%: Naranja
 * - 58% – 64%: Amarillo/Ámbar
 * - 65% – 75%: Verde Lima Claro #A3E635 / #65A30D
 * - > 75%: Verde principal HandStats #44D878 / #15803D
 */
function getShotEffBadge(efficiency) {
  const val = Number(efficiency);
  if (isNaN(val) || val < 50.5) {
    return { variant: "danger", className: "badge-shot-tier-danger" };
  }
  if (val <= 57.5) {
    return { variant: "warning", className: "badge-shot-tier-orange" };
  }
  if (val <= 64.5) {
    return { variant: "warning", className: "badge-shot-tier-amber" };
  }
  if (val <= 75.5) {
    return { variant: "accent", className: "badge-shot-tier-light-green" };
  }
  return { variant: "success", className: "badge-shot-tier-success" };
}

/**
 * Escala técnica para el rating de jugadores (0 a 10):
 * - < 5: Rojo (badge-rating-tier-danger)
 * - 5 a < 6: Naranja (badge-rating-tier-orange)
 * - 6 a < 7: Amarillo (badge-rating-tier-amber)
 * - 7 a < 8: Verde lima #A3E635 / #65A30D (badge-rating-tier-lime)
 * - 8 a < 9: Verde HandStats #44D878 / #15803D (badge-rating-tier-success)
 * - 9 a 10: Púrpura MVP #A855F7 / #7E22CE (badge-rating-tier-mvp)
 */
function getRatingBadge(rating) {
  const val = parseFloat(rating);
  if (isNaN(val) || val < 5.0) {
    return { variant: "danger", className: "badge-rating-tier-danger" };
  }
  if (val < 6.0) {
    return { variant: "orange", className: "badge-rating-tier-orange" };
  }
  if (val < 7.0) {
    return { variant: "amber", className: "badge-rating-tier-amber" };
  }
  if (val < 8.0) {
    return { variant: "lime", className: "badge-rating-tier-lime" };
  }
  if (val < 9.0) {
    return { variant: "success", className: "badge-rating-tier-success" };
  }
  return { variant: "mvp", className: "badge-rating-tier-mvp" };
}

function computeTopNotableStats(team, stats, teamMatches = []) {
  if (!stats || teamMatches.length === 0) {
    const players = team.players || [];
    const gkCount = players.filter((p) => p.is_goalkeeper).length;
    const fieldCount = players.length - gkCount;
    return [
      {
        key: "roster",
        label: "PLANTILLA",
        value: `${players.length}`,
        detail: "jugadores",
        color: "#60A5FA",
      },
      {
        key: "gk",
        label: "PORTEROS",
        value: `${gkCount}`,
        detail: "en meta",
        color: "#34D399",
      },
      {
        key: "field",
        label: "JUG. CAMPO",
        value: `${fieldCount}`,
        detail: "primera/2ª línea",
        color: "#F59E0B",
      },
    ];
  }

  const candidates = [];

  // 1. Eficacia de Tiro
  const shotEff = stats.totalShots > 0 ? ((stats.goalsFor / stats.totalShots) * 100).toFixed(1) : "0.0";
  const shotEffNum = parseFloat(shotEff);
  if (stats.totalShots > 0) {
    const diff = shotEffNum - 56;
    candidates.push({
      key: "shot_eff",
      label: "EFICACIA TIRO",
      value: `${shotEff}%`,
      detail: `↑ ${stats.goalsFor}/${stats.totalShots}`,
      tone: shotEffNum > 75 ? "success" : shotEffNum >= 65 ? "accent" : shotEffNum >= 58 ? "warning" : shotEffNum >= 51 ? "warning" : "danger",
      prominence: diff > 0 ? diff * 2.2 : Math.abs(diff) * 1.0,
    });
  }

  // 2. Eficacia Portería
  const savePct = stats.totalShotsFaced > 0 ? ((stats.totalSaves / stats.totalShotsFaced) * 100).toFixed(1) : "0.0";
  const savePctNum = parseFloat(savePct);
  if (stats.totalShotsFaced > 0) {
    const diff = savePctNum - 28;
    candidates.push({
      key: "save_pct",
      label: "EFICACIA PORTERÍA",
      value: `${savePct}%`,
      detail: `${stats.totalSaves} ${stats.totalSaves === 1 ? "parada" : "paradas"}`,
      tone: savePctNum >= 40 ? "success" : savePctNum >= 35 ? "accent" : savePctNum >= 25 ? "warning" : "danger",
      prominence: diff > 0 ? diff * 3.2 : Math.abs(diff) * 0.9,
    });
  }

  // 3. Goles por Partido
  const avgGf = parseFloat(stats.avgGoalsFor) || 0;
  if (avgGf > 0) {
    const diff = avgGf - 26;
    candidates.push({
      key: "avg_goals",
      label: "GOLES / PARTIDO",
      value: `${avgGf}`,
      detail: `${stats.goalsFor} en total`,
      tone: avgGf >= 28 ? "success" : "neutral",
      prominence: Math.abs(diff) * 2.6,
    });
  }

  // 4. Contraataques / Transiciones
  const fbShots = (stats.allTeamShotsEvents || []).filter((e) => {
    const st = (e.shot_type || "").toLowerCase();
    return (
      st.includes("contraataque") ||
      st.includes("1ª") ||
      st.includes("oleada1") ||
      st.includes("transicion")
    );
  });
  const fbGoals = fbShots.filter((e) => e.result === "Gol").length;
  if (fbGoals >= 1) {
    const fbAvg = (fbGoals / stats.totalMatches).toFixed(1);
    const fbEff = fbShots.length > 0 ? Math.round((fbGoals / fbShots.length) * 100) : 0;
    candidates.push({
      key: "fast_break",
      label: "CONTRAATAQUE",
      value: `${fbGoals} goles`,
      detail: `↑ ${fbEff}% (${fbAvg}/p.)`,
      tone: "success",
      prominence: (fbGoals / stats.totalMatches) * 7.5 + (fbEff >= 70 ? 12 : 0),
    });
  }

  // 5. Eficacia 7 Metros
  const penShots = (stats.allTeamShotsEvents || []).filter((e) => {
    const st = (e.shot_type || "").toLowerCase();
    return st.includes("7m") || st.includes("penalti");
  });
  const penGoals = penShots.filter((e) => e.result === "Gol").length;
  if (penShots.length >= 2) {
    const penPct = Math.round((penGoals / penShots.length) * 100);
    candidates.push({
      key: "penalties",
      label: "EFICACIA 7M",
      value: `${penPct}%`,
      detail: `${penGoals}/${penShots.length} anotados`,
      tone: penPct >= 75 ? "success" : "warning",
      prominence: (penPct - 68) * 2.0 + penGoals * 2.2,
    });
  }

  // 6. Solidez Defensiva (Goles recibidos)
  const avgGa = parseFloat(stats.avgGoalsAgainst) || 0;
  if (avgGa > 0) {
    const diffGa = 27 - avgGa;
    if (diffGa > 0) {
      candidates.push({
        key: "defense",
        label: "DEFENSA (ENC.)",
        value: `${avgGa}`,
        detail: "goles encajados/p.",
        tone: avgGa <= 24 ? "success" : "info",
        prominence: diffGa * 4.2,
      });
    }
  }

  // 7. Recuperaciones / Robos
  const avgSteals = parseFloat(stats.avgSteals) || 0;
  if (avgSteals >= 2) {
    candidates.push({
      key: "steals",
      label: "RECUPERACIONES",
      value: `${avgSteals}`,
      detail: `${stats.totalSteals} robos totales`,
      tone: "accent",
      prominence: avgSteals * 3.8,
    });
  }

  // 8. Lanzamiento 9 Metros
  const shots9m = (stats.allTeamShotsEvents || []).filter((e) => {
    const st = (e.shot_type || "").toLowerCase();
    return st.includes("9m") || st.includes("exterior");
  });
  const goals9m = shots9m.filter((e) => e.result === "Gol").length;
  if (shots9m.length >= 3) {
    const pct9m = Math.round((goals9m / shots9m.length) * 100);
    candidates.push({
      key: "shots_9m",
      label: "LANZAMIENTO 9M",
      value: `${pct9m}%`,
      detail: `${goals9m}/${shots9m.length} goles`,
      tone: pct9m >= 50 ? "success" : "info",
      prominence: (pct9m - 40) * 2.2 + goals9m * 1.5,
    });
  }

  // 9. Clínica de Tiro / Sobre-rendimiento xG
  const totalXG = parseFloat(stats.totalXG) || 0;
  const xgDiff = stats.goalsFor - totalXG;
  if (Math.abs(xgDiff) >= 1.5) {
    candidates.push({
      key: "xg_diff",
      label: xgDiff > 0 ? "CLÍNICA TIRO" : "REND. XG",
      value: `${xgDiff > 0 ? "+" : ""}${xgDiff.toFixed(1)} xG`,
      detail: xgDiff > 0 ? "sobre lo esperado" : "bajo xG",
      tone: xgDiff > 0 ? "success" : "warning",
      prominence: Math.abs(xgDiff) * 3.6,
    });
  }

  // 10. Cuidado de Balón (Pérdidas bajas)
  const avgTo = parseFloat(stats.avgTurnovers) || 0;
  if (avgTo > 0 && avgTo <= 8) {
    candidates.push({
      key: "turnovers",
      label: "CUIDADO BALÓN",
      value: `${avgTo}`,
      detail: "pérdidas/partido",
      tone: "success",
      prominence: (9.5 - avgTo) * 3.2,
    });
  }

  // 11. Diferencial de Goles
  const goalDiff = stats.goalDiff || 0;
  if (Math.abs(goalDiff) >= 4) {
    candidates.push({
      key: "goal_diff",
      label: "DIF. GOLES",
      value: `${goalDiff > 0 ? "+" : ""}${goalDiff}`,
      detail: `${stats.goalsFor}F - ${stats.goalsAgainst}C`,
      tone: goalDiff > 0 ? "success" : "danger",
      prominence: Math.abs(goalDiff) * 1.8,
    });
  }

  // Ordenar por prominencia descendente
  candidates.sort((a, b) => b.prominence - a.prominence);

  const selected = candidates.slice(0, 3);

  // Fallbacks si hay menos de 3 métricas prominentes
  if (selected.length < 3) {
    const fallbackList = [
      {
        key: "shot_eff_fb",
        label: "EFICACIA TIRO",
        value: `${shotEff}%`,
        detail: `↑ ${stats.goalsFor}/${stats.totalShots}`,
        tone: "success",
      },
      {
        key: "save_pct_fb",
        label: "EFICACIA PORTERÍA",
        value: `${savePct}%`,
        detail: `${stats.totalSaves} paradas`,
        tone: "info",
      },
      {
        key: "avg_goals_fb",
        label: "GOLES / PARTIDO",
        value: `${avgGf}`,
        detail: `${stats.goalsFor} en total`,
        tone: "neutral",
      },
      {
        key: "total_matches_fb",
        label: "PARTIDOS JUGADOS",
        value: `${stats.totalMatches}`,
        detail: `${stats.wins}V ${stats.draws}E ${stats.losses}D`,
        tone: "success",
      },
    ];

    for (const fb of fallbackList) {
      if (selected.length >= 3) break;
      if (!selected.some((s) => s.label === fb.label)) {
        selected.push(fb);
      }
    }
  }

  return selected.slice(0, 3);
}

export default function TeamsPage({ user, matchesList = [] }) {
  const { t } = useTranslation();
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
      alert(t("teams.badge_formats"));
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setEditLogoUrl(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  // Formulario nuevo jugador y edición
  const [newPlayerName, setNewPlayerName] = useState("");
  const [newPlayerNumber, setNewPlayerNumber] = useState("");
  const [newPlayerRole, setNewPlayerRole] = useState("field"); // "field" | "gk"
  const [rosterSearch, setRosterSearch] = useState("");
  const [editingPlayerIndex, setEditingPlayerIndex] = useState(null);
  const [editingNumber, setEditingNumber] = useState("");
  const [editingName, setEditingName] = useState("");
  const [editingRole, setEditingRole] = useState("field");

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
    setNewPlayerRole("field");
    setRosterSearch("");
    setEditingPlayerIndex(null);
  };

  // Volver al catálogo de equipos
  const handleBackToList = () => {
    setSelectedTeam(null);
    setIsCreating(false);
    setEditingPlayerIndex(null);
    setRosterSearch("");
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
    setNewPlayerRole("field");
    setRosterSearch("");
    setEditingPlayerIndex(null);
  };

  // Añadir jugador a la lista temporal
  const handleAddPlayer = (e) => {
    if (e) e.preventDefault();
    if (!newPlayerName.trim() || newPlayerNumber === "") return;

    const numberVal = parseInt(newPlayerNumber, 10);
    if (isNaN(numberVal) || numberVal < 0 || numberVal > 99) {
      alert("Introduce un dorsal válido entre 0 y 99.");
      return;
    }
    if (editPlayers.some((p) => p.number === numberVal)) {
      alert(t("create_match.dorsal_exists", "Este dorsal ya está asignado a otro jugador."));
      return;
    }

    const isGk = newPlayerRole === "gk";

    setEditPlayers((prev) => [
      ...prev,
      { name: newPlayerName.trim().toUpperCase(), number: numberVal, is_goalkeeper: isGk },
    ]);
    setNewPlayerName("");
    setNewPlayerNumber("");
    setNewPlayerRole("field");
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
    if (editingPlayerIndex === index) setEditingPlayerIndex(null);
  };

  const handleStartEditPlayer = (index, player) => {
    setEditingPlayerIndex(index);
    setEditingNumber(String(player.number));
    setEditingName(player.name);
    setEditingRole(player.is_goalkeeper === true || player.is_goalkeeper === "true" ? "gk" : "field");
  };

  const handleSaveEditPlayer = (index) => {
    if (!editingName.trim() || editingNumber === "") return;
    const numberVal = parseInt(editingNumber, 10);
    if (isNaN(numberVal) || numberVal < 0 || numberVal > 99) {
      alert("Introduce un dorsal válido entre 0 y 99.");
      return;
    }
    if (editPlayers.some((p, i) => i !== index && p.number === numberVal)) {
      alert(t("create_match.dorsal_exists", "Este dorsal ya está asignado a otro jugador."));
      return;
    }

    setEditPlayers((prev) =>
      prev.map((p, i) =>
        i === index
          ? {
              ...p,
              name: editingName.trim().toUpperCase(),
              number: numberVal,
              is_goalkeeper: editingRole === "gk",
            }
          : p
      )
    );
    setEditingPlayerIndex(null);
  };

  const handleCancelEditPlayer = () => {
    setEditingPlayerIndex(null);
  };

  const handleSaveTeam = async (e) => {
    e.preventDefault();
    if (!editName.trim()) {
      alert(t("teams.team_name_empty"));
      return;
    }

    try {
      if (isCreating) {
        if (teams.some((tItem) => tItem.name.toLowerCase() === editName.trim().toLowerCase())) {
          alert(t("teams.team_name_exists"));
          return;
        }
        await userService.saveTeam(user._id, {
          name: editName.trim(),
          logo_url: editLogoUrl || null,
          players: editPlayers,
        });
        alert(t("teams.team_created_success"));
        setSelectedTeam(null);
        setIsCreating(false);
      } else if (selectedTeam) {
        await userService.updateSavedTeam(user._id, selectedTeam.name, {
          name: editName.trim(),
          logo_url: editLogoUrl || null,
          players: editPlayers,
        });
        alert(t("teams.team_saved_success"));
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
    if (!confirm(t("teams.delete_team_confirm", { name: teamName }))) return;

    try {
      await userService.deleteSavedTeam(user._id, teamName);
      if (selectedTeam?.name === teamName) {
        setSelectedTeam(null);
      }
      loadTeams();
      alert(t("teams.delete_team_success"));
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

  const goalkeepersCount = useMemo(() => {
    return editPlayers.filter((p) => p.is_goalkeeper === true || p.is_goalkeeper === "true").length;
  }, [editPlayers]);

  const fieldPlayersCount = useMemo(() => {
    return editPlayers.filter((p) => !p.is_goalkeeper || p.is_goalkeeper === "false").length;
  }, [editPlayers]);

  const filteredEditPlayers = useMemo(() => {
    if (!rosterSearch.trim()) return editPlayers;
    const q = rosterSearch.trim().toLowerCase();
    return editPlayers.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        String(p.number).includes(q)
    );
  }, [editPlayers, rosterSearch]);

  const getPlayerPJ = (player) => {
    if (!cumulativeStats?.playerStats) return 1;
    const pStat = cumulativeStats.playerStats.find(
      (ps) =>
        Number(ps.number) === Number(player.number) ||
        ps.name?.trim().toLowerCase() === player.name?.trim().toLowerCase()
    );
    return pStat ? (pStat.matchesPlayed ?? 0) : 0;
  };

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

  // Resumen y estadísticas destacadas calculadas para cada equipo del catálogo
  const teamSummaries = useMemo(() => {
    const map = {};
    filteredTeams.forEach((team) => {
      const teamNameLower = (team.name || "").trim().toLowerCase();
      const teamMatches = matchesList.filter((m) => {
        const h = (m.home_team || "").trim().toLowerCase();
        const a = (m.away_team || "").trim().toLowerCase();
        return h === teamNameLower || a === teamNameLower;
      });

      const stats = calculateTeamCumulativeStats(team.name, teamMatches);

      // Obtener el partido más reciente
      const sorted = [...teamMatches].sort((a, b) => {
        const timeA = a.date ? new Date(a.date).getTime() : 0;
        const timeB = b.date ? new Date(b.date).getTime() : 0;
        return timeB - timeA;
      });

      const lastMatch = sorted[0] || null;
      let lastMatchData = null;
      if (lastMatch) {
        const isHome = (lastMatch.home_team || "").trim().toLowerCase() === teamNameLower;
        const teamScore = isHome ? (lastMatch.goals_home ?? 0) : (lastMatch.goals_away ?? 0);
        const oppScore = isHome ? (lastMatch.goals_away ?? 0) : (lastMatch.goals_home ?? 0);
        let outcome = "draw";
        let code = "E";
        let color = "#F59E0B";
        if (teamScore > oppScore) {
          outcome = "win";
          code = "V";
          color = "#44D878";
        } else if (teamScore < oppScore) {
          outcome = "loss";
          code = "D";
          color = "#EF4444";
        }
        lastMatchData = {
          outcome,
          code,
          color,
          text: `Último: ${code} ${teamScore} - ${oppScore}`,
        };
      } else {
        lastMatchData = {
          outcome: "none",
          code: "-",
          color: "#64748B",
          text: "Sin partidos",
        };
      }

      const topStats = computeTopNotableStats(team, stats, teamMatches);

      map[team.name] = {
        teamMatchesCount: teamMatches.length,
        wins: stats?.wins || 0,
        draws: stats?.draws || 0,
        losses: stats?.losses || 0,
        lastMatchData,
        topStats,
      };
    });
    return map;
  }, [filteredTeams, matchesList]);

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
                <span>{t("teams.title")}</span>
              </h2>
              <p className="teams-subtitle">
                {t("teams.subtitle")}
              </p>
            </div>
            <button className="btn btn-primary" onClick={handleStartCreate} style={{ display: "inline-flex", alignItems: "center" }}>
              <IconPlus />
              <span>{t("teams.new_team")}</span>
            </button>
          </div>

          <div style={{ marginBottom: "var(--space-20)", maxWidth: "420px" }}>
            <input
              type="text"
              className="input-field"
              placeholder={t("teams.search_placeholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="teams-loading">{t("teams.loading")}</div>
          ) : filteredTeams.length === 0 ? (
            <div className="teams-empty-state">
              <IconShieldSvg />
              <p style={{ fontSize: "var(--text-sm)", margin: "8px 0" }}>{t("teams.empty_title")}</p>
              <button className="btn btn-primary btn-sm" onClick={handleStartCreate} style={{ marginTop: "12px" }}>
                <IconPlus /> {t("teams.empty_btn")}
              </button>
            </div>
          ) : (
            <div className="teams-gallery-grid">
              {filteredTeams.map((team, idx) => {
                const summary = teamSummaries[team.name] || {};
                const teamMatchesCount = summary.teamMatchesCount || 0;
                const wins = summary.wins || 0;
                const draws = summary.draws || 0;
                const losses = summary.losses || 0;
                const lastMatch = summary.lastMatchData || {
                  outcome: "none",
                  text: "Sin partidos",
                };
                const topStats = summary.topStats || [];
                const rosterCount = team.players?.length || 0;

                return (
                  <div
                    key={idx}
                    className="teams-gallery-card"
                    onClick={() => handleSelectTeam(team)}
                  >
                    {/* CABECERA: LOGO, NOMBRE, METADATOS Y PAPELERA */}
                    <div className="team-card-header">
                      <div className="team-card-identity">
                        <div className="team-card-logo">
                          {team.logo_url ? (
                            <img
                              src={team.logo_url}
                              alt={team.name}
                              className="team-card-logo-img"
                            />
                          ) : (
                            <span className="team-card-logo-text">
                              {getTeamBadgeText(team.name)}
                            </span>
                          )}
                        </div>

                        <div className="team-card-titles">
                          <h3 className="team-card-name" title={team.name}>
                            {team.name}
                          </h3>
                          <div className="team-card-meta">
                            <span className="team-card-roster">
                              {rosterCount} {rosterCount === 1 ? "Jugador" : "Jugadores"} en plantilla
                            </span>
                            <span className="team-card-bullet">•</span>
                            <span className="team-card-record">
                              {teamMatchesCount} {teamMatchesCount === 1 ? "Partido" : "Partidos"}
                              {teamMatchesCount > 0 && ` (${wins}V ${draws}E ${losses}D)`}
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="btn-delete-team"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTeam(team.name);
                        }}
                        title={t("common.delete")}
                      >
                        <IconTrash />
                      </button>
                    </div>

                    {/* CAJA CENTRAL: LAS 3 ESTADÍSTICAS MÁS LLAMATIVAS DEL EQUIPO */}
                    <div className="team-card-stats-box">
                      {topStats.map((stat, sIdx) => (
                        <div key={sIdx} className="team-stat-item">
                          <span className="team-stat-label" title={stat.label}>
                            {stat.label}
                          </span>
                          <div className="team-stat-val-row">
                            <span className="team-stat-val">{stat.value}</span>
                            {stat.detail && (
                              <span
                                className={`team-stat-detail tone-${stat.tone || "neutral"}`}
                              >
                                {stat.detail}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* PIE DE TARJETA: RESULTADO ÚLTIMO PARTIDO Y BOTÓN ACCIÓN */}
                    <div className="team-card-footer">
                      <div className="team-card-last-match">
                        <span
                          className={`team-match-indicator-dot outcome-${lastMatch.outcome || "none"}`}
                        />
                        <span
                          className={`team-match-result-text outcome-${lastMatch.outcome || "none"}`}
                        >
                          {lastMatch.text}
                        </span>
                      </div>

                      <button
                        type="button"
                        className="btn-view-dashboard"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectTeam(team);
                        }}
                      >
                        <span>Ver Dashboard</span>
                        <IconArrowRight />
                      </button>
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
                title={t("common.back")}
              >
                <IconArrowLeft />
              </button>
              <div
                className="team-hero-badge"
                onClick={() => setRightPanelTab("roster")}
                title={t("teams.badge_change_hint")}
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
                <h3>{isCreating ? t("teams.create_team_title") : selectedTeam.name}</h3>
                {!isCreating && (
                  <div className="team-hero-stats-pill">
                    <span>{t("teams.matches_analyzed", { count: cumulativeStats?.totalMatches || 0 })}</span>
                    {cumulativeStats && (
                      <span>• {t("teams.w_d_l", { wins: cumulativeStats.wins, draws: cumulativeStats.draws, losses: cumulativeStats.losses })}</span>
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
                  <IconBarChart size={14} /> {t("teams.global_dashboard")}
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${rightPanelTab === "roster" ? "btn-primary" : "btn-ghost"}`}
                  onClick={() => setRightPanelTab("roster")}
                >
                  <IconUsers size={14} /> {t("teams.roster_tab", { count: editPlayers.length })}
                </button>
              </div>
            )}
          </div>

          {/* SUB-VISTA 1: DASHBOARD GLOBAL DE RENDIMIENTO A PANTALLA COMPLETA */}
          {selectedTeam && !isCreating && rightPanelTab === "stats" && cumulativeStats && (
            <div className="team-stats-dashboard" style={{ display: "flex", flexDirection: "column", gap: "var(--space-32)" }}>
              {/* TARJETAS KPI DE RENDIMIENTO ACUMULADO */}
              <div className="hs-grid hs-grid-4">
                <KPICard title={t("teams.kpis.matches_played")} value={cumulativeStats.totalMatches} subtitle={t("teams.w_d_l", { wins: cumulativeStats.wins, draws: cumulativeStats.draws, losses: cumulativeStats.losses })} />
                <KPICard title={t("teams.kpis.goals_for_against")} value={`${cumulativeStats.goalsFor} / ${cumulativeStats.goalsAgainst}`} subtitle={t("teams.kpis.goals_avg_sub", { gf: cumulativeStats.avgGoalsFor, ga: cumulativeStats.avgGoalsAgainst })} />
                <KPICard title={t("teams.kpis.xg_xga_title")} value={`${cumulativeStats.totalXG} vs ${cumulativeStats.totalXGA}`} subtitle={t("teams.kpis.xg_xga_diff", { diff: (cumulativeStats.totalXG - cumulativeStats.totalXGA).toFixed(2) })} />
                <KPICard title={t("teams.kpis.off_eff_title")} value={`${cumulativeStats.avgOffEfficiency}%`} subtitle={t("teams.kpis.shot_eff_sub", { val: cumulativeStats.shotEfficiency })} />
                <KPICard title={t("teams.kpis.saves_eff_title")} value={`${cumulativeStats.totalSaves}/${cumulativeStats.totalShotsFaced}`} subtitle={t("teams.kpis.saves_pct_sub", { val: cumulativeStats.savePct })} />
                <KPICard title={t("teams.kpis.total_turnovers_title")} value={cumulativeStats.totalTurnovers} subtitle={t("teams.kpis.turnovers_avg_sub", { val: cumulativeStats.avgTurnovers })} />
                <KPICard title={t("teams.kpis.avg_poss_duration")} value={`${cumulativeStats.avgPossessionDuration}s`} subtitle={t("teams.kpis.poss_avg_sub", { val: cumulativeStats.avgPossessionsPerMatch })} />
                <KPICard title={t("teams.kpis.def_eff_title")} value={`${cumulativeStats.avgDefEfficiency}%`} subtitle={t("teams.kpis.def_eff_sub")} />
              </div>

              {/* ESTADÍSTICAS ACUMULADAS DE LA PLANTILLA EN LA TEMPORADA */}
              <div className="hs-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-12)", flexWrap: "wrap", gap: "8px" }}>
                  <h4 className="hs-card-title" style={{ margin: 0 }}>
                    <IconUsers size={15} /> {t("teams.roster_performance_title")}
                  </h4>
                  <div style={{ display: "flex", gap: "4px", background: "var(--bg-inset)", padding: "3px", borderRadius: "var(--radius)", border: "1px solid var(--border-color)" }}>
                    <button
                      type="button"
                      className={`btn btn-sm ${playerTableFilter === "all" ? "btn-primary" : "btn-ghost"}`}
                      onClick={() => setPlayerTableFilter("all")}
                      style={{ fontSize: "0.72rem", padding: "3px 8px" }}
                    >
                      {t("common.summary")} ({cumulativeStats.playerStats.length})
                    </button>
                    <button
                      type="button"
                      className={`btn btn-sm ${playerTableFilter === "field" ? "btn-primary" : "btn-ghost"}`}
                      onClick={() => setPlayerTableFilter("field")}
                      style={{ fontSize: "0.72rem", padding: "3px 8px" }}
                    >
                      {t("common.field_players")} ({cumulativeStats.playerStats.filter(p => !p.is_goalkeeper).length})
                    </button>
                    <button
                      type="button"
                      className={`btn btn-sm ${playerTableFilter === "goalkeepers" ? "btn-primary" : "btn-ghost"}`}
                      onClick={() => setPlayerTableFilter("goalkeepers")}
                      style={{ fontSize: "0.72rem", padding: "3px 8px" }}
                    >
                      {t("common.goalkeepers")} ({cumulativeStats.playerStats.filter(p => p.is_goalkeeper === true || p.is_goalkeeper === "true").length})
                    </button>
                  </div>
                </div>

                {cumulativeStats.playerStats.length === 0 ? (
                  <p style={{ color: "var(--text-muted)", fontSize: "var(--text-xs)", margin: 0 }}>
                    {t("teams.no_players")}
                  </p>
                ) : (
                  <div className="hs-table-container" style={{ overflowX: "hidden" }}>
                    <table className="hs-data-table hs-table-compact" style={{ width: "100%", tableLayout: "auto" }}>
                      <thead>
                        {playerTableFilter === "field" ? (
                          <tr>
                            <th onClick={() => handlePlayerSort("number")} style={{ textAlign: "center", padding: "8px 4px", cursor: "pointer", userSelect: "none" }} title="Ordenar por número">#{renderSortIndicator("number")}</th>
                            <th onClick={() => handlePlayerSort("name")} style={{ padding: "8px 6px", cursor: "pointer", userSelect: "none" }} title="Ordenar por jugador">{t("players_table.col_name")}{renderSortIndicator("name")}</th>
                            <th onClick={() => handlePlayerSort("matchesPlayed")} style={{ textAlign: "center", padding: "8px 4px", cursor: "pointer", userSelect: "none" }} title="Ordenar por partidos jugados">PJ{renderSortIndicator("matchesPlayed")}</th>
                            <th onClick={() => handlePlayerSort("shotsCount")} style={{ textAlign: "center", padding: "8px 4px", cursor: "pointer", userSelect: "none" }} title="Ordenar por tiros a campo">{t("players_table.col_shots")}{renderSortIndicator("shotsCount")}</th>
                            <th onClick={() => handlePlayerSort("goals")} style={{ textAlign: "center", padding: "8px 4px", cursor: "pointer", userSelect: "none" }} title="Ordenar por goles">{t("players_table.col_goals")}{renderSortIndicator("goals")}</th>
                            <th onClick={() => handlePlayerSort("efficiency")} style={{ textAlign: "center", padding: "8px 4px", cursor: "pointer", userSelect: "none" }} title="Ordenar por eficacia">% {t("common.efficiency")}{renderSortIndicator("efficiency")}</th>
                            <th onClick={() => handlePlayerSort("xg")} style={{ textAlign: "center", padding: "8px 4px", cursor: "pointer", userSelect: "none" }} title="Ordenar por xG">{t("players_table.col_xg")}{renderSortIndicator("xg")}</th>
                            <th onClick={() => handlePlayerSort("turnovers")} style={{ textAlign: "center", padding: "8px 4px", cursor: "pointer", userSelect: "none" }} title="Ordenar por pérdidas">{t("players_table.col_turnovers")}{renderSortIndicator("turnovers")}</th>
                            <th onClick={() => handlePlayerSort("avgRating")} style={{ textAlign: "center", padding: "8px 4px", cursor: "pointer", userSelect: "none" }} title="Ordenar por rating">{t("players_table.col_rating")}{renderSortIndicator("avgRating")}</th>
                          </tr>
                        ) : playerTableFilter === "goalkeepers" ? (
                          <tr>
                            <th onClick={() => handlePlayerSort("number")} style={{ textAlign: "center", padding: "8px 4px", cursor: "pointer", userSelect: "none" }} title="Ordenar por número">#{renderSortIndicator("number")}</th>
                            <th onClick={() => handlePlayerSort("name")} style={{ padding: "8px 6px", cursor: "pointer", userSelect: "none" }} title="Ordenar por portero">{t("common.goalkeeper")}{renderSortIndicator("name")}</th>
                            <th onClick={() => handlePlayerSort("matchesPlayed")} style={{ textAlign: "center", padding: "8px 4px", cursor: "pointer", userSelect: "none" }} title="Ordenar por partidos jugados">PJ{renderSortIndicator("matchesPlayed")}</th>
                            <th onClick={() => handlePlayerSort("saves")} style={{ textAlign: "center", padding: "8px 4px", cursor: "pointer", userSelect: "none" }} title="Ordenar por paradas">{t("players_table.col_saves")} / Rec.{renderSortIndicator("saves")}</th>
                            <th onClick={() => handlePlayerSort("savePct")} style={{ textAlign: "center", padding: "8px 4px", cursor: "pointer", userSelect: "none" }} title="Ordenar por % de paradas">% {t("players_table.col_saves")}{renderSortIndicator("savePct")}</th>
                            <th onClick={() => handlePlayerSort("goalkeeperXSaves")} style={{ textAlign: "center", padding: "8px 4px", cursor: "pointer", userSelect: "none" }} title="Ordenar por xSaves">{t("players_table.col_xsaves")}{renderSortIndicator("goalkeeperXSaves")}</th>
                            <th onClick={() => handlePlayerSort("goals")} style={{ textAlign: "center", padding: "8px 4px", cursor: "pointer", userSelect: "none" }} title="Ordenar por goles">{t("players_table.col_goals")}{renderSortIndicator("goals")}</th>
                            <th onClick={() => handlePlayerSort("avgRating")} style={{ textAlign: "center", padding: "8px 4px", cursor: "pointer", userSelect: "none" }} title="Ordenar por rating">{t("players_table.col_rating")}{renderSortIndicator("avgRating")}</th>
                          </tr>
                        ) : (
                          <tr>
                            <th onClick={() => handlePlayerSort("number")} style={{ textAlign: "center", padding: "8px 4px", cursor: "pointer", userSelect: "none" }} title="Ordenar por número">#{renderSortIndicator("number")}</th>
                            <th onClick={() => handlePlayerSort("name")} style={{ padding: "8px 6px", cursor: "pointer", userSelect: "none" }} title="Ordenar por jugador">{t("players_table.col_name")}{renderSortIndicator("name")}</th>
                            <th onClick={() => handlePlayerSort("role")} style={{ textAlign: "center", padding: "8px 4px", cursor: "pointer", userSelect: "none" }} title="Ordenar por rol">{t("players_table.col_role")}{renderSortIndicator("role")}</th>
                            <th onClick={() => handlePlayerSort("matchesPlayed")} style={{ textAlign: "center", padding: "8px 4px", cursor: "pointer", userSelect: "none" }} title="Ordenar por partidos jugados">PJ{renderSortIndicator("matchesPlayed")}</th>
                            <th onClick={() => handlePlayerSort("goals")} style={{ textAlign: "center", padding: "8px 4px", cursor: "pointer", userSelect: "none" }} title="Ordenar por goles">{t("players_table.col_goals")} / {t("common.shots")}{renderSortIndicator("goals")}</th>
                            <th onClick={() => handlePlayerSort("efficiency")} style={{ textAlign: "center", padding: "8px 4px", cursor: "pointer", userSelect: "none" }} title="Ordenar por eficacia">% {t("common.efficiency")}{renderSortIndicator("efficiency")}</th>
                            <th onClick={() => handlePlayerSort("saves")} style={{ textAlign: "center", padding: "8px 4px", cursor: "pointer", userSelect: "none" }} title="Ordenar por paradas">{t("players_table.col_saves")}{renderSortIndicator("saves")}</th>
                            <th onClick={() => handlePlayerSort("savePct")} style={{ textAlign: "center", padding: "8px 4px", cursor: "pointer", userSelect: "none" }} title="Ordenar por % de paradas">% Par.{renderSortIndicator("savePct")}</th>
                            <th onClick={() => handlePlayerSort("avgRating")} style={{ textAlign: "center", padding: "8px 4px", cursor: "pointer", userSelect: "none" }} title="Ordenar por rating">{t("players_table.col_rating")}{renderSortIndicator("avgRating")}</th>
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
                                      (() => {
                                        const badge = getShotEffBadge(p.efficiency);
                                        return (
                                          <MetricBadge
                                            value={`${p.efficiency}%`}
                                            variant={badge.variant}
                                            className={badge.className}
                                          />
                                        );
                                      })()
                                    ) : (
                                      <span style={{ color: "var(--text-muted)" }}>—</span>
                                    )}
                                  </td>
                                  <td style={{ textAlign: "center", padding: "6px 4px" }}>{p.shotsCount > 0 ? p.xg : "—"}</td>
                                  <td style={{ textAlign: "center", padding: "6px 4px" }}>{p.turnovers}</td>
                                  <td style={{ textAlign: "center", padding: "6px 4px" }}>
                                    {(() => {
                                      const badge = getRatingBadge(p.avgRating);
                                      return (
                                        <MetricBadge
                                          value={p.avgRating}
                                          variant={badge.variant}
                                          className={badge.className}
                                        />
                                      );
                                    })()}
                                  </td>
                                </>
                              ) : playerTableFilter === "goalkeepers" ? (
                                <>
                                  <td style={{ textAlign: "center", padding: "6px 4px" }}>{p.matchesPlayed}</td>
                                  <td style={{ textAlign: "center", padding: "6px 4px" }}><strong>{p.saves}/{p.shotsFaced}</strong></td>
                                  <td style={{ textAlign: "center", padding: "6px 4px" }}>
                                    {p.shotsFaced > 0 ? (
                                      (() => {
                                        const badge = getGkSavePctBadge(p.savePct);
                                        return (
                                          <MetricBadge
                                            value={`${p.savePct}%`}
                                            variant={badge.variant}
                                            className={badge.className}
                                          />
                                        );
                                      })()
                                    ) : (
                                      <span style={{ color: "var(--text-muted)" }}>—</span>
                                    )}
                                  </td>
                                  <td style={{ textAlign: "center", padding: "6px 4px" }}>{p.shotsFaced > 0 ? p.goalkeeperXSaves : "—"}</td>
                                  <td style={{ textAlign: "center", padding: "6px 4px" }}>{p.goals > 0 ? <strong>{p.goals}</strong> : "0"}</td>
                                  <td style={{ textAlign: "center", padding: "6px 4px" }}>
                                    {(() => {
                                      const badge = getRatingBadge(p.avgRating);
                                      return (
                                        <MetricBadge
                                          value={p.avgRating}
                                          variant={badge.variant}
                                          className={badge.className}
                                        />
                                      );
                                    })()}
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
                                      {isGk ? t("players_table.role_gk") : t("players_table.role_player")}
                                    </span>
                                  </td>
                                  <td style={{ textAlign: "center", padding: "6px 4px" }}>{p.matchesPlayed}</td>
                                  <td style={{ textAlign: "center", padding: "6px 4px" }}>
                                    {p.shotsCount > 0 || p.goals > 0 ? <strong>{p.goals}/{p.shotsCount}</strong> : <span style={{ color: "var(--text-muted)" }}>—</span>}
                                  </td>
                                  <td style={{ textAlign: "center", padding: "6px 4px" }}>
                                    {p.shotsCount > 0 ? (
                                      (() => {
                                        const badge = getShotEffBadge(p.efficiency);
                                        return (
                                          <MetricBadge
                                            value={`${p.efficiency}%`}
                                            variant={badge.variant}
                                            className={badge.className}
                                          />
                                        );
                                      })()
                                    ) : (
                                      <span style={{ color: "var(--text-muted)" }}>—</span>
                                    )}
                                  </td>
                                  <td style={{ textAlign: "center", padding: "6px 4px" }}>
                                    {isGk ? <strong>{p.saves}/{p.shotsFaced}</strong> : <span style={{ color: "var(--text-muted)" }}>—</span>}
                                  </td>
                                  <td style={{ textAlign: "center", padding: "6px 4px" }}>
                                    {isGk && p.shotsFaced > 0 ? (
                                      (() => {
                                        const badge = getGkSavePctBadge(p.savePct);
                                        return (
                                          <MetricBadge
                                            value={`${p.savePct}%`}
                                            variant={badge.variant}
                                            className={badge.className}
                                          />
                                        );
                                      })()
                                    ) : (
                                      <span style={{ color: "var(--text-muted)" }}>—</span>
                                    )}
                                  </td>
                                  <td style={{ textAlign: "center", padding: "6px 4px" }}>
                                    {(() => {
                                      const badge = getRatingBadge(p.avgRating);
                                      return (
                                        <MetricBadge
                                          value={p.avgRating}
                                          variant={badge.variant}
                                          className={badge.className}
                                        />
                                      );
                                    })()}
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
                      {t("teams.filter_season_saves")}
                    </span>
                    <button
                      type="button"
                      className={`btn btn-sm ${selectedTeamGkNumber === "all" ? "btn-primary" : "btn-ghost"}`}
                      onClick={() => setSelectedTeamGkNumber("all")}
                    >
                      {t("teams.all_team_goalkeepers")}
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
                  title={t("teams.cumulative_court_title", { name: activeTeamGk ? `#${activeTeamGk.number} ${activeTeamGk.name.toUpperCase()}` : selectedTeam.name.toUpperCase() })}
                />
              </div>
            </div>
          )}

          {/* SUB-VISTA 2: EDICIÓN DE PLANTILLA A PANTALLA COMPLETA */}
          {(isCreating || rightPanelTab === "roster") && (
            <form onSubmit={handleSaveTeam} className="team-editor-form-custom">
              {/* 1. SECCIÓN: DATOS GENERALES DEL EQUIPO */}
              <div className="team-general-card">
                <div className="team-section-header">
                  <IconInfoCircle />
                  <span>DATOS GENERALES DEL EQUIPO</span>
                </div>

                <div className="form-group-custom">
                  <label className="custom-label">NOMBRE DEL EQUIPO</label>
                  <input
                    id="team-name"
                    type="text"
                    className="custom-team-name-input"
                    placeholder="NOMBRE DEL EQUIPO"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group-custom" style={{ marginBottom: 0 }}>
                  <label className="custom-label">ESCUDO DEL EQUIPO (FOTO / IMAGEN)</label>

                  <div
                    className={`team-shield-box ${editLogoUrl ? "assigned" : "empty"} ${isDraggingLogo ? "dragging" : ""}`}
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
                  >
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          processLogoFile(e.target.files[0]);
                        }
                      }}
                    />

                    {editLogoUrl ? (
                      <div className="shield-assigned-content">
                        <div className="shield-thumb-wrapper">
                          <img src={editLogoUrl} alt="Escudo" className="shield-thumb-img" />
                        </div>

                        <div className="shield-text-info">
                          <div className="shield-status-title">
                            <IconCheck />
                            <span>Escudo asignado correctamente</span>
                          </div>
                          <p className="shield-status-sub">
                            Haz clic para cambiar la imagen o arrastra un nuevo archivo PNG/SVG transparente (Recomendado 256×256 px)
                          </p>
                        </div>

                        <div className="shield-action-buttons">
                          <button
                            type="button"
                            className="btn-shield-browse"
                            onClick={() => logoInputRef.current?.click()}
                          >
                            Examinar...
                          </button>
                          <button
                            type="button"
                            className="btn-shield-remove"
                            onClick={() => setEditLogoUrl("")}
                          >
                            Quitar Foto
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="shield-empty-content" onClick={() => logoInputRef.current?.click()}>
                        <div className="shield-empty-icon">
                          <IconUploadCloud />
                        </div>
                        <div className="shield-empty-texts">
                          <p className="shield-empty-main">
                            Arrastra el escudo aquí o haz clic para <span className="highlight-browse">Examinar archivos</span>
                          </p>
                          <p className="shield-empty-sub">
                            Formatos soportados: PNG, SVG, JPG (Recomendado PNG/SVG transparente 256×256 px)
                          </p>
                        </div>
                        <button
                          type="button"
                          className="btn-shield-browse"
                          onClick={(e) => {
                            e.stopPropagation();
                            logoInputRef.current?.click();
                          }}
                        >
                          Examinar...
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 2. SECCIÓN: PLANTILLA DEL EQUIPO */}
              <div className="team-roster-card">
                {/* BARRA SUPERIOR DE LA PLANTILLA: TÍTULO, PASTILLAS RESUMEN Y BUSCADOR */}
                <div className="roster-top-bar">
                  <div className="roster-top-left">
                    <h3 className="roster-card-title">
                      PLANTILLA DEL EQUIPO <span className="roster-count-num">({editPlayers.length})</span>
                    </h3>
                    <div className="roster-pills-summary">
                      <span>Porteros: <strong className="summary-bold">{goalkeepersCount}</strong></span>
                      <span className="summary-divider">|</span>
                      <span>Jugadores: <strong className="summary-bold">{fieldPlayersCount}</strong></span>
                    </div>
                  </div>

                  <div className="roster-search-box">
                    <IconSearch />
                    <input
                      type="text"
                      className="roster-search-input"
                      placeholder="Buscar dorsal o nombre..."
                      value={rosterSearch}
                      onChange={(e) => setRosterSearch(e.target.value)}
                    />
                    {rosterSearch && (
                      <button
                        type="button"
                        className="roster-search-clear"
                        onClick={() => setRosterSearch("")}
                        title="Limpiar búsqueda"
                      >
                        <IconX />
                      </button>
                    )}
                  </div>
                </div>

                {/* TABLA DE JUGADORES */}
                <div className="roster-table-container">
                  <table className="custom-roster-table">
                    <thead>
                      <tr>
                        <th className="th-num">#</th>
                        <th className="th-name">NOMBRE Y APELLIDOS DEL JUGADOR</th>
                        <th className="th-role">ROL TÁCTICO</th>
                        <th className="th-pj">PJ</th>
                        <th className="th-actions">ACCIONES</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEditPlayers.map((player) => {
                        const originalIndex = editPlayers.findIndex(
                          (p) => p.number === player.number && p.name === player.name
                        );
                        const isEditing = editingPlayerIndex === originalIndex;
                        const isGk = player.is_goalkeeper === true || player.is_goalkeeper === "true";
                        const pj = getPlayerPJ(player);

                        if (isEditing) {
                          return (
                            <tr key={`edit_${player.number}`} className="tr-player-row tr-editing">
                              <td className="td-num">
                                <input
                                  type="number"
                                  className="inline-edit-num"
                                  value={editingNumber}
                                  onChange={(e) => setEditingNumber(e.target.value)}
                                  min="0"
                                  max="99"
                                />
                              </td>
                              <td className="td-name">
                                <input
                                  type="text"
                                  className="inline-edit-name"
                                  value={editingName}
                                  onChange={(e) => setEditingName(e.target.value)}
                                />
                              </td>
                              <td className="td-role">
                                <select
                                  className="inline-edit-role-select"
                                  value={editingRole}
                                  onChange={(e) => setEditingRole(e.target.value)}
                                >
                                  <option value="field">Jugador</option>
                                  <option value="gk">Portero</option>
                                </select>
                              </td>
                              <td className="td-pj">{pj}</td>
                              <td className="td-actions">
                                <button
                                  type="button"
                                  className="btn-action-save"
                                  onClick={() => handleSaveEditPlayer(originalIndex)}
                                  title="Guardar"
                                >
                                  <IconCheck />
                                </button>
                                <button
                                  type="button"
                                  className="btn-action-cancel"
                                  onClick={handleCancelEditPlayer}
                                  title="Cancelar"
                                >
                                  <IconX />
                                </button>
                              </td>
                            </tr>
                          );
                        }

                        return (
                          <tr key={`${player.number}_${player.name}`} className="tr-player-row">
                            <td className="td-num">#{player.number}</td>
                            <td className="td-name">{player.name}</td>
                            <td className="td-role">
                              <button
                                type="button"
                                className={`btn-role-pill ${isGk ? "role-gk" : "role-field"}`}
                                onClick={() => handleToggleGoalkeeper(originalIndex)}
                                title="Haz clic para alternar entre Portero y Jugador"
                              >
                                {isGk ? "Portero" : "Jugador"}
                              </button>
                            </td>
                            <td className="td-pj">{pj}</td>
                            <td className="td-actions">
                              <button
                                type="button"
                                className="btn-table-action btn-action-edit"
                                onClick={() => handleStartEditPlayer(originalIndex, player)}
                                title="Editar jugador"
                              >
                                <IconEdit />
                              </button>
                              <button
                                type="button"
                                className="btn-table-action btn-action-delete"
                                onClick={() => handleRemovePlayer(originalIndex)}
                                title="Eliminar jugador"
                              >
                                <IconX />
                              </button>
                            </td>
                          </tr>
                        );
                      })}

                      {filteredEditPlayers.length === 0 && (
                        <tr>
                          <td colSpan="5" className="td-empty-roster">
                            {rosterSearch
                              ? `No se encontraron jugadores que coincidan con "${rosterSearch}"`
                              : "No hay jugadores en la plantilla todavía."}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>

                  {/* FILA INFERIOR PARA AÑADIR JUGADOR A LA PLANTILLA */}
                  <div className="add-player-row-box">
                    <div className="add-player-num-col">
                      <input
                        type="number"
                        className="add-input-num"
                        placeholder="#"
                        min="0"
                        max="99"
                        value={newPlayerNumber}
                        onChange={(e) => {
                          const val = e.target.value;
                          setNewPlayerNumber(val);
                          if (val && [1, 12, 16].includes(parseInt(val, 10))) {
                            setNewPlayerRole("gk");
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddPlayer();
                          }
                        }}
                      />
                    </div>

                    <div className="add-player-name-col">
                      <input
                        type="text"
                        className="add-input-name"
                        placeholder="Nombre completo y apellidos del jugador..."
                        value={newPlayerName}
                        onChange={(e) => setNewPlayerName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddPlayer();
                          }
                        }}
                      />
                    </div>

                    <div className="add-player-role-col">
                      <div className="custom-role-select-wrapper">
                        <select
                          className="add-select-role"
                          value={newPlayerRole}
                          onChange={(e) => setNewPlayerRole(e.target.value)}
                        >
                          <option value="field">Jugador de Campo</option>
                          <option value="gk">Portero</option>
                        </select>
                        <IconChevronDown />
                      </div>
                    </div>

                    <div className="add-player-btn-col">
                      <button
                        type="button"
                        className="btn-add-to-roster"
                        onClick={handleAddPlayer}
                      >
                        <IconPlus />
                        <span>AÑADIR A LA PLANTILLA</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* BOTONES INFERIORES DE ACCIÓN */}
              <div className="roster-form-footer">
                <button
                  type="button"
                  className="btn-footer-cancel"
                  onClick={handleBackToList}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-footer-save"
                >
                  <IconUpload />
                  <span>GUARDAR CAMBIOS DEL EQUIPO</span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
