import React, { useState, useEffect } from "react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { useAuth } from "../../../context/AuthContext";
import userService from "../../../services/userService";
import logoHorizontal from "../../../assets/logoHorizontal.png";
import isotipo from "../../../assets/isotipo.png";
import { HandballCourtGraphic } from "../charts/HandballCourtGraphic";
import { HandballGoalGraphic } from "../charts/HandballGoalGraphic";
import { ContinuousHeatmapCanvas } from "../charts/ContinuousHeatmapCanvas";
import {
  generateContinuousCourtHeatmapData,
  generateContinuousGoalHeatmapData
} from "../../engine/heatmapEngine";
import {
  IconPrinter,
  IconLock,
  IconCheck,
  IconFileText,
  IconShield,
  IconTarget,
  IconUsers,
  IconActivity,
  IconTrendingUp,
  IconTurnover,
  IconBarChart,
  IconSliders,
  IconStar,
  IconCheckCircle,
  IconDownload,
  IconZap,
  IconFileCheck
} from "../common/Icons";

/**
 * Cabecera de Sección Visualmente Destacada para el Informe PDF
 * Diseñada para máxima legibilidad, contraste y elegancia profesional.
 */
function PDFSectionHeader({ title, subtitle, tag, tagColor = "#12843A" }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        paddingBottom: "8px",
        borderBottom: "2px solid #E5E7EB",
        marginBottom: "2px"
      }}
    >
      {/* Título Principal con Acento Visual */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div
          style={{
            width: "4px",
            height: "26px",
            borderRadius: "2px",
            background: tagColor || "#12843A",
            flexShrink: 0
          }}
        />
        <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
          <h3
            style={{
              fontSize: "14px",
              fontWeight: 900,
              color: "#0C1B13",
              margin: 0,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              fontFamily: "'Raleway', 'Montserrat', sans-serif",
              lineHeight: "1.2"
            }}
          >
            {title}
          </h3>
          {subtitle && (
            <span style={{ fontSize: "9.5px", fontWeight: 700, color: "#6B7280" }}>
              {subtitle}
            </span>
          )}
        </div>
      </div>

      {/* Tag de Categoría / Métrica */}
      {tag && (
        <div
          style={{
            fontSize: "9px",
            fontWeight: 900,
            color: tagColor,
            background: `${tagColor}14`,
            border: `1px solid ${tagColor}35`,
            padding: "3px 9px",
            borderRadius: "4px",
            letterSpacing: "0.6px",
            textTransform: "uppercase"
          }}
        >
          {tag}
        </div>
      )}
    </div>
  );
}

/**
 * Clasifica un evento de lanzamiento en una de las 6 zonas requeridas:
 * 1. Extremo (wing)
 * 2. Primera Línea / 9m (backcourt)
 * 3. Pivote (pivot)
 * 4. Penetración (penetration)
 * 5. Contraataque (fast break)
 * 6. 7 Metros (7-meter throw)
 */
function classifyShotZone(shot) {
  const type = String(shot.shot_type || "").toLowerCase();
  const zone = String(shot.shot_zone || shot.court_zone || shot.target_zone || shot.shot_position || "").toLowerCase();
  const phase = String(shot.play_phase || "").toLowerCase();

  // 1. 7 Metros (7-meter throw / Penalti)
  if (type.includes("7m") || type.includes("7 metros") || zone.includes("7m") || zone.includes("7 metros") || zone.includes("penalti")) {
    return "7m";
  }

  // 2. Contraataque (Fast break / 1ª Oleada)
  if (type.includes("contra") || phase.includes("contra") || phase.includes("1ª oleada") || zone.includes("contra")) {
    return "fastbreak";
  }

  // 3. Penetración (Penetration)
  if (shot.is_penetration || type.includes("penetr") || zone.includes("penetr")) {
    return "penetration";
  }

  // 4. Extremo (Wing - Extremo Izquierdo / Derecho / 6m Lateral)
  if (type.includes("extremo") || zone.includes("extremo") || zone.includes("lateral 6m") || zone.includes("corner") || zone.includes("ext_izq") || zone.includes("ext_der")) {
    return "wing";
  }

  // 5. Pivote (Pivot - 6m central)
  if (type.includes("pivote") || zone.includes("pivote") || zone.includes("6m pivote") || zone.includes("6m centro") || (zone.includes("6m") && !zone.includes("extremo") && !zone.includes("penetr"))) {
    return "pivot";
  }

  // 6. Primera Línea / 9 Metros (Backcourt)
  return "backcourt";
}

/**
 * Calcula el desglose de lanzamientos, goles, eficacia y volumen por zona para ambos equipos
 */
function getTeamShotZonesData(match) {
  const events = match?.events || [];

  const homeShots = events.filter((ev) => ev.event_type === "shot" && !ev.is_opponent_action);
  const awayShots = events.filter((ev) => ev.event_type === "shot" && ev.is_opponent_action);

  const zonesConfig = [
    { key: "wing", label: "Extremo", shortLabel: "Extremo", desc: "Lanzamientos desde los extremos de pista" },
    { key: "backcourt", label: "Primera Línea (9m)", shortLabel: "9 Metros", desc: "Lanzamiento exterior y a distancia" },
    { key: "pivot", label: "Pivote", shortLabel: "Pivote", desc: "Lanzamientos desde 6m centro de pivote" },
    { key: "penetration", label: "Penetración", shortLabel: "Penetración", desc: "Acciones de penetración y uno contra uno" },
    { key: "fastbreak", label: "Contraataque", shortLabel: "Contraataque", desc: "Transiciones y 1ª oleada rápida" },
    { key: "7m", label: "7 Metros", shortLabel: "7 Metros", desc: "Lanzamientos de penalti" }
  ];

  const countForTeam = (shotsList) => {
    const counts = {
      wing: { shots: 0, goals: 0 },
      backcourt: { shots: 0, goals: 0 },
      pivot: { shots: 0, goals: 0 },
      penetration: { shots: 0, goals: 0 },
      fastbreak: { shots: 0, goals: 0 },
      "7m": { shots: 0, goals: 0 }
    };

    shotsList.forEach((s) => {
      const z = classifyShotZone(s);
      if (counts[z]) {
        counts[z].shots += 1;
        if (s.result === "Gol") counts[z].goals += 1;
      }
    });

    return counts;
  };

  const homeCounts = countForTeam(homeShots);
  const awayCounts = countForTeam(awayShots);

  const totalHomeShots = Math.max(1, homeShots.length);
  const totalAwayShots = Math.max(1, awayShots.length);

  return zonesConfig.map((z) => {
    const h = homeCounts[z.key];
    const a = awayCounts[z.key];

    const homeEff = h.shots > 0 ? Math.round((h.goals / h.shots) * 100) : 0;
    const awayEff = a.shots > 0 ? Math.round((a.goals / a.shots) * 100) : 0;

    const homeVolPct = Math.round((h.shots / totalHomeShots) * 100);
    const awayVolPct = Math.round((a.shots / totalAwayShots) * 100);

    return {
      key: z.key,
      label: z.label,
      shortLabel: z.shortLabel,
      desc: z.desc,
      homeGoals: h.goals,
      homeShots: h.shots,
      homeEff,
      homeVolPct,
      awayGoals: a.goals,
      awayShots: a.shots,
      awayEff,
      awayVolPct
    };
  });
}

/**
 * Clasifica y calcula las métricas por Fase de Juego para ambos equipos:
 * Posicional y Contraataque / 1ª Oleada
 * Métricas: Tiros, Goles, % Gol, 7 Metros, Pérdidas, % de Ataque
 */
function getGamePhaseStatsData(match) {
  const events = match?.events || [];

  const homeEvents = events.filter((ev) => !ev.is_opponent_action);
  const awayEvents = events.filter((ev) => ev.is_opponent_action);

  const calculatePhases = (teamEvents) => {
    const data = {
      positional: {
        key: "positional",
        label: "Ataque Posicional",
        shots: 0,
        goals: 0,
        sevenMeters: 0,
        turnovers: 0
      },
      fastbreak: {
        key: "fastbreak",
        label: "Contraataque / 1ª Oleada",
        shots: 0,
        goals: 0,
        sevenMeters: 0,
        turnovers: 0
      }
    };

    teamEvents.forEach((ev) => {
      const type = String(ev.shot_type || "").toLowerCase();
      const phase = String(ev.play_phase || ev.phase || "").toLowerCase();

      // Clasificar en Contraataque / 1ª Oleada vs Posicional
      const isFastbreak =
        phase.includes("1ª") ||
        phase.includes("1a") ||
        phase.includes("primera") ||
        phase.includes("contra") ||
        type.includes("contra");

      const target = isFastbreak ? data.fastbreak : data.positional;

      if (ev.event_type === "shot") {
        target.shots += 1;
        if (ev.result === "Gol") target.goals += 1;
        if (type.includes("7m") || type.includes("7 metros") || type.includes("penalti")) {
          target.sevenMeters += 1;
        }
      } else if (ev.event_type === "turnover") {
        target.turnovers += 1;
      } else if (ev.event_type === "free_throw" && (ev.is_7m || ev.penalty)) {
        target.sevenMeters += 1;
      }
    });

    const totalHomeAttacks = data.positional.shots + data.positional.turnovers + (data.fastbreak.shots + data.fastbreak.turnovers);
    const grandTotal = Math.max(1, totalHomeAttacks);

    const posAttacks = data.positional.shots + data.positional.turnovers;
    const fbAttacks = data.fastbreak.shots + data.fastbreak.turnovers;

    return {
      positional: {
        ...data.positional,
        goalPct: data.positional.shots > 0 ? Math.round((data.positional.goals / data.positional.shots) * 100) : 0,
        attackPct: Math.round((posAttacks / grandTotal) * 100),
        totalAttacks: posAttacks
      },
      fastbreak: {
        ...data.fastbreak,
        goalPct: data.fastbreak.shots > 0 ? Math.round((data.fastbreak.goals / data.fastbreak.shots) * 100) : 0,
        attackPct: Math.round((fbAttacks / grandTotal) * 100),
        totalAttacks: fbAttacks
      }
    };
  };

  return {
    home: calculatePhases(homeEvents),
    away: calculatePhases(awayEvents)
  };
}

/**
 * Determina si un evento ocurrió en:
 * Igualdad (6vs6), Superioridad (+1 o más), Inferioridad (-1 o más)
 */
function classifyEventSituation(ev, allEvents = []) {
  const sit = String(ev.numerical_situation || ev.situation || "").toLowerCase();

  if (sit.includes("superior") || sit.includes("+1") || sit.includes("+2") || sit.includes("7vs6")) {
    return "superiority";
  }
  if (sit.includes("inferior") || sit.includes("-1") || sit.includes("-2")) {
    return "inferiority";
  }

  // Correlación temporal automática con las exclusiones de 2 minutos del partido si no se indicó explícitamente
  if (allEvents && allEvents.length > 0 && ev.match_time_seconds !== undefined && ev.match_time_seconds !== null) {
    const eventTime = Number(ev.match_time_seconds);
    let homeExcl = 0;
    let awayExcl = 0;

    allEvents.forEach((otherEv) => {
      const isSanction = otherEv.event_type === "sanction";
      const sType = String(otherEv.sanction_type || "").toLowerCase();
      const is2Min = sType.includes("2 min") || sType.includes("exclusion") || sType.includes("2min") || sType.includes("dos minutos");
      if (isSanction && is2Min) {
        const start = Number(otherEv.match_time_seconds) || 0;
        const end = start + 120;
        if (eventTime >= start && eventTime < end) {
          const evIsAway = otherEv.team === "VISITANTE" || otherEv.is_opponent_action === true || otherEv.is_opponent_action === "true";
          if (evIsAway) awayExcl += 1;
          else homeExcl += 1;
        }
      }
    });

    const isAway = ev.team === "VISITANTE" || ev.is_opponent_action === true || ev.is_opponent_action === "true";
    if (isAway) {
      if (awayExcl > homeExcl) return "inferiority";
      if (awayExcl < homeExcl) return "superiority";
    } else {
      if (homeExcl > awayExcl) return "inferiority";
      if (homeExcl < awayExcl) return "superiority";
    }
  }

  return "equality"; // Default: Igualdad (6vs6)
}

/**
 * Clasifica y calcula las métricas por Situación Numérica para ambos equipos:
 * Igualdad, Superioridad e Inferioridad
 * Métricas: Tiros, Goles, % Gol, 7 Metros, Pérdidas, % de Ataque
 */
function getNumericalSituationStatsData(match) {
  const events = match?.events || [];

  const homeEvents = events.filter((ev) => !ev.is_opponent_action);
  const awayEvents = events.filter((ev) => ev.is_opponent_action);

  const calculateSituations = (teamEvents) => {
    const data = {
      equality: {
        key: "equality",
        label: "Igualdad Numérica",
        shots: 0,
        goals: 0,
        sevenMeters: 0,
        turnovers: 0
      },
      superiority: {
        key: "superiority",
        label: "Superioridad Numérica",
        shots: 0,
        goals: 0,
        sevenMeters: 0,
        turnovers: 0
      },
      inferiority: {
        key: "inferiority",
        label: "Inferioridad Numérica",
        shots: 0,
        goals: 0,
        sevenMeters: 0,
        turnovers: 0
      }
    };

    teamEvents.forEach((ev) => {
      const type = String(ev.shot_type || "").toLowerCase();
      const sitKey = classifyEventSituation(ev, events);
      const target = data[sitKey];
      if (!target) return;

      if (ev.event_type === "shot") {
        target.shots += 1;
        if (ev.result === "Gol") target.goals += 1;
        if (type.includes("7m") || type.includes("7 metros") || type.includes("penalti")) {
          target.sevenMeters += 1;
        }
      } else if (ev.event_type === "turnover") {
        target.turnovers += 1;
      } else if (ev.event_type === "free_throw" && (ev.is_7m || ev.penalty)) {
        target.sevenMeters += 1;
      }
    });

    const totalAttacks =
      data.equality.shots + data.equality.turnovers +
      data.superiority.shots + data.superiority.turnovers +
      data.inferiority.shots + data.inferiority.turnovers;

    const grandTotal = Math.max(1, totalAttacks);

    const eqAttacks = data.equality.shots + data.equality.turnovers;
    const supAttacks = data.superiority.shots + data.superiority.turnovers;
    const infAttacks = data.inferiority.shots + data.inferiority.turnovers;

    return {
      equality: {
        ...data.equality,
        goalPct: data.equality.shots > 0 ? Math.round((data.equality.goals / data.equality.shots) * 100) : 0,
        attackPct: Math.round((eqAttacks / grandTotal) * 100),
        totalAttacks: eqAttacks
      },
      superiority: {
        ...data.superiority,
        goalPct: data.superiority.shots > 0 ? Math.round((data.superiority.goals / data.superiority.shots) * 100) : 0,
        attackPct: Math.round((supAttacks / grandTotal) * 100),
        totalAttacks: supAttacks
      },
      inferiority: {
        ...data.inferiority,
        goalPct: data.inferiority.shots > 0 ? Math.round((data.inferiority.goals / data.inferiority.shots) * 100) : 0,
        attackPct: Math.round((infAttacks / grandTotal) * 100),
        totalAttacks: infAttacks
      }
    };
  };

  return {
    home: calculateSituations(homeEvents),
    away: calculateSituations(awayEvents)
  };
}

/**
 * Componente visual para renderizar el escudo/logo del equipo en el PDF y en la interfaz
 * Si el equipo tiene imagen de logo la renderiza (con soporte CORS y fallback seguro),
 * y si no, renderiza un escudo vectorial estilizado con sus iniciales.
 */
function TeamLogoBadge({ name, logoUrl, color = "#12843A", isHome = true, size = 54 }) {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [logoUrl]);

  // Iniciales estilizadas
  const initials = name
    ? name
      .split(" ")
      .map((w) => w[0])
      .slice(0, 3)
      .join("")
      .toUpperCase()
    : isHome ? "LOC" : "VIS";

  if (logoUrl && !imgError) {
    return (
      <div
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: size >= 40 ? "8px" : "5px",
          background: "#ffffff",
          border: "1px solid #E5E7EB",
          padding: size >= 40 ? "4px" : "2px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          boxShadow: size >= 40 ? "0 2px 5px rgba(0,0,0,0.06)" : "none",
          overflow: "hidden"
        }}
      >
        <img
          src={logoUrl}
          alt={name}
          crossOrigin="anonymous"
          onError={() => setImgError(true)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain"
          }}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: size >= 40 ? "10px" : "5px",
        background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
        color: "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: `${Math.round(size * 0.33)}px`,
        fontWeight: 900,
        fontFamily: "'Exo 2', 'SF Mono', monospace",
        letterSpacing: "0.5px",
        flexShrink: 0,
        boxShadow: size >= 40 ? `0 2px 6px ${color}33` : "none"
      }}
    >
      {initials}
    </div>
  );
}

/**
 * Tabla comparativa general para el PDF con estilos inline explícitos (sin variables CSS)
 */
function PDFComparisonChart({ items, homeTeam, awayTeam, homeLogo, awayLogo }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%" }}>
      {/* Cabecera de Equipos */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "center",
          gap: "12px",
          fontWeight: 900,
          fontSize: "12px",
          paddingBottom: "8px",
          borderBottom: "1.5px solid #E5E7EB"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "flex-start" }}>
          <TeamLogoBadge name={homeTeam} logoUrl={homeLogo} color="#12843A" isHome={true} size={24} />
          <span style={{ color: "#12843A", textTransform: "uppercase", textAlign: "left", fontFamily: "'Raleway', 'Montserrat', sans-serif" }}>
            {homeTeam}
          </span>
        </div>
        <div style={{ color: "#6B7280", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 800 }}>
          COMPARATIVA DE MÉTRICAS
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "flex-end" }}>
          <span style={{ color: "#2563EB", textTransform: "uppercase", textAlign: "right", fontFamily: "'Raleway', 'Montserrat', sans-serif" }}>
            {awayTeam}
          </span>
          <TeamLogoBadge name={awayTeam} logoUrl={awayLogo} color="#2563EB" isHome={false} size={24} />
        </div>
      </div>

      {/* Filas */}
      {items.map((item, idx) => {
        const homeVal = Number(item.homeValue) || 0;
        const awayVal = Number(item.awayValue) || 0;
        let homePct = 50;
        let awayPct = 50;

        if (homeVal + awayVal > 0) {
          homePct = Math.round((homeVal / (homeVal + awayVal)) * 100);
          awayPct = 100 - homePct;
        }

        return (
          <div key={idx} style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "70px 1fr 70px", alignItems: "center", fontSize: "11px" }}>
              <span style={{ fontWeight: 900, color: "#12843A", textAlign: "left", fontFamily: "monospace" }}>
                {item.homeFormatter ? item.homeFormatter(homeVal) : homeVal}
              </span>
              <span style={{ fontWeight: 700, color: "#374151", textAlign: "center", fontSize: "10.5px" }}>
                {item.label}
              </span>
              <span style={{ fontWeight: 900, color: "#2563EB", textAlign: "right", fontFamily: "monospace" }}>
                {item.awayFormatter ? item.awayFormatter(awayVal) : awayVal}
              </span>
            </div>

            <div style={{ display: "flex", height: "8px", borderRadius: "4px", overflow: "hidden", background: "#F3F4F6", border: "1px solid #E5E7EB" }}>
              <div style={{ width: `${homePct}%`, background: "#12843A" }} />
              <div style={{ width: `${awayPct}%`, background: "#2563EB" }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Componente comparativo de Lanzamientos por Zona para Análisis de Equipo (PDF y Web)
 */
function TeamShotZonesComparison({ zoneStats, homeTeam, awayTeam, homeLogo, awayLogo }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%" }}>
      {/* Cabecera de Equipos */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "center",
          gap: "12px",
          fontWeight: 900,
          fontSize: "12px",
          paddingBottom: "8px",
          borderBottom: "1.5px solid #E5E7EB"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "flex-start" }}>
          <TeamLogoBadge name={homeTeam} logoUrl={homeLogo} color="#12843A" isHome={true} size={22} />
          <span style={{ color: "#12843A", textAlign: "left", fontFamily: "'Raleway', 'Montserrat', sans-serif" }}>
            {homeTeam}
          </span>
        </div>
        <div style={{ color: "#4B5563", textAlign: "center", textTransform: "uppercase", fontSize: "10px", letterSpacing: "0.5px" }}>
          ZONAS DE LANZAMIENTO
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "flex-end" }}>
          <span style={{ color: "#2563EB", textAlign: "right", fontFamily: "'Raleway', 'Montserrat', sans-serif" }}>
            {awayTeam}
          </span>
          <TeamLogoBadge name={awayTeam} logoUrl={awayLogo} color="#2563EB" isHome={false} size={22} />
        </div>
      </div>

      {/* Filas de las 6 zonas requeridas */}
      {zoneStats.map((item) => {
        let homePctBar = 50;
        let awayPctBar = 50;
        if (item.homeShots + item.awayShots > 0) {
          homePctBar = Math.round((item.homeShots / (item.homeShots + item.awayShots)) * 100);
          awayPctBar = 100 - homePctBar;
        }

        return (
          <div key={item.key} style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1.2fr 1.4fr", alignItems: "center", fontSize: "11px" }}>
              {/* Datos Local */}
              <div style={{ display: "flex", alignItems: "center", gap: "6px", justifyContent: "flex-start" }}>
                <span style={{ fontWeight: 900, color: "#12843A", fontFamily: "monospace", minWidth: "30px" }}>
                  {item.homeGoals}/{item.homeShots}
                </span>
                <span style={{ fontWeight: 800, color: "#0C1B13", fontSize: "10.5px", minWidth: "32px" }}>
                  {item.homeEff}%
                </span>
                <span style={{ fontSize: "9.5px", color: "#6B7280", background: "rgba(18, 132, 58, 0.08)", padding: "1px 5px", borderRadius: "3px" }}>
                  {item.homeVolPct}% total
                </span>
              </div>

              {/* Nombre de la Zona */}
              <div style={{ textAlign: "center", fontWeight: 800, color: "#111827", fontSize: "11px" }}>
                {item.label}
              </div>

              {/* Datos Visitante */}
              <div style={{ display: "flex", alignItems: "center", gap: "6px", justifyContent: "flex-end" }}>
                <span style={{ fontSize: "9.5px", color: "#6B7280", background: "rgba(37, 99, 235, 0.08)", padding: "1px 5px", borderRadius: "3px" }}>
                  {item.awayVolPct}% total
                </span>
                <span style={{ fontWeight: 800, color: "#0C1B13", fontSize: "10.5px", minWidth: "32px", textAlign: "right" }}>
                  {item.awayEff}%
                </span>
                <span style={{ fontWeight: 900, color: "#2563EB", fontFamily: "monospace", minWidth: "30px", textAlign: "right" }}>
                  {item.awayGoals}/{item.awayShots}
                </span>
              </div>
            </div>

            {/* Barra comparativa de tiros por zona */}
            <div style={{ display: "flex", height: "7px", borderRadius: "3.5px", overflow: "hidden", background: "#F3F4F6", border: "1px solid #E5E7EB" }}>
              <div style={{ width: `${homePctBar}%`, background: "#12843A" }} />
              <div style={{ width: `${awayPctBar}%`, background: "#2563EB" }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Componente comparativo de Fases de Juego: Posicional y Contraataque / 1ª Oleada (PDF y Web)
 * Muestra: Tiros, Goles, % Gol, 7 Metros, Pérdidas y % de Ataque para cada equipo
 */
function GamePhaseAnalysisComparison({ phaseStats, homeTeam, awayTeam }) {
  const phases = [
    {
      key: "positional",
      title: "Ataque Posicional",
      subtitle: "Juego organizado en estático",
      tag: "POSICIONAL",
      home: phaseStats.home.positional,
      away: phaseStats.away.positional
    },
    {
      key: "fastbreak",
      title: "Contraataque / 1ª Oleada",
      subtitle: "Transiciones rápidas y 1ª oleada",
      tag: "CONTRAATAQUE",
      home: phaseStats.home.fastbreak,
      away: phaseStats.away.fastbreak
    }
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%" }}>
      {phases.map((p) => {
        let homeGoalPctBar = 50;
        let awayGoalPctBar = 50;
        if (p.home.goalPct + p.away.goalPct > 0) {
          homeGoalPctBar = Math.round((p.home.goalPct / (p.home.goalPct + p.away.goalPct)) * 100);
          awayGoalPctBar = 100 - homeGoalPctBar;
        }

        return (
          <div
            key={p.key}
            style={{
              background: "#ffffff",
              border: "1px solid #E5E7EB",
              borderRadius: "8px",
              padding: "10px 14px",
              display: "flex",
              flexDirection: "column",
              gap: "8px"
            }}
          >
            {/* Cabecera de la Fase */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #F3F4F6", paddingBottom: "5px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "11px", fontWeight: 900, color: "#111827", textTransform: "uppercase", fontFamily: "'Raleway', 'Montserrat', sans-serif" }}>
                  {p.title}
                </span>
                <span style={{ fontSize: "8.5px", fontWeight: 800, color: "#12843A", background: "rgba(18, 132, 58, 0.08)", padding: "1px 5px", borderRadius: "3px" }}>
                  {p.tag}
                </span>
              </div>
              <span style={{ fontSize: "9px", color: "#6B7280" }}>
                {p.subtitle}
              </span>
            </div>

            {/* Cuadrícula Comparativa de las 6 Métricas requeridas */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "6px", textAlign: "center", fontSize: "10px" }}>
              {/* Métrica 1: Tiros */}
              <div style={{ background: "#F9FAFB", padding: "5px 4px", borderRadius: "4px", border: "1px solid #F3F4F6" }}>
                <span style={{ color: "#6B7280", fontSize: "8px", fontWeight: 700, textTransform: "uppercase", display: "block" }}>Tiros</span>
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "4px", marginTop: "2px" }}>
                  <strong style={{ color: "#12843A", fontSize: "11px", fontFamily: "monospace" }}>{p.home.shots}</strong>
                  <span style={{ color: "#D1D5DB", fontSize: "8px" }}>|</span>
                  <strong style={{ color: "#2563EB", fontSize: "11px", fontFamily: "monospace" }}>{p.away.shots}</strong>
                </div>
              </div>

              {/* Métrica 2: Goles */}
              <div style={{ background: "#F9FAFB", padding: "5px 4px", borderRadius: "4px", border: "1px solid #F3F4F6" }}>
                <span style={{ color: "#6B7280", fontSize: "8px", fontWeight: 700, textTransform: "uppercase", display: "block" }}>Goles</span>
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "4px", marginTop: "2px" }}>
                  <strong style={{ color: "#12843A", fontSize: "11px", fontFamily: "monospace" }}>{p.home.goals}</strong>
                  <span style={{ color: "#D1D5DB", fontSize: "8px" }}>|</span>
                  <strong style={{ color: "#2563EB", fontSize: "11px", fontFamily: "monospace" }}>{p.away.goals}</strong>
                </div>
              </div>

              {/* Métrica 3: % Gol (Eficacia) */}
              <div style={{ background: "#F9FAFB", padding: "5px 4px", borderRadius: "4px", border: "1px solid #F3F4F6" }}>
                <span style={{ color: "#6B7280", fontSize: "8px", fontWeight: 700, textTransform: "uppercase", display: "block" }}>% Gol</span>
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "4px", marginTop: "2px" }}>
                  <strong style={{ color: "#12843A", fontSize: "11px" }}>{p.home.goalPct}%</strong>
                  <span style={{ color: "#D1D5DB", fontSize: "8px" }}>|</span>
                  <strong style={{ color: "#2563EB", fontSize: "11px" }}>{p.away.goalPct}%</strong>
                </div>
              </div>

              {/* Métrica 4: 7 Metros */}
              <div style={{ background: "#F9FAFB", padding: "5px 4px", borderRadius: "4px", border: "1px solid #F3F4F6" }}>
                <span style={{ color: "#6B7280", fontSize: "8px", fontWeight: 700, textTransform: "uppercase", display: "block" }}>7 Metros</span>
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "4px", marginTop: "2px" }}>
                  <strong style={{ color: "#12843A", fontSize: "11px", fontFamily: "monospace" }}>{p.home.sevenMeters}</strong>
                  <span style={{ color: "#D1D5DB", fontSize: "8px" }}>|</span>
                  <strong style={{ color: "#2563EB", fontSize: "11px", fontFamily: "monospace" }}>{p.away.sevenMeters}</strong>
                </div>
              </div>

              {/* Métrica 5: Pérdidas */}
              <div style={{ background: "#F9FAFB", padding: "5px 4px", borderRadius: "4px", border: "1px solid #F3F4F6" }}>
                <span style={{ color: "#6B7280", fontSize: "8px", fontWeight: 700, textTransform: "uppercase", display: "block" }}>Pérdidas</span>
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "4px", marginTop: "2px" }}>
                  <strong style={{ color: "#12843A", fontSize: "11px", fontFamily: "monospace" }}>{p.home.turnovers}</strong>
                  <span style={{ color: "#D1D5DB", fontSize: "8px" }}>|</span>
                  <strong style={{ color: "#2563EB", fontSize: "11px", fontFamily: "monospace" }}>{p.away.turnovers}</strong>
                </div>
              </div>

              {/* Métrica 6: % Ataque (Volumen) */}
              <div style={{ background: "#F9FAFB", padding: "5px 4px", borderRadius: "4px", border: "1px solid #F3F4F6" }}>
                <span style={{ color: "#6B7280", fontSize: "8px", fontWeight: 700, textTransform: "uppercase", display: "block" }}>% Ataque</span>
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "4px", marginTop: "2px" }}>
                  <strong style={{ color: "#12843A", fontSize: "11px" }}>{p.home.attackPct}%</strong>
                  <span style={{ color: "#D1D5DB", fontSize: "8px" }}>|</span>
                  <strong style={{ color: "#2563EB", fontSize: "11px" }}>{p.away.attackPct}%</strong>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Componente comparativo de Situaciones Numéricas: Igualdad, Superioridad e Inferioridad (PDF y Web)
 * Muestra: Tiros, Goles, % Gol, 7 Metros, Pérdidas y % de Ataque para cada equipo
 */
function NumericalSituationAnalysisComparison({ situationStats, homeTeam, awayTeam }) {
  const situations = [
    {
      key: "equality",
      title: "Igualdad Numérica",
      subtitle: "Acciones de ataque en igualdad (6 vs 6)",
      tag: "IGUALDAD (6vs6)",
      home: situationStats.home.equality,
      away: situationStats.away.equality
    },
    {
      key: "superiority",
      title: "Superioridad Numérica",
      subtitle: "Ataques con ventaja numérica (+1 o más)",
      tag: "SUPERIORIDAD",
      home: situationStats.home.superiority,
      away: situationStats.away.superiority
    },
    {
      key: "inferiority",
      title: "Inferioridad Numérica",
      subtitle: "Ataques con desventaja numérica (-1 o más)",
      tag: "INFERIORIDAD",
      home: situationStats.home.inferiority,
      away: situationStats.away.inferiority
    }
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%" }}>
      {situations.map((s) => {
        let homeGoalPctBar = 50;
        let awayGoalPctBar = 50;
        if (s.home.goalPct + s.away.goalPct > 0) {
          homeGoalPctBar = Math.round((s.home.goalPct / (s.home.goalPct + s.away.goalPct)) * 100);
          awayGoalPctBar = 100 - homeGoalPctBar;
        }

        return (
          <div
            key={s.key}
            style={{
              background: "#ffffff",
              border: "1px solid #E5E7EB",
              borderRadius: "8px",
              padding: "10px 14px",
              display: "flex",
              flexDirection: "column",
              gap: "8px"
            }}
          >
            {/* Cabecera de la Situación */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #F3F4F6", paddingBottom: "5px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "11px", fontWeight: 900, color: "#111827", textTransform: "uppercase", fontFamily: "'Raleway', 'Montserrat', sans-serif" }}>
                  {s.title}
                </span>
                <span style={{ fontSize: "8.5px", fontWeight: 800, color: "#12843A", background: "rgba(18, 132, 58, 0.08)", padding: "1px 5px", borderRadius: "3px" }}>
                  {s.tag}
                </span>
              </div>
              <span style={{ fontSize: "9px", color: "#6B7280" }}>
                {s.subtitle}
              </span>
            </div>

            {/* Cuadrícula Comparativa de las 6 Métricas requeridas */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "6px", textAlign: "center", fontSize: "10px" }}>
              {/* Métrica 1: Tiros */}
              <div style={{ background: "#F9FAFB", padding: "5px 4px", borderRadius: "4px", border: "1px solid #F3F4F6" }}>
                <span style={{ color: "#6B7280", fontSize: "8px", fontWeight: 700, textTransform: "uppercase", display: "block" }}>Tiros</span>
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "4px", marginTop: "2px" }}>
                  <strong style={{ color: "#12843A", fontSize: "11px", fontFamily: "monospace" }}>{s.home.shots}</strong>
                  <span style={{ color: "#D1D5DB", fontSize: "8px" }}>|</span>
                  <strong style={{ color: "#2563EB", fontSize: "11px", fontFamily: "monospace" }}>{s.away.shots}</strong>
                </div>
              </div>

              {/* Métrica 2: Goles */}
              <div style={{ background: "#F9FAFB", padding: "5px 4px", borderRadius: "4px", border: "1px solid #F3F4F6" }}>
                <span style={{ color: "#6B7280", fontSize: "8px", fontWeight: 700, textTransform: "uppercase", display: "block" }}>Goles</span>
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "4px", marginTop: "2px" }}>
                  <strong style={{ color: "#12843A", fontSize: "11px", fontFamily: "monospace" }}>{s.home.goals}</strong>
                  <span style={{ color: "#D1D5DB", fontSize: "8px" }}>|</span>
                  <strong style={{ color: "#2563EB", fontSize: "11px", fontFamily: "monospace" }}>{s.away.goals}</strong>
                </div>
              </div>

              {/* Métrica 3: % Gol (Eficacia) */}
              <div style={{ background: "#F9FAFB", padding: "5px 4px", borderRadius: "4px", border: "1px solid #F3F4F6" }}>
                <span style={{ color: "#6B7280", fontSize: "8px", fontWeight: 700, textTransform: "uppercase", display: "block" }}>% Gol</span>
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "4px", marginTop: "2px" }}>
                  <strong style={{ color: "#12843A", fontSize: "11px" }}>{s.home.goalPct}%</strong>
                  <span style={{ color: "#D1D5DB", fontSize: "8px" }}>|</span>
                  <strong style={{ color: "#2563EB", fontSize: "11px" }}>{s.away.goalPct}%</strong>
                </div>
              </div>

              {/* Métrica 4: 7 Metros */}
              <div style={{ background: "#F9FAFB", padding: "5px 4px", borderRadius: "4px", border: "1px solid #F3F4F6" }}>
                <span style={{ color: "#6B7280", fontSize: "8px", fontWeight: 700, textTransform: "uppercase", display: "block" }}>7 Metros</span>
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "4px", marginTop: "2px" }}>
                  <strong style={{ color: "#12843A", fontSize: "11px", fontFamily: "monospace" }}>{s.home.sevenMeters}</strong>
                  <span style={{ color: "#D1D5DB", fontSize: "8px" }}>|</span>
                  <strong style={{ color: "#2563EB", fontSize: "11px", fontFamily: "monospace" }}>{s.away.sevenMeters}</strong>
                </div>
              </div>

              {/* Métrica 5: Pérdidas */}
              <div style={{ background: "#F9FAFB", padding: "5px 4px", borderRadius: "4px", border: "1px solid #F3F4F6" }}>
                <span style={{ color: "#6B7280", fontSize: "8px", fontWeight: 700, textTransform: "uppercase", display: "block" }}>Pérdidas</span>
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "4px", marginTop: "2px" }}>
                  <strong style={{ color: "#12843A", fontSize: "11px", fontFamily: "monospace" }}>{s.home.turnovers}</strong>
                  <span style={{ color: "#D1D5DB", fontSize: "8px" }}>|</span>
                  <strong style={{ color: "#2563EB", fontSize: "11px", fontFamily: "monospace" }}>{s.away.turnovers}</strong>
                </div>
              </div>

              {/* Métrica 6: % Ataque (Volumen) */}
              <div style={{ background: "#F9FAFB", padding: "5px 4px", borderRadius: "4px", border: "1px solid #F3F4F6" }}>
                <span style={{ color: "#6B7280", fontSize: "8px", fontWeight: 700, textTransform: "uppercase", display: "block" }}>% Ataque</span>
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "4px", marginTop: "2px" }}>
                  <strong style={{ color: "#12843A", fontSize: "11px" }}>{s.home.attackPct}%</strong>
                  <span style={{ color: "#D1D5DB", fontSize: "8px" }}>|</span>
                  <strong style={{ color: "#2563EB", fontSize: "11px" }}>{s.away.attackPct}%</strong>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Componente comparativo de Distribución de Lanzamientos (Sección 7)
 * Desglosado en dos equipos, cada uno con 2 mapas de calor sin marcadores:
 * 1. Tiros en Pista de Juego (Court Heatmap)
 * 2. Tiros en Portería (Goal Heatmap)
 * Datos exclusivos de lanzamientos (excluyendo pérdidas).
 */
function TeamShotDistributionComparison({ match, overview, homeLogo, awayLogo }) {
  const events = match?.events || [];

  const homeEvents = events.filter((ev) => !ev.is_opponent_action && ev.event_type === "shot");
  const awayEvents = events.filter((ev) => ev.is_opponent_action && ev.event_type === "shot");

  const getTeamShotData = (teamEvents, isOpponent) => {
    const courtPoints = generateContinuousCourtHeatmapData(events, {
      metricType: "shots",
      isOpponent: isOpponent,
      match
    });

    const goalPoints = generateContinuousGoalHeatmapData(events, {
      metricType: "shots",
      isOpponent: isOpponent,
      match
    });

    const totalShots = teamEvents.length;
    const totalGoals = teamEvents.filter((e) => e.result === "Gol").length;
    const totalSaves = teamEvents.filter((e) => e.result === "Parada").length;
    const totalMisses = teamEvents.filter((e) => e.result === "Fuera" || e.result === "Poste").length;
    const effPct = totalShots > 0 ? Math.round((totalGoals / totalShots) * 100) : 0;

    return {
      courtPoints,
      goalPoints,
      totalShots,
      totalGoals,
      totalSaves,
      totalMisses,
      effPct
    };
  };

  const homeData = getTeamShotData(homeEvents, false);
  const awayData = getTeamShotData(awayEvents, true);

  const renderTeamBlock = (teamName, data, color, isAway) => (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #E5E7EB",
        borderRadius: "8px",
        padding: "10px 14px",
        display: "flex",
        flexDirection: "column",
        gap: "10px"
      }}
    >
      {/* Cabecera del Equipo */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #F3F4F6", paddingBottom: "5px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <TeamLogoBadge name={teamName} logoUrl={isAway ? awayLogo : homeLogo} color={color} isHome={!isAway} size={24} />
          <span style={{ fontSize: "11px", fontWeight: 900, color: color, textTransform: "uppercase", fontFamily: "'Raleway', 'Montserrat', sans-serif" }}>
            {teamName}
          </span>
          <span style={{ fontSize: "8.5px", fontWeight: 800, color: color, background: `${color}14`, padding: "1px 6px", borderRadius: "3px" }}>
            {isAway ? "EQUIPO VISITANTE" : "EQUIPO LOCAL"}
          </span>
        </div>
        <span style={{ fontSize: "9.5px", fontWeight: 800, color: "#374151" }}>
          {data.totalShots} Tiros • {data.totalGoals} Goles ({data.effPct}% Eficacia)
        </span>
      </div>

      {/* Los 2 Mapas de Calor Lado a Lado (Sin Marcadores) */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", alignItems: "start" }}>
        {/* Mapa 1: Media Pista */}
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <div style={{ fontSize: "9.5px", fontWeight: 800, color: "#4B5563", textTransform: "uppercase", textAlign: "center" }}>
            Tiros en Media Pista
          </div>
          <div
            style={{
              position: "relative",
              width: "100%",
              aspectRatio: "400 / 300",
              borderRadius: "5px",
              overflow: "hidden",
              background: "#061c0e",
              border: "1px solid #E5E7EB"
            }}
          >
            <HandballCourtGraphic showZones={false} idPrefix={`dist-court-${isAway ? "away" : "home"}`} />
            <ContinuousHeatmapCanvas points={data.courtPoints} radius={36} blur={0.85} opacity={0.92} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "8.5px", color: "#6B7280", background: "#F9FAFB", padding: "4px 8px", borderRadius: "3px" }}>
            <span>Lanzamientos: <strong>{data.totalShots}</strong></span>
            <span>Goles: <strong style={{ color: "#12843A" }}>{data.totalGoals}</strong></span>
            <span>Eficacia: <strong style={{ color: color }}>{data.effPct}%</strong></span>
          </div>
        </div>

        {/* Mapa 2: Portería */}
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <div style={{ fontSize: "9.5px", fontWeight: 800, color: "#4B5563", textTransform: "uppercase", textAlign: "center" }}>
            Impacto en Portería
          </div>
          <div
            style={{
              position: "relative",
              width: "100%",
              aspectRatio: "360 / 220",
              borderRadius: "5px",
              overflow: "hidden",
              background: "#081210",
              border: "1px solid #E5E7EB"
            }}
          >
            <HandballGoalGraphic idPrefix={`dist-goal-${isAway ? "away" : "home"}`} />
            <ContinuousHeatmapCanvas points={data.goalPoints} radius={32} blur={0.85} opacity={0.92} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "8.5px", color: "#6B7280", background: "#F9FAFB", padding: "4px 8px", borderRadius: "3px" }}>
            <span>Goles: <strong style={{ color: "#12843A" }}>{data.totalGoals}</strong></span>
            <span>Paradas: <strong style={{ color: "#F59E0B" }}>{data.totalSaves}</strong></span>
            <span>Fuera/Poste: <strong style={{ color: "#EF4444" }}>{data.totalMisses}</strong></span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%" }}>
      {renderTeamBlock(overview.homeTeam, homeData, "#12843A", false)}
      {renderTeamBlock(overview.awayTeam, awayData, "#2563EB", true)}
    </div>
  );
}

/**
 * Componente comparativo de Pérdidas de Balón (Sección 8)
 * Desglosado en dos equipos, cada uno con un mapa de calor continuo en media pista
 * mostrando EXCLUSIVAMENTE pérdidas de balón (sin tiros) y sin marcadores.
 */
function TeamTurnoversHeatmapComparison({ match, overview, homeLogo, awayLogo }) {
  const events = match?.events || [];

  const homeEvents = events.filter((ev) => !ev.is_opponent_action && ev.event_type === "turnover");
  const awayEvents = events.filter((ev) => ev.is_opponent_action && ev.event_type === "turnover");

  const getTeamTurnoverData = (teamTurnovers, isOpponent, totalPoss) => {
    const courtPoints = generateContinuousCourtHeatmapData(events, {
      metricType: "turnovers",
      isOpponent: isOpponent,
      match
    });

    const totalTurnovers = teamTurnovers.length;
    const possLostPct = totalPoss > 0 ? Math.round((totalTurnovers / totalPoss) * 100) : 0;

    // Conteo por tipología de pérdida
    const typesCount = {};
    teamTurnovers.forEach((t) => {
      const type = t.turnover_type || t.turnoverType || "Pérdida General";
      typesCount[type] = (typesCount[type] || 0) + 1;
    });

    return {
      courtPoints,
      totalTurnovers,
      possLostPct,
      typesCount
    };
  };

  const homeData = getTeamTurnoverData(homeEvents, false, overview.homePossCount || 1);
  const awayData = getTeamTurnoverData(awayEvents, true, overview.awayPossCount || 1);

  const renderTeamBlock = (teamName, data, color, isAway) => {
    const topTypes = Object.entries(data.typesCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    return (
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #E5E7EB",
          borderRadius: "8px",
          padding: "10px 14px",
          display: "flex",
          flexDirection: "column",
          gap: "10px"
        }}
      >
        {/* Cabecera del Equipo */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #F3F4F6", paddingBottom: "5px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <TeamLogoBadge name={teamName} logoUrl={isAway ? awayLogo : homeLogo} color={color} isHome={!isAway} size={24} />
            <span style={{ fontSize: "11px", fontWeight: 900, color: color, textTransform: "uppercase", fontFamily: "'Raleway', 'Montserrat', sans-serif" }}>
              {teamName}
            </span>
            <span style={{ fontSize: "8.5px", fontWeight: 800, color: color, background: `${color}14`, padding: "1px 6px", borderRadius: "3px" }}>
              {isAway ? "EQUIPO VISITANTE" : "EQUIPO LOCAL"}
            </span>
          </div>
          <span style={{ fontSize: "9.5px", fontWeight: 800, color: "#374151" }}>
            {data.totalTurnovers} Pérdidas de Balón ({data.possLostPct}% ataques cedidos)
          </span>
        </div>

        {/* Mapa de Calor de Pérdidas y Tarjeta Lateral de Tipología */}
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "12px", alignItems: "center" }}>
          {/* Mapa de Media Pista de Pérdidas */}
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <div style={{ fontSize: "9.5px", fontWeight: 800, color: "#4B5563", textTransform: "uppercase", textAlign: "center" }}>
              Zonas de Pérdida en Pista
            </div>
            <div
              style={{
                position: "relative",
                width: "100%",
                aspectRatio: "400 / 300",
                borderRadius: "5px",
                overflow: "hidden",
                background: "#061c0e",
                border: "1px solid #E5E7EB"
              }}
            >
              <HandballCourtGraphic showZones={false} idPrefix={`to-court-${isAway ? "away" : "home"}`} />
              <ContinuousHeatmapCanvas points={data.courtPoints} radius={38} blur={0.85} opacity={0.92} />
            </div>
          </div>

          {/* Tarjeta de Resumen y Desglose de Pérdidas */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <div style={{ background: "#F9FAFB", padding: "8px 10px", borderRadius: "6px", border: "1px solid #F3F4F6", display: "flex", flexDirection: "column", gap: "4px" }}>
              <span style={{ fontSize: "9px", fontWeight: 800, color: "#6B7280", textTransform: "uppercase" }}>Impacto en Posesión</span>
              <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                <span style={{ fontSize: "16px", fontWeight: 900, color: "#EF4444", fontFamily: "monospace" }}>{data.totalTurnovers}</span>
                <span style={{ fontSize: "10px", fontWeight: 700, color: "#374151" }}>balones cedidos</span>
              </div>
              <span style={{ fontSize: "8.5px", color: "#6B7280" }}>
                Representa el <strong>{data.possLostPct}%</strong> de los ataques del equipo.
              </span>
            </div>

            {/* Tipos de Pérdida más Frecuentes */}
            <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
              <span style={{ fontSize: "8.5px", fontWeight: 800, color: "#4B5563", textTransform: "uppercase" }}>Tipología Frecuente:</span>
              {topTypes.length > 0 ? (
                topTypes.map(([type, count], idx) => (
                  <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#FFFFFF", border: "1px solid #E5E7EB", padding: "3px 6px", borderRadius: "4px", fontSize: "9px" }}>
                    <span style={{ color: "#111827", fontWeight: 700 }}>{type}</span>
                    <strong style={{ color: "#EF4444" }}>{count} ({Math.round((count / (data.totalTurnovers || 1)) * 100)}%)</strong>
                  </div>
                ))
              ) : (
                <div style={{ fontSize: "8.5px", color: "#9CA3AF", fontStyle: "italic" }}>Sin pérdidas registradas</div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%" }}>
      {renderTeamBlock(overview.homeTeam, homeData, "#12843A", false)}
      {renderTeamBlock(overview.awayTeam, awayData, "#2563EB", true)}
    </div>
  );
}

/**
 * Componente de Progresión del Marcador y Momentum (Sección 9)
 * Muestra el Gráfico de Evolución de Marcador (Goles en el tiempo)
 * y el Gráfico de Flujo de Momentum Dinámico del Partido.
 */
function PDFScoreProgressionAndMomentum({ metrics, match, overview }) {
  const homeTeam = overview?.homeTeam || "Equipo Local";
  const awayTeam = overview?.awayTeam || "Equipo Visitante";

  const scoreData = metrics?.scoreTimeline || metrics?.momentumTimeline || [];
  const momentumData = metrics?.momentumTimeline || [];

  // ==========================================
  // 1. CÁLCULO PARA EVOLUCIÓN DEL MARCADOR
  // ==========================================
  const width = 730;
  const height = 160;
  const padLeft = 32;
  const padRight = 20;
  const padTop = 18;
  const padBottom = 26;
  const graphWidth = width - padLeft - padRight;
  const graphHeight = height - padTop - padBottom;

  const maxTime = Math.max(3600, scoreData.length > 0 ? (scoreData[scoreData.length - 1].time || 3600) : 3600);
  const maxScore = Math.max(10, ...scoreData.map((d) => Math.max(d.local || 0, d.away || 0))) + 2;

  const pointsHome = scoreData.map((d) => ({
    x: padLeft + ((d.time || 0) / maxTime) * graphWidth,
    y: height - padBottom - ((d.local || 0) / maxScore) * graphHeight,
    local: d.local || 0,
    away: d.away || 0,
    time: d.time || 0
  }));

  const pointsAway = scoreData.map((d) => ({
    x: padLeft + ((d.time || 0) / maxTime) * graphWidth,
    y: height - padBottom - ((d.away || 0) / maxScore) * graphHeight,
    local: d.local || 0,
    away: d.away || 0,
    time: d.time || 0
  }));

  const buildStepPath = (pts) => {
    if (pts.length === 0) return "";
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      d += ` H ${pts[i].x} V ${pts[i].y}`;
    }
    return d;
  };

  const pathHomeD = buildStepPath(pointsHome);
  const pathAwayD = buildStepPath(pointsAway);

  const lastHomeX = pointsHome.length > 0 ? pointsHome[pointsHome.length - 1].x : padLeft + graphWidth;
  const lastAwayX = pointsAway.length > 0 ? pointsAway[pointsAway.length - 1].x : padLeft + graphWidth;

  const areaHomeD = pathHomeD ? `${pathHomeD} L ${lastHomeX} ${height - padBottom} L ${padLeft} ${height - padBottom} Z` : "";
  const areaAwayD = pathAwayD ? `${pathAwayD} L ${lastAwayX} ${height - padBottom} L ${padLeft} ${height - padBottom} Z` : "";

  // Intervalos de 5 minutos (0', 5', 10', ..., 60')
  const fiveMinIntervals = [];
  for (let m = 0; m <= 60; m += 5) {
    const sec = m * 60;
    const x = padLeft + (sec / 3600) * graphWidth;
    fiveMinIntervals.push({ min: m, x });
  }

  // Ticks para eje Y
  const yStep = maxScore <= 12 ? 2 : maxScore <= 26 ? 5 : 10;
  const yTicks = [];
  for (let s = 0; s <= maxScore; s += yStep) {
    const y = height - padBottom - (s / maxScore) * graphHeight;
    yTicks.push({ score: s, y });
  }

  // ==========================================
  // 2. CÁLCULO PARA MOMENTUM
  // ==========================================
  const mHeight = 140;
  const mGraphHeight = mHeight - padTop - padBottom;
  const centerY = padTop + mGraphHeight / 2;

  const allMomentumValues = momentumData.map((d) => d.momentum || 0);
  const rawMax = Math.max(...allMomentumValues, 0);
  const rawMin = Math.min(...allMomentumValues, 0);
  const maxAbs = Math.max(15, Math.abs(rawMax), Math.abs(rawMin));
  const limitBound = Math.ceil(maxAbs / 5) * 5;

  const momentumPoints = momentumData.map((d) => {
    const x = padLeft + ((d.time || 0) / maxTime) * graphWidth;
    const y = centerY - ((d.momentum || 0) / limitBound) * (mGraphHeight / 2);
    return { x, y, momentum: d.momentum || 0, time: d.time || 0 };
  });

  const pathMomentumD = momentumPoints.reduce((acc, p, idx) => {
    return `${acc} ${idx === 0 ? "M" : "L"} ${p.x} ${p.y}`;
  }, "");

  const lastMX = momentumPoints.length > 0 ? momentumPoints[momentumPoints.length - 1].x : padLeft + graphWidth;
  const areaMomentumD = pathMomentumD ? `${pathMomentumD} L ${lastMX} ${centerY} L ${padLeft} ${centerY} Z` : "";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%" }}>
      {/* GRÁFICO DE EVOLUCIÓN DEL MARCADOR */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #E5E7EB",
          borderRadius: "8px",
          padding: "10px 14px",
          display: "flex",
          flexDirection: "column",
          gap: "6px"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #F3F4F6", paddingBottom: "5px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "10.5px", fontWeight: 900, color: "#111827", textTransform: "uppercase", fontFamily: "'Raleway', 'Montserrat', sans-serif" }}>
              Evolución del Marcador (Goles por Minuto)
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "9px", fontWeight: 800 }}>
            <span style={{ color: "#12843A" }}>■ {homeTeam} ({overview?.homeGoals || 0})</span>
            <span style={{ color: "#2563EB" }}>■ {awayTeam} ({overview?.awayGoals || 0})</span>
          </div>
        </div>

        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: "auto", display: "block" }}>
          <defs>
            <linearGradient id="pdfHomeScoreGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#12843A" stopOpacity="0.20" />
              <stop offset="100%" stopColor="#12843A" stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id="pdfAwayScoreGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563EB" stopOpacity="0.20" />
              <stop offset="100%" stopColor="#2563EB" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Rejilla de tiempo en Eje X (cada 5 minutos) */}
          {fiveMinIntervals.map((interval) => (
            <g key={`pdf-grid-5m-${interval.min}`}>
              <line
                x1={interval.x}
                y1={padTop}
                x2={interval.x}
                y2={height - padBottom}
                stroke="#E5E7EB"
                strokeDasharray="3 3"
                strokeWidth="0.8"
              />
              <text
                x={interval.x}
                y={height - padBottom + 13}
                textAnchor="middle"
                fill="#6B7280"
                fontSize="8.5"
                fontWeight="700"
              >
                {interval.min}'
              </text>
            </g>
          ))}

          {/* Rejilla horizontal de goles en Eje Y */}
          {yTicks.map((tick) => (
            <g key={`pdf-grid-y-${tick.score}`}>
              <line
                x1={padLeft}
                y1={tick.y}
                x2={width - padRight}
                y2={tick.y}
                stroke="#F3F4F6"
                strokeWidth="0.8"
              />
              <text
                x={padLeft - 6}
                y={tick.y + 3}
                textAnchor="end"
                fill="#9CA3AF"
                fontSize="8"
                fontWeight="600"
              >
                {tick.score}
              </text>
            </g>
          ))}

          {/* Ejes base */}
          <line x1={padLeft} y1={height - padBottom} x2={width - padRight} y2={height - padBottom} stroke="#D1D5DB" strokeWidth="1" />
          <line x1={padLeft} y1={padTop} x2={padLeft} y2={height - padBottom} stroke="#D1D5DB" strokeWidth="1" />

          {/* Áreas rellenas */}
          {areaHomeD && <path d={areaHomeD} fill="url(#pdfHomeScoreGrad)" />}
          {areaAwayD && <path d={areaAwayD} fill="url(#pdfAwayScoreGrad)" />}

          {/* Líneas de Marcador Escalonadas */}
          {pathHomeD && <path d={pathHomeD} fill="none" stroke="#12843A" strokeWidth="2.4" strokeLinejoin="round" />}
          {pathAwayD && <path d={pathAwayD} fill="none" stroke="#2563EB" strokeWidth="2.4" strokeLinejoin="round" />}
        </svg>
      </div>

      {/* GRÁFICO DE MOMENTUM DINÁMICO */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #E5E7EB",
          borderRadius: "8px",
          padding: "10px 14px",
          display: "flex",
          flexDirection: "column",
          gap: "6px"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #F3F4F6", paddingBottom: "5px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "10.5px", fontWeight: 900, color: "#111827", textTransform: "uppercase", fontFamily: "'Raleway', 'Montserrat', sans-serif" }}>
              Flujo de Momentum del Partido (Curva de Dominio)
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "9px", fontWeight: 800 }}>
            <span style={{ color: "#12843A" }}>▲ Dominio {homeTeam} (+{limitBound})</span>
            <span style={{ color: "#2563EB" }}>▼ Dominio {awayTeam} (-{limitBound})</span>
          </div>
        </div>

        <svg viewBox={`0 0 ${width} ${mHeight}`} style={{ width: "100%", height: "auto", display: "block" }}>
          <defs>
            <linearGradient id="pdfMomentumAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#12843A" stopOpacity="0.30" />
              <stop offset="50%" stopColor="#12843A" stopOpacity="0.04" />
              <stop offset="50%" stopColor="#2563EB" stopOpacity="0.04" />
              <stop offset="100%" stopColor="#2563EB" stopOpacity="0.30" />
            </linearGradient>
            <linearGradient id="pdfMomentumLineGrad" x1="0" y1={padTop} x2="0" y2={mHeight - padBottom} gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#12843A" />
              <stop offset="48%" stopColor="#12843A" />
              <stop offset="52%" stopColor="#2563EB" />
              <stop offset="100%" stopColor="#2563EB" />
            </linearGradient>
          </defs>

          {/* Rejilla de tiempo en Eje X (cada 5 minutos) */}
          {fiveMinIntervals.map((interval) => (
            <g key={`pdf-m-grid-5m-${interval.min}`}>
              <line
                x1={interval.x}
                y1={padTop}
                x2={interval.x}
                y2={mHeight - padBottom}
                stroke="#E5E7EB"
                strokeDasharray="3 3"
                strokeWidth="0.8"
              />
              <text
                x={interval.x}
                y={mHeight - padBottom + 13}
                textAnchor="middle"
                fill="#6B7280"
                fontSize="8.5"
                fontWeight="700"
              >
                {interval.min}'
              </text>
            </g>
          ))}

          {/* Línea horizontal central (Neutralidad 0) */}
          <line x1={padLeft} y1={centerY} x2={width - padRight} y2={centerY} stroke="#9CA3AF" strokeDasharray="4 4" strokeWidth="1.2" />
          <line x1={padLeft} y1={padTop} x2={width - padRight} y2={padTop} stroke="#F3F4F6" strokeWidth="0.8" />
          <line x1={padLeft} y1={mHeight - padBottom} x2={width - padRight} y2={mHeight - padBottom} stroke="#F3F4F6" strokeWidth="0.8" />

          {/* Etiquetas Eje Y */}
          <text x={padLeft - 6} y={padTop + 4} textAnchor="end" fill="#12843A" fontSize="8.5" fontWeight="bold">+{limitBound}</text>
          <text x={padLeft - 6} y={centerY + 3} textAnchor="end" fill="#9CA3AF" fontSize="8">0</text>
          <text x={padLeft - 6} y={mHeight - padBottom + 3} textAnchor="end" fill="#2563EB" fontSize="8.5" fontWeight="bold">-{limitBound}</text>

          {/* Ejes base */}
          <line x1={padLeft} y1={padTop} x2={padLeft} y2={mHeight - padBottom} stroke="#D1D5DB" strokeWidth="1" />

          {/* Área y Línea de Momentum */}
          {areaMomentumD && <path d={areaMomentumD} fill="url(#pdfMomentumAreaGrad)" />}
          {pathMomentumD && <path d={pathMomentumD} fill="none" stroke="url(#pdfMomentumLineGrad)" strokeWidth="2.2" strokeLinejoin="round" />}
        </svg>
      </div>
    </div>
  );
}

/**
 * Componente de Tabla Individual de Plantilla y Ratings para un Equipo (PDF)
 * Diseñado para ocupar su propia página completa con máxima claridad y legibilidad.
 */
function PDFSingleTeamPlayersTable({ teamName, playersList, color, isAway, overview, logoUrl }) {
  const sorted = [...playersList].sort((a, b) => (parseInt(a.number, 10) || 0) - (parseInt(b.number, 10) || 0));

  const renderRatingBadge = (rating) => {
    const rVal = parseFloat(rating) || 0;
    let badgeColor = "#12843A";
    let bg = "rgba(18, 132, 58, 0.10)";

    if (rVal >= 7.5) {
      badgeColor = "#12843A";
      bg = "rgba(18, 132, 58, 0.12)";
    } else if (rVal >= 6.0) {
      badgeColor = "#2563EB";
      bg = "rgba(37, 99, 235, 0.12)";
    } else {
      badgeColor = "#D97706";
      bg = "rgba(217, 119, 6, 0.12)";
    }

    return (
      <span
        style={{
          display: "inline-block",
          padding: "3px 7px",
          borderRadius: "4px",
          fontSize: "9.5px",
          fontWeight: 900,
          color: badgeColor,
          background: bg,
          fontFamily: "monospace"
        }}
      >
        {rVal.toFixed(1)}
      </span>
    );
  };

  // Cálculos de totales del equipo
  const totalGoals = sorted.reduce((sum, p) => sum + (Number(p.goals) || 0), 0);
  const totalShots = sorted.reduce((sum, p) => sum + (Number(p.shotsCount) || 0), 0);
  const totalXg = sorted.reduce((sum, p) => sum + (parseFloat(p.xg) || 0), 0).toFixed(1);
  const teamEff = totalShots > 0 ? Math.round((totalGoals / totalShots) * 100) : 0;

  const totalSaves = sorted.reduce((sum, p) => sum + (Number(p.goalkeeperSaves) || 0), 0);
  const totalFaced = sorted.reduce((sum, p) => sum + (Number(p.goalkeeperShotsFaced) || 0), 0);
  const totalXSaves = sorted.reduce((sum, p) => sum + (parseFloat(p.goalkeeperXSaves) || 0), 0).toFixed(1);
  const teamGkPct = totalFaced > 0 ? Math.round((totalSaves / totalFaced) * 100) : 0;

  const totalTurnovers = sorted.reduce((sum, p) => sum + (Number(p.turnovers) || 0), 0);
  const totalTwoMins = sorted.reduce((sum, p) => sum + (Number(p.twoMins) || 0), 0);
  const avgRating = sorted.length > 0
    ? (sorted.reduce((sum, p) => sum + (parseFloat(p.rating) || 0), 0) / sorted.length).toFixed(1)
    : "—";

  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #E5E7EB",
        borderRadius: "8px",
        padding: "12px 14px",
        display: "flex",
        flexDirection: "column",
        gap: "10px"
      }}
    >
      {/* Cabecera del Equipo */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1.5px solid #F3F4F6", paddingBottom: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <TeamLogoBadge name={teamName} logoUrl={logoUrl} color={color} isHome={!isAway} size={28} />
          <span style={{ fontSize: "13px", fontWeight: 900, color: color, textTransform: "uppercase", fontFamily: "'Raleway', 'Montserrat', sans-serif" }}>
            {teamName}
          </span>
          <span style={{ fontSize: "9px", fontWeight: 800, color: color, background: `${color}14`, border: `1px solid ${color}30`, padding: "2px 8px", borderRadius: "4px" }}>
            {isAway ? "PLANTILLA VISITANTE" : "PLANTILLA LOCAL"}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "14px", fontSize: "9.5px", fontWeight: 800, color: "#4B5563" }}>
          <span>{sorted.length} Jugadores</span>
        </div>
      </div>

      {/* Tabla de Rendimiento Individual */}
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "9.5px" }}>
        <thead>
          <tr style={{ background: "#F9FAFB", borderBottom: "1.5px solid #E5E7EB", color: "#374151", fontSize: "8.5px", textTransform: "uppercase", letterSpacing: "0.4px" }}>
            <th style={{ padding: "6px 8px", textAlign: "left" }}>#</th>
            <th style={{ padding: "6px 8px", textAlign: "left" }}>Jugador</th>
            <th style={{ padding: "6px 8px", textAlign: "left" }}>Rol</th>
            <th style={{ padding: "6px 8px", textAlign: "center" }}>G / T</th>
            <th style={{ padding: "6px 8px", textAlign: "center" }}>% Efic.</th>
            <th style={{ padding: "6px 8px", textAlign: "center" }}>xG</th>
            <th style={{ padding: "6px 8px", textAlign: "center" }}>Portería (P/T)</th>
            <th style={{ padding: "6px 8px", textAlign: "center" }}>% Parada</th>
            <th style={{ padding: "6px 8px", textAlign: "center" }}>xSaves</th>
            <th style={{ padding: "6px 8px", textAlign: "center" }}>Pérdidas</th>
            <th style={{ padding: "6px 8px", textAlign: "center" }}>2 Min</th>
            <th style={{ padding: "6px 8px", textAlign: "right" }}>Rating</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((p, idx) => (
            <tr
              key={idx}
              style={{
                borderBottom: "1px solid #F3F4F6",
                background: idx % 2 === 1 ? "#FAFAFA" : "#FFFFFF"
              }}
            >
              <td style={{ padding: "5px 8px", fontWeight: 900, color: color, fontFamily: "monospace" }}>#{p.number}</td>
              <td style={{ padding: "5px 8px", fontWeight: 800, color: "#111827" }}>{p.name}</td>
              <td style={{ padding: "5px 8px", color: "#6B7280" }}>
                <span style={{ fontSize: "8px", background: p.isGoalkeeper ? "rgba(245, 158, 11, 0.12)" : "rgba(107, 114, 128, 0.10)", color: p.isGoalkeeper ? "#D97706" : "#4B5563", padding: "1px 5px", borderRadius: "3px", fontWeight: 700 }}>
                  {p.isGoalkeeper ? "Portero" : "Jugador"}
                </span>
              </td>
              <td style={{ padding: "5px 8px", textAlign: "center", fontWeight: 800, color: p.goals > 0 ? "#111827" : "#9CA3AF" }}>
                {p.goals}/{p.shotsCount}
              </td>
              <td style={{ padding: "5px 8px", textAlign: "center", fontWeight: 700, color: p.shotsCount > 0 ? color : "#9CA3AF" }}>
                {p.shotsCount > 0 ? `${p.efficiency}%` : "—"}
              </td>
              <td style={{ padding: "5px 8px", textAlign: "center", color: "#4B5563", fontFamily: "monospace" }}>
                {p.shotsCount > 0 ? p.xg : "—"}
              </td>
              <td style={{ padding: "5px 8px", textAlign: "center", color: p.isGoalkeeper ? "#111827" : "#9CA3AF", fontWeight: p.isGoalkeeper ? 800 : 400 }}>
                {p.isGoalkeeper ? `${p.goalkeeperSaves}/${p.goalkeeperShotsFaced}` : "—"}
              </td>
              <td style={{ padding: "5px 8px", textAlign: "center", color: p.isGoalkeeper && p.goalkeeperShotsFaced > 0 ? "#12843A" : "#9CA3AF", fontWeight: 700 }}>
                {p.isGoalkeeper && p.goalkeeperShotsFaced > 0 ? `${p.goalkeeperSavePct}%` : "—"}
              </td>
              <td style={{ padding: "5px 8px", textAlign: "center", color: "#4B5563", fontFamily: "monospace" }}>
                {p.isGoalkeeper ? p.goalkeeperXSaves : "—"}
              </td>
              <td style={{ padding: "5px 8px", textAlign: "center", color: p.turnovers > 0 ? "#EF4444" : "#9CA3AF", fontWeight: p.turnovers > 0 ? 800 : 400 }}>
                {p.turnovers}
              </td>
              <td style={{ padding: "5px 8px", textAlign: "center", color: p.twoMins > 0 ? "#D97706" : "#9CA3AF", fontWeight: p.twoMins > 0 ? 800 : 400 }}>
                {p.twoMins}
              </td>
              <td style={{ padding: "5px 8px", textAlign: "right" }}>
                {renderRatingBadge(p.rating)}
              </td>
            </tr>
          ))}
        </tbody>
        {/* Fila de Totales de Equipo */}
        <tfoot>
          <tr style={{ background: "#F3F4F6", borderTop: "2px solid #E5E7EB", fontWeight: 900, color: "#111827", fontSize: "9px" }}>
            <td colSpan={3} style={{ padding: "6px 8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              TOTALES EQUIPO
            </td>
            <td style={{ padding: "6px 8px", textAlign: "center" }}>{totalGoals}/{totalShots}</td>
            <td style={{ padding: "6px 8px", textAlign: "center", color: color }}>{teamEff}%</td>
            <td style={{ padding: "6px 8px", textAlign: "center", fontFamily: "monospace" }}>{totalXg}</td>
            <td style={{ padding: "6px 8px", textAlign: "center" }}>{totalSaves}/{totalFaced}</td>
            <td style={{ padding: "6px 8px", textAlign: "center", color: "#12843A" }}>{teamGkPct}%</td>
            <td style={{ padding: "6px 8px", textAlign: "center", fontFamily: "monospace" }}>{totalXSaves}</td>
            <td style={{ padding: "6px 8px", textAlign: "center", color: "#EF4444" }}>{totalTurnovers}</td>
            <td style={{ padding: "6px 8px", textAlign: "center", color: "#D97706" }}>{totalTwoMins}</td>
            <td style={{ padding: "6px 8px", textAlign: "right" }}>{renderRatingBadge(avgRating)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

/**
 * Módulo Profesional de Creación y Configuración de Informes Técnicos PDF
 * Diseñado con estética integrada y alineada al Design System de HandStats.
 */
export function ReportStatsView({ metrics, match }) {
  if (!metrics) return null;

  const { overview } = metrics;
  const dateStr = match?.date ? new Date(match.date).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" }) : "Fecha oficial";
  const formattedLongDate = match?.date ? new Date(match.date).toLocaleDateString("es-ES", { weekday: "long", year: "numeric", month: "long", day: "numeric" }) : "Fecha oficial";

  const { user } = useAuth() || {};

  // Logos de los equipos (búsqueda exhaustiva en todas las estructuras de match)
  const initialHomeLogo =
    match?.home_logo ||
    match?.homeLogo ||
    match?.home_team_logo ||
    match?.homeTeamLogo ||
    match?.home_team?.logo_url ||
    match?.home_team?.logo ||
    match?.team_home?.logo_url ||
    match?.team_home?.logo ||
    match?.home_team_obj?.logo_url ||
    null;

  const initialAwayLogo =
    match?.away_logo ||
    match?.awayLogo ||
    match?.away_team_logo ||
    match?.awayTeamLogo ||
    match?.away_team?.logo_url ||
    match?.away_team?.logo ||
    match?.team_away?.logo_url ||
    match?.team_away?.logo ||
    match?.away_team_obj?.logo_url ||
    null;

  const [homeLogo, setHomeLogo] = useState(initialHomeLogo);
  const [awayLogo, setAwayLogo] = useState(initialAwayLogo);

  // Sincronizar y consultar equipos guardados en userService si faltara algún escudo
  useEffect(() => {
    if (initialHomeLogo && initialHomeLogo !== homeLogo) {
      setHomeLogo(initialHomeLogo);
    }
    if (initialAwayLogo && initialAwayLogo !== awayLogo) {
      setAwayLogo(initialAwayLogo);
    }

    let isMounted = true;
    const resolveLogosFromSavedTeams = async () => {
      if ((!initialHomeLogo || !initialAwayLogo) && user?._id) {
        try {
          const savedTeams = await userService.getSavedTeams(user._id);
          if (isMounted && Array.isArray(savedTeams)) {
            if (!initialHomeLogo) {
              const foundHome = savedTeams.find(
                (t) => t.name && overview.homeTeam && t.name.trim().toLowerCase() === overview.homeTeam.trim().toLowerCase()
              );
              if (foundHome?.logo_url) {
                setHomeLogo(foundHome.logo_url);
              }
            }
            if (!initialAwayLogo) {
              const foundAway = savedTeams.find(
                (t) => t.name && overview.awayTeam && t.name.trim().toLowerCase() === overview.awayTeam.trim().toLowerCase()
              );
              if (foundAway?.logo_url) {
                setAwayLogo(foundAway.logo_url);
              }
            }
          }
        } catch (err) {
          console.log("Consulta de escudos guardados:", err);
        }
      }
    };

    resolveLogosFromSavedTeams();

    return () => {
      isMounted = false;
    };
  }, [user, overview.homeTeam, overview.awayTeam, initialHomeLogo, initialAwayLogo]);

  const isHomeWinner = overview.homeGoals > overview.awayGoals;
  const isAwayWinner = overview.awayGoals > overview.homeGoals;

  // Cálculo de estadísticas por las 6 zonas de lanzamiento requeridas
  const teamZoneStats = getTeamShotZonesData(match);

  // Cálculo de estadísticas por Fases de Juego (Posicional y 1ª Oleada)
  const gamePhaseStats = getGamePhaseStatsData(match);

  // Cálculo de estadísticas por Situaciones Numéricas (Igualdad, Superioridad e Inferioridad)
  const situationStats = getNumericalSituationStatsData(match);

  // Estado de descarga automática
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Estado de secciones seleccionadas para el informe PDF
  const [selectedSections, setSelectedSections] = useState({
    // SECCIONES OBLIGATORIAS (Siempre activas y fijas)
    header: true,
    result: true,
    generalComparison: true,

    // SECCIONES OPCIONALES (Seleccionables por el usuario)
    teamAnalysis: true,
    gamePhaseAnalysis: true,
    numericalSituationAnalysis: true,
    shotDistribution: true,
    turnovers: true,
    scoreProgression: true,
    playerDetails: true
  });

  const [activePresetId, setActivePresetId] = useState("all");

  // Definición de plantillas: Título, icono y número de módulos
  const PRESETS = [
    {
      id: "all",
      label: "Informe Integral Completo",
      tag: "10 MÓDULOS",
      tagColor: "#10b981",
      icon: <IconStar size={16} color="#10b981" />,
      config: {
        header: true,
        result: true,
        generalComparison: true,
        teamAnalysis: true,
        gamePhaseAnalysis: true,
        numericalSituationAnalysis: true,
        shotDistribution: true,
        turnovers: true,
        scoreProgression: true,
        playerDetails: true
      }
    },
    {
      id: "executive",
      label: "Resumen Ejecutivo",
      tag: "5 MÓDULOS",
      tagColor: "#3b82f6",
      icon: <IconFileText size={16} color="#3b82f6" />,
      config: {
        header: true,
        result: true,
        generalComparison: true,
        teamAnalysis: true,
        gamePhaseAnalysis: false,
        numericalSituationAnalysis: false,
        shotDistribution: false,
        turnovers: false,
        scoreProgression: true,
        playerDetails: false
      }
    },
    {
      id: "tactical",
      label: "Especial Táctica & Fases",
      tag: "7 MÓDULOS",
      tagColor: "#8b5cf6",
      icon: <IconActivity size={16} color="#8b5cf6" />,
      config: {
        header: true,
        result: true,
        generalComparison: true,
        teamAnalysis: true,
        gamePhaseAnalysis: true,
        numericalSituationAnalysis: true,
        shotDistribution: true,
        turnovers: true,
        scoreProgression: false,
        playerDetails: false
      }
    },
    {
      id: "players",
      label: "Plantilla & Tiros",
      tag: "6 MÓDULOS",
      tagColor: "#ec4899",
      icon: <IconUsers size={16} color="#ec4899" />,
      config: {
        header: true,
        result: true,
        generalComparison: true,
        teamAnalysis: false,
        gamePhaseAnalysis: false,
        numericalSituationAnalysis: true,
        shotDistribution: true,
        turnovers: false,
        scoreProgression: false,
        playerDetails: true
      }
    },
    {
      id: "mandatoryOnly",
      label: "Solo Módulos Obligatorios",
      tag: "3 MÓDULOS",
      tagColor: "#6b7280",
      icon: <IconLock size={16} color="#6b7280" />,
      config: {
        header: true,
        result: true,
        generalComparison: true,
        teamAnalysis: false,
        gamePhaseAnalysis: false,
        numericalSituationAnalysis: false,
        shotDistribution: false,
        turnovers: false,
        scoreProgression: false,
        playerDetails: false
      }
    }
  ];

  // Alternar selección de una sección opcional (las obligatorias no se pueden desactivar)
  const toggleSection = (key) => {
    if (key === "header" || key === "result" || key === "generalComparison") return;

    setSelectedSections((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      const matchingPreset = PRESETS.find((p) => {
        return Object.keys(p.config).every((k) => p.config[k] === next[k]);
      });
      setActivePresetId(matchingPreset ? matchingPreset.id : null);
      return next;
    });
  };

  // Aplicar un preset
  const applyPreset = (presetId) => {
    const target = PRESETS.find((p) => p.id === presetId);
    if (target) {
      setSelectedSections(target.config);
      setActivePresetId(target.id);
    }
  };

  // Seleccionar todas
  const handleSelectAll = () => {
    applyPreset("all");
  };

  // Función para generar y descargar directamente el PDF oficial usando jsPDF
  // Función para generar y descargar directamente el PDF oficial usando jsPDF sin duplicados entre páginas
  const handleDownloadPDF = async () => {
    if (isGeneratingPdf) return;
    setIsGeneratingPdf(true);

    const element = document.getElementById("hs-pdf-report-document");
    if (!element) {
      window.print();
      setIsGeneratingPdf(false);
      return;
    }

    try {
      // 1. Mostrar temporalmente el elemento con fondo blanco y ancho fijo A4 (794px = 210mm a 96DPI)
      element.style.display = "block";
      element.style.position = "fixed";
      element.style.top = "0px";
      element.style.left = "0px";
      element.style.width = "794px";
      element.style.background = "#ffffff";
      element.style.zIndex = "-9999";
      element.style.opacity = "1";
      element.style.pointerEvents = "none";

      // 2. Esperar a que las imágenes terminen de cargarse
      const images = Array.from(element.querySelectorAll("img"));
      await Promise.all(
        images.map((img) => {
          if (img.complete) return Promise.resolve();
          return new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
          });
        })
      );

      // Pausa breve para renderizado estable
      await new Promise((r) => setTimeout(r, 150));

      // 3. Capturar el lienzo en alta definición (escala x2 = 300 DPI)
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: "#ffffff",
        windowWidth: 794
      });

      // 4. Parámetros del documento A4 vertical
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true
      });

      const pdfPageWidth = pdf.internal.pageSize.getWidth(); // 210 mm
      const pdfPageHeight = pdf.internal.pageSize.getHeight(); // 297 mm
      const marginX = 8;
      const marginY = 8;
      const contentWidth = pdfPageWidth - marginX * 2; // 194 mm
      const pageAvailableHeight = pdfPageHeight - marginY * 2; // 281 mm

      // Altura máxima disponible por página en píxeles del canvas
      const pxPerMm = canvas.width / contentWidth;
      const pageMaxHeightPx = Math.floor(pageAvailableHeight * pxPerMm);

      // Obtener posiciones relativas de cada sección
      const rootRect = element.getBoundingClientRect();
      const sectionElements = Array.from(element.querySelectorAll(".hs-pdf-section"));

      const sectionBreakpoints = sectionElements.map((el) => {
        const rect = el.getBoundingClientRect();
        const top = Math.round(((rect.top - rootRect.top) / rootRect.height) * canvas.height);
        const bottom = Math.round(((rect.bottom - rootRect.top) / rootRect.height) * canvas.height);
        const forceBreak = el.getAttribute("data-page-break-before") === "true";
        return { top, bottom, height: bottom - top, forceBreak };
      });

      // Calcular puntos de corte óptimos (evitando cortar secciones por la mitad y respetando saltos forzados)
      const cutPoints = [];
      let currentStart = 0;

      while (currentStart < canvas.height - 5) {
        const idealEnd = currentStart + pageMaxHeightPx;

        if (idealEnd >= canvas.height) {
          cutPoints.push(canvas.height);
          break;
        }

        // 1. Prioridad: Buscar si hay alguna sección con salto forzado de página antes de idealEnd
        let bestCut = idealEnd;
        const forcedSec = sectionBreakpoints.find(
          (sec) => sec.forceBreak && sec.top > currentStart + 40 && sec.top <= idealEnd
        );

        if (forcedSec) {
          bestCut = forcedSec.top;
        } else {
          // 2. Si no hay salto forzado, buscar si alguna sección normal queda partida por idealEnd
          for (const sec of sectionBreakpoints) {
            if (sec.top > currentStart + 80 && sec.top < idealEnd && sec.bottom > idealEnd) {
              bestCut = sec.top;
              break;
            }
          }
        }

        cutPoints.push(bestCut);
        currentStart = bestCut;
      }

      // 5. Renderizar página a página extrayendo slices exactos sin ningún solapamiento ni duplicación
      let sliceStart = 0;
      for (let i = 0; i < cutPoints.length; i++) {
        const sliceEnd = cutPoints[i];
        const sliceHeight = sliceEnd - sliceStart;
        if (sliceHeight <= 0) continue;

        if (i > 0) {
          pdf.addPage();
        }

        const sliceCanvas = document.createElement("canvas");
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = sliceHeight;
        const sliceCtx = sliceCanvas.getContext("2d");

        // Fondo blanco
        sliceCtx.fillStyle = "#ffffff";
        sliceCtx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);

        // Copiar exclusivamente el segmento correspondiente sin repeticiones
        sliceCtx.drawImage(
          canvas,
          0,
          sliceStart,
          canvas.width,
          sliceHeight,
          0,
          0,
          canvas.width,
          sliceHeight
        );

        const sliceImgData = sliceCanvas.toDataURL("image/jpeg", 0.98);
        const renderHeightMm = (sliceHeight * contentWidth) / canvas.width;

        pdf.addImage(
          sliceImgData,
          "JPEG",
          marginX,
          marginY,
          contentWidth,
          renderHeightMm,
          undefined,
          "FAST"
        );

        // Pie de página oficial con numeración
        pdf.setFontSize(8);
        pdf.setTextColor(156, 163, 175);
        pdf.text(
          `Página ${i + 1} de ${cutPoints.length} • HandStats Official Report`,
          pdfPageWidth / 2,
          pdfPageHeight - 4,
          { align: "center" }
        );

        sliceStart = sliceEnd;
      }

      // 6. Nombre y descarga automática
      const homeClean = (overview?.homeTeam || "Local").replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]/g, "_");
      const awayClean = (overview?.awayTeam || "Visitante").replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]/g, "_");
      const dateClean = match?.date ? new Date(match.date).toISOString().slice(0, 10) : "Oficial";
      const filename = `HandStats_Informe_${homeClean}_vs_${awayClean}_${dateClean}.pdf`;

      pdf.save(filename);
    } catch (err) {
      console.error("Error al generar PDF con jsPDF:", err);
      window.print();
    } finally {
      element.style.display = "none";
      element.style.position = "static";
      element.style.opacity = "0";
      setIsGeneratingPdf(false);
    }
  };

  // Datos para la comparativa general obligatoria
  const compItems = [
    { label: "Goles Anotados", homeValue: overview.homeGoals, awayValue: overview.awayGoals },
    { label: "Expected Goals (xG)", homeValue: overview.homeXG, awayValue: overview.awayXG },
    { label: "Eficiencia Ofensiva (%)", homeValue: overview.homeOffEfficiency, awayValue: overview.awayOffEfficiency, homeFormatter: (v) => `${v}%`, awayFormatter: (v) => `${v}%` },
    { label: "Eficiencia Defensiva (%)", homeValue: overview.homeDefEfficiency, awayValue: overview.awayDefEfficiency, homeFormatter: (v) => `${v}%`, awayFormatter: (v) => `${v}%` },
    { label: "Posesiones Totales (Nº Ataques)", homeValue: overview.homePossCount, awayValue: overview.awayPossCount, homeFormatter: (v) => `${v} pos`, awayFormatter: (v) => `${v} pos` },
    { label: "Promedio Tiempo por Posesión", homeValue: overview.homeAvgPossDuration, awayValue: overview.awayAvgPossDuration, homeFormatter: (v) => `${v}s`, awayFormatter: (v) => `${v}s` },
    { label: "Paradas Portería (%)", homeValue: overview.homeGKSavePct, awayValue: overview.awayGKSavePct, homeFormatter: (v) => `${v}%`, awayFormatter: (v) => `${v}%` },
    { label: "Expected Saves (xSaves)", homeValue: overview.homeGKExpectedSaves, awayValue: overview.awayGKExpectedSaves },
    { label: "Pérdidas de Balón", homeValue: overview.homeTurnovers, awayValue: overview.awayTurnovers },
    { label: "Rebotes Ofensivos", homeValue: overview.homeOffRebounds, awayValue: overview.awayOffRebounds },
    { label: "Rebotes Defensivos", homeValue: overview.homeDefRebounds, awayValue: overview.awayDefRebounds },
    { label: "Golpes Franco", homeValue: overview.homeFreeThrows, awayValue: overview.awayFreeThrows },
    { label: "Exclusiones (2 Min)", homeValue: overview.home2Min, awayValue: overview.away2Min }
  ];

  // Lista de definición de campos opcionales para el configurador
  const optionalSectionsConfig = [
    {
      key: "teamAnalysis",
      tag: "ZONAS",
      label: "Análisis del Equipo (Tiros por Zona)",
      desc: "Comparativa de lanzamientos, goles, eficacia y volumen por zonas: Extremo, Primera Línea (9m), Pivote, Penetración, Contraataque y 7 Metros.",
      icon: <IconShield size={18} color="#10b981" />
    },
    {
      key: "gamePhaseAnalysis",
      tag: "FASES",
      label: "Análisis de Fases de Juego",
      desc: "Tiros, goles, % gol, 7 metros, pérdidas y % de ataque en juego posicional y contraataque / 1ª oleada.",
      icon: <IconActivity size={18} color="#3b82f6" />
    },
    {
      key: "numericalSituationAnalysis",
      tag: "TÁCTICA",
      label: "Análisis de Situaciones Numéricas",
      desc: "Tiros, goles, % gol, 7 metros, pérdidas y % de ataque en igualdad, superioridad e inferioridad.",
      icon: <IconUsers size={18} color="#8b5cf6" />
    },
    {
      key: "shotDistribution",
      tag: "MAPAS",
      label: "Distribución de Lanzamientos (Mapas de Calor)",
      desc: "Mapas de calor térmicos de lanzamientos en pista y en portería por equipo (sin marcadores y sin pérdidas).",
      icon: <IconTarget size={18} color="#06b6d4" />
    },
    {
      key: "turnovers",
      tag: "PÉRDIDAS",
      label: "Pérdidas de Balón (Mapas de Calor)",
      desc: "Mapas de calor térmicos de pérdidas de balón en pista por equipo (sin marcadores y sin tiros).",
      icon: <IconTurnover size={18} color="#ef4444" />
    },
    {
      key: "scoreProgression",
      tag: "DINÁMICAS",
      label: "Progresión del Marcador & Momentum",
      desc: "Gráfico de evolución temporal del marcador (Step-Chart) y gráfico de flujo de momentum de dominio.",
      icon: <IconTrendingUp size={18} color="#f59e0b" />
    },
    {
      key: "playerDetails",
      tag: "INDIVIDUAL",
      label: "Detalle de Jugadores & Ratings",
      desc: "Tablas completas de estadísticas individuales de la plantilla, porteros y ratings técnicos.",
      icon: <IconBarChart size={18} color="#ec4899" />
    }
  ];

  const totalActive = Object.values(selectedSections).filter(Boolean).length;
  const coveragePct = Math.round((totalActive / 10) * 100);

  return (
    <div className="hs-report-studio-container" style={{ display: "flex", flexDirection: "column", gap: "var(--space-20)" }}>
      {/* =========================================================================
          CABECERA OFICIAL DEL ESTUDIO DE INFORMES (ALINEADA AL DESIGN SYSTEM)
          ========================================================================= */}
      <div className="hs-report-header-banner no-print">
        <div className="hs-report-header-content">
          <div className="hs-report-header-top">
            <span className="hs-report-badge">
              <IconFileText size={12} color="var(--brand-primary)" />
              GENERADOR DE INFORMES PDF
            </span>
            <span className="hs-report-match-context">
              {overview.homeTeam} vs {overview.awayTeam} • {dateStr}
            </span>
          </div>

          <h2 className="hs-report-title">
            Configuración y Exportación de Informe Técnico
          </h2>

          <p className="hs-report-subtitle">
            Selecciona una plantilla de análisis o configura de forma granular los bloques analíticos requeridos para generar el informe oficial del partido.
          </p>

          <div className="hs-report-meta-tags">
            <span className="hs-report-meta-tag">
              <IconCheck size={11} color="var(--brand-primary)" strokeWidth={3} />
              Formato Vectorial A4
            </span>
            <span className="hs-report-meta-tag">
              <IconCheck size={11} color="var(--brand-primary)" strokeWidth={3} />
              Resolución 300 DPI Ultra HD
            </span>
            <span className="hs-report-meta-tag">
              <IconCheck size={11} color="var(--brand-primary)" strokeWidth={3} />
              Certificado Oficial HandStats
            </span>
          </div>
        </div>

        {/* ACCIONES RÁPIDAS EN CABECERA */}
        <div className="hs-report-header-actions">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleSelectAll}
            style={{ fontWeight: 800 }}
          >
            Seleccionar Todos (10)
          </button>

          <button
            type="button"
            className="btn btn-primary"
            onClick={handleDownloadPDF}
            disabled={isGeneratingPdf}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 20px",
              fontWeight: 800,
              fontSize: "0.86rem",
              borderRadius: "var(--radius-sm)",
              boxShadow: "var(--shadow-md)",
              cursor: isGeneratingPdf ? "wait" : "pointer",
              opacity: isGeneratingPdf ? 0.8 : 1
            }}
          >
            {isGeneratingPdf ? (
              <>
                <div style={{ width: "14px", height: "14px", border: "2px solid #ffffff", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                <span>Generando PDF...</span>
              </>
            ) : (
              <>
                <IconDownload size={17} color="#ffffff" />
                <span>Descargar PDF ({totalActive}/10)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* =========================================================================
          PANEL PRINCIPAL A 2 COLUMNAS (ESPACIADO AMPLIO Y EQUILIBRADO)
          ========================================================================= */}
      <div className="no-print" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 380px", gap: "var(--space-20)", alignItems: "start" }}>

        {/* COLUMNA IZQUIERDA: MÓDULOS DE CONFIGURACIÓN */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-20)" }}>

          {/* BLOQUE 1: MÓDULOS BÁSICOS OBLIGATORIOS */}
          <div className="hs-card" style={{ padding: "var(--space-20)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-14)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <IconLock size={16} color="var(--brand-primary)" />
                <h4 style={{ margin: 0, fontSize: "0.86rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.5px", fontFamily: "var(--font-display)" }}>
                  Módulos Básicos Obligatorios
                </h4>
              </div>
              <span style={{ fontSize: "10px", fontWeight: 900, color: "var(--brand-primary)", background: "var(--color-primary-subtle)", border: "1px solid var(--color-primary-border)", padding: "2px 8px", borderRadius: "var(--radius-full)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Fijos en Documento
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "var(--space-10)" }}>
              {/* Obligatorio 1 */}
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                  padding: "12px 14px",
                  borderRadius: "var(--radius-sm)",
                  background: "var(--bg-inset)",
                  border: "1px solid var(--border-color)"
                }}
              >
                <div style={{ width: "26px", height: "26px", borderRadius: "6px", background: "var(--color-primary-subtle)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "1px" }}>
                  <IconFileText size={13} color="var(--brand-primary)" />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  <div style={{ fontSize: "0.82rem", fontWeight: 800, color: "var(--text-primary)" }}>
                    Cabecera HandStats
                  </div>
                  <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", lineHeight: "1.3" }}>
                    Datos corporativos web (<strong style={{ color: "var(--brand-primary)" }}>www.handstats.com</strong>) y metadatos.
                  </div>
                </div>
              </div>

              {/* Obligatorio 2 */}
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                  padding: "12px 14px",
                  borderRadius: "var(--radius-sm)",
                  background: "var(--bg-inset)",
                  border: "1px solid var(--border-color)"
                }}
              >
                <div style={{ width: "26px", height: "26px", borderRadius: "6px", background: "var(--color-primary-subtle)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "1px" }}>
                  <IconStar size={13} color="var(--brand-primary)" />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  <div style={{ fontSize: "0.82rem", fontWeight: 800, color: "var(--text-primary)" }}>
                    Resultado Oficial
                  </div>
                  <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", lineHeight: "1.3" }}>
                    Marcador final ({overview.homeGoals} - {overview.awayGoals}), equipos y dictamen del partido.
                  </div>
                </div>
              </div>

              {/* Obligatorio 3 */}
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                  padding: "12px 14px",
                  borderRadius: "var(--radius-sm)",
                  background: "var(--bg-inset)",
                  border: "1px solid var(--border-color)"
                }}
              >
                <div style={{ width: "26px", height: "26px", borderRadius: "6px", background: "var(--color-primary-subtle)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "1px" }}>
                  <IconSliders size={13} color="var(--brand-primary)" />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  <div style={{ fontSize: "0.82rem", fontWeight: 800, color: "var(--text-primary)" }}>
                    Comparativa General
                  </div>
                  <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", lineHeight: "1.3" }}>
                    Goles, xG, eficiencias, posesiones, paradas y rebotes.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* BLOQUE 2: MÓDULOS TÁCTICOS Y ANALÍTICOS OPCIONALES */}
          <div className="hs-card" style={{ padding: "var(--space-20)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-16)", flexWrap: "wrap", gap: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <IconCheckCircle size={16} color="var(--brand-primary)" />
                <h4 style={{ margin: 0, fontSize: "0.86rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.5px", fontFamily: "var(--font-display)" }}>
                  Módulos Tácticos & Analíticos Opcionales
                </h4>
              </div>
              <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 700 }}>
                Haz clic en cualquier tarjeta para activar o desactivar
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-10)" }}>
              {optionalSectionsConfig.map((sec) => {
                const isSelected = selectedSections[sec.key];
                return (
                  <div
                    key={sec.key}
                    onClick={() => toggleSection(sec.key)}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                      padding: "14px 18px",
                      borderRadius: "var(--radius-sm)",
                      background: isSelected ? "linear-gradient(135deg, var(--bg-surface) 0%, var(--color-primary-subtle) 100%)" : "var(--bg-inset)",
                      border: isSelected ? "1.5px solid var(--brand-primary)" : "1px solid var(--border-color)",
                      cursor: "pointer",
                      transition: "all 0.18s cubic-bezier(0.4, 0, 0.2, 1)",
                      userSelect: "none",
                      boxShadow: isSelected ? "var(--shadow-sm)" : "none"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                        {/* Icono de Sección */}
                        <div
                          style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "var(--radius-sm)",
                            background: isSelected ? "var(--color-primary-subtle)" : "var(--bg-surface)",
                            border: isSelected ? "1px solid var(--color-primary-border)" : "1px solid var(--border-color)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0
                          }}
                        >
                          {sec.icon}
                        </div>

                        {/* Textos y Etiquetas */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ fontSize: "0.84rem", fontWeight: 800, color: isSelected ? "var(--text-primary)" : "var(--text-secondary)" }}>
                              {sec.label}
                            </span>
                            <span
                              style={{
                                fontSize: "9px",
                                fontWeight: 800,
                                padding: "1px 6px",
                                borderRadius: "4px",
                                background: isSelected ? "var(--color-primary-subtle)" : "var(--bg-surface)",
                                color: isSelected ? "var(--brand-primary)" : "var(--text-muted)",
                                border: "1px solid var(--border-color)",
                                letterSpacing: "0.5px"
                              }}
                            >
                              {sec.tag}
                            </span>
                          </div>
                          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", lineHeight: "1.3" }}>
                            {sec.desc}
                          </div>
                        </div>
                      </div>

                      {/* Interruptor Switch Animado */}
                      <div
                        style={{
                          width: "40px",
                          height: "22px",
                          borderRadius: "11px",
                          background: isSelected ? "var(--brand-primary)" : "var(--border-strong)",
                          padding: "2px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: isSelected ? "flex-end" : "flex-start",
                          transition: "all 0.2s ease",
                          flexShrink: 0,
                          marginLeft: "12px"
                        }}
                      >
                        <div
                          style={{
                            width: "18px",
                            height: "18px",
                            borderRadius: "50%",
                            background: "#ffffff",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.3)"
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* =========================================================================
            COLUMNA DERECHA: PLANTILLAS RÁPIDAS (SÓLO TÍTULO + MÓDULOS) Y ESTADO
            ========================================================================= */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-16)", position: "sticky", top: "20px" }}>

          {/* PANEL 1: PLANTILLAS RÁPIDAS (TÍTULO + MÓDULOS) */}
          <div
            className="hs-card"
            style={{
              padding: "var(--space-20)",
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-12)"
            }}
          >
            {/* Cabecera de Plantillas */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--border-color)", paddingBottom: "var(--space-10)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <IconZap size={16} color="var(--brand-primary)" />
                <h4 style={{ margin: 0, fontSize: "0.85rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.5px", fontFamily: "var(--font-display)" }}>
                  Plantillas de Informe
                </h4>
              </div>
              <span style={{ fontSize: "10px", fontWeight: 800, color: "var(--text-muted)" }}>
                Preconfiguraciones
              </span>
            </div>

            {/* Lista de Tarjetas de Plantillas (Título + Módulos) */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {PRESETS.map((preset) => {
                const isActive = activePresetId === preset.id;
                return (
                  <div
                    key={preset.id}
                    onClick={() => applyPreset(preset.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 14px",
                      borderRadius: "var(--radius-sm)",
                      background: isActive ? "linear-gradient(135deg, var(--bg-surface) 0%, var(--color-primary-subtle) 100%)" : "var(--bg-inset)",
                      border: isActive ? `1.5px solid ${preset.tagColor}` : "1px solid var(--border-color)",
                      cursor: "pointer",
                      transition: "all 0.18s cubic-bezier(0.4, 0, 0.2, 1)",
                      boxShadow: isActive ? "var(--shadow-sm)" : "none"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div
                        style={{
                          width: "28px",
                          height: "28px",
                          borderRadius: "6px",
                          background: "var(--bg-surface)",
                          border: `1px solid ${preset.tagColor}40`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0
                        }}
                      >
                        {preset.icon}
                      </div>
                      <span style={{ fontSize: "0.8rem", fontWeight: 800, color: isActive ? "var(--text-primary)" : "var(--text-secondary)" }}>
                        {preset.label}
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span
                        style={{
                          fontSize: "10px",
                          fontWeight: 900,
                          padding: "2px 8px",
                          borderRadius: "4px",
                          background: `${preset.tagColor}18`,
                          color: preset.tagColor,
                          letterSpacing: "0.5px"
                        }}
                      >
                        {preset.tag}
                      </span>
                      {isActive && (
                        <div style={{ width: "16px", height: "16px", borderRadius: "50%", background: preset.tagColor, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <IconCheck size={10} color="#ffffff" strokeWidth={3} />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* PANEL 2: ESTADO DEL DOCUMENTO & BOTÓN DE DESCARGA */}
          <div
            className="hs-card"
            style={{
              padding: "var(--space-20)",
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-14)"
            }}
          >
            {/* Cabecera del Panel */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--border-color)", paddingBottom: "var(--space-10)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <IconFileCheck size={16} color="var(--brand-primary)" />
                <h4 style={{ margin: 0, fontSize: "0.85rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.5px", fontFamily: "var(--font-display)" }}>
                  Estado de Salida
                </h4>
              </div>
              <span style={{ fontSize: "10px", fontWeight: 900, color: "var(--brand-primary)", background: "var(--color-primary-subtle)", padding: "2px 8px", borderRadius: "10px" }}>
                {totalActive} / 10 MÓDULOS
              </span>
            </div>

            {/* Gráfico Radial / Barra de Cobertura */}
            <div style={{ display: "flex", alignItems: "center", gap: "14px", background: "var(--bg-inset)", padding: "12px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)" }}>
              {/* Círculo de porcentaje */}
              <div style={{ position: "relative", width: "46px", height: "46px", flexShrink: 0 }}>
                <svg width="46" height="46" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="var(--border-color)"
                    strokeWidth="3.2"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="var(--brand-primary)"
                    strokeWidth="3.2"
                    strokeDasharray={`${coveragePct}, 100`}
                    strokeLinecap="round"
                  />
                </svg>
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 900, color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>
                  {coveragePct}%
                </div>
              </div>

              {/* Detalle */}
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <span style={{ fontSize: "0.78rem", fontWeight: 800, color: "var(--text-primary)" }}>
                  Cobertura Analítica
                </span>
                <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                  {totalActive === 10 ? "Informe exhaustivo completo" : `${10 - totalActive} secciones omitidas`}
                </span>
              </div>
            </div>

            {/* Especificaciones Técnicas */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "0.72rem" }}>
              <div style={{ background: "var(--bg-surface)", padding: "8px 10px", borderRadius: "var(--radius-xs)", border: "1px solid var(--border-color)" }}>
                <span style={{ color: "var(--text-muted)", display: "block", fontSize: "0.64rem", fontWeight: 700, textTransform: "uppercase" }}>Formato</span>
                <strong style={{ color: "var(--text-primary)" }}>PDF A4 Vectorial</strong>
              </div>
              <div style={{ background: "var(--bg-surface)", padding: "8px 10px", borderRadius: "var(--radius-xs)", border: "1px solid var(--border-color)" }}>
                <span style={{ color: "var(--text-muted)", display: "block", fontSize: "0.64rem", fontWeight: 700, textTransform: "uppercase" }}>Resolución</span>
                <strong style={{ color: "var(--text-primary)" }}>300 DPI HD</strong>
              </div>
              <div style={{ background: "var(--bg-surface)", padding: "8px 10px", borderRadius: "var(--radius-xs)", border: "1px solid var(--border-color)" }}>
                <span style={{ color: "var(--text-muted)", display: "block", fontSize: "0.64rem", fontWeight: 700, textTransform: "uppercase" }}>Páginas Est.</span>
                <strong style={{ color: "var(--text-primary)" }}>{totalActive >= 8 ? "~3 Páginas" : "~2 Páginas"}</strong>
              </div>
              <div style={{ background: "var(--bg-surface)", padding: "8px 10px", borderRadius: "var(--radius-xs)", border: "1px solid var(--border-color)" }}>
                <span style={{ color: "var(--text-muted)", display: "block", fontSize: "0.64rem", fontWeight: 700, textTransform: "uppercase" }}>Descarga</span>
                <strong style={{ color: "var(--brand-primary)" }}>jsPDF Engine</strong>
              </div>
            </div>

            {/* BOTÓN PRINCIPAL DE DESCARGA DIRECTA PDF */}
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleDownloadPDF}
              disabled={isGeneratingPdf}
              style={{
                width: "100%",
                padding: "14px 18px",
                fontWeight: 800,
                fontSize: "0.88rem",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "4px",
                boxShadow: "var(--shadow-md)",
                cursor: isGeneratingPdf ? "wait" : "pointer",
                opacity: isGeneratingPdf ? 0.85 : 1
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {isGeneratingPdf ? (
                  <>
                    <div style={{ width: "16px", height: "16px", border: "2px solid #ffffff", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                    <span>Generando y Descargando PDF...</span>
                  </>
                ) : (
                  <>
                    <IconDownload size={18} color="#ffffff" />
                    <span>Descargar Informe PDF</span>
                  </>
                )}
              </div>
              <span style={{ fontSize: "10px", fontWeight: 600, opacity: 0.85 }}>
                {isGeneratingPdf ? "Procesando documento oficial..." : "Descarga directa automática en formato PDF A4"}
              </span>
            </button>
          </div>

          {/* SELLO DE GARANTÍA Y SEGURIDAD */}
          <div
            style={{
              padding: "10px 14px",
              borderRadius: "var(--radius-sm)",
              background: "var(--bg-surface)",
              border: "1px solid var(--border-color)",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              fontSize: "0.7rem",
              color: "var(--text-muted)"
            }}
          >
            <IconShield size={16} color="var(--brand-primary)" />
            <span>Documento oficial de análisis estructurado por <strong>HandStats</strong>.</span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          DOCUMENTO PDF OFICIAL (RENDERIZADO DIRECTO EN SEGUNDO PLANO Y DESCARGA AUTOMÁTICA)
          ESTRUCTURA DE ALTO RENDIMIENTO CON MÓDULOS OBLIGATORIOS Y OPCIONALES
          ========================================================================= */}
      <div id="hs-pdf-report-document" className="hs-pdf-render-container">
        <div
          className="hs-pdf-report-document"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "18px",
            background: "#ffffff",
            color: "#0C1B13",
            padding: "24px 28px",
            fontFamily: "'Montserrat', 'Inter', -apple-system, sans-serif"
          }}
        >
          {/* =====================================================================
              1 & 2. CABECERA OFICIAL Y RESULTADO DEL PARTIDO (OBLIGATORIO)
              ===================================================================== */}
          <div className="hs-pdf-section" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {/* 1. Cabecera */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                paddingBottom: "10px",
                borderBottom: "2.5px solid #12843A"
              }}
            >
              {/* Logo e Identidad de la App */}
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <img
                  src={logoHorizontal}
                  alt="HandStats"
                  style={{
                    height: "44px",
                    width: "auto",
                    objectFit: "contain"
                  }}
                />
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: "18px", fontWeight: 900, color: "#12843A", letterSpacing: "-0.3px", fontFamily: "'Raleway', 'Montserrat', sans-serif", lineHeight: "1.1" }}>
                    HANDSTATS
                  </span>
                  <span style={{ fontSize: "9.5px", fontWeight: 800, color: "#4B5563", letterSpacing: "0.6px", textTransform: "uppercase" }}>
                    Plataforma Avanzada de Rendimiento y Análisis Técnico
                  </span>
                </div>
              </div>

              {/* Título del Informe, Fecha y Metadatos de la Aplicación */}
              <div style={{ textAlign: "right", display: "flex", flexDirection: "column", gap: "2px" }}>
                <div
                  style={{
                    fontSize: "15px",
                    fontWeight: 900,
                    color: "#0C1B13",
                    letterSpacing: "0.8px",
                    textTransform: "uppercase",
                    fontFamily: "'Raleway', 'Montserrat', sans-serif"
                  }}
                >
                  INFORME OFICIAL DE PARTIDO
                </div>
                <div style={{ fontSize: "11.5px", fontWeight: 800, color: "#12843A" }}>
                  {formattedLongDate}
                </div>
                <div style={{ fontSize: "9.5px", color: "#6B7280", fontWeight: 600 }}>
                  HandStats Analytics • www.handstats.com
                </div>
              </div>
            </div>

            {/* 2. Resultado del Partido */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto 1fr",
                  alignItems: "center",
                  padding: "16px 20px",
                  background: "linear-gradient(180deg, #FFFFFF 0%, #F9FAFB 100%)",
                  border: "1.5px solid #E5E7EB",
                  borderRadius: "8px",
                  boxShadow: "0 2px 5px rgba(0,0,0,0.03)"
                }}
              >
                {/* Equipo Local con Escudo/Logo y Nombre */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "14px", textAlign: "right" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <span style={{ fontSize: "17px", fontWeight: 900, color: "#0C1B13", fontFamily: "'Raleway', 'Montserrat', sans-serif", lineHeight: "1.2" }}>
                      {overview.homeTeam}
                    </span>
                    <span style={{ fontSize: "10.5px", fontWeight: 800, color: "#12843A", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      Equipo Local
                    </span>
                  </div>
                  <TeamLogoBadge name={overview.homeTeam} logoUrl={homeLogo} color="#12843A" isHome={true} />
                </div>

                {/* Marcador Central de Alto Impacto */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "0 22px", minWidth: "150px" }}>
                  <div
                    style={{
                      fontSize: "36px",
                      fontWeight: 900,
                      fontFamily: "'Exo 2', 'SF Mono', monospace",
                      color: "#0C1B13",
                      letterSpacing: "4px",
                      lineHeight: "1",
                      background: "#F4F6F5",
                      border: "1.5px solid #E5E7EB",
                      padding: "5px 18px",
                      borderRadius: "6px",
                      boxShadow: "inset 0 1px 3px rgba(0,0,0,0.04)"
                    }}
                  >
                    {overview.homeGoals} - {overview.awayGoals}
                  </div>

                </div>

                {/* Equipo Visitante con Escudo/Logo y Nombre */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-start", gap: "14px", textAlign: "left" }}>
                  <TeamLogoBadge name={overview.awayTeam} logoUrl={awayLogo} color="#2563EB" isHome={false} />
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <span style={{ fontSize: "17px", fontWeight: 900, color: "#0C1B13", fontFamily: "'Raleway', 'Montserrat', sans-serif", lineHeight: "1.2" }}>
                      {overview.awayTeam}
                    </span>
                    <span style={{ fontSize: "10.5px", fontWeight: 800, color: "#2563EB", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      Equipo Visitante
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* =====================================================================
              COMPARATIVA DE DATOS GENERALES (OBLIGATORIA)
              ===================================================================== */}
          <div className="hs-pdf-section" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <PDFSectionHeader
              title="Comparativa de Datos Generales"
              subtitle="Balance global de métricas ofensivas, defensivas y posesiones"
              tag="Obligatorio"
              tagColor="#12843A"
            />
            <div style={{ border: "1px solid #e5e7eb", borderRadius: "6px", padding: "12px 14px", background: "#ffffff" }}>
              <PDFComparisonChart
                items={compItems}
                homeTeam={overview.homeTeam}
                awayTeam={overview.awayTeam}
                homeLogo={homeLogo}
                awayLogo={awayLogo}
              />
            </div>
          </div>

          {/* =====================================================================
              ANÁLISIS DEL EQUIPO (COMPARATIVA DE TIROS POR ZONA & EFICACIA)
              ===================================================================== */}
          {selectedSections.teamAnalysis && (
            <div className="hs-pdf-section" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <PDFSectionHeader
                title="Análisis del Equipo — Tiros por Zona"
                subtitle="Volumen, goles y porcentaje de eficacia por sector de lanzamiento"
                tag="Zonas de Tiro"
                tagColor="#10B981"
              />
              <div style={{ border: "1px solid #e5e7eb", borderRadius: "6px", padding: "12px 14px", background: "#ffffff" }}>
                <TeamShotZonesComparison
                  zoneStats={teamZoneStats}
                  homeTeam={overview.homeTeam}
                  awayTeam={overview.awayTeam}
                  homeLogo={homeLogo}
                  awayLogo={awayLogo}
                />
              </div>
            </div>
          )}

          {/* =====================================================================
              ANÁLISIS DE FASES DE JUEGO (OPCIONAL)
              ===================================================================== */}
          {selectedSections.gamePhaseAnalysis && (
            <div className="hs-pdf-section" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <PDFSectionHeader
                title="Análisis de Fases de Juego"
                subtitle="Ataque Posicional y Contraataque / 1ª Oleada (Tiros, Goles, 7m, Pérdidas y % Ataque)"
                tag="Fases Tácticas"
                tagColor="#3B82F6"
              />
              <div style={{ border: "1px solid #e5e7eb", borderRadius: "6px", padding: "12px 14px", background: "#ffffff" }}>
                <GamePhaseAnalysisComparison
                  phaseStats={gamePhaseStats}
                  homeTeam={overview.homeTeam}
                  awayTeam={overview.awayTeam}
                />
              </div>
            </div>
          )}

          {/* =====================================================================
              ANÁLISIS DE SITUACIONES NUMÉRICAS (OPCIONAL)
              ===================================================================== */}
          {selectedSections.numericalSituationAnalysis && (
            <div className="hs-pdf-section" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <PDFSectionHeader
                title="Análisis de Situaciones Numéricas"
                subtitle="Rendimiento en Igualdad (6vs6), Superioridad (+1) e Inferioridad (-1)"
                tag="Táctica Numérica"
                tagColor="#8B5CF6"
              />
              <div style={{ border: "1px solid #e5e7eb", borderRadius: "6px", padding: "12px 14px", background: "#ffffff" }}>
                <NumericalSituationAnalysisComparison
                  situationStats={situationStats}
                  homeTeam={overview.homeTeam}
                  awayTeam={overview.awayTeam}
                />
              </div>
            </div>
          )}

          {/* =====================================================================
              DISTRIBUCIÓN DE LANZAMIENTOS (OPCIONAL)
              ===================================================================== */}
          {selectedSections.shotDistribution && (
            <div className="hs-pdf-section" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <PDFSectionHeader
                title="Distribución de Lanzamientos — Mapas Térmicos"
                subtitle="Densidad térmica de tiros en Media Pista y en Portería por equipo (Sin pérdidas)"
                tag="Mapas de Calor"
                tagColor="#06B6D4"
              />
              <div style={{ border: "1px solid #e5e7eb", borderRadius: "6px", padding: "12px 14px", background: "#ffffff" }}>
                <TeamShotDistributionComparison
                  match={match}
                  overview={overview}
                  homeLogo={homeLogo}
                  awayLogo={awayLogo}
                />
              </div>
            </div>
          )}

          {/* =====================================================================
              PÉRDIDAS DE BALÓN (OPCIONAL)
              ===================================================================== */}
          {selectedSections.turnovers && (
            <div className="hs-pdf-section" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <PDFSectionHeader
                title="Pérdidas de Balón — Mapas Térmicos en Pista"
                subtitle="Zonas de pérdida en pista y principales tipologías de error no forzado (Sin tiros)"
                tag="Pérdidas de Balón"
                tagColor="#EF4444"
              />
              <div style={{ border: "1px solid #e5e7eb", borderRadius: "6px", padding: "12px 14px", background: "#ffffff" }}>
                <TeamTurnoversHeatmapComparison
                  match={match}
                  overview={overview}
                  homeLogo={homeLogo}
                  awayLogo={awayLogo}
                />
              </div>
            </div>
          )}

          {/* =====================================================================
              PROGRESIÓN DEL MARCADOR & MOMENTUM (OPCIONAL)
              ===================================================================== */}
          {selectedSections.scoreProgression && (
            <div className="hs-pdf-section" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <PDFSectionHeader
                title="Progresión del Marcador & Momentum"
                subtitle="Evolución temporal del tanteador (Step-Chart cada 5') y Curva de Flujo de Dominio"
                tag="Dinámica de Partido"
                tagColor="#F59E0B"
              />
              <div style={{ border: "1px solid #e5e7eb", borderRadius: "6px", padding: "12px 14px", background: "#ffffff" }}>
                <PDFScoreProgressionAndMomentum
                  metrics={metrics}
                  match={match}
                  overview={overview}
                />
              </div>
            </div>
          )}

          {/* =====================================================================
              DETALLE DE JUGADORES — EQUIPO LOCAL (PÁGINA DEDICADA)
              ===================================================================== */}
          {selectedSections.playerDetails && (
            <div className="hs-pdf-section" data-page-break-before="true" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <PDFSectionHeader
                title={`Detalle de Jugadores — ${overview.homeTeam}`}
                subtitle="Estadísticas individuales de campo, rendimiento en portería y rating técnico"
                tag="Plantilla Local"
                tagColor="#12843A"
              />
              <PDFSingleTeamPlayersTable
                teamName={overview.homeTeam}
                playersList={metrics?.homePlayerStats || []}
                color="#12843A"
                isAway={false}
                overview={overview}
                logoUrl={homeLogo}
              />
            </div>
          )}

          {/* =====================================================================
              DETALLE DE JUGADORES — EQUIPO VISITANTE (PÁGINA DEDICADA)
              ===================================================================== */}
          {selectedSections.playerDetails && (
            <div className="hs-pdf-section" data-page-break-before="true" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <PDFSectionHeader
                title={`Detalle de Jugadores — ${overview.awayTeam}`}
                subtitle="Estadísticas individuales de campo, rendimiento en portería y rating técnico"
                tag="Plantilla Visitante"
                tagColor="#2563EB"
              />
              <PDFSingleTeamPlayersTable
                teamName={overview.awayTeam}
                playersList={metrics?.awayPlayerStats || []}
                color="#2563EB"
                isAway={true}
                overview={overview}
                logoUrl={awayLogo}
              />
            </div>
          )}

          {/* PIE DE PÁGINA */}
          <div style={{ marginTop: "12px", paddingTop: "8px", borderTop: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", fontSize: "9.5px", color: "#9ca3af" }}>
            <span>HandStats Analytics • www.handstats.com • Documento Confidencial</span>
            <span>Generado el {new Date().toLocaleDateString("es-ES")}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
