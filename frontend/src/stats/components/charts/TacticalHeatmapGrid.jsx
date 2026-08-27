import React, { useState, useMemo } from "react";
import { HandballCourtGraphic } from "./HandballCourtGraphic";
import { HandballGoalGraphic } from "./HandballGoalGraphic";
import { ContinuousHeatmapCanvas } from "./ContinuousHeatmapCanvas";
import {
  isAwayEvent,
  generateContinuousCourtHeatmapData,
  generateContinuousGoalHeatmapData
} from "../../engine/heatmapEngine";
import {
  IconBall,
  IconGlove,
  IconXMark,
  IconTurnover,
  IconFilter,
  IconLayers,
  IconMapPin
} from "../common/Icons";

export { isAwayEvent };

/**
 * Helper para filtrar eventos por portero específico.
 */
export function matchesGoalkeeper(e, selectedGkNumber) {
  if (!selectedGkNumber || selectedGkNumber === "all") return true;
  if (!e) return false;
  if (e.goalkeeper_number !== undefined && e.goalkeeper_number !== null && e.goalkeeper_number !== 0) {
    return String(e.goalkeeper_number) === String(selectedGkNumber);
  }
  return true;
}

/**
 * Pin/Marcador de tiro de alto contraste y máxima visibilidad con Iconos Vectoriales SVG Profesionales.
 */
export function ShotMarkerPin({ pt, isSelected = false, isDimmed = false, onClick = null }) {
  const isGoal = pt.result === "Gol";
  const isSave = pt.result === "Parada";
  const isTurnover = pt.event_type === "turnover";
  const isFailure = pt.result === "Poste" || pt.result === "Fuera" || pt.result === "Fallo" || pt.result === "Bloqueado" || (!isGoal && !isSave && !isTurnover);

  let bg = "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)";
  let borderColor = "#ffffff";
  let shadow = "0 0 10px rgba(239, 68, 68, 0.95), 0 2px 6px rgba(0, 0, 0, 0.9)";
  let iconSvg = <IconXMark size={12} color="#ffffff" strokeWidth={3} />;
  let label = pt.result || "Fallo";

  if (isGoal) {
    bg = "linear-gradient(135deg, #10b981 0%, #047857 100%)";
    shadow = isSelected
      ? "0 0 18px #10b981, 0 0 0 3px #ffffff, 0 4px 10px rgba(0,0,0,0.95)"
      : "0 0 12px rgba(16, 185, 129, 0.95), 0 2px 6px rgba(0, 0, 0, 0.9)";
    iconSvg = <IconBall size={12} color="#ffffff" />;
    label = "Gol";
  } else if (isSave) {
    bg = "linear-gradient(135deg, #f59e0b 0%, #b45309 100%)";
    shadow = isSelected
      ? "0 0 18px #f59e0b, 0 0 0 3px #ffffff, 0 4px 10px rgba(0,0,0,0.95)"
      : "0 0 12px rgba(245, 158, 11, 0.95), 0 2px 6px rgba(0, 0, 0, 0.9)";
    iconSvg = <IconGlove size={12} color="#ffffff" />;
    label = "Parada";
  } else if (isTurnover) {
    bg = "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)";
    shadow = isSelected
      ? "0 0 18px #8b5cf6, 0 0 0 3px #ffffff, 0 4px 10px rgba(0,0,0,0.95)"
      : "0 0 12px rgba(139, 92, 246, 0.95), 0 2px 6px rgba(0, 0, 0, 0.9)";
    iconSvg = <IconTurnover size={11} color="#ffffff" />;
    label = "Pérdida";
  } else if (isFailure) {
    bg = "linear-gradient(135deg, #ff1a1a 0%, #c40000 100%)";
    borderColor = "#ffffff";
    shadow = isSelected
      ? "0 0 20px #ff0000, 0 0 0 3px #ffffff, 0 4px 10px rgba(0,0,0,0.95)"
      : "0 0 14px #ff0000, 0 0 4px #ffffff, 0 3px 8px rgba(0,0,0,0.95)";
    iconSvg = <IconXMark size={13} color="#ffffff" strokeWidth={3.2} />;
    label = `${pt.result || "Fallo"} (Fuera/Poste)`;
  }

  const tooltip = `${label} — #${pt.player_number || ""} ${pt.player_name || ""}${pt.shot_zone ? ` | Zona: ${pt.shot_zone}` : ""}${pt.goal_zone ? ` ➔ Portería: ${pt.goal_zone}` : ""}`;

  return (
    <div
      title={tooltip}
      onClick={(e) => {
        if (onClick) {
          e.stopPropagation();
          onClick(pt);
        }
      }}
      style={{
        position: "absolute",
        left: `${pt.x}%`,
        top: `${pt.y}%`,
        transform: isSelected
          ? "translate(-50%, -50%) scale(1.45)"
          : "translate(-50%, -50%) scale(1)",
        width: "22px",
        height: "22px",
        borderRadius: "50%",
        background: bg,
        border: `2px solid ${borderColor}`,
        boxShadow: shadow,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        pointerEvents: "auto",
        transition: "all 0.18s cubic-bezier(0.4, 0, 0.2, 1)",
        opacity: isDimmed ? 0.35 : 1,
        zIndex: isSelected ? 12 : 4
      }}
      onMouseEnter={(e) => {
        if (!isSelected) {
          e.currentTarget.style.transform = "translate(-50%, -50%) scale(1.35)";
          e.currentTarget.style.zIndex = "10";
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          e.currentTarget.style.transform = "translate(-50%, -50%) scale(1)";
          e.currentTarget.style.zIndex = "4";
        }
      }}
    >
      {iconSvg}
    </div>
  );
}

/**
 * Visualización Exclusiva de Portería Continua para la Pestaña de Porteros.
 */
export function GoalHeatmapGrid({
  events = [],
  isOpponent = false,
  match = null,
  selectedGkNumber = "all",
  title = "MAPA DE CALOR DE LANZAMIENTOS RECIBIDOS Y RENDIMIENTO EN PORTERÍA"
}) {
  const [metricFilter, setMetricFilter] = useState("all_actions");
  const [showShotMarkers, setShowShotMarkers] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState(null);

  // Filtrar eventos recibidos en portería
  const gkShots = useMemo(() => {
    return (events || []).filter((e) => {
      if (e.event_type !== "shot") return false;
      const isAway = isAwayEvent(e, match);
      const opponentMatch = isOpponent ? isAway : !isAway;
      if (!opponentMatch) return false;
      return matchesGoalkeeper(e, selectedGkNumber);
    });
  }, [events, isOpponent, match, selectedGkNumber]);

  // Conteos para el selector desplegable
  const countAll = gkShots.length;
  const countGoals = gkShots.filter((e) => e.result === "Gol").length;
  const countSaves = gkShots.filter((e) => e.result === "Parada").length;
  const countMisses = gkShots.filter((e) => e.result === "Poste" || e.result === "Fuera" || e.result === "Fallo" || e.result === "Bloqueado").length;

  // Generar puntos continuos
  const goalPoints = useMemo(() => {
    return generateContinuousGoalHeatmapData(gkShots, {
      metricType: metricFilter,
      selectedGoalkeeper: "all"
    });
  }, [gkShots, metricFilter]);

  // Marcadores visibles de portería: si hay uno seleccionado, solo se muestra ese
  const visibleGoalPoints = useMemo(() => {
    if (!selectedEventId) return goalPoints;
    return goalPoints.filter((pt) => pt.id === selectedEventId);
  }, [goalPoints, selectedEventId]);

  const savePct = countAll > 0 ? Math.round((countSaves / countAll) * 100) : 0;

  return (
    <div className="hs-card" style={{ display: "flex", flexDirection: "column", gap: "var(--space-20)" }}>
      {/* CABECERA Y FILTROS PROFESIONALES */}
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "var(--space-12)", borderBottom: "1px solid var(--border-color)", paddingBottom: "var(--space-12)" }}>
        <h4 className="hs-card-title" style={{ margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
          <IconGlove size={18} color="var(--brand-primary)" />
          <span>{title}</span>
        </h4>

        {/* SELECTOR DESPLEGABLE CON ESTILO PROFESIONAL */}
        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "var(--bg-surface)",
              border: "1px solid var(--border-color)",
              borderRadius: "var(--radius-sm)",
              padding: "4px 10px",
              boxShadow: "var(--shadow-sm)"
            }}
          >
            <IconFilter size={14} color="var(--brand-primary)" />
            <span style={{ fontSize: "11px", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Filtro:
            </span>
            <select
              id="gk-heatmap-select"
              value={metricFilter}
              onChange={(e) => {
                setMetricFilter(e.target.value);
                setSelectedEventId(null);
              }}
              style={{
                border: "none",
                background: "transparent",
                color: "var(--text-primary)",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
                outline: "none",
                padding: "2px 4px"
              }}
            >
              <option value="all_actions">Todos los Lanzamientos ({countAll})</option>
              <option value="all_shots">Tiros a Puerta ({countAll})</option>
              <option value="goals">Goles Encajados ({countGoals})</option>
              <option value="saves">Paradas ({countSaves})</option>
              <option value="misses">Fuera / Postes ({countMisses})</option>
            </select>
          </div>

          <button
            type="button"
            className={`btn btn-sm ${showShotMarkers ? "btn-secondary" : "btn-ghost"}`}
            onClick={() => setShowShotMarkers(!showShotMarkers)}
            style={{ fontSize: "11px", fontWeight: 700, padding: "5px 12px", display: "inline-flex", alignItems: "center", gap: "6px" }}
            title="Mostrar u ocultar puntos individuales de tiro"
          >
            <IconMapPin size={13} />
            <span>{showShotMarkers ? "Ocultar Marcadores" : "Ver Marcadores"}</span>
          </button>
        </div>
      </div>

      {/* CONTENEDOR PRINCIPAL DE PORTERÍA */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "var(--space-24)", alignItems: "center" }}>
        {/* GRÁFICO DE PORTERÍA CON MAPA DE CALOR CONTINUO */}
        <div style={{ width: "100%", maxWidth: "560px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "var(--space-10)" }}>
          <div
            style={{
              position: "relative",
              width: "100%",
              aspectRatio: "360 / 220",
              borderRadius: "var(--radius-sm)",
              overflow: "hidden",
              boxShadow: "0 8px 24px rgba(0,0,0,0.45)",
              border: "1px solid rgba(255,255,255,0.12)",
              background: "#081210"
            }}
          >
            {/* 1. Capa SVG Oficial de Portería */}
            <HandballGoalGraphic idPrefix="gk-page-goal" />

            {/* 2. Capa Canvas de Calor Continuo */}
            <ContinuousHeatmapCanvas points={goalPoints} radius={32} blur={0.85} opacity={0.92} />

            {/* 3. Marcadores de Tiro Opcionales */}
            {showShotMarkers && (
              <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 3 }}>
                {visibleGoalPoints.map((pt, idx) => (
                  <ShotMarkerPin
                    key={idx}
                    pt={pt}
                    isSelected={selectedEventId === pt.id}
                    onClick={(p) => setSelectedEventId(selectedEventId === p.id ? null : p.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* TARJETAS RESUMEN DE RENDIMIENTO EN PORTERÍA */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-12)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "var(--space-10)" }}>
            <div style={{ background: "var(--bg-inset)", padding: "var(--space-12)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)", textAlign: "center" }}>
              <span style={{ fontSize: "11px", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", display: "block" }}>
                Total Lanzamientos
              </span>
              <span style={{ fontSize: "22px", fontWeight: 900, fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>
                {countAll}
              </span>
            </div>

            <div style={{ background: "var(--bg-inset)", padding: "var(--space-12)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)", textAlign: "center" }}>
              <span style={{ fontSize: "11px", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", display: "block" }}>
                % Efectividad Paradas
              </span>
              <span style={{ fontSize: "22px", fontWeight: 900, fontFamily: "var(--font-mono)", color: savePct >= 35 ? "#10b981" : savePct >= 28 ? "#f59e0b" : "#ef4444" }}>
                {savePct}%
              </span>
            </div>

            <div style={{ background: "var(--bg-inset)", padding: "var(--space-12)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)", textAlign: "center" }}>
              <span style={{ fontSize: "11px", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", display: "block" }}>
                Paradas Realizadas
              </span>
              <span style={{ fontSize: "20px", fontWeight: 900, fontFamily: "var(--font-mono)", color: "#10b981" }}>
                {countSaves}
              </span>
            </div>

            <div style={{ background: "var(--bg-inset)", padding: "var(--space-12)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)", textAlign: "center" }}>
              <span style={{ fontSize: "11px", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", display: "block" }}>
                Goles Encajados
              </span>
              <span style={{ fontSize: "20px", fontWeight: 900, fontFamily: "var(--font-mono)", color: "#ef4444" }}>
                {countGoals}
              </span>
            </div>
          </div>

          {/* LEYENDA CONTINUA DE CALOR */}
          <div style={{ background: "var(--bg-surface)", padding: "var(--space-12)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)" }}>
            <span style={{ fontSize: "10px", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
              Escala de Densidad Térmica de Lanzamientos
            </span>
            <div
              style={{
                height: "12px",
                borderRadius: "var(--radius-xs)",
                background: "linear-gradient(90deg, #a3e635 0%, #facc15 28%, #f97316 55%, #ef4444 80%, #7f1d1d 100%)",
                boxShadow: "inset 0 1px 2px rgba(0,0,0,0.3)"
              }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px", fontSize: "10px", fontWeight: 700, color: "var(--text-muted)" }}>
              <span>Baja Frecuencia</span>
              <span>Densidad Media</span>
              <span>Máxima Concentración</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Visualización Completa de Ataque / Acumulado (Media Pista + Portería) con Mapas de Calor Continuos
 * y Enlace Interactivo de Marcadores entre Pista y Portería.
 */
export function TacticalHeatmapGrid({
  events = [],
  gkEvents = null,
  isOpponent = false,
  match = null,
  selectedGkNumber = "all",
  selectedPlayerNumber = "all",
  title = "MAPA DE DENSIDAD ESPACIAL Y EFECTIVIDAD EN PISTA Y PORTERÍA"
}) {
  const [metricFilter, setMetricFilter] = useState("all_actions");
  const [showCourtZones, setShowCourtZones] = useState(false);
  const [showShotMarkers, setShowShotMarkers] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState(null);

  // Si gkEvents está presente o isOpponent no está definido (por ejemplo, en TeamsPage acumulado), los eventos ya vienen 100% pre-filtrados para el equipo
  const isPreFiltered = Boolean(gkEvents) || isOpponent === null || isOpponent === undefined;

  // Filtrar eventos de ataque en pista
  const shots = useMemo(() => {
    const rawEvents = events || [];
    if (isPreFiltered) {
      return rawEvents;
    }
    return rawEvents.filter((e) => {
      const isAway = isAwayEvent(e, match);
      const opponentMatch = isOpponent ? isAway : !isAway;
      return opponentMatch;
    });
  }, [events, isPreFiltered, isOpponent, match]);

  // Tiros en portería
  const isGkMode = Boolean(gkEvents);
  const goalShots = useMemo(() => {
    let base = isGkMode
      ? (gkEvents || []).filter((e) => e.event_type === "shot")
      : shots.filter((e) => e.event_type === "shot");

    if (selectedGkNumber && selectedGkNumber !== "all") {
      base = base.filter((e) => matchesGoalkeeper(e, selectedGkNumber));
    }
    return base;
  }, [isGkMode, gkEvents, shots, selectedGkNumber]);

  // Conteos dinámicos para el desplegable
  const countAllActions = shots.length;
  const countAllShots = shots.filter((e) => e.event_type === "shot").length;
  const countGoals = shots.filter((e) => e.event_type === "shot" && e.result === "Gol").length;
  const countSaves = shots.filter((e) => e.event_type === "shot" && e.result === "Parada").length;
  const countMisses = shots.filter((e) => e.event_type === "shot" && (e.result === "Poste" || e.result === "Fuera" || e.result === "Fallo" || e.result === "Bloqueado")).length;
  const countTurnovers = shots.filter((e) => e.event_type === "turnover").length;

  // Generar puntos continuos para la Cancha
  const courtPoints = useMemo(() => {
    return generateContinuousCourtHeatmapData(shots, {
      metricType: metricFilter,
      selectedPlayer: selectedPlayerNumber
    });
  }, [shots, metricFilter, selectedPlayerNumber]);

  // Generar puntos continuos para la Portería
  const goalPoints = useMemo(() => {
    return generateContinuousGoalHeatmapData(goalShots, {
      metricType: metricFilter,
      selectedPlayer: selectedPlayerNumber,
      selectedGoalkeeper: isGkMode ? selectedGkNumber : "all"
    });
  }, [goalShots, metricFilter, selectedPlayerNumber, isGkMode, selectedGkNumber]);

  // Marcadores visibles de Portería:
  // - Si hay una acción seleccionada en pista: SOLO se muestra el marcador de portería que coincide con esa acción (si es tiro) y se ocultan los no relacionados. Si es pérdida, se ocultan todos los marcadores de portería.
  // - Si no hay ninguna acción seleccionada: si el filtro es 'turnovers' se ocultan todos; de lo contrario se muestran todos los marcadores de tiro de portería.
  const visibleGoalPoints = useMemo(() => {
    if (selectedEventId) {
      return goalPoints.filter((pt) => pt.id === selectedEventId);
    }
    if (metricFilter === "turnovers") {
      return [];
    }
    return goalPoints;
  }, [goalPoints, selectedEventId, metricFilter]);

  // Detalle de la acción seleccionada actualmente (si existe)
  const selectedActionDetail = useMemo(() => {
    if (!selectedEventId) return null;
    const fromCourt = courtPoints.find((p) => p.id === selectedEventId);
    const fromGoal = goalPoints.find((p) => p.id === selectedEventId);
    return fromCourt || fromGoal || null;
  }, [selectedEventId, courtPoints, goalPoints]);

  const effPct = countAllShots > 0 ? Math.round((countGoals / countAllShots) * 100) : 0;

  return (
    <div className="hs-card" style={{ display: "flex", flexDirection: "column", gap: "var(--space-20)" }}>
      {/* CABECERA CON TÍTULO Y CONTROLES PROFESIONALES */}
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "var(--space-12)", borderBottom: "1px solid var(--border-color)", paddingBottom: "var(--space-12)" }}>
        <h4 className="hs-card-title" style={{ margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
          <span>{title}</span>
        </h4>

        {/* SELECTOR DESPLEGABLE Y CONMUTADORES CON ESTÉTICA PREMIUM */}
        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          {/* DESPLEGABLE CON CONTENEDOR ESTILIZADO */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "var(--bg-surface)",
              border: "1px solid var(--border-color)",
              borderRadius: "var(--radius-sm)",
              padding: "4px 10px",
              boxShadow: "var(--shadow-sm)"
            }}
          >
            <IconFilter size={14} color="var(--brand-primary)" />
            <span style={{ fontSize: "11px", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Filtro:
            </span>
            <select
              id="tactical-heatmap-select"
              value={metricFilter}
              onChange={(e) => {
                setMetricFilter(e.target.value);
                setSelectedEventId(null);
              }}
              style={{
                border: "none",
                background: "transparent",
                color: "var(--text-primary)",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
                outline: "none",
                padding: "2px 4px"
              }}
            >
              <option value="all_actions">Todas las acciones ({countAllActions})</option>
              <option value="all_shots">Todos los lanzamientos ({countAllShots})</option>
              <option value="goals">Goles ({countGoals})</option>
              <option value="saves">Paradas ({countSaves})</option>
              <option value="misses">Fallos (incl. postes) ({countMisses})</option>
              <option value="turnovers">Pérdidas ({countTurnovers})</option>
            </select>
          </div>

          <button
            type="button"
            className={`btn btn-sm ${showCourtZones ? "btn-secondary" : "btn-ghost"}`}
            onClick={() => setShowCourtZones(!showCourtZones)}
            style={{ fontSize: "11px", fontWeight: 700, padding: "5px 12px", display: "inline-flex", alignItems: "center", gap: "6px" }}
            title="Mostrar u ocultar delimitación de zonas xG"
          >
            <IconLayers size={13} />
            <span>{showCourtZones ? "Ocultar Zonas" : "Ver Zonas"}</span>
          </button>

          <button
            type="button"
            className={`btn btn-sm ${showShotMarkers ? "btn-secondary" : "btn-ghost"}`}
            onClick={() => setShowShotMarkers(!showShotMarkers)}
            style={{ fontSize: "11px", fontWeight: 700, padding: "5px 12px", display: "inline-flex", alignItems: "center", gap: "6px" }}
            title="Mostrar u ocultar marcadores de tiro individuales"
          >
            <IconMapPin size={13} />
            <span>{showShotMarkers ? "Ocultar Marcadores" : "Ver Marcadores"}</span>
          </button>
        </div>
      </div>

      {/* BANNER INFORMATIVO CUANDO HAY UNA ACCIÓN ESPECÍFICA SELECCIONADA */}
      {selectedActionDetail && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
            background: "linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(59, 130, 246, 0.12) 100%)",
            border: "1px solid rgba(16, 185, 129, 0.35)",
            padding: "8px 16px",
            borderRadius: "var(--radius-sm)",
            fontSize: "12px",
            fontWeight: 800
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <span style={{ color: "var(--brand-primary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              🎯 Acción Seleccionada:
            </span>
            <span style={{ color: "var(--text-primary)" }}>
              #{selectedActionDetail.player_number || ""} {selectedActionDetail.player_name || "Jugador"}
            </span>
            <span
              style={{
                padding: "2px 8px",
                borderRadius: "var(--radius-full)",
                background: selectedActionDetail.result === "Gol" ? "#10b981" : selectedActionDetail.result === "Parada" ? "#f59e0b" : selectedActionDetail.event_type === "turnover" ? "#8b5cf6" : "#ef4444",
                color: "#ffffff",
                fontSize: "11px"
              }}
            >
              {selectedActionDetail.result || selectedActionDetail.event_type || "Acción"}
            </span>
            {selectedActionDetail.shot_zone && (
              <span style={{ color: "var(--text-muted)", fontSize: "11px" }}>
                Pista: <strong>{selectedActionDetail.shot_zone}</strong>
              </span>
            )}
            {selectedActionDetail.goal_zone && (
              <span style={{ color: "var(--text-muted)", fontSize: "11px" }}>
                ➔ Portería: <strong>{selectedActionDetail.goal_zone}</strong>
              </span>
            )}
            {selectedActionDetail.match_time_seconds > 0 && (
              <span style={{ color: "var(--text-muted)", fontSize: "11px" }}>
                ⏱ {Math.floor(selectedActionDetail.match_time_seconds / 60)}:{(selectedActionDetail.match_time_seconds % 60).toString().padStart(2, "0")}
              </span>
            )}
          </div>

          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setSelectedEventId(null)}
            style={{ fontSize: "11px", fontWeight: 800, padding: "2px 8px" }}
          >
            ✕ Ver todos los marcadores
          </button>
        </div>
      )}

      {/* AMBOS MAPAS SIEMPRE LADO A LADO */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "var(--space-24)", alignItems: "start" }}>
        {/* BLOQUE 1: MEDIA PISTA DE BALONMANO (400x300) */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-12)", width: "100%" }}>
          <h5 style={{ fontSize: "12px", fontWeight: 900, color: "var(--text-primary)", textTransform: "uppercase", letterSpacing: "0.5px", margin: 0, textAlign: "center", border: "none" }}>
            DENSIDAD TÉRMICA EN MEDIA PISTA ({courtPoints.length} ACCIONES)
          </h5>

          <div
            style={{
              position: "relative",
              width: "100%",
              aspectRatio: "400 / 300",
              borderRadius: "var(--radius-sm)",
              overflow: "hidden",
              boxShadow: "0 8px 24px rgba(0,0,0,0.45)",
              border: "1px solid rgba(255,255,255,0.12)",
              background: "#061c0e"
            }}
          >
            {/* 1. Capa SVG Oficial de Media Pista */}
            <HandballCourtGraphic showZones={showCourtZones} idPrefix="tactical-court" />

            {/* 2. Capa Canvas de Calor Continuo */}
            <ContinuousHeatmapCanvas points={courtPoints} radius={36} blur={0.85} opacity={0.90} />

            {/* 3. Marcadores de Tiro Opcionales */}
            {showShotMarkers && (
              <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 3 }}>
                {courtPoints.map((pt, idx) => (
                  <ShotMarkerPin
                    key={idx}
                    pt={pt}
                    isSelected={selectedEventId === pt.id}
                    isDimmed={Boolean(selectedEventId && selectedEventId !== pt.id)}
                    onClick={(p) => setSelectedEventId(selectedEventId === p.id ? null : p.id)}
                  />
                ))}
              </div>
            )}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", background: "var(--bg-inset)", padding: "var(--space-10) var(--space-16)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)", fontSize: "11px", fontWeight: 800 }}>
            <span>Efectividad en Pista: <strong style={{ color: effPct >= 60 ? "#10b981" : "#f59e0b" }}>{effPct}% ({countGoals}/{countAllShots})</strong></span>
            <span>Pérdidas de Balón: <strong style={{ color: "#ef4444" }}>{countTurnovers}</strong></span>
          </div>
        </div>

        {/* BLOQUE 2: PORTERÍA EN DETALLE (Siempre presente en la vista) */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-12)", width: "100%" }}>
          <h5 style={{ fontSize: "12px", fontWeight: 900, color: "var(--text-primary)", textTransform: "uppercase", letterSpacing: "0.5px", margin: 0, textAlign: "center", border: "none" }}>
            {isGkMode ? `DENSIDAD DE TIROS RECIBIDOS EN PORTERÍA (${goalPoints.length} TIROS)` : `DENSIDAD DE IMPACTO EN PORTERÍA RIVAL (${goalPoints.length} TIROS)`}
          </h5>

          <div
            style={{
              position: "relative",
              width: "100%",
              aspectRatio: "360 / 220",
              borderRadius: "var(--radius-sm)",
              overflow: "hidden",
              boxShadow: "0 8px 24px rgba(0,0,0,0.45)",
              border: "1px solid rgba(255,255,255,0.12)",
              background: "#081210"
            }}
          >
            {/* 1. Capa SVG Oficial de Portería */}
            <HandballGoalGraphic idPrefix="tactical-goal" />

            {/* 2. Capa Canvas de Calor Continuo */}
            <ContinuousHeatmapCanvas points={goalPoints} radius={32} blur={0.85} opacity={0.92} />

            {/* 3. Marcadores de Tiro Opcionales: solo muestra el marcador específico de la acción seleccionada y oculta los no relacionados */}
            {showShotMarkers && (
              <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 3 }}>
                {visibleGoalPoints.map((pt, idx) => (
                  <ShotMarkerPin
                    key={idx}
                    pt={pt}
                    isSelected={selectedEventId === pt.id}
                    onClick={(p) => setSelectedEventId(selectedEventId === p.id ? null : p.id)}
                  />
                ))}
              </div>
            )}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", background: "var(--bg-inset)", padding: "var(--space-10) var(--space-16)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)", fontSize: "11px", fontWeight: 800 }}>
            <span>Goles en Portería: <strong style={{ color: "#10b981" }}>{countGoals}</strong></span>
            <span>Paradas del Portero: <strong style={{ color: "#f59e0b" }}>{countSaves}</strong></span>
          </div>
        </div>
      </div>

      {/* BLOQUE 3: LEYENDA VECTORIAL ELEGANTE Y ESCALA TÉRMICA */}
      <div style={{ width: "100%", paddingTop: "var(--space-12)", borderTop: "1px solid var(--border-color)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", marginBottom: "8px" }}>
          <span style={{ fontSize: "10px", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Leyenda de Marcadores & Densidad Térmica
          </span>
          <div style={{ display: "flex", gap: "14px", alignItems: "center", flexWrap: "wrap", fontSize: "11px", fontWeight: 800 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
              <span style={{ width: "16px", height: "16px", borderRadius: "50%", background: "#10b981", border: "1.5px solid #fff", display: "inline-flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 6px rgba(16, 185, 129, 0.6)" }}>
                <IconBall size={10} color="#ffffff" />
              </span>
              <span>Gol</span>
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
              <span style={{ width: "16px", height: "16px", borderRadius: "50%", background: "#f59e0b", border: "1.5px solid #fff", display: "inline-flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 6px rgba(245, 158, 11, 0.6)" }}>
                <IconGlove size={10} color="#ffffff" />
              </span>
              <span>Parada</span>
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
              <span style={{ width: "16px", height: "16px", borderRadius: "50%", background: "#ff1a1a", border: "1.5px solid #fff", display: "inline-flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 8px #ff0000" }}>
                <IconXMark size={10} color="#ffffff" strokeWidth={3} />
              </span>
              <span>Fallo / Poste</span>
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
              <span style={{ width: "16px", height: "16px", borderRadius: "50%", background: "#8b5cf6", border: "1.5px solid #fff", display: "inline-flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 6px rgba(139, 92, 246, 0.6)" }}>
                <IconTurnover size={9} color="#ffffff" />
              </span>
              <span>Pérdida</span>
            </span>
          </div>
        </div>

        <div
          style={{
            height: "10px",
            borderRadius: "var(--radius-xs)",
            background: "linear-gradient(90deg, #a3e635 0%, #facc15 28%, #f97316 55%, #ef4444 80%, #7f1d1d 100%)",
            boxShadow: "inset 0 1px 2px rgba(0,0,0,0.3)"
          }}
        />

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px", fontSize: "10px", fontWeight: 700, color: "var(--text-muted)" }}>
          <span>Baja Densidad</span>
          <span>Densidad Media</span>
          <span>Máxima Concentración de Acciones</span>
        </div>
      </div>
    </div>
  );
}
