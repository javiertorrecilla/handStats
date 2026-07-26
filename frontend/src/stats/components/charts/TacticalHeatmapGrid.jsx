import React from "react";

/**
 * Función de mapeo de color unificada por rangos de 10% de efectividad.
 */
export function getEfficiencyColor(eff, volumeRatio = 1) {
  let r, g, b;
  if (eff >= 90) { r = 16; g = 185; b = 129; }       // 90-100%: Esmeralda brillante
  else if (eff >= 80) { r = 22; g = 163; b = 74; }   // 80-89%: Verde intenso
  else if (eff >= 70) { r = 34; g = 197; b = 94; }   // 70-79%: Verde claro
  else if (eff >= 60) { r = 132; g = 204; b = 22; }  // 60-69%: Verde lima
  else if (eff >= 50) { r = 217; g = 119; b = 6; }   // 50-59%: Ámbar / Dorado
  else if (eff >= 40) { r = 249; g = 115; b = 22; }  // 40-49%: Naranja
  else if (eff >= 30) { r = 234; g = 88; b = 12; }   // 30-39%: Naranja rojizo
  else if (eff >= 20) { r = 220; g = 38; b = 38; }   // 20-29%: Rojo coral
  else if (eff >= 10) { r = 185; g = 28; b = 28; }   // 10-19%: Rojo oscuro
  else { r = 153; g = 27; b = 27; }                  // 0-9%: Carmesí intenso

  const alpha = 0.35 + volumeRatio * 0.45;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Helper robusto para determinar si un evento pertenece al equipo visitante.
 */
export function isAwayEvent(e, match) {
  if (!e) return false;
  if (e.is_opponent_action === true || e.is_opponent_action === "true") return true;
  if (e.is_opponent === true || e.is_opponent === "true") return true;
  if (e.team === "VISITANTE" || e.team === "away") return true;
  if (match?.away_team && e.team && e.team.toLowerCase() === match.away_team.toLowerCase()) return true;
  return false;
}

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
 * Visualización Exclusiva 3x3 de Portería para la Pestaña de Porteros.
 */
export function GoalHeatmapGrid({
  events = [],
  isOpponent = false,
  match = null,
  selectedGkNumber = "all",
  title = "MAPA TÁCTICO DE LANZAMIENTOS RECIBIDOS Y RENDIMIENTO EN PORTERÍA (3x3)"
}) {
  const shots = (events || []).filter((e) => {
    if (e.event_type !== "shot") return false;
    const isAway = isAwayEvent(e, match);
    const opponentMatch = isOpponent ? isAway : !isAway;
    if (!opponentMatch) return false;
    return matchesGoalkeeper(e, selectedGkNumber);
  });

  const goalGrid = {
    TL: { shots: 0, goals: 0 }, TC: { shots: 0, goals: 0 }, TR: { shots: 0, goals: 0 },
    ML: { shots: 0, goals: 0 }, C: { shots: 0, goals: 0 }, MR: { shots: 0, goals: 0 },
    BL: { shots: 0, goals: 0 }, BC: { shots: 0, goals: 0 }, BR: { shots: 0, goals: 0 }
  };

  let maxShotsInGoalCell = 1;

  shots.forEach((s) => {
    const goalZone = s.target_zone;
    const isGoal = s.result === "Gol";
    if (goalZone && goalGrid[goalZone]) {
      goalGrid[goalZone].shots += 1;
      if (isGoal) goalGrid[goalZone].goals += 1;
      if (goalGrid[goalZone].shots > maxShotsInGoalCell) {
        maxShotsInGoalCell = goalGrid[goalZone].shots;
      }
    }
  });

  const goalZoneLabels = {
    TL: "Sup. Izq", TC: "Sup. Cen", TR: "Sup. Der",
    ML: "Med. Izq", C: "Centro", MR: "Med. Der",
    BL: "Inf. Izq", BC: "Inf. Cen", BR: "Inf. Der"
  };

  const colorRanges = [
    { label: "0-9%", range: 5 },
    { label: "10-19%", range: 15 },
    { label: "20-29%", range: 25 },
    { label: "30-39%", range: 35 },
    { label: "40-49%", range: 45 },
    { label: "50-59%", range: 55 },
    { label: "60-69%", range: 65 },
    { label: "70-79%", range: 75 },
    { label: "80-89%", range: 85 },
    { label: "90-100%", range: 95 }
  ];

  return (
    <div className="hs-card" style={{ display: "flex", flexDirection: "column", gap: "var(--space-20)" }}>
      {/* TÍTULO PRINCIPAL CON LÍNEA DIVISORIA INFERIOR */}
      <h4 className="hs-card-title">
        {title}
      </h4>

      {/* MARCO DE PORTERÍA (3X3) */}
      <div
        className="hs-goal-frame-box"
        style={{
          maxWidth: "460px",
          width: "100%",
          aspectRatio: "1 / 1",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gridTemplateRows: "repeat(3, 1fr)",
          gap: "6px"
        }}
      >
        {["TL", "TC", "TR", "ML", "C", "MR", "BL", "BC", "BR"].map((zKey) => {
          const cell = goalGrid[zKey] || { shots: 0, goals: 0 };
          const saves = cell.shots - cell.goals;
          const savePct = cell.shots > 0 ? Math.round((saves / cell.shots) * 100) : 0;
          const volumeRatio = Math.min(1, cell.shots / maxShotsInGoalCell);

          const bgStyle = cell.shots > 0
            ? getEfficiencyColor(savePct, volumeRatio)
            : "rgba(241, 245, 249, 0.45)";

          return (
            <div
              key={zKey}
              style={{
                background: bgStyle,
                border: `1px solid ${cell.shots > 0 ? "rgba(15, 23, 42, 0.2)" : "var(--border-color)"}`,
                borderRadius: "var(--radius-xs)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "var(--space-12)",
                color: "#0f172a",
                boxShadow: cell.shots > 0 ? "0 4px 10px rgba(0,0,0,0.08)" : "none",
                transition: "all 0.2s ease"
              }}
            >
              {cell.shots > 0 ? (
                <>
                  <span style={{ fontSize: "17px", fontWeight: 900, fontFamily: "var(--font-mono)" }}>
                    {saves}/{cell.shots}
                  </span>
                  <span style={{ fontSize: "12px", fontWeight: 800, marginTop: "2px" }}>
                    {savePct}% Paradas
                  </span>
                </>
              ) : (
                <span style={{ fontSize: "12px", fontWeight: 800, color: "#64748b" }}>
                  {goalZoneLabels[zKey]}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* ESCALA DE COLOR EN 1 LÍNEA HORIZONTAL CON ESPACIO AMPLIO SUPERIOR */}
      <div style={{ width: "100%", paddingTop: "var(--space-24)" }}>
        <h6 style={{ fontSize: "10px", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "var(--space-10)", textAlign: "center" }}>
          ESCALA DE EFECTIVIDAD EN PARADAS (RANGOS DE 10%)
        </h6>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: "4px", textAlign: "center" }}>
          {colorRanges.map((item, idx) => (
            <div
              key={idx}
              style={{
                background: getEfficiencyColor(item.range, 0.9),
                borderRadius: "var(--radius-xs)",
                padding: "6px 2px",
                color: "#fff",
                fontSize: "9px",
                fontWeight: 800,
                textShadow: "0 1px 2px rgba(0,0,0,0.8)",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                whiteSpace: "nowrap",
                overflow: "hidden"
              }}
            >
              {item.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Visualización Completa de Ataque (Cancha) + Portería (Rival o Paradas del Equipo).
 */
export function TacticalHeatmapGrid({
  events = [],
  gkEvents = null,
  isOpponent = false,
  match = null,
  selectedGkNumber = "all",
  title = "ANÁLISIS DE DENSIDAD ESPACIAL Y EFICIENCIA DE TIRO Y PORTERÍA"
}) {
  // Tiros de ataque sobre el campo de cada equipo
  const shots = (events || []).filter((e) => {
    if (e.event_type !== "shot") return false;
    const isAway = isAwayEvent(e, match);
    const opponentMatch = isOpponent ? isAway : !isAway;
    return opponentMatch;
  });

  // Tiros recibidos en portería para el mapa 3x3
  const isGkMode = Boolean(gkEvents);
  let goalShots = isGkMode
    ? (gkEvents || []).filter((e) => e.event_type === "shot")
    : shots;

  if (selectedGkNumber && selectedGkNumber !== "all") {
    goalShots = goalShots.filter((e) => matchesGoalkeeper(e, selectedGkNumber));
  }

  const rows = ["EXT", "PIV", "PEN", "9M", "10L"];

  const rowTooltips = {
    EXT: "EXT — Extremos (6m)",
    PIV: "PIV — Pivote (6m)",
    PEN: "PEN — Penetración (6m)",
    "9M": "9M — Primera Línea (9m)",
    "10L": "10L — Transición (1ª Oleada)"
  };

  const grid = {
    EXT: { izq: { shots: 0, goals: 0 }, der: { shots: 0, goals: 0 } },
    PIV: { muy_izq: { shots: 0, goals: 0 }, izq: { shots: 0, goals: 0 }, cen: { shots: 0, goals: 0 }, der: { shots: 0, goals: 0 }, muy_der: { shots: 0, goals: 0 } },
    PEN: { muy_izq: { shots: 0, goals: 0 }, izq: { shots: 0, goals: 0 }, cen: { shots: 0, goals: 0 }, der: { shots: 0, goals: 0 }, muy_der: { shots: 0, goals: 0 } },
    "9M": { muy_izq: { shots: 0, goals: 0 }, izq: { shots: 0, goals: 0 }, cen: { shots: 0, goals: 0 }, der: { shots: 0, goals: 0 }, muy_der: { shots: 0, goals: 0 } },
    "10L": { izq: { shots: 0, goals: 0 }, cen: { shots: 0, goals: 0 }, der: { shots: 0, goals: 0 } }
  };

  const goalGrid = {
    TL: { shots: 0, goals: 0 }, TC: { shots: 0, goals: 0 }, TR: { shots: 0, goals: 0 },
    ML: { shots: 0, goals: 0 }, C: { shots: 0, goals: 0 }, MR: { shots: 0, goals: 0 },
    BL: { shots: 0, goals: 0 }, BC: { shots: 0, goals: 0 }, BR: { shots: 0, goals: 0 }
  };

  const special = {
    sevenM: { shots: 0, goals: 0 }
  };

  let maxShotsInCell = 1;
  let maxShotsInGoalCell = 1;

  // Procesar tiros en cancha (Ataque)
  shots.forEach((s) => {
    const type = (s.shot_type || "").toLowerCase();
    const pos = (s.shot_position || s.target_zone || "").toLowerCase();
    const isGoal = s.result === "Gol";

    if (!isGkMode) {
      const goalZone = s.target_zone;
      if (goalZone && goalGrid[goalZone]) {
        goalGrid[goalZone].shots += 1;
        if (isGoal) goalGrid[goalZone].goals += 1;
        if (goalGrid[goalZone].shots > maxShotsInGoalCell) {
          maxShotsInGoalCell = goalGrid[goalZone].shots;
        }
      }
    }

    if (type.includes("7m") || type.includes("penalti")) {
      special.sevenM.shots += 1;
      if (isGoal) special.sevenM.goals += 1;
      return;
    }

    let row = "9M";
    if (type.includes("extremo")) row = "EXT";
    else if (type.includes("pivote")) row = "PIV";
    else if (type.includes("penetración") || type.includes("6m")) row = "PEN";
    else if (type.includes("exterior") || type.includes("9m") || type.includes("distancia")) row = "9M";
    else if (type.includes("contraataque") || type.includes("10m") || type.includes("oleada") || type.includes("transición") || type.includes("campo")) row = "10L";

    let col = "cen";
    if (pos.includes("muy izq") || pos.includes("muy izquierda")) col = "muy_izq";
    else if (pos.includes("muy der") || pos.includes("muy derecha")) col = "muy_der";
    else if (pos.includes("izq") || pos.includes("izquierda")) col = "izq";
    else if (pos.includes("der") || pos.includes("derecha")) col = "der";
    else col = "cen";

    if (row === "EXT") {
      if (col === "muy_izq" || col === "izq" || col === "cen") col = "izq";
      else col = "der";
    } else if (row === "10L") {
      if (col === "muy_izq" || col === "izq") col = "izq";
      else if (col === "muy_der" || col === "der") col = "der";
      else col = "cen";
    }

    if (grid[row] && grid[row][col]) {
      grid[row][col].shots += 1;
      if (isGoal) grid[row][col].goals += 1;
      if (grid[row][col].shots > maxShotsInCell) {
        maxShotsInCell = grid[row][col].shots;
      }
    }
  });

  // Procesar tiros en portería en modo Porteros si se pasa gkEvents
  if (isGkMode) {
    goalShots.forEach((s) => {
      const goalZone = s.target_zone;
      const isGoal = s.result === "Gol";
      if (goalZone && goalGrid[goalZone]) {
        goalGrid[goalZone].shots += 1;
        if (isGoal) goalGrid[goalZone].goals += 1;
        if (goalGrid[goalZone].shots > maxShotsInGoalCell) {
          maxShotsInGoalCell = goalGrid[goalZone].shots;
        }
      }
    });
  }

  const getCellBg = (cell, isGoal = false) => {
    if (!cell || cell.shots === 0) {
      return "rgba(241, 245, 249, 0.45)";
    }

    const eff = isGoal && isGkMode
      ? Math.round(((cell.shots - cell.goals) / cell.shots) * 100)
      : Math.round((cell.goals / cell.shots) * 100);

    const maxVal = isGoal ? maxShotsInGoalCell : maxShotsInCell;
    const volumeRatio = Math.min(1, cell.shots / maxVal);

    return getEfficiencyColor(eff, volumeRatio);
  };

  const sevenMEff = special.sevenM.shots > 0 ? Math.round((special.sevenM.goals / special.sevenM.shots) * 100) : 0;

  const colorRanges = [
    { label: "0-9%", range: 5 },
    { label: "10-19%", range: 15 },
    { label: "20-29%", range: 25 },
    { label: "30-39%", range: 35 },
    { label: "40-49%", range: 45 },
    { label: "50-59%", range: 55 },
    { label: "60-69%", range: 65 },
    { label: "70-79%", range: 75 },
    { label: "80-89%", range: 85 },
    { label: "90-100%", range: 95 }
  ];

  const goalZoneLabels = {
    TL: "Sup. Izq", TC: "Sup. Cen", TR: "Sup. Der",
    ML: "Med. Izq", C: "Centro", MR: "Med. Der",
    BL: "Inf. Izq", BC: "Inf. Cen", BR: "Inf. Der"
  };

  const renderCellContent = (cell) => {
    if (!cell || cell.shots === 0) {
      return (
        <span style={{ fontSize: "15px", fontWeight: 700, color: "#64748b" }}>0</span>
      );
    }

    const eff = Math.round((cell.goals / cell.shots) * 100);

    return (
      <>
        <span style={{ fontSize: "18px", fontWeight: 900, fontFamily: "var(--font-mono)", lineHeight: "1.1", color: "#0f172a" }}>{cell.shots}</span>
        <span style={{ fontSize: "11px", fontWeight: 800, marginTop: "2px", color: "#0f172a" }}>{cell.goals}/{cell.shots}</span>
        <span style={{ fontSize: "10px", fontWeight: 800, color: "#0f172a" }}>({eff}%)</span>
      </>
    );
  };

  return (
    <div className="hs-card" style={{ display: "flex", flexDirection: "column", gap: "var(--space-20)" }}>
      {/* TÍTULO PRINCIPAL CON LÍNEA DIVISORIA INFERIOR */}
      <h4 className="hs-card-title">
        {title}
      </h4>

      {/* AMBOS MAPAS LADO A LADO */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "var(--space-24)", alignItems: "start" }}>
        {/* BLOQUE 1: MAPA ESPACIAL EN CANCHA */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-12)", width: "100%" }}>
          <h5 style={{ fontSize: "12px", fontWeight: 900, color: "var(--text-primary)", textTransform: "uppercase", letterSpacing: "0.5px", margin: 0, textAlign: "center", border: "none" }}>
            DENSIDAD ESPACIAL Y EFECTIVIDAD POR ZONA DE CANCHA
          </h5>

          {/* HEADER DE 5 COLUMNAS */}
          <div style={{ display: "grid", gridTemplateColumns: "55px repeat(5, 1fr)", gap: "6px", textAlign: "center", fontSize: "11px", fontWeight: 900, color: "var(--text-muted)", textTransform: "uppercase" }}>
            <div></div>
            <div>MUY IZQ</div>
            <div>IZQUIERDA</div>
            <div>CENTRO</div>
            <div>DERECHA</div>
            <div>MUY DER</div>
          </div>

          {/* ETIQUETAS + CANCHA DE ASPECT RATIO 1:1 */}
          <div style={{ display: "grid", gridTemplateColumns: "55px 1fr", gap: "6px", alignItems: "stretch" }}>
            {/* ETIQUETAS LATERALES DE LAS FILAS */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {rows.map((rKey) => (
                <div
                  key={rKey}
                  title={rowTooltips[rKey]}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "var(--radius-xs)",
                    fontSize: "11px",
                    fontWeight: 900,
                    color: "var(--text-primary)",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    flex: 1
                  }}
                >
                  {rKey}
                </div>
              ))}
            </div>

            {/* CONTENEDOR DE CELDAS CON ASPECT RATIO 1:1 Y FONDO BLANCO */}
            <div style={{ position: "relative", width: "100%", aspectRatio: "1 / 1", borderRadius: "var(--radius)", overflow: "hidden", border: "2px solid #000000", boxShadow: "0 4px 12px rgba(0,0,0,0.15)", background: "#ffffff" }}>
              {/* SVG PISTA BLANCA CON LÍNEAS NEGRAS */}
              <svg
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                style={{
                  width: "100%",
                  height: "100%",
                  position: "absolute",
                  top: 0,
                  left: 0,
                  pointerEvents: "none",
                  zIndex: 0
                }}
              >
                <rect x="0" y="0" width="100" height="100" fill="#ffffff" />
                <rect x="0.5" y="0.5" width="99" height="99" fill="none" stroke="#000000" strokeWidth="2" />
                <line x1="38" y1="0" x2="62" y2="0" stroke="#000000" strokeWidth="6" />
                <line x1="38" y1="0" x2="62" y2="0" stroke="#ef4444" strokeWidth="6" strokeDasharray="4 4" />
                <rect x="36" y="0" width="4" height="4" fill="#000000" />
                <rect x="60" y="0" width="4" height="4" fill="#000000" />
                <path
                  d="M 0 0 C 0 40, 100 40, 100 0"
                  fill="rgba(16, 185, 129, 0.05)"
                  stroke="#000000"
                  strokeWidth="2.5"
                />
                <line x1="44" y1="16" x2="56" y2="16" stroke="#000000" strokeWidth="3" />
                <line x1="43" y1="38" x2="57" y2="38" stroke="#000000" strokeWidth="3.5" />
                <path
                  d="M 0 20 C 0 60, 100 60, 100 20"
                  fill="none"
                  stroke="#000000"
                  strokeWidth="2.5"
                  strokeDasharray="5 4"
                />
                <line x1="0" y1="99.5" x2="100" y2="99.5" stroke="#000000" strokeWidth="2.5" />
              </svg>

              {/* MATRIZ DE CELDAS CON BORDES DEFINIDOS */}
              <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: "4px", position: "relative", zIndex: 1, padding: "2px" }}>
                {/* FILA 1: EXT */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "4px", flex: 1 }}>
                  <div
                    style={{
                      gridColumn: "span 2",
                      background: getCellBg(grid.EXT.izq),
                      border: "1px solid rgba(15, 23, 42, 0.18)",
                      borderRadius: "var(--radius-xs)",
                      padding: "var(--space-4)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      backdropFilter: "blur(1px)",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                      transition: "all 0.2s ease"
                    }}
                  >
                    {renderCellContent(grid.EXT.izq)}
                  </div>

                  <div
                    style={{
                      gridColumn: "span 1",
                      background: "rgba(241, 245, 249, 0.5)",
                      border: "1px dashed rgba(15, 23, 42, 0.15)",
                      borderRadius: "var(--radius-xs)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: 0.6,
                      color: "#64748b",
                      fontSize: "14px",
                      fontWeight: 700
                    }}
                  >
                    -
                  </div>

                  <div
                    style={{
                      gridColumn: "span 2",
                      background: getCellBg(grid.EXT.der),
                      border: "1px solid rgba(15, 23, 42, 0.18)",
                      borderRadius: "var(--radius-xs)",
                      padding: "var(--space-4)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      backdropFilter: "blur(1px)",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                      transition: "all 0.2s ease"
                    }}
                  >
                    {renderCellContent(grid.EXT.der)}
                  </div>
                </div>

                {/* FILA 2: PIV */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "4px", flex: 1 }}>
                  {["muy_izq", "izq", "cen", "der", "muy_der"].map((cKey) => {
                    const cell = grid.PIV[cKey];
                    return (
                      <div
                        key={cKey}
                        style={{
                          background: getCellBg(cell),
                          border: "1px solid rgba(15, 23, 42, 0.18)",
                          borderRadius: "var(--radius-xs)",
                          padding: "var(--space-4)",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          backdropFilter: "blur(1px)",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                          transition: "all 0.2s ease"
                        }}
                      >
                        {renderCellContent(cell)}
                      </div>
                    );
                  })}
                </div>

                {/* FILA 3: PEN */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "4px", flex: 1 }}>
                  {["muy_izq", "izq", "cen", "der", "muy_der"].map((cKey) => {
                    const cell = grid.PEN[cKey];
                    return (
                      <div
                        key={cKey}
                        style={{
                          background: getCellBg(cell),
                          border: "1px solid rgba(15, 23, 42, 0.18)",
                          borderRadius: "var(--radius-xs)",
                          padding: "var(--space-4)",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          backdropFilter: "blur(1px)",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                          transition: "all 0.2s ease"
                        }}
                      >
                        {renderCellContent(cell)}
                      </div>
                    );
                  })}
                </div>

                {/* FILA 4: 9M */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "4px", flex: 1 }}>
                  {["muy_izq", "izq", "cen", "der", "muy_der"].map((cKey) => {
                    const cell = grid["9M"][cKey];
                    return (
                      <div
                        key={cKey}
                        style={{
                          background: getCellBg(cell),
                          border: "1px solid rgba(15, 23, 42, 0.18)",
                          borderRadius: "var(--radius-xs)",
                          padding: "var(--space-4)",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          backdropFilter: "blur(1px)",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                          transition: "all 0.2s ease"
                        }}
                      >
                        {renderCellContent(cell)}
                      </div>
                    );
                  })}
                </div>

                {/* FILA 5: 10L */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "4px", flex: 1 }}>
                  <div
                    style={{
                      gridColumn: "span 2",
                      background: getCellBg(grid["10L"].izq),
                      border: "1px solid rgba(15, 23, 42, 0.18)",
                      borderRadius: "var(--radius-xs)",
                      padding: "var(--space-4)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      backdropFilter: "blur(1px)",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                      transition: "all 0.2s ease"
                    }}
                  >
                    {renderCellContent(grid["10L"].izq)}
                  </div>

                  <div
                    style={{
                      gridColumn: "span 1",
                      background: getCellBg(grid["10L"].cen),
                      border: "1px solid rgba(15, 23, 42, 0.18)",
                      borderRadius: "var(--radius-xs)",
                      padding: "var(--space-4)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      backdropFilter: "blur(1px)",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                      transition: "all 0.2s ease"
                    }}
                  >
                    {renderCellContent(grid["10L"].cen)}
                  </div>

                  <div
                    style={{
                      gridColumn: "span 2",
                      background: getCellBg(grid["10L"].der),
                      border: "1px solid rgba(15, 23, 42, 0.18)",
                      borderRadius: "var(--radius-xs)",
                      padding: "var(--space-4)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      backdropFilter: "blur(1px)",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                      transition: "all 0.2s ease"
                    }}
                  >
                    {renderCellContent(grid["10L"].der)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* BARRA INFERIOR DE TIROS DE 7M */}
          <div style={{ background: "var(--bg-inset)", padding: "var(--space-12) var(--space-16)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)", textAlign: "center" }}>
            <span style={{ fontSize: "11px", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", display: "block" }}>Tiros de 7m (Penaltis)</span>
            <span style={{ fontSize: "var(--text-sm)", fontWeight: 900, color: "var(--color-primary)" }}>
              {special.sevenM.goals}/{special.sevenM.shots} ({sevenMEff}%)
            </span>
          </div>
        </div>

        {/* BLOQUE 2: MARCO DE PORTERÍA (3X3) */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-12)", width: "100%" }}>
          <h5 style={{ fontSize: "12px", fontWeight: 900, color: "var(--text-primary)", textTransform: "uppercase", letterSpacing: "0.5px", margin: 0, textAlign: "center", border: "none" }}>
            {isGkMode ? "RENDIMIENTO Y PARADAS DE LOS PORTEROS DEL EQUIPO (3x3)" : "MAPA DE IMPACTO Y EFICIENCIA EN PORTERÍA RIVAL (3x3)"}
          </h5>

          {/* ESPACIADOR DE ALINEACIÓN DE CABECERA IGUAL AL HEADER DE 5 COLUMNAS */}
          <div style={{ height: "17px" }}></div>

          {/* MARCO DE PORTERÍA DE PROPORCIÓN 1:1 */}
          <div style={{ display: "grid", gridTemplateColumns: "55px 1fr", gap: "6px", alignItems: "stretch" }}>
            <div style={{ opacity: 0 }}></div>
            <div
              className="hs-goal-frame-box"
              style={{
                width: "100%",
                aspectRatio: "1 / 1",
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gridTemplateRows: "repeat(3, 1fr)",
                gap: "6px",
                padding: "2px",
                margin: 0,
                maxWidth: "none"
              }}
            >
              {["TL", "TC", "TR", "ML", "C", "MR", "BL", "BC", "BR"].map((zKey) => {
                const cell = goalGrid[zKey] || { shots: 0, goals: 0 };
                const isGk = isGkMode;
                const saves = cell.shots - cell.goals;
                const eff = cell.shots > 0 ? (isGk ? Math.round((saves / cell.shots) * 100) : Math.round((cell.goals / cell.shots) * 100)) : 0;
                const bgStyle = getCellBg(cell, true);

                return (
                  <div
                    key={zKey}
                    style={{
                      background: bgStyle,
                      border: `1px solid ${cell.shots > 0 ? "rgba(15, 23, 42, 0.2)" : "var(--border-color)"}`,
                      borderRadius: "var(--radius-xs)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "var(--space-10)",
                      color: "#0f172a",
                      boxShadow: cell.shots > 0 ? "0 4px 10px rgba(0,0,0,0.08)" : "none",
                      transition: "all 0.2s ease"
                    }}
                  >
                    <span style={{ fontSize: "18px", fontWeight: 900, fontFamily: "var(--font-mono)" }}>
                      {isGk ? `${saves}/${cell.shots}` : `${cell.goals}/${cell.shots}`}
                    </span>
                    <span style={{ fontSize: "13px", fontWeight: 800, marginTop: "4px" }}>
                      {cell.shots > 0 ? `${eff}% ${isGk ? "Paradas" : ""}` : goalZoneLabels[zKey]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* BLOQUE 3: LEYENDA UNIFICADA DE COLOR EN RANGOS DE 10% CON ESPACIO AMPLIO SUPERIOR */}
      <div style={{ width: "100%", paddingTop: "var(--space-24)" }}>
        <h6 style={{ fontSize: "10px", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "var(--space-10)", textAlign: "center" }}>
          {isGkMode ? "ESCALA DE EFECTIVIDAD EN PARADAS DE PORTERÍA (RANGOS DE 10%)" : "ESCALA DE COLOR UNIFICADA POR EFECTIVIDAD (RANGOS DE 10%)"}
        </h6>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: "4px", textAlign: "center" }}>
          {colorRanges.map((item, idx) => (
            <div
              key={idx}
              style={{
                background: getEfficiencyColor(item.range, 0.9),
                borderRadius: "var(--radius-xs)",
                padding: "6px 2px",
                color: "#fff",
                fontSize: "9px",
                fontWeight: 800,
                textShadow: "0 1px 2px rgba(0,0,0,0.8)",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                whiteSpace: "nowrap",
                overflow: "hidden"
              }}
            >
              {item.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
