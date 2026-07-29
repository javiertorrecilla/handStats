import { useState, useEffect, useRef } from "react";
import { useMatch } from "../../context/MatchContext";
import userService from "../../services/userService";
import MatchStatsModule from "../../stats/MatchStatsModule";
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

export default function MatchAnalysisPage({ user, onBack, initialMode = "live" }) {
  const {
    currentMatch,
    activePossession,
    setActivePossession,
    sendMatchEvent,
    closePossession,
    undoLastEvent,
  } = useMatch();

  // Cronómetro y Vista Principal
  const [mainViewMode, setMainViewMode] = useState(initialMode); // "live" | "stats"

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

  // Inicialización de Posesión
  const [possessionStarted, setPossessionStarted] = useState(false);

  // Jugador seleccionado
  const [selectedPlayer, setSelectedPlayer] = useState(null); // null | playerObject | "team"

  // Modificadores de la acción seleccionada
  const [shotType, setShotType] = useState("exterior"); // extremo | pivote | exterior | penetracion | siete_metros
  const [numericalSituation, setNumericalSituation] = useState("Igualdad"); // Igualdad | Superioridad | Inferioridad
  const [playPhase, setPlayPhase] = useState("Posicional"); // Posicional | Contraataque

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

  // Efecto para inicializar la posesión a partir del historial del partido
  useEffect(() => {
    if (!currentMatch) return;

    const matchIdStr = String(currentMatch._id || currentMatch.id || "");
    const currentPossessionsLength = currentMatch.possessions?.length || 0;

    // Sincronizamos si es un partido nuevo (ID diferente en mount/cambio)
    // O si se forzó la desincronización en handleUndo (lastMatchIdRef.current === null)
    if (lastMatchIdRef.current !== matchIdStr) {
      lastMatchIdRef.current = matchIdStr;
      lastPossessionsLengthRef.current = currentPossessionsLength;

      const undoInfo = isUndoingRef.current;
      isUndoingRef.current = null; // Limpiar el flag

      if (currentMatch.possessions && currentMatch.possessions.length > 0) {
        const sorted = [...currentMatch.possessions].sort(
          (a, b) => b.possession_number - a.possession_number
        );
        const lastPoss = sorted[0];

        // Determinar el equipo para la posesión activa
        let nextTeam;
        if (lastPoss.end_reason === "Fin 1ª Parte") {
          const firstPoss = currentMatch.possessions.find(p => p.possession_number === 1);
          const firstTeam = firstPoss ? firstPoss.team : "LOCAL";
          nextTeam = firstTeam === "LOCAL" ? "VISITANTE" : "LOCAL";
        } else {
          nextTeam = lastPoss.team === "LOCAL" ? "VISITANTE" : "LOCAL";
        }

        setActivePossession({
          possession_number: lastPoss.possession_number + 1,
          team: nextTeam,
          start_time: lastPoss.end_time,
          phase: "Posicional",
          situation: "Igualdad",
        });
        setTime(undoInfo ? undoInfo.targetTime : lastPoss.end_time);
        setPossessionStarted(true);
      } else {
        setActivePossession({
          possession_number: 1,
          team: "LOCAL",
          start_time: 0,
          phase: "Posicional",
          situation: "Igualdad",
        });
        setTime(undoInfo ? undoInfo.targetTime : 0);
        setPossessionStarted(false);
      }
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
    if (currentMatch.events && currentMatch.events.length > 0) {
      const lastEvent = currentMatch.events[currentMatch.events.length - 1];
      if (lastEvent) {
        isUndoingRef.current = {
          targetTime: lastEvent.match_time_seconds || 0
        };
      }
    }
    lastMatchIdRef.current = null; // Fuerza al useEffect a sincronizar al recibir el nuevo estado del partido
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
      event_type: "sanction",
      player_id: "Equipo",
      is_opponent_action: false,
      sanction_type: "Fin 1ª Parte"
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
      event_type: "sanction",
      player_id: "Equipo",
      is_opponent_action: false,
      sanction_type: "Fin 2ª Parte"
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
  const getActiveSuspensions = () => {
    if (!currentMatch?.events) return { home: [], away: [] };
    const home = [];
    const away = [];
    currentMatch.events.forEach((ev) => {
      if (ev.event_type === "sanction" && ev.sanction_type === "2 Minutos") {
        const start = ev.match_time_seconds;
        const end = start + 120;
        if (time >= start && time < end) {
          const remaining = end - time;
          const player_id = ev.player_id || "Jugador";
          if (ev.is_opponent_action) {
            away.push({ player_id, remaining, end });
          } else {
            home.push({ player_id, remaining, end });
          }
        }
      }
    });
    return { home, away };
  };

  // Calcular automáticamente la situación numérica actual
  const getAutoNumericalSituation = () => {
    if (!activePossession) return "Igualdad";
    const activeSanc = getActiveSuspensions();
    const homeCount = activeSanc.home.length;
    const awayCount = activeSanc.away.length;

    if (activePossession.team === "LOCAL") {
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

  // ─── SVG ICON COMPONENTS ───────────────────────────────────
  const IconArrowLeft = () => (
    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ width: 16, height: 16, display: "inline-block", verticalAlign: "middle" }}><path d="M19 12H5" /><path d="m12 19-7-7 7-7" /></svg>
  );
  const IconUndo = () => (
    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ width: 16, height: 16, display: "inline-block", verticalAlign: "middle" }}><path d="M3 7v6h6" /><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" /></svg>
  );
  const IconHandball = () => (
    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ width: 18, height: 18, display: "inline-block", verticalAlign: "middle" }}><circle cx="12" cy="12" r="10" /><path d="M12 2a14.5 14.5 0 0 0 0 22" /><path d="M12 2a14.5 14.5 0 0 1 0 22" /><path d="M2 12h20" /></svg>
  );
  const IconEdit = () => (
    <svg className="icon icon-edit" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ width: 14, height: 14, display: "inline-block", verticalAlign: "middle" }}><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></svg>
  );
  const IconPlay = () => (
    <svg className="icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style={{ width: 14, height: 14, display: "inline-block", verticalAlign: "middle" }}><polygon points="5 3 19 12 5 21 5 3" /></svg>
  );
  const IconPause = () => (
    <svg className="icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style={{ width: 14, height: 14, display: "inline-block", verticalAlign: "middle" }}><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
  );
  const IconMegaphone = () => (
    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ width: 18, height: 18, display: "inline-block", verticalAlign: "middle" }}><path d="m3 11 18-5v12L3 13v-2z" /><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" /></svg>
  );
  const IconUsers = () => (
    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ width: 18, height: 18, display: "inline-block", verticalAlign: "middle" }}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
  );
  const IconShield = () => (
    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ width: 18, height: 18, display: "inline-block", verticalAlign: "middle" }}><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1-1z" /></svg>
  );
  const IconTarget = () => (
    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ width: 18, height: 18, display: "inline-block", verticalAlign: "middle" }}><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>
  );
  const IconAlertTriangle = () => (
    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ width: 18, height: 18, display: "inline-block", verticalAlign: "middle" }}><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" /><path d="M12 9v4" /><path d="M12 17h.01" /></svg>
  );
  const IconClock = () => (
    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ width: 18, height: 18, display: "inline-block", verticalAlign: "middle" }}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
  );
  const IconBarChart = () => (
    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ width: 16, height: 16, display: "inline-block", verticalAlign: "middle" }}><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>
  );
  const IconFlag = () => (
    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ width: 18, height: 18, display: "inline-block", verticalAlign: "middle" }}><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" x2="4" y1="22" y2="15" /></svg>
  );
  const IconGlove = () => (
    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ width: 18, height: 18, display: "inline-block", verticalAlign: "middle" }}><path d="M12 22c-4.97 0-9-2.24-9-5v-7a2 2 0 0 1 4 0v1a2 2 0 0 1 4 0V9a2 2 0 0 1 4 0v2a2 2 0 0 1 4 0v5c0 2.76-4.03 5-9 5z" /></svg>
  );
  const IconX = () => (
    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ width: 14, height: 14, display: "inline-block", verticalAlign: "middle" }}><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
  );
  const IconRefresh = () => (
    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ width: 16, height: 16, display: "inline-block", verticalAlign: "middle" }}><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M8 16H3v5" /></svg>
  );
  const IconHistory = () => (
    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ width: 18, height: 18, display: "inline-block", verticalAlign: "middle" }}><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /><path d="M12 7v5l4 2" /></svg>
  );
  const IconBriefcase = () => (
    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ width: 14, height: 14, display: "inline-block", verticalAlign: "middle" }}><path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /><rect width="20" height="14" x="2" y="6" rx="2" /></svg>
  );
  const IconCheck = () => (
    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ width: 14, height: 14, display: "inline-block", verticalAlign: "middle" }}><polyline points="20 6 9 17 4 12" /></svg>
  );
  const IconGoalNet = () => (
    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ width: 18, height: 18, display: "inline-block", verticalAlign: "middle" }}><rect x="2" y="6" width="20" height="14" rx="2" /><path d="M12 6v14" /><path d="M2 13h20" /><path d="M7 6v14" /><path d="M17 6v14" /></svg>
  );

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

  return (
    <div className="match-analysis-page">
      {/* HEADER DE MESA Y ESTADÍSTICAS */}
      <header className="analysis-header-bar">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button className="btn btn-secondary btn-sm" onClick={onBack} aria-label="Volver a mis partidos">
            <IconArrowLeft /> Volver
          </button>
          <img src={isotipo} alt="HandStats" style={{ height: 28, width: "auto", objectFit: "contain" }} />
        </div>

        <div className="hs-mode-switcher" style={{ display: "flex", gap: 4, background: "var(--bg-inset)", padding: 4, borderRadius: "var(--radius)", border: "1px solid var(--border-color)" }}>
          <button
            type="button"
            className={`btn btn-sm ${mainViewMode === "live" ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setMainViewMode("live")}
          >
            <IconHandball /> Mesa de Control (Directo)
          </button>
          <button
            type="button"
            className={`btn btn-sm ${mainViewMode === "stats" ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setMainViewMode("stats")}
          >
            <IconBarChart /> Centro de Inteligencia (Estadísticas)
          </button>
        </div>

        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button
            className="btn btn-danger btn-sm"
            onClick={handleUndo}
            disabled={!currentMatch.events || currentMatch.events.length === 0}
            style={{ display: "flex", alignItems: "center", gap: 5, padding: "8px 12px" }}
            aria-label="Deshacer última acción"
          >
            <IconUndo /> Deshacer
          </button>
          <div className="possession-indicator-top">
            Ataque Nº: <span className="badge-possession-number">{activePossession.possession_number}</span>
          </div>
        </div>
      </header>

      {mainViewMode === "stats" ? (
        <MatchStatsModule
          match={currentMatch}
          activePossession={activePossession}
          timeSeconds={time}
        />
      ) : (
        <>

      {/* MARCADOR Y CRONÓMETRO */}
      <section className="scoreboard-container" aria-label="Marcador del partido">
        {/* EQUIPO LOCAL */}
        <div className={`scoreboard-team local-side ${activePossession.team === "LOCAL" ? "has-possession" : ""}`}>
          <div className="team-name">{currentMatch.home_team}</div>
          <div className="team-score" role="status" aria-live="polite">{currentMatch.goals_home}</div>
          <div className="possession-dot">{activePossession.team === "LOCAL" ? "ATAQUE" : "DEFENSA"}</div>

          {possessionStarted && (
            <div className="team-scoreboard-actions">
              {activePossession.team === "LOCAL" ? (
                <div className="scoreboard-actions-grid attack-grid">
                  <button
                    type="button"
                    className={`sb-action-btn btn-lanzamiento ${selectedTeamAction?.team === "LOCAL" && selectedTeamAction?.action === "lanzamiento" ? "active" : ""}`}
                    onClick={() => handleSelectTeamAction("LOCAL", "lanzamiento")}
                    aria-label="Registrar lanzamiento local"
                  >
                    <IconGoalNet /> Lanzamiento
                  </button>
                  <button
                    type="button"
                    className={`sb-action-btn btn-perdida ${selectedTeamAction?.team === "LOCAL" && selectedTeamAction?.action === "perdida" ? "active" : ""}`}
                    onClick={() => handleSelectTeamAction("LOCAL", "perdida")}
                    aria-label="Registrar pérdida local"
                  >
                    <IconAlertTriangle /> Pérdida
                  </button>
                  <button
                    type="button"
                    className={`sb-action-btn btn-sancion ${selectedTeamAction?.team === "LOCAL" && selectedTeamAction?.action === "sancion" ? "active" : ""}`}
                    onClick={() => handleSelectTeamAction("LOCAL", "sancion")}
                    aria-label="Registrar sanción local"
                  >
                    <IconShield /> Sanción
                  </button>
                  <button
                    type="button"
                    className="sb-action-btn btn-timeout"
                    onClick={() => {
                      handleAction("sanction", { sanction_type: "Tiempo Muerto Local" });
                      setIsRunning(false);
                    }}
                    aria-label="Tiempo muerto local"
                  >
                    <IconClock /> T. Muerto
                  </button>
                </div>
              ) : (
                <div className="scoreboard-actions-grid defense-grid">
                  <button
                    type="button"
                    className={`sb-action-btn btn-golpe-franco ${selectedTeamAction?.team === "LOCAL" && selectedTeamAction?.action === "free_throw" ? "active" : ""}`}
                    onClick={() => handleSelectTeamAction("LOCAL", "free_throw")}
                    aria-label="Registrar golpe franco cometido por local"
                  >
                    <IconHandball /> Golpe Franco
                  </button>
                  <button
                    type="button"
                    className={`sb-action-btn btn-lanzamiento ${selectedTeamAction?.team === "LOCAL" && selectedTeamAction?.action === "penalty_7m" ? "active" : ""}`}
                    onClick={() => handleSelectTeamAction("LOCAL", "penalty_7m")}
                    aria-label="Registrar 7m cometido por local en defensa"
                  >
                    <IconTarget /> 7m Penalti
                  </button>
                  <button
                    type="button"
                    className={`sb-action-btn btn-sancion ${selectedTeamAction?.team === "LOCAL" && selectedTeamAction?.action === "sancion" ? "active" : ""}`}
                    onClick={() => handleSelectTeamAction("LOCAL", "sancion")}
                    aria-label="Registrar sanción local en defensa"
                  >
                    <IconShield /> Sanción
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* MÓDULO CRONÓMETRO */}
        <div className="scoreboard-timer-module" role="timer" aria-label="Cronómetro del partido">
          {isEditingTime ? (
            <div className="timer-edit-inputs" style={{ display: "flex", gap: 5, justifyContent: "center", alignItems: "center", marginBottom: 12 }}>
              <input
                type="number"
                min="0"
                max="99"
                value={inputMinutes}
                onChange={(e) => setInputMinutes(e.target.value)}
                className="input-field select-sm"
                style={{ width: 60, textAlign: "center", fontSize: "1.2rem", padding: "4px" }}
                placeholder="Min"
                aria-label="Minutos"
              />
              <span style={{ fontSize: "1.2rem", color: "#9ca3af" }}>:</span>
              <input
                type="number"
                min="0"
                max="59"
                value={inputSeconds}
                onChange={(e) => setInputSeconds(e.target.value)}
                className="input-field select-sm"
                style={{ width: 60, textAlign: "center", fontSize: "1.2rem", padding: "4px" }}
                placeholder="Seg"
                aria-label="Segundos"
              />
              <button className="btn btn-primary btn-sm" onClick={handleSaveTime} style={{ padding: "6px 10px", marginLeft: 5 }} aria-label="Confirmar tiempo">
                <IconCheck />
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => setIsEditingTime(false)} style={{ padding: "6px 10px" }} aria-label="Cancelar edición">
                <IconX />
              </button>
            </div>
          ) : (
            <div
              className="timer-display"
              onClick={handleStartEditTime}
              style={{ cursor: "pointer" }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleStartEditTime(); }}
              aria-label={`Tiempo: ${formatTime(time)}. Clic para editar.`}
            >
              {formatTime(time)} <IconEdit />
            </div>
          )}
          {/* FILA 1: AJUSTES DE TIEMPO */}
          <div className="timer-adjust-row" style={{ display: "flex", gap: "4px", justifyContent: "center", marginBottom: "8px" }}>
            <button className="btn-time-adjust" onClick={() => adjustTime(-60)} aria-label="Restar 1 minuto">-1m</button>
            <button className="btn-time-adjust" onClick={() => adjustTime(-10)} aria-label="Restar 10 segundos">-10s</button>
            <button className="btn-time-adjust" onClick={() => adjustTime(10)} aria-label="Sumar 10 segundos">+10s</button>
            <button className="btn-time-adjust" onClick={() => adjustTime(60)} aria-label="Sumar 1 minuto">+1m</button>
          </div>

          {/* FILA 2: CONTROLES PRINCIPALES (INICIAR/PAUSAR + FIN PERIODEO) */}
          <div className="timer-main-controls-row" style={{ display: "flex", gap: "6px", justifyContent: "center", alignItems: "center" }}>
            <button
              type="button"
              className={`btn-timer-play ${isRunning ? "running" : ""}`}
              onClick={() => setIsRunning(!isRunning)}
              style={{ flex: 1, padding: "8px 12px", fontSize: "0.8rem", height: "34px", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "4px" }}
              aria-label={isRunning ? "Pausar cronómetro" : "Iniciar cronómetro"}
            >
              {isRunning ? <><IconPause /> Pausar</> : <><IconPlay /> Iniciar</>}
            </button>

            {possessionStarted && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ flex: 1, fontSize: "0.75rem", padding: "8px 8px", height: "34px", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "4px", whiteSpace: "nowrap" }}
                onClick={() => {
                  if (time < 1800) {
                    handleEndFirstHalf();
                  } else if (time < 3600) {
                    handleEndSecondHalf();
                  } else {
                    setActiveActionSubmenu("fin_periodo");
                  }
                }}
                aria-label="Controles de fin de periodo"
              >
                <IconFlag /> Fin Periodo
              </button>
            )}
          </div>
        </div>

        {/* EQUIPO VISITANTE */}
        <div className={`scoreboard-team away-side ${activePossession.team === "VISITANTE" ? "has-possession" : ""}`}>
          <div className="team-name">{currentMatch.away_team}</div>
          <div className="team-score" role="status" aria-live="polite">{currentMatch.goals_away}</div>
          <div className="possession-dot">{activePossession.team === "VISITANTE" ? "ATAQUE" : "DEFENSA"}</div>

          {possessionStarted && (
            <div className="team-scoreboard-actions">
              {activePossession.team === "VISITANTE" ? (
                <div className="scoreboard-actions-grid attack-grid">
                  <button
                    type="button"
                    className={`sb-action-btn btn-lanzamiento ${selectedTeamAction?.team === "VISITANTE" && selectedTeamAction?.action === "lanzamiento" ? "active" : ""}`}
                    onClick={() => handleSelectTeamAction("VISITANTE", "lanzamiento")}
                    aria-label="Registrar lanzamiento visitante"
                  >
                    <IconGoalNet /> Lanzamiento
                  </button>
                  <button
                    type="button"
                    className={`sb-action-btn btn-perdida ${selectedTeamAction?.team === "VISITANTE" && selectedTeamAction?.action === "perdida" ? "active" : ""}`}
                    onClick={() => handleSelectTeamAction("VISITANTE", "perdida")}
                    aria-label="Registrar pérdida visitante"
                  >
                    <IconAlertTriangle /> Pérdida
                  </button>
                  <button
                    type="button"
                    className={`sb-action-btn btn-sancion ${selectedTeamAction?.team === "VISITANTE" && selectedTeamAction?.action === "sancion" ? "active" : ""}`}
                    onClick={() => handleSelectTeamAction("VISITANTE", "sancion")}
                    aria-label="Registrar sanción visitante"
                  >
                    <IconShield /> Sanción
                  </button>
                  <button
                    type="button"
                    className="sb-action-btn btn-timeout"
                    onClick={() => {
                      handleAction("sanction", { sanction_type: "Tiempo Muerto Visitante" });
                      setIsRunning(false);
                    }}
                    aria-label="Tiempo muerto visitante"
                  >
                    <IconClock /> T. Muerto
                  </button>
                </div>
              ) : (
                <div className="scoreboard-actions-grid defense-grid">
                  <button
                    type="button"
                    className={`sb-action-btn btn-golpe-franco ${selectedTeamAction?.team === "VISITANTE" && selectedTeamAction?.action === "free_throw" ? "active" : ""}`}
                    onClick={() => handleSelectTeamAction("VISITANTE", "free_throw")}
                    aria-label="Registrar golpe franco cometido por visitante"
                  >
                    <IconHandball /> Golpe Franco
                  </button>
                  <button
                    type="button"
                    className={`sb-action-btn btn-lanzamiento ${selectedTeamAction?.team === "VISITANTE" && selectedTeamAction?.action === "penalty_7m" ? "active" : ""}`}
                    onClick={() => handleSelectTeamAction("VISITANTE", "penalty_7m")}
                    aria-label="Registrar 7m cometido por visitante en defensa"
                  >
                    <IconTarget /> 7m Penalti
                  </button>
                  <button
                    type="button"
                    className={`sb-action-btn btn-sancion ${selectedTeamAction?.team === "VISITANTE" && selectedTeamAction?.action === "sancion" ? "active" : ""}`}
                    onClick={() => handleSelectTeamAction("VISITANTE", "sancion")}
                    aria-label="Registrar sanción visitante en defensa"
                  >
                    <IconShield /> Sanción
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ESTADO INICIAL: SELECCIONAR QUIEN EMPIEZA */}
      {!possessionStarted ? (
        <section className="initial-possession-card" aria-label="Selección de posesión inicial">
          <h3><IconMegaphone /> Posesión Inicial</h3>
          <p>Para comenzar a cronometrar el partido, selecciona qué equipo inicia con el balón:</p>
          <div className="possession-buttons">
            <button className="btn btn-primary btn-lg" onClick={() => handleStartPossession("LOCAL")} aria-label={`Balón para ${currentMatch.home_team}`}>
              Balón para {currentMatch.home_team} (Local)
            </button>
            <button className="btn btn-primary btn-lg" onClick={() => handleStartPossession("VISITANTE")} aria-label={`Balón para ${currentMatch.away_team}`}>
              Balón para {currentMatch.away_team} (Visitante)
            </button>
          </div>
        </section>
      ) : (
        /* PANEL PRINCIPAL DE ACCIONES */
        <div className="analysis-panel-grid" style={{ display: "flex", flexDirection: "column", gap: "20px", marginTop: "10px" }}>

          {selectedTeamAction === null ? (
            /* ESPACIO VACÍO / DE INSTRUCCIONES */
            <div className="empty-workspace-card" style={{ textAlign: "center", padding: "40px", background: "var(--bg-surface)", borderRadius: "var(--radius)", border: "1px dashed var(--border-color)" }}>
              <IconMegaphone style={{ fontSize: "2.5rem", color: "var(--text-muted)", marginBottom: "15px" }} />
              <h3 style={{ color: "var(--text-color)", marginBottom: "8px" }}>Mesa de Control Balonmano</h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", maxWidth: "450px", margin: "0 auto 20px auto" }}>
                Selecciona una acción (Lanzamiento, Pérdida, Sanción o Golpe Franco) en el marcador del equipo correspondiente para comenzar a registrar datos en tiempo real.
              </p>

              <div className="manual-control-box" style={{ maxWidth: "300px", margin: "0 auto" }}>
                <button
                  type="button"
                  className="btn btn-secondary w-100 btn-change-possession"
                  onClick={handleManualPossessionChange}
                  aria-label="Cambiar posesión manualmente"
                >
                  <IconRefresh /> Cambiar Posesión Manualmente
                </button>
              </div>
            </div>
          ) : (
            /* DETALLES DE ACCIÓN DE EQUIPO SELECCIONADA */
            <div className="active-action-workspace" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>

              {/* COLUMNA IZQUIERDA: SELECCIÓN DE JUGADOR O MODIFICADOR SANCIONES */}
              <section className="roster-selection-card" aria-label="Selección de jugador destinatario">
                {selectedTeamAction.action === "sancion" ? (
                  <>
                    <h3><IconShield /> Tipo de Sanción Disciplinaria</h3>
                    <div className="modifier-group" style={{ margin: "12px 0 20px 0" }}>
                      <div className="modifier-buttons" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                        {[
                          { id: "Tarjeta Amarilla", label: "Amarilla" },
                          { id: "2 Minutos", label: "Exclusión (2m)" },
                          { id: "Tarjeta Roja", label: "Roja" },
                          { id: "Tarjeta Azul", label: "Azul" }
                        ].map((sanc) => (
                          <button
                            key={sanc.id}
                            type="button"
                            className={`modifier-btn ${selectedSanctionType === sanc.id ? "active" : ""}`}
                            onClick={() => setSelectedSanctionType(sanc.id)}
                            aria-pressed={selectedSanctionType === sanc.id}
                          >
                            {sanc.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                ) : null}

                <h3>
                  <IconUsers /> Roster:{" "}
                  {selectedTeamAction.action === "penalty_7m" ? (
                    !pending7mDetails.defender
                      ? `${selectedTeamAction.team === "LOCAL" ? currentMatch.home_team : currentMatch.away_team} (Defensa)`
                      : `${selectedTeamAction.team === "LOCAL" ? currentMatch.away_team : currentMatch.home_team} (Ataque)`
                  ) : selectedTeamAction.action === "falta_en_ataque" ? (
                    !pendingFaltaAtaqueDetails.attacker
                      ? `${selectedTeamAction.team === "LOCAL" ? currentMatch.home_team : currentMatch.away_team} (Ataque)`
                      : `${selectedTeamAction.team === "LOCAL" ? currentMatch.away_team : currentMatch.home_team} (Defensa)`
                  ) : (
                    selectedTeamAction.team === "LOCAL" ? currentMatch.home_team : currentMatch.away_team
                  )}
                </h3>
                <p className="roster-hint">
                  {selectedTeamAction.action === "penalty_7m" ? (
                    !pending7mDetails.defender
                      ? "1º Selecciona el defensor que COMETIÓ / PROVOCÓ el 7m:"
                      : "2º Selecciona el atacante que SUFRIÓ / RECIBIÓ el 7m:"
                  ) : selectedTeamAction.action === "falta_en_ataque" ? (
                    !pendingFaltaAtaqueDetails.attacker
                      ? "1º Selecciona el atacante que COMETIÓ / PROVOCÓ la falta en ataque:"
                      : "2º Selecciona el defensa A QUIEN SE LA PROVOCARON:"
                  ) : (
                    "Selecciona el jugador que realiza/recibe la acción:"
                  )}
                </p>

                <div className="players-touch-grid" role="radiogroup" aria-label="Jugadores disponibles">
                  {/* Botón de Equipo (General) - no disponible para Lanzamiento */}
                  {selectedTeamAction.action !== "lanzamiento" && (
                    <button
                      className={`player-touch-btn team-option ${selectedPlayer === "team" ? "selected" : ""}`}
                      onClick={() => {
                        if (selectedTeamAction.action === "penalty_7m") {
                          if (!pending7mDetails.defender) {
                            setPending7mDetails({ defender: "team", attacker: null });
                          } else {
                            handleConfirm7mPenalty(pending7mDetails.defender, "team");
                          }
                        } else if (selectedTeamAction.action === "falta_en_ataque") {
                          if (!pendingFaltaAtaqueDetails.attacker) {
                            setPendingFaltaAtaqueDetails({ attacker: "team", defender: null });
                          } else {
                            handleConfirmFaltaAtaque(pendingFaltaAtaqueDetails.attacker, "team");
                          }
                        } else {
                          setSelectedPlayer("team");
                          if (selectedTeamAction.action === "sancion") {
                            handleAction("sanction", {
                              sanction_type: selectedSanctionType,
                              player_id: "Equipo",
                              is_opponent_action: selectedTeamAction.team === "VISITANTE"
                            });
                          } else if (selectedTeamAction.action === "free_throw") {
                            const isOpp = selectedTeamAction.team === "VISITANTE";
                            sendMatchEvent({
                              event_type: "free_throw",
                              player_id: "Equipo",
                              is_opponent_action: isOpp
                            }, time);
                            setSelectedPlayer(null);
                            setSelectedTeamAction(null);
                          }
                        }
                      }}
                      role="radio"
                      aria-checked={selectedPlayer === "team"}
                      aria-label="Equipo general"
                    >
                      <span className="btn-number"><IconShield /></span>
                      <span className="btn-name">Equipo (General)</span>
                    </button>
                  )}

                  {/* Listar jugadores del equipo correspondiente */}
                  {(
                    selectedTeamAction.action === "penalty_7m" ? (
                      !pending7mDetails.defender
                        ? (selectedTeamAction.team === "LOCAL" ? currentMatch.home_players || [] : currentMatch.away_players || [])
                        : (selectedTeamAction.team === "LOCAL" ? currentMatch.away_players || [] : currentMatch.home_players || [])
                    ) : selectedTeamAction.action === "falta_en_ataque" ? (
                      !pendingFaltaAtaqueDetails.attacker
                        ? (selectedTeamAction.team === "LOCAL" ? currentMatch.home_players || [] : currentMatch.away_players || [])
                        : (selectedTeamAction.team === "LOCAL" ? currentMatch.away_players || [] : currentMatch.home_players || [])
                    ) : (
                      selectedTeamAction.team === "LOCAL" ? currentMatch.home_players || [] : currentMatch.away_players || []
                    )
                  ).map((player, idx) => {
                    const isGk = isGoalkeeper(player);

                    let isBtnDisabled = false;

                    const isSelected = selectedPlayer?.number === player.number;

                    return (
                      <button
                        key={idx}
                        disabled={isBtnDisabled}
                        className={`player-touch-btn ${isSelected ? "selected" : ""} ${isGk ? "goalkeeper-option" : ""} ${isBtnDisabled ? "btn-disabled" : ""}`}
                        onClick={() => {
                          if (selectedTeamAction.action === "penalty_7m") {
                            if (!pending7mDetails.defender) {
                              setPending7mDetails({ defender: player, attacker: null });
                            } else {
                              handleConfirm7mPenalty(pending7mDetails.defender, player);
                            }
                          } else if (selectedTeamAction.action === "falta_en_ataque") {
                            if (!pendingFaltaAtaqueDetails.attacker) {
                              setPendingFaltaAtaqueDetails({ attacker: player, defender: null });
                            } else {
                              handleConfirmFaltaAtaque(pendingFaltaAtaqueDetails.attacker, player);
                            }
                          } else {
                            setSelectedPlayer(player);

                            if (selectedTeamAction.action === "sancion") {
                              handleAction("sanction", {
                                sanction_type: selectedSanctionType,
                                player_id: `${player.number} - ${player.name}`,
                                is_opponent_action: selectedTeamAction.team === "VISITANTE"
                              });
                            } else if (selectedTeamAction.action === "free_throw") {
                              const isOpp = selectedTeamAction.team === "VISITANTE";
                              sendMatchEvent({
                                event_type: "free_throw",
                                player_id: `${player.number} - ${player.name}`,
                                is_opponent_action: isOpp
                              }, time);
                              setSelectedPlayer(null);
                              setSelectedTeamAction(null);
                            }
                          }
                        }}
                        style={{
                          border: isGk ? "1px dashed var(--accent-success)" : undefined,
                          opacity: isBtnDisabled ? 0.3 : 1
                        }}
                        role="radio"
                        aria-checked={isSelected}
                        aria-label={`${isGk ? "Portero" : "Jugador"} número ${player.number}, ${player.name}`}
                      >
                        <span className="btn-number">{`#${player.number}`}</span>
                        <span className="btn-name">
                          {isGk ? `[POR] ${player.name}` : player.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* COLUMNA DERECHA: SUBMENÚS DE ACCIONES */}
              <section className="action-buttons-card" aria-label="Detalles de acción de juego">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                  <h3 style={{ margin: 0 }}>
                    {selectedTeamAction.action === "lanzamiento" ? (
                      <><IconGoalNet /> Detalles del Lanzamiento</>
                    ) : selectedTeamAction.action === "perdida" ? (
                      <><IconAlertTriangle /> Detalles de la Pérdida</>
                    ) : selectedTeamAction.action === "sancion" ? (
                      <><IconShield /> Detalles de la Sanción</>
                    ) : selectedTeamAction.action === "penalty_7m" ? (
                      <><IconTarget /> 7m Cometido en Defensa</>
                    ) : selectedTeamAction.action === "falta_en_ataque" ? (
                      <><IconAlertTriangle /> Falta en Ataque</>
                    ) : (
                      <><IconHandball /> Detalles Golpe Franco</>
                    )}
                  </h3>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      setSelectedPlayer(null);
                      setSelectedTeamAction(null);
                      setActiveActionSubmenu(null);
                      setPending7mDetails({ defender: null, attacker: null });
                      setPendingFaltaAtaqueDetails({ attacker: null, defender: null });
                      resetShotWizard();
                    }}
                    aria-label="Cancelar acción"
                  >
                    <IconX /> Cancelar Acción
                  </button>
                </div>

                {/* Subvista de Lanzamiento */}
                {selectedTeamAction.action === "lanzamiento" && (
                  <div>
                    {!selectedPlayer ? (
                      <div className="action-step-hint" style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)", background: "rgba(255,255,255,0.01)", borderRadius: "6px", border: "1px dashed rgba(255,255,255,0.05)" }}>
                        Por favor, selecciona un jugador del Roster de la izquierda para configurar los detalles del lanzamiento.
                      </div>
                    ) : activeActionSubmenu === "select_goal_zone" ? (
                      /* PASO 2: PORTERÍA EN EL MISMO LUGAR */
                      <div className="submenu-container live-logging-container" style={{ border: "none", padding: 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                          <span style={{ fontSize: "0.85rem", fontWeight: "bold", color: "var(--text-primary)" }}>
                            Zona de Portería:
                          </span>
                          <button type="button" className="btn-back-menu" onClick={() => setActiveActionSubmenu(null)} aria-label="Modificar opciones de tiro">
                            <IconArrowLeft /> Modificar opciones
                          </button>
                        </div>
                        <p className="submenu-hint" style={{ marginBottom: "10px" }}>
                          {shotResult === "Gol" || shotResult === "Parada"
                            ? "Haz clic en la zona interior de la portería donde fue el balón:"
                            : shotResult === "Poste"
                              ? "Haz clic en los postes o larguero de la portería:"
                              : "Haz clic en la zona exterior del campo donde se marchó el balón:"}
                        </p>

                        <div style={{ display: "flex", justifyContent: "center", margin: "10px 0" }}>
                          <div className="goal-grid-selector">
                            {goalZones.map((zone, zIdx) => {
                              const isPost = zone.group === "poste";
                              const isOutside = zone.group === "fuera";
                              const isInside = zone.group === "interior";

                              let isEnabled = false;
                              if (isOutside && shotResult === "Fuera") isEnabled = true;
                              if (isPost && shotResult === "Poste") isEnabled = true;
                              if (isInside && (shotResult === "Gol" || shotResult === "Parada")) isEnabled = true;

                              let btnClass = "goal-zone-btn ";
                              if (isPost) btnClass += "zone-post";
                              else if (isOutside) btnClass += "zone-outside";
                              else btnClass += "zone-inside";

                              if (isEnabled) btnClass += " enabled";
                              else btnClass += " disabled";

                              return (
                                <button
                                  key={`zone-${zIdx}`}
                                  type="button"
                                  disabled={!isEnabled}
                                  className={btnClass}
                                  style={zone.style}
                                  onClick={() => handleSelectGoalZone(zone.id)}
                                  title={zone.label}
                                  aria-label={zone.label}
                                >
                                  <span className="zone-label-text">{zone.id}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    ) : activeActionSubmenu === "select_opposing_goalkeeper" ? (
                      /* PASO 3: PORTERO DEFENSOR EN EL MISMO LUGAR */
                      <div className="submenu-container live-logging-container" style={{ border: "none", padding: 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                          <span style={{ fontSize: "0.85rem", fontWeight: "bold", color: "var(--text-primary)" }}>
                            Portero Defensor:
                          </span>
                          <button type="button" className="btn-back-menu" onClick={() => setActiveActionSubmenu("select_goal_zone")} aria-label="Volver a portería">
                            <IconArrowLeft /> Volver
                          </button>
                        </div>
                        <p className="submenu-hint" style={{ marginBottom: "12px" }}>¿Qué portero del equipo contrario estaba en la portería?</p>

                        <div className="options-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "10px" }}>
                          {defendingGoalkeepers.map((gk, idx) => (
                            <button
                              key={idx}
                              type="button"
                              className="option-btn btn-parada"
                              onClick={() => {
                                const gkDetails = {
                                  goalkeeper_number: gk.number,
                                  goalkeeper_name: gk.name,
                                  shooter_number: selectedPlayer && selectedPlayer !== "team" ? selectedPlayer.number : null,
                                  shooter_name: selectedPlayer && selectedPlayer !== "team" ? selectedPlayer.name : (selectedPlayer === "team" ? "Equipo" : null)
                                };
                                handleAction("shot", { ...pendingAction.details, ...gkDetails });
                                setPendingAction(null);
                                setActiveActionSubmenu(null);
                              }}
                              style={{ padding: "12px", fontSize: "0.85rem" }}
                              aria-label={`Portero número ${gk.number}, ${gk.name}`}
                            >
                              #{gk.number} - {gk.name}
                            </button>
                          ))}

                          <button
                            key="unknown-gk"
                            type="button"
                            className="option-btn btn-parada"
                            onClick={() => {
                              const gkDetails = {
                                goalkeeper_number: 0,
                                goalkeeper_name: "Portero Desconocido",
                                shooter_number: selectedPlayer && selectedPlayer !== "team" ? selectedPlayer.number : null,
                                shooter_name: selectedPlayer && selectedPlayer !== "team" ? selectedPlayer.name : (selectedPlayer === "team" ? "Equipo" : null)
                              };
                              handleAction("shot", { ...pendingAction.details, ...gkDetails });
                              setPendingAction(null);
                              setActiveActionSubmenu(null);
                            }}
                            style={{ padding: "12px", fontSize: "0.85rem" }}
                          >
                            Portero Desconocido
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* PASO 1: CONFIGURAR OPCIONES DE LANZAMIENTO */
                      <div className="submenu-container live-logging-container" style={{ border: "none", padding: 0 }}>
                        <div className="live-modifiers-grid" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                          {/* Fila 1: Resultado */}
                          <div className="live-modifier-row">
                            <span className="live-row-label" style={{ display: "block", fontSize: "0.8rem", fontWeight: "bold", color: "var(--text-muted)", marginBottom: "4px" }}>Resultado:</span>
                            <div className="live-row-options grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "6px" }}>
                              {["Gol", "Parada", "Fuera", "Poste"].map((res) => {
                                let btnBorder = undefined;
                                if (shotResult === res) {
                                  btnBorder = res === "Gol" ? "2px solid #10b981" : (res === "Parada" ? "2px solid #3b82f6" : "2px solid #f59e0b");
                                }
                                return (
                                  <button
                                    key={res}
                                    type="button"
                                    className={`modifier-btn ${shotResult === res ? "active" : ""}`}
                                    onClick={() => {
                                      setShotResult(res);
                                      if (res !== "Gol") {
                                        setSelectedAssistPosition("Ninguna");
                                      }
                                    }}
                                    style={{ border: btnBorder, padding: "8px 2px", fontSize: "0.78rem" }}
                                    aria-pressed={shotResult === res}
                                  >
                                    {res}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Fila 2: Fase de Juego */}
                          <div className="live-modifier-row">
                            <span className="live-row-label" style={{ display: "block", fontSize: "0.8rem", fontWeight: "bold", color: "var(--text-muted)", marginBottom: "4px" }}>Fase de Juego:</span>
                            <div className="live-row-options grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "6px" }}>
                              {[
                                { id: "Posicional", label: "Posicional" },
                                { id: "1ª Oleada", label: "1ª Oleada" },
                                { id: "2ª Oleada", label: "2ª Oleada" },
                                { id: "7m", label: "7m (Penalti)" }
                              ].map((phase) => (
                                <button
                                  key={phase.id}
                                  type="button"
                                  className={`modifier-btn ${selectedPhase === phase.id ? "active" : ""}`}
                                  onClick={() => {
                                    setSelectedPhase(phase.id);
                                    if (phase.id === "7m") {
                                      setSelectedPosition("Centro");
                                    } else if (phase.id === "1ª Oleada") {
                                      if (selectedPosition === "Muy Izquierda" || selectedPosition === "Muy Derecha") {
                                        setSelectedPosition("Centro");
                                      }
                                    }
                                  }}
                                  style={{
                                    padding: "8px 2px",
                                    fontSize: "0.75rem",
                                    border: selectedPhase === phase.id ? "2px solid var(--accent-primary)" : undefined
                                  }}
                                  aria-pressed={selectedPhase === phase.id}
                                >
                                  {phase.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Fila 3: Tipo de Tiro */}
                          {(() => {
                            const isTypeDisabled = selectedPhase === "7m" || selectedPhase === "1ª Oleada";
                            return (
                              <div className="live-modifier-row" style={{ opacity: isTypeDisabled ? 0.3 : 1, transition: "opacity 0.2s" }}>
                                <span className="live-row-label" style={{ display: "block", fontSize: "0.8rem", fontWeight: "bold", color: "var(--text-muted)", marginBottom: "4px" }}>Tipo de Tiro:</span>
                                <div className="live-row-options grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "6px" }}>
                                  {["Extremo", "Pivote", "Exterior", "Penetración"].map((type) => (
                                    <button
                                      key={type}
                                      type="button"
                                      disabled={isTypeDisabled}
                                      className={`modifier-btn ${selectedShotType === type ? "active" : ""}`}
                                      onClick={() => {
                                        setSelectedShotType(type);
                                        if (type === "Extremo") {
                                          if (selectedPosition !== "Izquierda" && selectedPosition !== "Derecha") {
                                            setSelectedPosition("Izquierda");
                                          }
                                        }
                                      }}
                                      style={{
                                        padding: "8px 2px",
                                        fontSize: "0.75rem",
                                        border: selectedShotType === type ? "2px solid var(--accent-primary)" : undefined
                                      }}
                                      aria-pressed={selectedShotType === type}
                                    >
                                      {type === "Exterior" ? "Exterior 9m" : type}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            );
                          })()}

                          {/* Fila 4: Posición Horizontal */}
                          {(() => {
                            const isPosDisabled = selectedPhase === "7m";
                            return (
                              <div className="live-modifier-row" style={{ opacity: isPosDisabled ? 0.3 : 1, transition: "opacity 0.2s" }}>
                                <span className="live-row-label" style={{ display: "block", fontSize: "0.8rem", fontWeight: "bold", color: "var(--text-muted)", marginBottom: "4px" }}>Posición de Campo:</span>
                                <div className="live-row-options grid-5" style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "4px" }}>
                                  {["Muy Izquierda", "Izquierda", "Centro", "Derecha", "Muy Derecha"].map((pos) => {
                                    let isBtnDisabled = isPosDisabled;
                                    if (!isPosDisabled) {
                                      if (selectedPhase === "1ª Oleada") {
                                        if (pos === "Muy Izquierda" || pos === "Muy Derecha") isBtnDisabled = true;
                                      } else if (selectedShotType === "Extremo") {
                                        if (pos !== "Izquierda" && pos !== "Derecha") isBtnDisabled = true;
                                      }
                                    }

                                    return (
                                      <button
                                        key={pos}
                                        type="button"
                                        disabled={isBtnDisabled}
                                        className={`modifier-btn ${selectedPosition === pos ? "active" : ""}`}
                                        onClick={() => setSelectedPosition(pos)}
                                        style={{
                                          padding: "8px 2px",
                                          fontSize: "0.68rem",
                                          border: selectedPosition === pos ? "2px solid var(--accent-primary)" : undefined,
                                          opacity: isBtnDisabled ? 0.15 : 1
                                        }}
                                        aria-pressed={selectedPosition === pos}
                                      >
                                        {pos}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })()}

                          {/* Fila 5: Situación Numérica */}
                          <div className="live-modifier-row">
                            <span className="live-row-label" style={{ display: "block", fontSize: "0.8rem", fontWeight: "bold", color: "var(--text-muted)", marginBottom: "4px" }}>Sit. Numérica:</span>
                            <div className="live-row-options grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px" }}>
                              {["Igualdad", "Superioridad", "Inferioridad"].map((sit) => {
                                const autoSit = getAutoNumericalSituation();
                                const isAuto = autoSit === sit;

                                return (
                                  <button
                                    key={sit}
                                    type="button"
                                    className={`modifier-btn ${selectedNumericalSituation === sit ? "active" : ""}`}
                                    onClick={() => setSelectedNumericalSituation(sit)}
                                    style={{
                                      padding: "8px 2px",
                                      fontSize: "0.75rem",
                                      border: selectedNumericalSituation === sit ? "2px solid var(--accent-primary)" : undefined
                                    }}
                                    aria-pressed={selectedNumericalSituation === sit}
                                  >
                                    {sit} {isAuto && <span style={{ fontSize: "0.6rem", display: "block", opacity: 0.7 }}>(Auto)</span>}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Fila 6: Asistencia */}
                          {shotResult === "Gol" && (
                            <div className="live-modifier-row">
                              <span className="live-row-label" style={{ display: "block", fontSize: "0.8rem", fontWeight: "bold", color: "var(--text-muted)", marginBottom: "4px" }}>Asistido por (Posición):</span>
                              <div className="live-row-options grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "6px" }}>
                                {[
                                  "Ninguna",
                                  "Portero",
                                  "Extremo Izquierdo",
                                  "Lateral Izquierdo",
                                  "Central",
                                  "Lateral Derecho",
                                  "Extremo Derecho",
                                  "Pivote"
                                ].map((pos) => (
                                  <button
                                    key={pos}
                                    type="button"
                                    className={`modifier-btn ${selectedAssistPosition === pos ? "active" : ""}`}
                                    onClick={() => setSelectedAssistPosition(pos)}
                                    style={{
                                      padding: "8px 2px",
                                      fontSize: "0.68rem",
                                      border: selectedAssistPosition === pos ? "2px solid var(--accent-primary)" : undefined
                                    }}
                                    aria-pressed={selectedAssistPosition === pos}
                                  >
                                    {pos}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Sanciones activas */}
                        {(() => {
                          const activeSanc = getActiveSuspensions();
                          const hasHomeSanc = activeSanc.home.length > 0;
                          const hasAwaySanc = activeSanc.away.length > 0;
                          if (!hasHomeSanc && !hasAwaySanc) return null;

                          return (
                            <div className="active-suspensions-wizard-info" style={{ margin: "12px 0 8px 0", padding: "8px 10px", background: "rgba(255,255,255,0.03)", borderRadius: "6px", fontSize: "0.75rem", border: "1px solid rgba(255,255,255,0.05)" }}>
                              <div style={{ fontWeight: "bold", marginBottom: "4px", color: "var(--text-muted)" }}>
                                Sanciones de 2 Minutos Activas:
                              </div>
                              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                                {activeSanc.home.map((s, idx) => (
                                  <div key={`live-s-home-${idx}`} style={{ color: "#38bdf8" }}>
                                    • {currentMatch.home_team}: <strong>{s.player_id}</strong> (Resta {s.remaining}s)
                                  </div>
                                ))}
                                {activeSanc.away.map((s, idx) => (
                                  <div key={`live-s-away-${idx}`} style={{ color: "#ec4899" }}>
                                    • {currentMatch.away_team}: <strong>{s.player_id}</strong> (Resta {s.remaining}s)
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })()}

                        <button
                          type="button"
                          className="btn btn-primary w-100"
                          style={{ marginTop: "15px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontWeight: "bold", padding: "12px" }}
                          onClick={() => handleConfirmShotDetails()}
                        >
                          <IconCheck /> CONTINUAR A PORTERÍA ➔
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Subvista de Pérdida */}
                {selectedTeamAction.action === "perdida" && (
                  <div>
                    {!selectedPlayer ? (
                      <div className="action-step-hint" style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)", background: "rgba(255,255,255,0.01)", borderRadius: "6px", border: "1px dashed rgba(255,255,255,0.05)" }}>
                        Por favor, selecciona un jugador o "Equipo (General)" de la izquierda para configurar los detalles de la pérdida.
                      </div>
                    ) : activeActionSubmenu === "select_defender_falta_ataque" ? (
                      /* PASO SECUNDARIO PARA FALTA EN ATAQUE: SELECCIONAR DEFENSOR */
                      <div className="submenu-container live-logging-container" style={{ border: "none", padding: 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                          <span style={{ fontSize: "0.85rem", fontWeight: "bold", color: "var(--text-primary)" }}>
                            Defensa a quien se la provocaron:
                          </span>
                          <button type="button" className="btn-back-menu" onClick={() => setActiveActionSubmenu(null)} aria-label="Volver">
                            <IconArrowLeft /> Volver
                          </button>
                        </div>
                        <p className="submenu-hint" style={{ marginBottom: "12px" }}>
                          ¿A qué defensa del equipo contrario le provocaron la falta en ataque?
                        </p>

                        <div className="options-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "10px" }}>
                          {(selectedTeamAction.team === "LOCAL" ? currentMatch.away_players || [] : currentMatch.home_players || []).map((def, idx) => (
                            <button
                              key={idx}
                              type="button"
                              className="option-btn btn-perdida"
                              onClick={() => {
                                handleAction("turnover", {
                                  end_reason: "Falta en ataque",
                                  defender_number: def.number,
                                  defender_name: def.name,
                                  defender_id: `${def.number} - ${def.name}`
                                });
                                setActiveActionSubmenu(null);
                              }}
                              style={{ padding: "12px", fontSize: "0.85rem" }}
                              aria-label={`Defensa número ${def.number}, ${def.name}`}
                            >
                              #{def.number} - {def.name}
                            </button>
                          ))}

                          <button
                            key="no-defender"
                            type="button"
                            className="option-btn btn-perdida"
                            onClick={() => {
                              handleAction("turnover", { end_reason: "Falta en ataque" });
                              setActiveActionSubmenu(null);
                            }}
                            style={{ padding: "12px", fontSize: "0.85rem" }}
                          >
                            Sin Defensor / Desconocido
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* OPCIONES DE PÉRDIDA DE BALÓN */
                      <div className="submenu-container" style={{ border: "none", padding: 0 }}>
                        <p className="submenu-hint" style={{ marginBottom: "12px" }}>Selecciona la causa de la pérdida de balón:</p>
                        <div className="options-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                          {[
                            { reason: "Falta en ataque", label: "Falta en ataque" },
                            { reason: "Mal Pase", label: "Mal Pase" },
                            { reason: "Pasivo", label: "Pasivo" },
                            { reason: "Dobles / Pasos", label: "Dobles / Pasos" }
                          ].map((item) => (
                            <button
                              key={item.reason}
                              type="button"
                              className="option-btn btn-perdida"
                              onClick={() => {
                                if (item.reason === "Falta en ataque") {
                                  setPendingFaltaAtaqueDetails({
                                    attacker: selectedPlayer,
                                    defender: null
                                  });
                                  setSelectedTeamAction({
                                    team: selectedTeamAction.team,
                                    action: "falta_en_ataque"
                                  });
                                } else {
                                  handleAction("turnover", { end_reason: item.reason });
                                }
                              }}
                              style={{ padding: "12px", fontSize: "0.85rem" }}
                              aria-label={`Pérdida por ${item.label}`}
                            >
                              {item.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Subvista de Sanción */}
                {selectedTeamAction.action === "sancion" && (
                  <div className="action-step-hint" style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)", background: "rgba(255,255,255,0.01)", borderRadius: "6px", border: "1px dashed rgba(255,255,255,0.05)" }}>
                    Haz clic en cualquier jugador o miembro del cuerpo técnico de la izquierda para aplicar la sanción de tipo <strong>{selectedSanctionType}</strong>.
                  </div>
                )}

                {/* Subvista de Golpe Franco */}
                {selectedTeamAction.action === "free_throw" && (
                  <div className="action-step-hint" style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)", background: "rgba(255,255,255,0.01)", borderRadius: "6px", border: "1px dashed rgba(255,255,255,0.05)" }}>
                    Haz clic en cualquier jugador o en "Equipo (General)" de la izquierda para registrar el Golpe Franco cometido en defensa.
                  </div>
                )}

                {/* Subvista de Falta en Ataque */}
                {selectedTeamAction.action === "falta_en_ataque" && (
                  <div>
                    {!pendingFaltaAtaqueDetails.attacker ? (
                      <div className="action-step-hint" style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)", background: "rgba(255,255,255,0.01)", borderRadius: "6px", border: "1px dashed rgba(255,255,255,0.05)" }}>
                        1º Haz clic en el roster de la izquierda en el atacante que <strong>cometió / provocó la falta en ataque</strong>.
                      </div>
                    ) : (
                      <div className="action-step-hint" style={{ padding: "20px", textAlign: "center", color: "var(--text-primary)", background: "rgba(16,185,129,0.06)", borderRadius: "6px", border: "1px solid rgba(16,185,129,0.3)" }}>
                        <p style={{ margin: "0 0 10px 0", fontWeight: "bold" }}>
                          Atacante: #{pendingFaltaAtaqueDetails.attacker === "team" ? "Equipo" : `${pendingFaltaAtaqueDetails.attacker.number} - ${pendingFaltaAtaqueDetails.attacker.name}`}
                        </p>
                        <p style={{ margin: "0 0 15px 0", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                          2º Ahora haz clic en el roster de la izquierda en el defensa <strong>a quien se la provocaron</strong> para completar el registro.
                        </p>
                        <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => setPendingFaltaAtaqueDetails({ attacker: null, defender: null })}
                          >
                            <IconArrowLeft /> Cambiar Atacante
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleConfirmFaltaAtaque(pendingFaltaAtaqueDetails.attacker, null)}
                          >
                            Sin Defensor / Omitir
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Subvista de 7m Cometido en Defensa */}
                {selectedTeamAction.action === "penalty_7m" && (
                  <div>
                    {!pending7mDetails.defender ? (
                      <div className="action-step-hint" style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)", background: "rgba(255,255,255,0.01)", borderRadius: "6px", border: "1px dashed rgba(255,255,255,0.05)" }}>
                        1º Haz clic en el roster de la izquierda en el defensor que <strong>cometió / provocó el 7m</strong>.
                      </div>
                    ) : (
                      <div className="action-step-hint" style={{ padding: "20px", textAlign: "center", color: "var(--text-primary)", background: "rgba(16,185,129,0.06)", borderRadius: "6px", border: "1px solid rgba(16,185,129,0.3)" }}>
                        <p style={{ margin: "0 0 10px 0", fontWeight: "bold" }}>
                          Defensor: #{pending7mDetails.defender === "team" ? "Equipo" : `${pending7mDetails.defender.number} - ${pending7mDetails.defender.name}`}
                        </p>
                        <p style={{ margin: "0 0 15px 0", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                          2º Ahora haz clic en el roster de la izquierda en el atacante que <strong>sufrió / recibió el 7m</strong> para completar el registro.
                        </p>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => setPending7mDetails({ defender: null, attacker: null })}
                        >
                          <IconArrowLeft /> Cambiar Defensor
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </section>



              {/* Submenú de fin de periodo */}
              {activeActionSubmenu === "fin_periodo" && (
                <div className="period-selection-overlay" style={{ gridColumn: "span 2", background: "var(--bg-surface)", border: "1px solid var(--border-color)", borderRadius: "var(--radius)", padding: "20px", marginTop: "10px" }}>
                  <h4><IconFlag /> Fin de Periodo</h4>
                  <p className="submenu-hint" style={{ marginBottom: "15px" }}>Selecciona el periodo que ha finalizado:</p>

                  <div className="options-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
                    <button
                      className="option-btn btn-period"
                      onClick={handleEndFirstHalf}
                      style={{ padding: "15px", fontSize: "0.9rem" }}
                      aria-label="Finalizar primera parte"
                    >
                      Fin 1ª Parte (30:00)
                    </button>

                    <button
                      className="option-btn btn-period"
                      onClick={handleEndSecondHalf}
                      style={{ padding: "15px", fontSize: "0.9rem" }}
                      aria-label="Finalizar segunda parte"
                    >
                      Fin 2ª Parte (60:00)
                    </button>

                    <button
                      className="option-btn btn-period"
                      onClick={async () => {
                        await sendMatchEvent({
                          event_type: "sanction",
                          player_id: "Equipo",
                          is_opponent_action: false,
                          sanction_type: "Fin Prórroga"
                        }, time);

                        await closePossession(time, "Fin Prórroga");

                        setIsRunning(false);
                        setActiveActionSubmenu(null);
                        setSelectedTeamAction(null);
                      }}
                      style={{ padding: "15px", fontSize: "0.9rem" }}
                      aria-label="Finalizar prórroga"
                    >
                      Fin Prórroga
                    </button>
                  </div>

                  <button className="btn-back-menu" style={{ marginTop: "15px" }} onClick={() => setActiveActionSubmenu(null)} aria-label="Volver al panel principal">
                    <IconArrowLeft /> Atrás
                  </button>
                </div>
              )}

            </div>
          )}
        </div>
      )}

      {/* HISTORIAL RECIENTE */}
      <section className="timeline-container-card" aria-label="Historial de eventos recientes">
        <h3><IconHistory /> Historial de Eventos Recientes</h3>
        {recentEvents.length === 0 ? (
          <p className="no-events-text">Aún no se han registrado eventos en este partido.</p>
        ) : (
          <div className="timeline-list" role="log" aria-live="polite">
            {recentEvents.map((event, idx) => {
              const isGoal = event.event_type === "shot" && event.result === "Gol";
              const isStop = event.event_type === "shot" && event.result === "Parada";

              const teamName = event.is_opponent_action ? currentMatch.away_team : currentMatch.home_team;
              const teamClass = event.is_opponent_action ? "away-event" : "home-event";

              let eventIcon = null;
              let badgeColorClass = "";
              let eventTypeText = "";

              if (event.event_type === "shot") {
                eventTypeText = "Lanzamiento";
                if (isGoal) {
                  eventIcon = <IconGoalNet />;
                  badgeColorClass = "badge-goal";
                } else if (isStop) {
                  eventIcon = <IconGlove />;
                  badgeColorClass = "badge-stop";
                } else {
                  eventIcon = <IconTarget />;
                  badgeColorClass = "badge-miss";
                }
              } else if (event.event_type === "turnover") {
                eventTypeText = "Pérdida";
                eventIcon = <IconAlertTriangle />;
                badgeColorClass = "badge-turnover";
              } else if (event.event_type === "sanction") {
                eventTypeText = event.sanction_type === "7m Provocado" ? "7m Penalti" : "Sanción";
                eventIcon = <IconShield />;
                badgeColorClass = "badge-sanction";
              } else if (event.event_type === "free_throw") {
                eventTypeText = "Falta Def.";
                eventIcon = <IconHandball />;
                badgeColorClass = "badge-free-throw";
              }

              return (
                <div key={idx} className={`timeline-card ${teamClass} ${isGoal ? "is-goal" : ""} ${isStop ? "is-stop" : ""}`}>
                  {/* Fila Superior: Tiempo, Equipo, Datos Posesión */}
                  <div className="timeline-card-header">
                    <span className="timeline-card-time">{formatTime(event.match_time_seconds)}</span>
                    <span className={`timeline-card-team-badge ${teamClass}`}>
                      {teamName}
                    </span>
                    <span className="timeline-card-meta">
                      Ataque #{event.possession_number} • {event.play_phase} • {event.numerical_situation}
                    </span>
                  </div>

                  {/* Fila Inferior: Detalles de Acción */}
                  <div className="timeline-card-body">
                    <span className={`timeline-card-badge ${badgeColorClass}`}>
                      {eventIcon} <span>{eventTypeText}</span>
                    </span>

                    <div className="timeline-card-content">
                      <strong className="timeline-card-player">{event.player_id}</strong>
                      <span className="timeline-card-desc">
                        {event.event_type === "shot" ? (
                          <>
                            lanzó desde <strong>{event.shot_type}</strong> ({event.shot_position || "Centro"}) con resultado{" "}
                            <span className={`result-tag ${event.result.toLowerCase()}`}>
                              {event.result.toUpperCase()}
                            </span>
                            {event.target_zone && (
                              <> en zona: <strong>{getZoneLabel(event.target_zone)}</strong></>
                            )}
                            {event.goalkeeper_name && (
                              <> contra <strong>#{event.goalkeeper_number} {event.goalkeeper_name}</strong></>
                            )}
                            {event.assist_position && event.assist_position !== "Ninguna" && (
                              <> (Asistido por: <strong>{event.assist_position}</strong>)</>
                            )}
                          </>
                        ) : event.event_type === "turnover" ? (
                          <>
                            perdió el balón por <strong>{event.end_reason || "Causa no especificada"}</strong>
                            {event.defender_name && (
                              <> (Forzada por defensor: <strong>#{event.defender_number} {event.defender_name}</strong>)</>
                            )}
                          </>
                        ) : event.event_type === "free_throw" ? (
                          <>
                            cometió <strong>Golpe Franco en defensa</strong>
                          </>
                        ) : (
                          <>
                            sanción / acción: <strong>{event.sanction_type || "Amonestación"}</strong>
                            {event.drawn_by_player && (
                              <> (Recibido por: <strong>{event.drawn_by_player}</strong>)</>
                            )}
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
        </>
      )}
    </div>
  );
}
