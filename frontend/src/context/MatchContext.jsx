import React, { createContext, useContext, useState } from 'react';
import { matchService } from '../services/handstatsService';

const MatchContext = createContext();

export const MatchProvider = ({ children }) => {
  const [currentMatch, setCurrentMatch] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activePossession, setActivePossession] = useState({
    possession_number: 1,
    team: 'LOCAL', 
    start_time: 0,
    phase: 'Posicional',
    situation: 'Igualdad'
  });

  // Carga el partido en el estado de la mesa de anotación
  const loadMatch = async (matchId) => {
    setLoading(true);
    try {
      const match = await matchService.getById(matchId);
      setCurrentMatch(match);
      
      if (match.possessions && match.possessions.length > 0) {
        const nextNum = Math.max(...match.possessions.map(p => p.possession_number)) + 1;
        setActivePossession(prev => ({ ...prev, possession_number: nextNum }));
      }
    } catch (error) {
      console.error("Error cargando el partido en el contexto:", error);
    } finally {
      setLoading(false);
    }
  };

  // Envía un evento a FastAPI y actualiza la UI de forma optimista
  const sendMatchEvent = async (eventData, matchTimeSeconds) => {
    if (!currentMatch) return;

    const eventTime = matchTimeSeconds ?? eventData.match_time_seconds ?? 0;
    const isAway = eventData.team === "VISITANTE" || eventData.is_opponent_action === true || eventData.is_opponent_action === "true";

    // Calcular situación numérica automática basada en exclusiones de 2 minutos activas si no viene especificada
    let autoSituation = "Igualdad";
    if (currentMatch.events && currentMatch.events.length > 0) {
      let homeExcl = 0;
      let awayExcl = 0;
      currentMatch.events.forEach((ev) => {
        const isSanction = ev.event_type === "sanction";
        const sType = String(ev.sanction_type || "").toLowerCase();
        const is2Min = sType.includes("2 min") || sType.includes("exclusion") || sType.includes("2min") || sType.includes("dos minutos");
        if (isSanction && is2Min) {
          const start = Number(ev.match_time_seconds) || 0;
          const end = start + 120;
          if (eventTime >= start && eventTime < end) {
            const evIsAway = ev.team === "VISITANTE" || ev.is_opponent_action === true || ev.is_opponent_action === "true";
            if (evIsAway) awayExcl += 1;
            else homeExcl += 1;
          }
        }
      });

      if (isAway) {
        if (awayExcl > homeExcl) autoSituation = "Inferioridad";
        else if (awayExcl < homeExcl) autoSituation = "Superioridad";
        else autoSituation = "Igualdad";
      } else {
        if (homeExcl > awayExcl) autoSituation = "Inferioridad";
        else if (homeExcl < awayExcl) autoSituation = "Superioridad";
        else autoSituation = "Igualdad";
      }
    }

    const fullEvent = {
      possession_number: activePossession?.possession_number ?? 1,
      play_phase: activePossession?.phase ?? "Posicional",
      numerical_situation: autoSituation,
      ...eventData,
      match_time_seconds: eventTime,
    };

    if (eventData.numerical_situation) {
      fullEvent.numerical_situation = eventData.numerical_situation;
    } else if (!fullEvent.numerical_situation || fullEvent.numerical_situation === "Igualdad") {
      fullEvent.numerical_situation = autoSituation;
    }

    // Salvaguarda infalible: evitar duplicación de eventos de sustitución idénticos
    const isSubEvent = eventData.event_type === "substitution" || eventData.action_key === "cambio" || eventData.category === "cambios";
    if (isSubEvent) {
      const pInId = eventData.player_in_id || eventData.player_in_number || eventData.player_id;
      const pOutId = eventData.player_out_id || eventData.player_out_number;
      const team = eventData.team;

      const recentDuplicate = (currentMatch.events || []).slice(-15).some((e) => {
        const isPrevSub = e.event_type === "substitution" || e.action_key === "cambio" || e.category === "cambios";
        if (!isPrevSub) return false;
        const sameTeam = e.team === team;
        const samePlayerIn = (e.player_in_id || e.player_in_number || e.player_id) === pInId;
        const samePlayerOut = (e.player_out_id || e.player_out_number) === pOutId;
        const timeDiff = Math.abs((Number(e.match_time_seconds) || 0) - eventTime);
        return sameTeam && samePlayerIn && (samePlayerOut || (!pOutId && !e.player_out_id)) && timeDiff <= 2;
      });

      if (recentDuplicate) {
        console.warn("⚠️ Sustitución duplicada prevenida en sendMatchEvent:", { team, pInId, pOutId, eventTime });
        return;
      }
    }

    // 1. Actualización optimista inmediata en memoria de React para sincronización en tiempo real
    setCurrentMatch(prev => {
      if (!prev) return prev;
      const updatedEvents = [...(prev.events || []), fullEvent];
      let goalsHome = prev.goals_home || 0;
      let goalsAway = prev.goals_away || 0;

      if (fullEvent.event_type === 'shot' && fullEvent.result === 'Gol') {
        if (fullEvent.is_opponent_action) {
          goalsAway += 1;
        } else {
          goalsHome += 1;
        }
      }

      return {
        ...prev,
        events: updatedEvents,
        goals_home: goalsHome,
        goals_away: goalsAway
      };
    });

    try {
      await matchService.addEvent(currentMatch._id, fullEvent);
    } catch (error) {
      console.error("Error al registrar el evento en el servidor:", error);
    }
  };

  // Cierra el ataque o defensa actual y rota la posesión
  const closePossession = async (endTime, endReason, overrideNextTeam = null) => {
    if (!currentMatch) return;

    const duration = Math.max(0, endTime - activePossession.start_time);
    const finalPossession = {
      ...activePossession,
      end_time: endTime,
      duration: duration,
      duration_seconds: duration,
      end_reason: endReason
    };

    try {
      await matchService.addPossession(currentMatch._id, finalPossession);
      
      setCurrentMatch(prev => ({
        ...prev,
        possessions: [...prev.possessions, finalPossession]
      }));

      setActivePossession(prev => ({
        possession_number: prev.possession_number + 1,
        team: overrideNextTeam !== null ? overrideNextTeam : (prev.team === 'LOCAL' ? 'VISITANTE' : 'LOCAL'),
        start_time: endTime,
        phase: 'Posicional',
        situation: 'Igualdad'
      }));
    } catch (error) {
      console.error("Error al cerrar la posesión en el servidor:", error);
    }
  };

  // Deshacer el último evento
  const undoLastEvent = async () => {
    if (!currentMatch) return;
    try {
      const updated = await matchService.undoLastEvent(currentMatch._id);
      setCurrentMatch(updated);
    } catch (error) {
      console.error("Error al deshacer el último evento:", error);
      alert(error.response?.data?.detail || "No se pudo deshacer la acción");
    }
  };

  // Actualizar jugadores del partido (plantilla / minutos manuales)
  const updatePlayers = async (homePlayers, awayPlayers) => {
    if (!currentMatch) return;
    try {
      const updated = await matchService.updatePlayers(currentMatch._id, homePlayers, awayPlayers);
      setCurrentMatch(updated);
      return updated;
    } catch (error) {
      console.error("Error al actualizar jugadores:", error);
      throw error;
    }
  };

  return (
    <MatchContext.Provider value={{
      currentMatch,
      loading,
      activePossession,
      setActivePossession,
      loadMatch,
      sendMatchEvent,
      closePossession,
      undoLastEvent,
      updatePlayers,
      setCurrentMatch
    }}>
      {children}
    </MatchContext.Provider>
  );
};

export const useMatch = () => useContext(MatchContext);