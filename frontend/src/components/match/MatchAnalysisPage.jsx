import { useState, useEffect, useRef, useMemo } from "react";
// HandStats Match Analysis Page - Cleaned Icon Imports
import {
  ArrowLeft as IconArrowLeft,
  Undo2 as IconUndo,
  Goal as IconGoalNet,
  Target as IconGoal7m,
  XCircle as IconMiss,
  Shield as IconSaveGlove,
  ShieldAlert as IconSave7m,
  Square as IconPost,
  ArrowUpRight as IconFuera,
  TimerReset as IconTimeout,
  ArrowRightLeft as IconBadPass,
  Repeat2 as IconDoubleDribble,
  Footprints as IconFootsteps,
  Hand as IconPassivePlay,
  Timer as IconTimer2m,
  BarChart2 as IconBarChart,
  Flag as IconFlag,
  Briefcase as IconBriefcase,
  Check as IconCheck,
  Play as IconPlay,
  Pause as IconPause,
  Megaphone as IconMegaphone,
  Users as IconUsers,
  Shield as IconShield,
  Clock as IconClock,
  AlertTriangle as IconAlertTriangle,
  Disc as IconBall,
  ChevronRight as IconArrowRight,
  Eye as IconEye,
  EyeOff as IconEyeOff,
  Zap as IconZap,
  Flame as IconFlame,
  User as IconUser,
  MousePointerClick as IconClick,
  X as IconX,
  Swords as IconSwords,
  Info as IconInfo,
  Target as IconTarget
} from 'lucide-react';
import { useMatch } from "../../context/MatchContext";
import userService from "../../services/userService";
import MatchStatsModule from "../../stats/MatchStatsModule";
import { getEventCategory, formatCourtZoneName, formatGoalZoneName } from "../../stats/engine/types";
import { calculateShotXG, calculateShotXSaves } from "../../stats/engine/xgModel";
import isotipo from "../../assets/isotipo.png";
import "./MatchAnalysisPage.css";

const goalZones = [
  // Fuera (Outside)
  { id: "OA", label: "Fuera Arriba", group: "fuera", style: { gridRow: "1", gridColumn: "2 / 7" }, className: "zone-outside zone-above" },
  { id: "OL", label: "Fuera Izquierda", group: "fuera", style: { gridRow: "2 / 6", gridColumn: "1" }, className: "zone-outside zone-left" },
  { id: "OR", label: "Fuera Derecha", group: "fuera", style: { gridRow: "2 / 6", gridColumn: "7" }, className: "zone-outside zone-right" },
  // Palos (Posts)
  { id: "TP", label: "Larguero", group: "poste", style: { gridRow: "2", gridColumn: "2 / 7" }, className: "zone-post zone-crossbar" },
  { id: "LP", label: "Poste Izquierdo", group: "poste", style: { gridRow: "3 / 6", gridColumn: "2" }, className: "zone-post zone-post-left" },
  { id: "RP", label: "Poste Derecho", group: "poste", style: { gridRow: "3 / 6", gridColumn: "6" }, className: "zone-post zone-post-right" },
  // Interior (Inside)
  { id: "TL", label: "Sup. Izq.", group: "interior", style: { gridRow: "3", gridColumn: "3" }, className: "zone-inside zone-top-left" },
  { id: "TC", label: "Sup. Centro", group: "interior", style: { gridRow: "3", gridColumn: "4" }, className: "zone-inside zone-top-center" },
  { id: "TR", label: "Sup. Der.", group: "interior", style: { gridRow: "3", gridColumn: "5" }, className: "zone-inside zone-top-right" },
  { id: "ML", label: "Mid Izq.", group: "interior", style: { gridRow: "4", gridColumn: "3" }, className: "zone-inside zone-mid-left" },
  { id: "C", label: "Centro", group: "interior", style: { gridRow: "4", gridColumn: "4" }, className: "zone-inside zone-center" },
  { id: "MR", label: "Mid Der.", group: "interior", style: { gridRow: "4", gridColumn: "5" }, className: "zone-inside zone-mid-right" },
  { id: "BL", label: "Inf. Izq.", group: "interior", style: { gridRow: "5", gridColumn: "3" }, className: "zone-inside zone-bottom-left" },
  { id: "BC", label: "Inf. Centro", group: "interior", style: { gridRow: "5", gridColumn: "4" }, className: "zone-inside zone-bottom-center" },
  { id: "BR", label: "Inf. Der.", group: "interior", style: { gridRow: "5", gridColumn: "5" }, className: "zone-inside zone-bottom-right" }
];

const getZoneLabel = (zoneId) => {
  const labels = {
    OA: "Fuera Arriba",
    OL: "Fuera Izquierda",
    OR: "Fuera Derecha",
    TP: "Larguero",
    LP: "Poste Izquierdo",
    RP: "Poste Derecho",
    TL: "Sup. Izquierdo",
    TC: "Sup. Centro",
    TR: "Sup. Derecho",
    ML: "Med. Izquierdo",
    C: "Centro",
    MR: "Med. Derecho",
    BL: "Inf. Izquierdo",
    BC: "Inf. Centro",
    BR: "Inf. Derecho"
  };
  return labels[zoneId] || zoneId;
};

function IconUserCheck({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <polyline points="16 11 18 13 22 9" />
    </svg>
  );
}

function IconMatch({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18" />
      <path d="M9 21V9" />
    </svg>
  );
}

function IconChartBar({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="20" x2="12" y2="10" />
      <line x1="18" y1="20" x2="18" y2="4" />
      <line x1="6" y1="20" x2="6" y2="16" />
    </svg>
  );
}

function IconClipboard({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    </svg>
  );
}

function IconFolder({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function IconSettings({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function IconSun({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function IconMoon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function IconSoccerBall({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.6))", display: "block" }}>
      <circle cx="12" cy="12" r="10" fill="#ffffff" stroke="#000000" strokeWidth="1.5" />
      <polygon points="12,7.2 14.8,9.2 13.7,12.5 10.3,12.5 9.2,9.2" fill="#000000" />
      <line x1="12" y1="7.2" x2="12" y2="2" stroke="#000000" strokeWidth="1.4" />
      <line x1="14.8" y1="9.2" x2="19.5" y2="7.7" stroke="#000000" strokeWidth="1.4" />
      <line x1="13.7" y1="12.5" x2="16.5" y2="17.2" stroke="#000000" strokeWidth="1.4" />
      <line x1="10.3" y1="12.5" x2="7.5" y2="17.2" stroke="#000000" strokeWidth="1.4" />
      <line x1="9.2" y1="9.2" x2="4.5" y2="7.7" stroke="#000000" strokeWidth="1.4" />
    </svg>
  );
}

function IconFreeThrow({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

export default function MatchAnalysisPage({ user, onBack, initialMode = "live", theme, toggleTheme }) {
  const {
    currentMatch,
    activePossession,
    setActivePossession,
    sendMatchEvent,
    closePossession,
    undoLastEvent,
  } = useMatch();

  // Estado y Toggle de Tema (Claro / Oscuro)
  const [currentTheme, setCurrentTheme] = useState(() => {
    return theme || document.documentElement.getAttribute("data-theme") || "dark";
  });

  useEffect(() => {
    if (theme) {
      setCurrentTheme(theme);
    }
  }, [theme]);

  const handleToggleTheme = () => {
    if (toggleTheme) {
      toggleTheme();
    } else {
      const nextTheme = currentTheme === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", nextTheme);
      localStorage.setItem("hs_theme", nextTheme);
      setCurrentTheme(nextTheme);
    }
  };

  // Cronómetro, Periodo, Vista Principal y Selección Táctica Exacta
  const [mainViewMode, setMainViewMode] = useState(initialMode); // "live" | "stats"
  const [currentPeriod, setCurrentPeriod] = useState("1ª PARTE");
  const [courtCoord, setCourtCoord] = useState({ x: 50, y: 40 }); // Coordenadas % en Media Pista
  const [goalCoord, setGoalCoord] = useState({ x: 22, y: 22 }); // Coordenadas % en Portería
  // Estado para la Acción Activa de Interacción Directa en Pista y Portería (SIN POPUPS)
  const [activeActionFlow, setActiveActionFlow] = useState(null);

  const getDistanceToGoal = (svgX, svgY) => {
    if (svgY <= 8) return 0;
    if (svgX < 165) {
      const dx = svgX - 165;
      const dy = svgY - 8;
      return Math.sqrt(dx * dx + dy * dy);
    }
    if (svgX > 235) {
      const dx = svgX - 235;
      const dy = svgY - 8;
      return Math.sqrt(dx * dx + dy * dy);
    }
    return svgY - 8;
  };

  const getCourtZoneLabel = (coord) => {
    if (!coord) return "9M Central";
    const { x, y } = coord;
    const svgX = x * 4.0;
    const svgY = y * 3.0;

    // 1. Modificador de 1ª Oleada / Contraataque
    if (activeActionFlow?.isFirstWave) {
      return x < 35 ? "Contraataque Izquierdo" : x > 65 ? "Contraataque Derecho" : "Contraataque Central";
    }

    // 2. EXTREMO IZQUIERDO (COLOR NARANJA IZQ: X 0-10%, Y 0-21%)
    if (svgX <= 40 && svgY <= 63) {
      return "Extremo Izquierdo";
    }
    // 3. EXTREMO DERECHO (COLOR NARANJA DER: X 90-100%, Y 0-21%)
    if (svgX >= 360 && svgY <= 63) {
      return "Extremo Derecho";
    }

    // Calcular la distancia radial r a la línea de gol / postes
    const r = getDistanceToGoal(svgX, svgY);

    // 4. ÁREA DE PORTERÍA DE 6M (SIN COLOR: R < 135)
    if (r < 135) {
      return "Área de Portería (Sin Posición)";
    }

    // Determinar el límite exterior exacto de la franja curva azul de Pivote / Penetración:
    // En la zona central el límite es r <= 198. En las bandas laterales el límite ajustado a la cinta azul es r <= 176.
    const maxBlueRadius = (svgX >= 145 && svgX <= 255) ? 198 : 176;

    // 5. ZONA AZUL COMPLETA (MEDIA LUNA AZUL: 135 <= R <= maxBlueRadius)
    if (r <= maxBlueRadius) {
      if (activeActionFlow?.isPenetration) {
        return svgX < 200 ? "Penetración Izquierda" : "Penetración Derecha";
      }
      return "Pivote 6M";
    }

    // 6. SECTORES POR DETRÁS DE LA LÍNEA CURVA DE 9M (R > maxBlueRadius)
    // COLOR ROSA (9M LATERAL IZQUIERDO: X <= 31%)
    if (svgX <= 124) return "9M Lateral Izquierdo";

    // COLOR BLANCO (9M LATERAL DERECHO: X >= 69%)
    if (svgX >= 276) return "9M Lateral Derecho";

    // COLOR VERDE (9M CENTRAL: 31% < X < 69%)
    return "9M Central";
  };

  const getGoalZoneLabel = (coord, isPostAction = false, isOutAction = false) => {
    if (!coord) return "Escuadra Superior Izquierda";
    const { x, y } = coord;

    // Fuera: zonas exteriores claramente separadas
    if (isOutAction || y < 11 || x < 8.5 || x > 91.5) {
      if (y < 14) return "Fuera Arriba";
      if (x < 15) return "Fuera Izquierda";
      return "Fuera Derecha";
    }

    // Postes y Larguero
    if (isPostAction || (y >= 10 && y <= 18) || (x >= 8 && x <= 13) || (x >= 87 && x <= 92)) {
      if (y >= 10 && y <= 18 && x >= 13 && x <= 87) return "Larguero Superior";
      if (x <= 13) return "Poste Izquierdo";
      if (x >= 87) return "Poste Derecho";
    }

    // Zonas interiores de portería
    let horiz = x < 38 ? "Escuadra Sup. Izquierda" : x > 62 ? "Escuadra Sup. Derecha" : "Superior Centro";
    if (y > 45 && y < 75) {
      horiz = x < 38 ? "Medio Izquierda" : x > 62 ? "Medio Derecha" : "Centro Portería";
    } else if (y >= 75) {
      horiz = x < 38 ? "Inferior Izquierda (Raso)" : x > 62 ? "Inferior Derecha (Raso)" : "Inferior Centro (Raso)";
    }
    return horiz;
  };

  const handleCourtClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.min(100, Math.max(0, Math.round(((e.clientX - rect.left) / rect.width) * 100)));
    const y = Math.min(100, Math.max(0, Math.round(((e.clientY - rect.top) / rect.height) * 100)));
    setCourtCoord({ x, y });

    const courtZone = getCourtZoneLabel({ x, y });

    if (activeActionFlow && activeActionFlow.step === "AWAITING_COURT_CLICK") {
      if (activeActionFlow.actionKey.startsWith("perdida")) {
        executeDirectAction({
          ...activeActionFlow,
          courtCoord: { x, y },
          shotZone: courtZone
        });
        return;
      }

      // SI SE HACE CLIC EN LA ZONA DE PIVOTE (MEDIA LUNA AZUL) -> MOSTRAR POPUP EXCLUSIVO DE SELECCIÓN
      if (courtZone === "Pivote 6M" || courtZone.startsWith("Pivote")) {
        setPendingPivotFlow({
          ...activeActionFlow,
          courtCoord: { x, y },
          baseZone: courtZone
        });
        setShowPivotOptionModal(true);
        return;
      }

      // PARA CUALQUIER OTRA ZONA (EXTREMOS, 9M LATERALES, 9M CENTRAL) -> SIN POPUP, AVANZA DIRECTAMENTE A PORTERÍA
      setActiveActionFlow(prev => ({
        ...prev,
        courtCoord: { x, y },
        shotZone: courtZone,
        step: "AWAITING_GOAL_CLICK"
      }));
    }
  };

  const handleGoalClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.min(100, Math.max(0, Math.round(((e.clientX - rect.left) / rect.width) * 100)));
    const y = Math.min(100, Math.max(0, Math.round(((e.clientY - rect.top) / rect.height) * 100)));
    setGoalCoord({ x, y });

    const isPost = activeActionFlow?.actionKey === "poste";
    const isOut = activeActionFlow?.actionKey === "fuera";
    const goalZone = getGoalZoneLabel({ x, y }, isPost, isOut);

    if (activeActionFlow && activeActionFlow.step === "AWAITING_GOAL_CLICK") {
      if (activeActionFlow.actionKey === "gol" || activeActionFlow.actionKey === "gol_7m" || activeActionFlow.actionKey === "fuera") {
        executeDirectAction({
          ...activeActionFlow,
          goalCoord: { x, y },
          goalZone
        });
        return;
      }

      setActiveActionFlow(prev => ({
        ...prev,
        goalCoord: { x, y },
        goalZone,
        step: "AWAITING_REBOUND"
      }));
    }
  };

  const calculatedHomeGoals = useMemo(() => {
    if (!currentMatch) return 0;
    if (typeof currentMatch.goals_home === "number") return currentMatch.goals_home;
    if (!currentMatch.events) return 0;
    return currentMatch.events.filter(e => e.event_type === "shot" && e.result === "Gol" && !e.is_opponent_action).length;
  }, [currentMatch]);

  const calculatedAwayGoals = useMemo(() => {
    if (!currentMatch) return 0;
    if (typeof currentMatch.goals_away === "number") return currentMatch.goals_away;
    if (!currentMatch.events) return 0;
    return currentMatch.events.filter(e => e.event_type === "shot" && e.result === "Gol" && e.is_opponent_action).length;
  }, [currentMatch]);

  const [firstPeriodPossession, setFirstPeriodPossession] = useState(() => {
    return currentMatch.first_period_possession || null;
  });

  const [showInitialPossessionModal, setShowInitialPossessionModal] = useState(() => {
    return !currentMatch.first_period_possession && (!currentMatch.events || currentMatch.events.length === 0);
  });

  const handleSelectInitialPossession = (team) => {
    setFirstPeriodPossession(team);
    setShowInitialPossessionModal(false);
    if (setActivePossession) {
      setActivePossession(prev => ({ ...prev, team, situation: "Igualdad" }));
    }
  };

  const handleEndPeriod = () => {
    setIsRunning(false);
    if (currentPeriod === "1ª PARTE") {
      setCurrentPeriod("2ª PARTE");
      // Saque inicial de la 2ª Parte: Cambia automáticamente al equipo contrario
      const startTeam = firstPeriodPossession || activePossession.team || "LOCAL";
      const secondHalfTeam = startTeam === "LOCAL" ? "VISITANTE" : "LOCAL";
      if (setActivePossession) {
        setActivePossession(prev => ({ ...prev, team: secondHalfTeam, situation: "Igualdad" }));
      }
    } else if (currentPeriod === "2ª PARTE") {
      setCurrentPeriod("PRÓRROGA");
      const startTeam = firstPeriodPossession || "LOCAL";
      if (setActivePossession) {
        setActivePossession(prev => ({ ...prev, team: startTeam, situation: "Igualdad" }));
      }
    } else {
      setCurrentPeriod("FINAL");
    }
  };

  useEffect(() => {
    if (initialMode) {
      setMainViewMode(initialMode);
    }
  }, [initialMode]);
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const timerRef = useRef(null);
  const lastMatchIdRef = useRef(null);
  const lastPossessionsLengthRef = useRef(-1);
  const isUndoingRef = useRef(null);

  // Estados para edición manual del tiempo
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [inputMinutes, setInputMinutes] = useState("");
  const [inputSeconds, setInputSeconds] = useState("");

  // Modal exclusivo de opciones para la zona de pivote
  const [showPivotOptionModal, setShowPivotOptionModal] = useState(false);
  const [pendingPivotFlow, setPendingPivotFlow] = useState(null);

  // Estado para visibilidad de zonas en pista y filtro de historial
  const [showCourtZones, setShowCourtZones] = useState(true);
  const [historyFilter, setHistoryFilter] = useState("TODOS");

  const handleCancelAction = () => {
    setActiveActionFlow(null);
    setCourtCoord(null);
    setGoalCoord(null);
    setSelectedPlayer(null);
  };

  const handleSelectPivotOption = (optionType) => {
    let finalShotZone = "Pivote 6M";
    let isPen = false;
    let isFirstWave = false;

    if (optionType === "penetración") {
      finalShotZone = "Penetración 6M";
      isPen = true;
    } else if (optionType === "contraataque") {
      finalShotZone = "Contraataque 6M";
      isFirstWave = true;
    }

    setActiveActionFlow({
      ...pendingPivotFlow,
      shotZone: finalShotZone,
      isPenetration: isPen,
      isFirstWave: isFirstWave,
      step: "AWAITING_GOAL_CLICK"
    });

    setShowPivotOptionModal(false);
    setPendingPivotFlow(null);
  };

  // Inicialización de Posesión
  const [possessionStarted, setPossessionStarted] = useState(false);

  // Jugador seleccionado
  const [selectedPlayer, setSelectedPlayer] = useState(null); // null | playerObject | "team"

  // Modificadores de la acción seleccionada
  const [shotType, setShotType] = useState("exterior"); // extremo | pivote | exterior | penetracion | siete_metros
  const [numericalSituation, setNumericalSituation] = useState("Igualdad"); // Igualdad | Superioridad | Inferioridad
  const [playPhase, setPlayPhase] = useState("Posicional"); // Posicional | Contraataque
  const [showZoneOverlay, setShowZoneOverlay] = useState(true); // Esquema zonal visible de la media pista

  // Menú y subvistas de acciones
  const [activeActionSubmenu, setActiveActionSubmenu] = useState(null); // null | "gol" | "parada" | "fuera" | "perdida" | "sanciones" | "tiempo_muerto" | "fin_periodo" | "select_opposing_goalkeeper" | "select_opposing_shooter"
  const [tempResult, setTempResult] = useState("Fuera");
  const [pendingAction, setPendingAction] = useState(null);
  const [shotResult, setShotResult] = useState("Gol"); // "Gol" | "Parada" | "Fuera" | "Poste"
  const [selectedPhase, setSelectedPhase] = useState("Posicional"); // "Posicional" | "1ª Oleada" | "2ª Oleada" | "7m"
  const [selectedShotType, setSelectedShotType] = useState("Exterior"); // "Extremo" | "Pivote" | "Exterior" | "Penetración"
  const [selectedPosition, setSelectedPosition] = useState("Centro"); // string
  const [selectedNumericalSituation, setSelectedNumericalSituation] = useState("Igualdad"); // "Igualdad" | "Superioridad" | "Inferioridad"
  const [selectedAssistPosition, setSelectedAssistPosition] = useState("Ninguna"); // "Ninguna" | "Portero" | "Extremo Izquierdo" | ...
  const [selectedSanctionType, setSelectedSanctionType] = useState("Tarjeta Amarilla"); // "Tarjeta Amarilla" | "2 Minutos" | "Tarjeta Roja" | "Tarjeta Azul"
  const [selectedTeamAction, setSelectedTeamAction] = useState(null); // null | { team: "LOCAL" | "VISITANTE", action: "lanzamiento" | "perdida" | "sancion" | "free_throw" | "penalty_7m" | "falta_en_ataque" }
  const [pending7mDetails, setPending7mDetails] = useState({ defender: null, attacker: null });
  const [pendingFaltaAtaqueDetails, setPendingFaltaAtaqueDetails] = useState({ attacker: null, defender: null });

  const [actionCaptureTime, setActionCaptureTime] = useState(null); // Captura el tiempo en el momento del click inicial

  const [savedTeams, setSavedTeams] = useState([]);

  useEffect(() => {
    if (user?.role === "guest" || !user?._id) return;
    const loadSavedTeams = async () => {
      try {
        const teams = await userService.getSavedTeams(user._id);
        setSavedTeams(teams || []);
      } catch (err) {
        console.log("No se pudieron cargar equipos guardados en el análisis:", err);
      }
    };
    loadSavedTeams();
  }, [user]);

  const handleStartEditTime = () => {
    const mins = Math.floor(time / 60);
    const secs = time % 60;
    setInputMinutes(mins.toString());
    setInputSeconds(secs.toString().padStart(2, "0"));
    setIsEditingTime(true);
    setIsRunning(false); // Pausar mientras edita
  };

  const handleSaveTime = () => {
    const mins = parseInt(inputMinutes, 10) || 0;
    const secs = parseInt(inputSeconds, 10) || 0;
    const newTime = mins * 60 + Math.min(59, Math.max(0, secs));
    setTime(newTime);

    // Sincronizar el start_time de la posesión actual si aún no ha finalizado
    setActivePossession(p => ({ ...p, start_time: newTime }));

    setIsEditingTime(false);
  };

  const isTimeInitializedRef = useRef(false);

  // Efecto para inicializar la posesión a partir del historial del partido (Únicamente la primera vez o en cambio de partido)
  useEffect(() => {
    if (!currentMatch) return;

    const matchIdStr = currentMatch._id ? String(currentMatch._id) : (currentMatch.id ? String(currentMatch.id) : "");

    // Si ya fue inicializado para el partido actual y no estamos deshaciendo una acción, no reseteamos
    if (isTimeInitializedRef.current && lastMatchIdRef.current === matchIdStr && !isUndoingRef.current) {
      return;
    }

    lastMatchIdRef.current = matchIdStr;
    isTimeInitializedRef.current = true;

    const undoInfo = isUndoingRef.current;
    isUndoingRef.current = null; // Limpiar el flag

    if (currentMatch.possessions && currentMatch.possessions.length > 0) {
      const sorted = [...currentMatch.possessions].sort(
        (a, b) => b.possession_number - a.possession_number
      );
      const lastPoss = sorted[0];

      let targetTeam = lastPoss.team;
      let targetPossNumber = lastPoss.possession_number;

      if (undoInfo && undoInfo.eventTeam) {
        // Al deshacer una acción, se restaura automáticamente la posesión al equipo que ejecutó la acción
        targetTeam = undoInfo.eventTeam;
      } else if (lastPoss.end_reason) {
        if (lastPoss.end_reason === "Fin 1ª Parte") {
          const firstPoss = currentMatch.possessions.find(p => p.possession_number === 1);
          const firstTeam = firstPoss ? firstPoss.team : "LOCAL";
          targetTeam = firstTeam === "LOCAL" ? "VISITANTE" : "LOCAL";
        } else {
          targetTeam = lastPoss.team === "LOCAL" ? "VISITANTE" : "LOCAL";
        }
        targetPossNumber = lastPoss.possession_number + 1;
      }

      setActivePossession({
        possession_number: targetPossNumber,
        team: targetTeam,
        start_time: undoInfo ? undoInfo.targetTime : (lastPoss.end_time || lastPoss.start_time || 0),
        phase: "Posicional",
        situation: "Igualdad",
      });
      setTime(undoInfo ? undoInfo.targetTime : (lastPoss.end_time || 0));
      setPossessionStarted(true);
    } else {
      setActivePossession({
        possession_number: 1,
        team: firstPeriodPossession || "LOCAL",
        start_time: 0,
        phase: "Posicional",
        situation: "Igualdad",
      });
      if (undoInfo) {
        setTime(undoInfo.targetTime);
      } else {
        setTime(prev => (prev > 0 ? prev : 0));
      }
      setPossessionStarted(false);
    }
  }, [currentMatch]);

  // Manejo del Intervalo del Cronómetro
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTime((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRunning]);

  if (!currentMatch) {
    return (
      <div className="analysis-loading">
        <h3>Cargando partido para análisis...</h3>
      </div>
    );
  }

  // Formatear Tiempo MM:SS
  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Ajustes de Cronómetro
  const adjustTime = (amount) => {
    setTime((prev) => Math.max(0, prev + amount));
  };

  // Determinar equipo en ataque y en defensa
  const attackingTeamName =
    activePossession.team === "LOCAL"
      ? currentMatch.home_team
      : currentMatch.away_team;

  const defendingTeamName =
    activePossession.team === "LOCAL"
      ? currentMatch.away_team
      : currentMatch.home_team;

  // Helper to determine if a player is a goalkeeper, with a fallback to dorsales 1, 12, 16
  const isGoalkeeper = (player) => {
    if (!player) return false;

    // 1. Si el jugador del partido tiene explícitamente is_goalkeeper === true
    if (player.is_goalkeeper === true || player.is_goalkeeper === "true") return true;

    // 2. Cruze con Equipos Guardados del usuario (para matches antiguos o no sincronizados)
    const isHome = (currentMatch.home_players || []).some(
      (p) => p.number === player.number && p.name === player.name
    );
    const teamName = isHome ? currentMatch.home_team : currentMatch.away_team;

    const savedTeam = savedTeams.find(
      (t) => t.name.toLowerCase() === (teamName || "").toLowerCase()
    );

    if (savedTeam && savedTeam.players) {
      const savedPlayer = savedTeam.players.find(
        (sp) => sp.number === player.number || sp.name.toLowerCase() === player.name.toLowerCase()
      );
      if (savedPlayer) {
        return savedPlayer.is_goalkeeper === true || savedPlayer.is_goalkeeper === "true";
      }
    }

    // 3. Fallback: si el equipo no tiene ningún portero explícito
    const teamPlayers = isHome ? (currentMatch.home_players || []) : (currentMatch.away_players || []);
    const hasAnyExplicitGk = teamPlayers.some(
      (p) => p.is_goalkeeper === true || p.is_goalkeeper === "true"
    );

    if (!hasAnyExplicitGk) {
      return [1, 12, 16].includes(player.number);
    }
    return false;
  };

  // Lista de jugadores elegibles para el ataque actual
  const attackingPlayers =
    activePossession.team === "LOCAL"
      ? currentMatch.home_players || []
      : currentMatch.away_players || [];

  const attackingFieldPlayers = attackingPlayers.filter(p => !isGoalkeeper(p));

  const defendingGoalkeepers = (activePossession.team === "LOCAL"
    ? currentMatch.away_players || []
    : currentMatch.home_players || []
  ).filter(p => isGoalkeeper(p));

  const handleUndo = async () => {
    if (currentMatch?.events && currentMatch.events.length > 0) {
      const lastEvent = currentMatch.events[currentMatch.events.length - 1];
      if (lastEvent) {
        const targetTime = typeof lastEvent.match_time_seconds === "number" ? lastEvent.match_time_seconds : time;
        setTime(targetTime);
        if (lastEvent.team) {
          setActivePossession(prev => ({
            ...prev,
            team: lastEvent.team
          }));
        }
        isUndoingRef.current = {
          targetTime,
          eventTeam: lastEvent.team
        };
      }
    }
    await undoLastEvent();
  };

  // Inicializar Posesión inicial
  const handleStartPossession = (teamSide) => {
    setActivePossession({
      possession_number: 1,
      team: teamSide,
      start_time: time,
      phase: "Posicional",
      situation: "Igualdad",
    });
    setPossessionStarted(true);
    setIsRunning(true); // Arranca el tiempo automáticamente al iniciar el partido
  };

  // Finalizar 1ª Parte (Fija crono a 30:00 - 1800s, rota posesión al equipo contrario que inició el partido)
  const handleEndFirstHalf = async () => {
    const firstPoss = currentMatch.possessions?.find(p => p.possession_number === 1);
    const firstPosTeam = firstPoss ? firstPoss.team : activePossession.team;
    const secondHalfStartingTeam = firstPosTeam === "LOCAL" ? "VISITANTE" : "LOCAL";

    setIsRunning(false);
    setTime(1800);
    setActiveActionSubmenu(null);
    setSelectedTeamAction(null);

    await sendMatchEvent({
      event_type: "period_change",
      action_key: "fin_1_parte",
      player_id: "Equipo",
      is_opponent_action: false,
      result: "Fin 1ª Parte",
      sanction_type: null
    }, 1800);

    await closePossession(1800, "Fin 1ª Parte", secondHalfStartingTeam);
  };

  // Finalizar 2ª Parte (Fija crono a 60:00 - 3600s)
  const handleEndSecondHalf = async () => {
    setIsRunning(false);
    setTime(3600);
    setActiveActionSubmenu(null);
    setSelectedTeamAction(null);

    await sendMatchEvent({
      event_type: "period_change",
      action_key: "fin_2_parte",
      player_id: "Equipo",
      is_opponent_action: false,
      result: "Fin 2ª Parte",
      sanction_type: null
    }, 3600);

    await closePossession(3600, "Fin 2ª Parte");
  };

  // Registrar Evento y Cambiar Posesión (Ataque finalizado)
  const handleAction = async (actionType, details = {}) => {
    // Usar el tiempo capturado al inicio de la acción, o en su defecto el tiempo actual
    const eventTime = actionCaptureTime !== null ? actionCaptureTime : time;

    // Resetear el tiempo capturado
    setActionCaptureTime(null);

    let player_id =
      selectedPlayer === "team"
        ? "Equipo"
        : selectedPlayer
          ? `${selectedPlayer.number} - ${selectedPlayer.name}`
          : "No especificado";

    let isOpponent = activePossession.team === "VISITANTE";

    if (actionType === "free_throw") {
      isOpponent = activePossession.team === "LOCAL";
      player_id = "Equipo";
    }

    // 1. Enviar el evento correspondiente
    const eventData = {
      event_type: actionType,
      player_id: player_id,
      is_opponent_action: isOpponent,
      ...details,
    };

    await sendMatchEvent(eventData, eventTime);

    // 2. Si la acción finaliza el ataque (Tiro o Pérdida), rotar posesión
    if (actionType === "shot" || actionType === "turnover") {
      let endReason = "Pérdida";
      if (actionType === "shot") {
        endReason = details.result === "Gol" ? "Gol" : "Parada/Fallo";
      }
      await closePossession(eventTime, endReason);
    }

    // Limpiar selección de jugador, acción de equipo y asistente de lanzamiento
    setSelectedPlayer(null);
    setSelectedTeamAction(null);
    resetShotWizard();
  };

  // Cambio Manual de Posesión (sin registrar acción de anotación, por ejemplo rebotes)
  const handleManualPossessionChange = async () => {
    await closePossession(time, "Cambio Manual");
    setSelectedPlayer(null);
    setSelectedTeamAction(null);
  };

  // Selección de Zona de Portería
  const handleSelectGoalZone = (zoneId) => {
    const updatedDetails = { ...pendingAction.details, target_zone: zoneId };
    if (shotResult === "Gol" || shotResult === "Parada") {
      setPendingAction({
        actionType: "shot",
        details: updatedDetails
      });
      setActiveActionSubmenu("select_opposing_goalkeeper");
    } else {
      handleAction("shot", updatedDetails);
      setPendingAction(null);
      setActiveActionSubmenu(null);
    }
  };

  // Obtener sanciones activas de 2 minutos
  const getActiveSuspensions = (atTime = time) => {
    if (!currentMatch?.events) return { home: [], away: [] };
    const home = [];
    const away = [];
    const targetTime = atTime !== undefined && atTime !== null ? Number(atTime) : time;

    currentMatch.events.forEach((ev) => {
      const isSanction = ev.event_type === "sanction";
      const sType = String(ev.sanction_type || "").toLowerCase();
      const is2Min = sType.includes("2 min") || sType.includes("exclusion") || sType.includes("2min") || sType.includes("dos minutos");

      if (isSanction && is2Min) {
        const start = Number(ev.match_time_seconds) || 0;
        const end = start + 120;
        if (targetTime >= start && targetTime < end) {
          const remaining = end - targetTime;
          const player_id = ev.player_id || ev.player_number || "Jugador";
          const isAway = ev.team === "VISITANTE" || ev.is_opponent_action === true || ev.is_opponent_action === "true";
          if (isAway) {
            away.push({ player_id, remaining, end });
          } else {
            home.push({ player_id, remaining, end });
          }
        }
      }
    });
    return { home, away };
  };

  // Calcular automáticamente la situación numérica actual según exclusiones activas
  const getAutoNumericalSituation = (team = activePossession?.team || "LOCAL", atTime = time) => {
    const activeSanc = getActiveSuspensions(atTime);
    const homeCount = activeSanc.home.length;
    const awayCount = activeSanc.away.length;

    const isHome = team === "LOCAL";
    if (isHome) {
      if (homeCount > awayCount) return "Inferioridad";
      if (homeCount < awayCount) return "Superioridad";
      return "Igualdad";
    } else {
      if (awayCount > homeCount) return "Inferioridad";
      if (awayCount < homeCount) return "Superioridad";
      return "Igualdad";
    }
  };

  // Manejo de la selección de fase de juego en Lanzamientos
  const handleSelectPhase = (phase) => {
    setSelectedPhase(phase);
    setSelectedShotType(null);
    setSelectedPosition(null);
    setSelectedNumericalSituation(null);

    if (phase === "7m") {
      const autoSit = getAutoNumericalSituation();
      setPendingAction({
        actionType: "shot",
        details: {
          shot_type: "7m",
          result: shotResult,
          shot_position: "Centro",
          numerical_situation: autoSit
        }
      });
      setActiveActionSubmenu("select_goal_zone");
    }
  };

  // Confirmar detalles de lanzamiento y continuar a la portería
  const handleConfirmShotDetails = (sit) => {
    const finalSit = sit || selectedNumericalSituation || getAutoNumericalSituation();

    let typeOfShot = "exterior";
    if (selectedPhase === "1ª Oleada") {
      typeOfShot = "contraataque";
    } else if (selectedShotType) {
      typeOfShot = selectedShotType.toLowerCase();
    }

    setPendingAction({
      actionType: "shot",
      details: {
        shot_type: typeOfShot,
        result: shotResult,
        shot_position: selectedPosition || "Centro",
        numerical_situation: finalSit,
        assist_position: shotResult === "Gol" ? selectedAssistPosition : "Ninguna"
      }
    });

    setActiveActionSubmenu("select_goal_zone");
  };

  // Resetear estado del asistente de lanzamiento para evitar preselecciones residuales
  const resetShotWizard = () => {
    setShotResult("Gol");
    setSelectedPhase("Posicional");
    setSelectedShotType("Exterior");
    setSelectedPosition("Centro");
    setSelectedNumericalSituation(getAutoNumericalSituation());
    setSelectedAssistPosition("Ninguna");
  };

  // Confirmar 7m provocado en defensa
  const handleConfirm7mPenalty = async (defender, attacker) => {
    const eventTime = actionCaptureTime !== null ? actionCaptureTime : time;
    setActionCaptureTime(null);

    const isOpponent = selectedTeamAction.team === "VISITANTE";
    const defenderId = defender === "team" ? "Equipo" : `${defender.number} - ${defender.name}`;
    const attackerId = attacker === "team" ? "Equipo" : `${attacker.number} - ${attacker.name}`;

    await sendMatchEvent({
      event_type: "sanction",
      sanction_type: "7m Provocado",
      player_id: defenderId,
      drawn_by_player: attackerId,
      is_opponent_action: isOpponent
    }, eventTime);

    setPending7mDetails({ defender: null, attacker: null });
    setSelectedPlayer(null);
    setSelectedTeamAction(null);
  };

  // Confirmar Falta en Ataque (atacante provoca, defensa la sufre)
  const handleConfirmFaltaAtaque = async (attacker, defender) => {
    const eventTime = actionCaptureTime !== null ? actionCaptureTime : time;
    setActionCaptureTime(null);

    const isOpponent = selectedTeamAction.team === "VISITANTE";
    const attackerId = attacker === "team" ? "Equipo" : (attacker ? `${attacker.number} - ${attacker.name}` : "No especificado");
    const defenderId = defender === "team" ? "Equipo" : (defender ? `${defender.number} - ${defender.name}` : null);

    const details = {
      end_reason: "Falta en ataque"
    };

    if (defender && defender !== "team") {
      details.defender_number = defender.number;
      details.defender_name = defender.name;
      details.defender_id = defenderId;
    } else if (defender === "team") {
      details.defender_name = "Equipo";
      details.defender_id = "Equipo";
    }

    await sendMatchEvent({
      event_type: "turnover",
      player_id: attackerId,
      is_opponent_action: isOpponent,
      ...details
    }, eventTime);

    await closePossession(eventTime, "Pérdida");

    setPendingFaltaAtaqueDetails({ attacker: null, defender: null });
    setSelectedPlayer(null);
    setSelectedTeamAction(null);
  };

  // Seleccionar acción desde el marcador de un equipo
  const handleSelectTeamAction = (team, action) => {
    setSelectedTeamAction({ team, action });
    setActionCaptureTime(time);
    setSelectedPlayer(null);
    setActiveActionSubmenu(null);
    setPending7mDetails({ defender: null, attacker: null });
    setPendingFaltaAtaqueDetails({ attacker: null, defender: null });

    if (action === "lanzamiento") {
      resetShotWizard();
    } else if (action === "sancion") {
      setSelectedSanctionType("Tarjeta Amarilla");
    }
  };

  // Obtener los últimos 5 eventos ordenados descendentemente por hora
  const recentEvents = [...(currentMatch.events || [])]
    .slice(-5)
    .reverse();

  // ─── COLOR CARD HELPER COMPONENTS ────────────────────────────
  const IconCardYellow = ({ size = 28 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#eab308" stroke="#ca8a04" strokeWidth="1.5" style={{ borderRadius: 3, display: "inline-block", verticalAlign: "middle" }}>
      <rect x="5" y="3" width="14" height="18" rx="2" />
    </svg>
  );

  const IconCardRed = ({ size = 28 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#ef4444" stroke="#dc2626" strokeWidth="1.5" style={{ borderRadius: 3, display: "inline-block", verticalAlign: "middle" }}>
      <rect x="5" y="3" width="14" height="18" rx="2" />
    </svg>
  );

  const IconCardBlue = ({ size = 28 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#3b82f6" stroke="#2563eb" strokeWidth="1.5" style={{ borderRadius: 3, display: "inline-block", verticalAlign: "middle" }}>
      <rect x="5" y="3" width="14" height="18" rx="2" />
    </svg>
  );
  const IconGlove = IconSaveGlove;
  const IconX = IconMiss;
  const IconRefresh = IconBadPass;

  // Render de selectores de fase y situación numérica
  const renderModifiers = () => (
    <div className="submenu-modifiers">
      <div className="modifier-row">
        <span className="modifier-label">Fase:</span>
        <div className="modifier-options">
          <button
            type="button"
            className={`modifier-opt-btn ${playPhase === "Posicional" ? "active" : ""}`}
            onClick={() => {
              setPlayPhase("Posicional");
              setActivePossession(p => ({ ...p, phase: "Posicional" }));
            }}
          >
            Posicional
          </button>
          <button
            type="button"
            className={`modifier-opt-btn ${playPhase === "Contraataque" ? "active" : ""}`}
            onClick={() => {
              setPlayPhase("Contraataque");
              setActivePossession(p => ({ ...p, phase: "Contraataque" }));
            }}
          >
            Contraataque
          </button>
        </div>
      </div>
      <div className="modifier-row">
        <span className="modifier-label">Sit. Numérica:</span>
        <div className="modifier-options">
          <button
            type="button"
            className={`modifier-opt-btn ${numericalSituation === "Igualdad" ? "active" : ""}`}
            onClick={() => {
              setNumericalSituation("Igualdad");
              setActivePossession(p => ({ ...p, situation: "Igualdad" }));
            }}
          >
            Igualdad
          </button>
          <button
            type="button"
            className={`modifier-opt-btn ${numericalSituation === "Superioridad" ? "active" : ""}`}
            onClick={() => {
              setNumericalSituation("Superioridad");
              setActivePossession(p => ({ ...p, situation: "Superioridad" }));
            }}
          >
            Superioridad
          </button>
          <button
            type="button"
            className={`modifier-opt-btn ${numericalSituation === "Inferioridad" ? "active" : ""}`}
            onClick={() => {
              setNumericalSituation("Inferioridad");
              setActivePossession(p => ({ ...p, situation: "Inferioridad" }));
            }}
          >
            Inferioridad
          </button>
        </div>
      </div>
    </div>
  );
  // Rosters con gestión de titulares, porteros y suplentes
  const [homeRoster, setHomeRoster] = useState([]);
  const [awayRoster, setAwayRoster] = useState([]);

  useEffect(() => {
    const rawHome = (currentMatch.home_players && currentMatch.home_players.length > 0)
      ? currentMatch.home_players
      : [
        { number: 12, name: "A. Gómez", position: "PORTERO" },
        { number: 4, name: "M. Ruiz", position: "LATERAL DERECHO" },
        { number: 7, name: "J. López", position: "LATERAL IZQUIERDO" },
        { number: 15, name: "M. Pérez", position: "CENTRAL" },
        { number: 9, name: "P. Martín", position: "LATERAL DERECHO" },
        { number: 23, name: "D. Silva", position: "LÍNEA" },
        { number: 8, name: "C. Nilsen", position: "PIVOTE" },
        { number: 1, name: "R. Torres", position: "PORTERO" },
        { number: 6, name: "E. Jordán", position: "LATERAL DERECHO" },
        { number: 10, name: "S. Vega", position: "CENTRAL" },
        { number: 11, name: "L. Romero", position: "LATERAL IZQUIERDO" },
        { number: 14, name: "I. Fernández", position: "PIVOTE" },
        { number: 19, name: "H. Santos", position: "LÍNEA" },
        { number: 22, name: "G. Díaz", position: "LÍNEA" }
      ];

    setHomeRoster(rawHome.map((p, idx) => ({ ...p, is_starter: p.is_starter ?? (idx < 7) })));

    const rawAway = (currentMatch.away_players && currentMatch.away_players.length > 0)
      ? currentMatch.away_players
      : [
        { number: 16, name: "J. García", position: "PORTERO" },
        { number: 2, name: "A. Fernández", position: "LATERAL DERECHO" },
        { number: 7, name: "L. Martínez", position: "LATERAL IZQUIERDO" },
        { number: 10, name: "S. Rodríguez", position: "CENTRAL" },
        { number: 11, name: "D. González", position: "LATERAL DERECHO" },
        { number: 3, name: "P. Sánchez", position: "LÍNEA" },
        { number: 5, name: "M. Alonso", position: "PIVOTE" },
        { number: 1, name: "B. López", position: "PORTERO" },
        { number: 6, name: "R. Ruiz", position: "LATERAL DERECHO" },
        { number: 8, name: "C. Hernández", position: "CENTRAL" },
        { number: 13, name: "V. Romero", position: "LATERAL IZQUIERDO" },
        { number: 14, name: "F. Navarro", position: "PIVOTE" },
        { number: 17, name: "J. Morales", position: "LÍNEA" },
        { number: 18, name: "Á. Vega", position: "LÍNEA" }
      ];

    setAwayRoster(rawAway.map((p, idx) => ({ ...p, is_starter: p.is_starter ?? (idx < 7) })));
  }, [currentMatch.id, currentMatch.home_players, currentMatch.away_players]);

  // Filtrado estricto por campo
  // 1. PORTEROS: Solo jugadores con posición PORTERO/POR o is_goalkeeper
  const isGk = (p) => p.position === "PORTERO" || p.position === "POR" || p.is_goalkeeper;

  const homeGoalkeepers = homeRoster.filter(p => isGk(p) && p.is_starter);
  const homeActiveGk = homeGoalkeepers.length > 0
    ? homeGoalkeepers.slice(0, 1)
    : (homeRoster.filter(isGk).length > 0 ? homeRoster.filter(isGk).slice(0, 1) : homeRoster.slice(0, 1));
  const homeFieldStarters = homeRoster.filter(p => p.is_starter && !homeActiveGk.some(gk => gk.number === p.number)).slice(0, 6);
  const homeBenchPlayers = homeRoster.filter(p => !homeActiveGk.some(gk => gk.number === p.number) && !homeFieldStarters.some(s => s.number === p.number));

  const awayGoalkeepers = awayRoster.filter(p => isGk(p) && p.is_starter);
  const awayActiveGk = awayGoalkeepers.length > 0
    ? awayGoalkeepers.slice(0, 1)
    : (awayRoster.filter(isGk).length > 0 ? awayRoster.filter(isGk).slice(0, 1) : awayRoster.slice(0, 1));
  const awayFieldStarters = awayRoster.filter(p => p.is_starter && !awayActiveGk.some(gk => gk.number === p.number)).slice(0, 6);
  const awayBenchPlayers = awayRoster.filter(p => !awayActiveGk.some(gk => gk.number === p.number) && !awayFieldStarters.some(s => s.number === p.number));

  // Cálculo en tiempo real de exclusiones activas (2 minutos = 120 segundos)
  const activeExclusions = useMemo(() => {
    if (!currentMatch?.events || currentMatch.events.length === 0) return {};

    const exclusions = {};
    const EXCLUSION_DURATION = 120; // 120 segundos

    currentMatch.events.forEach((ev) => {
      const isSanction = ev.event_type === "sanction";
      const sType = (ev.sanction_type || "").toLowerCase();
      const is2Min = sType.includes("2 min") || sType.includes("exclusion") || sType.includes("2min") || sType.includes("dos minutos");

      if (isSanction && is2Min) {
        const team = ev.team || (ev.is_opponent_action ? "VISITANTE" : "LOCAL");
        const pNum = String(ev.player_id ?? ev.player_number ?? "");
        if (!pNum) return;

        const startTime = Number(ev.match_time_seconds) || 0;
        const endTime = startTime + EXCLUSION_DURATION;

        // Comprobar si en el segundo actual 'time' la sanción sigue activa
        if (time >= startTime && time < endTime) {
          const remainingSeconds = endTime - time;
          const key = `${team}_${pNum}`;

          if (!exclusions[key] || remainingSeconds > exclusions[key].remainingSeconds) {
            const mins = Math.floor(remainingSeconds / 60);
            const secs = remainingSeconds % 60;
            exclusions[key] = {
              startTime,
              endTime,
              remainingSeconds,
              formattedCountdown: `${mins}:${String(secs).padStart(2, "0")}`
            };
          }
        }
      }
    });

    return exclusions;
  }, [currentMatch?.events, time]);

  // Si el jugador actualmente seleccionado resulta excluido, deseleccionarlo
  useEffect(() => {
    if (selectedPlayer) {
      const key = `${selectedPlayer.team}_${selectedPlayer.number}`;
      if (activeExclusions[key]) {
        setSelectedPlayer(null);
      }
    }
  }, [activeExclusions, selectedPlayer]);

  // Manejador de clic en jugador de la alineación / plantilla
  const handleRosterPlayerClick = (player, team, category) => {
    // Si el jugador está excluido por 2 minutos, la casilla está bloqueada
    const exclusionKey = `${team}_${player.number}`;
    if (activeExclusions[exclusionKey]) {
      return;
    }

    // Si un suplente del MISMO equipo está seleccionado y hacemos clic en un titular (o portero titular) -> CAMBIO DE JUGADOR
    if (
      selectedPlayer &&
      selectedPlayer.team === team &&
      selectedPlayer.category === "bench" &&
      (category === "starter" || category === "gk")
    ) {
      // REGLA ESTRICTA PORTERO: En el campo de PORTERO solo puede colocarse un portero
      if (category === "gk" && !isGk(selectedPlayer)) {
        alert("En la sección de PORTERO solo se puede colocar a un portero suplente. Selecciona un portero.");
        return;
      }

      const setRoster = team === "LOCAL" ? setHomeRoster : setAwayRoster;
      setRoster(prevRoster => {
        return prevRoster.map(p => {
          if (p.number === selectedPlayer.number) {
            return { ...p, is_starter: true };
          }
          if (p.number === player.number) {
            return { ...p, is_starter: false };
          }
          return p;
        });
      });

      // Limpiar selección tras realizar el cambio
      setSelectedPlayer(null);
      return;
    }

    // Selección normal diferenciando equipo y categoría
    setSelectedPlayer({
      ...player,
      team,
      category,
      isBench: category === "bench"
    });
  };

  const timelineEvents = useMemo(() => {
    if (!currentMatch?.events || currentMatch.events.length === 0) return [];

    let homeGoals = 0;
    let awayGoals = 0;

    // 1. Recorrer cronológicamente para calcular el marcador acumulado exacto tras cada acción
    const eventsWithScore = currentMatch.events.map((e) => {
      const category = getEventCategory(e);
      const isGoal = category === "goles";
      if (isGoal) {
        const isHome = e.team === "LOCAL" || e.is_opponent_action === false || e.is_opponent_action === "false";
        if (isHome) {
          homeGoals += 1;
        } else {
          awayGoals += 1;
        }
      }

      // Etiqueta legible de la acción
      let typeLabel = "ACCIÓN";
      let typeClass = "perdida"; // "gol" | "parada" | "perdida"

      if (category === "goles") {
        typeLabel = e.shot_zone === "7 Metros" ? "GOL 7M" : "GOL";
        typeClass = "gol";
      } else if (category === "paradas") {
        typeLabel = e.shot_zone === "7 Metros" ? "PARADA 7M" : "PARADA";
        typeClass = "parada";
      } else if (category === "fallo_lanzamiento") {
        typeLabel = (e.result || "FALLO").toUpperCase();
        typeClass = "perdida";
      } else if (category === "perdidas") {
        typeLabel = `PÉRDIDA ${e.turnover_type ? `(${e.turnover_type.toUpperCase()})` : ""}`.trim();
        typeClass = "perdida";
      } else if (category === "tiempo_muerto") {
        typeLabel = "T. MUERTO";
        typeClass = "parada";
      } else if (category === "golpe_franco") {
        typeLabel = "G. FRANCO";
        typeClass = "parada";
      } else if (category === "sanciones") {
        typeLabel = (e.sanction_type || "SANCIÓN").toUpperCase();
        typeClass = "perdida";
      } else if (category === "periodo") {
        typeLabel = (e.result || e.sanction_type || "FIN PERIODO").toUpperCase();
        typeClass = "parada";
      }

      const playerNum = e.player_number || e.shooter_number || e.player_id || "";
      const playerName = e.player_name || e.shooter_name || "";
      const playerStr = playerNum ? `#${playerNum} ${playerName}`.trim() : (playerName || e.team || "");

      const fromZoneRaw = e.shot_zone || e.court_zone || e.shot_position || "";
      const toZoneRaw = e.goal_zone || e.target_zone || "";
      const formattedFrom = formatCourtZoneName(fromZoneRaw);
      const formattedTo = formatGoalZoneName(toZoneRaw);
      let trajectory = "";

      if (category === "goles" || category === "paradas" || category === "fallo_lanzamiento") {
        if (formattedFrom && formattedTo) {
          trajectory = `${formattedFrom} -> ${formattedTo}`;
        } else if (formattedFrom) {
          trajectory = formattedFrom;
        } else if (formattedTo) {
          trajectory = formattedTo;
        }
      }

      const isHome = e.team === "LOCAL" || e.is_opponent_action === false || e.is_opponent_action === "false";
      const teamName = isHome ? (currentMatch.home_team || "LOCAL") : (currentMatch.away_team || "VISITANTE");

      return {
        category,
        rawType: e.event_type,
        rawResult: e.result,
        time: formatTime(e.match_time_seconds || 0),
        typeLabel,
        type: typeClass,
        description: playerStr,
        teamName,
        isHome,
        fromZone: formattedFrom,
        toZone: formattedTo,
        trajectory,
        score: `${homeGoals} - ${awayGoals}`
      };
    });

    // 2. Aplicar filtro seleccionado de las 7 categorías oficiales
    let filtered = eventsWithScore;
    if (historyFilter && !["TODOS", "todos", "TODO", "todo"].includes(historyFilter)) {
      filtered = eventsWithScore.filter(e => e.category === historyFilter);
    }

    // 3. Devolver los eventos invertidos (más reciente primero en la línea de tiempo)
    return filtered.slice(-30).reverse();
  }, [currentMatch?.events, historyFilter]);

  const handleQuickAction = async (actionKey) => {
    // 1. TIEMPO MUERTO: Se asocia de manera automática al equipo que tiene la posesión
    if (actionKey === "tiempo_muerto") {
      const posTeam = activePossession.team || "LOCAL";
      setIsRunning(false); // Pausa el tiempo automáticamente
      await sendMatchEvent({
        event_type: "sanction",
        sanction_type: "Tiempo Muerto",
        player_id: "Equipo",
        team: posTeam,
        is_opponent_action: posTeam !== "LOCAL"
      }, time);
      return;
    }

    // Comprobación previa: Seleccionar jugador de la alineación
    if (!selectedPlayer) {
      alert("Por favor, selecciona primero a un jugador de la alineación/plantilla para registrar la acción.");
      return;
    }

    // Suplentes: Solo se pueden aplicar sanciones
    if (selectedPlayer.isBench) {
      const isSanction = ["exclusion", "amarilla", "roja", "azul"].includes(actionKey);
      if (!isSanction) {
        alert("Los suplentes solo pueden recibir Sanciones (2 min, Amarilla, Roja, Azul). Para meter a este jugador al campo, haz clic en un titular de la alineación.");
        return;
      }
    }

    // 2. SANCIONES (2 Min, Amarilla, Roja, Azul) -> Registro directo asociando al jugador
    if (["exclusion", "amarilla", "roja", "azul"].includes(actionKey)) {
      const sanctionNames = {
        exclusion: "2 Minutos",
        amarilla: "Tarjeta Amarilla",
        roja: "Tarjeta Roja",
        azul: "Tarjeta Azul"
      };
      await sendMatchEvent({
        event_type: "sanction",
        sanction_type: sanctionNames[actionKey],
        player_id: selectedPlayer.number,
        player_number: selectedPlayer.number,
        player_name: selectedPlayer.name,
        team: selectedPlayer.team,
        is_opponent_action: selectedPlayer.team !== "LOCAL"
      }, time);
      setSelectedPlayer(null);
      return;
    }

    // 2b. GOLPE FRANCO (Solo activado para jugadores del equipo DEFENSOR — sin posesión)
    if (actionKey === "golpe_franco") {
      const isDefendingPlayer = selectedPlayer && selectedPlayer.team !== activePossession?.team;
      if (!isDefendingPlayer || selectedPlayer.isBench) {
        alert("El Golpe Franco solo se puede atribuir a un jugador del equipo que DEFIENDE (sin posesión).");
        return;
      }

      await sendMatchEvent({
        event_type: "free_throw",
        result: "Golpe Franco",
        player_id: selectedPlayer.number,
        player_number: selectedPlayer.number,
        player_name: selectedPlayer.name,
        team: selectedPlayer.team,
        is_opponent_action: selectedPlayer.team !== "LOCAL",
        match_time_seconds: time
      }, time);

      setSelectedPlayer(null);
      return;
    }

    // 3. REGISTRO CON CLIC DIRECTO EN DIBUJOS DE PISTA Y PORTERÍA (SIN POPUPS)
    const actionInstantTime = time; // Captura el tiempo EXACTO en el momento que se pulsa el botón de acción

    if (actionKey === "gol_7m" || actionKey === "parada_7m") {
      setActiveActionFlow({
        actionKey,
        actionTime: actionInstantTime,
        player: selectedPlayer,
        team: selectedPlayer.team,
        step: "AWAITING_GOAL_CLICK",
        shotZone: "7 Metros",
        isPenetration: false
      });
    } else {
      const turnoverNames = {
        perdida_pase: "Pase",
        perdida_dobles: "Dobles",
        perdida_pasos: "Pasos",
        perdida_pasivo: "Pasivo"
      };
      setActiveActionFlow({
        actionKey,
        actionTime: actionInstantTime,
        turnoverType: turnoverNames[actionKey] || null,
        player: selectedPlayer,
        team: selectedPlayer.team,
        step: "AWAITING_COURT_CLICK",
        shotZone: null,
        isPenetration: false
      });
    }
  };

  const executeDirectAction = async (flow) => {
    const eventTime = flow.actionTime !== undefined ? flow.actionTime : time;
    const isAttackerHome = flow.team === "LOCAL";
    const defendingGoalkeeper = isAttackerHome ? awayActiveGk[0] : homeActiveGk[0];

    let eventType = "shot";
    let shotResult = "Gol";

    if (flow.actionKey.startsWith("perdida")) {
      eventType = "turnover";
      shotResult = "Pérdida";
    } else if (flow.actionKey === "gol" || flow.actionKey === "gol_7m") {
      shotResult = "Gol";
    } else if (flow.actionKey === "parada" || flow.actionKey === "parada_7m") {
      shotResult = "Parada";
    } else if (flow.actionKey === "poste") {
      shotResult = "Poste";
    } else if (flow.actionKey === "fuera") {
      shotResult = "Fuera";
    }

    const zoneStr = (flow.shotZone || "").toLowerCase();
    let derivedShotType = "exterior";

    if (flow.actionKey === "gol_7m" || flow.actionKey === "parada_7m") {
      derivedShotType = "7m";
    } else if (flow.isFirstWave || zoneStr.includes("contraataque")) {
      derivedShotType = "contraataque";
    } else if (flow.isPenetration || zoneStr.includes("penetración") || zoneStr.includes("penetracion")) {
      derivedShotType = "penetración";
    } else if (zoneStr.includes("extremo")) {
      derivedShotType = "extremo";
    } else if (zoneStr.includes("pivote")) {
      derivedShotType = "pivote";
    } else if (zoneStr.includes("9m") || zoneStr.includes("exterior")) {
      derivedShotType = "exterior";
    }

    let derivedPlayPhase = "Posicional";
    if (flow.isFirstWave || derivedShotType === "contraataque") {
      derivedPlayPhase = "1ª Oleada";
    } else if (derivedShotType === "7m") {
      derivedPlayPhase = "7m";
    }

    const currentSituation = getAutoNumericalSituation(flow.team, eventTime);

    const xgValue = calculateShotXG({
      event_type: eventType,
      shot_type: derivedShotType,
      play_phase: derivedPlayPhase,
      numerical_situation: currentSituation,
      target_zone: flow.goalZone || null
    });

    const xsavesValue = calculateShotXSaves({
      event_type: eventType,
      shot_type: derivedShotType,
      play_phase: derivedPlayPhase,
      numerical_situation: currentSituation,
      target_zone: flow.goalZone || null
    });

    const is7m = derivedShotType === "7m" || (flow.shotZone && flow.shotZone.includes("7"));
    const finalCourtCoord = flow.courtCoord || (is7m ? { x: 50, y: 55 } : courtCoord);
    const finalGoalCoord = flow.goalCoord || (flow.goalZone ? goalCoord : null);

    const eventPayload = {
      event_type: eventType,
      result: shotResult,
      shot_type: derivedShotType,
      play_phase: derivedPlayPhase,
      numerical_situation: currentSituation,
      turnover_type: flow.turnoverType || null,
      player_id: flow.player.number,
      player_number: flow.player.number,
      player_name: flow.player.name,
      shooter_number: flow.player.number,
      shooter_name: flow.player.name,
      team: flow.team,
      is_opponent_action: !isAttackerHome,
      shot_zone: flow.shotZone || "Centro 9M",
      court_zone: flow.shotZone || "Centro 9M",
      shot_position: flow.shotZone || "Centro 9M",
      court_coord: finalCourtCoord,
      court_x: finalCourtCoord?.x ?? null,
      court_y: finalCourtCoord?.y ?? null,
      is_penetration: flow.isPenetration ?? false,
      expected_goals: xgValue,
      xg: xgValue,
      expected_saves: xsavesValue,
      xsaves: xsavesValue,
      goal_zone: flow.goalZone || null,
      target_zone: flow.goalZone || null,
      goal_coord: finalGoalCoord,
      goal_x: finalGoalCoord?.x ?? null,
      goal_y: finalGoalCoord?.y ?? null,
      goalkeeper_id: defendingGoalkeeper?.number || null,
      goalkeeper_number: defendingGoalkeeper?.number || null,
      goalkeeper_name: defendingGoalkeeper?.name || null,
      rebound: flow.reboundResult || null,
      match_time_seconds: eventTime
    };

    // 1. Registrar evento en backend / contexto (sendMatchEvent se encarga de incrementar el marcador 1 sola vez)
    await sendMatchEvent(eventPayload, eventTime);

    // 2. DETERMINACIÓN Y CAMBIO AUTOMÁTICO DE POSESIÓN SEGÚN REGLAMENTO
    let shouldChangePossession = false;
    let endReason = "Tiro";

    if (shotResult === "Gol") {
      shouldChangePossession = true;
      endReason = "Gol";
    } else if (shotResult === "Fuera") {
      shouldChangePossession = true;
      endReason = "Fuera";
    } else if (eventType === "turnover") {
      shouldChangePossession = true;
      endReason = `Pérdida ${flow.turnoverType || ""}`.trim();
    } else if (shotResult === "Parada" || shotResult === "Poste") {
      if (!flow.reboundResult || flow.reboundResult === "defense") {
        shouldChangePossession = true;
        endReason = shotResult === "Parada" ? "Parada Portero" : "Poste";
      }
    }

    if (shouldChangePossession && closePossession) {
      const nextPossessionTeam = isAttackerHome ? "VISITANTE" : "LOCAL";
      await closePossession(eventTime, endReason, nextPossessionTeam);
    }

    // Resetear el flujo activo y la selección de jugador
    setActiveActionFlow(null);
    setSelectedPlayer(null);
  };

  return (
    <div className={`match-dashboard-wrapper ${mainViewMode === "stats" ? "stats-mode" : "live-mode"}`}>
      {/* HEADER PRINCIPAL / MARCADOR DEL PARTIDO */}
      <header className="mp-scoreboard-bar">
        <div className="mp-top-left-info">
          <button className="mp-icon-btn" aria-label="Volver" title="Volver" onClick={onBack}>
            <IconArrowLeft size={18} />
          </button>
        </div>

        {/* BANDEROLA MARCADOR CENTRAL (ESTRUCTURA: EQUIPO LOCAL - MARCADOR AGRUPADO - EQUIPO VISITANTE) */}
        <div className="mp-scoreboard-banner">

          {/* 1. EQUIPO LOCAL */}
          <div
            className={`mp-team-banner home ${activePossession.team === "LOCAL" ? "has-possession" : ""}`}
            onClick={() => setActivePossession && setActivePossession(prev => ({ ...prev, team: "LOCAL" }))}
            title="Haz clic para asignar la posesión a Mi Equipo"
          >
            <div className="mp-team-logo-wrap">
              {currentMatch.home_logo ? (
                <img src={currentMatch.home_logo} alt={currentMatch.home_team} />
              ) : (
                <IconShield size={18} />
              )}
            </div>
            <div className="mp-team-info-wrap">
              <span className="mp-team-name">{currentMatch.home_team || "MI EQUIPO"}</span>
              <div className={`mp-possession-indicator home ${activePossession.team === "LOCAL" ? "active" : ""}`}>
                <IconSoccerBall className="mp-pos-icon" size={12} />
                <span className="mp-pos-text">POSESIÓN</span>
              </div>
            </div>
          </div>

          {/* 2. MARCADOR AGRUPADO (GOLES LOCAL + CRONÓMETRO/CONTROLES + GOLES VISITANTE) */}
          <div className="mp-scoreboard-grouped">
            <div className="mp-score-box home">
              <span className="mp-score-digit">{calculatedHomeGoals}</span>
            </div>

            <div className="mp-scoreboard-center-content">
              <span className="mp-center-period">{currentPeriod}</span>

              <div className="mp-time-display-wrap">
                <div className="mp-time-adjust-group left">
                  <button
                    type="button"
                    className="mp-time-adjust-btn"
                    onClick={() => adjustTime(-5)}
                    title="Restar 5 segundos al marcador"
                  >
                    -5s
                  </button>
                  <button
                    type="button"
                    className="mp-time-adjust-btn"
                    onClick={() => adjustTime(-1)}
                    title="Restar 1 segundo al marcador"
                  >
                    -1s
                  </button>
                </div>

                <span className="mp-center-time">{formatTime(time)}</span>

                <div className="mp-time-adjust-group right">
                  <button
                    type="button"
                    className="mp-time-adjust-btn"
                    onClick={() => adjustTime(1)}
                    title="Sumar 1 segundo al marcador"
                  >
                    +1s
                  </button>
                  <button
                    type="button"
                    className="mp-time-adjust-btn"
                    onClick={() => adjustTime(5)}
                    title="Sumar 5 segundos al marcador"
                  >
                    +5s
                  </button>
                </div>
              </div>

              <div className="mp-center-controls">
                <button
                  className={`mp-timer-toggle-btn ${isRunning ? "running" : "paused"}`}
                  onClick={() => setIsRunning(!isRunning)}
                  title={isRunning ? "Pausar cronómetro" : "Iniciar cronómetro"}
                  aria-label={isRunning ? "Pausar" : "Iniciar"}
                >
                  {isRunning ? <IconPause size={16} /> : <IconPlay size={16} />}
                </button>
                <button
                  className="mp-period-end-btn"
                  onClick={handleEndPeriod}
                  title="Finalizar periodo actual"
                >
                  <IconFlag size={12} />
                  <span>FIN DE PERIODO</span>
                </button>
              </div>
            </div>

            <div className="mp-score-box away">
              <span className="mp-score-digit">{calculatedAwayGoals}</span>
            </div>
          </div>

          {/* 3. EQUIPO VISITANTE */}
          <div
            className={`mp-team-banner away ${activePossession.team === "VISITANTE" ? "has-possession" : ""}`}
            onClick={() => setActivePossession && setActivePossession(prev => ({ ...prev, team: "VISITANTE" }))}
            title="Haz clic para asignar la posesión al Equipo Rival"
          >
            <div className="mp-team-info-wrap align-right">
              <span className="mp-team-name">{currentMatch.away_team || "RIVAL TEAM"}</span>
              <div className={`mp-possession-indicator away ${activePossession.team === "VISITANTE" ? "active" : ""}`}>
                <span className="mp-pos-text">POSESIÓN</span>
                <IconSoccerBall className="mp-pos-icon" size={12} />
              </div>
            </div>
            <div className="mp-team-logo-wrap">
              {currentMatch.away_logo ? (
                <img src={currentMatch.away_logo} alt={currentMatch.away_team} />
              ) : (
                <IconShield size={18} />
              )}
            </div>
          </div>

        </div>

        {/* ACCIONES SUPERIORES DERECHA */}
        <div className="mp-top-right-actions">
          <button
            className="mp-icon-btn theme-toggle-btn"
            onClick={handleToggleTheme}
            aria-label="Cambiar modo claro/oscuro"
            title={currentTheme === "dark" ? "Cambiar a Modo Claro" : "Cambiar a Modo Oscuro"}
          >
            {currentTheme === "dark" ? <IconSun size={18} /> : <IconMoon size={18} />}
          </button>
          <button
            className={`mp-view-toggle-icon-btn ${mainViewMode}`}
            onClick={() => setMainViewMode(prev => prev === "live" ? "stats" : "live")}
            aria-label={mainViewMode === "live" ? "Estadísticas" : "Mesa de Control"}
            title={mainViewMode === "live" ? "Ir a Estadísticas del Partido" : "Volver a la Mesa de Control"}
          >
            {mainViewMode === "live" ? <IconBarChart size={22} /> : <IconBriefcase size={22} />}
          </button>
        </div>
      </header>

      {mainViewMode === "stats" ? (
        <div className="mp-stats-scroll-container">
          <MatchStatsModule
            match={currentMatch}
            activePossession={activePossession}
            timeSeconds={time}
          />
        </div>
      ) : (
        /* VISTA PRINCIPAL 3 COLUMNAS */
        <div className="mp-main-container">
          {/* COLUMNA IZQUIERDA: MI EQUIPO (VERDE) */}
          <aside className="mp-team-column home-column">
            {/* SECCIÓN PORTERO */}
            <div className="mp-roster-section gk-section">
              <h4 className="mp-section-title">
                <span>PORTERO</span>
                <span className="mp-pos-badge gk">
                  <IconShield size={10} style={{ marginRight: 3, display: "inline-block", verticalAlign: "middle" }} />
                  POR
                </span>
              </h4>
              <div className="mp-player-list">
                {homeActiveGk.map((player, pIdx) => {
                  const excl = activeExclusions[`LOCAL_${player.number}`];
                  return (
                    <div
                      key={pIdx}
                      className={`mp-player-row gk-row ${selectedPlayer?.number === player.number && selectedPlayer?.team === "LOCAL" ? "selected" : ""} ${excl ? "excluded locked" : ""}`}
                      onClick={() => handleRosterPlayerClick(player, "LOCAL", "gk")}
                      title={excl ? `Jugador excluido (2 min) — Tiempo restante: ${excl.formattedCountdown}` : undefined}
                    >
                      <div className="mp-player-number green">#{player.number}</div>
                      <span className="mp-player-name">{player.name}</span>
                      <span className="mp-pos-pill gk">POR</span>
                      {excl ? (
                        <span className="mp-exclusion-countdown" title={`Exclusión 2 min: ${excl.formattedCountdown}`}>
                          <IconTimer2m size={10} style={{ marginRight: 2 }} />
                          {excl.formattedCountdown}
                        </span>
                      ) : (
                        <span className="mp-status-dot" title="En Campo" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SECCIÓN ALINEACIÓN */}
            <div className="mp-roster-section">
              <h4 className="mp-section-title">ALINEACIÓN</h4>
              <div className="mp-player-list">
                {homeFieldStarters.map((player, pIdx) => {
                  const excl = activeExclusions[`LOCAL_${player.number}`];
                  return (
                    <div
                      key={pIdx}
                      className={`mp-player-row ${selectedPlayer?.number === player.number && selectedPlayer?.team === "LOCAL" ? "selected" : ""} ${excl ? "excluded locked" : ""}`}
                      onClick={() => handleRosterPlayerClick(player, "LOCAL", "starter")}
                      title={excl ? `Jugador excluido (2 min) — Tiempo restante: ${excl.formattedCountdown}` : undefined}
                    >
                      <div className="mp-player-number green">#{player.number}</div>
                      <span className="mp-player-name">{player.name}</span>
                      {excl ? (
                        <span className="mp-exclusion-countdown" title={`Exclusión 2 min: ${excl.formattedCountdown}`}>
                          <IconTimer2m size={10} style={{ marginRight: 2 }} />
                          {excl.formattedCountdown}
                        </span>
                      ) : (
                        <span className="mp-status-dot" title="En Campo" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SECCIÓN SUPLENTES */}
            <div className="mp-roster-section bench-section">
              <h4 className="mp-section-title">SUPLENTES</h4>
              <div className="mp-player-list">
                {homeBenchPlayers.map((player, pIdx) => {
                  const excl = activeExclusions[`LOCAL_${player.number}`];
                  return (
                    <div
                      key={pIdx}
                      className={`mp-player-row ${selectedPlayer?.number === player.number && selectedPlayer?.team === "LOCAL" ? "selected" : ""} ${excl ? "excluded locked" : ""}`}
                      onClick={() => handleRosterPlayerClick(player, "LOCAL", "bench")}
                      title={excl ? `Jugador suplente excluido (2 min) — Tiempo restante: ${excl.formattedCountdown}` : undefined}
                    >
                      <div className="mp-player-number green">#{player.number}</div>
                      <span className="mp-player-name">{player.name}</span>
                      {(player.position === "PORTERO" || player.position === "POR") && (
                        <span className="mp-pos-pill bench-gk">POR</span>
                      )}
                      {excl && (
                        <span className="mp-exclusion-countdown" title={`Exclusión 2 min: ${excl.formattedCountdown}`}>
                          <IconTimer2m size={10} style={{ marginRight: 2 }} />
                          {excl.formattedCountdown}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* COLUMNA CENTRAL: PITCH TÁCTICO + 16 ACCIONES (4X4) + HISTORIAL */}
          <main className="mp-center-column">
            {/* CARD TÁCTICA: MEDIA PISTA DETALLADA + PORTERÍA DETALLADA */}
            <div className="mp-tactical-card">
              {/* BARRA SUPERIOR DE GUÍA DE INTERACCIÓN */}
              <div className="mp-selection-bar">
                <div className={`mp-step-item ${selectedPlayer ? "active" : ""}`}>
                  <span className="mp-step-label">1. JUGADOR</span>
                  <span className="mp-step-val">{selectedPlayer ? `#${selectedPlayer.number} ${selectedPlayer.name}` : "Selecciona..."}</span>
                </div>
                <div className="mp-step-divider"><IconArrowRight size={12} /></div>
                <div className={`mp-step-item ${activeActionFlow ? "active" : ""}`}>
                  <span className="mp-step-label">2. ACCIÓN</span>
                  <span className="mp-step-val">{activeActionFlow ? (activeActionFlow.actionKey || "").toUpperCase().replace("_", " ") : "Elige Acción..."}</span>
                </div>
                <div className="mp-step-divider"><IconArrowRight size={12} /></div>
                <div className={`mp-step-item ${activeActionFlow?.step === "AWAITING_COURT_CLICK" ? "pulsing" : activeActionFlow?.shotZone ? "active" : ""}`}>
                  <span className="mp-step-label">3. PISTA</span>
                  <span className="mp-step-val">
                    {activeActionFlow?.shotZone || (activeActionFlow?.step === "AWAITING_COURT_CLICK" ? (
                      <><IconClick size={12} style={{ display: "inline-block", verticalAlign: "middle", marginRight: 4 }} /> HAZ CLIC EN PISTA</>
                    ) : "...")}
                  </span>
                </div>
                <div className="mp-step-divider"><IconArrowRight size={12} /></div>
                <div className={`mp-step-item ${activeActionFlow?.step === "AWAITING_GOAL_CLICK" ? "pulsing" : activeActionFlow?.goalZone ? "active" : ""}`}>
                  <span className="mp-step-label">4. PORTERÍA</span>
                  <span className="mp-step-val">
                    {activeActionFlow?.goalZone || (activeActionFlow?.step === "AWAITING_GOAL_CLICK" ? (
                      <><IconClick size={12} style={{ display: "inline-block", verticalAlign: "middle", marginRight: 4 }} /> HAZ CLIC EN PORTERÍA</>
                    ) : "...")}
                  </span>
                </div>

                {(selectedPlayer || activeActionFlow) && (
                  <button
                    type="button"
                    className="mp-cancel-flow-btn"
                    onClick={handleCancelAction}
                    title="Cancelar la acción en curso y reiniciar selección"
                  >
                    <IconX size={12} style={{ marginRight: 2 }} /> Cancelar Acción
                  </button>
                )}
              </div>

              {/* CONTENEDOR 2 COLUMNAS: MEDIA PISTA (IZQ) Y PORTERÍA (DER) */}
              <div className="mp-court-goal-grid">
                {/* 1. MEDIA PISTA DE BALONMANO DETALLADA (CLICK EN CUALQUIER PUNTO) */}
                <div className="mp-half-court-wrapper">
                  <div className="mp-card-subtitle" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>MEDIA PISTA DE BALONMANO</span>
                    <button
                      type="button"
                      className={`mp-toggle-zones-btn ${showCourtZones ? "active" : ""}`}
                      onClick={() => setShowCourtZones(!showCourtZones)}
                      title={showCourtZones ? "Ocultar delimitación de zonas" : "Mostrar delimitación de zonas"}
                    >
                      {showCourtZones ? (
                        <><IconEyeOff size={13} style={{ marginRight: 4 }} /> Ocultar Zonas</>
                      ) : (
                        <><IconEye size={13} style={{ marginRight: 4 }} /> Mostrar Zonas</>
                      )}
                    </button>
                  </div>

                  <div className="mp-half-court interactive" onClick={handleCourtClick} title="Haz clic en cualquier punto de la media pista">
                    {/* SVG DE MEDIA PISTA DE BALONMANO (GEOMETRÍA OFICIAL CON PORTERÍA ARRIBA) */}
                    <svg viewBox="0 0 400 300" className="mp-hc-svg" preserveAspectRatio="none">
                      <defs>
                        {/* Fondo Gradient de Pista (Verde Estadio Profesional) */}
                        <linearGradient id="courtBgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#061c0e" />
                          <stop offset="50%" stopColor="#114725" />
                          <stop offset="100%" stopColor="#082212" />
                        </linearGradient>

                        {/* Relleno diferenciado para el Área de 6m */}
                        <linearGradient id="areaAreaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="rgba(45, 190, 96, 0.14)" />
                          <stop offset="100%" stopColor="rgba(45, 190, 96, 0.28)" />
                        </linearGradient>

                        {/* Patrón de Red de Portería */}
                        <pattern id="hcNetPattern" width="6" height="6" patternUnits="userSpaceOnUse">
                          <path d="M 0 3 L 6 3 M 3 0 L 3 6" fill="none" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="0.8" />
                        </pattern>

                        {/* Patrón de Franjas Rojas y Blancas para los Postes de la Portería */}
                        <pattern id="hcRedWhitePost" width="16" height="6" patternUnits="userSpaceOnUse">
                          <rect x="0" y="0" width="8" height="6" fill="#ef4444" />
                          <rect x="8" y="0" width="8" height="6" fill="#ffffff" />
                        </pattern>
                      </defs>

                      {/* 1. Fondo principal de la media pista */}
                      <rect x="0" y="0" width="400" height="300" fill="url(#courtBgGrad)" />

                      {/* 2. CAPAS VISUALES DE ZONAS xG (CONMUTABLE CON EL BOTÓN DE MOSTRAR/OCULTAR ZONAS) */}
                      {showCourtZones && (
                        <g className="mp-court-zone-overlays">
                          {/* A. EXTREMO IZQUIERDO (X: 0-10%, Y: 0-21%) */}
                          <path
                            d="M 8 8 L 40 8 L 40 63 L 8 63 Z"
                            fill="rgba(249, 115, 22, 0.55)"
                            stroke="#f97316"
                            strokeWidth="2.5"
                          />
                          <text x="24" y="32" fill="#f97316" fontSize="10" fontWeight="bold" textAnchor="middle">EXTREMO IZQ</text>
                          <text x="24" y="45" fill="#fca5a5" fontSize="8" textAnchor="middle">xG Extremo</text>

                          {/* B. EXTREMO DERECHO (X: 90-100%, Y: 0-21%) */}
                          <path
                            d="M 360 8 L 392 8 L 392 63 L 360 63 Z"
                            fill="rgba(249, 115, 22, 0.55)"
                            stroke="#f97316"
                            strokeWidth="2.5"
                          />
                          <text x="376" y="32" fill="#f97316" fontSize="10" fontWeight="bold" textAnchor="middle">EXTREMO DER</text>
                          <text x="376" y="45" fill="#fca5a5" fontSize="8" textAnchor="middle">xG Extremo</text>

                          {/* C. ÁREA AZUL (MEDIA LUNA DELIMITADA EXACTA A LA LÍNEA DE 9M) */}
                          <path
                            d="M 8 63 L 40 63 A 135 135 0 0 0 165 143 L 235 143 A 135 135 0 0 0 360 63 L 392 63 A 195 195 0 0 1 235 203 L 165 203 A 195 195 0 0 1 8 63 Z"
                            fill="rgba(37, 99, 235, 0.45)"
                            stroke="#2563eb"
                            strokeWidth="3"
                          />
                          <text x="200" y="172" fill="#93c5fd" fontSize="11" fontWeight="bold" textAnchor="middle">PIVOTE 6M / PENETRACIÓN / 1ª OLEADA</text>
                          <text x="200" y="186" fill="#bfdbfe" fontSize="9" textAnchor="middle">(Pulsa para abrir el selector táctico)</text>

                          {/* D. 9M LATERAL IZQUIERDO (SECTOR ROSA / MAGENTA ABAJO IZQ: X 0-31%) */}
                          <path
                            d="M 8 63 A 195 195 0 0 0 124 196 L 124 288 L 8 288 Z"
                            fill="rgba(236, 72, 153, 0.40)"
                            stroke="#ec4899"
                            strokeWidth="2.5"
                          />
                          <text x="66" y="240" fill="#ec4899" fontSize="11" fontWeight="bold" textAnchor="middle">9M LATERAL IZQ</text>
                          <text x="66" y="254" fill="#fbcfe8" fontSize="9" textAnchor="middle">xG Exterior</text>

                          {/* E. 9M CENTRAL (ESPECIFICACIÓN EXACTA: BORDEANDO AL 100% EL ARCO DE 9M SIN HUECOS) */}
                          <path
                            d="M 124 196 A 195 195 0 0 0 165 203 L 235 203 A 195 195 0 0 0 276 196 L 276 288 L 124 288 Z"
                            fill="rgba(34, 197, 94, 0.40)"
                            stroke="#22c55e"
                            strokeWidth="2.5"
                          />
                          <text x="200" y="240" fill="#22c55e" fontSize="11" fontWeight="bold" textAnchor="middle">9M CENTRAL</text>
                          <text x="200" y="254" fill="#86efac" fontSize="9" textAnchor="middle">xG Exterior</text>

                          {/* F. 9M LATERAL DERECHO (SECTOR BLANCO ABAJO DER: X 69-100%) */}
                          <path
                            d="M 276 196 A 195 195 0 0 0 392 63 L 392 288 L 276 288 Z"
                            fill="rgba(255, 255, 255, 0.35)"
                            stroke="#ffffff"
                            strokeWidth="2.5"
                          />
                          <text x="334" y="240" fill="#ffffff" fontSize="11" fontWeight="bold" textAnchor="middle">9M LATERAL DER</text>
                          <text x="334" y="254" fill="#e2e8f0" fontSize="9" textAnchor="middle">xG Exterior</text>
                        </g>
                      )}

                      {/* 3. Marco exterior del campo (Líneas perimetrales) */}
                      <rect x="8" y="8" width="384" height="284" fill="none" stroke="#ffffff" strokeWidth="3" />

                      {/* 4. Portería y Red en la línea de fondo arriba */}
                      {/* Red de portería */}
                      <rect x="165" y="0" width="70" height="8" fill="url(#hcNetPattern)" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
                      {/* Postes de portería con franjas rojas y blancas */}
                      <rect x="165" y="6" width="70" height="5" fill="url(#hcRedWhitePost)" stroke="#ffffff" strokeWidth="1" />

                      {/* 5. Área de 6 Metros (Geometría oficial: Arcos de 6m desde los postes + tramo recto de 3m) */}
                      <path
                        d="M 30 8 A 135 135 0 0 0 165 142 L 235 142 A 135 135 0 0 0 370 8 Z"
                        fill="url(#areaAreaGrad)"
                        stroke="#ffffff"
                        strokeWidth="3.5"
                      />

                      {/* 6. Línea de 4 Metros del Portero (A 4m dentro del área de 6m) */}
                      <line x1="188" y1="98" x2="212" y2="98" stroke="#ffffff" strokeWidth="3" />

                      {/* 7. Línea de 7 Metros (Penalti, a 7m de portería) */}
                      <line x1="184" y1="165" x2="216" y2="165" stroke="#fbbf24" strokeWidth="3.5" />

                      {/* 8. Línea de 9 Metros (Golpe Franco - Discontinua de X 0% Y 21% a X 100% Y 21%) */}
                      <path
                        d="M 8 63 A 195 195 0 0 0 165 203 L 235 203 A 195 195 0 0 0 392 63"
                        fill="none"
                        stroke="#ffffff"
                        strokeWidth="2.5"
                        strokeDasharray="9 7"
                      />

                      {/* 9. Marca de zona de cambios en la banda izquierda (Línea lateral abajo) */}
                      <line x1="8" y1="260" x2="22" y2="260" stroke="#ffffff" strokeWidth="3" />
                    </svg>

                    {/* MARCADOR DE POSICIÓN SELECCIONADA EN PISTA */}
                    {courtCoord && (
                      <div className="mp-pinpoint-marker court" style={{ left: `${courtCoord.x}%`, top: `${courtCoord.y}%` }}>
                        <div className="mp-pinpoint-pulse" />
                        <div className="mp-pinpoint-dot">📍</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. PORTERÍA DE BALONMANO DETALLADA (CLICK EN CUALQUIER PUNTO DE LA RED) */}
                <div className="mp-goal-diagram-wrapper">
                  <div className="mp-card-subtitle">
                    <span>PORTERÍA EN DETALLE (HAZ CLIC EN EL LUGAR DEL LANZAMIENTO)</span>
                  </div>

                    <div className="mp-goal-frame interactive" onClick={handleGoalClick} title="Haz clic en cualquier punto de la portería o zonas exteriores">
                    {/* SVG DE PORTERÍA DE BALONMANO DETALLADA CON MARGEN EXTERIOR */}
                    <svg viewBox="0 0 360 220" className="mp-goal-svg" preserveAspectRatio="none">
                      <defs>
                        {/* Red de portería */}
                        <pattern id="netMesh" width="12" height="12" patternUnits="userSpaceOnUse">
                          <path d="M 12 0 L 0 12 M 0 0 L 12 12" stroke="rgba(255,255,255,0.22)" strokeWidth="1" />
                        </pattern>
                        {/* Franjas de poste de balonmano (Blanco y Rojo) */}
                        <pattern id="stripedPost" width="20" height="20" patternUnits="userSpaceOnUse">
                          <rect width="10" height="20" fill="#ffffff" />
                          <rect x="10" width="10" height="20" fill="#dc2626" />
                        </pattern>
                      </defs>

                      {/* Fondo de portería / zona exterior */}
                      <rect x="0" y="0" width="360" height="220" fill="#081210" />

                      {/* Zonas exteriores para tiros fuera */}
                      <rect x="0" y="0" width="360" height="24" fill="rgba(255,255,255,0.03)" />
                      <rect x="0" y="24" width="30" height="196" fill="rgba(255,255,255,0.03)" />
                      <rect x="330" y="24" width="30" height="196" fill="rgba(255,255,255,0.03)" />

                      {/* Textos sutiles indicadores de zonas exteriores */}
                      <text x="180" y="16" fill="rgba(255,255,255,0.28)" fontSize="8.5" fontWeight="800" textAnchor="middle" letterSpacing="0.8">FUERA ARRIBA</text>
                      <text x="15" y="120" fill="rgba(255,255,255,0.28)" fontSize="7.5" fontWeight="800" textAnchor="middle" transform="rotate(-90 15 120)" letterSpacing="0.8">FUERA IZQ</text>
                      <text x="345" y="120" fill="rgba(255,255,255,0.28)" fontSize="7.5" fontWeight="800" textAnchor="middle" transform="rotate(90 345 120)" letterSpacing="0.8">FUERA DER</text>

                      {/* Malla / Red de portería */}
                      <rect x="44" y="38" width="272" height="182" fill="url(#netMesh)" />

                      {/* Guías visuales de escuadras y zonas */}
                      <line x1="134" y1="38" x2="134" y2="220" stroke="rgba(255,255,255,0.12)" strokeDasharray="4,4" />
                      <line x1="226" y1="38" x2="226" y2="220" stroke="rgba(255,255,255,0.12)" strokeDasharray="4,4" />
                      <line x1="44" y1="98" x2="316" y2="98" stroke="rgba(255,255,255,0.12)" strokeDasharray="4,4" />
                      <line x1="44" y1="158" x2="316" y2="158" stroke="rgba(255,255,255,0.12)" strokeDasharray="4,4" />

                      {/* Marco de Postes y Larguero (Reglamentario franjeado) */}
                      {/* Larguero superior */}
                      <rect x="30" y="24" width="300" height="14" fill="url(#stripedPost)" stroke="#000" strokeWidth="1" />
                      {/* Poste Izquierdo */}
                      <rect x="30" y="24" width="14" height="196" fill="url(#stripedPost)" stroke="#000" strokeWidth="1" />
                      {/* Poste Derecho */}
                      <rect x="316" y="24" width="14" height="196" fill="url(#stripedPost)" stroke="#000" strokeWidth="1" />

                      {/* Línea de suelo */}
                      <line x1="0" y1="219" x2="360" y2="219" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />
                    </svg>

                    {/* MARCADOR DE TIRO SELECCIONADO EN PORTERÍA */}
                    {goalCoord && (
                      <div className="mp-pinpoint-marker goal" style={{ left: `${goalCoord.x}%`, top: `${goalCoord.y}%` }}>
                        <div className="mp-pinpoint-pulse red" />
                        <div className="mp-pinpoint-dot red">⚽</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* BLOQUE INFERIOR DE 2 COLUMNAS: ACCIONES 4X4 (IZQ) E HISTORIAL (DER) */}
            <div className="mp-bottom-grid">
              {/* REJILLA DE 16 ACCIONES (4X4) */}
              <div className="mp-actions-card">
                <div className="mp-actions-header">
                  <h4>ACCIONES</h4>
                </div>

                <div className="mp-actions-4x4-grid">
                  {/* FILA 1: LANZAMIENTOS Y PORTERÍA */}
                  <button className={`mp-action-tile gol ${selectedPlayer?.isBench ? "disabled-bench" : ""}`} disabled={selectedPlayer?.isBench} onClick={() => handleQuickAction("gol")}>
                    <div className="mp-tile-icon"><IconGoalNet size={26} /></div>
                    <span>GOL</span>
                  </button>
                  <button className={`mp-action-tile gol-7m ${selectedPlayer?.isBench ? "disabled-bench" : ""}`} disabled={selectedPlayer?.isBench} onClick={() => handleQuickAction("gol_7m")}>
                    <div className="mp-tile-icon"><IconGoal7m size={26} /></div>
                    <span>GOL 7M</span>
                  </button>
                  <button className={`mp-action-tile parada ${selectedPlayer?.isBench ? "disabled-bench" : ""}`} disabled={selectedPlayer?.isBench} onClick={() => handleQuickAction("parada")}>
                    <div className="mp-tile-icon"><IconSaveGlove size={26} /></div>
                    <span>PARADA</span>
                  </button>
                  <button className={`mp-action-tile parada-7m ${selectedPlayer?.isBench ? "disabled-bench" : ""}`} disabled={selectedPlayer?.isBench} onClick={() => handleQuickAction("parada_7m")}>
                    <div className="mp-tile-icon"><IconSave7m size={26} /></div>
                    <span>PARADA 7M</span>
                  </button>

                  {/* FILA 2: POSTE, FUERA, GOLPE FRANCO Y TIEMPO MUERTO */}
                  <button className={`mp-action-tile poste ${selectedPlayer?.isBench ? "disabled-bench" : ""}`} disabled={selectedPlayer?.isBench} onClick={() => handleQuickAction("poste")}>
                    <div className="mp-tile-icon"><IconPost size={26} /></div>
                    <span>POSTE</span>
                  </button>
                  <button className={`mp-action-tile fuera ${selectedPlayer?.isBench ? "disabled-bench" : ""}`} disabled={selectedPlayer?.isBench} onClick={() => handleQuickAction("fuera")}>
                    <div className="mp-tile-icon"><IconFuera size={26} /></div>
                    <span>FUERA</span>
                  </button>
                  <button
                    type="button"
                    className={`mp-action-tile golpe-franco ${(!selectedPlayer || selectedPlayer.isBench || selectedPlayer.team === activePossession?.team) ? "disabled-bench" : ""}`}
                    disabled={!selectedPlayer || selectedPlayer.isBench || selectedPlayer.team === activePossession?.team}
                    onClick={() => handleQuickAction("golpe_franco")}
                    title={
                      !selectedPlayer
                        ? "Selecciona un jugador en campo del equipo defensor para otorgar Golpe Franco"
                        : selectedPlayer.team === activePossession?.team
                          ? "Solo disponible para jugadores del equipo sin posesión (Defensa)"
                          : "Registrar Golpe Franco cometido por la defensa"
                    }
                  >
                    <div className="mp-tile-icon"><IconFreeThrow size={26} /></div>
                    <span>G. FRANCO</span>
                  </button>
                  <button className={`mp-action-tile tiempo-muerto ${selectedPlayer?.isBench ? "disabled-bench" : ""}`} disabled={selectedPlayer?.isBench} onClick={() => handleQuickAction("tiempo_muerto")}>
                    <div className="mp-tile-icon"><IconTimeout size={26} /></div>
                    <span>T. MUERTO</span>
                  </button>

                  {/* FILA 3: PÉRDIDAS */}
                  <button className={`mp-action-tile perdida ${selectedPlayer?.isBench ? "disabled-bench" : ""}`} disabled={selectedPlayer?.isBench} onClick={() => handleQuickAction("perdida_pase")}>
                    <div className="mp-tile-icon"><IconBadPass size={26} /></div>
                    <span>P. PASE</span>
                  </button>
                  <button className={`mp-action-tile perdida ${selectedPlayer?.isBench ? "disabled-bench" : ""}`} disabled={selectedPlayer?.isBench} onClick={() => handleQuickAction("perdida_dobles")}>
                    <div className="mp-tile-icon"><IconDoubleDribble size={26} /></div>
                    <span>P. DOBLES</span>
                  </button>
                  <button className={`mp-action-tile perdida ${selectedPlayer?.isBench ? "disabled-bench" : ""}`} disabled={selectedPlayer?.isBench} onClick={() => handleQuickAction("perdida_pasos")}>
                    <div className="mp-tile-icon"><IconFootsteps size={26} /></div>
                    <span>P. PASOS</span>
                  </button>
                  <button className={`mp-action-tile perdida ${selectedPlayer?.isBench ? "disabled-bench" : ""}`} disabled={selectedPlayer?.isBench} onClick={() => handleQuickAction("perdida_pasivo")}>
                    <div className="mp-tile-icon"><IconPassivePlay size={26} /></div>
                    <span>P. PASIVO</span>
                  </button>

                  {/* FILA 4: SANCIONES */}
                  <button className="mp-action-tile sancion-2min" onClick={() => handleQuickAction("exclusion")}>
                    <div className="mp-tile-icon"><IconTimer2m size={26} /></div>
                    <span>2 MIN</span>
                  </button>
                  <button className="mp-action-tile sancion-amarilla" onClick={() => handleQuickAction("amarilla")}>
                    <div className="mp-tile-icon"><IconCardYellow size={26} /></div>
                    <span>AMARILLA</span>
                  </button>
                  <button className="mp-action-tile sancion-roja" onClick={() => handleQuickAction("roja")}>
                    <div className="mp-tile-icon"><IconCardRed size={26} /></div>
                    <span>ROJA</span>
                  </button>
                  <button className="mp-action-tile sancion-azul" onClick={() => handleQuickAction("azul")}>
                    <div className="mp-tile-icon"><IconCardBlue size={26} /></div>
                    <span>AZUL</span>
                  </button>
                </div>
              </div>

              {/* HISTORIAL DE ACCIONES */}
              <div className="mp-timeline-card">
                <div className="mp-timeline-header">
                  <div className="mp-timeline-title-wrap">
                    <h4>HISTORIAL DE ACCIONES</h4>
                    <button
                      className="mp-undo-btn"
                      onClick={() => handleUndo()}
                      title="Deshacer última acción registrada"
                    >
                      <IconUndo size={14} />
                      <span>DESHACER</span>
                    </button>
                  </div>
                  <select
                    className="mp-timeline-filter"
                    value={historyFilter}
                    onChange={(e) => setHistoryFilter(e.target.value)}
                  >
                    <option value="TODOS">TODOS</option>
                    <option value="goles">GOLES</option>
                    <option value="paradas">PARADAS</option>
                    <option value="fallo_lanzamiento">FALLO LANZAMIENTO</option>
                    <option value="perdidas">PÉRDIDAS</option>
                    <option value="tiempo_muerto">TIEMPO MUERTO</option>
                    <option value="golpe_franco">GOLPE FRANCO</option>
                    <option value="sanciones">SANCIONES</option>
                  </select>
                </div>

                <div className="mp-timeline-list">
                  {timelineEvents.length > 0 ? (
                    timelineEvents.map((evt, eIdx) => (
                      <div key={eIdx} className="mp-timeline-item">
                        <div className={`mp-item-icon ${evt.type}`}>
                          {evt.type === "gol" ? <IconGoalNet size={12} /> : evt.type === "parada" ? <IconSaveGlove size={12} /> : <IconAlertTriangle size={12} />}
                        </div>
                        <div className="mp-item-details">
                          <div className="mp-item-top">
                            <span className="mp-item-time">{evt.time}</span>
                            <span className="mp-item-type">{evt.typeLabel}</span>
                            <span className={`mp-item-team-name ${evt.isHome ? "home" : "away"}`}>
                              • {evt.teamName}
                            </span>
                          </div>
                          <span className="mp-item-desc">{evt.description}</span>
                          {evt.fromZone && evt.toZone ? (
                            <div className="mp-item-trajectory">
                              <span>{evt.fromZone}</span>
                              <IconArrowRight size={9} style={{ opacity: 0.6 }} />
                              <span>{evt.toZone}</span>
                            </div>
                          ) : evt.trajectory ? (
                            <div className="mp-item-trajectory">
                              <span>{evt.trajectory}</span>
                            </div>
                          ) : null}
                        </div>
                        <span className="mp-item-score">{evt.score}</span>
                      </div>
                    ))
                  ) : (
                    <div className="mp-timeline-empty">Sin acciones registradas aún en el partido</div>
                  )}
                </div>
              </div>
            </div>
          </main>

          {/* COLUMNA DERECHA: RIVAL TEAM (AZUL) */}
          <aside className="mp-team-column away-column">
            {/* SECCIÓN PORTERO */}
            <div className="mp-roster-section gk-section">
              <h4 className="mp-section-title">
                <span>PORTERO</span>
                <span className="mp-pos-badge gk">
                  <IconShield size={10} style={{ marginRight: 3, display: "inline-block", verticalAlign: "middle" }} />
                  POR
                </span>
              </h4>
              <div className="mp-player-list">
                {awayActiveGk.map((player, pIdx) => {
                  const excl = activeExclusions[`VISITANTE_${player.number}`];
                  return (
                    <div
                      key={pIdx}
                      className={`mp-player-row gk-row ${selectedPlayer?.number === player.number && selectedPlayer?.team === "VISITANTE" ? "selected" : ""} ${excl ? "excluded locked" : ""}`}
                      onClick={() => handleRosterPlayerClick(player, "VISITANTE", "gk")}
                      title={excl ? `Jugador excluido (2 min) — Tiempo restante: ${excl.formattedCountdown}` : undefined}
                    >
                      <div className="mp-player-number blue">#{player.number}</div>
                      <span className="mp-player-name">{player.name}</span>
                      <span className="mp-pos-pill gk">POR</span>
                      {excl ? (
                        <span className="mp-exclusion-countdown" title={`Exclusión 2 min: ${excl.formattedCountdown}`}>
                          <IconTimer2m size={10} style={{ marginRight: 2 }} />
                          {excl.formattedCountdown}
                        </span>
                      ) : (
                        <span className="mp-status-dot" title="En Campo" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SECCIÓN ALINEACIÓN */}
            <div className="mp-roster-section">
              <h4 className="mp-section-title">ALINEACIÓN</h4>
              <div className="mp-player-list">
                {awayFieldStarters.map((player, pIdx) => {
                  const excl = activeExclusions[`VISITANTE_${player.number}`];
                  return (
                    <div
                      key={pIdx}
                      className={`mp-player-row ${selectedPlayer?.number === player.number && selectedPlayer?.team === "VISITANTE" ? "selected" : ""} ${excl ? "excluded locked" : ""}`}
                      onClick={() => handleRosterPlayerClick(player, "VISITANTE", "starter")}
                      title={excl ? `Jugador excluido (2 min) — Tiempo restante: ${excl.formattedCountdown}` : undefined}
                    >
                      <div className="mp-player-number blue">#{player.number}</div>
                      <span className="mp-player-name">{player.name}</span>
                      {excl ? (
                        <span className="mp-exclusion-countdown" title={`Exclusión 2 min: ${excl.formattedCountdown}`}>
                          <IconTimer2m size={10} style={{ marginRight: 2 }} />
                          {excl.formattedCountdown}
                        </span>
                      ) : (
                        <span className="mp-status-dot" title="En Campo" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SECCIÓN SUPLENTES */}
            <div className="mp-roster-section bench-section">
              <h4 className="mp-section-title">SUPLENTES</h4>
              <div className="mp-player-list">
                {awayBenchPlayers.map((player, pIdx) => {
                  const excl = activeExclusions[`VISITANTE_${player.number}`];
                  return (
                    <div
                      key={pIdx}
                      className={`mp-player-row ${selectedPlayer?.number === player.number && selectedPlayer?.team === "VISITANTE" ? "selected" : ""} ${excl ? "excluded locked" : ""}`}
                      onClick={() => handleRosterPlayerClick(player, "VISITANTE", "bench")}
                      title={excl ? `Jugador suplente excluido (2 min) — Tiempo restante: ${excl.formattedCountdown}` : undefined}
                    >
                      <div className="mp-player-number blue">#{player.number}</div>
                      <span className="mp-player-name">{player.name}</span>
                      {(player.position === "PORTERO" || player.position === "POR") && (
                        <span className="mp-pos-pill bench-gk">POR</span>
                      )}
                      {excl && (
                        <span className="mp-exclusion-countdown" title={`Exclusión 2 min: ${excl.formattedCountdown}`}>
                          <IconTimer2m size={10} style={{ marginRight: 2 }} />
                          {excl.formattedCountdown}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* MODAL POSESIÓN INICIAL DEL PARTIDO */}
      {showInitialPossessionModal && (
        <div className="mp-initial-possession-backdrop">
          <div className="mp-initial-possession-card">
            <div className="mp-pos-modal-icon">
              <IconBall size={28} color="#2DBE60" />
            </div>
            <h3>POSESIÓN INICIAL DEL PARTIDO</h3>
            <p>¿Qué equipo ha ganado el saque inicial y empieza atacando en la 1ª Parte?</p>

            <div className="mp-pos-modal-actions">
              <button
                type="button"
                className="mp-pos-modal-btn home"
                onClick={() => handleSelectInitialPossession("LOCAL")}
              >
                <span className="mp-btn-team-name">{currentMatch.home_team || "MI EQUIPO (LOCAL)"}</span>
                <span className="mp-btn-sub">Saque de centro en 1ª Parte</span>
              </button>

              <button
                type="button"
                className="mp-pos-modal-btn away"
                onClick={() => handleSelectInitialPossession("VISITANTE")}
              >
                <span className="mp-btn-team-name">{currentMatch.away_team || "RIVAL TEAM (VISITANTE)"}</span>
                <span className="mp-btn-sub">Saque de centro en 1ª Parte</span>
              </button>
            </div>

            <div className="mp-pos-modal-footnote">
              <IconInfo size={13} style={{ display: "inline-block", verticalAlign: "middle", marginRight: 4 }} /> Al cambiar de periodo (2ª Parte), la posesión cambiará automáticamente al equipo contrario.
            </div>
          </div>
        </div>
      )}
      {/* MODAL EXCLUSIVO PARA ZONA DE PIVOTE: PIVOTE 6M / PENETRACIÓN / 1ª OLEADA */}
      {showPivotOptionModal && (
        <div className="mp-initial-possession-backdrop" style={{ zIndex: 9999 }}>
          <div className="mp-initial-possession-card pivot-option-modal">
            <div className="mp-pivot-modal-header">
              <div className="mp-pos-modal-icon pivot-icon-glow">
                <IconGoalNet size={30} color="#38bdf8" />
              </div>
              <div className="mp-pivot-modal-titles">
                <h3>TIPO DE ACCIÓN EN ZONA DE PIVOTE</h3>
                <p>Elige la variante táctica de tiro en los 6 metros para calibrar el xG exacto</p>
              </div>
            </div>

            <div className="mp-pivot-modal-actions">
              <button
                type="button"
                className="mp-pivot-option-card default-pivot"
                onClick={() => handleSelectPivotOption("pivote")}
              >
                <div className="mp-pivot-card-icon-wrap pivot">
                  <IconUser size={20} color="#3b82f6" />
                </div>
                <div className="mp-pivot-card-content">
                  <div className="mp-pivot-card-header-row">
                    <span className="mp-pivot-card-title">Pivote 6M</span>
                    <span className="mp-pivot-tag tag-pivot">POSICIONAL</span>
                  </div>
                  <span className="mp-pivot-card-desc">Lanzamiento directo desde la línea de 6 metros en ataque posicional</span>
                </div>
                <div className="mp-pivot-card-arrow"><IconArrowRight size={14} /></div>
              </button>

              <button
                type="button"
                className="mp-pivot-option-card penetration"
                onClick={() => handleSelectPivotOption("penetración")}
              >
                <div className="mp-pivot-card-icon-wrap penetration">
                  <IconZap size={20} color="#eab308" />
                </div>
                <div className="mp-pivot-card-content">
                  <div className="mp-pivot-card-header-row">
                    <span className="mp-pivot-card-title">Penetración</span>
                    <span className="mp-pivot-tag tag-penetration">DESMARQUE / FINTA</span>
                  </div>
                  <span className="mp-pivot-card-desc">Finta de cuerpo o desmarque con penetración a 6 metros</span>
                </div>
                <div className="mp-pivot-card-arrow"><IconArrowRight size={14} /></div>
              </button>

              <button
                type="button"
                className="mp-pivot-option-card counterattack"
                onClick={() => handleSelectPivotOption("contraataque")}
              >
                <div className="mp-pivot-card-icon-wrap counterattack">
                  <IconFlame size={20} color="#a855f7" />
                </div>
                <div className="mp-pivot-card-content">
                  <div className="mp-pivot-card-header-row">
                    <span className="mp-pivot-card-title">1ª Oleada / Contraataque</span>
                    <span className="mp-pivot-tag tag-counterattack">TRANSICIÓN RÁPIDA</span>
                  </div>
                  <span className="mp-pivot-card-desc">Lanzamiento en contraataque directo o primera oleada</span>
                </div>
                <div className="mp-pivot-card-arrow"><IconArrowRight size={14} /></div>
              </button>
            </div>

            <button
              type="button"
              className="mp-cancel-pivot-btn"
              onClick={() => {
                setShowPivotOptionModal(false);
                setPendingPivotFlow(null);
              }}
            >
              <IconX size={12} style={{ display: "inline-block", verticalAlign: "middle", marginRight: 4 }} /> Cancelar Selección
            </button>
          </div>
        </div>
      )}
      {/* MODAL POPUP PARA SELECCIÓN DE REBOTE (EN PARADA O POSTE) */}
      {activeActionFlow?.step === "AWAITING_REBOUND" && (
        <div className="mp-initial-possession-backdrop" style={{ zIndex: 9999 }}>
          <div className="mp-initial-possession-card pivot-option-modal">
            <div className="mp-pivot-modal-header">
              <div className="mp-pos-modal-icon pivot-icon-glow">
                <IconSaveGlove size={30} color="#38bdf8" />
              </div>
              <div className="mp-pivot-modal-titles">
                <h3>¿HUBO REBOTE TRAS EL TIRO?</h3>
                <p>
                  Acción de {activeActionFlow?.actionKey === "poste" ? "POSTE" : "PARADA"}. Indica quién recuperó la posesión tras el impacto:
                </p>
              </div>
            </div>

            <div className="mp-pivot-modal-actions">
              <button
                type="button"
                className="mp-pivot-option-card default-pivot"
                onClick={() => executeDirectAction({ ...activeActionFlow, reboundResult: "defense" })}
              >
                <div className="mp-pivot-card-icon-wrap pivot">
                  <IconShield size={20} color="#3b82f6" />
                </div>
                <div className="mp-pivot-card-content">
                  <div className="mp-pivot-card-header-row">
                    <span className="mp-pivot-card-title">Sin Rebote / Balón Defensa</span>
                    <span className="mp-pivot-tag tag-pivot">CAMBIO POSESIÓN</span>
                  </div>
                  <span className="mp-pivot-card-desc">El equipo defensor recupera el balón o saque de portería</span>
                </div>
                <div className="mp-pivot-card-arrow"><IconArrowRight size={14} /></div>
              </button>

              <button
                type="button"
                className="mp-pivot-option-card penetration"
                onClick={() => executeDirectAction({ ...activeActionFlow, reboundResult: "attack" })}
              >
                <div className="mp-pivot-card-icon-wrap penetration">
                  <IconSwords size={20} color="#eab308" />
                </div>
                <div className="mp-pivot-card-content">
                  <div className="mp-pivot-card-header-row">
                    <span className="mp-pivot-card-title">Rebote para el Ataque</span>
                    <span className="mp-pivot-tag tag-penetration">MANTIENE POSESIÓN</span>
                  </div>
                  <span className="mp-pivot-card-desc">El equipo atacante captura el rechace y mantiene la posesión</span>
                </div>
                <div className="mp-pivot-card-arrow"><IconArrowRight size={14} /></div>
              </button>
            </div>

            <button
              type="button"
              className="mp-cancel-pivot-btn"
              onClick={handleCancelAction}
            >
              <IconX size={12} style={{ display: "inline-block", verticalAlign: "middle", marginRight: 4 }} /> Cancelar Acción
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
